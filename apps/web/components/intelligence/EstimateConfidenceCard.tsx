'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { ConfidenceCircle, ConfidenceScore } from './ConfidenceScore';
import { MarketComparison } from './MarketComparison';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

export interface EstimateConfidenceData {
  /** Overall confidence score 0-100 */
  overallScore: number;
  /** Number of line items with pricing data */
  itemsWithData: number;
  /** Total number of line items */
  totalItems: number;
  /** Market comparison data */
  marketComparison?: {
    low: number;
    median: number;
    high: number;
    estimateTotal: number;
  };
  /** Material price alerts */
  priceAlerts?: PriceAlert[];
  /** Data quality factors */
  factors?: ConfidenceFactor[];
  /** Sample size used for benchmarks */
  sampleSize?: number;
}

interface PriceAlert {
  material: string;
  changePercent: number;
  direction: 'up' | 'down';
  lastUpdated: Date;
}

interface ConfidenceFactor {
  label: string;
  status: 'positive' | 'warning' | 'negative';
  description?: string;
}

interface EstimateConfidenceCardProps {
  data: EstimateConfidenceData;
  onViewDetails?: () => void;
  className?: string;
}

/**
 * EstimateConfidenceCard - Displays AI confidence analysis for an estimate
 */
export function EstimateConfidenceCard({
  data,
  onViewDetails,
  className,
}: EstimateConfidenceCardProps) {
  const {
    overallScore,
    itemsWithData,
    totalItems,
    marketComparison,
    priceAlerts,
    factors,
    sampleSize,
  } = data;

  const coverage = totalItems > 0 ? Math.round((itemsWithData / totalItems) * 100) : 0;

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start gap-4">
        {/* Confidence Circle */}
        <ConfidenceCircle score={overallScore} size="lg" showLabel={false} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Estimate Intelligence</h3>
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View Details
              </button>
            )}
          </div>

          {/* Confidence Level */}
          <div className="mt-1">
            <ConfidenceScore score={overallScore} size="sm" showScore={false} />
          </div>

          {/* Coverage */}
          <p className="text-xs text-gray-500 mt-1">
            {itemsWithData} of {totalItems} line items have market data ({coverage}% coverage)
            {sampleSize && <span className="ml-1">• {sampleSize} comparables</span>}
          </p>
        </div>
      </div>

      {/* Market Comparison */}
      {marketComparison && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-700 mb-2">Compared to Market</p>
          <MarketComparison
            low={marketComparison.low}
            median={marketComparison.median}
            high={marketComparison.high}
            current={marketComparison.estimateTotal}
            formatValue={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
        </div>
      )}

      {/* Confidence Factors */}
      {factors && factors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-700 mb-2">Data Quality Factors</p>
          <div className="space-y-1.5">
            {factors.map((factor, idx) => (
              <FactorRow key={idx} factor={factor} />
            ))}
          </div>
        </div>
      )}

      {/* Price Alerts */}
      {priceAlerts && priceAlerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-medium text-amber-700">Material Price Alerts</p>
          </div>
          <div className="space-y-1">
            {priceAlerts.slice(0, 3).map((alert, idx) => (
              <PriceAlertRow key={idx} alert={alert} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function FactorRow({ factor }: { factor: ConfidenceFactor }) {
  const icons = {
    positive: <CheckCircleIcon className="h-3.5 w-3.5 text-green-500" />,
    warning: <ExclamationTriangleIcon className="h-3.5 w-3.5 text-yellow-500" />,
    negative: <ExclamationTriangleIcon className="h-3.5 w-3.5 text-red-500" />,
  };

  const colors = {
    positive: 'text-green-700',
    warning: 'text-yellow-700',
    negative: 'text-red-700',
  };

  return (
    <div className="flex items-center gap-2">
      {icons[factor.status]}
      <span className={cn('text-xs', colors[factor.status])}>{factor.label}</span>
      {factor.description && (
        <span className="text-xs text-gray-400">- {factor.description}</span>
      )}
    </div>
  );
}

function PriceAlertRow({ alert }: { alert: PriceAlert }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {alert.direction === 'up' ? (
        <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-red-500" />
      ) : (
        <ArrowTrendingDownIcon className="h-3.5 w-3.5 text-green-500" />
      )}
      <span className="text-gray-700">{alert.material}</span>
      <span
        className={cn(
          'font-medium',
          alert.direction === 'up' ? 'text-red-600' : 'text-green-600'
        )}
      >
        {alert.direction === 'up' ? '+' : ''}
        {alert.changePercent.toFixed(1)}%
      </span>
      <span className="text-gray-400">in 30 days</span>
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function EstimateConfidenceBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const level =
    score >= 70 ? 'high' : score >= 50 ? 'medium' : score >= 25 ? 'low' : 'insufficient';

  const config = {
    high: { bg: 'bg-green-100', text: 'text-green-700', label: 'High confidence' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium confidence' },
    low: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Low confidence' },
    insufficient: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Limited data' },
  };

  const c = config[level];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        c.bg,
        c.text,
        className
      )}
    >
      <ChartBarIcon className="h-3.5 w-3.5" />
      {score}% - {c.label}
    </span>
  );
}

export default EstimateConfidenceCard;
