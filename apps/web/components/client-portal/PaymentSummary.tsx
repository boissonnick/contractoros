'use client';

import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface PaymentInvoice {
  id: string;
  number: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'partial';
  dueDate?: Date;
  paidDate?: Date;
  paidAmount?: number;
  paymentUrl?: string;
}

interface PaymentSummaryProps {
  contractTotal: number;
  totalPaid: number;
  invoices: PaymentInvoice[];
  onPayNow?: (invoiceId: string) => void;
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_CONFIG = {
  paid: { label: 'Paid', icon: CheckCircleIcon, color: 'text-green-600 bg-green-100' },
  unpaid: { label: 'Unpaid', icon: ClockIcon, color: 'text-yellow-600 bg-yellow-100' },
  overdue: { label: 'Overdue', icon: ExclamationCircleIcon, color: 'text-red-600 bg-red-100' },
  partial: { label: 'Partial', icon: ClockIcon, color: 'text-blue-600 bg-blue-100' },
};

export function PaymentSummary({
  contractTotal,
  totalPaid,
  invoices,
  onPayNow,
  className,
}: PaymentSummaryProps) {
  const remaining = contractTotal - totalPaid;
  const progressPercent = contractTotal > 0 ? (totalPaid / contractTotal) * 100 : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <CurrencyDollarIcon className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Payment Summary</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-blue-200 text-sm">Contract Total</p>
            <p className="text-2xl font-bold">{formatCurrency(contractTotal)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Remaining</p>
            <p className="text-2xl font-bold">{formatCurrency(remaining)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Paid: {formatCurrency(totalPaid)}</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-blue-500/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Invoices</h3>

        {invoices.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => {
              const config = STATUS_CONFIG[invoice.status];
              const Icon = config.icon;
              const showPayButton = invoice.status === 'unpaid' || invoice.status === 'overdue';

              return (
                <div
                  key={invoice.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn('p-1.5 rounded-full', config.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Invoice #{invoice.number}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {invoice.dueDate && (
                            <span>Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}</span>
                          )}
                          {invoice.paidDate && (
                            <span>
                              Paid: {format(new Date(invoice.paidDate), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </p>
                      <span
                        className={cn(
                          'inline-flex text-xs font-medium px-2 py-0.5 rounded-full mt-1',
                          config.color
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* Pay Now button */}
                  {showPayButton && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      {invoice.paymentUrl ? (
                        <a
                          href={invoice.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center bg-brand-primary hover:opacity-90 text-white font-medium py-2.5 rounded-lg transition-colors"
                        >
                          Pay Now
                        </a>
                      ) : onPayNow ? (
                        <button
                          onClick={() => onPayNow(invoice.id)}
                          className="w-full bg-brand-primary hover:opacity-90 text-white font-medium py-2.5 rounded-lg transition-colors"
                        >
                          Pay Now
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentSummary;
