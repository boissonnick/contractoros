/**
 * QuickBooks Expense Sync
 *
 * Synchronization between ContractorOS Expenses and QuickBooks Purchases.
 * Primarily push-based (ContractorOS → QBO) since field expenses are
 * recorded in the app and need to be pushed to accounting.
 */

import { adminDb, Timestamp } from '@/lib/firebase/admin';
import { Expense, ExpenseCategory, AccountMappingRule } from '@/types';
import { qboCreate, qboUpdate, qboQuery, QBOClientError } from './client';
import { QBOPurchase, QBOPurchaseLine, QBORef } from './types';
import {
  getMapping,
  upsertMapping,
} from './entity-mapping';
import { startSyncLog, completeSyncLog, failSyncLog } from './sync-logger';

// ============================================
// Default Account Mappings
// ============================================

// Default QBO expense account references by category
// These should be configured per organization in production
const DEFAULT_ACCOUNT_MAPPINGS: Record<ExpenseCategory, string> = {
  materials: 'Cost of Goods Sold',
  tools: 'Tools and Equipment',
  equipment_rental: 'Equipment Rental',
  fuel: 'Automobile Expense',
  vehicle: 'Automobile Expense',
  subcontractor: 'Subcontractors',
  permits: 'Permits and Fees',
  labor: 'Labor Costs',
  office: 'Office Expenses',
  travel: 'Travel Expense',
  meals: 'Meals and Entertainment',
  insurance: 'Insurance Expense',
  utilities: 'Utilities',
  marketing: 'Advertising and Marketing',
  other: 'Miscellaneous Expense',
};

// ============================================
// Field Mapping: ContractorOS Expense → QBO Purchase
// ============================================

/**
 * Convert a ContractorOS Expense to a QBO Purchase
 */
export function expenseToQBOPurchase(
  expense: Expense,
  bankAccountRef: QBORef,
  expenseAccountRef: QBORef
): Partial<QBOPurchase> {
  const paymentType = mapPaymentType(expense.paymentMethod);

  const purchaseLine: QBOPurchaseLine = {
    Amount: expense.amount,
    DetailType: 'AccountBasedExpenseLineDetail',
    AccountBasedExpenseLineDetail: {
      AccountRef: expenseAccountRef,
      BillableStatus: expense.billable ? 'Billable' : 'NotBillable',
    },
    Description: expense.description,
  };

  const purchase: Partial<QBOPurchase> = {
    PaymentType: paymentType,
    AccountRef: bankAccountRef,
    TxnDate: expense.date,
    TotalAmt: expense.amount,
    Line: [purchaseLine],
  };

  // Add vendor if specified
  if (expense.vendorName) {
    purchase.EntityRef = {
      value: expense.vendorId || '0',
      name: expense.vendorName,
    };
  }

  // Add notes
  if (expense.notes) {
    purchase.PrivateNote = expense.notes.substring(0, 4000);
  }

  return purchase;
}

/**
 * Map ContractorOS payment method to QBO payment type
 */
function mapPaymentType(
  paymentMethod?: string
): 'Cash' | 'Check' | 'CreditCard' {
  switch (paymentMethod) {
    case 'cash':
      return 'Cash';
    case 'check':
      return 'Check';
    case 'credit_card':
    case 'debit_card':
    case 'company_card':
      return 'CreditCard';
    default:
      return 'Cash';
  }
}

// ============================================
// Sync Operations
// ============================================

/**
 * Push a single expense to QuickBooks
 */
export async function pushExpenseToQBO(
  orgId: string,
  expense: Expense,
  accountMappings?: AccountMappingRule[]
): Promise<{ qboId: string; created: boolean }> {
  // Only sync approved expenses
  if (expense.status !== 'approved' && expense.status !== 'paid') {
    throw new QBOClientError(
      'Only approved or paid expenses can be synced',
      'VALIDATION_ERROR'
    );
  }

  // Get expense account reference
  const expenseAccountRef = await getExpenseAccountRef(
    orgId,
    expense.category,
    accountMappings
  );

  // Get bank/payment account reference
  // In production, this should come from organization settings
  const bankAccountRef: QBORef = {
    value: '35', // Default checking account ID - should be configured
    name: 'Checking',
  };

  // Check for existing mapping
  const existingMapping = await getMapping(orgId, 'expense', expense.id);

  const purchaseData = expenseToQBOPurchase(expense, bankAccountRef, expenseAccountRef);

  if (existingMapping) {
    // Update existing purchase
    const updateData = {
      ...purchaseData,
      Id: existingMapping.qboId,
      SyncToken: existingMapping.qboSyncToken,
    };

    const updated = await qboUpdate<QBOPurchase>(orgId, 'Purchase', updateData);

    await upsertMapping(
      orgId,
      'expense',
      expense.id,
      existingMapping.qboId,
      updated.SyncToken || existingMapping.qboSyncToken
    );

    return { qboId: existingMapping.qboId, created: false };
  } else {
    // Create new purchase
    const created = await qboCreate<QBOPurchase>(orgId, 'Purchase', purchaseData);

    if (!created.Id) {
      throw new QBOClientError('Purchase created but no ID returned', 'SYNC_ERROR');
    }

    await upsertMapping(
      orgId,
      'expense',
      expense.id,
      created.Id,
      created.SyncToken || '0'
    );

    return { qboId: created.Id, created: true };
  }
}

/**
 * Sync a batch of approved expenses to QuickBooks
 */
export async function syncExpensesToQBO(
  orgId: string,
  expenseIds?: string[]
): Promise<{
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ expenseId: string; error: string }>;
}> {
  const logId = await startSyncLog(orgId, 'sync_expenses');

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: Array<{ expenseId: string; error: string }> = [];

  try {
    // Get account mappings for this org
    const accountMappings = await getAccountMappings(orgId);

    // Get expenses to sync
    const expensesCollection = adminDb
      .collection('organizations')
      .doc(orgId)
      .collection('expenses');

    let snapshot;

    if (expenseIds && expenseIds.length > 0) {
      // Firestore 'in' query limited to 30 items
      const allDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
      const batches: string[][] = [];

      for (let i = 0; i < expenseIds.length; i += 30) {
        batches.push(expenseIds.slice(i, i + 30));
      }

      for (const batch of batches) {
        const batchSnapshot = await expensesCollection
          .where('__name__', 'in', batch)
          .get();
        allDocs.push(...batchSnapshot.docs);
      }

      snapshot = { docs: allDocs };
    } else {
      // Sync all approved expenses not yet synced
      snapshot = await expensesCollection
        .where('status', 'in', ['approved', 'paid'])
        .get();
    }

    for (const doc of snapshot.docs) {
      const expense = { id: doc.id, ...doc.data() } as Expense;

      // Skip if not approved
      if (expense.status !== 'approved' && expense.status !== 'paid') {
        skipped++;
        continue;
      }

      try {
        const result = await pushExpenseToQBO(orgId, expense, accountMappings);
        if (result.created) {
          created++;
        } else {
          updated++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ expenseId: expense.id, error: errorMessage });
      }
    }

    await completeSyncLog(orgId, logId, {
      itemsSynced: created + updated,
      itemsFailed: errors.length,
      errors: errors.map((e) => `${e.expenseId}: ${e.error}`),
    });

    return { created, updated, skipped, errors };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await failSyncLog(orgId, logId, errorMessage);
    throw error;
  }
}

/**
 * Sync expense when it's approved (triggered by status change)
 */
export async function syncExpenseOnApproval(
  orgId: string,
  expenseId: string
): Promise<{ qboId: string; created: boolean } | null> {
  const doc = await adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('expenses')
    .doc(expenseId)
    .get();

  if (!doc.exists) {
    return null;
  }

  const expense = { id: doc.id, ...doc.data() } as Expense;

  if (expense.status !== 'approved' && expense.status !== 'paid') {
    return null;
  }

  try {
    return await pushExpenseToQBO(orgId, expense);
  } catch (error) {
    console.error(`Failed to sync expense ${expenseId} to QBO:`, error);
    return null;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get expense account reference based on category
 */
async function getExpenseAccountRef(
  orgId: string,
  category: ExpenseCategory,
  mappings?: AccountMappingRule[]
): Promise<QBORef> {
  // Check for custom mapping
  const customMapping = mappings?.find(
    (m) => m.sourceType === 'expense_category' && m.sourceValue === category
  );

  if (customMapping) {
    return {
      value: customMapping.targetAccountId,
      name: customMapping.targetAccountName,
    };
  }

  // Use default mapping
  const defaultAccountName = DEFAULT_ACCOUNT_MAPPINGS[category] || 'Miscellaneous Expense';

  // In production, you would query QBO for the actual account ID
  // For now, return a placeholder
  return {
    value: '1', // Placeholder - should be resolved from QBO
    name: defaultAccountName,
  };
}

/**
 * Get account mappings for an organization
 */
async function getAccountMappings(orgId: string): Promise<AccountMappingRule[]> {
  const snapshot = await adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('accountMappings')
    .where('provider', '==', 'quickbooks')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AccountMappingRule[];
}

/**
 * Get expense sync status
 */
export async function getExpenseSyncStatus(
  orgId: string,
  expenseId: string
): Promise<{
  isSynced: boolean;
  qboId?: string;
  lastSyncedAt?: Date;
}> {
  const mapping = await getMapping(orgId, 'expense', expenseId);

  if (!mapping) {
    return { isSynced: false };
  }

  return {
    isSynced: true,
    qboId: mapping.qboId,
    lastSyncedAt: mapping.lastSyncedAt,
  };
}
