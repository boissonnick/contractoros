/**
 * RFI Notification API - Sprint 34
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; rfiId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId, rfiId } = await params;
    const body = await request.json();
    const { notificationType = 'both' } = body; // 'email', 'in_app', 'both'

    const db = getFirestore();

    // Get RFI details
    const rfiDoc = await db
      .collection('organizations').doc(auth.orgId)
      .collection('rfis').doc(rfiId)
      .get();

    if (!rfiDoc.exists) return NextResponse.json({ error: 'RFI not found' }, { status: 404 });

    const rfi = rfiDoc.data();
    if (!rfi?.assignedTo) {
      return NextResponse.json({ error: 'RFI has no assignee' }, { status: 400 });
    }

    // Create in-app notification
    if (notificationType === 'in_app' || notificationType === 'both') {
      await db.collection('organizations').doc(auth.orgId)
        .collection('notifications')
        .add({
          userId: rfi.assignedTo,
          type: 'rfi_assigned',
          title: `RFI ${rfi.number} requires your response`,
          message: rfi.title,
          entityType: 'rfi',
          entityId: rfiId,
          projectId,
          read: false,
          createdAt: new Date(),
        });
    }

    // TODO: Send email notification if notificationType === 'email' || 'both'
    // This would integrate with the existing email service

    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      notificationType,
    });
  } catch (error) {
    console.error('Error sending RFI notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
