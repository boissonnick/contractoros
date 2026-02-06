"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui';
import {
  UserCircleIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  RectangleStackIcon,
  BellIcon,
  PuzzlePieceIcon,
  WrenchScrewdriverIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const SETTINGS_SECTIONS = [
  {
    key: 'account',
    label: 'Account',
    description: 'Profile, security, and active sessions',
    icon: UserCircleIcon,
    href: '/dashboard/settings/profile',
    color: 'bg-blue-50 text-blue-600',
    items: ['Profile', 'Active Sessions'],
  },
  {
    key: 'organization',
    label: 'Organization',
    description: 'Company info, team members, and roles',
    icon: BuildingOfficeIcon,
    href: '/dashboard/settings/organization',
    color: 'bg-purple-50 text-purple-600',
    items: ['Company Info', 'Team Members', 'Roles & Permissions'],
  },
  {
    key: 'finance',
    label: 'Finance',
    description: 'Payroll, tax rates, billing, and numbering',
    icon: BanknotesIcon,
    href: '/dashboard/settings/payroll',
    color: 'bg-green-50 text-green-600',
    items: ['Payroll Settings', 'Tax Rates', 'Billing & Plans', 'Numbering'],
  },
  {
    key: 'templates',
    label: 'Templates',
    description: 'Quote, SOW, email, SMS, and phase templates',
    icon: RectangleStackIcon,
    href: '/dashboard/settings/templates',
    color: 'bg-amber-50 text-amber-600',
    items: ['Quote Templates', 'SOW Templates', 'Email Templates', 'SMS Templates', 'Line Items', 'Phase Templates'],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Email, push, and quiet hours preferences',
    icon: BellIcon,
    href: '/dashboard/settings/notifications',
    color: 'bg-red-50 text-red-600',
    items: ['Preferences', 'Email History'],
  },
  {
    key: 'integrations',
    label: 'Integrations',
    description: 'Connect QuickBooks, Stripe, Gusto, and more',
    icon: PuzzlePieceIcon,
    href: '/dashboard/settings/integrations',
    color: 'bg-indigo-50 text-indigo-600',
    items: ['QuickBooks', 'Stripe', 'Gusto'],
  },
  {
    key: 'advanced',
    label: 'Advanced',
    description: 'Data management, security, and AI assistant',
    icon: WrenchScrewdriverIcon,
    href: '/dashboard/settings/data-export',
    color: 'bg-gray-100 text-gray-600',
    items: ['Data Export', 'Data Import', 'Audit Logs', 'Security', 'AI Assistant'],
  },
];

export default function SettingsPage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">
          Welcome, {profile?.displayName?.split(' ')[0] || 'there'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your account, organization, and platform preferences.
        </p>
      </div>

      {/* Settings sections grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.key} href={section.href}>
              <Card hover className="h-full">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${section.color} flex-shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{section.label}</h3>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {section.items.slice(0, 3).map((item) => (
                        <span
                          key={item}
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {item}
                        </span>
                      ))}
                      {section.items.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          +{section.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
