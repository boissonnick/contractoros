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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { convertTimestamps } from '@/lib/firebase/timestamp-converter';
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

// Date fields for job cost entities
const JOB_COST_DATE_FIELDS = ['date', 'periodStart', 'periodEnd', 'createdAt', 'updatedAt', 'approvedAt'] as const;

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
  const _currentUserName = profile?.displayName || 'Unknown';
  const isAdmin = profile?.role === 'OWNER' || profile?.role === 'PM';

  const { projectId, category, source, phaseId, startDate, endDate } = options;

  // Fetch costs with real-time updates
  useEffect(() => {
    if (!orgId || !projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
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
          ...convertTimestamps(doc.data(), JOB_COST_DATE_FIELDS),
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const profitRef = doc(db, `organizations/${orgId}/projectProfitability/${projectId}`);

    const unsubscribe = onSnapshot(
      profitRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = convertTimestamps(snapshot.data(), JOB_COST_DATE_FIELDS) as unknown as ProjectProfitability;
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
    const _q = query(costsRef, where('projectId', '==', projectId));

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
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
          ...convertTimestamps(doc.data(), JOB_COST_DATE_FIELDS),
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

// Re-export from centralized formatters
export { formatCurrencyCompact as formatCurrency } from '@/lib/utils/formatters';

/**
 * Format percentage for display with +/- sign
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

/**
 * Organization-wide job costing summary data
 */
export interface OrgJobCostingSummary {
  totalBudget: number;
  totalActualCosts: number;
  totalVariance: number;
  variancePercent: number;
  projectsAtRisk: number;
  projectsOverBudget: number;
  projectsUnderBudget: number;
  costsByCategory: Record<CostCategory, number>;
  topOverBudgetProjects: Array<{
    projectId: string;
    projectName: string;
    budget: number;
    actual: number;
    variance: number;
    variancePercent: number;
  }>;
}

interface UseOrgJobCostingReturn {
  profitabilityData: ProjectProfitability[];
  summary: OrgJobCostingSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook for fetching organization-wide job costing/profitability data
 */
export function useOrgJobCosting(): UseOrgJobCostingReturn {
  const { profile } = useAuth();
  const [profitabilityData, setProfitabilityData] = useState<ProjectProfitability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const orgId = profile?.orgId;

  // Fetch all project profitability data
  useEffect(() => {
    if (!orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const profitRef = collection(db, `organizations/${orgId}/projectProfitability`);
    const q = query(profitRef, orderBy('lastUpdated', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          projectId: doc.id,
          ...convertTimestamps(doc.data(), JOB_COST_DATE_FIELDS),
        })) as ProjectProfitability[];

        setProfitabilityData(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching org profitability:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, refreshTrigger]);

  // Calculate summary statistics
  const summary = useMemo((): OrgJobCostingSummary | null => {
    if (profitabilityData.length === 0) return null;

    let totalBudget = 0;
    let totalActualCosts = 0;
    let projectsAtRisk = 0;
    let projectsOverBudget = 0;
    let projectsUnderBudget = 0;

    const costsByCategory: Record<CostCategory, number> = {
      labor_internal: 0,
      labor_subcontractor: 0,
      materials: 0,
      equipment_rental: 0,
      permits_fees: 0,
      overhead: 0,
      other: 0,
    };

    const projectVariances: Array<{
      projectId: string;
      projectName: string;
      budget: number;
      actual: number;
      variance: number;
      variancePercent: number;
    }> = [];

    for (const project of profitabilityData) {
      totalBudget += project.originalBudget || 0;
      totalActualCosts += project.totalCosts || 0;

      if (project.isAtRisk) projectsAtRisk++;
      if (project.isOverBudget) projectsOverBudget++;
      if (project.budgetVariance > 0) projectsUnderBudget++;

      // Aggregate costs by category
      if (project.costsByCategory) {
        for (const [cat, amount] of Object.entries(project.costsByCategory)) {
          if (cat in costsByCategory) {
            costsByCategory[cat as CostCategory] += amount;
          }
        }
      }

      // Track variance for top over-budget projects
      const variance = (project.originalBudget || 0) - (project.totalCosts || 0);
      const variancePercent = project.originalBudget
        ? (variance / project.originalBudget) * 100
        : 0;

      projectVariances.push({
        projectId: project.projectId,
        projectName: project.projectId, // Will be replaced with actual name if available
        budget: project.originalBudget || 0,
        actual: project.totalCosts || 0,
        variance,
        variancePercent,
      });
    }

    const totalVariance = totalBudget - totalActualCosts;
    const variancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

    // Get top 5 over-budget projects (negative variance)
    const topOverBudgetProjects = projectVariances
      .filter((p) => p.variance < 0)
      .sort((a, b) => a.variance - b.variance) // Most negative first
      .slice(0, 5);

    return {
      totalBudget,
      totalActualCosts,
      totalVariance,
      variancePercent,
      projectsAtRisk,
      projectsOverBudget,
      projectsUnderBudget,
      costsByCategory,
      topOverBudgetProjects,
    };
  }, [profitabilityData]);

  const refresh = useCallback(() => {
    setRefreshTrigger((t) => t + 1);
  }, []);

  return {
    profitabilityData,
    summary,
    loading,
    error,
    refresh,
  };
}
