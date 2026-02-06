/**
 * QuickBooks Accounts API Route
 *
 * Fetches the chart of accounts from QuickBooks Online.
 *
 * GET /api/integrations/quickbooks/accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api/auth';
import { getConnection } from '@/lib/integrations/quickbooks/oauth';
import { qboQuery } from '@/lib/integrations/quickbooks/client';
import type { AccountingAccount, AccountingAccountType } from '@/types';
import { logger } from '@/lib/utils/logger';

/**
 * QBO Account object shape from the QuickBooks API
 */
interface QBOAccount {
  Id: string;
  Name: string;
  AccountType: string;
  AccountSubType?: string;
  AcctNum?: string;
  Active: boolean;
  Classification?: 'Asset' | 'Equity' | 'Expense' | 'Liability' | 'Revenue';
  CurrentBalance?: number;
  ParentRef?: { value: string; name?: string };
  FullyQualifiedName?: string;
  SyncToken: string;
}

/**
 * Map QBO AccountType strings to our AccountingAccountType
 */
function mapAccountType(qboType: string): AccountingAccountType {
  const typeMap: Record<string, AccountingAccountType> = {
    'Income': 'income',
    'Expense': 'expense',
    'Fixed Asset': 'asset',
    'Other Current Asset': 'asset',
    'Bank': 'asset',
    'Other Asset': 'asset',
    'Accounts Receivable': 'asset',
    'Other Current Liability': 'liability',
    'Long Term Liability': 'liability',
    'Accounts Payable': 'liability',
    'Credit Card': 'liability',
    'Equity': 'equity',
    'Cost of Goods Sold': 'cost_of_goods_sold',
    'Other Income': 'other_income',
    'Other Expense': 'other_expense',
  };

  return typeMap[qboType] || 'expense';
}

/**
 * Map a QBO Account to our AccountingAccount type
 */
function mapQBOAccount(qboAccount: QBOAccount): AccountingAccount {
  return {
    id: qboAccount.Id,
    name: qboAccount.FullyQualifiedName || qboAccount.Name,
    type: mapAccountType(qboAccount.AccountType),
    number: qboAccount.AcctNum || undefined,
    isActive: qboAccount.Active,
    parentId: qboAccount.ParentRef?.value || undefined,
    provider: 'quickbooks',
  };
}

/**
 * GET: Fetch chart of accounts from QuickBooks
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

  // Check QBO connection
  const connection = await getConnection(user.orgId);
  if (!connection || !connection.isConnected) {
    return NextResponse.json(
      { error: 'QuickBooks is not connected' },
      { status: 400 }
    );
  }

  try {
    // Fetch active accounts from QBO
    const response = await qboQuery<QBOAccount>(
      user.orgId,
      'Account',
      'Active = true',
      1000
    );

    // Extract accounts from the query response
    const qboAccounts: QBOAccount[] = response.QueryResponse?.Account || [];

    // Map to our AccountingAccount type
    const accounts: AccountingAccount[] = qboAccounts.map(mapQBOAccount);

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
    });
  } catch (error) {
    logger.error('Error fetching QBO accounts', { error, route: 'qbo-accounts' });

    const message = error instanceof Error ? error.message : 'Failed to fetch accounts from QuickBooks';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
