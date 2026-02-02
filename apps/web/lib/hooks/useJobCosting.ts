'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import {
  JobCostEntry,
  ProjectProfitability,
  CostCategory,
  JobCostSource,
  JobCostAlert,
  COST_CATEGORY_LABELS,
} from '@/types';

interface UseJobCostsOptions {
  projectId: string;
  category?: CostCategory;
  source?: JobCostSource;
  phaseId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface UseJobCostsReturn {
  costs: JobCostEntry[];
  loading: boolean;
  error: string | null;

  // CRUD operations
  createCost: (cost: Omit<JobCostEntry, 'id' | 'orgId' | 'createdAt' | 'createdBy'>) => Promise<string>;
  updateCost: (costId: string, updates: Partial<JobCostEntry>) => Promise<void>;
  deleteCost: (costId: string) => Promise<void>;

  // Approval
  approveCost: (costId: string) => Promise<void>;

  // Aggregations
  totalCosts: number;
  costsByCategory: Record<CostCategory, number>;

  refresh: () => void;
}

// Helper to convert Firestore timestamps
function convertTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const converted = { ...data };
  const dateFields = ['date', 'periodStart', 'periodEnd', 'createdAt', 'updatedAt', 'approvedAt'];

  for (const field of dateFields) {
    if (converted[field] instanceof Timestamp) {
      converted[field] = (converted[field] as Timestamp).toDate();
    }
  }

  return converted;
}

/**
 * Hook for managing job cost entries for a project
 */
export function useJobCosts(options: UseJobCostsOptions): UseJobCostsReturn {
  const { profile } = useAuth();
  const [costs, setCosts] = useState<JobCostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const orgId = profile?.orgId;
  const currentUserId = profile?.uid;
  const currentUserName = profile?.displayName || 'Unknown';
  const isAdmin = profile?.role === 'OWNER' || profile?.role === 'PM';

  const { projectId, category, source, phaseId, startDate, endDate } = options;

  // Fetch costs with real-time updates
  useEffect(() => {
    if (!orgId || !projectId) {
      setLoading(false);
      return;
    }

    const costsRef = collection(db, `organizations/${orgId}/jobCosts`);
    const constraints = [
      where('projectId', '==', projectId),
      orderBy('date', 'desc'),
    ];

    const q = query(costsRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let costsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as JobCostEntry[];

        // Client-side filtering for optional filters
        if (category) {
          costsData = costsData.filter((c) => c.category === category);
        }
        if (source) {
          costsData = costsData.filter((c) => c.source === source);
        }
        if (phaseId) {
          costsData = costsData.filter((c) => c.phaseId === phaseId);
        }
        if (startDate) {
          costsData = costsData.filter((c) => c.date >= startDate);
        }
        if (endDate) {
          costsData = costsData.filter((c) => c.date <= endDate);
        }

        setCosts(costsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching job costs:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, projectId, category, source, phaseId, startDate, endDate, refreshTrigger]);

  // Create cost entry
  const createCost = useCallback(
    async (cost: Omit<JobCostEntry, 'id' | 'orgId' | 'createdAt' | 'createdBy'>): Promise<string> => {
      if (!orgId || !currentUserId) throw new Error('Not authenticated');

      const costsRef = collection(db, `organizations/${orgId}/jobCosts`);
      const docRef = await addDoc(costsRef, {
        ...cost,
        orgId,
        createdAt: Timestamp.now(),
        createdBy: currentUserId,
      });

      return docRef.id;
    },
    [orgId, currentUserId]
  );

  // Update cost entry
  const updateCost = useCallback(
    async (costId: string, updates: Partial<JobCostEntry>): Promise<void> => {
      if (!orgId || !isAdmin) throw new Error('Not authorized');

      const costRef = doc(db, `organizations/${orgId}/jobCosts/${costId}`);
      await updateDoc(costRef, {
        ...updates,
        updatedAt: Timestamp.now(),
        updatedBy: currentUserId,
      });
    },
    [orgId, isAdmin, currentUserId]
  );

  // Delete cost entry
  const deleteCost = useCallback(
    async (costId: string): Promise<void> => {
      if (!orgId || !isAdmin) throw new Error('Not authorized');

      const costRef = doc(db, `organizations/${orgId}/jobCosts/${costId}`);
      await deleteDoc(costRef);
    },
    [orgId, isAdmin]
  );

  // Approve cost entry
  const approveCost = useCallback(
    async (costId: string): Promise<void> => {
      if (!orgId || !isAdmin) throw new Error('Not authorized');

      const costRef = doc(db, `organizations/${orgId}/jobCosts/${costId}`);
      await updateDoc(costRef, {
        isApproved: true,
        approvedBy: currentUserId,
        approvedAt: Timestamp.now(),
      });
    },
    [orgId, isAdmin, currentUserId]
  );

  // Calculate aggregations
  const totalCosts = useMemo(() => {
    return costs.reduce((sum, cost) => sum + cost.amount, 0);
  }, [costs]);

  const costsByCategory = useMemo(() => {
    const categories: Record<CostCategory, number> = {
      labor_internal: 0,
      labor_subcontractor: 0,
      materials: 0,
      equipment_rental: 0,
      permits_fees: 0,
      overhead: 0,
      other: 0,
    };

    for (const cost of costs) {
      categories[cost.category] += cost.amount;
    }

    return categories;
  }, [costs]);

  const refresh = useCallback(() => {
    setRefreshTrigger((t) => t + 1);
  }, []);

  return {
    costs,
    loading,
    error,
    createCost,
    updateCost,
    deleteCost,
    approveCost,
    totalCosts,
    costsByCategory,
    refresh,
  };
}

interface UseProjectProfitabilityReturn {
  profitability: ProjectProfitability | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  recalculate: () => Promise<void>;
}

/**
 * Hook for fetching project profitability data
 */
export function useProjectProfitability(projectId: string): UseProjectProfitabilityReturn {
  const { profile } = useAuth();
  const [profitability, setProfitability] = useState<ProjectProfitability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const orgId = profile?.orgId;

  useEffect(() => {
    if (!orgId || !projectId) {
      setLoading(false);
      return;
    }

    const profitRef = doc(db, `organizations/${orgId}/projectProfitability/${projectId}`);

    const unsubscribe = onSnapshot(
      profitRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = convertTimestamps(snapshot.data()) as unknown as ProjectProfitability;
          setProfitability({ ...data, projectId: snapshot.id });
        } else {
          setProfitability(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching profitability:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, projectId, refreshTrigger]);

  const refresh = useCallback(() => {
    setRefreshTrigger((t) => t + 1);
  }, []);

  // Recalculate profitability from job costs
  const recalculate = useCallback(async () => {
    if (!orgId || !projectId) return;

    // This would typically be done by a Cloud Function, but we can do a simple calculation here
    const costsRef = collection(db, `organizations/${orgId}/jobCosts`);
    const q = query(costsRef, where('projectId', '==', projectId));

    // Note: In production, this should be a Cloud Function that runs server-side
    console.log('Profitability recalculation should be triggered via Cloud Function');
  }, [orgId, projectId]);

  return {
    profitability,
    loading,
    error,
    refresh,
    recalculate,
  };
}

interface UseJobCostAlertsReturn {
  alerts: JobCostAlert[];
  loading: boolean;
  error: string | null;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  unacknowledgedCount: number;
}

/**
 * Hook for managing job cost alerts
 */
export function useJobCostAlerts(projectId?: string): UseJobCostAlertsReturn {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<JobCostAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgId = profile?.orgId;
  const currentUserId = profile?.uid;
  const isAdmin = profile?.role === 'OWNER' || profile?.role === 'PM';

  useEffect(() => {
    if (!orgId || !isAdmin) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const alertsRef = collection(db, `organizations/${orgId}/jobCostAlerts`);

    const constraints = projectId
      ? [where('projectId', '==', projectId), orderBy('createdAt', 'desc')]
      : [orderBy('createdAt', 'desc')];

    const q = query(alertsRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const alertsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...convertTimestamps(doc.data()),
        })) as JobCostAlert[];

        setAlerts(alertsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching job cost alerts:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, projectId, isAdmin]);

  const acknowledgeAlert = useCallback(
    async (alertId: string): Promise<void> => {
      if (!orgId || !isAdmin || !currentUserId) throw new Error('Not authorized');

      const alertRef = doc(db, `organizations/${orgId}/jobCostAlerts/${alertId}`);
      await updateDoc(alertRef, {
        isAcknowledged: true,
        acknowledgedBy: currentUserId,
        acknowledgedAt: Timestamp.now(),
      });
    },
    [orgId, isAdmin, currentUserId]
  );

  const unacknowledgedCount = useMemo(() => {
    return alerts.filter((a) => !a.isAcknowledged).length;
  }, [alerts]);

  return {
    alerts,
    loading,
    error,
    acknowledgeAlert,
    unacknowledgedCount,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Get category color from labels
 */
export function getCategoryColor(category: CostCategory): string {
  const colors: Record<string, string> = {
    blue: '#3B82F6',
    purple: '#8B5CF6',
    amber: '#F59E0B',
    orange: '#F97316',
    green: '#10B981',
    gray: '#6B7280',
    slate: '#64748B',
  };

  const colorName = COST_CATEGORY_LABELS[category]?.color || 'gray';
  return colors[colorName] || colors.gray;
}
