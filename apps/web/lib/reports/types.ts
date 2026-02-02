/**
 * Report Types
 *
 * Core types for the reporting system.
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label?: string;
}

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom';

export interface DatePresetOption {
  value: DatePreset;
  label: string;
  getRange: () => DateRange;
}

export type ReportType =
  | 'revenue'
  | 'profitability'
  | 'hours'
  | 'projects'
  | 'expenses'
  | 'invoices';

export interface ReportConfig {
  id: string;
  type: ReportType;
  title: string;
  description?: string;
  dateRange: DateRange;
  filters?: ReportFilters;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  compareWithPrevious?: boolean;
}

export interface ReportFilters {
  projectIds?: string[];
  clientIds?: string[];
  userIds?: string[];
  statuses?: string[];
  categories?: string[];
}

export interface ReportDataPoint {
  label: string;
  value: number;
  previousValue?: number;
  metadata?: Record<string, unknown>;
}

export interface ReportSummary {
  total: number;
  average: number;
  min: number;
  max: number;
  count: number;
  trend?: number; // Percentage change from previous period
  previousTotal?: number;
}

export interface ReportData {
  config: ReportConfig;
  summary: ReportSummary;
  dataPoints: ReportDataPoint[];
  generatedAt: Date;
}

// Revenue Report specific types
export interface RevenueDataPoint extends ReportDataPoint {
  metadata: {
    invoiceCount: number;
    paidAmount: number;
    pendingAmount: number;
  };
}

export interface RevenueReportData extends ReportData {
  dataPoints: RevenueDataPoint[];
  breakdown: {
    paid: number;
    pending: number;
    overdue: number;
  };
}

// Profitability Report specific types
export interface ProfitabilityDataPoint extends ReportDataPoint {
  metadata: {
    projectId: string;
    projectName: string;
    revenue: number;
    costs: number;
    margin: number;
    marginPercent: number;
  };
}

export interface ProfitabilityReportData extends ReportData {
  dataPoints: ProfitabilityDataPoint[];
  overallMargin: number;
  overallMarginPercent: number;
}

// Hours Report specific types
export interface HoursDataPoint extends ReportDataPoint {
  metadata: {
    billableHours: number;
    nonBillableHours: number;
    userCount: number;
  };
}

export interface HoursReportData extends ReportData {
  dataPoints: HoursDataPoint[];
  billableTotal: number;
  nonBillableTotal: number;
  utilizationRate: number;
}

// Projects Report specific types
export interface ProjectsDataPoint extends ReportDataPoint {
  metadata: {
    status: string;
    count: number;
  };
}

export interface ProjectsReportData extends ReportData {
  dataPoints: ProjectsDataPoint[];
  byStatus: Record<string, number>;
  completionRate: number;
}

// Helper function to get date range from preset
export function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        startDate: today,
        endDate: today,
        label: 'Today',
      };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: yesterday,
        endDate: yesterday,
        label: 'Yesterday',
      };
    }

    case 'this_week': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        startDate: startOfWeek,
        endDate: today,
        label: 'This Week',
      };
    }

    case 'last_week': {
      const endOfLastWeek = new Date(today);
      endOfLastWeek.setDate(today.getDate() - today.getDay() - 1);
      const startOfLastWeek = new Date(endOfLastWeek);
      startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
      return {
        startDate: startOfLastWeek,
        endDate: endOfLastWeek,
        label: 'Last Week',
      };
    }

    case 'this_month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: startOfMonth,
        endDate: today,
        label: 'This Month',
      };
    }

    case 'last_month': {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: startOfLastMonth,
        endDate: endOfLastMonth,
        label: 'Last Month',
      };
    }

    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      return {
        startDate: start,
        endDate: today,
        label: 'Last 30 Days',
      };
    }

    case 'last_90_days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 90);
      return {
        startDate: start,
        endDate: today,
        label: 'Last 90 Days',
      };
    }

    case 'this_quarter': {
      const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
      const startOfQuarter = new Date(today.getFullYear(), quarterMonth, 1);
      return {
        startDate: startOfQuarter,
        endDate: today,
        label: 'This Quarter',
      };
    }

    case 'last_quarter': {
      const currentQuarterMonth = Math.floor(today.getMonth() / 3) * 3;
      const startOfLastQuarter = new Date(today.getFullYear(), currentQuarterMonth - 3, 1);
      const endOfLastQuarter = new Date(today.getFullYear(), currentQuarterMonth, 0);
      return {
        startDate: startOfLastQuarter,
        endDate: endOfLastQuarter,
        label: 'Last Quarter',
      };
    }

    case 'this_year': {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return {
        startDate: startOfYear,
        endDate: today,
        label: 'This Year',
      };
    }

    case 'last_year': {
      const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
      return {
        startDate: startOfLastYear,
        endDate: endOfLastYear,
        label: 'Last Year',
      };
    }

    case 'custom':
    default:
      return {
        startDate: today,
        endDate: today,
        label: 'Custom',
      };
  }
}

export const DATE_PRESETS: DatePresetOption[] = [
  { value: 'today', label: 'Today', getRange: () => getDateRangeFromPreset('today') },
  { value: 'yesterday', label: 'Yesterday', getRange: () => getDateRangeFromPreset('yesterday') },
  { value: 'this_week', label: 'This Week', getRange: () => getDateRangeFromPreset('this_week') },
  { value: 'last_week', label: 'Last Week', getRange: () => getDateRangeFromPreset('last_week') },
  { value: 'this_month', label: 'This Month', getRange: () => getDateRangeFromPreset('this_month') },
  { value: 'last_month', label: 'Last Month', getRange: () => getDateRangeFromPreset('last_month') },
  { value: 'last_30_days', label: 'Last 30 Days', getRange: () => getDateRangeFromPreset('last_30_days') },
  { value: 'last_90_days', label: 'Last 90 Days', getRange: () => getDateRangeFromPreset('last_90_days') },
  { value: 'this_quarter', label: 'This Quarter', getRange: () => getDateRangeFromPreset('this_quarter') },
  { value: 'last_quarter', label: 'Last Quarter', getRange: () => getDateRangeFromPreset('last_quarter') },
  { value: 'this_year', label: 'This Year', getRange: () => getDateRangeFromPreset('this_year') },
  { value: 'last_year', label: 'Last Year', getRange: () => getDateRangeFromPreset('last_year') },
  { value: 'custom', label: 'Custom Range', getRange: () => getDateRangeFromPreset('custom') },
];
