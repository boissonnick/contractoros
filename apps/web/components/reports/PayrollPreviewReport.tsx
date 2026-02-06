"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { usePayrollConfig } from '@/lib/hooks/usePayrollConfig';
import { calculatePayroll } from '@/lib/payroll';
import { LegacyPayrollEntry, PayrollConfig } from '@/types';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

interface PayrollPreviewReportProps {
  startDate: Date;
  endDate: Date;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

// Default config if none exists
const DEFAULT_CONFIG: PayrollConfig = {
  id: 'default',
  orgId: '',
  payPeriod: 'biweekly',
  overtimeThresholdHours: 40,
  overtimeMultiplier: 1.5,
  defaultHourlyRate: 25,
  payDay: 'Friday',
  createdAt: new Date(),
};

export default function PayrollPreviewReport({ startDate, endDate }: PayrollPreviewReportProps) {
  const { profile } = useAuth();
  const { config, loading: configLoading } = usePayrollConfig();
  const [entries, setEntries] = useState<LegacyPayrollEntry[]>([]);
  const [totals, setTotals] = useState({ totalRegular: 0, totalOvertime: 0, totalPay: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use config if available, otherwise use defaults
  const effectiveConfig = config || DEFAULT_CONFIG;

  useEffect(() => {
    if (!profile?.orgId || configLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch setState is not synchronous
    setLoading(true);
    setError(null);

    Promise.all([
      getDocs(query(collection(db, 'users'), where('orgId', '==', profile.orgId))),
      getDocs(query(
        collection(db, 'timeEntries'),
        where('orgId', '==', profile.orgId),
        where('clockIn', '>=', Timestamp.fromDate(startDate)),
        where('clockIn', '<=', Timestamp.fromDate(endDate))
      )),
    ]).then(([usersSnap, entriesSnap]) => {
      const hoursByUser = new Map<string, number>();
      entriesSnap.docs.forEach(d => {
        const data = d.data();
        hoursByUser.set(data.userId, (hoursByUser.get(data.userId) || 0) + (data.totalMinutes || 0) / 60);
      });

      const timeData = usersSnap.docs
        .filter(d => ['EMPLOYEE', 'CONTRACTOR'].includes(d.data().role) && hoursByUser.has(d.id))
        .map(d => ({
          userId: d.id,
          userName: d.data().displayName || 'Unknown',
          hourlyRate: d.data().hourlyRate || 0,
          totalHours: hoursByUser.get(d.id) || 0,
        }));

      const result = calculatePayroll(timeData, effectiveConfig);
      setEntries(result.entries);
      setTotals({ totalRegular: result.totalRegular, totalOvertime: result.totalOvertime, totalPay: result.totalPay });
      setLoading(false);
    }).catch((err) => {
      logger.error('Error loading payroll data', { error: err, component: 'PayrollPreviewReport' });
      setError(err.message?.includes('permission-denied')
        ? 'Permission denied. Check Firestore security rules.'
        : 'Failed to load payroll data.');
      setLoading(false);
    });
  }, [profile?.orgId, effectiveConfig, configLoading, startDate, endDate]);

  if (loading || configLoading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <p className="text-sm text-red-500 text-center py-8">{error}</p>;
  if (entries.length === 0) return <p className="text-sm text-gray-500 text-center py-8">No payroll data for this period.</p>;

  return (
    <div>
      <div className="flex items-center gap-6 mb-4 text-sm">
        <div><span className="text-gray-500">Regular:</span> <span className="font-semibold">{fmt(totals.totalRegular)}</span></div>
        <div><span className="text-gray-500">Overtime:</span> <span className="font-semibold text-orange-600">{fmt(totals.totalOvertime)}</span></div>
        <div><span className="text-gray-500">Total:</span> <span className="font-bold text-green-700">{fmt(totals.totalPay)}</span></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Employee</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Rate</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Reg Hrs</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">OT Hrs</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Reg Pay</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">OT Pay</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.userId} className="border-b border-gray-100">
                <td className="py-2 px-3 font-medium text-gray-900">{e.userName}</td>
                <td className="py-2 px-3 text-right text-gray-600">{fmt(e.hourlyRate)}/hr</td>
                <td className="py-2 px-3 text-right text-gray-900">{e.regularHours.toFixed(1)}</td>
                <td className={cn('py-2 px-3 text-right', e.overtimeHours > 0 ? 'text-orange-600 font-medium' : 'text-gray-400')}>{e.overtimeHours.toFixed(1)}</td>
                <td className="py-2 px-3 text-right text-gray-900">{fmt(e.regularPay)}</td>
                <td className="py-2 px-3 text-right text-orange-600">{fmt(e.overtimePay)}</td>
                <td className="py-2 px-3 text-right font-semibold text-gray-900">{fmt(e.totalPay)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
