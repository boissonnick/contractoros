"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useReports, LaborCostData, ProjectPnLData, ProductivityData } from '@/lib/hooks/useReports';
import ReportDatePicker from '@/components/reports/ReportDatePicker';
import ReportExport from '@/components/reports/ReportExport';
import LaborCostReport from '@/components/reports/LaborCostReport';
import ProjectPnLReport from '@/components/reports/ProjectPnLReport';
import TeamProductivityReport from '@/components/reports/TeamProductivityReport';
import PayrollPreviewReport from '@/components/reports/PayrollPreviewReport';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type Tab = 'labor' | 'pnl' | 'productivity' | 'payroll';

function getPresetDates(preset: string): { start: Date; end: Date } {
  const now = new Date();
  switch (preset) {
    case 'This Week': {
      const s = new Date(now);
      s.setDate(s.getDate() - s.getDay() + 1);
      s.setHours(0, 0, 0, 0);
      return { start: s, end: now };
    }
    case 'This Month': {
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    }
    case 'Last Month': {
      return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) };
    }
    case 'This Year': {
      return { start: new Date(now.getFullYear(), 0, 1), end: now };
    }
    default:
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  }
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const { loading, fetchLaborCosts, fetchProjectPnL, fetchProductivity } = useReports(profile?.orgId);
  const [tab, setTab] = useState<Tab>('labor');
  const [startDate, setStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(() => new Date());
  const [laborData, setLaborData] = useState<LaborCostData[]>([]);
  const [pnlData, setPnlData] = useState<ProjectPnLData[]>([]);
  const [productivityData, setProductivityData] = useState<ProductivityData[]>([]);

  useEffect(() => {
    if (!profile?.orgId) return;
    if (tab === 'labor') fetchLaborCosts(startDate, endDate).then(setLaborData);
    if (tab === 'pnl') fetchProjectPnL(startDate, endDate).then(setPnlData);
    if (tab === 'productivity') fetchProductivity(startDate, endDate).then(setProductivityData);
  }, [tab, startDate, endDate, profile?.orgId, fetchLaborCosts, fetchProjectPnL, fetchProductivity]);

  const handlePreset = (preset: string) => {
    const { start, end } = getPresetDates(preset);
    setStartDate(start);
    setEndDate(end);
  };

  const exportData: Record<string, unknown>[] = tab === 'labor'
    ? laborData.map(d => ({ Employee: d.userName, Project: d.projectName, Hours: (d.totalMinutes / 60).toFixed(1), Cost: d.totalCost.toFixed(2) }))
    : tab === 'pnl'
    ? pnlData.map(d => ({ Project: d.projectName, Budget: d.budget, Actual: d.actualSpend, Labor: d.laborCost, Variance: d.variance }))
    : tab === 'payroll'
    ? []
    : productivityData.map(d => ({ Member: d.userName, Tasks: d.tasksTotal, Completed: d.tasksCompleted, Hours: d.totalHours.toFixed(1), 'Completion %': d.completionRate.toFixed(0) }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Analyze project performance, labor costs, and team productivity.</p>
        </div>
        <ReportExport data={exportData} filename={`${tab}-report`} />
      </div>

      <ReportDatePicker startDate={startDate} endDate={endDate} onChangeStart={setStartDate} onChangeEnd={setEndDate} onPreset={handlePreset} />

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
