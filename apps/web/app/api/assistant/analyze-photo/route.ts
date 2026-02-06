/**
 * Photo Analysis API - Sprint 31
 *
 * Analyzes construction site photos using vision AI to extract:
 * - Photo description
 * - Detected objects
 * - Suggested tags
 * - Safety observations
 * - Progress indicators
 * - Quality assessment
 *
 * Flow:
 * 1. Accept image upload
 * 2. Upload to Firebase Storage
 * 3. Call vision AI (Gemini 1.5 Flash with vision)
 * 4. Return structured PhotoAnalysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeAdminApp } from '@/lib/assistant/firebase-admin-init';
import { PHOTO_ANALYSIS_PROMPT, SAFETY_PHOTO_PROMPT } from '@/lib/ai/prompts';
import type { PhotoAnalysis } from '@/types';
import { logger } from '@/lib/utils/logger';

// Configuration
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

/**
 * Verify Firebase auth token
 */
async function verifyAuth(request: NextRequest): Promise<{ uid: string; orgId: string } | null> {
  await initializeAdminApp();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const decodedToken = await getAuth().verifyIdToken(token);

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData?.orgId) {
      return null;
    }

    return {
      uid: decodedToken.uid,
      orgId: userData.orgId,
    };
  } catch (error) {
    logger.error('[Photo Analysis] Auth error', { error, route: 'assistant-analyze-photo' });
    return null;
  }
}

/**
 * Get image dimensions from buffer (basic JPEG/PNG support)
 */
function getImageDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    // PNG signature check
    if (mimeType === 'image/png') {
      if (buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }
    }

    // JPEG - more complex, search for SOF marker
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        // SOF0, SOF1, SOF2 markers
        if (marker >= 0xc0 && marker <= 0xc3) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        // Skip to next marker
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }
  } catch {
    // Ignore errors in dimension parsing
  }
  return null;
}

/**
 * Call Gemini Vision API for photo analysis
 */
async function analyzeWithGeminiVision(
  base64Image: string,
  mimeType: string,
  analysisMode: 'standard' | 'safety' = 'standard'
): Promise<{
  analysis: PhotoAnalysis['analysis'];
  confidence: number;
  modelUsed: string;
}> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('AI API key not configured');
  }

  const prompt = analysisMode === 'safety' ? SAFETY_PHOTO_PROMPT : PHOTO_ANALYSIS_PROMPT;

  // Build request for Gemini Vision API
  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  // Call Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('[Photo Analysis] Gemini API error', { error: errorText, route: 'assistant-analyze-photo' });
    throw new Error(`AI API error: ${response.status}`);
  }

  const result = await response.json();

  // Extract the response text
  const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error('No response from AI');
  }

  // Parse the JSON response
  let analysis: PhotoAnalysis['analysis'];
  try {
    const parsed = JSON.parse(responseText);
    analysis = {
      description: parsed.description || 'Construction site photo',
      detectedObjects: (parsed.detectedObjects || []).map((obj: { label: string; confidence: number; boundingBox?: { x: number; y: number; width: number; height: number } }) => ({
        label: obj.label,
        confidence: obj.confidence || 0.5,
        boundingBox: obj.boundingBox,
      })),
      suggestedTags: parsed.suggestedTags || [],
      safetyObservations: parsed.safetyObservations || [],
      progressIndicators: parsed.progressIndicators || [],
      weatherConditions: parsed.weatherConditions,
      qualityAssessment: parsed.qualityAssessment
        ? {
            rating: parsed.qualityAssessment.rating || 'acceptable',
            notes: parsed.qualityAssessment.notes || '',
          }
        : undefined,
    };
  } catch (parseError) {
    logger.error('[Photo Analysis] Failed to parse AI response', { error: parseError, route: 'assistant-analyze-photo' });
    // Return basic analysis if parsing fails
    analysis = {
      description: responseText.slice(0, 500),
      detectedObjects: [],
      suggestedTags: ['construction', 'site-photo'],
    };
  }

  return {
    analysis,
    confidence: 0.85,
    modelUsed: 'gemini-1.5-flash',
  };
}

/**
 * Generate a thumbnail URL (in production, use Cloud Functions or CDN)
 */
function getThumbnailUrl(fileUrl: string): string {
  // For now, just return the original URL
  // In production, integrate with Firebase Extensions or Cloud Functions for resizing
  return fileUrl;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid auth token.' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;
    const projectName = formData.get('projectName') as string | null;
    const photoId = formData.get('photoId') as string | null;
    const analysisMode = (formData.get('mode') as 'standard' | 'safety') || 'standard';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB.' },
        { status: 400 }
      );
    }

    // Validate MIME type
    const mimeType = file.type || 'image/jpeg';
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}. Allowed: JPEG, PNG, WebP, HEIC.` },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin
    await initializeAdminApp();
    const db = getFirestore();
    const storage = getStorage();

    // Generate document ID
    const docRef = db.collection(`organizations/${auth.orgId}/photoAnalyses`).doc();
    const analysisId = docRef.id;

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Get image dimensions
    const dimensions = getImageDimensions(buffer, mimeType);

    // Upload file to Cloud Storage
    const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const filePath = `organizations/${auth.orgId}/photo-analyses/${analysisId}/${file.name}`;
    const fileRef = bucket.file(filePath);

    await fileRef.save(buffer, {
      contentType: mimeType,
      metadata: {
        orgId: auth.orgId,
        userId: auth.uid,
        analysisId,
        originalName: file.name,
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    const thumbnailUrl = getThumbnailUrl(fileUrl);

    // Analyze with AI
    const { analysis, confidence, modelUsed } = await analyzeWithGeminiVision(
      base64Image,
      mimeType,
      analysisMode
    );

    const processingTimeMs = Date.now() - startTime;

    // Create PhotoAnalysis record
    const analysisData: Omit<PhotoAnalysis, 'id' | 'createdAt'> & {
      createdAt: Timestamp;
    } = {
      orgId: auth.orgId,
      userId: auth.uid,
      fileName: file.name,
      fileUrl,
      thumbnailUrl,
      mimeType,
      fileSize: file.size,
      dimensions: dimensions || undefined,
      analysis,
      confidence,
      modelUsed,
      processingTimeMs,
      projectId: projectId || undefined,
      projectName: projectName || undefined,
      photoId: photoId || undefined,
      createdAt: Timestamp.now(),
    };

    await docRef.set(analysisData);

    // Return the analysis
    const response: PhotoAnalysis = {
      id: analysisId,
      ...analysisData,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      analysis: response,
    });

  } catch (error) {
    logger.error('[Photo Analysis] Error', { error, route: 'assistant-analyze-photo' });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please check API key settings.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze photo. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to upload photos for analysis.' },
    { status: 405 }
  );
}
