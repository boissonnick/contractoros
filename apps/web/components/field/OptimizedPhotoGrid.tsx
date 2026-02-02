'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { XMarkIcon, ArrowsPointingOutIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

// ============================================================================
// TYPES
// ============================================================================

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  createdAt: Date;
  projectId?: string;
  projectName?: string;
  uploadedBy?: string;
}

export interface OptimizedPhotoGridProps {
  /** Photos to display */
  photos: Photo[];
  /** Number of columns (default: 3) */
  columns?: number;
  /** Gap between photos in pixels (default: 4) */
  gap?: number;
  /** Whether selection mode is enabled */
  selectable?: boolean;
  /** Selected photo IDs */
  selectedIds?: Set<string>;
  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: Set<string>) => void;
  /** Callback when a photo is clicked (view mode) */
  onPhotoClick?: (photo: Photo) => void;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface PhotoLightboxProps {
  /** Photo to display */
  photo: Photo;
  /** Callback to close */
  onClose: () => void;
  /** Callback for previous photo */
  onPrevious?: () => void;
  /** Callback for next photo */
  onNext?: () => void;
  /** Whether there's a previous photo */
  hasPrevious?: boolean;
  /** Whether there's a next photo */
  hasNext?: boolean;
}

// ============================================================================
// LAZY LOAD IMAGE
// ============================================================================

interface LazyImageProps {
  src: string;
  alt: string;
  aspectRatio?: number;
  className?: string;
  onClick?: () => void;
}

function LazyImage({
  src,
  alt,
  aspectRatio = 1,
  className = '',
  onClick,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={{ paddingBottom: `${100 / aspectRatio}%` }}
      onClick={onClick}
    >
      {isInView && (
        <>
          {/* Placeholder skeleton */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          {/* Actual image */}
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className={`
              object-cover transition-opacity duration-300
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={() => setIsLoaded(true)}
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// PHOTO GRID
// ============================================================================

export function OptimizedPhotoGrid({
  photos,
  columns = 3,
  gap = 4,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onPhotoClick,
  loading = false,
  emptyMessage = 'No photos yet',
  className = '',
}: OptimizedPhotoGridProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  const handlePhotoClick = useCallback((photo: Photo) => {
    if (selectable) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(photo.id)) {
        newSelected.delete(photo.id);
      } else {
        newSelected.add(photo.id);
      }
      onSelectionChange?.(newSelected);
    } else if (onPhotoClick) {
      onPhotoClick(photo);
    } else {
      setLightboxPhoto(photo);
    }
  }, [selectable, selectedIds, onSelectionChange, onPhotoClick]);

  const lightboxIndex = useMemo(() => {
    if (!lightboxPhoto) return -1;
    return photos.findIndex((p) => p.id === lightboxPhoto.id);
  }, [lightboxPhoto, photos]);

  const handlePrevious = useCallback(() => {
    if (lightboxIndex > 0) {
      setLightboxPhoto(photos[lightboxIndex - 1]);
    }
  }, [lightboxIndex, photos]);

  const handleNext = useCallback(() => {
    if (lightboxIndex < photos.length - 1) {
      setLightboxPhoto(photos[lightboxIndex + 1]);
    }
  }, [lightboxIndex, photos]);

  if (loading) {
    return (
      <div className={`grid gap-1 ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="relative bg-gray-200 animate-pulse"
            style={{ paddingBottom: '100%' }}
          />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`grid ${className}`}
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
        }}
      >
        {photos.map((photo) => {
          const isSelected = selectedIds.has(photo.id);
          return (
            <div
              key={photo.id}
              className={`
                relative cursor-pointer
                ${selectable ? 'select-none' : ''}
              `}
            >
              <LazyImage
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || 'Photo'}
                className={`
                  rounded-sm
                  ${isSelected ? 'ring-2 ring-violet-500' : ''}
                `}
                onClick={() => handlePhotoClick(photo)}
              />

              {/* Selection indicator */}
              {selectable && (
                <div
                  className={`
                    absolute top-1 right-1 w-6 h-6 rounded-full
                    flex items-center justify-center
                    transition-all
                    ${isSelected
                      ? 'bg-violet-500'
                      : 'bg-black/30 border-2 border-white'
                    }
                  `}
                >
                  {isSelected && (
                    <CheckCircleIcon className="w-5 h-5 text-white" />
                  )}
                </div>
              )}

              {/* Expand icon on hover */}
              {!selectable && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <ArrowsPointingOutIcon className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={lightboxIndex > 0}
          hasNext={lightboxIndex < photos.length - 1}
        />
      )}
    </>
  );
}

// ============================================================================
// LIGHTBOX
// ============================================================================

export function PhotoLightbox({
  photo,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: PhotoLightboxProps) {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrevious) onPrevious?.();
          break;
        case 'ArrowRight':
          if (hasNext) onNext?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevious, onNext, hasPrevious, hasNext]);

  // Swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const diff = e.changedTouches[0].clientX - touchStart;
    const threshold = 50;

    if (diff > threshold && hasPrevious) {
      onPrevious?.();
    } else if (diff < -threshold && hasNext) {
      onNext?.();
    }

    setTouchStart(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
        aria-label="Close"
      >
        <XMarkIcon className="w-8 h-8" />
      </button>

      {/* Previous button */}
      {hasPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/80 hover:text-white transition-colors hidden sm:block"
          aria-label="Previous photo"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white/80 hover:text-white transition-colors hidden sm:block"
          aria-label="Next photo"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <Image
          src={photo.url}
          alt={photo.caption || 'Photo'}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Caption */}
      {photo.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-center">{photo.caption}</p>
          {photo.projectName && (
            <p className="text-white/70 text-sm text-center mt-1">{photo.projectName}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default OptimizedPhotoGrid;
