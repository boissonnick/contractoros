'use client';

import React, { useState, useCallback } from 'react';
import { BottomNavigationWithMenu } from './BottomNavigation';
import { QuickActionsFAB } from './QuickActionsFAB';
import { PullToRefresh } from './PullToRefresh';

// ============================================================================
// TYPES
// ============================================================================

export interface MobileFieldLayoutProps {
  /** Children to render */
  children: React.ReactNode;
  /** Callback for pull-to-refresh */
  onRefresh?: () => Promise<void>;
  /** Whether to show the FAB */
  showFAB?: boolean;
  /** Whether to show bottom navigation */
  showBottomNav?: boolean;
  /** Whether pull-to-refresh is enabled */
  enablePullToRefresh?: boolean;
  /** Callback when a quick action is selected */
  onQuickAction?: (actionId: string) => void;
  /** Additional CSS classes for the content area */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Bottom navigation height + safe area
const BOTTOM_NAV_HEIGHT = 64;
const FAB_BOTTOM_OFFSET = BOTTOM_NAV_HEIGHT + 16;

// ============================================================================
// COMPONENT
// ============================================================================

export function MobileFieldLayout({
  children,
  onRefresh,
  showFAB = true,
  showBottomNav = true,
  enablePullToRefresh = true,
  onQuickAction,
  className = '',
}: MobileFieldLayoutProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const content = (
    <div
      className={`
        min-h-screen bg-gray-50
        ${showBottomNav ? 'pb-20' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );

  return (
    <>
      {/* Main content with optional pull-to-refresh */}
      {enablePullToRefresh && onRefresh ? (
        <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
          {content}
        </PullToRefresh>
      ) : (
        content
      )}

      {/* Quick Actions FAB (mobile only) */}
      {showFAB && (
        <QuickActionsFAB
          bottomOffset={showBottomNav ? FAB_BOTTOM_OFFSET : 16}
          onAction={onQuickAction}
        />
      )}

      {/* Bottom Navigation (mobile only) */}
      {showBottomNav && <BottomNavigationWithMenu />}
    </>
  );
}

// ============================================================================
// PAGE WRAPPER COMPONENT
// ============================================================================

export interface FieldPageWrapperProps {
  /** Page title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Children to render */
  children: React.ReactNode;
  /** Callback for pull-to-refresh */
  onRefresh?: () => Promise<void>;
  /** Whether to show the FAB */
  showFAB?: boolean;
  /** Right side actions for the header */
  headerActions?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function FieldPageWrapper({
  title,
  subtitle,
  children,
  onRefresh,
  showFAB = true,
  headerActions,
  className = '',
}: FieldPageWrapperProps) {
  return (
    <MobileFieldLayout
      onRefresh={onRefresh}
      showFAB={showFAB}
      enablePullToRefresh={!!onRefresh}
      className={className}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="p-4">
        {children}
      </div>
    </MobileFieldLayout>
  );
}

export default MobileFieldLayout;
