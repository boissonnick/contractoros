'use client';

import React, { useState } from 'react';
import { ImpersonationSelector } from '@/components/impersonation';
import { useImpersonation } from '@/lib/contexts/ImpersonationContext';
import { WrenchScrewdriverIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// These are set at build time
const BUILD_VERSION = process.env.NEXT_PUBLIC_BUILD_VERSION || 'dev';
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

/**
 * SidebarDevTools - Impersonation and version info for the sidebar
 * Displayed above the user profile in the left navigation
 */
export default function SidebarDevTools() {
  const [expanded, setExpanded] = useState(false);
  const { canImpersonate } = useImpersonation();

  // Don't render if user can't impersonate and we're just showing version
  // (version alone doesn't need to take sidebar space for non-admins)
  if (!canImpersonate) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header with expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <WrenchScrewdriverIcon className="h-4 w-4" />
          <span>Dev Tools</span>
        </div>
        {expanded ? (
          <ChevronUpIcon className="h-3.5 w-3.5" />
        ) : (
          <ChevronDownIcon className="h-3.5 w-3.5" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3">
          {/* Impersonation Selector */}
          {canImpersonate && (
            <div>
              <ImpersonationSelector variant="sidebar" />
            </div>
          )}

          {/* Version Info */}
          <div className="bg-gray-100 rounded-md px-2.5 py-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-600">Build:</span>
              <span className="text-gray-900 font-medium">{BUILD_VERSION.slice(0, 7)}</span>
            </div>
            <div className="mt-1 text-gray-500 text-[10px]">
              {new Date(BUILD_TIME).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Collapsed state - just show version badge */}
      {!expanded && (
        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span>v{BUILD_VERSION.slice(0, 7)}</span>
        </div>
      )}
    </div>
  );
}
