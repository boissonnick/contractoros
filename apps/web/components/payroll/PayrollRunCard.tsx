'use client';

import React from 'react';
import { PayrollRun, PAYROLL_RUN_STATUSES } from '@/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface PayrollRunCardProps {
  run: PayrollRun;
  onClick?: () => void;
}

export function PayrollRunCard({ run, onClick }: PayrollRunCardProps) {
  const statusInfo = PAYROLL_RUN_STATUSES.find(s => s.value === run.status) ?? {
    label: run.status,
    color: 'default' as const,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card
      className={`p-4 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900">
              {run.payPeriod.label}
            </h3>
            <Badge variant={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <UserGroupIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{run.employeeCount} employees</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {(run.totalRegularHours || 0).toFixed(1)} hrs
                {(run.totalOvertimeHours || 0) > 0 && (
                  <span className="text-amber-600 ml-1">
                    (+{(run.totalOvertimeHours || 0).toFixed(1)} OT)
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 font-medium">
                {formatCurrency(run.totalGrossPay)}
              </span>
              <span className="text-gray-400 text-xs">gross</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                Pay: {formatDate(run.payPeriod.payDate)}
              </span>
            </div>
          </div>
        </div>

        {onClick && (
          <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
      </div>

      {/* Quick stats footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
        <div className="text-gray-500">
          Run #{run.runNumber}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500">
            Deductions: <span className="text-red-600">{formatCurrency(run.totalDeductions)}</span>
          </span>
          <span className="text-gray-500">
            Net: <span className="text-green-600 font-medium">{formatCurrency(run.totalNetPay)}</span>
          </span>
        </div>
      </div>
    </Card>
  );
}

export default PayrollRunCard;
