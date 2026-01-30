/**
 * Voice Log Upload API
 *
 * Handles audio file uploads and creates voice log documents.
 * Audio is stored in Cloud Storage, metadata in Firestore.
 * Triggers async processing via Pub/Sub.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { VoiceLog, VoiceLogCreate } from '@/types';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  // In production, use default credentials
  // In development, this will use GOOGLE_APPLICATION_CREDENTIALS env var
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch {
    // Fall back to default credentials (for Cloud Run)
    initializeApp();
  }
}

// Rate limiting constants
const MAX_LOGS_PER_USER_PER_DAY = 50;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'];

/**
 * Verify Firebase auth token from request
 */
async function verifyAuth(request: NextRequest): Promise<{ uid: string; orgId: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.slice(7);
    const decodedToken = await getAuth().verifyIdToken(token);

    // Get user profile to find orgId
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
  } catch {
    return null;
  }
}

/**
 * Check rate limits for user
 */
async function checkRateLimit(orgId: string, userId: string): Promise<boolean> {
  const db = getFirestore();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logsRef = db.collection(`organizations/${orgId}/voiceLogs`);
  const todayLogs = await logsRef
    .where('userId', '==', userId)
    .where('createdAt', '>=', Timestamp.fromDate(today))
    .count()
    .get();

  return todayLogs.data().count < MAX_LOGS_PER_USER_PER_DAY;
}

/**
 * Check for duplicate by content hash
 */
async function checkDuplicate(orgId: string, contentHash: string): Promise<boolean> {
  const db = getFirestore();
  const logsRef = db.collection(`organizations/${orgId}/voiceLogs`);
  const existing = await logsRef
    .where('contentHash', '==', contentHash)
    .limit(1)
    .get();

  return !existing.empty;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const metadataStr = formData.get('metadata') as string | null;

    if (!audioFile || !metadataStr) {
      return NextResponse.json(
        { error: 'Missing audio file or metadata' },
        { status: 400 }
      );
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Validate MIME type
    const mimeType = audioFile.type || 'audio/webm';
    if (!ALLOWED_MIME_TYPES.some(t => mimeType.startsWith(t.split('/')[0]))) {
      return NextResponse.json(
        { error: 'Invalid file type. Audio files only.' },
        { status: 400 }
      );
    }

    // Parse metadata
    let metadata: VoiceLogCreate;
    try {
      const parsed = JSON.parse(metadataStr);
      metadata = {
        ...parsed,
        recordedAt: new Date(parsed.recordedAt),
      };
    } catch {
      return NextResponse.json(
        { error: 'Invalid metadata format' },
        { status: 400 }
      );
    }

    // Verify user matches auth
    if (metadata.userId !== auth.uid || metadata.orgId !== auth.orgId) {
      return NextResponse.json(
        { error: 'User mismatch' },
        { status: 403 }
      );
    }

    // Check rate limit
    const withinLimit = await checkRateLimit(auth.orgId, auth.uid);
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Daily limit exceeded. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    // Check for duplicate
    const isDuplicate = await checkDuplicate(auth.orgId, metadata.contentHash);
    if (isDuplicate) {
      return NextResponse.json(
        { error: 'Duplicate recording already exists', duplicate: true },
        { status: 409 }
      );
    }

    // Generate document ID
    const db = getFirestore();
    const docRef = db.collection(`organizations/${auth.orgId}/voiceLogs`).doc();
    const voiceLogId = docRef.id;

    // Upload audio to Cloud Storage
    const storage = getStorage();
    const bucket = storage.bucket();
    const filePath = `organizations/${auth.orgId}/voice-logs/${voiceLogId}/audio.webm`;
    const file = bucket.file(filePath);

    const arrayBuffer = await audioFile.arrayBuffer();
    await file.save(Buffer.from(arrayBuffer), {
      contentType: mimeType,
      metadata: {
        orgId: auth.orgId,
        userId: auth.uid,
        voiceLogId,
      },
    });

    // Create Firestore document
    const now = Timestamp.now();
    const voiceLogData: Omit<VoiceLog, 'id' | 'recordedAt' | 'createdAt' | 'updatedAt' | 'uploadedAt'> & {
      recordedAt: Timestamp;
      createdAt: Timestamp;
      updatedAt: Timestamp;
      uploadedAt: Timestamp;
    } = {
      orgId: auth.orgId,
      userId: auth.uid,
      userName: metadata.userName,
      recordedAt: Timestamp.fromDate(metadata.recordedAt),
      durationSeconds: metadata.durationSeconds,
      fileSizeBytes: audioFile.size,
      mimeType,
      status: 'uploaded',
      statusMessage: 'Waiting for processing',
      uploadedAt: now,
      userSummary: metadata.userSummary,
      location: metadata.location,
      projectContext: metadata.projectContext,
      contentHash: metadata.contentHash,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(voiceLogData);

    // TODO: Publish to Pub/Sub for async processing
    // This will be implemented when we add the Cloud Function
    // await publishToProcessingQueue(auth.orgId, voiceLogId);

    return NextResponse.json({
      id: voiceLogId,
      status: 'uploaded',
      message: 'Voice log uploaded successfully',
    });
  } catch (error) {
    console.error('Voice log upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
