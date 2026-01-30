'use client';

import React, { useState } from 'react';
import {
  MicrophoneIcon,
  PlusIcon,
  FunnelIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { useVoiceLogs, useVoiceLogStats } from '@/lib/hooks/useVoiceLogs';
import { VoiceRecorder, VoiceLogList, VoiceLogDetail } from '@/components/voicelogs';
import { VoiceLog, VoiceLogStatus } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type ViewMode = 'list' | 'record' | 'detail';

/**
 * Voice Logs Page
 *
 * Field worker portal page for recording and viewing voice logs.
 */
export default function VoiceLogsPage() {
  const { user, profile } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedLog, setSelectedLog] = useState<VoiceLog | null>(null);
  const [statusFilter, setStatusFilter] = useState<VoiceLogStatus | ''>('');

  // Fetch voice logs for current user
  const { voiceLogs, loading, error, retry } = useVoiceLogs({
    userId: user?.uid,
    status: statusFilter || undefined,
  });

  // Fetch stats
  const { stats, loading: statsLoading } = useVoiceLogStats();

  // Handle recording complete
  const handleRecordingComplete = (id: string) => {
    console.log('Recording complete:', id);
    setViewMode('list');
  };

  // Handle log selection
  const handleSelectLog = (log: VoiceLog) => {
    setSelectedLog(log);
    setViewMode('detail');
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedLog(null);
    setViewMode('list');
  };

  // Handle retry
  const handleRetry = async () => {
    if (selectedLog) {
      await retry(selectedLog.id);
    }
  };

  if (!profile) {
    return (
      <div className="p-4">
        <Card className="p-6 text-center">
          <p className="text-gray-500">Please log in to access voice logs.</p>
        </Card>
      </div>
    );
  }

  // Recording view
  if (viewMode === 'record') {
    return (
      <div className="p-4">
        <VoiceRecorder
          onComplete={handleRecordingComplete}
          onCancel={() => setViewMode('list')}
        />
      </div>
    );
  }

  // Detail view
  if (viewMode === 'detail' && selectedLog) {
    return (
      <div className="p-4">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <span>&larr;</span> Back to list
        </button>
        <VoiceLogDetail
          voiceLog={selectedLog}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Voice Logs</h1>
          <p className="text-sm text-gray-500">
            Record your daily work summary
          </p>
        </div>
        <Button onClick={() => setViewMode('record')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Record
        </Button>
      </div>

      {/* Stats cards */}
      {!statsLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3">
            <p className="text-xs text-gray-500">Today</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.todayCount}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500">Processing</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.processing}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500">Failed</p>
            <p className="text-2xl font-semibold text-red-600">{stats.failed}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <FunnelIcon className="h-4 w-4" />
          <span>Filter:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VoiceLogStatus | '')}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1"
        >
          <option value="">All</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
          <option value="queued">Queued</option>
        </select>
      </div>

      {/* Error state */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {/* Voice logs list */}
      <VoiceLogList
        voiceLogs={voiceLogs}
        loading={loading}
        onSelect={handleSelectLog}
        selectedId={selectedLog?.id}
      />

      {/* Empty state with CTA */}
      {!loading && voiceLogs.length === 0 && !statusFilter && (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-primary-light flex items-center justify-center mx-auto mb-4">
            <MicrophoneIcon className="h-8 w-8 text-brand-primary" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No voice logs yet
          </h3>
          <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
            Record your first daily voice log to keep track of your work and help
            your team stay informed.
          </p>
          <Button onClick={() => setViewMode('record')}>
            <MicrophoneIcon className="h-4 w-4 mr-2" />
            Start Recording
          </Button>
        </Card>
      )}

      {/* Sync status indicator */}
      <div className="fixed bottom-20 right-4">
        <SyncStatusIndicator />
      </div>
    </div>
  );
}

/**
 * Sync status indicator component
 */
function SyncStatusIndicator() {
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'offline'>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  // Subscribe to sync state changes
  React.useEffect(() => {
    const checkQueue = async () => {
      try {
        const { getVoiceLogQueue } = await import('@/lib/voice-logs/offline-queue');
        const queue = getVoiceLogQueue();
        const counts = await queue.getStatusCounts();
        setPendingCount(counts.pending + counts.uploading);
      } catch {
        // IndexedDB not available
      }
    };

    checkQueue();
    const interval = setInterval(checkQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  if (pendingCount === 0) return null;

  return (
    <button
      onClick={async () => {
        const { getVoiceLogSyncManager } = await import('@/lib/voice-logs/sync-manager');
        const syncManager = getVoiceLogSyncManager();
        syncManager.triggerSync();
      }}
      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full shadow-lg text-sm"
    >
      <ArrowPathIcon className={`h-4 w-4 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
      <span>{pendingCount} pending</span>
    </button>
  );
}
