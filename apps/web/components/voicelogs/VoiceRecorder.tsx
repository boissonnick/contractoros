'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MicrophoneIcon,
  StopIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { getVoiceLogQueue } from '@/lib/voice-logs/offline-queue';
import { getVoiceLogSyncManager } from '@/lib/voice-logs/sync-manager';
import { VoiceLogCreate } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';

// Recording constraints
const MAX_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100,
  },
};

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
type SubmitState = 'idle' | 'queued' | 'uploading' | 'success' | 'error';

interface VoiceRecorderProps {
  projectContext?: {
    projectId: string;
    projectName: string;
    phaseId?: string;
    phaseName?: string;
  };
  onComplete?: (id: string) => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * Voice Recorder Component
 *
 * Allows users to record audio, add optional summary, and queue for upload.
 * Works offline - recordings are stored in IndexedDB until uploaded.
 */
export function VoiceRecorder({
  projectContext,
  onComplete,
  onCancel,
  className,
}: VoiceRecorderProps) {
  const { user, profile } = useAuth();

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Optional summary
  const [summary, setSummary] = useState('');

  // Submit state
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

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

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();
      setRecordingState('recording');

      // Start duration timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);

        // Auto-stop at max duration
        if (elapsed >= MAX_DURATION_MS / 1000) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');

      // Resume timer
      const pausedDuration = duration;
      const resumeTime = Date.now();
      timerRef.current = setInterval(() => {
        const newElapsed = Math.floor((Date.now() - resumeTime) / 1000);
        setDuration(pausedDuration + newElapsed);
      }, 1000);
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

  // Submit recording
  const submitRecording = async () => {
    if (!audioBlob || !user || !profile?.orgId) {
      setError('Missing required data');
      return;
    }

    setSubmitState('uploading');
    setError(null);

    try {
      const queue = getVoiceLogQueue();

      const metadata: Omit<VoiceLogCreate, 'contentHash'> = {
        orgId: profile.orgId,
        userId: user.uid,
        userName: profile.displayName || user.email || 'Unknown',
        recordedAt: new Date(),
        durationSeconds: duration,
        fileSizeBytes: audioBlob.size,
        mimeType: audioBlob.type,
        status: 'queued',
        userSummary: summary.trim() || undefined,
        location: location || undefined,
        projectContext: projectContext || undefined,
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
        // Duplicate detected
        setError('This recording was already submitted');
        setSubmitState('error');
      }
    } catch (err) {
      console.error('Failed to queue recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to save recording');
      setSubmitState('error');
    }
  };

  // Render recording controls
  const renderControls = () => {
    switch (recordingState) {
      case 'idle':
        return (
          <button
            onClick={startRecording}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
            aria-label="Start recording"
          >
            <MicrophoneIcon className="h-10 w-10" />
          </button>
        );

      case 'recording':
        return (
          <div className="flex items-center gap-4">
            <button
              onClick={pauseRecording}
              className="w-14 h-14 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center shadow transition-all"
              aria-label="Pause recording"
            >
              <PauseIcon className="h-7 w-7" />
            </button>
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all animate-pulse"
              aria-label="Stop recording"
            >
              <StopIcon className="h-10 w-10" />
            </button>
          </div>
        );

      case 'paused':
        return (
          <div className="flex items-center gap-4">
            <button
              onClick={resumeRecording}
              className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow transition-all"
              aria-label="Resume recording"
            >
              <PlayIcon className="h-7 w-7" />
            </button>
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all"
              aria-label="Stop recording"
            >
              <StopIcon className="h-10 w-10" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Render success state
  if (submitState === 'success') {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recording Saved</h3>
            <p className="text-sm text-gray-500 mt-1">
              Your voice log will be processed shortly.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex flex-col items-center gap-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Daily Voice Log</h3>
          <p className="text-sm text-gray-500 mt-1">
            {recordingState === 'idle'
              ? 'Tap to start recording your work summary'
              : recordingState === 'stopped'
              ? 'Review your recording'
              : 'Recording in progress...'}
          </p>
        </div>

        {/* Duration display */}
        <div className={cn(
          'text-4xl font-mono tabular-nums',
          recordingState === 'recording' ? 'text-red-600' : 'text-gray-900'
        )}>
          {formatDuration(duration)}
        </div>

        {/* Recording waveform indicator */}
        {(recordingState === 'recording' || recordingState === 'paused') && (
          <div className="flex items-center justify-center gap-1 h-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1 bg-red-500 rounded-full transition-all',
                  recordingState === 'recording'
                    ? 'animate-pulse'
                    : 'h-2'
                )}
                style={{
                  height: recordingState === 'recording'
                    ? `${Math.random() * 100}%`
                    : '8px',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        {recordingState !== 'stopped' && renderControls()}

        {/* Stopped state - review and submit */}
        {recordingState === 'stopped' && audioUrl && (
          <div className="w-full space-y-4">
            {/* Audio playback */}
            <audio controls src={audioUrl} className="w-full" />

            {/* Optional summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add a quick summary (optional)
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What did you work on today?"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                disabled={submitState === 'uploading'}
              />
            </div>

            {/* Project context */}
            {projectContext && (
              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium">Project:</span> {projectContext.projectName}
                {projectContext.phaseName && (
                  <span className="ml-2">
                    <span className="font-medium">Phase:</span> {projectContext.phaseName}
                  </span>
                )}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={discardRecording}
                disabled={submitState === 'uploading'}
                className="flex-1"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Discard
              </Button>
              <Button
                onClick={submitRecording}
                disabled={submitState === 'uploading'}
                loading={submitState === 'uploading'}
                className="flex-1"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                {submitState === 'uploading' ? 'Saving...' : 'Save'}
              </Button>
            </div>

            {/* Cancel option */}
            {onCancel && (
              <button
                onClick={onCancel}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                disabled={submitState === 'uploading'}
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {/* Cancel for idle/recording states */}
        {recordingState !== 'stopped' && onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        )}

        {/* Max duration warning */}
        {duration > (MAX_DURATION_MS / 1000) * 0.8 && recordingState !== 'stopped' && (
          <p className="text-xs text-amber-600">
            {Math.floor(MAX_DURATION_MS / 1000 - duration)} seconds remaining
          </p>
        )}
      </div>
    </Card>
  );
}
