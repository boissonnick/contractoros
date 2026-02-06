"use client";

import { useState, useCallback, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { BalanceSheetData, ARAgingBucket } from './types';
import { logger } from '@/lib/utils/logger';

/**
 * Balance sheet hook — calculates a point-in-time balance sheet from Firestore data.
 * Queries invoices, expenses, equipment, subcontractorInvoices, and payrollRuns.
 */
export function useBalanceSheet(orgId?: string, asOfDate?: Date) {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      const effectiveDate = asOfDate || new Date();

      // Fetch all collections in parallel
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

      // ---- ASSETS ----

      // Cash Position: paid invoices - approved expenses
      const invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const paidInvoiceTotal = invoices
        .filter(i => (i as { status?: string }).status === 'paid')
        .reduce((sum, i) => sum + ((i as { total?: number }).total || 0), 0);

      const approvedExpenseTotal = expenses
        .filter(e => (e as { status?: string }).status === 'approved')
        .reduce((sum, e) => sum + ((e as { amount?: number }).amount || 0), 0);

      const cashPosition = paidInvoiceTotal - approvedExpenseTotal;

      // Accounts Receivable: invoices that are sent, viewed, or overdue
      const outstandingInvoices = invoices.filter(i =>
        ['sent', 'viewed', 'overdue'].includes((i as { status?: string }).status || '')
      );

      const accountsReceivable = outstandingInvoices.reduce(
        (sum, i) => sum + ((i as { total?: number }).total || 0),
        0
      );

      // AR Aging — bucket outstanding invoices by days past due
      const agingBuckets: Record<string, { amount: number; count: number }> = {
        'Current': { amount: 0, count: 0 },
        '1-30 Days': { amount: 0, count: 0 },
        '31-60 Days': { amount: 0, count: 0 },
        '61-90 Days': { amount: 0, count: 0 },
        '90+ Days': { amount: 0, count: 0 },
      };

      outstandingInvoices.forEach(inv => {
        const dueDate = (inv as { dueDate?: { toDate: () => Date } }).dueDate;
        const amount = (inv as { total?: number }).total || 0;

        if (!dueDate) {
          agingBuckets['Current'].amount += amount;
          agingBuckets['Current'].count += 1;
          return;
        }

        const daysPast = Math.floor(
          (effectiveDate.getTime() - dueDate.toDate().getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysPast <= 0) {
          agingBuckets['Current'].amount += amount;
          agingBuckets['Current'].count += 1;
        } else if (daysPast <= 30) {
          agingBuckets['1-30 Days'].amount += amount;
          agingBuckets['1-30 Days'].count += 1;
        } else if (daysPast <= 60) {
          agingBuckets['31-60 Days'].amount += amount;
          agingBuckets['31-60 Days'].count += 1;
        } else if (daysPast <= 90) {
          agingBuckets['61-90 Days'].amount += amount;
          agingBuckets['61-90 Days'].count += 1;
        } else {
          agingBuckets['90+ Days'].amount += amount;
          agingBuckets['90+ Days'].count += 1;
        }
      });

      const arAging: ARAgingBucket[] = Object.entries(agingBuckets).map(
        ([label, bucket]) => ({
          label,
          amount: bucket.amount,
          count: bucket.count,
        })
      );

      // Equipment Value: sum currentValue (fallback purchasePrice) for active, non-rental equipment
      const equipmentValue = equipmentSnap.docs.reduce((sum, d) => {
        const data = d.data();
        if (data.isActive === false || data.type === 'rental') return sum;
        return sum + ((data.currentValue as number) || (data.purchasePrice as number) || 0);
      }, 0);

      const totalAssets = cashPosition + accountsReceivable + equipmentValue;

      // ---- LIABILITIES ----

      // Accounts Payable: subcontractor invoices that are pending or approved
      const accountsPayable = subInvoicesSnap.docs.reduce((sum, d) => {
        const data = d.data();
        if (['pending', 'approved'].includes((data.status as string) || '')) {
          return sum + ((data.amount as number) || 0);
        }
        return sum;
      }, 0);

      // Accrued Expenses: expenses that are pending or submitted
      const accruedExpenses = expenses
        .filter(e => ['pending', 'submitted'].includes((e as { status?: string }).status || ''))
        .reduce((sum, e) => sum + ((e as { amount?: number }).amount || 0), 0);

      // Payroll Liabilities: pending payroll runs
      const payrollLiabilities = payrollSnap.docs.reduce((sum, d) => {
        const data = d.data();
        if ((data.status as string) === 'pending') {
          return sum + ((data.totalGrossPay as number) || 0);
        }
        return sum;
      }, 0);

      const totalLiabilities = accountsPayable + accruedExpenses + payrollLiabilities;

      // ---- EQUITY ----

      const retainedEarnings = cashPosition; // net profit proxy
      const ownersEquity = totalAssets - totalLiabilities - retainedEarnings; // balancing figure
      const totalEquity = retainedEarnings + ownersEquity;

      setData({
        asOfDate: effectiveDate,
        assets: {
          cashPosition,
          accountsReceivable,
          arAging,
          equipmentValue,
          totalAssets,
        },
        liabilities: {
          accountsPayable,
          accruedExpenses,
          payrollLiabilities,
          totalLiabilities,
        },
        equity: {
          retainedEarnings,
          ownersEquity,
          totalEquity,
        },
      });
    } catch (err) {
      logger.error('Failed to fetch balance sheet data', { error: err, hook: 'useBalanceSheet' });
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [orgId, asOfDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
