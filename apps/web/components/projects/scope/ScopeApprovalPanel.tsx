"use client";

import React, { useState } from 'react';
import { Scope } from '@/types';
import { Button, Textarea } from '@/components/ui';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ScopeApprovalPanelProps {
  scope: Scope;
  /** If set, shows approve/reject buttons for this client */
  clientId?: string;
  clientName?: string;
  onSubmitForApproval?: () => void;
  onApprove?: (comments?: string) => void;
  onReject?: (comments?: string) => void;
}

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-yellow-400',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

export default function ScopeApprovalPanel({ scope, clientId, clientName, onSubmitForApproval, onApprove, onReject }: ScopeApprovalPanelProps) {
  const [comments, setComments] = useState('');

  const myApproval = clientId ? scope.approvals.find(a => a.clientId === clientId) : null;
  const canAct = clientId && scope.status === 'pending_approval' && (!myApproval || myApproval.status === 'pending');

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Approval Status</h4>

      {/* Status summary */}
      <div className={cn(
        'px-4 py-3 rounded-lg text-sm',
        scope.status === 'approved' && 'bg-green-50 text-green-700',
        scope.status === 'pending_approval' && 'bg-yellow-50 text-yellow-700',
        scope.status === 'draft' && 'bg-gray-50 text-gray-600',
        scope.status === 'superseded' && 'bg-gray-50 text-gray-400',
      )}>
        {scope.status === 'draft' && 'This scope is still in draft. Submit it for client approval when ready.'}
        {scope.status === 'pending_approval' && 'Waiting for client approval.'}
        {scope.status === 'approved' && 'This scope has been approved.'}
        {scope.status === 'superseded' && 'This scope version has been superseded by a newer version.'}
      </div>

      {/* Submit for approval button (for PM/owner) */}
      {scope.status === 'draft' && onSubmitForApproval && (
        <Button variant="primary" size="sm" onClick={onSubmitForApproval}>
          Submit for Approval
        </Button>
      )}

      {/* Approval list */}
      {scope.approvals.length > 0 && (
        <div className="space-y-2">
          {scope.approvals.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
              <div className={cn('w-2 h-2 rounded-full', STATUS_DOT[a.status] || 'bg-gray-300')} />
              <div className="flex-1">
                <p className="text-sm text-gray-900">{a.clientName}</p>
                {a.comments && <p className="text-xs text-gray-500">{a.comments}</p>}
              </div>
              <span className="text-xs text-gray-500 capitalize">{a.status}</span>
              {a.decidedAt && (
                <span className="text-xs text-gray-400">
                  {a.decidedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Client action form */}
      {canAct && (
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <Textarea
            label="Comments (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
            placeholder="Add any feedback or conditions..."
          />
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onApprove?.(comments || undefined)}
              icon={<CheckCircleIcon className="h-4 w-4" />}
            >
              Approve
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onReject?.(comments || undefined)}
              icon={<XCircleIcon className="h-4 w-4" />}
              className="!text-red-600 hover:!bg-red-50"
            >
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
