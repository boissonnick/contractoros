"use client";

import React, { useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/components/ui/AppShell';
import { NavItem, RolePermissions } from '@/types';
import { NavSection } from '@/components/navigation';
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
  WrenchScrewdriverIcon,
  CalculatorIcon,
  PencilSquareIcon,
  CreditCardIcon,
  TruckIcon,
  InboxIcon,
  ChartBarSquareIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// =============================================================================
// OWNER/PM Navigation - Organized by "Jobs to be Done"
// =============================================================================
// Navigation is organized into logical groups to help users find what they need:
// 1. Project Management - Core project work
// 2. Sales & Clients - Customer relationship & sales pipeline
// 3. Finance - All money-related functions (collapsible)
// 4. Operations - Team, subs, equipment, materials
// 5. Communication - Messages and documents
// 6. Settings & Help - Configuration and support (at bottom)
// =============================================================================

const ownerPmNavItems: (NavItem & { requiredPermission?: keyof RolePermissions; section?: string })[] = [
  // ---------------------------------------------
  // PROJECT MANAGEMENT
  // Core project work and scheduling
  // ---------------------------------------------
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Projects', href: '/dashboard/projects', icon: FolderIcon },
  { label: 'Schedule', href: '/dashboard/schedule', icon: CalendarIcon },
  { label: 'Daily Logs', href: '/dashboard/logs', icon: DocumentTextIcon },

  // ---------------------------------------------
  // SALES & CLIENTS
  // Customer relationships and sales pipeline
  // Roles: OWNER, PM (not EMPLOYEE/CONTRACTOR)
  // ---------------------------------------------
  { label: 'Clients', href: '/dashboard/clients', icon: UserGroupIcon, requiredPermission: 'canViewClients' },
  { label: 'Estimates', href: '/dashboard/estimates', icon: CalculatorIcon, requiredPermission: 'canViewClients' },
  { label: 'E-Signatures', href: '/dashboard/signatures', icon: PencilSquareIcon, requiredPermission: 'canViewClients' },

  // ---------------------------------------------
  // FINANCE (Collapsible Section)
  // All financial operations grouped together
  // Roles: OWNER, PM with finance permissions
  // Note: Reports link removed - use dedicated Reports section
  // ---------------------------------------------
  {
    label: 'Finance',
    href: '/dashboard/finances',
    icon: BanknotesIcon,
    requiredPermission: 'canViewAllFinances',
    children: [
      { label: 'Overview', href: '/dashboard/finances' },
      { label: 'Invoices', href: '/dashboard/invoices' },
      { label: 'Expenses', href: '/dashboard/expenses' },
      { label: 'Payroll', href: '/dashboard/payroll' },
    ],
  },

  // ---------------------------------------------
  // TEAM (Top-level section)
  // Internal team management
  // ---------------------------------------------
  {
    label: 'Team',
    href: '/dashboard/team',
    icon: UsersIcon,
    requiredPermission: 'canViewTeam',
    children: [
      { label: 'Directory', href: '/dashboard/team' },
      { label: 'Time Tracking', href: '/dashboard/time' },
      { label: 'Availability', href: '/dashboard/team/availability' },
      { label: 'Time Off', href: '/dashboard/team/time-off' },
    ],
  },

  // ---------------------------------------------
  // SUBCONTRACTORS (Top-level section)
  // External subcontractor management
  // ---------------------------------------------
  {
    label: 'Subcontractors',
    href: '/dashboard/subcontractors',
    icon: WrenchScrewdriverIcon,
    requiredPermission: 'canViewTeam',
    children: [
      { label: 'Directory', href: '/dashboard/subcontractors' },
      { label: 'Bids', href: '/dashboard/subcontractors/bids' },
      { label: 'Compare', href: '/dashboard/subcontractors/compare' },
    ],
  },

  // ---------------------------------------------
  // OPERATIONS (Equipment & Materials)
  // ---------------------------------------------
  { label: 'Equipment', href: '/dashboard/equipment', icon: TruckIcon },
  { label: 'Materials', href: '/dashboard/materials', icon: InboxIcon },

  // ---------------------------------------------
  // COMMUNICATION
  // Messages and document management
  // ---------------------------------------------
  { label: 'Messages', href: '/dashboard/messaging', icon: ChatBubbleLeftRightIcon },
  { label: 'Documents', href: '/dashboard/documents', icon: DocumentIcon },

  // ---------------------------------------------
  // REPORTS (Full reports for management)
  // Collapsible section with report types
  // Roles: OWNER, PM with reporting permissions
  // ---------------------------------------------
  {
    label: 'Reports',
    href: '/dashboard/reports',
    icon: ClipboardDocumentListIcon,
    requiredPermission: 'canViewProjectReports',
    children: [
      { label: 'Overview', href: '/dashboard/reports' },
      { label: 'Financial', href: '/dashboard/reports/financial' },
      { label: 'Operational', href: '/dashboard/reports/operational' },
      { label: 'Benchmarking', href: '/dashboard/reports/benchmarking' },
      { label: 'Detailed', href: '/dashboard/reports/detailed' },
      { label: 'Report Builder', href: '/dashboard/reports/builder' },
    ],
  },

  // ---------------------------------------------
  // SETTINGS & HELP (Bottom of sidebar)
  // Configuration and support resources
  // ---------------------------------------------
  { label: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, requiredPermission: 'canViewSettings' },
  {
    label: 'Help & Support',
    href: '/dashboard/help',
    icon: QuestionMarkCircleIcon,
    children: [
      { label: 'Getting Started', href: '/dashboard/help' },
      { label: 'Keyboard Shortcuts', href: '/dashboard/help/shortcuts' },
      { label: 'Contact Support', href: '/dashboard/help/contact' },
      { label: "What's New", href: '/dashboard/help/changelog' },
    ],
  },
];

// =============================================================================
// EMPLOYEE Navigation - Focused on daily field work
// =============================================================================
const employeeNavItems: NavItem[] = [
  // Project Management (their assigned work)
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'My Projects', href: '/dashboard/projects', icon: FolderIcon },
  { label: 'My Schedule', href: '/dashboard/schedule', icon: CalendarIcon },
  { label: 'Daily Logs', href: '/dashboard/logs', icon: DocumentTextIcon },

  // Time & Operations
  { label: 'Time Tracking', href: '/dashboard/time', icon: ClockIcon },

  // Communication
  { label: 'Messages', href: '/dashboard/messaging', icon: ChatBubbleLeftRightIcon },

  // Help (bottom)
  {
    label: 'Help & Support',
    href: '/dashboard/help',
    icon: QuestionMarkCircleIcon,
    children: [
      { label: 'Getting Started', href: '/dashboard/help' },
      { label: 'Keyboard Shortcuts', href: '/dashboard/help/shortcuts' },
      { label: 'Contact Support', href: '/dashboard/help/contact' },
    ],
  },
];

// =============================================================================
// CONTRACTOR Navigation - Subcontractor view with bid management
// =============================================================================
const contractorNavItems: NavItem[] = [
  // Project Management (assigned projects)
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'My Projects', href: '/dashboard/projects', icon: FolderIcon },
  { label: 'Schedule', href: '/dashboard/schedule', icon: CalendarIcon },
  { label: 'Daily Logs', href: '/dashboard/logs', icon: DocumentTextIcon },

  // Time & Operations
  { label: 'Time Tracking', href: '/dashboard/time', icon: ClockIcon },

  // Communication
  { label: 'Messages', href: '/dashboard/messaging', icon: ChatBubbleLeftRightIcon },
  { label: 'Documents', href: '/dashboard/documents', icon: DocumentIcon },

  // Help (bottom)
  {
    label: 'Help & Support',
    href: '/dashboard/help',
    icon: QuestionMarkCircleIcon,
    children: [
      { label: 'Getting Started', href: '/dashboard/help' },
      { label: 'Keyboard Shortcuts', href: '/dashboard/help/shortcuts' },
      { label: 'Contact Support', href: '/dashboard/help/contact' },
    ],
  },
];

// Simplified nav for CLIENT view - only what clients should see
const clientNavItems: NavItem[] = [
  { label: 'My Projects', href: '/dashboard', icon: FolderIcon },
  { label: 'Photos', href: '/dashboard/photos', icon: PhotoIcon },
  { label: 'Messages', href: '/dashboard/messaging', icon: ChatBubbleLeftRightIcon },
  { label: 'Documents', href: '/dashboard/documents', icon: DocumentIcon },
];

// =============================================================================
// NAVIGATION SECTIONS - Grouped navigation for better organization
// =============================================================================
// Helper function to create filtered sections based on permissions
function createOwnerPmSections(permissions: RolePermissions): NavSection[] {
  const sections: NavSection[] = [];

  // Projects & Work section - always visible
  sections.push({
    id: 'projects-work',
    title: 'Projects & Work',
    icon: FolderIcon,
    defaultOpen: true,
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { label: 'Projects', href: '/dashboard/projects', icon: FolderIcon },
      { label: 'Schedule', href: '/dashboard/schedule', icon: CalendarIcon },
      { label: 'Daily Logs', href: '/dashboard/logs', icon: DocumentTextIcon },
    ],
  });

  // Sales & Clients section - requires client permissions
  if (permissions.canViewClients) {
    sections.push({
      id: 'sales-clients',
      title: 'Sales & Clients',
      icon: UserGroupIcon,
      defaultOpen: true,
      items: [
        { label: 'Clients', href: '/dashboard/clients', icon: UserGroupIcon },
        { label: 'Estimates', href: '/dashboard/estimates', icon: CalculatorIcon },
        { label: 'E-Signatures', href: '/dashboard/signatures', icon: PencilSquareIcon },
      ],
    });
  }

  // Finance section - requires finance permissions
  // Note: Reports link removed here - use dedicated Reports section instead
  if (permissions.canViewAllFinances) {
    sections.push({
      id: 'finance',
      title: 'Finance',
      icon: BanknotesIcon,
      defaultOpen: true,
      items: [
        {
          label: 'Finance',
          href: '/dashboard/finances',
          icon: BanknotesIcon,
          children: [
            { label: 'Overview', href: '/dashboard/finances' },
            { label: 'Invoices', href: '/dashboard/invoices' },
            { label: 'AP Invoicing', href: '/dashboard/ap-invoicing' },
            { label: 'Expenses', href: '/dashboard/expenses' },
            { label: 'Payroll', href: '/dashboard/payroll' },
          ],
        },
        { label: 'Intelligence', href: '/dashboard/intelligence', icon: ChartBarSquareIcon },
      ],
    });
  }

  // Team section - separate top-level for better organization
  if (permissions.canViewTeam) {
    sections.push({
      id: 'team',
      title: 'Team',
      icon: UsersIcon,
      defaultOpen: true,
      items: [
        {
          label: 'Team',
          href: '/dashboard/team',
          icon: UsersIcon,
          children: [
            { label: 'Directory', href: '/dashboard/team' },
            { label: 'Time Tracking', href: '/dashboard/time' },
            { label: 'Availability', href: '/dashboard/team/availability' },
            { label: 'Time Off', href: '/dashboard/team/time-off' },
          ],
        },
      ],
    });
  }

  // Subcontractors section - separate top-level for better organization
  if (permissions.canViewTeam) {
    sections.push({
      id: 'subcontractors',
      title: 'Subcontractors',
      icon: WrenchScrewdriverIcon,
      defaultOpen: true,
      items: [
        {
          label: 'Subcontractors',
          href: '/dashboard/subcontractors',
          icon: WrenchScrewdriverIcon,
          children: [
            { label: 'Directory', href: '/dashboard/subcontractors' },
            { label: 'Bids', href: '/dashboard/subcontractors/bids' },
            { label: 'Compare', href: '/dashboard/subcontractors/compare' },
          ],
        },
      ],
    });
  }

  // Operations section - Equipment and Materials
  sections.push({
    id: 'operations',
    title: 'Operations',
    icon: TruckIcon,
    defaultOpen: true,
    items: [
      { label: 'Equipment', href: '/dashboard/equipment', icon: TruckIcon },
      { label: 'Materials', href: '/dashboard/materials', icon: InboxIcon },
    ],
  });

  // Documents & Communication section
  const docsItems: NavItem[] = [
    { label: 'Messages', href: '/dashboard/messaging', icon: ChatBubbleLeftRightIcon },
    { label: 'Documents', href: '/dashboard/documents', icon: DocumentIcon },
  ];

  sections.push({
    id: 'documents',
    title: 'Documents',
    icon: DocumentIcon,
    defaultOpen: true,
    items: docsItems,
  });

  // Reports section - requires report permissions
  if (permissions.canViewProjectReports) {
    sections.push({
      id: 'reports',
      title: 'Reports',
      icon: ClipboardDocumentListIcon,
      defaultOpen: false,
      items: [
        {
          label: 'Reports',
          href: '/dashboard/reports',
          icon: ClipboardDocumentListIcon,
          children: [
            { label: 'Overview', href: '/dashboard/reports' },
            { label: 'Financial', href: '/dashboard/reports/financial' },
            { label: 'Operational', href: '/dashboard/reports/operational' },
            { label: 'Benchmarking', href: '/dashboard/reports/benchmarking' },
            { label: 'Detailed', href: '/dashboard/reports/detailed' },
            { label: 'Report Builder', href: '/dashboard/reports/builder' },
          ],
        },
      ],
    });
  }

  // Settings & Help section - always at the bottom
  const settingsItems: NavItem[] = [];
  if (permissions.canViewSettings) {
    settingsItems.push({ label: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon });
  }
  settingsItems.push({
    label: 'Help & Support',
    href: '/dashboard/help',
    icon: QuestionMarkCircleIcon,
    children: [
      { label: 'Getting Started', href: '/dashboard/help' },
      { label: 'Keyboard Shortcuts', href: '/dashboard/help/shortcuts' },
      { label: 'Contact Support', href: '/dashboard/help/contact' },
      { label: "What's New", href: '/dashboard/help/changelog' },
    ],
  });

  sections.push({
    id: 'settings-help',
    title: 'Settings & Help',
    icon: Cog6ToothIcon,
    defaultOpen: false,
    items: settingsItems,
  });

  return sections;
}

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

    // Employee view gets focused navigation
    if (currentRole === 'employee') {
      return employeeNavItems;
    }

    // Contractor view gets contractor-specific navigation
    if (currentRole === 'contractor') {
      return contractorNavItems;
    }

    // Owner/PM roles get full management access, filtered by permissions
    return ownerPmNavItems.filter((item) => {
      // Always show items without permission requirements
      if (!item.requiredPermission) return true;
      // Check if user has the required permission
      return permissions[item.requiredPermission];
    });
  }, [permissions, currentRole]);

  // Get nav sections for Owner/PM roles (collapsible sections on desktop)
  const navSections = useMemo(() => {
    // Only Owner/PM roles get sectioned navigation
    if (currentRole === 'client' || currentRole === 'employee' || currentRole === 'contractor') {
      return undefined; // Use flat navItems for these roles
    }
    return createOwnerPmSections(permissions);
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
          navSections={navSections}
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
    <AuthGuard allowedRoles={['OWNER', 'PM', 'EMPLOYEE', 'CONTRACTOR']}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthGuard>
  );
}
