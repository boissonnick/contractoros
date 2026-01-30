'use client';

import React, { useState } from 'react';
import {
  MicrophoneIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  PlayIcon,
  DocumentTextIcon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  LinkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import {
  VoiceLog,
  WorkEvent,
  TaskMatch,
  VOICE_LOG_STATUS_LABELS,
  WORK_EVENT_TYPE_LABELS,
} from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface VoiceLogDetailProps {
  voiceLog: VoiceLog;
  onRetry?: () => void;
  onCreateTimeEntry?: (match: TaskMatch) => void;
  className?: string;
}

/**
 * Format duration as human readable
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

/**
 * Get confidence badge variant
 */
function getConfidenceVariant(confidence: 'high' | 'medium' | 'low') {
  switch (confidence) {
    case 'high':
      return 'success';
    case 'medium':
      return 'warning';
    case 'low':
      return 'danger';
  }
}

/**
 * Status header section
 */
function StatusHeader({ voiceLog, onRetry }: { voiceLog: VoiceLog; onRetry?: () => void }) {
  const isProcessing = ['processing', 'uploading', 'uploaded'].includes(voiceLog.status);
  const isFailed = ['failed', 'error'].includes(voiceLog.status);
  const isComplete = voiceLog.status === 'completed';

  return (
    <div className={cn(
      'p-4 rounded-lg',
      isComplete && 'bg-green-50',
      isProcessing && 'bg-blue-50',
      isFailed && 'bg-red-50',
      !isComplete && !isProcessing && !isFailed && 'bg-gray-50'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isComplete && <CheckCircleIcon className="h-6 w-6 text-green-600" />}
          {isProcessing && <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin" />}
          {isFailed && <ExclamationCircleIcon className="h-6 w-6 text-red-600" />}

          <div>
            <p className={cn(
              'font-medium',
              isComplete && 'text-green-900',
              isProcessing && 'text-blue-900',
              isFailed && 'text-red-900'
            )}>
              {VOICE_LOG_STATUS_LABELS[voiceLog.status]}
            </p>
            {voiceLog.statusMessage && (
              <p className={cn(
                'text-sm',
                isComplete && 'text-green-700',
                isProcessing && 'text-blue-700',
                isFailed && 'text-red-700'
              )}>
                {voiceLog.statusMessage}
              </p>
            )}
          </div>
        </div>

        {isFailed && onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Audio player section
 */
function AudioPlayer({ audioUrl }: { audioUrl?: string }) {
  if (!audioUrl) {
    return (
      <div className="flex items-center justify-center py-6 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">Audio not available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <PlayIcon className="h-5 w-5 text-gray-600" />
        <span className="font-medium text-gray-900">Recording</span>
      </div>
      <audio controls src={audioUrl} className="w-full" />
    </div>
  );
}

/**
 * Summary section
 */
function SummarySection({ voiceLog }: { voiceLog: VoiceLog }) {
  const { summary, userSummary } = voiceLog;

  if (!summary && !userSummary) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 flex items-center gap-2">
        <ListBulletIcon className="h-5 w-5" />
        Summary
      </h3>

      {/* AI-generated bullets */}
      {summary?.bullets && summary.bullets.length > 0 && (
        <ul className="space-y-2">
          {summary.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-brand-primary mt-1">•</span>
              {bullet}
            </li>
          ))}
        </ul>
      )}

      {/* User-provided summary */}
      {userSummary && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Your notes:</p>
          <p className="text-sm text-gray-700">{userSummary}</p>
        </div>
      )}

      {/* Blockers */}
      {summary?.blockers && summary.blockers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Blockers</span>
          </div>
          <ul className="space-y-1">
            {summary.blockers.map((blocker, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span>•</span>
                {blocker}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      {summary?.nextSteps && summary.nextSteps.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Next Steps</span>
          </div>
          <ul className="space-y-1">
            {summary.nextSteps.map((step, i) => (
              <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                <span>•</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Work events section
 */
function WorkEventsSection({ events }: { events: WorkEvent[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayEvents = expanded ? events : events.slice(0, 3);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900 flex items-center gap-2">
        <DocumentTextIcon className="h-5 w-5" />
        Extracted Events
        <span className="text-sm font-normal text-gray-500">({events.length})</span>
      </h3>

      <div className="space-y-2">
        {displayEvents.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="primary" size="sm">
                  {WORK_EVENT_TYPE_LABELS[event.type]}
                </Badge>
                <Badge variant={getConfidenceVariant(event.confidence)} size="sm">
                  {event.confidence}
                </Badge>
              </div>
              <p className="text-sm text-gray-700">{event.description}</p>
              <p className="text-xs text-gray-500 mt-1 italic">
                &quot;{event.sourceText}&quot;
              </p>
            </div>
          </div>
        ))}
      </div>

      {events.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-brand-primary hover:text-brand-primary-dark"
        >
          {expanded ? (
            <>
              <ChevronUpIcon className="h-4 w-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDownIcon className="h-4 w-4" />
              Show {events.length - 3} more events
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Task matches section
 */
function TaskMatchesSection({
  matches,
  onCreateTimeEntry,
}: {
  matches: TaskMatch[];
  onCreateTimeEntry?: (match: TaskMatch) => void;
}) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900 flex items-center gap-2">
        <LinkIcon className="h-5 w-5" />
        Matched Tasks
        <span className="text-sm font-normal text-gray-500">({matches.length})</span>
      </h3>

      <div className="space-y-2">
        {matches.map((match) => (
          <div
            key={`${match.eventId}-${match.taskId}`}
            className="flex items-start justify-between gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">{match.taskName}</span>
                <Badge variant={getConfidenceVariant(match.matchConfidence)} size="sm">
                  {match.matchConfidence}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{match.projectName}</p>
              <p className="text-xs text-gray-500 mt-1">{match.matchReason}</p>
              {match.suggestedTimeEntry && (
                <p className="text-xs text-green-700 mt-1">
                  Suggested: {match.suggestedTimeEntry.hours}h
                </p>
              )}
            </div>
            {onCreateTimeEntry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onCreateTimeEntry(match)}
              >
                Log Time
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Transcript section (collapsible)
 */
function TranscriptSection({ voiceLog }: { voiceLog: VoiceLog }) {
  const [expanded, setExpanded] = useState(false);
  const { transcript } = voiceLog;

  if (!transcript) {
    return null;
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5" />
          Full Transcript
          <span className="text-sm font-normal text-gray-500">
            ({transcript.wordCount} words)
          </span>
        </h3>
        {expanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {transcript.fullText}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Metadata section
 */
function MetadataSection({ voiceLog }: { voiceLog: VoiceLog }) {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-gray-500">Duration</p>
        <p className="font-medium text-gray-900 flex items-center gap-1">
          <MicrophoneIcon className="h-4 w-4" />
          {formatDuration(voiceLog.durationSeconds)}
        </p>
      </div>
      <div>
        <p className="text-gray-500">Recorded</p>
        <p className="font-medium text-gray-900 flex items-center gap-1">
          <ClockIcon className="h-4 w-4" />
          {voiceLog.recordedAt.toLocaleString()}
        </p>
      </div>
      {voiceLog.location && (
        <div className="col-span-2">
          <p className="text-gray-500">Location</p>
          <p className="font-medium text-gray-900 flex items-center gap-1">
            <MapPinIcon className="h-4 w-4" />
            {voiceLog.location.address || `${voiceLog.location.lat.toFixed(4)}, ${voiceLog.location.lng.toFixed(4)}`}
          </p>
        </div>
      )}
      {voiceLog.projectContext && (
        <div className="col-span-2">
          <p className="text-gray-500">Project</p>
          <p className="font-medium text-gray-900">
            {voiceLog.projectContext.projectName}
            {voiceLog.projectContext.phaseName && (
              <span className="text-gray-500"> / {voiceLog.projectContext.phaseName}</span>
            )}
          </p>
        </div>
      )}
      {voiceLog.processingMeta && (
        <>
          <div>
            <p className="text-gray-500">Processing Time</p>
            <p className="font-medium text-gray-900">
              {(voiceLog.processingMeta.processingTimeMs / 1000).toFixed(1)}s
            </p>
          </div>
          <div>
            <p className="text-gray-500">AI Provider</p>
            <p className="font-medium text-gray-900">
              {voiceLog.processingMeta.provider} / {voiceLog.processingMeta.model}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Voice Log Detail Component
 *
 * Shows full details of a voice log including transcript,
 * extracted events, task matches, and summary.
 */
export function VoiceLogDetail({
  voiceLog,
  onRetry,
  onCreateTimeEntry,
  className,
}: VoiceLogDetailProps) {
  return (
    <Card className={cn('p-6 space-y-6', className)}>
      {/* Status header */}
      <StatusHeader voiceLog={voiceLog} onRetry={onRetry} />

      {/* Audio player */}
      <AudioPlayer audioUrl={voiceLog.audioUrl} />

      {/* Summary */}
      <SummarySection voiceLog={voiceLog} />

      {/* Task matches */}
      {voiceLog.taskMatches && (
        <TaskMatchesSection
          matches={voiceLog.taskMatches}
          onCreateTimeEntry={onCreateTimeEntry}
        />
      )}

      {/* Work events */}
      {voiceLog.events && <WorkEventsSection events={voiceLog.events} />}

      {/* Full transcript */}
      <TranscriptSection voiceLog={voiceLog} />

      {/* Metadata */}
      <div className="pt-4 border-t border-gray-200">
        <MetadataSection voiceLog={voiceLog} />
      </div>
    </Card>
  );
}
