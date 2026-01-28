"use client";

import React, { useState } from 'react';
import { ChangeOrder } from '@/types';
import { Button, Textarea } from '@/components/ui';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ChangeOrderApprovalPanelProps {
  co: ChangeOrder;
  currentRole?: 'pm' | 'owner' | 'client';
  onApprove?: (comments?: string) => void;
  onReject?: (comments?: string) => void;
  onSubmitForApproval?: () => void;
}

const ROLE_ORDER: ('pm' | 'owner' | 'client')[] = ['pm', 'owner', 'client'];
const ROLE_LABELS: Record<string, string> = { pm: 'Project Manager', owner: 'Owner', client: 'Client' };
const STATUS_DOT: Record<string, string> = { pending: 'bg-yellow-400', approved: 'bg-green-500', rejected: 'bg-red-500' };

export default function ChangeOrderApprovalPanel({ co, currentRole, onApprove, onReject, onSubmitForApproval }: ChangeOrderApprovalPanelProps) {
  const [comments, setComments] = useState('');

  const expectedRole = co.status === 'pending_pm' ? 'pm' : co.status === 'pending_owner' ? 'owner' : co.status === 'pending_client' ? 'client' : null;
  const canAct = currentRole && expectedRole === currentRole;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Approval Workflow</h4>

      {/* Visual timeline */}
      <div className="flex items-center gap-2">
        {ROLE_ORDER.map((role, i) => {
          const approval = co.approvals.find(a => a.role === role);
          const isActive = expectedRole === role;
          const dotColor = approval?.status === 'approved' ? 'bg-green-500' :
            approval?.status === 'rejected' ? 'bg-red-500' :
            isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300';

          return (
            <React.Fragment key={role}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', dotColor)}>
                  {approval?.status === 'approved' && <CheckCircleIcon className="h-5 w-5 text-white" />}
                  {approval?.status === 'rejected' && <XCircleIcon className="h-5 w-5 text-white" />}
                  {(!approval || approval.status === 'pending') && <span className="text-xs font-bold text-white">{i + 1}</span>}
                </div>
                <span className={cn('text-xs', isActive ? 'font-medium text-gray-900' : 'text-gray-500')}>
                  {ROLE_LABELS[role]}
                </span>
                {approval?.userName && (
                  <span className="text-[10px] text-gray-400">{approval.userName}</span>
                )}
              </div>
              {i < ROLE_ORDER.length - 1 && (
                <div className={cn('flex-1 h-0.5 -mt-5', approval?.status === 'approved' ? 'bg-green-400' : 'bg-gray-200')} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status message */}
      <div className={cn(
        'px-4 py-3 rounded-lg text-sm',
        co.status === 'approved' && 'bg-green-50 text-green-700',
        co.status === 'rejected' && 'bg-red-50 text-red-700',
        co.status === 'draft' && 'bg-gray-50 text-gray-600',
        co.status.startsWith('pending') && 'bg-yellow-50 text-yellow-700',
      )}>
        {co.status === 'draft' && 'This change order is in draft. Submit for approval when ready.'}
        {co.status === 'pending_pm' && 'Waiting for Project Manager approval.'}
        {co.status === 'pending_owner' && 'Waiting for Owner approval.'}
        {co.status === 'pending_client' && 'Waiting for Client approval.'}
        {co.status === 'approved' && 'This change order has been fully approved.'}
        {co.status === 'rejected' && 'This change order was rejected.'}
      </div>

      {co.status === 'draft' && onSubmitForApproval && (
        <Button variant="primary" size="sm" onClick={onSubmitForApproval}>Submit for Approval</Button>
      )}

      {/* Action form */}
      {canAct && (
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Comments (optional)" rows={2} />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => onApprove?.(comments || undefined)} icon={<CheckCircleIcon className="h-4 w-4" />}>Approve</Button>
            <Button variant="secondary" size="sm" onClick={() => onReject?.(comments || undefined)} icon={<XCircleIcon className="h-4 w-4" />} className="!text-red-600 hover:!bg-red-50">Reject</Button>
          </div>
        </div>
      )}

      {/* Approval comments */}
      {co.approvals.filter(a => a.comments).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Comments</p>
          {co.approvals.filter(a => a.comments).map((a, i) => (
            <div key={i} className="px-3 py-2 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-700">{a.userName} ({ROLE_LABELS[a.role]})</p>
              <p className="text-sm text-gray-600">{a.comments}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
