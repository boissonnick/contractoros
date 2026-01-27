"use client";

import React from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/components/ui/AppShell';
import { NavItem } from '@/types';
import {
  HomeIcon,
  ClockIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

const navItems: NavItem[] = [
  { label: 'Today', href: '/field', icon: HomeIcon },
  { label: 'Clock', href: '/field/time', icon: ClockIcon },
  { label: 'Schedule', href: '/field/schedule', icon: CalendarDaysIcon },
  { label: 'Tasks', href: '/field/tasks', icon: ClipboardDocumentCheckIcon },
  { label: 'Photos', href: '/field/photos', icon: CameraIcon },
];

function FieldLayoutContent({ children }: { children: React.ReactNode }) {
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

export default function FieldLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard allowedRoles={['EMPLOYEE', 'CONTRACTOR']}>
        <FieldLayoutContent>{children}</FieldLayoutContent>
      </AuthGuard>
    </AuthProvider>
  );
}
