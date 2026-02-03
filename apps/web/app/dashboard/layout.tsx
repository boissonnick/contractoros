"use client";

import React, { useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/components/ui/AppShell';
import { NavItem, RolePermissions } from '@/types';
import { useImpersonation } from '@/lib/contexts/ImpersonationContext';
import { ImpersonationBanner } from '@/components/impersonation';
import { OfflineBanner } from '@/components/offline/OfflineBanner';
import { FloatingSyncIndicator } from '@/components/offline/SyncStatusIndicator';
import SidebarDevTools from '@/components/ui/SidebarDevTools';
import { AssistantPanel, AssistantTrigger } from '@/components/assistant';
import { useAssistant } from '@/lib/hooks/useAssistant';
import { GlobalSearchBar } from '@/components/search';
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
  PhotoIcon,
  DocumentIcon,
  CurrencyDollarIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// Full nav items for staff - will be filtered based on permissions
const staffNavItems: (NavItem & { requiredPermission?: keyof RolePermissions })[] = [
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Projects', href: '/dashboard/projects', icon: FolderIcon },
  { label: 'Clients', href: '/dashboard/clients', icon: UserGroupIcon, requiredPermission: 'canViewClients' },
  { label: 'Team', href: '/dashboard/team', icon: UsersIcon, requiredPermission: 'canViewTeam' },
  { label: 'Schedule', href: '/dashboard/schedule', icon: CalendarIcon },
  { label: 'Time Tracking', href: '/dashboard/time', icon: ClockIcon, requiredPermission: 'canClockInOut' },
  { label: 'Daily Logs', href: '/dashboard/logs', icon: DocumentTextIcon },
  { label: 'Finances', href: '/dashboard/finances', icon: BanknotesIcon, requiredPermission: 'canViewAllFinances' },
  { label: 'Payroll', href: '/dashboard/payroll', icon: CurrencyDollarIcon, requiredPermission: 'canViewAllFinances' },
  { label: 'Messaging', href: '/dashboard/messaging', icon: ChatBubbleLeftRightIcon },
  { label: 'Reports', href: '/dashboard/reports', icon: ClipboardDocumentListIcon, requiredPermission: 'canViewProjectReports' },
  { label: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, requiredPermission: 'canViewSettings' },
  { label: 'Help', href: '/dashboard/help', icon: QuestionMarkCircleIcon },
];

// Simplified nav for CLIENT view - only what clients should see
const clientNavItems: NavItem[] = [
  { label: 'My Projects', href: '/dashboard', icon: FolderIcon },
  { label: 'Photos', href: '/dashboard/photos', icon: PhotoIcon },
  { label: 'Messages', href: '/dashboard/messaging', icon: ChatBubbleLeftRightIcon },
  { label: 'Documents', href: '/dashboard/documents', icon: DocumentIcon },
];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { permissions, currentRole } = useImpersonation();

  // AI Assistant state
  const assistant = useAssistant();

  // Register service worker for offline support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service worker registered:', registration.scope);

          // Check for updates periodically
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available, prompt user to refresh
                  console.log('[SW] New content available, refresh to update');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn('[SW] Service worker registration failed:', error);
        });
    }
  }, []);

  // Get nav items based on current role
  const filteredNavItems = useMemo(() => {
    // Client view gets simplified navigation
    if (currentRole === 'client') {
      return clientNavItems;
    }

    // Staff roles get filtered based on permissions
    return staffNavItems.filter((item) => {
      // Always show items without permission requirements
      if (!item.requiredPermission) return true;
      // Check if user has the required permission
      return permissions[item.requiredPermission];
    });
  }, [permissions, currentRole]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Impersonation Banner at the very top */}
      <ImpersonationBanner />

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Global Search - integrated into sidebar header on desktop */}
      {/* Search is now accessible via Cmd+K shortcut and sidebar placement */}

      {/* Main App Shell */}
      <div className="flex-1">
        <AppShell
          navItems={filteredNavItems}
          userDisplayName={profile?.displayName}
          onSignOut={signOut}
          sidebarFooter={<SidebarDevTools />}
        >
          {children}
        </AppShell>
      </div>

      {/* AI Assistant */}
      <AssistantTrigger onClick={assistant.open} />
      <AssistantPanel
        isOpen={assistant.isOpen}
        onClose={assistant.close}
        messages={assistant.messages}
        isProcessing={assistant.isProcessing}
        voiceState={assistant.voiceState}
        onSendMessage={assistant.sendMessage}
        onStartVoice={assistant.startVoice}
        onStopVoice={assistant.stopVoice}
        onClearHistory={assistant.clearHistory}
        onActionClick={assistant.handleAction}
        contextSuggestions={assistant.suggestions}
      />

      {/* Offline Sync Status Indicator - only shows when offline/syncing */}
      <FloatingSyncIndicator position="bottom-right" />
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
