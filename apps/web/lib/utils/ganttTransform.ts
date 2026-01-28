import { Task } from '@/types';
import type { GanttTask } from 'frappe-gantt';

/**
 * Convert our Task[] to frappe-gantt's GanttTask[] format.
 * Tasks without dates get sensible defaults.
 */
export function tasksToGanttData(tasks: Task[]): GanttTask[] {
  const today = new Date();
  const todayStr = formatDate(today);

  return tasks
    .filter((t) => t.status !== 'completed' || t.completedAt) // include completed if they have dates
    .map((task) => {
      const start = task.startDate
        ? formatDate(new Date(task.startDate))
        : todayStr;

      let end: string;
      if (task.dueDate) {
        end = formatDate(new Date(task.dueDate));
      } else if (task.duration) {
        const endDate = new Date(task.startDate || today);
        endDate.setDate(endDate.getDate() + task.duration);
        end = formatDate(endDate);
      } else {
        // Default: 3 days from start
        const endDate = new Date(task.startDate || today);
        endDate.setDate(endDate.getDate() + 3);
        end = formatDate(endDate);
      }

      // Calculate progress
      let progress = 0;
      if (task.status === 'completed') {
        progress = 100;
      } else if (task.status === 'in_progress' || task.status === 'review') {
        if (task.estimatedHours && task.actualHours) {
          progress = Math.min(Math.round((task.actualHours / task.estimatedHours) * 100), 99);
        } else {
          progress = task.status === 'review' ? 80 : 40;
        }
      } else if (task.status === 'assigned') {
        progress = 10;
      }

      // Build dependency string (only finish-to-start for Gantt arrows)
      const dependencies = task.dependencies
        .map((d) => d.taskId)
        .join(', ');

      // Custom class for priority styling
      const custom_class = `gantt-priority-${task.priority}`;

      return {
        id: task.id,
        name: task.title,
        start,
        end,
        progress,
        dependencies: dependencies || undefined,
        custom_class,
      };
    });
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Find a task ID from a Gantt task click.
 */
export function findTaskById(tasks: Task[], ganttTaskId: string): Task | undefined {
  return tasks.find((t) => t.id === ganttTaskId);
}
