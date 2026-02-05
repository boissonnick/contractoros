'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { Widget } from '@/lib/dashboard-widgets/types';
import { useAuth } from '@/lib/auth';
import { useFirestoreCollection } from '@/lib/hooks/useFirestoreCollection';
import { Task, TaskPriority } from '@/types';
import { where, orderBy, Timestamp, DocumentData } from 'firebase/firestore';

interface TasksWidgetProps {
  widget: Widget;
}

// Priority colors
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-gray-200',
  medium: 'bg-blue-200',
  high: 'bg-orange-200',
  urgent: 'bg-red-300',
};

export function TasksWidget({ widget }: TasksWidgetProps) {
  const router = useRouter();
  const { profile } = useAuth();

  const limit = (widget.config.limit as number) || 5;
  const daysAhead = (widget.config.daysAhead as number) || 7;

  // Calculate future date for query
  const futureDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date;
  }, [daysAhead]);

  // Fetch tasks with due dates - we'll query all org tasks with upcoming due dates
  const { items: tasks, loading } = useFirestoreCollection<Task>({
    path: profile?.orgId ? `organizations/${profile.orgId}/tasks` : '',
    constraints: [
      where('dueDate', '<=', Timestamp.fromDate(futureDate)),
      where('dueDate', '>=', Timestamp.fromDate(new Date())),
      orderBy('dueDate', 'asc'),
    ],
    converter: (id: string, data: DocumentData) => ({
      id,
      ...data,
      dueDate: data.dueDate?.toDate?.() || null,
      startDate: data.startDate?.toDate?.() || null,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    } as Task),
    enabled: !!profile?.orgId,
  });

  // Filter and sort upcoming tasks
  const upcomingTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks
      .filter((task) => {
        // Only include pending/in-progress tasks
        if (task.status === 'completed') {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by due date, then priority
        if (a.dueDate && b.dueDate) {
          const dateDiff = a.dueDate.getTime() - b.dueDate.getTime();
          if (dateDiff !== 0) return dateDiff;
        }
        // Higher priority first
        const priorityOrder: Record<TaskPriority, number> = {
          urgent: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, limit);
  }, [tasks, limit]);

  // Format date relative to today
  const formatDueDate = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (taskDate.getTime() === today.getTime()) {
      return 'Today';
    }
    if (taskDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }

    const daysUntil = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle task click
  const handleTaskClick = (task: Task) => {
    router.push(`/dashboard/projects/${task.projectId}/tasks?taskId=${task.id}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-gray-200 mt-2" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (upcomingTasks.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">No upcoming tasks</p>
        <p className="text-xs text-gray-400 mt-1">
          Tasks due in the next {daysAhead} days will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {upcomingTasks.map((task) => (
        <button
          key={task.id}
          onClick={() => handleTaskClick(task)}
          className="w-full text-left p-2 -mx-2 rounded-md hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-start gap-2">
            {/* Priority indicator */}
            <div
              className={`h-2 w-2 rounded-full mt-1.5 ${PRIORITY_COLORS[task.priority]}`}
              title={task.priority}
            />

            <div className="flex-1 min-w-0">
              {/* Task title */}
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {task.title}
              </p>

              {/* Meta info */}
              <div className="flex items-center gap-3 mt-1">
                {/* Due date */}
                {task.dueDate && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <CalendarIcon className="h-3 w-3" />
                    {formatDueDate(task.dueDate)}
                  </span>
                )}

                {/* Assignee count */}
                {task.assignedTo && task.assignedTo.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <UserIcon className="h-3 w-3" />
                    {task.assignedTo.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}

      {/* View all link */}
      <button
        onClick={() => router.push('/dashboard/projects')}
        className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium pt-2 mt-2 border-t border-gray-100"
      >
        View all tasks
      </button>
    </div>
  );
}

export default TasksWidget;
