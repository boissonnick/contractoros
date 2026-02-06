"use client";

import { useState, useCallback, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CashFlowStatementData } from './types';
import { logger } from '@/lib/utils/logger';

// ============================================
// Helper: safe date extraction from Firestore
// ============================================

function toDate(value: unknown): Date | null {
  if (!value) return null;
  try {
    if (typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate();
    }
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
  } catch {
    // ignore conversion errors
  }
  return null;
}

function isInPeriod(timestamp: unknown, start: Date, end: Date): boolean {
  const d = toDate(timestamp);
  if (!d) return false;
  return d >= start && d <= end;
}

function isBeforePeriod(timestamp: unknown, start: Date): boolean {
  const d = toDate(timestamp);
  if (!d) return false;
  return d < start;
}

// ============================================
// Hook
// ============================================

export function useCashFlowStatement(
  orgId?: string,
  startDate?: Date,
  endDate?: Date,
) {
  const [data, setData] = useState<CashFlowStatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Default to first/last day of current month when no dates provided
  const resolvedStart = startDate ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const resolvedEnd =
    endDate ??
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      // ------------------------------------------------------------------
      // 1. Fetch all collections in parallel
      // ------------------------------------------------------------------
      const [
        invoicesSnap,
        expensesSnap,
        equipmentSnap,
        subInvoicesSnap,
        payrollSnap,
      ] = await Promise.all([
        getDocs(query(collection(db, 'invoices'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'expenses'), where('orgId', '==', orgId))),
        getDocs(collection(db, 'organizations', orgId, 'equipment')),
        getDocs(collection(db, 'organizations', orgId, 'subcontractorInvoices')),
        getDocs(collection(db, 'organizations', orgId, 'payrollRuns')),
      ]);

      const invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const equipment = equipmentSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const subInvoices = subInvoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const payrollRuns = payrollSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // ------------------------------------------------------------------
      // Type helpers (cast once)
      // ------------------------------------------------------------------
      type AnyDoc = Record<string, unknown>;

      const start = resolvedStart;
      const end = resolvedEnd;

      // ------------------------------------------------------------------
      // 2. OPERATING ACTIVITIES
      // ------------------------------------------------------------------

      // 2a. Collections from Customers
      const collectionsFromCustomers = invoices
        .filter(inv => {
          const doc = inv as AnyDoc;
          return doc.status === 'paid' && isInPeriod(doc.paidAt, start, end);
        })
        .reduce((sum, inv) => sum + (((inv as AnyDoc).total as number) || 0), 0);

      // 2b. Payments for Materials (approved expenses in period: materials + tools)
      const approvedExpensesInPeriod = expenses.filter(exp => {
        const doc = exp as AnyDoc;
        return (
          doc.status === 'approved' &&
          isInPeriod(doc.createdAt || doc.date, start, end)
        );
      });

      const materialCategories = ['materials', 'tools'];
      const paymentsForMaterials = approvedExpensesInPeriod
        .filter(exp => materialCategories.includes(((exp as AnyDoc).category as string) || ''))
        .reduce((sum, exp) => sum + (((exp as AnyDoc).amount as number) || 0), 0);

      // 2c. Payments for Labor (payrollRuns completed/processed in period)
      const paymentsForLabor = payrollRuns
        .filter(pr => {
          const doc = pr as AnyDoc;
          return (
            ['completed', 'processed'].includes((doc.status as string) || '') &&
            isInPeriod(doc.processedAt, start, end)
          );
        })
        .reduce((sum, pr) => sum + (((pr as AnyDoc).totalGrossPay as number) || 0), 0);

      // 2d. Payments to Subcontractors (paid sub invoices in period)
      const paymentsToSubcontractors = subInvoices
        .filter(si => {
          const doc = si as AnyDoc;
          return doc.status === 'paid' && isInPeriod(doc.paidAt, start, end);
        })
        .reduce((sum, si) => sum + (((si as AnyDoc).amount as number) || ((si as AnyDoc).total as number) || 0), 0);

      // 2e. Other Operating Payments (approved expenses NOT in materials/tools/equipment categories)
      const excludedCategories = ['materials', 'tools', 'equipment', 'equipment_rental'];
      const otherOperatingPayments = approvedExpensesInPeriod
        .filter(exp => !excludedCategories.includes(((exp as AnyDoc).category as string) || ''))
        .reduce((sum, exp) => sum + (((exp as AnyDoc).amount as number) || 0), 0);

      // 2f. Change in AR
      //     Outstanding = status in ['sent', 'viewed', 'overdue']
      //     Change = (outstanding at end) - (outstanding at start)
      //     Cash impact = negative of change (decrease in AR = cash inflow)
      const outstandingStatuses = ['sent', 'viewed', 'overdue'];

      // Outstanding invoices at period end: created/sent before or during period end AND still outstanding
      // We approximate: filter invoices outstanding whose creation is <= end
      const outstandingAtEnd = invoices
        .filter(inv => {
          const doc = inv as AnyDoc;
          if (!outstandingStatuses.includes((doc.status as string) || '')) return false;
          // Invoice exists by end of period (createdAt <= end)
          const created = toDate(doc.createdAt);
          return created ? created <= end : false;
        })
        .reduce((sum, inv) => sum + (((inv as AnyDoc).total as number) || 0), 0);

      // Outstanding invoices at period start: those outstanding whose creation is < start
      // Note: We cannot know historical status, so we use current status as proxy
      const outstandingAtStart = invoices
        .filter(inv => {
          const doc = inv as AnyDoc;
          if (!outstandingStatuses.includes((doc.status as string) || '')) return false;
          const created = toDate(doc.createdAt);
          return created ? created < start : false;
        })
        .reduce((sum, inv) => sum + (((inv as AnyDoc).total as number) || 0), 0);

      const changeInAR = -(outstandingAtEnd - outstandingAtStart);

      // 2g. Change in AP (subcontractor invoices pending)
      const pendingStatuses = ['pending', 'submitted', 'under_review'];

      const apAtEnd = subInvoices
        .filter(si => {
          const doc = si as AnyDoc;
          if (!pendingStatuses.includes((doc.status as string) || '')) return false;
          const created = toDate(doc.createdAt || doc.submittedAt);
          return created ? created <= end : false;
        })
        .reduce((sum, si) => sum + (((si as AnyDoc).amount as number) || ((si as AnyDoc).total as number) || 0), 0);

      const apAtStart = subInvoices
        .filter(si => {
          const doc = si as AnyDoc;
          if (!pendingStatuses.includes((doc.status as string) || '')) return false;
          const created = toDate(doc.createdAt || doc.submittedAt);
          return created ? created < start : false;
        })
        .reduce((sum, si) => sum + (((si as AnyDoc).amount as number) || ((si as AnyDoc).total as number) || 0), 0);

      const changeInAP = apAtEnd - apAtStart;

      // 2h. Net Operating Cash Flow
      const netOperatingCashFlow =
        collectionsFromCustomers -
        paymentsForMaterials -
        paymentsForLabor -
        paymentsToSubcontractors -
        otherOperatingPayments +
        changeInAR +
        changeInAP;

      // ------------------------------------------------------------------
      // 3. INVESTING ACTIVITIES
      // ------------------------------------------------------------------

      // Equipment purchases in period (non-rental)
      const equipmentPurchases = equipment
        .filter(eq => {
          const doc = eq as AnyDoc;
          return doc.type !== 'rental' && isInPeriod(doc.purchaseDate, start, end);
        })
        .reduce((sum, eq) => sum + (((eq as AnyDoc).purchasePrice as number) || 0), 0);

      // Tool purchases placeholder (tools are captured in operating expenses)
      const toolPurchases = 0;

      const netInvestingCashFlow = -(equipmentPurchases + toolPurchases);

      // ------------------------------------------------------------------
      // 4. FINANCING ACTIVITIES (placeholder — no data source yet)
      // ------------------------------------------------------------------
      const ownerContributions = 0;
      const ownerDraws = 0;
      const netFinancingCashFlow = 0;

      // ------------------------------------------------------------------
      // 5. BOTTOM LINE
      // ------------------------------------------------------------------
      const netChangeInCash =
        netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;

      // Beginning cash balance: all paid invoices before period minus all approved expenses before period
      const paidBeforePeriod = invoices
        .filter(inv => {
          const doc = inv as AnyDoc;
          return doc.status === 'paid' && isBeforePeriod(doc.paidAt, start);
        })
        .reduce((sum, inv) => sum + (((inv as AnyDoc).total as number) || 0), 0);

      const expensesBeforePeriod = expenses
        .filter(exp => {
          const doc = exp as AnyDoc;
          return (
            doc.status === 'approved' &&
            isBeforePeriod(doc.createdAt || doc.date, start)
          );
        })
        .reduce((sum, exp) => sum + (((exp as AnyDoc).amount as number) || 0), 0);

      const beginningCashBalance = paidBeforePeriod - expensesBeforePeriod;
      const endingCashBalance = beginningCashBalance + netChangeInCash;

      // ------------------------------------------------------------------
      // 6. Set state
      // ------------------------------------------------------------------
      setData({
        periodStart: start,
        periodEnd: end,
        operating: {
          collectionsFromCustomers,
          paymentsForMaterials,
          paymentsForLabor,
          paymentsToSubcontractors,
          otherOperatingPayments,
          changeInAR,
          changeInAP,
          netOperatingCashFlow,
        },
        investing: {
          equipmentPurchases,
          toolPurchases,
          netInvestingCashFlow,
        },
        financing: {
          ownerContributions,
          ownerDraws,
          netFinancingCashFlow,
        },
        netChangeInCash,
        beginningCashBalance,
        endingCashBalance,
      });
    } catch (err) {
      logger.error('Failed to fetch cash flow statement data', { error: err, hook: 'useCashFlowStatement' });
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [orgId, resolvedStart.getTime(), resolvedEnd.getTime()]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
