"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useBalanceSheet } from '@/lib/hooks/reports/useBalanceSheet';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exports';
import { toast } from '@/components/ui/Toast';
import { Card } from '@/components/ui';
import {
  BanknotesIcon,
  ExclamationCircleIcon,
  ScaleIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
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

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function toInputDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ============================================
// Stat Card
// ============================================

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'red' | 'blue' | 'amber';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 truncate">{value}</p>
        </div>
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Line Item
// ============================================

interface LineItemProps {
  label: string;
  amount: number;
  indent?: boolean;
  subItem?: boolean;
  isTotal?: boolean;
}

function LineItem({ label, amount, indent = false, subItem = false, isTotal = false }: LineItemProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2',
        indent && 'pl-6',
        subItem && 'pl-10',
        isTotal && 'border-t border-gray-300 pt-3 mt-1',
      )}
    >
      <span
        className={cn(
          isTotal ? 'text-sm font-semibold text-gray-900' : 'text-sm text-gray-600',
          subItem && 'text-xs text-gray-400',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'text-sm font-medium tabular-nums',
          isTotal ? 'text-gray-900 font-semibold' : 'text-gray-700',
          subItem && 'text-xs text-gray-400',
        )}
      >
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

// ============================================
// Loading State
// ============================================

function LoadingState() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64" />
      </div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </Card>
        ))}
      </div>
      {/* Section skeletons */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-4 bg-gray-100 rounded w-4/6" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function BalanceSheetPage() {
  const { profile } = useAuth();
  const orgId = profile?.orgId;

  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const { data, loading, error, refetch } = useBalanceSheet(orgId, asOfDate);

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

  // ---- Balance check ----
  const isBalanced =
    data != null &&
    Math.abs(data.assets.totalAssets - (data.liabilities.totalLiabilities + data.equity.totalEquity)) <= 1;

  // ---- Export handlers ----

  const handleExportPDF = useCallback(async () => {
    if (!data) return;
    setIsExporting(true);
    setIsExportMenuOpen(false);
    try {
      const dateStr = formatDate(data.asOfDate);

      await exportToPDF({
        title: 'Balance Sheet',
        subtitle: `As of ${dateStr}`,
        metadata: {
          'Total Assets': formatCurrency(data.assets.totalAssets),
          'Total Liabilities': formatCurrency(data.liabilities.totalLiabilities),
          'Total Equity': formatCurrency(data.equity.totalEquity),
        },
        sections: [
          {
            heading: 'Assets',
            content: '',
            type: 'table',
            tableData: {
              headers: ['Item', 'Amount'],
              rows: [
                ['Cash & Cash Equivalents', formatCurrency(data.assets.cashPosition)],
                ['Accounts Receivable', formatCurrency(data.assets.accountsReceivable)],
                ...data.assets.arAging
                  .filter((b) => b.amount > 0)
                  .map((b) => [`  AR Aging: ${b.label}`, formatCurrency(b.amount)]),
                ['Equipment & Fixed Assets', formatCurrency(data.assets.equipmentValue)],
                ['Total Assets', formatCurrency(data.assets.totalAssets)],
              ],
            },
          },
          {
            heading: 'Liabilities',
            content: '',
            type: 'table',
            tableData: {
              headers: ['Item', 'Amount'],
              rows: [
                ['Accounts Payable', formatCurrency(data.liabilities.accountsPayable)],
                ['Accrued Expenses', formatCurrency(data.liabilities.accruedExpenses)],
                ['Payroll Liabilities', formatCurrency(data.liabilities.payrollLiabilities)],
                ['Total Liabilities', formatCurrency(data.liabilities.totalLiabilities)],
              ],
            },
          },
          {
            heading: 'Equity',
            content: '',
            type: 'table',
            tableData: {
              headers: ['Item', 'Amount'],
              rows: [
                ['Retained Earnings', formatCurrency(data.equity.retainedEarnings)],
                ["Owner's Equity", formatCurrency(data.equity.ownersEquity)],
                ['Total Equity', formatCurrency(data.equity.totalEquity)],
              ],
            },
          },
          {
            heading: 'Summary',
            content: `Total Liabilities & Equity: ${formatCurrency(data.liabilities.totalLiabilities + data.equity.totalEquity)}`,
          },
        ],
        filename: `balance-sheet-${toInputDateStr(data.asOfDate)}`,
      });

      toast.success('PDF exported successfully');
    } catch (err) {
      logger.error('PDF export error', { error: err, page: 'dashboard-reports-balance-sheet' });
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  }, [data]);

  const handleExportExcel = useCallback(async () => {
    if (!data) return;
    setIsExporting(true);
    setIsExportMenuOpen(false);
    try {
      const dateStr = toInputDateStr(data.asOfDate);

      await exportToExcel({
        filename: `balance-sheet-${dateStr}`,
        sheets: [
          {
            name: 'Balance Sheet',
            columns: [
              { header: 'Category', key: 'category', width: 15 },
              { header: 'Item', key: 'item', width: 30 },
              { header: 'Amount', key: 'amount', width: 20 },
            ],
            data: [
              // Assets
              { category: 'Assets', item: 'Cash & Cash Equivalents', amount: data.assets.cashPosition },
              { category: 'Assets', item: 'Accounts Receivable', amount: data.assets.accountsReceivable },
              ...data.assets.arAging
                .filter((b) => b.amount > 0)
                .map((b) => ({ category: 'Assets', item: `AR Aging: ${b.label}`, amount: b.amount })),
              { category: 'Assets', item: 'Equipment & Fixed Assets', amount: data.assets.equipmentValue },
              { category: 'Assets', item: 'TOTAL ASSETS', amount: data.assets.totalAssets },
              // Blank row
              { category: '', item: '', amount: '' },
              // Liabilities
              { category: 'Liabilities', item: 'Accounts Payable', amount: data.liabilities.accountsPayable },
              { category: 'Liabilities', item: 'Accrued Expenses', amount: data.liabilities.accruedExpenses },
              { category: 'Liabilities', item: 'Payroll Liabilities', amount: data.liabilities.payrollLiabilities },
              { category: 'Liabilities', item: 'TOTAL LIABILITIES', amount: data.liabilities.totalLiabilities },
              // Blank row
              { category: '', item: '', amount: '' },
              // Equity
              { category: 'Equity', item: 'Retained Earnings', amount: data.equity.retainedEarnings },
              { category: 'Equity', item: "Owner's Equity", amount: data.equity.ownersEquity },
              { category: 'Equity', item: 'TOTAL EQUITY', amount: data.equity.totalEquity },
              // Blank row
              { category: '', item: '', amount: '' },
              // Bottom line
              {
                category: 'Summary',
                item: 'Total Liabilities & Equity',
                amount: data.liabilities.totalLiabilities + data.equity.totalEquity,
              },
            ],
          },
        ],
      });

      toast.success('Excel exported successfully');
    } catch (err) {
      logger.error('Excel export error', { error: err, page: 'dashboard-reports-balance-sheet' });
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
      const dateStr = toInputDateStr(data.asOfDate);

      const rows: (string | number)[][] = [
        // Assets
        ['Assets', 'Cash & Cash Equivalents', data.assets.cashPosition],
        ['Assets', 'Accounts Receivable', data.assets.accountsReceivable],
        ...data.assets.arAging
          .filter((b) => b.amount > 0)
          .map((b): (string | number)[] => ['Assets', `AR Aging: ${b.label}`, b.amount]),
        ['Assets', 'Equipment & Fixed Assets', data.assets.equipmentValue],
        ['Assets', 'TOTAL ASSETS', data.assets.totalAssets],
        ['', '', ''],
        // Liabilities
        ['Liabilities', 'Accounts Payable', data.liabilities.accountsPayable],
        ['Liabilities', 'Accrued Expenses', data.liabilities.accruedExpenses],
        ['Liabilities', 'Payroll Liabilities', data.liabilities.payrollLiabilities],
        ['Liabilities', 'TOTAL LIABILITIES', data.liabilities.totalLiabilities],
        ['', '', ''],
        // Equity
        ['Equity', 'Retained Earnings', data.equity.retainedEarnings],
        ['Equity', "Owner's Equity", data.equity.ownersEquity],
        ['Equity', 'TOTAL EQUITY', data.equity.totalEquity],
        ['', '', ''],
        // Bottom line
        ['Summary', 'Total Liabilities & Equity', data.liabilities.totalLiabilities + data.equity.totalEquity],
      ];

      exportToCSV({
        filename: `balance-sheet-${dateStr}`,
        headers: ['Category', 'Item', 'Amount'],
        rows,
      });

      toast.success('CSV exported successfully');
    } catch (err) {
      logger.error('CSV export error', { error: err, page: 'dashboard-reports-balance-sheet' });
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  }, [data]);

  // ---- Render states ----

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Failed to load balance sheet</h3>
        <p className="text-gray-500 mt-1">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <ScaleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No balance sheet data</h3>
        <p className="text-gray-500 mt-1">
          Start tracking invoices, expenses, and equipment to generate a balance sheet.
        </p>
      </Card>
    );
  }

  const totalLiabilitiesAndEquity = data.liabilities.totalLiabilities + data.equity.totalEquity;

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* Header */}
      {/* ============================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Balance Sheet</h1>
          <p className="text-sm text-gray-500">As of {formatDate(asOfDate)}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date picker */}
          <div className="flex items-center gap-2">
            <label htmlFor="as-of-date" className="text-sm font-medium text-gray-600">
              As Of
            </label>
            <input
              id="as-of-date"
              type="date"
              value={toInputDateStr(asOfDate)}
              onChange={(e) => {
                const parsed = new Date(e.target.value + 'T00:00:00');
                if (!isNaN(parsed.getTime())) {
                  setAsOfDate(parsed);
                }
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Export dropdown */}
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
              <ChevronDownIcon
                className={cn('h-4 w-4 transition-transform', isExportMenuOpen && 'rotate-180')}
              />
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
      </div>

      {/* ============================================ */}
      {/* Summary Stat Cards */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Assets"
          value={formatCurrency(data.assets.totalAssets)}
          icon={BanknotesIcon}
          color="green"
        />
        <StatCard
          title="Total Liabilities"
          value={formatCurrency(data.liabilities.totalLiabilities)}
          icon={ExclamationCircleIcon}
          color="red"
        />
        <StatCard
          title="Total Equity"
          value={formatCurrency(data.equity.totalEquity)}
          icon={ScaleIcon}
          color="blue"
        />
      </div>

      {/* ============================================ */}
      {/* Balance Check Banner */}
      {/* ============================================ */}
      {isBalanced ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
          <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800">
            Balance sheet is balanced: Assets = Liabilities + Equity
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Balance sheet is not balanced
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Assets ({formatCurrency(data.assets.totalAssets)}) does not equal Liabilities + Equity (
              {formatCurrency(totalLiabilitiesAndEquity)}). Difference:{' '}
              {formatCurrency(Math.abs(data.assets.totalAssets - totalLiabilitiesAndEquity))}
            </p>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Assets Section */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-green-500 rounded-full" />
          <h2 className="text-base font-semibold text-gray-900">Assets</h2>
        </div>

        <div className="divide-y divide-gray-50">
          <LineItem label="Cash & Cash Equivalents" amount={data.assets.cashPosition} indent />
          <LineItem label="Accounts Receivable" amount={data.assets.accountsReceivable} indent />

          {/* AR Aging sub-items */}
          {data.assets.arAging
            .filter((bucket) => bucket.amount > 0)
            .map((bucket) => (
              <LineItem
                key={bucket.label}
                label={`${bucket.label} (${bucket.count} invoice${bucket.count !== 1 ? 's' : ''})`}
                amount={bucket.amount}
                subItem
              />
            ))}

          <LineItem label="Equipment & Fixed Assets" amount={data.assets.equipmentValue} indent />
          <LineItem label="Total Assets" amount={data.assets.totalAssets} isTotal />
        </div>
      </div>

      {/* ============================================ */}
      {/* Liabilities Section */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-red-500 rounded-full" />
          <h2 className="text-base font-semibold text-gray-900">Liabilities</h2>
        </div>

        <div className="divide-y divide-gray-50">
          <LineItem label="Accounts Payable" amount={data.liabilities.accountsPayable} indent />
          <LineItem label="Accrued Expenses" amount={data.liabilities.accruedExpenses} indent />
          <LineItem label="Payroll Liabilities" amount={data.liabilities.payrollLiabilities} indent />
          <LineItem label="Total Liabilities" amount={data.liabilities.totalLiabilities} isTotal />
        </div>
      </div>

      {/* ============================================ */}
      {/* Equity Section */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h2 className="text-base font-semibold text-gray-900">Equity</h2>
        </div>

        <div className="divide-y divide-gray-50">
          <LineItem label="Retained Earnings" amount={data.equity.retainedEarnings} indent />
          <LineItem label="Owner's Equity" amount={data.equity.ownersEquity} indent />
          <LineItem label="Total Equity" amount={data.equity.totalEquity} isTotal />
        </div>
      </div>

      {/* ============================================ */}
      {/* Bottom Line */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">
            Total Liabilities & Equity
          </span>
          <span className="text-base font-semibold text-gray-900 tabular-nums">
            {formatCurrency(totalLiabilitiesAndEquity)}
          </span>
        </div>
        {isBalanced && (
          <p className="text-xs text-green-600 mt-1 text-right">
            Matches Total Assets ({formatCurrency(data.assets.totalAssets)})
          </p>
        )}
      </div>
    </div>
  );
}
