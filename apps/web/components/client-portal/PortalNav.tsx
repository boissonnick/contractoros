'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ClockIcon,
  PhotoIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface PortalNavProps {
  token: string;
  projectName: string;
  companyName?: string;
}

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: HomeIcon, path: '' },
  { key: 'timeline', label: 'Timeline', icon: ClockIcon, path: '/timeline' },
  { key: 'gallery', label: 'Photos', icon: PhotoIcon, path: '/gallery' },
  { key: 'documents', label: 'Documents', icon: DocumentTextIcon, path: '/documents' },
  { key: 'messages', label: 'Messages', icon: ChatBubbleLeftRightIcon, path: '/messages' },
  { key: 'payments', label: 'Payments', icon: CreditCardIcon, path: '/payments' },
];

export function PortalNav({ token, projectName, companyName }: PortalNavProps) {
  const pathname = usePathname();
  const basePath = `/client/${token}`;

  const isActive = (path: string) => {
    if (path === '') {
      return pathname === basePath || pathname === `${basePath}/`;
    }
    return pathname?.startsWith(`${basePath}${path}`);
  };

  return (
    <>
      {/* Desktop Top Nav */}
      <header className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          {/* Project Header */}
          <div className="py-4 border-b border-gray-100">
            <h1 className="text-xl font-semibold text-gray-900">{projectName}</h1>
            {companyName && (
              <p className="text-sm text-gray-500 mt-0.5">by {companyName}</p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex gap-1 py-2 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.key}
                  href={`${basePath}${item.path}`}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{projectName}</h1>
          {companyName && (
            <p className="text-xs text-gray-500">{companyName}</p>
          )}
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 pb-safe">
        <div className="flex justify-around">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.key}
                href={`${basePath}${item.path}`}
                className={cn(
                  'flex flex-col items-center py-2 px-3 min-w-[64px]',
                  active ? 'text-blue-600' : 'text-gray-500'
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default PortalNav;
