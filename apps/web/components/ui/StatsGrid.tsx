/**
 * StatsGrid Component
 *
 * Displays a grid of statistic cards with icons, values, and optional trends.
 * Eliminates duplicate stat card patterns across dashboard pages.
 *
 * @example
 * // Basic usage
 * <StatsGrid
 *   stats={[
 *     { label: 'Total Clients', value: 42, icon: UsersIcon },
 *     { label: 'Active Projects', value: 8, icon: FolderIcon },
 *     { label: 'Revenue', value: '$125,000', icon: CurrencyDollarIcon },
 *   ]}
 * />
 *
 * @example
 * // With trends
 * <StatsGrid
 *   stats={[
 *     {
 *       label: 'Revenue',
 *       value: '$125,000',
 *       icon: CurrencyDollarIcon,
 *       change: { value: 12, trend: 'up' },
 *     },
 *     {
 *       label: 'Expenses',
 *       value: '$45,000',
 *       icon: BanknotesIcon,
 *       change: { value: 3, trend: 'down', label: 'from last month' },
 *     },
 *   ]}
 * />
 */

'use client';

import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';
import Card from './Card';

export interface StatItem {
  /**
   * Stat label
   */
  label: string;

  /**
   * Stat value (can be number or formatted string)
   */
  value: string | number;

  /**
   * Optional icon component
   */
  icon?: React.ComponentType<{ className?: string }>;

  /**
   * Optional icon background color class
   */
  iconBg?: string;

  /**
   * Optional icon color class
   */
  iconColor?: string;

  /**
   * Optional change/trend indicator
   */
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
    label?: string; // e.g., "from last month"
  };

  /**
   * Optional description below the value
   */
  description?: string;

  /**
   * Optional click handler
   */
  onClick?: () => void;
}

export interface StatsGridProps {
  /**
   * Array of stat items to display
   */
  stats: StatItem[];

  /**
   * Number of columns (default: auto based on count)
   */
  columns?: 2 | 3 | 4 | 5;

  /**
   * Additional className for the grid container
   */
  className?: string;

  /**
   * Whether stats are loading
   */
  loading?: boolean;
}

export function StatsGrid({
  stats,
  columns,
  className = '',
  loading = false,
}: StatsGridProps) {
  // Auto-determine columns if not specified
  const gridCols = columns || (stats.length <= 2 ? 2 : stats.length <= 3 ? 3 : 4);

  const gridColsClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-5',
  }[gridCols];

  if (loading) {
    return (
      <div className={`grid grid-cols-1 gap-4 ${gridColsClass} ${className}`}>
        {Array.from({ length: stats.length || 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                  <div className="h-6 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridColsClass} ${className}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg = 'bg-brand-primary/10',
  iconColor = 'text-brand-primary',
  change,
  description,
  onClick,
}: StatItem) {
  const content = (
    <Card
      className={`
        transition-shadow
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
      `}
    >
      <div className="p-5">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className={`p-3 rounded-lg ${iconBg}`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-semibold text-gray-900 truncate">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {change && (
                <span
                  className={`inline-flex items-center text-xs font-medium
                    ${change.trend === 'up' ? 'text-green-600' : ''}
                    ${change.trend === 'down' ? 'text-red-600' : ''}
                    ${change.trend === 'neutral' ? 'text-gray-500' : ''}
                  `}
                >
                  {change.trend === 'up' && (
                    <ArrowUpIcon className="h-3 w-3 mr-0.5" />
                  )}
                  {change.trend === 'down' && (
                    <ArrowDownIcon className="h-3 w-3 mr-0.5" />
                  )}
                  {change.value}%
                  {change.label && (
                    <span className="text-gray-500 ml-1">{change.label}</span>
                  )}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-left w-full">
        {content}
      </button>
    );
  }

  return content;
}

export default StatsGrid;
