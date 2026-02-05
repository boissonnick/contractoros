'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MarketComparisonProps {
  /** Minimum value in range */
  low: number;
  /** Median/average value */
  median: number;
  /** Maximum value in range */
  high: number;
  /** Current/selected value to highlight */
  current: number;
  /** Label for the visualization */
  label?: string;
  /** Function to format values for display */
  formatValue?: (val: number) => string;
  /** Show detailed labels */
  showLabels?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * MarketComparison - Visual comparison of a value against market range
 *
 * Shows a horizontal bar with:
 * - Low, median, high markers
 * - Current value highlighted
 * - Color coding based on position
 */
export function MarketComparison({
  low,
  median,
  high,
  current,
  label,
  formatValue = (v) => `$${v.toLocaleString()}`,
  showLabels = true,
  className,
  size = 'md',
}: MarketComparisonProps) {
  // Calculate position percentages
  const range = high - low;
  const medianPos = ((median - low) / range) * 100;
  const currentPos = Math.max(0, Math.min(100, ((current - low) / range) * 100));

  // Determine assessment
  const getAssessment = (): { text: string; color: string } => {
    const _diffFromMedian = ((current - median) / median) * 100;

    if (current < low) {
      return { text: 'Below market', color: 'text-blue-600' };
    } else if (current <= median * 0.95) {
      return { text: 'Competitive', color: 'text-green-600' };
    } else if (current <= median * 1.05) {
      return { text: 'At market', color: 'text-gray-600' };
    } else if (current <= high) {
      return { text: 'Above market', color: 'text-yellow-600' };
    } else {
      return { text: 'Premium', color: 'text-red-600' };
    }
  };

  const assessment = getAssessment();

  // Size classes
  const sizeClasses = {
    sm: { bar: 'h-2', text: 'text-xs', marker: 'h-3 w-3', current: 'h-4 w-4' },
    md: { bar: 'h-3', text: 'text-sm', marker: 'h-4 w-4', current: 'h-5 w-5' },
    lg: { bar: 'h-4', text: 'text-base', marker: 'h-5 w-5', current: 'h-6 w-6' },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and assessment */}
      {(label || showLabels) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className={cn('font-medium text-gray-700', sizes.text)}>{label}</span>
          )}
          <span className={cn('font-medium', sizes.text, assessment.color)}>
            {assessment.text}
          </span>
        </div>
      )}

      {/* Bar visualization */}
      <div className="relative">
        {/* Background bar */}
        <div
          className={cn(
            'w-full rounded-full bg-gradient-to-r from-green-100 via-yellow-100 to-red-100',
            sizes.bar
          )}
        />

        {/* Median marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${medianPos}%` }}
        >
          <div
            className={cn(
              'rounded-full bg-gray-400 border-2 border-white shadow',
              sizes.marker
            )}
          />
        </div>

        {/* Current value marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${currentPos}%` }}
        >
          <div
            className={cn(
              'rounded-full bg-blue-500 border-2 border-white shadow-lg ring-2 ring-blue-200',
              sizes.current
            )}
          />
        </div>
      </div>

      {/* Value labels */}
      {showLabels && (
        <div className="flex justify-between items-start">
          <div className="text-left">
            <div className={cn('font-medium text-gray-900', sizes.text)}>
              {formatValue(low)}
            </div>
            <div className="text-xs text-gray-500">Low</div>
          </div>

          <div className="text-center">
            <div className={cn('font-medium text-gray-900', sizes.text)}>
              {formatValue(median)}
            </div>
            <div className="text-xs text-gray-500">Market Avg</div>
          </div>

          <div className="text-right">
            <div className={cn('font-medium text-gray-900', sizes.text)}>
              {formatValue(high)}
            </div>
            <div className="text-xs text-gray-500">High</div>
          </div>
        </div>
      )}

      {/* Current value callout */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <div className="h-3 w-3 rounded-full bg-blue-500" />
        <span className={cn('font-semibold text-blue-700', sizes.text)}>
          Your price: {formatValue(current)}
        </span>
        {current !== median && (
          <span className={cn('text-gray-500', sizes.text)}>
            ({current > median ? '+' : ''}
            {(((current - median) / median) * 100).toFixed(0)}% vs avg)
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact inline version for use in forms
 */
export function MarketComparisonInline({
  low,
  median,
  high,
  current,
  formatValue = (v) => `$${v.toFixed(2)}`,
}: Omit<MarketComparisonProps, 'label' | 'showLabels' | 'className' | 'size'>) {
  const range = high - low;
  const currentPos = Math.max(0, Math.min(100, ((current - low) / range) * 100));

  const getColor = () => {
    if (current < median * 0.95) return 'bg-green-500';
    if (current <= median * 1.05) return 'bg-gray-500';
    if (current <= high) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 relative h-1.5 rounded-full bg-gray-200">
        <div
          className={cn('absolute top-0 left-0 h-full rounded-full', getColor())}
          style={{ width: `${currentPos}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {formatValue(low)} - {formatValue(high)}
      </span>
    </div>
  );
}

export default MarketComparison;
