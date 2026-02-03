'use client';

import React, { useState } from 'react';
import { PayrollEntry, PAYROLL_ADJUSTMENT_TYPES, PayrollAdjustmentType } from '@/types';
import Button from '@/components/ui/Button';
import {
  PencilIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface PayrollEntryRowProps {
  entry: PayrollEntry;
  onEdit?: (entryId: string, updates: Partial<PayrollEntry>) => void;
  onAddAdjustment?: (entryId: string, adjustment: {
    type: PayrollAdjustmentType;
    description: string;
    amount: number;
    taxable: boolean;
  }) => void;
  isReadOnly?: boolean;
}

export function PayrollEntryRow({
  entry,
  onEdit,
  onAddAdjustment,
  isReadOnly = false,
}: PayrollEntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<PayrollAdjustmentType>('bonus');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentDescription, setAdjustmentDescription] = useState('');
  const [adjustmentTaxable, setAdjustmentTaxable] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleAddAdjustment = () => {
    if (!onAddAdjustment || !adjustmentAmount || !adjustmentDescription) return;

    const typeInfo = PAYROLL_ADJUSTMENT_TYPES.find(t => t.value === adjustmentType);
    const amount = parseFloat(adjustmentAmount) * (typeInfo?.isAddition ? 1 : -1);

    onAddAdjustment(entry.id, {
      type: adjustmentType,
      description: adjustmentDescription,
      amount,
      taxable: adjustmentTaxable,
    });

    // Reset form
    setAdjustmentType('bonus');
    setAdjustmentAmount('');
    setAdjustmentDescription('');
    setAdjustmentTaxable(true);
    setShowAdjustmentForm(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Main row */}
      <div
        className="p-4 bg-white hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-1">
              {expanded ? (
                <ChevronUpIcon className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              )}
            </button>
            <div>
              <div className="font-medium text-gray-900">{entry.employeeName}</div>
              <div className="text-sm text-gray-500">
                {entry.employeeType === 'salaried' ? 'Salaried' : 'Hourly'} •{' '}
                {(() => {
                  // Fix: Safely calculate total hours, handling NaN values
                  const safeNum = (n: number | undefined | null) => (typeof n === 'number' && !isNaN(n) ? n : 0);
                  const total = safeNum(entry.regularHours) + safeNum(entry.overtimeHours) + safeNum(entry.ptoHours) + safeNum(entry.sickHours);
                  return total.toFixed(1);
                })()}h total
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 text-right">
            <div>
              <div className="text-sm text-gray-500">Gross</div>
              <div className="font-medium text-gray-900">{formatCurrency(entry.grossPay)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Deductions</div>
              <div className="font-medium text-red-600">{formatCurrency(entry.totalDeductions)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Net</div>
              <div className="font-semibold text-green-600">{formatCurrency(entry.netPay)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hours breakdown */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Hours</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Regular</dt>
                  <dd className="text-gray-900">{(entry.regularHours || 0).toFixed(2)}h</dd>
                </div>
                {(entry.overtimeHours || 0) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-amber-600">Overtime</dt>
                    <dd className="text-amber-600">{(entry.overtimeHours || 0).toFixed(2)}h</dd>
                  </div>
                )}
                {(entry.doubleTimeHours || 0) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-orange-600">Double Time</dt>
                    <dd className="text-orange-600">{(entry.doubleTimeHours || 0).toFixed(2)}h</dd>
                  </div>
                )}
                {(entry.ptoHours || 0) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-blue-600">PTO</dt>
                    <dd className="text-blue-600">{(entry.ptoHours || 0).toFixed(2)}h</dd>
                  </div>
                )}
                {(entry.sickHours || 0) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-purple-600">Sick</dt>
                    <dd className="text-purple-600">{(entry.sickHours || 0).toFixed(2)}h</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Earnings breakdown */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Earnings</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Regular Pay</dt>
                  <dd className="text-gray-900">{formatCurrency(entry.regularPay)}</dd>
                </div>
                {entry.overtimePay > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Overtime Pay</dt>
                    <dd className="text-gray-900">{formatCurrency(entry.overtimePay)}</dd>
                  </div>
                )}
                {entry.ptoPay > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">PTO Pay</dt>
                    <dd className="text-gray-900">{formatCurrency(entry.ptoPay)}</dd>
                  </div>
                )}
                {entry.bonuses > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Bonuses</dt>
                    <dd className="text-gray-900">{formatCurrency(entry.bonuses)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-gray-200 font-medium">
                  <dt className="text-gray-700">Gross Pay</dt>
                  <dd className="text-gray-900">{formatCurrency(entry.grossPay)}</dd>
                </div>
              </dl>
            </div>

            {/* Deductions breakdown */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Deductions</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Federal Tax</dt>
                  <dd className="text-red-600">-{formatCurrency(entry.federalWithholding)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">State Tax</dt>
                  <dd className="text-red-600">-{formatCurrency(entry.stateWithholding)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Social Security</dt>
                  <dd className="text-red-600">-{formatCurrency(entry.socialSecurity)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Medicare</dt>
                  <dd className="text-red-600">-{formatCurrency(entry.medicare)}</dd>
                </div>
                {entry.retirement401k > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">401(k)</dt>
                    <dd className="text-red-600">-{formatCurrency(entry.retirement401k)}</dd>
                  </div>
                )}
                {entry.healthInsurance > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Health Insurance</dt>
                    <dd className="text-red-600">-{formatCurrency(entry.healthInsurance)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-gray-200 font-medium">
                  <dt className="text-gray-700">Total Deductions</dt>
                  <dd className="text-red-600">-{formatCurrency(entry.totalDeductions)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Adjustments */}
          {entry.adjustments && entry.adjustments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Adjustments</h4>
              <ul className="space-y-1 text-sm">
                {entry.adjustments.map((adj, index) => (
                  <li key={adj.id || index} className="flex justify-between">
                    <span className="text-gray-500">
                      {adj.description} ({adj.type})
                    </span>
                    <span className={adj.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {adj.amount >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* YTD Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Year-to-Date</h4>
            <div className="flex gap-6 text-sm">
              <span className="text-gray-500">
                Gross: <span className="text-gray-900 font-medium">{formatCurrency(entry.ytdGrossPay)}</span>
              </span>
              <span className="text-gray-500">
                Federal: <span className="text-gray-900">{formatCurrency(entry.ytdFederalWithholding)}</span>
              </span>
              <span className="text-gray-500">
                SS: <span className="text-gray-900">{formatCurrency(entry.ytdSocialSecurity)}</span>
              </span>
              <span className="text-gray-500">
                Medicare: <span className="text-gray-900">{formatCurrency(entry.ytdMedicare)}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          {!isReadOnly && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Could open edit modal
                  }}
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {onAddAdjustment && !showAdjustmentForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAdjustmentForm(true);
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Adjustment
                </Button>
              )}
            </div>
          )}

          {/* Adjustment form */}
          {showAdjustmentForm && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add Adjustment</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as PayrollAdjustmentType)}
                    className="w-full rounded-md border-gray-300 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {PAYROLL_ADJUSTMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    className="w-full rounded-md border-gray-300 text-sm"
                    placeholder="0.00"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={adjustmentDescription}
                    onChange={(e) => setAdjustmentDescription(e.target.value)}
                    className="w-full rounded-md border-gray-300 text-sm"
                    placeholder="Reason for adjustment"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={adjustmentTaxable}
                    onChange={(e) => setAdjustmentTaxable(e.target.checked)}
                    className="rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                  Taxable
                </label>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAdjustmentForm(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddAdjustment();
                  }}
                  disabled={!adjustmentAmount || !adjustmentDescription}
                >
                  Add
                </Button>
              </div>
            </div>
          )}

          {entry.hasManualOverrides && (
            <div className="mt-4 text-xs text-amber-600">
              * This entry has manual overrides
              {entry.overrideReason && `: ${entry.overrideReason}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PayrollEntryRow;
