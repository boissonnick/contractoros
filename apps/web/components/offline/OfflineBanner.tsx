'use client';

import React from 'react';
import { WifiIcon } from '@heroicons/react/24/outline';
import { useOffline } from './OfflineProvider';

/**
 * OfflineBanner
 * Displays a yellow banner when the user is offline
 */
export function OfflineBanner() {
  const { state } = useOffline();

  if (state.isOnline) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="px-4 py-2">
        <div className="flex items-center justify-center gap-2">
          <WifiIcon className="h-5 w-5 text-yellow-600" />
          <p className="text-sm font-medium text-yellow-800">
            You&apos;re offline. Changes will sync when connected.
          </p>
          {state.pendingCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              {state.pendingCount} pending
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for use in headers/toolbars
 */
export function OfflineBadge() {
  const { state } = useOffline();

  if (state.isOnline) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
      <WifiIcon className="h-3 w-3" />
      <span>Offline</span>
    </div>
  );
}
