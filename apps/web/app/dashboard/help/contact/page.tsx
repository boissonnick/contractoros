'use client';

import React, { useState } from 'react';
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Link from 'next/link';

export default function ContactSupportPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send to a support system
    setFormSubmitted(true);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Contact Support"
        description="Get in touch with our support team"
        breadcrumbs={[
          { label: 'Help & Support', href: '/dashboard/help' },
          { label: 'Contact Support' },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Options */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Contact Options</h2>
            <div className="space-y-4">
              <a
                href="mailto:support@contractoros.com"
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-brand-300 hover:bg-brand-50 transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email Support</p>
                  <p className="text-sm text-gray-500">support@contractoros.com</p>
                </div>
              </a>

              <button
                onClick={() => {
                  const trigger = document.querySelector('[aria-label="Open AI Assistant"]') as HTMLButtonElement;
                  trigger?.click();
                }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">AI Assistant</p>
                  <p className="text-sm text-gray-500">Get instant answers 24/7</p>
                </div>
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">Support Hours</h2>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span className="font-medium">8:00 AM - 6:00 PM PST</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span className="font-medium">9:00 AM - 2:00 PM PST</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span className="text-gray-400">Closed</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              For urgent issues outside business hours, use the AI Assistant for immediate help.
            </p>
          </Card>
        </div>

        {/* Support Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Send a Message</h2>

          {formSubmitted ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Message Sent!</h3>
              <p className="text-sm text-gray-600 mb-4">
                We&apos;ll get back to you within 24 hours.
              </p>
              <button
                onClick={() => {
                  setFormSubmitted(false);
                  setFormData({ subject: '', category: 'general', message: '' });
                }}
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                >
                  <option value="general">General Question</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="billing">Billing</option>
                  <option value="account">Account Issue</option>
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  placeholder="Please describe your question or issue in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-900 transition-colors"
              >
                Send Message
              </button>
            </form>
          )}
        </Card>
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
