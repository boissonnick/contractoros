"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { useIntegrationWaitlist } from '@/lib/hooks/useIntegrationWaitlist';
import { StripeLogo } from '@/components/integrations';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const BENEFITS = [
  {
    icon: CreditCardIcon,
    title: 'Accept Online Payments',
    description: 'Let clients pay invoices with credit cards, debit cards, and ACH transfers.',
  },
  {
    icon: ArrowPathIcon,
    title: 'Automatic Reconciliation',
    description: 'Payments sync automatically with your invoices and accounting.',
  },
  {
    icon: DocumentTextIcon,
    title: 'Invoice Payment Links',
    description: 'Send invoices with embedded payment links for faster collections.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'PCI Compliant',
    description: 'Enterprise-grade security for all payment processing.',
  },
  {
    icon: BanknotesIcon,
    title: 'Multiple Payment Methods',
    description: 'Support credit cards, ACH bank transfers, and Apple Pay.',
  },
  {
    icon: ChartBarIcon,
    title: 'Payment Analytics',
    description: 'Track payment trends, outstanding balances, and cash flow.',
  },
];

export default function StripeIntegrationPage() {
  const router = useRouter();
  const { signup, loading, success, error, reset } = useIntegrationWaitlist();

  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    monthlyVolume: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signup({
        email: formData.email,
        companyName: formData.companyName,
        integrationType: 'stripe',
        monthlyVolume: formData.monthlyVolume,
        notes: formData.notes,
      });
    } catch {
      // Error is handled by the hook
    }
  };

  const handleReset = () => {
    reset();
    setFormData({ email: '', companyName: '', monthlyVolume: '', notes: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header with back navigation */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={() => router.push('/dashboard/settings/integrations')}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
            <StripeLogo width={50} height={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">Stripe Payments</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Coming Soon
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-500">Online payment processing</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Benefits Section */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              What you will get with Stripe integration
            </h2>
            <div className="space-y-4">
              {BENEFITS.map((benefit, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{benefit.title}</h3>
                    <p className="text-sm text-gray-500">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Timeline Card */}
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <ClockIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Expected Availability</h3>
                <p className="text-sm text-gray-600 mt-1">
                  We are actively building the Stripe integration. Expected launch: <strong>Q2 2026</strong>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Join the waitlist to be notified when it is ready and get early access.
                </p>
              </div>
            </div>
          </Card>

          {/* Fee Info Card */}
          <Card className="p-6 bg-gray-50 border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Processing Fees</h3>
            <p className="text-sm text-gray-600">
              Stripe processing fees apply (typically 2.9% + $0.30 for cards, 0.8% for ACH with a $5 cap).
              No additional ContractorOS fees for payment processing.
            </p>
          </Card>
        </div>

        {/* Waitlist Form Section */}
        <div>
          <Card className="p-6">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  You are on the list!
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  We will notify you at <strong>{formData.email}</strong> when Stripe payments are ready.
                </p>
                <Button variant="outline" onClick={handleReset}>
                  Sign up another company
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Join the Waitlist
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Be the first to accept online payments. Get early access and priority support.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Acme Construction"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="monthlyVolume" className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Monthly Invoice Volume
                    </label>
                    <select
                      id="monthlyVolume"
                      value={formData.monthlyVolume}
                      onChange={(e) => setFormData({ ...formData, monthlyVolume: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                    >
                      <option value="">Select range</option>
                      <option value="under-10k">Under $10,000</option>
                      <option value="10k-50k">$10,000 - $50,000</option>
                      <option value="50k-100k">$50,000 - $100,000</option>
                      <option value="100k-500k">$100,000 - $500,000</option>
                      <option value="over-500k">Over $500,000</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Anything else we should know?
                    </label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Tell us about your payment needs or specific requirements..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Joining...' : 'Join Waitlist'}
                  </Button>

                  <p className="text-xs text-gray-400 text-center">
                    We will only use your email to notify you about Stripe payments.
                  </p>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
