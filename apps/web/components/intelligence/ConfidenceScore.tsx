'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid';

interface ConfidenceScoreProps {
  /** Score from 0-100 */
  score: number;
  /** Confidence level category */
  level?: 'high' | 'medium' | 'low' | 'insufficient_data';
  /** Show numerical score */
  showScore?: boolean;
  /** Show label text */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * ConfidenceScore - Visual indicator of AI prediction confidence
 */
export function ConfidenceScore({
  score,
  level,
  showScore = true,
  showLabel = true,
  size = 'md',
  className,
}: ConfidenceScoreProps) {
  // Determine level from score if not provided
  const confidenceLevel = level || getConfidenceLevel(score);

  const config = {
    high: {
      color: 'text-green-600',
      bg: 'bg-green-100',
      fill: 'bg-green-500',
      label: 'High confidence',
      icon: CheckCircleIcon,
    },
    medium: {
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      fill: 'bg-yellow-500',
      label: 'Medium confidence',
      icon: ExclamationTriangleIcon,
    },
    low: {
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      fill: 'bg-orange-500',
      label: 'Low confidence',
      icon: ExclamationTriangleIcon,
    },
    insufficient_data: {
      color: 'text-gray-500',
      bg: 'bg-gray-100',
      fill: 'bg-gray-400',
      label: 'Insufficient data',
      icon: QuestionMarkCircleIcon,
    },
  };

  const conf = config[confidenceLevel];
  const Icon = conf.icon;

  const sizeClasses = {
    sm: { text: 'text-xs', icon: 'h-3 w-3', bar: 'h-1', width: 'w-16' },
    md: { text: 'text-sm', icon: 'h-4 w-4', bar: 'h-1.5', width: 'w-24' },
    lg: { text: 'text-base', icon: 'h-5 w-5', bar: 'h-2', width: 'w-32' },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon className={cn(sizes.icon, conf.color)} />

      {showScore && (
        <div className={cn('flex items-center gap-1', sizes.width)}>
          <div className={cn('flex-1 rounded-full', conf.bg, sizes.bar)}>
            <div
              className={cn('rounded-full', conf.fill, sizes.bar)}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
          <span className={cn('font-medium tabular-nums', conf.color, sizes.text)}>
            {score}%
          </span>
        </div>
      )}

      {showLabel && (
        <span className={cn('font-medium', conf.color, sizes.text)}>
          {conf.label}
        </span>
      )}
    </div>
  );
}

/**
 * Get confidence level from numerical score
 */
function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' | 'insufficient_data' {
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 25) return 'low';
  return 'insufficient_data';
}

/**
 * Circular confidence indicator
 */
export function ConfidenceCircle({
  score,
  size = 'md',
  showLabel = true,
  className,
}: {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}) {
  const level = getConfidenceLevel(score);

  const colors = {
    high: 'text-green-500',
    medium: 'text-yellow-500',
    low: 'text-orange-500',
    insufficient_data: 'text-gray-400',
  };

  const sizes = {
    sm: { container: 'h-12 w-12', text: 'text-sm', stroke: 3, radius: 18 },
    md: { container: 'h-16 w-16', text: 'text-lg', stroke: 4, radius: 24 },
    lg: { container: 'h-24 w-24', text: 'text-2xl', stroke: 5, radius: 36 },
  };

  const s = sizes[size];
  const circumference = 2 * Math.PI * s.radius;
  const progress = (score / 100) * circumference;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className={cn('relative', s.container)}>
        <svg className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={s.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={s.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className={colors[level]}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', colors[level], s.text)}>{score}</span>
        </div>
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium', colors[level])}>
          {level === 'insufficient_data' ? 'Low data' : `${level} conf.`}
        </span>
      )}
    </div>
  );
}

/**
 * Confidence badge (compact)
 */
export function ConfidenceBadge({
  level,
  className,
}: {
  level: 'high' | 'medium' | 'low' | 'insufficient_data';
  className?: string;
}) {
  const config = {
    high: { bg: 'bg-green-100', text: 'text-green-700', label: 'High' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium' },
    low: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Low' },
    insufficient_data: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Limited' },
  };

  const c = config[level];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        c.bg,
        c.text,
        className
      )}
    >
      {c.label} confidence
    </span>
  );
}

export default ConfidenceScore;
