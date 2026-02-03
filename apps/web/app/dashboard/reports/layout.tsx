"use client";

import React from 'react';

/**
 * Reports Layout
 *
 * Navigation for reports is now handled by the main sidebar in dashboard/layout.tsx.
 * This layout provides a simple wrapper for report content.
 *
 * Report sub-pages:
 * - /dashboard/reports (Overview)
 * - /dashboard/reports/financial (Financial Reports)
 * - /dashboard/reports/operational (Operational Reports)
 * - /dashboard/reports/detailed (Detailed Reports)
 */
export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
