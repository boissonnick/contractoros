'use client';

import React from 'react';
import Link from 'next/link';
import {
  DocumentTextIcon,
  CalendarIcon,
  UserCircleIcon,
  ClockIcon,
  PaperClipIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';

export type RFIStatus = 'draft' | 'submitted' | 'responded' | 'closed';

export interface RFI {
  id: string;
  number: string;
  title: string;
  description?: string;
  status: RFIStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: {
    id: string;
    name: string;
    type: 'team' | 'sub';
  };
  createdBy: {
    id: string;
    name: string;
  };
  dueDate?: Date;
  createdAt: Date;
  submittedAt?: Date;
  respondedAt?: Date;
  closedAt?: Date;
  attachmentCount: number;
  linkedDrawings?: string[];
  projectId: string;
}

interface RFICardProps {
  rfi: RFI;
  onView?: (rfi: RFI) => void;
  onRespond?: (rfi: RFI) => void;
  onClose?: (rfi: RFI) => void;
  compact?: boolean;
}

const STATUS_CONFIG: Record<RFIStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  submitted: { label: 'Submitted', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  responded: { label: 'Responded', color: 'text-green-700', bgColor: 'bg-green-100' },
  closed: { label: 'Closed', color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

const PRIORITY_CONFIG: Record<string, { color: string; bgColor: string }> = {
  low: { color: 'text-gray-600', bgColor: 'bg-gray-100' },
  medium: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100' },
  urgent: { color: 'text-red-600', bgColor: 'bg-red-100' },
};

function getDaysOpen(createdAt: Date, closedAt?: Date): number {
  const endDate = closedAt || new Date();
  return differenceInDays(endDate, createdAt);
}

export function RFICard({ rfi, onView, onRespond, onClose, compact = false }: RFICardProps) {
  const statusConfig = STATUS_CONFIG[rfi.status];
  const priorityConfig = PRIORITY_CONFIG[rfi.priority];
  const daysOpen = getDaysOpen(rfi.createdAt, rfi.closedAt);
  const isOverdue = rfi.dueDate && new Date() > rfi.dueDate && rfi.status !== 'closed';

  return (
    <div className="border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono font-medium text-gray-500">
                {rfi.number}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                {rfi.priority.charAt(0).toUpperCase() + rfi.priority.slice(1)}
              </span>
            </div>
            <h4 className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">
              {rfi.title}
            </h4>
          </div>

          {/* Documents indicator */}
          {rfi.attachmentCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <PaperClipIcon className="h-4 w-4" />
              <span>{rfi.attachmentCount}</span>
            </div>
          )}
        </div>

        {/* Meta info */}
        {!compact && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
            {/* Assigned to */}
            {rfi.assignedTo && (
              <div className="flex items-center gap-1">
                <UserCircleIcon className="h-4 w-4" />
                <span>{rfi.assignedTo.name}</span>
                {rfi.assignedTo.type === 'sub' && (
                  <span className="text-[10px] px-1 py-0.5 bg-amber-100 text-amber-700 rounded">Sub</span>
                )}
              </div>
            )}

            {/* Due date */}
            {rfi.dueDate && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                <CalendarIcon className="h-4 w-4" />
                <span>{format(rfi.dueDate, 'MMM d, yyyy')}</span>
                {isOverdue && <span>(Overdue)</span>}
              </div>
            )}

            {/* Days open */}
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>{daysOpen} days {rfi.status === 'closed' ? 'total' : 'open'}</span>
            </div>

            {/* Linked drawings */}
            {rfi.linkedDrawings && rfi.linkedDrawings.length > 0 && (
              <div className="flex items-center gap-1">
                <DocumentTextIcon className="h-4 w-4" />
                <span>{rfi.linkedDrawings.length} drawings</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-100">
          {onView && (
            <button
              onClick={() => onView(rfi)}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              <EyeIcon className="h-3.5 w-3.5" />
              View
            </button>
          )}

          {onRespond && rfi.status === 'submitted' && (
            <button
              onClick={() => onRespond(rfi)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
              Respond
            </button>
          )}

          {onClose && rfi.status === 'responded' && (
            <button
              onClick={() => onClose(rfi)}
              className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50 transition-colors"
            >
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Close
            </button>
          )}

          <Link
            href={`/dashboard/projects/${rfi.projectId}/rfis/${rfi.id}`}
            className="ml-auto text-xs text-violet-600 hover:text-violet-700 font-medium"
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RFICard;
