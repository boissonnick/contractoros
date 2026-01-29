"use client";

import React, { useState } from 'react';
import BaseModal from '@/components/ui/BaseModal';
import { Button, Input } from '@/components/ui';
import { StripePayment } from '@/types';
import { formatCurrency, centsToDollars, dollarsToCents } from '@/lib/payments/paymentUtils';
import { ArrowUturnLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface RefundModalProps {
  open: boolean;
  onClose: () => void;
  payment: StripePayment;
  onRefund: (paymentId: string, amount?: number, reason?: string) => Promise<boolean>;
}

type RefundReason = 'requested_by_customer' | 'duplicate' | 'fraudulent' | 'other';

const REFUND_REASONS: { value: RefundReason; label: string }[] = [
  { value: 'requested_by_customer', label: 'Customer requested' },
  { value: 'duplicate', label: 'Duplicate payment' },
  { value: 'fraudulent', label: 'Fraudulent' },
  { value: 'other', label: 'Other' },
];

/**
 * RefundModal - Modal for processing payment refunds
 *
 * Features:
 * - Full or partial refund
 * - Reason selection
 * - Amount validation
 * - Confirmation step
 */
export default function RefundModal({
  open,
  onClose,
  payment,
  onRefund,
}: RefundModalProps) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState<RefundReason>('requested_by_customer');
  const [customReason, setCustomReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxRefundAmount = payment.amount - (payment.refundAmount || 0);
  const refundAmount = refundType === 'full'
    ? maxRefundAmount
    : Math.min(dollarsToCents(parseFloat(amount) || 0), maxRefundAmount);

  const isValidAmount = refundType === 'full' || (refundAmount > 0 && refundAmount <= maxRefundAmount);

  const handleRefund = async () => {
    if (!isValidAmount) {
      setError('Invalid refund amount');
      return;
    }

    setProcessing(true);
    setError(null);

    const refundReason = reason === 'other' ? customReason : reason;
    const success = await onRefund(
      payment.id,
      refundType === 'partial' ? refundAmount : undefined,
      refundReason
    );

    setProcessing(false);

    if (success) {
      onClose();
    } else {
      setError('Failed to process refund. Please try again.');
    }
  };

  const handleClose = () => {
    setRefundType('full');
    setAmount('');
    setReason('requested_by_customer');
    setCustomReason('');
    setError(null);
    onClose();
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Process Refund"
      subtitle={`Payment of ${formatCurrency(payment.amount)}`}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRefund}
            loading={processing}
            disabled={!isValidAmount}
            className="bg-red-600 hover:bg-red-700"
          >
            <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
            Refund {formatCurrency(refundAmount)}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">
            Refunds are processed immediately and cannot be reversed. The funds will be returned to the customer&apos;s original payment method.
          </p>
        </div>

        {/* Original payment info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Original amount:</span>
            <span className="font-medium">{formatCurrency(payment.amount)}</span>
          </div>
          {payment.refundAmount && payment.refundAmount > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Already refunded:</span>
              <span className="font-medium text-red-600">-{formatCurrency(payment.refundAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mt-1 pt-1 border-t border-gray-200">
            <span className="text-gray-600">Available for refund:</span>
            <span className="font-semibold">{formatCurrency(maxRefundAmount)}</span>
          </div>
        </div>

        {/* Refund type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Refund Amount
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRefundType('full')}
              className={`flex-1 p-3 border rounded-lg text-sm font-medium transition-colors ${
                refundType === 'full'
                  ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              Full Refund
              <span className="block text-xs font-normal mt-0.5">
                {formatCurrency(maxRefundAmount)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRefundType('partial')}
              className={`flex-1 p-3 border rounded-lg text-sm font-medium transition-colors ${
                refundType === 'partial'
                  ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              Partial Refund
            </button>
          </div>
        </div>

        {/* Partial amount input */}
        {refundType === 'partial' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refund Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                max={centsToDollars(maxRefundAmount)}
                step="0.01"
                className="pl-7"
              />
            </div>
            {amount && parseFloat(amount) > centsToDollars(maxRefundAmount) && (
              <p className="text-xs text-red-500 mt-1">
                Cannot exceed ${centsToDollars(maxRefundAmount).toFixed(2)}
              </p>
            )}
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Refund
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as RefundReason)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {REFUND_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom reason */}
        {reason === 'other' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specify Reason
            </label>
            <Input
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter reason for refund"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
