'use client';

import React from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { MaterialPriceIndex, MaterialType } from '@/lib/intelligence/types';
import { formatPriceChange } from '@/lib/intelligence/material-prices';

interface MaterialPriceWidgetProps {
  /** Material price data */
  prices: MaterialPriceIndex[];
  /** Loading state */
  loading?: boolean;
  /** Click handler for individual materials */
  onMaterialClick?: (material: MaterialType) => void;
  /** Maximum items to show */
  limit?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * MaterialPriceWidget - Dashboard widget showing material price trends
 */
export function MaterialPriceWidget({
  prices,
  loading = false,
  onMaterialClick,
  limit = 6,
  className,
}: MaterialPriceWidgetProps) {
  if (loading) {
    return <MaterialPriceWidgetSkeleton className={className} />;
  }

  // Sort by absolute 30-day change and take top N
  const sortedPrices = [...prices]
    .sort((a, b) => Math.abs(b.percentChange30d) - Math.abs(a.percentChange30d))
    .slice(0, limit);

  return (
    <div className={cn('bg-white rounded-lg border shadow-sm', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Material Prices</h3>
        </div>
        <span className="text-xs text-gray-500">30-day change</span>
      </div>

      {/* Price list */}
      <div className="divide-y">
        {sortedPrices.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No price data available
          </div>
        ) : (
          sortedPrices.map((price) => (
            <MaterialPriceRow
              key={price.material}
              price={price}
              onClick={onMaterialClick ? () => onMaterialClick(price.material) : undefined}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t bg-gray-50 rounded-b-lg">
        <p className="text-xs text-gray-500">
          Data from FRED • Updated{' '}
          {sortedPrices[0]?.timestamp
            ? new Date(sortedPrices[0].timestamp).toLocaleDateString()
            : 'N/A'}
        </p>
      </div>
    </div>
  );
}

/**
 * Individual material price row
 */
function MaterialPriceRow({
  price,
  onClick,
}: {
  price: MaterialPriceIndex;
  onClick?: () => void;
}) {
  const change = formatPriceChange(price.percentChange30d);

  const TrendIcon =
    change.arrow === '↑'
      ? ArrowTrendingUpIcon
      : change.arrow === '↓'
      ? ArrowTrendingDownIcon
      : MinusIcon;

  const colorClasses = {
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    gray: 'text-gray-500 bg-gray-50',
  };

  return (
    <div
      className={cn(
        'px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 truncate">{price.displayName}</p>
        <p className="text-sm text-gray-500">
          ${price.pricePerUnit.toFixed(2)}/{price.unit}
        </p>
      </div>

      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
          colorClasses[change.color]
        )}
      >
        <TrendIcon className="h-4 w-4" />
        <span>{change.text}</span>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for MaterialPriceWidget
 */
function MaterialPriceWidgetSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-lg border shadow-sm animate-pulse', className)}>
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>
      <div className="divide-y">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="h-5 w-28 bg-gray-200 rounded mb-1" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t bg-gray-50 rounded-b-lg">
        <div className="h-3 w-40 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

/**
 * Compact material price alert banner
 */
export function MaterialPriceAlert({
  material: _material,
  displayName,
  change,
  period,
  onDismiss,
  className,
}: {
  material: MaterialType;
  displayName: string;
  change: number;
  period: '7d' | '30d';
  onDismiss?: () => void;
  className?: string;
}) {
  const isUp = change > 0;
  const periodLabel = period === '7d' ? 'this week' : 'this month';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border',
        isUp
          ? 'bg-red-50 border-red-200 text-red-800'
          : 'bg-green-50 border-green-200 text-green-800',
        className
      )}
    >
      {isUp ? (
        <ArrowTrendingUpIcon className="h-5 w-5 flex-shrink-0" />
      ) : (
        <ArrowTrendingDownIcon className="h-5 w-5 flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium">
          {displayName} {isUp ? 'up' : 'down'} {Math.abs(change).toFixed(1)}% {periodLabel}
        </p>
        <p className="text-sm opacity-75">
          {isUp
            ? 'Consider updating pending estimates'
            : 'Good time to lock in pricing'}
        </p>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-current opacity-50 hover:opacity-100"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default MaterialPriceWidget;
