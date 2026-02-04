"use client";

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import {
  DocumentTextIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  RectangleStackIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import Skeleton from '@/components/ui/Skeleton';

// Loading skeleton for template tabs
function TabLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Dynamic imports for heavy template tab components
const QuoteTemplatesTab = dynamic(
  () => import('@/components/settings/templates/QuoteTemplatesTab').then(mod => ({ default: mod.QuoteTemplatesTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const SowTemplatesTab = dynamic(
  () => import('@/components/settings/templates/SowTemplatesTab').then(mod => ({ default: mod.SowTemplatesTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const EmailTemplatesTab = dynamic(
  () => import('@/components/settings/templates/EmailTemplatesTab').then(mod => ({ default: mod.EmailTemplatesTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const SmsTemplatesTab = dynamic(
  () => import('@/components/settings/templates/SmsTemplatesTab').then(mod => ({ default: mod.SmsTemplatesTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const LineItemsTab = dynamic(
  () => import('@/components/settings/templates/LineItemsTab').then(mod => ({ default: mod.LineItemsTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const PhaseTemplatesTab = dynamic(
  () => import('@/components/settings/templates/PhaseTemplatesTab').then(mod => ({ default: mod.PhaseTemplatesTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

type TabType = 'quotes' | 'sow' | 'email' | 'sms' | 'line-items' | 'phases';

const TABS: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'quotes', label: 'Quote PDF', icon: DocumentTextIcon },
  { id: 'sow', label: 'SOW', icon: RectangleStackIcon },
  { id: 'phases', label: 'Phases', icon: ListBulletIcon },
  { id: 'email', label: 'Email', icon: EnvelopeIcon },
  { id: 'sms', label: 'SMS', icon: ChatBubbleLeftRightIcon },
  { id: 'line-items', label: 'Line Items', icon: Squares2X2Icon },
];

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('quotes');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px" aria-label="Template tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content - Dynamically loaded */}
      <Suspense fallback={<TabLoadingSkeleton />}>
        <div>
          {activeTab === 'quotes' && <QuoteTemplatesTab />}
          {activeTab === 'sow' && <SowTemplatesTab />}
          {activeTab === 'phases' && <PhaseTemplatesTab />}
          {activeTab === 'email' && <EmailTemplatesTab />}
          {activeTab === 'sms' && <SmsTemplatesTab />}
          {activeTab === 'line-items' && <LineItemsTab />}
        </div>
      </Suspense>
    </div>
  );
}
