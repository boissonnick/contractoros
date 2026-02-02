import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuth } from '@/lib/api/auth';
import { EquipmentCheckout } from '@/types';

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
    const checkoutData: Omit<EquipmentCheckout, 'id'> = {
      equipmentId,
      equipmentName: equipment.name,
      userId,
      userName,
      projectId: projectId || undefined,
      projectName: projectName || undefined,
      checkedOutAt: now,
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : undefined,
      notes: notes || undefined,
    };

    const checkoutRef = await adminDb.collection('equipmentCheckouts').add(checkoutData);

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

    if (equipment?.status !== 'checked_out') {
      return NextResponse.json({ error: 'Equipment is not checked out' }, { status: 400 });
    }

    const now = new Date();

    // Find and update the checkout record
    const checkoutSnapshot = await adminDb
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
