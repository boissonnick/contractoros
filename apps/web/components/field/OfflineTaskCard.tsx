'use client';

import { useState, useRef } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CloudArrowUpIcon,
  ChevronRightIcon,
  PlayIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { Task, TaskStatus } from '@/types';
import { getOfflineTaskService, TASK_STATUS_OPTIONS } from '@/lib/offline/offline-tasks';
import { useNetworkStatus } from '@/lib/offline/network-status';
import { logger } from '@/lib/utils/logger';

interface OfflineTaskCardProps {
  task: Task & { _pendingSync?: boolean };
  orgId: string;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onTap?: (task: Task) => void;
}

export function OfflineTaskCard({
  task,
  orgId,
  onStatusChange,
  onTap,
}: OfflineTaskCardProps) {
  const { isOnline } = useNetworkStatus();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Priority colors
  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-amber-100 text-amber-600',
    urgent: 'bg-red-100 text-red-600',
  };

  // Status colors
  const statusColors: Record<TaskStatus, string> = {
    pending: 'bg-gray-100 text-gray-700',
    assigned: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    blocked: 'bg-red-100 text-red-700',
    review: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
  };

  // Handle task completion
  const handleComplete = async () => {
    if (task.status === 'completed') return;

    setIsUpdating(true);
    try {
      const service = getOfflineTaskService();
      await service.updateTaskStatus(
        task.id,
        task.projectId,
        orgId,
        'completed',
        completionNotes || undefined
      );
      onStatusChange?.(task.id, 'completed');
      setShowNotes(false);
      setCompletionNotes('');
    } catch (error) {
      logger.error('Failed to complete task', { error: error, component: 'OfflineTaskCard' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (task.status === newStatus) return;

    setIsUpdating(true);
    try {
      const service = getOfflineTaskService();
      await service.updateTaskStatus(task.id, task.projectId, orgId, newStatus);
      onStatusChange?.(task.id, newStatus);
    } catch (error) {
      logger.error('Failed to update task status', { error: error, component: 'OfflineTaskCard' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Touch handlers for swipe-to-complete
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const diff = touchStartX.current - e.touches[0].clientX;
    // Only allow left swipe (positive diff) up to 100px
    if (diff > 0 && diff < 100) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 60 && task.status !== 'completed') {
      // Swipe threshold reached - show completion notes
      setShowNotes(true);
    }
    setSwipeOffset(0);
    touchStartX.current = null;
  };

  // Format due date
  const formatDueDate = (date?: Date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor(
      (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return { text: 'Overdue', className: 'text-red-600' };
    if (diffDays === 0) return { text: 'Today', className: 'text-amber-600' };
    if (diffDays === 1) return { text: 'Tomorrow', className: 'text-blue-600' };
    return {
      text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      className: 'text-gray-500',
    };
  };

  const dueInfo = formatDueDate(task.dueDate);
  const isCompleted = task.status === 'completed';

  return (
    <div className="relative overflow-hidden">
      {/* Swipe action indicator */}
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-end px-4 transition-colors ${
          swipeOffset > 60 ? 'bg-green-500' : 'bg-green-400'
        }`}
        style={{ width: `${Math.max(swipeOffset, 0)}px` }}
      >
        <CheckCircleIcon className="h-6 w-6 text-white" />
      </div>

      {/* Card content */}
      <div
        ref={cardRef}
        className={`relative bg-white border rounded-lg transition-transform ${
          isCompleted ? 'opacity-60' : ''
        }`}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="p-4 cursor-pointer active:bg-gray-50"
          onClick={() => !showNotes && onTap?.(task)}
        >
          {/* Header row */}
          <div className="flex items-start gap-3">
            {/* Completion checkbox */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isCompleted) {
                  setShowNotes(true);
                }
              }}
              disabled={isUpdating || isCompleted}
              className="flex-shrink-0 mt-0.5"
            >
              {isCompleted ? (
                <CheckCircleSolidIcon className="h-6 w-6 text-green-500" />
              ) : isUpdating ? (
                <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
              ) : (
                <div className="h-6 w-6 rounded-full border-2 border-gray-300 hover:border-green-400 transition-colors" />
              )}
            </button>

            {/* Task info */}
            <div className="flex-1 min-w-0">
              <h3
                className={`font-medium text-gray-900 ${
                  isCompleted ? 'line-through' : ''
                }`}
              >
                {task.title}
              </h3>

              {task.description && (
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Metadata row */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* Priority badge */}
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${
                    priorityColors[task.priority] || priorityColors.medium
                  }`}
                >
                  {task.priority}
                </span>

                {/* Status badge */}
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${
                    statusColors[task.status]
                  }`}
                >
                  {TASK_STATUS_OPTIONS.find((s) => s.value === task.status)?.label ||
                    task.status}
                </span>

                {/* Due date */}
                {dueInfo && (
                  <span className={`text-xs flex items-center gap-1 ${dueInfo.className}`}>
                    <ClockIcon className="h-3 w-3" />
                    {dueInfo.text}
                  </span>
                )}

                {/* Pending sync indicator */}
                {task._pendingSync && (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <CloudArrowUpIcon className="h-3 w-3" />
                    Pending
                  </span>
                )}
              </div>
            </div>

            {/* Arrow indicator */}
            <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        {/* Quick actions */}
        {!isCompleted && !showNotes && (
          <div className="flex border-t divide-x">
            <button
              type="button"
              onClick={() => handleStatusChange('in_progress')}
              disabled={isUpdating || task.status === 'in_progress'}
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 ${
                task.status === 'in_progress'
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <PlayIcon className="h-4 w-4" />
              Start
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('blocked')}
              disabled={isUpdating || task.status === 'blocked'}
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 ${
                task.status === 'blocked'
                  ? 'bg-red-50 text-red-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ExclamationCircleIcon className="h-4 w-4" />
              Blocked
            </button>
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              disabled={isUpdating}
              className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Done
            </button>
          </div>
        )}

        {/* Completion notes input */}
        {showNotes && (
          <div className="border-t p-3 bg-gray-50">
            <div className="flex items-start gap-2">
              <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Add completion notes (optional)..."
                  rows={2}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotes(false);
                      setCompletionNotes('');
                    }}
                    className="flex-1 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isUpdating}
                    className="flex-1 px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isUpdating ? (
                      'Saving...'
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Complete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            {!isOnline && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <CloudArrowUpIcon className="h-4 w-4" />
                Will sync when back online
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OfflineTaskCard;
