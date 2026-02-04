"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * AI Intelligence Settings - Redirects to AI Assistant
 *
 * This page previously contained AI Intelligence settings (price suggestions,
 * material alerts, bid analysis). These features have been consolidated into
 * the main AI Assistant settings page for a unified AI configuration experience.
 */
export default function IntelligenceSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the consolidated AI Assistant settings page
    router.replace('/dashboard/settings/assistant');
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
