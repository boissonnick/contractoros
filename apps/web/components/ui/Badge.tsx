"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-purple-100 text-purple-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const dotColors = {
    default: 'bg-gray-500',
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-purple-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}

// Status Badge - common status display
export type StatusType =
  | 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'
  | 'draft' | 'submitted' | 'approved' | 'rejected'
  | 'open' | 'closed' | 'in_progress' | 'on_hold';

const statusConfig: Record<StatusType, { label: string; variant: BadgeProps['variant'] }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'default' },
  pending: { label: 'Pending', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  draft: { label: 'Draft', variant: 'default' },
  submitted: { label: 'Submitted', variant: 'primary' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  open: { label: 'Open', variant: 'primary' },
  closed: { label: 'Closed', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'info' },
  on_hold: { label: 'On Hold', variant: 'warning' },
};

export function StatusBadge({
  status,
  size = 'md',
  className
}: {
  status: StatusType;
  size?: BadgeProps['size'];
  className?: string;
}) {
  const config = statusConfig[status] || { label: status, variant: 'default' as const };

  return (
    <Badge variant={config.variant} size={size} dot className={className}>
      {config.label}
    </Badge>
  );
}

// Priority Badge
export type PriorityType = 'low' | 'medium' | 'high' | 'urgent';

const priorityConfig: Record<PriorityType, { label: string; variant: BadgeProps['variant'] }> = {
  low: { label: 'Low', variant: 'default' },
  medium: { label: 'Medium', variant: 'primary' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'danger' },
};

export function PriorityBadge({
  priority,
  size = 'sm',
  className
}: {
  priority: PriorityType;
  size?: BadgeProps['size'];
  className?: string;
}) {
  const config = priorityConfig[priority];

  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}
