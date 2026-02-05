'use client';

/**
 * OfflineProjectButton Component
 * Displays download/remove button for offline project access
 * Shows status indicator and last synced time
 */

import React from 'react';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  TrashIcon,
  CloudArrowDownIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline';
import { useOfflineProject } from '@/lib/hooks/useOfflineProject';
import { formatDistanceToNow } from '@/lib/date-utils';

// ============================================
// Types
// ============================================

interface OfflineProjectButtonProps {
  projectId: string;
  projectName?: string;
  variant?: 'default' | 'compact' | 'card';
  showStatus?: boolean;
  className?: string;
}

// ============================================
// Component
// ============================================

export function OfflineProjectButton({
  projectId,
  projectName: _projectName,
  variant = 'default',
  showStatus = true,
  className = '',
}: OfflineProjectButtonProps) {
  const {
    isDownloaded,
    isDownloading,
    isRemoving,
    isOnline,
    lastSynced,
    downloadProgress,
    downloadProject,
    removeDownload,
  } = useOfflineProject({ projectId });

  // Format last synced time
  const lastSyncedText = lastSynced
    ? `Synced ${formatDistanceToNow(lastSynced)}`
    : null;

  // ==========================================
  // Compact Variant
  // ==========================================
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {isDownloaded ? (
          <>
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircleIcon className="h-4 w-4" />
              Offline
            </span>
            <button
              onClick={removeDownload}
              disabled={isRemoving}
              className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-50"
              title="Remove offline data"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            onClick={downloadProject}
            disabled={isDownloading || !isOnline}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isOnline ? 'Download for offline' : 'No network connection'}
          >
            {isDownloading ? (
              <div className="h-4 w-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            ) : !isOnline ? (
              <SignalSlashIcon className="h-4 w-4" />
            ) : (
              <ArrowDownTrayIcon className="h-4 w-4" />
            )}
            {isDownloading ? 'Downloading...' : 'Offline'}
          </button>
        )}
      </div>
    );
  }

  // ==========================================
  // Card Variant
  // ==========================================
  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-xl border p-4 ${className}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Offline Access</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {isDownloaded
                ? 'Project available offline'
                : 'Download project for field use'}
            </p>
          </div>

          <div className="flex-shrink-0">
            {isDownloaded ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Available
              </span>
            ) : !isOnline ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                <SignalSlashIcon className="h-3.5 w-3.5" />
                Offline
              </span>
            ) : null}
          </div>
        </div>

        {/* Progress Bar */}
        {isDownloading && downloadProgress && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{downloadProgress.message}</span>
              <span>{downloadProgress.percent}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Last Synced Info */}
        {showStatus && isDownloaded && lastSyncedText && (
          <p className="text-xs text-gray-400 mt-2">{lastSyncedText}</p>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {isDownloaded ? (
            <button
              onClick={removeDownload}
              disabled={isRemoving}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {isRemoving ? (
                <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
              Remove Download
            </button>
          ) : (
            <button
              onClick={downloadProject}
              disabled={isDownloading || !isOnline}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Downloading...
                </>
              ) : !isOnline ? (
                <>
                  <SignalSlashIcon className="h-4 w-4" />
                  No Connection
                </>
              ) : (
                <>
                  <CloudArrowDownIcon className="h-4 w-4" />
                  Download for Offline
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // Default Variant
  // ==========================================
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {isDownloaded ? (
        <>
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <CheckCircleIcon className="h-4 w-4" />
              Available Offline
            </span>
            {showStatus && lastSyncedText && (
              <span className="text-xs text-gray-500">{lastSyncedText}</span>
            )}
          </div>

          {/* Remove Button */}
          <button
            onClick={removeDownload}
            disabled={isRemoving}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Remove offline data"
          >
            {isRemoving ? (
              <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <TrashIcon className="h-5 w-5" />
            )}
          </button>
        </>
      ) : (
        <>
          {/* Download Button */}
          <button
            onClick={downloadProject}
            disabled={isDownloading || !isOnline}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isOnline ? 'Download for offline access' : 'No network connection'}
          >
            {isDownloading ? (
              <>
                <div className="h-4 w-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                {downloadProgress ? (
                  <span>Downloading... {downloadProgress.percent}%</span>
                ) : (
                  <span>Downloading...</span>
                )}
              </>
            ) : !isOnline ? (
              <>
                <SignalSlashIcon className="h-4 w-4" />
                No Connection
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download for Offline
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}

export default OfflineProjectButton;
