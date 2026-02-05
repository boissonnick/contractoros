"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// LoadMore Component
// ============================================================================

export interface LoadMoreProps {
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Whether items are currently being loaded */
  loading: boolean;
  /** Callback to load more items */
  onLoadMore: () => void;
  /** Number of items currently displayed */
  itemCount: number;
  /** Total number of items (optional) */
  totalCount?: number;
  /** Enable automatic loading when scrolled into view */
  autoLoad?: boolean;
  /** Threshold for auto-load (pixels from bottom) */
  autoLoadThreshold?: number;
  /** Additional CSS classes */
  className?: string;
}

export function LoadMore({
  hasMore,
  loading,
  onLoadMore,
  itemCount,
  totalCount,
  autoLoad = false,
  autoLoadThreshold = 200,
  className,
}: LoadMoreProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Handle load more click
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      onLoadMore();
    }
  }, [loading, hasMore, onLoadMore]);

  // Set up IntersectionObserver for auto-loading
  useEffect(() => {
    if (!autoLoad || !hasMore || loading) {
      return;
    }

    const element = loadMoreRef.current;
    if (!element) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: `${autoLoadThreshold}px`,
        threshold: 0,
      }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [autoLoad, hasMore, loading, onLoadMore, autoLoadThreshold]);

  // Format item count text
  const getItemCountText = () => {
    if (totalCount !== undefined && totalCount > 0) {
      return `Showing ${itemCount} of ${totalCount} items`;
    }
    return `Showing ${itemCount} items`;
  };

  return (
    <div
      ref={loadMoreRef}
      className={cn(
        'flex flex-col items-center gap-3 py-6',
        className
      )}
    >
      {/* Item count display */}
      <p className="text-sm text-gray-500">{getItemCountText()}</p>

      {/* Load more button */}
      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={loading}
          className={cn(
            'inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium',
            'border border-gray-300 bg-white text-gray-700',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary',
            'hover:bg-gray-50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-w-[120px]'
          )}
          aria-label={loading ? 'Loading more items' : 'Load more items'}
        >
          {loading ? (
            <>
              <LoadingSpinner className="mr-2" />
              Loading...
            </>
          ) : (
            'Load More'
          )}
        </button>
      )}

      {/* All items loaded message */}
      {!hasMore && itemCount > 0 && (
        <p className="text-sm text-gray-400">All items loaded</p>
      )}
    </div>
  );
}

// ============================================================================
// Loading Spinner Component
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function LoadingSpinner({ size = 'sm', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ============================================================================
// InfiniteScroll Component (wrapper with auto-load)
// ============================================================================

export interface InfiniteScrollProps extends Omit<LoadMoreProps, 'autoLoad'> {
  /** Children to render above the load more section */
  children: React.ReactNode;
  /** Container CSS classes */
  containerClassName?: string;
}

export function InfiniteScroll({
  children,
  hasMore,
  loading,
  onLoadMore,
  itemCount,
  totalCount,
  autoLoadThreshold = 200,
  className,
  containerClassName,
}: InfiniteScrollProps) {
  return (
    <div className={containerClassName}>
      {children}
      <LoadMore
        hasMore={hasMore}
        loading={loading}
        onLoadMore={onLoadMore}
        itemCount={itemCount}
        totalCount={totalCount}
        autoLoad={true}
        autoLoadThreshold={autoLoadThreshold}
        className={className}
      />
    </div>
  );
}

export default LoadMore;
