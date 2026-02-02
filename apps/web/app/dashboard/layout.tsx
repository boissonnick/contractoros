"use client";

import React, { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/components/ui/AppShell';
import { NavItem, RolePermissions } from '@/types';
import { useImpersonation } from '@/lib/contexts/ImpersonationContext';
import { ImpersonationBanner } from '@/components/impersonation';
import { OfflineBanner } from '@/components/offline/OfflineBanner';
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
} from '@heroicons/react/24/outline';

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

      {/* Global Search - positioned in header area on desktop */}
      <div className="hidden md:block fixed top-4 right-8 z-40">
        <GlobalSearchBar />
      </div>

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
