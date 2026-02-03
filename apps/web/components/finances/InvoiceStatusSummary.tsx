'use client';

import React from 'react';
import {
  DocumentTextIcon,
  PaperAirplaneIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { cn, formatCurrency } from '@/lib/utils';

interface StatusData {
  count: number;
  total: number;
}

export interface InvoiceStats {
  draft: StatusData;
  sent: StatusData;
  viewed: StatusData;
  paid: StatusData;
  overdue: StatusData;
}

export interface InvoiceStatusSummaryProps {
  stats: InvoiceStats;
  onStatusClick?: (status: keyof InvoiceStats) => void;
  className?: string;
}

// Status configuration
const STATUS_CONFIG: Record<
  keyof InvoiceStats,
  {
    label: string;
    color: string;
    bgColor: string;
    barColor: string;
    hoverColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    barColor: 'bg-gray-400',
    hoverColor: 'hover:bg-gray-200',
    icon: DocumentTextIcon,
  },
  sent: {
    label: 'Sent',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    barColor: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-200',
    icon: PaperAirplaneIcon,
  },
  viewed: {
    label: 'Viewed',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    barColor: 'bg-indigo-500',
    hoverColor: 'hover:bg-indigo-200',
    icon: EyeIcon,
  },
  paid: {
    label: 'Paid',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    barColor: 'bg-green-500',
    hoverColor: 'hover:bg-green-200',
    icon: CheckCircleIcon,
  },
  overdue: {
    label: 'Overdue',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    barColor: 'bg-red-500',
    hoverColor: 'hover:bg-red-200',
    icon: ExclamationTriangleIcon,
  },
};

// Order for display and bar chart
const STATUS_ORDER: (keyof InvoiceStats)[] = ['draft', 'sent', 'viewed', 'paid', 'overdue'];

export default function InvoiceStatusSummary({
  stats,
  onStatusClick,
  className,
}: InvoiceStatusSummaryProps) {
  // Calculate total outstanding (everything except paid)
  const totalOutstanding =
    stats.draft.total +
    stats.sent.total +
    stats.viewed.total +
    stats.overdue.total;

  // Calculate total for proportional bar (by count for visual clarity)
  const totalCount = STATUS_ORDER.reduce((sum, status) => sum + stats[status].count, 0);

  // Check if there are any invoices
  const hasInvoices = totalCount > 0;

  // Calculate percentages for bar segments
  const getPercentage = (count: number): number => {
    if (totalCount === 0) return 0;
    return (count / totalCount) * 100;
  };

  return (
    <Card className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <DocumentTextIcon className="h-5 w-5 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Invoice Overview</h3>
      </div>

      {/* Total Outstanding */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">Total Outstanding</p>
        <p className="text-3xl font-bold text-gray-900">
          {formatCurrency(totalOutstanding)}
        </p>
      </div>

      {/* Stacked Bar Chart */}
      {hasInvoices ? (
        <div className="mb-4">
          <div className="h-4 rounded-full overflow-hidden flex bg-gray-100">
            {STATUS_ORDER.map((status) => {
              const percentage = getPercentage(stats[status].count);
              if (percentage === 0) return null;

              const config = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  onClick={() => onStatusClick?.(status)}
                  className={cn(
                    'h-full transition-opacity',
                    config.barColor,
                    onStatusClick && 'hover:opacity-80 cursor-pointer'
                  )}
                  style={{ width: `${percentage}%` }}
                  title={`${config.label}: ${stats[status].count} invoices (${formatCurrency(stats[status].total)})`}
                  aria-label={`Filter by ${config.label} status`}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="h-4 rounded-full bg-gray-100 mb-4" />
      )}

      {/* Status Legend Grid */}
      <div className="grid grid-cols-2 gap-3">
        {STATUS_ORDER.map((status) => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          const data = stats[status];
          const isOverdue = status === 'overdue';
          const hasOverdue = isOverdue && data.count > 0;

          return (
            <button
              key={status}
              onClick={() => onStatusClick?.(status)}
              disabled={!onStatusClick}
              className={cn(
                'flex items-start gap-2 p-2 rounded-lg text-left transition-colors',
                onStatusClick ? 'cursor-pointer' : 'cursor-default',
                config.bgColor,
                onStatusClick && config.hoverColor,
                hasOverdue && 'ring-2 ring-red-300'
              )}
            >
              <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.color)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className={cn('text-sm font-medium', config.color)}>
                    {config.label}
                  </span>
                  {hasOverdue && (
                    <span className="text-red-500" title="Requires attention">
                      !
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {data.count} invoice{data.count !== 1 ? 's' : ''}
                </div>
                <div className={cn('text-sm font-semibold', config.color)}>
                  {formatCurrency(data.total)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Overdue Warning */}
      {stats.overdue.count > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onStatusClick?.('overdue')}
            className={cn(
              'flex items-center gap-2 w-full p-2 rounded-lg bg-red-50 text-red-700',
              onStatusClick && 'hover:bg-red-100 cursor-pointer'
            )}
          >
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">
              {stats.overdue.count} invoice{stats.overdue.count !== 1 ? 's' : ''} overdue
              <span className="text-red-600 font-bold ml-1">
                ({formatCurrency(stats.overdue.total)})
              </span>
            </span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!hasInvoices && (
        <div className="text-center text-sm text-gray-500 py-2">
          No invoices yet
        </div>
      )}
    </Card>
  );
}

// Export types for consumers
export type { StatusData };
