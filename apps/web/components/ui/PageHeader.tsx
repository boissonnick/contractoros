/**
 * PageHeader Component
 *
 * Standardized page header with title, description, breadcrumbs, and action buttons.
 * Eliminates duplicate header patterns across dashboard pages.
 *
 * @example
 * // Basic usage
 * <PageHeader
 *   title="Clients"
 *   description="Manage your client relationships"
 * />
 *
 * @example
 * // With action button
 * <PageHeader
 *   title="Clients"
 *   description="Manage your client relationships"
 *   actions={
 *     <Button onClick={() => setShowAddModal(true)}>
 *       <PlusIcon className="h-4 w-4 mr-2" />
 *       Add Client
 *     </Button>
 *   }
 * />
 *
 * @example
 * // With breadcrumbs
 * <PageHeader
 *   title="Client Details"
 *   breadcrumbs={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Clients', href: '/dashboard/clients' },
 *     { label: 'Acme Corp' },
 *   ]}
 * />
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  /**
   * Page title (required)
   */
  title: string;

  /**
   * Optional description text below title
   */
  description?: string;

  /**
   * Action buttons/elements to display on the right
   */
  actions?: React.ReactNode;

  /**
   * Breadcrumb navigation items
   */
  breadcrumbs?: BreadcrumbItem[];

  /**
   * Additional content below the header (e.g., tabs)
   */
  children?: React.ReactNode;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Whether to show a bottom border
   */
  bordered?: boolean;

  /**
   * Back button configuration
   */
  backButton?: {
    label?: string;
    href: string;
  };
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  children,
  className = '',
  bordered = false,
  backButton,
}: PageHeaderProps) {
  return (
    <div
      className={`
        ${bordered ? 'border-b border-gray-200 pb-5' : ''}
        ${className}
      `.trim()}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex mb-3" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2 flex-shrink-0" />
                )}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Back button */}
      {backButton && (
        <Link
          href={backButton.href}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ChevronRightIcon className="h-4 w-4 rotate-180 mr-1" />
          {backButton.label || 'Back'}
        </Link>
      )}

      {/* Main header row */}
      <div className="flex flex-col sm:flex-row sm:items-start md:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Title section - allows shrinking with proper min-width */}
        <div className="min-w-0 flex-1 sm:max-w-[calc(100%-180px)] md:max-w-none">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate font-heading tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2 sm:line-clamp-1">{description}</p>
          )}
        </div>

        {/* Actions section - responsive sizing with minimum width */}
        {actions && (
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 sm:min-w-[160px] sm:justify-end">
            {actions}
          </div>
        )}
      </div>

      {/* Additional content (tabs, filters, etc.) */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export default PageHeader;
