'use client';

import React from 'react';
import {
  SparklesIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Link from 'next/link';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  type: 'feature' | 'improvement' | 'fix' | 'security';
  changes: string[];
}

const changelog: ChangelogEntry[] = [
  {
    version: '2.5.0',
    date: 'February 2026',
    title: 'Help & Support System',
    type: 'feature',
    changes: [
      'Added comprehensive Help & Support section in sidebar',
      'New keyboard shortcuts reference page',
      'Contact support form with category selection',
      'Changelog page to track updates',
    ],
  },
  {
    version: '2.4.0',
    date: 'January 2026',
    title: 'AI Assistant Enhancements',
    type: 'feature',
    changes: [
      'Voice input support for hands-free operation',
      'Context-aware suggestions based on current page',
      'Document analysis capabilities',
      'Project insights and recommendations',
    ],
  },
  {
    version: '2.3.0',
    date: 'January 2026',
    title: 'Offline Mode Improvements',
    type: 'improvement',
    changes: [
      'Enhanced offline data persistence',
      'Automatic sync when connection restored',
      'Visual sync status indicator',
      'Conflict resolution for simultaneous edits',
    ],
  },
  {
    version: '2.2.0',
    date: 'December 2025',
    title: 'Subcontractor Management',
    type: 'feature',
    changes: [
      'Subcontractor directory with contact management',
      'Bid comparison tools',
      'Performance tracking and ratings',
      'Insurance and certification tracking',
    ],
  },
  {
    version: '2.1.0',
    date: 'December 2025',
    title: 'Security Updates',
    type: 'security',
    changes: [
      'Enhanced role-based access controls',
      'Improved session management',
      'Audit logging for sensitive operations',
      'Two-factor authentication support',
    ],
  },
  {
    version: '2.0.0',
    date: 'November 2025',
    title: 'Major Platform Update',
    type: 'feature',
    changes: [
      'Complete UI redesign with modern components',
      'New mobile-optimized experience',
      'Global search across all modules',
      'Real-time collaboration features',
    ],
  },
];

const typeConfig = {
  feature: { icon: SparklesIcon, color: 'text-purple-600', bg: 'bg-purple-100', label: 'New Feature' },
  improvement: { icon: RocketLaunchIcon, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Improvement' },
  fix: { icon: WrenchScrewdriverIcon, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Bug Fix' },
  security: { icon: ShieldCheckIcon, color: 'text-green-600', bg: 'bg-green-100', label: 'Security' },
};

export default function ChangelogPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="What's New"
        description="Stay up to date with the latest ContractorOS features and improvements"
        breadcrumbs={[
          { label: 'Help & Support', href: '/dashboard/help' },
          { label: "What's New" },
        ]}
      />

      <div className="space-y-6">
        {changelog.map((entry) => {
          const config = typeConfig[entry.type];
          const Icon = config.icon;

          return (
            <Card key={entry.version} className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">{entry.title}</h2>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                    <span>Version {entry.version}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{entry.date}</span>
                  </div>
                  <ul className="space-y-2">
                    {entry.changes.map((change, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="pt-4">
        <Link
          href="/dashboard/help"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Help & Support
        </Link>
      </div>
    </div>
  );
}
