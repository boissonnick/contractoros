'use client';

import React from 'react';
import Link from 'next/link';
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export type BudgetSeverity = 'success' | 'warning' | 'danger';

export interface BudgetAlert {
  id: string;
  projectId: string;
  projectName: string;
  budgetAmount: number;
  actualAmount: number;
  percentUsed: number;
  severity: BudgetSeverity;
  message?: string;
  createdAt: Date;
}

interface BudgetAlertCardProps {
  alert: BudgetAlert;
  onDismiss?: (alertId: string) => void;
  onViewProject?: (projectId: string) => void;
}

const SEVERITY_CONFIG: Record<BudgetSeverity, {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  progressColor: string;
}> = {
  success: {
    icon: CheckCircleIcon,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    progressColor: 'bg-green-500',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    progressColor: 'bg-amber-500',
  },
  danger: {
    icon: ExclamationCircleIcon,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    progressColor: 'bg-red-500',
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BudgetAlertCard({
  alert,
  onDismiss,
  onViewProject,
}: BudgetAlertCardProps) {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;
  const progressPercent = Math.min(alert.percentUsed, 100);

  return (
    <div className={`border rounded-lg p-4 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start gap-3">
        {/* Severity icon */}
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                {alert.projectName}
              </h4>
              <p className="text-xs text-gray-600 mt-0.5">
                {alert.message || `Budget ${alert.percentUsed >= 100 ? 'exceeded' : 'usage alert'}`}
              </p>
            </div>

            {/* Dismiss button */}
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Budget numbers */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-600">
              Actual: <span className="font-medium text-gray-900">{formatCurrency(alert.actualAmount)}</span>
            </span>
            <span className="text-gray-600">
              Budget: <span className="font-medium text-gray-900">{formatCurrency(alert.budgetAmount)}</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full ${config.progressColor} transition-all duration-300`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className={`font-medium ${alert.percentUsed >= 100 ? 'text-red-600' : 'text-gray-600'}`}>
                {alert.percentUsed.toFixed(0)}% used
              </span>
              {alert.percentUsed > 100 && (
                <span className="text-red-600 font-medium">
                  {formatCurrency(alert.actualAmount - alert.budgetAmount)} over
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            <Link
              href={`/dashboard/projects/${alert.projectId}`}
              onClick={() => onViewProject?.(alert.projectId)}
              className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
            >
              View Project
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetAlertCard;
