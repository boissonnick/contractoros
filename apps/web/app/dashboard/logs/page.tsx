'use client';

import { useState, useMemo } from 'react';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  FunnelIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { DailyLogCard, DailyLogFormModal } from '@/components/dailylogs';
import { useDailyLogs } from '@/lib/hooks/useDailyLogs';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { useAuth } from '@/lib/auth';
import { DailyLogEntry, DailyLogCategory, DAILY_LOG_CATEGORIES, Project } from '@/types';

export default function DailyLogsPage() {
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLogEntry | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<DailyLogCategory | ''>('');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Calculate date range for current view (week view)
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // End of week (Saturday)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [currentDate]);

  // Fetch logs
  const {
    logs,
    loading,
    createLog,
    updateLog,
    deleteLog,
  } = useDailyLogs({
    projectId: filterProjectId || undefined,
    category: filterCategory || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
    setCurrentDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Group logs by date
  const logsByDate = useMemo(() => {
    const grouped: Record<string, DailyLogEntry[]> = {};
    for (const log of logs) {
      if (!grouped[log.date]) {
        grouped[log.date] = [];
      }
      grouped[log.date].push(log);
    }
    return grouped;
  }, [logs]);

  // Get all dates in the current week
  const weekDates = useMemo(() => {
    const dates = [];
    const start = new Date(dateRange.startDate + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, [dateRange.startDate]);

  // Handle create
  const handleCreate = async (logData: Omit<DailyLogEntry, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>) => {
    await createLog(logData);
    setShowAddModal(false);
  };

  // Handle edit
  const handleEdit = (log: DailyLogEntry) => {
    setEditingLog(log);
    setShowAddModal(true);
  };

  // Handle update
  const handleUpdate = async (logData: Omit<DailyLogEntry, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>) => {
    if (editingLog) {
      await updateLog(editingLog.id, logData);
      setEditingLog(null);
      setShowAddModal(false);
    }
  };

  // Handle delete
  const handleDelete = async (logId: string) => {
    if (confirm('Are you sure you want to delete this log entry?')) {
      await deleteLog(logId);
    }
  };

  const isManager = profile?.role === 'OWNER' || profile?.role === 'PM';
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-gray-900">Daily Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Job site notes, progress reports, and field documentation
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Log Entry
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />

          {/* Project Filter */}
          <select
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {(projects as Project[])
              .filter((p: Project) => p.status === 'active')
              .map((project: Project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as DailyLogCategory | '')}
            className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {DAILY_LOG_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Week Navigation */}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium">
                {new Date(dateRange.startDate + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
                {' - '}
                {new Date(dateRange.endDate + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </div>
      </Card>

      {/* Week View */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : logs.length === 0 && !filterProjectId && !filterCategory ? (
        <EmptyState
          icon={<ClipboardDocumentListIcon className="h-12 w-12" />}
          title="No daily logs yet"
          description="Start documenting your job site activities, progress, and observations."
          action={{
            label: 'Add First Log Entry',
            onClick: () => setShowAddModal(true),
          }}
        />
      ) : (
        <div className="space-y-6">
          {weekDates.map((date) => {
            const dayLogs = logsByDate[date] || [];
            const isToday = date === today;
            const dayDate = new Date(date + 'T00:00:00');

            return (
              <div key={date}>
                {/* Day Header */}
                <div className={`flex items-center gap-3 mb-3 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center ${
                    isToday ? 'bg-gradient-to-br from-blue-50 to-blue-100' : 'bg-gray-100'
                  }`}>
                    <span className="text-xs font-medium">
                      {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {dayDate.getDate()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium font-heading">
                      {dayDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {dayLogs.length} {dayLogs.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                  {isToday && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      Today
                    </span>
                  )}
                </div>

                {/* Day Logs */}
                {dayLogs.length > 0 ? (
                  <div className="space-y-3 pl-13">
                    {dayLogs.map((log) => (
                      <DailyLogCard
                        key={log.id}
                        log={log}
                        showProject={!filterProjectId}
                        showUser={isManager}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        canEdit={log.userId === profile?.uid || isManager}
                        canDelete={log.userId === profile?.uid || isManager}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="pl-13">
                    <p className="text-sm text-gray-400 italic py-4">
                      No logs for this day
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <DailyLogFormModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingLog(null);
        }}
        onSubmit={editingLog ? handleUpdate : handleCreate}
        log={editingLog || undefined}
        defaultProjectId={filterProjectId}
        mode={editingLog ? 'edit' : 'create'}
      />
    </div>
  );
}
