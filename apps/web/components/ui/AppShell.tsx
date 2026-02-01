"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem, UserRole } from '@/types';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { MobileHeader, MobileDrawer, MobileBottomNav } from './MobileNav';

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  userDisplayName?: string;
  onSignOut: () => void;
  sidebarFooter?: React.ReactNode;
}

export default function AppShell({
  children,
  navItems,
  userDisplayName,
  onSignOut,
  sidebarFooter
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-xl text-brand-primary hover:opacity-80 transition-opacity">
            ContractorOS
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-brand-primary-light text-brand-primary'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-primary' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Dev Tools / Admin Tools above user section */}
        {sidebarFooter && (
          <div className="px-4 py-3 border-t border-gray-200">
            {sidebarFooter}
          </div>
        )}

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-brand-primary-light flex items-center justify-center text-brand-primary font-bold">
              {userDisplayName ? userDisplayName.charAt(0) : 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 truncate w-32">{userDisplayName}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header - Using Sprint 18 MobileNav component */}
      <MobileHeader
        title="ContractorOS"
        logoHref="/dashboard"
        onMenuClick={() => setMobileDrawerOpen(true)}
      />

      {/* Mobile Drawer - Using Sprint 18 MobileNav component */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        items={navItems}
        userDisplayName={userDisplayName}
        onSignOut={onSignOut}
        footer={sidebarFooter}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav - Using Sprint 18 MobileNav component */}
      <MobileBottomNav
        items={navItems}
        maxItems={5}
        showMore={navItems.length > 5}
        onMoreClick={() => setMobileDrawerOpen(true)}
      />
    </div>
  );
}