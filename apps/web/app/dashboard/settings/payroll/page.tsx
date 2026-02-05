"use client";

import React from 'react';
import { usePayrollConfig } from '@/lib/hooks/usePayrollConfig';
import PayrollConfigForm from '@/components/settings/PayrollConfigForm';
import IntegrationStubs from '@/components/settings/IntegrationStubs';
import Card from '@/components/ui/Card';

export default function PayrollSettingsPage() {
  const { config, loading, saveConfig } = usePayrollConfig();

  if (loading) {
    return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-heading tracking-tight">Payroll Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure pay periods, rates, overtime rules, and integrations.</p>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Payroll Configuration</h3>
        <PayrollConfigForm config={config} onSave={saveConfig} />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Integrations</h3>
        <p className="text-xs text-gray-500 mb-4">Connect external payroll and accounting tools.</p>
        <IntegrationStubs />
      </Card>
    </div>
  );
}
