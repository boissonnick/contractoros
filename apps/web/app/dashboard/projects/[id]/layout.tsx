"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  UserGroupIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  Squares2X2Icon,
  RectangleStackIcon,
  DocumentDuplicateIcon,
  NewspaperIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

// Tab structure with groups for better organization
// Groups: Core (always visible), Docs (dropdown), Activity (dropdown)
type TabItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type TabGroup = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: TabItem[];
};

// Primary tabs - always visible
const PRIMARY_TABS: TabItem[] = [
  { key: '', label: 'Overview', icon: Squares2X2Icon },
  { key: '/scope', label: 'Scope', icon: ClipboardDocumentListIcon },
  { key: '/quote', label: 'Quote', icon: DocumentTextIcon },
  { key: '/finances', label: 'Finances', icon: CurrencyDollarIcon },
  { key: '/tasks', label: 'Tasks', icon: RectangleStackIcon },
  { key: '/subs', label: 'Subs', icon: UserGroupIcon },
];

// Grouped tabs - shown in dropdowns
const TAB_GROUPS: TabGroup[] = [
  {
    label: 'Docs',
    icon: DocumentDuplicateIcon,
    items: [
      { key: '/change-orders', label: 'Change Orders', icon: DocumentDuplicateIcon },
      { key: '/rfis', label: 'RFIs', icon: ExclamationTriangleIcon },
      { key: '/submittals', label: 'Submittals', icon: DocumentCheckIcon },
      { key: '/punch-list', label: 'Punch List', icon: CheckBadgeIcon },
    ],
  },
  {
    label: 'Activity',
    icon: NewspaperIcon,
    items: [
      { key: '/activity', label: 'Activity Feed', icon: NewspaperIcon },
      { key: '/logs', label: 'Daily Logs', icon: ClipboardDocumentListIcon },
      { key: '/messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
      { key: '/photos', label: 'Photos', icon: PhotoIcon },
    ],
  },
];

// Settings tab - always at end
const SETTINGS_TAB: TabItem = { key: '/preferences', label: 'Settings', icon: Cog6ToothIcon };

// Combine all for matching
const ALL_TABS = [
  ...PRIMARY_TABS,
  ...TAB_GROUPS.flatMap(g => g.items),
  SETTINGS_TAB,
];

// Dropdown component for grouped tabs
function TabDropdown({
  group,
  basePath,
  activeTabKey,
}: {
  group: TabGroup;
  basePath: string;
  activeTabKey: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Check if any item in this group is active
  const hasActiveItem = group.items.some(item => activeTabKey === item.key);
  const activeItem = group.items.find(item => activeTabKey === item.key);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const Icon = group.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
          hasActiveItem
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        )}
      >
        <Icon className="h-4 w-4" />
        {hasActiveItem ? activeItem?.label : group.label}
        <ChevronDownIcon className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[180px]">
          {group.items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = activeTabKey === item.key;
            return (
              <Link
                key={item.key}
                href={basePath + item.key}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <ItemIcon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const projectId = params.id as string;
  const basePath = `/dashboard/projects/${projectId}`;

  const [projectName, setProjectName] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');

  useEffect(() => {
    async function fetchName() {
      try {
        const snap = await getDoc(doc(db, 'projects', projectId));
        if (snap.exists()) {
          setProjectName(snap.data().name || '');
          setProjectDescription(snap.data().description || '');
        }
      } catch (e) {
        console.error('Error fetching project name:', e);
      }
    }
    fetchName();
  }, [projectId]);

  // Find active tab from all tabs
  const activeTabKey = ALL_TABS.find(t => {
    if (t.key === '') return pathname === basePath;
    return pathname.startsWith(basePath + t.key);
  })?.key ?? '';

  return (
    <div className="space-y-0">
      {/* Compact header with breathing room from main nav */}
      <div className="flex items-center gap-3 pt-2 mb-3">
        <button
          onClick={() => router.push('/dashboard/projects')}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 text-gray-500" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {projectName || 'Project'}
          </h1>
          {projectDescription && (
            <p className="text-sm text-gray-500 truncate">{projectDescription}</p>
          )}
        </div>
      </div>

      {/* Tab bar - Consolidated navigation */}
      <div className="border-b border-gray-200 -mx-6 px-6 mb-6">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide" aria-label="Project tabs">
          {/* Primary tabs - always visible */}
          {PRIMARY_TABS.map((tab) => {
            const isActive = activeTabKey === tab.key;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.key}
                href={basePath + tab.key}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}

          {/* Grouped tabs - dropdowns */}
          {TAB_GROUPS.map((group) => (
            <TabDropdown
              key={group.label}
              group={group}
              basePath={basePath}
              activeTabKey={activeTabKey}
            />
          ))}

          {/* Settings tab - always at end */}
          <Link
            href={basePath + SETTINGS_TAB.key}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              activeTabKey === SETTINGS_TAB.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <SETTINGS_TAB.icon className="h-4 w-4" />
            {SETTINGS_TAB.label}
          </Link>
        </nav>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
