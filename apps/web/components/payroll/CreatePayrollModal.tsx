'use client';

import React, { useState, useEffect } from 'react';
import { PayPeriod, PaySchedule, PAY_SCHEDULE_LABELS, UserProfile, TimeEntry } from '@/types';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import { PayrollRunPreviewCalculator } from './PayrollRunPreviewCalculator';
import {
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

interface CreatePayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payPeriod: PayPeriod, selectedEmployeeIds: string[]) => Promise<void>;
  generatePayPeriod: (type: PaySchedule, referenceDate?: Date) => PayPeriod;
  employees: UserProfile[];
  timeEntries: TimeEntry[];
  defaultPaySchedule?: PaySchedule;
}

export function CreatePayrollModal({
  isOpen,
  onClose,
  onConfirm,
  generatePayPeriod,
  employees,
  timeEntries,
  defaultPaySchedule = 'bi-weekly',
}: CreatePayrollModalProps) {
  const [paySchedule, setPaySchedule] = useState<PaySchedule>(defaultPaySchedule);
  const [payPeriod, setPayPeriod] = useState<PayPeriod | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'period' | 'employees' | 'review'>('period');

  // Generate pay period when schedule changes
  useEffect(() => {
    const period = generatePayPeriod(paySchedule);
    setPayPeriod(period);
  }, [paySchedule, generatePayPeriod]);

  // Pre-select all eligible employees
  useEffect(() => {
    const eligibleIds = new Set(
      employees
        .filter(e => e.role === 'EMPLOYEE' || e.role === 'PM')
        .map(e => e.uid)
    );
    setSelectedEmployees(eligibleIds);
  }, [employees]);

  const handleToggleEmployee = (uid: string) => {
    const newSet = new Set(selectedEmployees);
    if (newSet.has(uid)) {
      newSet.delete(uid);
    } else {
      newSet.add(uid);
    }
    setSelectedEmployees(newSet);
  };

  const handleSelectAll = () => {
    const allIds = employees
      .filter(e => e.role === 'EMPLOYEE' || e.role === 'PM')
      .map(e => e.uid);
    setSelectedEmployees(new Set(allIds));
  };

  const handleSelectNone = () => {
    setSelectedEmployees(new Set());
  };

  const handleConfirm = async () => {
    if (!payPeriod || selectedEmployees.size === 0) return;

    setIsSubmitting(true);
    try {
      await onConfirm(payPeriod, Array.from(selectedEmployees));
      onClose();
    } catch (error) {
      logger.error('Error creating payroll run', { error: error, component: 'CreatePayrollModal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate hours for each employee in the period
  const getEmployeeHours = (employeeId: string): number => {
    if (!payPeriod) return 0;

    return timeEntries
      .filter(entry => {
        if (entry.userId !== employeeId) return false;
        // TimeEntry uses clockIn, not date
        const entryDate = entry.clockIn instanceof Date ? entry.clockIn : new Date(entry.clockIn);
        return entryDate >= payPeriod.startDate && entryDate <= payPeriod.endDate;
      })
      // TimeEntry uses totalMinutes (convert to hours)
      .reduce((sum, entry) => sum + (entry.totalMinutes ? entry.totalMinutes / 60 : 0), 0);
  };

  // Count employees with no hours
  const employeesWithNoHours = Array.from(selectedEmployees).filter(
    id => getEmployeeHours(id) === 0
  );

  return (
    <BaseModal
      open={isOpen}
      onClose={onClose}
      title="Create Payroll Run"
      size="lg"
    >
      <div className="space-y-6">
        {/* Step 1: Pay Period */}
        {step === 'period' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pay Schedule
              </label>
              <select
                value={paySchedule}
                onChange={(e) => setPaySchedule(e.target.value as PaySchedule)}
                className="w-full rounded-md border-gray-300"
              >
                {Object.entries(PAY_SCHEDULE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {payPeriod && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Pay Period</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Start Date</div>
                    <div className="font-medium">{formatDate(payPeriod.startDate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">End Date</div>
                    <div className="font-medium">{formatDate(payPeriod.endDate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Pay Date</div>
                    <div className="font-medium text-green-600">{formatDate(payPeriod.payDate)}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 2: Select Employees */}
        {step === 'employees' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Select Employees ({selectedEmployees.size} selected)
                </h4>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSelectNone}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {employees
                .filter(e => e.role === 'EMPLOYEE' || e.role === 'PM')
                .map((employee) => {
                  const hours = getEmployeeHours(employee.uid);
                  const isSelected = selectedEmployees.has(employee.uid);

                  return (
                    <label
                      key={employee.uid}
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleEmployee(employee.uid)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{employee.displayName}</div>
                          <div className="text-sm text-gray-500">
                            {employee.employeeType === 'salaried' ? 'Salaried' : 'Hourly'}
                            {employee.hourlyRate && ` • $${employee.hourlyRate}/hr`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${hours === 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                          {hours.toFixed(1)} hrs
                        </div>
                        {hours === 0 && (
                          <div className="text-xs text-amber-600">No time entries</div>
                        )}
                      </div>
                    </label>
                  );
                })}
            </div>

            {employeesWithNoHours.length > 0 && selectedEmployees.size > 0 && (
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                <div>
                  {employeesWithNoHours.length} selected employee(s) have no time entries for this period.
                  Salaried employees will still receive their regular pay.
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 3: Review with Preview Calculator */}
        {step === 'review' && payPeriod && (
          <>
            {/* Pay Period Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-blue-800 font-medium">Pay Period</div>
                  <div className="text-blue-900 font-semibold">{payPeriod.label}</div>
                  <div className="text-xs text-blue-700 mt-1">
                    Pay Date: {payPeriod.payDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll Preview Calculator */}
            <PayrollRunPreviewCalculator
              payPeriod={payPeriod}
              selectedEmployees={employees.filter(e => selectedEmployees.has(e.uid))}
              timeEntries={timeEntries}
            />

            {/* What happens next */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 mt-4">
              <strong className="text-gray-900">What happens next:</strong>
              <ul className="mt-2 space-y-1">
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  A draft payroll run will be created with calculated entries
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Final tax calculations will be computed for each employee
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  You can review, adjust, and approve before processing
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            {step !== 'period' && (
              <Button
                variant="ghost"
                onClick={() => setStep(step === 'review' ? 'employees' : 'period')}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {step === 'review' ? (
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting || selectedEmployees.size === 0}
              >
                {isSubmitting ? 'Creating...' : 'Create Payroll Run'}
              </Button>
            ) : (
              <Button
                onClick={() => setStep(step === 'period' ? 'employees' : 'review')}
                disabled={step === 'employees' && selectedEmployees.size === 0}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default CreatePayrollModal;
