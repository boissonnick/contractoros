"use client";

import React, { useEffect, useState } from 'react';
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
} from '@heroicons/react/24/outline';

const TABS = [
  { key: '', label: 'Overview', icon: Squares2X2Icon },
  { key: '/tasks', label: 'Tasks', icon: RectangleStackIcon },
  { key: '/scope', label: 'Scope', icon: ClipboardDocumentListIcon },
  { key: '/subs', label: 'Subs', icon: UserGroupIcon },
  { key: '/change-orders', label: 'COs', icon: DocumentDuplicateIcon },
  { key: '/rfis', label: 'RFIs', icon: ExclamationTriangleIcon },
  { key: '/submittals', label: 'Submittals', icon: DocumentCheckIcon },
  { key: '/punch-list', label: 'Punch', icon: CheckBadgeIcon },
  { key: '/quote', label: 'Quote', icon: DocumentTextIcon },
  { key: '/activity', label: 'Activity', icon: NewspaperIcon },
  { key: '/preferences', label: 'Preferences', icon: UserGroupIcon },
  { key: '/logs', label: 'Logs', icon: ClipboardDocumentListIcon },
  { key: '/photos', label: 'Photos', icon: PhotoIcon },
  { key: '/finances', label: 'Finances', icon: CurrencyDollarIcon },
  { key: '/messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
];

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

  const activeTab = TABS.find(t => {
    if (t.key === '') return pathname === basePath;
    return pathname.startsWith(basePath + t.key);
  })?.key ?? '';

  return (
    <div className="space-y-0">
      {/* Compact header */}
      <div className="flex items-center gap-3 mb-1">
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

      {/* Tab bar */}
      <div className="border-b border-gray-200 -mx-6 px-6 mb-6">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide" aria-label="Project tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
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
        </nav>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
