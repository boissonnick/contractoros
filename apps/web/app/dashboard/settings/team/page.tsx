"use client";

import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';

// Loading skeleton for Team page
function TeamLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28" rounded="md" />
      </div>

      {/* Tab navigation skeleton */}
      <div className="border-b border-gray-200 pb-3">
        <div className="flex gap-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4">
            <Skeleton className="h-4 w-12 col-span-4" />
            <Skeleton className="h-4 w-10 col-span-2" />
            <Skeleton className="h-4 w-12 col-span-2" />
            <Skeleton className="h-4 w-12 col-span-2" />
            <Skeleton className="h-4 w-14 col-span-2 ml-auto" />
          </div>
        </div>

        {/* Table rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-3 grid grid-cols-12 gap-4 items-center border-b border-gray-100 last:border-0">
            <div className="col-span-4 flex items-center gap-3">
              <Skeleton className="h-9 w-9" rounded="full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="col-span-2">
              <Skeleton className="h-5 w-20" rounded="full" />
            </div>
            <div className="col-span-2">
              <Skeleton className="h-5 w-14" rounded="full" />
            </div>
            <div className="col-span-2">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="col-span-2 flex justify-end gap-1">
              <Skeleton className="h-7 w-7" />
              <Skeleton className="h-7 w-7" />
            </div>
          </div>
        ))}
      </div>

      {/* Role permissions card skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
              <Skeleton className="h-5 w-24" rounded="full" />
              <Skeleton className="h-4 w-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Dynamic import of the heavy Team content
const TeamContent = dynamic(
  () => import('@/components/settings/TeamContent'),
  {
    loading: () => <TeamLoadingSkeleton />,
    ssr: false
  }
);

export default function TeamSettingsPage() {
  return <TeamContent />;
}
