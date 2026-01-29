"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BuildingOfficeIcon,
  BellIcon,
  PuzzlePieceIcon,
  UserGroupIcon,
  CreditCardIcon,
  RectangleStackIcon,
  ArchiveBoxIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

// Grouped navigation structure - reduced from 13 to 6 primary items
interface NavSection {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: { key: string; label: string; href: string }[];
}

const SETTINGS_NAV: NavSection[] = [
  {
    key: 'templates',
    label: 'Templates',
    icon: RectangleStackIcon,
    href: '/dashboard/settings/templates',
  },
  {
    key: 'resources',
    label: 'Resources',
    icon: ArchiveBoxIcon,
    children: [
      { key: 'line-items', label: 'Line Items', href: '/dashboard/settings/line-items' },
      { key: 'tax-rates', label: 'Tax Rates', href: '/dashboard/settings/tax-rates' },
      { key: 'quote-templates', label: 'Quote Templates', href: '/dashboard/settings/quote-templates' },
    ],
  },
  {
    key: 'organization',
    label: 'Organization',
    icon: BuildingOfficeIcon,
    href: '/dashboard/settings/organization',
  },
  {
    key: 'team',
    label: 'Team',
    icon: UserGroupIcon,
    href: '/dashboard/settings/team',
  },
  {
    key: 'integrations',
    label: 'Integrations',
    icon: PuzzlePieceIcon,
    href: '/dashboard/settings/integrations',
  },
  {
    key: 'account',
    label: 'Account',
    icon: Cog6ToothIcon,
    children: [
      { key: 'billing', label: 'Billing', href: '/dashboard/settings/billing' },
      { key: 'data-export', label: 'Data Export', href: '/dashboard/settings/data-export' },
      { key: 'notifications', label: 'Notifications', href: '/dashboard/settings/notifications' },
    ],
  },
];

// Paths that should highlight the Templates tab
const TEMPLATE_PATHS = [
  '/dashboard/settings/templates',
  '/dashboard/settings/sow-templates',
  '/dashboard/settings/sms-templates',
  '/dashboard/settings/email-templates',
  '/dashboard/settings', // Phase templates (root settings page)
];

// Paths that should highlight the Resources section
const RESOURCES_PATHS = [
  '/dashboard/settings/line-items',
  '/dashboard/settings/tax-rates',
  '/dashboard/settings/quote-templates',
];

// Paths that should highlight the Account section
const ACCOUNT_PATHS = [
  '/dashboard/settings/billing',
  '/dashboard/settings/data-export',
  '/dashboard/settings/notifications',
];

function isPathInSection(pathname: string, section: NavSection): boolean {
  if (section.href && pathname === section.href) return true;
  if (section.key === 'templates' && TEMPLATE_PATHS.includes(pathname)) return true;
  if (section.key === 'resources' && RESOURCES_PATHS.includes(pathname)) return true;
  if (section.key === 'account' && ACCOUNT_PATHS.includes(pathname)) return true;
  if (section.children) {
    return section.children.some((child) => pathname === child.href);
  }
  return false;
}

function NavDropdown({
  section,
  isActive,
  pathname,
}: {
  section: NavSection;
  isActive: boolean;
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = section.icon;
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
          isActive
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        )}
      >
        <Icon className="h-4 w-4" />
        {section.label}
        <ChevronDownIcon
          className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')}
        />
      </button>
      {isOpen && section.children && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] z-50">
          {section.children.map((child) => (
            <Link
              key={child.key}
              href={child.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'block px-4 py-2 text-sm transition-colors',
                pathname === child.href
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your organization and preferences</p>
      </div>

      {/* Grouped tab bar - reduced from 13 items to 6 */}
      <div className="border-b border-gray-200 -mx-6 px-6">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Settings tabs">
          {SETTINGS_NAV.map((section) => {
            const isActive = isPathInSection(pathname, section);
            const Icon = section.icon;

            // Sections with children render as dropdowns
            if (section.children) {
              return (
                <NavDropdown
                  key={section.key}
                  section={section}
                  isActive={isActive}
                  pathname={pathname}
                />
              );
            }

            // Simple link sections
            return (
              <Link
                key={section.key}
                href={section.href!}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
