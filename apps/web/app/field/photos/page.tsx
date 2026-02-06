'use client';

/**
 * Field Photos Page
 * Offline-first photo capture and management for field workers
 */

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  CameraIcon,
  CloudArrowUpIcon,
  PhotoIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import OfflinePhotoCapture from '@/components/photos/OfflinePhotoCapture';
import PendingPhotosGrid from '@/components/photos/PendingPhotosGrid';
import { useAuth } from '@/lib/auth';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { useProjectPhotos, MergedPhoto } from '@/lib/hooks/useProjectPhotos';
import { Project } from '@/types';
import { useNetworkStatus } from '@/lib/offline/network-status';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

const CATEGORY_OPTIONS = [
  { label: 'All Categories', value: '' },
  { label: 'Progress', value: 'progress' },
  { label: 'Issue', value: 'issue' },
  { label: 'Before', value: 'before' },
  { label: 'After', value: 'after' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Safety', value: 'safety' },
  { label: 'Material', value: 'material' },
];

const CATEGORY_COLORS: Record<string, string> = {
  progress: 'bg-blue-100 text-blue-700',
  issue: 'bg-red-100 text-red-700',
  before: 'bg-gray-100 text-gray-700',
  after: 'bg-green-100 text-green-700',
  inspection: 'bg-purple-100 text-purple-700',
  safety: 'bg-orange-100 text-orange-700',
  material: 'bg-amber-100 text-amber-700',
};

type ViewMode = 'grid' | 'list';

export default function FieldPhotosPage() {
  const { profile, loading: authLoading } = useAuth();
  const { isOnline } = useNetworkStatus();
  const searchParams = useSearchParams();

  // State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showCapture, setShowCapture] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<MergedPhoto | null>(null);

  // Get projects for selector
  const { data: projectsData } = useProjects();
  const projects = useMemo(() => (projectsData || []) as Project[], [projectsData]);

  // Get photos for selected project
  const {
    mergedPhotos,
    pendingCount,
    loading: photosLoading,
    isSyncing,
    syncPendingPhotos,
  } = useProjectPhotos(selectedProjectId);

  // Set initial project from URL or first project
  useEffect(() => {
    const projectIdParam = searchParams.get('projectId');
    if (projectIdParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch setState is not synchronous
      setSelectedProjectId(projectIdParam);
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, searchParams, selectedProjectId]);

  // Filter photos by category
  const filteredPhotos = categoryFilter
    ? mergedPhotos.filter((p) => p.type === categoryFilter)
    : mergedPhotos;

  // Handle photo capture
  const handleCapture = (_localId: string) => {
    setShowCapture(false);
    toast.success('Photo captured!');
  };

  // Handle sync
  const handleSync = async () => {
    await syncPendingPhotos();
  };

  // Format date
  const formatDate = (date: Date) => {
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
  if (authLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Get current project
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <PageHeader
        title="Photos"
        description={currentProject?.name || 'Select a project'}
        breadcrumbs={[
          { label: 'Field', href: '/field' },
          { label: 'Photos' },
        ]}
      />

      {/* Offline banner */}
      {!isOnline && (
        <div className="mx-4 mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">You&apos;re offline</p>
            <p className="text-xs text-yellow-700">
              Photos will be saved locally and uploaded when you&apos;re back online.
            </p>
          </div>
        </div>
      )}

      {/* Pending uploads banner */}
      {pendingCount > 0 && (
        <div className="mx-4 mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CloudArrowUpIcon className="h-5 w-5 text-brand-primary" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                {pendingCount} photo{pendingCount > 1 ? 's' : ''} pending upload
              </p>
              {!isOnline && (
                <p className="text-xs text-blue-700">Will sync when online</p>
              )}
            </div>
          </div>
          {isOnline && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSync}
              loading={isSyncing}
              icon={<CloudArrowUpIcon className="h-4 w-4" />}
            >
              Sync Now
            </Button>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="px-4 pb-4 space-y-3">
        {/* Project selector */}
        <Select
          label="Project"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          options={[
            { label: 'Select a project', value: '' },
            ...projects.map((p) => ({ label: p.name, value: p.id })),
          ]}
        />

        {/* Action buttons and filters */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setShowCapture(!showCapture)}
            icon={<CameraIcon className="h-5 w-5" />}
            disabled={!selectedProjectId}
            className="flex-1 sm:flex-none"
          >
            {showCapture ? 'Cancel' : 'Take Photo'}
          </Button>

          <div className="flex-1 sm:flex-none">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={CATEGORY_OPTIONS}
              size="sm"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1 border rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded',
                viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded',
                viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Photo capture section */}
      {showCapture && selectedProjectId && profile?.orgId && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium tracking-tight text-gray-700 mb-3">Capture Photo</h3>
            <OfflinePhotoCapture
              projectId={selectedProjectId}
              orgId={profile.orgId}
              onCapture={handleCapture}
            />
          </div>
        </div>
      )}

      {/* Pending photos section */}
      {selectedProjectId && pendingCount > 0 && (
        <div className="px-4 pb-4">
          <PendingPhotosGrid projectId={selectedProjectId} />
        </div>
      )}

      {/* Photo gallery */}
      <div className="flex-1 px-4 pb-4 overflow-auto">
        {!selectedProjectId ? (
          <EmptyState
            icon={<PhotoIcon className="h-full w-full" />}
            title="Select a Project"
            description="Choose a project above to view and capture photos"
          />
        ) : photosLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <EmptyState
            icon={<CameraIcon className="h-full w-full" />}
            title="No Photos Yet"
            description={
              categoryFilter
                ? `No ${categoryFilter} photos found. Try a different filter.`
                : 'Take your first photo to get started.'
            }
            action={
              !categoryFilter
                ? { label: 'Take Photo', onClick: () => setShowCapture(true) }
                : undefined
            }
          />
        ) : viewMode === 'grid' ? (
          // Grid view
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredPhotos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <Image
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.caption || 'Project photo'}
                  fill
                  className="object-cover"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Pending badge */}
                {photo.isPending && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="warning" size="sm">
                      {photo.syncStatus === 'uploading' ? 'Uploading' : 'Pending'}
                    </Badge>
                  </div>
                )}

                {/* Category badge */}
                <div className="absolute top-2 left-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                      CATEGORY_COLORS[photo.type || 'progress']
                    )}
                  >
                    {photo.type}
                  </span>
                </div>

                {/* Caption on hover */}
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{photo.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          // List view
          <div className="space-y-2">
            {filteredPhotos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-brand-primary transition-colors text-left"
              >
                <Image
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.caption || 'Project photo'}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                        CATEGORY_COLORS[photo.type || 'progress']
                      )}
                    >
                      {photo.type}
                    </span>
                    {photo.isPending && (
                      <Badge variant="warning" size="sm">
                        {photo.syncStatus === 'uploading' ? 'Uploading' : 'Pending'}
                      </Badge>
                    )}
                  </div>
                  {photo.caption && (
                    <p className="text-sm text-gray-900 truncate">{photo.caption}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {formatDate(photo.takenAt || photo.createdAt)} • {photo.userName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Photo detail modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-4xl max-h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Project photo'}
              width={800}
              height={600}
              className="max-h-[70vh] w-auto object-contain rounded-lg"
            />
            <div className="mt-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                    CATEGORY_COLORS[selectedPhoto.type || 'progress']
                  )}
                >
                  {selectedPhoto.type}
                </span>
                {selectedPhoto.isPending && (
                  <Badge variant="warning" size="sm">
                    {selectedPhoto.syncStatus === 'uploading' ? 'Uploading' : 'Pending'}
                  </Badge>
                )}
              </div>
              {selectedPhoto.caption && (
                <p className="text-lg mb-1">{selectedPhoto.caption}</p>
              )}
              <p className="text-sm text-white/70">
                {formatDate(selectedPhoto.takenAt || selectedPhoto.createdAt)} • {selectedPhoto.userName}
              </p>
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
