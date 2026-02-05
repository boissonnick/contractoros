"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  ChartBarSquareIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import CompanyOverviewDashboard from '@/components/intelligence/CompanyOverviewDashboard';
import ProjectProfitabilityLeaderboard from '@/components/intelligence/ProjectProfitabilityLeaderboard';
import CashFlowRunwayDashboard from '@/components/intelligence/CashFlowRunwayDashboard';

type Tab = 'overview' | 'profitability' | 'cashflow';

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'The Pulse', icon: ChartBarSquareIcon },
  { id: 'profitability', label: 'Project Profitability', icon: CurrencyDollarIcon },
  { id: 'cashflow', label: 'Cash Flow & AR', icon: BanknotesIcon },
];

export default function IntelligencePage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const isAdmin = profile?.role === 'OWNER' || profile?.role === 'PM';

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <ChartBarSquareIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-500">
            Financial intelligence dashboards are available to Owners and Project
            Managers only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Financial Intelligence
        </h1>
        <p className="text-gray-500 mt-1">
          Executive overview, project profitability, and cash flow analysis
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
      {activeTab === 'overview' && <CompanyOverviewDashboard />}
      {activeTab === 'profitability' && <ProjectProfitabilityLeaderboard />}
      {activeTab === 'cashflow' && <CashFlowRunwayDashboard />}
    </div>
  );
}
