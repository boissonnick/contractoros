/**
 * Equipment Maintenance API - Sprint 35
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

// GET /api/equipment/[equipmentId]/maintenance - List maintenance records
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

    // Verify equipment exists
    const equipmentDoc = await db
      .collection('organizations').doc(auth.orgId)
      .collection('equipment').doc(equipmentId)
      .get();

    if (!equipmentDoc.exists) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const snapshot = await db
      .collection('organizations').doc(auth.orgId)
      .collection('maintenanceRecords')
      .where('equipmentId', '==', equipmentId)
      .orderBy('performedAt', 'desc')
      .get();

    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance records' }, { status: 500 });
  }
}

// POST /api/equipment/[equipmentId]/maintenance - Add maintenance record
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

    const body = await request.json();
    const { type, description, cost, performedBy, performedAt, nextScheduledDate } = body;

    if (!type || !description || !performedBy) {
      return NextResponse.json({ error: 'Type, description, and performedBy are required' }, { status: 400 });
    }

    const recordData = {
      equipmentId,
      type,
      description,
      cost: cost || null,
      performedBy,
      performedAt: performedAt ? new Date(performedAt) : new Date(),
      nextScheduledDate: nextScheduledDate ? new Date(nextScheduledDate) : null,
    };

    const docRef = await db
      .collection('organizations').doc(auth.orgId)
      .collection('maintenanceRecords')
      .add(recordData);

    // Update equipment maintenance dates
    const updates: Record<string, unknown> = {
      lastMaintenanceDate: recordData.performedAt,
      updatedAt: new Date(),
    };
    if (nextScheduledDate) {
      updates.nextMaintenanceDate = new Date(nextScheduledDate);
    }
    await equipmentRef.update(updates);

    return NextResponse.json({
      id: docRef.id,
      ...recordData
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    return NextResponse.json({ error: 'Failed to create maintenance record' }, { status: 500 });
  }
}
