'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  CloudArrowUpIcon,
  CloudIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { useNetworkStatus } from '@/lib/offline/network-status';
import {
  OfflineDailyLog,
  getOfflineDailyLogService,
} from '@/lib/offline/offline-daily-logs';
import { cacheTeamForOffline } from '@/lib/offline/cache-team';
import { OfflineDailyLogForm } from '@/components/field/OfflineDailyLogForm';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import Button from '@/components/ui/Button';
import { Project } from '@/types';

export default function FieldDailyLogPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { isOnline, wasOffline } = useNetworkStatus();
  const router = useRouter();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [offlineLogs, setOfflineLogs] = useState<OfflineDailyLog[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch projects
  const { data: projectsData = [], isLoading: projectsLoading } = useProjects();
  const projects = projectsData as Project[];

  const orgId = profile?.orgId || '';
  const userId = profile?.uid || '';
  const userName = profile?.displayName || user?.email || 'Unknown';

  // Load offline logs and pending count
  useEffect(() => {
    async function loadOfflineData() {
      if (!orgId) return;

      const service = getOfflineDailyLogService();
      const logs = await service.getDailyLogs(orgId, selectedProjectId || undefined);
      setOfflineLogs(logs);

      // Subscribe to pending count changes
      return service.subscribeToPendingCount(setPendingCount);
    }

    const unsubscribe = loadOfflineData();
    return () => {
      unsubscribe?.then((unsub) => unsub?.());
    };
  }, [orgId, selectedProjectId]);

  // Cache team when online
  useEffect(() => {
    if (isOnline && orgId) {
      cacheTeamForOffline(orgId).catch(console.error);
    }
  }, [isOnline, orgId]);

  // Handle form save
  const handleSave = async (localId: string) => {
    setShowForm(false);
    // Refresh the list
    const service = getOfflineDailyLogService();
    const logs = await service.getDailyLogs(orgId, selectedProjectId || undefined);
    setOfflineLogs(logs);
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isOnline && orgId) {
        await cacheTeamForOffline(orgId);
      }
      const service = getOfflineDailyLogService();
      const logs = await service.getDailyLogs(orgId, selectedProjectId || undefined);
      setOfflineLogs(logs);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get selected project
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <h1 className="text-lg font-semibold">Daily Logs</h1>
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
              <span>Offline - changes will sync when connected</span>
            </>
          )}
          {pendingCount > 0 && (
            <span className="ml-auto bg-amber-200 px-2 py-0.5 rounded-full text-xs font-medium">
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* Project selector */}
        <div className="px-4 py-3 border-t bg-gray-50">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {showForm ? (
        <div className="p-4">
          <OfflineDailyLogForm
            projectId={selectedProjectId}
            projectName={selectedProject?.name || 'Unknown Project'}
            orgId={orgId}
            userId={userId}
            userName={userName}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <>
          {/* Today's summary */}
          <div className="p-4">
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {offlineLogs.filter((l) => l.date === new Date().toISOString().split('T')[0]).length}
                  </div>
                  <div className="text-xs text-gray-500">Today&apos;s Logs</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {pendingCount}
                  </div>
                  <div className="text-xs text-gray-500">Pending Sync</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {offlineLogs.length}
                  </div>
                  <div className="text-xs text-gray-500">Total Saved</div>
                </div>
              </div>
            </div>
          </div>

          {/* Log list */}
          <div className="px-4 space-y-3">
            {offlineLogs.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No daily logs yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create your first log for today
                </p>
              </div>
            ) : (
              offlineLogs.map((log) => (
                <div
                  key={log.localId}
                  className="bg-white rounded-xl border shadow-sm p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {log.title}
                        </h3>
                        {log.syncStatus === 'pending' && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <CloudArrowUpIcon className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {log.projectName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.date).toLocaleDateString()} &bull;{' '}
                        {log.crewCount} workers &bull; {log.hoursWorked}h
                      </p>
                      {log.workPerformed && log.workPerformed.length > 0 && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {log.workPerformed.slice(0, 2).join(', ')}
                          {log.workPerformed.length > 2 && '...'}
                        </p>
                      )}
                    </div>
                    {log.weather && (
                      <div className="text-right text-sm">
                        <div className="text-gray-600 capitalize">
                          {log.weather.condition.replace('_', ' ')}
                        </div>
                        {log.weather.tempHigh && (
                          <div className="text-gray-400 text-xs">
                            {log.weather.tempHigh}F
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* FAB to create new log */}
      {!showForm && selectedProjectId && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-brand-primary text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-transform"
        >
          <PlusIcon className="h-7 w-7" />
        </button>
      )}

      {/* Prompt to select project */}
      {!showForm && !selectedProjectId && projects.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4">
          <div className="bg-brand-primary text-white px-4 py-3 rounded-xl shadow-lg text-center">
            <p className="text-sm">Select a project to create a daily log</p>
          </div>
        </div>
      )}
    </div>
  );
}
