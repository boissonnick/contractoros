"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/types';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { MobileHeader, MobileDrawer, MobileBottomNav } from './MobileNav';
import { useNetworkStatus } from '@/lib/offline/network-status';
import { GlobalSearchBar } from '@/components/search';
import { cn } from '@/lib/utils';
import { NavSection } from '@/components/navigation';

// Collapsible nav item component for sections with children
function CollapsibleNavItem({
  item,
  isActive,
  pathname,
}: {
  item: NavItem;
  isActive: boolean;
  pathname: string;
}) {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const Icon = item.icon;

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-brand-800/50 text-white shadow-sm ring-1 ring-white/10'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        )}
      >
        <div className="flex items-center">
          <Icon className={cn('mr-3 h-5 w-5', isActive ? 'text-brand-accent' : 'text-gray-500Group-hover:text-white')} />
          <span>{item.label}</span>
        </div>
        <ChevronDownIcon
          className={cn(
            'h-4 w-4 transition-transform duration-200 opacity-50',
            isExpanded && 'rotate-180',
            isActive ? 'text-white' : 'text-gray-500'
          )}
        />
      </button>
      {isExpanded && item.children && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
          {item.children.map((child) => {
            const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'block px-3 py-2 text-sm rounded-lg transition-colors',
                  isChildActive
                    ? 'text-brand-accent font-medium bg-brand-accent/10'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  /** Optional sections for grouped navigation (used instead of flat navItems on desktop) */
  navSections?: NavSection[];
  userDisplayName?: string;
  onSignOut: () => void;
  sidebarFooter?: React.ReactNode;
}

export default function AppShell({
  children,
  navItems,
  navSections,
  userDisplayName,
  onSignOut,
  sidebarFooter
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { isOnline } = useNetworkStatus();

  // Helper to render a single nav item (used by both flat list and sections)
  const renderNavItem = (item: NavItem, isActive: boolean) => {
    const hasChildren = item.children && item.children.length > 0;
    const isChildActive = hasChildren && item.children?.some(
      child => pathname === child.href || pathname.startsWith(child.href + '/')
    );

    // For items with children, render collapsible section
    if (hasChildren) {
      return (
        <CollapsibleNavItem
          key={item.href}
          item={item}
          isActive={isActive || !!isChildActive}
          pathname={pathname}
        />
      );
    }

    // For regular items, render simple link
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 mb-1',
          isActive
            ? 'bg-brand-800/50 text-white shadow-sm ring-1 ring-white/10'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        )}
      >
        <item.icon className={cn('mr-3 h-5 w-5 transition-colors', isActive ? 'text-brand-accent' : 'text-gray-500 group-hover:text-white')} />
        <span className="tracking-wide">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-brand-950 h-screen sticky top-0 border-r border-white/5 shadow-xl z-30">
        {/* Logo Area */}
        <div className="p-6 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <Link href="/dashboard" className="font-bold text-xl text-white tracking-tight">
            ContractorOS
          </Link>
        </div>

        {/* Global Search - integrated into sidebar */}
        <div className="px-4 pb-4">
          <GlobalSearchBar className="w-full bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:bg-white/10" />
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {/* If sections are provided, render grouped navigation */}
          {navSections && navSections.length > 0 ? (
            <div className="space-y-1 pt-2">
              {navSections.map((section) => (
                <div key={section.id}>
                    {section.title && (
                        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {section.title}
                        </h3>
                    )}
                    <div className="space-y-1">
                        {section.items.map(item => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                             return renderNavItem(item, isActive);
                        })}
                    </div>
                </div>
              ))}
            </div>
          ) : (
            /* Otherwise render flat navigation items */
            navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return renderNavItem(item, isActive);
            })
          )}
        </nav>

        {/* Dev Tools / Admin Tools above user section */}
        {sidebarFooter && (
          <div className="px-4 py-3 border-t border-white/10 bg-black/10">
            {sidebarFooter}
          </div>
        )}

        {/* User Profile Section */}
        <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center mb-4 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-brand-900">
                {userDisplayName ? userDisplayName.charAt(0) : 'U'}
              </div>
              {/* Online status indicator */}
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-brand-950 ${
                  isOnline ? 'bg-green-500' : 'bg-gray-500'
                }`}
                title={isOnline ? 'Online' : 'Offline'}
              />
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userDisplayName}</p>
              <p className="text-xs text-gray-500 truncate">View Profile</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center px-4 py-2 border border-white/10 shadow-sm text-sm font-medium rounded-lg text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
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
      <main className="flex-1 overflow-auto pb-24 md:pb-0">
        <div className="p-4 md:p-6">
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