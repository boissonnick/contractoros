"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  DocumentTextIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import {
  SowTemplatesTab,
  QuoteTemplatesTab,
  EmailTemplatesTab,
  SmsTemplatesTab,
  LineItemsTab,
} from '@/components/settings/templates';

type TabType = 'quotes' | 'sow' | 'email' | 'sms' | 'line-items';

const TABS: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'quotes', label: 'Quote PDF', icon: DocumentTextIcon },
  { id: 'sow', label: 'SOW', icon: RectangleStackIcon },
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

      {/* Tab Content */}
      <div>
        {activeTab === 'quotes' && <QuoteTemplatesTab />}
        {activeTab === 'sow' && <SowTemplatesTab />}
        {activeTab === 'email' && <EmailTemplatesTab />}
        {activeTab === 'sms' && <SmsTemplatesTab />}
        {activeTab === 'line-items' && <LineItemsTab />}
      </div>
    </div>
  );
}
