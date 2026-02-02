'use client';

import React from 'react';
import {
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Subtitle or additional context */
  subtext?: string;
  /** Trend indicator */
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    /** For prices: up is bad (red), for metrics: up might be good */
    upIsBad?: boolean;
  };
  /** Confidence level */
  confidence?: 'high' | 'medium' | 'low';
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode */
  compact?: boolean;
}

/**
 * InsightCard - Displays an AI-powered insight with optional trend and confidence indicators
 */
export function InsightCard({
  icon,
  title,
  value,
  subtext,
  trend,
  confidence,
  onClick,
  className,
  compact = false,
}: InsightCardProps) {
  const isClickable = !!onClick;

  // Determine trend color
  const getTrendColor = () => {
    if (!trend || trend.direction === 'neutral') return 'text-gray-500';
    if (trend.upIsBad) {
      return trend.direction === 'up' ? 'text-red-500' : 'text-green-500';
    }
    return trend.direction === 'up' ? 'text-green-500' : 'text-red-500';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'neutral') {
      return <MinusIcon className="h-4 w-4" />;
    }
    return trend.direction === 'up' ? (
      <ArrowTrendingUpIcon className="h-4 w-4" />
    ) : (
      <ArrowTrendingDownIcon className="h-4 w-4" />
    );
  };

  const getConfidenceBadge = () => {
    if (!confidence) return null;

    const colors = {
      high: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-600',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
          colors[confidence]
        )}
      >
        {confidence} confidence
      </span>
    );
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100',
          isClickable && 'cursor-pointer hover:bg-blue-100 transition-colors',
          className
        )}
        onClick={onClick}
      >
        <SparklesIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-700 truncate">{title}</span>
            {trend && (
              <span className={cn('flex items-center gap-0.5 text-xs', getTrendColor())}>
                {getTrendIcon()}
                {trend.value > 0 ? '+' : ''}
                {trend.value.toFixed(1)}%
              </span>
            )}
          </div>
          <span className="text-sm text-blue-900 font-semibold">{value}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-white p-4 shadow-sm',
        isClickable && 'cursor-pointer hover:shadow-md transition-shadow',
        'border-blue-100 bg-gradient-to-br from-white to-blue-50/30',
        className
      )}
      onClick={onClick}
    >
      {/* AI indicator */}
      <div className="absolute top-2 right-2">
        <span className="flex items-center gap-1 text-xs text-blue-500">
          <SparklesIcon className="h-3 w-3" />
          AI Insight
        </span>
      </div>

      {/* Icon and title */}
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 rounded-lg bg-blue-100 p-2 text-blue-600">
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-600">{title}</h4>

          {/* Value and trend */}
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {trend && (
              <span className={cn('flex items-center gap-0.5 text-sm font-medium', getTrendColor())}>
                {getTrendIcon()}
                {trend.value > 0 ? '+' : ''}
                {trend.value.toFixed(1)}%
              </span>
            )}
          </div>

          {/* Subtext */}
          {subtext && (
            <p className="mt-1 text-xs text-gray-500">{subtext}</p>
          )}

          {/* Confidence badge */}
          {confidence && (
            <div className="mt-2">
              {getConfidenceBadge()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * InsightCardSkeleton - Loading state for InsightCard
 */
export function InsightCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 animate-pulse">
        <div className="h-4 w-4 bg-gray-200 rounded" />
        <div className="flex-1">
          <div className="h-3 w-20 bg-gray-200 rounded mb-1" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 bg-gray-200 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default InsightCard;
