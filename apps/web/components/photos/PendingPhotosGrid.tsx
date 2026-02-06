'use client';

/**
 * PendingPhotosGrid Component
 * Displays pending photos from IndexedDB with upload status and editing capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  TrashIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import {
  getOfflinePhotoService,
  PendingPhoto,
  PhotoCategory,
  UploadProgress,
  UploadResult,
} from '@/lib/offline/offline-photos';
import { useNetworkStatus } from '@/lib/offline/network-status';
import { toast } from '@/components/ui/Toast';
import { logger } from '@/lib/utils/logger';

interface PendingPhotosGridProps {
  projectId?: string; // If provided, only show photos for this project
  onPhotosUploaded?: (result: UploadResult) => void;
  className?: string;
}

const CATEGORY_OPTIONS = [
  { label: 'Progress', value: 'progress' },
  { label: 'Issue', value: 'issue' },
  { label: 'Before', value: 'before' },
  { label: 'After', value: 'after' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Safety', value: 'safety' },
  { label: 'Material', value: 'material' },
];

const CATEGORY_COLORS: Record<PhotoCategory, string> = {
  progress: 'bg-blue-100 text-blue-700',
  issue: 'bg-red-100 text-red-700',
  before: 'bg-gray-100 text-gray-700',
  after: 'bg-green-100 text-green-700',
  inspection: 'bg-purple-100 text-purple-700',
  safety: 'bg-orange-100 text-orange-700',
  material: 'bg-amber-100 text-amber-700',
};

export default function PendingPhotosGrid({
  projectId,
  onPhotosUploaded,
  className,
}: PendingPhotosGridProps) {
  const { isOnline } = useNetworkStatus();
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editCategory, setEditCategory] = useState<PhotoCategory>('progress');

  const service = getOfflinePhotoService();

  // Load pending photos
  const loadPhotos = useCallback(async () => {
    try {
      const allPhotos = projectId
        ? await service.getPendingPhotosForProject(projectId)
        : await service.getPendingPhotos();

      // Filter out completed photos
      const pending = allPhotos.filter((p) => p.syncStatus !== 'completed');
      setPhotos(pending);
    } catch (error) {
      logger.error('Failed to load pending photos', { error: error, component: 'PendingPhotosGrid' });
    } finally {
      setLoading(false);
    }
  }, [projectId, service]);

  // Initial load and subscribe to changes
  useEffect(() => {
    loadPhotos();

    const unsubscribe = service.subscribeToQueueChanges(() => {
      loadPhotos();
    });

    return unsubscribe;
  }, [loadPhotos, service]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && photos.length > 0 && !syncing) {
      // Small delay to allow network to stabilize
      const timer = setTimeout(() => {
        handleSync();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync all pending photos
  const handleSync = useCallback(async () => {
    if (!isOnline) {
      toast.error('No network connection');
      return;
    }

    setSyncing(true);
    setUploadProgress(null);

    try {
      const result = await service.processUploadQueue((progress) => {
        setUploadProgress(progress);
      });

      if (result.successful > 0) {
        toast.success(`${result.successful} photo${result.successful > 1 ? 's' : ''} uploaded`);
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} photo${result.failed > 1 ? 's' : ''} failed to upload`);
      }

      onPhotosUploaded?.(result);
      await loadPhotos();
    } catch (error) {
      logger.error('Sync failed', { error: error, component: 'PendingPhotosGrid' });
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
      setUploadProgress(null);
    }
  }, [isOnline, service, loadPhotos, onPhotosUploaded]);

  // Delete a pending photo
  const handleDelete = useCallback(
    async (localId: string) => {
      if (!confirm('Delete this photo? It has not been uploaded yet.')) {
        return;
      }

      try {
        await service.deletePendingPhoto(localId);
        toast.success('Photo deleted');
        await loadPhotos();
      } catch (error) {
        logger.error('Failed to delete photo', { error: error, component: 'PendingPhotosGrid' });
        toast.error('Failed to delete photo');
      }
    },
    [service, loadPhotos]
  );

  // Start editing a photo
  const startEdit = useCallback((photo: PendingPhoto) => {
    setEditingPhoto(photo.localId);
    setEditCaption(photo.caption || '');
    setEditCategory(photo.category);
  }, []);

  // Save edits
  const saveEdit = useCallback(async () => {
    if (!editingPhoto) return;

    try {
      await service.updatePendingPhoto(editingPhoto, {
        caption: editCaption.trim() || undefined,
        category: editCategory,
      });
      toast.success('Photo updated');
      setEditingPhoto(null);
      await loadPhotos();
    } catch (error) {
      logger.error('Failed to update photo', { error: error, component: 'PendingPhotosGrid' });
      toast.error('Failed to update photo');
    }
  }, [editingPhoto, editCaption, editCategory, service, loadPhotos]);

  // Retry failed upload
  const handleRetry = useCallback(
    async (localId: string) => {
      if (!isOnline) {
        toast.error('No network connection');
        return;
      }

      try {
        await service.updatePendingPhoto(localId, {
          syncStatus: 'pending',
          errorMessage: undefined,
        });
        toast.info('Retrying upload...');
        const result = await service.uploadPhoto(localId);
        if (result.success) {
          toast.success('Photo uploaded');
        } else {
          toast.error(result.error || 'Upload failed');
        }
        await loadPhotos();
      } catch (error) {
        logger.error('Retry failed', { error: error, component: 'PendingPhotosGrid' });
        toast.error('Retry failed');
      }
    },
    [isOnline, service, loadPhotos]
  );

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (photos.length === 0) {
    return null; // Don't show anything if no pending photos
  }

  const pendingCount = photos.filter((p) => p.syncStatus === 'pending').length;
  const failedCount = photos.filter((p) => p.syncStatus === 'failed').length;
  const uploadingCount = photos.filter((p) => p.syncStatus === 'uploading').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with sync button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Pending Uploads
          </h3>
          <Badge variant={isOnline ? 'success' : 'warning'} size="sm">
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSync}
          loading={syncing}
          disabled={!isOnline || photos.length === 0}
          icon={<CloudArrowUpIcon className="h-4 w-4" />}
        >
          {syncing
            ? uploadProgress
              ? `${uploadProgress.current}/${uploadProgress.total}`
              : 'Syncing...'
            : `Sync ${photos.length}`}
        </Button>
      </div>

      {/* Status summary */}
      {(pendingCount > 0 || failedCount > 0 || uploadingCount > 0) && (
        <div className="flex flex-wrap gap-2 text-sm">
          {pendingCount > 0 && (
            <span className="text-gray-600">
              {pendingCount} pending
            </span>
          )}
          {uploadingCount > 0 && (
            <span className="text-blue-600">
              {uploadingCount} uploading
            </span>
          )}
          {failedCount > 0 && (
            <span className="text-red-600">
              {failedCount} failed
            </span>
          )}
        </div>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo) => {
          const _isEditing = editingPhoto === photo.localId;
          const isUploading = photo.syncStatus === 'uploading';
          const hasFailed = photo.syncStatus === 'failed';

          return (
            <div
              key={photo.localId}
              className={cn(
                'relative group rounded-lg overflow-hidden bg-gray-100',
                'aspect-square',
                isUploading && 'opacity-70'
              )}
            >
              {/* Thumbnail with lazy loading */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnail}
                alt={photo.caption || 'Pending photo'}
                loading="lazy"
                className="w-full h-full object-cover"
              />

              {/* Status overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Category badge */}
              <div className="absolute top-2 left-2">
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                    CATEGORY_COLORS[photo.category]
                  )}
                >
                  {photo.category}
                </span>
              </div>

              {/* Status indicator */}
              <div className="absolute top-2 right-2">
                {isUploading && (
                  <div className="p-1 bg-blue-500 rounded-full animate-pulse">
                    <CloudArrowUpIcon className="h-4 w-4 text-white" />
                  </div>
                )}
                {hasFailed && (
                  <div className="p-1 bg-red-500 rounded-full">
                    <ExclamationTriangleIcon className="h-4 w-4 text-white" />
                  </div>
                )}
                {photo.syncStatus === 'pending' && (
                  <div className="p-1 bg-gray-500 rounded-full">
                    <CloudArrowUpIcon className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Caption and time */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                {photo.caption && (
                  <p className="text-white text-xs truncate mb-1">{photo.caption}</p>
                )}
                <p className="text-white/70 text-xs">{formatTime(photo.createdAt)}</p>
              </div>

              {/* Action buttons (visible on hover or tap) */}
              <div
                className={cn(
                  'absolute inset-0 bg-black/40 flex items-center justify-center gap-2',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  isUploading && 'hidden'
                )}
              >
                <button
                  onClick={() => startEdit(photo)}
                  className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>

                {hasFailed && (
                  <button
                    onClick={() => handleRetry(photo.localId)}
                    className="p-2 bg-white rounded-full text-blue-600 hover:bg-gray-100"
                    title="Retry"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(photo.localId)}
                  className="p-2 bg-white rounded-full text-red-600 hover:bg-gray-100"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Error message */}
              {hasFailed && photo.errorMessage && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 text-center">
                  {photo.errorMessage.length > 30
                    ? photo.errorMessage.substring(0, 30) + '...'
                    : photo.errorMessage}
                </div>
              )}

              {/* Upload progress */}
              {isUploading && uploadProgress?.currentPhotoId === photo.localId && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Edit Photo</h3>
              <button
                onClick={() => setEditingPhoto(null)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Preview thumbnail */}
              {photos.find((p) => p.localId === editingPhoto) && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photos.find((p) => p.localId === editingPhoto)?.thumbnail}
                  alt="Preview"
                  loading="lazy"
                  className="w-full h-40 object-cover rounded-lg"
                />
              )}

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caption
                </label>
                <input
                  type="text"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Add a description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>

              {/* Category */}
              <Select
                label="Category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as PhotoCategory)}
                options={CATEGORY_OPTIONS}
              />
            </div>

            <div className="flex gap-3 p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setEditingPhoto(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveEdit}
                icon={<CheckCircleIcon className="h-4 w-4" />}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
