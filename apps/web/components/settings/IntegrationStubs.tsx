"use client";

import React from 'react';
import Link from 'next/link';

/**
 * Integration stubs for the Payroll Settings page.
 * Shows available and planned payroll/HR integrations.
 *
 * Note: QuickBooks is now available via Settings > Integrations.
 * This component shows payroll-specific integrations (Gusto, ADP).
 */
const INTEGRATIONS = [
  {
    name: 'Gusto',
    description: 'Sync employee data, timesheets, and payroll with Gusto.',
    logo: '\u{1F4B0}',
    status: 'Planned',
    statusColor: 'bg-blue-100 text-blue-600',
  },
  {
    name: 'ADP',
    description: 'Integrate with ADP for enterprise payroll processing.',
    logo: '\u{1F3E2}',
    status: 'Planned',
    statusColor: 'bg-blue-100 text-blue-600',
  },
];

export default function IntegrationStubs() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {INTEGRATIONS.map(integration => (
          <div key={integration.name} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{integration.logo}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                  <span className={`text-[10px] ${integration.statusColor} px-2 py-0.5 rounded-full font-medium`}>{integration.status}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{integration.description}</p>
                <button disabled className="mt-3 text-sm text-blue-600 opacity-50 cursor-not-allowed">
                  Connect &rarr;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Looking for accounting integrations?{' '}
        <Link href="/dashboard/settings/integrations" className="text-blue-600 hover:underline">
          View all integrations
        </Link>
        {' '}including QuickBooks Online.
      </p>
    </div>
  );
}
