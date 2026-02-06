/**
 * Equipment CRUD API - Sprint 35
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
  } catch { return null; }
}

// GET /api/equipment/[equipmentId] - Get single equipment
export async function GET(
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
    const doc = await db
      .collection('organizations').doc(auth.orgId)
      .collection('equipment').doc(equipmentId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    logger.error('Error fetching equipment', { error, route: 'equipment-detail' });
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

// PATCH /api/equipment/[equipmentId] - Update equipment
export async function PATCH(
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
    const docRef = db
      .collection('organizations').doc(auth.orgId)
      .collection('equipment').doc(equipmentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = [
      'name', 'category', 'status', 'serialNumber', 'description', 'photoUrl',
      'purchaseDate', 'purchasePrice', 'currentValue', 'currentLocation',
      'currentProjectId', 'maintenanceSchedule', 'lastMaintenanceDate', 'nextMaintenanceDate'
    ];

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    await docRef.update(updates);

    return NextResponse.json({ id: equipmentId, ...doc.data(), ...updates });
  } catch (error) {
    logger.error('Error updating equipment', { error, route: 'equipment-detail' });
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 });
  }
}

// DELETE /api/equipment/[equipmentId] - Delete equipment
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
    const docRef = db
      .collection('organizations').doc(auth.orgId)
      .collection('equipment').doc(equipmentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const equipment = doc.data();
    if (equipment?.status === 'checked_out') {
      return NextResponse.json({ error: 'Cannot delete checked out equipment' }, { status: 400 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting equipment', { error, route: 'equipment-detail' });
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
  }
}
