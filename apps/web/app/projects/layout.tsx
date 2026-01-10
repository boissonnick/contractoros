"use client";

import React from 'react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { AppShell } from '../../components/layout/AppShell';
import { 
  HomeIcon, 
  CalendarIcon, 
  ClockIcon, 
  InboxIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';
import { NavItem } from '../../types';

// Navigation items for Internal Roles (Owner, PM, Super, Worker)
const internalNavItems: NavItem[] = [
  { label: 'Projects', href: '/projects', icon: HomeIcon },
  { label: 'Schedule', href: '/projects/schedule', icon: CalendarIcon },
  { label: 'Time', href: '/projects/time', icon: ClockIcon },
  { label: 'Inbox', href: '/projects/inbox', icon: InboxIcon },
  { label: 'Crew', href: '/projects/crew', icon: UserGroupIcon },
];

function InternalLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();

  return (
    <AppShell 
      navItems={internalNavItems} 
      userDisplayName={profile?.displayName}
      onSignOut={signOut}
    >
      {children}
    </AppShell>
  );
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard allowedRoles={['OWNER', 'PM', 'SUPER', 'WORKER']}>
        <InternalLayoutContent>{children}</InternalLayoutContent>
      </AuthGuard>
    </AuthProvider>
  );
}