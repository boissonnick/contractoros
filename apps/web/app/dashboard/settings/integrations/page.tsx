"use client";

import React from 'react';
import Link from 'next/link';
import { Card, Badge, Button } from '@/components/ui';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  QuickBooksLogo,
  XeroLogo,
  StripeLogo,
  GustoLogo,
  ADPLogo,
} from '@/components/integrations';

interface IntegrationCardProps {
  name: string;
  description: string;
  category: string;
  logo: React.ReactNode;
  comingSoon?: boolean;
  href?: string;
  isConnected?: boolean;
}

function IntegrationCard({
  name,
  description,
  category,
  logo,
  comingSoon = true,
  href,
  isConnected = false,
}: IntegrationCardProps) {
  const content = (
    <Card className={`p-5 transition-shadow ${href ? 'hover:shadow-md cursor-pointer' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100">
          {logo}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{name}</h3>
            {comingSoon ? (
              <Badge className="bg-gray-100 text-gray-500 text-xs">Coming Soon</Badge>
            ) : isConnected ? (
              <Badge className="bg-green-100 text-green-700 text-xs">Connected</Badge>
            ) : (
              <Badge className="bg-blue-100 text-blue-700 text-xs">Available</Badge>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-2">{category}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        {href && (
          <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </div>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default function IntegrationsPage() {
  const accountingIntegrations = [
    {
      name: 'QuickBooks Online',
      description: 'Two-way sync invoices, expenses, and payments with QuickBooks Online.',
      category: 'Accounting',
      logo: <QuickBooksLogo width={100} height={28} />,
      comingSoon: false,
      href: '/dashboard/settings/integrations/quickbooks',
    },
    {
      name: 'Xero',
      description: 'Sync financial data with Xero for seamless accounting.',
      category: 'Accounting',
      logo: <XeroLogo width={60} height={24} />,
      comingSoon: true,
    },
  ];

  const paymentIntegrations = [
    {
      name: 'Stripe',
      description: 'Accept online payments from clients via credit card, ACH, and more.',
      category: 'Payments',
      logo: <StripeLogo width={50} height={22} />,
    },
  ];

  const payrollIntegrations = [
    {
      name: 'Gusto',
      description: 'Sync timesheets and manage payroll for your team.',
      category: 'Payroll & HR',
      logo: <GustoLogo width={70} height={24} />,
    },
    {
      name: 'ADP',
      description: 'Enterprise payroll integration for larger teams.',
      category: 'Payroll & HR',
      logo: <ADPLogo width={50} height={24} />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Integrations</h2>
        <p className="text-sm text-gray-500">
          Connect ContractorOS with your favorite tools to streamline your workflow.
        </p>
      </div>

      {/* Accounting Section */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Accounting
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accountingIntegrations.map((integration) => (
            <IntegrationCard key={integration.name} {...integration} />
          ))}
        </div>
      </section>

      {/* Payments Section */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Payments
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {paymentIntegrations.map((integration) => (
            <IntegrationCard key={integration.name} {...integration} />
          ))}
        </div>
      </section>

      {/* Payroll & HR Section */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Payroll & HR
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {payrollIntegrations.map((integration) => (
            <IntegrationCard key={integration.name} {...integration} />
          ))}
        </div>
      </section>

      {/* Coming Soon Note */}
      <Card className="p-4 bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">Integrations Coming Soon</h4>
            <p className="text-sm text-blue-700 mt-1">
              We&apos;re actively building these integrations. Have a specific integration request?{' '}
              <a href="mailto:support@contractoros.com" className="underline hover:text-blue-800">
                Let us know
              </a>
              .
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
