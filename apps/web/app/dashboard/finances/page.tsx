"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, PageHeader, Skeleton } from '@/components/ui';
import { BarChartCard } from '@/components/charts';
import { JobCostingSummary } from '@/components/finances';
import { ExpenseDetailsModal, ExpenseDetailsFilter } from '@/components/expenses';
import { cn } from '@/lib/utils';
import { Invoice, Estimate, Project, Client, ExpenseCategory, EXPENSE_CATEGORIES } from '@/types';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ReceiptPercentIcon,
  WalletIcon,
  DocumentTextIcon,
  FolderIcon,
  UserGroupIcon,
  CursorArrowRaysIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

// Helper to get current year start
function getYearStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
}

// Helper to get last year's same period for comparison
function getLastYearSamePeriod(): { start: Date; end: Date } {
  const now = new Date();
  const lastYear = now.getFullYear() - 1;
  return {
    start: new Date(lastYear, 0, 1),
    end: new Date(lastYear, now.getMonth(), now.getDate()),
  };
}

export default function FinancesPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { expenses, loading: expensesLoading } = useExpenses({});

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expense drilldown modal state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseModalFilter, setExpenseModalFilter] = useState<ExpenseDetailsFilter>({});
  const [expenseModalTitle, setExpenseModalTitle] = useState('Expense Details');

  // Helper to open expense details modal with filter
  const openExpenseModal = (title: string, filter: ExpenseDetailsFilter = {}) => {
    setExpenseModalTitle(title);
    setExpenseModalFilter(filter);
    setExpenseModalOpen(true);
  };

  useEffect(() => {
    async function loadFinancials() {
      if (!profile?.orgId) return;
      setError(null);
      try {
        const [invSnap, estSnap, projSnap, clientSnap] = await Promise.all([
          getDocs(query(collection(db, 'invoices'), where('orgId', '==', profile.orgId))),
          getDocs(query(collection(db, 'estimates'), where('orgId', '==', profile.orgId))),
          getDocs(query(collection(db, 'projects'), where('orgId', '==', profile.orgId))),
          getDocs(query(collection(db, 'clients'), where('orgId', '==', profile.orgId))),
        ]);
        setInvoices(invSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[]);
        setEstimates(estSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Estimate[]);
        setProjects(projSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Project[]);
        setClients(clientSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[]);
      } catch (err: unknown) {
        console.error('Error loading financials:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('permission-denied')) {
          setError('Permission denied. Please check Firestore security rules.');
        } else if (errorMessage.includes('requires an index')) {
          setError('Database index required. Please deploy Firestore indexes.');
        } else {
          setError('Failed to load financial data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadFinancials();
  }, [profile?.orgId]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  // Calculate all financial stats
  const stats = useMemo(() => {
    const yearStart = getYearStart();
    const lastYearPeriod = getLastYearSamePeriod();

    // Filter YTD invoices
    const ytdInvoices = invoices.filter(inv => {
      const createdAt = inv.createdAt instanceof Date ? inv.createdAt : new Date(inv.createdAt as unknown as string);
      return createdAt >= yearStart;
    });

    // Last year same period invoices for comparison
    const lastYearInvoices = invoices.filter(inv => {
      const createdAt = inv.createdAt instanceof Date ? inv.createdAt : new Date(inv.createdAt as unknown as string);
      return createdAt >= lastYearPeriod.start && createdAt <= lastYearPeriod.end;
    });

    // Revenue calculations (YTD)
    const totalRevenue = ytdInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const totalInvoiced = ytdInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const lastYearRevenue = lastYearInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const revenueTrend = lastYearRevenue > 0 ? ((totalRevenue - lastYearRevenue) / lastYearRevenue) * 100 : 0;

    // Accounts Receivable (outstanding invoices)
    const outstandingAmount = invoices
      .filter(inv => ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.amountDue || 0), 0);
    const overdueAmount = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.amountDue || 0), 0);

    // Filter YTD expenses
    const ytdExpenses = expenses.filter(e => {
      if (e.status === 'rejected') return false;
      const expenseDate = new Date(e.date);
      return expenseDate >= yearStart;
    });

    const lastYearExpenses = expenses.filter(e => {
      if (e.status === 'rejected') return false;
      const expenseDate = new Date(e.date);
      return expenseDate >= lastYearPeriod.start && expenseDate <= lastYearPeriod.end;
    });

    // Expense calculations (YTD)
    const totalExpenses = ytdExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastYearTotalExpenses = lastYearExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expensesTrend = lastYearTotalExpenses > 0 ? ((totalExpenses - lastYearTotalExpenses) / lastYearTotalExpenses) * 100 : 0;

    const pendingExpenses = expenses
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);

    // Accounts Payable approximation (pending + approved but not paid)
    const accountsPayable = expenses
      .filter(e => e.status === 'approved' || e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);

    // Gross Profit & Margin
    const grossProfit = totalRevenue - totalExpenses;
    const lastYearGrossProfit = lastYearRevenue - lastYearTotalExpenses;
    const profitTrend = lastYearGrossProfit !== 0 ? ((grossProfit - lastYearGrossProfit) / Math.abs(lastYearGrossProfit)) * 100 : 0;

    const revenueBase = totalRevenue > 0 ? totalRevenue : totalInvoiced;
    const profitMargin = revenueBase > 0
      ? (grossProfit / revenueBase) * 100
      : (totalExpenses > 0 ? -100 : 0);

    // Pipeline
    const estimatePipeline = estimates
      .filter(e => e.status === 'sent' || e.status === 'viewed')
      .reduce((sum, e) => sum + (e.total || 0), 0);
    const wonDeals = estimates
      .filter(e => e.status === 'accepted')
      .reduce((sum, e) => sum + (e.total || 0), 0);

    // Budget totals
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.currentSpend || 0), 0);

    // Expense by category (for pie chart)
    const expensesByCategory = new Map<ExpenseCategory, number>();
    ytdExpenses.forEach(e => {
      const current = expensesByCategory.get(e.category) || 0;
      expensesByCategory.set(e.category, current + e.amount);
    });

    // Revenue by project (top 5)
    const revenueByProject = new Map<string, { name: string; revenue: number }>();
    ytdInvoices.forEach(inv => {
      if (inv.projectId && inv.projectName) {
        const current = revenueByProject.get(inv.projectId) || { name: inv.projectName, revenue: 0 };
        current.revenue += inv.amountPaid || 0;
        revenueByProject.set(inv.projectId, current);
      }
    });
    const topProjectsByRevenue = Array.from(revenueByProject.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Revenue by client (top 5)
    const revenueByClient = new Map<string, { name: string; revenue: number }>();
    ytdInvoices.forEach(inv => {
      if (inv.clientId) {
        const client = clients.find(c => c.id === inv.clientId);
        const clientName = client?.displayName || inv.clientName || 'Unknown';
        const current = revenueByClient.get(inv.clientId) || { name: clientName, revenue: 0 };
        current.revenue += inv.amountPaid || 0;
        revenueByClient.set(inv.clientId, current);
      }
    });
    const topClientsByRevenue = Array.from(revenueByClient.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      // Executive KPIs
      totalRevenue,
      totalInvoiced,
      revenueTrend,
      totalExpenses,
      expensesTrend,
      grossProfit,
      profitTrend,
      profitMargin,
      // Cash Flow
      outstandingAmount,
      overdueAmount,
      accountsPayable,
      cashFlow: outstandingAmount - accountsPayable,
      // Pipeline
      estimatePipeline,
      wonDeals,
      pendingExpenses,
      // Budget
      totalBudget,
      totalSpent,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      // Breakdowns
      expensesByCategory,
      topProjectsByRevenue,
      topClientsByRevenue,
    };
  }, [invoices, expenses, estimates, projects, clients]);

  // Prepare expense chart data
  const expenseChartData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];
    stats.expensesByCategory.forEach((value, category) => {
      const categoryInfo = EXPENSE_CATEGORIES.find(c => c.value === category);
      data.push({
        name: categoryInfo?.label || category,
        value,
        color: categoryInfo?.color || '#6B7280',
      });
    });
    return data.sort((a, b) => b.value - a.value).slice(0, 8);
  }, [stats.expensesByCategory]);

  // Budget vs Actual chart data
  const budgetVsActualData = useMemo(() => {
    return projects
      .filter(p => p.status === 'active' && p.budget && p.budget > 0)
      .slice(0, 6)
      .map(p => ({
        name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
        budget: p.budget || 0,
        actual: p.currentSpend || 0,
      }));
  }, [projects]);

  if (loading || expensesLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Financial Data</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Finance Dashboard"
        description="Executive overview of revenue, expenses, and profitability (YTD)"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finances' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/reports/financial">
              <Button variant="outline" size="sm">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Detailed Reports
              </Button>
            </Link>
            <Link href="/dashboard/invoices/new">
              <Button variant="primary" size="sm">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </Link>
          </div>
        }
      />

      {/* Executive Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Revenue (YTD)</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">vs Last Year</span>
            <span className={cn(
              'flex items-center font-medium',
              stats.revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {stats.revenueTrend >= 0 ? '+' : ''}{stats.revenueTrend.toFixed(1)}%
            </span>
          </div>
        </Card>

        <Card
          className="p-5 cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => openExpenseModal('All Expenses (YTD)', {})}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                Total Expenses (YTD)
                <CursorArrowRaysIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatCurrency(stats.totalExpenses)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">vs Last Year</span>
            <span className={cn(
              'flex items-center font-medium',
              stats.expensesTrend <= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {stats.expensesTrend >= 0 ? '+' : ''}{stats.expensesTrend.toFixed(1)}%
            </span>
          </div>
        </Card>

        <Card className={cn('p-5', stats.grossProfit >= 0 ? 'ring-1 ring-green-200' : 'ring-1 ring-red-200')}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <CurrencyDollarIcon className={cn('h-5 w-5', stats.grossProfit >= 0 ? 'text-green-600' : 'text-red-600')} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Gross Profit (YTD)</p>
              <p className={cn('text-2xl font-bold tabular-nums', stats.grossProfit >= 0 ? 'text-green-700' : 'text-red-700')}>
                {formatCurrency(stats.grossProfit)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">vs Last Year</span>
            <span className={cn(
              'flex items-center font-medium',
              stats.profitTrend >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {stats.profitTrend >= 0 ? '+' : ''}{stats.profitTrend.toFixed(1)}%
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <ReceiptPercentIcon className={cn('h-5 w-5', stats.profitMargin >= 20 ? 'text-green-600' : stats.profitMargin >= 10 ? 'text-amber-600' : 'text-red-600')} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Profit Margin</p>
              <p className={cn('text-2xl font-bold tabular-nums', stats.profitMargin >= 0 ? 'text-gray-900' : 'text-red-700')}>
                {stats.profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {stats.profitMargin >= 20 ? 'Healthy margin' : stats.profitMargin >= 10 ? 'Below target (20%)' : 'Needs attention'}
          </div>
        </Card>
      </div>

      {/* Cash Flow Summary */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <WalletIcon className="h-5 w-5 text-gray-400" />
          Cash Flow Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Accounts Receivable</p>
            <p className="text-lg font-bold text-blue-700 tabular-nums">{formatCurrency(stats.outstandingAmount)}</p>
            {stats.overdueAmount > 0 && (
              <p className="text-xs text-red-600 mt-1">{formatCurrency(stats.overdueAmount)} overdue</p>
            )}
          </div>
          <div
            className="p-4 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors group"
            onClick={() => openExpenseModal('Accounts Payable', { status: 'pending' })}
          >
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              Accounts Payable
              <CursorArrowRaysIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <p className="text-lg font-bold text-orange-700 tabular-nums">{formatCurrency(stats.accountsPayable)}</p>
            {stats.pendingExpenses > 0 && (
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.pendingExpenses)} pending</p>
            )}
          </div>
          <div className={cn('p-4 rounded-lg', stats.cashFlow >= 0 ? 'bg-green-50' : 'bg-red-50')}>
            <p className="text-xs text-gray-500 mb-1">Net Cash Flow</p>
            <p className={cn('text-lg font-bold tabular-nums', stats.cashFlow >= 0 ? 'text-green-700' : 'text-red-700')}>
              {formatCurrency(stats.cashFlow)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stats.cashFlow >= 0 ? 'Positive flow' : 'Negative flow'}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Pipeline Value</p>
            <p className="text-lg font-bold text-purple-700 tabular-nums">{formatCurrency(stats.estimatePipeline)}</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.wonDeals)} won</p>
          </div>
        </div>
      </Card>

      {/* Job Costing Section */}
      <JobCostingSummary
        onProjectClick={(projectId) => router.push(`/dashboard/projects/${projectId}/finances`)}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        {expenseChartData.length > 0 ? (
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                Expense Breakdown (YTD)
                <span className="text-xs font-normal text-gray-500">(click to drill down)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Distribution by category</p>
            </div>
            {/* Category List - Clickable */}
            <div className="space-y-2">
              {expenseChartData.map((item) => {
                const categoryValue = EXPENSE_CATEGORIES.find(c => c.label === item.name)?.value;
                const percentage = stats.totalExpenses > 0 ? ((item.value / stats.totalExpenses) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group"
                    onClick={() => categoryValue && openExpenseModal(`${item.name} Expenses`, { category: categoryValue })}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{percentage}%</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.value)}</span>
                      <CursorArrowRaysIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => openExpenseModal('All Expenses', {})}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                View all expenses
              </button>
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Expense Breakdown (YTD)</h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              No expense data available
            </div>
          </Card>
        )}

        {/* Budget vs Actual */}
        {budgetVsActualData.length > 0 ? (
          <BarChartCard
            title="Budget vs Actual"
            subtitle="Active projects comparison"
            data={budgetVsActualData}
            dataKeys={['budget', 'actual']}
            xAxisKey="name"
            valueFormatter={formatCurrency}
            config={{
              colors: ['#3B82F6', '#10B981'],
            }}
          />
        ) : (
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Budget vs Actual</h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              No budget data available
            </div>
          </Card>
        )}
      </div>

      {/* Revenue Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Projects by Revenue */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-gray-400" />
            Top Projects by Revenue (YTD)
          </h3>
          {stats.topProjectsByRevenue.length > 0 ? (
            <div className="space-y-3">
              {stats.topProjectsByRevenue.map((project, idx) => (
                <div key={project.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-gray-200 text-gray-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-500'
                    )}>
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">{project.name}</span>
                  </div>
                  <span className="font-semibold text-green-700 tabular-nums">{formatCurrency(project.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No project revenue data
            </div>
          )}
        </Card>

        {/* Top Clients by Revenue */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-gray-400" />
            Top Clients by Revenue (YTD)
          </h3>
          {stats.topClientsByRevenue.length > 0 ? (
            <div className="space-y-3">
              {stats.topClientsByRevenue.map((client, idx) => (
                <div key={client.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-gray-200 text-gray-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-500'
                    )}>
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">{client.name}</span>
                  </div>
                  <span className="font-semibold text-green-700 tabular-nums">{formatCurrency(client.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No client revenue data
            </div>
          )}
        </Card>
      </div>

      {/* Budget Utilization Summary */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
            Budget Utilization Overview
          </h3>
          <Link href="/dashboard/reports/financial" className="text-sm text-brand-600 hover:text-brand-700">
            View Details
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Total Budget</p>
            <p className="text-xl font-bold text-blue-700 tabular-nums">{formatCurrency(stats.totalBudget)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Total Spent</p>
            <p className="text-xl font-bold text-green-700 tabular-nums">{formatCurrency(stats.totalSpent)}</p>
          </div>
          <div className={cn('p-4 rounded-lg', stats.budgetUtilization > 90 ? 'bg-red-50' : stats.budgetUtilization > 75 ? 'bg-amber-50' : 'bg-gray-50')}>
            <p className="text-xs text-gray-500 mb-1">Budget Utilized</p>
            <p className={cn('text-xl font-bold tabular-nums', stats.budgetUtilization > 90 ? 'text-red-700' : stats.budgetUtilization > 75 ? 'text-amber-700' : 'text-gray-900')}>
              {stats.budgetUtilization.toFixed(1)}%
            </p>
          </div>
        </div>
        {/* Budget progress bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              stats.budgetUtilization > 90 ? 'bg-red-500' :
              stats.budgetUtilization > 75 ? 'bg-amber-500' : 'bg-green-500'
            )}
            style={{ width: `${Math.min(stats.budgetUtilization, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {formatCurrency(stats.totalBudget - stats.totalSpent)} remaining across all projects
        </p>
      </Card>

      {/* Project Profitability Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Project Profitability</h3>
          <Link href="/dashboard/projects" className="text-sm text-brand-600 hover:text-brand-700">
            View All Projects
          </Link>
        </div>
        {projects.filter(p => p.status === 'active' || p.status === 'completed').length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-4">No active or completed projects</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Project</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Budget</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Spent</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-500">Used</th>
                  <th className="text-right py-2 pl-2 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects
                  .filter(p => p.status === 'active' || p.status === 'completed')
                  .slice(0, 10)
                  .map((proj) => {
                    const projExpenses = expenses
                      .filter(e => e.projectId === proj.id && e.status !== 'rejected')
                      .reduce((sum, e) => sum + e.amount, 0);
                    const budget = proj.budget || 0;
                    const spent = proj.currentSpend || projExpenses;
                    const pctUsed = budget > 0 ? (spent / budget) * 100 : 0;

                    return (
                      <tr
                        key={proj.id}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/dashboard/projects/${proj.id}/finances`)}
                      >
                        <td className="py-2.5 pr-4 font-medium text-gray-900">{proj.name}</td>
                        <td className="text-right py-2.5 px-2 text-gray-600">
                          {budget > 0 ? formatCurrency(budget) : '--'}
                        </td>
                        <td className="text-right py-2.5 px-2 font-medium text-gray-900">
                          {formatCurrency(spent)}
                        </td>
                        <td className="text-right py-2.5 px-2">
                          {budget > 0 ? (
                            <span className={cn(
                              'font-medium',
                              pctUsed > 100 ? 'text-red-600' :
                              pctUsed > 90 ? 'text-orange-600' : 'text-green-600'
                            )}>
                              {pctUsed.toFixed(0)}%
                            </span>
                          ) : '--'}
                        </td>
                        <td className="text-right py-2.5 pl-2">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            proj.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          )}>
                            {proj.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Expense Details Modal */}
      <ExpenseDetailsModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        filter={expenseModalFilter}
        title={expenseModalTitle}
      />
    </div>
  );
}
