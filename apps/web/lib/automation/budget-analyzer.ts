/**
 * Budget Analyzer Utility
 * Analyzes project budget health and generates alerts
 */

export interface BudgetAnalysis {
  healthScore: number; // 0-100
  status: 'healthy' | 'warning' | 'critical' | 'over-budget';
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentUsed: number;
  spendingByPhase: PhaseSpending[];
  predictedAtCompletion: number;
  alerts: BudgetAlert[];
  recommendations: string[];
}

export interface PhaseSpending {
  phaseId: string;
  phaseName: string;
  budgeted: number;
  spent: number;
  percentUsed: number;
  status: 'under' | 'on-track' | 'over';
}

export interface BudgetAlert {
  level: 'info' | 'warning' | 'critical';
  threshold: number;
  message: string;
  triggeredAt: Date;
}

export interface Expense {
  id: string;
  amount: number;
  phaseId?: string;
  category?: string;
  date: Date;
  description?: string;
}

export interface Budget {
  total: number;
  phases?: {
    phaseId: string;
    phaseName: string;
    amount: number;
  }[];
  contingency?: number;
}

const ALERT_THRESHOLDS = [
  { percent: 80, level: 'info' as const, message: 'Budget 80% utilized' },
  { percent: 90, level: 'warning' as const, message: 'Budget 90% utilized - review spending' },
  { percent: 100, level: 'critical' as const, message: 'Budget exceeded - immediate action required' },
];

/**
 * Calculate budget health score based on spending patterns
 */
function calculateHealthScore(percentUsed: number, burnRate: number, expectedProgress: number): number {
  // Base score starts at 100
  let score = 100;

  // Deduct for over-spending
  if (percentUsed > 100) {
    score -= Math.min(50, (percentUsed - 100) * 2);
  } else if (percentUsed > 90) {
    score -= (percentUsed - 90) * 2;
  }

  // Deduct for burn rate exceeding expected progress
  const burnDelta = burnRate - expectedProgress;
  if (burnDelta > 0) {
    score -= Math.min(30, burnDelta * 0.5);
  }

  return Math.max(0, Math.round(score));
}

/**
 * Determine budget status based on percent used
 */
function determineStatus(percentUsed: number): BudgetAnalysis['status'] {
  if (percentUsed >= 100) return 'over-budget';
  if (percentUsed >= 90) return 'critical';
  if (percentUsed >= 80) return 'warning';
  return 'healthy';
}

/**
 * Categorize spending by project phase
 */
function categorizeByPhase(expenses: Expense[], budget: Budget): PhaseSpending[] {
  const phaseMap = new Map<string, { spent: number; budgeted: number; name: string }>();

  // Initialize phases from budget
  budget.phases?.forEach(phase => {
    phaseMap.set(phase.phaseId, {
      spent: 0,
      budgeted: phase.amount,
      name: phase.phaseName,
    });
  });

  // Add 'unallocated' phase for expenses without phaseId
  phaseMap.set('unallocated', {
    spent: 0,
    budgeted: 0,
    name: 'Unallocated',
  });

  // Aggregate expenses by phase
  expenses.forEach(expense => {
    const phaseId = expense.phaseId || 'unallocated';
    const phase = phaseMap.get(phaseId);
    if (phase) {
      phase.spent += expense.amount;
    } else {
      phaseMap.set(phaseId, {
        spent: expense.amount,
        budgeted: 0,
        name: phaseId,
      });
    }
  });

  // Convert to array
  return Array.from(phaseMap.entries()).map(([phaseId, data]) => {
    const percentUsed = data.budgeted > 0 ? (data.spent / data.budgeted) * 100 : 0;
    return {
      phaseId,
      phaseName: data.name,
      budgeted: data.budgeted,
      spent: data.spent,
      percentUsed: Math.round(percentUsed * 100) / 100,
      status: percentUsed > 100 ? 'over' : percentUsed > 80 ? 'on-track' : 'under',
    };
  });
}

/**
 * Predict total cost at project completion based on current burn rate
 */
function predictAtCompletion(
  totalSpent: number,
  totalBudget: number,
  projectProgress: number
): number {
  if (projectProgress <= 0) return totalBudget;
  if (projectProgress >= 100) return totalSpent;

  // Simple linear extrapolation
  const projectedTotal = (totalSpent / projectProgress) * 100;
  return Math.round(projectedTotal * 100) / 100;
}

/**
 * Generate alerts based on budget thresholds
 */
function generateAlerts(percentUsed: number): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  const now = new Date();

  ALERT_THRESHOLDS.forEach(threshold => {
    if (percentUsed >= threshold.percent) {
      alerts.push({
        level: threshold.level,
        threshold: threshold.percent,
        message: threshold.message,
        triggeredAt: now,
      });
    }
  });

  return alerts;
}

/**
 * Generate recommendations based on budget analysis
 */
function generateRecommendations(
  percentUsed: number,
  spendingByPhase: PhaseSpending[],
  predictedAtCompletion: number,
  totalBudget: number
): string[] {
  const recommendations: string[] = [];

  // Over-budget phases
  const overPhases = spendingByPhase.filter(p => p.status === 'over');
  if (overPhases.length > 0) {
    recommendations.push(
      `Review spending in over-budget phases: ${overPhases.map(p => p.phaseName).join(', ')}`
    );
  }

  // Predicted overage
  if (predictedAtCompletion > totalBudget) {
    const overage = predictedAtCompletion - totalBudget;
    recommendations.push(
      `Projected to exceed budget by $${overage.toLocaleString()}. Consider scope adjustments or change order.`
    );
  }

  // High utilization warning
  if (percentUsed >= 80 && percentUsed < 100) {
    recommendations.push('Review remaining work against available budget before committing to new expenses.');
  }

  // Already over budget
  if (percentUsed >= 100) {
    recommendations.push('Initiate budget review meeting with stakeholders.');
    recommendations.push('Consider issuing change order for additional scope.');
  }

  return recommendations;
}

/**
 * Main budget analysis function
 */
export function analyzeBudget(
  projectId: string,
  expenses: Expense[],
  budget: Budget,
  projectProgress: number = 50 // Default to 50% progress if not specified
): BudgetAnalysis {
  const totalBudget = budget.total;
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const spendingByPhase = categorizeByPhase(expenses, budget);
  const predicted = predictAtCompletion(totalSpent, totalBudget, projectProgress);
  const healthScore = calculateHealthScore(percentUsed, percentUsed, projectProgress);
  const status = determineStatus(percentUsed);
  const alerts = generateAlerts(percentUsed);
  const recommendations = generateRecommendations(percentUsed, spendingByPhase, predicted, totalBudget);

  return {
    healthScore,
    status,
    totalBudget,
    totalSpent: Math.round(totalSpent * 100) / 100,
    remaining: Math.round(remaining * 100) / 100,
    percentUsed: Math.round(percentUsed * 100) / 100,
    spendingByPhase,
    predictedAtCompletion: predicted,
    alerts,
    recommendations,
  };
}
