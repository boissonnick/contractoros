'use client';

import React, { useState } from 'react';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export type ApprovalType = 'estimate' | 'change_order';

export interface ApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  description?: string;
  amount: number;
  createdAt: Date;
  lineItems?: { description: string; amount: number }[];
  documentUrl?: string;
}

interface ApprovalCardProps {
  item: ApprovalItem;
  onApprove: (id: string) => Promise<void>;
  onRequestChanges: (id: string, feedback: string) => Promise<void>;
  className?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ApprovalCard({
  item,
  onApprove,
  onRequestChanges,
  className,
}: ApprovalCardProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [approving, setApproving] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApprove(item.id);
    } finally {
      setApproving(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) return;
    setRequesting(true);
    try {
      await onRequestChanges(item.id, feedback.trim());
      setShowFeedback(false);
      setFeedback('');
    } finally {
      setRequesting(false);
    }
  };

  const typeLabel = item.type === 'estimate' ? 'Estimate' : 'Change Order';
  const typeColor =
    item.type === 'estimate' ? 'text-blue-600 bg-blue-100' : 'text-orange-600 bg-orange-100';

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg', typeColor)}>
              <DocumentTextIcon className="w-5 h-5" />
            </div>
            <div>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', typeColor)}>
                {typeLabel}
              </span>
              <h3 className="font-semibold text-gray-900 mt-1">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Sent {format(new Date(item.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items (if any) */}
      {item.lineItems && item.lineItems.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">Line Items</p>
          <div className="space-y-1.5">
            {item.lineItems.slice(0, 5).map((line, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700 truncate">{line.description}</span>
                <span className="text-gray-900 font-medium ml-2">
                  {formatCurrency(line.amount)}
                </span>
              </div>
            ))}
            {item.lineItems.length > 5 && (
              <p className="text-xs text-gray-400">
                +{item.lineItems.length - 5} more items
              </p>
            )}
          </div>
        </div>
      )}

      {/* Total Amount */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Total Amount</span>
          </div>
          <span className="text-2xl font-bold text-green-700">
            {formatCurrency(item.amount)}
          </span>
        </div>
      </div>

      {/* View Document Link */}
      {item.documentUrl && (
        <div className="px-4 py-2 border-b border-gray-100">
          <a
            href={item.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Full Document →
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="p-4">
        {showFeedback ? (
          <div className="space-y-3">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Describe the changes you'd like..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowFeedback(false)}
                className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={!feedback.trim() || requesting}
                className="flex-1 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {requesting ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setShowFeedback(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
              Request Changes
            </button>
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircleIcon className="w-5 h-5" />
              {approving ? 'Approving...' : 'Approve'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApprovalCard;
