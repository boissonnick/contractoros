"use client";

import React from 'react';
import { useAuth } from '@/lib/auth';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/components/ui/AppShell';
import { NavItem } from '@/types';
import {
  HomeIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/sub', icon: HomeIcon },
  { label: 'Bids', href: '/sub/bids', icon: DocumentTextIcon },
  { label: 'Schedule', href: '/sub/schedule', icon: CalendarDaysIcon },
  { label: 'Invoices', href: '/sub/invoices', icon: BanknotesIcon },
  { label: 'Photos', href: '/sub/photos', icon: CameraIcon },
];

function SubLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();

  return (
    <AppShell
      navItems={navItems}
      userDisplayName={profile?.displayName}
      onSignOut={signOut}
    >
      {children}
    </AppShell>
  );
}

export default function SubLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['SUB']}>
      <SubLayoutContent>{children}</SubLayoutContent>
    </AuthGuard>
  );
}
