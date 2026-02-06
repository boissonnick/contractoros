'use client';

import { useMemo } from 'react';
import { useSubcontractors } from '@/lib/hooks/useSubcontractors';
import { Subcontractor } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TradeBreakdown {
  trade: string;
  count: number;
  spend: number;
  avgRating: number;
}

export interface SubPerformer {
  sub: Subcontractor;
  score: number;
}

export type RiskType = 'insurance_expiring' | 'low_rating' | 'low_on_time';
export type RiskSeverity = 'high' | 'medium';

export interface SubcontractorRisk {
  subId: string;
  companyName: string;
  trade: string;
  type: RiskType;
  severity: RiskSeverity;
  detail: string;
}

export interface SubcontractorAnalytics {
  // Fleet summary
  totalSubs: number;
  activeSubs: number;
  totalSpend: number;
  avgOnTimeRate: number;
  avgRating: number;
  totalProjectsCompleted: number;

  // Trade breakdown
  tradeDistribution: TradeBreakdown[];

  // Top performers (sorted by weighted score)
  topPerformers: SubPerformer[];

  // Risk items
  risks: SubcontractorRisk[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Weighted performance score:
 *   40% on-time rate (0-100)
 * + 30% normalized rating (avgRating / 5 * 100)
 * + 30% experience factor (min(projectsCompleted / 10 * 100, 100))
 */
function computePerformanceScore(metrics: Subcontractor['metrics']): number {
  const onTimeComponent = metrics.onTimeRate * 0.4;
  const ratingComponent = (metrics.avgRating / 5) * 100 * 0.3;
  const experienceComponent = Math.min((metrics.projectsCompleted / 10) * 100, 100) * 0.3;
  return Math.round((onTimeComponent + ratingComponent + experienceComponent) * 100) / 100;
}

function buildTradeDistribution(subs: Subcontractor[]): TradeBreakdown[] {
  const map = new Map<string, { count: number; spend: number; ratingSum: number; ratingCount: number }>();

  for (const sub of subs) {
    const trade = sub.trade || 'Unknown';
    const entry = map.get(trade) || { count: 0, spend: 0, ratingSum: 0, ratingCount: 0 };
    entry.count += 1;
    entry.spend += sub.metrics.totalPaid;
    if (sub.metrics.avgRating > 0) {
      entry.ratingSum += sub.metrics.avgRating;
      entry.ratingCount += 1;
    }
    map.set(trade, entry);
  }

  return Array.from(map.entries())
    .map(([trade, data]) => ({
      trade,
      count: data.count,
      spend: Math.round(data.spend * 100) / 100,
      avgRating: data.ratingCount > 0
        ? Math.round((data.ratingSum / data.ratingCount) * 10) / 10
        : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildTopPerformers(subs: Subcontractor[]): SubPerformer[] {
  return subs
    .filter((s) => s.isActive)
    .map((sub) => ({ sub, score: computePerformanceScore(sub.metrics) }))
    .sort((a, b) => b.score - a.score);
}

function detectRisks(subs: Subcontractor[]): SubcontractorRisk[] {
  const risks: SubcontractorRisk[] = [];
  const now = Date.now();
  const threshold = now + THIRTY_DAYS_MS;

  for (const sub of subs) {
    if (!sub.isActive) continue;

    // Insurance expiring within 30 days
    if (sub.insuranceExpiry) {
      const expiryTime = sub.insuranceExpiry.getTime();
      if (expiryTime <= threshold) {
        const daysLeft = Math.max(0, Math.ceil((expiryTime - now) / (24 * 60 * 60 * 1000)));
        risks.push({
          subId: sub.id,
          companyName: sub.companyName,
          trade: sub.trade,
          type: 'insurance_expiring',
          severity: 'high',
          detail: daysLeft <= 0
            ? 'Insurance expired'
            : `Insurance expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        });
      }
    }

    // Low rating (below 3.0)
    if (sub.metrics.avgRating > 0 && sub.metrics.avgRating < 3.0) {
      risks.push({
        subId: sub.id,
        companyName: sub.companyName,
        trade: sub.trade,
        type: 'low_rating',
        severity: 'medium',
        detail: `Low rating: ${sub.metrics.avgRating}/5`,
      });
    }

    // Low on-time rate (below 70%)
    if (sub.metrics.onTimeRate > 0 && sub.metrics.onTimeRate < 70) {
      risks.push({
        subId: sub.id,
        companyName: sub.companyName,
        trade: sub.trade,
        type: 'low_on_time',
        severity: 'medium',
        detail: `Low on-time rate: ${sub.metrics.onTimeRate}%`,
      });
    }
  }

  // Sort high severity first, then alphabetically by company
  return risks.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'high' ? -1 : 1;
    return a.companyName.localeCompare(b.companyName);
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook for aggregated subcontractor analytics.
 *
 * Wraps `useSubcontractors` and computes fleet summary, trade distribution,
 * top performers (by weighted score), and risk items (expiring insurance,
 * low ratings, low on-time rates).
 *
 * @returns analytics data, raw subs array, loading, and error state
 *
 * @example
 * const { analytics, loading } = useSubcontractorAnalytics();
 * if (loading || !analytics) return <Spinner />;
 * return <StatsGrid stats={[
 *   { label: 'Active Subs', value: analytics.activeSubs },
 *   { label: 'Total Spend', value: `$${analytics.totalSpend.toLocaleString()}` },
 * ]} />;
 */
export function useSubcontractorAnalytics(): {
  analytics: SubcontractorAnalytics | null;
  subs: Subcontractor[];
  loading: boolean;
  error: string | null;
} {
  const { subs, loading, error } = useSubcontractors();

  const analytics = useMemo<SubcontractorAnalytics | null>(() => {
    if (loading || subs.length === 0) return null;

    const activeSubs = subs.filter((s) => s.isActive);
    const totalSpend = subs.reduce((sum, s) => sum + s.metrics.totalPaid, 0);
    const totalProjectsCompleted = subs.reduce((sum, s) => sum + s.metrics.projectsCompleted, 0);

    // Average on-time rate across subs that have a non-zero value
    const subsWithOnTime = subs.filter((s) => s.metrics.onTimeRate > 0);
    const avgOnTimeRate = subsWithOnTime.length > 0
      ? Math.round(
          (subsWithOnTime.reduce((sum, s) => sum + s.metrics.onTimeRate, 0) /
            subsWithOnTime.length) *
            10
        ) / 10
      : 0;

    // Average rating across subs that have a non-zero rating
    const subsWithRating = subs.filter((s) => s.metrics.avgRating > 0);
    const avgRating = subsWithRating.length > 0
      ? Math.round(
          (subsWithRating.reduce((sum, s) => sum + s.metrics.avgRating, 0) /
            subsWithRating.length) *
            10
        ) / 10
      : 0;

    return {
      totalSubs: subs.length,
      activeSubs: activeSubs.length,
      totalSpend: Math.round(totalSpend * 100) / 100,
      avgOnTimeRate,
      avgRating,
      totalProjectsCompleted,
      tradeDistribution: buildTradeDistribution(subs),
      topPerformers: buildTopPerformers(subs),
      risks: detectRisks(subs),
    };
  }, [subs, loading]);

  return { analytics, subs, loading, error };
}
