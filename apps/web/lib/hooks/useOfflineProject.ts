'use client';

/**
 * useOfflineProject Hook
 * Provides reactive access to offline project data with download/remove capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import {
  downloadProjectForOffline,
  getOfflineProject,
  removeOfflineProject,
  isProjectAvailableOffline,
  getProjectDownloadTime,
  OfflineProjectData,
  DownloadProgressCallback,
} from '@/lib/offline/offline-project';
import { useNetworkStatus } from '@/lib/offline/network-status';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui/Toast';

// ============================================
// Types
// ============================================

interface UseOfflineProjectOptions {
  projectId: string;
  autoCheckStatus?: boolean;
}

interface UseOfflineProjectResult {
  // Status
  isDownloaded: boolean;
  isDownloading: boolean;
  isRemoving: boolean;
  isOnline: boolean;
  lastSynced: Date | null;

  // Data
  offlineData: OfflineProjectData | null;

  // Progress
  downloadProgress: {
    percent: number;
    message: string;
  } | null;

  // Actions
  downloadProject: () => Promise<void>;
  removeDownload: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

// ============================================
// Hook
// ============================================

export function useOfflineProject(options: UseOfflineProjectOptions): UseOfflineProjectResult {
  const { projectId, autoCheckStatus = true } = options;
  const { user, profile } = useAuth();
  const { isOnline } = useNetworkStatus();

  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [offlineData, setOfflineData] = useState<OfflineProjectData | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{
    percent: number;
    message: string;
  } | null>(null);

  // Check if project is already downloaded
  const checkStatus = useCallback(async () => {
    if (!projectId) return;

    try {
      const available = await isProjectAvailableOffline(projectId);
      setIsDownloaded(available);

      if (available) {
        const downloadTime = await getProjectDownloadTime(projectId);
        setLastSynced(downloadTime);

        const data = await getOfflineProject(projectId);
        setOfflineData(data);
      } else {
        setLastSynced(null);
        setOfflineData(null);
      }
    } catch (error) {
      console.error('Failed to check offline status:', error);
    }
  }, [projectId]);

  // Auto-check status on mount
  useEffect(() => {
    if (autoCheckStatus && projectId) {
      checkStatus();
    }
  }, [autoCheckStatus, projectId, checkStatus]);

  // Download project for offline use
  const downloadProject = useCallback(async () => {
    if (!projectId || !profile?.orgId || !user?.uid) {
      toast.error('Unable to download: Missing project or user information');
      return;
    }

    if (!isOnline) {
      toast.error('No network connection. Cannot download project data.');
      return;
    }

    if (isDownloading) {
      return;
    }

    setIsDownloading(true);
    setDownloadProgress({ percent: 0, message: 'Starting download...' });

    try {
      const progressCallback: DownloadProgressCallback = (progress) => {
        setDownloadProgress({
          percent: progress.percent,
          message: progress.message,
        });
      };

      await downloadProjectForOffline(projectId, profile.orgId, user.uid, progressCallback);

      setIsDownloaded(true);
      setLastSynced(new Date());

      // Fetch the downloaded data
      const data = await getOfflineProject(projectId);
      setOfflineData(data);

      toast.success('Project downloaded for offline access');
    } catch (error) {
      console.error('Failed to download project:', error);
      toast.error('Failed to download project. Please try again.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  }, [projectId, profile?.orgId, user?.uid, isOnline, isDownloading]);

  // Remove offline download
  const removeDownload = useCallback(async () => {
    if (!projectId) return;

    if (isRemoving) {
      return;
    }

    setIsRemoving(true);

    try {
      await removeOfflineProject(projectId);

      setIsDownloaded(false);
      setLastSynced(null);
      setOfflineData(null);

      toast.success('Offline data removed');
    } catch (error) {
      console.error('Failed to remove offline data:', error);
      toast.error('Failed to remove offline data');
    } finally {
      setIsRemoving(false);
    }
  }, [projectId, isRemoving]);

  // Refresh status
  const refreshStatus = useCallback(async () => {
    await checkStatus();
  }, [checkStatus]);

  return {
    isDownloaded,
    isDownloading,
    isRemoving,
    isOnline,
    lastSynced,
    offlineData,
    downloadProgress,
    downloadProject,
    removeDownload,
    refreshStatus,
  };
}
