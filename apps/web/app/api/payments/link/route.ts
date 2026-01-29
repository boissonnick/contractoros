import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

/**
 * GET /api/payments/link?token=xxx
 * Fetch payment link by token with org and invoice info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find payment link by token
    const snapshot = await adminDb
      .collection('paymentLinks')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      );
    }

    const linkDoc = snapshot.docs[0];
    const linkData = linkDoc.data();

    const paymentLink = {
      id: linkDoc.id,
      ...linkData,
      expiresAt: linkData.expiresAt?.toDate?.()?.toISOString() || null,
      createdAt: linkData.createdAt?.toDate?.()?.toISOString() || null,
      usedAt: linkData.usedAt?.toDate?.()?.toISOString() || null,
    };

    // Fetch org info
    let org = null;
    if (linkData.orgId) {
      const orgDoc = await adminDb.collection('orgs').doc(linkData.orgId).get();
      if (orgDoc.exists) {
        const orgData = orgDoc.data();
        org = {
          name: orgData?.name || 'Unknown',
          logo: orgData?.logo || null,
        };
      }
    }

    // Fetch invoice info
    let invoice = null;
    if (linkData.invoiceId) {
      const invoiceDoc = await adminDb.collection('invoices').doc(linkData.invoiceId).get();
      if (invoiceDoc.exists) {
        const invoiceData = invoiceDoc.data();
        invoice = {
          number: invoiceData?.invoiceNumber || null,
          description: invoiceData?.description || null,
        };
      }
    }

    return NextResponse.json({
      paymentLink,
      org,
      invoice,
    });
  } catch (error) {
    console.error('Get payment link error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment link' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/payments/link
 * Update payment link status (e.g., mark as used)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, status, paymentId } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find payment link by token
    const snapshot = await adminDb
      .collection('paymentLinks')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      );
    }

    const linkDoc = snapshot.docs[0];
    const updates: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (status) {
      updates.status = status;
    }

    if (paymentId) {
      updates.paymentId = paymentId;
    }

    if (status === 'used') {
      updates.usedAt = Timestamp.now();
    }

    await linkDoc.ref.update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update payment link error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment link' },
      { status: 500 }
    );
  }
}
