/**
 * Equipment Checkout API - Sprint 35
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

// POST /api/equipment/[equipmentId]/checkout - Check out equipment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ equipmentId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getFirestore();
    const { equipmentId } = await params;
    const equipmentRef = db
      .collection('organizations').doc(auth.orgId)
      .collection('equipment').doc(equipmentId);
    const equipmentDoc = await equipmentRef.get();

    if (!equipmentDoc.exists) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const equipment = equipmentDoc.data();
    if (equipment?.status !== 'available') {
      return NextResponse.json({ error: 'Equipment is not available for checkout' }, { status: 400 });
    }

    const body = await request.json();
    const { userId, userName, projectId, projectName, expectedReturnDate, notes } = body;

    if (!userId || !userName) {
      return NextResponse.json({ error: 'User ID and name are required' }, { status: 400 });
    }

    const now = new Date();

    // Create checkout record
    const checkoutData = {
      equipmentId,
      equipmentName: equipment.name,
      userId,
      userName,
      projectId: projectId || null,
      projectName: projectName || null,
      checkedOutAt: now,
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      returnedAt: null,
      notes: notes || null,
    };

    const checkoutRef = await db
      .collection('organizations').doc(auth.orgId)
      .collection('equipmentCheckouts')
      .add(checkoutData);

    // Update equipment status
    await equipmentRef.update({
      status: 'checked_out',
      checkedOutTo: userId,
      checkedOutToName: userName,
      checkedOutAt: now,
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
      currentProjectId: projectId || null,
      updatedAt: now,
    });

    return NextResponse.json({
      id: checkoutRef.id,
      ...checkoutData
    }, { status: 201 });
  } catch (error) {
    console.error('Error checking out equipment:', error);
    return NextResponse.json({ error: 'Failed to check out equipment' }, { status: 500 });
  }
}

// DELETE /api/equipment/[equipmentId]/checkout - Return equipment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ equipmentId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getFirestore();
    const { equipmentId } = await params;
    const equipmentRef = db
      .collection('organizations').doc(auth.orgId)
      .collection('equipment').doc(equipmentId);
    const equipmentDoc = await equipmentRef.get();

    if (!equipmentDoc.exists) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const equipment = equipmentDoc.data();
    if (equipment?.status !== 'checked_out') {
      return NextResponse.json({ error: 'Equipment is not checked out' }, { status: 400 });
    }

    const now = new Date();

    // Find and update the checkout record
    const checkoutSnapshot = await db
      .collection('organizations').doc(auth.orgId)
      .collection('equipmentCheckouts')
      .where('equipmentId', '==', equipmentId)
      .where('returnedAt', '==', null)
      .limit(1)
      .get();

    if (!checkoutSnapshot.empty) {
      await checkoutSnapshot.docs[0].ref.update({ returnedAt: now });
    }

    // Update equipment status
    await equipmentRef.update({
      status: 'available',
      checkedOutTo: null,
      checkedOutToName: null,
      checkedOutAt: null,
      expectedReturnDate: null,
      currentProjectId: null,
      updatedAt: now,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error returning equipment:', error);
    return NextResponse.json({ error: 'Failed to return equipment' }, { status: 500 });
  }
}
