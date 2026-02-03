"use client";

import React from 'react';
import Link from 'next/link';
import { Subcontractor } from '@/types';
import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';

export type SubcontractorStatus = 'Active' | 'Pending' | 'Inactive';

interface SubcontractorCardProps {
  subcontractor: Subcontractor;
  onViewDetails?: (subcontractor: Subcontractor) => void;
  onContact?: (subcontractor: Subcontractor) => void;
  className?: string;
}

function getStatusFromSubcontractor(sub: Subcontractor): SubcontractorStatus {
  // For now, map isActive to status
  // In the future, this could use a dedicated status field
  if (sub.isActive) {
    return 'Active';
  }
  // Check if it's a new subcontractor (no completed projects = pending)
  if (sub.metrics.projectsCompleted === 0) {
    return 'Pending';
  }
  return 'Inactive';
}

function getStatusBadgeVariant(status: SubcontractorStatus): 'success' | 'warning' | 'default' {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Pending':
      return 'warning';
    case 'Inactive':
      return 'default';
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SubcontractorCard({
  subcontractor,
  onViewDetails,
  onContact,
  className,
}: SubcontractorCardProps) {
  const status = getStatusFromSubcontractor(subcontractor);
  const rating = subcontractor.metrics.avgRating;

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails?.(subcontractor);
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContact?.(subcontractor);
  };

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-xl p-4',
        'hover:shadow-md hover:border-gray-300 transition-all duration-200',
        className
      )}
    >
      {/* Header: Company name, contact, and status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {subcontractor.companyName}
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">
            {subcontractor.contactName}
          </p>
        </div>
        <Badge variant={getStatusBadgeVariant(status)} size="sm" dot>
          {status}
        </Badge>
      </div>

      {/* Trade/Specialty */}
      <div className="mb-3">
        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
          {subcontractor.trade}
        </span>
        {subcontractor.licenseNumber && (
          <span className="ml-2 text-xs text-gray-400">
            Lic# {subcontractor.licenseNumber}
          </span>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 mb-3">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) =>
            star <= Math.round(rating) ? (
              <StarSolid key={star} className="h-4 w-4 text-yellow-400" />
            ) : (
              <StarIcon key={star} className="h-4 w-4 text-gray-300" />
            )
          )}
        </div>
        <span className="text-sm text-gray-600 ml-1">
          {rating > 0 ? rating.toFixed(1) : 'No ratings'}
        </span>
        {subcontractor.metrics.projectsCompleted > 0 && (
          <span className="text-xs text-gray-400 ml-1">
            ({subcontractor.metrics.projectsCompleted} projects)
          </span>
        )}
      </div>

      {/* Contact Info */}
      <div className="flex flex-col gap-1.5 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <a
            href={`mailto:${subcontractor.email}`}
            className="truncate hover:text-brand-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {subcontractor.email}
          </a>
        </div>
        {subcontractor.phone && (
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <a
              href={`tel:${subcontractor.phone}`}
              className="hover:text-brand-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {subcontractor.phone}
            </a>
          </div>
        )}
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-center">
        <div className="bg-gray-50 rounded-lg py-2 px-3">
          <p className="text-sm font-semibold text-gray-900">
            {subcontractor.metrics.onTimeRate}%
          </p>
          <p className="text-xs text-gray-500">On-time</p>
        </div>
        <div className="bg-gray-50 rounded-lg py-2 px-3">
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(subcontractor.metrics.totalPaid)}
          </p>
          <p className="text-xs text-gray-500">Total Paid</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewDetails}
          icon={<EyeIcon className="h-4 w-4" />}
          className="flex-1"
        >
          View Details
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleContact}
          icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
          className="flex-1"
        >
          Contact
        </Button>
      </div>
    </div>
  );
}

// Export types
export type { SubcontractorCardProps };
