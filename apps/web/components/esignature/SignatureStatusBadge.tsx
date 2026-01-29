"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { SignatureRequestStatus } from '@/lib/esignature/types';
import {
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

interface SignatureStatusBadgeProps {
  status: SignatureRequestStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  SignatureRequestStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  draft: {
    label: 'Draft',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: DocumentIcon,
  },
  pending: {
    label: 'Pending',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: ClockIcon,
  },
  viewed: {
    label: 'Viewed',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: EyeIcon,
  },
  signed: {
    label: 'Signed',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: CheckCircleIcon,
  },
  declined: {
    label: 'Declined',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: XCircleIcon,
  },
  expired: {
    label: 'Expired',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    icon: ExclamationTriangleIcon,
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    icon: NoSymbolIcon,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-4 w-4',
};

export default function SignatureStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: SignatureStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}
