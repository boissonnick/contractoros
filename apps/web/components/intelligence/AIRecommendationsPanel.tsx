'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  CheckCircleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useCompanyStats, type CompanyStats } from '@/lib/hooks/useCompanyStats';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecommendationCategory = 'revenue' | 'collections' | 'profitability' | 'operations' | 'risk';
type RecommendationPriority = 'high' | 'medium' | 'low';

interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  impact: string;
  action: string;
}

interface AIRecommendationsPanelProps {
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<RecommendationCategory, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  revenue: ArrowTrendingUpIcon,
  collections: BanknotesIcon,
  profitability: ChartBarIcon,
  operations: CogIcon,
  risk: ExclamationTriangleIcon,
};

const CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  revenue: 'Revenue',
  collections: 'Collections',
  profitability: 'Profitability',
  operations: 'Operations',
  risk: 'Risk',
};

const CATEGORY_COLORS: Record<RecommendationCategory, { bg: string; iconBg: string; iconColor: string }> = {
  revenue: { bg: 'border-blue-100', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  collections: { bg: 'border-amber-100', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  profitability: { bg: 'border-purple-100', iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  operations: { bg: 'border-gray-100', iconBg: 'bg-gray-50', iconColor: 'text-gray-600' },
  risk: { bg: 'border-red-100', iconBg: 'bg-red-50', iconColor: 'text-red-600' },
};

const PRIORITY_BADGE: Record<RecommendationPriority, { variant: 'danger' | 'warning' | 'success'; label: string }> = {
  high: { variant: 'danger', label: 'High' },
  medium: { variant: 'warning', label: 'Medium' },
  low: { variant: 'success', label: 'Low' },
};

const ALL_CATEGORIES: Array<RecommendationCategory | 'all'> = [
  'all',
  'revenue',
  'collections',
  'profitability',
  'operations',
  'risk',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

// ---------------------------------------------------------------------------
// Recommendation engine — pure logic, no API calls
// ---------------------------------------------------------------------------

function generateRecommendations(stats: CompanyStats): Recommendation[] {
  const recs: Recommendation[] = [];

  // ---- Collections ----

  // Rule 1: high priority if arAging.over90 > 0
  if (stats.arAging.over90 > 0) {
    recs.push({
      id: 'collections-aged-ar',
      category: 'collections',
      priority: 'high',
      title: 'Aged Receivables Need Attention',
      description: `AR aging breakdown: ${fmt(stats.arAging.current)} current, ${fmt(stats.arAging.days31to60)} at 31-60 days, ${fmt(stats.arAging.days61to90)} at 61-90 days, and ${fmt(stats.arAging.over90)} over 90 days.`,
      impact: `Could recover ${fmt(stats.arAging.over90 + stats.arAging.days61to90)}`,
      action: 'Review aged invoices and escalate collection efforts',
    });
  }

  // Rule 2: medium if days31to60 > 0 and no over90
  if (stats.arAging.days31to60 > 0 && stats.arAging.over90 === 0) {
    recs.push({
      id: 'collections-follow-up',
      category: 'collections',
      priority: 'medium',
      title: 'Follow Up on Aging Invoices',
      description: `You have ${fmt(stats.arAging.days31to60)} in invoices aging 31-60 days. Acting now prevents them from aging further.`,
      impact: `Could recover ${fmt(stats.arAging.days31to60)}`,
      action: 'Send friendly payment reminders',
    });
  }

  // ---- Revenue ----

  // Rule 3: high if revenue declining > 10%
  if (stats.revenueChangePercent < -10) {
    recs.push({
      id: 'revenue-declining',
      category: 'revenue',
      priority: 'high',
      title: 'Revenue Declining Month-over-Month',
      description: `Revenue dropped ${Math.abs(stats.revenueChangePercent).toFixed(1)}% compared to last month (${fmt(stats.revenueMTD)} vs ${fmt(stats.revenuePrevMonth)}).`,
      impact: `Revenue down ${Math.abs(stats.revenueChangePercent).toFixed(1)}% vs last month`,
      action: 'Review pipeline and increase estimate activity',
    });
  }

  // Rule 4: medium if pipeline < 3x monthly revenue
  if (stats.pipelineValue < stats.revenueMTD * 3) {
    recs.push({
      id: 'revenue-pipeline',
      category: 'revenue',
      priority: 'medium',
      title: 'Pipeline Needs Attention',
      description: `Pipeline value is less than 3x monthly revenue. Current pipeline at ${fmt(stats.pipelineValue)} vs ${fmt(stats.revenueMTD * 3)} target.`,
      impact: `Current pipeline: ${fmt(stats.pipelineValue)}`,
      action: 'Increase lead generation and estimate submissions',
    });
  }

  // ---- Profitability ----

  // Rule 5: high if avgMargin < 15%
  if (stats.avgMargin < 15) {
    recs.push({
      id: 'profitability-low-margins',
      category: 'profitability',
      priority: 'high',
      title: 'Margins Below Industry Average',
      description: `Average margin is ${stats.avgMargin.toFixed(1)}%, below the 15% industry benchmark. This affects long-term sustainability.`,
      impact: `Margins at ${stats.avgMargin.toFixed(1)}% — target is 15%+`,
      action: 'Review project costs and adjust pricing on new estimates',
    });
  }

  // Rule 6: low (positive) if avgMargin >= 25%
  if (stats.avgMargin >= 25) {
    recs.push({
      id: 'profitability-strong',
      category: 'profitability',
      priority: 'low',
      title: 'Strong Margin Performance',
      description: `Maintaining ${stats.avgMargin.toFixed(1)}% margins — well above industry average. Keep up the disciplined pricing and cost controls.`,
      impact: `${stats.avgMargin.toFixed(1)}% avg margin — exceeding benchmarks`,
      action: 'Maintain current pricing strategy',
    });
  }

  // ---- Operations ----

  // Rule 7: medium if activeProjectCount > 5
  if (stats.activeProjectCount > 5) {
    recs.push({
      id: 'operations-high-volume',
      category: 'operations',
      priority: 'medium',
      title: 'High Project Volume',
      description: `Managing ${stats.activeProjectCount} active projects simultaneously. Consider reviewing resource allocation to prevent bottlenecks.`,
      impact: `${stats.activeProjectCount} active projects in parallel`,
      action: 'Review team capacity and project timelines',
    });
  }

  // ---- Risk ----

  // Rule 8: high if significant AR over 60 days (proxy for default risk without topOutstandingInvoices)
  const over60Total = stats.arAging.days61to90 + stats.arAging.over90;
  if (over60Total > 0) {
    recs.push({
      id: 'risk-invoice-default',
      category: 'risk',
      priority: 'high',
      title: 'Invoice Default Risk',
      description: `${fmt(over60Total)} in receivables aged over 60 days. ${fmt(stats.arAging.days61to90)} at 61-90 days and ${fmt(stats.arAging.over90)} over 90 days — these have elevated default risk.`,
      impact: `${fmt(over60Total)} at risk of non-collection`,
      action: 'Escalate to direct outreach or collections',
    });
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIRecommendationsPanel({ className }: AIRecommendationsPanelProps) {
  const { stats, loading, error } = useCompanyStats();
  const [activeCategory, setActiveCategory] = useState<RecommendationCategory | 'all'>('all');

  const recommendations = useMemo(() => {
    if (!stats) return [];
    return generateRecommendations(stats);
  }, [stats]);

  const filteredRecs = useMemo(() => {
    if (activeCategory === 'all') return recommendations;
    return recommendations.filter((r) => r.category === activeCategory);
  }, [recommendations, activeCategory]);

  const highPriorityCount = useMemo(
    () => recommendations.filter((r) => r.priority === 'high').length,
    [recommendations],
  );

  // ---- Loading ----
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Skeleton summary bar */}
        <Card className="p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        </Card>
        {/* Skeleton tabs */}
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>
        {/* Skeleton recommendation cards */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <Card className={cn('p-5', className)}>
        <p className="text-sm text-red-600">
          Unable to load recommendations: {error}
        </p>
      </Card>
    );
  }

  // ---- No stats ----
  if (!stats) {
    return (
      <Card className={cn('p-5 text-center py-12', className)}>
        <SparklesIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">
          No data available to generate recommendations
        </p>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* ---- Summary Bar ---- */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-semibold text-gray-900">
              {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
            </span>
            {highPriorityCount > 0 && (
              <Badge variant="danger" size="sm">
                {highPriorityCount} high priority
              </Badge>
            )}
          </div>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <SparklesIcon className="h-3 w-3" />
            AI-powered analysis
          </span>
        </div>
      </Card>

      {/* ---- Category Filter Tabs ---- */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <FunnelIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mr-1" />
        {ALL_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          const count =
            cat === 'all'
              ? recommendations.length
              : recommendations.filter((r) => r.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold',
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---- Recommendation Cards ---- */}
      {filteredRecs.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircleIcon className="h-10 w-10 mx-auto text-green-400 mb-3" />
          <p className="text-sm font-medium text-gray-900 mb-1">All Clear!</p>
          <p className="text-xs text-gray-500">
            {activeCategory === 'all'
              ? 'No actionable recommendations right now. Your business metrics look healthy.'
              : `No ${CATEGORY_LABELS[activeCategory as RecommendationCategory].toLowerCase()} recommendations at this time.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecs.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecommendationCard sub-component
// ---------------------------------------------------------------------------

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const { category, priority, title, description, impact, action } = recommendation;
  const Icon = CATEGORY_ICONS[category];
  const colors = CATEGORY_COLORS[category];
  const priorityBadge = PRIORITY_BADGE[priority];

  return (
    <Card className={cn('p-4 border', colors.bg)}>
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div className={cn('rounded-lg p-2.5 flex-shrink-0', colors.iconBg)}>
          <Icon className={cn('h-5 w-5', colors.iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row: title + priority badge */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            <Badge variant={priorityBadge.variant} size="sm" dot className="flex-shrink-0">
              {priorityBadge.label}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-500 leading-relaxed mb-2">{description}</p>

          {/* Impact callout */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 mb-3">
            <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
            <span className="text-xs font-medium text-blue-700">{impact}</span>
          </div>

          {/* Action */}
          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg px-3 py-1.5 cursor-pointer">
              {action}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton export for external use
// ---------------------------------------------------------------------------

export function AIRecommendationsPanelSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
      </Card>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-gray-100 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
