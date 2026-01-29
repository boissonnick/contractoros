"use client";

import React, { useMemo, useState } from 'react';
import { Task, TaskStatus, ProjectPhase } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import TaskListRow from './TaskListRow';

export type GroupBy = 'phase' | 'status' | 'priority' | 'none';
export type SortBy = 'dueDate' | 'priority' | 'createdAt' | 'title';

const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const statusLabels: Record<string, string> = {
  pending: 'To Do',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  review: 'Review',
  completed: 'Done',
};

interface TaskListProps {
  tasks: Task[];
  phases?: ProjectPhase[];
  groupBy?: GroupBy;
  sortBy?: SortBy;
  sortOrder?: 'asc' | 'desc';
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export default function TaskList({
  tasks,
  phases = [],
  groupBy = 'phase',
  sortBy = 'dueDate',
  sortOrder = 'asc',
  onTaskClick,
  onStatusChange,
}: TaskListProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'dueDate': {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          cmp = aDate - bDate;
          break;
        }
        case 'priority':
          cmp = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [tasks, sortBy, sortOrder]);

  const groups = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', label: 'All Tasks', tasks: sortedTasks }];
    }

    const map = new Map<string, { label: string; tasks: Task[] }>();

    for (const task of sortedTasks) {
      let key: string;
      let label: string;

      switch (groupBy) {
        case 'phase': {
          key = task.phaseId || '__none__';
          const phase = phases.find((p) => p.id === task.phaseId);
          label = phase?.name || 'No Phase';
          break;
        }
        case 'status':
          key = task.status;
          label = statusLabels[task.status] || task.status;
          break;
        case 'priority':
          key = task.priority;
          label = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
          break;
        default:
          key = 'all';
          label = 'All Tasks';
      }

      if (!map.has(key)) {
        map.set(key, { label, tasks: [] });
      }
      map.get(key)!.tasks.push(task);
    }

    return Array.from(map.entries()).map(([key, val]) => ({
      key,
      label: val.label,
      tasks: val.tasks,
    }));
  }, [sortedTasks, groupBy, phases]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.key);
        return (
          <div key={group.key}>
            {/* Group header */}
            {groupBy !== 'none' && (
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 hover:bg-gray-100 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-700">{group.label}</span>
                <span className="text-xs text-gray-400">({group.tasks.length})</span>
              </button>
            )}

            {/* Task rows */}
            {!isCollapsed &&
              group.tasks.map((task) => {
                const taskPhase = phases.find((p) => p.id === task.phaseId);
                return (
                  <TaskListRow
                    key={task.id}
                    task={task}
                    onClick={onTaskClick}
                    onStatusChange={onStatusChange}
                    phaseName={taskPhase?.name}
                  />
                );
              })}
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          No tasks found
        </div>
      )}
    </div>
  );
}
