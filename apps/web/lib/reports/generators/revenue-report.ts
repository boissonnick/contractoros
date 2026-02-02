/**
 * Revenue Report Generator
 *
 * Aggregates invoice data by month to generate revenue reports.
 */

import { Invoice } from '@/types';
import {
  DateRange,
  ReportConfig,
  RevenueReportData,
  RevenueDataPoint,
  ReportSummary,
} from '../types';

interface MonthlyAggregate {
  month: string;
  year: number;
  monthNum: number;
  invoices: Invoice[];
  total: number;
  paidAmount: number;
  pendingAmount: number;
}

/**
 * Group invoices by month and calculate aggregates
 */
function groupInvoicesByMonth(
  invoices: Invoice[],
  dateRange: DateRange
): Map<string, MonthlyAggregate> {
  const monthlyData = new Map<string, MonthlyAggregate>();

  // Initialize all months in the date range
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);

  const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (currentDate <= endDate) {
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    monthlyData.set(monthKey, {
      month: monthName,
      year: currentDate.getFullYear(),
      monthNum: currentDate.getMonth(),
      invoices: [],
      total: 0,
      paidAmount: 0,
      pendingAmount: 0,
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Aggregate invoices into months
  for (const invoice of invoices) {
    const invoiceDate = invoice.createdAt instanceof Date
      ? invoice.createdAt
      : new Date(invoice.createdAt);

    if (invoiceDate < dateRange.startDate || invoiceDate > dateRange.endDate) {
      continue;
    }

    const monthKey = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
    const monthData = monthlyData.get(monthKey);

    if (monthData) {
      monthData.invoices.push(invoice);
      monthData.total += invoice.total || 0;
      monthData.paidAmount += invoice.amountPaid || 0;
      monthData.pendingAmount += (invoice.total || 0) - (invoice.amountPaid || 0);
    }
  }

  return monthlyData;
}

/**
 * Calculate the summary statistics for the report
 */
function calculateSummary(
  dataPoints: RevenueDataPoint[],
  previousPeriodTotal?: number
): ReportSummary {
  const values = dataPoints.map((dp) => dp.value);
  const total = values.reduce((sum, val) => sum + val, 0);

  let trend: number | undefined;
  if (previousPeriodTotal !== undefined && previousPeriodTotal > 0) {
    trend = ((total - previousPeriodTotal) / previousPeriodTotal) * 100;
  }

  return {
    total,
    average: values.length > 0 ? total / values.length : 0,
    min: values.length > 0 ? Math.min(...values) : 0,
    max: values.length > 0 ? Math.max(...values) : 0,
    count: dataPoints.reduce((sum, dp) => sum + dp.metadata.invoiceCount, 0),
    trend,
    previousTotal: previousPeriodTotal,
  };
}

/**
 * Get the previous period date range for comparison
 */
function getPreviousPeriodRange(dateRange: DateRange): DateRange {
  const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
  const previousEnd = new Date(dateRange.startDate.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);

  return {
    startDate: previousStart,
    endDate: previousEnd,
  };
}

/**
 * Calculate breakdown by invoice status
 */
function calculateBreakdown(invoices: Invoice[]): {
  paid: number;
  pending: number;
  overdue: number;
} {
  const now = new Date();

  return invoices.reduce(
    (acc, invoice) => {
      const total = invoice.total || 0;
      const paid = invoice.amountPaid || 0;
      const remaining = total - paid;

      if (invoice.status === 'paid' || remaining <= 0) {
        acc.paid += total;
      } else {
        const dueDate = invoice.dueDate instanceof Date
          ? invoice.dueDate
          : new Date(invoice.dueDate);

        if (dueDate < now) {
          acc.overdue += remaining;
          acc.paid += paid;
        } else {
          acc.pending += remaining;
          acc.paid += paid;
        }
      }

      return acc;
    },
    { paid: 0, pending: 0, overdue: 0 }
  );
}

/**
 * Generate a revenue report from invoice data
 */
export function generateRevenueReport(
  invoices: Invoice[],
  config: ReportConfig,
  previousPeriodInvoices?: Invoice[]
): RevenueReportData {
  const { dateRange } = config;

  // Group current period invoices by month
  const monthlyData = groupInvoicesByMonth(invoices, dateRange);

  // Convert to data points
  const dataPoints: RevenueDataPoint[] = Array.from(monthlyData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, data]) => ({
      label: data.month,
      value: data.total,
      metadata: {
        invoiceCount: data.invoices.length,
        paidAmount: data.paidAmount,
        pendingAmount: data.pendingAmount,
      },
    }));

  // Calculate previous period total if comparison data provided
  let previousPeriodTotal: number | undefined;
  if (previousPeriodInvoices) {
    previousPeriodTotal = previousPeriodInvoices.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0
    );
  }

  // Calculate summary
  const summary = calculateSummary(dataPoints, previousPeriodTotal);

  // Calculate breakdown
  const breakdown = calculateBreakdown(invoices);

  return {
    config,
    summary,
    dataPoints,
    breakdown,
    generatedAt: new Date(),
  };
}

/**
 * Generate revenue report with automatic previous period comparison
 */
export function generateRevenueReportWithComparison(
  allInvoices: Invoice[],
  config: ReportConfig
): RevenueReportData {
  const { dateRange } = config;

  // Filter current period invoices
  const currentInvoices = allInvoices.filter((invoice) => {
    const invoiceDate = invoice.createdAt instanceof Date
      ? invoice.createdAt
      : new Date(invoice.createdAt);
    return invoiceDate >= dateRange.startDate && invoiceDate <= dateRange.endDate;
  });

  // Get previous period invoices if comparison is enabled
  let previousInvoices: Invoice[] | undefined;
  if (config.compareWithPrevious) {
    const previousRange = getPreviousPeriodRange(dateRange);
    previousInvoices = allInvoices.filter((invoice) => {
      const invoiceDate = invoice.createdAt instanceof Date
        ? invoice.createdAt
        : new Date(invoice.createdAt);
      return invoiceDate >= previousRange.startDate && invoiceDate <= previousRange.endDate;
    });
  }

  return generateRevenueReport(currentInvoices, config, previousInvoices);
}

/**
 * Format currency for display
 */
export function formatRevenueValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Get trend indicator text
 */
export function getTrendText(trend: number | undefined): string {
  if (trend === undefined) return '';
  const sign = trend >= 0 ? '+' : '';
  return `${sign}${trend.toFixed(1)}% vs previous period`;
}
