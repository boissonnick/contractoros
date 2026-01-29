"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { StripePayment, PaymentStatus } from '@/types';
import PaymentCard, { PaymentCardSkeleton } from './PaymentCard';
import { formatCurrency } from '@/lib/payments/paymentUtils';
import {
  FunnelIcon,
  ArrowsUpDownIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export interface PaymentListProps {
  payments: StripePayment[];
  loading?: boolean;
  onPaymentClick?: (payment: StripePayment) => void;
  onRefund?: (payment: StripePayment) => void;
  className?: string;
  showFilters?: boolean;
  emptyMessage?: string;
}

type FilterStatus = 'all' | PaymentStatus;
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

/**
 * PaymentList - List of payments with filtering and sorting
 *
 * Features:
 * - Filter by status
 * - Sort by date or amount
 * - Summary stats
 * - Empty state
 */
export default function PaymentList({
  payments,
  loading = false,
  onPaymentClick,
  onRefund,
  className,
  showFilters = true,
  emptyMessage = 'No payments found',
}: PaymentListProps) {
  const [filterStatus, setFilterStatus] = React.useState<FilterStatus>('all');
  const [sortBy, setSortBy] = React.useState<SortOption>('date-desc');

  // Filter payments
  const filteredPayments = React.useMemo(() => {
    let result = [...payments];

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter((p) => p.status === filterStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [payments, filterStatus, sortBy]);

  // Calculate summary stats
  const stats = React.useMemo(() => {
    const completed = payments.filter((p) => p.status === 'completed');
    const pending = payments.filter((p) => p.status === 'pending' || p.status === 'processing');
    const refunded = payments.filter((p) => p.status === 'refunded' || p.status === 'partially_refunded');

    return {
      totalCollected: completed.reduce((sum, p) => sum + p.amount, 0),
      totalPending: pending.reduce((sum, p) => sum + p.amount, 0),
      totalRefunded: refunded.reduce((sum, p) => sum + (p.refundAmount || 0), 0),
      completedCount: completed.length,
      pendingCount: pending.length,
    };
  }, [payments]);

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {showFilters && (
          <div className="flex gap-3 animate-pulse">
            <div className="h-10 w-32 bg-gray-200 rounded-lg" />
            <div className="h-10 w-32 bg-gray-200 rounded-lg" />
          </div>
        )}
        {Array.from({ length: 3 }).map((_, i) => (
          <PaymentCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CurrencyDollarIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Collected</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(stats.totalCollected)}
          </p>
          <p className="text-sm text-green-600">{stats.completedCount} payments</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <CurrencyDollarIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-700">
            {formatCurrency(stats.totalPending)}
          </p>
          <p className="text-sm text-yellow-600">{stats.pendingCount} payments</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <CurrencyDollarIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Refunded</span>
          </div>
          <p className="text-2xl font-bold text-gray-700">
            {formatCurrency(stats.totalRefunded)}
          </p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially Refunded</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowsUpDownIcon className="h-4 w-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>

          {/* Results count */}
          <span className="text-sm text-gray-500">
            {filteredPayments.length} of {payments.length} payments
          </span>
        </div>
      )}

      {/* Payment list */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CurrencyDollarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onClick={onPaymentClick ? () => onPaymentClick(payment) : undefined}
              onRefund={onRefund ? () => onRefund(payment) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
