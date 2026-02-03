'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Photo } from '@/types';
import {
  PhotoIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface PhotoGroup {
  date: string;
  phaseId?: string;
  photos: Photo[];
}

interface PhotoTimelineProps {
  photos: Photo[];
  onViewAll?: () => void;
}

/**
 * LazyTimelinePhoto - Lazy loading photo item for timeline grid
 */
function LazyTimelinePhoto({
  photo,
  photoIndex,
  totalPhotos,
  onClick,
}: {
  photo: Photo;
  photoIndex: number;
  totalPhotos: number;
  onClick: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="relative aspect-square rounded-md overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* Placeholder */}
      {(!isVisible || !isLoaded) && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Image */}
      {isVisible && (
        <img
          src={photo.thumbnailUrl || photo.url}
          alt={photo.caption || `Photo ${photoIndex + 1}`}
          loading="lazy"
          onLoad={handleLoad}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {/* "More photos" overlay */}
      {photoIndex === 7 && totalPhotos > 8 && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white font-medium">
            +{totalPhotos - 8}
          </span>
        </div>
      )}
    </button>
  );
}

export function PhotoTimeline({ photos, onViewAll }: PhotoTimelineProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<PhotoGroup | null>(null);

  // Group photos by date and phaseId
  const groupedPhotos = useMemo(() => {
    const groups = new Map<string, PhotoGroup>();

    photos
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach((photo) => {
        const date = new Date(photo.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const key = `${date}-${photo.phaseId || 'General'}`;

        if (!groups.has(key)) {
          groups.set(key, {
            date,
            phaseId: photo.phaseId,
            photos: [],
          });
        }
        groups.get(key)!.photos.push(photo);
      });

    return Array.from(groups.values());
  }, [photos]);

  const openLightbox = (group: PhotoGroup, index: number) => {
    setSelectedGroup(group);
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedGroup(null);
    setCurrentPhotoIndex(0);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (!selectedGroup) return;
    const total = selectedGroup.photos.length;
    if (direction === 'prev') {
      setCurrentPhotoIndex((prev) => (prev - 1 + total) % total);
    } else {
      setCurrentPhotoIndex((prev) => (prev + 1) % total);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No photos yet</p>
        <p className="text-sm text-gray-400 mt-1">Photos will appear here as your project progresses</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Photo Timeline</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            View All Photos
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="p-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Groups */}
          <div className="space-y-6">
            {groupedPhotos.map((group, groupIndex) => (
              <div key={groupIndex} className="relative pl-10">
                {/* Timeline dot */}
                <div className="absolute left-2.5 top-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />

                {/* Date & Phase */}
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-900">{group.date}</p>
                  {group.phaseId && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                      {group.phaseId}
                    </span>
                  )}
                </div>

                {/* Thumbnail Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {group.photos.slice(0, 8).map((photo, photoIndex) => (
                    <LazyTimelinePhoto
                      key={photo.id}
                      photo={photo}
                      photoIndex={photoIndex}
                      totalPhotos={group.photos.length}
                      onClick={() => openLightbox(group, photoIndex)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Navigation */}
          <button
            onClick={() => navigateLightbox('prev')}
            className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeftIcon className="h-8 w-8" />
          </button>
          <button
            onClick={() => navigateLightbox('next')}
            className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRightIcon className="h-8 w-8" />
          </button>

          {/* Image */}
          <div className="max-w-4xl max-h-[80vh] p-4">
            <img
              src={selectedGroup.photos[currentPhotoIndex].url}
              alt={selectedGroup.photos[currentPhotoIndex].caption || ''}
              className="max-w-full max-h-[70vh] object-contain mx-auto"
            />
            {selectedGroup.photos[currentPhotoIndex].caption && (
              <p className="text-white text-center mt-4">
                {selectedGroup.photos[currentPhotoIndex].caption}
              </p>
            )}
            <p className="text-gray-400 text-center text-sm mt-2">
              {currentPhotoIndex + 1} / {selectedGroup.photos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoTimeline;
