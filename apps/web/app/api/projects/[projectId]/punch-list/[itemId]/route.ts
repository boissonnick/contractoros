/**
 * Punch Item Status Update API - Sprint 33
 * Update and delete individual punch items
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/assistant/firebase-admin-init';
import { logger } from '@/lib/utils/logger';

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
  } catch {
    return null;
  }
}

// PATCH - Update punch item status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; itemId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { itemId } = await params;
    const body = await request.json();

    await initializeAdminApp();
    const db = getFirestore();

    const updates: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    };

    // Track completion/verification timestamps
    if (body.status === 'complete') {
      updates.completedAt = new Date();
    }
    if (body.status === 'verified') {
      updates.verifiedAt = new Date();
      updates.verifiedBy = auth.uid;
    }

    await db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('punchItems')
      .doc(itemId)
      .update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating punch item', { error, route: 'punch-list-item' });
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE - Remove punch item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; itemId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { itemId } = await params;

    await initializeAdminApp();
    const db = getFirestore();

    await db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('punchItems')
      .doc(itemId)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting punch item', { error, route: 'punch-list-item' });
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
