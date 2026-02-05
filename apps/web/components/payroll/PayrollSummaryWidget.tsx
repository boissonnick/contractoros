'use client';

import React from 'react';
import { PayrollRun, PayrollSummary } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {
  BanknotesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface PayrollSummaryWidgetProps {
  summary: PayrollSummary | null;
  recentRuns: PayrollRun[];
  isLoading?: boolean;
  compact?: boolean;
}

export function PayrollSummaryWidget({
  summary,
  recentRuns,
  isLoading = false,
  compact = false,
}: PayrollSummaryWidgetProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'approved':
        return 'primary';
      case 'pending_approval':
        return 'warning';
      case 'processing':
        return 'info';
      case 'draft':
        return 'default';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const pendingApprovalCount = recentRuns.filter(r => r.status === 'pending_approval').length;
  const draftCount = recentRuns.filter(r => r.status === 'draft').length;

  // Find the most recent completed run for "last payroll" display
  const lastCompletedRun = recentRuns.find(r => r.status === 'completed');

  // Find the next upcoming pay date
  const upcomingRuns = recentRuns
    .filter(r => r.status !== 'cancelled' && r.status !== 'completed')
    .sort((a, b) => a.payPeriod.payDate.getTime() - b.payPeriod.payDate.getTime());
  const nextPayRun = upcomingRuns[0];

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Payroll</h3>
          <Link href="/dashboard/payroll" className="text-sm text-brand-600 hover:text-brand-700">
            View All
          </Link>
        </div>

        <div className="space-y-3">
          {/* Pending approvals alert */}
          {pendingApprovalCount > 0 && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                {pendingApprovalCount} payroll run{pendingApprovalCount > 1 ? 's' : ''} pending approval
              </span>
            </div>
          )}

          {/* Next pay date */}
          {nextPayRun && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Next Pay Date</span>
              <span className="font-medium">{formatDate(nextPayRun.payPeriod.payDate)}</span>
            </div>
          )}

          {/* Last payroll amount */}
          {lastCompletedRun && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Last Payroll</span>
              <span className="font-medium text-green-600">
                {formatCurrency(lastCompletedRun.totalNetPay)}
              </span>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BanknotesIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Payroll Overview</h3>
        </div>
        <Link href="/dashboard/payroll">
          <Button variant="outline" size="sm">
            Manage Payroll
            <ArrowRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Alerts */}
      {(pendingApprovalCount > 0 || draftCount > 0) && (
        <div className="mb-4 space-y-2">
          {pendingApprovalCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm text-amber-800 font-medium">
                  {pendingApprovalCount} payroll run{pendingApprovalCount > 1 ? 's' : ''} awaiting approval
                </span>
              </div>
              <Link href="/dashboard/payroll">
                <Button variant="ghost" size="sm" className="text-amber-700">
                  Review
                </Button>
              </Link>
            </div>
          )}
          {draftCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-blue-800">
                {draftCount} draft payroll run{draftCount > 1 ? 's' : ''} in progress
              </span>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Total Runs (90d)</div>
            <div className="text-xl font-semibold text-gray-900 font-heading tracking-tight">{summary.totalRuns}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Active Employees</div>
            <div className="text-xl font-semibold text-gray-900 font-heading tracking-tight">{summary.totalEmployees}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Gross Pay (90d)</div>
            <div className="text-xl font-semibold text-gray-900 font-heading tracking-tight">
              {formatCurrency(summary.totalGrossPay)}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Net Pay (90d)</div>
            <div className="text-xl font-semibold text-green-600">
              {formatCurrency(summary.totalNetPay)}
            </div>
          </div>
        </div>
      )}

      {/* Next Pay Period */}
      {nextPayRun && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Upcoming Pay Period</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">{nextPayRun.payPeriod.label}</div>
              <div className="text-sm text-gray-500">
                Pay Date: {formatDate(nextPayRun.payPeriod.payDate)}
              </div>
            </div>
            <div className="text-right">
              <Badge variant={getStatusColor(nextPayRun.status)}>
                {nextPayRun.status.replace('_', ' ')}
              </Badge>
              <div className="text-sm text-gray-500 mt-1">
                {nextPayRun.employeeCount} employees
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Runs */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Payroll Runs</h4>
        {recentRuns.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <BanknotesIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No payroll runs yet</p>
            <Link href="/dashboard/payroll">
              <Button variant="outline" size="sm" className="mt-2">
                Create First Run
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentRuns.slice(0, 3).map((run) => (
              <Link
                key={run.id}
                href="/dashboard/payroll"
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  {run.status === 'completed' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : run.status === 'pending_approval' ? (
                    <ClockIcon className="h-5 w-5 text-amber-500" />
                  ) : (
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {run.payPeriod.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {run.employeeCount} employees
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(run.totalNetPay)}
                  </div>
                  <Badge variant={getStatusColor(run.status)} className="text-xs">
                    {run.status === 'pending_approval' ? 'Pending' : run.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/payroll" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <BanknotesIcon className="h-4 w-4 mr-1" />
              New Payroll Run
            </Button>
          </Link>
          <Link href="/dashboard/settings/payroll" className="flex-1">
            <Button variant="ghost" size="sm" className="w-full">
              Settings
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default PayrollSummaryWidget;
