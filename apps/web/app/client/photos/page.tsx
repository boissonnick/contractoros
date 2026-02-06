'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { PageHeader } from '@/components/ui/PageHeader';
import PhotoGrid, { PhotoGridSkeleton } from '@/components/photos/PhotoGrid';
import BeforeAfterSlider, { BeforeAfterSliderCompact } from '@/components/photos/BeforeAfterSlider';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ProjectPhoto, BeforeAfterPair } from '@/types';
import {
  PhotoIcon,
  FunnelIcon,
  CalendarIcon,
  FolderIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface ClientProject {
  id: string;
  name: string;
  status: string;
}

function photoFromFirestore(id: string, data: Record<string, unknown>): ProjectPhoto {
  return {
    id,
    projectId: data.projectId as string,
    taskId: data.taskId as string | undefined,
    phaseId: data.phaseId as string | undefined,
    scopeItemId: data.scopeItemId as string | undefined,
    folderId: data.folderId as string | undefined,
    albumId: data.albumId as string | undefined,
    userId: data.userId as string,
    userName: data.userName as string | undefined,
    url: data.url as string,
    thumbnailUrl: data.thumbnailUrl as string | undefined,
    type: data.type as ProjectPhoto['type'],
    caption: data.caption as string | undefined,
    tags: data.tags as string[] | undefined,
    approved: data.approved as boolean | undefined,
    location: data.location as ProjectPhoto['location'] | undefined,
    pairedPhotoId: data.pairedPhotoId as string | undefined,
    pairType: data.pairType as 'before' | 'after' | undefined,
    annotations: data.annotations as ProjectPhoto['annotations'] | undefined,
    metadata: data.metadata as ProjectPhoto['metadata'] | undefined,
    isPublic: data.isPublic as boolean | undefined,
    shareToken: data.shareToken as string | undefined,
    takenAt: data.takenAt ? (data.takenAt as Timestamp).toDate() : new Date(),
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
  };
}

function pairFromFirestore(id: string, data: Record<string, unknown>): BeforeAfterPair {
  return {
    id,
    projectId: data.projectId as string,
    beforePhotoId: data.beforePhotoId as string,
    afterPhotoId: data.afterPhotoId as string,
    title: data.title as string | undefined,
    description: data.description as string | undefined,
    location: data.location as string | undefined,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
  };
}

// Date range type
type DateRangePreset = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'custom';

const DATE_PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'custom', label: 'Custom Range' },
];

export default function ClientPhotosPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [beforeAfterPairs, setBeforeAfterPairs] = useState<BeforeAfterPair[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'comparisons'>('grid');

  // Expanded before/after modal state
  const [expandedPair, setExpandedPair] = useState<BeforeAfterPair | null>(null);

  // Load projects for this client
  useEffect(() => {
    async function loadProjects() {
      if (!user?.uid) return;

      try {
        const projectsQuery = query(
          collection(db, 'projects'),
          where('clientId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const snap = await getDocs(projectsQuery);
        const projectList: ClientProject[] = snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || 'Untitled Project',
          status: d.data().status || 'active',
        }));

        setProjects(projectList);
      } catch (err) {
        console.error('Error loading projects:', err);
      }
    }

    loadProjects();
  }, [user?.uid]);

  // Load photos from client's projects
  useEffect(() => {
    async function loadPhotos() {
      if (!user?.uid || projects.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const allPhotos: ProjectPhoto[] = [];
        const allPairs: BeforeAfterPair[] = [];
        const projectIds = projects.map((p) => p.id);

        // Firestore 'in' queries support max 30 items, so batch if needed
        const batches: string[][] = [];
        for (let i = 0; i < projectIds.length; i += 30) {
          batches.push(projectIds.slice(i, i + 30));
        }

        for (const batch of batches) {
          // Fetch photos
          const photosQuery = query(
            collection(db, 'photos'),
            where('projectId', 'in', batch),
            orderBy('createdAt', 'desc')
          );
          const photosSnap = await getDocs(photosQuery);
          photosSnap.docs.forEach((d) => {
            allPhotos.push(photoFromFirestore(d.id, d.data()));
          });

          // Fetch before/after pairs
          const pairsQuery = query(
            collection(db, 'beforeAfterPairs'),
            where('projectId', 'in', batch),
            orderBy('createdAt', 'desc')
          );
          const pairsSnap = await getDocs(pairsQuery);
          pairsSnap.docs.forEach((d) => {
            allPairs.push(pairFromFirestore(d.id, d.data()));
          });
        }

        // Sort by date (newest first)
        allPhotos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        allPairs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setPhotos(allPhotos);
        setBeforeAfterPairs(allPairs);
      } catch (err) {
        console.error('Error loading photos:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPhotos();
  }, [user?.uid, projects]);

  // Compute date range based on preset
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (datePreset) {
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month': {
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      }
      case 'last_3_months':
        return { start: subMonths(now, 3), end: now };
      case 'last_6_months':
        return { start: subMonths(now, 6), end: now };
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate),
            end: new Date(customEndDate + 'T23:59:59'),
          };
        }
        return null;
      default:
        return null;
    }
  }, [datePreset, customStartDate, customEndDate]);

  // Filter photos based on selected project and date range
  const filteredPhotos = useMemo(() => {
    let result = photos;

    // Filter by project
    if (selectedProject !== 'all') {
      result = result.filter((p) => p.projectId === selectedProject);
    }

    // Filter by date range
    if (dateRange) {
      result = result.filter((p) => {
        const photoDate = p.takenAt || p.createdAt;
        return photoDate >= dateRange.start && photoDate <= dateRange.end;
      });
    }

    return result;
  }, [photos, selectedProject, dateRange]);

  // Filter before/after pairs
  const filteredPairs = useMemo(() => {
    let result = beforeAfterPairs;

    // Filter by project
    if (selectedProject !== 'all') {
      result = result.filter((p) => p.projectId === selectedProject);
    }

    // Filter by date
    if (dateRange) {
      result = result.filter((p) => {
        return p.createdAt >= dateRange.start && p.createdAt <= dateRange.end;
      });
    }

    return result;
  }, [beforeAfterPairs, selectedProject, dateRange]);

  // Get photo by ID helper for pairs
  const getPhotoById = (id: string) => photos.find((p) => p.id === id);

  // Get project name helper
  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project Photos"
          description="Progress photos from your projects"
        />
        <PhotoGridSkeleton count={12} columns={4} />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project Photos"
          description="Progress photos from your projects"
        />
        <Card className="p-8 text-center">
          <FolderIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No projects found</p>
          <p className="text-sm text-gray-400 mt-1">
            Photos will appear here once you are added to a project.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Photos"
        description="Progress photos from your projects"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Project filter */}
        <div className="flex items-center gap-2">
          <FolderIcon className="h-4 w-4 text-gray-400" />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-48 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          >
            {DATE_PRESET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Custom date inputs */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate}
                className="px-2 py-1.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>
          )}
        </div>

        {/* View mode toggle */}
        {filteredPairs.length > 0 && (
          <div className="flex items-center gap-1 ml-auto bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <PhotoIcon className="h-4 w-4 inline mr-1" />
              All Photos
            </button>
            <button
              onClick={() => setViewMode('comparisons')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'comparisons'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <ArrowsRightLeftIcon className="h-4 w-4 inline mr-1" />
              Before/After
            </button>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>
          <FunnelIcon className="h-4 w-4 inline mr-1" />
          {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}
        </span>
        {filteredPairs.length > 0 && (
          <span>
            <ArrowsRightLeftIcon className="h-4 w-4 inline mr-1" />
            {filteredPairs.length} comparison{filteredPairs.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        /* Photo Grid View */
        filteredPhotos.length === 0 ? (
          <Card className="p-8 text-center">
            <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No photos found</p>
            <p className="text-sm text-gray-400 mt-1">
              {photos.length === 0
                ? 'Photos will appear here as your project progresses.'
                : 'Try adjusting your filters to see more photos.'}
            </p>
          </Card>
        ) : (
          <PhotoGrid
            photos={filteredPhotos}
            columns={4}
            gap="md"
            emptyMessage="No photos match your filters"
          />
        )
      ) : (
        /* Before/After Comparisons View */
        filteredPairs.length === 0 ? (
          <Card className="p-8 text-center">
            <ArrowsRightLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No before/after comparisons</p>
            <p className="text-sm text-gray-400 mt-1">
              Before and after photo pairs will appear here when available.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPairs.map((pair) => {
              const beforePhoto = getPhotoById(pair.beforePhotoId);
              const afterPhoto = getPhotoById(pair.afterPhotoId);

              if (!beforePhoto || !afterPhoto) return null;

              return (
                <Card key={pair.id} className="overflow-hidden">
                  <BeforeAfterSliderCompact
                    beforePhoto={beforePhoto}
                    afterPhoto={afterPhoto}
                    onClick={() => setExpandedPair(pair)}
                    className="w-full"
                  />
                  <div className="p-3">
                    {pair.title && (
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {pair.title}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {getProjectName(pair.projectId)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(pair.createdAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* Expanded Before/After Modal */}
      {expandedPair && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setExpandedPair(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold tracking-tight text-gray-900">
                    {expandedPair.title || 'Before & After Comparison'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getProjectName(expandedPair.projectId)}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedPair(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              {(() => {
                const beforePhoto = getPhotoById(expandedPair.beforePhotoId);
                const afterPhoto = getPhotoById(expandedPair.afterPhotoId);
                if (!beforePhoto || !afterPhoto) return null;
                return (
                  <BeforeAfterSlider
                    beforePhoto={beforePhoto}
                    afterPhoto={afterPhoto}
                    showLabels
                    showDates
                  />
                );
              })()}
              {expandedPair.description && (
                <p className="mt-4 text-sm text-gray-600">
                  {expandedPair.description}
                </p>
              )}
              {expandedPair.location && (
                <p className="mt-2 text-xs text-gray-500">
                  Location: {expandedPair.location}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
