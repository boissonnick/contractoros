import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuth } from '@/lib/api/auth';

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

    const { equipmentId } = await params;
    const doc = await adminDb.collection('equipment').doc(equipmentId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const equipment = doc.data();
    if (equipment?.orgId !== auth.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ id: doc.id, ...equipment });
  } catch (error) {
    console.error('Error fetching equipment:', error);
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

    const { equipmentId } = await params;
    const doc = await adminDb.collection('equipment').doc(equipmentId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const equipment = doc.data();
    if (equipment?.orgId !== auth.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    await adminDb.collection('equipment').doc(equipmentId).update(updates);

    return NextResponse.json({ id: equipmentId, ...equipment, ...updates });
  } catch (error) {
    console.error('Error updating equipment:', error);
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

    const { equipmentId } = await params;
    const doc = await adminDb.collection('equipment').doc(equipmentId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const equipment = doc.data();
    if (equipment?.orgId !== auth.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (equipment?.status === 'checked_out') {
      return NextResponse.json({ error: 'Cannot delete checked out equipment' }, { status: 400 });
    }

    await adminDb.collection('equipment').doc(equipmentId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
  }
}
