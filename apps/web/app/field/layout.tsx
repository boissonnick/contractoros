"use client";

import React from 'react';
import { useAuth } from '@/lib/auth';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/components/ui/AppShell';
import { SectionErrorBoundary } from '@/components/ui/SectionErrorBoundary';
import { NavItem } from '@/types';
import { FloatingSyncIndicator } from '@/components/offline/SyncStatusIndicator';
import { VoiceActivationFAB } from '@/components/voice';
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
      <SectionErrorBoundary sectionName="Field Portal">
        {children}
      </SectionErrorBoundary>
      <VoiceActivationFAB
        context={{}}
        bottomOffset={80}
        requireConfirmation={true}
      />
      <FloatingSyncIndicator position="bottom-left" showWhenOnline />
    </AppShell>
  );
}

export default function FieldLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR', 'SUB']}>
      <FieldLayoutContent>{children}</FieldLayoutContent>
    </AuthGuard>
  );
}
