'use client';

import React from 'react';
import Link from 'next/link';
import {
  DocumentTextIcon,
  CalendarIcon,
  UserCircleIcon,
  PaperClipIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export type SubmittalStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'revise';

export type SubmissionType =
  | 'shop_drawing'
  | 'product_data'
  | 'sample'
  | 'mock_up'
  | 'test_report'
  | 'certificate'
  | 'warranty'
  | 'other';

export interface Submittal {
  id: string;
  number: string;
  title: string;
  specSection?: string;
  submissionType: SubmissionType;
  status: SubmittalStatus;
  description?: string;
  submittedBy: {
    id: string;
    name: string;
  };
  reviewer?: {
    id: string;
    name: string;
  };
  submittedAt: Date;
  reviewedAt?: Date;
  requiredDate?: Date;
  attachmentCount: number;
  revisionNumber: number;
  projectId: string;
  reviewNotes?: string;
}

interface SubmittalCardProps {
  submittal: Submittal;
  onView?: (submittal: Submittal) => void;
  onReview?: (submittal: Submittal) => void;
  onRevise?: (submittal: Submittal) => void;
  compact?: boolean;
}

const STATUS_CONFIG: Record<SubmittalStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}> = {
  pending: {
    label: 'Pending',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: ClockIcon,
  },
  under_review: {
    label: 'Under Review',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: EyeIcon,
  },
  approved: {
    label: 'Approved',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircleIcon,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircleIcon,
  },
  revise: {
    label: 'Revise & Resubmit',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: ArrowPathIcon,
  },
};

const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  shop_drawing: 'Shop Drawing',
  product_data: 'Product Data',
  sample: 'Sample',
  mock_up: 'Mock-Up',
  test_report: 'Test Report',
  certificate: 'Certificate',
  warranty: 'Warranty',
  other: 'Other',
};

export function SubmittalCard({
  submittal,
  onView,
  onReview,
  onRevise,
  compact = false
}: SubmittalCardProps) {
  const statusConfig = STATUS_CONFIG[submittal.status];
  const StatusIcon = statusConfig.icon;
  const isActionable = ['pending', 'under_review'].includes(submittal.status);
  const needsRevision = submittal.status === 'revise';

  return (
    <div className="border border-gray-200 rounded-2xl bg-white hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono font-medium text-gray-500">
                {submittal.number}
                {submittal.revisionNumber > 0 && (
                  <span className="text-xs ml-1">Rev. {submittal.revisionNumber}</span>
                )}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </span>
            </div>
            <h4 className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">
              {submittal.title}
            </h4>
            {submittal.specSection && (
              <p className="mt-0.5 text-xs text-gray-500">
                Spec: {submittal.specSection}
              </p>
            )}
          </div>

          {/* Documents indicator */}
          {submittal.attachmentCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <PaperClipIcon className="h-4 w-4" />
              <span>{submittal.attachmentCount}</span>
            </div>
          )}
        </div>

        {/* Meta info */}
        {!compact && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
            {/* Type */}
            <div className="flex items-center gap-1">
              <DocumentTextIcon className="h-4 w-4" />
              <span>{SUBMISSION_TYPE_LABELS[submittal.submissionType]}</span>
            </div>

            {/* Reviewer */}
            {submittal.reviewer && (
              <div className="flex items-center gap-1">
                <UserCircleIcon className="h-4 w-4" />
                <span>Reviewer: {submittal.reviewer.name}</span>
              </div>
            )}

            {/* Review date */}
            {submittal.reviewedAt && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>Reviewed: {format(submittal.reviewedAt, 'MMM d, yyyy')}</span>
              </div>
            )}

            {/* Required date */}
            {submittal.requiredDate && !submittal.reviewedAt && (
              <div className={`flex items-center gap-1 ${new Date() > submittal.requiredDate ? 'text-red-600' : ''}`}>
                <CalendarIcon className="h-4 w-4" />
                <span>Required: {format(submittal.requiredDate, 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
        )}

        {/* Review notes */}
        {submittal.reviewNotes && !compact && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 italic">
            &quot;{submittal.reviewNotes}&quot;
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-100">
          {onView && (
            <button
              onClick={() => onView(submittal)}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              <EyeIcon className="h-3.5 w-3.5" />
              View
            </button>
          )}

          {onReview && isActionable && (
            <button
              onClick={() => onReview(submittal)}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 px-2 py-1 rounded hover:bg-brand-50 transition-colors"
            >
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Review
            </button>
          )}

          {onRevise && needsRevision && (
            <button
              onClick={() => onRevise(submittal)}
              className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 px-2 py-1 rounded hover:bg-orange-50 transition-colors"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Revise
            </button>
          )}

          <Link
            href={`/dashboard/projects/${submittal.projectId}/submittals/${submittal.id}`}
            className="ml-auto text-xs text-violet-600 hover:text-violet-700 font-medium"
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SubmittalCard;
