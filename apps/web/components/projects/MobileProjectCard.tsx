/**
 * MobileProjectCard Component
 *
 * A mobile-optimized card for displaying project information.
 * Uses large touch targets and shows key information at a glance.
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Project, ProjectStatus } from '@/types';
import { Badge } from '@/components/ui';
import EmptyState from '@/components/ui/EmptyState';
import {
  MapPinIcon,
  CalendarIcon,
  ChevronRightIcon,
  UserGroupIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-gray-100 text-gray-700' },
  bidding: { label: 'Bidding', color: 'bg-yellow-100 text-yellow-700' },
  planning: { label: 'Planning', color: 'bg-blue-100 text-blue-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  on_hold: { label: 'On Hold', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

interface MobileProjectCardProps {
  project: Project;
  href?: string;
  showBudget?: boolean;
  showClient?: boolean;
  compact?: boolean;
}

export function MobileProjectCard({
  project,
  href,
  showBudget = true,
  showClient = true,
  compact = false,
}: MobileProjectCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statusConfig = STATUS_CONFIG[project.status];
  const budgetPercent = project.budget && project.currentSpend !== undefined
    ? Math.round((project.currentSpend / project.budget) * 100)
    : 0;

  const content = (
    <div
      className={`
        bg-white rounded-xl border border-gray-200 overflow-hidden
        transition-all active:bg-gray-50
        ${href ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''}
      `}
    >
      {/* Header */}
      <div className={`px-4 ${compact ? 'py-3' : 'py-4'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
              {project.name}
            </h3>
            <Badge className={`mt-1.5 ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
          </div>
          {href && (
            <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
          )}
        </div>

        {/* Location */}
        {project.address && (
          <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {project.address.city}{project.address.state ? `, ${project.address.state}` : ''}
            </span>
          </div>
        )}

        {/* Client */}
        {showClient && project.clientName && (
          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500">
            <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{project.clientName}</span>
          </div>
        )}
      </div>

      {/* Footer with budget/dates */}
      {!compact && (showBudget || project.startDate) && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between gap-4">
            {/* Budget */}
            {showBudget && project.budget ? (
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Budget</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(project.budget)}
                  </span>
                </div>
                {project.currentSpend !== undefined && (
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        budgetPercent > 100 ? 'bg-red-500' :
                        budgetPercent > 90 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ) : project.startDate ? (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <CalendarIcon className="h-4 w-4" />
                <span>{format(new Date(project.startDate), 'MMM d, yyyy')}</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} prefetch={false}>
        {content}
      </Link>
    );
  }

  return content;
}

/**
 * MobileProjectList Component
 *
 * A wrapper for displaying a list of MobileProjectCards with proper spacing.
 */
interface MobileProjectListProps {
  projects: Project[];
  basePath?: string;
  showBudget?: boolean;
  showClient?: boolean;
  compact?: boolean;
  emptyMessage?: string;
}

export function MobileProjectList({
  projects,
  basePath = '/dashboard/projects',
  showBudget = true,
  showClient = true,
  compact = false,
  emptyMessage = 'No projects found',
}: MobileProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200">
        <EmptyState
          icon={<FolderIcon className="h-full w-full" />}
          title={emptyMessage}
          size="sm"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <MobileProjectCard
          key={project.id}
          project={project}
          href={`${basePath}/${project.id}`}
          showBudget={showBudget}
          showClient={showClient}
          compact={compact}
        />
      ))}
    </div>
  );
}

export default MobileProjectCard;
