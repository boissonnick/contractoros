"use client";

import React, { useState } from 'react';
import { Scope } from '@/types';
import { Button, Textarea, StatusBadge } from '@/components/ui';
import type { StatusType } from '@/components/ui/Badge';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

interface ScopeApprovalPanelProps {
  scope: Scope;
  /** If set, shows approve/reject buttons for this client */
  clientId?: string;
  clientName?: string;
  onSubmitForApproval?: () => void;
  onRecallSubmission?: () => void;
  onApprove?: (comments?: string) => void;
  onReject?: (comments?: string) => void;
}

export default function ScopeApprovalPanel({ scope, clientId, clientName, onSubmitForApproval, onRecallSubmission, onApprove, onReject }: ScopeApprovalPanelProps) {
  const [comments, setComments] = useState('');

  const myApproval = clientId ? scope.approvals.find(a => a.clientId === clientId) : null;
  const canAct = clientId && scope.status === 'pending_approval' && (!myApproval || myApproval.status === 'pending');

  // Format submitted date if available
  const submittedDate = scope.submittedAt
    ? (typeof scope.submittedAt === 'object' && 'toDate' in scope.submittedAt
        ? scope.submittedAt.toDate()
        : scope.submittedAt as Date)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Approval Status</h4>
        <StatusBadge status={scope.status as StatusType} size="sm" />
      </div>

      {/* Status summary */}
      <div className={cn(
        'px-4 py-3 rounded-lg text-sm flex items-start gap-3',
        scope.status === 'approved' && 'bg-green-50 text-green-700 border border-green-200',
        scope.status === 'pending_approval' && 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        scope.status === 'draft' && 'bg-gray-50 text-gray-600 border border-gray-200',
        scope.status === 'superseded' && 'bg-gray-50 text-gray-400 border border-gray-200',
      )}>
        {scope.status === 'draft' && (
          <>
            <PaperAirplaneIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Draft</p>
              <p className="text-xs mt-0.5 opacity-75">This scope is still in draft. Submit it for client approval when ready.</p>
            </div>
          </>
        )}
        {scope.status === 'pending_approval' && (
          <>
            <ClockIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Awaiting Client Approval</p>
              <p className="text-xs mt-0.5 opacity-75">
                {submittedDate
                  ? `Submitted on ${formatDate(submittedDate, { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : 'Waiting for the client to review and approve this scope.'}
              </p>
            </div>
          </>
        )}
        {scope.status === 'approved' && (
          <>
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Approved</p>
              <p className="text-xs mt-0.5 opacity-75">This scope has been approved by the client.</p>
            </div>
          </>
        )}
        {scope.status === 'superseded' && (
          <>
            <ArrowPathIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Superseded</p>
              <p className="text-xs mt-0.5 opacity-75">This scope version has been superseded by a newer version.</p>
            </div>
          </>
        )}
      </div>

      {/* Action buttons for PM/owner */}
      <div className="flex gap-2">
        {scope.status === 'draft' && onSubmitForApproval && (
          <Button variant="primary" size="sm" onClick={onSubmitForApproval} icon={<PaperAirplaneIcon className="h-4 w-4" />}>
            Submit for Approval
          </Button>
        )}
        {scope.status === 'pending_approval' && onRecallSubmission && (
          <Button variant="outline" size="sm" onClick={onRecallSubmission} icon={<ArrowPathIcon className="h-4 w-4" />}>
            Recall Submission
          </Button>
        )}
      </div>

      {/* Approval list */}
      {scope.approvals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approval History</p>
          {scope.approvals.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{a.clientName}</p>
                {a.comments && <p className="text-xs text-gray-500 mt-0.5">{a.comments}</p>}
              </div>
              <StatusBadge status={a.status as StatusType} size="sm" />
              {a.decidedAt && (
                <span className="text-xs text-gray-400">
                  {formatDate(a.decidedAt, { month: 'short', day: 'numeric' })}
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
