"use client";

import React from 'react';
import { Badge } from '@/components/ui';
import {
  ExclamationTriangleIcon,
  UserIcon,
  FolderIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { ConfirmStepProps } from './types';

export function ConfirmStep({ targetUser, impactPreview }: ConfirmStepProps) {
  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">
            You are about to offboard this user
          </p>
          <p className="text-sm text-amber-700 mt-1">
            This action will revoke their access, and optionally reassign their work
            and archive their data. This can be reversed within 30 days.
          </p>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{targetUser.name}</p>
            <p className="text-sm text-gray-500">{targetUser.email}</p>
            <Badge variant="default" className="mt-1">
              {targetUser.role}
            </Badge>
          </div>
        </div>
      </div>

      {/* Impact preview */}
      {impactPreview && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Impact Summary</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
              <FolderIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">{impactPreview.taskCount}</p>
                <p className="text-xs text-gray-500">Tasks assigned</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">{impactPreview.projectCount}</p>
                <p className="text-xs text-gray-500">Projects managed</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
              <ClockIcon className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">{impactPreview.timeEntryCount}</p>
                <p className="text-xs text-gray-500">Time entries</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
              <CurrencyDollarIcon className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">{impactPreview.expenseCount}</p>
                <p className="text-xs text-gray-500">Expenses submitted</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
