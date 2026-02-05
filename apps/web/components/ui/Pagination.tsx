"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ============================================================================
// Main Pagination Component
// ============================================================================

export interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Whether to show the page size selector */
  showPageSizeSelector?: boolean;
  /** Whether to show the item count */
  showItemCount?: boolean;
  /** Whether pagination is in loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showItemCount = true,
  loading = false,
  className,
}: PaginationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate item range
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Navigation handlers
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
        onPageChange(page);
      }
    },
    [currentPage, totalPages, loading, onPageChange]
  );

  const goToPrevious = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goToNext = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if pagination is focused
      if (!containerRef.current?.contains(document.activeElement)) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Home':
          e.preventDefault();
          goToPage(1);
          break;
        case 'End':
          e.preventDefault();
          goToPage(totalPages);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToPage, goToPrevious, goToNext, totalPages]);

  // Generate page numbers to display
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3',
        className
      )}
      role="navigation"
      aria-label="Pagination"
    >
      {/* Left section: Item count and page size selector */}
      <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-gray-700">
        {showItemCount && totalItems > 0 && (
          <span>
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> items
          </span>
        )}

        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <label htmlFor="page-size-select" className="text-gray-500">
              Show:
            </label>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={loading}
              className={cn(
                'block rounded-md border border-gray-300 bg-white py-1.5 pl-2 pr-8 text-sm',
                'focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary',
                'transition-colors appearance-none cursor-pointer',
                "bg-[url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")] bg-[length:1.25rem_1.25rem] bg-[right_0.25rem_center] bg-no-repeat",
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right section: Page navigation */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={goToPrevious}
          disabled={!hasPrevious || loading}
          aria-label="Go to previous page"
          className={cn(
            'inline-flex items-center justify-center px-2 py-2 rounded-md text-sm font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
            hasPrevious && !loading
              ? 'text-gray-700 hover:bg-gray-100'
              : 'text-gray-300 cursor-not-allowed'
          )}
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Page numbers - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-sm font-medium text-gray-500"
                aria-hidden="true"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page)}
                disabled={loading}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
                  page === currentPage
                    ? 'bg-brand-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Mobile page indicator */}
        <span className="sm:hidden px-3 py-2 text-sm text-gray-700">
          Page {currentPage} of {totalPages || 1}
        </span>

        {/* Next button */}
        <button
          onClick={goToNext}
          disabled={!hasNext || loading}
          aria-label="Go to next page"
          className={cn(
            'inline-flex items-center justify-center px-2 py-2 rounded-md text-sm font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
            hasNext && !loading
              ? 'text-gray-700 hover:bg-gray-100'
              : 'text-gray-300 cursor-not-allowed'
          )}
        >
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Compact Pagination Component (for cards and tight spaces)
// ============================================================================

export interface CompactPaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  loading?: boolean;
  className?: string;
}

export function CompactPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  loading,
  className,
}: CompactPaginationProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      <button
        onClick={onPreviousPage}
        disabled={!hasPreviousPage || loading}
        aria-label="Previous page"
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
          hasPreviousPage && !loading
            ? 'text-gray-700 hover:bg-gray-100'
            : 'text-gray-300 cursor-not-allowed'
        )}
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Previous
      </button>

      <span className="text-sm text-gray-500">
        {currentPage} / {totalPages || 1}
      </span>

      <button
        onClick={onNextPage}
        disabled={!hasNextPage || loading}
        aria-label="Next page"
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
          hasNextPage && !loading
            ? 'text-gray-700 hover:bg-gray-100'
            : 'text-gray-300 cursor-not-allowed'
        )}
      >
        Next
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

// ============================================================================
// Legacy Pagination Component (for backward compatibility)
// ============================================================================

export interface LegacyPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onGoToPage?: (page: number) => void;
  loading?: boolean;
  className?: string;
}

export default function LegacyPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  onGoToPage,
  loading,
  className,
}: LegacyPaginationProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showPages = 5;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {totalItems !== undefined && (
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </div>
      )}

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          onClick={onPreviousPage}
          disabled={!hasPreviousPage || loading}
          className={cn(
            'relative inline-flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors',
            hasPreviousPage && !loading
              ? 'text-gray-700 hover:bg-gray-50'
              : 'text-gray-300 cursor-not-allowed'
          )}
        >
          <span className="sr-only">Previous</span>
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        {onGoToPage && totalPages > 0 && (
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((page, index) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onGoToPage(page)}
                  disabled={loading}
                  className={cn(
                    'relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    page === currentPage
                      ? 'bg-brand-primary text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {page}
                </button>
              )
            )}
          </div>
        )}

        {!onGoToPage && totalPages > 0 && (
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
        )}

        <button
          onClick={onNextPage}
          disabled={!hasNextPage || loading}
          className={cn(
            'relative inline-flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors',
            hasNextPage && !loading
              ? 'text-gray-700 hover:bg-gray-50'
              : 'text-gray-300 cursor-not-allowed'
          )}
        >
          <span className="sr-only">Next</span>
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
