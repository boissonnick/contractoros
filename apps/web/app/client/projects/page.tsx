"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, Badge, EmptyState } from '@/components/ui';
import { SkeletonProjectCard } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowRightIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/date-utils';

// Project status configuration for display
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  planning: { label: 'Planning', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  active: { label: 'In Progress', color: 'text-green-600', bgColor: 'bg-green-100' },
  on_hold: { label: 'On Hold', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  completed: { label: 'Completed', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100' },
};

// Extended project type with task progress info
interface ClientProject {
  id: string;
  name: string;
  status: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  completedTaskCount?: number;
  totalTaskCount?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export default function ClientProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function loadProjects() {
      if (!user?.uid) return;

      try {
        const projectsSnap = await getDocs(
          query(
            collection(db, 'projects'),
            where('clientId', '==', user.uid),
            orderBy('createdAt', 'desc')
          )
        );

        const projectsData = await Promise.all(
          projectsSnap.docs.map(async (d) => {
            const data = d.data();
            const project: ClientProject = {
              id: d.id,
              name: data.name || 'Untitled Project',
              status: data.status || 'planning',
              address: data.address,
              startDate: data.startDate?.toDate?.() ?? undefined,
              endDate: data.endDate?.toDate?.() ?? undefined,
              progress: data.progress,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() ?? undefined,
            };

            // Try to get task counts for progress calculation
            try {
              const tasksSnap = await getDocs(
                collection(db, 'projects', d.id, 'tasks')
              );
              const tasks = tasksSnap.docs.map((t) => t.data());
              project.totalTaskCount = tasks.length;
              project.completedTaskCount = tasks.filter(
                (t) => t.status === 'completed'
              ).length;
            } catch {
              // If we can't access tasks, we'll just skip progress
            }

            return project;
          })
        );

        setProjects(projectsData);
      } catch (err) {
        console.error('Error loading projects:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [user?.uid]);

  // Filter projects by status
  const filtered = useMemo(() => {
    if (statusFilter === 'all') return projects;
    return projects.filter((p) => p.status === statusFilter);
  }, [projects, statusFilter]);

  // Calculate project stats
  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === 'active').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    return { total: projects.length, active, completed };
  }, [projects]);

  // Calculate progress percentage
  const getProgress = (project: ClientProject): number => {
    // First check if project has explicit progress
    if (typeof project.progress === 'number') {
      return project.progress;
    }
    // Then check task-based progress
    if (project.totalTaskCount && project.totalTaskCount > 0) {
      return Math.round(
        ((project.completedTaskCount || 0) / project.totalTaskCount) * 100
      );
    }
    // Default based on status
    if (project.status === 'completed') return 100;
    if (project.status === 'planning') return 0;
    return 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Projects</h1>
          <p className="text-gray-500 mt-1">View the status and progress of your construction projects</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonProjectCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Projects</h1>
        <p className="text-gray-500 mt-1">
          View the status and progress of your construction projects
        </p>
      </div>

      {/* Stats Summary */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                <HomeIcon className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                <ClockIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.active}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                <CheckCircleIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{stats.completed}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {stats.total > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <FunnelIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'planning', label: 'Planning' },
            { key: 'completed', label: 'Completed' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                statusFilter === key
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<HomeIcon className="h-full w-full" />}
          title={projects.length === 0 ? "No projects yet" : "No projects found"}
          description={
            projects.length === 0
              ? "Your contractor will add projects here when work begins on your property."
              : "Try adjusting your filter to see more projects."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
            const progress = getProgress(project);

            return (
              <Link
                key={project.id}
                href={`/client/projects/${project.id}`}
                className="block"
              >
                <Card hover className="h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {project.name}
                      </h3>
                      {project.address && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {project.address.city}, {project.address.state}
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge
                      className={cn('flex-shrink-0 ml-2', statusConfig.bgColor, statusConfig.color)}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-900">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          progress >= 100 ? 'bg-green-500' :
                          progress >= 50 ? 'bg-blue-500' : 'bg-blue-400'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {project.totalTaskCount !== undefined && project.totalTaskCount > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {project.completedTaskCount || 0} of {project.totalTaskCount} tasks completed
                      </p>
                    )}
                  </div>

                  {/* Dates */}
                  {(project.startDate || project.endDate) && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                      <CalendarIcon className="h-4 w-4" />
                      {project.startDate && (
                        <span>
                          {formatDate(project.startDate)}
                          {project.endDate && ' - '}
                        </span>
                      )}
                      {project.endDate && <span>{formatDate(project.endDate)}</span>}
                    </div>
                  )}

                  {/* View Details Link */}
                  <div className="flex items-center justify-end text-sm text-blue-600 font-medium">
                    <span>View Details</span>
                    <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
