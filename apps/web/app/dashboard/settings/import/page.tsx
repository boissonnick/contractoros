'use client';

import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';

// Loading skeleton for Import page
function ImportLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Card skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-6">
          {/* Step header */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>

          {/* Import target cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-2 border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10" rounded="lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div />
            <Skeleton className="h-10 w-28" rounded="md" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamic import of the heavy Import content
const ImportContent = dynamic(
  () => import('@/components/settings/ImportContent'),
  {
    loading: () => <ImportLoadingSkeleton />,
    ssr: false
  }
);

export default function ImportPage() {
  return <ImportContent />;
}
