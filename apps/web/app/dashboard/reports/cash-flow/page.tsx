"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useCashFlowStatement } from '@/lib/hooks/reports/useCashFlowStatement';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exports';
import type { CashFlowStatementData } from '@/lib/hooks/reports/types';
import { Card } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  TruckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

// ============================================
// Helpers
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a cash flow value: positive amounts display normally,
 * negative amounts display in parentheses with red styling.
 */
function formatCashFlow(value: number): { text: string; isNegative: boolean } {
  if (value < 0) {
    return {
      text: `(${formatCurrency(Math.abs(value))})`,
      isNegative: true,
    };
  }
  return { text: formatCurrency(value), isNegative: false };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ============================================
// Date Preset Helpers
// ============================================

interface DatePreset {
  label: string;
  getValue: () => { start: Date; end: Date };
}

function getPresets(): DatePreset[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Current quarter start month (0-indexed): Jan=0, Apr=3, Jul=6, Oct=9
  const quarterStartMonth = Math.floor(month / 3) * 3;

  return [
    {
      label: 'This Month',
      getValue: () => ({
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 0, 23, 59, 59, 999),
      }),
    },
    {
      label: 'Last Month',
      getValue: () => ({
        start: new Date(year, month - 1, 1),
        end: new Date(year, month, 0, 23, 59, 59, 999),
      }),
    },
    {
      label: 'This Quarter',
      getValue: () => ({
        start: new Date(year, quarterStartMonth, 1),
        end: new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999),
      }),
    },
    {
      label: 'Last Quarter',
      getValue: () => ({
        start: new Date(year, quarterStartMonth - 3, 1),
        end: new Date(year, quarterStartMonth, 0, 23, 59, 59, 999),
      }),
    },
    {
      label: 'Year to Date',
      getValue: () => ({
        start: new Date(year, 0, 1),
        end: new Date(year, month, now.getDate(), 23, 59, 59, 999),
      }),
    },
    {
      label: 'Last Year',
      getValue: () => ({
        start: new Date(year - 1, 0, 1),
        end: new Date(year - 1, 11, 31, 23, 59, 59, 999),
      }),
    },
  ];
}

// ============================================
// Sub-components
// ============================================

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'red' | 'blue' | 'purple' | 'amber';
  subtitle?: string;
}

function SummaryStatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  const { text, isNegative } = formatCashFlow(value);

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
          <p className={cn(
            'mt-1 text-2xl font-semibold truncate',
            isNegative ? 'text-red-600' : 'text-gray-900',
          )}>
            {text}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

interface CashFlowLineItemProps {
  label: string;
  amount: number;
  icon?: React.ComponentType<{ className?: string }>;
  indent?: boolean;
  isBold?: boolean;
  isTotal?: boolean;
  showAsOutflow?: boolean;
}

function CashFlowLineItem({
  label,
  amount,
  icon: Icon,
  indent = false,
  isBold = false,
  isTotal = false,
  showAsOutflow = false,
}: CashFlowLineItemProps) {
  const displayValue = showAsOutflow && amount > 0 ? -amount : amount;
  const { text, isNegative } = formatCashFlow(displayValue);

  return (
    <div className={cn(
      'flex items-center justify-between py-2.5',
      indent && 'pl-6',
      isTotal && 'border-t-2 border-gray-300 bg-gray-100 -mx-6 px-6 font-bold',
    )}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <span className={cn(
          'text-sm',
          isBold || isTotal ? 'font-semibold text-gray-900' : 'text-gray-600',
        )}>
          {label}
        </span>
      </div>
      <span className={cn(
        'text-sm font-medium w-32 text-right',
        isTotal ? 'text-base' : '',
        isNegative ? 'text-red-600' : (isBold || isTotal ? 'text-gray-900' : 'text-gray-700'),
      )}>
        {text}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </Card>
        ))}
      </div>
      {/* Section skeletons */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="flex justify-between py-2">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function CashFlowStatementPage() {
  const { profile } = useAuth();
  const orgId = profile?.orgId;

  // Date range state
  const presets = useMemo(() => getPresets(), []);
  const [activePreset, setActivePreset] = useState<string>('This Month');
  const [startDate, setStartDate] = useState<Date>(() => presets[0].getValue().start);
  const [endDate, setEndDate] = useState<Date>(() => presets[0].getValue().end);

  // Export dropdown state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Fetch data
  const { data, loading, error, refetch } = useCashFlowStatement(orgId, startDate, endDate);

  // Close export menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Preset selection handler
  const handlePresetClick = useCallback((preset: DatePreset) => {
    const { start, end } = preset.getValue();
    setStartDate(start);
    setEndDate(end);
    setActivePreset(preset.label);
  }, []);

  // Custom date handlers
  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const d = new Date(e.target.value + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      setStartDate(d);
      setActivePreset('Custom');
    }
  }, []);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const d = new Date(e.target.value + 'T23:59:59.999');
    if (!isNaN(d.getTime())) {
      setEndDate(d);
      setActivePreset('Custom');
    }
  }, []);

  // ---- Export handlers ----

  const buildExportData = useCallback((d: CashFlowStatementData) => {
    const periodLabel = `${formatDate(startDate)} to ${formatDate(endDate)}`;
    return { data: d, periodLabel };
  }, [startDate, endDate]);

  const handleExportPDF = useCallback(async () => {
    if (!data) return;
    setIsExporting(true);
    setIsExportMenuOpen(false);
    try {
      const { periodLabel } = buildExportData(data);

      await exportToPDF({
        title: 'Cash Flow Statement',
        subtitle: `For the period ${periodLabel}`,
        metadata: {
          'Period': periodLabel,
          'Net Change in Cash': formatCurrency(data.netChangeInCash),
          'Ending Cash Balance': formatCurrency(data.endingCashBalance),
        },
        sections: [
          {
            heading: 'Operating Activities',
            content: '',
            type: 'table',
            tableData: {
              headers: ['Line Item', 'Amount'],
              rows: [
                ['Collections from Customers', formatCurrency(data.operating.collectionsFromCustomers)],
                ['Payments for Materials', formatCurrency(-data.operating.paymentsForMaterials)],
                ['Payments for Labor', formatCurrency(-data.operating.paymentsForLabor)],
                ['Payments to Subcontractors', formatCurrency(-data.operating.paymentsToSubcontractors)],
                ['Other Operating Payments', formatCurrency(-data.operating.otherOperatingPayments)],
                ['Change in Accounts Receivable', formatCurrency(data.operating.changeInAR)],
                ['Change in Accounts Payable', formatCurrency(data.operating.changeInAP)],
                ['Net Cash from Operations', formatCurrency(data.operating.netOperatingCashFlow)],
              ],
            },
          },
          {
            heading: 'Investing Activities',
            content: '',
            type: 'table',
            tableData: {
              headers: ['Line Item', 'Amount'],
              rows: [
                ['Equipment Purchases', formatCurrency(-data.investing.equipmentPurchases)],
                ['Tool Purchases', formatCurrency(-data.investing.toolPurchases)],
                ['Net Cash from Investing', formatCurrency(data.investing.netInvestingCashFlow)],
              ],
            },
          },
          {
            heading: 'Financing Activities',
            content: '',
            type: 'table',
            tableData: {
              headers: ['Line Item', 'Amount'],
              rows: [
                ['Owner Contributions', formatCurrency(data.financing.ownerContributions)],
                ['Owner Draws', formatCurrency(-data.financing.ownerDraws)],
                ['Net Cash from Financing', formatCurrency(data.financing.netFinancingCashFlow)],
              ],
            },
          },
          {
            heading: 'Summary',
            content: '',
            type: 'table',
            tableData: {
              headers: ['', 'Amount'],
              rows: [
                ['Beginning Cash Balance', formatCurrency(data.beginningCashBalance)],
                ['Net Change in Cash', formatCurrency(data.netChangeInCash)],
                ['Ending Cash Balance', formatCurrency(data.endingCashBalance)],
              ],
            },
          },
        ],
        filename: `cash-flow-statement-${new Date().toISOString().split('T')[0]}`,
      });
      toast.success('PDF exported successfully');
    } catch (err) {
      logger.error('PDF export error', { error: err, page: 'dashboard-reports-cash-flow' });
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  }, [data, buildExportData]);

  const handleExportExcel = useCallback(async () => {
    if (!data) return;
    setIsExporting(true);
    setIsExportMenuOpen(false);
    try {
      const dateStr = new Date().toISOString().split('T')[0];

      await exportToExcel({
        filename: `cash-flow-statement-${dateStr}`,
        sheets: [
          {
            name: 'Cash Flow Statement',
            columns: [
              { header: 'Line Item', key: 'lineItem', width: 35 },
              { header: 'Amount', key: 'amount', width: 18 },
            ],
            data: [
              { lineItem: 'OPERATING ACTIVITIES', amount: '' },
              { lineItem: 'Collections from Customers', amount: data.operating.collectionsFromCustomers },
              { lineItem: 'Payments for Materials', amount: -data.operating.paymentsForMaterials },
              { lineItem: 'Payments for Labor', amount: -data.operating.paymentsForLabor },
              { lineItem: 'Payments to Subcontractors', amount: -data.operating.paymentsToSubcontractors },
              { lineItem: 'Other Operating Payments', amount: -data.operating.otherOperatingPayments },
              { lineItem: 'Change in Accounts Receivable', amount: data.operating.changeInAR },
              { lineItem: 'Change in Accounts Payable', amount: data.operating.changeInAP },
              { lineItem: 'Net Cash from Operations', amount: data.operating.netOperatingCashFlow },
              { lineItem: '', amount: '' },
              { lineItem: 'INVESTING ACTIVITIES', amount: '' },
              { lineItem: 'Equipment Purchases', amount: -data.investing.equipmentPurchases },
              { lineItem: 'Tool Purchases', amount: -data.investing.toolPurchases },
              { lineItem: 'Net Cash from Investing', amount: data.investing.netInvestingCashFlow },
              { lineItem: '', amount: '' },
              { lineItem: 'FINANCING ACTIVITIES', amount: '' },
              { lineItem: 'Owner Contributions', amount: data.financing.ownerContributions },
              { lineItem: 'Owner Draws', amount: -data.financing.ownerDraws },
              { lineItem: 'Net Cash from Financing', amount: data.financing.netFinancingCashFlow },
              { lineItem: '', amount: '' },
              { lineItem: 'SUMMARY', amount: '' },
              { lineItem: 'Beginning Cash Balance', amount: data.beginningCashBalance },
              { lineItem: 'Net Change in Cash', amount: data.netChangeInCash },
              { lineItem: 'Ending Cash Balance', amount: data.endingCashBalance },
            ],
          },
        ],
      });
      toast.success('Excel exported successfully');
    } catch (err) {
      logger.error('Excel export error', { error: err, page: 'dashboard-reports-cash-flow' });
      toast.error('Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  }, [data]);

  const handleExportCSV = useCallback(() => {
    if (!data) return;
    setIsExporting(true);
    setIsExportMenuOpen(false);
    try {
      const dateStr = new Date().toISOString().split('T')[0];

      const rows: (string | number)[][] = [
        ['OPERATING ACTIVITIES', ''],
        ['Collections from Customers', data.operating.collectionsFromCustomers],
        ['Payments for Materials', -data.operating.paymentsForMaterials],
        ['Payments for Labor', -data.operating.paymentsForLabor],
        ['Payments to Subcontractors', -data.operating.paymentsToSubcontractors],
        ['Other Operating Payments', -data.operating.otherOperatingPayments],
        ['Change in Accounts Receivable', data.operating.changeInAR],
        ['Change in Accounts Payable', data.operating.changeInAP],
        ['Net Cash from Operations', data.operating.netOperatingCashFlow],
        ['', ''],
        ['INVESTING ACTIVITIES', ''],
        ['Equipment Purchases', -data.investing.equipmentPurchases],
        ['Tool Purchases', -data.investing.toolPurchases],
        ['Net Cash from Investing', data.investing.netInvestingCashFlow],
        ['', ''],
        ['FINANCING ACTIVITIES', ''],
        ['Owner Contributions', data.financing.ownerContributions],
        ['Owner Draws', -data.financing.ownerDraws],
        ['Net Cash from Financing', data.financing.netFinancingCashFlow],
        ['', ''],
        ['SUMMARY', ''],
        ['Beginning Cash Balance', data.beginningCashBalance],
        ['Net Change in Cash', data.netChangeInCash],
        ['Ending Cash Balance', data.endingCashBalance],
      ];

      exportToCSV({
        filename: `cash-flow-statement-${dateStr}`,
        headers: ['Line Item', 'Amount'],
        rows,
      });
      toast.success('CSV exported successfully');
    } catch (err) {
      logger.error('CSV export error', { error: err, page: 'dashboard-reports-cash-flow' });
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  }, [data]);

  // ---- Render ----

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Failed to load cash flow data</h3>
        <p className="text-gray-500 mt-1">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Retry
        </button>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No cash flow data available</h3>
        <p className="text-gray-500 mt-1">
          Start tracking invoices and expenses to see your cash flow statement.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Cash Flow Statement</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            For the period {formatDate(startDate)} to {formatDate(endDate)}
          </p>
        </div>

        {/* Export Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={isExporting || !data}
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
      </div>

      {/* ---- Date Range Presets & Custom Inputs ---- */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Preset Chips */}
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
                  activePreset === preset.label
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={handleStartDateChange}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={endDate.toISOString().split('T')[0]}
              onChange={handleEndDateChange}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* ---- Summary Stat Cards ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryStatCard
          title="Net Operating Cash Flow"
          value={data.operating.netOperatingCashFlow}
          icon={ArrowTrendingUpIcon}
          color={data.operating.netOperatingCashFlow >= 0 ? 'green' : 'red'}
          subtitle="From core business operations"
        />
        <SummaryStatCard
          title="Net Investing Cash Flow"
          value={data.investing.netInvestingCashFlow}
          icon={TruckIcon}
          color={data.investing.netInvestingCashFlow >= 0 ? 'green' : 'amber'}
          subtitle="Equipment & tool purchases"
        />
        <SummaryStatCard
          title="Net Financing Cash Flow"
          value={data.financing.netFinancingCashFlow}
          icon={BuildingOfficeIcon}
          color="purple"
          subtitle="Owner contributions & draws"
        />
        <SummaryStatCard
          title="Net Change in Cash"
          value={data.netChangeInCash}
          icon={CurrencyDollarIcon}
          color={data.netChangeInCash >= 0 ? 'green' : 'red'}
          subtitle="Bottom line for the period"
        />
      </div>

      {/* ---- Operating Activities Section ---- */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-green-500 rounded-full" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Cash from Operating Activities</h3>
            <p className="text-xs text-gray-500 mt-0.5">Day-to-day business cash flows</p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          <CashFlowLineItem
            label="Collections from Customers"
            amount={data.operating.collectionsFromCustomers}
            icon={CurrencyDollarIcon}
            indent
          />
          <CashFlowLineItem
            label="Payments for Materials"
            amount={data.operating.paymentsForMaterials}
            icon={WrenchScrewdriverIcon}
            indent
            showAsOutflow
          />
          <CashFlowLineItem
            label="Payments for Labor"
            amount={data.operating.paymentsForLabor}
            icon={UserGroupIcon}
            indent
            showAsOutflow
          />
          <CashFlowLineItem
            label="Payments to Subcontractors"
            amount={data.operating.paymentsToSubcontractors}
            icon={BuildingOfficeIcon}
            indent
            showAsOutflow
          />
          <CashFlowLineItem
            label="Other Operating Payments"
            amount={data.operating.otherOperatingPayments}
            icon={BanknotesIcon}
            indent
            showAsOutflow
          />
          <CashFlowLineItem
            label="Change in Accounts Receivable"
            amount={data.operating.changeInAR}
            indent
          />
          <CashFlowLineItem
            label="Change in Accounts Payable"
            amount={data.operating.changeInAP}
            indent
          />
          <CashFlowLineItem
            label="Net Cash from Operations"
            amount={data.operating.netOperatingCashFlow}
            isTotal
            isBold
          />
        </div>
      </div>

      {/* ---- Investing Activities Section ---- */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Cash from Investing Activities</h3>
            <p className="text-xs text-gray-500 mt-0.5">Capital expenditures for equipment and tools</p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          <CashFlowLineItem
            label="Equipment Purchases"
            amount={data.investing.equipmentPurchases}
            icon={TruckIcon}
            indent
            showAsOutflow
          />
          <CashFlowLineItem
            label="Tool Purchases"
            amount={data.investing.toolPurchases}
            icon={WrenchScrewdriverIcon}
            indent
            showAsOutflow
          />
          <CashFlowLineItem
            label="Net Cash from Investing"
            amount={data.investing.netInvestingCashFlow}
            isTotal
            isBold
          />
        </div>
      </div>

      {/* ---- Financing Activities Section ---- */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-purple-500 rounded-full" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Cash from Financing Activities</h3>
            <p className="text-xs text-gray-500 mt-0.5">Owner contributions, draws, and financing</p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          <CashFlowLineItem
            label="Owner Contributions"
            amount={data.financing.ownerContributions}
            icon={ArrowTrendingUpIcon}
            indent
          />
          <CashFlowLineItem
            label="Owner Draws"
            amount={data.financing.ownerDraws}
            icon={ArrowTrendingDownIcon}
            indent
            showAsOutflow
          />
          <CashFlowLineItem
            label="Net Cash from Financing"
            amount={data.financing.netFinancingCashFlow}
            isTotal
            isBold
          />
        </div>
      </div>

      {/* ---- Bottom Line Section ---- */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Cash Position Summary</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Overall change in cash for {formatDate(startDate)} to {formatDate(endDate)}
          </p>
        </div>

        <div className="space-y-3">
          {/* Beginning Balance */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Beginning Cash Balance</span>
            <span className="text-sm font-medium text-gray-700 w-32 text-right">
              {formatCurrency(data.beginningCashBalance)}
            </span>
          </div>

          {/* Net Change */}
          <div className="flex items-center justify-between py-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Net Change in Cash</span>
            {(() => {
              const { text, isNegative } = formatCashFlow(data.netChangeInCash);
              return (
                <span className={cn(
                  'text-sm font-semibold w-32 text-right',
                  isNegative ? 'text-red-600' : 'text-green-600',
                )}>
                  {text}
                </span>
              );
            })()}
          </div>

          {/* Ending Balance */}
          <div className="flex items-center justify-between py-3 border-t-2 border-gray-300 bg-white -mx-6 px-6 rounded-b-xl">
            <span className="text-base font-bold text-gray-900">Ending Cash Balance</span>
            <span className="text-xl font-bold text-gray-900 w-36 text-right">
              {formatCurrency(data.endingCashBalance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
