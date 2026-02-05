/**
 * Project Profitability Report Generator
 *
 * Calculate margin per project based on revenue (invoices) vs costs (expenses, labor).
 */

import { Project, Invoice, TimeEntry } from '@/types';
import {
  DateRange,
  ReportConfig,
  ProfitabilityReportData,
  ProfitabilityDataPoint,
  ReportSummary,
} from '../types';

interface Expense {
  id: string;
  projectId?: string;
  amount: number;
  date: Date;
}

interface _ProjectCosts {
  projectId: string;
  expenses: number;
  laborCosts: number;
  totalCosts: number;
}

interface ProjectRevenue {
  projectId: string;
  invoiced: number;
  paid: number;
}

/**
 * Calculate labor costs from time entries
 */
function calculateLaborCosts(
  timeEntries: TimeEntry[],
  dateRange: DateRange
): Map<string, number> {
  const laborByProject = new Map<string, number>();

  for (const entry of timeEntries) {
    if (!entry.projectId) continue;

    const entryDate = entry.clockIn instanceof Date
      ? entry.clockIn
      : new Date(entry.clockIn);

    if (entryDate < dateRange.startDate || entryDate > dateRange.endDate) {
      continue;
    }

    const hours = (entry.totalMinutes || 0) / 60;
    const rate = entry.hourlyRate || 0;
    const laborCost = hours * rate;

    const existing = laborByProject.get(entry.projectId) || 0;
    laborByProject.set(entry.projectId, existing + laborCost);
  }

  return laborByProject;
}

/**
 * Calculate expenses by project
 */
function calculateExpensesByProject(
  expenses: Expense[],
  dateRange: DateRange
): Map<string, number> {
  const expensesByProject = new Map<string, number>();

  for (const expense of expenses) {
    if (!expense.projectId) continue;

    const expenseDate = expense.date instanceof Date
      ? expense.date
      : new Date(expense.date);

    if (expenseDate < dateRange.startDate || expenseDate > dateRange.endDate) {
      continue;
    }

    const existing = expensesByProject.get(expense.projectId) || 0;
    expensesByProject.set(expense.projectId, existing + expense.amount);
  }

  return expensesByProject;
}

/**
 * Calculate revenue by project from invoices
 */
function calculateRevenueByProject(
  invoices: Invoice[],
  dateRange: DateRange
): Map<string, ProjectRevenue> {
  const revenueByProject = new Map<string, ProjectRevenue>();

  for (const invoice of invoices) {
    if (!invoice.projectId) continue;

    const invoiceDate = invoice.createdAt instanceof Date
      ? invoice.createdAt
      : new Date(invoice.createdAt);

    if (invoiceDate < dateRange.startDate || invoiceDate > dateRange.endDate) {
      continue;
    }

    const existing = revenueByProject.get(invoice.projectId) || {
      projectId: invoice.projectId,
      invoiced: 0,
      paid: 0,
    };

    existing.invoiced += invoice.total || 0;
    existing.paid += invoice.amountPaid || 0;

    revenueByProject.set(invoice.projectId, existing);
  }

  return revenueByProject;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(dataPoints: ProfitabilityDataPoint[]): ReportSummary {
  const margins = dataPoints.map((dp) => dp.metadata.margin);
  const total = margins.reduce((sum, val) => sum + val, 0);

  return {
    total,
    average: margins.length > 0 ? total / margins.length : 0,
    min: margins.length > 0 ? Math.min(...margins) : 0,
    max: margins.length > 0 ? Math.max(...margins) : 0,
    count: dataPoints.length,
  };
}

/**
 * Generate project profitability report
 */
export function generateProfitabilityReport(
  projects: Project[],
  invoices: Invoice[],
  expenses: Expense[],
  timeEntries: TimeEntry[],
  config: ReportConfig
): ProfitabilityReportData {
  const { dateRange } = config;

  // Calculate costs and revenue by project
  const laborCosts = calculateLaborCosts(timeEntries, dateRange);
  const expensesByProject = calculateExpensesByProject(expenses, dateRange);
  const revenueByProject = calculateRevenueByProject(invoices, dateRange);

  // Build data points for each project
  const dataPoints: ProfitabilityDataPoint[] = [];
  let totalRevenue = 0;
  let totalCosts = 0;

  for (const project of projects) {
    const revenue = revenueByProject.get(project.id);
    const labor = laborCosts.get(project.id) || 0;
    const expenses = expensesByProject.get(project.id) || 0;

    // Skip projects with no financial activity in the period
    if (!revenue && labor === 0 && expenses === 0) {
      continue;
    }

    const projectRevenue = revenue?.invoiced || 0;
    const projectCosts = labor + expenses;
    const margin = projectRevenue - projectCosts;
    const marginPercent = projectRevenue > 0
      ? (margin / projectRevenue) * 100
      : 0;

    totalRevenue += projectRevenue;
    totalCosts += projectCosts;

    dataPoints.push({
      label: project.name,
      value: margin,
      metadata: {
        projectId: project.id,
        projectName: project.name,
        revenue: projectRevenue,
        costs: projectCosts,
        margin,
        marginPercent,
      },
    });
  }

  // Sort by margin (highest first)
  dataPoints.sort((a, b) => b.value - a.value);

  // Calculate overall margin
  const overallMargin = totalRevenue - totalCosts;
  const overallMarginPercent = totalRevenue > 0
    ? (overallMargin / totalRevenue) * 100
    : 0;

  // Calculate summary
  const summary = calculateSummary(dataPoints);

  return {
    config,
    summary,
    dataPoints,
    overallMargin,
    overallMarginPercent,
    generatedAt: new Date(),
  };
}

/**
 * Generate a simplified profitability report using only projects and invoices
 * (when detailed cost data isn't available)
 */
export function generateSimpleProfitabilityReport(
  projects: Project[],
  invoices: Invoice[],
  config: ReportConfig
): ProfitabilityReportData {
  const { dateRange } = config;

  // Calculate revenue by project from invoices
  const revenueByProject = calculateRevenueByProject(invoices, dateRange);

  // Build data points for each project
  const dataPoints: ProfitabilityDataPoint[] = [];
  let totalRevenue = 0;
  let totalCosts = 0;

  for (const project of projects) {
    const revenue = revenueByProject.get(project.id);

    // Use budget and currentSpend from project if available
    const projectRevenue = revenue?.invoiced || project.quoteTotal || 0;
    const projectCosts = project.currentSpend || 0;

    // Skip projects with no financial data
    if (projectRevenue === 0 && projectCosts === 0) {
      continue;
    }

    const margin = projectRevenue - projectCosts;
    const marginPercent = projectRevenue > 0
      ? (margin / projectRevenue) * 100
      : 0;

    totalRevenue += projectRevenue;
    totalCosts += projectCosts;

    dataPoints.push({
      label: project.name,
      value: margin,
      metadata: {
        projectId: project.id,
        projectName: project.name,
        revenue: projectRevenue,
        costs: projectCosts,
        margin,
        marginPercent,
      },
    });
  }

  // Sort by margin (highest first)
  dataPoints.sort((a, b) => b.value - a.value);

  // Calculate overall margin
  const overallMargin = totalRevenue - totalCosts;
  const overallMarginPercent = totalRevenue > 0
    ? (overallMargin / totalRevenue) * 100
    : 0;

  // Calculate summary
  const summary = calculateSummary(dataPoints);

  return {
    config,
    summary,
    dataPoints,
    overallMargin,
    overallMarginPercent,
    generatedAt: new Date(),
  };
}

/**
 * Format margin for display
 */
export function formatMargin(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format margin percent for display
 */
export function formatMarginPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Get margin status color
 */
export function getMarginStatus(marginPercent: number): 'success' | 'warning' | 'danger' {
  if (marginPercent >= 20) return 'success';
  if (marginPercent >= 10) return 'warning';
  return 'danger';
}
