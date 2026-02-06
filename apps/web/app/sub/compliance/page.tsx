"use client";

import React from 'react';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/ui';
import ComplianceVault from '@/components/sub-portal/ComplianceVault';
import { SectionErrorBoundary } from '@/components/ui/SectionErrorBoundary';

export default function SubCompliancePage() {
  const { user } = useAuth();

  if (!user?.uid) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Documents"
        description="Upload and manage your insurance, licenses, and certifications"
      />

      <SectionErrorBoundary sectionName="Compliance Vault">
        <ComplianceVault subcontractorId={user.uid} />
      </SectionErrorBoundary>
    </div>
  );
}
