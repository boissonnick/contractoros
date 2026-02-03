"use client";

import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';

// Loading skeleton for AI Providers page
function AIProvidersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10" rounded="lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-6 w-32" rounded="full" />
      </div>

      {/* Tab navigation skeleton */}
      <Skeleton className="h-10 w-72" rounded="lg" />

      {/* Info card skeleton */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>

      {/* Section header skeleton */}
      <Skeleton className="h-4 w-32" />

      {/* Provider cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12" rounded="lg" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-24" rounded="full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" rounded="sm" />
                  <Skeleton className="h-5 w-20" rounded="sm" />
                  <Skeleton className="h-5 w-14" rounded="sm" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" rounded="md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Dynamic import of the heavy AI Providers content
const AIProvidersContent = dynamic(
  () => import('@/components/settings/AIProvidersContent'),
  {
    loading: () => <AIProvidersLoadingSkeleton />,
    ssr: false
  }
);

export default function AIProvidersPage() {
  return <AIProvidersContent />;
}
