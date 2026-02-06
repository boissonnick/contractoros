/**
 * QuickBooks Invoice Auto-Sync API Route
 *
 * Automatically syncs an invoice to QuickBooks when it is sent,
 * if the organization has auto-sync enabled.
 *
 * POST /api/integrations/quickbooks/sync/invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api/auth';
import { getConnection } from '@/lib/integrations/quickbooks/oauth';
import { syncInvoiceOnSend } from '@/lib/integrations/quickbooks/sync-invoices';
import { adminDb } from '@/lib/firebase/admin';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  // Verify authentication
  const { user, error: authError } = await verifyAuth(request);

  if (authError) {
    return authError;
  }

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const orgId = user.orgId;

  try {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'invoiceId is required' },
        { status: 400 }
      );
    }

    // Check QBO connection
    const connection = await getConnection(orgId);
    if (!connection || !connection.isConnected) {
      return NextResponse.json({
        skipped: true,
        reason: 'QuickBooks is not connected',
      });
    }

    // Check if auto-sync is enabled for invoices
    const connectionDoc = await adminDb
      .collection('organizations')
      .doc(orgId)
      .collection('accountingConnections')
      .doc('quickbooks')
      .get();

    const data = connectionDoc.data();
    if (!data?.syncSettings?.autoSyncInvoices) {
      return NextResponse.json({
        skipped: true,
        reason: 'Auto-sync for invoices is not enabled',
      });
    }

    // Sync the invoice to QuickBooks
    const result = await syncInvoiceOnSend(orgId, invoiceId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error('Invoice auto-sync error', { error, route: 'qbo-sync-invoice' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invoice sync failed' },
      { status: 500 }
    );
  }
}
