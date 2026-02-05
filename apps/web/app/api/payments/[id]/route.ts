import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

/**
 * GET /api/payments/[id]
 * Get a specific payment by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection('stripePayments').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    return NextResponse.json({
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
      processedAt: data?.processedAt?.toDate?.()?.toISOString() || null,
      completedAt: data?.completedAt?.toDate?.()?.toISOString() || null,
    });
  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/payments/[id]
 * Update a payment (e.g., add notes, update metadata)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { notes, metadata } = body;

    const docRef = adminDb.collection('stripePayments').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (notes !== undefined) {
      updates.notes = notes;
    }

    if (metadata) {
      updates.metadata = {
        ...doc.data()?.metadata,
        ...metadata,
      };
    }

    await docRef.update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update payment error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
