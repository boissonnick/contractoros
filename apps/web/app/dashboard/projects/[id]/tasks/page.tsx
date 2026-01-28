"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { Task, TaskStatus, ProjectPhase } from '@/types';
import { useTasks } from '@/lib/hooks/useTasks';
import { Button } from '@/components/ui';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

import TaskViewToggle, { TaskView } from '@/components/projects/tasks/TaskViewToggle';
import TaskFilters, { TaskFilterState, emptyFilters } from '@/components/projects/tasks/TaskFilters';
import TaskKanban from '@/components/projects/tasks/kanban/TaskKanban';
import TaskList from '@/components/projects/tasks/list/TaskList';
import TaskListToolbar from '@/components/projects/tasks/list/TaskListToolbar';
import { GroupBy, SortBy } from '@/components/projects/tasks/list/TaskList';
import TaskGantt from '@/components/projects/tasks/gantt/TaskGantt';
import { TaskDetailModal } from '@/components/tasks';
import TaskForm from '@/components/tasks/TaskForm';

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params.id as string;

  // Data
  const { tasks, loading, addTask, updateTask, deleteTask, moveTask } = useTasks({ projectId });
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [phasesLoading, setPhasesLoading] = useState(true);

  // UI state
  const [view, setView] = useState<TaskView>('kanban');
  const [filters, setFilters] = useState<TaskFilterState>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // List view state
  const [groupBy, setGroupBy] = useState<GroupBy>('phase');
  const [sortBy, setSortBy] = useState<SortBy>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch phases
  useEffect(() => {
    async function fetchPhases() {
      try {
        const snap = await getDocs(collection(db, 'projects', projectId, 'phases'));
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as ProjectPhase)
          .sort((a, b) => a.order - b.order);
        setPhases(data);
      } catch (err) {
        console.error('Error fetching phases:', err);
      } finally {
        setPhasesLoading(false);
      }
    }
    fetchPhases();
  }, [projectId]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.status.length > 0 && !filters.status.includes(task.status)) return false;
      if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) return false;
      if (filters.phaseId && task.phaseId !== filters.phaseId) return false;
      if (filters.trade && task.trade !== filters.trade) return false;
      if (filters.assignedTo.length > 0 && !filters.assignedTo.some((uid) => task.assignedTo.includes(uid))) return false;
      return true;
    });
  }, [tasks, filters]);

  // Collect unique trades for filter
  const trades = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => { if (t.trade) set.add(t.trade); });
    return Array.from(set).sort();
  }, [tasks]);

  const handleAddTask = useCallback(
    async (data: Parameters<typeof addTask>[0]) => {
      await addTask(data);
      setShowAddTask(false);
    },
    [addTask]
  );

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      moveTask(taskId, status);
    },
    [moveTask]
  );

  if (loading || phasesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <TaskViewToggle active={view} onChange={setView} />

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showFilters ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </button>

          {view === 'list' && (
            <TaskListToolbar
              groupBy={groupBy}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onGroupByChange={setGroupBy}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowAddTask(true)}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <TaskFilters
          filters={filters}
          onChange={setFilters}
          phases={phases}
          trades={trades}
        />
      )}

      {/* View */}
      {view === 'kanban' && (
        <TaskKanban
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onMoveTask={moveTask}
        />
      )}

      {view === 'list' && (
        <TaskList
          tasks={filteredTasks}
          phases={phases}
          groupBy={groupBy}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onTaskClick={handleTaskClick}
          onStatusChange={handleStatusChange}
        />
      )}

      {view === 'gantt' && (
        <TaskGantt
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onDateChange={async (taskId, start, end) => {
            await updateTask(taskId, { startDate: start, dueDate: end });
          }}
        />
      )}

      {/* Add task modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Task</h3>
            <TaskForm
              projectId={projectId}
              phases={phases}
              allTasks={tasks}
              onSubmit={handleAddTask}
              onCancel={() => setShowAddTask(false)}
            />
          </div>
        </div>
      )}

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={projectId}
          phases={phases}
          allTasks={tasks}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}
