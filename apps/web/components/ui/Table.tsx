"use client";

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Table - A responsive table component with horizontal scroll
 *
 * Features:
 * - Horizontal scroll on overflow
 * - Optional sticky first column
 * - Responsive design (converts to cards on mobile via wrapper)
 * - Consistent styling
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
}

export function TableHeader({
  children,
  className,
  align = 'left',
  sortable,
  sortDirection,
  onSort,
}: TableHeaderProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <th
      scope="col"
      className={cn(
        'px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider',
        alignClass,
        sortable && 'cursor-pointer select-none hover:text-gray-700',
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
}

export function TableCell({
  children,
  className,
  align = 'left',
  truncate,
}: TableCellProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <td
      className={cn(
        'px-3 py-3 text-sm text-gray-900 whitespace-nowrap',
        alignClass,
        truncate && 'max-w-[200px] truncate',
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

export default Table;
