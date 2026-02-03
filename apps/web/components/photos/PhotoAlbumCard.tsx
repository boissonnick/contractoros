"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PhotoAlbum, ProjectPhoto } from '@/types';
import { formatDate } from '@/lib/date-utils';
import {
  PhotoIcon,
  FolderIcon,
  LockClosedIcon,
  GlobeAltIcon,
  EllipsisVerticalIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export interface PhotoAlbumCardProps {
  album: PhotoAlbum;
  coverPhoto?: ProjectPhoto | null;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  className?: string;
  showMenu?: boolean;
}

/**
 * PhotoAlbumCard - Display card for photo albums
 *
 * Features:
 * - Cover photo thumbnail
 * - Photo count badge
 * - Public/private indicator
 * - Client sharing indicator
 * - Action menu (edit, share, delete)
 */
export default function PhotoAlbumCard({
  album,
  coverPhoto,
  onClick,
  onEdit,
  onDelete,
  onShare,
  className,
  showMenu = true,
}: PhotoAlbumCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleAction = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    action();
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-gray-300',
        className
      )}
    >
      {/* Cover Image */}
      <div className="aspect-video bg-gray-100 relative">
        {coverPhoto ? (
          <LazyAlbumCover
            src={coverPhoto.thumbnailUrl || coverPhoto.url}
            alt={album.name}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderIcon className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Photo count badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded flex items-center gap-1">
          <PhotoIcon className="h-3.5 w-3.5" />
          {album.photoCount}
        </div>

        {/* Visibility indicators */}
        <div className="absolute top-2 left-2 flex gap-1">
          {album.isPublic ? (
            <div className="p-1 bg-green-500/90 text-white rounded" title="Public album">
              <GlobeAltIcon className="h-3.5 w-3.5" />
            </div>
          ) : (
            <div className="p-1 bg-gray-700/90 text-white rounded" title="Private album">
              <LockClosedIcon className="h-3.5 w-3.5" />
            </div>
          )}
          {album.clientAccessEnabled && (
            <div className="p-1 bg-blue-500/90 text-white rounded" title="Shared with client">
              <UserGroupIcon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        {/* Menu button */}
        {showMenu && (onEdit || onDelete || onShare) && (
          <div ref={menuRef} className="absolute top-2 right-2">
            <button
              onClick={handleMenuClick}
              className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <EllipsisVerticalIcon className="h-4 w-4 text-gray-600" />
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute top-full right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {onEdit && (
                  <button
                    onClick={handleAction(onEdit)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit Album
                  </button>
                )}
                {onShare && (
                  <button
                    onClick={handleAction(onShare)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <ShareIcon className="h-4 w-4" />
                    Share
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleAction(onDelete)}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Album Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 truncate">{album.name}</h3>
        {album.description && (
          <p className="text-sm text-gray-500 truncate mt-0.5">{album.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Created {formatDate(album.createdAt)}
        </p>
      </div>
    </div>
  );
}

/**
 * LazyAlbumCover - Lazy loading album cover image with intersection observer
 */
function LazyAlbumCover({ src, alt }: { src: string; alt: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    <div ref={ref} className="w-full h-full relative">
      {/* Placeholder */}
      {(!isVisible || !isLoaded) && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Image */}
      {isVisible && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
}

/**
 * PhotoAlbumCardSkeleton - Loading skeleton for album cards
 */
export function PhotoAlbumCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * CreateAlbumCard - Button-style card for creating new albums
 */
export function CreateAlbumCard({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center aspect-[4/3] bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl',
        'hover:bg-gray-100 hover:border-gray-400 transition-colors',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
        <FolderIcon className="h-6 w-6 text-gray-500" />
      </div>
      <span className="text-sm font-medium text-gray-600">Create Album</span>
    </button>
  );
}
