"use client";

import React from 'react';
import { Task, TaskPriority } from '@/types';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  ClockIcon,
  LinkIcon,
  PaperClipIcon,
  UserCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/date-utils';

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

interface TaskCardProps {
  task: Task;
  onClick?: (task: Task) => void;
  compact?: boolean;
  className?: string;
  isSelected?: boolean;
  /** Phase name to display - pass from parent that has phases data */
  phaseName?: string;
}

export default function TaskCard({ task, onClick, compact = false, className, isSelected, phaseName }: TaskCardProps) {
  const hasDueDate = !!task.dueDate;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const hasAssignees = task.assignedTo.length > 0;
  const hasDependencies = task.dependencies.length > 0;
  const hasAttachments = task.attachments.length > 0;
  const hasChecklist = task.checklist && task.checklist.length > 0;
  const checklistDone = task.checklist?.filter(i => i.isCompleted).length || 0;
  const checklistTotal = task.checklist?.length || 0;

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer',
        'hover:shadow-md hover:border-gray-300 transition-all duration-150',
        isOverdue && 'border-red-300 bg-red-50/30',
        isSelected && 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/30',
        className
      )}
      onClick={() => onClick?.(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(task)}
    >
      <div className={cn('p-3', compact && 'p-2')}>
        {/* Title */}
        <p className={cn(
          'font-medium text-gray-900',
          compact ? 'text-xs' : 'text-sm',
          task.status === 'completed' && 'line-through text-gray-500'
        )}>
          {task.title}
        </p>

        {/* Description preview (non-compact only) */}
        {!compact && task.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Priority */}
          <span className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
            priorityColors[task.priority]
          )}>
            {task.priority}
          </span>

          {/* Phase */}
          {phaseName && (
            <span className="inline-flex items-center gap-1 text-xs text-brand-primary bg-brand-primary-light px-1.5 py-0.5 rounded font-medium">
              <RectangleStackIcon className="h-3 w-3" />
              {phaseName}
            </span>
          )}

          {/* Trade */}
          {task.trade && (
            <span className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
              {task.trade}
            </span>
          )}

          {/* Due date */}
          {hasDueDate && (
            <span className={cn(
              'inline-flex items-center gap-0.5 text-xs',
              isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
            )}>
              <CalendarIcon className="h-3 w-3" />
              {formatDate(task.dueDate, { month: 'short', day: 'numeric' })}
            </span>
          )}

          {/* Estimated hours */}
          {task.estimatedHours && !compact && (
            <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
              <ClockIcon className="h-3 w-3" />
              {task.actualHours ?? 0}/{task.estimatedHours}h
            </span>
          )}
        </div>

        {/* Bottom row: icons + assignees */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            {hasDependencies && (
              <span className="inline-flex items-center gap-0.5 text-xs text-gray-400" title={`${task.dependencies.length} dependencies`}>
                <LinkIcon className="h-3 w-3" />
                {task.dependencies.length}
              </span>
            )}
            {hasAttachments && (
              <span className="inline-flex items-center gap-0.5 text-xs text-gray-400" title={`${task.attachments.length} attachments`}>
                <PaperClipIcon className="h-3 w-3" />
                {task.attachments.length}
              </span>
            )}
            {hasChecklist && (
              <span className={cn(
                "inline-flex items-center gap-0.5 text-xs",
                checklistDone === checklistTotal ? 'text-green-500' : 'text-gray-400'
              )} title={`${checklistDone}/${checklistTotal} checklist items`}>
                <CheckCircleIcon className="h-3 w-3" />
                {checklistDone}/{checklistTotal}
              </span>
            )}
            {task.isRecurring && (
              <span className="inline-flex items-center text-xs text-purple-400" title="Recurring task">
                <ArrowPathIcon className="h-3 w-3" />
              </span>
            )}
          </div>

          {/* Assignee avatars */}
          {hasAssignees && (
            <div className="flex -space-x-1">
              {task.assignedTo.slice(0, 3).map((uid) => (
                <div
                  key={uid}
                  className="h-5 w-5 rounded-full bg-gray-300 border border-white flex items-center justify-center"
                  title={uid}
                >
                  <UserCircleIcon className="h-4 w-4 text-gray-600" />
                </div>
              ))}
              {task.assignedTo.length > 3 && (
                <div className="h-5 w-5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[10px] text-gray-600 font-medium">
                  +{task.assignedTo.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
