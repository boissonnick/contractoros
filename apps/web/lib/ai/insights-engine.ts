/**
 * AI Insights Engine - Sprint 37B
 *
 * Generates AI-powered insights for reports and dashboards:
 * - Financial data analysis (spending anomalies, margin issues)
 * - Project health assessment (at-risk projects)
 * - Natural language summaries
 * - Actionable recommendations
 */

import type {
  AIInsight,
  AIInsightSeverity,
  AIInsightCategory,
  ProjectHealthScore,
  InsightSummary,
  InsightGenerationConfig,
  InsightGenerationResult,
} from '@/types';

import {
  detectAnomalyPercentage,
  analyzeTrend,
} from './anomaly-detection';

// ===========================================
// DEFAULT CONFIGURATION
// ===========================================

const DEFAULT_CONFIG: InsightGenerationConfig = {
  includeTrends: true,
  includeAnomalies: true,
  includeRecommendations: true,
  lookbackDays: 90,
  sensitivityLevel: 'medium',
  maxInsights: 10,
};

// ===========================================
// FINANCIAL INSIGHTS
// ===========================================

/**
 * Input data for financial analysis
 */
export interface FinancialDataInput {
  // Current period
  revenue: number;
  expenses: number;
  profitMargin: number;
  laborCosts: number;
  materialCosts: number;
  overheadCosts: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  cashFlow: number;

  // Historical data (for trend analysis)
  revenueHistory?: number[];
  expenseHistory?: number[];
  marginHistory?: number[];

  // Budget/targets
  budgetedRevenue?: number;
  budgetedExpenses?: number;
  targetMargin?: number;

  // Comparisons
  industryAvgMargin?: number;
  previousPeriodRevenue?: number;
  previousPeriodExpenses?: number;
}

/**
 * Analyze financial data and generate insights
 */
export function analyzeFinancialData(
  data: FinancialDataInput,
  config: Partial<InsightGenerationConfig> = {}
): AIInsight[] {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const insights: AIInsight[] = [];
  const now = new Date();

  // 1. Profit Margin Analysis
  if (data.targetMargin !== undefined) {
    const marginResult = detectAnomalyPercentage(
      data.profitMargin,
      data.targetMargin,
      mergedConfig.sensitivityLevel
    );

    if (marginResult.isAnomaly) {
      insights.push({
        id: `financial-margin-${now.getTime()}`,
        type: 'anomaly',
        severity: marginResult.severity,
        category: 'financial',
        title: data.profitMargin < data.targetMargin
          ? 'Profit Margin Below Target'
          : 'Profit Margin Exceeds Target',
        description: `Current profit margin is ${data.profitMargin.toFixed(1)}%, which is ${Math.abs(marginResult.percentageDeviation).toFixed(1)}% ${marginResult.direction} the target of ${data.targetMargin}%.`,
        metric: 'Profit Margin',
        value: data.profitMargin,
        expectedValue: data.targetMargin,
        deviation: marginResult.percentageDeviation,
        action: data.profitMargin < data.targetMargin
          ? { label: 'Review Costs', url: '/dashboard/reports/financial', type: 'navigate' }
          : undefined,
        confidence: 0.9,
        generatedAt: now,
        source: 'statistical',
      });
    }
  }

  // 2. Revenue Trend Analysis
  if (mergedConfig.includeTrends && data.revenueHistory && data.revenueHistory.length >= 3) {
    const revenueTrend = analyzeTrend(data.revenueHistory, { periodLabel: 'month' });

    if (revenueTrend.direction !== 'stable') {
      const severity: AIInsightSeverity = revenueTrend.direction === 'declining'
        ? (revenueTrend.changePercentage < -20 ? 'critical' : 'warning')
        : 'info';

      insights.push({
        id: `financial-revenue-trend-${now.getTime()}`,
        type: 'trend',
        severity,
        category: 'financial',
        title: `Revenue ${revenueTrend.direction === 'improving' ? 'Growing' : revenueTrend.direction === 'declining' ? 'Declining' : 'Volatile'}`,
        description: `Revenue has ${revenueTrend.direction === 'improving' ? 'increased' : 'decreased'} by ${Math.abs(revenueTrend.changePercentage).toFixed(1)}% over the past ${revenueTrend.dataPoints} ${revenueTrend.periodLabel}s.`,
        metric: 'Revenue',
        value: data.revenue,
        trend: revenueTrend.direction,
        trendPeriod: `${revenueTrend.dataPoints} ${revenueTrend.periodLabel}s`,
        confidence: revenueTrend.rSquared,
        generatedAt: now,
        source: 'statistical',
      });
    }
  }

  // 3. Outstanding Invoices Alert
  if (data.overdueInvoices > 0) {
    const overdueRatio = data.overdueInvoices / Math.max(data.outstandingInvoices, 1);
    const severity: AIInsightSeverity = overdueRatio > 0.5 ? 'critical' : overdueRatio > 0.2 ? 'warning' : 'info';

    insights.push({
      id: `financial-overdue-${now.getTime()}`,
      type: 'anomaly',
      severity,
      category: 'financial',
      title: 'Overdue Invoices Detected',
      description: `You have $${data.overdueInvoices.toLocaleString()} in overdue invoices (${(overdueRatio * 100).toFixed(0)}% of outstanding).`,
      metric: 'Overdue Amount',
      value: data.overdueInvoices,
      action: { label: 'View Overdue Invoices', url: '/dashboard/invoices?status=overdue', type: 'navigate' },
      confidence: 1.0,
      generatedAt: now,
      source: 'rule_based',
    });
  }

  // 4. Cash Flow Analysis
  if (data.cashFlow < 0) {
    const severity: AIInsightSeverity = data.cashFlow < -data.revenue * 0.1 ? 'critical' : 'warning';

    insights.push({
      id: `financial-cashflow-${now.getTime()}`,
      type: 'anomaly',
      severity,
      category: 'financial',
      title: 'Negative Cash Flow',
      description: `Current cash flow is -$${Math.abs(data.cashFlow).toLocaleString()}. Expenses are exceeding revenue.`,
      metric: 'Cash Flow',
      value: data.cashFlow,
      action: { label: 'Review Expenses', url: '/dashboard/expenses', type: 'navigate' },
      confidence: 1.0,
      generatedAt: now,
      source: 'rule_based',
    });
  }

  // 5. Budget Variance
  if (data.budgetedExpenses !== undefined) {
    const varianceResult = detectAnomalyPercentage(
      data.expenses,
      data.budgetedExpenses,
      mergedConfig.sensitivityLevel
    );

    if (varianceResult.isAnomaly && data.expenses > data.budgetedExpenses) {
      insights.push({
        id: `financial-budget-variance-${now.getTime()}`,
        type: 'anomaly',
        severity: varianceResult.severity,
        category: 'financial',
        title: 'Expenses Over Budget',
        description: `Expenses are ${varianceResult.percentageDeviation.toFixed(1)}% over budget ($${data.expenses.toLocaleString()} vs $${data.budgetedExpenses.toLocaleString()} budgeted).`,
        metric: 'Budget Variance',
        value: data.expenses,
        expectedValue: data.budgetedExpenses,
        deviation: varianceResult.percentageDeviation,
        action: { label: 'Analyze Spending', url: '/dashboard/reports/financial', type: 'navigate' },
        confidence: 0.95,
        generatedAt: now,
        source: 'statistical',
      });
    }
  }

  // 6. Cost Structure Analysis
  const totalCosts = data.laborCosts + data.materialCosts + data.overheadCosts;
  if (totalCosts > 0) {
    const laborRatio = data.laborCosts / totalCosts;
    const _materialRatio = data.materialCosts / totalCosts;

    // Alert if labor costs exceed 60% of total
    if (laborRatio > 0.6) {
      insights.push({
        id: `financial-labor-ratio-${now.getTime()}`,
        type: 'recommendation',
        severity: laborRatio > 0.7 ? 'warning' : 'info',
        category: 'financial',
        title: 'High Labor Cost Ratio',
        description: `Labor costs represent ${(laborRatio * 100).toFixed(0)}% of total costs. Consider reviewing staffing efficiency or pricing strategy.`,
        metric: 'Labor Ratio',
        value: laborRatio * 100,
        expectedValue: 50, // Industry benchmark
        action: { label: 'View Labor Report', url: '/dashboard/reports/labor', type: 'navigate' },
        confidence: 0.85,
        generatedAt: now,
        source: 'rule_based',
      });
    }
  }

  // Sort by severity and limit
  return sortAndLimitInsights(insights, mergedConfig.maxInsights);
}

// ===========================================
// PROJECT HEALTH ANALYSIS
// ===========================================

/**
 * Input data for project health analysis
 */
export interface ProjectDataInput {
  id: string;
  name: string;
  budget: number;
  actualSpend: number;
  startDate: Date;
  plannedEndDate?: Date;
  currentDate?: Date;
  completionPercentage: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  daysRemaining?: number;
  hoursLogged: number;
  estimatedHours?: number;
}

/**
 * Analyze a project's health and identify risks
 */
export function analyzeProjectHealth(project: ProjectDataInput): ProjectHealthScore {
  const now = project.currentDate || new Date();

  // 1. Budget Health (0-100)
  const budgetUsage = project.budget > 0 ? (project.actualSpend / project.budget) * 100 : 0;
  let budgetHealth = 100;
  if (budgetUsage > 100) {
    budgetHealth = Math.max(0, 100 - (budgetUsage - 100) * 2);
  } else if (budgetUsage > 80) {
    budgetHealth = 100 - (budgetUsage - 80);
  }

  // 2. Schedule Health (0-100)
  let scheduleHealth = 100;
  let scheduleVariance = 0;

  if (project.plannedEndDate) {
    const totalDuration = project.plannedEndDate.getTime() - project.startDate.getTime();
    const elapsed = now.getTime() - project.startDate.getTime();
    const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);

    // Schedule variance: positive = ahead, negative = behind
    scheduleVariance = project.completionPercentage - expectedProgress;

    if (scheduleVariance < 0) {
      scheduleHealth = Math.max(0, 100 + scheduleVariance * 2);
    }

    // Convert to days
    const msPerDay = 24 * 60 * 60 * 1000;
    scheduleVariance = (scheduleVariance / 100) * (totalDuration / msPerDay);
  }

  // 3. Task Health (0-100)
  const taskCompletionRate = project.totalTasks > 0
    ? (project.completedTasks / project.totalTasks) * 100
    : 100;

  const overdueRatio = project.totalTasks > 0
    ? project.overdueTasks / project.totalTasks
    : 0;

  let taskHealth = taskCompletionRate;
  taskHealth -= overdueRatio * 50; // Penalty for overdue tasks
  taskHealth = Math.max(0, Math.min(100, taskHealth));

  // 4. Overall Score (weighted average)
  const overall = Math.round(
    budgetHealth * 0.4 +
    scheduleHealth * 0.35 +
    taskHealth * 0.25
  );

  // 5. Risk Level
  let riskLevel: ProjectHealthScore['riskLevel'];
  if (overall >= 80) {
    riskLevel = 'low';
  } else if (overall >= 60) {
    riskLevel = 'medium';
  } else if (overall >= 40) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }

  // 6. Identify Risk Factors
  const riskFactors: string[] = [];
  if (budgetUsage > 90) riskFactors.push('Budget nearly exhausted');
  if (budgetUsage > 100) riskFactors.push('Over budget');
  if (scheduleVariance < -7) riskFactors.push(`${Math.abs(Math.round(scheduleVariance))} days behind schedule`);
  if (overdueRatio > 0.2) riskFactors.push('High number of overdue tasks');
  if (project.overdueTasks > 5) riskFactors.push(`${project.overdueTasks} overdue tasks`);

  return {
    overall,
    budgetHealth: Math.round(budgetHealth),
    scheduleHealth: Math.round(scheduleHealth),
    taskHealth: Math.round(taskHealth),
    riskLevel,
    budgetVariance: project.budget - project.actualSpend,
    scheduleVariance: Math.round(scheduleVariance),
    taskCompletionRate,
    overdueTaskCount: project.overdueTasks,
    isAtRisk: riskLevel === 'high' || riskLevel === 'critical',
    riskFactors,
  };
}

/**
 * Generate insights for a project based on health analysis
 */
export function generateProjectInsights(
  project: ProjectDataInput,
  health: ProjectHealthScore
): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = new Date();

  // Budget Alert
  if (health.budgetVariance < 0) {
    const overBudgetPercent = Math.abs(health.budgetVariance / project.budget) * 100;
    insights.push({
      id: `project-budget-${project.id}-${now.getTime()}`,
      type: 'anomaly',
      severity: overBudgetPercent > 20 ? 'critical' : 'warning',
      category: 'project_health',
      title: `${project.name}: Over Budget`,
      description: `Project is $${Math.abs(health.budgetVariance).toLocaleString()} (${overBudgetPercent.toFixed(1)}%) over budget.`,
      metric: 'Budget Variance',
      value: health.budgetVariance,
      expectedValue: 0,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
      relatedEntityName: project.name,
      action: { label: 'View Project', url: `/dashboard/projects/${project.id}`, type: 'navigate' },
      confidence: 1.0,
      generatedAt: now,
      source: 'rule_based',
    });
  }

  // Schedule Alert
  if (health.scheduleVariance < -7) {
    insights.push({
      id: `project-schedule-${project.id}-${now.getTime()}`,
      type: 'anomaly',
      severity: health.scheduleVariance < -14 ? 'critical' : 'warning',
      category: 'project_health',
      title: `${project.name}: Behind Schedule`,
      description: `Project is ${Math.abs(health.scheduleVariance)} days behind schedule.`,
      metric: 'Schedule Variance',
      value: health.scheduleVariance,
      expectedValue: 0,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
      relatedEntityName: project.name,
      action: { label: 'View Project', url: `/dashboard/projects/${project.id}`, type: 'navigate' },
      confidence: 0.9,
      generatedAt: now,
      source: 'rule_based',
    });
  }

  // Task Alert
  if (health.overdueTaskCount > 0) {
    insights.push({
      id: `project-tasks-${project.id}-${now.getTime()}`,
      type: 'anomaly',
      severity: health.overdueTaskCount > 10 ? 'critical' : health.overdueTaskCount > 5 ? 'warning' : 'info',
      category: 'project_health',
      title: `${project.name}: Overdue Tasks`,
      description: `Project has ${health.overdueTaskCount} overdue tasks affecting progress.`,
      metric: 'Overdue Tasks',
      value: health.overdueTaskCount,
      expectedValue: 0,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
      relatedEntityName: project.name,
      action: { label: 'View Tasks', url: `/dashboard/projects/${project.id}/tasks?status=overdue`, type: 'navigate' },
      confidence: 1.0,
      generatedAt: now,
      source: 'rule_based',
    });
  }

  // At-Risk Summary
  if (health.isAtRisk) {
    insights.push({
      id: `project-atrisk-${project.id}-${now.getTime()}`,
      type: 'summary',
      severity: health.riskLevel === 'critical' ? 'critical' : 'warning',
      category: 'risk',
      title: `${project.name}: At Risk`,
      description: `Health score: ${health.overall}/100. Risk factors: ${health.riskFactors.join(', ')}.`,
      metric: 'Health Score',
      value: health.overall,
      expectedValue: 80,
      relatedEntityType: 'project',
      relatedEntityId: project.id,
      relatedEntityName: project.name,
      action: { label: 'Review Project', url: `/dashboard/projects/${project.id}`, type: 'navigate' },
      confidence: 0.95,
      generatedAt: now,
      source: 'hybrid',
    });
  }

  return insights;
}

// ===========================================
// NATURAL LANGUAGE SUMMARY GENERATION
// ===========================================

/**
 * Generate a natural language summary for insights
 */
export function generateInsightSummary(
  insights: AIInsight[],
  context?: {
    periodLabel?: string;
    dataType?: 'financial' | 'operational' | 'project';
  }
): InsightSummary {
  const now = new Date();
  const { periodLabel = 'this period', dataType = 'financial' } = context || {};

  // Count by severity
  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;
  const infoCount = insights.filter(i => i.severity === 'info').length;

  // Determine outlook
  let outlook: InsightSummary['outlook'];
  if (criticalCount > 0) {
    outlook = 'concerning';
  } else if (warningCount > 2) {
    outlook = 'concerning';
  } else if (warningCount > 0) {
    outlook = 'neutral';
  } else {
    outlook = 'positive';
  }

  // Generate headline
  let headline: string;
  if (criticalCount > 0) {
    headline = `${criticalCount} critical ${criticalCount === 1 ? 'issue requires' : 'issues require'} immediate attention`;
  } else if (warningCount > 0) {
    headline = `${warningCount} ${warningCount === 1 ? 'area needs' : 'areas need'} review`;
  } else if (infoCount > 0) {
    headline = `Overall ${dataType} performance is healthy with ${infoCount} ${infoCount === 1 ? 'observation' : 'observations'}`;
  } else {
    headline = `No significant ${dataType} issues detected ${periodLabel}`;
  }

  // Extract key points
  const keyPoints: string[] = insights
    .filter(i => i.severity === 'critical' || i.severity === 'warning')
    .slice(0, 5)
    .map(i => i.title);

  // Generate recommendations
  const recommendations: string[] = insights
    .filter(i => i.type === 'recommendation' || (i.action && i.severity !== 'info'))
    .slice(0, 3)
    .map(i => i.action?.label || `Address: ${i.title}`);

  // Add default recommendations if needed
  if (recommendations.length === 0 && outlook === 'positive') {
    recommendations.push('Continue monitoring key metrics');
    recommendations.push('Review trends for optimization opportunities');
  }

  // Calculate confidence based on data quality
  const avgConfidence = insights.length > 0
    ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
    : 0.8;

  return {
    headline,
    keyPoints,
    recommendations,
    outlook,
    confidence: avgConfidence,
    generatedAt: now,
  };
}

// ===========================================
// RECOMMENDATIONS ENGINE
// ===========================================

/**
 * Generate actionable recommendations based on insights
 */
export function getRecommendations(insights: AIInsight[]): AIInsight[] {
  const recommendations: AIInsight[] = [];
  const now = new Date();

  // Group insights by category
  const byCategory = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) acc[insight.category] = [];
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, AIInsight[]>);

  // Financial recommendations
  if (byCategory.financial?.some(i => i.metric === 'Cash Flow' && (i.value ?? 0) < 0)) {
    recommendations.push({
      id: `rec-cashflow-${now.getTime()}`,
      type: 'recommendation',
      severity: 'warning',
      category: 'financial',
      title: 'Improve Cash Flow',
      description: 'Consider following up on overdue invoices and reviewing upcoming expenses to improve cash position.',
      action: { label: 'View Invoice Aging', url: '/dashboard/reports/financial#aging', type: 'navigate' },
      confidence: 0.9,
      generatedAt: now,
      source: 'rule_based',
    });
  }

  if (byCategory.financial?.some(i => i.metric === 'Profit Margin' && (i.value ?? 100) < 15)) {
    recommendations.push({
      id: `rec-margin-${now.getTime()}`,
      type: 'recommendation',
      severity: 'warning',
      category: 'financial',
      title: 'Review Pricing Strategy',
      description: 'Low profit margins may indicate pricing issues or cost inefficiencies. Consider reviewing project estimates and actual costs.',
      action: { label: 'Analyze Project Profitability', url: '/dashboard/reports/financial#profitability', type: 'navigate' },
      confidence: 0.85,
      generatedAt: now,
      source: 'rule_based',
    });
  }

  // Project recommendations
  const atRiskProjects = byCategory.project_health?.filter(i => i.title.includes('At Risk')) || [];
  if (atRiskProjects.length > 0) {
    recommendations.push({
      id: `rec-atrisk-${now.getTime()}`,
      type: 'recommendation',
      severity: 'warning',
      category: 'project_health',
      title: 'Review At-Risk Projects',
      description: `${atRiskProjects.length} ${atRiskProjects.length === 1 ? 'project is' : 'projects are'} at risk. Schedule project review meetings to address issues.`,
      action: { label: 'View Projects', url: '/dashboard/projects?health=at_risk', type: 'navigate' },
      confidence: 0.95,
      generatedAt: now,
      source: 'rule_based',
    });
  }

  // Operational recommendations
  if (byCategory.operational?.some(i => i.metric?.includes('Task') && (i.value ?? 0) > 10)) {
    recommendations.push({
      id: `rec-tasks-${now.getTime()}`,
      type: 'recommendation',
      severity: 'info',
      category: 'operational',
      title: 'Optimize Task Management',
      description: 'High overdue task count suggests workflow bottlenecks. Consider task prioritization or resource reallocation.',
      action: { label: 'View Tasks', url: '/dashboard/tasks?status=overdue', type: 'navigate' },
      confidence: 0.8,
      generatedAt: now,
      source: 'rule_based',
    });
  }

  return recommendations;
}

// ===========================================
// BATCH INSIGHT GENERATION
// ===========================================

/**
 * Generate comprehensive insights from all available data
 */
export function generateAllInsights(
  data: {
    financial?: FinancialDataInput;
    projects?: ProjectDataInput[];
    operational?: {
      totalHoursLogged: number;
      averageHoursPerEmployee: number;
      openTasks: number;
      overdueTasks: number;
      completedTasks: number;
    };
  },
  config: Partial<InsightGenerationConfig> = {}
): InsightGenerationResult {
  const startTime = Date.now();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const allInsights: AIInsight[] = [];
  let dataPointsAnalyzed = 0;

  // Generate financial insights
  if (data.financial) {
    const financialInsights = analyzeFinancialData(data.financial, mergedConfig);
    allInsights.push(...financialInsights);
    dataPointsAnalyzed += Object.keys(data.financial).length;
  }

  // Generate project insights
  if (data.projects && data.projects.length > 0) {
    for (const project of data.projects) {
      const health = analyzeProjectHealth(project);
      const projectInsights = generateProjectInsights(project, health);
      allInsights.push(...projectInsights);
      dataPointsAnalyzed += Object.keys(project).length;
    }
  }

  // Add recommendations
  if (mergedConfig.includeRecommendations) {
    const recommendations = getRecommendations(allInsights);
    allInsights.push(...recommendations);
  }

  // Sort and limit
  const finalInsights = sortAndLimitInsights(allInsights, mergedConfig.maxInsights);

  // Generate summary
  const summary = generateInsightSummary(finalInsights);

  return {
    insights: finalInsights,
    summary,
    generatedAt: new Date(),
    processingTimeMs: Date.now() - startTime,
    dataPointsAnalyzed,
  };
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Sort insights by severity and limit to max count
 */
function sortAndLimitInsights(insights: AIInsight[], maxCount: number): AIInsight[] {
  const severityOrder: Record<AIInsightSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return insights
    .sort((a, b) => {
      // First by severity
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by confidence
      return (b.confidence || 0) - (a.confidence || 0);
    })
    .slice(0, maxCount);
}

/**
 * Filter insights by category
 */
export function filterInsightsByCategory(
  insights: AIInsight[],
  category: AIInsightCategory
): AIInsight[] {
  return insights.filter(i => i.category === category);
}

/**
 * Filter insights by severity
 */
export function filterInsightsBySeverity(
  insights: AIInsight[],
  minSeverity: AIInsightSeverity
): AIInsight[] {
  const severityOrder: AIInsightSeverity[] = ['info', 'warning', 'critical'];
  const minIndex = severityOrder.indexOf(minSeverity);

  return insights.filter(i => severityOrder.indexOf(i.severity) >= minIndex);
}

/**
 * Get explanation text for a specific insight
 */
export function explainInsight(insight: AIInsight): string {
  const explanations: Record<string, string> = {
    anomaly: `This ${insight.metric || 'metric'} is showing unusual behavior compared to expected values.`,
    trend: `This represents a ${insight.trend || 'change'} pattern in ${insight.metric || 'your data'} over ${insight.trendPeriod || 'the analysis period'}.`,
    recommendation: `Based on your data patterns, this action could help improve ${insight.category.replace('_', ' ')} performance.`,
    summary: `This is an overall assessment of ${insight.category.replace('_', ' ')} based on multiple factors.`,
  };

  let explanation = explanations[insight.type] || 'This insight was generated from your data analysis.';

  if (insight.value !== undefined && insight.expectedValue !== undefined) {
    const diff = insight.value - insight.expectedValue;
    const percentDiff = insight.expectedValue !== 0
      ? ((diff / Math.abs(insight.expectedValue)) * 100).toFixed(1)
      : 'N/A';

    explanation += ` The current value of ${insight.value.toLocaleString()} is ${diff >= 0 ? 'above' : 'below'} the expected ${insight.expectedValue.toLocaleString()} by ${percentDiff}%.`;
  }

  if (insight.confidence < 0.7) {
    explanation += ' Note: This insight has moderate confidence due to limited data.';
  }

  return explanation;
}
