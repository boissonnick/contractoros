"use client";

import React from 'react';
import {
  ArchiveBoxIcon,
  TrashIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { DataHandlingStepProps } from './types';

export function DataHandlingStep({
  options,
  onUpdateOptions,
}: DataHandlingStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Choose how to handle the user&apos;s data and configure notification settings.
      </p>

      {/* Archive data option */}
      <div className="space-y-3">
        <label
          className={cn(
            'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
            options.archiveData
              ? 'border-brand-primary bg-brand-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <input
            type="radio"
            name="dataHandling"
            checked={options.archiveData === true}
            onChange={() => onUpdateOptions({ archiveData: true })}
            className="mt-1 h-4 w-4 text-brand-primary focus:ring-brand-primary/20"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ArchiveBoxIcon className="h-5 w-5 text-brand-primary" />
              <p className="font-medium text-gray-900">Archive data (Recommended)</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Preserve user data for compliance and audit purposes.
              Data will be retained for 7 years as per standard compliance requirements.
            </p>
          </div>
        </label>

        <label
          className={cn(
            'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
            options.archiveData === false
              ? 'border-amber-500 bg-amber-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <input
            type="radio"
            name="dataHandling"
            checked={options.archiveData === false}
            onChange={() => onUpdateOptions({ archiveData: false })}
            className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <TrashIcon className="h-5 w-5 text-amber-600" />
              <p className="font-medium text-gray-900">Skip archiving</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              User data will not be separately archived. Existing records in
              projects will remain intact but user profile will be marked inactive.
            </p>
          </div>
        </label>
      </div>

      {/* Notification toggle */}
      <div className="pt-4 border-t border-gray-200">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900">Send notifications</p>
              <p className="text-sm text-gray-500">
                Notify relevant team members about this offboarding
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={options.sendNotification}
            onClick={() =>
              onUpdateOptions({ sendNotification: !options.sendNotification })
            }
            className={cn(
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-2',
              options.sendNotification ? 'bg-brand-primary' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                options.sendNotification ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </label>
      </div>

      {/* Optional reason */}
      <div className="pt-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reason for offboarding (optional)
        </label>
        <textarea
          value={options.reason || ''}
          onChange={(e) => onUpdateOptions({ reason: e.target.value })}
          placeholder="e.g., Resignation, end of contract, restructuring..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
        />
      </div>
    </div>
  );
}
