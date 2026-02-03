/**
 * FilterBar Component
 *
 * Standardized search and filter bar for list pages.
 * Eliminates duplicate search/filter patterns across dashboard pages.
 *
 * @example
 * // Basic search only
 * <FilterBar
 *   searchPlaceholder="Search clients..."
 *   onSearch={setSearchQuery}
 * />
 *
 * @example
 * // With filters
 * <FilterBar
 *   searchPlaceholder="Search expenses..."
 *   onSearch={setSearchQuery}
 *   filters={[
 *     {
 *       key: 'status',
 *       label: 'Status',
 *       options: [
 *         { label: 'All', value: '' },
 *         { label: 'Pending', value: 'pending' },
 *         { label: 'Approved', value: 'approved' },
 *       ],
 *     },
 *     {
 *       key: 'category',
 *       label: 'Category',
 *       options: categoryOptions,
 *     },
 *   ]}
 *   filterValues={{ status: 'pending', category: '' }}
 *   onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
 * />
 *
 * @example
 * // With action button
 * <FilterBar
 *   searchPlaceholder="Search..."
 *   onSearch={setQuery}
 *   actions={
 *     <Button onClick={() => setShowExport(true)}>
 *       <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
 *       Export
 *     </Button>
 *   }
 * />
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  /**
   * Unique key for this filter
   */
  key: string;

  /**
   * Display label
   */
  label: string;

  /**
   * Available options
   */
  options: FilterOption[];

  /**
   * Width class (default: 'w-40')
   */
  width?: string;
}

export interface FilterBarProps {
  /**
   * Search input placeholder
   */
  searchPlaceholder?: string;

  /**
   * Search value (controlled)
   */
  searchValue?: string;

  /**
   * Callback when search changes
   */
  onSearch?: (query: string) => void;

  /**
   * Debounce delay in ms (default: 300)
   */
  debounceMs?: number;

  /**
   * Filter configurations
   */
  filters?: FilterConfig[];

  /**
   * Current filter values
   */
  filterValues?: Record<string, string>;

  /**
   * Callback when a filter changes
   */
  onFilterChange?: (key: string, value: string) => void;

  /**
   * Action buttons to display on the right
   */
  actions?: React.ReactNode;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Whether to show filter icon indicator when filters are active
   */
  showActiveIndicator?: boolean;

  /**
   * Callback to clear all filters
   */
  onClearFilters?: () => void;
}

export function FilterBar({
  searchPlaceholder = 'Search...',
  searchValue: controlledSearchValue,
  onSearch,
  debounceMs = 300,
  filters = [],
  filterValues = {},
  onFilterChange,
  actions,
  className = '',
  showActiveIndicator = true,
  onClearFilters,
}: FilterBarProps) {
  const [internalSearchValue, setInternalSearchValue] = useState(controlledSearchValue || '');
  const searchValue = controlledSearchValue ?? internalSearchValue;

  // Debounce search
  useEffect(() => {
    if (controlledSearchValue !== undefined) return;

    const timer = setTimeout(() => {
      onSearch?.(internalSearchValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalSearchValue, debounceMs, onSearch, controlledSearchValue]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (controlledSearchValue !== undefined) {
        onSearch?.(value);
      } else {
        setInternalSearchValue(value);
      }
    },
    [controlledSearchValue, onSearch]
  );

  const handleClearSearch = useCallback(() => {
    if (controlledSearchValue !== undefined) {
      onSearch?.('');
    } else {
      setInternalSearchValue('');
      onSearch?.('');
    }
  }, [controlledSearchValue, onSearch]);

  // Count active filters (non-empty values)
  const activeFilterCount = Object.values(filterValues).filter(v => v !== '' && v !== 'all').length;
  const hasActiveFilters = activeFilterCount > 0 || searchValue !== '';

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Main row: Search + Filters + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search Input */}
        {onSearch && (
          <div className="relative flex-1 sm:max-w-xs md:max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="
                w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg
                text-sm placeholder-gray-400
                focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary
                transition-colors
              "
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Filters */}
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {showActiveIndicator && activeFilterCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-brand-primary">
                <FunnelIcon className="h-4 w-4" />
                <span>{activeFilterCount} active</span>
              </div>
            )}

            {filters.map((filter) => (
              <select
                key={filter.key}
                value={filterValues[filter.key] || ''}
                onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                className={`
                  ${filter.width || 'w-32 sm:w-40'}
                  pl-3 pr-8 py-2 border border-gray-300 rounded-lg
                  text-sm text-gray-700 bg-white
                  focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary
                  transition-colors cursor-pointer appearance-none
                  bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
                  bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat
                `}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}

            {hasActiveFilters && onClearFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Actions - full width on mobile, auto on larger screens */}
        {actions && (
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for managing FilterBar state
 *
 * @example
 * const { search, filters, setSearch, setFilter, clearAll } = useFilterBar({
 *   initialFilters: { status: '', category: '' },
 * });
 *
 * <FilterBar
 *   searchValue={search}
 *   onSearch={setSearch}
 *   filterValues={filters}
 *   onFilterChange={setFilter}
 *   onClearFilters={clearAll}
 * />
 */
export function useFilterBar<T extends Record<string, string>>(options?: {
  initialSearch?: string;
  initialFilters?: T;
}) {
  const [search, setSearch] = useState(options?.initialSearch || '');
  const [filters, setFilters] = useState<T>(
    (options?.initialFilters || {}) as T
  );

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearAll = useCallback(() => {
    setSearch('');
    setFilters(
      Object.keys(filters).reduce((acc, key) => ({ ...acc, [key]: '' }), {} as T)
    );
  }, [filters]);

  return {
    search,
    filters,
    setSearch,
    setFilter,
    setFilters,
    clearAll,
  };
}

export default FilterBar;
