/**
 * useClients Hook
 * FEAT-L4: Client Management Module
 * Provides client data management with real-time updates
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
  getDoc,
  getDocs,
  Timestamp,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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

// Clients are stored in organization subcollection for proper security isolation
// Path: organizations/{orgId}/clients/{clientId}
const getClientsCollectionPath = (orgId: string) => `organizations/${orgId}/clients`;
const COMMUNICATION_LOG_COLLECTION = 'clientCommunicationLogs';

// ============================================
// useClients - Main clients list hook
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
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let q = query(
      collection(db, getClientsCollectionPath(orgId)),
      orderBy('displayName', 'asc')
    );

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
          firstContactDate: doc.data().firstContactDate?.toDate?.() || doc.data().firstContactDate,
          lastContactDate: doc.data().lastContactDate?.toDate?.() || doc.data().lastContactDate,
        })) as Client[];

        // Client-side search filtering
        if (search) {
          const searchLower = search.toLowerCase();
          data = data.filter(
            (client) =>
              client.displayName.toLowerCase().includes(searchLower) ||
              client.email.toLowerCase().includes(searchLower) ||
              client.phone?.includes(search) ||
              client.companyName?.toLowerCase().includes(searchLower)
          );
        }

        setClients(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching clients:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, status, search, refreshKey]);

  return { clients, loading, error, refresh };
}

// ============================================
// useClient - Single client hook
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

        const data = snapshot.data();
        setClient({
          id: snapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          firstContactDate: data.firstContactDate?.toDate?.() || data.firstContactDate,
          lastContactDate: data.lastContactDate?.toDate?.() || data.lastContactDate,
        } as Client);
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

      await updateDoc(doc(db, getClientsCollectionPath(orgId), clientId), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    },
    [clientId, orgId]
  );

  const deleteClient = useCallback(async () => {
    if (!clientId || !orgId) throw new Error('Client ID and Org ID required');
    await deleteDoc(doc(db, getClientsCollectionPath(orgId), clientId));
  }, [clientId, orgId]);

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
// useClientProjects - Client's projects
// ============================================

export function useClientProjects(clientId: string | undefined, orgId: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId || !orgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('clientId', '==', clientId),
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.(),
        updatedAt: doc.data().updatedAt?.toDate?.(),
        startDate: doc.data().startDate?.toDate?.(),
        estimatedEndDate: doc.data().estimatedEndDate?.toDate?.(),
        actualEndDate: doc.data().actualEndDate?.toDate?.(),
      })) as Project[];

      setProjects(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId, orgId]);

  return { projects, loading };
}

// ============================================
// useClientCommunicationLog
// ============================================

export function useClientCommunicationLog(clientId: string | undefined, orgId: string) {
  const [logs, setLogs] = useState<ClientCommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId || !orgId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, COMMUNICATION_LOG_COLLECTION),
      where('clientId', '==', clientId),
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.(),
      })) as ClientCommunicationLog[];

      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId, orgId]);

  const addLog = useCallback(
    async (log: Omit<ClientCommunicationLog, 'id' | 'createdAt'>) => {
      await addDoc(collection(db, COMMUNICATION_LOG_COLLECTION), {
        ...log,
        createdAt: Timestamp.now(),
      });
    },
    []
  );

  return { logs, loading, addLog };
}

// ============================================
// useClientStats - Aggregate stats
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
// Client CRUD Operations
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

  // Fetch all invoices for this client
  const invoicesQuery = query(
    collection(db, 'invoices'),
    where('clientId', '==', clientId),
    where('orgId', '==', orgId)
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
// Client Source Helpers
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
