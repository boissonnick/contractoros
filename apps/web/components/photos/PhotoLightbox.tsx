"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ProjectPhoto, PhotoAnnotation } from '@/types';
import { formatDate } from '@/lib/date-utils';
import { Button } from '@/components/ui';
import PhotoAnnotationTool from './PhotoAnnotationTool';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  MapPinIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

export interface PhotoLightboxProps {
  photos: ProjectPhoto[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  onApprove?: (photoId: string, approved: boolean) => void;
  onDelete?: (photoId: string) => void;
  onAnnotate?: (photoId: string, annotations: Omit<PhotoAnnotation, 'id' | 'createdBy' | 'createdAt'>[]) => Promise<void>;
  onShare?: (photo: ProjectPhoto) => void;
  isAdmin?: boolean;
  phaseName?: string;
}

/**
 * PhotoLightbox - Full-screen photo viewer with navigation
 *
 * Features:
 * - Navigate between photos with arrows/keyboard
 * - Approve/reject photos
 * - Delete photos
 * - Add annotations
 * - Download photos
 * - Share photos
 * - Show metadata (location, date, user)
 */
export default function PhotoLightbox({
  photos,
  initialIndex = 0,
  open,
  onClose,
  onApprove,
  onDelete,
  onAnnotate,
  onShare,
  isAdmin = false,
  phaseName,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showInfo, setShowInfo] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);

  const currentPhoto = photos[currentIndex];

  // Reset index when photos change or modal opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is necessary for this pattern
      setCurrentIndex(Math.min(initialIndex, photos.length - 1));
    }
  }, [open, initialIndex, photos.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open || isAnnotating) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'i') {
        setShowInfo(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isAnnotating, goToPrevious, goToNext, onClose]);

  const handleDownload = async () => {
    if (!currentPhoto) return;

    try {
      const response = await fetch(currentPhoto.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-${currentPhoto.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to download photo', { error: error, component: 'PhotoLightbox' });
    }
  };

  const handleAnnotationSave = (annotations: Omit<PhotoAnnotation, 'id' | 'createdBy' | 'createdAt'>[]) => {
    if (onAnnotate && currentPhoto) {
      onAnnotate(currentPhoto.id, annotations);
    }
    setIsAnnotating(false);
  };

  if (!open || !currentPhoto) return null;

  // Annotation mode
  if (isAnnotating) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        <PhotoAnnotationTool
          imageUrl={currentPhoto.url}
          existingAnnotations={currentPhoto.annotations}
          onSave={handleAnnotationSave}
          onCancel={() => setIsAnnotating(false)}
          className="h-full"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <div className="flex items-center gap-4">
          <span className="text-white text-sm">
            {currentIndex + 1} / {photos.length}
          </span>
          {currentPhoto.approved && (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Approved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showInfo ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
            )}
            title="Toggle info (I)"
          >
            <PhotoIcon className="h-5 w-5" />
          </button>

          {onAnnotate && (
            <button
              onClick={() => setIsAnnotating(true)}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Add annotations"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            title="Download"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>

          {onShare && (
            <button
              onClick={() => onShare(currentPhoto)}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Share"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            title="Close (Esc)"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Navigation buttons */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full z-10 transition-colors"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full z-10 transition-colors"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Photo */}
        <div className="flex-1 flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption || 'Photo'}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Info panel */}
        {showInfo && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto">
            <h3 className="text-white font-semibold mb-4">Photo Details</h3>

            <div className="space-y-4">
              {currentPhoto.caption && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Caption</p>
                  <p className="text-white text-sm">{currentPhoto.caption}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                {formatDate(currentPhoto.takenAt || currentPhoto.createdAt)}
              </div>

              {currentPhoto.userName && (
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  {currentPhoto.userName}
                </div>
              )}

              {phaseName && (
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <TagIcon className="h-4 w-4 text-gray-500" />
                  {phaseName}
                </div>
              )}

              {currentPhoto.location && (
                <div className="flex items-start gap-2 text-gray-300 text-sm">
                  <MapPinIcon className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <span>
                    {currentPhoto.location.address ||
                      `${currentPhoto.location.lat.toFixed(4)}, ${currentPhoto.location.lng.toFixed(4)}`}
                  </span>
                </div>
              )}

              {currentPhoto.tags && currentPhoto.tags.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {currentPhoto.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentPhoto.metadata && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Metadata</p>
                  <div className="text-gray-300 text-xs space-y-1">
                    {currentPhoto.metadata.width && currentPhoto.metadata.height && (
                      <p>Size: {currentPhoto.metadata.width} x {currentPhoto.metadata.height}</p>
                    )}
                    {currentPhoto.metadata.fileSize && (
                      <p>File: {(currentPhoto.metadata.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    )}
                    {currentPhoto.metadata.deviceModel && (
                      <p>Device: {currentPhoto.metadata.deviceModel}</p>
                    )}
                  </div>
                </div>
              )}

              {currentPhoto.annotations && currentPhoto.annotations.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                    Annotations ({currentPhoto.annotations.length})
                  </p>
                  <p className="text-gray-500 text-xs">
                    This photo has annotations. Click the edit button to view or modify them.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer with actions */}
      {isAdmin && (onApprove || onDelete) && (
        <div className="flex items-center justify-center gap-3 px-4 py-3 bg-black/50 border-t border-gray-800">
          {onApprove && (
            <>
              {!currentPhoto.approved ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onApprove(currentPhoto.id, true)}
                  icon={<CheckCircleIcon className="h-4 w-4" />}
                >
                  Approve
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onApprove(currentPhoto.id, false)}
                  icon={<XCircleIcon className="h-4 w-4" />}
                >
                  Revoke Approval
                </Button>
              )}
            </>
          )}

          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onDelete(currentPhoto.id);
                if (photos.length === 1) {
                  onClose();
                } else if (currentIndex >= photos.length - 1) {
                  setCurrentIndex(currentIndex - 1);
                }
              }}
              icon={<TrashIcon className="h-4 w-4" />}
            >
              Delete
            </Button>
          )}
        </div>
      )}

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 px-4 py-2 bg-black/50 overflow-x-auto">
          {photos.map((photo, index) => (
            <LazyThumbnail
              key={photo.id}
              photo={photo}
              index={index}
              isActive={index === currentIndex}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * LazyThumbnail - Lazy loading thumbnail for lightbox strip
 */
function LazyThumbnail({
  photo,
  index: _index,
  isActive,
  onClick,
}: {
  photo: ProjectPhoto;
  index: number;
  isActive: boolean;
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
      { rootMargin: '50px' }
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
      className={cn(
        'flex-shrink-0 w-16 h-12 rounded overflow-hidden transition-all relative',
        isActive
          ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
          : 'opacity-50 hover:opacity-75'
      )}
    >
      {/* Placeholder */}
      {(!isVisible || !isLoaded) && (
        <div className="absolute inset-0 bg-gray-600 animate-pulse" />
      )}

      {/* Image */}
      {isVisible && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.thumbnailUrl || photo.url}
          alt=""
          loading="lazy"
          onLoad={handleLoad}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-200',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </button>
  );
}
