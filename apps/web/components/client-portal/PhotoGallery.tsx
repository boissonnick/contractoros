'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface GalleryPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  phase?: string;
  takenAt?: Date;
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  phases?: string[];
  className?: string;
}

export function PhotoGallery({ photos, phases = [], className }: PhotoGalleryProps) {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  const filteredPhotos = selectedPhase
    ? photos.filter((p) => p.phase === selectedPhase)
    : photos;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setZoom(1);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setZoom(1);
  };

  const goToPrevious = useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
      setZoom(1);
    }
  }, [lightboxIndex, filteredPhotos.length]);

  const goToNext = useCallback(() => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length);
      setZoom(1);
    }
  }, [lightboxIndex, filteredPhotos.length]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, goToPrevious, goToNext]);

  // Handle swipe gestures
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
    setTouchStart(null);
  };

  if (photos.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No photos yet</p>
        <p className="text-sm text-gray-400 mt-1">Photos will appear here as work progresses</p>
      </div>
    );
  }

  const currentPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  return (
    <div className={className}>
      {/* Phase Filter */}
      {phases.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedPhase(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              selectedPhase === null
                ? 'bg-brand-100 text-brand-primary'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            All Photos
          </button>
          {phases.map((phase) => (
            <button
              key={phase}
              onClick={() => setSelectedPhase(phase)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                selectedPhase === phase
                  ? 'bg-brand-100 text-brand-primary'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {phase}
            </button>
          ))}
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {filteredPhotos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(index)}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          >
            <Image
              src={photo.thumbnailUrl || photo.url}
              alt={photo.caption || `Photo ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && currentPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>

          {/* Zoom controls */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="p-2 text-white/80 hover:text-white bg-white/10 rounded-lg"
            >
              <MagnifyingGlassMinusIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              className="p-2 text-white/80 hover:text-white bg-white/10 rounded-lg"
            >
              <MagnifyingGlassPlusIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white bg-white/10 rounded-full hidden md:block"
          >
            <ChevronLeftIcon className="w-8 h-8" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white bg-white/10 rounded-full hidden md:block"
          >
            <ChevronRightIcon className="w-8 h-8" />
          </button>

          {/* Image */}
          <div
            className="relative w-full h-full flex items-center justify-center p-4 md:p-16"
            style={{ transform: `scale(${zoom})` }}
          >
            <Image
              src={currentPhoto.url}
              alt={currentPhoto.caption || 'Photo'}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Caption */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            {currentPhoto.caption && (
              <p className="text-white text-sm mb-1">{currentPhoto.caption}</p>
            )}
            {currentPhoto.takenAt && (
              <p className="text-white/60 text-xs">
                {format(new Date(currentPhoto.takenAt), 'MMMM d, yyyy')}
              </p>
            )}
            <p className="text-white/40 text-xs mt-2">
              {lightboxIndex + 1} of {filteredPhotos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;
