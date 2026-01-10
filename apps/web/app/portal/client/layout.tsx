"use client";

import React from 'react';
import { AuthProvider, useAuth } from '../../../../context/AuthContext';
import { AuthGuard } from '../../../../components/auth/AuthGuard';
import { AppShell } from '../../../../components/layout/AppShell';
import { 
  HomeIcon, 
  PhotoIcon, 
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { NavItem } from '../../../../types';

const clientNavItems: NavItem[] = [
  { label: 'Overview', href: '/portal/client', icon: HomeIcon },
  { label: 'Photos', href: '/portal/client/photos', icon: PhotoIcon },
  { label: 'Financials', href: '/portal/client/financials', icon: CurrencyDollarIcon },
  { label: 'Messages', href: '/portal/client/messages', icon: ChatBubbleLeftRightIcon },
];

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();

  return (
    <AppShell 
      navItems={clientNavItems} 
      userDisplayName={profile?.displayName}
      onSignOut={signOut}
    >
      {children}
    </AppShell>
  );
}

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard allowedRoles={['CLIENT']}>
        <ClientLayoutContent>{children}</ClientLayoutContent>
      </AuthGuard>
    </AuthProvider>
  );
}