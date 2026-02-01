/**
 * MobileStats Component
 *
 * Mobile-optimized statistics display components.
 * Horizontal scrollable on mobile, grid on desktop.
 */

'use client';

import React from 'react';
import Link from 'next/link';

interface MobileStat {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray';
  href?: string;
  subtitle?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

interface MobileStatsProps {
  stats: MobileStat[];
  /** Show as horizontal scroll on mobile */
  scrollable?: boolean;
  /** Number of columns on desktop (2, 3, 4, or 6) */
  columns?: 2 | 3 | 4 | 6;
  className?: string;
}

const COLOR_CLASSES = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'text-green-600',
  },
  yellow: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: 'text-amber-500',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    icon: 'text-red-500',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'text-purple-600',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    icon: 'text-orange-500',
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: 'text-gray-500',
  },
};

const TREND_CLASSES = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-gray-500',
};

const COLUMN_CLASSES = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
  6: 'md:grid-cols-3 lg:grid-cols-6',
};

function StatCard({ stat }: { stat: MobileStat }) {
  const colors = COLOR_CLASSES[stat.color || 'gray'];
  const Icon = stat.icon;

  const content = (
    <div
      className={`
        bg-white rounded-xl border border-gray-200 p-4
        flex-shrink-0 min-w-[140px] w-[140px] md:w-auto md:min-w-0
        transition-all
        ${stat.href ? 'hover:shadow-md hover:border-gray-300 cursor-pointer active:bg-gray-50' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide line-clamp-2">
          {stat.label}
        </p>
        {Icon && (
          <div className={`p-1.5 rounded-lg flex-shrink-0 ${colors.bg}`}>
            <Icon className={`h-4 w-4 ${colors.icon}`} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">
        {stat.value}
      </p>
      {(stat.subtitle || stat.trend) && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          {stat.subtitle && (
            <span className="text-gray-500">{stat.subtitle}</span>
          )}
          {stat.trend && (
            <span className={TREND_CLASSES[stat.trend.direction]}>
              {stat.trend.direction === 'up' ? '↑' : stat.trend.direction === 'down' ? '↓' : '→'}
              {' '}{stat.trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (stat.href) {
    return <Link href={stat.href} className="block">{content}</Link>;
  }

  return content;
}

export function MobileStats({
  stats,
  scrollable = true,
  columns = 4,
  className = '',
}: MobileStatsProps) {
  if (scrollable) {
    return (
      <div className={className}>
        {/* Mobile: horizontal scroll */}
        <div className="md:hidden -mx-4 px-4">
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {stats.map((stat, index) => (
              <StatCard key={index} stat={stat} />
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className={`hidden md:grid gap-4 ${COLUMN_CLASSES[columns]}`}>
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>
      </div>
    );
  }

  // Non-scrollable: always grid
  return (
    <div className={`grid grid-cols-2 gap-3 ${COLUMN_CLASSES[columns]} ${className}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} stat={stat} />
      ))}
    </div>
  );
}

/**
 * MobileKPI - Single large KPI display
 */
interface MobileKPIProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  color?: MobileStat['color'];
  subtitle?: string;
  trend?: MobileStat['trend'];
  className?: string;
}

export function MobileKPI({
  label,
  value,
  icon: Icon,
  color = 'blue',
  subtitle,
  trend,
  className = '',
}: MobileKPIProps) {
  const colors = COLOR_CLASSES[color];

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        {Icon && (
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className={`h-5 w-5 ${colors.icon}`} />
          </div>
        )}
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          {subtitle && <span className="text-gray-500">{subtitle}</span>}
          {trend && (
            <span className={TREND_CLASSES[trend.direction]}>
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
              {' '}{trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * MobileStatBar - Progress bar style stat
 */
interface MobileStatBarProps {
  label: string;
  value: number;
  max: number;
  valueLabel?: string;
  color?: MobileStat['color'];
  className?: string;
}

export function MobileStatBar({
  label,
  value,
  max,
  valueLabel,
  color = 'blue',
  className = '',
}: MobileStatBarProps) {
  const colors = COLOR_CLASSES[color];
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-sm font-semibold text-gray-900">
          {valueLabel || `${value} / ${max}`}
        </p>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colors.bg.replace('50', '500')}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{Math.round(percentage)}% complete</p>
    </div>
  );
}

export default MobileStats;
