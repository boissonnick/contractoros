"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Card, Badge } from '@/components/ui';
import { SkeletonProjectCard } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import {
  MapPinIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ListBulletIcon,
  SwatchIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

// Project status configuration for display
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  planning: { label: 'Planning', color: 'text-blue-700', bgColor: 'bg-blue-50', dotColor: 'bg-blue-500' },
  active: { label: 'In Progress', color: 'text-green-700', bgColor: 'bg-green-50', dotColor: 'bg-green-500' },
  on_hold: { label: 'On Hold', color: 'text-yellow-700', bgColor: 'bg-yellow-50', dotColor: 'bg-yellow-500' },
  completed: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-50', dotColor: 'bg-gray-500' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-50', dotColor: 'bg-red-500' },
};

interface ProjectDetail {
  id: string;
  name: string;
  status: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  createdAt: Date;
}

interface ProjectPhase {
  id: string;
  name: string;
  status: string;
  order: number;
}

export default function ClientProjectDetailPage() {
  const params = useParams();
  const _router = useRouter();
  const { user } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProject() {
      if (!user?.uid || !projectId) return;

      try {
        // Load project
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          setError('Project not found');
          setLoading(false);
          return;
        }

        const data = projectDoc.data();

        // Verify client has access to this project
        if (data.clientId !== user.uid) {
          setError('Access denied');
          setLoading(false);
          return;
        }

        setProject({
          id: projectDoc.id,
          name: data.name || 'Untitled Project',
          status: data.status || 'planning',
          description: data.description,
          address: data.address,
          startDate: data.startDate?.toDate?.() ?? undefined,
          endDate: data.endDate?.toDate?.() ?? undefined,
          progress: data.progress,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });

        // Load phases
        try {
          const phasesSnap = await getDocs(collection(db, 'projects', projectId, 'phases'));
          const phasesData = phasesSnap.docs
            .map((d) => ({
              id: d.id,
              name: d.data().name,
              status: d.data().status,
              order: d.data().order,
            }))
            .sort((a, b) => a.order - b.order);
          setPhases(phasesData);
        } catch {
          // Phases may not exist
        }

        // Load task stats
        try {
          const tasksSnap = await getDocs(collection(db, 'projects', projectId, 'tasks'));
          const tasks = tasksSnap.docs.map((d) => d.data());
          setTaskStats({
            total: tasks.length,
            completed: tasks.filter((t) => t.status === 'completed').length,
          });
        } catch {
          // Tasks may not exist
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [user?.uid, projectId]);

  // Calculate progress
  const getProgress = (): number => {
    if (typeof project?.progress === 'number') return project.progress;
    if (taskStats.total > 0) {
      return Math.round((taskStats.completed / taskStats.total) * 100);
    }
    if (project?.status === 'completed') return 100;
    if (project?.status === 'planning') return 0;
    return 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Projects</span>
        </div>
        <SkeletonProjectCard />
        <SkeletonProjectCard />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error || 'Project not found'}</p>
        <Link href="/client/projects" className="text-brand-600 hover:text-brand-700 mt-4 inline-block">
          Back to Projects
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
  const progress = getProgress();

  // Quick links for project sub-pages
  const quickLinks = [
    {
      label: 'Scope of Work',
      description: 'View detailed project scope',
      href: `/client/projects/${projectId}/scope`,
      icon: ListBulletIcon,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Selections',
      description: 'Review materials & finishes',
      href: `/client/projects/${projectId}/selections`,
      icon: SwatchIcon,
      color: 'bg-pink-100 text-pink-600',
    },
    {
      label: 'Change Orders',
      description: 'Review scope changes',
      href: `/client/projects/${projectId}/change-orders`,
      icon: DocumentDuplicateIcon,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/client/projects"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Project Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{project.name}</h1>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                statusConfig.bgColor,
                statusConfig.color
              )}>
                <span className={cn('h-2 w-2 rounded-full', statusConfig.dotColor)} />
                {statusConfig.label}
              </span>
            </div>
            {project.address && (
              <div className="flex items-center gap-1 text-gray-500">
                <MapPinIcon className="h-4 w-4" />
                <span>
                  {project.address.street && `${project.address.street}, `}
                  {project.address.city}, {project.address.state} {project.address.zip}
                </span>
              </div>
            )}
          </div>
          {(project.startDate || project.endDate) && (
            <div className="flex items-center gap-1 text-sm text-gray-500 sm:text-right">
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
        </div>

        {project.description && (
          <p className="mt-4 text-gray-600">{project.description}</p>
        )}
      </Card>

      {/* Progress Card */}
      <Card>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Project Progress</h2>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Overall Progress</span>
            <span className="font-semibold text-gray-900">{progress}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                progress >= 100 ? 'bg-green-500' :
                progress >= 50 ? 'bg-blue-500' : 'bg-blue-400'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <ClipboardDocumentListIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasks</p>
              <p className="font-semibold text-gray-900">
                {taskStats.completed} / {taskStats.total} complete
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phases</p>
              <p className="font-semibold text-gray-900">
                {phases.filter((p) => p.status === 'completed').length} / {phases.length || 0} complete
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Project Phases Timeline */}
      {phases.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-4">Project Phases</h2>
          <div className="space-y-3">
            {phases.map((phase, index) => {
              const isCompleted = phase.status === 'completed';
              const isActive = phase.status === 'active';
              return (
                <div key={phase.id} className="flex items-center gap-3">
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    isCompleted ? 'bg-green-100' :
                    isActive ? 'bg-blue-100' : 'bg-gray-100'
                  )}>
                    {isCompleted ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : isActive ? (
                      <ClockIcon className="h-5 w-5 text-blue-600" />
                    ) : (
                      <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium truncate',
                      isCompleted ? 'text-gray-500' : 'text-gray-900'
                    )}>
                      {phase.name}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      'text-xs',
                      isCompleted ? 'bg-green-100 text-green-700' :
                      isActive ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    )}
                  >
                    {isCompleted ? 'Complete' : isActive ? 'In Progress' : 'Upcoming'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card hover className="h-full">
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-xl', link.color)}>
                  <link.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium tracking-tight text-gray-900">{link.label}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{link.description}</p>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Contact Card */}
      <Card>
        <h3 className="font-semibold tracking-tight text-gray-900 mb-2">Questions about your project?</h3>
        <p className="text-gray-600 text-sm mb-4">
          Reach out to your contractor if you have any questions or concerns.
        </p>
        <Link
          href="/client/messages"
          className="inline-flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:opacity-90 transition-colors"
        >
          Send Message
        </Link>
      </Card>
    </div>
  );
}
