'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useDashboardReports, useFinancialReports } from '@/lib/hooks/useReports';
import { PageHeader } from '@/components/ui';
import { ReportCard } from '@/components/reports/ReportCard';
import { RevenueChart } from '@/components/reports/RevenueChart';
import { DateRangePicker } from '@/components/reports/DateRangePicker';
import {
  DateRange,
  getDateRangeFromPreset,
} from '@/lib/reports/types';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  FolderIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const orgId = profile?.orgId;

  // Date range state - default to this month
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getDateRangeFromPreset('this_month')
  );

  // Fetch dashboard data using existing hook
  const {
    loading: dashboardLoading,
    error: dashboardError,
    kpis,
    revenueByMonth,
    projectStatusDistribution,
    teamPerformance,
  } = useDashboardReports(orgId);

  // Fetch financial data for profitability
  const {
    loading: financialLoading,
    summary: financialSummary,
    projectProfitability,
  } = useFinancialReports(orgId);

  const loading = dashboardLoading || financialLoading;

  // Transform revenue data for chart
  const revenueChartData = useMemo(() => {
    if (!revenueByMonth?.length) return [];
    return revenueByMonth.map((item) => ({
      label: item.name,
      revenue: item.revenue,
      paid: item.revenue, // All revenue is paid in this dataset
      pending: 0,
    }));
  }, [revenueByMonth]);

  // Get mini chart data for cards
  const revenueChartMini = useMemo(() => {
    return revenueByMonth?.map((item) => item.revenue) || [];
  }, [revenueByMonth]);

  const profitChartMini = useMemo(() => {
    return revenueByMonth?.map((item) => item.profit) || [];
  }, [revenueByMonth]);

  const hoursChartMini = useMemo(() => {
    return teamPerformance?.map((item) => item.hoursLogged) || [];
  }, [teamPerformance]);

  const projectsChartMini = useMemo(() => {
    return projectStatusDistribution?.map((item) => item.value) || [];
  }, [projectStatusDistribution]);

  // Error state
  if (!orgId) {
    return (
      <div className="p-8 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Not authenticated</h3>
        <p className="text-gray-500 mt-1">Please log in to view reports.</p>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="p-8 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Failed to load reports</h3>
        <p className="text-gray-500 mt-1">{dashboardError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Business insights and analytics"
        actions={
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        }
      />

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <ReportCard
          title="Revenue"
          value={kpis ? formatCurrency(kpis.totalRevenue) : '$0'}
          subtitle={kpis ? `${formatPercent(kpis.profitMargin)} margin` : 'No data'}
          chartData={revenueChartMini}
          icon={CurrencyDollarIcon}
          iconColor="green"
          loading={loading}
        />

        {/* Profitability Card */}
        <ReportCard
          title="Profitability"
          value={financialSummary ? formatPercent(financialSummary.profitMargin) : '0%'}
          subtitle={financialSummary ? `${formatCurrency(financialSummary.grossProfit)} profit` : 'No data'}
          chartData={profitChartMini}
          icon={ChartBarIcon}
          iconColor={
            financialSummary && financialSummary.profitMargin >= 20
              ? 'green'
              : financialSummary && financialSummary.profitMargin >= 10
              ? 'amber'
              : 'red'
          }
          loading={loading}
        />

        {/* Hours Card */}
        <ReportCard
          title="Hours Logged"
          value={kpis ? `${Math.round(kpis.hoursLoggedThisMonth)} hrs` : '0 hrs'}
          subtitle={kpis ? `${kpis.activeTeamMembers} team members` : 'No data'}
          chartData={hoursChartMini}
          icon={ClockIcon}
          iconColor="purple"
          loading={loading}
        />

        {/* Projects Card */}
        <ReportCard
          title="Projects"
          value={kpis?.activeProjects ?? 0}
          subtitle={kpis ? `${kpis.completedProjects} completed` : 'No data'}
          chartData={projectsChartMini}
          icon={FolderIcon}
          iconColor="blue"
          loading={loading}
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart
        data={revenueChartData}
        title="Revenue by Month"
        showBreakdown={false}
        height={350}
      />

      {/* Profitability Table */}
      {projectProfitability && projectProfitability.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Project Profitability
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Spend
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projectProfitability.slice(0, 10).map((project, idx) => {
                  const marginPercent = project.budget > 0
                    ? (project.variance / project.budget) * 100
                    : 0;
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {project.projectName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {formatCurrency(project.budget)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {formatCurrency(project.actualSpend)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span
                          className={
                            project.variance >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {formatCurrency(project.variance)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            marginPercent >= 20
                              ? 'bg-green-100 text-green-800'
                              : marginPercent >= 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {marginPercent >= 0 ? 'On Budget' : 'Over Budget'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Performance Table */}
      {teamPerformance && teamPerformance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Team Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours Logged
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks Completed
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teamPerformance.map((member, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {member.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {member.hoursLogged} hrs
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {member.tasksCompleted}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          member.efficiency >= 80
                            ? 'bg-green-100 text-green-800'
                            : member.efficiency >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {member.efficiency}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !kpis && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No data yet</h3>
          <p className="text-gray-500 mt-1">
            Start creating projects and invoices to see your reports.
          </p>
        </div>
      )}
    </div>
  );
}
