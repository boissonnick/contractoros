"use client";

import React from 'react';
import { Subcontractor } from '@/types';
import { cn } from '@/lib/utils';
import { StarIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface SubCardProps {
  sub: Subcontractor;
  onClick?: (sub: Subcontractor) => void;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function SubCard({ sub, onClick }: SubCardProps) {
  const rating = sub.metrics.avgRating;

  return (
    <div
      onClick={() => onClick?.(sub)}
      className={cn(
        'border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{sub.companyName}</h3>
          <p className="text-xs text-gray-500">{sub.contactName}</p>
        </div>
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          sub.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        )}>
          {sub.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
          {sub.trade}
        </span>
        {sub.licenseNumber && (
          <span className="text-xs text-gray-400">Lic# {sub.licenseNumber}</span>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= Math.round(rating)
            ? <StarSolid key={star} className="h-3.5 w-3.5 text-yellow-400" />
            : <StarIcon key={star} className="h-3.5 w-3.5 text-gray-300" />
        ))}
        <span className="text-xs text-gray-500 ml-1">{rating > 0 ? rating.toFixed(1) : 'No ratings'}</span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
        <div className="bg-gray-50 rounded-lg py-1.5">
          <p className="font-semibold text-gray-900">{sub.metrics.projectsCompleted}</p>
          <p className="text-gray-500">Projects</p>
        </div>
        <div className="bg-gray-50 rounded-lg py-1.5">
          <p className="font-semibold text-gray-900">{sub.metrics.onTimeRate}%</p>
          <p className="text-gray-500">On-time</p>
        </div>
        <div className="bg-gray-50 rounded-lg py-1.5">
          <p className="font-semibold text-gray-900">{fmt(sub.metrics.totalPaid)}</p>
          <p className="text-gray-500">Paid</p>
        </div>
      </div>

      {/* Contact */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1 truncate">
          <EnvelopeIcon className="h-3.5 w-3.5" />
          {sub.email}
        </span>
        {sub.phone && (
          <span className="inline-flex items-center gap-1">
            <PhoneIcon className="h-3.5 w-3.5" />
            {sub.phone}
          </span>
        )}
      </div>
    </div>
  );
}
