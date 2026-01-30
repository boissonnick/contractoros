'use client';

import React from 'react';
import {
  MicrophoneIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { VoiceLog, VOICE_LOG_STATUS_LABELS } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface VoiceLogListProps {
  voiceLogs: VoiceLog[];
  loading?: boolean;
  onSelect?: (voiceLog: VoiceLog) => void;
  selectedId?: string;
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
 * Format date as relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get status icon and color
 */
function getStatusDisplay(status: VoiceLog['status']) {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircleIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        variant: 'success' as const,
      };
    case 'failed':
    case 'error':
      return {
        icon: ExclamationCircleIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        variant: 'danger' as const,
      };
    case 'processing':
    case 'uploading':
    case 'uploaded':
      return {
        icon: ArrowPathIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        variant: 'info' as const,
        animate: true,
      };
    default:
      return {
        icon: ClockIcon,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        variant: 'default' as const,
      };
  }
}

/**
 * Single voice log list item
 */
function VoiceLogListItem({
  voiceLog,
  isSelected,
  onClick,
}: {
  voiceLog: VoiceLog;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const statusDisplay = getStatusDisplay(voiceLog.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors',
        isSelected && 'bg-brand-primary-light'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          statusDisplay.bgColor
        )}>
          <StatusIcon
            className={cn(
              'h-5 w-5',
              statusDisplay.color,
              statusDisplay.animate && 'animate-spin'
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">
                {voiceLog.projectContext?.projectName || 'Voice Log'}
              </span>
              <Badge
                variant={statusDisplay.variant}
                size="sm"
              >
                {VOICE_LOG_STATUS_LABELS[voiceLog.status]}
              </Badge>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatRelativeTime(voiceLog.recordedAt)}
            </span>
          </div>

          {/* Summary or placeholder */}
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {voiceLog.summary?.bullets?.[0] ||
              voiceLog.userSummary ||
              'Processing voice log...'}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MicrophoneIcon className="h-3.5 w-3.5" />
              {formatDuration(voiceLog.durationSeconds)}
            </span>
            {voiceLog.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />
                Location recorded
              </span>
            )}
            {voiceLog.summary?.blockers && voiceLog.summary.blockers.length > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <ExclamationCircleIcon className="h-3.5 w-3.5" />
                {voiceLog.summary.blockers.length} blocker{voiceLog.summary.blockers.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <MicrophoneIcon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No voice logs yet</h3>
      <p className="text-sm text-gray-500 max-w-sm">
        Record your daily work summary using the voice recorder. Your logs will appear here.
      </p>
    </div>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Voice Log List Component
 *
 * Displays a list of voice logs with status, summary, and metadata.
 */
export function VoiceLogList({
  voiceLogs,
  loading,
  onSelect,
  selectedId,
  className,
}: VoiceLogListProps) {
  if (loading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <LoadingSkeleton />
      </Card>
    );
  }

  if (voiceLogs.length === 0) {
    return (
      <Card className={className}>
        <EmptyState />
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden divide-y divide-gray-100', className)}>
      {voiceLogs.map((voiceLog) => (
        <VoiceLogListItem
          key={voiceLog.id}
          voiceLog={voiceLog}
          isSelected={voiceLog.id === selectedId}
          onClick={() => onSelect?.(voiceLog)}
        />
      ))}
    </Card>
  );
}
