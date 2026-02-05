'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Widget } from '@/lib/dashboard-widgets/types';
import { useFirestoreCollection } from '@/lib/hooks/useFirestoreCollection';
import { useAuth } from '@/lib/auth';
import { Project, ProjectStatus } from '@/types';
import { DocumentData } from 'firebase/firestore';

interface ProjectStatusWidgetProps {
  widget: Widget;
}

// Status colors
const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string; bar: string }> = {
  lead: { bg: 'bg-purple-100', text: 'text-purple-600', bar: 'bg-purple-400' },
  bidding: { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-400' },
  planning: { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-400' },
  active: { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' },
  on_hold: { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-400' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-700', bar: 'bg-gray-500' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-400' },
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  lead: 'Lead',
  bidding: 'Bidding',
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function ProjectStatusWidget({ widget: _widget }: ProjectStatusWidgetProps) {
  const router = useRouter();
  const { profile } = useAuth();

  const { items: projects, loading } = useFirestoreCollection<Project>({
    path: profile?.orgId ? `organizations/${profile.orgId}/projects` : '',
    converter: (id: string, data: DocumentData) => ({ id, ...data } as Project),
    enabled: !!profile?.orgId,
  });

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts: Record<ProjectStatus, number> = {
      lead: 0,
      bidding: 0,
      planning: 0,
      active: 0,
      on_hold: 0,
      completed: 0,
      cancelled: 0,
    };

    if (!projects) return counts;

    projects.forEach((project) => {
      const status = project.status as ProjectStatus;
      if (status in counts) {
        counts[status]++;
      }
    });

    return counts;
  }, [projects]);

  const totalProjects = projects?.length || 0;

  // Handle status click - navigate to projects with filter
  const handleStatusClick = (status: ProjectStatus) => {
    router.push(`/dashboard/projects?status=${status}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 bg-gray-200 rounded flex-1" />
            <div className="h-4 w-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Filter to only show statuses with counts > 0
  const displayStatuses = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  if (totalProjects === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">No projects yet</p>
        <button
          onClick={() => router.push('/dashboard/projects/new')}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Create your first project
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total count */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{totalProjects}</span>
        <span className="text-sm text-gray-500">total projects</span>
      </div>

      {/* Status bars */}
      <div className="space-y-2">
        {displayStatuses.map(([status, count]) => {
          const colors = STATUS_COLORS[status as ProjectStatus];
          const percentage = totalProjects > 0 ? (count / totalProjects) * 100 : 0;

          return (
            <button
              key={status}
              onClick={() => handleStatusClick(status as ProjectStatus)}
              className="w-full text-left group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  {STATUS_LABELS[status as ProjectStatus]}
                </span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.bar} rounded-full transition-all group-hover:opacity-80`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>{statusCounts.active} active</span>
        <span>{statusCounts.completed} completed</span>
      </div>
    </div>
  );
}

export default ProjectStatusWidget;
