"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Button from './Button';
import {
  FolderIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
  CameraIcon,
  CalendarIcon,
  BanknotesIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizes = {
    sm: {
      container: 'py-6',
      icon: 'h-10 w-10',
      iconWrapper: 'w-16 h-16',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'h-12 w-12',
      iconWrapper: 'w-20 h-20',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'h-16 w-16',
      iconWrapper: 'w-24 h-24',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const sizeConfig = sizes[size];

  return (
    <div className={cn('text-center animate-in fade-in duration-500', sizeConfig.container, className)}>
      {icon && (
        <div
          className={cn(
            'mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4',
            sizeConfig.iconWrapper
          )}
        >
          <div className={cn('text-gray-300', sizeConfig.icon)}>
            {icon}
          </div>
        </div>
      )}
      <h3 className={cn('font-semibold text-gray-900 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100', sizeConfig.title)}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-gray-500 max-w-sm mx-auto mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200', sizeConfig.description)}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-300">
          {action && (
            action.href ? (
              <Link href={action.href}>
                <Button variant="primary">{action.label}</Button>
              </Link>
            ) : (
              <Button variant="primary" onClick={action.onClick}>
                {action.label}
              </Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link href={secondaryAction.href}>
                <Button variant="outline">{secondaryAction.label}</Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function NoProjectsEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<FolderIcon className="h-full w-full" />}
      title="No projects yet"
      description="Get started by creating your first project to track jobs, tasks, and progress."
      action={{
        label: 'Create Project',
        onClick: onCreate,
        href: onCreate ? undefined : '/dashboard/projects/new',
      }}
    />
  );
}

export function NoTasksEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<DocumentTextIcon className="h-full w-full" />}
      title="No tasks"
      description="Break your project into tasks to track progress and assign work."
      action={{
        label: 'Add Task',
        onClick: onCreate,
      }}
    />
  );
}

export function NoTeamMembersEmpty({ onInvite }: { onInvite?: () => void }) {
  return (
    <EmptyState
      icon={<UserGroupIcon className="h-full w-full" />}
      title="No team members"
      description="Invite employees, contractors, and subcontractors to collaborate."
      action={{
        label: 'Invite Team',
        onClick: onInvite,
        href: onInvite ? undefined : '/dashboard/team/invite',
      }}
    />
  );
}

export function NoTimeEntriesEmpty() {
  return (
    <EmptyState
      icon={<ClockIcon className="h-full w-full" />}
      title="No time entries"
      description="Time entries will appear here when team members clock in."
      size="sm"
    />
  );
}

export function NoPhotosEmpty({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={<CameraIcon className="h-full w-full" />}
      title="No photos yet"
      description="Document progress by uploading photos from the jobsite."
      action={{
        label: 'Upload Photos',
        onClick: onUpload,
      }}
    />
  );
}

export function NoScheduleEmpty() {
  return (
    <EmptyState
      icon={<CalendarIcon className="h-full w-full" />}
      title="Nothing scheduled"
      description="No work scheduled for this period."
      size="sm"
    />
  );
}

export function NoInvoicesEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={<BanknotesIcon className="h-full w-full" />}
      title="No invoices"
      description="Create invoices to bill clients for completed work."
      action={{
        label: 'Create Invoice',
        onClick: onCreate,
      }}
    />
  );
}

export function NoMessagesEmpty() {
  return (
    <EmptyState
      icon={<InboxIcon className="h-full w-full" />}
      title="No messages"
      description="Messages from your team and clients will appear here."
      size="sm"
    />
  );
}

export function NoResultsEmpty({ query }: { query?: string }) {
  return (
    <EmptyState
      title="No results found"
      description={query ? `No results for "${query}". Try a different search term.` : 'Try adjusting your search or filters.'}
      size="sm"
    />
  );
}
