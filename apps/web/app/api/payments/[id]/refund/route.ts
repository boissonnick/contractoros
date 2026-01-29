import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/payments/stripeClient';
import { adminDb, Timestamp } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

/**
 * POST /api/payments/[id]/refund
 * Process a refund for a payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, reason } = body;

    // Get the payment from Firestore
    const docRef = adminDb.collection('stripePayments').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const payment = doc.data();

    // Check if payment can be refunded
    if (payment?.status !== 'completed') {
      return NextResponse.json(
        { error: 'Only completed payments can be refunded' },
        { status: 400 }
      );
    }

    if (payment?.status === 'refunded') {
      return NextResponse.json(
        { error: 'Payment has already been fully refunded' },
        { status: 400 }
      );
    }

    // Calculate refund amount
    const refundAmount = amount || payment?.amount;
    const isPartialRefund = amount && amount < payment?.amount;

    // Process the refund with Stripe
    const refundParams: {
      payment_intent: string;
      amount?: number;
      reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    } = {
      payment_intent: payment?.stripePaymentIntentId,
      amount: refundAmount,
    };

    if (reason && ['duplicate', 'fraudulent', 'requested_by_customer'].includes(reason)) {
      refundParams.reason = reason as 'duplicate' | 'fraudulent' | 'requested_by_customer';
    }

    const refund = await stripe.refunds.create(refundParams);

    // Update the payment record
    const updates: Record<string, unknown> = {
      refundId: refund.id,
      refundAmount: refundAmount,
      refundReason: reason || null,
      refundedAt: Timestamp.now(),
      status: isPartialRefund ? 'partially_refunded' : 'refunded',
      updatedAt: Timestamp.now(),
    };

    await docRef.update(updates);

    return NextResponse.json({
      refundId: refund.id,
      amount: refundAmount,
      status: refund.status,
    });
  } catch (error) {
    console.error('Process refund error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
