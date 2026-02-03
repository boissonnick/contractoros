"use client";

// Force dynamic rendering - skip static generation
export const dynamic = 'force-dynamic';

import React from 'react';
import { Card } from '@/components/ui';
import { ClockIcon } from '@heroicons/react/24/outline';

/**
 * Admin Activity Log Page
 *
 * TODO: Implement activity logging functionality
 * - Track admin actions (user invites, role changes, settings updates)
 * - Track user signups and onboarding completions
 * - Track organization-level events
 *
 * Deferred Rationale: Internal admin feature - lower priority than customer-facing features.
 * Target: Post-launch enhancement when audit logging requirements are defined.
 */
export default function AdminActivityPage() {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Log</h1>
      <Card className="text-center py-12">
        <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Activity logging is in development</p>
        <p className="text-sm text-gray-400 mt-1">This will show recent signups, onboarding completions, and admin actions.</p>
      </Card>
    </div>
  );
}
