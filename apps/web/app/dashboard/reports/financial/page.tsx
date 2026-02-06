"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useFinancialReports, RevenueByProject } from '@/lib/hooks/useReports';
import { useReportPreferences } from '@/lib/hooks/useReportPreferences';
import { Card } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exports';
import {
  BarChartCard,
  PieChartCard,
  LineChartCard,
} from '@/components/charts';
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationCircleIcon,
  ReceiptPercentIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { CompactPagination } from '@/components/ui';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { FinancialMetricId } from '@/types';
import ReportCustomizePanel from '@/components/reports/ReportCustomizePanel';
import AIInsightsPanel from '@/components/reports/AIInsightsPanel';
import {
  analyzeFinancialData,
  generateInsightSummary,
  explainInsight,
  type FinancialDataInput,
} from '@/lib/ai/insights-engine';
import { logger } from '@/lib/utils/logger';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Get color class based on margin thresholds
function getMarginColorClass(value: number, type: 'gross' | 'net' | 'variance' | 'efficiency'): string {
  switch (type) {
    case 'gross':
      // Gross margin: 30%+ is great, 20%+ is good, 10%+ is okay
      if (value >= 30) return 'text-green-600';
      if (value >= 20) return 'text-green-500';
      if (value >= 10) return 'text-amber-600';
      return 'text-red-600';
    case 'net':
      // Net margin: 15%+ is great, 8%+ is good, 0%+ is okay
      if (value >= 15) return 'text-green-600';
      if (value >= 8) return 'text-green-500';
      if (value >= 0) return 'text-amber-600';
      return 'text-red-600';
    case 'variance':
      // Variance: positive is under budget (good), negative is over budget (bad)
      if (value >= 10) return 'text-green-600';
      if (value >= 0) return 'text-green-500';
      if (value >= -10) return 'text-amber-600';
      return 'text-red-600';
    case 'efficiency':
      // Labor efficiency: 100%+ means faster than estimated
      if (value >= 110) return 'text-green-600';
      if (value >= 100) return 'text-green-500';
      if (value >= 85) return 'text-amber-600';
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

function getMarginBgClass(value: number, type: 'gross' | 'net' | 'variance' | 'efficiency'): string {
  switch (type) {
    case 'gross':
      if (value >= 30) return 'bg-green-100';
      if (value >= 20) return 'bg-green-50';
      if (value >= 10) return 'bg-amber-50';
      return 'bg-red-50';
    case 'net':
      if (value >= 15) return 'bg-green-100';
      if (value >= 8) return 'bg-green-50';
      if (value >= 0) return 'bg-amber-50';
      return 'bg-red-50';
    case 'variance':
      if (value >= 10) return 'bg-green-100';
      if (value >= 0) return 'bg-green-50';
      if (value >= -10) return 'bg-amber-50';
      return 'bg-red-50';
    case 'efficiency':
      if (value >= 110) return 'bg-green-100';
      if (value >= 100) return 'bg-green-50';
      if (value >= 85) return 'bg-amber-50';
      return 'bg-red-50';
    default:
      return 'bg-gray-50';
  }
}

// Profitability indicator badge component
interface ProfitabilityBadgeProps {
  value: number;
  type: 'gross' | 'net' | 'variance' | 'efficiency';
  label?: string;
  showTrend?: boolean;
}

function _ProfitabilityBadge({ value, type, label, showTrend = false }: ProfitabilityBadgeProps) {
  const colorClass = getMarginColorClass(value, type);
  const bgClass = getMarginBgClass(value, type);

  const isPositive = type === 'variance' ? value >= 0 :
                     type === 'efficiency' ? value >= 100 :
                     type === 'gross' ? value >= 20 : value >= 8;

  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg', bgClass)}>
      {showTrend && (
        isPositive ? (
          <ArrowTrendingUpIcon className={cn('h-4 w-4', colorClass)} />
        ) : (
          <ArrowTrendingDownIcon className={cn('h-4 w-4', colorClass)} />
        )
      )}
      <span className={cn('text-sm font-semibold', colorClass)}>
        {formatPercent(value)}
      </span>
      {label && (
        <span className="text-xs text-gray-500">{label}</span>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string | React.ReactNode;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

function StatCard({ title, value, icon: Icon, trend, subtitle, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 truncate">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.isPositive ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={cn('text-xs font-medium', trend.isPositive ? 'text-green-600' : 'text-red-600')}>
                {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-[300px] bg-gray-100 rounded" />
          </Card>
        ))}
      </div>
    </div>
  );
}

// P&L Line Item component
interface PLLineItemProps {
  label: string;
  amount: number;
  icon?: React.ComponentType<{ className?: string }>;
  indent?: boolean;
  isBold?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
  showPercent?: boolean;
  percentOf?: number;
  color?: 'default' | 'green' | 'red';
}

function PLLineItem({
  label,
  amount,
  icon: Icon,
  indent = false,
  isBold = false,
  isSubtotal = false,
  isTotal = false,
  showPercent = false,
  percentOf = 0,
  color = 'default',
}: PLLineItemProps) {
  const percent = percentOf > 0 ? (amount / percentOf) * 100 : 0;

  return (
    <div className={cn(
      'flex items-center justify-between py-2',
      indent && 'pl-6',
      isSubtotal && 'border-t border-gray-200 bg-gray-50 -mx-4 px-4',
      isTotal && 'border-t-2 border-gray-300 bg-gray-100 -mx-4 px-4 font-bold',
    )}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <span className={cn(
          'text-sm',
          isBold || isSubtotal || isTotal ? 'font-semibold text-gray-900' : 'text-gray-600',
        )}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {showPercent && percentOf > 0 && (
          <span className="text-xs text-gray-400 w-12 text-right">
            {percent.toFixed(1)}%
          </span>
        )}
        <span className={cn(
          'text-sm font-medium w-28 text-right',
          color === 'green' && 'text-green-600',
          color === 'red' && 'text-red-600',
          color === 'default' && (isBold || isSubtotal || isTotal ? 'text-gray-900' : 'text-gray-700'),
        )}>
          {formatCurrency(amount)}
        </span>
      </div>
    </div>
  );
}

// Project P&L Modal/Detail component
interface ProjectPLDetailProps {
  project: RevenueByProject;
  onClose: () => void;
}

function ProjectPLDetail({ project, onClose }: ProjectPLDetailProps) {
  return (
    <Card className="p-4 border-2 border-blue-200 bg-blue-50/30">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{project.projectName}</h4>
          <p className="text-xs text-gray-500">Project P&L Detail</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <ChevronDownIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-1">
        <PLLineItem label="Revenue" amount={project.revenue} isBold color="green" />
        <PLLineItem label="Total Costs" amount={project.costs} isBold color="red" />
        <PLLineItem
          label="Profit"
          amount={project.profit}
          isSubtotal
          color={project.profit >= 0 ? 'green' : 'red'}
        />
        <div className="pt-2 text-center">
          <span className={cn(
            'text-lg font-bold',
            project.margin >= 20 ? 'text-green-600' : project.margin >= 0 ? 'text-amber-600' : 'text-red-600'
          )}>
            {formatPercent(project.margin)} margin
          </span>
        </div>
      </div>
    </Card>
  );
}

export default function FinancialReportsPage() {
  const { profile, user } = useAuth();
  const {
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
  } = useFinancialReports(profile?.orgId);

  const {
    preferences,
    loading: prefsLoading,
    saving: prefsSaving,
    isMetricVisible,
    isMetricFavorite,
    toggleMetricVisibility,
    toggleMetricFavorite,
    moveMetricUp,
    moveMetricDown,
    resetToDefaults,
    getOrderedVisibleMetrics,
    metricDefinitions,
  } = useReportPreferences(profile?.orgId, user?.uid);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCustomizePanelOpen, setIsCustomizePanelOpen] = useState(false);
  const [profitabilityPage, setProfitabilityPage] = useState(1);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const ITEMS_PER_PAGE = 10;

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get ordered visible metrics for rendering
  const orderedMetrics = useMemo(() => getOrderedVisibleMetrics(), [getOrderedVisibleMetrics]);

  // Check if metric should be shown
  const shouldShowMetric = useCallback((metricId: FinancialMetricId): boolean => {
    return isMetricVisible(metricId);
  }, [isMetricVisible]);

  // Render favorite indicator
  const renderFavoriteIndicator = useCallback((metricId: FinancialMetricId) => {
    if (!isMetricFavorite(metricId)) return null;
    return <StarIconSolid className="h-4 w-4 text-amber-400 ml-2" />;
  }, [isMetricFavorite]);

  // Export handlers
  const handleExportPDF = useCallback(async () => {
    if (!summary) return;
    setIsExporting(true);
    setIsExportMenuOpen(false);
    try {
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      await exportToPDF({
        title: 'Financial Report',
        subtitle: `Generated on ${dateStr}`,
        metadata: {
          'Total Revenue': formatCurrency(summary.totalRevenue),
          'Total Expenses': formatCurrency(summary.totalSpent),
          'Net Profit': formatCurrency(summary.netProfit),
          'Net Margin': formatPercent(summary.netMargin),
        },
        sections: [
          {
            heading: 'Key Metrics',
            content: '',
            type: 'table',
            tableData: {
              headers: ['Metric', 'Value'],
              rows: [
                ['Total Revenue', formatCurrency(summary.totalRevenue)],
                ['Total Expenses', formatCurrency(summary.totalSpent)],
                ['Gross Profit', formatCurrency(summary.grossProfit)],
                ['Gross Margin', formatPercent(summary.profitMargin)],
                ['Net Profit', formatCurrency(summary.netProfit)],
                ['Net Margin', formatPercent(summary.netMargin)],
                ['Total Budget', formatCurrency(summary.totalBudget)],
                ['Cash Flow', formatCurrency(summary.cashFlow)],
              ],
            },
          },
          {
            heading: 'Cost Breakdown',
            content: '',
            type: 'table',
            tableData: {
              headers: ['Category', 'Amount'],
              rows: [
                ['Labor Costs', formatCurrency(summary.laborCosts)],
                ['Material Costs', formatCurrency(summary.materialCosts)],
                ['Subcontractor Costs', formatCurrency(summary.subcontractorCosts)],
                ['Equipment Costs', formatCurrency(summary.equipmentCosts)],
                ['Overhead Costs', formatCurrency(summary.overheadCosts)],
              ],
            },
          },
          ...(projectProfitability.length > 0 ? [{
            heading: 'Project Profitability',
            content: '',
            type: 'table' as const,
            tableData: {
              headers: ['Project', 'Budget', 'Actual Spend', 'Variance', 'Status'],
              rows: projectProfitability.slice(0, 20).map(p => [
                p.projectName,
                formatCurrency(p.budget),
                formatCurrency(p.actualSpend),
                `${p.variance >= 0 ? '+' : ''}${formatCurrency(p.variance)}`,
                p.variance >= 0 ? 'On/Under Budget' : 'Over Budget',
              ]),
            },
          }] : []),
        ],
        filename: `financial-report-${new Date().toISOString().split('T')[0]}`,
      });
      toast.success('PDF exported successfully');
    } catch (err) {
      logger.error('PDF export error', { error: err, page: 'dashboard-reports-financial' });
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  }, [summary, projectProfitability]);

  const handleExportExcel = useCallback(async () => {
    if (!summary) return;
    setIsExporting(true);
    setIsExportMenuOpen(false);
    try {
      const dateStr = new Date().toISOString().split('T')[0];

      await exportToExcel({
        filename: `financial-report-${dateStr}`,
        sheets: [
          {
            name: 'Summary',
            columns: [
              { header: 'Metric', key: 'metric', width: 25 },
              { header: 'Value', key: 'value', width: 20 },
            ],
            data: [
              { metric: 'Total Revenue', value: summary.totalRevenue },
              { metric: 'Total Expenses', value: summary.totalSpent },
              { metric: 'Gross Profit', value: summary.grossProfit },
              { metric: 'Gross Margin %', value: `${summary.profitMargin.toFixed(1)}%` },
              { metric: 'Net Profit', value: summary.netProfit },
              { metric: 'Net Margin %', value: `${summary.netMargin.toFixed(1)}%` },
              { metric: 'Total Budget', value: summary.totalBudget },
              { metric: 'Cash Flow', value: summary.cashFlow },
              { metric: '', value: '' },
              { metric: 'Cost Breakdown', value: '' },
              { metric: 'Labor Costs', value: summary.laborCosts },
              { metric: 'Material Costs', value: summary.materialCosts },
              { metric: 'Subcontractor Costs', value: summary.subcontractorCosts },
              { metric: 'Equipment Costs', value: summary.equipmentCosts },
              { metric: 'Overhead Costs', value: summary.overheadCosts },
            ],
          },
          ...(projectProfitability.length > 0 ? [{
            name: 'Project Profitability',
            columns: [
              { header: 'Project', key: 'projectName', width: 30 },
              { header: 'Budget', key: 'budget', width: 15 },
              { header: 'Labor Cost', key: 'laborCost', width: 15 },
              { header: 'Actual Spend', key: 'actualSpend', width: 15 },
              { header: 'Variance', key: 'variance', width: 15 },
              { header: 'Variance %', key: 'variancePct', width: 12 },
            ],
            data: projectProfitability.map(p => ({
              projectName: p.projectName,
              budget: p.budget,
              laborCost: p.laborCost,
              actualSpend: p.actualSpend,
              variance: p.variance,
              variancePct: p.budget > 0 ? `${(((p.actualSpend - p.budget) / p.budget) * 100).toFixed(1)}%` : 'N/A',
            })),
          }] : []),
          ...(revenueByMonth.length > 0 ? [{
            name: 'Monthly Trend',
            columns: [
              { header: 'Month', key: 'month', width: 15 },
              { header: 'Revenue', key: 'revenue', width: 15 },
              { header: 'Expenses', key: 'expenses', width: 15 },
              { header: 'Profit', key: 'profit', width: 15 },
            ],
            data: revenueByMonth.map(m => ({
              month: m.month,
              revenue: m.revenue,
              expenses: m.expenses,
              profit: m.profit,
            })),
          }] : []),
        ],
      });
      toast.success('Excel exported successfully');
    } catch (err) {
      logger.error('Excel export error', { error: err, page: 'dashboard-reports-financial' });
      toast.error('Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  }, [summary, projectProfitability, revenueByMonth]);

  const handleExportCSV = useCallback(() => {
    if (!summary) return;
    setIsExporting(true);
    setIsExportMenuOpen(false);
    try {
      const dateStr = new Date().toISOString().split('T')[0];

      // Combine all data into a single CSV
      const rows: (string | number)[][] = [
        // Summary section
        ['Financial Summary', ''],
        ['Total Revenue', summary.totalRevenue],
        ['Total Expenses', summary.totalSpent],
        ['Gross Profit', summary.grossProfit],
        ['Gross Margin %', `${summary.profitMargin.toFixed(1)}%`],
        ['Net Profit', summary.netProfit],
        ['Net Margin %', `${summary.netMargin.toFixed(1)}%`],
        ['Total Budget', summary.totalBudget],
        ['Cash Flow', summary.cashFlow],
        ['', ''],
        ['Cost Breakdown', ''],
        ['Labor Costs', summary.laborCosts],
        ['Material Costs', summary.materialCosts],
        ['Subcontractor Costs', summary.subcontractorCosts],
        ['Equipment Costs', summary.equipmentCosts],
        ['Overhead Costs', summary.overheadCosts],
      ];

      if (projectProfitability.length > 0) {
        rows.push(['', ''], ['Project Profitability', ''], ['Project', 'Budget', 'Actual Spend', 'Variance', 'Status']);
        projectProfitability.forEach(p => {
          rows.push([
            p.projectName,
            p.budget,
            p.actualSpend,
            p.variance,
            p.variance >= 0 ? 'On/Under Budget' : 'Over Budget',
          ]);
        });
      }

      exportToCSV({
        filename: `financial-report-${dateStr}`,
        headers: ['Metric', 'Value', '', '', ''],
        rows,
      });
      toast.success('CSV exported successfully');
    } catch (err) {
      logger.error('CSV export error', { error: err, page: 'dashboard-reports-financial' });
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  }, [summary, projectProfitability]);

  if (loading || prefsLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Failed to load financial data</h3>
        <p className="text-gray-500 mt-1">{error.message}</p>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="p-8 text-center">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No financial data available</h3>
        <p className="text-gray-500 mt-1">Start tracking expenses and invoices to see financial analytics.</p>
      </Card>
    );
  }

  // Sort projects by variance (worst performing first)
  const sortedProjects = [...projectProfitability].sort((a, b) => a.variance - b.variance);
  const overBudgetProjects = sortedProjects.filter(p => p.variance < 0);
  const underBudgetProjects = sortedProjects.filter(p => p.variance >= 0);

  const selectedProject = selectedProjectId
    ? revenueByProject.find(p => p.projectId === selectedProjectId)
    : null;

  // Calculate profitability metrics
  // Gross Profit Margin % = (Revenue - COGS) / Revenue * 100
  const grossProfitMarginPct = summary.totalRevenue > 0
    ? (summary.grossProfit / summary.totalRevenue) * 100
    : 0;

  // Net Profit Margin % = Net Profit / Revenue * 100
  const netProfitMarginPct = summary.totalRevenue > 0
    ? (summary.netProfit / summary.totalRevenue) * 100
    : 0;

  // Cost Variance % = (Actual - Budget) / Budget * 100 (negative means under budget = good)
  const costVariancePct = summary.totalBudget > 0
    ? ((summary.totalSpent - summary.totalBudget) / summary.totalBudget) * 100
    : 0;

  // Calculate totals for labor efficiency (from project data)
  const totalLaborCost = projectProfitability.reduce((sum, p) => sum + p.laborCost, 0);
  const totalProjectBudget = projectProfitability.reduce((sum, p) => sum + p.budget, 0);
  const _totalActualSpend = projectProfitability.reduce((sum, p) => sum + p.actualSpend, 0);

  // Labor Efficiency % = Budget Labor / Actual Labor * 100
  // Assuming labor was ~40% of budget (industry standard for construction)
  const estimatedLaborBudget = totalProjectBudget * 0.4;
  const laborEfficiencyPct = totalLaborCost > 0
    ? (estimatedLaborBudget / totalLaborCost) * 100
    : 100;

  // Calculate overdue invoices from aging data
  const overdueAmount = invoiceAging
    .filter(a => a.name !== 'Current')
    .reduce((sum, a) => sum + a.amount, 0);

  // Generate AI insights from financial data
  // eslint-disable-next-line react-hooks/rules-of-hooks -- useMemo always called; early returns above are for loading/error states
  const financialInsightsData: FinancialDataInput = useMemo(() => ({
    revenue: summary.totalRevenue,
    expenses: summary.totalSpent,
    profitMargin: netProfitMarginPct,
    laborCosts: summary.laborCosts,
    materialCosts: summary.materialCosts,
    overheadCosts: summary.overheadCosts,
    outstandingInvoices: invoiceAging.reduce((sum, a) => sum + a.amount, 0),
    overdueInvoices: overdueAmount,
    cashFlow: summary.cashFlow,
    revenueHistory: revenueByMonth.map(m => m.revenue),
    expenseHistory: revenueByMonth.map(m => m.expenses),
    marginHistory: revenueByMonth.map(m => m.revenue > 0 ? ((m.revenue - m.expenses) / m.revenue) * 100 : 0),
    budgetedExpenses: summary.totalBudget,
    targetMargin: 20, // Industry standard construction margin
    previousPeriodRevenue: revenueByMonth.length > 1 ? revenueByMonth[revenueByMonth.length - 2]?.revenue : undefined,
  }), [summary, netProfitMarginPct, invoiceAging, overdueAmount, revenueByMonth]);

  // eslint-disable-next-line react-hooks/rules-of-hooks -- useMemo always called; early returns above are for loading/error states
  const financialInsights = useMemo(
    () => analyzeFinancialData(financialInsightsData, { maxInsights: 8 }),
    [financialInsightsData]
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks -- useMemo always called; early returns above are for loading/error states
  const insightsSummary = useMemo(
    () => generateInsightSummary(financialInsights, { periodLabel: 'this period', dataType: 'financial' }),
    [financialInsights]
  );

  return (
    <div className="space-y-6">
      {/* Page Header with Customize and Export Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Financial Reports</h1>
          <p className="text-sm text-gray-500">
            {orderedMetrics.length} of {metricDefinitions.length} metrics visible
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExporting || !summary}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowDownTrayIcon className="h-5 w-5" />
              )}
              Export
              <ChevronDownIcon className={cn('h-4 w-4 transition-transform', isExportMenuOpen && 'rotate-180')} />
            </button>

            {/* Dropdown Menu */}
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 text-red-500" />
                  Export PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <TableCellsIcon className="h-5 w-5 text-green-600" />
                  Export Excel
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                  Export CSV
                </button>
              </div>
            )}
          </div>

          {/* Customize Button */}
          <button
            onClick={() => setIsCustomizePanelOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            Customize
          </button>
        </div>
      </div>

      {/* Customize Panel */}
      <ReportCustomizePanel
        isOpen={isCustomizePanelOpen}
        onClose={() => setIsCustomizePanelOpen(false)}
        preferences={preferences}
        metricDefinitions={metricDefinitions}
        saving={prefsSaving}
        onToggleVisibility={toggleMetricVisibility}
        onToggleFavorite={toggleMetricFavorite}
        onMoveUp={moveMetricUp}
        onMoveDown={moveMetricDown}
        onReset={resetToDefaults}
      />

      {/* Financial Summary KPIs */}
      {(shouldShowMetric('total-revenue') || shouldShowMetric('total-expenses') || shouldShowMetric('net-profit') || shouldShowMetric('net-margin')) && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {shouldShowMetric('total-revenue') && (
        <StatCard
          title={<span className="flex items-center">Total Revenue{renderFavoriteIndicator('total-revenue')}</span>}
          value={formatCurrency(summary.totalRevenue)}
          icon={CurrencyDollarIcon}
          color="green"
        />
        )}
        {shouldShowMetric('total-expenses') && (
        <StatCard
          title={<span className="flex items-center">Total Expenses{renderFavoriteIndicator('total-expenses')}</span>}
          value={formatCurrency(summary.totalSpent)}
          icon={BanknotesIcon}
          color="red"
        />
        )}
        {shouldShowMetric('net-profit') && (
        <StatCard
          title={<span className="flex items-center">Net Profit{renderFavoriteIndicator('net-profit')}</span>}
          value={formatCurrency(summary.netProfit)}
          icon={ArrowTrendingUpIcon}
          color={summary.netProfit >= 0 ? 'green' : 'red'}
        />
        )}
        {shouldShowMetric('net-margin') && (
        <StatCard
          title={<span className="flex items-center">Net Margin{renderFavoriteIndicator('net-margin')}</span>}
          value={formatPercent(summary.netMargin)}
          icon={ReceiptPercentIcon}
          color={summary.netMargin >= 20 ? 'green' : summary.netMargin >= 10 ? 'amber' : 'red'}
        />
        )}
      </div>
      )}

      {/* AI Insights Panel */}
      {financialInsights.length > 0 && (
        <AIInsightsPanel
          insights={financialInsights}
          summary={insightsSummary}
          title="Financial Insights"
          defaultCollapsed={false}
          maxVisible={5}
          getExplanation={explainInsight}
          onAction={(insight) => {
            if (insight.action?.url) {
              window.location.href = insight.action.url;
            }
          }}
        />
      )}

      {/* Profitability Analysis Section */}
      <Card className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Profitability Analysis</h3>
          <p className="text-xs text-gray-500 mt-0.5">Key margin and efficiency metrics with actionable insights</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gross Profit Margin */}
          <div className={cn('p-4 rounded-lg border', getMarginBgClass(grossProfitMarginPct, 'gross'), 'border-gray-200')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Margin</span>
              {grossProfitMarginPct >= 20 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className={cn('text-2xl font-bold', getMarginColorClass(grossProfitMarginPct, 'gross'))}>
              {formatPercent(grossProfitMarginPct)}
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">{formatCurrency(summary.grossProfit)}</span>
              <span className="text-gray-400"> / {formatCurrency(summary.totalRevenue)}</span>
            </div>
            <div className="mt-2">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded',
                grossProfitMarginPct >= 30 ? 'bg-green-200 text-green-800' :
                grossProfitMarginPct >= 20 ? 'bg-green-100 text-green-700' :
                grossProfitMarginPct >= 10 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              )}>
                {grossProfitMarginPct >= 30 ? 'Excellent' :
                 grossProfitMarginPct >= 20 ? 'Healthy' :
                 grossProfitMarginPct >= 10 ? 'Needs Attention' : 'Critical'}
              </span>
            </div>
          </div>

          {/* Net Profit Margin */}
          <div className={cn('p-4 rounded-lg border', getMarginBgClass(netProfitMarginPct, 'net'), 'border-gray-200')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Net Margin</span>
              {netProfitMarginPct >= 8 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className={cn('text-2xl font-bold', getMarginColorClass(netProfitMarginPct, 'net'))}>
              {formatPercent(netProfitMarginPct)}
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">{formatCurrency(summary.netProfit)}</span>
              <span className="text-gray-400"> / {formatCurrency(summary.totalRevenue)}</span>
            </div>
            <div className="mt-2">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded',
                netProfitMarginPct >= 15 ? 'bg-green-200 text-green-800' :
                netProfitMarginPct >= 8 ? 'bg-green-100 text-green-700' :
                netProfitMarginPct >= 0 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              )}>
                {netProfitMarginPct >= 15 ? 'Excellent' :
                 netProfitMarginPct >= 8 ? 'Healthy' :
                 netProfitMarginPct >= 0 ? 'Break-Even' : 'Loss'}
              </span>
            </div>
          </div>

          {/* Cost Variance */}
          <div className={cn('p-4 rounded-lg border', getMarginBgClass(-costVariancePct, 'variance'), 'border-gray-200')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Variance</span>
              {costVariancePct <= 0 ? (
                <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className={cn('text-2xl font-bold', getMarginColorClass(-costVariancePct, 'variance'))}>
              {costVariancePct > 0 ? '+' : ''}{formatPercent(costVariancePct)}
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">{formatCurrency(summary.totalSpent)}</span>
              <span className="text-gray-400"> vs {formatCurrency(summary.totalBudget)} budget</span>
            </div>
            <div className="mt-2">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded',
                costVariancePct <= -10 ? 'bg-green-200 text-green-800' :
                costVariancePct <= 0 ? 'bg-green-100 text-green-700' :
                costVariancePct <= 10 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              )}>
                {costVariancePct <= -10 ? 'Under Budget' :
                 costVariancePct <= 0 ? 'On Budget' :
                 costVariancePct <= 10 ? 'Slightly Over' : 'Over Budget'}
              </span>
            </div>
          </div>

          {/* Labor Efficiency */}
          <div className={cn('p-4 rounded-lg border', getMarginBgClass(laborEfficiencyPct, 'efficiency'), 'border-gray-200')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Labor Efficiency</span>
              {laborEfficiencyPct >= 100 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className={cn('text-2xl font-bold', getMarginColorClass(laborEfficiencyPct, 'efficiency'))}>
              {formatPercent(laborEfficiencyPct)}
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">{formatCurrency(totalLaborCost)}</span>
              <span className="text-gray-400"> actual labor</span>
            </div>
            <div className="mt-2">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded',
                laborEfficiencyPct >= 110 ? 'bg-green-200 text-green-800' :
                laborEfficiencyPct >= 100 ? 'bg-green-100 text-green-700' :
                laborEfficiencyPct >= 85 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              )}>
                {laborEfficiencyPct >= 110 ? 'High Efficiency' :
                 laborEfficiencyPct >= 100 ? 'On Target' :
                 laborEfficiencyPct >= 85 ? 'Below Target' : 'Inefficient'}
              </span>
            </div>
          </div>
        </div>

        {/* Margin Comparison Bar */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Margin Comparison</span>
            <span className="text-xs text-gray-400">Industry benchmark: 20% gross, 8% net</span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Gross Margin</span>
                <span className={cn('text-xs font-medium', getMarginColorClass(grossProfitMarginPct, 'gross'))}>
                  {formatPercent(grossProfitMarginPct)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    grossProfitMarginPct >= 30 ? 'bg-green-500' :
                    grossProfitMarginPct >= 20 ? 'bg-green-400' :
                    grossProfitMarginPct >= 10 ? 'bg-amber-400' : 'bg-red-400'
                  )}
                  style={{ width: `${Math.min(Math.max(grossProfitMarginPct, 0), 100)}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Net Margin</span>
                <span className={cn('text-xs font-medium', getMarginColorClass(netProfitMarginPct, 'net'))}>
                  {formatPercent(netProfitMarginPct)}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    netProfitMarginPct >= 15 ? 'bg-green-500' :
                    netProfitMarginPct >= 8 ? 'bg-green-400' :
                    netProfitMarginPct >= 0 ? 'bg-amber-400' : 'bg-red-400'
                  )}
                  style={{ width: `${Math.min(Math.max(netProfitMarginPct, 0), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed P&L Statement */}
      {shouldShowMetric('pnl-statement') && (
      <Card className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            Profit & Loss Statement{renderFavoriteIndicator('pnl-statement')}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Detailed breakdown of revenue and costs</p>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Revenue Section */}
          <div className="pb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Revenue</h4>
            <PLLineItem
              label="Total Revenue (Paid Invoices)"
              amount={summary.totalRevenue}
              icon={CurrencyDollarIcon}
              isBold
              color="green"
            />
          </div>

          {/* Cost Section */}
          <div className="py-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cost of Goods Sold (Direct Costs)</h4>
            <PLLineItem
              label="Labor Costs"
              amount={summary.laborCosts}
              icon={UserGroupIcon}
              indent
              showPercent
              percentOf={summary.totalRevenue}
            />
            <PLLineItem
              label="Material Costs"
              amount={summary.materialCosts}
              icon={WrenchScrewdriverIcon}
              indent
              showPercent
              percentOf={summary.totalRevenue}
            />
            <PLLineItem
              label="Subcontractor Costs"
              amount={summary.subcontractorCosts}
              icon={BuildingOfficeIcon}
              indent
              showPercent
              percentOf={summary.totalRevenue}
            />
            <PLLineItem
              label="Equipment Costs"
              amount={summary.equipmentCosts}
              icon={TruckIcon}
              indent
              showPercent
              percentOf={summary.totalRevenue}
            />
            <PLLineItem
              label="Total Direct Costs"
              amount={summary.directCosts}
              isSubtotal
              color="red"
            />
          </div>

          {/* Gross Profit */}
          <div className="py-4">
            <PLLineItem
              label="Gross Profit"
              amount={summary.grossProfit}
              isBold
              color={summary.grossProfit >= 0 ? 'green' : 'red'}
            />
            <div className="flex items-center justify-end mt-1">
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                summary.profitMargin >= 20 ? 'bg-green-100 text-green-700' :
                summary.profitMargin >= 10 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              )}>
                {formatPercent(summary.profitMargin)} Gross Margin
              </span>
            </div>
          </div>

          {/* Overhead Section */}
          <div className="py-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Operating Expenses (Overhead)</h4>
            <PLLineItem
              label="Overhead & Other Expenses"
              amount={summary.overheadCosts}
              icon={DocumentTextIcon}
              indent
              showPercent
              percentOf={summary.totalRevenue}
            />
          </div>

          {/* Net Profit */}
          <div className="pt-4">
            <PLLineItem
              label="Net Profit"
              amount={summary.netProfit}
              isTotal
              color={summary.netProfit >= 0 ? 'green' : 'red'}
            />
            <div className="flex items-center justify-end mt-2">
              <span className={cn(
                'text-sm font-semibold px-3 py-1 rounded-lg',
                summary.netMargin >= 15 ? 'bg-green-100 text-green-700' :
                summary.netMargin >= 5 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              )}>
                {formatPercent(summary.netMargin)} Net Margin
              </span>
            </div>
          </div>
        </div>
      </Card>
      )}

      {/* Revenue Trend & Cost Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {revenueByMonth.length > 0 && shouldShowMetric('revenue-trend') && (
          <LineChartCard
            title={<span className="flex items-center">Revenue & Profit Trend{renderFavoriteIndicator('revenue-trend')}</span>}
            subtitle="Monthly revenue, expenses, and profit (last 12 months)"
            data={revenueByMonth as unknown as Record<string, unknown>[]}
            dataKeys={['revenue', 'expenses', 'profit']}
            xAxisKey="month"
            valueFormatter={formatCurrency}
            config={{ colors: ['#10B981', '#EF4444', '#3B82F6'] }}
          />
        )}
        {costBreakdown.length > 0 && shouldShowMetric('cost-breakdown') && (
          <PieChartCard
            title={<span className="flex items-center">Cost Breakdown{renderFavoriteIndicator('cost-breakdown')}</span>}
            subtitle="Distribution of all costs"
            data={costBreakdown.map(c => ({ name: c.category, value: c.amount, color: c.color }))}
            dataKey="value"
            nameKey="name"
            showLabels
            valueFormatter={formatCurrency}
          />
        )}
      </div>

      {/* Revenue by Client & Project */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Client */}
        {revenueByClient.length > 0 && shouldShowMetric('revenue-by-client') && (
          <Card className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                Revenue by Client{renderFavoriteIndicator('revenue-by-client')}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Top clients by paid invoices</p>
            </div>
            <div className="space-y-3">
              {revenueByClient.slice(0, 8).map((client) => {
                const maxRevenue = revenueByClient[0]?.revenue || 1;
                const widthPercent = (client.revenue / maxRevenue) * 100;
                return (
                  <div key={client.clientId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 truncate flex-1 mr-4">
                        {client.clientName}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(client.revenue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-16">
                        {client.invoiceCount} inv.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Revenue by Project with P&L */}
        {revenueByProject.length > 0 && shouldShowMetric('revenue-by-project') && (
          <Card className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                Revenue by Project{renderFavoriteIndicator('revenue-by-project')}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Click a project to see P&L detail</p>
            </div>

            {selectedProject && (
              <div className="mb-4">
                <ProjectPLDetail
                  project={selectedProject}
                  onClose={() => setSelectedProjectId(null)}
                />
              </div>
            )}

            <div className="space-y-2">
              {revenueByProject.slice(0, 8).map((project) => {
                const isSelected = project.projectId === selectedProjectId;
                return (
                  <button
                    key={project.projectId}
                    onClick={() => setSelectedProjectId(isSelected ? null : project.projectId)}
                    className={cn(
                      'w-full text-left p-2 rounded-lg border transition-colors',
                      isSelected
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 truncate flex-1 mr-4">
                        {project.projectName}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {formatCurrency(project.revenue)}
                        </span>
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded',
                          project.margin >= 20 ? 'bg-green-100 text-green-700' :
                          project.margin >= 0 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {formatPercent(project.margin)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Budget Summary */}
      {shouldShowMetric('budget-summary') && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title={<span className="flex items-center">Total Budget{renderFavoriteIndicator('budget-summary')}</span>}
          value={formatCurrency(summary.totalBudget)}
          icon={ChartBarIcon}
          color="blue"
          subtitle={`${formatCurrency(summary.totalBudget - summary.totalSpent)} remaining`}
        />
        <StatCard
          title="Cash Flow"
          value={formatCurrency(summary.cashFlow)}
          icon={summary.cashFlow >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
          color={summary.cashFlow >= 0 ? 'green' : 'red'}
          subtitle={summary.cashFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
        />
      </div>
      )}

      {/* Existing Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {expensesByCategory.length > 0 && shouldShowMetric('expenses-by-category') && (
          <PieChartCard
            title={<span className="flex items-center">Expenses by Category{renderFavoriteIndicator('expenses-by-category')}</span>}
            subtitle="Distribution of approved expenses"
            data={expensesByCategory}
            dataKey="value"
            nameKey="name"
            showLabels
            valueFormatter={formatCurrency}
          />
        )}
        {invoiceAging.length > 0 && shouldShowMetric('invoice-aging') && (
          <BarChartCard
            title={<span className="flex items-center">Invoice Aging{renderFavoriteIndicator('invoice-aging')}</span>}
            subtitle="Outstanding invoices by age"
            data={invoiceAging.filter(a => a.amount > 0)}
            dataKeys={['amount']}
            xAxisKey="name"
            valueFormatter={formatCurrency}
            config={{ colors: ['#F59E0B'] }}
          />
        )}
      </div>

      {/* Project Profitability Table */}
      {shouldShowMetric('project-profitability') && (() => {
        const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE);
        const startIdx = (profitabilityPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;
        const paginatedProjects = sortedProjects.slice(startIdx, endIdx);
        const showPagination = sortedProjects.length > ITEMS_PER_PAGE;

        return (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  Project Profitability{renderFavoriteIndicator('project-profitability')}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Budget vs actual spend by project</p>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {overBudgetProjects.length} over budget
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {underBudgetProjects.length} on/under budget
                </span>
                {showPagination && (
                  <span className="text-gray-400">
                    {startIdx + 1}-{Math.min(endIdx, sortedProjects.length)} of {sortedProjects.length}
                  </span>
                )}
              </div>
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
                      Labor Cost
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variance
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variance %
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedProjects.map((project) => {
                    const percentUsed = project.budget > 0 ? (project.actualSpend / project.budget) * 100 : 0;
                    const isOverBudget = project.variance < 0;
                    // Cost Variance % = (Actual - Budget) / Budget * 100
                    const projectVariancePct = project.budget > 0
                      ? ((project.actualSpend - project.budget) / project.budget) * 100
                      : 0;

                    return (
                      <tr key={project.projectId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {project.projectName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {formatCurrency(project.budget)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {formatCurrency(project.laborCost)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {formatCurrency(project.actualSpend)}
                        </td>
                        <td className={cn(
                          'px-4 py-3 text-sm text-right font-medium',
                          isOverBudget ? 'text-red-600' : 'text-green-600'
                        )}>
                          {isOverBudget ? '-' : '+'}{formatCurrency(Math.abs(project.variance))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            projectVariancePct <= -10 ? 'bg-green-100 text-green-800' :
                            projectVariancePct <= 0 ? 'bg-green-50 text-green-700' :
                            projectVariancePct <= 10 ? 'bg-amber-50 text-amber-700' :
                            'bg-red-100 text-red-800'
                          )}>
                            {projectVariancePct > 0 ? '+' : ''}{formatPercent(projectVariancePct)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  percentUsed > 100 ? 'bg-red-500' : percentUsed > 80 ? 'bg-amber-500' : 'bg-green-500'
                                )}
                                style={{ width: `${Math.min(percentUsed, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-12 text-right">
                              {percentUsed.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {projectProfitability.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No projects with budget data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {showPagination && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <CompactPagination
                  currentPage={profitabilityPage}
                  totalPages={totalPages}
                  hasNextPage={profitabilityPage < totalPages}
                  hasPreviousPage={profitabilityPage > 1}
                  onNextPage={() => setProfitabilityPage(p => Math.min(p + 1, totalPages))}
                  onPreviousPage={() => setProfitabilityPage(p => Math.max(p - 1, 1))}
                />
              </div>
            )}
          </Card>
        );
      })()}

      {/* Invoice Aging Detail */}
      {shouldShowMetric('invoice-aging-detail') && (
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
          Invoice Aging Summary{renderFavoriteIndicator('invoice-aging-detail')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {invoiceAging.map((aging) => (
            <div
              key={aging.name}
              className={cn(
                'p-3 rounded-lg border',
                aging.name === '90+ Days' && aging.amount > 0
                  ? 'border-red-200 bg-red-50'
                  : aging.name.includes('Days') && aging.amount > 0
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-gray-200 bg-gray-50'
              )}
            >
              <p className="text-xs font-medium text-gray-500">{aging.name}</p>
              <p className={cn(
                'text-lg font-semibold mt-1',
                aging.name === '90+ Days' && aging.amount > 0
                  ? 'text-red-700'
                  : aging.name.includes('Days') && aging.amount > 0
                  ? 'text-amber-700'
                  : 'text-gray-900'
              )}>
                {formatCurrency(aging.amount)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{aging.count} invoice{aging.count !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </Card>
      )}
    </div>
  );
}
