"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Line Items Settings - Redirects to Templates
 *
 * Line items library is now managed in the consolidated Templates page
 * under the "Line Items" tab.
 */
export default function LineItemsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the consolidated Templates page
    router.replace('/dashboard/settings/templates');
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
