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
// 1. Account - Personal profile settings & security
// 2. Organization - Company info, team, roles
// 3. Finance - Payroll, tax rates, billing, numbering
// 4. Templates - All template types consolidated (Quote PDF, SOW, Email, SMS, Line Items, Phases)
// 5. Notifications - Communication preferences
// 6. Integrations - Third-party connections
// 7. Advanced - Data management, security, AI features
// =============================================================================

interface NavSection {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: { key: string; label: string; href: string }[];
}

const SETTINGS_NAV: NavSection[] = [
  // Home - Settings overview hub
  {
    key: 'home',
    label: 'Overview',
    icon: Cog6ToothIcon,
    href: '/dashboard/settings',
  },
  // Account - Personal settings & security
  {
    key: 'account',
    label: 'Account',
    icon: UserCircleIcon,
    children: [
      { key: 'profile', label: 'Profile', href: '/dashboard/settings/profile' },
      { key: 'sessions', label: 'Active Sessions', href: '/dashboard/settings/sessions' },
    ],
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
  // Advanced - Power user features (consolidated AI section)
  {
    key: 'advanced',
    label: 'Advanced',
    icon: WrenchScrewdriverIcon,
    children: [
      { key: 'data-export', label: 'Data Export', href: '/dashboard/settings/data-export' },
      { key: 'data-import', label: 'Data Import', href: '/dashboard/settings/import' },
      { key: 'data-retention', label: 'Data Retention', href: '/dashboard/settings/data-retention' },
      { key: 'audit-logs', label: 'Audit Logs', href: '/dashboard/settings/audit-logs' },
      { key: 'security', label: 'Security Checklist', href: '/dashboard/settings/security' },
      { key: 'assistant', label: 'AI Assistant', href: '/dashboard/settings/assistant' },
    ],
  },
];

// Path mapping for section highlighting
const SECTION_PATHS: Record<string, string[]> = {
  home: ['/dashboard/settings'],
  account: ['/dashboard/settings/profile', '/dashboard/settings/sessions'],
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
  ],
  notifications: [
    '/dashboard/settings/notifications',
    '/dashboard/settings/email-history',
  ],
  integrations: [
    '/dashboard/settings/integrations',
    '/dashboard/settings/integrations/quickbooks',
    '/dashboard/settings/integrations/stripe',
    '/dashboard/settings/integrations/gusto',
    '/dashboard/settings/integrations/status',
  ],
  advanced: [
    '/dashboard/settings/data-export',
    '/dashboard/settings/import',
    '/dashboard/settings/data-retention',
    '/dashboard/settings/audit-logs',
    '/dashboard/settings/security',
    '/dashboard/settings/assistant',
    // Legacy paths redirect to assistant
    '/dashboard/settings/intelligence',
    '/dashboard/settings/ai-providers',
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

      {/* Grouped tab bar - scrollable on mobile, full display on desktop */}
      <div className="border-b border-gray-200 -mx-4 px-4 md:-mx-6 md:px-6 overflow-visible">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide overflow-y-visible pb-px -mb-px" aria-label="Settings tabs">
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
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0',
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
