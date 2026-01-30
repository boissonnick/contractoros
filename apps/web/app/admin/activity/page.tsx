"use client";

// Force dynamic rendering - skip static generation
export const dynamic = 'force-dynamic';

import React from 'react';
import { Card } from '@/components/ui';
import { ClockIcon } from '@heroicons/react/24/outline';

export default function AdminActivityPage() {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Log</h1>
      <Card className="text-center py-12">
        <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Activity logging coming soon</p>
        <p className="text-sm text-gray-400 mt-1">This will show recent signups, onboarding completions, and admin actions.</p>
      </Card>
    </div>
  );
}
