"use client";

import React from 'react';
import { useAuth } from '@/lib/auth';
import { useOperationalReports } from '@/lib/hooks/useReports';
import { Card } from '@/components/ui';
import {
  BarChartCard,
  PieChartCard,
} from '@/components/charts';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

function StatCard({ title, value, icon: Icon, subtitle, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 truncate">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-[300px] bg-gray-100 rounded" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function OperationalReportsPage() {
  const { profile } = useAuth();
  const {
    loading,
    error,
    metrics,
    projectTimelines,
    tasksByStatus,
    hoursbyProject,
  } = useOperationalReports(profile?.orgId);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Failed to load operational data</h3>
        <p className="text-gray-500 mt-1">{error.message}</p>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-8 text-center">
        <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No operational data available</h3>
        <p className="text-gray-500 mt-1">Start tracking projects and tasks to see operational metrics.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Operational KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg Project Duration"
          value={`${formatNumber(metrics.averageProjectDuration)} days`}
          icon={CalendarDaysIcon}
          color="blue"
        />
        <StatCard
          title="On-Time Completion"
          value={formatPercent(metrics.onTimeCompletionRate)}
          icon={CheckCircleIcon}
          color={metrics.onTimeCompletionRate >= 80 ? 'green' : metrics.onTimeCompletionRate >= 60 ? 'amber' : 'red'}
        />
        <StatCard
          title="Active Subcontractors"
          value={metrics.activeSubcontractors}
          icon={UserGroupIcon}
          color="purple"
        />
        <StatCard
          title="Pending Change Orders"
          value={metrics.pendingChangeOrders}
          icon={DocumentTextIcon}
          color={metrics.pendingChangeOrders > 5 ? 'red' : metrics.pendingChangeOrders > 0 ? 'amber' : 'green'}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Avg Tasks Per Project"
          value={formatNumber(metrics.averageTasksPerProject)}
          icon={ClockIcon}
          color="blue"
          subtitle="Average task load per project"
        />
        <StatCard
          title="Resource Utilization"
          value={metrics.resourceUtilization > 0 ? formatPercent(metrics.resourceUtilization) : 'N/A'}
          icon={UserGroupIcon}
          color="purple"
          subtitle="Team capacity usage"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tasksByStatus.length > 0 && (
          <PieChartCard
            title="Tasks by Status"
            subtitle="Current task distribution"
            data={tasksByStatus}
            dataKey="value"
            nameKey="name"
            showLabels
          />
        )}
        {hoursbyProject.length > 0 && (
          <BarChartCard
            title="Hours by Project"
            subtitle="Time logged per project"
            data={hoursbyProject}
            dataKeys={['hours']}
            xAxisKey="name"
            horizontal
            config={{ colors: ['#3B82F6'] }}
          />
        )}
      </div>

      {/* Project Timeline Comparison */}
      {projectTimelines.length > 0 && (
        <Card className="p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Active Project Timelines</h3>
            <p className="text-xs text-gray-500 mt-0.5">Planned vs actual duration (days)</p>
          </div>
          <div className="space-y-4">
            {projectTimelines.map((project, idx) => {
              const isOverdue = project.actual > project.planned && project.planned > 0;
              const progressPercent = project.planned > 0
                ? Math.min((project.actual / project.planned) * 100, 150)
                : 0;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{project.name}</span>
                    <span className={cn(
                      'text-xs font-medium',
                      isOverdue ? 'text-red-600' : 'text-gray-600'
                    )}>
                      {project.actual} / {project.planned > 0 ? project.planned : '?'} days
                      {isOverdue && ` (+${project.actual - project.planned} over)`}
                    </span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    {/* Planned marker */}
                    {project.planned > 0 && (
                      <div
                        className="absolute top-0 h-full w-0.5 bg-gray-400 z-10"
                        style={{ left: `${Math.min((project.planned / Math.max(project.actual, project.planned)) * 100, 100)}%` }}
                      />
                    )}
                    {/* Actual progress */}
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        isOverdue ? 'bg-red-500' : progressPercent > 80 ? 'bg-amber-500' : 'bg-green-500'
                      )}
                      style={{ width: `${progressPercent > 100 ? 100 : progressPercent}%` }}
                    />
                    {/* Overflow indicator */}
                    {progressPercent > 100 && (
                      <div
                        className="absolute right-0 top-0 h-full bg-red-300 opacity-50"
                        style={{ width: `${Math.min(progressPercent - 100, 50)}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-gray-400" /> Planned completion
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500" /> On track
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-500" /> Near deadline
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500" /> Overdue
            </span>
          </div>
        </Card>
      )}

      {/* Task Status Details */}
      {tasksByStatus.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Task Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {tasksByStatus.map((status) => (
              <div
                key={status.name}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <p className="text-xs font-medium text-gray-500">{status.name}</p>
                </div>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {status.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {tasksByStatus.reduce((sum, s) => sum + s.value, 0) > 0
                    ? `${((status.value / tasksByStatus.reduce((sum, s) => sum + s.value, 0)) * 100).toFixed(0)}%`
                    : '0%'
                  } of total
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
