/**
 * MobileCard Component
 *
 * A responsive card component optimized for mobile data display.
 * Automatically converts table-like data into a mobile-friendly card format.
 */

'use client';

import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface MobileCardField {
  label: string;
  value: React.ReactNode;
  /** Show in card header */
  isTitle?: boolean;
  /** Show as badge */
  isBadge?: boolean;
  /** Badge color */
  badgeColor?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
  /** Hide on mobile */
  hideOnMobile?: boolean;
}

interface MobileCardProps {
  fields: MobileCardField[];
  onClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
  /** Show chevron indicator */
  showChevron?: boolean;
  /** Avatar or icon to show */
  avatar?: React.ReactNode;
  /** Selected state */
  selected?: boolean;
}

const BADGE_COLORS = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-800',
  purple: 'bg-purple-100 text-purple-800',
};

export function MobileCard({
  fields,
  onClick,
  actions,
  className = '',
  showChevron = false,
  avatar,
  selected = false,
}: MobileCardProps) {
  const titleField = fields.find(f => f.isTitle);
  const badgeField = fields.find(f => f.isBadge);
  const otherFields = fields.filter(f => !f.isTitle && !f.isBadge && !f.hideOnMobile);

  const isClickable = !!onClick;

  return (
    <div
      className={`
        bg-white rounded-lg border shadow-sm transition-all
        ${selected ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-gray-200'}
        ${isClickable ? 'cursor-pointer active:bg-gray-50 hover:shadow-md' : ''}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        {avatar && (
          <div className="flex-shrink-0">
            {avatar}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {titleField && (
            <h3 className="font-medium text-gray-900 truncate">
              {titleField.value}
            </h3>
          )}
          {badgeField && (
            <span
              className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                BADGE_COLORS[badgeField.badgeColor || 'gray']
              }`}
            >
              {badgeField.value}
            </span>
          )}
        </div>
        {showChevron && (
          <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </div>

      {/* Fields */}
      {otherFields.length > 0 && (
        <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {otherFields.map((field, i) => (
            <div key={i} className="min-w-0">
              <dt className="text-xs text-gray-500 truncate">{field.label}</dt>
              <dd className="text-sm text-gray-900 truncate">
                {field.isBadge ? (
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      BADGE_COLORS[field.badgeColor || 'gray']
                    }`}
                  >
                    {field.value}
                  </span>
                ) : (
                  field.value
                )}
              </dd>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * MobileCardList Component
 *
 * Wrapper for a list of MobileCards with proper spacing.
 */
interface MobileCardListProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardList({ children, className = '' }: MobileCardListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * ResponsiveDataView Component
 *
 * Shows a table on desktop and MobileCards on mobile.
 */
interface ResponsiveDataViewProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
    isTitle?: boolean;
    isBadge?: boolean;
    badgeColor?: (item: T) => MobileCardField['badgeColor'];
    hideOnMobile?: boolean;
  }>;
  onRowClick?: (item: T) => void;
  getRowKey: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function ResponsiveDataView<T>({
  data,
  columns,
  onRowClick,
  getRowKey,
  emptyMessage = 'No data to display',
  className = '',
}: ResponsiveDataViewProps<T>) {
  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className={`hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.filter(c => !c.hideOnMobile || window.innerWidth >= 768).map(col => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map(item => (
              <tr
                key={getRowKey(item)}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              >
                {columns.map(col => (
                  <td key={String(col.key)} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key as string] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <MobileCardList className={`md:hidden ${className}`}>
        {data.map(item => {
          const fields: MobileCardField[] = columns.map(col => ({
            label: col.header,
            value: col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key as string] ?? ''),
            isTitle: col.isTitle,
            isBadge: col.isBadge,
            badgeColor: col.badgeColor?.(item),
            hideOnMobile: col.hideOnMobile,
          }));

          return (
            <MobileCard
              key={getRowKey(item)}
              fields={fields}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              showChevron={!!onRowClick}
            />
          );
        })}
      </MobileCardList>
    </>
  );
}

export default MobileCard;
