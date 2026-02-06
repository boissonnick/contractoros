/**
 * Document Analysis API - Sprint 31
 *
 * Analyzes uploaded documents using AI to extract:
 * - Key dates, amounts, parties
 * - Action items and tags
 * - Document type classification
 *
 * Flow:
 * 1. Accept multipart form data (file + metadata)
 * 2. Upload file to Firebase Storage
 * 3. Call AI API (Gemini) with document content
 * 4. Return structured DocumentAnalysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeAdminApp } from '@/lib/assistant/firebase-admin-init';
import { DOCUMENT_ANALYSIS_PROMPT, getDocumentPrompt } from '@/lib/ai/prompts';
import type { DocumentAnalysis } from '@/types';
import { logger } from '@/lib/utils/logger';

// Configuration
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
];

/**
 * Verify Firebase auth token
 */
async function verifyAuth(request: NextRequest): Promise<{ uid: string; orgId: string; email: string | null } | null> {
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
      email: decodedToken.email || null,
    };
  } catch (error) {
    logger.error('[Document Analysis] Auth error', { error, route: 'assistant-analyze-document' });
    return null;
  }
}

/**
 * Extract text content from file for AI analysis
 * For PDFs and images, we'll send to Gemini's vision capabilities
 */
async function extractFileContent(
  file: File,
  mimeType: string
): Promise<{ text?: string; base64?: string; isImage: boolean }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // For images, return base64 for vision API
  if (mimeType.startsWith('image/')) {
    return {
      base64: buffer.toString('base64'),
      isImage: true,
    };
  }

  // For PDFs, also use vision API (Gemini can read PDFs)
  if (mimeType === 'application/pdf') {
    return {
      base64: buffer.toString('base64'),
      isImage: false, // but will use vision
    };
  }

  // For text files, extract text
  if (mimeType === 'text/plain') {
    return {
      text: buffer.toString('utf-8'),
      isImage: false,
    };
  }

  // For Word docs, we'd need additional processing
  // For now, return as base64 for potential vision processing
  return {
    base64: buffer.toString('base64'),
    isImage: false,
  };
}

/**
 * Call Gemini API for document analysis
 */
async function analyzeWithGemini(
  content: { text?: string; base64?: string; isImage: boolean },
  mimeType: string,
  documentTypeHint?: string
): Promise<{
  extractedData: DocumentAnalysis['extractedData'];
  confidence: number;
  modelUsed: string;
}> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('AI API key not configured');
  }

  const prompt = documentTypeHint
    ? getDocumentPrompt(documentTypeHint)
    : DOCUMENT_ANALYSIS_PROMPT;

  // Build request for Gemini API
  const requestBody: {
    contents: Array<{
      parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>;
    }>;
    generationConfig: {
      temperature: number;
      maxOutputTokens: number;
      responseMimeType: string;
    };
  } = {
    contents: [
      {
        parts: [],
      },
    ],
    generationConfig: {
      temperature: 0.1, // Low temperature for accurate extraction
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  // Add content based on type
  if (content.base64) {
    requestBody.contents[0].parts.push({
      inline_data: {
        mime_type: mimeType,
        data: content.base64,
      },
    });
  }

  // Add the prompt
  requestBody.contents[0].parts.push({
    text: content.text
      ? `${prompt}\n\n---\n\nDocument content:\n\n${content.text}`
      : prompt,
  });

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
    logger.error('[Document Analysis] Gemini API error', { error: errorText, route: 'assistant-analyze-document' });
    throw new Error(`AI API error: ${response.status}`);
  }

  const result = await response.json();

  // Extract the response text
  const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error('No response from AI');
  }

  // Parse the JSON response
  let extractedData: DocumentAnalysis['extractedData'];
  try {
    const parsed = JSON.parse(responseText);
    extractedData = {
      summary: parsed.summary || 'Unable to generate summary',
      keyDates: parsed.keyDates || [],
      amounts: (parsed.amounts || []).map((a: { amount: number; currency?: string; description: string }) => ({
        amount: a.amount,
        currency: a.currency || 'USD',
        description: a.description,
      })),
      parties: (parsed.parties || []).map((p: { name: string; role?: string }) => ({
        name: p.name,
        role: p.role,
      })),
      actionItems: parsed.actionItems || [],
      documentType: parsed.documentType || 'other',
      tags: parsed.tags || [],
    };
  } catch (parseError) {
    logger.error('[Document Analysis] Failed to parse AI response', { error: parseError, route: 'assistant-analyze-document' });
    // Return partial data if parsing fails
    extractedData = {
      summary: responseText.slice(0, 500),
      keyDates: [],
      amounts: [],
      parties: [],
      actionItems: [],
      documentType: 'other',
      tags: [],
    };
  }

  return {
    extractedData,
    confidence: 0.85, // Base confidence for Gemini
    modelUsed: 'gemini-1.5-flash',
  };
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
    const documentTypeHint = formData.get('documentType') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // Validate MIME type
    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}. Allowed: PDF, Word, text, images.` },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin
    await initializeAdminApp();
    const db = getFirestore();
    const storage = getStorage();

    // Generate document ID
    const docRef = db.collection(`organizations/${auth.orgId}/documentAnalyses`).doc();
    const analysisId = docRef.id;

    // Upload file to Cloud Storage
    const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const filePath = `organizations/${auth.orgId}/document-analyses/${analysisId}/${file.name}`;
    const fileRef = bucket.file(filePath);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fileRef.save(buffer, {
      contentType: mimeType,
      metadata: {
        orgId: auth.orgId,
        userId: auth.uid,
        analysisId,
        originalName: file.name,
      },
    });

    // Make file publicly accessible (or use signed URLs)
    await fileRef.makePublic();
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Extract content for AI analysis
    const content = await extractFileContent(file, mimeType);

    // Analyze with AI
    const { extractedData, confidence, modelUsed } = await analyzeWithGemini(
      content,
      mimeType,
      documentTypeHint || undefined
    );

    const processingTimeMs = Date.now() - startTime;

    // Create DocumentAnalysis record
    const analysisData: Omit<DocumentAnalysis, 'id' | 'createdAt' | 'updatedAt'> & {
      createdAt: Timestamp;
      updatedAt?: Timestamp;
    } = {
      orgId: auth.orgId,
      userId: auth.uid,
      fileName: file.name,
      fileUrl,
      fileType: mimeType,
      fileSize: file.size,
      extractedData,
      confidence,
      modelUsed,
      processingTimeMs,
      projectId: projectId || undefined,
      projectName: projectName || undefined,
      createdAt: Timestamp.now(),
    };

    await docRef.set(analysisData);

    // Return the analysis (convert Timestamps to Dates for response)
    const response: DocumentAnalysis = {
      id: analysisId,
      orgId: auth.orgId,
      userId: auth.uid,
      fileName: file.name,
      fileUrl,
      fileType: mimeType,
      fileSize: file.size,
      extractedData,
      confidence,
      modelUsed,
      processingTimeMs,
      projectId: projectId || undefined,
      projectName: projectName || undefined,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      analysis: response,
    });

  } catch (error) {
    logger.error('[Document Analysis] Error', { error, route: 'assistant-analyze-document' });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please check API key settings.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze document. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to upload documents for analysis.' },
    { status: 405 }
  );
}
