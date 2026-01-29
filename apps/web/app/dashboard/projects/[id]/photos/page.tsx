"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useProjectPhotos } from '@/lib/hooks/useProjectPhotos';
import { useAuth } from '@/lib/auth';
import { ProjectPhoto, ProjectPhase, PhotoAlbum, PhotoAnnotation } from '@/types';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import {
  PhotoGrid,
  PhotoLightbox,
  PhotoAlbumCard,
  PhotoAlbumCardSkeleton,
  CreateAlbumCard,
  CreateAlbumModal,
  BeforeAfterSlider,
  BeforeAfterSliderCompact,
} from '@/components/photos';
import {
  PhotoIcon,
  PlusIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FolderIcon,
  ArrowsRightLeftIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from '@/components/ui/Toast';

type ViewMode = 'all' | 'albums' | 'before-after';
type DisplayMode = 'grid' | 'timeline';
type FilterPhase = string | 'all';

export default function ProjectPhotosPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'OWNER' || profile?.role === 'PM';

  const {
    photos,
    albums,
    beforeAfterPairs,
    loading,
    uploadPhoto,
    uploadPhotos,
    approvePhoto,
    deletePhoto,
    addAnnotation,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    generateAlbumShareLink,
    createBeforeAfterPair,
    deleteBeforeAfterPair,
    getPhotosByAlbum,
  } = useProjectPhotos(projectId);

  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [filterPhase, setFilterPhase] = useState<FilterPhase>('all');
  const [filterApproved, setFilterApproved] = useState<'all' | 'approved' | 'pending'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPhaseId, setUploadPhaseId] = useState('');
  const [uploadAlbumId, setUploadAlbumId] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');

  // Modal states
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<PhotoAlbum | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<ProjectPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Before/after creation
  const [selectingBeforeAfter, setSelectingBeforeAfter] = useState<'before' | 'after' | null>(null);
  const [beforePhoto, setBeforePhoto] = useState<ProjectPhoto | null>(null);
  const [selectedBeforeAfterPair, setSelectedBeforeAfterPair] = useState<{
    before: ProjectPhoto;
    after: ProjectPhoto;
    title?: string;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // Load phases
  useEffect(() => {
    getDocs(collection(db, 'projects', projectId, 'phases')).then(snap => {
      setPhases(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ProjectPhase).sort((a, b) => a.order - b.order));
    });
  }, [projectId]);

  // Filter photos
  const filteredPhotos = photos.filter(p => {
    if (selectedAlbum && p.albumId !== selectedAlbum.id) return false;
    if (filterPhase !== 'all' && p.phaseId !== filterPhase) return false;
    if (filterApproved === 'approved' && !p.approved) return false;
    if (filterApproved === 'pending' && p.approved) return false;
    return true;
  });

  // Group by date for timeline
  const photosByDate = filteredPhotos.reduce<Record<string, ProjectPhoto[]>>((acc, p) => {
    const key = formatDate(p.createdAt, { year: 'numeric', month: 'long', day: 'numeric' });
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      await uploadPhotos(Array.from(files), {
        phaseId: uploadPhaseId || undefined,
        albumId: uploadAlbumId || selectedAlbum?.id || undefined,
        caption: uploadCaption || undefined,
        type: 'progress',
      });
      toast.success(`Uploaded ${files.length} photo${files.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
      setUploadCaption('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Handle album creation/edit
  const handleAlbumSubmit = async (data: Omit<PhotoAlbum, 'id' | 'projectId' | 'orgId' | 'photoCount' | 'createdBy' | 'createdAt'>) => {
    try {
      if (editingAlbum) {
        await updateAlbum(editingAlbum.id, data);
        toast.success('Album updated');
      } else {
        await createAlbum(data.name, { description: data.description });
        toast.success('Album created');
      }
      setShowAlbumModal(false);
      setEditingAlbum(null);
    } catch (error) {
      console.error('Album save failed:', error);
      toast.error('Failed to save album');
    }
  };

  // Handle album delete
  const handleAlbumDelete = async (albumId: string) => {
    if (!confirm('Delete this album? Photos will not be deleted.')) return;
    try {
      await deleteAlbum(albumId);
      toast.success('Album deleted');
      if (selectedAlbum?.id === albumId) {
        setSelectedAlbum(null);
      }
    } catch (error) {
      console.error('Album delete failed:', error);
      toast.error('Failed to delete album');
    }
  };

  // Handle photo click for before/after selection
  const handlePhotoClick = (photo: ProjectPhoto, index: number) => {
    if (selectingBeforeAfter === 'before') {
      setBeforePhoto(photo);
      setSelectingBeforeAfter('after');
      toast.info('Now select the "after" photo');
    } else if (selectingBeforeAfter === 'after' && beforePhoto) {
      // Create the before/after pair
      createBeforeAfterPair(beforePhoto.id, photo.id);
      toast.success('Before/after comparison created');
      setBeforePhoto(null);
      setSelectingBeforeAfter(null);
    } else {
      // Normal photo click - open lightbox
      setLightboxPhotos(filteredPhotos);
      setLightboxIndex(index);
    }
  };

  // Handle annotation
  const handleAnnotate = async (photoId: string, annotations: Omit<PhotoAnnotation, 'id' | 'createdBy' | 'createdAt'>[]) => {
    try {
      for (const annotation of annotations) {
        await addAnnotation(photoId, annotation);
      }
      toast.success('Annotations saved');
    } catch (error) {
      console.error('Annotation save failed:', error);
      toast.error('Failed to save annotations');
    }
  };

  // Handle share
  const handleShare = async (photo: ProjectPhoto) => {
    try {
      await navigator.clipboard.writeText(photo.url);
      toast.success('Photo URL copied to clipboard');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <PhotoAlbumCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedAlbum && (
            <button
              onClick={() => setSelectedAlbum(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedAlbum ? selectedAlbum.name : 'Photos'}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedAlbum
                ? `${getPhotosByAlbum(selectedAlbum.id).length} photos`
                : `${photos.length} photo${photos.length !== 1 ? 's' : ''}, ${albums.length} album${albums.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode tabs */}
          {!selectedAlbum && (
            <div className="flex border border-gray-200 rounded-lg overflow-hidden mr-2">
              <button
                onClick={() => setViewMode('all')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                All
              </button>
              <button
                onClick={() => setViewMode('albums')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === 'albums' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                Albums
              </button>
              <button
                onClick={() => setViewMode('before-after')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === 'before-after' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                Before/After
              </button>
            </div>
          )}

          {/* Display controls */}
          {(viewMode === 'all' || selectedAlbum) && (
            <>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn('p-2 rounded-lg border border-gray-200', showFilters && 'bg-blue-50 border-blue-200')}
              >
                <FunnelIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDisplayMode('grid')}
                className={cn('p-2 rounded-lg border border-gray-200', displayMode === 'grid' && 'bg-blue-50 border-blue-200')}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDisplayMode('timeline')}
                className={cn('p-2 rounded-lg border border-gray-200', displayMode === 'timeline' && 'bg-blue-50 border-blue-200')}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Action buttons */}
          {viewMode === 'before-after' && !selectingBeforeAfter && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectingBeforeAfter('before');
                toast.info('Select the "before" photo first');
              }}
              icon={<ArrowsRightLeftIcon className="h-4 w-4" />}
            >
              Create Comparison
            </Button>
          )}

          {viewMode === 'albums' && !selectedAlbum && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setEditingAlbum(null); setShowAlbumModal(true); }}
              icon={<FolderIcon className="h-4 w-4" />}
            >
              New Album
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => fileRef.current?.click()}
            loading={uploading}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Upload
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Before/After selection mode banner */}
      {selectingBeforeAfter && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <ArrowsRightLeftIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-800">
              {selectingBeforeAfter === 'before'
                ? 'Click to select the "before" photo'
                : `"Before" selected. Now click the "after" photo.`}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectingBeforeAfter(null);
              setBeforePhoto(null);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Upload options */}
      {(viewMode === 'all' || selectedAlbum) && (
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500">Phase</label>
            <select
              value={uploadPhaseId}
              onChange={(e) => setUploadPhaseId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">No phase</option>
              {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {!selectedAlbum && (
            <div className="flex-1">
              <label className="text-xs text-gray-500">Album</label>
              <select
                value={uploadAlbumId}
                onChange={(e) => setUploadAlbumId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="">No album</option>
                {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex-1">
            <Input
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="text-sm"
            />
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (viewMode === 'all' || selectedAlbum) && (
        <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="text-xs text-gray-500">Phase</label>
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All phases</option>
              {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Status</label>
            <select
              value={filterApproved}
              onChange={(e) => setFilterApproved(e.target.value as 'all' | 'approved' | 'pending')}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      )}

      {/* All Photos View */}
      {(viewMode === 'all' || selectedAlbum) && (
        displayMode === 'grid' ? (
          <PhotoGrid
            photos={filteredPhotos}
            columns={4}
            gap="md"
            onPhotoClick={handlePhotoClick}
            onApprove={isAdmin ? approvePhoto : undefined}
            onDelete={isAdmin ? deletePhoto : undefined}
            isAdmin={isAdmin}
            emptyMessage={selectedAlbum ? 'No photos in this album yet.' : 'No photos yet. Upload your first photo above.'}
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(photosByDate).map(([date, datePhotos]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">{date}</h3>
                <PhotoGrid
                  photos={datePhotos}
                  columns={6}
                  gap="sm"
                  onPhotoClick={(photo) => handlePhotoClick(photo, filteredPhotos.indexOf(photo))}
                  isAdmin={isAdmin}
                />
              </div>
            ))}
            {filteredPhotos.length === 0 && (
              <div className="border border-dashed border-gray-300 rounded-xl p-12 text-center">
                <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No photos to display.</p>
              </div>
            )}
          </div>
        )
      )}

      {/* Albums View */}
      {viewMode === 'albums' && !selectedAlbum && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <CreateAlbumCard onClick={() => { setEditingAlbum(null); setShowAlbumModal(true); }} />
          {albums.map(album => {
            const albumPhotos = getPhotosByAlbum(album.id);
            const coverPhoto = albumPhotos.find(p => p.id === album.coverPhotoId) || albumPhotos[0];
            return (
              <PhotoAlbumCard
                key={album.id}
                album={album}
                coverPhoto={coverPhoto}
                onClick={() => setSelectedAlbum(album)}
                onEdit={() => { setEditingAlbum(album); setShowAlbumModal(true); }}
                onDelete={() => handleAlbumDelete(album.id)}
                onShare={async () => {
                  const link = await generateAlbumShareLink(album.id);
                  if (link) {
                    await navigator.clipboard.writeText(link);
                    toast.success('Share link copied!');
                  }
                }}
              />
            );
          })}
          {albums.length === 0 && (
            <div className="col-span-full border border-dashed border-gray-300 rounded-xl p-12 text-center">
              <FolderIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No albums yet. Create your first album to organize photos.</p>
            </div>
          )}
        </div>
      )}

      {/* Before/After View */}
      {viewMode === 'before-after' && (
        <div className="space-y-6">
          {beforeAfterPairs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {beforeAfterPairs.map(pair => {
                const before = photos.find(p => p.id === pair.beforePhotoId);
                const after = photos.find(p => p.id === pair.afterPhotoId);
                if (!before || !after) return null;

                return (
                  <div key={pair.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <BeforeAfterSlider
                      beforePhoto={before}
                      afterPhoto={after}
                      title={pair.title}
                      className="p-4"
                    />
                    {isAdmin && (
                      <div className="px-4 pb-4 flex justify-end">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this comparison?')) {
                              deleteBeforeAfterPair(pair.id);
                              toast.success('Comparison deleted');
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-xl p-12 text-center">
              <ArrowsRightLeftIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-4">No before/after comparisons yet.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectingBeforeAfter('before');
                  toast.info('Select the "before" photo first');
                }}
                icon={<ArrowsRightLeftIcon className="h-4 w-4" />}
              >
                Create Your First Comparison
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          open={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onApprove={isAdmin ? approvePhoto : undefined}
          onDelete={isAdmin ? deletePhoto : undefined}
          onAnnotate={handleAnnotate}
          onShare={handleShare}
          isAdmin={isAdmin}
          phaseName={phases.find(p => p.id === lightboxPhotos[lightboxIndex]?.phaseId)?.name}
        />
      )}

      {/* Create/Edit Album Modal */}
      <CreateAlbumModal
        open={showAlbumModal}
        onClose={() => { setShowAlbumModal(false); setEditingAlbum(null); }}
        onSubmit={handleAlbumSubmit}
        album={editingAlbum}
      />
    </div>
  );
}
