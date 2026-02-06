"use client";

import { useState, useCallback, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  FinancialSummary,
  RevenueByProject,
  RevenueByClient,
  RevenueByMonthData,
  CostBreakdown,
  ExpenseByCategory,
  InvoiceAging,
  ProjectPnLData,
} from './types';
import { CATEGORY_COLORS } from './types';
import { logger } from '@/lib/utils/logger';

/**
 * Financial reports hook for revenue, expenses, invoicing, and P&L analysis
 */
export function useFinancialReports(orgId?: string) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [invoiceAging, setInvoiceAging] = useState<InvoiceAging[]>([]);
  const [projectProfitability, setProjectProfitability] = useState<ProjectPnLData[]>([]);
  const [revenueByProject, setRevenueByProject] = useState<RevenueByProject[]>([]);
  const [revenueByClient, setRevenueByClient] = useState<RevenueByClient[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonthData[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchFinancialData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      // NOTE: All collections are top-level with orgId field, not subcollections
      const [projectsSnap, expensesSnap, invoicesSnap, timeEntriesSnap, usersSnap, clientsSnap, subAssignmentsSnap] = await Promise.all([
        getDocs(query(collection(db, 'projects'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'expenses'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'invoices'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'timeEntries'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'users'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'clients'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'subAssignments'), where('orgId', '==', orgId))),
      ]);

      // Build client name map
      const clientNameMap = new Map<string, string>();
      clientsSnap.docs.forEach(d => {
        const data = d.data();
        clientNameMap.set(d.id, data.name || data.displayName || 'Unknown');
      });

      // Process user rates for labor cost calculation
      const userRates = new Map<string, number>();
      usersSnap.docs.forEach(d => {
        const data = d.data();
        userRates.set(d.id, data.hourlyRate || 0);
      });

      // Calculate labor costs by project
      const laborByProject = new Map<string, number>();
      let totalLaborCosts = 0;
      timeEntriesSnap.docs.forEach(d => {
        const data = d.data();
        const cost = ((data.totalMinutes || 0) / 60) * (userRates.get(data.userId) || 0);
        laborByProject.set(data.projectId, (laborByProject.get(data.projectId) || 0) + cost);
        totalLaborCosts += cost;
      });

      // Process subcontractor payments
      let totalSubcontractorCosts = 0;
      const subCostsByProject = new Map<string, number>();
      subAssignmentsSnap.docs.forEach(d => {
        const data = d.data();
        const paidAmount = (data.paidAmount as number) || 0;
        totalSubcontractorCosts += paidAmount;
        const projectId = data.projectId as string;
        if (projectId) {
          subCostsByProject.set(projectId, (subCostsByProject.get(projectId) || 0) + paidAmount);
        }
      });

      // Process expenses
      const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const approvedExpenses = expenses.filter(e => (e as { status?: string }).status === 'approved');

      // Categorize expenses for P&L
      let materialCosts = 0;
      let equipmentCosts = 0;
      let overheadCosts = 0;

      // Expenses by category
      const categoryTotals: Record<string, number> = {};
      approvedExpenses.forEach(e => {
        const category = (e as { category?: string }).category || 'other';
        const amount = (e as { amount?: number }).amount || 0;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;

        // Categorize for P&L breakdown
        if (category === 'materials' || category === 'tools') {
          materialCosts += amount;
        } else if (category === 'equipment_rental' || category === 'equipment') {
          equipmentCosts += amount;
        } else if (['office', 'travel', 'permits', 'fuel', 'vehicle', 'other'].includes(category)) {
          overheadCosts += amount;
        }
      });

      const categoryData: ExpenseByCategory[] = Object.entries(categoryTotals)
        .map(([name, value]) => ({
          name: name.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          value,
          color: CATEGORY_COLORS[name] || '#6B7280',
        }))
        .sort((a, b) => b.value - a.value);
      setExpensesByCategory(categoryData);

      // Process invoices
      const invoices = invoicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const paidInvoices = invoices.filter(i => (i as { status?: string }).status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum, i) => sum + ((i as { total?: number }).total || 0), 0);

      // Revenue by project
      const revenueByProjectMap = new Map<string, { revenue: number; projectName: string }>();
      paidInvoices.forEach(inv => {
        const projectId = (inv as { projectId?: string }).projectId;
        const amount = (inv as { total?: number }).total || 0;
        if (projectId) {
          const existing = revenueByProjectMap.get(projectId);
          if (existing) {
            existing.revenue += amount;
          } else {
            revenueByProjectMap.set(projectId, { revenue: amount, projectName: '' });
          }
        }
      });

      // Revenue by client
      const revenueByClientMap = new Map<string, { revenue: number; clientName: string; invoiceCount: number }>();
      paidInvoices.forEach(inv => {
        const clientId = (inv as { clientId?: string }).clientId;
        const amount = (inv as { total?: number }).total || 0;
        if (clientId) {
          const existing = revenueByClientMap.get(clientId);
          if (existing) {
            existing.revenue += amount;
            existing.invoiceCount += 1;
          } else {
            revenueByClientMap.set(clientId, {
              revenue: amount,
              clientName: clientNameMap.get(clientId) || 'Unknown',
              invoiceCount: 1,
            });
          }
        }
      });

      const revenueByClientData: RevenueByClient[] = Array.from(revenueByClientMap.entries())
        .map(([clientId, data]) => ({
          clientId,
          clientName: data.clientName,
          revenue: data.revenue,
          invoiceCount: data.invoiceCount,
        }))
        .sort((a, b) => b.revenue - a.revenue);
      setRevenueByClient(revenueByClientData);

      // Revenue by month (last 12 months)
      const now = new Date();
      const monthlyData: RevenueByMonthData[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const monthName = monthDate.toLocaleString('default', { month: 'short', year: '2-digit' });

        const monthRevenue = paidInvoices
          .filter(inv => {
            const paidAt = (inv as { paidAt?: { toDate: () => Date } }).paidAt;
            if (!paidAt) return false;
            const date = paidAt.toDate();
            return date >= monthDate && date <= monthEnd;
          })
          .reduce((sum, inv) => sum + ((inv as { total?: number }).total || 0), 0);

        const monthExpenses = approvedExpenses
          .filter(exp => {
            const createdAt = (exp as { createdAt?: { toDate: () => Date } }).createdAt;
            if (!createdAt) return false;
            const date = createdAt.toDate();
            return date >= monthDate && date <= monthEnd;
          })
          .reduce((sum, exp) => sum + ((exp as { amount?: number }).amount || 0), 0);

        monthlyData.push({
          month: monthName,
          revenue: monthRevenue,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses,
        });
      }
      setRevenueByMonth(monthlyData);

      // Invoice aging
      const aging: Record<string, { amount: number; count: number }> = {
        'Current': { amount: 0, count: 0 },
        '1-30 Days': { amount: 0, count: 0 },
        '31-60 Days': { amount: 0, count: 0 },
        '61-90 Days': { amount: 0, count: 0 },
        '90+ Days': { amount: 0, count: 0 },
      };

      invoices
        .filter(i => ['sent', 'viewed', 'overdue'].includes((i as { status?: string }).status || ''))
        .forEach(inv => {
          const dueDate = (inv as { dueDate?: { toDate: () => Date } }).dueDate;
          const amount = (inv as { total?: number }).total || 0;
          if (!dueDate) {
            aging['Current'].amount += amount;
            aging['Current'].count += 1;
            return;
          }
          const daysPast = Math.floor((now.getTime() - dueDate.toDate().getTime()) / (1000 * 60 * 60 * 24));
          if (daysPast <= 0) {
            aging['Current'].amount += amount;
            aging['Current'].count += 1;
          } else if (daysPast <= 30) {
            aging['1-30 Days'].amount += amount;
            aging['1-30 Days'].count += 1;
          } else if (daysPast <= 60) {
            aging['31-60 Days'].amount += amount;
            aging['31-60 Days'].count += 1;
          } else if (daysPast <= 90) {
            aging['61-90 Days'].amount += amount;
            aging['61-90 Days'].count += 1;
          } else {
            aging['90+ Days'].amount += amount;
            aging['90+ Days'].count += 1;
          }
        });

      const agingData: InvoiceAging[] = Object.entries(aging).map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
      }));
      setInvoiceAging(agingData);

      // Project profitability with revenue
      const projects = projectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const expensesByProjectMap = new Map<string, number>();
      approvedExpenses.forEach(e => {
        const projectId = (e as { projectId?: string }).projectId;
        const amount = (e as { amount?: number }).amount || 0;
        if (projectId) {
          expensesByProjectMap.set(projectId, (expensesByProjectMap.get(projectId) || 0) + amount);
        }
      });

      // Build project name map
      const projectNameMap = new Map<string, string>();
      projects.forEach(p => {
        projectNameMap.set((p as { id: string }).id, (p as { name?: string }).name || 'Unknown');
      });

      // Update revenue by project with project names
      const revenueByProjectData: RevenueByProject[] = Array.from(revenueByProjectMap.entries())
        .map(([projectId, data]) => {
          const laborCost = laborByProject.get(projectId) || 0;
          const expenseCost = expensesByProjectMap.get(projectId) || 0;
          const subCost = subCostsByProject.get(projectId) || 0;
          const totalCosts = laborCost + expenseCost + subCost;
          const profit = data.revenue - totalCosts;
          return {
            projectId,
            projectName: projectNameMap.get(projectId) || 'Unknown',
            revenue: data.revenue,
            costs: totalCosts,
            profit,
            margin: data.revenue > 0 ? (profit / data.revenue) * 100 : 0,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);
      setRevenueByProject(revenueByProjectData);

      const profitability: ProjectPnLData[] = projects.map(p => {
        const projectId = (p as { id: string }).id;
        const budget = (p as { budget?: number }).budget || 0;
        const laborCost = laborByProject.get(projectId) || 0;
        const expenseCost = expensesByProjectMap.get(projectId) || 0;
        const subCost = subCostsByProject.get(projectId) || 0;
        const actualSpend = laborCost + expenseCost + subCost;

        return {
          projectId,
          projectName: (p as { name?: string }).name || 'Unknown',
          budget,
          actualSpend,
          laborCost,
          variance: budget - actualSpend,
        };
      });
      setProjectProfitability(profitability);

      // Cost breakdown for P&L
      const directCosts = totalLaborCosts + materialCosts + totalSubcontractorCosts + equipmentCosts;
      const totalCosts = directCosts + overheadCosts;
      const costBreakdownData: CostBreakdown[] = [
        { category: 'Labor', amount: totalLaborCosts, percentage: totalCosts > 0 ? (totalLaborCosts / totalCosts) * 100 : 0, color: '#10B981' },
        { category: 'Materials', amount: materialCosts, percentage: totalCosts > 0 ? (materialCosts / totalCosts) * 100 : 0, color: '#3B82F6' },
        { category: 'Subcontractors', amount: totalSubcontractorCosts, percentage: totalCosts > 0 ? (totalSubcontractorCosts / totalCosts) * 100 : 0, color: '#8B5CF6' },
        { category: 'Equipment', amount: equipmentCosts, percentage: totalCosts > 0 ? (equipmentCosts / totalCosts) * 100 : 0, color: '#F59E0B' },
        { category: 'Overhead', amount: overheadCosts, percentage: totalCosts > 0 ? (overheadCosts / totalCosts) * 100 : 0, color: '#6B7280' },
      ].filter(c => c.amount > 0);
      setCostBreakdown(costBreakdownData);

      // Financial summary with enhanced P&L
      const totalBudget = projects.reduce((sum, p) => sum + ((p as { budget?: number }).budget || 0), 0);
      const totalMaterialExpenses = approvedExpenses.reduce((sum, e) => sum + ((e as { amount?: number }).amount || 0), 0);
      const totalSpent = totalLaborCosts + totalMaterialExpenses + totalSubcontractorCosts;
      const grossProfit = totalRevenue - directCosts;
      const netProfit = totalRevenue - totalSpent;

      setSummary({
        totalBudget,
        totalSpent,
        totalRevenue,
        grossProfit,
        profitMargin: totalRevenue > 0
          ? (grossProfit / totalRevenue) * 100
          : (totalSpent > 0 ? -100 : 0),
        cashFlow: totalRevenue - totalSpent,
        // Enhanced P&L fields
        laborCosts: totalLaborCosts,
        materialCosts,
        subcontractorCosts: totalSubcontractorCosts,
        equipmentCosts,
        overheadCosts,
        directCosts,
        netProfit,
        netMargin: totalRevenue > 0
          ? (netProfit / totalRevenue) * 100
          : (totalSpent > 0 ? -100 : 0),
      });

    } catch (err) {
      logger.error('Failed to fetch financial data', { error: err, hook: 'useFinancialReports' });
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  return {
    loading,
    error,
    summary,
    expensesByCategory,
    invoiceAging,
    projectProfitability,
    revenueByProject,
    revenueByClient,
    revenueByMonth,
    costBreakdown,
    refetch: fetchFinancialData,
  };
}
