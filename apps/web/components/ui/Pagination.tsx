"use client";

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface PaginationProps {
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

export default function Pagination({
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
}: PaginationProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showPages = 5; // Max pages to show

    if (totalPages <= showPages) {
      // Show all pages
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

  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* Results info */}
      {totalItems !== undefined && (
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </div>
      )}

      {/* Navigation */}
      <nav className="flex items-center gap-1" aria-label="Pagination">
        {/* Previous */}
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

        {/* Page numbers */}
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
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {page}
                </button>
              )
            )}
          </div>
        )}

        {/* Mobile page indicator */}
        {!onGoToPage && totalPages > 0 && (
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
        )}

        {/* Next */}
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

// Simple compact pagination for cards
export function CompactPagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  loading,
  className,
}: Omit<PaginationProps, 'totalItems' | 'pageSize' | 'onGoToPage'>) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      <button
        onClick={onPreviousPage}
        disabled={!hasPreviousPage || loading}
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
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
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
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
