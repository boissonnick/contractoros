"use client";

import React from 'react';
import { TaskActivity, TaskActivityAction } from '@/types';
import { useTaskActivity } from '@/lib/hooks/useTaskActivity';
import {
  PlusCircleIcon,
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  UserPlusIcon,
  UserMinusIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  LinkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const actionConfig: Record<TaskActivityAction, { icon: React.ElementType; label: string; color: string }> = {
  created: { icon: PlusCircleIcon, label: 'created this task', color: 'text-green-500' },
  updated: { icon: ArrowPathIcon, label: 'updated this task', color: 'text-blue-500' },
  status_changed: { icon: ArrowsRightLeftIcon, label: 'changed status', color: 'text-purple-500' },
  assigned: { icon: UserPlusIcon, label: 'assigned', color: 'text-blue-500' },
  unassigned: { icon: UserMinusIcon, label: 'unassigned', color: 'text-gray-500' },
  commented: { icon: ChatBubbleLeftIcon, label: 'commented', color: 'text-gray-600' },
  attachment_added: { icon: PaperClipIcon, label: 'added an attachment', color: 'text-blue-500' },
  attachment_removed: { icon: PaperClipIcon, label: 'removed an attachment', color: 'text-red-500' },
  dependency_added: { icon: LinkIcon, label: 'added a dependency', color: 'text-blue-500' },
  dependency_removed: { icon: LinkIcon, label: 'removed a dependency', color: 'text-red-500' },
  completed: { icon: CheckCircleIcon, label: 'completed this task', color: 'text-green-600' },
};

function formatChanges(changes?: Record<string, { from: unknown; to: unknown }>): string {
  if (!changes) return '';
  return Object.entries(changes)
    .map(([key, { from, to }]) => `${key}: ${String(from)} → ${String(to)}`)
    .join(', ');
}

interface TaskActivityLogProps {
  taskId: string;
  limit?: number;
}

export default function TaskActivityLog({ taskId, limit = 50 }: TaskActivityLogProps) {
  const { activities, loading, error } = useTaskActivity(taskId, limit);

  if (loading) {
    return <div className="text-sm text-gray-400 py-4">Loading activity...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500 py-4">Error loading activity.</div>;
  }

  if (activities.length === 0) {
    return <p className="text-sm text-gray-400">No activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const config = actionConfig[activity.action] || actionConfig.updated;
        const Icon = config.icon;
        const changeText = formatChanges(activity.changes);

        return (
          <div key={activity.id} className="flex gap-3 items-start">
            <div className={`mt-0.5 ${config.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">{activity.userName}</span>
                {' '}{config.label}
                {changeText && (
                  <span className="text-gray-500"> — {changeText}</span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(activity.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
