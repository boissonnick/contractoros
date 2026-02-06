/**
 * QuickBooks Expense Auto-Sync API Route
 *
 * Automatically syncs an expense to QuickBooks when it is approved,
 * if the organization has auto-sync enabled.
 *
 * POST /api/integrations/quickbooks/sync/expense
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api/auth';
import { getConnection } from '@/lib/integrations/quickbooks/oauth';
import { syncExpenseOnApproval } from '@/lib/integrations/quickbooks/sync-expenses';
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
    const { expenseId } = body;

    if (!expenseId) {
      return NextResponse.json(
        { error: 'expenseId is required' },
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

    // Check if auto-sync is enabled for expenses
    const connectionDoc = await adminDb
      .collection('organizations')
      .doc(orgId)
      .collection('accountingConnections')
      .doc('quickbooks')
      .get();

    const data = connectionDoc.data();
    if (!data?.syncSettings?.autoSyncExpenses) {
      return NextResponse.json({
        skipped: true,
        reason: 'Auto-sync for expenses is not enabled',
      });
    }

    // Sync the expense to QuickBooks
    const result = await syncExpenseOnApproval(orgId, expenseId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error('Expense auto-sync error', { error, route: 'qbo-sync-expense' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Expense sync failed' },
      { status: 500 }
    );
  }
}
