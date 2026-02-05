'use client';

import React from 'react';
import {
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface OCRConfidenceAlertProps {
  confidence: number; // 0.0-1.0
  model?: string; // e.g., "claude-haiku"
  processingTimeMs?: number;
  onRetry?: () => void;
  className?: string;
}

function getConfidenceLevel(confidence: number) {
  if (confidence >= 0.9) {
    return {
      label: 'High confidence',
      bgColor: 'bg-green-50 border-green-200',
      textColor: 'text-green-800',
      subtextColor: 'text-green-600',
      icon: CheckCircleIcon,
      iconColor: 'text-green-500',
    };
  }
  if (confidence >= 0.7) {
    return {
      label: 'Good confidence',
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-800',
      subtextColor: 'text-blue-600',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-500',
    };
  }
  if (confidence >= 0.5) {
    return {
      label: 'Medium confidence — please review',
      bgColor: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-800',
      subtextColor: 'text-yellow-600',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-500',
    };
  }
  return {
    label: 'Low confidence — values may be inaccurate',
    bgColor: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-800',
    subtextColor: 'text-orange-600',
    icon: ExclamationTriangleIcon,
    iconColor: 'text-orange-500',
  };
}

export default function OCRConfidenceAlert({
  confidence,
  model,
  processingTimeMs,
  onRetry,
  className,
}: OCRConfidenceAlertProps) {
  const level = getConfidenceLevel(confidence);
  const Icon = level.icon;
  const showRetry = onRetry && confidence < 0.7;
  const confidencePercent = `${(confidence * 100).toFixed(0)}%`;

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg flex items-center gap-3 border',
        level.bgColor,
        className
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', level.iconColor)} />

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', level.textColor)}>
          {level.label} ({confidencePercent})
        </p>
        {(model || processingTimeMs !== undefined) && (
          <p className={cn('text-xs mt-0.5', level.subtextColor)}>
            {model && <span>Scanned by {model}</span>}
            {model && processingTimeMs !== undefined && <span> &middot; </span>}
            {processingTimeMs !== undefined && (
              <span>Processed in {(processingTimeMs / 1000).toFixed(1)}s</span>
            )}
          </p>
        )}
      </div>

      {showRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={<ArrowPathIcon className="h-4 w-4" />}
        >
          Retry
        </Button>
      )}
    </div>
  );
}
