'use client';

import React from 'react';
import { SparklesIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { PriceSuggestion } from '@/lib/intelligence/types';
import { ConfidenceBadge } from './ConfidenceScore';
import { MarketComparisonInline } from './MarketComparison';

interface PriceSuggestionCardProps {
  /** The AI-generated suggestion */
  suggestion: PriceSuggestion;
  /** Unit for display (e.g., "sq ft", "each") */
  unit?: string;
  /** Callback when user accepts the suggestion */
  onAccept?: (price: number) => void;
  /** Callback when user dismisses the suggestion */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode for inline display */
  compact?: boolean;
}

/**
 * PriceSuggestionCard - Displays an AI price suggestion with accept/dismiss actions
 */
export function PriceSuggestionCard({
  suggestion,
  unit = 'unit',
  onAccept,
  onDismiss,
  className,
  compact = false,
}: PriceSuggestionCardProps) {
  const formatPrice = (price: number) => {
    if (price >= 100) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `$${price.toFixed(2)}`;
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200',
          className
        )}
      >
        <SparklesIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm text-blue-700">
            Suggested: <strong>{formatPrice(suggestion.suggestedPrice)}</strong>/{unit}
          </span>
        </div>
        {onAccept && (
          <button
            onClick={() => onAccept(suggestion.suggestedPrice)}
            className="flex-shrink-0 text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Use
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-blue-500" />
          <span className="font-medium text-blue-700">AI Suggested Price</span>
        </div>
        <ConfidenceBadge level={suggestion.confidence} />
      </div>

      {/* Main price */}
      <div className="mb-3">
        <div className="text-2xl font-bold text-blue-900">
          {formatPrice(suggestion.suggestedPrice)}
          <span className="text-lg font-normal text-blue-600">/{unit}</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          Range: {formatPrice(suggestion.priceRange.low)} - {formatPrice(suggestion.priceRange.high)}
        </div>
      </div>

      {/* Market comparison bar */}
      <div className="mb-3">
        <MarketComparisonInline
          low={suggestion.priceRange.low}
          median={suggestion.priceRange.median}
          high={suggestion.priceRange.high}
          current={suggestion.suggestedPrice}
          formatValue={(v) => formatPrice(v)}
        />
      </div>

      {/* Factors */}
      {suggestion.factors.length > 0 && (
        <div className="mb-4 space-y-1">
          {suggestion.factors.map((factor, i) => (
            <div
              key={i}
              className={cn(
                'text-xs flex items-center gap-1',
                factor.impact === 'positive' && 'text-green-600',
                factor.impact === 'negative' && 'text-red-600',
                factor.impact === 'neutral' && 'text-gray-500'
              )}
            >
              <span>•</span>
              <span>{factor.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Data points */}
      <div className="text-xs text-gray-500 mb-4">
        Based on {suggestion.dataPoints} data points
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onAccept && (
          <button
            onClick={() => onAccept(suggestion.suggestedPrice)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-lg font-medium text-sm hover:opacity-90 transition-colors"
          >
            <CheckIcon className="h-4 w-4" />
            Use This Price
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Loading state for price suggestion
 */
export function PriceSuggestionSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 animate-pulse">
        <div className="h-4 w-4 bg-gray-200 rounded" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-5 w-24 bg-gray-200 rounded" />
      </div>
      <div className="h-8 w-24 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-40 bg-gray-200 rounded mb-3" />
      <div className="h-1.5 w-full bg-gray-200 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-9 flex-1 bg-gray-200 rounded" />
        <div className="h-9 w-20 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default PriceSuggestionCard;
