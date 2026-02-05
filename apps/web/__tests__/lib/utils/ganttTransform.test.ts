/**
 * Tests for ganttTransform utility functions
 * Tests tasksToGanttData and findTaskById
 */

// Mock dependencies so the module can be imported
jest.mock('@/types', () => ({}));
jest.mock('frappe-gantt', () => ({}));

import { tasksToGanttData, findTaskById } from '@/lib/utils/ganttTransform';

// Helper to create mock Task objects with minimal required fields
const mockTask = (overrides: Record<string, unknown> = {}) => ({
  id: 'task-1',
  title: 'Test Task',
  status: 'pending' as const,
  priority: 'medium' as const,
  startDate: '2025-01-15',
  dueDate: '2025-01-20',
  duration: undefined as number | undefined,
  estimatedHours: undefined as number | undefined,
  actualHours: undefined as number | undefined,
  completedAt: undefined as string | undefined,
  dependencies: [] as Array<{ taskId: string }>,
  ...overrides,
});

// Helper to format a Date the same way the source does
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

describe('tasksToGanttData', () => {
  it('returns an empty array for empty input', () => {
    const result = tasksToGanttData([]);
    expect(result).toEqual([]);
  });

  it('maps task with start and due dates correctly', () => {
    const task = mockTask({
      id: 'task-1',
      title: 'Build Foundation',
      startDate: '2025-01-15',
      dueDate: '2025-01-20',
      priority: 'high',
    });

    const result = tasksToGanttData([task as never]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('task-1');
    expect(result[0].name).toBe('Build Foundation');
    // Source uses new Date(dateString) then local-time formatDate,
    // so expected values must account for local timezone offset
    expect(result[0].start).toBe(formatDate(new Date('2025-01-15')));
    expect(result[0].end).toBe(formatDate(new Date('2025-01-20')));
  });

  it('defaults start date to today when no startDate provided', () => {
    const task = mockTask({
      startDate: undefined,
      dueDate: '2025-02-01',
    });

    const result = tasksToGanttData([task as never]);
    const todayStr = formatDate(new Date());
    expect(result[0].start).toBe(todayStr);
  });

  it('defaults end to today when no dates at all', () => {
    const task = mockTask({
      startDate: undefined,
      dueDate: undefined,
      duration: undefined,
    });

    const result = tasksToGanttData([task as never]);
    const today = new Date();
    const todayStr = formatDate(today);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 3);
    const expectedEnd = formatDate(endDate);

    expect(result[0].start).toBe(todayStr);
    expect(result[0].end).toBe(expectedEnd);
  });

  it('calculates end from duration when dueDate is missing', () => {
    const task = mockTask({
      startDate: '2025-03-01',
      dueDate: undefined,
      duration: 7,
    });

    const result = tasksToGanttData([task as never]);
    const expectedEnd = new Date('2025-03-01');
    expectedEnd.setDate(expectedEnd.getDate() + 7);

    expect(result[0].end).toBe(formatDate(expectedEnd));
  });

  it('defaults to start + 3 days when no dueDate or duration', () => {
    const task = mockTask({
      startDate: '2025-04-10',
      dueDate: undefined,
      duration: undefined,
    });

    const result = tasksToGanttData([task as never]);
    const expectedEnd = new Date('2025-04-10');
    expectedEnd.setDate(expectedEnd.getDate() + 3);

    expect(result[0].end).toBe(formatDate(expectedEnd));
  });

  // --- Status / Progress Tests ---

  it('sets progress to 100 for completed tasks with completedAt', () => {
    const task = mockTask({
      status: 'completed',
      completedAt: '2025-01-18T12:00:00Z',
    });

    const result = tasksToGanttData([task as never]);
    expect(result).toHaveLength(1);
    expect(result[0].progress).toBe(100);
  });

  it('filters out completed tasks without completedAt', () => {
    const task = mockTask({
      status: 'completed',
      completedAt: undefined,
    });

    const result = tasksToGanttData([task as never]);
    expect(result).toHaveLength(0);
  });

  it('sets progress to 40 for in_progress without hours', () => {
    const task = mockTask({
      status: 'in_progress',
      estimatedHours: undefined,
      actualHours: undefined,
    });

    const result = tasksToGanttData([task as never]);
    expect(result[0].progress).toBe(40);
  });

  it('sets progress to 80 for review without hours', () => {
    const task = mockTask({
      status: 'review',
      estimatedHours: undefined,
      actualHours: undefined,
    });

    const result = tasksToGanttData([task as never]);
    expect(result[0].progress).toBe(80);
  });

  it('calculates progress from hours for in_progress, capped at 99', () => {
    const task = mockTask({
      status: 'in_progress',
      estimatedHours: 10,
      actualHours: 8,
    });

    const result = tasksToGanttData([task as never]);
    // (8 / 10) * 100 = 80, min(80, 99) = 80
    expect(result[0].progress).toBe(80);
  });

  it('caps calculated progress at 99 for in_progress', () => {
    const task = mockTask({
      status: 'in_progress',
      estimatedHours: 5,
      actualHours: 10,
    });

    const result = tasksToGanttData([task as never]);
    // (10 / 5) * 100 = 200, min(200, 99) = 99
    expect(result[0].progress).toBe(99);
  });

  it('calculates progress from hours for review status', () => {
    const task = mockTask({
      status: 'review',
      estimatedHours: 20,
      actualHours: 15,
    });

    const result = tasksToGanttData([task as never]);
    // (15 / 20) * 100 = 75, min(75, 99) = 75
    expect(result[0].progress).toBe(75);
  });

  it('sets progress to 10 for assigned status', () => {
    const task = mockTask({ status: 'assigned' });

    const result = tasksToGanttData([task as never]);
    expect(result[0].progress).toBe(10);
  });

  it('sets progress to 0 for pending status', () => {
    const task = mockTask({ status: 'pending' });

    const result = tasksToGanttData([task as never]);
    expect(result[0].progress).toBe(0);
  });

  // --- Dependencies ---

  it('joins dependencies with comma and space', () => {
    const task = mockTask({
      dependencies: [{ taskId: 'dep-1' }, { taskId: 'dep-2' }, { taskId: 'dep-3' }],
    });

    const result = tasksToGanttData([task as never]);
    expect(result[0].dependencies).toBe('dep-1, dep-2, dep-3');
  });

  it('sets dependencies to undefined when empty', () => {
    const task = mockTask({ dependencies: [] });

    const result = tasksToGanttData([task as never]);
    expect(result[0].dependencies).toBeUndefined();
  });

  // --- Priority / Custom Class ---

  it('sets custom_class based on priority', () => {
    const highTask = mockTask({ id: 'h', priority: 'high' });
    const lowTask = mockTask({ id: 'l', priority: 'low' });
    const urgentTask = mockTask({ id: 'u', priority: 'urgent' });

    const result = tasksToGanttData([highTask as never, lowTask as never, urgentTask as never]);
    expect(result[0].custom_class).toBe('gantt-priority-high');
    expect(result[1].custom_class).toBe('gantt-priority-low');
    expect(result[2].custom_class).toBe('gantt-priority-urgent');
  });

  // --- Multiple Tasks ---

  it('handles multiple tasks correctly', () => {
    const tasks = [
      mockTask({ id: 'task-1', title: 'Task One', status: 'pending' }),
      mockTask({ id: 'task-2', title: 'Task Two', status: 'in_progress' }),
      mockTask({ id: 'task-3', title: 'Task Three', status: 'completed', completedAt: '2025-01-19' }),
    ];

    const result = tasksToGanttData(tasks as never[]);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('task-1');
    expect(result[1].id).toBe('task-2');
    expect(result[2].id).toBe('task-3');
  });

  it('filters completed tasks without completedAt from a mixed list', () => {
    const tasks = [
      mockTask({ id: 'task-1', status: 'pending' }),
      mockTask({ id: 'task-2', status: 'completed', completedAt: undefined }),
      mockTask({ id: 'task-3', status: 'in_progress' }),
    ];

    const result = tasksToGanttData(tasks as never[]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['task-1', 'task-3']);
  });
});

describe('findTaskById', () => {
  const tasks = [
    mockTask({ id: 'task-1', title: 'First' }),
    mockTask({ id: 'task-2', title: 'Second' }),
    mockTask({ id: 'task-3', title: 'Third' }),
  ];

  it('returns the matching task when found', () => {
    const result = findTaskById(tasks as never[], 'task-2');
    expect(result).toBeDefined();
    expect((result as ReturnType<typeof mockTask>).id).toBe('task-2');
    expect((result as ReturnType<typeof mockTask>).title).toBe('Second');
  });

  it('returns undefined when task is not found', () => {
    const result = findTaskById(tasks as never[], 'task-99');
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    const result = findTaskById([], 'task-1');
    expect(result).toBeUndefined();
  });
});
