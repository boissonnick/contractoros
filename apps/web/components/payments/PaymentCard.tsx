"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { StripePayment, PaymentStatus } from '@/types';
import { formatCurrency, getPaymentStatusColor, formatPaymentStatus } from '@/lib/payments/paymentUtils';
import { formatDate } from '@/lib/date-utils';
import {
  CreditCardIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';

export interface PaymentCardProps {
  payment: StripePayment;
  onClick?: () => void;
  onRefund?: () => void;
  onResend?: () => void;
  showActions?: boolean;
  className?: string;
}

const StatusIcon: Record<PaymentStatus, React.ComponentType<{ className?: string }>> = {
  pending: ClockIcon,
  processing: ArrowPathIcon,
  completed: CheckCircleIcon,
  failed: XCircleIcon,
  refunded: ArrowUturnLeftIcon,
  partially_refunded: ArrowUturnLeftIcon,
  cancelled: XCircleIcon,
};

/**
 * PaymentCard - Display card for a single payment
 *
 * Features:
 * - Status indicator with icon
 * - Payment method display
 * - Amount and date
 * - Quick actions (refund, resend receipt)
 */
export default function PaymentCard({
  payment,
  onClick,
  onRefund,
  onResend,
  showActions = true,
  className,
}: PaymentCardProps) {
  const Icon = StatusIcon[payment.status] || ClockIcon;
  const statusColor = getPaymentStatusColor(payment.status);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-gray-300',
        className
      )}
    >
      <div className="flex items-start justify-between">
        {/* Left: Payment info */}
        <div className="flex items-start gap-3">
          {/* Payment method icon */}
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', statusColor.bg)}>
            {payment.paymentMethod === 'card' ? (
              <CreditCardIcon className={cn('h-5 w-5', statusColor.text)} />
            ) : (
              <BanknotesIcon className={cn('h-5 w-5', statusColor.text)} />
            )}
          </div>

          <div>
            {/* Amount */}
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(payment.amount)}
            </p>

            {/* Description */}
            {payment.description && (
              <p className="text-sm text-gray-600 line-clamp-1">{payment.description}</p>
            )}

            {/* Reference */}
            {payment.reference && (
              <p className="text-xs text-gray-500">Ref: {payment.reference}</p>
            )}
          </div>
        </div>

        {/* Right: Status and actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Status badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              statusColor.bg,
              statusColor.text
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {formatPaymentStatus(payment.status)}
          </span>

          {/* Date */}
          <p className="text-xs text-gray-500">
            {formatDate(payment.completedAt || payment.createdAt)}
          </p>
        </div>
      </div>

      {/* Refund info */}
      {(payment.status === 'refunded' || payment.status === 'partially_refunded') && payment.refundAmount && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Refunded: <span className="font-medium">{formatCurrency(payment.refundAmount)}</span>
            {payment.refundReason && <span className="ml-1 text-gray-500">({payment.refundReason})</span>}
          </p>
        </div>
      )}

      {/* Actions */}
      {showActions && payment.status === 'completed' && (onRefund || onResend) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
          {onRefund && (
            <button
              onClick={(e) => handleActionClick(e, onRefund)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
              Refund
            </button>
          )}
          {onResend && payment.receiptUrl && (
            <button
              onClick={(e) => handleActionClick(e, onResend)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Resend Receipt
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * PaymentCardSkeleton - Loading skeleton for payment cards
 */
export function PaymentCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
