"use client";

/**
 * Report Hooks - Facade/Re-export Module
 *
 * This file re-exports all report hooks from the modular reports/ directory.
 * The hooks have been split into focused files for better maintainability:
 *
 * - types.ts: All shared TypeScript interfaces and constants
 * - useBaseReports.ts: Labor costs, project P&L, productivity metrics
 * - useDashboardReports.ts: Dashboard KPIs and aggregated metrics
 * - useFinancialReports.ts: Revenue, expenses, invoicing, P&L analysis
 * - useOperationalReports.ts: Project timelines, task metrics, resources
 *
 * Import directly from '@/lib/hooks/useReports' for backward compatibility,
 * or from '@/lib/hooks/reports' for direct access to individual modules.
 */

// Re-export all types
export type {
  LaborCostData,
  ProjectPnLData,
  ProductivityData,
  DashboardKPIs,
  TrendDataPoint,
  ProjectStatusDistribution,
  RevenueByMonth,
  TeamPerformance,
  DashboardData,
  ActivityItem,
  FinancialSummary,
  RevenueByProject,
  RevenueByClient,
  RevenueByMonthData,
  CostBreakdown,
  ExpenseByCategory,
  InvoiceAging,
  OperationalMetrics,
  ProjectTimeline,
  ARAgingBucket,
  BalanceSheetData,
  CashFlowStatementData,
  ReportTemplate,
} from './reports/types';

// Re-export constants
export {
  STATUS_COLORS,
  TASK_STATUS_COLORS,
  CATEGORY_COLORS,
} from './reports/types';

// Re-export hooks
export { useBaseReports } from './reports/useBaseReports';
export { useDashboardReports } from './reports/useDashboardReports';
export { useFinancialReports } from './reports/useFinancialReports';
export { useOperationalReports } from './reports/useOperationalReports';
export { useBalanceSheet } from './reports/useBalanceSheet';
export { useCashFlowStatement } from './reports/useCashFlowStatement';

// Legacy alias - useReports maps to useBaseReports for backward compatibility
export { useBaseReports as useReports } from './reports/useBaseReports';
