"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import {
  AccountingConnection,
  AccountingProvider,
  AccountingSyncSettings,
  AccountingSyncStatus,
  AccountMappingRule,
} from '@/types';
import { useAuth } from '@/lib/auth';
import { logger } from '@/lib/utils/logger';

const DEFAULT_SYNC_SETTINGS: AccountingSyncSettings = {
  autoSyncInvoices: false,
  autoSyncExpenses: false,
  autoSyncPayments: false,
  syncFrequency: 'manual',
};

function fromFirestore(id: string, data: Record<string, unknown>): AccountingConnection {
  return {
    id,
    orgId: data.orgId as string,
    provider: data.provider as AccountingProvider,
    isConnected: data.isConnected as boolean,
    companyName: data.companyName as string | undefined,
    companyId: data.companyId as string | undefined,
    lastSyncAt: data.lastSyncAt ? (data.lastSyncAt as Timestamp).toDate() : undefined,
    lastSyncStatus: data.lastSyncStatus as AccountingSyncStatus | undefined,
    lastSyncError: data.lastSyncError as string | undefined,
    syncSettings: (data.syncSettings as AccountingSyncSettings) || DEFAULT_SYNC_SETTINGS,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

export function useAccountingConnection() {
  const { profile } = useAuth();
  const [connection, setConnection] = useState<AccountingConnection | null>(null);
  const [mappingRules, setMappingRules] = useState<AccountMappingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen for accounting connection
  useEffect(() => {
    if (!profile?.orgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'accountingConnections'),
      where('orgId', '==', profile.orgId),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setConnection(null);
      } else {
        const doc = snapshot.docs[0];
        setConnection(fromFirestore(doc.id, doc.data() as Record<string, unknown>));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.orgId]);

  // Listen for mapping rules
  useEffect(() => {
    if (!profile?.orgId) return;

    const q = query(
      collection(db, 'accountMappingRules'),
      where('orgId', '==', profile.orgId),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMappingRules(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AccountMappingRule, 'id'>),
          createdAt: d.data().createdAt ? (d.data().createdAt as Timestamp).toDate() : new Date(),
        }))
      );
    });

    return () => unsubscribe();
  }, [profile?.orgId]);

  const connectProvider = useCallback(
    async (provider: AccountingProvider, companyName: string) => {
      if (!profile?.orgId) throw new Error('No organization');

      // If already connected, disconnect first
      if (connection) {
        await deleteDoc(doc(db, 'accountingConnections', connection.id));
      }

      await addDoc(collection(db, 'accountingConnections'), {
        orgId: profile.orgId,
        provider,
        isConnected: true,
        companyName,
        syncSettings: DEFAULT_SYNC_SETTINGS,
        createdAt: Timestamp.now(),
      });
    },
    [profile, connection]
  );

  const disconnectProvider = useCallback(async () => {
    if (!connection) return;
    await updateDoc(doc(db, 'accountingConnections', connection.id), {
      isConnected: false,
      updatedAt: Timestamp.now(),
    });
  }, [connection]);

  const updateSyncSettings = useCallback(
    async (settings: Partial<AccountingSyncSettings>) => {
      if (!connection) return;
      await updateDoc(doc(db, 'accountingConnections', connection.id), {
        syncSettings: { ...connection.syncSettings, ...settings },
        updatedAt: Timestamp.now(),
      });
    },
    [connection]
  );

  const triggerSync = useCallback(async () => {
    if (!connection) return;
    await updateDoc(doc(db, 'accountingConnections', connection.id), {
      lastSyncStatus: 'syncing' as AccountingSyncStatus,
      updatedAt: Timestamp.now(),
    });

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/integrations/quickbooks/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'full' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Sync failed');
      }

      await updateDoc(doc(db, 'accountingConnections', connection.id), {
        lastSyncAt: Timestamp.now(),
        lastSyncStatus: 'success' as AccountingSyncStatus,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      logger.error('Sync error', { error: err, hook: 'useAccountingConnection' });
      try {
        await updateDoc(doc(db, 'accountingConnections', connection.id), {
          lastSyncStatus: 'error' as AccountingSyncStatus,
          lastSyncError: err instanceof Error ? err.message : 'Sync failed',
          updatedAt: Timestamp.now(),
        });
      } catch {
        // Connection may have changed
      }
    }
  }, [connection]);

  const addMappingRule = useCallback(
    async (rule: Omit<AccountMappingRule, 'id' | 'orgId' | 'createdAt'>) => {
      if (!profile?.orgId) throw new Error('No organization');
      await addDoc(collection(db, 'accountMappingRules'), {
        ...rule,
        orgId: profile.orgId,
        createdAt: Timestamp.now(),
      });
    },
    [profile]
  );

  const removeMappingRule = useCallback(async (ruleId: string) => {
    await deleteDoc(doc(db, 'accountMappingRules', ruleId));
  }, []);

  return {
    connection,
    mappingRules,
    loading,
    connectProvider,
    disconnectProvider,
    updateSyncSettings,
    triggerSync,
    addMappingRule,
    removeMappingRule,
  };
}
