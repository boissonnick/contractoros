/**
 * DataListPage Template
 *
 * A reusable page template for data list pages with:
 * - Page header with title, description, and action button
 * - Optional stats grid
 * - Search and filter bar
 * - List with loading, empty, and error states
 *
 * This eliminates repetitive patterns across list pages like:
 * - clients/page.tsx
 * - settings/team/page.tsx
 * - materials/page.tsx
 * - expenses/page.tsx
 *
 * @example
 * // Basic usage
 * <DataListPage
 *   title="Clients"
 *   description="Manage your client relationships"
 *   items={clients}
 *   loading={loading}
 *   error={error}
 *   onSearch={setSearchQuery}
 *   renderItem={(client) => <ClientCard key={client.id} client={client} />}
 *   addButton={{ label: 'Add Client', onClick: () => setShowAdd(true) }}
 *   emptyState={{ title: 'No clients yet', description: 'Add your first client' }}
 * />
 *
 * @example
 * // With stats and filters
 * <DataListPage
 *   title="Expenses"
 *   items={expenses}
 *   loading={loading}
 *   stats={[
 *     { label: 'Total', value: formatCurrency(totalExpenses), icon: BanknotesIcon },
 *     { label: 'Pending', value: pendingCount, icon: ClockIcon },
 *   ]}
 *   filters={[
 *     { key: 'status', label: 'Status', options: statusOptions },
 *     { key: 'category', label: 'Category', options: categoryOptions },
 *   ]}
 *   filterValues={filters}
 *   onFilterChange={handleFilterChange}
 *   renderItem={(expense) => <ExpenseCard expense={expense} />}
 * />
 */

'use client';

import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import Button from '../ui/Button';
import { PageHeader, BreadcrumbItem } from '../ui/PageHeader';
import { StatsGrid, StatItem } from '../ui/StatsGrid';
import { FilterBar, FilterConfig } from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import { SkeletonList } from '../ui/Skeleton';

export interface DataListPageProps<T> {
  /**
   * Page title
   */
  title: string;

  /**
   * Page description
   */
  description?: string;

  /**
   * Breadcrumb navigation
   */
  breadcrumbs?: BreadcrumbItem[];

  /**
   * Stats to display in a grid above the list
   */
  stats?: StatItem[];

  /**
   * Whether stats are loading
   */
  statsLoading?: boolean;

  /**
   * Data items to display
   */
  items: T[];

  /**
   * Loading state
   */
  loading: boolean;

  /**
   * Error state
   */
  error?: Error | null;

  /**
   * Search placeholder text
   */
  searchPlaceholder?: string;

  /**
   * Callback when search changes
   */
  onSearch?: (query: string) => void;

  /**
   * Search value (controlled)
   */
  searchValue?: string;

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
   * Callback to clear all filters
   */
  onClearFilters?: () => void;

  /**
   * Render function for each item
   */
  renderItem: (item: T, index: number) => React.ReactNode;

  /**
   * Add button configuration
   */
  addButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };

  /**
   * Additional actions to display in the header
   */
  headerActions?: React.ReactNode;

  /**
   * Empty state configuration
   */
  emptyState?: {
    title?: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    action?: {
      label: string;
      onClick: () => void;
    };
  };

  /**
   * Layout for items: 'list' (vertical) or 'grid'
   */
  layout?: 'list' | 'grid';

  /**
   * Grid columns (when layout='grid')
   */
  gridCols?: 1 | 2 | 3 | 4;

  /**
   * Number of skeleton items to show while loading
   */
  skeletonCount?: number;

  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;

  /**
   * Additional content below the header (e.g., tabs)
   */
  headerContent?: React.ReactNode;

  /**
   * Additional content below filters, above the list
   */
  preListContent?: React.ReactNode;

  /**
   * Container className
   */
  className?: string;

  /**
   * List container className
   */
  listClassName?: string;

  /**
   * Key extractor for items
   */
  keyExtractor?: (item: T, index: number) => string;
}

export function DataListPage<T>({
  title,
  description,
  breadcrumbs,
  stats,
  statsLoading,
  items,
  loading,
  error,
  searchPlaceholder = 'Search...',
  onSearch,
  searchValue,
  filters,
  filterValues,
  onFilterChange,
  onClearFilters,
  renderItem,
  addButton,
  headerActions,
  emptyState,
  layout = 'list',
  gridCols = 3,
  skeletonCount = 5,
  loadingComponent,
  headerContent,
  preListContent,
  className,
  listClassName,
  keyExtractor,
}: DataListPageProps<T>) {
  // Build header actions
  const actions = (
    <>
      {headerActions}
      {addButton && (
        <Button onClick={addButton.onClick}>
          {addButton.icon || <PlusIcon className="h-4 w-4 mr-2" />}
          {addButton.label}
        </Button>
      )}
    </>
  );

  // Grid column classes
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[gridCols];

  // Determine if we should show the filter bar
  const showFilterBar = onSearch || (filters && filters.length > 0);

  // Render list content
  const renderContent = () => {
    // Loading state
    if (loading) {
      if (loadingComponent) return loadingComponent;
      return (
        <SkeletonList count={skeletonCount} />
      );
    }

    // Error state
    if (error) {
      return (
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-600 font-medium">Error loading data</p>
          <p className="text-red-500 text-sm mt-1">{error.message}</p>
        </div>
      );
    }

    // Empty state
    if (items.length === 0) {
      const EmptyIcon = emptyState?.icon;
      return (
        <EmptyState
          title={emptyState?.title || `No ${title.toLowerCase()} found`}
          description={emptyState?.description || `Get started by adding your first item.`}
          icon={EmptyIcon && <EmptyIcon className="h-12 w-12" />}
          action={
            emptyState?.action || addButton
              ? {
                  label: emptyState?.action?.label || addButton?.label || 'Add Item',
                  onClick: emptyState?.action?.onClick || addButton?.onClick || (() => {}),
                }
              : undefined
          }
        />
      );
    }

    // List of items
    return (
      <div
        className={cn(
          layout === 'grid' ? `grid gap-4 ${gridColsClass}` : 'space-y-4',
          listClassName
        )}
      >
        {items.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : index;
          return <React.Fragment key={key}>{renderItem(item, index)}</React.Fragment>;
        })}
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Page Header */}
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={actions}
      >
        {headerContent}
      </PageHeader>

      {/* Stats Grid */}
      {stats && stats.length > 0 && (
        <StatsGrid stats={stats} loading={statsLoading} />
      )}

      {/* Filter Bar */}
      {showFilterBar && (
        <FilterBar
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearch={onSearch}
          filters={filters}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />
      )}

      {/* Pre-list content */}
      {preListContent}

      {/* Main content */}
      {renderContent()}
    </div>
  );
}

export default DataListPage;
