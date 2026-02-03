'use client';

import React from 'react';
import { CommandLineIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Link from 'next/link';

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { keys: ['⌘', 'K'], description: 'Open global search' },
      { keys: ['⌘', '/'], description: 'Open keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close modals and panels' },
    ]
  },
  {
    category: 'Actions',
    items: [
      { keys: ['⌘', 'N'], description: 'Create new item (context-aware)' },
      { keys: ['⌘', 'S'], description: 'Save current form' },
      { keys: ['⌘', 'Enter'], description: 'Submit form' },
    ]
  },
  {
    category: 'Time Tracking',
    items: [
      { keys: ['⌘', 'T'], description: 'Toggle timer' },
      { keys: ['⌘', 'Shift', 'T'], description: 'Quick time entry' },
    ]
  },
  {
    category: 'Lists & Tables',
    items: [
      { keys: ['↑', '↓'], description: 'Navigate items' },
      { keys: ['Enter'], description: 'Open selected item' },
      { keys: ['⌘', 'A'], description: 'Select all items' },
    ]
  },
];

export default function ShortcutsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Keyboard Shortcuts"
        description="Speed up your workflow with these keyboard shortcuts"
        breadcrumbs={[
          { label: 'Help & Support', href: '/dashboard/help' },
          { label: 'Keyboard Shortcuts' },
        ]}
      />

      <div className="space-y-6">
        {shortcuts.map((section) => (
          <Card key={section.category} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CommandLineIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">{section.category}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.items.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded shadow-sm"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
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
