"use client";

import React from 'react';
import { ClientSource } from '@/types';
import { CLIENT_SOURCE_LABELS } from '@/lib/hooks/useClients';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  DevicePhoneMobileIcon,
  HomeModernIcon,
  TruckIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

const sourceIcons: Record<ClientSource, React.ReactNode> = {
  referral: <UserGroupIcon className="h-5 w-5" />,
  google: <MagnifyingGlassIcon className="h-5 w-5" />,
  social_media: <DevicePhoneMobileIcon className="h-5 w-5" />,
  yard_sign: <HomeModernIcon className="h-5 w-5" />,
  vehicle_wrap: <TruckIcon className="h-5 w-5" />,
  website: <GlobeAltIcon className="h-5 w-5" />,
  repeat: <ArrowPathIcon className="h-5 w-5" />,
  other: <QuestionMarkCircleIcon className="h-5 w-5" />,
};

const sourceColors: Record<ClientSource, string> = {
  referral: 'bg-purple-100 text-purple-700 border-purple-200',
  google: 'bg-blue-100 text-blue-700 border-blue-200',
  social_media: 'bg-pink-100 text-pink-700 border-pink-200',
  yard_sign: 'bg-green-100 text-green-700 border-green-200',
  vehicle_wrap: 'bg-orange-100 text-orange-700 border-orange-200',
  website: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  repeat: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

interface ClientSourceSelectProps {
  value: ClientSource | undefined;
  onChange: (source: ClientSource) => void;
  className?: string;
}

export function ClientSourceSelect({ value, onChange, className = '' }: ClientSourceSelectProps) {
  const sources = Object.keys(CLIENT_SOURCE_LABELS) as ClientSource[];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${className}`}>
      {sources.map((source) => (
        <button
          key={source}
          type="button"
          onClick={() => onChange(source)}
          className={`
            flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
            ${value === source
              ? `${sourceColors[source]} border-current ring-2 ring-offset-2 ring-current/50`
              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          {sourceIcons[source]}
          <span className="text-xs font-medium text-center">{CLIENT_SOURCE_LABELS[source]}</span>
        </button>
      ))}
    </div>
  );
}

// Simple dropdown version for forms
interface ClientSourceDropdownProps {
  value: ClientSource | undefined;
  onChange: (source: ClientSource) => void;
  className?: string;
  placeholder?: string;
}

export function ClientSourceDropdown({
  value,
  onChange,
  className = '',
  placeholder = 'Select source...',
}: ClientSourceDropdownProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value as ClientSource)}
      className={`
        w-full px-3 py-2 border border-gray-300 rounded-lg
        focus:ring-2 focus:ring-brand-primary focus:border-transparent
        ${className}
      `}
    >
      <option value="">{placeholder}</option>
      {(Object.keys(CLIENT_SOURCE_LABELS) as ClientSource[]).map((source) => (
        <option key={source} value={source}>
          {CLIENT_SOURCE_LABELS[source]}
        </option>
      ))}
    </select>
  );
}

// Badge display for showing source
interface ClientSourceBadgeProps {
  source: ClientSource;
  size?: 'sm' | 'md';
}

export function ClientSourceBadge({ source, size = 'md' }: ClientSourceBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full
        ${sourceColors[source]}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
      `}
    >
      <span className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}>
        {sourceIcons[source]}
      </span>
      {CLIENT_SOURCE_LABELS[source]}
    </span>
  );
}

export default ClientSourceSelect;
