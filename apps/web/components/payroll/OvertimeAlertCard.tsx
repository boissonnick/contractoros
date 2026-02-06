"use client";

import React from 'react';
import Card from '@/components/ui/Card';
import { ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { OvertimeEmployeeAlert } from '@/lib/hooks/useTimeEntries';
import { cn } from '@/lib/utils';

interface OvertimeAlertCardProps {
  alerts: OvertimeEmployeeAlert[];
  variant: 'approaching' | 'exceeded';
}

export function OvertimeAlertCard({ alerts, variant }: OvertimeAlertCardProps) {
  if (alerts.length === 0) return null;

  const isExceeded = variant === 'exceeded';

  return (
    <Card className={cn(
      'p-4',
      isExceeded ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          isExceeded ? 'bg-red-100' : 'bg-amber-100'
        )}>
          {isExceeded ? (
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          ) : (
            <ClockIcon className="h-5 w-5 text-amber-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'text-sm font-semibold',
            isExceeded ? 'text-red-800' : 'text-amber-800'
          )}>
            {isExceeded ? 'Overtime Exceeded' : 'Approaching Overtime'} ({alerts.length})
          </h3>
          <div className="mt-2 space-y-2">
            {alerts.map((alert, idx) => (
              <div key={`${alert.userId}-${alert.type}-${idx}`} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={isExceeded ? 'text-red-700 font-medium' : 'text-amber-700 font-medium'}>
                    {alert.userName}
                  </span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    isExceeded ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  )}>
                    {alert.type === 'daily' ? 'Daily' : 'Weekly'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={isExceeded ? 'text-red-700 font-semibold' : 'text-amber-700 font-semibold'}>
                    {alert.hoursWorked.toFixed(1)}h
                  </span>
                  <span className={isExceeded ? 'text-red-500' : 'text-amber-500'}>
                    / {alert.threshold}h
                  </span>
                  {alert.projectedWeeklyHours && alert.type === 'weekly' && (
                    <span className="text-xs text-gray-500">
                      (proj: {alert.projectedWeeklyHours.toFixed(0)}h)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
