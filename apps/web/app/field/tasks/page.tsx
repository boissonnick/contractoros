'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeftIcon,
  ArrowPathIcon,
  CloudIcon,
  CloudArrowUpIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { useNetworkStatus } from '@/lib/offline/network-status';
import { useTasks } from '@/lib/hooks/useTasks';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { Project } from '@/types';
import {
  getOfflineTaskService,
} from '@/lib/offline/offline-tasks';
import { OfflineTaskCard } from '@/components/field/OfflineTaskCard';
import { Task, TaskStatus } from '@/types';

type FilterStatus = 'all' | 'my_tasks' | 'pending' | 'in_progress' | 'completed';

export default function FieldTasksPage() {
  const { profile, loading: authLoading } = useAuth();
  const { isOnline } = useNetworkStatus();
  const router = useRouter();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('my_tasks');
  const [pendingCount, setPendingCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cachedTasks, setCachedTasks] = useState<Task[]>([]);

  const orgId = profile?.orgId || '';
  const userId = profile?.uid || '';

  // Fetch projects
  const { data: projectsData = [] } = useProjects();
  const projects = projectsData as Project[];

  // Fetch tasks for selected project (when online)
  const { tasks: onlineTasks, loading: tasksLoading } = useTasks({
    projectId: selectedProjectId || 'none',
  });

  // Cache tasks for offline use
  useEffect(() => {
    if (isOnline && onlineTasks.length > 0) {
      const service = getOfflineTaskService();
      service.cacheTasks(onlineTasks).catch(console.error);
    }
  }, [isOnline, onlineTasks]);

  // Subscribe to pending count
  useEffect(() => {
    const service = getOfflineTaskService();
    return service.subscribeToPendingCount(setPendingCount);
  }, []);

  // Get tasks (merge online with offline updates)
  useEffect(() => {
    async function loadTasks() {
      if (!orgId) return;

      const service = getOfflineTaskService();

      // If online, use online tasks; if offline, use cached tasks
      if (isOnline && onlineTasks.length > 0) {
        // Apply pending updates to online tasks
        const pendingUpdates = await service.getPendingUpdates();
        const mergedTasks = onlineTasks.map((task) => {
          const update = pendingUpdates.find((u) => u.taskId === task.id);
          if (update) {
            return {
              ...task,
              status: update.updates.status || task.status,
              completedAt: update.updates.completedAt
                ? new Date(update.updates.completedAt)
                : task.completedAt,
              _pendingSync: true,
            } as Task & { _pendingSync?: boolean };
          }
          return task;
        });
        setCachedTasks(mergedTasks);
      } else if (selectedProjectId) {
        // Offline - get cached tasks
        const tasks = await service.getTasks(orgId, selectedProjectId);
        setCachedTasks(tasks);
      }
    }

    loadTasks();
  }, [orgId, selectedProjectId, isOnline, onlineTasks]);

  // Filter tasks
  const filteredTasks = cachedTasks.filter((task) => {
    if (filterStatus === 'my_tasks') {
      return task.assignedTo?.includes(userId);
    }
    if (filterStatus === 'pending') {
      return task.status === 'pending' || task.status === 'assigned';
    }
    if (filterStatus === 'in_progress') {
      return task.status === 'in_progress' || task.status === 'blocked';
    }
    if (filterStatus === 'completed') {
      return task.status === 'completed';
    }
    return true;
  });

  // Handle task status change
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setCachedTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completedAt: newStatus === 'completed' ? new Date() : t.completedAt,
              _pendingSync: true,
            }
          : t
      )
    );
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger re-fetch by toggling project
      const currentProject = selectedProjectId;
      if (currentProject) {
        setSelectedProjectId('');
        setTimeout(() => setSelectedProjectId(currentProject), 100);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Task counts by status
  const taskCounts = {
    total: cachedTasks.length,
    myTasks: cachedTasks.filter((t) => t.assignedTo?.includes(userId)).length,
    pending: cachedTasks.filter(
      (t) => t.status === 'pending' || t.status === 'assigned'
    ).length,
    inProgress: cachedTasks.filter(
      (t) => t.status === 'in_progress' || t.status === 'blocked'
    ).length,
    completed: cachedTasks.filter((t) => t.status === 'completed').length,
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold font-heading tracking-tight">My Tasks</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 -mr-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowPathIcon
              className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Network status */}
        <div
          className={`px-4 py-2 text-sm flex items-center gap-2 ${
            isOnline
              ? 'bg-green-50 text-green-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {isOnline ? (
            <>
              <CloudIcon className="h-4 w-4" />
              <span>Online</span>
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="h-4 w-4" />
              <span>Offline mode</span>
            </>
          )}
          {pendingCount > 0 && (
            <span className="ml-auto bg-amber-200 px-2 py-0.5 rounded-full text-xs font-medium">
              {pendingCount} pending sync
            </span>
          )}
        </div>

        {/* Project selector */}
        <div className="px-4 py-3 border-t bg-gray-50">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20"
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter tabs */}
      {selectedProjectId && (
        <div className="px-4 py-3 bg-white border-b overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <FilterButton
              active={filterStatus === 'my_tasks'}
              onClick={() => setFilterStatus('my_tasks')}
              icon={<ListBulletIcon className="h-4 w-4" />}
              label="My Tasks"
              count={taskCounts.myTasks}
            />
            <FilterButton
              active={filterStatus === 'pending'}
              onClick={() => setFilterStatus('pending')}
              icon={<ClockIcon className="h-4 w-4" />}
              label="Pending"
              count={taskCounts.pending}
            />
            <FilterButton
              active={filterStatus === 'in_progress'}
              onClick={() => setFilterStatus('in_progress')}
              icon={<ExclamationCircleIcon className="h-4 w-4" />}
              label="In Progress"
              count={taskCounts.inProgress}
            />
            <FilterButton
              active={filterStatus === 'completed'}
              onClick={() => setFilterStatus('completed')}
              icon={<CheckCircleIcon className="h-4 w-4" />}
              label="Done"
              count={taskCounts.completed}
            />
            <FilterButton
              active={filterStatus === 'all'}
              onClick={() => setFilterStatus('all')}
              icon={<FunnelIcon className="h-4 w-4" />}
              label="All"
              count={taskCounts.total}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="p-4 space-y-3">
        {!selectedProjectId ? (
          <div className="text-center py-12">
            <ListBulletIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Select a project to view tasks</p>
          </div>
        ) : tasksLoading && isOnline ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
            <p className="text-gray-500 mt-3">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tasks found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filterStatus === 'my_tasks'
                ? 'No tasks assigned to you'
                : `No ${filterStatus.replace('_', ' ')} tasks`}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <OfflineTaskCard
              key={task.id}
              task={task}
              orgId={orgId}
              onStatusChange={handleStatusChange}
              onTap={(t) => {
                // Could navigate to task detail
                console.log('Task tapped:', t.id);
              }}
            />
          ))
        )}
      </div>

      {/* Quick stats */}
      {selectedProjectId && filteredTasks.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4">
          <div className="bg-white rounded-xl shadow-lg border p-3 flex items-center justify-around text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {taskCounts.completed}
              </div>
              <div className="text-xs text-gray-500">Done</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {taskCounts.inProgress}
              </div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div>
              <div className="text-lg font-bold text-gray-600">
                {taskCounts.pending}
              </div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Filter button component
function FilterButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-primary text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
          active ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
