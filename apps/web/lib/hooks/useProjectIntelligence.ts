/**
 * useProjectIntelligence Hook
 *
 * Provides project intelligence including profitability forecasts,
 * risk indicators, and recommendations.
 */

'use client';

import { useMemo } from 'react';
import {
  Project,
  ProjectPhase,
  Task,
  Expense,
  TimeEntry,
  ChangeOrder,
  ProjectIntelligence,
  ProjectRiskIndicator,
  ProfitabilityForecast,
  ProjectVarianceAnalysis,
} from '@/types';
import {
  analyzeProject,
  generateProfitabilityForecast,
  detectRiskIndicators,
  generateVarianceAnalysis,
  calculateCompletion,
} from '@/lib/intelligence/project-intelligence';

interface UseProjectIntelligenceOptions {
  project: Project | null;
  phases?: ProjectPhase[];
  tasks?: Task[];
  expenses?: Expense[];
  timeEntries?: TimeEntry[];
  changeOrders?: ChangeOrder[];
}

interface UseProjectIntelligenceReturn {
  /** Full project intelligence analysis */
  intelligence: ProjectIntelligence | null;
  /** Profitability forecast */
  profitability: ProfitabilityForecast | null;
  /** List of risk indicators */
  risks: ProjectRiskIndicator[];
  /** High-priority risks only */
  criticalRisks: ProjectRiskIndicator[];
  /** Variance analysis (for completed projects) */
  variance: ProjectVarianceAnalysis | null;
  /** Overall health score (0-100) */
  healthScore: number;
  /** Overall risk score (0-100) */
  riskScore: number;
  /** Calculated completion percentage */
  completion: number;
  /** Whether the project is at risk */
  isAtRisk: boolean;
  /** Get risk by type */
  getRisksByType: (type: string) => ProjectRiskIndicator[];
  /** Get unacknowledged risks */
  unacknowledgedRisks: ProjectRiskIndicator[];
}

export function useProjectIntelligence(
  options: UseProjectIntelligenceOptions
): UseProjectIntelligenceReturn {
  const { project, phases = [], tasks = [], expenses = [], timeEntries = [], changeOrders = [] } = options;

  // Generate full intelligence analysis
  const intelligence = useMemo(() => {
    if (!project) return null;

    return analyzeProject({
      project,
      phases,
      tasks,
      expenses,
      timeEntries,
      changeOrders,
    });
  }, [project, phases, tasks, expenses, timeEntries, changeOrders]);

  // Extract individual components
  const profitability = intelligence?.profitabilityForecast || null;
  const risks = useMemo(() => intelligence?.riskIndicators || [], [intelligence]);
  const variance = intelligence?.varianceAnalysis || null;
  const healthScore = intelligence?.healthScore || 100;
  const riskScore = intelligence?.overallRiskScore || 0;

  // Calculate completion
  const completion = useMemo(() => {
    if (!project) return 0;
    return calculateCompletion({ project, phases, tasks, expenses, timeEntries, changeOrders });
  }, [project, phases, tasks, expenses, timeEntries, changeOrders]);

  // Critical risks (high or critical level)
  const criticalRisks = useMemo(() => {
    return risks.filter(r => r.level === 'critical' || r.level === 'high');
  }, [risks]);

  // Unacknowledged risks
  const unacknowledgedRisks = useMemo(() => {
    return risks.filter(r => !r.acknowledgedAt);
  }, [risks]);

  // Helper to get risks by type
  const getRisksByType = (type: string): ProjectRiskIndicator[] => {
    return risks.filter(r => r.type === type);
  };

  // Determine if project is at risk
  const isAtRisk = riskScore > 50 || criticalRisks.length > 0;

  return {
    intelligence,
    profitability,
    risks,
    criticalRisks,
    variance,
    healthScore,
    riskScore,
    completion,
    isAtRisk,
    getRisksByType,
    unacknowledgedRisks,
  };
}

/**
 * Simplified hook for just profitability data
 */
export function useProjectProfitability(
  project: Project | null,
  expenses: Expense[] = [],
  timeEntries: TimeEntry[] = []
): ProfitabilityForecast | null {
  return useMemo(() => {
    if (!project) return null;

    return generateProfitabilityForecast({
      project,
      expenses,
      timeEntries,
    });
  }, [project, expenses, timeEntries]);
}

/**
 * Simplified hook for just risk indicators
 */
export function useProjectRisks(
  project: Project | null,
  phases: ProjectPhase[] = [],
  tasks: Task[] = [],
  expenses: Expense[] = [],
  changeOrders: ChangeOrder[] = []
): ProjectRiskIndicator[] {
  return useMemo(() => {
    if (!project) return [];

    return detectRiskIndicators({
      project,
      phases,
      tasks,
      expenses,
      changeOrders,
    });
  }, [project, phases, tasks, expenses, changeOrders]);
}

/**
 * Hook for variance analysis (completed projects)
 */
export function useProjectVariance(
  project: Project | null,
  phases: ProjectPhase[] = [],
  expenses: Expense[] = []
): ProjectVarianceAnalysis | null {
  return useMemo(() => {
    if (!project || project.status !== 'completed') return null;

    return generateVarianceAnalysis({
      project,
      phases,
      expenses,
    });
  }, [project, phases, expenses]);
}

export default useProjectIntelligence;
