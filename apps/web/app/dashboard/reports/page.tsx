'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useDashboardReports, useFinancialReports, useOperationalReports } from '@/lib/hooks/useReports';
import { PageHeader, EmptyState, CompactPagination } from '@/components/ui';
import { ReportCard } from '@/components/reports/ReportCard';
import { RevenueChart } from '@/components/reports/RevenueChart';
import { DateRangePicker } from '@/components/reports/DateRangePicker';
import { DateRangePresets, DatePresetValue } from '@/components/ui/DateRangePresets';
import {
  DateRange,
  getDateRangeFromPreset,
} from '@/lib/reports/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { cn } from '@/lib/utils';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  FolderIcon,
  ExclamationCircleIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  ShieldExclamationIcon,
  BoltIcon,
  ScaleIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

// Alert types for the at-risk metrics section
interface BusinessAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'invoice' | 'project' | 'task' | 'cash';
  title: string;
  description: string;
  value?: string;
  href?: string;
}

// Forecast data types
interface CashFlowForecast {
  period: string;
  days: number;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  endingBalance: number;
}

// Custom hook to fetch alert data (overdue invoices, at-risk projects, late tasks)
function useBusinessAlerts(orgId?: string) {
  const [alerts, setAlerts] = useState<BusinessAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [overdueInvoicesTotal, setOverdueInvoicesTotal] = useState(0);
  const [overdueInvoicesCount, setOverdueInvoicesCount] = useState(0);
  const [overBudgetProjectsCount, setOverBudgetProjectsCount] = useState(0);
  const [lateTasksCount, setLateTasksCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    try {
      const now = new Date();
      const alertsList: BusinessAlert[] = [];

      // Fetch overdue invoices
      const invoicesSnap = await getDocs(
        query(collection(db, 'invoices'), where('orgId', '==', orgId))
      );
      let overdueTotal = 0;
      let overdueCount = 0;
      invoicesSnap.docs.forEach(doc => {
        const data = doc.data();
        const status = data.status as string;
        const dueDate = data.dueDate?.toDate?.();
        if (['sent', 'viewed', 'overdue'].includes(status) && dueDate && dueDate < now) {
          overdueTotal += (data.total as number) || 0;
          overdueCount++;
        }
      });
      setOverdueInvoicesTotal(overdueTotal);
      setOverdueInvoicesCount(overdueCount);

      if (overdueCount > 0) {
        alertsList.push({
          id: 'overdue-invoices',
          type: overdueTotal > 10000 ? 'critical' : 'warning',
          category: 'invoice',
          title: `${overdueCount} Overdue Invoice${overdueCount > 1 ? 's' : ''}`,
          description: `${formatCurrency(overdueTotal)} past due`,
          value: formatCurrency(overdueTotal),
          href: '/dashboard/invoices?status=overdue',
        });
      }

      // Fetch projects over budget
      const projectsSnap = await getDocs(
        query(collection(db, 'projects'), where('orgId', '==', orgId))
      );
      const expensesSnap = await getDocs(
        query(collection(db, 'expenses'), where('orgId', '==', orgId), where('status', '==', 'approved'))
      );

      // Sum expenses by project
      const expensesByProject = new Map<string, number>();
      expensesSnap.docs.forEach(doc => {
        const data = doc.data();
        const projectId = data.projectId as string;
        const amount = (data.amount as number) || 0;
        if (projectId) {
          expensesByProject.set(projectId, (expensesByProject.get(projectId) || 0) + amount);
        }
      });

      let overBudgetCount = 0;
      projectsSnap.docs.forEach(doc => {
        const data = doc.data();
        const budget = (data.budget as number) || 0;
        const status = data.status as string;
        if (status === 'active' && budget > 0) {
          const spent = expensesByProject.get(doc.id) || 0;
          if (spent > budget) {
            overBudgetCount++;
          }
        }
      });
      setOverBudgetProjectsCount(overBudgetCount);

      if (overBudgetCount > 0) {
        alertsList.push({
          id: 'over-budget-projects',
          type: overBudgetCount > 3 ? 'critical' : 'warning',
          category: 'project',
          title: `${overBudgetCount} Project${overBudgetCount > 1 ? 's' : ''} Over Budget`,
          description: 'Immediate attention required',
          href: '/dashboard/reports/financial',
        });
      }

      // Fetch late tasks
      const tasksSnap = await getDocs(
        query(collection(db, 'tasks'), where('orgId', '==', orgId))
      );
      let lateCount = 0;
      tasksSnap.docs.forEach(doc => {
        const data = doc.data();
        const status = data.status as string;
        const dueDate = data.dueDate?.toDate?.();
        if (!['completed', 'cancelled'].includes(status) && dueDate && dueDate < now) {
          lateCount++;
        }
      });
      setLateTasksCount(lateCount);

      if (lateCount > 0) {
        alertsList.push({
          id: 'late-tasks',
          type: lateCount > 10 ? 'critical' : 'warning',
          category: 'task',
          title: `${lateCount} Overdue Task${lateCount > 1 ? 's' : ''}`,
          description: 'Tasks past their due date',
          href: '/dashboard/tasks?filter=overdue',
        });
      }

      setAlerts(alertsList);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    overdueInvoicesTotal,
    overdueInvoicesCount,
    overBudgetProjectsCount,
    lateTasksCount,
  };
}

// Custom hook for cash flow forecasting
function useCashFlowForecast(orgId?: string, currentCashPosition?: number) {
  const [forecast, setForecast] = useState<CashFlowForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectedRevenue, setProjectedRevenue] = useState(0);
  const [projectedExpenses, setProjectedExpenses] = useState(0);

  const fetchForecast = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    try {
      const now = new Date();

      // Fetch pending/outstanding invoices for projected inflow
      const invoicesSnap = await getDocs(
        query(collection(db, 'invoices'), where('orgId', '==', orgId))
      );

      // Calculate projected inflows by period (30/60/90 days)
      const inflows = { 30: 0, 60: 0, 90: 0 };
      invoicesSnap.docs.forEach(doc => {
        const data = doc.data();
        const status = data.status as string;
        const dueDate = data.dueDate?.toDate?.();
        const total = (data.total as number) || 0;

        if (['sent', 'viewed', 'overdue', 'draft'].includes(status)) {
          // Estimate when payment will come in based on due date or age
          const expectedDate = dueDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          const daysFromNow = Math.ceil((expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysFromNow <= 30) inflows[30] += total;
          else if (daysFromNow <= 60) inflows[60] += total;
          else if (daysFromNow <= 90) inflows[90] += total;
        }
      });

      // Fetch scheduled work / active projects for projected outflows
      const projectsSnap = await getDocs(
        query(collection(db, 'projects'), where('orgId', '==', orgId))
      );

      // Estimate monthly burn rate from active projects
      let totalActiveBudget = 0;
      let activeProjectCount = 0;
      let avgProjectDuration = 90; // default 90 days

      projectsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'active') {
          totalActiveBudget += (data.budget as number) || 0;
          activeProjectCount++;
          const startDate = data.startDate?.toDate?.();
          const endDate = data.plannedEndDate?.toDate?.() || data.endDate?.toDate?.();
          if (startDate && endDate) {
            const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            avgProjectDuration = (avgProjectDuration + duration) / 2;
          }
        }
      });

      // Estimate monthly outflow based on active budgets spread over duration
      const monthlyBurnRate = activeProjectCount > 0
        ? (totalActiveBudget / avgProjectDuration) * 30
        : 0;

      const outflows = {
        30: monthlyBurnRate,
        60: monthlyBurnRate,
        90: monthlyBurnRate,
      };

      setProjectedRevenue(inflows[30] + inflows[60] + inflows[90]);
      setProjectedExpenses(outflows[30] + outflows[60] + outflows[90]);

      // Build forecast periods
      let runningBalance = currentCashPosition || 0;
      const forecastData: CashFlowForecast[] = [];

      [
        { period: 'Next 30 Days', days: 30 },
        { period: '31-60 Days', days: 60 },
        { period: '61-90 Days', days: 90 },
      ].forEach(({ period, days }) => {
        const inflow = inflows[days as 30 | 60 | 90];
        const outflow = outflows[days as 30 | 60 | 90];
        const netCashFlow = inflow - outflow;
        runningBalance += netCashFlow;

        forecastData.push({
          period,
          days,
          projectedInflow: inflow,
          projectedOutflow: outflow,
          netCashFlow,
          endingBalance: runningBalance,
        });
      });

      setForecast(forecastData);
    } catch (err) {
      console.error('Failed to fetch forecast:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, currentCashPosition]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { forecast, loading, projectedRevenue, projectedExpenses };
}

const ITEMS_PER_PAGE = 10;
const DATE_RANGE_STORAGE_KEY = 'contractoros-reports-dateRange';

export default function ReportsPage() {
  const { profile } = useAuth();
  const orgId = profile?.orgId;

  // Date range state - default to this month
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeFromPreset('this_month')
  );
  const [selectedPreset, setSelectedPreset] = useState<DatePresetValue | null>('this_month');

  // Load date range from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DATE_RANGE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const startDate = new Date(parsed.startDate);
        const endDate = new Date(parsed.endDate);

        // Validate dates are valid and not too old (within last 2 years)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        if (
          !isNaN(startDate.getTime()) &&
          !isNaN(endDate.getTime()) &&
          startDate >= twoYearsAgo &&
          startDate <= endDate
        ) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- initialization from localStorage on mount
          setDateRange({
            startDate,
            endDate,
            label: parsed.label || 'Custom',
          });
          // Restore preset if it was saved
          if (parsed.preset) {
            setSelectedPreset(parsed.preset as DatePresetValue);
          } else {
            setSelectedPreset(null);
          }
        }
      }
    } catch (e) {
      // Invalid data in localStorage, use default
      console.warn('Failed to load saved date range:', e);
    }
  }, []);

  // Save date range to localStorage when it changes
  useEffect(() => {
    if (dateRange?.startDate && dateRange?.endDate) {
      try {
        localStorage.setItem(DATE_RANGE_STORAGE_KEY, JSON.stringify({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
          label: dateRange.label,
          preset: selectedPreset,
        }));
      } catch (e) {
        // localStorage might be full or unavailable
        console.warn('Failed to save date range:', e);
      }
    }
  }, [dateRange, selectedPreset]);

  // Pagination state for tables
  const [profitabilityPage, setProfitabilityPage] = useState(1);
  const [teamPage, setTeamPage] = useState(1);

  // Handle date range preset selection
  const handlePresetSelect = (range: { start: Date; end: Date; label: string }) => {
    setDateRange({
      startDate: range.start,
      endDate: range.end,
      label: range.label,
    });
    // Try to match the preset value from the label
    const presetMap: Record<string, DatePresetValue> = {
      'Today': 'today',
      'Yesterday': 'yesterday',
      'This Week': 'this_week',
      'Last Week': 'last_week',
      'This Month': 'this_month',
      'Last Month': 'last_month',
      'This Quarter': 'this_quarter',
      'Last Quarter': 'last_quarter',
      'This Year': 'this_year',
      'Last Year': 'last_year',
      'Last 7 Days': 'last_7_days',
      'Last 30 Days': 'last_30_days',
      'Last 90 Days': 'last_90_days',
    };
    setSelectedPreset(presetMap[range.label] || null);
  };

  // Handle custom date range change (clears preset selection)
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setSelectedPreset(null);
  };

  // Fetch dashboard data using existing hook
  const {
    loading: dashboardLoading,
    error: dashboardError,
    kpis,
    revenueByMonth,
    projectStatusDistribution,
    teamPerformance,
  } = useDashboardReports(orgId);

  // Fetch financial data for profitability
  const {
    loading: financialLoading,
    summary: financialSummary,
    projectProfitability,
  } = useFinancialReports(orgId);

  // Fetch operational metrics
  useOperationalReports(orgId);

  // Fetch business alerts
  const {
    alerts,
    overdueInvoicesCount,
    overBudgetProjectsCount,
    lateTasksCount,
  } = useBusinessAlerts(orgId);

  // Current cash position for forecasting
  const currentCashPosition = financialSummary?.cashFlow || 0;

  // Fetch cash flow forecast
  const {
    forecast,
    loading: forecastLoading,
    projectedRevenue,
    projectedExpenses,
  } = useCashFlowForecast(orgId, currentCashPosition);

  const loading = dashboardLoading || financialLoading;

  // Transform revenue data for chart
  const revenueChartData = useMemo(() => {
    if (!revenueByMonth?.length) return [];
    return revenueByMonth.map((item) => ({
      label: item.name,
      revenue: item.revenue,
      paid: item.revenue, // All revenue is paid in this dataset
      pending: 0,
    }));
  }, [revenueByMonth]);

  // Get mini chart data for cards
  const revenueChartMini = useMemo(() => {
    return revenueByMonth?.map((item) => item.revenue) || [];
  }, [revenueByMonth]);

  const profitChartMini = useMemo(() => {
    return revenueByMonth?.map((item) => item.profit) || [];
  }, [revenueByMonth]);

  const hoursChartMini = useMemo(() => {
    return teamPerformance?.map((item) => item.hoursLogged) || [];
  }, [teamPerformance]);

  const projectsChartMini = useMemo(() => {
    return projectStatusDistribution?.map((item) => item.value) || [];
  }, [projectStatusDistribution]);

  // Calculate business health score
  const healthScore = useMemo(() => {
    if (!financialSummary || !kpis) return null;
    let score = 100;

    // Deduct points for issues
    if (overdueInvoicesCount > 0) score -= Math.min(overdueInvoicesCount * 5, 20);
    if (overBudgetProjectsCount > 0) score -= Math.min(overBudgetProjectsCount * 10, 30);
    if (lateTasksCount > 10) score -= 15;
    else if (lateTasksCount > 0) score -= Math.min(lateTasksCount * 2, 10);
    if (financialSummary.profitMargin < 10) score -= 20;
    else if (financialSummary.profitMargin < 20) score -= 10;

    return Math.max(0, Math.min(100, score));
  }, [financialSummary, kpis, overdueInvoicesCount, overBudgetProjectsCount, lateTasksCount]);

  const healthScoreLabel = useMemo(() => {
    if (healthScore === null) return 'Loading...';
    if (healthScore >= 80) return 'Excellent';
    if (healthScore >= 60) return 'Good';
    if (healthScore >= 40) return 'Needs Attention';
    return 'Critical';
  }, [healthScore]);

  const healthScoreColor = useMemo(() => {
    if (healthScore === null) return 'gray';
    if (healthScore >= 80) return 'green';
    if (healthScore >= 60) return 'blue';
    if (healthScore >= 40) return 'amber';
    return 'red';
  }, [healthScore]);

  // Error state
  if (!orgId) {
    return (
      <div className="p-8 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-heading font-medium tracking-tight text-gray-900">Not authenticated</h3>
        <p className="text-gray-500 mt-1">Please log in to view reports.</p>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="p-8 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-heading font-medium tracking-tight text-gray-900">Failed to load reports</h3>
        <p className="text-gray-500 mt-1">{dashboardError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Command Center"
        description="Executive overview of your business health and performance"
        actions={
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />
        }
      />

      {/* Quick Date Presets */}
      <DateRangePresets
        presets="comparison"
        selectedPreset={selectedPreset}
        onSelect={handlePresetSelect}
        layout="scroll"
        variant="pills"
        size="sm"
        label="Quick Date Selection"
      />

      {/* Executive Summary Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Health Score */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center border-4',
                healthScoreColor === 'green' && 'border-green-400 bg-green-400/20',
                healthScoreColor === 'blue' && 'border-blue-400 bg-blue-400/20',
                healthScoreColor === 'amber' && 'border-amber-400 bg-amber-400/20',
                healthScoreColor === 'red' && 'border-red-400 bg-red-400/20',
                healthScoreColor === 'gray' && 'border-gray-400 bg-gray-400/20',
              )}>
                <div className="text-center">
                  <div className="text-2xl font-bold">{healthScore ?? '--'}</div>
                  <div className="text-xs opacity-80">Score</div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold tracking-tight mb-1">Business Health</h2>
              <p className={cn(
                'text-sm font-medium',
                healthScoreColor === 'green' && 'text-green-400',
                healthScoreColor === 'blue' && 'text-blue-400',
                healthScoreColor === 'amber' && 'text-amber-400',
                healthScoreColor === 'red' && 'text-red-400',
              )}>
                {healthScoreLabel}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Based on finances, projects, and task performance
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Revenue</p>
              <p className="text-xl font-semibold mt-1">
                {kpis ? formatCurrency(kpis.totalRevenue) : '$0'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Profit</p>
              <p className={cn(
                'text-xl font-semibold mt-1',
                financialSummary && financialSummary.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {financialSummary ? formatCurrency(financialSummary.netProfit) : '$0'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Cash Position</p>
              <p className={cn(
                'text-xl font-semibold mt-1',
                currentCashPosition >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {formatCurrency(currentCashPosition)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Outstanding</p>
              <p className="text-xl font-semibold mt-1 text-amber-400">
                {kpis ? formatCurrency(kpis.outstandingInvoices) : '$0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <ShieldExclamationIcon className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-heading font-semibold text-gray-900">Attention Required</h3>
            <span className="ml-auto text-xs text-gray-500">{alerts.length} alert{alerts.length > 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href || '#'}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm',
                  alert.type === 'critical' && 'border-red-200 bg-red-50 hover:border-red-300',
                  alert.type === 'warning' && 'border-amber-200 bg-amber-50 hover:border-amber-300',
                  alert.type === 'info' && 'border-blue-200 bg-blue-50 hover:border-blue-300',
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-full',
                  alert.type === 'critical' && 'bg-red-100',
                  alert.type === 'warning' && 'bg-amber-100',
                  alert.type === 'info' && 'bg-blue-100',
                )}>
                  {alert.category === 'invoice' && (
                    <DocumentTextIcon className={cn('h-4 w-4', alert.type === 'critical' ? 'text-red-600' : 'text-amber-600')} />
                  )}
                  {alert.category === 'project' && (
                    <FolderIcon className={cn('h-4 w-4', alert.type === 'critical' ? 'text-red-600' : 'text-amber-600')} />
                  )}
                  {alert.category === 'task' && (
                    <ClockIcon className={cn('h-4 w-4', alert.type === 'critical' ? 'text-red-600' : 'text-amber-600')} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    alert.type === 'critical' ? 'text-red-800' : alert.type === 'warning' ? 'text-amber-800' : 'text-blue-800',
                  )}>
                    {alert.title}
                  </p>
                  <p className={cn(
                    'text-xs mt-0.5',
                    alert.type === 'critical' ? 'text-red-600' : alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600',
                  )}>
                    {alert.description}
                  </p>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics with Drill-down Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card - Links to Financial Reports */}
        <Link href="/dashboard/reports/financial" className="block group">
          <ReportCard
            title="Revenue"
            value={kpis ? formatCurrency(kpis.totalRevenue) : '$0'}
            subtitle={kpis ? `${formatPercent(kpis.profitMargin)} margin` : 'No data'}
            chartData={revenueChartMini}
            icon={CurrencyDollarIcon}
            iconColor="green"
            loading={loading}
            className="group-hover:shadow-md group-hover:border-green-200 transition-all"
          />
        </Link>

        {/* Profitability Card - Links to Financial Reports */}
        <Link href="/dashboard/reports/financial" className="block group">
          <ReportCard
            title="Profitability"
            value={financialSummary ? formatPercent(financialSummary.profitMargin) : '0%'}
            subtitle={financialSummary ? `${formatCurrency(financialSummary.grossProfit)} profit` : 'No data'}
            chartData={profitChartMini}
            icon={ChartBarIcon}
            iconColor={
              financialSummary && financialSummary.profitMargin >= 20
                ? 'green'
                : financialSummary && financialSummary.profitMargin >= 10
                ? 'amber'
                : 'red'
            }
            loading={loading}
            className="group-hover:shadow-md group-hover:border-blue-200 transition-all"
          />
        </Link>

        {/* Hours Card - Links to Operational Reports */}
        <Link href="/dashboard/reports/operational" className="block group">
          <ReportCard
            title="Hours Logged"
            value={kpis ? `${Math.round(kpis.hoursLoggedThisMonth)} hrs` : '0 hrs'}
            subtitle={kpis ? `${kpis.activeTeamMembers} team members` : 'No data'}
            chartData={hoursChartMini}
            icon={ClockIcon}
            iconColor="purple"
            loading={loading}
            className="group-hover:shadow-md group-hover:border-purple-200 transition-all"
          />
        </Link>

        {/* Projects Card - Links to Projects */}
        <Link href="/dashboard/projects" className="block group">
          <ReportCard
            title="Projects"
            value={kpis?.activeProjects ?? 0}
            subtitle={kpis ? `${kpis.completedProjects} completed` : 'No data'}
            chartData={projectsChartMini}
            icon={FolderIcon}
            iconColor="blue"
            loading={loading}
            className="group-hover:shadow-md group-hover:border-blue-200 transition-all"
          />
        </Link>
      </div>

      {/* Cash Flow Forecast Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-heading font-semibold text-gray-900 flex items-center gap-2">
              <BoltIcon className="h-4 w-4 text-blue-500" />
              Cash Flow Forecast
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Projected cash flow based on pending invoices and scheduled work
            </p>
          </div>
          <Link
            href="/dashboard/reports/financial"
            className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
          >
            View Details <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>

        {forecastLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Projected Inflow (90d)</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(projectedRevenue)}
                </p>
              </div>
              <div className="text-center border-x border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Projected Outflow (90d)</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(projectedExpenses)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Net Cash Flow (90d)</p>
                <p className={cn(
                  'text-lg font-semibold',
                  projectedRevenue - projectedExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatCurrency(projectedRevenue - projectedExpenses)}
                </p>
              </div>
            </div>

            {/* Forecast Periods */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {forecast.map((period) => (
                <div
                  key={period.period}
                  className={cn(
                    'p-3 rounded-lg border',
                    period.netCashFlow >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">{period.period}</span>
                    <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Inflow:</span>
                      <span className="font-medium text-green-600">
                        +{formatCurrency(period.projectedInflow)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Outflow:</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(period.projectedOutflow)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                      <span className="text-gray-600 font-medium">Net:</span>
                      <span className={cn(
                        'font-semibold',
                        period.netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'
                      )}>
                        {period.netCashFlow >= 0 ? '+' : ''}{formatCurrency(period.netCashFlow)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Links to Report Sections */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/dashboard/reports/financial"
          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
        >
          <div className="p-2 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
            <BanknotesIcon className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Financial</p>
            <p className="text-xs text-gray-500 truncate">P&L, budgets, cash flow</p>
          </div>
          <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </Link>

        <Link
          href="/dashboard/reports/operational"
          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
        >
          <div className="p-2 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
            <WrenchScrewdriverIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Operational</p>
            <p className="text-xs text-gray-500 truncate">Tasks, hours, timelines</p>
          </div>
          <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </Link>

        <Link
          href="/dashboard/reports/benchmarking"
          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
        >
          <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
            <ScaleIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Benchmarking</p>
            <p className="text-xs text-gray-500 truncate">Compare projects</p>
          </div>
          <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </Link>

        <Link
          href="/dashboard/reports/detailed"
          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
        >
          <div className="p-2 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors">
            <ClipboardDocumentListIcon className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">Detailed</p>
            <p className="text-xs text-gray-500 truncate">Export & drill down</p>
          </div>
          <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </Link>
      </div>

      {/* Revenue Chart */}
      <RevenueChart
        data={revenueChartData}
        title="Revenue by Month"
        showBreakdown={false}
        height={350}
      />

      {/* Profitability Table */}
      {projectProfitability && projectProfitability.length > 0 && (() => {
        const totalProfitabilityPages = Math.ceil(projectProfitability.length / ITEMS_PER_PAGE);
        const profitabilityStartIdx = (profitabilityPage - 1) * ITEMS_PER_PAGE;
        const profitabilityEndIdx = profitabilityStartIdx + ITEMS_PER_PAGE;
        const paginatedProfitability = projectProfitability.slice(profitabilityStartIdx, profitabilityEndIdx);
        const showProfitabilityPagination = projectProfitability.length > ITEMS_PER_PAGE;

        return (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-semibold text-gray-900">
                Project Profitability
              </h3>
              {showProfitabilityPagination && (
                <span className="text-xs text-gray-500">
                  {profitabilityStartIdx + 1}-{Math.min(profitabilityEndIdx, projectProfitability.length)} of {projectProfitability.length}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual Spend
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variance
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedProfitability.map((project, idx) => {
                    const marginPercent = project.budget > 0
                      ? (project.variance / project.budget) * 100
                      : 0;
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {project.projectName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {formatCurrency(project.budget)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {formatCurrency(project.actualSpend)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span
                            className={
                              project.variance >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {formatCurrency(project.variance)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              marginPercent >= 20
                                ? 'bg-green-100 text-green-800'
                                : marginPercent >= 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {marginPercent >= 0 ? 'On Budget' : 'Over Budget'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {showProfitabilityPagination && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <CompactPagination
                  currentPage={profitabilityPage}
                  totalPages={totalProfitabilityPages}
                  hasNextPage={profitabilityPage < totalProfitabilityPages}
                  hasPreviousPage={profitabilityPage > 1}
                  onNextPage={() => setProfitabilityPage(p => Math.min(p + 1, totalProfitabilityPages))}
                  onPreviousPage={() => setProfitabilityPage(p => Math.max(p - 1, 1))}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* Team Performance Table */}
      {teamPerformance && teamPerformance.length > 0 && (() => {
        const totalTeamPages = Math.ceil(teamPerformance.length / ITEMS_PER_PAGE);
        const teamStartIdx = (teamPage - 1) * ITEMS_PER_PAGE;
        const teamEndIdx = teamStartIdx + ITEMS_PER_PAGE;
        const paginatedTeam = teamPerformance.slice(teamStartIdx, teamEndIdx);
        const showTeamPagination = teamPerformance.length > ITEMS_PER_PAGE;

        return (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-heading font-semibold text-gray-900">
                Team Performance
              </h3>
              {showTeamPagination && (
                <span className="text-xs text-gray-500">
                  {teamStartIdx + 1}-{Math.min(teamEndIdx, teamPerformance.length)} of {teamPerformance.length}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Member
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours Logged
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasks Completed
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficiency
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedTeam.map((member, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {member.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {member.hoursLogged} hrs
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {member.tasksCompleted}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            member.efficiency >= 80
                              ? 'bg-green-100 text-green-800'
                              : member.efficiency >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {member.efficiency}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showTeamPagination && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <CompactPagination
                  currentPage={teamPage}
                  totalPages={totalTeamPages}
                  hasNextPage={teamPage < totalTeamPages}
                  hasPreviousPage={teamPage > 1}
                  onNextPage={() => setTeamPage(p => Math.min(p + 1, totalTeamPages))}
                  onPreviousPage={() => setTeamPage(p => Math.max(p - 1, 1))}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* Empty state */}
      {!loading && !kpis && (
        <EmptyState
          icon={<FolderIcon className="h-full w-full" />}
          title="No data yet"
          description="Start creating projects and invoices to see your reports."
          action={{ label: 'Create Project', href: '/dashboard/projects/new' }}
        />
      )}
    </div>
  );
}
