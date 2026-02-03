"use client";

import React from 'react';
import { Badge } from '@/components/ui';
import {
  UserIcon,
  FolderIcon,
  ArchiveBoxIcon,
  BellIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { ReviewStepProps } from './types';

export function ReviewStep({
  targetUser,
  options,
  reassignToUser,
  impactPreview,
  error,
}: ReviewStepProps) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Offboarding failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        {/* User */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 text-gray-600">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm">User to offboard</span>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900">{targetUser.name}</p>
            <p className="text-sm text-gray-500">{targetUser.email}</p>
          </div>
        </div>

        {/* Reassignment */}
        <div className="flex justify-between items-start pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <FolderIcon className="h-4 w-4" />
            <span className="text-sm">Work reassigned to</span>
          </div>
          <div className="text-right">
            {reassignToUser ? (
              <p className="font-medium text-gray-900">{reassignToUser.name}</p>
            ) : (
              <p className="text-gray-500">No reassignment</p>
            )}
            {impactPreview && (
              <p className="text-xs text-gray-500">
                {impactPreview.taskCount} tasks, {impactPreview.projectCount} projects
              </p>
            )}
          </div>
        </div>

        {/* Data handling */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <ArchiveBoxIcon className="h-4 w-4" />
            <span className="text-sm">Data archiving</span>
          </div>
          <Badge variant={options.archiveData ? 'success' : 'default'}>
            {options.archiveData ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {/* Notifications */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <BellIcon className="h-4 w-4" />
            <span className="text-sm">Notifications</span>
          </div>
          <Badge variant={options.sendNotification ? 'success' : 'default'}>
            {options.sendNotification ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {/* Reason */}
        {options.reason && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DocumentTextIcon className="h-4 w-4" />
              <span className="text-sm">Reason</span>
            </div>
            <p className="text-sm text-gray-900">{options.reason}</p>
          </div>
        )}
      </div>

      {/* Final warning */}
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <ShieldCheckIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">
            This action will immediately revoke access
          </p>
          <p className="text-sm text-red-700 mt-1">
            The user will no longer be able to sign in. You have 30 days to
            restore their access if needed.
          </p>
        </div>
      </div>
    </div>
  );
}
