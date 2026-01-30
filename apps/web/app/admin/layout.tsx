"use client";

// Force dynamic rendering - skip static generation for admin section
export const dynamic = 'force-dynamic';

import React from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AppShell from '@/components/ui/AppShell';
import { useAuth } from '@/lib/auth';
import { NavItem } from '@/types';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const adminNav: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: HomeIcon },
  { label: 'Organizations', href: '/admin/organizations', icon: BuildingOfficeIcon },
  { label: 'Users', href: '/admin/users', icon: UsersIcon },
  { label: 'Activity', href: '/admin/activity', icon: ClockIcon },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();

  return (
    <AppShell
      navItems={adminNav}
      userDisplayName={profile?.displayName || 'Super Admin'}
      onSignOut={signOut}
    >
      {children}
    </AppShell>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminGuard>
  );
}
