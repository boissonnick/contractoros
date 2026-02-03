"use client";

import React from 'react';
import { Badge } from '@/components/ui';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { CompleteStepProps } from './types';

export function CompleteStep({ report }: CompleteStepProps) {
  if (!report) return null;

  const hasErrors = report.errors && report.errors.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        {hasErrors ? (
          <ExclamationTriangleIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        ) : (
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        )}
        <h3 className="text-xl font-semibold text-gray-900">
          {hasErrors ? 'Offboarding completed with warnings' : 'Offboarding complete'}
        </h3>
        <p className="text-gray-500 mt-1">
          {report.userName} has been offboarded from the organization
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Access revoked</span>
          <Badge variant={report.accessRevoked ? 'success' : 'danger'}>
            {report.accessRevoked ? 'Yes' : 'No'}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Tasks reassigned</span>
          <span className="font-medium text-gray-900">{report.tasksReassigned}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Projects transferred</span>
          <span className="font-medium text-gray-900">{report.projectsTransferred}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Data archived</span>
          <Badge variant={report.dataArchived ? 'success' : 'default'}>
            {report.dataArchived ? 'Yes' : 'No'}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Completed at</span>
          <span className="text-sm text-gray-900">
            {format(new Date(report.completedAt), 'MMM d, yyyy h:mm a')}
          </span>
        </div>
      </div>

      {/* Errors */}
      {hasErrors && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Warnings</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            {report.errors!.map((err, i) => (
              <li key={i}>- {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Restore notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <CalendarIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">30-day restoration window</p>
          <p className="text-sm text-blue-700 mt-1">
            This user can be restored within 30 days from the Team Settings page.
            After that, the offboarding becomes permanent.
          </p>
        </div>
      </div>
    </div>
  );
}
