"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Task } from '@/types';
import type { GanttTask } from 'frappe-gantt';
import { tasksToGanttData, findTaskById } from '@/lib/utils/ganttTransform';
import GanttChart from './GanttChart';
import GanttToolbar, { GanttViewMode } from './GanttToolbar';

interface TaskGanttProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDateChange?: (taskId: string, start: Date, end: Date) => Promise<void>;
}

export default function TaskGantt({ tasks, onTaskClick, onDateChange }: TaskGanttProps) {
  const [viewMode, setViewMode] = useState<GanttViewMode>('Week');

  const ganttTasks = useMemo(() => tasksToGanttData(tasks), [tasks]);

  const handleTaskClick = useCallback(
    (ganttTask: GanttTask) => {
      const task = findTaskById(tasks, ganttTask.id);
      if (task) onTaskClick(task);
    },
    [tasks, onTaskClick]
  );

  const handleDateChange = useCallback(
    (ganttTask: GanttTask, start: Date, end: Date) => {
      if (onDateChange) {
        onDateChange(ganttTask.id, start, end);
      }
    },
    [onDateChange]
  );

  return (
    <div>
      <GanttToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        taskCount={ganttTasks.length}
      />
      <GanttChart
        tasks={ganttTasks}
        viewMode={viewMode}
        onTaskClick={handleTaskClick}
        onDateChange={handleDateChange}
      />
    </div>
  );
}
