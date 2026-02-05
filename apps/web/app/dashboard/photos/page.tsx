'use client';

import React from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { Card, EmptyState } from '@/components/ui';

export default function PhotosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-heading tracking-tight">Project Photos</h1>
        <p className="text-gray-500 mt-1">View progress photos from all your projects</p>
      </div>

      <Card>
        <EmptyState
          icon={<PhotoIcon className="h-12 w-12" />}
          title="No photos yet"
          description="Photos from your projects will appear here as work progresses."
        />
      </Card>
    </div>
  );
}
