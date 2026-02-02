/**
 * Submittal Detail API - Sprint 34
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/assistant/firebase-admin-init';

async function verifyAuth(request: NextRequest) {
  await initializeAdminApp();
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (!userData?.orgId) return null;
    return { uid: decodedToken.uid, orgId: userData.orgId, name: userData.displayName || 'Unknown' };
  } catch { return null; }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; submittalId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { submittalId } = await params;
    const db = getFirestore();

    const doc = await db
      .collection('organizations').doc(auth.orgId)
      .collection('submittals').doc(submittalId)
      .get();

    if (!doc.exists) return NextResponse.json({ error: 'Submittal not found' }, { status: 404 });

    return NextResponse.json({ submittal: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Error fetching submittal:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; submittalId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { submittalId } = await params;
    const body = await request.json();
    const db = getFirestore();

    const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };

    // Track review timestamps
    if (body.status && ['approved', 'approved_as_noted', 'revise_resubmit', 'rejected'].includes(body.status)) {
      updates.reviewedAt = new Date();
      updates.reviewerId = auth.uid;
      updates.reviewerName = auth.name;
    }

    if (body.status === 'under_review' && !body.submittedAt) {
      updates.submittedAt = new Date();
      updates.submittedBy = auth.uid;
      updates.submittedByName = auth.name;
    }

    await db
      .collection('organizations').doc(auth.orgId)
      .collection('submittals').doc(submittalId)
      .update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating submittal:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; submittalId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { submittalId } = await params;
    const db = getFirestore();

    const doc = await db
      .collection('organizations').doc(auth.orgId)
      .collection('submittals').doc(submittalId)
      .get();

    if (!doc.exists) return NextResponse.json({ error: 'Submittal not found' }, { status: 404 });
    if (doc.data()?.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending submittals can be deleted' }, { status: 400 });
    }

    await db
      .collection('organizations').doc(auth.orgId)
      .collection('submittals').doc(submittalId)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting submittal:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
