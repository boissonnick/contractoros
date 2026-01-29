import { NextRequest, NextResponse } from 'next/server';
import { stripe, stripeWebhookSecret, isStripeConfigured } from '@/lib/payments/stripeClient';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import Stripe from 'stripe';

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
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

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !stripeWebhookSecret) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { id: stripePaymentIntentId, metadata, latest_charge } = paymentIntent;

  // Find the payment record by Stripe payment intent ID
  const snapshot = await adminDb
    .collection('stripePayments')
    .where('stripePaymentIntentId', '==', stripePaymentIntentId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error(`Payment not found for intent: ${stripePaymentIntentId}`);
    return;
  }

  const docRef = snapshot.docs[0].ref;

  // Get charge details if available
  let chargeId: string | null = null;
  let receiptUrl: string | null = null;

  if (latest_charge && stripe) {
    const chargeIdStr = typeof latest_charge === 'string' ? latest_charge : latest_charge.id;
    try {
      const charge = await stripe.charges.retrieve(chargeIdStr);
      chargeId = charge.id;
      receiptUrl = charge.receipt_url;
    } catch {
      // Charge retrieval failed, continue without it
    }
  }

  // Update the payment status
  await docRef.update({
    status: 'completed',
    stripeChargeId: chargeId || null,
    receiptUrl: receiptUrl || null,
    processedAt: Timestamp.now(),
    completedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Update the invoice if this payment was for an invoice
  if (metadata?.invoiceId) {
    await updateInvoicePaymentStatus(metadata.invoiceId, paymentIntent.amount);
  }

  console.log(`Payment completed: ${snapshot.docs[0].id}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { id: stripePaymentIntentId, last_payment_error } = paymentIntent;

  const snapshot = await adminDb
    .collection('stripePayments')
    .where('stripePaymentIntentId', '==', stripePaymentIntentId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error(`Payment not found for intent: ${stripePaymentIntentId}`);
    return;
  }

  const docRef = snapshot.docs[0].ref;

  await docRef.update({
    status: 'failed',
    failureReason: last_payment_error?.message || 'Payment failed',
    failureCode: last_payment_error?.code || null,
    processedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log(`Payment failed: ${snapshot.docs[0].id}`);
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const { id: stripePaymentIntentId } = paymentIntent;

  const snapshot = await adminDb
    .collection('stripePayments')
    .where('stripePaymentIntentId', '==', stripePaymentIntentId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error(`Payment not found for intent: ${stripePaymentIntentId}`);
    return;
  }

  const docRef = snapshot.docs[0].ref;

  await docRef.update({
    status: 'cancelled',
    updatedAt: Timestamp.now(),
  });

  console.log(`Payment cancelled: ${snapshot.docs[0].id}`);
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const { payment_intent: paymentIntentId, amount_refunded, refunds } = charge;

  if (!paymentIntentId) return;

  const snapshot = await adminDb
    .collection('stripePayments')
    .where('stripePaymentIntentId', '==', paymentIntentId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error(`Payment not found for charge refund`);
    return;
  }

  const docRef = snapshot.docs[0].ref;
  const payment = snapshot.docs[0].data();
  const isFullRefund = amount_refunded >= payment.amount;

  await docRef.update({
    status: isFullRefund ? 'refunded' : 'partially_refunded',
    refundAmount: amount_refunded,
    refundId: refunds?.data?.[0]?.id || null,
    refundedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log(`Payment refunded: ${snapshot.docs[0].id}`);
}

/**
 * Handle payment method attached to customer
 */
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  const { id, customer, type, card, us_bank_account } = paymentMethod;

  if (!customer || typeof customer !== 'string') return;

  // Check if we already have this payment method saved
  const existingSnapshot = await adminDb
    .collection('savedPaymentMethods')
    .where('stripePaymentMethodId', '==', id)
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    return; // Already saved
  }

  // Get customer metadata to find orgId and clientId
  if (!stripe) return;
  const stripeCustomer = await stripe.customers.retrieve(customer);
  if (stripeCustomer.deleted) return;

  const { orgId, clientId } = stripeCustomer.metadata;
  if (!orgId || !clientId) return;

  // Save the payment method
  const methodData: Record<string, unknown> = {
    orgId,
    clientId,
    stripePaymentMethodId: id,
    stripeCustomerId: customer,
    type: type === 'card' ? 'card' : 'ach',
    isDefault: false,
    createdAt: Timestamp.now(),
  };

  if (type === 'card' && card) {
    methodData.last4 = card.last4;
    methodData.brand = card.brand;
    methodData.expMonth = card.exp_month;
    methodData.expYear = card.exp_year;
  }

  if (type === 'us_bank_account' && us_bank_account) {
    methodData.accountLast4 = us_bank_account.last4;
    methodData.bankName = us_bank_account.bank_name;
    methodData.accountType = us_bank_account.account_type;
  }

  await adminDb.collection('savedPaymentMethods').add(methodData);
  console.log(`Payment method saved: ${id}`);
}

/**
 * Handle payment method detached from customer
 */
async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  const { id } = paymentMethod;

  const snapshot = await adminDb
    .collection('savedPaymentMethods')
    .where('stripePaymentMethodId', '==', id)
    .limit(1)
    .get();

  if (snapshot.empty) return;

  await snapshot.docs[0].ref.update({
    deletedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log(`Payment method removed: ${id}`);
}

/**
 * Update invoice payment status
 */
async function updateInvoicePaymentStatus(invoiceId: string, amountPaid: number) {
  try {
    const invoiceRef = adminDb.collection('invoices').doc(invoiceId);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists) return;

    const invoice = invoiceDoc.data();
    const totalPaid = (invoice?.paidAmount || 0) + amountPaid;
    const totalDue = invoice?.total || 0;

    const updates: Record<string, unknown> = {
      paidAmount: totalPaid,
      updatedAt: Timestamp.now(),
    };

    // Update status based on payment amount
    if (totalPaid >= totalDue) {
      updates.status = 'paid';
      updates.paidAt = Timestamp.now();
    } else if (totalPaid > 0) {
      updates.status = 'partially_paid';
    }

    await invoiceRef.update(updates);
    console.log(`Invoice ${invoiceId} updated with payment`);
  } catch (error) {
    console.error(`Failed to update invoice ${invoiceId}:`, error);
  }
}
