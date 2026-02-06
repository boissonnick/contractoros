'use client';

import React from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { Card, EmptyState } from '@/components/ui';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Documents</h1>
        <p className="text-gray-500 mt-1">View quotes, change orders, and other project documents</p>
      </div>

      <Card>
        <EmptyState
          icon={<DocumentIcon className="h-12 w-12" />}
          title="No documents yet"
          description="Quotes, change orders, invoices, and other documents will appear here."
        />
      </Card>
    </div>
  );
}
