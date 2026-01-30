'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { usePayroll } from '@/lib/hooks/usePayroll';
import { useTeamMembers } from '@/lib/hooks/useQueryHooks';
import { useTimeEntries } from '@/lib/hooks/useTimeEntries';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { PayrollRunCard, CreatePayrollModal, PayrollPreview } from '@/components/payroll';
import {
  PlusIcon,
  BanknotesIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { PayrollRun, PayPeriod, UserProfile } from '@/types';
import { pdf } from '@react-pdf/renderer';
import { PayStubPdf, payrollEntryToPayStub } from '@/lib/payroll/pay-stub-pdf';

export default function PayrollDashboardPage() {
  const { profile } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);

  const {
    payrollRuns,
    settings,
    loading,
    error,
    createRun,
    updateStatus,
    exportToCSV,
    generatePeriod,
    calculateSummary,
  } = usePayroll({
    orgId: profile?.orgId ?? '',
    enabled: !!profile?.orgId,
  });

  // Get team members using react-query hook
  const teamQuery = useTeamMembers();
  const teamMembers = (teamQuery.data ?? []) as UserProfile[];

  // Get time entries using the existing hook
  const { entries: timeEntries } = useTimeEntries({
    includeAllUsers: true,
  });

  const summary = calculateSummary();

  const handleCreatePayroll = async (payPeriod: PayPeriod, employeeIds: string[]) => {
    if (!profile) return;

    const selectedEmployees = teamMembers.filter((m: UserProfile) => employeeIds.includes(m.uid));

    await createRun(
      payPeriod,
      selectedEmployees,
      timeEntries,
      profile.uid,
      profile.displayName ?? 'Unknown'
    );
  };

  const handleApprove = async () => {
    if (!selectedRun || !profile) return;
    await updateStatus(selectedRun.id, 'approved', profile.uid, profile.displayName ?? 'Unknown');
    setSelectedRun(null);
  };

  const handleCancel = async () => {
    if (!selectedRun) return;
    await updateStatus(selectedRun.id, 'cancelled');
    setSelectedRun(null);
  };

  const handleExportCSV = async () => {
    if (!selectedRun) return;
    const csv = await exportToCSV(selectedRun.id);

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payroll_${selectedRun.payPeriod.label.replace(/[^a-z0-9]/gi, '_')}.csv`;
    link.click();
  };

  const handleGeneratePayStubs = async () => {
    if (!selectedRun || !profile) return;

    // Generate pay stub PDFs for each employee in the run
    for (const entry of selectedRun.entries) {
      try {
        const payStub = payrollEntryToPayStub(
          entry,
          {
            label: selectedRun.payPeriod.label,
            startDate: selectedRun.payPeriod.startDate,
            endDate: selectedRun.payPeriod.endDate,
            payDate: selectedRun.payPeriod.payDate,
          },
          {
            name: profile.displayName ? `${profile.displayName}'s Organization` : 'Company',
          },
          undefined, // ptoBalance - would come from user profile
          undefined  // sickBalance - would come from user profile
        );

        const blob = await pdf(<PayStubPdf payStub={payStub} />).toBlob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const sanitizedName = entry.employeeName.replace(/[^a-z0-9]/gi, '_');
        const sanitizedPeriod = selectedRun.payPeriod.label.replace(/[^a-z0-9]/gi, '_');
        link.download = `paystub_${sanitizedName}_${sanitizedPeriod}.pdf`;
        link.click();

        // Small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error generating pay stub for ${entry.employeeName}:`, error);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-800">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <div>
              <h3 className="font-medium">Error loading payroll</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show run detail view
  if (selectedRun) {
    return (
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => setSelectedRun(null)}
          className="mb-4"
        >
          ← Back to Payroll
        </Button>
        <PayrollPreview
          run={selectedRun}
          onApprove={selectedRun.status === 'pending_approval' ? handleApprove : undefined}
          onReject={selectedRun.status !== 'completed' ? handleCancel : undefined}
          onExportCSV={handleExportCSV}
          onGeneratePayStubs={handleGeneratePayStubs}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll</h1>
          <p className="text-gray-500 mt-1">Manage employee payroll runs and compensation</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Payroll Run
        </Button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BanknotesIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Gross (90 days)</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatCurrency(summary.totalGrossPay)}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Net (90 days)</div>
                <div className="text-xl font-semibold text-gray-900">
                  {formatCurrency(summary.totalNetPay)}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarDaysIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Payroll Runs</div>
                <div className="text-xl font-semibold text-gray-900">
                  {summary.totalRuns}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ClockIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Active Employees</div>
                <div className="text-xl font-semibold text-gray-900">
                  {summary.totalEmployees}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {summary?.alerts && summary.alerts.length > 0 && (
        <div className="space-y-2">
          {summary.alerts.map((alert, index) => (
            <Card
              key={index}
              className={`p-3 ${
                alert.severity === 'error'
                  ? 'bg-red-50 border-red-200'
                  : alert.severity === 'warning'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                <ExclamationTriangleIcon
                  className={`h-4 w-4 ${
                    alert.severity === 'error'
                      ? 'text-red-600'
                      : alert.severity === 'warning'
                      ? 'text-amber-600'
                      : 'text-blue-600'
                  }`}
                />
                <span
                  className={
                    alert.severity === 'error'
                      ? 'text-red-800'
                      : alert.severity === 'warning'
                      ? 'text-amber-800'
                      : 'text-blue-800'
                  }
                >
                  {alert.message}
                </span>
                {alert.payrollRunId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const run = payrollRuns.find(r => r.id === alert.payrollRunId);
                      if (run) setSelectedRun(run);
                    }}
                  >
                    View
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Payroll runs list */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Payroll Runs</h2>

        {payrollRuns.length === 0 ? (
          <EmptyState
            icon={<BanknotesIcon className="h-12 w-12" />}
            title="No payroll runs yet"
            description="Create your first payroll run to calculate employee compensation and taxes."
            action={{
              label: 'Create Payroll Run',
              onClick: () => setShowCreateModal(true),
            }}
          />
        ) : (
          <div className="space-y-3">
            {payrollRuns.map((run) => (
              <PayrollRunCard
                key={run.id}
                run={run}
                onClick={() => setSelectedRun(run)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="text-sm text-gray-600">
          <strong>Important:</strong> Tax calculations in this payroll module are estimates only.
          For accurate tax withholding and compliance, please use a certified payroll provider
          such as Gusto, ADP, QuickBooks Payroll, or consult with a tax professional.
          ContractorOS provides payroll tracking and reporting but is not a certified payroll processor.
        </div>
      </Card>

      {/* Create modal */}
      <CreatePayrollModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreatePayroll}
        generatePayPeriod={generatePeriod}
        employees={teamMembers}
        timeEntries={timeEntries}
        defaultPaySchedule={settings?.defaultPaySchedule ?? 'bi-weekly'}
      />
    </div>
  );
}
