"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useReports, LaborCostData, ProjectPnLData, ProductivityData } from '@/lib/hooks/useReports';
import ReportExport from '@/components/reports/ReportExport';
import LaborCostReport from '@/components/reports/LaborCostReport';
import ProjectPnLReport from '@/components/reports/ProjectPnLReport';
import TeamProductivityReport from '@/components/reports/TeamProductivityReport';
import PayrollPreviewReport from '@/components/reports/PayrollPreviewReport';
import Card from '@/components/ui/Card';
import { DateRangePresets, DatePresetValue } from '@/components/ui/DateRangePresets';
import { cn } from '@/lib/utils';

type Tab = 'labor' | 'pnl' | 'productivity' | 'payroll';

export default function DetailedReportsPage() {
  const { profile } = useAuth();
  const { loading, fetchLaborCosts, fetchProjectPnL, fetchProductivity } = useReports(profile?.orgId);
  const [tab, setTab] = useState<Tab>('labor');
  const [startDate, setStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(() => new Date());
  const [selectedPreset, setSelectedPreset] = useState<DatePresetValue | null>('this_month');
  const [laborData, setLaborData] = useState<LaborCostData[]>([]);
  const [pnlData, setPnlData] = useState<ProjectPnLData[]>([]);
  const [productivityData, setProductivityData] = useState<ProductivityData[]>([]);

  useEffect(() => {
    if (!profile?.orgId) return;
    if (tab === 'labor') fetchLaborCosts(startDate, endDate).then(setLaborData);
    if (tab === 'pnl') fetchProjectPnL(startDate, endDate).then(setPnlData);
    if (tab === 'productivity') fetchProductivity(startDate, endDate).then(setProductivityData);
  }, [tab, startDate, endDate, profile?.orgId, fetchLaborCosts, fetchProjectPnL, fetchProductivity]);

  const handlePresetSelect = (range: { start: Date; end: Date; label: string }) => {
    setStartDate(range.start);
    setEndDate(range.end);
    // Map label back to preset value
    const presetMap: Record<string, DatePresetValue> = {
      'Today': 'today',
      'Yesterday': 'yesterday',
      'This Week': 'this_week',
      'Last Week': 'last_week',
      'This Month': 'this_month',
      'Last Month': 'last_month',
      'This Quarter': 'this_quarter',
      'Last Quarter': 'last_quarter',
      'This Year': 'this_year',
      'Last Year': 'last_year',
      'Last 7 Days': 'last_7_days',
      'Last 30 Days': 'last_30_days',
      'Last 90 Days': 'last_90_days',
    };
    setSelectedPreset(presetMap[range.label] || null);
  };

  const handleStartDateChange = (d: Date) => {
    setStartDate(d);
    setSelectedPreset(null);
  };

  const handleEndDateChange = (d: Date) => {
    setEndDate(d);
    setSelectedPreset(null);
  };

  const exportData: Record<string, unknown>[] = tab === 'labor'
    ? laborData.map(d => ({ Employee: d.userName, Project: d.projectName, Hours: (d.totalMinutes / 60).toFixed(1), Cost: d.totalCost.toFixed(2) }))
    : tab === 'pnl'
    ? pnlData.map(d => ({ Project: d.projectName, Budget: d.budget, Actual: d.actualSpend, Labor: d.laborCost, Variance: d.variance }))
    : tab === 'payroll'
    ? []
    : productivityData.map(d => ({ Member: d.userName, Tasks: d.tasksTotal, Completed: d.tasksCompleted, Hours: d.totalHours.toFixed(1), 'Completion %': d.completionRate.toFixed(0) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Analyze project performance, labor costs, and team productivity with date filtering.</p>
        </div>
        <ReportExport data={exportData} filename={`${tab}-report`} />
      </div>

      {/* Date Range Selection */}
      <div className="space-y-3">
        <DateRangePresets
          presets="extended"
          selectedPreset={selectedPreset}
          onSelect={handlePresetSelect}
          layout="scroll"
          variant="pills"
          size="sm"
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => handleStartDateChange(new Date(e.target.value + 'T00:00:00'))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={endDate.toISOString().split('T')[0]}
              onChange={(e) => handleEndDateChange(new Date(e.target.value + 'T23:59:59'))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        {([['labor', 'Labor Costs'], ['pnl', 'Project P&L'], ['productivity', 'Team Productivity'], ['payroll', 'Payroll Preview']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px', tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500')}>{label}</button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            {tab === 'labor' && <LaborCostReport data={laborData} />}
            {tab === 'pnl' && <ProjectPnLReport data={pnlData} />}
            {tab === 'productivity' && <TeamProductivityReport data={productivityData} />}
            {tab === 'payroll' && <PayrollPreviewReport startDate={startDate} endDate={endDate} />}
          </>
        )}
      </Card>
    </div>
  );
}
