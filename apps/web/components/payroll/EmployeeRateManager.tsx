'use client';

import React, { useState } from 'react';
import { UserProfile, EmployeeType } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import BaseModal from '@/components/ui/BaseModal';
import Badge from '@/components/ui/Badge';
import {
  CurrencyDollarIcon,
  PencilIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

// Rate history entry
interface RateHistoryEntry {
  id: string;
  rate: number;
  effectiveDate: Date;
  endDate?: Date;
  reason?: string;
  updatedBy: string;
  updatedByName: string;
  updatedAt: Date;
}

interface EmployeeRateManagerProps {
  employee: UserProfile;
  rateHistory?: RateHistoryEntry[];
  onUpdateRate?: (newRate: number, effectiveDate: Date, reason: string) => Promise<void>;
  onUpdateEmployeeType?: (type: EmployeeType) => Promise<void>;
  onUpdateOvertimeMultiplier?: (multiplier: number) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function EmployeeRateManager({
  employee,
  rateHistory = [],
  onUpdateRate,
  onUpdateEmployeeType,
  onUpdateOvertimeMultiplier,
  isLoading = false,
  readOnly = false,
}: EmployeeRateManagerProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [newRate, setNewRate] = useState<string>(employee.hourlyRate?.toString() ?? '');
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('');
  const [employeeType, setEmployeeType] = useState<EmployeeType>(employee.employeeType ?? 'hourly');
  const [overtimeMultiplier, setOvertimeMultiplier] = useState<string>(
    employee.overtimeRate?.toString() ?? '1.5'
  );
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate annual salary estimate for hourly employees
  const annualEstimate = employee.hourlyRate
    ? employee.hourlyRate * 40 * 52
    : employee.salary ?? 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSaveRate = async () => {
    if (!onUpdateRate || !newRate) return;

    setIsSaving(true);
    try {
      await onUpdateRate(parseFloat(newRate), new Date(effectiveDate), reason);
      setShowEditModal(false);
      setReason('');
    } catch (error) {
      console.error('Error updating rate:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmployeeType = async (type: EmployeeType) => {
    if (!onUpdateEmployeeType) return;
    setEmployeeType(type);
    try {
      await onUpdateEmployeeType(type);
    } catch (error) {
      console.error('Error updating employee type:', error);
      setEmployeeType(employee.employeeType ?? 'hourly');
    }
  };

  const _handleUpdateOvertimeMultiplier = async () => {
    if (!onUpdateOvertimeMultiplier) return;
    try {
      await onUpdateOvertimeMultiplier(parseFloat(overtimeMultiplier));
    } catch (error) {
      console.error('Error updating overtime multiplier:', error);
    }
  };

  // Sort history by effective date descending
  const sortedHistory = [...rateHistory].sort(
    (a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime()
  );

  return (
    <div className="space-y-4">
      {/* Current Rate Card */}
      <Card className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{employee.displayName}</h3>
            <p className="text-sm text-gray-500">{employee.email}</p>
          </div>
          <Badge variant={employeeType === 'salaried' ? 'primary' : 'default'}>
            {employeeType === 'salaried' ? 'Salaried' : 'Hourly'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Current Rate */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <CurrencyDollarIcon className="h-4 w-4" />
              {employeeType === 'salaried' ? 'Annual Salary' : 'Hourly Rate'}
            </div>
            <div className="text-xl font-semibold text-gray-900 font-heading tracking-tight">
              {employeeType === 'salaried'
                ? formatCurrency(employee.salary ?? 0)
                : formatCurrency(employee.hourlyRate ?? 0)}
              {employeeType === 'hourly' && <span className="text-sm font-normal">/hr</span>}
            </div>
          </div>

          {/* Overtime Rate */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <ClockIcon className="h-4 w-4" />
              Overtime Rate
            </div>
            <div className="text-xl font-semibold text-amber-600">
              {(employee.overtimeRate ?? 1.5).toFixed(1)}x
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency((employee.hourlyRate ?? 0) * (employee.overtimeRate ?? 1.5))}/hr OT
            </div>
          </div>

          {/* Double Time Rate */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <ClockIcon className="h-4 w-4" />
              Double Time
            </div>
            <div className="text-xl font-semibold text-orange-600">
              2.0x
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency((employee.hourlyRate ?? 0) * 2)}/hr DT
            </div>
          </div>

          {/* Annual Estimate */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <ChartBarIcon className="h-4 w-4" />
              Annual (Est.)
            </div>
            <div className="text-xl font-semibold text-gray-900 font-heading tracking-tight">
              {formatCurrency(annualEstimate)}
            </div>
            <div className="text-xs text-gray-500">
              Based on 40hr/week
            </div>
          </div>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
              disabled={isLoading}
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit Rate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              disabled={rateHistory.length === 0}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              {showHistory ? 'Hide History' : 'View History'}
              {rateHistory.length > 0 && (
                <span className="ml-1 text-gray-400">({rateHistory.length})</span>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Rate History */}
      {showHistory && rateHistory.length > 0 && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Rate History</h4>
          <div className="space-y-3">
            {sortedHistory.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-start justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(entry.rate)}/hr
                    </span>
                    {index === 0 && (
                      <Badge variant="success" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Effective: {formatDate(entry.effectiveDate)}
                    {entry.endDate && ` - ${formatDate(entry.endDate)}`}
                  </div>
                  {entry.reason && (
                    <div className="text-sm text-gray-600 mt-1 italic">
                      &ldquo;{entry.reason}&rdquo;
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>by {entry.updatedByName}</div>
                  <div>{formatDate(entry.updatedAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Rate Modal */}
      <BaseModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Update Employee Rate"
        size="md"
      >
        <div className="space-y-4">
          {/* Employee Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compensation Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleUpdateEmployeeType('hourly')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  employeeType === 'hourly'
                    ? 'border-brand-primary bg-brand-50 text-brand-primary'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Hourly
              </button>
              <button
                type="button"
                onClick={() => handleUpdateEmployeeType('salaried')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  employeeType === 'salaried'
                    ? 'border-brand-primary bg-brand-50 text-brand-primary'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Salaried
              </button>
            </div>
          </div>

          {/* Rate Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {employeeType === 'salaried' ? 'Annual Salary' : 'Hourly Rate'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-full pl-8 pr-16 py-2 rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20"
                placeholder={employeeType === 'salaried' ? '75000.00' : '25.00'}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {employeeType === 'salaried' ? '/year' : '/hour'}
              </span>
            </div>
          </div>

          {/* Overtime Multiplier */}
          {employeeType === 'hourly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Multiplier
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="3"
                  value={overtimeMultiplier}
                  onChange={(e) => setOvertimeMultiplier(e.target.value)}
                  className="w-24 py-2 rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20"
                />
                <span className="text-gray-500">x base rate</span>
                {newRate && (
                  <span className="text-gray-500 ml-auto">
                    = {formatCurrency(parseFloat(newRate) * parseFloat(overtimeMultiplier || '1.5'))}/hr OT
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effective Date
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Change
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Annual review, Promotion, Market adjustment..."
              rows={2}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20"
            />
          </div>

          {/* Warning for backdated changes */}
          {new Date(effectiveDate) < new Date() && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Note:</strong> You are setting a backdated effective date. This will affect
                historical payroll calculations if they are recalculated.
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setNewRate(employee.hourlyRate?.toString() ?? '');
                setReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRate}
              disabled={!newRate || isSaving}
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">...</span>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}

export default EmployeeRateManager;
