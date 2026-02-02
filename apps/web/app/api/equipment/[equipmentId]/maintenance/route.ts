import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuth } from '@/lib/api/auth';
import { MaintenanceRecord } from '@/types';

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

    const { equipmentId } = await params;

    // Verify equipment exists and belongs to org
    const equipmentDoc = await adminDb.collection('equipment').doc(equipmentId).get();
    if (!equipmentDoc.exists) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const equipment = equipmentDoc.data();
    if (equipment?.orgId !== auth.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb
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

    const { equipmentId } = await params;
    const equipmentRef = adminDb.collection('equipment').doc(equipmentId);
    const equipmentDoc = await equipmentRef.get();

    if (!equipmentDoc.exists) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const equipment = equipmentDoc.data();
    if (equipment?.orgId !== auth.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, description, cost, performedBy, performedAt, nextScheduledDate } = body;

    if (!type || !description || !performedBy) {
      return NextResponse.json({ error: 'Type, description, and performedBy are required' }, { status: 400 });
    }

    const recordData: Omit<MaintenanceRecord, 'id'> = {
      equipmentId,
      type,
      description,
      cost: cost || undefined,
      performedBy,
      performedAt: performedAt ? new Date(performedAt) : new Date(),
      nextScheduledDate: nextScheduledDate ? new Date(nextScheduledDate) : undefined,
    };

    const docRef = await adminDb.collection('maintenanceRecords').add(recordData);

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
