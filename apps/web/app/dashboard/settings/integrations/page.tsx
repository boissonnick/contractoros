"use client";

import React, { useState } from 'react';
import { useAccountingConnection } from '@/lib/hooks/useAccountingConnection';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import {
  AccountingProvider,
  AccountingSyncSettings,
  AccountMappingRule,
  ExpenseCategory,
} from '@/types';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  LinkIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ArrowsRightLeftIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'materials', label: 'Materials' },
  { value: 'tools', label: 'Tools' },
  { value: 'equipment_rental', label: 'Equipment Rental' },
  { value: 'permits', label: 'Permits' },
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals' },
  { value: 'other', label: 'Other' },
];

const SAMPLE_QB_ACCOUNTS = [
  { id: 'qb-1', name: 'Construction Income', type: 'income' as const, number: '4000' },
  { id: 'qb-2', name: 'Materials Expense', type: 'expense' as const, number: '5100' },
  { id: 'qb-3', name: 'Tools & Equipment', type: 'expense' as const, number: '5200' },
  { id: 'qb-4', name: 'Equipment Rental', type: 'expense' as const, number: '5300' },
  { id: 'qb-5', name: 'Permits & Fees', type: 'expense' as const, number: '5400' },
  { id: 'qb-6', name: 'Travel Expense', type: 'expense' as const, number: '5500' },
  { id: 'qb-7', name: 'Meals & Entertainment', type: 'expense' as const, number: '5600' },
  { id: 'qb-8', name: 'Miscellaneous Expense', type: 'expense' as const, number: '5900' },
  { id: 'qb-9', name: 'Accounts Receivable', type: 'asset' as const, number: '1200' },
  { id: 'qb-10', name: 'Cost of Goods Sold', type: 'cost_of_goods_sold' as const, number: '5000' },
];

export default function IntegrationsPage() {
  const {
    connection,
    mappingRules,
    loading,
    connectProvider,
    disconnectProvider,
    updateSyncSettings,
    triggerSync,
    addMappingRule,
    removeMappingRule,
  } = useAccountingConnection();

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<AccountingProvider | null>(null);
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [newMapping, setNewMapping] = useState({
    sourceType: 'expense_category' as const,
    sourceValue: '',
    targetAccountId: '',
    targetAccountName: '',
  });

  const handleConnect = async (provider: AccountingProvider) => {
    setConnectingProvider(provider);
    setShowConnectModal(true);
  };

  const handleConfirmConnect = async () => {
    if (!connectingProvider) return;
    try {
      const companyName = connectingProvider === 'quickbooks'
        ? 'My QuickBooks Company'
        : 'My Xero Organization';
      await connectProvider(connectingProvider, companyName);
      toast.success(`Connected to ${connectingProvider === 'quickbooks' ? 'QuickBooks' : 'Xero'} successfully`);
      setShowConnectModal(false);
      setConnectingProvider(null);
    } catch {
      toast.error('Failed to connect');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect from accounting? Sync will stop and mappings will remain.')) return;
    try {
      await disconnectProvider();
      toast.success('Disconnected from accounting');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const handleSyncSettingChange = async (key: keyof AccountingSyncSettings, value: unknown) => {
    try {
      await updateSyncSettings({ [key]: value });
    } catch {
      toast.error('Failed to update settings');
    }
  };

  const handleSync = async () => {
    try {
      await triggerSync();
      toast.success('Sync started');
    } catch {
      toast.error('Failed to start sync');
    }
  };

  const handleAddMapping = async () => {
    if (!newMapping.sourceValue || !newMapping.targetAccountId) return;
    const account = SAMPLE_QB_ACCOUNTS.find(a => a.id === newMapping.targetAccountId);
    if (!account) return;
    try {
      await addMappingRule({
        sourceType: newMapping.sourceType,
        sourceValue: newMapping.sourceValue,
        targetAccountId: newMapping.targetAccountId,
        targetAccountName: account.name,
        provider: connection?.provider || 'quickbooks',
      });
      setNewMapping({ sourceType: 'expense_category', sourceValue: '', targetAccountId: '', targetAccountName: '' });
      setShowMappingForm(false);
      toast.success('Mapping rule added');
    } catch {
      toast.error('Failed to add mapping');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isConnected = connection?.isConnected;

  return (
    <div className="space-y-6">
      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* QuickBooks */}
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              QB
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">QuickBooks Online</h3>
                {connection?.provider === 'quickbooks' && isConnected && (
                  <Badge className="bg-green-100 text-green-700">Connected</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Two-way sync invoices, expenses, and payments with QuickBooks Online.
              </p>
              {connection?.provider === 'quickbooks' && isConnected ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-400">
                    Company: {connection.companyName}
                  </p>
                  {connection.lastSyncAt && (
                    <p className="text-xs text-gray-400">
                      Last sync: {format(connection.lastSyncAt, 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleSync}>
                      <ArrowPathIcon className={cn('h-4 w-4 mr-1', connection.lastSyncStatus === 'syncing' && 'animate-spin')} />
                      {connection.lastSyncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDisconnect}>
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  className="mt-3"
                  onClick={() => handleConnect('quickbooks')}
                  disabled={isConnected && connection?.provider !== 'quickbooks'}
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Connect QuickBooks
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Xero */}
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              Xe
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Xero</h3>
                {connection?.provider === 'xero' && isConnected && (
                  <Badge className="bg-green-100 text-green-700">Connected</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Sync financial data with Xero for seamless accounting.
              </p>
              {connection?.provider === 'xero' && isConnected ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-400">
                    Organization: {connection.companyName}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleSync}>
                      <ArrowPathIcon className="h-4 w-4 mr-1" />
                      Sync Now
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDisconnect}>
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  className="mt-3"
                  onClick={() => handleConnect('xero')}
                  disabled={isConnected && connection?.provider !== 'xero'}
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Connect Xero
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Integrations */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Other Integrations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">Stripe</span>
              <Badge className="bg-gray-100 text-gray-500 text-xs">Planned</Badge>
            </div>
            <p className="text-xs text-gray-500">Online client payments</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">Gusto</span>
              <Badge className="bg-gray-100 text-gray-500 text-xs">Planned</Badge>
            </div>
            <p className="text-xs text-gray-500">Payroll integration</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">ADP</span>
              <Badge className="bg-gray-100 text-gray-500 text-xs">Planned</Badge>
            </div>
            <p className="text-xs text-gray-500">Enterprise payroll</p>
          </div>
        </div>
      </Card>

      {/* Sync Settings - only if connected */}
      {isConnected && connection && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Sync Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-sync Invoices</p>
                <p className="text-xs text-gray-500">Automatically push new invoices to accounting</p>
              </div>
              <button
                onClick={() => handleSyncSettingChange('autoSyncInvoices', !connection.syncSettings.autoSyncInvoices)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  connection.syncSettings.autoSyncInvoices ? 'bg-blue-600' : 'bg-gray-300'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                  connection.syncSettings.autoSyncInvoices && 'translate-x-5'
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-sync Expenses</p>
                <p className="text-xs text-gray-500">Push approved expenses to accounting</p>
              </div>
              <button
                onClick={() => handleSyncSettingChange('autoSyncExpenses', !connection.syncSettings.autoSyncExpenses)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  connection.syncSettings.autoSyncExpenses ? 'bg-blue-600' : 'bg-gray-300'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                  connection.syncSettings.autoSyncExpenses && 'translate-x-5'
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-sync Payments</p>
                <p className="text-xs text-gray-500">Sync payment records both ways</p>
              </div>
              <button
                onClick={() => handleSyncSettingChange('autoSyncPayments', !connection.syncSettings.autoSyncPayments)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  connection.syncSettings.autoSyncPayments ? 'bg-blue-600' : 'bg-gray-300'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                  connection.syncSettings.autoSyncPayments && 'translate-x-5'
                )} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Sync Frequency</label>
              <select
                value={connection.syncSettings.syncFrequency}
                onChange={(e) => handleSyncSettingChange('syncFrequency', e.target.value)}
                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="manual">Manual Only</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* Sync Status */}
          {connection.lastSyncStatus && (
            <div className={cn(
              'mt-4 p-3 rounded-lg flex items-center gap-2',
              connection.lastSyncStatus === 'success' ? 'bg-green-50' :
              connection.lastSyncStatus === 'error' ? 'bg-red-50' :
              'bg-blue-50'
            )}>
              {connection.lastSyncStatus === 'success' && (
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              )}
              {connection.lastSyncStatus === 'error' && (
                <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
              )}
              {connection.lastSyncStatus === 'syncing' && (
                <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />
              )}
              <p className={cn(
                'text-sm',
                connection.lastSyncStatus === 'success' ? 'text-green-700' :
                connection.lastSyncStatus === 'error' ? 'text-red-700' :
                'text-blue-700'
              )}>
                {connection.lastSyncStatus === 'success' && 'Last sync completed successfully'}
                {connection.lastSyncStatus === 'error' && (connection.lastSyncError || 'Sync failed')}
                {connection.lastSyncStatus === 'syncing' && 'Sync in progress...'}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Account Mapping */}
      {isConnected && connection && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowsRightLeftIcon className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Chart of Accounts Mapping</h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMappingForm(!showMappingForm)}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Mapping
            </Button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Map ContractorOS categories to your {connection.provider === 'quickbooks' ? 'QuickBooks' : 'Xero'} chart of accounts.
          </p>

          {/* Add mapping form */}
          {showMappingForm && (
            <div className="p-4 bg-gray-50 rounded-lg mb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Source Category</label>
                  <select
                    value={newMapping.sourceValue}
                    onChange={(e) => setNewMapping({ ...newMapping, sourceValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select category...</option>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end justify-center">
                  <ArrowsRightLeftIcon className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {connection.provider === 'quickbooks' ? 'QuickBooks' : 'Xero'} Account
                  </label>
                  <select
                    value={newMapping.targetAccountId}
                    onChange={(e) => setNewMapping({ ...newMapping, targetAccountId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select account...</option>
                    {SAMPLE_QB_ACCOUNTS.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.number} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowMappingForm(false)}>Cancel</Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleAddMapping}
                  disabled={!newMapping.sourceValue || !newMapping.targetAccountId}
                >
                  Add Mapping
                </Button>
              </div>
            </div>
          )}

          {/* Existing mappings */}
          {mappingRules.length === 0 ? (
            <p className="text-sm text-gray-400 italic py-4 text-center">
              No account mappings configured. Add mappings to control which accounts transactions sync to.
            </p>
          ) : (
            <div className="space-y-2">
              {mappingRules.map((rule) => {
                const catLabel = EXPENSE_CATEGORIES.find(c => c.value === rule.sourceValue)?.label || rule.sourceValue;
                return (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">{catLabel}</span>
                      <ArrowsRightLeftIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{rule.targetAccountName}</span>
                    </div>
                    <button
                      onClick={() => removeMappingRule(rule.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Connect Modal */}
      {showConnectModal && connectingProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connect {connectingProvider === 'quickbooks' ? 'QuickBooks Online' : 'Xero'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              In production, this would redirect you to {connectingProvider === 'quickbooks' ? "Intuit's" : "Xero's"} OAuth login.
              For now, clicking Connect will simulate the connection.
            </p>

            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <p className="text-sm text-blue-700">
                {connectingProvider === 'quickbooks'
                  ? 'QuickBooks Online integration enables two-way sync of invoices, expenses, and payments. Your chart of accounts will be imported automatically.'
                  : 'Xero integration enables syncing invoices and expenses. Chart of accounts will be imported for mapping.'}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowConnectModal(false); setConnectingProvider(null); }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmConnect}>
                Connect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
