"use client";

import React from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  ClockIcon,
  LinkIcon,
  PaperClipIcon,
  UserCircleIcon,
  CheckCircleIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/date-utils';

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  assigned: 'bg-blue-100 text-blue-600',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  review: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

const statusLabels: Record<TaskStatus, string> = {
  pending: 'To Do',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  review: 'Review',
  completed: 'Done',
};

const priorityDots: Record<TaskPriority, string> = {
  low: 'bg-gray-300',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-500',
};

interface TaskListRowProps {
  task: Task;
  onClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  /** Phase name to display */
  phaseName?: string;
}

export default function TaskListRow({ task, onClick, onStatusChange, phaseName }: TaskListRowProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const isDone = task.status === 'completed';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors',
        isDone && 'opacity-60'
      )}
      onClick={() => onClick(task)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStatusChange(task.id, isDone ? 'pending' : 'completed');
        }}
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
          isDone ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-gray-400'
        )}
      >
        {isDone && <CheckCircleIcon className="h-4 w-4 text-white" />}
      </button>

      {/* Priority dot */}
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityDots[task.priority])} title={task.priority} />

      {/* Title */}
      <span className={cn(
        'flex-1 text-sm text-gray-900 truncate min-w-0',
        isDone && 'line-through text-gray-500'
      )}>
        {task.title}
      </span>

      {/* Trade */}
      {task.trade && (
        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
          {task.trade}
        </span>
      )}

      {/* Phase */}
      {phaseName && (
        <span className="inline-flex items-center gap-1 text-xs text-brand-primary bg-brand-primary-light px-1.5 py-0.5 rounded font-medium flex-shrink-0">
          <RectangleStackIcon className="h-3 w-3" />
          {phaseName}
        </span>
      )}

      {/* Status badge */}
      <span className={cn(
        'text-xs font-medium px-2 py-0.5 rounded flex-shrink-0',
        statusColors[task.status]
      )}>
        {statusLabels[task.status]}
      </span>

      {/* Due date */}
      {task.dueDate && (
        <span className={cn(
          'inline-flex items-center gap-0.5 text-xs flex-shrink-0',
          isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
        )}>
          <CalendarIcon className="h-3 w-3" />
          {formatDate(task.dueDate, { month: 'short', day: 'numeric' })}
        </span>
      )}

      {/* Hours */}
      {task.estimatedHours != null && (
        <span className="inline-flex items-center gap-0.5 text-xs text-gray-400 flex-shrink-0">
          <ClockIcon className="h-3 w-3" />
          {task.actualHours ?? 0}/{task.estimatedHours}h
        </span>
      )}

      {/* Icons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {task.dependencies.length > 0 && (
          <span className="text-xs text-gray-400" title={`${task.dependencies.length} dependencies`}>
            <LinkIcon className="h-3.5 w-3.5" />
          </span>
        )}
        {task.attachments.length > 0 && (
          <span className="text-xs text-gray-400" title={`${task.attachments.length} files`}>
            <PaperClipIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      {/* Assignees */}
      {task.assignedTo.length > 0 && (
        <div className="flex -space-x-1 flex-shrink-0">
          {task.assignedTo.slice(0, 2).map((uid) => (
            <div key={uid} className="h-5 w-5 rounded-full bg-gray-300 border border-white flex items-center justify-center">
              <UserCircleIcon className="h-4 w-4 text-gray-600" />
            </div>
          ))}
          {task.assignedTo.length > 2 && (
            <div className="h-5 w-5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[10px] text-gray-600 font-medium">
              +{task.assignedTo.length - 2}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
