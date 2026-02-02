"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const REPORTS_NAV: NavItem[] = [
  {
    key: 'overview',
    label: 'Overview',
    href: '/dashboard/reports',
    icon: PresentationChartLineIcon,
    description: 'Key metrics and KPIs',
  },
  {
    key: 'financial',
    label: 'Financial',
    href: '/dashboard/reports/financial',
    icon: CurrencyDollarIcon,
    description: 'Revenue, expenses, profitability',
  },
  {
    key: 'operational',
    label: 'Operational',
    href: '/dashboard/reports/operational',
    icon: ClipboardDocumentListIcon,
    description: 'Projects, tasks, productivity',
  },
  {
    key: 'detailed',
    label: 'Detailed Reports',
    href: '/dashboard/reports/detailed',
    icon: ChartBarIcon,
    description: 'In-depth analysis',
  },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine active item
  const getIsActive = (item: NavItem) => {
    if (item.href === '/dashboard/reports') {
      return pathname === '/dashboard/reports';
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 flex-shrink-0">
        <div className="lg:sticky lg:top-6">
          {/* Header - visible on desktop */}
          <div className="hidden lg:block mb-4">
            <h1 className="text-lg font-semibold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500">Analytics & Insights</p>
          </div>

          {/* Mobile: Horizontal scroll, Desktop: Vertical list */}
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            {REPORTS_NAV.map((item) => {
              const isActive = getIsActive(item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-w-fit lg:min-w-0',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                  )}
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-blue-600' : 'text-gray-400')} />
                  <div className="flex-1 hidden lg:block">
                    <div className="flex items-center justify-between">
                      <span>{item.label}</span>
                      {isActive && <ChevronRightIcon className="h-4 w-4 text-blue-400" />}
                    </div>
                    {item.description && (
                      <p className={cn('text-xs mt-0.5', isActive ? 'text-blue-600' : 'text-gray-400')}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  {/* Mobile label */}
                  <span className="lg:hidden">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Stats - Desktop only */}
          <div className="hidden lg:block mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-medium text-gray-900">4 reports</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium text-gray-900">Today</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden mb-4">
          <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Track performance and insights</p>
        </div>

        {children}
      </main>
    </div>
  );
}
