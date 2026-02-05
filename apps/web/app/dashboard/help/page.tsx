'use client';

import React, { useState } from 'react';
import {
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EnvelopeIcon,
  BookOpenIcon,
  LightBulbIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I create a new project?',
    answer: 'Go to the Projects page and click the "New Project" button in the top right. Fill in the project details including name, client, address, and budget, then click Create.',
  },
  {
    question: 'How do I track time for a project?',
    answer: 'Navigate to Time Tracking from the sidebar. Click "Clock In" to start tracking, select your project and task, then click "Clock Out" when finished. You can also add manual time entries.',
  },
  {
    question: 'How do I create and send an invoice?',
    answer: 'Go to Invoices, click "New Invoice", select the project and client, add line items, then click Send. You can also save as draft and send later.',
  },
  {
    question: 'How do I manage team permissions?',
    answer: 'Go to Settings > Team. Each team member has a role (Owner, PM, Foreman, Employee) that determines their access level. You can also customize individual permissions.',
  },
  {
    question: 'How does the offline mode work?',
    answer: 'ContractorOS automatically saves your work locally when offline. When you reconnect, changes sync automatically. Look for the sync indicator in the corner to see sync status.',
  },
  {
    question: 'How do I use the AI Assistant?',
    answer: 'Click the floating chat button in the bottom right corner. You can ask questions about your projects, get help with tasks, or analyze documents.',
  },
];

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Open global search' },
  { keys: ['⌘', 'N'], description: 'Create new item (context-aware)' },
  { keys: ['Esc'], description: 'Close modals and panels' },
  { keys: ['⌘', '/'], description: 'Open keyboard shortcuts' },
];

export default function HelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Help & Support"
        description="Get help with ContractorOS features and find answers to common questions"
      />

      {/* Quick Start Guide */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <LightBulbIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick Start Guide</h2>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="font-medium text-blue-600">1.</span>
                Create your first project from the Projects page
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-blue-600">2.</span>
                Add team members in Settings to collaborate
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-blue-600">3.</span>
                Create estimates and convert them to projects
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-blue-600">4.</span>
                Track time and generate invoices for completed work
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-blue-600">5.</span>
                Use the AI Assistant for help with any task
              </li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <CommandLineIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* FAQ */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                {openFAQ === index ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFAQ === index && (
                <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Contact Support */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Need More Help?</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="mailto:support@contractoros.com"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <EnvelopeIcon className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Email Support</p>
              <p className="text-sm text-gray-500">support@contractoros.com</p>
            </div>
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // Open AI assistant
              const trigger = document.querySelector('[aria-label="Open AI Assistant"]') as HTMLButtonElement;
              trigger?.click();
            }}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <BookOpenIcon className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">AI Assistant</p>
              <p className="text-sm text-gray-500">Get instant answers</p>
            </div>
          </a>
        </div>
      </Card>
    </div>
  );
}
