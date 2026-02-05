/**
 * Project Intelligence Service
 *
 * Provides profitability predictions, risk indicators, and post-project analysis
 * to help contractors manage projects more effectively.
 */

import {
  Project,
  ProjectCategory,
  Expense,
  TimeEntry,
  Task,
  ProjectPhase,
  ChangeOrder,
  ProjectIntelligence,
  ProfitabilityForecast,
  ProfitabilityFactor,
  ProjectRiskIndicator,
  RiskLevel,
  ProjectVarianceAnalysis,
  ProjectRecommendation,
} from '@/types';

// Average margins by project category (from industry data)
const CATEGORY_MARGINS: Record<ProjectCategory, { typical: number; good: number; excellent: number }> = {
  residential: { typical: 15, good: 20, excellent: 25 },
  commercial: { typical: 12, good: 18, excellent: 22 },
  industrial: { typical: 10, good: 15, excellent: 20 },
  renovation: { typical: 18, good: 25, excellent: 30 },
  new_construction: { typical: 12, good: 18, excellent: 22 },
  addition: { typical: 15, good: 22, excellent: 28 },
  repair: { typical: 20, good: 28, excellent: 35 },
  maintenance: { typical: 25, good: 35, excellent: 40 },
  other: { typical: 15, good: 20, excellent: 25 },
};

// Risk thresholds
const RISK_THRESHOLDS = {
  marginThin: 10, // Below this % is thin margin
  marginWarning: 15,
  scheduleDelayDays: 7,
  scheduleDelayPct: 10,
  budgetOverrunPct: 10,
  budgetWarningPct: 5,
  changeOrderCount: 3, // More than this is concerning
  changeOrderTotalPct: 15, // Total change orders > 15% of original
};

interface ProjectData {
  project: Project;
  phases?: ProjectPhase[];
  tasks?: Task[];
  expenses?: Expense[];
  timeEntries?: TimeEntry[];
  changeOrders?: ChangeOrder[];
}

/**
 * Generate comprehensive project intelligence
 */
export function analyzeProject(data: ProjectData): ProjectIntelligence {
  const { project } = data;

  // Generate profitability forecast
  const profitabilityForecast = generateProfitabilityForecast(data);

  // Detect risk indicators
  const riskIndicators = detectRiskIndicators(data);

  // Calculate overall scores
  const overallRiskScore = calculateOverallRiskScore(riskIndicators);
  const healthScore = calculateHealthScore(data, riskIndicators, profitabilityForecast);

  // Determine status
  const statusSummary = determineStatusSummary(data, profitabilityForecast);

  // Generate recommendations
  const recommendations = generateRecommendations(data, riskIndicators, profitabilityForecast);

  // Variance analysis (for completed projects)
  const varianceAnalysis = project.status === 'completed'
    ? generateVarianceAnalysis(data)
    : undefined;

  return {
    projectId: project.id,
    updatedAt: new Date(),
    profitabilityForecast,
    riskIndicators,
    overallRiskScore,
    healthScore,
    statusSummary,
    recommendations,
    varianceAnalysis,
  };
}

/**
 * Generate profitability forecast
 */
export function generateProfitabilityForecast(data: ProjectData): ProfitabilityForecast {
  const { project, expenses = [], timeEntries = [] } = data;
  const category = project.category || 'other';
  const margins = CATEGORY_MARGINS[category];

  // Calculate current totals
  const estimatedRevenue = project.quoteTotal || project.budget || 0;
  const currentExpenses = expenses
    .filter(e => e.status === 'approved' || e.status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0);

  // Estimate labor costs from time entries
  const laborHours = timeEntries.reduce((sum, t) => {
    // Use totalMinutes if available, otherwise calculate from clockIn/clockOut
    if (t.totalMinutes) {
      return sum + t.totalMinutes / 60;
    }
    const start = new Date(t.clockIn);
    const end = t.clockOut ? new Date(t.clockOut) : new Date();
    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);
  const avgHourlyRate = 45; // Simplified; would come from actual data
  const laborCosts = laborHours * avgHourlyRate;

  // Estimate total costs based on completion
  const completion = calculateCompletion(data);
  const projectedCosts = completion > 0
    ? (currentExpenses + laborCosts) / (completion / 100)
    : estimatedRevenue * (1 - margins.typical / 100);

  const estimatedCosts = Math.max(currentExpenses + laborCosts, projectedCosts);
  const estimatedProfit = estimatedRevenue - estimatedCosts;
  const estimatedMargin = estimatedRevenue > 0
    ? (estimatedProfit / estimatedRevenue) * 100
    : 0;

  // Calculate confidence based on data availability
  const dataPoints = [
    expenses.length > 0,
    timeEntries.length > 0,
    !!project.budget,
    !!project.quoteTotal,
    completion > 25,
  ];
  const confidence = Math.round((dataPoints.filter(Boolean).length / dataPoints.length) * 100);

  // Identify factors
  const factors: ProfitabilityFactor[] = [];

  if (estimatedMargin < margins.typical) {
    factors.push({
      factor: 'Below typical margin',
      impact: 'negative',
      weight: 0.3,
      description: `Current margin (${estimatedMargin.toFixed(1)}%) is below typical for ${category} projects (${margins.typical}%)`,
    });
  } else if (estimatedMargin > margins.good) {
    factors.push({
      factor: 'Strong margin',
      impact: 'positive',
      weight: 0.2,
      description: `Current margin (${estimatedMargin.toFixed(1)}%) exceeds typical by ${(estimatedMargin - margins.typical).toFixed(1)}%`,
    });
  }

  if (completion > 50 && estimatedCosts < estimatedRevenue * 0.7) {
    factors.push({
      factor: 'On budget',
      impact: 'positive',
      weight: 0.2,
      description: 'Costs are tracking below budget at this stage',
    });
  }

  return {
    projectId: project.id,
    forecastDate: new Date(),
    estimatedRevenue,
    estimatedCosts,
    estimatedProfit,
    estimatedMargin,
    confidence,
    factors,
    comparison: {
      similarProjects: 25, // Placeholder
      avgMargin: margins.typical,
      percentile: estimatedMargin > margins.good ? 75 : estimatedMargin > margins.typical ? 50 : 25,
    },
  };
}

/**
 * Detect risk indicators
 */
export function detectRiskIndicators(data: ProjectData): ProjectRiskIndicator[] {
  const risks: ProjectRiskIndicator[] = [];
  const { project, phases: _phases = [], tasks = [], expenses: _expenses = [], changeOrders = [] } = data;

  // 1. Thin margin risk
  const revenue = project.quoteTotal || project.budget || 0;
  const costs = project.currentSpend || 0;
  if (revenue > 0) {
    const currentMargin = ((revenue - costs) / revenue) * 100;
    if (currentMargin < RISK_THRESHOLDS.marginThin) {
      risks.push({
        id: `risk_${project.id}_margin`,
        type: 'thin_margin',
        level: currentMargin < 5 ? 'critical' : 'high',
        title: 'Thin Profit Margin',
        description: `Current margin is only ${currentMargin.toFixed(1)}%`,
        impact: 'May result in loss or breakeven',
        mitigation: 'Review costs for savings opportunities or negotiate change order for scope additions',
        detectedAt: new Date(),
      });
    } else if (currentMargin < RISK_THRESHOLDS.marginWarning) {
      risks.push({
        id: `risk_${project.id}_margin_warn`,
        type: 'thin_margin',
        level: 'medium',
        title: 'Margin Warning',
        description: `Current margin (${currentMargin.toFixed(1)}%) is below target`,
        impact: 'Reduced profitability',
        mitigation: 'Monitor expenses closely and avoid scope creep',
        detectedAt: new Date(),
      });
    }
  }

  // 2. Schedule delay risk
  if (project.estimatedEndDate) {
    const endDate = new Date(project.estimatedEndDate);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const completion = calculateCompletion(data);

    if (project.status === 'active' && daysRemaining < 0) {
      risks.push({
        id: `risk_${project.id}_overdue`,
        type: 'schedule_delay',
        level: daysRemaining < -14 ? 'critical' : 'high',
        title: 'Project Overdue',
        description: `Project is ${Math.abs(daysRemaining)} days past estimated end date`,
        impact: 'Client dissatisfaction, potential penalties',
        mitigation: 'Communicate with client and establish new timeline',
        detectedAt: new Date(),
      });
    } else if (daysRemaining > 0 && daysRemaining < 14 && completion < 80) {
      risks.push({
        id: `risk_${project.id}_behind`,
        type: 'schedule_delay',
        level: 'medium',
        title: 'At Risk for Delay',
        description: `Only ${completion.toFixed(0)}% complete with ${daysRemaining} days remaining`,
        impact: 'May miss deadline',
        mitigation: 'Consider adding resources or extending schedule',
        detectedAt: new Date(),
      });
    }
  }

  // 3. Budget overrun risk
  if (project.budget && project.currentSpend) {
    const overrunPct = ((project.currentSpend - project.budget) / project.budget) * 100;
    if (overrunPct > RISK_THRESHOLDS.budgetOverrunPct) {
      risks.push({
        id: `risk_${project.id}_budget`,
        type: 'budget_overrun',
        level: overrunPct > 20 ? 'critical' : 'high',
        title: 'Budget Overrun',
        description: `Spending is ${overrunPct.toFixed(1)}% over budget`,
        impact: `$${(project.currentSpend - project.budget).toLocaleString()} over budget`,
        mitigation: 'Review remaining scope and identify cost savings',
        detectedAt: new Date(),
      });
    } else if (overrunPct > RISK_THRESHOLDS.budgetWarningPct) {
      risks.push({
        id: `risk_${project.id}_budget_warn`,
        type: 'budget_overrun',
        level: 'medium',
        title: 'Budget Warning',
        description: `Spending is ${overrunPct.toFixed(1)}% over budget`,
        impact: 'May exceed budget if trend continues',
        mitigation: 'Review remaining expenses',
        detectedAt: new Date(),
      });
    }
  }

  // 4. Change order pattern risk
  if (changeOrders.length > RISK_THRESHOLDS.changeOrderCount) {
    const totalCOValue = changeOrders.reduce((sum, co) => sum + (co.impact?.costChange || 0), 0);
    const coPct = revenue > 0 ? (totalCOValue / revenue) * 100 : 0;

    if (coPct > RISK_THRESHOLDS.changeOrderTotalPct || changeOrders.length > 5) {
      risks.push({
        id: `risk_${project.id}_co`,
        type: 'change_order_pattern',
        level: coPct > 25 ? 'high' : 'medium',
        title: 'Frequent Change Orders',
        description: `${changeOrders.length} change orders totaling ${coPct.toFixed(1)}% of original contract`,
        impact: 'Scope definition issues, potential disputes',
        mitigation: 'Review scope documentation process for future projects',
        detectedAt: new Date(),
      });
    }
  }

  // 5. Scope creep detection (tasks added after project start)
  const projectStart = project.startDate ? new Date(project.startDate) : null;
  if (projectStart) {
    const tasksAddedLater = tasks.filter(t => {
      const created = new Date(t.createdAt);
      const daysSinceStart = (created.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceStart > 14; // Tasks added more than 2 weeks after start
    });

    if (tasksAddedLater.length > 5) {
      risks.push({
        id: `risk_${project.id}_scope`,
        type: 'scope_creep',
        level: tasksAddedLater.length > 10 ? 'high' : 'medium',
        title: 'Scope Creep Detected',
        description: `${tasksAddedLater.length} tasks added after project start`,
        impact: 'Increased costs and timeline pressure',
        mitigation: 'Ensure new scope is covered by change orders',
        detectedAt: new Date(),
      });
    }
  }

  return risks;
}

/**
 * Calculate overall risk score (0-100, higher = more risk)
 */
function calculateOverallRiskScore(risks: ProjectRiskIndicator[]): number {
  if (risks.length === 0) return 0;

  const levelScores: Record<RiskLevel, number> = {
    low: 10,
    medium: 25,
    high: 50,
    critical: 80,
  };

  const totalScore = risks.reduce((sum, r) => sum + levelScores[r.level], 0);
  return Math.min(100, Math.round(totalScore / Math.max(1, risks.length) + (risks.length * 5)));
}

/**
 * Calculate health score (0-100, higher = healthier)
 */
function calculateHealthScore(
  data: ProjectData,
  risks: ProjectRiskIndicator[],
  forecast: ProfitabilityForecast
): number {
  const { project } = data;
  let score = 100;

  // Deduct for risks
  risks.forEach(r => {
    switch (r.level) {
      case 'critical': score -= 25; break;
      case 'high': score -= 15; break;
      case 'medium': score -= 8; break;
      case 'low': score -= 3; break;
    }
  });

  // Deduct for low margin
  if (forecast.estimatedMargin < 10) score -= 15;
  else if (forecast.estimatedMargin < 15) score -= 8;

  // Deduct for low confidence
  if (forecast.confidence < 50) score -= 10;

  // Bonus for being ahead of schedule or under budget
  if (project.currentSpend && project.budget && project.currentSpend < project.budget * 0.9) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine status summary
 */
function determineStatusSummary(
  data: ProjectData,
  forecast: ProfitabilityForecast
): ProjectIntelligence['statusSummary'] {
  const { project } = data;
  const completion = calculateCompletion(data);

  // Schedule status
  let scheduleStatus: 'ahead' | 'on_track' | 'behind' | 'at_risk' = 'on_track';
  if (project.estimatedEndDate) {
    const endDate = new Date(project.estimatedEndDate);
    const startDate = project.startDate ? new Date(project.startDate) : new Date();
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = Date.now() - startDate.getTime();
    const expectedCompletion = (elapsed / totalDuration) * 100;

    if (completion > expectedCompletion + 10) scheduleStatus = 'ahead';
    else if (completion < expectedCompletion - 20) scheduleStatus = 'at_risk';
    else if (completion < expectedCompletion - 10) scheduleStatus = 'behind';
  }

  // Budget status
  let budgetStatus: 'under' | 'on_track' | 'over' | 'at_risk' = 'on_track';
  if (project.budget && project.currentSpend !== undefined) {
    const spendPct = (project.currentSpend / project.budget) * 100;
    const expectedSpend = completion; // Assume linear spending

    if (spendPct < expectedSpend * 0.9) budgetStatus = 'under';
    else if (spendPct > 110) budgetStatus = 'over';
    else if (spendPct > 100) budgetStatus = 'at_risk';
  }

  // Quality status (simplified - based on margin and risks)
  let qualityStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
  if (forecast.estimatedMargin > 25) qualityStatus = 'excellent';
  else if (forecast.estimatedMargin < 10) qualityStatus = 'poor';
  else if (forecast.estimatedMargin < 15) qualityStatus = 'fair';

  return { scheduleStatus, budgetStatus, qualityStatus };
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  data: ProjectData,
  risks: ProjectRiskIndicator[],
  forecast: ProfitabilityForecast
): ProjectRecommendation[] {
  const recommendations: ProjectRecommendation[] = [];
  const { project } = data;

  // Risk-based recommendations
  risks.forEach(risk => {
    if (risk.level === 'critical' || risk.level === 'high') {
      recommendations.push({
        id: `rec_${risk.id}`,
        type: 'warning',
        priority: risk.level === 'critical' ? 'high' : 'medium',
        title: `Address: ${risk.title}`,
        description: risk.mitigation || risk.description,
        actionLabel: 'View Details',
        actionType: 'navigate',
        actionPayload: { route: `/dashboard/projects/${project.id}?tab=risks` },
      });
    }
  });

  // Margin recommendations
  if (forecast.estimatedMargin < 15) {
    recommendations.push({
      id: 'rec_margin',
      type: 'insight',
      priority: 'medium',
      title: 'Review Pricing Strategy',
      description: `Your margin (${forecast.estimatedMargin.toFixed(1)}%) is below typical. Consider reviewing your pricing or reducing costs.`,
      actionLabel: 'View Financials',
      actionType: 'navigate',
      actionPayload: { route: `/dashboard/projects/${project.id}?tab=financials` },
    });
  }

  // General recommendations
  if (project.status === 'active' && !project.currentPhase) {
    recommendations.push({
      id: 'rec_phase',
      type: 'action',
      priority: 'low',
      title: 'Track Current Phase',
      description: 'Set the current phase to track progress more accurately.',
      actionLabel: 'Set Phase',
      actionType: 'modal',
      actionPayload: { modalType: 'setPhase' },
    });
  }

  // Limit to top 5
  return recommendations
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5);
}

/**
 * Generate variance analysis for completed projects
 */
export function generateVarianceAnalysis(data: ProjectData): ProjectVarianceAnalysis {
  const { project, phases = [], expenses = [] } = data;
  const estimated = project.quoteTotal || project.budget || 0;
  const actual = project.currentSpend || expenses.reduce((sum, e) => sum + e.amount, 0);
  const variance = actual - estimated;
  const variancePercent = estimated > 0 ? (variance / estimated) * 100 : 0;

  // By category
  const byCategory: ProjectVarianceAnalysis['byCategory'] = [
    'materials', 'labor', 'subcontractor', 'equipment_rental', 'permits', 'other'
  ].map(category => {
    const catExpenses = expenses.filter(e => e.category === category);
    const actualCat = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    // Estimated would come from estimate line items - simplified here
    const estimatedCat = estimated * 0.15; // Placeholder
    return {
      category,
      estimated: estimatedCat,
      actual: actualCat,
      variance: actualCat - estimatedCat,
      variancePercent: estimatedCat > 0 ? ((actualCat - estimatedCat) / estimatedCat) * 100 : 0,
    };
  }).filter(c => c.actual > 0 || c.estimated > 0);

  // By phase
  const byPhase = phases.map(phase => {
    // Expenses don't have phaseId, so we distribute evenly for now
    // In a real implementation, this would come from line-item level tracking
    const actualPhase = actual / Math.max(1, phases.length);
    const estimatedPhase = estimated / Math.max(1, phases.length); // Simplified
    return {
      phaseId: phase.id,
      phaseName: phase.name,
      estimated: estimatedPhase,
      actual: actualPhase,
      variance: actualPhase - estimatedPhase,
      variancePercent: estimatedPhase > 0 ? ((actualPhase - estimatedPhase) / estimatedPhase) * 100 : 0,
    };
  });

  // Generate insights
  const insights: string[] = [];
  if (variancePercent > 10) {
    insights.push(`Project came in ${variancePercent.toFixed(1)}% over estimate. Review estimating process.`);
  } else if (variancePercent < -5) {
    insights.push(`Project came in ${Math.abs(variancePercent).toFixed(1)}% under estimate. Good cost management!`);
  } else {
    insights.push('Project costs were close to estimate. Estimating accuracy is good.');
  }

  // Lessons learned
  const lessonsLearned: string[] = [];
  const highVarianceCategories = byCategory.filter(c => Math.abs(c.variancePercent) > 20);
  highVarianceCategories.forEach(c => {
    lessonsLearned.push(
      c.variancePercent > 0
        ? `${c.category} came in ${c.variancePercent.toFixed(0)}% over - consider padding estimates.`
        : `${c.category} came in ${Math.abs(c.variancePercent).toFixed(0)}% under - estimates may be too high.`
    );
  });

  return {
    projectId: project.id,
    analyzedAt: new Date(),
    overall: { estimatedTotal: estimated, actualTotal: actual, variance, variancePercent },
    byCategory,
    byPhase,
    byTrade: [], // Would need trade data from subs
    insights,
    lessonsLearned,
  };
}

/**
 * Calculate project completion percentage
 */
export function calculateCompletion(data: ProjectData): number {
  const { tasks = [], phases = [] } = data;

  // Try task-based completion first
  if (tasks.length > 0) {
    const completed = tasks.filter(t => t.status === 'completed').length;
    return (completed / tasks.length) * 100;
  }

  // Try phase-based completion
  if (phases.length > 0) {
    const completed = phases.filter(p => p.status === 'completed').length;
    return (completed / phases.length) * 100;
  }

  // Default based on project status
  const { project } = data;
  switch (project.status) {
    case 'lead':
    case 'bidding':
      return 0;
    case 'planning':
      return 5;
    case 'active':
      return 50; // Assume halfway if no better data
    case 'on_hold':
      return 40;
    case 'completed':
      return 100;
    case 'cancelled':
      return 0;
    default:
      return 0;
  }
}

// Re-export constants (functions are already exported inline)
export {
  CATEGORY_MARGINS,
  RISK_THRESHOLDS,
};
