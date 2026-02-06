"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import {
  ArrowsRightLeftIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowRightIcon,
  SparklesIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import type {
  AccountMappingRule,
  AccountingAccount,
  AccountingAccountType,
} from '@/types';

// ============================================================================
// Types
// ============================================================================

interface QBOAccountMappingProps {
  mappingRules: AccountMappingRule[];
  onAddRule: (rule: Omit<AccountMappingRule, 'id' | 'orgId' | 'createdAt'>) => Promise<void>;
  onRemoveRule: (ruleId: string) => Promise<void>;
  onSaveDefaults?: (defaults: {
    defaultIncomeAccountId: string;
    defaultIncomeAccountName: string;
    defaultExpenseAccountId: string;
    defaultExpenseAccountName: string;
    defaultAssetAccountId: string;
    defaultAssetAccountName: string;
  }) => Promise<void>;
  defaultAccounts?: {
    defaultIncomeAccountId?: string;
    defaultExpenseAccountId?: string;
    defaultAssetAccountId?: string;
  };
}

type SourceType = AccountMappingRule['sourceType'];

// ============================================================================
// Constants
// ============================================================================

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: 'expense_category', label: 'Expense Category' },
  { value: 'invoice_type', label: 'Invoice Type' },
  { value: 'payment_type', label: 'Payment Type' },
];

const SOURCE_TYPE_BADGE_STYLES: Record<SourceType, string> = {
  expense_category: 'bg-purple-100 text-purple-700',
  invoice_type: 'bg-blue-100 text-blue-700',
  payment_type: 'bg-green-100 text-green-700',
};

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  expense_category: 'Expense Category',
  invoice_type: 'Invoice Type',
  payment_type: 'Payment Type',
};

const ACCOUNT_TYPE_LABELS: Record<AccountingAccountType, string> = {
  income: 'Income',
  expense: 'Expense',
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  cost_of_goods_sold: 'Cost of Goods Sold',
  other_income: 'Other Income',
  other_expense: 'Other Expense',
};

const ACCOUNT_TYPE_ORDER: AccountingAccountType[] = [
  'expense',
  'cost_of_goods_sold',
  'income',
  'other_income',
  'asset',
  'liability',
  'equity',
  'other_expense',
];

const SUGGESTED_CATEGORIES = [
  'Materials & Supplies',
  'Subcontractor Payments',
  'Equipment Rental',
  'Labor',
  'Permits & Fees',
  'Insurance',
  'Vehicle/Fuel',
];

// ============================================================================
// Helper: Group accounts by type
// ============================================================================

function groupAccountsByType(
  accounts: AccountingAccount[]
): { type: AccountingAccountType; label: string; accounts: AccountingAccount[] }[] {
  const groups = new Map<AccountingAccountType, AccountingAccount[]>();

  for (const account of accounts) {
    if (!account.isActive) continue;
    const existing = groups.get(account.type) || [];
    existing.push(account);
    groups.set(account.type, existing);
  }

  return ACCOUNT_TYPE_ORDER
    .filter((type) => groups.has(type))
    .map((type) => ({
      type,
      label: ACCOUNT_TYPE_LABELS[type],
      accounts: groups.get(type)!.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

// ============================================================================
// Sub-components
// ============================================================================

function AccountSelect({
  value,
  onChange,
  accounts,
  placeholder = 'Select account...',
  className,
}: {
  value: string;
  onChange: (accountId: string, accountName: string) => void;
  accounts: AccountingAccount[];
  placeholder?: string;
  className?: string;
}) {
  const grouped = groupAccountsByType(accounts);

  return (
    <select
      value={value}
      onChange={(e) => {
        const account = accounts.find((a) => a.id === e.target.value);
        if (account) {
          onChange(account.id, account.name);
        }
      }}
      className={cn(
        'block w-full rounded-lg border bg-white px-3 py-2.5 text-gray-900',
        'min-h-[44px] text-base sm:text-sm',
        'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
        'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
        'transition-colors duration-200 appearance-none border-gray-300',
        'bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-10',
        className
      )}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {grouped.map((group) => (
        <optgroup key={group.type} label={group.label}>
          {group.accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.number ? `${account.number} - ${account.name}` : account.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function MappingRuleRow({
  rule,
  onRemove,
  removing,
}: {
  rule: AccountMappingRule;
  onRemove: (ruleId: string) => void;
  removing: string | null;
}) {
  const isRemoving = removing === rule.id;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50',
        'hover:bg-gray-50 transition-colors duration-200 group',
        isRemoving && 'opacity-50'
      )}
    >
      {/* Source type badge */}
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full shrink-0',
          SOURCE_TYPE_BADGE_STYLES[rule.sourceType]
        )}
      >
        {SOURCE_TYPE_LABELS[rule.sourceType]}
      </span>

      {/* Source value */}
      <span className="text-sm font-medium text-gray-900 truncate min-w-0">
        {rule.sourceValue}
      </span>

      {/* Arrow */}
      <ArrowRightIcon className="h-4 w-4 text-gray-400 shrink-0" />

      {/* Target account */}
      <span className="text-sm text-gray-600 truncate min-w-0 flex-1">
        {rule.targetAccountName}
      </span>

      {/* Delete button */}
      <button
        onClick={() => onRemove(rule.id)}
        disabled={isRemoving}
        className={cn(
          'p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50',
          'transition-colors duration-200 opacity-0 group-hover:opacity-100 shrink-0',
          'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
        )}
        title="Remove mapping"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function QBOAccountMapping({
  mappingRules,
  onAddRule,
  onRemoveRule,
  onSaveDefaults,
  defaultAccounts,
}: QBOAccountMappingProps) {
  // ------ QBO accounts state ------
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  // ------ Add rule form state ------
  const [sourceType, setSourceType] = useState<SourceType>('expense_category');
  const [sourceValue, setSourceValue] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [targetAccountName, setTargetAccountName] = useState('');
  const [addingRule, setAddingRule] = useState(false);

  // ------ Remove state ------
  const [removingId, setRemovingId] = useState<string | null>(null);

  // ------ Default accounts state ------
  const [defaultIncomeAccountId, setDefaultIncomeAccountId] = useState('');
  const [defaultIncomeAccountName, setDefaultIncomeAccountName] = useState('');
  const [defaultExpenseAccountId, setDefaultExpenseAccountId] = useState('');
  const [defaultExpenseAccountName, setDefaultExpenseAccountName] = useState('');
  const [defaultAssetAccountId, setDefaultAssetAccountId] = useState('');
  const [defaultAssetAccountName, setDefaultAssetAccountName] = useState('');

  // ------ Show/hide sections ------
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ------ Save defaults state ------
  const [savingDefaults, setSavingDefaults] = useState(false);

  // Load initial default values from props
  useEffect(() => {
    if (defaultAccounts) {
      if (defaultAccounts.defaultIncomeAccountId) setDefaultIncomeAccountId(defaultAccounts.defaultIncomeAccountId);
      if (defaultAccounts.defaultExpenseAccountId) setDefaultExpenseAccountId(defaultAccounts.defaultExpenseAccountId);
      if (defaultAccounts.defaultAssetAccountId) setDefaultAssetAccountId(defaultAccounts.defaultAssetAccountId);
    }
  }, [defaultAccounts]);

  // ============================================================================
  // Fetch QBO Accounts
  // ============================================================================

  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError(null);

    try {
      const response = await fetch('/api/integrations/quickbooks/accounts');
      if (!response.ok) {
        throw new Error(`Failed to fetch accounts (${response.status})`);
      }
      const data = await response.json();
      setAccounts(data.accounts || data || []);
    } catch (err) {
      setAccountsError(
        err instanceof Error ? err.message : 'Failed to load QBO accounts'
      );
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleAddRule = async () => {
    if (!sourceValue.trim() || !targetAccountId) return;

    setAddingRule(true);
    try {
      await onAddRule({
        sourceType,
        sourceValue: sourceValue.trim(),
        targetAccountId,
        targetAccountName,
        provider: 'quickbooks',
      });
      // Reset form
      setSourceValue('');
      setTargetAccountId('');
      setTargetAccountName('');
    } catch {
      // Error handling is expected to be done by the parent
    } finally {
      setAddingRule(false);
    }
  };

  const handleRemoveRule = async (ruleId: string) => {
    setRemovingId(ruleId);
    try {
      await onRemoveRule(ruleId);
    } catch {
      // Error handling is expected to be done by the parent
    } finally {
      setRemovingId(null);
    }
  };

  const handleSuggestionClick = (category: string) => {
    setSourceValue(category);
    setSourceType('expense_category');
  };

  const handleSaveDefaults = async () => {
    if (!onSaveDefaults) return;
    setSavingDefaults(true);
    try {
      await onSaveDefaults({
        defaultIncomeAccountId,
        defaultIncomeAccountName,
        defaultExpenseAccountId,
        defaultExpenseAccountName,
        defaultAssetAccountId,
        defaultAssetAccountName,
      });
    } catch {
      // Error handled by parent
    } finally {
      setSavingDefaults(false);
    }
  };

  // ============================================================================
  // Render: Loading State
  // ============================================================================

  if (accountsLoading) {
    return (
      <Card padding="lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50">
              <ArrowsRightLeftIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Account Mapping</CardTitle>
              <CardDescription>Loading QuickBooks accounts...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-8 w-24 bg-gray-200 rounded-full" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="h-4 flex-1 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // Render: Error State
  // ============================================================================

  if (accountsError) {
    return (
      <Card padding="lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-50">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle>Account Mapping</CardTitle>
              <CardDescription>Unable to load QuickBooks accounts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-red-50 border border-red-100 p-4">
            <p className="text-sm text-red-700 mb-3">{accountsError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAccounts}
              icon={<ArrowPathIcon className="h-4 w-4" />}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // Render: Main
  // ============================================================================

  const grouped = groupAccountsByType(accounts);
  const hasAccounts = accounts.length > 0;
  const canAddRule = sourceValue.trim() && targetAccountId && !addingRule;

  return (
    <Card padding="lg">
      {/* Header */}
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50">
            <ArrowsRightLeftIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>Account Mapping</CardTitle>
            <CardDescription>
              Map ContractorOS categories to QuickBooks Online accounts for accurate syncing
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ================================================================ */}
        {/* Default Accounts Section */}
        {/* ================================================================ */}
        {hasAccounts && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                Default Accounts
              </h4>
              <Badge variant="info" size="sm">
                Recommended
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              Set default accounts for common transaction types. These will be used when no specific mapping rule applies.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Default Income Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Income Account
                </label>
                <AccountSelect
                  value={defaultIncomeAccountId}
                  onChange={(id, name) => {
                    setDefaultIncomeAccountId(id);
                    setDefaultIncomeAccountName(name);
                  }}
                  accounts={accounts}
                  placeholder="Select income account..."
                />
                <p className="mt-1 text-xs text-gray-400">For invoices</p>
              </div>

              {/* Default Expense Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Expense Account
                </label>
                <AccountSelect
                  value={defaultExpenseAccountId}
                  onChange={(id, name) => {
                    setDefaultExpenseAccountId(id);
                    setDefaultExpenseAccountName(name);
                  }}
                  accounts={accounts}
                  placeholder="Select expense account..."
                />
                <p className="mt-1 text-xs text-gray-400">For expenses</p>
              </div>

              {/* Default Asset Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Asset Account
                </label>
                <AccountSelect
                  value={defaultAssetAccountId}
                  onChange={(id, name) => {
                    setDefaultAssetAccountId(id);
                    setDefaultAssetAccountName(name);
                  }}
                  accounts={accounts}
                  placeholder="Select asset account..."
                />
                <p className="mt-1 text-xs text-gray-400">For equipment</p>
              </div>
            </div>

            <div className="flex justify-end mt-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveDefaults}
                disabled={!onSaveDefaults || savingDefaults || (!defaultIncomeAccountId && !defaultExpenseAccountId && !defaultAssetAccountId)}
                loading={savingDefaults}
              >
                Save Defaults
              </Button>
            </div>
          </div>
        )}

        {/* Divider */}
        {hasAccounts && (
          <div className="border-t border-gray-100" />
        )}

        {/* ================================================================ */}
        {/* Current Mappings */}
        {/* ================================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
              Category Mappings
            </h4>
            {mappingRules.length > 0 && (
              <span className="text-xs text-gray-500">
                {mappingRules.length} {mappingRules.length === 1 ? 'rule' : 'rules'}
              </span>
            )}
          </div>

          {mappingRules.length === 0 ? (
            <EmptyState
              icon={<ArrowsRightLeftIcon className="h-full w-full" />}
              title="No mapping rules"
              description="Create mapping rules to automatically categorize transactions in QuickBooks."
              size="sm"
            />
          ) : (
            <div className="space-y-2">
              {mappingRules.map((rule) => (
                <MappingRuleRow
                  key={rule.id}
                  rule={rule}
                  onRemove={handleRemoveRule}
                  removing={removingId}
                />
              ))}
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* Suggested Categories */}
        {/* ================================================================ */}
        {hasAccounts && (
          <div className="space-y-3">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <SparklesIcon className="h-4 w-4 text-amber-500" />
              Suggested Categories
              <ChevronDownIcon
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  showSuggestions && 'rotate-180'
                )}
              />
            </button>

            {showSuggestions && (
              <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {SUGGESTED_CATEGORIES.map((category) => {
                  const alreadyMapped = mappingRules.some(
                    (r) => r.sourceValue.toLowerCase() === category.toLowerCase()
                  );

                  return (
                    <button
                      key={category}
                      onClick={() => !alreadyMapped && handleSuggestionClick(category)}
                      disabled={alreadyMapped}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                        alreadyMapped
                          ? 'border-green-200 bg-green-50 text-green-600 cursor-default'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary-light cursor-pointer'
                      )}
                    >
                      {alreadyMapped ? '\u2713 ' : ''}
                      {category}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* Add New Mapping Form */}
        {/* ================================================================ */}
        {hasAccounts && (
          <div className="space-y-3">
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 tracking-tight mb-3">
                Add New Mapping
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              {/* Source Type */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Source Type
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as SourceType)}
                  className={cn(
                    'block w-full rounded-lg border bg-white px-3 py-2.5 text-gray-900',
                    'min-h-[44px] text-base sm:text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
                    'transition-colors duration-200 appearance-none border-gray-300',
                    'bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat pr-10'
                  )}
                >
                  {SOURCE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Value */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  value={sourceValue}
                  onChange={(e) => setSourceValue(e.target.value)}
                  placeholder="e.g. Materials & Supplies"
                  className={cn(
                    'block w-full rounded-lg border bg-white px-3 py-2.5 text-gray-900 placeholder-gray-400',
                    'min-h-[44px] text-base sm:text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
                    'transition-colors duration-200 border-gray-300'
                  )}
                />
              </div>

              {/* Arrow indicator (hidden on mobile) */}
              <div className="hidden sm:flex sm:col-span-1 items-center justify-center pb-1">
                <ArrowRightIcon className="h-4 w-4 text-gray-400" />
              </div>

              {/* Target Account */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  QBO Account
                </label>
                <AccountSelect
                  value={targetAccountId}
                  onChange={(id, name) => {
                    setTargetAccountId(id);
                    setTargetAccountName(name);
                  }}
                  accounts={accounts}
                  placeholder="Select account..."
                />
              </div>

              {/* Add Button */}
              <div className="sm:col-span-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleAddRule}
                  disabled={!canAddRule}
                  loading={addingRule}
                  icon={<PlusIcon className="h-4 w-4" />}
                  className="w-full"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer info */}
      {mappingRules.length > 0 && (
        <CardFooter>
          <p className="text-xs text-gray-400">
            Mapping rules determine how ContractorOS transactions are categorized in QuickBooks Online.
            Rules are applied automatically during each sync.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
