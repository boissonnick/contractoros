/**
 * QuickBooks Sync API Route
 *
 * Triggers synchronization between ContractorOS and QuickBooks.
 *
 * POST /api/integrations/quickbooks/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, verifyAdminAccess } from '@/lib/api/auth';
import { getConnection } from '@/lib/integrations/quickbooks/oauth';
import {
  syncClientsToQBO,
  pullCustomersFromQBO,
  autoLinkClientsByEmail,
} from '@/lib/integrations/quickbooks/sync-customers';
import {
  syncInvoicesToQBO,
  pullInvoiceUpdatesFromQBO,
} from '@/lib/integrations/quickbooks/sync-invoices';
import {
  pullPaymentsFromQBO,
} from '@/lib/integrations/quickbooks/sync-payments';
import {
  syncExpensesToQBO,
} from '@/lib/integrations/quickbooks/sync-expenses';
import {
  getLastSyncLog,
  isSyncInProgress,
  getSyncStats,
} from '@/lib/integrations/quickbooks/sync-logger';
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

  // Verify admin access
  const adminError = verifyAdminAccess(user);
  if (adminError) {
    return adminError;
  }

  // Check connection
  const connection = await getConnection(user.orgId);
  if (!connection || !connection.isConnected) {
    return NextResponse.json(
      { error: 'QuickBooks is not connected' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { action, entityType, entityIds, options } = body;

    switch (action) {
      case 'push': {
        // Push local data to QuickBooks
        if (entityType === 'customers' || entityType === 'clients') {
          const result = await syncClientsToQBO(user.orgId, entityIds);
          return NextResponse.json({
            success: true,
            action: 'push',
            entityType: 'customers',
            ...result,
          });
        }
        if (entityType === 'invoices') {
          const result = await syncInvoicesToQBO(user.orgId, entityIds);
          return NextResponse.json({
            success: true,
            action: 'push',
            entityType: 'invoices',
            ...result,
          });
        }
        if (entityType === 'expenses') {
          const result = await syncExpensesToQBO(user.orgId, entityIds);
          return NextResponse.json({
            success: true,
            action: 'push',
            entityType: 'expenses',
            ...result,
          });
        }
        return NextResponse.json(
          { error: `Unsupported entity type: ${entityType}. Use: customers, invoices, expenses` },
          { status: 400 }
        );
      }

      case 'pull': {
        // Pull data from QuickBooks
        if (entityType === 'customers' || entityType === 'clients') {
          const result = await pullCustomersFromQBO(user.orgId, options);
          return NextResponse.json({
            success: true,
            action: 'pull',
            entityType: 'customers',
            ...result,
          });
        }
        if (entityType === 'invoices') {
          const result = await pullInvoiceUpdatesFromQBO(user.orgId, options);
          return NextResponse.json({
            success: true,
            action: 'pull',
            entityType: 'invoices',
            ...result,
          });
        }
        if (entityType === 'payments') {
          const result = await pullPaymentsFromQBO(user.orgId, options);
          return NextResponse.json({
            success: true,
            action: 'pull',
            entityType: 'payments',
            ...result,
          });
        }
        return NextResponse.json(
          { error: `Unsupported entity type: ${entityType}. Use: customers, invoices, payments` },
          { status: 400 }
        );
      }

      case 'auto-link': {
        // Auto-link by email
        if (entityType === 'customers' || entityType === 'clients') {
          const result = await autoLinkClientsByEmail(user.orgId);
          return NextResponse.json({
            success: true,
            action: 'auto-link',
            entityType: 'customers',
            ...result,
          });
        }
        return NextResponse.json(
          { error: `Unsupported entity type: ${entityType}` },
          { status: 400 }
        );
      }

      case 'full': {
        // Full sync: auto-link customers, push customers, push invoices, push expenses, pull updates
        const results = {
          autoLink: { linked: 0, notFound: 0, errors: [] as Array<{ clientId: string; error: string }> },
          customers: {
            push: { created: 0, updated: 0, errors: [] as Array<{ clientId: string; error: string }> },
            pull: { updated: 0, errors: [] as Array<{ qboId: string; error: string }> },
          },
          invoices: {
            push: { created: 0, updated: 0, skipped: 0, errors: [] as Array<{ invoiceId: string; error: string }> },
            pull: { updated: 0, errors: [] as Array<{ qboId: string; error: string }> },
          },
          payments: {
            pull: { recorded: 0, skipped: 0, errors: [] as Array<{ qboId: string; error: string }> },
          },
          expenses: {
            push: { created: 0, updated: 0, skipped: 0, errors: [] as Array<{ expenseId: string; error: string }> },
          },
        };

        // Step 1: Auto-link existing customers
        try {
          results.autoLink = await autoLinkClientsByEmail(user.orgId);
        } catch (error) {
          logger.error('Auto-link error', { error, route: 'qbo-sync' });
        }

        // Step 2: Push customers to QBO
        try {
          results.customers.push = await syncClientsToQBO(user.orgId);
        } catch (error) {
          logger.error('Customer push error', { error, route: 'qbo-sync' });
        }

        // Step 3: Push invoices to QBO (after customers so they're linked)
        try {
          results.invoices.push = await syncInvoicesToQBO(user.orgId);
        } catch (error) {
          logger.error('Invoice push error', { error, route: 'qbo-sync' });
        }

        // Step 4: Push expenses to QBO
        try {
          results.expenses.push = await syncExpensesToQBO(user.orgId);
        } catch (error) {
          logger.error('Expense push error', { error, route: 'qbo-sync' });
        }

        // Step 5: Pull customer updates from QBO
        try {
          results.customers.pull = await pullCustomersFromQBO(user.orgId, options);
        } catch (error) {
          logger.error('Customer pull error', { error, route: 'qbo-sync' });
        }

        // Step 6: Pull invoice updates from QBO (payment status)
        try {
          results.invoices.pull = await pullInvoiceUpdatesFromQBO(user.orgId, options);
        } catch (error) {
          logger.error('Invoice pull error', { error, route: 'qbo-sync' });
        }

        // Step 7: Pull payments from QBO
        try {
          results.payments.pull = await pullPaymentsFromQBO(user.orgId, options);
        } catch (error) {
          logger.error('Payment pull error', { error, route: 'qbo-sync' });
        }

        return NextResponse.json({
          success: true,
          action: 'full',
          results,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use: push, pull, auto-link, or full` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Sync error', { error, route: 'qbo-sync' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

/**
 * GET: Get sync status and history
 */
export async function GET(request: NextRequest) {
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

  try {
    // Get connection status
    const connection = await getConnection(user.orgId);

    if (!connection || !connection.isConnected) {
      return NextResponse.json({
        connected: false,
        message: 'QuickBooks is not connected',
      });
    }

    // Get sync status
    const [
      inProgress,
      lastCustomerSync,
      lastInvoiceSync,
      lastPaymentSync,
      stats,
    ] = await Promise.all([
      isSyncInProgress(user.orgId),
      getLastSyncLog(user.orgId, 'sync_customers'),
      getLastSyncLog(user.orgId, 'sync_invoices'),
      getLastSyncLog(user.orgId, 'sync_payments'),
      getSyncStats(user.orgId, 30),
    ]);

    return NextResponse.json({
      connected: true,
      companyName: connection.companyName,
      inProgress,
      lastSync: {
        customers: lastCustomerSync ? {
          status: lastCustomerSync.status,
          startedAt: lastCustomerSync.startedAt.toISOString(),
          completedAt: lastCustomerSync.completedAt?.toISOString(),
          itemsSynced: lastCustomerSync.itemsSynced,
          itemsFailed: lastCustomerSync.itemsFailed,
        } : null,
        invoices: lastInvoiceSync ? {
          status: lastInvoiceSync.status,
          startedAt: lastInvoiceSync.startedAt.toISOString(),
          completedAt: lastInvoiceSync.completedAt?.toISOString(),
          itemsSynced: lastInvoiceSync.itemsSynced,
          itemsFailed: lastInvoiceSync.itemsFailed,
        } : null,
        payments: lastPaymentSync ? {
          status: lastPaymentSync.status,
          startedAt: lastPaymentSync.startedAt.toISOString(),
          completedAt: lastPaymentSync.completedAt?.toISOString(),
          itemsSynced: lastPaymentSync.itemsSynced,
          itemsFailed: lastPaymentSync.itemsFailed,
        } : null,
      },
      stats,
    });
  } catch (error) {
    logger.error('Error getting sync status', { error, route: 'qbo-sync' });
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
