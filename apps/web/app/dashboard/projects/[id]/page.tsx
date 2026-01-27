"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Project, Task, UserProfile, ProjectPhase, QuoteSection } from '@/types';
import { Button, Card, StatusBadge, Avatar } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import PhaseProgressBar from '@/components/projects/PhaseProgressBar';
import TaskBoard from '@/components/projects/TaskBoard';
import QuoteSummaryCard from '@/components/projects/QuoteSummaryCard';
import {
  ArrowLeftIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [quoteSections, setQuoteSections] = useState<QuoteSection[]>([]);
  const [client, setClient] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch project
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          router.push('/dashboard/projects');
          return;
        }
        const projectData = { id: projectDoc.id, ...projectDoc.data() } as Project;
        setProject(projectData);

        // Fetch client
        if (projectData.clientId) {
          const clientDoc = await getDoc(doc(db, 'users', projectData.clientId));
          if (clientDoc.exists()) {
            setClient({ uid: clientDoc.id, ...clientDoc.data() } as UserProfile);
          }
        }

        // Fetch tasks
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('projectId', '==', projectId)
        );
        const tasksSnap = await getDocs(tasksQuery);
        setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Task[]);

        // Fetch phases
        const phasesSnap = await getDocs(collection(db, 'projects', projectId, 'phases'));
        const phasesData = phasesSnap.docs
          .map(d => ({ id: d.id, ...d.data() }) as ProjectPhase)
          .sort((a, b) => a.order - b.order);
        setPhases(phasesData);

        // Auto-select active phase
        const active = phasesData.find(p => p.status === 'active');
        if (active) setSelectedPhaseId(active.id);

        // Fetch quote sections
        const quoteSnap = await getDocs(collection(db, 'projects', projectId, 'quoteSections'));
        setQuoteSections(quoteSnap.docs.map(d => ({ id: d.id, ...d.data() }) as QuoteSection));

      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) return null;

  const isPreConstruction = project.status === 'lead' || project.status === 'bidding';
  const isActive = project.status === 'active' || project.status === 'planning';
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            All Projects
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <StatusBadge status={project.status as any} />
          </div>
          {project.description && (
            <p className="text-gray-500 mt-1">{project.description}</p>
          )}
          {project.scope && (
            <p className="text-sm text-gray-400 mt-1">Scope: {project.scope.replace(/_/g, ' ')}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Cog6ToothIcon className="h-4 w-4" />}>
            Settings
          </Button>
        </div>
      </div>

      {/* Phase Progress Bar */}
      {phases.length > 0 && (
        <Card>
          <PhaseProgressBar
            phases={phases}
            activePhaseId={selectedPhaseId || undefined}
            onPhaseClick={(phase) => setSelectedPhaseId(phase.id)}
          />
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPinIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {project.address.city}, {project.address.state}
              </p>
            </div>
          </div>
        </Card>

        {client && (
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <Avatar name={client.displayName} size="sm" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Client</p>
                <p className="text-sm font-medium text-gray-900 truncate">{client.displayName}</p>
              </div>
            </div>
          </Card>
        )}

        {project.budget && (
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Budget</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(project.budget)}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tasks</p>
              <p className="text-sm font-medium text-gray-900">
                {completedTasks} / {tasks.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pre-Construction View (Lead/Bidding) */}
      {isPreConstruction && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuoteSummaryCard sections={quoteSections} quoteTotal={project.quoteTotal} />

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Client Preferences</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Collect client preferences before starting the project.
            </p>
            <Link href={`/dashboard/projects/${projectId}/preferences`}>
              <Button variant="outline" size="sm">View / Edit Preferences</Button>
            </Link>
          </Card>

          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Actions</h3>
            </div>
            <div className="flex gap-3">
              <Link href={`/dashboard/projects/${projectId}/quote`}>
                <Button variant="primary" icon={<DocumentTextIcon className="h-4 w-4" />}>
                  Build Quote
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${projectId}/preferences`}>
                <Button variant="outline" icon={<UserGroupIcon className="h-4 w-4" />}>
                  Client Preferences
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* Active View — Task Board */}
      {isActive && (
        <TaskBoard
          projectId={projectId}
          tasks={tasks}
          phases={phases}
          selectedPhaseId={selectedPhaseId}
          onTasksChange={setTasks}
        />
      )}

      {/* Completed / On-Hold / Cancelled — still show task board, no phase filter */}
      {!isPreConstruction && !isActive && (
        <TaskBoard
          projectId={projectId}
          tasks={tasks}
          phases={phases}
          selectedPhaseId={null}
          onTasksChange={setTasks}
        />
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href={`/dashboard/projects/${projectId}/quote`}>
          <Card hover className="text-center">
            <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Quote</p>
          </Card>
        </Link>
        <Link href={`/dashboard/projects/${projectId}/photos`}>
          <Card hover className="text-center">
            <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Photos</p>
          </Card>
        </Link>
        <Link href={`/dashboard/projects/${projectId}/logs`}>
          <Card hover className="text-center">
            <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Daily Logs</p>
          </Card>
        </Link>
        <Link href={`/dashboard/projects/${projectId}/messages`}>
          <Card hover className="text-center">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Messages</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
