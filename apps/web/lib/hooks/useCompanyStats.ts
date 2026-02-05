'use client';

/**
 * @fileoverview Company-wide Financial Statistics Hook
 *
 * Aggregates org-wide financial metrics from multiple Firestore collections:
 * - Invoices (revenue, AR aging)
 * - Project Profitability (margins)
 * - Estimates (pipeline value)
 * - Projects (active count)
 * - Expenses (monthly trends)
 *
 * Uses getDocs (one-time reads) with Promise.all for parallel fetching.
 * Consumed by CompanyOverviewDashboard and CashFlowRunwayDashboard components.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  differenceInDays,
} from 'date-fns';

// ============================================
// Types
// ============================================

export interface CompanyStats {
  // Revenue
  revenueMTD: number;
  revenueYTD: number;
  revenuePrevMonth: number;
  revenueChangePercent: number; // MoM change

  // Margins (from profitability data)
  avgMargin: number; // average gross margin across active projects

  // Pipeline
  pipelineValue: number; // open estimates total
  activeProjectCount: number;

  // AR Aging
  arTotal: number;
  arAging: {
    current: number; // 0-30 days
    days31to60: number;
    days61to90: number;
    over90: number;
  };

  // Monthly Trends (last 6 months for charts)
  monthlyTrends: Array<{
    month: string; // "Jan", "Feb", etc.
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
  }>;
}

export interface UseCompanyStatsReturn {
  stats: CompanyStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ============================================
// Helpers
// ============================================

/**
 * Safely extract a Date from a Firestore field that may be a Timestamp,
 * a Date, a string, or undefined.
 */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate();
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Check whether a date falls within a given range (inclusive).
 */
function isInRange(date: Date | null, start: Date, end: Date): boolean {
  if (!date) return false;
  return date >= start && date <= end;
}

// ============================================
// Hook
// ============================================

export function useCompanyStats(): UseCompanyStatsReturn {
  const { profile } = useAuth();
  const [rawData, setRawData] = useState<{
    invoices: Record<string, unknown>[];
    profitability: Record<string, unknown>[];
    estimates: Record<string, unknown>[];
    projects: Record<string, unknown>[];
    expenses: Record<string, unknown>[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const orgId = profile?.orgId;

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Fetch all collections in parallel
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchData() {
      try {
        const [invoicesSnap, profitabilitySnap, estimatesSnap, projectsSnap, expensesSnap] =
          await Promise.all([
            // Invoices — root-level collection (matching existing intelligence page pattern)
            getDocs(
              query(
                collection(db, 'invoices'),
                where('orgId', '==', orgId),
                limit(500)
              )
            ),
            // Project Profitability — org-scoped subcollection
            getDocs(
              query(
                collection(db, `organizations/${orgId}/projectProfitability`),
                limit(500)
              )
            ),
            // Estimates — root-level collection
            getDocs(
              query(
                collection(db, 'estimates'),
                where('orgId', '==', orgId),
                limit(500)
              )
            ),
            // Projects — root-level collection
            getDocs(
              query(
                collection(db, 'projects'),
                where('orgId', '==', orgId),
                limit(500)
              )
            ),
            // Expenses — org-scoped subcollection
            getDocs(
              query(
                collection(db, `organizations/${orgId}/expenses`),
                limit(500)
              )
            ),
          ]);

        if (cancelled) return;

        setRawData({
          invoices: invoicesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          profitability: profitabilitySnap.docs.map((d) => ({ projectId: d.id, ...d.data() })),
          estimates: estimatesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          projects: projectsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          expenses: expensesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        });
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching company stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load company stats');
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [orgId, refreshTrigger]);

  // Compute aggregated stats from raw data
  const stats = useMemo((): CompanyStats | null => {
    if (!rawData) return null;

    const { invoices, profitability, estimates, projects, expenses } = rawData;
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // ---- Revenue (from paid invoices, keyed on createdAt) ----
    const revenueMTD = invoices
      .filter((inv) => {
        const date = toDate(inv.createdAt);
        return (
          inv.status === 'paid' &&
          isInRange(date, thisMonthStart, thisMonthEnd)
        );
      })
      .reduce((sum, inv) => sum + ((inv.amountPaid as number) || 0), 0);

    const revenueYTD = invoices
      .filter((inv) => {
        const date = toDate(inv.createdAt);
        return (
          inv.status === 'paid' &&
          isInRange(date, yearStart, thisMonthEnd)
        );
      })
      .reduce((sum, inv) => sum + ((inv.amountPaid as number) || 0), 0);

    const revenuePrevMonth = invoices
      .filter((inv) => {
        const date = toDate(inv.createdAt);
        return (
          inv.status === 'paid' &&
          isInRange(date, prevMonthStart, prevMonthEnd)
        );
      })
      .reduce((sum, inv) => sum + ((inv.amountPaid as number) || 0), 0);

    const revenueChangePercent =
      revenuePrevMonth > 0
        ? ((revenueMTD - revenuePrevMonth) / revenuePrevMonth) * 100
        : 0;

    // ---- Margins (from projectProfitability) ----
    const activeProjectIds = new Set(
      projects
        .filter((p) => p.status === 'active')
        .map((p) => p.id as string)
    );

    const activeProfitability = profitability.filter((p) =>
      activeProjectIds.has(p.projectId as string)
    );

    const avgMargin =
      activeProfitability.length > 0
        ? activeProfitability.reduce(
            (sum, p) => sum + ((p.grossMargin as number) || 0),
            0
          ) / activeProfitability.length
        : 0;

    // ---- Pipeline (open estimates) ----
    const pipelineValue = estimates
      .filter((e) => ['sent', 'viewed'].includes(e.status as string))
      .reduce((sum, e) => sum + ((e.total as number) || 0), 0);

    // ---- Active Projects ----
    const activeProjectCount = projects.filter(
      (p) => p.status === 'active'
    ).length;

    // ---- AR Aging ----
    const outstandingInvoices = invoices.filter((inv) =>
      ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status as string)
    );

    const arTotal = outstandingInvoices.reduce(
      (sum, inv) => sum + ((inv.amountDue as number) || 0),
      0
    );

    const arAging = { current: 0, days31to60: 0, days61to90: 0, over90: 0 };

    for (const inv of outstandingInvoices) {
      const dueDate = toDate(inv.dueDate);
      const amountDue = (inv.amountDue as number) || 0;

      if (!dueDate) {
        // No due date — treat as current
        arAging.current += amountDue;
        continue;
      }

      const daysPastDue = differenceInDays(now, dueDate);

      if (daysPastDue <= 0) {
        // Not yet due — current
        arAging.current += amountDue;
      } else if (daysPastDue <= 30) {
        arAging.current += amountDue;
      } else if (daysPastDue <= 60) {
        arAging.days31to60 += amountDue;
      } else if (daysPastDue <= 90) {
        arAging.days61to90 += amountDue;
      } else {
        arAging.over90 += amountDue;
      }
    }

    // ---- Monthly Trends (last 6 months) ----
    const monthlyTrends: CompanyStats['monthlyTrends'] = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMM');

      // Revenue for this month (paid invoices)
      const monthRevenue = invoices
        .filter((inv) => {
          const date = toDate(inv.createdAt);
          return inv.status === 'paid' && isInRange(date, monthStart, monthEnd);
        })
        .reduce((sum, inv) => sum + ((inv.amountPaid as number) || 0), 0);

      // Expenses for this month (non-rejected)
      const monthExpenses = expenses
        .filter((exp) => {
          // Expense date can be a Timestamp or an ISO string
          const date = toDate(exp.date) || toDate(exp.createdAt);
          return exp.status !== 'rejected' && isInRange(date, monthStart, monthEnd);
        })
        .reduce((sum, exp) => sum + ((exp.amount as number) || 0), 0);

      const monthProfit = monthRevenue - monthExpenses;
      const monthMargin =
        monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;

      monthlyTrends.push({
        month: monthLabel,
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthProfit,
        margin: Math.round(monthMargin * 10) / 10,
      });
    }

    return {
      revenueMTD,
      revenueYTD,
      revenuePrevMonth,
      revenueChangePercent: Math.round(revenueChangePercent * 10) / 10,
      avgMargin: Math.round(avgMargin * 10) / 10,
      pipelineValue,
      activeProjectCount,
      arTotal,
      arAging,
      monthlyTrends,
    };
  }, [rawData]);

  return { stats, loading, error, refresh };
}
