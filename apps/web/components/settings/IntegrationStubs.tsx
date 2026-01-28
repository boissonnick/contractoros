"use client";

import React from 'react';

const INTEGRATIONS = [
  {
    name: 'Gusto',
    description: 'Sync employee data, timesheets, and payroll with Gusto.',
    logo: '\u{1F4B0}',
    status: 'Coming Soon',
  },
  {
    name: 'QuickBooks',
    description: 'Export invoices, expenses, and payroll data to QuickBooks.',
    logo: '\u{1F4CA}',
    status: 'Coming Soon',
  },
  {
    name: 'ADP',
    description: 'Integrate with ADP for enterprise payroll processing.',
    logo: '\u{1F3E2}',
    status: 'Planned',
  },
  {
    name: 'Stripe',
    description: 'Process client payments and manage billing.',
    logo: '\u{1F4B3}',
    status: 'Planned',
  },
];

export default function IntegrationStubs() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {INTEGRATIONS.map(integration => (
        <div key={integration.name} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{integration.logo}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{integration.status}</span>
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
  );
}
