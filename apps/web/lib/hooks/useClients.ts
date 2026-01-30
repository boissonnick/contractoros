/**
 * useClients Hook
 * FEAT-L4: Client Management Module
 * Provides client data management with real-time updates
 *
 * REFACTORED: Now uses shared utilities:
 * - convertTimestamps from lib/firebase/timestamp-converter.ts
 * - useFirestoreCollection from lib/hooks/useFirestoreCollection.ts
 * - useFirestoreCrud from lib/hooks/useFirestoreCrud.ts
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { convertTimestamps, DATE_FIELDS } from '@/lib/firebase/timestamp-converter';
import { useFirestoreCollection, createConverter } from '@/lib/hooks/useFirestoreCollection';
import { useFirestoreCrud } from '@/lib/hooks/useFirestoreCrud';
import {
  Client,
  ClientStatus,
  ClientSource,
  ClientNote,
  ClientFinancials,
  ClientCommunicationLog,
  Project,
  Invoice,
} from '@/types';

// Collection paths
const getClientsCollectionPath = (orgId: string) => `organizations/${orgId}/clients`;
const COMMUNICATION_LOG_COLLECTION = 'clientCommunicationLogs';

// Date fields for Client entity
const CLIENT_DATE_FIELDS = ['createdAt', 'updatedAt', 'firstContactDate', 'lastContactDate'] as const;

// Converter for Client documents
const clientConverter = createConverter<Client>((id, data) => ({
  id,
  ...convertTimestamps(data as Record<string, unknown>, CLIENT_DATE_FIELDS),
} as Client));

// ============================================
// useClients - Main clients list hook (REFACTORED)
// ============================================

interface UseClientsOptions {
  orgId: string;
  status?: ClientStatus;
  search?: string;
}

interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useClients({ orgId, status, search }: UseClientsOptions): UseClientsReturn {
  // Build constraints based on filters
  const constraints = useMemo(() => {
    const c: QueryConstraint[] = [orderBy('displayName', 'asc')];
    if (status) {
      c.unshift(where('status', '==', status));
    }
    return c;
  }, [status]);

  // Use shared collection hook
  const { items, loading, error, refetch } = useFirestoreCollection<Client>({
    path: getClientsCollectionPath(orgId),
    constraints,
    converter: clientConverter,
    enabled: !!orgId,
  });

  // Client-side search filtering (keeps existing behavior)
  const filteredClients = useMemo(() => {
    if (!search) return items;

    const searchLower = search.toLowerCase();
    return items.filter(
      (client) =>
        client.displayName.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone?.includes(search) ||
        client.companyName?.toLowerCase().includes(searchLower)
    );
  }, [items, search]);

  return {
    clients: filteredClients,
    loading,
    error,
    refresh: refetch,
  };
}

// ============================================
// useClient - Single client hook (REFACTORED)
// ============================================

interface UseClientReturn {
  client: Client | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  updateClient: (updates: Partial<Client>) => Promise<void>;
  deleteClient: () => Promise<void>;
  addNote: (note: Omit<ClientNote, 'id' | 'createdAt'>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
}

export function useClient(clientId: string | undefined, orgId: string): UseClientReturn {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Use shared CRUD hook for operations
  const { update, remove } = useFirestoreCrud<Client>(
    getClientsCollectionPath(orgId),
    { entityName: 'Client', showToast: false } // We handle toasts manually for better UX
  );

  useEffect(() => {
    if (!clientId || !orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, getClientsCollectionPath(orgId), clientId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setClient(null);
          setLoading(false);
          return;
        }

        setClient(clientConverter(snapshot.id, snapshot.data()));
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching client:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clientId, orgId, refreshKey]);

  const updateClient = useCallback(
    async (updates: Partial<Client>) => {
      if (!clientId || !orgId) throw new Error('Client ID and Org ID required');
      await update(clientId, updates);
    },
    [clientId, orgId, update]
  );

  const deleteClient = useCallback(async () => {
    if (!clientId || !orgId) throw new Error('Client ID and Org ID required');
    await remove(clientId);
  }, [clientId, orgId, remove]);

  const addNote = useCallback(
    async (note: Omit<ClientNote, 'id' | 'createdAt'>) => {
      if (!clientId || !client || !orgId) throw new Error('Client and Org required');

      const newNote: ClientNote = {
        ...note,
        id: `note_${Date.now()}`,
        createdAt: new Date(),
      };

      await updateDoc(doc(db, getClientsCollectionPath(orgId), clientId), {
        notes: [...(client.notes || []), newNote],
        updatedAt: Timestamp.now(),
      });
    },
    [clientId, client, orgId]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!clientId || !client || !orgId) throw new Error('Client and Org required');

      await updateDoc(doc(db, getClientsCollectionPath(orgId), clientId), {
        notes: (client.notes || []).filter((n) => n.id !== noteId),
        updatedAt: Timestamp.now(),
      });
    },
    [clientId, client, orgId]
  );

  return {
    client,
    loading,
    error,
    refresh,
    updateClient,
    deleteClient,
    addNote,
    deleteNote,
  };
}

// ============================================
// useClientProjects - Client's projects (REFACTORED)
// ============================================

const projectConverter = createConverter<Project>((id, data) => ({
  id,
  ...convertTimestamps(data as Record<string, unknown>, DATE_FIELDS.project),
} as Project));

export function useClientProjects(clientId: string | undefined, orgId: string) {
  const constraints = useMemo(() => [
    where('clientId', '==', clientId),
    where('orgId', '==', orgId),
    orderBy('createdAt', 'desc'),
  ], [clientId, orgId]);

  const { items: projects, loading } = useFirestoreCollection<Project>({
    path: 'projects',
    constraints,
    converter: projectConverter,
    enabled: !!clientId && !!orgId,
  });

  return { projects, loading };
}

// ============================================
// useClientCommunicationLog (REFACTORED)
// ============================================

const communicationLogConverter = createConverter<ClientCommunicationLog>((id, data) => ({
  id,
  ...convertTimestamps(data as Record<string, unknown>, ['createdAt']),
} as ClientCommunicationLog));

export function useClientCommunicationLog(clientId: string | undefined, orgId: string) {
  const constraints = useMemo(() => [
    where('clientId', '==', clientId),
    where('orgId', '==', orgId),
    orderBy('createdAt', 'desc'),
  ], [clientId, orgId]);

  const { items: logs, loading } = useFirestoreCollection<ClientCommunicationLog>({
    path: COMMUNICATION_LOG_COLLECTION,
    constraints,
    converter: communicationLogConverter,
    enabled: !!clientId && !!orgId,
  });

  // Use shared CRUD for adding logs
  const { create } = useFirestoreCrud<ClientCommunicationLog>(
    COMMUNICATION_LOG_COLLECTION,
    { entityName: 'Communication log', showToast: false }
  );

  const addLog = useCallback(
    async (log: Omit<ClientCommunicationLog, 'id' | 'createdAt'>) => {
      await create(log as Omit<ClientCommunicationLog, 'id' | 'createdAt' | 'updatedAt'>);
    },
    [create]
  );

  return { logs, loading, addLog };
}

// ============================================
// useClientStats - Aggregate stats (unchanged, already efficient)
// ============================================

export function useClientStats(orgId: string) {
  const { clients, loading } = useClients({ orgId });

  const stats = useMemo(() => {
    if (!clients.length) {
      return {
        total: 0,
        active: 0,
        past: 0,
        potential: 0,
        totalLifetimeValue: 0,
        averageProjectValue: 0,
        totalOutstanding: 0,
      };
    }

    return {
      total: clients.length,
      active: clients.filter((c) => c.status === 'active').length,
      past: clients.filter((c) => c.status === 'past').length,
      potential: clients.filter((c) => c.status === 'potential').length,
      totalLifetimeValue: clients.reduce((sum, c) => sum + (c.financials?.lifetimeValue || 0), 0),
      averageProjectValue:
        clients.reduce((sum, c) => sum + (c.financials?.averageProjectValue || 0), 0) /
        clients.length,
      totalOutstanding: clients.reduce(
        (sum, c) => sum + (c.financials?.outstandingBalance || 0),
        0
      ),
    };
  }, [clients]);

  return { stats, loading };
}

// ============================================
// Client CRUD Operations (REFACTORED)
// ============================================

export async function createClient(
  clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'financials' | 'projectIds' | 'notes'>,
  orgId: string
): Promise<string> {
  if (!orgId) throw new Error('Organization ID required');

  const client: Omit<Client, 'id'> = {
    ...clientData,
    orgId,
    displayName: clientData.companyName || `${clientData.firstName} ${clientData.lastName}`.trim(),
    notes: [],
    projectIds: [],
    financials: {
      lifetimeValue: 0,
      totalProjects: 0,
      completedProjects: 0,
      activeProjects: 0,
      outstandingBalance: 0,
      averageProjectValue: 0,
    },
    createdAt: new Date(),
  };

  const docRef = await addDoc(collection(db, getClientsCollectionPath(orgId)), {
    ...client,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

export async function updateClientFinancials(
  clientId: string,
  orgId: string
): Promise<void> {
  if (!orgId) throw new Error('Organization ID required');

  // Fetch all projects for this client
  const projectsQuery = query(
    collection(db, 'projects'),
    where('clientId', '==', clientId),
    where('orgId', '==', orgId)
  );
  const projectsSnap = await getDocs(projectsQuery);
  const projects = projectsSnap.docs.map((d) => d.data());

  // Fetch all invoices for this client (using org-scoped collection)
  const invoicesQuery = query(
    collection(db, `organizations/${orgId}/invoices`),
    where('clientId', '==', clientId)
  );
  const invoicesSnap = await getDocs(invoicesQuery);
  const invoices = invoicesSnap.docs.map((d) => d.data()) as Invoice[];

  // Calculate financials
  const totalProjects = projects.length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;

  const lifetimeValue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amountPaid, 0);

  const outstandingBalance = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'void')
    .reduce((sum, i) => sum + i.amountDue, 0);

  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const lastPayment = paidInvoices.sort(
    (a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime()
  )[0];

  const financials: ClientFinancials = {
    lifetimeValue,
    totalProjects,
    completedProjects,
    activeProjects,
    outstandingBalance,
    lastPaymentDate: lastPayment?.paidAt,
    lastPaymentAmount: lastPayment?.amountPaid,
    averageProjectValue: totalProjects > 0 ? lifetimeValue / totalProjects : 0,
  };

  await updateDoc(doc(db, getClientsCollectionPath(orgId), clientId), {
    financials,
    projectIds: projectsSnap.docs.map((d) => d.id),
    updatedAt: Timestamp.now(),
  });
}

// ============================================
// Client Source Helpers (unchanged)
// ============================================

export const CLIENT_SOURCE_LABELS: Record<ClientSource, string> = {
  referral: 'Referral',
  google: 'Google Search',
  social_media: 'Social Media',
  yard_sign: 'Yard Sign',
  vehicle_wrap: 'Vehicle Wrap',
  website: 'Website',
  repeat: 'Repeat Customer',
  other: 'Other',
};

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Active',
  past: 'Past',
  potential: 'Potential',
  inactive: 'Inactive',
};
