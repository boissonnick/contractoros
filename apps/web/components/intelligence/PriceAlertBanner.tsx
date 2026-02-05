'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  BellAlertIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { MaterialType } from '@/lib/intelligence/types';
import { useMaterialAlerts } from '@/lib/hooks/useIntelligence';

interface PriceAlertBannerProps {
  /** Threshold percentage to trigger alerts */
  threshold?: number;
  /** Maximum alerts to show before collapsing */
  maxVisible?: number;
  /** Callback when an alert is dismissed */
  onDismiss?: (material: MaterialType) => void;
  /** Callback when user clicks to view estimates */
  onViewEstimates?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PriceAlertBanner - Displays material price alerts across the dashboard
 */
export function PriceAlertBanner({
  threshold = 5,
  maxVisible = 3,
  onDismiss,
  onViewEstimates,
  className,
}: PriceAlertBannerProps) {
  const { alerts, loading } = useMaterialAlerts(threshold);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<MaterialType>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return null;
  }

  // Filter out dismissed alerts
  const activeAlerts = alerts.filter((a) => !dismissedAlerts.has(a.material));

  if (activeAlerts.length === 0) {
    return null;
  }

  const handleDismiss = (material: MaterialType) => {
    setDismissedAlerts((prev) => new Set(prev).add(material));
    onDismiss?.(material);
  };

  const handleDismissAll = () => {
    const all = new Set(activeAlerts.map((a) => a.material));
    setDismissedAlerts(all);
  };

  const visibleAlerts = isExpanded ? activeAlerts : activeAlerts.slice(0, maxVisible);
  const hasMore = activeAlerts.length > maxVisible;
  const hiddenCount = activeAlerts.length - maxVisible;

  // Count increases and decreases
  const increases = activeAlerts.filter((a) => a.direction === 'up').length;
  const decreases = activeAlerts.filter((a) => a.direction === 'down').length;

  return (
    <div
      className={cn(
        'rounded-lg border',
        increases > decreases
          ? 'bg-amber-50 border-amber-200'
          : 'bg-blue-50 border-blue-200',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              increases > decreases ? 'bg-amber-100' : 'bg-blue-100'
            )}
          >
            <BellAlertIcon
              className={cn(
                'h-5 w-5',
                increases > decreases ? 'text-amber-600' : 'text-blue-600'
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {activeAlerts.length} Material Price Alert{activeAlerts.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-600">
              {increases > 0 && (
                <span className="text-red-600">
                  {increases} price increase{increases !== 1 ? 's' : ''}
                </span>
              )}
              {increases > 0 && decreases > 0 && <span className="text-gray-400"> • </span>}
              {decreases > 0 && (
                <span className="text-green-600">
                  {decreases} price decrease{decreases !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onViewEstimates && (
            <button
              onClick={onViewEstimates}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Review Estimates
            </button>
          )}
          <button
            onClick={handleDismissAll}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg"
            title="Dismiss all"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Alert List */}
      <div className="border-t border-gray-200/50 divide-y divide-gray-200/50">
        {visibleAlerts.map((alert) => (
          <AlertRow
            key={alert.material}
            alert={alert}
            onDismiss={() => handleDismiss(alert.material)}
          />
        ))}
      </div>

      {/* Show More/Less */}
      {hasMore && (
        <div className="px-4 py-2 border-t border-gray-200/50">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                Show {hiddenCount} more alert{hiddenCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

interface AlertRowProps {
  alert: {
    material: MaterialType;
    displayName: string;
    change: number;
    direction: 'up' | 'down';
    period: '7d' | '30d';
  };
  onDismiss: () => void;
}

function AlertRow({ alert, onDismiss }: AlertRowProps) {
  const isUp = alert.direction === 'up';
  const periodLabel = alert.period === '7d' ? 'this week' : 'in 30 days';

  return (
    <div className="px-4 py-2.5 flex items-center justify-between hover:bg-white/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {isUp ? (
          <ArrowTrendingUpIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
        ) : (
          <ArrowTrendingDownIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
        )}
        <span className="text-sm text-gray-900 truncate">{alert.displayName}</span>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={cn(
            'text-sm font-medium',
            isUp ? 'text-red-600' : 'text-green-600'
          )}
        >
          {isUp ? '+' : ''}
          {alert.change.toFixed(1)}% {periodLabel}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          title="Dismiss"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Compact inline price alert for use in forms
 */
export function InlinePriceAlert({
  material: _material,
  displayName,
  change,
  direction,
  className,
}: {
  material: MaterialType;
  displayName: string;
  change: number;
  direction: 'up' | 'down';
  className?: string;
}) {
  const isUp = direction === 'up';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        isUp ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700',
        className
      )}
    >
      {isUp ? (
        <ArrowTrendingUpIcon className="h-3 w-3" />
      ) : (
        <ArrowTrendingDownIcon className="h-3 w-3" />
      )}
      <span>
        {displayName} {isUp ? '+' : ''}
        {change.toFixed(1)}%
      </span>
    </div>
  );
}

export default PriceAlertBanner;
