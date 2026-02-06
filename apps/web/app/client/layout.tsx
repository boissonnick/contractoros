"use client";

import React from 'react';
import { useAuth } from '@/lib/auth';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/components/ui/AppShell';
import { SectionErrorBoundary } from '@/components/ui/SectionErrorBoundary';
import { NavItem } from '@/types';
import {
  HomeIcon,
  FolderIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CreditCardIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navItems: NavItem[] = [
  { label: 'Home', href: '/client', icon: HomeIcon },
  { label: 'Projects', href: '/client/projects', icon: FolderIcon },
  { label: 'Photos', href: '/client/photos', icon: PhotoIcon },
  { label: 'Invoices', href: '/client/invoices', icon: CreditCardIcon },
  { label: 'Messages', href: '/client/messages', icon: ChatBubbleLeftRightIcon },
  { label: 'Documents', href: '/client/documents', icon: DocumentTextIcon },
  { label: 'Settings', href: '/client/settings', icon: Cog6ToothIcon },
];

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();

  return (
    <AppShell
      navItems={navItems}
      userDisplayName={profile?.displayName}
      onSignOut={signOut}
    >
      <SectionErrorBoundary sectionName="Client Portal">
        {children}
      </SectionErrorBoundary>
    </AppShell>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['CLIENT']}>
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </AuthGuard>
  );
}
