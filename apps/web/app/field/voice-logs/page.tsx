'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MicrophoneIcon,
  StopIcon,
  PlusIcon,
  FunnelIcon,
  ArrowPathIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  SignalIcon,
  SignalSlashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { useVoiceLogs, useVoiceLogStats } from '@/lib/hooks/useVoiceLogs';
import { VoiceLogList, VoiceLogDetail } from '@/components/voicelogs';
import { VoiceLog, VoiceLogStatus, VoiceLogQueueItem } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'record' | 'detail';

// Recording constraints
const MAX_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100,
  },
};

/**
 * Format duration as MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

/**
 * Queue Status Label Map
 */
const QUEUE_STATUS_LABELS: Record<VoiceLogQueueItem['status'], string> = {
  pending: 'Waiting',
  uploading: 'Uploading',
  failed: 'Failed',
};

/**
 * Voice Logs Page - Enhanced for Field Workers
 */
export default function VoiceLogsPage() {
  const { user, profile } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedLog, setSelectedLog] = useState<VoiceLog | null>(null);
  const [statusFilter, setStatusFilter] = useState<VoiceLogStatus | ''>('');
  const [showQueue, setShowQueue] = useState(false);

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

  // Recording view - Enhanced for gloves/field use
  if (viewMode === 'record') {
    return (
      <div className="min-h-screen bg-gray-50">
        <EnhancedVoiceRecorder
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
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4 min-h-[44px]"
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
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Voice Logs</h1>
          <p className="text-sm text-gray-500">
            Record your daily work summary
          </p>
        </div>
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
          className="text-sm border border-gray-300 rounded-lg px-2 py-1 min-h-[44px]"
        >
          <option value="">All</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
          <option value="queued">Queued</option>
        </select>
        <button
          onClick={() => setShowQueue(!showQueue)}
          className={cn(
            "ml-auto flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
            showQueue
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          <CloudArrowUpIcon className="h-4 w-4" />
          Queue
        </button>
      </div>

      {/* Pending Queue Section */}
      {showQueue && <PendingQueueSection />}

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
          <Button onClick={() => setViewMode('record')} size="lg" className="min-h-[48px]">
            <MicrophoneIcon className="h-5 w-5 mr-2" />
            Start Recording
          </Button>
        </Card>
      )}

      {/* Large floating record button - optimized for gloves */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setViewMode('record')}
          className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
          aria-label="Start recording"
        >
          <MicrophoneIcon className="h-10 w-10" />
        </button>
      </div>

      {/* Sync status indicator */}
      <SyncStatusIndicator />
    </div>
  );
}

/**
 * Enhanced Voice Recorder - Optimized for field workers with gloves
 */
function EnhancedVoiceRecorder({
  onComplete,
  onCancel,
}: {
  onComplete?: (id: string) => void;
  onCancel?: () => void;
}) {
  const { user, profile } = useAuth();

  // Recording state
  type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
  type SubmitState = 'idle' | 'queued' | 'uploading' | 'success' | 'error';

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = React.useRef<number>(0);
  const pausedDurationRef = React.useRef<number>(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Location state
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);

  // Get location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.warn('Could not get location:', error.message);
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      streamRef.current = stream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      // Start recording
      mediaRecorder.start(1000);
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      setRecordingState('recording');

      // Start duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) + pausedDurationRef.current;
        setDuration(elapsed);

        // Auto-stop at max duration
        if (elapsed >= MAX_DURATION_MS / 1000) {
          stopRecording();
        }
      }, 100);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      pausedDurationRef.current = duration;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingState('paused');
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();
      setRecordingState('recording');

      // Resume timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) + pausedDurationRef.current;
        setDuration(elapsed);
      }, 100);
    }
  };

  // Stop recording
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    setRecordingState('stopped');
  }, []);

  // Discard recording
  const discardRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setSummary('');
    setRecordingState('idle');
    setSubmitState('idle');
    setError(null);
  };

  // Toggle playback
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Submit recording
  const submitRecording = async () => {
    if (!audioBlob || !user || !profile?.orgId) {
      setError('Missing required data');
      return;
    }

    setSubmitState('uploading');
    setError(null);

    try {
      const { getVoiceLogQueue } = await import('@/lib/voice-logs/offline-queue');
      const { getVoiceLogSyncManager } = await import('@/lib/voice-logs/sync-manager');
      const queue = getVoiceLogQueue();

      const metadata = {
        orgId: profile.orgId,
        userId: user.uid,
        userName: profile.displayName || user.email || 'Unknown',
        recordedAt: new Date(),
        durationSeconds: duration,
        fileSizeBytes: audioBlob.size,
        mimeType: audioBlob.type,
        status: 'queued' as const,
        userSummary: summary.trim() || undefined,
        location: location || undefined,
      };

      const queueId = await queue.enqueue(audioBlob, metadata);

      if (queueId) {
        setSubmitState('queued');

        // Trigger sync if online
        const syncManager = getVoiceLogSyncManager();
        if (syncManager.getIsOnline()) {
          syncManager.triggerSync();
        }

        setSubmitState('success');

        // Notify parent
        if (onComplete) {
          setTimeout(() => onComplete(queueId), 1500);
        }
      } else {
        setError('This recording was already submitted');
        setSubmitState('error');
      }
    } catch (err) {
      console.error('Failed to queue recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to save recording');
      setSubmitState('error');
    }
  };

  // Success state
  if (submitState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 animate-scale-in">
          <CheckCircleIcon className="h-14 w-14 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recording Saved</h2>
        <p className="text-gray-500 text-center">Your voice log will be processed shortly.</p>
      </div>
    );
  }

  // Idle state - large record button
  if (recordingState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="absolute top-4 left-4 p-3 text-gray-500 hover:text-gray-700"
          aria-label="Cancel"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Daily Voice Log</h2>
          <p className="text-gray-500">Tap the button to start recording</p>
        </div>

        {/* Large record button - optimized for gloves */}
        <button
          onClick={startRecording}
          className="w-32 h-32 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 mb-8"
          aria-label="Start recording"
        >
          <MicrophoneIcon className="h-16 w-16" />
        </button>

        <p className="text-sm text-gray-400">Max duration: 10 minutes</p>

        {/* Error message */}
        {error && (
          <div className="mt-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Recording or paused state
  if (recordingState === 'recording' || recordingState === 'paused') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        {/* Recording indicator */}
        <div className={cn(
          "w-4 h-4 rounded-full mb-4",
          recordingState === 'recording' ? "bg-red-500 animate-pulse" : "bg-yellow-500"
        )} />
        <p className="text-sm text-gray-500 mb-4">
          {recordingState === 'recording' ? 'Recording...' : 'Paused'}
        </p>

        {/* Large duration timer */}
        <div className={cn(
          'text-6xl font-mono tabular-nums mb-8',
          recordingState === 'recording' ? 'text-red-600' : 'text-gray-900'
        )}>
          {formatDuration(duration)}
        </div>

        {/* Audio visualization bars */}
        <div className="flex items-center justify-center gap-1 h-12 mb-12">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 rounded-full transition-all',
                recordingState === 'recording'
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-gray-300 h-3'
              )}
              style={{
                height: recordingState === 'recording'
                  ? `${20 + Math.random() * 80}%`
                  : '12px',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Control buttons - large for gloves */}
        <div className="flex items-center gap-6">
          {/* Pause/Resume button */}
          <button
            onClick={recordingState === 'recording' ? pauseRecording : resumeRecording}
            className="w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700 flex items-center justify-center shadow-lg transition-all"
            aria-label={recordingState === 'recording' ? 'Pause' : 'Resume'}
          >
            {recordingState === 'recording' ? (
              <PauseIcon className="h-8 w-8" />
            ) : (
              <PlayIcon className="h-8 w-8" />
            )}
          </button>

          {/* Stop button */}
          <button
            onClick={stopRecording}
            className={cn(
              "w-24 h-24 rounded-full text-white flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95",
              recordingState === 'recording'
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : "bg-red-500 hover:bg-red-600"
            )}
            aria-label="Stop recording"
          >
            <StopIcon className="h-12 w-12" />
          </button>
        </div>

        {/* Duration warning */}
        {duration > (MAX_DURATION_MS / 1000) * 0.8 && (
          <p className="mt-8 text-sm text-amber-600 font-medium">
            {Math.floor(MAX_DURATION_MS / 1000 - duration)} seconds remaining
          </p>
        )}
      </div>
    );
  }

  // Stopped state - review and submit
  return (
    <div className="flex flex-col min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={discardRecording}
          className="p-3 text-gray-500 hover:text-gray-700"
          aria-label="Discard"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">Review Recording</h2>
        <div className="w-12" /> {/* Spacer */}
      </div>

      <div className="flex-1 space-y-6">
        {/* Recording info */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <MicrophoneIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{formatDuration(duration)}</p>
                <p className="text-sm text-gray-500">
                  {audioBlob ? `${(audioBlob.size / 1024).toFixed(0)} KB` : ''}
                </p>
              </div>
            </div>
            <Badge variant="info">Ready</Badge>
          </div>

          {/* Audio player with custom controls */}
          {audioUrl && (
            <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
              <button
                onClick={togglePlayback}
                className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white flex items-center justify-center shadow transition-all"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <PauseIcon className="h-7 w-7" />
                ) : (
                  <PlayIcon className="h-7 w-7 ml-1" />
                )}
              </button>
              <div className="flex-1">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  className="hidden"
                />
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: isPlaying ? '100%' : '0%' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Tap to preview</p>
              </div>
            </div>
          )}
        </Card>

        {/* Optional summary */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add a quick note (optional)
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="What did you work on today?"
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={submitState === 'uploading'}
          />
        </Card>

        {/* Location info */}
        {location && (
          <div className="flex items-center gap-2 text-sm text-gray-500 px-2">
            <SignalIcon className="h-4 w-4" />
            <span>Location will be attached</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Action buttons - large for gloves */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={submitRecording}
          disabled={submitState === 'uploading'}
          loading={submitState === 'uploading'}
          className="w-full h-14 text-lg"
          size="lg"
        >
          <CloudArrowUpIcon className="h-6 w-6 mr-2" />
          {submitState === 'uploading' ? 'Saving...' : 'Save Recording'}
        </Button>
        <Button
          variant="secondary"
          onClick={discardRecording}
          disabled={submitState === 'uploading'}
          className="w-full h-14 text-lg"
          size="lg"
        >
          <TrashIcon className="h-6 w-6 mr-2" />
          Discard
        </Button>
      </div>
    </div>
  );
}

/**
 * Pending Queue Section - Shows logs waiting to upload
 */
function PendingQueueSection() {
  const [queueItems, setQueueItems] = useState<VoiceLogQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Load queue items
  const loadQueue = useCallback(async () => {
    try {
      const { getVoiceLogQueue } = await import('@/lib/voice-logs/offline-queue');
      const queue = getVoiceLogQueue();
      const [pending, failed] = await Promise.all([
        queue.getPending(),
        queue.getFailed(),
      ]);
      setQueueItems([...pending, ...failed]);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 3000);

    // Online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadQueue]);

  // Retry a failed item
  const handleRetry = async (id: string) => {
    try {
      const { getVoiceLogQueue } = await import('@/lib/voice-logs/offline-queue');
      const { getVoiceLogSyncManager } = await import('@/lib/voice-logs/sync-manager');
      const queue = getVoiceLogQueue();
      await queue.updateStatus(id, 'pending');

      const syncManager = getVoiceLogSyncManager();
      if (syncManager.getIsOnline()) {
        syncManager.triggerSync();
      }

      loadQueue();
    } catch (err) {
      console.error('Failed to retry:', err);
    }
  };

  // Delete an item
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recording? This cannot be undone.')) return;

    try {
      const { getVoiceLogQueue } = await import('@/lib/voice-logs/offline-queue');
      const queue = getVoiceLogQueue();
      await queue.remove(id);
      loadQueue();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // Retry all failed
  const handleRetryAll = async () => {
    try {
      const { getVoiceLogQueue } = await import('@/lib/voice-logs/offline-queue');
      const { getVoiceLogSyncManager } = await import('@/lib/voice-logs/sync-manager');
      const queue = getVoiceLogQueue();
      await queue.resetFailed();

      const syncManager = getVoiceLogSyncManager();
      if (syncManager.getIsOnline()) {
        syncManager.triggerSync();
      }

      loadQueue();
    } catch (err) {
      console.error('Failed to retry all:', err);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </Card>
    );
  }

  if (queueItems.length === 0) {
    return (
      <Card className="p-6 text-center">
        <CheckCircleIcon className="h-10 w-10 text-green-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600">All recordings uploaded</p>
        <p className="text-xs text-gray-400 mt-1">Queue is empty</p>
      </Card>
    );
  }

  const failedCount = queueItems.filter(item => item.status === 'failed').length;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CloudArrowUpIcon className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900">Upload Queue</span>
          <Badge variant={isOnline ? 'success' : 'warning'} size="sm">
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        {failedCount > 0 && (
          <button
            onClick={handleRetryAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium min-h-[44px] px-2"
          >
            Retry All
          </button>
        )}
      </div>

      {/* Queue items */}
      <div className="divide-y divide-gray-100">
        {queueItems.map((item) => (
          <QueueItemCard
            key={item.id}
            item={item}
            onRetry={() => handleRetry(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
      </div>
    </Card>
  );
}

/**
 * Queue Item Card
 */
function QueueItemCard({
  item,
  onRetry,
  onDelete,
}: {
  item: VoiceLogQueueItem;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Create audio URL from blob
  useEffect(() => {
    if (item.audioBlob) {
      const url = URL.createObjectURL(item.audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [item.audioBlob]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const isFailed = item.status === 'failed';
  const isPending = item.status === 'pending';
  const isUploading = item.status === 'uploading';

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {/* Play button */}
        <button
          onClick={togglePlay}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
            isFailed ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <PauseIcon className="h-5 w-5" />
          ) : (
            <PlayIcon className="h-5 w-5 ml-0.5" />
          )}
        </button>

        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 truncate">
              {formatDuration(item.metadata.durationSeconds)}
            </span>
            <Badge
              variant={isFailed ? 'danger' : isUploading ? 'info' : 'default'}
              size="sm"
            >
              {isUploading && <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />}
              {QUEUE_STATUS_LABELS[item.status]}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            {formatRelativeTime(new Date(item.queuedAt))}
            {item.metadata.userSummary && (
              <span className="ml-2 text-gray-400">
                &bull; {item.metadata.userSummary.slice(0, 30)}
                {item.metadata.userSummary.length > 30 ? '...' : ''}
              </span>
            )}
          </p>
          {isFailed && item.lastError && (
            <p className="text-xs text-red-600 mt-1">{item.lastError}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isFailed && (
            <button
              onClick={onRetry}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Retry upload"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Delete recording"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
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
  const [isOnline, setIsOnline] = useState(true);

  // Subscribe to sync state changes
  useEffect(() => {
    const checkQueue = async () => {
      try {
        const { getVoiceLogQueue } = await import('@/lib/voice-logs/offline-queue');
        const queue = getVoiceLogQueue();
        const counts = await queue.getStatusCounts();
        setPendingCount(counts.pending + counts.uploading + counts.failed);
      } catch {
        // IndexedDB not available
      }
    };

    checkQueue();
    const interval = setInterval(checkQueue, 5000);

    // Online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (pendingCount === 0 && isOnline) return null;

  return (
    <div className="fixed bottom-28 right-4 z-40">
      <button
        onClick={async () => {
          const { getVoiceLogSyncManager } = await import('@/lib/voice-logs/sync-manager');
          const syncManager = getVoiceLogSyncManager();
          syncManager.triggerSync();
        }}
        className={cn(
          "flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-sm font-medium transition-colors min-h-[48px]",
          !isOnline
            ? "bg-amber-100 text-amber-800 border border-amber-200"
            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
        )}
      >
        {!isOnline ? (
          <>
            <SignalSlashIcon className="h-5 w-5" />
            <span>Offline</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <ArrowPathIcon className={cn("h-5 w-5", syncState === 'syncing' && 'animate-spin')} />
            <span>{pendingCount} pending</span>
          </>
        ) : null}
      </button>
    </div>
  );
}
