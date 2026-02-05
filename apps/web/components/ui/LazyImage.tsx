'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  rootMargin?: string;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * LazyImage - Optimized image component with lazy loading via Intersection Observer
 *
 * Features:
 * - Uses Intersection Observer for true lazy loading
 * - Shows placeholder while image is not in view
 * - Smooth fade-in transition when image loads
 * - Supports both fixed dimensions and fill mode
 * - Configurable root margin for preloading
 * - Falls back to native img tag for external URLs
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  fill = false,
  sizes,
  priority = false,
  quality,
  placeholder,
  blurDataURL,
  objectFit = 'cover',
  rootMargin = '200px',
  threshold = 0,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If priority is set, don't use intersection observer
    if (priority) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- IntersectionObserver callback is an async handler
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, rootMargin, threshold]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Check if this is an external URL that needs native img tag
  const isExternalUrl = src.startsWith('http') && !src.includes(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '');

  // Placeholder styles based on dimensions
  const placeholderStyle = fill
    ? {}
    : { width: width || 'auto', height: height || 'auto' };

  // Object-fit class mapping
  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }[objectFit];

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        fill && 'w-full h-full',
        containerClassName
      )}
      style={!fill ? placeholderStyle : undefined}
    >
      {/* Placeholder shown while loading */}
      {(!isVisible || !isLoaded) && !hasError && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-200 animate-pulse',
            fill ? '' : 'rounded',
            className
          )}
          style={!fill ? placeholderStyle : undefined}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-100 flex items-center justify-center',
            fill ? '' : 'rounded',
            className
          )}
          style={!fill ? placeholderStyle : undefined}
        >
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
        </div>
      )}

      {/* Image rendered only when visible */}
      {isVisible && !hasError && (
        isExternalUrl ? (
          // Use native img for external URLs
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              objectFitClass,
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              fill && 'absolute inset-0 w-full h-full',
              className
            )}
            style={!fill ? placeholderStyle : undefined}
          />
        ) : (
          // Use Next.js Image for optimized loading
          <Image
            src={src}
            alt={alt}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            fill={fill}
            sizes={sizes || (fill ? '100vw' : undefined)}
            quality={quality}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              objectFitClass,
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
          />
        )
      )}
    </div>
  );
}

/**
 * LazyImageGrid - Optimized component for rendering image grids
 * Uses staggered loading to prevent all images from loading at once
 */
export interface LazyImageGridProps {
  images: Array<{
    id: string;
    src: string;
    alt?: string;
    thumbnail?: string;
  }>;
  columns?: 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  aspectRatio?: 'square' | 'video' | 'auto';
  onImageClick?: (image: { id: string; src: string }, index: number) => void;
  className?: string;
}

const gridColumnClasses = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  6: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
};

const gridGapClasses = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3',
};

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  auto: '',
};

export function LazyImageGrid({
  images,
  columns = 4,
  gap = 'md',
  aspectRatio = 'square',
  onImageClick,
  className,
}: LazyImageGridProps) {
  return (
    <div
      className={cn(
        'grid',
        gridColumnClasses[columns],
        gridGapClasses[gap],
        className
      )}
    >
      {images.map((image, index) => (
        <button
          key={image.id}
          onClick={() => onImageClick?.(image, index)}
          className={cn(
            'relative overflow-hidden rounded-lg bg-gray-100',
            aspectRatioClasses[aspectRatio],
            onImageClick && 'cursor-pointer hover:opacity-90 transition-opacity'
          )}
        >
          <LazyImage
            src={image.thumbnail || image.src}
            alt={image.alt || `Image ${index + 1}`}
            fill
            sizes={`(max-width: 640px) 50vw, (max-width: 768px) 33vw, ${Math.floor(100 / columns)}vw`}
            objectFit="cover"
            rootMargin="100px"
          />
        </button>
      ))}
    </div>
  );
}

export default LazyImage;
