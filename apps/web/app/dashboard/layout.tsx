"use client";

import React, { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/components/ui/AppShell';
import { NavItem, RolePermissions } from '@/types';
import { useImpersonation } from '@/lib/contexts/ImpersonationContext';
import { ImpersonationBanner } from '@/components/impersonation';
import DevToolsWidget from '@/components/ui/DevToolsWidget';
import {
  HomeIcon,
  FolderIcon,
  UsersIcon,
  CalendarIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// Full nav items - will be filtered based on permissions
const allNavItems: (NavItem & { requiredPermission?: keyof RolePermissions })[] = [
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Projects', href: '/dashboard/projects', icon: FolderIcon },
  { label: 'Clients', href: '/dashboard/clients', icon: UserGroupIcon, requiredPermission: 'canViewClients' },
  { label: 'Team', href: '/dashboard/team', icon: UsersIcon, requiredPermission: 'canViewTeam' },
  { label: 'Schedule', href: '/dashboard/schedule', icon: CalendarIcon },
  { label: 'Time Tracking', href: '/dashboard/time', icon: ClockIcon, requiredPermission: 'canClockInOut' },
  { label: 'Daily Logs', href: '/dashboard/logs', icon: DocumentTextIcon },
  { label: 'Finances', href: '/dashboard/finances', icon: BanknotesIcon, requiredPermission: 'canViewAllFinances' },
  { label: 'Messaging', href: '/dashboard/messaging', icon: ChatBubbleLeftRightIcon },
  { label: 'Reports', href: '/dashboard/reports', icon: ClipboardDocumentListIcon, requiredPermission: 'canViewProjectReports' },
  { label: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, requiredPermission: 'canViewSettings' },
];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { permissions } = useImpersonation();

  // Filter nav items based on current permissions
  const filteredNavItems = useMemo(() => {
    return allNavItems.filter((item) => {
      // Always show items without permission requirements
      if (!item.requiredPermission) return true;
      // Check if user has the required permission
      return permissions[item.requiredPermission];
    });
  }, [permissions]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Impersonation Banner at the very top */}
      <ImpersonationBanner />

      {/* Main App Shell */}
      <div className="flex-1">
        <AppShell
          navItems={filteredNavItems}
          userDisplayName={profile?.displayName}
          onSignOut={signOut}
        >
          {children}
        </AppShell>
      </div>

      {/* Dev Tools Widget - Impersonation + Version indicator */}
      <DevToolsWidget />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['OWNER', 'PM']}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthGuard>
  );
}
