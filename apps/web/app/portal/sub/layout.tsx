"use client";

import React from 'react';
import { AuthProvider, useAuth } from '../../../../context/AuthContext';
import { AuthGuard } from '../../../../components/auth/AuthGuard';
import { AppShell } from '../../../../components/layout/AppShell';
import { 
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  WrenchScrewdriverIcon 
} from '@heroicons/react/24/outline';
import { NavItem } from '../../../../types';

const subNavItems: NavItem[] = [
  { label: 'My Tasks', href: '/portal/sub', icon: ClipboardDocumentCheckIcon },
  { label: 'Schedule', href: '/portal/sub/schedule', icon: CalendarIcon },
  { label: 'Punch List', href: '/portal/sub/punchlist', icon: WrenchScrewdriverIcon },
];

function SubLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();

  return (
    <AppShell 
      navItems={subNavItems} 
      userDisplayName={profile?.displayName}
      onSignOut={signOut}
    >
      {children}
    </AppShell>
  );
}

export default function SubPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard allowedRoles={['SUB']}>
        <SubLayoutContent>{children}</SubLayoutContent>
      </AuthGuard>
    </AuthProvider>
  );
}