"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const REPORTS_NAV: NavItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    href: '/dashboard/reports',
    icon: PresentationChartLineIcon,
  },
  {
    key: 'financial',
    label: 'Financial',
    href: '/dashboard/reports/financial',
    icon: CurrencyDollarIcon,
  },
  {
    key: 'operational',
    label: 'Operational',
    href: '/dashboard/reports/operational',
    icon: ClipboardDocumentListIcon,
  },
  {
    key: 'legacy',
    label: 'Detailed Reports',
    href: '/dashboard/reports/detailed',
    icon: ChartBarIcon,
  },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine active tab
  const getIsActive = (item: NavItem) => {
    if (item.href === '/dashboard/reports') {
      return pathname === '/dashboard/reports';
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 mt-1">Track performance, financials, and operational metrics</p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 -mx-6 px-6">
        <nav className="flex gap-1" aria-label="Reports tabs">
          {REPORTS_NAV.map((item) => {
            const isActive = getIsActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
