'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  ArrowPathIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { usePaginatedTasks } from '@/lib/hooks/useTasks';
import { LoadMore } from '@/components/ui/LoadMore';
import { PageHeader } from '@/components/ui/PageHeader';
import { TaskStatus, TaskPriority } from '@/types';

// Priority badge colors
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

// Status badge colors
const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  assigned: 'bg-blue-100 text-blue-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  blocked: 'bg-red-100 text-red-700',
  review: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  review: 'Review',
  completed: 'Completed',
};

type FilterOption = 'all' | 'my_tasks' | TaskStatus;

/**
 * Tasks Overview Page - Demonstrates usePaginatedTasks with LoadMore
 *
 * Shows all tasks across the organization with filtering and pagination.
 * This is an example implementation of the paginated tasks pattern.
 */
export default function TasksOverviewPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const orgId = profile?.orgId;
  const userId = profile?.uid;

  // Filter state
  const [filter, setFilter] = useState<FilterOption>('all');

  // Determine status filter
  const statusFilter = useMemo(() => {
    if (filter === 'all' || filter === 'my_tasks') return undefined;
    return filter as TaskStatus;
  }, [filter]);

  // Determine assignee filter
  const assigneeFilter = useMemo(() => {
    if (filter === 'my_tasks') return userId;
    return undefined;
  }, [filter, userId]);

  // Fetch paginated tasks
  const {
    tasks,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalLoaded,
    initialized,
    moveTask,
  } = usePaginatedTasks(orgId, {
    status: statusFilter,
    assigneeId: assigneeFilter,
    pageSize: 25,
  });

  // Navigate to task detail
  const handleTaskClick = (task: { id: string; projectId: string }) => {
    router.push(`/dashboard/projects/${task.projectId}/tasks?taskId=${task.id}`);
  };

  // Quick status change
  const handleQuickComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await moveTask(taskId, 'completed');
  };

  // Format date
  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if task is overdue
  const isOverdue = (dueDate?: Date) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Tasks"
        description="View and manage tasks across all projects"
        actions={
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        <FilterTab
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          icon={<ListBulletIcon className="h-4 w-4" />}
          label="All"
        />
        <FilterTab
          active={filter === 'my_tasks'}
          onClick={() => setFilter('my_tasks')}
          icon={<FunnelIcon className="h-4 w-4" />}
          label="My Tasks"
        />
        <FilterTab
          active={filter === 'pending'}
          onClick={() => setFilter('pending')}
          icon={<ClockIcon className="h-4 w-4" />}
          label="Pending"
        />
        <FilterTab
          active={filter === 'in_progress'}
          onClick={() => setFilter('in_progress')}
          icon={<ExclamationCircleIcon className="h-4 w-4" />}
          label="In Progress"
        />
        <FilterTab
          active={filter === 'completed'}
          onClick={() => setFilter('completed')}
          icon={<CheckCircleIcon className="h-4 w-4" />}
          label="Completed"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading state (initial) */}
      {!initialized && loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Empty state */}
      {initialized && tasks.length === 0 && (
        <div className="text-center py-12">
          <ListBulletIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tasks found</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === 'my_tasks'
              ? 'No tasks assigned to you'
              : filter !== 'all'
                ? `No ${STATUS_LABELS[filter as TaskStatus].toLowerCase()} tasks`
                : 'Create a task in a project to get started'}
          </p>
        </div>
      )}

      {/* Task list */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {/* Quick complete button */}
              {task.status !== 'completed' && (
                <button
                  onClick={(e) => handleQuickComplete(task.id, e)}
                  className="flex-shrink-0 p-1.5 rounded-full border border-gray-300 hover:border-green-500 hover:bg-green-50 transition-colors"
                  title="Mark as completed"
                >
                  <CheckCircleIcon className="h-4 w-4 text-gray-400 hover:text-green-600" />
                </button>
              )}
              {task.status === 'completed' && (
                <div className="flex-shrink-0 p-1.5 rounded-full bg-green-100">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                </div>
              )}

              {/* Task info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-medium truncate ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  {task.priority && task.priority !== 'medium' && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Status */}
              <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                {STATUS_LABELS[task.status]}
              </span>

              {/* Due date */}
              <div className="flex-shrink-0 text-right w-20">
                {task.dueDate && (
                  <span className={`text-xs ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {initialized && tasks.length > 0 && (
        <LoadMore
          hasMore={hasMore}
          loading={loading}
          onLoadMore={loadMore}
          itemCount={totalLoaded}
        />
      )}
    </div>
  );
}

// Filter tab component
function FilterTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:bg-gray-100 border border-transparent'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
