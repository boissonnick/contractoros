"use client";

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Table - A responsive table component with horizontal scroll
 *
 * Features:
 * - Horizontal scroll on overflow
 * - Optional sticky first column
 * - Responsive design with column priority on mobile
 * - Consistent styling
 *
 * Column Priority:
 * Use the `priority` prop on TableHeader/TableCell to control mobile visibility:
 * - 'high': Always visible (default)
 * - 'medium': Hidden on small screens (<640px)
 * - 'low': Hidden on medium and small screens (<768px)
 */

interface TableProps {
  children: React.ReactNode;
  className?: string;
  /** Make the first column sticky on horizontal scroll */
  stickyFirstColumn?: boolean;
}

export function Table({ children, className, stickyFirstColumn }: TableProps) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="inline-block min-w-full align-middle">
        <table
          className={cn(
            'min-w-full divide-y divide-gray-200',
            stickyFirstColumn && '[&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:bg-gray-50 [&_th:first-child]:z-10',
            stickyFirstColumn && '[&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:bg-white [&_td:first-child]:z-10',
            className
          )}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <thead className={cn('bg-gray-50', className)}>
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn('divide-y divide-gray-200 bg-white', className)}>
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function TableRow({ children, className, onClick, hover = true }: TableRowProps) {
  return (
    <tr
      className={cn(
        hover && 'hover:bg-gray-50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

/** Column priority for responsive visibility */
type ColumnPriority = 'high' | 'medium' | 'low';

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Make column sortable (visual indicator only) */
  sortable?: boolean;
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc' | null;
  /** Click handler for sorting */
  onSort?: () => void;
  /** Column priority for mobile visibility: 'high' (always), 'medium' (hidden <640px), 'low' (hidden <768px) */
  priority?: ColumnPriority;
}

export function TableHeader({
  children,
  className,
  align = 'left',
  sortable,
  sortDirection,
  onSort,
  priority = 'high',
}: TableHeaderProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  const priorityClass = {
    high: '',
    medium: 'hidden sm:table-cell',
    low: 'hidden md:table-cell',
  }[priority];

  return (
    <th
      scope="col"
      className={cn(
        'px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider',
        alignClass,
        sortable && 'cursor-pointer select-none hover:text-gray-700',
        priorityClass,
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && sortDirection && (
          <span className="text-gray-400">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Truncate long text with ellipsis */
  truncate?: boolean;
  /** Column priority for mobile visibility: 'high' (always), 'medium' (hidden <640px), 'low' (hidden <768px) */
  priority?: ColumnPriority;
}

export function TableCell({
  children,
  className,
  align = 'left',
  truncate,
  priority = 'high',
}: TableCellProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  const priorityClass = {
    high: '',
    medium: 'hidden sm:table-cell',
    low: 'hidden md:table-cell',
  }[priority];

  return (
    <td
      className={cn(
        'px-3 py-3 text-sm text-gray-900 whitespace-nowrap',
        alignClass,
        truncate && 'max-w-[200px] truncate',
        priorityClass,
        className
      )}
    >
      {children}
    </td>
  );
}

/**
 * TableEmpty - Empty state for tables
 */
interface TableEmptyProps {
  colSpan: number;
  message?: string;
  icon?: React.ReactNode;
}

export function TableEmpty({ colSpan, message = 'No data available', icon }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-12 text-center">
        {icon && <div className="flex justify-center mb-3">{icon}</div>}
        <p className="text-sm text-gray-500">{message}</p>
      </td>
    </tr>
  );
}

/**
 * TableLoading - Loading state for tables
 */
interface TableLoadingProps {
  colSpan: number;
  rows?: number;
}

export function TableLoading({ colSpan, rows = 5 }: TableLoadingProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: colSpan }).map((_, j) => (
            <td key={j} className="px-3 py-3">
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * ResponsiveTableWrapper - Wrapper that shows table on desktop and cards on mobile
 *
 * Usage:
 * <ResponsiveTableWrapper
 *   mobileCards={items.map(item => (
 *     <MobileCard key={item.id} item={item} />
 *   ))}
 * >
 *   <Table>...</Table>
 * </ResponsiveTableWrapper>
 */
interface ResponsiveTableWrapperProps {
  children: React.ReactNode;
  /** Cards to render on mobile instead of table */
  mobileCards?: React.ReactNode;
  /** Breakpoint to switch (default: 'sm' = 640px) */
  breakpoint?: 'sm' | 'md' | 'lg';
}

export function ResponsiveTableWrapper({
  children,
  mobileCards,
  breakpoint = 'sm',
}: ResponsiveTableWrapperProps) {
  const breakpointClass = {
    sm: { hide: 'hidden sm:block', show: 'sm:hidden' },
    md: { hide: 'hidden md:block', show: 'md:hidden' },
    lg: { hide: 'hidden lg:block', show: 'lg:hidden' },
  }[breakpoint];

  if (!mobileCards) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Table view for larger screens */}
      <div className={breakpointClass.hide}>{children}</div>
      {/* Card view for mobile */}
      <div className={cn(breakpointClass.show, 'space-y-3')}>{mobileCards}</div>
    </>
  );
}

/**
 * MobileTableCard - Card layout for table rows on mobile
 */
interface MobileTableCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileTableCard({ children, className, onClick }: MobileTableCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 shadow-sm',
        onClick && 'cursor-pointer hover:border-brand-primary hover:shadow-md transition-all',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * MobileTableRow - Row within a mobile card (label + value)
 */
interface MobileTableRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function MobileTableRow({ label, children, className }: MobileTableRowProps) {
  return (
    <div className={cn('flex justify-between items-center py-1.5', className)}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{children}</span>
    </div>
  );
}

// Export types
export type { ColumnPriority };

export default Table;
