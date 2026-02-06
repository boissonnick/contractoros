"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Badge, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useAccountingConnection } from '@/lib/hooks/useAccountingConnection';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  LinkIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CreditCardIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { QuickBooksLogo } from '@/components/integrations';
import QBOAccountMapping from '@/components/settings/QBOAccountMapping';
import QBOSyncStatus from '@/components/settings/QBOSyncStatus';
import { logger } from '@/lib/utils/logger';

interface QuickBooksConnection {
  provider: 'quickbooks';
  isConnected: boolean;
  companyId?: string;
  companyName?: string;
  tokenExpiresAt?: Date;
  lastSyncAt?: Date;
  lastSyncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncError?: string;
  syncSettings: {
    autoSyncInvoices: boolean;
    autoSyncExpenses: boolean;
    autoSyncPayments: boolean;
    autoSyncCustomers: boolean;
    syncFrequency: 'manual' | 'daily' | 'weekly';
  };
  createdAt: Date;
  updatedAt?: Date;
}

interface SyncLog {
  id: string;
  action: string;
  status: 'started' | 'completed' | 'failed';
  itemsSynced: number;
  itemsFailed: number;
  errors: string[];
  startedAt: Date;
  completedAt?: Date;
}

export default function QuickBooksSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const { mappingRules, addMappingRule, removeMappingRule } = useAccountingConnection();
  const [connection, setConnection] = useState<QuickBooksConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [_syncLogs, _setSyncLogs] = useState<SyncLog[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check for OAuth callback messages
  useEffect(() => {
    const connected = searchParams.get('qbo_connected');
    const company = searchParams.get('qbo_company');
    const error = searchParams.get('qbo_error');

    if (connected === 'true' && company) {
      setToast({ type: 'success', message: `Connected to ${company}` });
      // Clear URL params
      router.replace('/dashboard/settings/integrations/quickbooks');
    } else if (error) {
      setToast({ type: 'error', message: error });
      router.replace('/dashboard/settings/integrations/quickbooks');
    }
  }, [searchParams, router]);

  // Subscribe to connection status
  useEffect(() => {
    if (!profile?.orgId) return;

    const connectionRef = doc(
      db,
      'organizations',
      profile!.orgId,
      'accountingConnections',
      'quickbooks'
    );

    const unsubscribe = onSnapshot(
      connectionRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setConnection({
            ...data,
            tokenExpiresAt: data.tokenExpiresAt?.toDate(),
            lastSyncAt: data.lastSyncAt?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as QuickBooksConnection);
        } else {
          setConnection(null);
        }
        setLoading(false);
      },
      (error) => {
        logger.error('Error fetching QBO connection', { error: error, page: 'dashboard-settings-integrations-quickbooks' });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile]);

  // Handle connect
  const handleConnect = () => {
    const returnUrl = encodeURIComponent('/dashboard/settings/integrations/quickbooks');
    window.location.href = `/api/integrations/quickbooks/connect?returnUrl=${returnUrl}`;
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect QuickBooks? This will stop all syncing.')) {
      return;
    }

    try {
      const response = await fetch('/api/integrations/quickbooks/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      setToast({ type: 'success', message: 'QuickBooks disconnected' });
    } catch {
      setToast({ type: 'error', message: 'Failed to disconnect QuickBooks' });
    }
  };

  // Handle sync
  const handleSync = async (entityType: 'customers' | 'invoices' | 'payments' | 'expenses' | 'all') => {
    setSyncing(entityType);
    try {
      // Map to API format
      const body = entityType === 'all'
        ? { action: 'full' }
        : { action: 'push', entityType: entityType === 'customers' ? 'clients' : entityType };

      const response = await fetch('/api/integrations/quickbooks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      // Format success message based on response structure
      let message = 'Sync complete';
      if (data.results) {
        // Full sync response
        const { customers, invoices } = data.results;
        message = `Sync complete: ${customers?.push?.created || 0} customers, ${invoices?.push?.created || 0} invoices created`;
      } else if (data.created !== undefined || data.updated !== undefined) {
        message = `Sync complete: ${data.created || 0} created, ${data.updated || 0} updated`;
      }

      setToast({ type: 'success', message });
    } catch (error) {
      setToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Sync failed',
      });
    } finally {
      setSyncing(null);
    }
  };

  // Update sync settings
  const updateSyncSettings = useCallback(
    async (settings: Partial<QuickBooksConnection['syncSettings']>) => {
      if (!profile?.orgId || !connection) return;

      try {
        const connectionRef = doc(
          db,
          'organizations',
          profile!.orgId,
          'accountingConnections',
          'quickbooks'
        );

        await updateDoc(connectionRef, {
          syncSettings: {
            ...connection.syncSettings,
            ...settings,
          },
          updatedAt: Timestamp.now(),
        });
      } catch (error) {
        logger.error('Failed to update sync settings', { error: error, page: 'dashboard-settings-integrations-quickbooks' });
        setToast({ type: 'error', message: 'Failed to update settings' });
      }
    },
    [profile, connection]
  );

  // Clear toast after delay
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const getStatusBadge = () => {
    if (!connection?.isConnected) {
      return <Badge className="bg-gray-100 text-gray-600">Not Connected</Badge>;
    }

    switch (connection.lastSyncStatus) {
      case 'syncing':
        return <Badge className="bg-blue-100 text-blue-700">Syncing...</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-700">Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700">Error</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-700">Connected</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-600" />
            )}
            <span className={toast.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {toast.message}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={() => router.push('/dashboard/settings/integrations')}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
            <QuickBooksLogo width={60} height={18} />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-gray-900">QuickBooks Online</h1>
            <p className="text-xs md:text-sm text-gray-500">Sync invoices, payments & customers</p>
          </div>
        </div>
      </div>

      {/* Connection Status Card */}
      <Card className="p-4 md:p-6">
        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                connection?.isConnected ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              {connection?.isConnected ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              ) : (
                <LinkIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-semibold text-gray-900">Status</h2>
                {getStatusBadge()}
              </div>
              {connection?.isConnected ? (
                <p className="text-sm text-gray-600 truncate">{connection.companyName}</p>
              ) : (
                <p className="text-sm text-gray-500">Not connected</p>
              )}
            </div>
          </div>

          {connection?.isConnected && (
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Last Sync:</span> {formatDate(connection.lastSyncAt)}</p>
              {connection.lastSyncError && (
                <p className="text-red-600"><span className="font-medium">Error:</span> {connection.lastSyncError}</p>
              )}
            </div>
          )}

          {connection?.isConnected ? (
            <Button variant="outline" onClick={handleDisconnect} className="w-full min-h-[44px]">
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleConnect} className="w-full min-h-[44px]">
              <LinkIcon className="w-4 h-4 mr-2" />
              Connect QuickBooks
            </Button>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                connection?.isConnected ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              {connection?.isConnected ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              ) : (
                <LinkIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-gray-900">Connection Status</h2>
                {getStatusBadge()}
              </div>
              {connection?.isConnected ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Company:</span> {connection.companyName}
                  </p>
                  <p>
                    <span className="font-medium">Last Sync:</span> {formatDate(connection.lastSyncAt)}
                  </p>
                  {connection.lastSyncError && (
                    <p className="text-red-600">
                      <span className="font-medium">Error:</span> {connection.lastSyncError}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Connect your QuickBooks Online account to sync financial data.
                </p>
              )}
            </div>
          </div>
          <div>
            {connection?.isConnected ? (
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            ) : (
              <Button onClick={handleConnect}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Connect QuickBooks
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Only show settings if connected */}
      {connection?.isConnected && (
        <>
          {/* Sync Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cog6ToothIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Sync Settings</h2>
            </div>

            <div className="space-y-4">
              {/* Auto-sync toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <UserGroupIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Auto-sync Customers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={connection.syncSettings?.autoSyncCustomers ?? false}
                    onChange={(e) => updateSyncSettings({ autoSyncCustomers: e.target.checked })}
                    className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Auto-sync Invoices</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={connection.syncSettings?.autoSyncInvoices ?? true}
                    onChange={(e) => updateSyncSettings({ autoSyncInvoices: e.target.checked })}
                    className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <CreditCardIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Auto-sync Payments</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={connection.syncSettings?.autoSyncPayments ?? true}
                    onChange={(e) => updateSyncSettings({ autoSyncPayments: e.target.checked })}
                    className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <BanknotesIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Auto-sync Expenses</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={connection.syncSettings?.autoSyncExpenses ?? false}
                    onChange={(e) => updateSyncSettings({ autoSyncExpenses: e.target.checked })}
                    className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                  />
                </label>
              </div>

              {/* Sync frequency */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sync Frequency
                </label>
                <select
                  value={connection.syncSettings?.syncFrequency ?? 'manual'}
                  onChange={(e) =>
                    updateSyncSettings({
                      syncFrequency: e.target.value as 'manual' | 'daily' | 'weekly',
                    })
                  }
                  className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-primary focus:border-brand-primary"
                >
                  <option value="manual">Manual only</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  How often to automatically sync data with QuickBooks
                </p>
              </div>
            </div>
          </Card>

          {/* Manual Sync */}
          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowPathIcon className="w-5 h-5 text-gray-400" />
              <h2 className="text-base md:text-lg font-semibold text-gray-900">Manual Sync</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Trigger a manual sync for specific data types.
            </p>

            {/* Mobile: Grid layout */}
            <div className="md:hidden grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSync('customers')}
                disabled={syncing !== null}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 rounded-xl min-h-[80px] active:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {syncing === 'customers' ? (
                  <ArrowPathIcon className="w-6 h-6 text-gray-600 animate-spin" />
                ) : (
                  <UserGroupIcon className="w-6 h-6 text-gray-600" />
                )}
                <span className="text-sm font-medium text-gray-700">Customers</span>
              </button>

              <button
                onClick={() => handleSync('invoices')}
                disabled={syncing !== null}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 rounded-xl min-h-[80px] active:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {syncing === 'invoices' ? (
                  <ArrowPathIcon className="w-6 h-6 text-gray-600 animate-spin" />
                ) : (
                  <DocumentTextIcon className="w-6 h-6 text-gray-600" />
                )}
                <span className="text-sm font-medium text-gray-700">Invoices</span>
              </button>

              <button
                onClick={() => handleSync('payments')}
                disabled={syncing !== null}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 rounded-xl min-h-[80px] active:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {syncing === 'payments' ? (
                  <ArrowPathIcon className="w-6 h-6 text-gray-600 animate-spin" />
                ) : (
                  <CreditCardIcon className="w-6 h-6 text-gray-600" />
                )}
                <span className="text-sm font-medium text-gray-700">Payments</span>
              </button>

              <button
                onClick={() => handleSync('expenses')}
                disabled={syncing !== null}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 rounded-xl min-h-[80px] active:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {syncing === 'expenses' ? (
                  <ArrowPathIcon className="w-6 h-6 text-gray-600 animate-spin" />
                ) : (
                  <BanknotesIcon className="w-6 h-6 text-gray-600" />
                )}
                <span className="text-sm font-medium text-gray-700">Expenses</span>
              </button>

              <button
                onClick={() => handleSync('all')}
                disabled={syncing !== null}
                className="col-span-2 flex items-center justify-center gap-2 p-4 bg-brand-primary text-white rounded-xl min-h-[48px] hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {syncing === 'all' ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowPathIcon className="w-5 h-5" />
                )}
                <span className="font-medium">Sync All</span>
              </button>
            </div>

            {/* Desktop: Flex layout */}
            <div className="hidden md:flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync('customers')}
                disabled={syncing !== null}
              >
                {syncing === 'customers' ? (
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserGroupIcon className="w-4 h-4 mr-2" />
                )}
                Sync Customers
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync('invoices')}
                disabled={syncing !== null}
              >
                {syncing === 'invoices' ? (
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                )}
                Sync Invoices
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync('payments')}
                disabled={syncing !== null}
              >
                {syncing === 'payments' ? (
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CreditCardIcon className="w-4 h-4 mr-2" />
                )}
                Sync Payments
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync('expenses')}
                disabled={syncing !== null}
              >
                {syncing === 'expenses' ? (
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <BanknotesIcon className="w-4 h-4 mr-2" />
                )}
                Sync Expenses
              </Button>

              <Button
                onClick={() => handleSync('all')}
                disabled={syncing !== null}
              >
                {syncing === 'all' ? (
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                )}
                Sync All
              </Button>
            </div>
          </Card>

          {/* Account Mapping */}
          <QBOAccountMapping
            mappingRules={mappingRules}
            onAddRule={addMappingRule}
            onRemoveRule={removeMappingRule}
          />

          {/* Sync History & Status */}
          <QBOSyncStatus />

          {/* Help Section */}
          <Card className="p-6 bg-blue-50 border-blue-100">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900">How Syncing Works</h3>
                <ul className="mt-2 text-sm text-blue-800 space-y-1">
                  <li>
                    <strong>Customers:</strong> ContractorOS clients are pushed to QuickBooks as customers
                  </li>
                  <li>
                    <strong>Invoices:</strong> Sent invoices are automatically synced to QuickBooks
                  </li>
                  <li>
                    <strong>Payments:</strong> Payments recorded in QuickBooks are pulled back to update invoice status
                  </li>
                  <li>
                    <strong>Expenses:</strong> Approved expenses can be synced to QuickBooks as purchases
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
