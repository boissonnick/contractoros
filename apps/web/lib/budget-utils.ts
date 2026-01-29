"use client";

/**
 * Centralized Budget Calculation Utility
 *
 * This module provides consistent budget calculations across the entire application.
 * All budget-related calculations should use these functions to ensure accuracy.
 *
 * IMPORTANT: Budget values can come from multiple sources:
 * - project.currentSpend: Cached total (may be stale)
 * - expenses: Real-time calculation from expense records
 * - phases: Sum of phase.actualCost values
 *
 * The CANONICAL source is always the expense records for accuracy.
 */

import { Project, ProjectPhase, Expense, Invoice } from '@/types';

// ============================================
// Types
// ============================================

export interface BudgetSummary {
  // Budget values
  totalBudget: number;
  phaseBudget: number;         // Sum of all phase budgets

  // Spending
  totalSpent: number;          // From expenses
  approvedSpent: number;       // Only approved/reimbursed expenses
  pendingSpent: number;        // Submitted but not yet approved

  // Remaining
  remaining: number;
  remainingPercentage: number;

  // Status
  percentUsed: number;
  isOverBudget: boolean;
  budgetStatus: 'healthy' | 'warning' | 'critical' | 'over';

  // By category breakdown
  byCategory: Record<string, number>;
}

export interface RevenueSummary {
  contractValue: number;       // Project quote/contract value
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
}

export interface ProfitSummary {
  grossProfit: number;
  profitMargin: number;        // As percentage
  netProfit: number;           // After all expenses
  projectedProfit: number;     // Based on contract value - budget
}

export interface ProjectFinancials {
  budget: BudgetSummary;
  revenue: RevenueSummary;
  profit: ProfitSummary;
}

// ============================================
// Budget Status Thresholds
// ============================================

export const BUDGET_THRESHOLDS = {
  healthy: 75,    // Under 75% used
  warning: 90,    // 75-90% used
  critical: 100,  // 90-100% used
  over: 100,      // Over 100%
} as const;

// ============================================
// Core Calculation Functions
// ============================================

/**
 * Calculate total spent from expense records
 * This is the CANONICAL way to calculate spending
 */
export function calculateTotalSpent(
  expenses: Expense[],
  options: { includeRejected?: boolean; includeApprovedOnly?: boolean } = {}
): number {
  const { includeRejected = false, includeApprovedOnly = false } = options;

  return expenses
    .filter(expense => {
      if (includeRejected) return true;
      if (expense.status === 'rejected') return false;
      if (includeApprovedOnly) {
        return expense.status === 'approved' || expense.status === 'reimbursed';
      }
      return true;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Calculate total phase budgets
 */
export function calculatePhaseBudgetTotal(phases: ProjectPhase[]): number {
  return phases.reduce((sum, phase) => sum + (phase.budgetAmount || 0), 0);
}

/**
 * Calculate total phase actual costs
 */
export function calculatePhaseSpentTotal(phases: ProjectPhase[]): number {
  return phases.reduce((sum, phase) => sum + (phase.actualCost || 0), 0);
}

/**
 * Calculate budget percentage used
 */
export function calculateBudgetPercentage(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return (spent / budget) * 100;
}

/**
 * Determine budget status based on percentage used
 */
export function getBudgetStatus(percentUsed: number): BudgetSummary['budgetStatus'] {
  if (percentUsed > BUDGET_THRESHOLDS.over) return 'over';
  if (percentUsed > BUDGET_THRESHOLDS.warning) return 'critical';
  if (percentUsed > BUDGET_THRESHOLDS.healthy) return 'warning';
  return 'healthy';
}

/**
 * Get budget status color class
 */
export function getBudgetStatusColor(status: BudgetSummary['budgetStatus']): string {
  switch (status) {
    case 'healthy': return 'text-green-600';
    case 'warning': return 'text-yellow-600';
    case 'critical': return 'text-orange-600';
    case 'over': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

/**
 * Get budget progress bar color class
 */
export function getBudgetBarColor(status: BudgetSummary['budgetStatus']): string {
  switch (status) {
    case 'healthy': return 'bg-green-500';
    case 'warning': return 'bg-yellow-500';
    case 'critical': return 'bg-orange-500';
    case 'over': return 'bg-red-500';
    default: return 'bg-gray-300';
  }
}

// ============================================
// Expense Category Breakdown
// ============================================

/**
 * Calculate spending breakdown by category
 */
export function calculateCategoryBreakdown(expenses: Expense[]): Record<string, number> {
  const breakdown: Record<string, number> = {};

  expenses
    .filter(e => e.status !== 'rejected')
    .forEach(expense => {
      breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount;
    });

  return breakdown;
}

// ============================================
// Revenue Calculations
// ============================================

/**
 * Calculate revenue summary from invoices
 */
export function calculateRevenueSummary(
  invoices: Invoice[],
  contractValue: number = 0
): RevenueSummary {
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

  const outstandingInvoices = invoices.filter(inv =>
    ['sent', 'viewed', 'partial', 'overdue'].includes(inv.status)
  );
  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

  return {
    contractValue,
    totalInvoiced,
    totalPaid,
    totalOutstanding,
    overdueAmount,
  };
}

// ============================================
// Profit Calculations
// ============================================

/**
 * Calculate profit summary
 */
export function calculateProfitSummary(
  revenue: RevenueSummary,
  expenses: Expense[],
  budget: number = 0
): ProfitSummary {
  const approvedExpenses = calculateTotalSpent(expenses, { includeApprovedOnly: true });
  const allExpenses = calculateTotalSpent(expenses);

  const grossProfit = revenue.totalPaid - approvedExpenses;
  const profitMargin = revenue.totalPaid > 0 ? (grossProfit / revenue.totalPaid) * 100 : 0;
  const netProfit = revenue.totalPaid - allExpenses;
  const projectedProfit = revenue.contractValue - budget;

  return {
    grossProfit,
    profitMargin,
    netProfit,
    projectedProfit,
  };
}

// ============================================
// Comprehensive Budget Summary
// ============================================

/**
 * Calculate complete budget summary for a project
 *
 * @param project - The project object
 * @param expenses - Array of expense records
 * @param phases - Optional array of project phases
 * @returns Complete budget summary
 */
export function calculateBudgetSummary(
  project: Project,
  expenses: Expense[],
  phases: ProjectPhase[] = []
): BudgetSummary {
  const totalBudget = project.budget || 0;
  const phaseBudget = calculatePhaseBudgetTotal(phases);

  // Calculate spending from ACTUAL expense records (canonical source)
  const totalSpent = calculateTotalSpent(expenses);
  const approvedSpent = calculateTotalSpent(expenses, { includeApprovedOnly: true });
  const pendingSpent = expenses
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  const remaining = totalBudget - totalSpent;
  const percentUsed = calculateBudgetPercentage(totalSpent, totalBudget);
  const remainingPercentage = totalBudget > 0 ? (remaining / totalBudget) * 100 : 0;
  const budgetStatus = getBudgetStatus(percentUsed);

  const byCategory = calculateCategoryBreakdown(expenses);

  return {
    totalBudget,
    phaseBudget,
    totalSpent,
    approvedSpent,
    pendingSpent,
    remaining,
    remainingPercentage,
    percentUsed,
    isOverBudget: totalSpent > totalBudget && totalBudget > 0,
    budgetStatus,
    byCategory,
  };
}

/**
 * Calculate complete project financials
 *
 * This is the main function for getting all financial data
 */
export function calculateProjectFinancials(
  project: Project,
  expenses: Expense[],
  invoices: Invoice[],
  phases: ProjectPhase[] = []
): ProjectFinancials {
  const budget = calculateBudgetSummary(project, expenses, phases);
  const revenue = calculateRevenueSummary(invoices, project.quoteTotal);
  const profit = calculateProfitSummary(revenue, expenses, project.budget);

  return {
    budget,
    revenue,
    profit,
  };
}

// ============================================
// Formatting Utilities
// ============================================

/**
 * Format currency consistently
 */
export function formatBudgetCurrency(
  amount: number,
  options: { showSign?: boolean; compact?: boolean } = {}
): string {
  const { showSign = false, compact = false } = options;

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: compact ? 0 : 2,
    notation: compact && Math.abs(amount) >= 10000 ? 'compact' : 'standard',
  });

  const formatted = formatter.format(Math.abs(amount));

  if (showSign && amount !== 0) {
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  return amount >= 0 ? formatted : `-${formatted.replace('-', '')}`;
}

/**
 * Format percentage consistently
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ============================================
// Tooltip/Help Text
// ============================================

export const BUDGET_HELP_TEXT = {
  totalBudget: 'The total planned budget for this project.',
  phaseBudget: 'Sum of all individual phase budgets.',
  totalSpent: 'Total expenses recorded (excluding rejected).',
  approvedSpent: 'Only includes approved or reimbursed expenses.',
  pendingSpent: 'Expenses submitted but awaiting approval.',
  remaining: 'Budget minus total spent expenses.',
  percentUsed: 'Percentage of budget used so far.',
  grossProfit: 'Revenue collected minus approved expenses.',
  profitMargin: 'Gross profit as percentage of revenue.',
  netProfit: 'Revenue minus all recorded expenses.',
  projectedProfit: 'Contract value minus planned budget.',
} as const;
