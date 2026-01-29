import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/payments/stripeClient';
import { dollarsToCents } from '@/lib/payments/paymentUtils';
import { adminDb, Timestamp } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

/**
 * POST /api/payments
 * Create a Stripe PaymentIntent for processing a payment
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      orgId,
      invoiceId,
      projectId,
      clientId,
      amount,
      description,
      paymentMethod = 'card',
      customerId,
      metadata = {},
    } = body;

    // Validate required fields
    if (!orgId || !invoiceId || !projectId || !clientId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Amount should already be in cents from the client
    const amountInCents = typeof amount === 'number' && amount < 1000
      ? dollarsToCents(amount) // If small number, assume dollars
      : amount; // Already in cents

    // Create the payment intent
    const paymentIntentParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
      amount: amountInCents,
      currency: 'usd',
      description,
      metadata: {
        orgId,
        invoiceId,
        projectId,
        clientId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // If we have a customer ID, attach it
    if (customerId) {
      paymentIntentParams.customer = customerId;
    }

    // Restrict payment methods based on preference
    if (paymentMethod === 'ach') {
      paymentIntentParams.payment_method_types = ['us_bank_account'];
      delete paymentIntentParams.automatic_payment_methods;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Store the payment record in Firestore
    const paymentData = {
      orgId,
      invoiceId,
      projectId,
      clientId,
      amount: amountInCents,
      currency: 'USD',
      paymentMethod,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: customerId || null,
      status: 'pending',
      description,
      createdAt: Timestamp.now(),
      metadata,
    };

    const docRef = await adminDb.collection('stripePayments').add(paymentData);

    return NextResponse.json({
      paymentId: docRef.id,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments
 * Get payments for an organization (with optional filters)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const invoiceId = searchParams.get('invoiceId');
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    let query = adminDb
      .collection('stripePayments')
      .where('orgId', '==', orgId);

    if (invoiceId) {
      query = query.where('invoiceId', '==', invoiceId);
    }

    if (projectId) {
      query = query.where('projectId', '==', projectId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const payments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      processedAt: doc.data().processedAt?.toDate?.()?.toISOString() || null,
      completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
