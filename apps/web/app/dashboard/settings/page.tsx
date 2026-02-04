"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Settings root page - redirects to Templates
 *
 * The Settings module is organized into 7 logical groups accessible via the nav dropdown:
 * 1. Account (Profile, Sessions)
 * 2. Organization (Company Info, Team, Roles)
 * 3. Finance (Payroll, Tax Rates, Billing, Numbering)
 * 4. Templates (Quote PDF, SOW, Phases, Email, SMS, Line Items)
 * 5. Notifications (Preferences, Email History)
 * 6. Integrations (QuickBooks, Stripe, Gusto)
 * 7. Advanced (Data Export/Import, Audit Logs, Security, AI Assistant)
 *
 * Since the root settings page previously showed Phase Templates,
 * we redirect to the consolidated Templates page where Phases now lives.
 */
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Templates page - Phase Templates is now a tab there
    router.replace('/dashboard/settings/templates');
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
