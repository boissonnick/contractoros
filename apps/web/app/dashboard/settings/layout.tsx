"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RouteGuard } from '@/components/auth';
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
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
  BanknotesIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// SETTINGS NAVIGATION - Organized into 7 logical groups
// =============================================================================
// 1. Account - Personal profile settings
// 2. Organization - Company info, team, roles
// 3. Finance - Payroll, tax rates, billing
// 4. Templates - All template types consolidated
// 5. Notifications - Communication preferences
// 6. Integrations - Third-party connections
// 7. Advanced - Data import/export, AI features
// =============================================================================

interface NavSection {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: { key: string; label: string; href: string }[];
}

const SETTINGS_NAV: NavSection[] = [
  // Account - Personal settings
  {
    key: 'account',
    label: 'Account',
    icon: UserCircleIcon,
    href: '/dashboard/settings/profile',
  },
  // Organization - Company & team management
  {
    key: 'organization',
    label: 'Organization',
    icon: BuildingOfficeIcon,
    children: [
      { key: 'company', label: 'Company Info', href: '/dashboard/settings/organization' },
      { key: 'team', label: 'Team Members', href: '/dashboard/settings/team' },
      { key: 'roles', label: 'Roles & Permissions', href: '/dashboard/settings/roles' },
    ],
  },
  // Finance - Financial settings
  {
    key: 'finance',
    label: 'Finance',
    icon: BanknotesIcon,
    children: [
      { key: 'payroll', label: 'Payroll Settings', href: '/dashboard/settings/payroll' },
      { key: 'tax-rates', label: 'Tax Rates', href: '/dashboard/settings/tax-rates' },
      { key: 'billing', label: 'Billing & Plans', href: '/dashboard/settings/billing' },
      { key: 'numbering', label: 'Numbering', href: '/dashboard/settings/numbering' },
    ],
  },
  // Templates - All templates consolidated in one tabbed page
  {
    key: 'templates',
    label: 'Templates',
    icon: RectangleStackIcon,
    href: '/dashboard/settings/templates',
  },
  // Notifications - Communication settings
  {
    key: 'notifications',
    label: 'Notifications',
    icon: BellIcon,
    children: [
      { key: 'preferences', label: 'Preferences', href: '/dashboard/settings/notifications' },
      { key: 'email-history', label: 'Email History', href: '/dashboard/settings/email-history' },
    ],
  },
  // Integrations - Third-party apps
  {
    key: 'integrations',
    label: 'Integrations',
    icon: PuzzlePieceIcon,
    href: '/dashboard/settings/integrations',
  },
  // Advanced - Power user features
  {
    key: 'advanced',
    label: 'Advanced',
    icon: WrenchScrewdriverIcon,
    children: [
      { key: 'data-export', label: 'Data Export', href: '/dashboard/settings/data-export' },
      { key: 'data-import', label: 'Data Import', href: '/dashboard/settings/import' },
      { key: 'intelligence', label: 'AI Intelligence', href: '/dashboard/settings/intelligence' },
      { key: 'assistant', label: 'AI Assistant', href: '/dashboard/settings/assistant' },
    ],
  },
];

// Path mapping for section highlighting
const SECTION_PATHS: Record<string, string[]> = {
  account: ['/dashboard/settings/profile'],
  organization: [
    '/dashboard/settings/organization',
    '/dashboard/settings/team',
    '/dashboard/settings/roles',
  ],
  finance: [
    '/dashboard/settings/payroll',
    '/dashboard/settings/tax-rates',
    '/dashboard/settings/billing',
    '/dashboard/settings/numbering',
  ],
  templates: [
    '/dashboard/settings/templates',
    '/dashboard/settings/line-items',
    '/dashboard/settings/quote-templates',
    '/dashboard/settings/sow-templates',
    '/dashboard/settings/sms-templates',
    '/dashboard/settings/email-templates',
    '/dashboard/settings', // Phase templates (root settings page)
  ],
  notifications: [
    '/dashboard/settings/notifications',
    '/dashboard/settings/email-history',
  ],
  integrations: [
    '/dashboard/settings/integrations',
    '/dashboard/settings/integrations/quickbooks',
  ],
  advanced: [
    '/dashboard/settings/data-export',
    '/dashboard/settings/import',
    '/dashboard/settings/intelligence',
    '/dashboard/settings/assistant',
  ],
};

function isPathInSection(pathname: string, section: NavSection): boolean {
  if (section.href && pathname === section.href) return true;
  const paths = SECTION_PATHS[section.key];
  if (paths && paths.includes(pathname)) return true;
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
    <RouteGuard permissions={['canViewSettings']}>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your organization and preferences</p>
      </div>

      {/* Grouped tab bar - 7 logical sections with collapsible dropdowns */}
      <div className="border-b border-gray-200 -mx-6 px-6 overflow-visible">
        <nav className="flex gap-1 overflow-visible" aria-label="Settings tabs">
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
    </RouteGuard>
  );
}
