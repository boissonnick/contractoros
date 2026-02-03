'use client';

import React from 'react';
import { PayrollRun, PAYROLL_RUN_STATUSES } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { PayrollEntryRow } from './PayrollEntryRow';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface PayrollPreviewProps {
  run: PayrollRun;
  onApprove?: () => void;
  onReject?: () => void;
  onExportCSV?: () => void;
  onGeneratePayStubs?: () => void;
  onEditEntry?: (entryId: string, updates: Record<string, unknown>) => void;
  onAddAdjustment?: (entryId: string, adjustment: {
    type: 'bonus' | 'commission' | 'reimbursement' | 'deduction' | 'garnishment' | 'advance' | 'other';
    description: string;
    amount: number;
    taxable: boolean;
  }) => void;
  isLoading?: boolean;
}

export function PayrollPreview({
  run,
  onApprove,
  onReject,
  onExportCSV,
  onGeneratePayStubs,
  onEditEntry,
  onAddAdjustment,
  isLoading = false,
}: PayrollPreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusInfo = PAYROLL_RUN_STATUSES.find(s => s.value === run.status) ?? {
    label: run.status,
    color: 'default' as const,
  };

  const canEdit = run.status === 'draft' || run.status === 'pending_approval';
  const canApprove = run.status === 'pending_approval';
  const canExport = run.status === 'approved' || run.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Payroll Run #{run.runNumber}
            </h2>
            <Badge variant={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">
            {run.payPeriod.label} • Pay Date: {formatDate(run.payPeriod.payDate)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && onReject && (
            <Button
              variant="outline"
              onClick={onReject}
              disabled={isLoading}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircleIcon className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          {canApprove && onApprove && (
            <Button
              onClick={onApprove}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Approve Payroll
            </Button>
          )}
          {canExport && (
            <>
              {onExportCSV && (
                <Button
                  variant="outline"
                  onClick={onExportCSV}
                  disabled={isLoading}
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
              {onGeneratePayStubs && (
                <Button
                  variant="outline"
                  onClick={onGeneratePayStubs}
                  disabled={isLoading}
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Pay Stubs
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Employees</div>
          <div className="text-2xl font-semibold text-gray-900">
            {run.employeeCount}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Hours</div>
          <div className="text-2xl font-semibold text-gray-900">
            {((run.totalRegularHours || 0) + (run.totalOvertimeHours || 0)).toFixed(1)}
          </div>
          {(run.totalOvertimeHours || 0) > 0 && (
            <div className="text-xs text-amber-600">
              incl. {(run.totalOvertimeHours || 0).toFixed(1)}h OT
            </div>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Gross Pay</div>
          <div className="text-2xl font-semibold text-gray-900">
            {formatCurrency(run.totalGrossPay)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Deductions</div>
          <div className="text-2xl font-semibold text-red-600">
            {formatCurrency(run.totalDeductions)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Net Pay</div>
          <div className="text-2xl font-semibold text-green-600">
            {formatCurrency(run.totalNetPay)}
          </div>
        </Card>
      </div>

      {/* Employee entries */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Employee Payroll Details
        </h3>
        <div className="space-y-3">
          {run.entries.map((entry) => (
            <PayrollEntryRow
              key={entry.id}
              entry={entry}
              onEdit={canEdit ? (id, updates) => onEditEntry?.(id, updates) : undefined}
              onAddAdjustment={canEdit ? onAddAdjustment : undefined}
              isReadOnly={!canEdit}
            />
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <div className="text-amber-600 mt-0.5">⚠️</div>
          <div className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> Tax calculations shown are estimates only and should not be used
            for official tax filing. Please consult with a qualified tax professional or use a certified
            payroll service (such as Gusto, ADP, or QuickBooks Payroll) for accurate tax withholding
            and reporting.
          </div>
        </div>
      </Card>

      {/* Metadata */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>Created by {run.createdByName} on {run.createdAt.toLocaleString()}</p>
        {run.approvedBy && (
          <p>Approved by {run.approvedByName} on {run.approvedAt?.toLocaleString()}</p>
        )}
        {run.processedAt && (
          <p>Processed on {run.processedAt.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

export default PayrollPreview;
