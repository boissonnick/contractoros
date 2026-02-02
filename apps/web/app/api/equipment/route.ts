import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuth } from '@/lib/api/auth';
import { Equipment } from '@/types';

// GET /api/equipment - List all equipment for org
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let query = adminDb
      .collection('equipment')
      .where('orgId', '==', auth.orgId);

    if (status) {
      query = query.where('status', '==', status);
    }
    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.orderBy('name').get();
    const equipment = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ equipment });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

// POST /api/equipment - Create new equipment
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, serialNumber, description, purchaseDate, purchasePrice, currentLocation, maintenanceSchedule } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    const now = new Date();
    const equipmentData: Omit<Equipment, 'id'> = {
      orgId: auth.orgId,
      name,
      category,
      status: 'available',
      serialNumber: serialNumber || undefined,
      description: description || undefined,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      purchasePrice: purchasePrice || undefined,
      currentLocation: currentLocation || undefined,
      maintenanceSchedule: maintenanceSchedule || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('equipment').add(equipmentData);

    return NextResponse.json({
      id: docRef.id,
      ...equipmentData
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Failed to create equipment' }, { status: 500 });
  }
}
