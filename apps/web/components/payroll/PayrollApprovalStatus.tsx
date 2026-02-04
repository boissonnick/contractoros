'use client';

import React, { useState } from 'react';
import { PayrollRun, PayrollRunStatus, PAYROLL_RUN_STATUSES } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import BaseModal from '@/components/ui/BaseModal';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

// Status flow configuration
const STATUS_FLOW: PayrollRunStatus[] = ['draft', 'pending_approval', 'approved', 'processing', 'completed'];

interface PayrollApprovalStatusProps {
  run: PayrollRun;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onSubmitForApproval?: () => void;
  onProcess?: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
  currentUserRole?: 'owner' | 'finance' | 'pm' | 'employee';
}

export function PayrollApprovalStatus({
  run,
  onApprove,
  onReject,
  onSubmitForApproval,
  onProcess,
  onComplete,
  isLoading = false,
  currentUserRole = 'owner',
}: PayrollApprovalStatusProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const currentStatusIndex = STATUS_FLOW.indexOf(run.status);
  const isCancelled = run.status === 'cancelled';

  const canSubmitForApproval = run.status === 'draft' && onSubmitForApproval;
  const canApprove = run.status === 'pending_approval' && onApprove && ['owner', 'finance'].includes(currentUserRole);
  const canReject = run.status !== 'completed' && run.status !== 'cancelled' && onReject;
  const canProcess = run.status === 'approved' && onProcess;
  const canComplete = run.status === 'processing' && onComplete;

  const getStatusIcon = (status: PayrollRunStatus, isActive: boolean, isPast: boolean) => {
    const iconClass = `h-6 w-6 ${
      isPast ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-300'
    }`;

    switch (status) {
      case 'draft':
        return <DocumentCheckIcon className={iconClass} />;
      case 'pending_approval':
        return <ClockIcon className={iconClass} />;
      case 'approved':
        return <CheckCircleIcon className={iconClass} />;
      case 'processing':
        return <ArrowPathIcon className={iconClass} />;
      case 'completed':
        return <CurrencyDollarIcon className={iconClass} />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: PayrollRunStatus): string => {
    const statusInfo = PAYROLL_RUN_STATUSES.find(s => s.value === status);
    return statusInfo?.label ?? status;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleReject = () => {
    if (rejectReason.trim() && onReject) {
      onReject(rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Progress Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-6">Approval Workflow</h3>

        {isCancelled ? (
          <div className="flex items-center justify-center gap-3 py-4 bg-red-50 rounded-lg">
            <XCircleIcon className="h-8 w-8 text-red-600" />
            <div>
              <div className="font-semibold text-red-900">Payroll Run Cancelled</div>
              <div className="text-sm text-red-600">This payroll run has been cancelled and cannot be processed.</div>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${(currentStatusIndex / (STATUS_FLOW.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Status steps */}
            <div className="relative flex justify-between">
              {STATUS_FLOW.map((status, index) => {
                const isPast = index < currentStatusIndex;
                const isActive = index === currentStatusIndex;
                const isFuture = index > currentStatusIndex;

                return (
                  <div key={status} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                        isPast
                          ? 'bg-green-100 border-2 border-green-500'
                          : isActive
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-100 border-2 border-gray-300'
                      }`}
                    >
                      {getStatusIcon(status, isActive, isPast)}
                    </div>
                    <div className="mt-2 text-center">
                      <div
                        className={`text-xs font-medium ${
                          isPast
                            ? 'text-green-600'
                            : isActive
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {getStatusLabel(status)}
                      </div>
                      {isPast && status === 'approved' && run.approvedAt && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatDate(run.approvedAt)}
                        </div>
                      )}
                      {isPast && status === 'completed' && run.processedAt && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatDate(run.processedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Approval Details */}
      {(run.approvedBy || run.processedBy) && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Approval History</h4>
          <div className="space-y-3">
            {run.createdBy && (
              <div className="flex items-center gap-3 text-sm">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Created by <span className="font-medium text-gray-900">{run.createdByName}</span>
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-400 ml-auto" />
                <span className="text-gray-500">{formatDate(run.createdAt)}</span>
              </div>
            )}
            {run.approvedBy && (
              <div className="flex items-center gap-3 text-sm">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">
                  Approved by <span className="font-medium text-gray-900">{run.approvedByName}</span>
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-400 ml-auto" />
                <span className="text-gray-500">{formatDate(run.approvedAt)}</span>
              </div>
            )}
            {run.processedAt && (
              <div className="flex items-center gap-3 text-sm">
                <CurrencyDollarIcon className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">Processed</span>
                <CalendarIcon className="h-4 w-4 text-gray-400 ml-auto" />
                <span className="text-gray-500">{formatDate(run.processedAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isCancelled && (canSubmitForApproval || canApprove || canReject || canProcess || canComplete) && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">
            {run.status === 'draft' && 'Submit this payroll run for approval when ready.'}
            {run.status === 'pending_approval' && 'Review the payroll details and approve or reject.'}
            {run.status === 'approved' && 'The payroll is approved and ready for processing.'}
            {run.status === 'processing' && 'The payroll is being processed.'}
          </div>
          <div className="flex items-center gap-2">
            {canReject && run.status !== 'draft' && (
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(true)}
                disabled={isLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Reject
              </Button>
            )}
            {canSubmitForApproval && (
              <Button
                onClick={onSubmitForApproval}
                disabled={isLoading}
              >
                <DocumentCheckIcon className="h-4 w-4 mr-2" />
                Submit for Approval
              </Button>
            )}
            {canApprove && (
              <Button
                onClick={onApprove}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Approve Payroll
              </Button>
            )}
            {canProcess && (
              <Button
                onClick={onProcess}
                disabled={isLoading}
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Process Payroll
              </Button>
            )}
            {canComplete && (
              <Button
                onClick={onComplete}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Manager-only note for non-managers */}
      {run.status === 'pending_approval' && !['owner', 'finance'].includes(currentUserRole) && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>Pending Approval:</strong> This payroll run is awaiting approval from an Owner or Finance Manager.
            Only users with the appropriate role can approve payroll runs.
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <BaseModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Payroll Run"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <strong>Warning:</strong> Rejecting this payroll run will cancel it. You will need to create a new
                payroll run if needed.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this payroll run..."
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircleIcon className="h-4 w-4 mr-2" />
              Reject Payroll
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}

export default PayrollApprovalStatus;
