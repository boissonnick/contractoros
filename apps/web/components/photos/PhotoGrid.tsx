"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProjectPhoto } from '@/types';
import PhotoLightbox from './PhotoLightbox';
import { CheckIcon, PhotoIcon } from '@heroicons/react/24/outline';

export interface PhotoGridProps {
  photos: ProjectPhoto[];
  columns?: 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onPhotoClick?: (photo: ProjectPhoto, index: number) => void;
  onApprove?: (photoId: string, approved: boolean) => void;
  onDelete?: (photoId: string) => void;
  isAdmin?: boolean;
  emptyMessage?: string;
  className?: string;
}

const columnClasses = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  6: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
};

const gapClasses = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3',
};

/**
 * PhotoGrid - Responsive grid layout for displaying photos
 *
 * Features:
 * - Configurable columns and gap
 * - Selection mode with checkboxes
 * - Lightbox integration
 * - Approval badges
 * - Empty state
 */
export default function PhotoGrid({
  photos,
  columns = 4,
  gap = 'md',
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onPhotoClick,
  onApprove,
  onDelete,
  isAdmin = false,
  emptyMessage = 'No photos yet',
  className,
}: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handlePhotoClick = (photo: ProjectPhoto, index: number) => {
    if (selectable) {
      const isSelected = selectedIds.includes(photo.id);
      if (isSelected) {
        onSelectionChange?.(selectedIds.filter(id => id !== photo.id));
      } else {
        onSelectionChange?.([...selectedIds, photo.id]);
      }
    } else if (onPhotoClick) {
      onPhotoClick(photo, index);
    } else {
      setLightboxIndex(index);
    }
  };

  if (photos.length === 0) {
    return (
      <div className={cn(
        'border border-dashed border-gray-300 rounded-xl p-12 text-center',
        className
      )}>
        <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
        {photos.map((photo, index) => {
          const isSelected = selectedIds.includes(photo.id);

          return (
            <button
              key={photo.id}
              onClick={() => handlePhotoClick(photo, index)}
              className={cn(
                'relative aspect-square rounded-lg overflow-hidden bg-gray-100 group transition-all',
                selectable && isSelected
                  ? 'ring-2 ring-blue-500 ring-offset-2'
                  : 'hover:ring-2 hover:ring-blue-400'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || 'Photo'}
                className="w-full h-full object-cover"
              />

              {/* Selection checkbox */}
              {selectable && (
                <div className={cn(
                  'absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                  isSelected
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white/80 border-gray-300 text-transparent group-hover:border-blue-400'
                )}>
                  <CheckIcon className="h-4 w-4" />
                </div>
              )}

              {/* Approval badge */}
              {photo.approved && !selectable && (
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-0.5">
                  <CheckIcon className="h-3 w-3" />
                </div>
              )}

              {/* Caption overlay */}
              {photo.caption && !selectable && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{photo.caption}</p>
                </div>
              )}

              {/* Type indicator */}
              {photo.type && photo.type !== 'progress' && !selectable && (
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                  {photo.type}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          open={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onApprove={onApprove}
          onDelete={onDelete}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}

/**
 * PhotoGridSkeleton - Loading skeleton for photo grid
 */
export function PhotoGridSkeleton({
  count = 8,
  columns = 4,
  gap = 'md',
  className,
}: {
  count?: number;
  columns?: 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg bg-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}
