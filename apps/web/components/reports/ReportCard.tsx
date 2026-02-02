'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface MiniBarProps {
  data: number[];
  color?: string;
  height?: number;
}

function MiniBarChart({ data, color = '#3B82F6', height = 40 }: MiniBarProps) {
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const barWidth = 100 / data.length;

  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((value, index) => {
        const barHeight = max > 0 ? (value / max) * 100 : 0;
        return (
          <div
            key={index}
            className="rounded-t transition-all duration-300"
            style={{
              width: `${barWidth}%`,
              height: `${barHeight}%`,
              backgroundColor: color,
              minHeight: value > 0 ? 2 : 0,
              opacity: 0.7 + (index / data.length) * 0.3,
            }}
          />
        );
      })}
    </div>
  );
}

export interface ReportCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  chartData?: number[];
  chartColor?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray';
  href?: string;
  loading?: boolean;
  className?: string;
}

const iconColorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-50 text-gray-600',
};

const chartColors = {
  blue: '#3B82F6',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
  gray: '#6B7280',
};

export function ReportCard({
  title,
  value,
  subtitle,
  trend,
  chartData,
  chartColor,
  icon: Icon,
  iconColor = 'blue',
  href,
  loading = false,
  className,
}: ReportCardProps) {
  const content = (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 transition-all',
        href && 'hover:shadow-md hover:border-gray-300 cursor-pointer',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg flex-shrink-0', iconColorClasses[iconColor])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-semibold text-gray-900 truncate">{value}</p>

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 truncate">{subtitle}</p>
          )}

          {/* Trend */}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.isPositive ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.value > 0 ? '+' : ''}
                {trend.value.toFixed(1)}%
              </span>
              {trend.label && (
                <span className="text-xs text-gray-500 truncate">{trend.label}</span>
              )}
            </div>
          )}

          {/* Mini Chart */}
          {chartData && chartData.length > 0 && (
            <div className="mt-4">
              <MiniBarChart
                data={chartData}
                color={chartColor || chartColors[iconColor]}
                height={32}
              />
            </div>
          )}

          {/* Link indicator */}
          {href && (
            <div className="mt-3 flex items-center text-sm text-gray-500 group-hover:text-gray-700">
              <span>View details</span>
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </div>
          )}
        </>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}

export default ReportCard;
