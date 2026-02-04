"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Email Templates Settings - Redirects to Templates
 *
 * Email templates are now managed in the consolidated Templates page
 * under the "Email" tab.
 */
export default function EmailTemplatesPage() {
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
