"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Squares2X2Icon,
  BuildingOfficeIcon,
  BellIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/24/outline';

const SETTINGS_TABS = [
  { key: '/dashboard/settings', label: 'Phase Templates', icon: Squares2X2Icon },
  { key: '/dashboard/settings/organization', label: 'Organization', icon: BuildingOfficeIcon },
  { key: '/dashboard/settings/notifications', label: 'Notifications', icon: BellIcon, comingSoon: true },
  { key: '/dashboard/settings/integrations', label: 'Integrations', icon: PuzzlePieceIcon, comingSoon: true },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your organization and preferences</p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 -mx-6 px-6">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Settings tabs">
          {SETTINGS_TABS.map((tab) => {
            const isActive = pathname === tab.key;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.key}
                href={tab.comingSoon ? '#' : tab.key}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  tab.comingSoon && 'opacity-50 cursor-not-allowed'
                )}
                onClick={tab.comingSoon ? (e) => e.preventDefault() : undefined}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.comingSoon && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Soon</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
