'use client';

import React, { useMemo } from 'react';
import { PayPeriod, TimeEntry, UserProfile } from '@/types';
import Badge from '@/components/ui/Badge';
import {
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

interface EmployeePreview {
  employee: UserProfile;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  estimatedGross: number;
  estimatedNet: number;
  hasTimeEntries: boolean;
  warnings: string[];
}

interface PayrollRunPreviewCalculatorProps {
  payPeriod: PayPeriod;
  selectedEmployees: UserProfile[];
  timeEntries: TimeEntry[];
  overtimeThreshold?: number;
  overtimeMultiplier?: number;
  estimatedTaxRate?: number;
}

export function PayrollRunPreviewCalculator({
  payPeriod,
  selectedEmployees,
  timeEntries,
  overtimeThreshold = 40,
  overtimeMultiplier = 1.5,
  estimatedTaxRate = 0.25,
}: PayrollRunPreviewCalculatorProps) {
  // Calculate employee previews
  const employeePreviews = useMemo<EmployeePreview[]>(() => {
    return selectedEmployees.map((employee) => {
      // Filter time entries for this employee and pay period
      const employeeEntries = timeEntries.filter((entry) => {
        if (entry.userId !== employee.uid) return false;
        const entryDate = entry.clockIn instanceof Date ? entry.clockIn : new Date(entry.clockIn);
        return entryDate >= payPeriod.startDate && entryDate <= payPeriod.endDate;
      });

      // Calculate total hours
      const totalMinutes = employeeEntries.reduce(
        (sum, entry) => sum + (entry.totalMinutes ?? 0),
        0
      );
      const totalHours = totalMinutes / 60;

      // Calculate regular vs overtime hours
      const regularHours = Math.min(totalHours, overtimeThreshold);
      const overtimeHours = Math.max(0, totalHours - overtimeThreshold);

      // Calculate estimated gross pay
      let estimatedGross = 0;
      const warnings: string[] = [];

      if (employee.employeeType === 'salaried') {
        // Salaried employees get their period salary regardless of hours
        const annualSalary = employee.salary ?? 0;
        // Assuming bi-weekly for now
        estimatedGross = annualSalary / 26;
        if (totalHours === 0) {
          warnings.push('No time entries - will receive full salary');
        }
      } else {
        // Hourly employees
        const hourlyRate = employee.hourlyRate ?? 0;
        if (hourlyRate === 0) {
          warnings.push('No hourly rate set');
        }
        const regularPay = regularHours * hourlyRate;
        const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier;
        estimatedGross = regularPay + overtimePay;

        if (totalHours === 0) {
          warnings.push('No time entries for this period');
        }
        if (overtimeHours > 0) {
          warnings.push(`${overtimeHours.toFixed(1)}h overtime`);
        }
      }

      // Estimate net pay (rough estimate)
      const estimatedNet = estimatedGross * (1 - estimatedTaxRate);

      return {
        employee,
        regularHours,
        overtimeHours,
        totalHours,
        estimatedGross,
        estimatedNet,
        hasTimeEntries: employeeEntries.length > 0,
        warnings,
      };
    });
  }, [
    selectedEmployees,
    timeEntries,
    payPeriod,
    overtimeThreshold,
    overtimeMultiplier,
    estimatedTaxRate,
  ]);

  // Calculate totals
  const totals = useMemo(() => {
    return employeePreviews.reduce(
      (acc, preview) => ({
        regularHours: acc.regularHours + preview.regularHours,
        overtimeHours: acc.overtimeHours + preview.overtimeHours,
        totalHours: acc.totalHours + preview.totalHours,
        estimatedGross: acc.estimatedGross + preview.estimatedGross,
        estimatedNet: acc.estimatedNet + preview.estimatedNet,
        employeesWithNoHours:
          acc.employeesWithNoHours + (preview.hasTimeEntries ? 0 : 1),
      }),
      {
        regularHours: 0,
        overtimeHours: 0,
        totalHours: 0,
        estimatedGross: 0,
        estimatedNet: 0,
        employeesWithNoHours: 0,
      }
    );
  }, [employeePreviews]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <UserGroupIcon className="h-4 w-4" />
            Employees
          </div>
          <div className="text-xl font-semibold text-gray-900 tracking-tight">
            {selectedEmployees.length}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <ClockIcon className="h-4 w-4" />
            Total Hours
          </div>
          <div className="text-xl font-semibold text-gray-900 tracking-tight">
            {totals.totalHours.toFixed(1)}
          </div>
          {totals.overtimeHours > 0 && (
            <div className="text-xs text-amber-600">
              incl. {totals.overtimeHours.toFixed(1)}h OT
            </div>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <CurrencyDollarIcon className="h-4 w-4" />
            Est. Gross
          </div>
          <div className="text-xl font-semibold text-gray-900 tracking-tight">
            {formatCurrency(totals.estimatedGross)}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <BanknotesIcon className="h-4 w-4" />
            Est. Net
          </div>
          <div className="text-xl font-semibold text-green-600">
            {formatCurrency(totals.estimatedNet)}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {totals.employeesWithNoHours > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>{totals.employeesWithNoHours}</strong> employee
            {totals.employeesWithNoHours > 1 ? 's have' : ' has'} no time entries for
            this period. Salaried employees will still receive their regular pay.
          </div>
        </div>
      )}

      {/* Employee Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Employee Breakdown</h4>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Gross
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Net
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employeePreviews.map((preview) => (
                <tr key={preview.employee.uid} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-sm">
                      {preview.employee.displayName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {preview.employee.employeeType === 'salaried' ? 'Salaried' : 'Hourly'}
                      {preview.employee.hourlyRate && ` - ${formatCurrency(preview.employee.hourlyRate)}/hr`}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="text-gray-900">{preview.totalHours.toFixed(1)}h</div>
                    {preview.overtimeHours > 0 && (
                      <div className="text-xs text-amber-600">
                        {preview.overtimeHours.toFixed(1)}h OT
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(preview.estimatedGross)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                    {formatCurrency(preview.estimatedNet)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {preview.warnings.length === 0 ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        {preview.warnings.map((warning, idx) => (
                          <Badge
                            key={idx}
                            variant={warning.includes('overtime') ? 'warning' : 'default'}
                            className="text-xs whitespace-nowrap"
                          >
                            {warning}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-900">Totals</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {totals.totalHours.toFixed(1)}h
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {formatCurrency(totals.estimatedGross)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                  {formatCurrency(totals.estimatedNet)}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <strong>Note:</strong> These are estimated amounts based on available time entries and
        approximate tax rates ({(estimatedTaxRate * 100).toFixed(0)}%). Actual amounts will be calculated
        when the payroll run is created and may differ based on actual tax withholdings,
        deductions, and adjustments.
      </div>
    </div>
  );
}

export default PayrollRunPreviewCalculator;
