'use client';

import React from 'react';
import { WeatherRiskLevel, WEATHER_RISK_LEVELS } from '@/types';
import { cn } from '@/lib/utils';

interface WeatherRiskBadgeProps {
  level: WeatherRiskLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Badge displaying weather risk level with appropriate color
 */
export function WeatherRiskBadge({
  level,
  showLabel = true,
  size = 'md',
  className,
}: WeatherRiskBadgeProps) {
  const riskConfig = WEATHER_RISK_LEVELS.find(r => r.value === level) || WEATHER_RISK_LEVELS[0];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const colorClasses: Record<WeatherRiskLevel, string> = {
    none: 'bg-emerald-100 text-emerald-800',
    low: 'bg-green-100 text-green-800',
    moderate: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
    severe: 'bg-orange-900 text-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeClasses[size],
        colorClasses[level],
        className
      )}
    >
      <span
        className={cn(
          'rounded-full',
          size === 'sm' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-2 w-2' : 'h-2.5 w-2.5'
        )}
        style={{ backgroundColor: riskConfig.color }}
      />
      {showLabel && <span>{riskConfig.label}</span>}
    </span>
  );
}
