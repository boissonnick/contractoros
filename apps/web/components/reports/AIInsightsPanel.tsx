"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import type {
  AIInsight,
  AIInsightSeverity,
  AIInsightCategory,
  InsightSummary,
  TrendDirection,
} from '@/types';

// ===========================================
// CONSTANTS & HELPERS
// ===========================================

const SEVERITY_CONFIG: Record<AIInsightSeverity, {
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  label: string;
}> = {
  critical: {
    icon: ExclamationCircleIcon,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-500',
    label: 'Critical',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-800',
    iconColor: 'text-amber-500',
    label: 'Warning',
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500',
    label: 'Info',
  },
};

const TREND_CONFIG: Record<TrendDirection, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
}> = {
  improving: {
    icon: ArrowTrendingUpIcon,
    color: 'text-green-500',
    label: 'Improving',
  },
  declining: {
    icon: ArrowTrendingDownIcon,
    color: 'text-red-500',
    label: 'Declining',
  },
  stable: {
    icon: MinusIcon,
    color: 'text-gray-500',
    label: 'Stable',
  },
  volatile: {
    icon: ChartBarIcon,
    color: 'text-orange-500',
    label: 'Volatile',
  },
};

const CATEGORY_LABELS: Record<AIInsightCategory, string> = {
  financial: 'Financial',
  operational: 'Operational',
  project_health: 'Project Health',
  productivity: 'Productivity',
  risk: 'Risk',
  opportunity: 'Opportunity',
};

const OUTLOOK_CONFIG: Record<InsightSummary['outlook'], {
  color: string;
  label: string;
}> = {
  positive: { color: 'text-green-600', label: 'Positive' },
  neutral: { color: 'text-gray-600', label: 'Neutral' },
  concerning: { color: 'text-red-600', label: 'Needs Attention' },
};

// ===========================================
// SUB-COMPONENTS
// ===========================================

interface InsightCardProps {
  insight: AIInsight;
  onExplain?: (insight: AIInsight) => void;
  onAction?: (insight: AIInsight) => void;
  compact?: boolean;
}

function InsightCard({ insight, onExplain, onAction, compact = false }: InsightCardProps) {
  const config = SEVERITY_CONFIG[insight.severity];
  const Icon = config.icon;
  const TrendIcon = insight.trend ? TREND_CONFIG[insight.trend].icon : null;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all hover:shadow-sm',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn('font-medium text-sm', config.textColor)}>
              {insight.title}
            </h4>
            {insight.trend && TrendIcon && (
              <span className={cn('flex items-center gap-1 text-xs', TREND_CONFIG[insight.trend].color)}>
                <TrendIcon className="h-4 w-4" />
                {TREND_CONFIG[insight.trend].label}
              </span>
            )}
          </div>

          {!compact && (
            <p className="mt-1 text-sm text-gray-600">
              {insight.description}
            </p>
          )}

          {/* Metric details */}
          {insight.value !== undefined && (
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              {insight.metric && (
                <span className="font-medium">{insight.metric}:</span>
              )}
              <span>
                {typeof insight.value === 'number'
                  ? insight.value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                  : insight.value}
              </span>
              {insight.expectedValue !== undefined && (
                <span className="text-gray-400">
                  (expected: {insight.expectedValue.toLocaleString(undefined, { maximumFractionDigits: 1 })})
                </span>
              )}
              {insight.deviation !== undefined && insight.deviation !== 0 && (
                <span className={cn(
                  'font-medium',
                  insight.deviation > 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {insight.deviation > 0 ? '+' : ''}{insight.deviation.toFixed(1)}%
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            {insight.action && onAction && (
              <button
                onClick={() => onAction(insight)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md',
                  'bg-white border border-gray-200 text-gray-700',
                  'hover:bg-gray-50 hover:text-gray-900 transition-colors'
                )}
              >
                {insight.action.label}
                <ArrowRightIcon className="h-3 w-3" />
              </button>
            )}
            {onExplain && (
              <button
                onClick={() => onExplain(insight)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <QuestionMarkCircleIcon className="h-4 w-4" />
                Explain
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  summary: InsightSummary;
}

function SummaryCard({ summary }: SummaryCardProps) {
  const outlookConfig = OUTLOOK_CONFIG[summary.outlook];

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <SparklesIcon className="h-5 w-5 text-indigo-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">AI Summary</h4>
            <span className={cn('text-xs font-medium', outlookConfig.color)}>
              {outlookConfig.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-700">{summary.headline}</p>

          {summary.keyPoints.length > 0 && (
            <ul className="mt-2 space-y-1">
              {summary.keyPoints.map((point, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-indigo-400 mt-0.5">-</span>
                  {point}
                </li>
              ))}
            </ul>
          )}

          {summary.recommendations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-indigo-100">
              <span className="text-xs font-medium text-gray-500">Recommendations:</span>
              <ul className="mt-1 space-y-1">
                {summary.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-indigo-700 flex items-start gap-1.5">
                    <LightBulbIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2 text-xs text-gray-400">
            Confidence: {(summary.confidence * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}

interface ExplainModalProps {
  insight: AIInsight;
  explanation: string;
  onClose: () => void;
}

function ExplainModal({ insight, explanation, onClose }: ExplainModalProps) {
  const config = SEVERITY_CONFIG[insight.severity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Understanding This Insight</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className={cn('p-3 rounded-lg', config.bgColor, config.borderColor, 'border')}>
            <h4 className={cn('font-medium text-sm', config.textColor)}>{insight.title}</h4>
            <p className="mt-1 text-sm text-gray-600">{insight.description}</p>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">What does this mean?</h5>
            <p className="text-sm text-gray-600">{explanation}</p>
          </div>

          {insight.metric && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Metric Details</h5>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-gray-500">Metric:</dt>
                <dd className="text-gray-900">{insight.metric}</dd>
                {insight.value !== undefined && (
                  <>
                    <dt className="text-gray-500">Current Value:</dt>
                    <dd className="text-gray-900">{insight.value.toLocaleString()}</dd>
                  </>
                )}
                {insight.expectedValue !== undefined && (
                  <>
                    <dt className="text-gray-500">Expected Value:</dt>
                    <dd className="text-gray-900">{insight.expectedValue.toLocaleString()}</dd>
                  </>
                )}
                <dt className="text-gray-500">Detection Method:</dt>
                <dd className="text-gray-900 capitalize">{insight.source.replace('_', ' ')}</dd>
                <dt className="text-gray-500">Confidence:</dt>
                <dd className="text-gray-900">{(insight.confidence * 100).toFixed(0)}%</dd>
              </dl>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          {insight.action && (
            <button
              onClick={() => {
                if (insight.action?.url) {
                  window.location.href = insight.action.url;
                }
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              {insight.action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export interface AIInsightsPanelProps {
  /** List of insights to display */
  insights: AIInsight[];
  /** Optional summary for the insights */
  summary?: InsightSummary;
  /** Title for the panel */
  title?: string;
  /** Whether the panel is collapsed by default */
  defaultCollapsed?: boolean;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Filter by category */
  category?: AIInsightCategory;
  /** Filter by minimum severity */
  minSeverity?: AIInsightSeverity;
  /** Maximum number of insights to show (before "Show more") */
  maxVisible?: number;
  /** Callback when an action button is clicked */
  onAction?: (insight: AIInsight) => void;
  /** Callback to get explanation for an insight */
  getExplanation?: (insight: AIInsight) => string;
  /** Whether to show the panel even if there are no insights */
  showEmpty?: boolean;
  /** Custom className */
  className?: string;
  /** Loading state */
  loading?: boolean;
}

export default function AIInsightsPanel({
  insights,
  summary,
  title = 'AI Insights',
  defaultCollapsed = false,
  compact = false,
  category,
  minSeverity,
  maxVisible = 5,
  onAction,
  getExplanation,
  showEmpty = false,
  className,
  loading = false,
}: AIInsightsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showAll, setShowAll] = useState(false);
  const [explainInsight, setExplainInsight] = useState<AIInsight | null>(null);

  // Filter insights
  const filteredInsights = useMemo(() => {
    let result = [...insights];

    if (category) {
      result = result.filter(i => i.category === category);
    }

    if (minSeverity) {
      const severityOrder: AIInsightSeverity[] = ['info', 'warning', 'critical'];
      const minIndex = severityOrder.indexOf(minSeverity);
      result = result.filter(i => severityOrder.indexOf(i.severity) >= minIndex);
    }

    return result;
  }, [insights, category, minSeverity]);

  // Visible insights (respecting maxVisible)
  const visibleInsights = showAll
    ? filteredInsights
    : filteredInsights.slice(0, maxVisible);

  const hasMore = filteredInsights.length > maxVisible;

  // Counts by severity
  const counts = useMemo(() => ({
    critical: filteredInsights.filter(i => i.severity === 'critical').length,
    warning: filteredInsights.filter(i => i.severity === 'warning').length,
    info: filteredInsights.filter(i => i.severity === 'info').length,
  }), [filteredInsights]);

  // Don't render if no insights and showEmpty is false
  if (!showEmpty && filteredInsights.length === 0 && !loading) {
    return null;
  }

  // Default explanation function
  const defaultGetExplanation = (insight: AIInsight): string => {
    let explanation = `This ${insight.type} insight was detected in your ${CATEGORY_LABELS[insight.category].toLowerCase()} data.`;

    if (insight.value !== undefined && insight.expectedValue !== undefined) {
      const diff = insight.value - insight.expectedValue;
      explanation += ` The current value of ${insight.value.toLocaleString()} is ${diff >= 0 ? 'above' : 'below'} the expected ${insight.expectedValue.toLocaleString()}.`;
    }

    if (insight.trend) {
      explanation += ` The trend is ${TREND_CONFIG[insight.trend].label.toLowerCase()}.`;
    }

    return explanation;
  };

  const handleExplain = (insight: AIInsight) => {
    setExplainInsight(insight);
  };

  const handleAction = (insight: AIInsight) => {
    if (onAction) {
      onAction(insight);
    } else if (insight.action?.url) {
      window.location.href = insight.action.url;
    }
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 shadow-sm', className)}>
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <SparklesIcon className="h-5 w-5 text-indigo-500" />
          <span className="font-medium text-gray-900">{title}</span>

          {/* Severity badges */}
          {!isCollapsed && filteredInsights.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2">
              {counts.critical > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                  {counts.critical}
                </span>
              )}
              {counts.warning > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                  {counts.warning}
                </span>
              )}
              {counts.info > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                  {counts.info}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {filteredInsights.length} {filteredInsights.length === 1 ? 'insight' : 'insights'}
          </span>
          {isCollapsed ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-4">
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <span className="ml-3 text-sm text-gray-500">Analyzing data...</span>
            </div>
          )}

          {/* Summary */}
          {!loading && summary && (
            <SummaryCard summary={summary} />
          )}

          {/* Empty state */}
          {!loading && filteredInsights.length === 0 && (
            <div className="text-center py-8">
              <InformationCircleIcon className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="mt-2 text-sm text-gray-500">
                No insights to display. Your data looks healthy!
              </p>
            </div>
          )}

          {/* Insights list */}
          {!loading && visibleInsights.length > 0 && (
            <div className="space-y-3">
              {visibleInsights.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  compact={compact}
                  onExplain={handleExplain}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}

          {/* Show more button */}
          {!loading && hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              {showAll
                ? 'Show less'
                : `Show ${filteredInsights.length - maxVisible} more insights`}
            </button>
          )}
        </div>
      )}

      {/* Explain Modal */}
      {explainInsight && (
        <ExplainModal
          insight={explainInsight}
          explanation={(getExplanation || defaultGetExplanation)(explainInsight)}
          onClose={() => setExplainInsight(null)}
        />
      )}
    </div>
  );
}

// ===========================================
// EXPORTS
// ===========================================

export { InsightCard, SummaryCard, ExplainModal };
