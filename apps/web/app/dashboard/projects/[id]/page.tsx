"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Project, Task, UserProfile, ProjectPhase, QuoteSection, ProjectStatus } from '@/types';
import { Button, Card, StatusBadge, Avatar, toast } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import PhaseProgressBar from '@/components/projects/PhaseProgressBar';
import QuoteSummaryCard from '@/components/projects/QuoteSummaryCard';
import {
  MapPinIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  lead: ['bidding', 'planning', 'cancelled'],
  bidding: ['planning', 'lead', 'cancelled'],
  planning: ['active', 'on_hold', 'cancelled'],
  active: ['on_hold', 'completed', 'cancelled'],
  on_hold: ['active', 'cancelled'],
  completed: [],
  cancelled: [],
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
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          router.push('/dashboard/projects');
          return;
        }
        const projectData = { id: projectDoc.id, ...projectDoc.data() } as Project;
        setProject(projectData);

        if (projectData.clientId) {
          const clientDoc = await getDoc(doc(db, 'users', projectData.clientId));
          if (clientDoc.exists()) {
            setClient({ uid: clientDoc.id, ...clientDoc.data() } as UserProfile);
          }
        }

        const tasksQuery = query(
          collection(db, 'tasks'),
          where('projectId', '==', projectId)
        );
        const tasksSnap = await getDocs(tasksQuery);
        setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Task[]);

        const phasesSnap = await getDocs(collection(db, 'projects', projectId, 'phases'));
        const phasesData = phasesSnap.docs
          .map(d => ({ id: d.id, ...d.data() }) as ProjectPhase)
          .sort((a, b) => a.order - b.order);
        setPhases(phasesData);

        const active = phasesData.find(p => p.status === 'active');
        if (active) setSelectedPhaseId(active.id);

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!project) return;
    setStatusMenuOpen(false);
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      setProject(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  const nextStatuses = STATUS_TRANSITIONS[project.status] || [];
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const isActive = project.status === 'active' || project.status === 'planning';

  return (
    <div className="space-y-6">
      {/* Status + Scope + Description */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative" ref={statusRef}>
          <button
            onClick={() => nextStatuses.length > 0 && setStatusMenuOpen(!statusMenuOpen)}
            className={cn(
              'flex items-center gap-1',
              nextStatuses.length > 0 && 'cursor-pointer'
            )}
          >
            <StatusBadge status={project.status as any} />
            {nextStatuses.length > 0 && (
              <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
            )}
          </button>
          {statusMenuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[160px]">
              {nextStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>
        {project.scope && (
          <span className="text-sm text-gray-400">
            {project.scope.replace(/_/g, ' ')}
          </span>
        )}
        {project.description && (
          <p className="text-sm text-gray-500">{project.description}</p>
        )}
      </div>

      {/* Phase Progress Bar */}
      {phases.length > 0 && (
        <Card>
          <PhaseProgressBar
            phases={phases}
            activePhaseId={selectedPhaseId || undefined}
            onPhaseClick={(phase) => setSelectedPhaseId(phase.id)}
            projectId={projectId}
            onPhasesChange={setPhases}
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

      {/* Quote + Preferences Summary */}
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
            Collect client preferences for finishes, budget, and timeline.
          </p>
          <Link href={`/dashboard/projects/${projectId}/preferences`}>
            <Button variant="outline" size="sm">View / Edit Preferences</Button>
          </Link>
        </Card>
      </div>

      {/* Tasks Summary — link to full Tasks tab */}
      {tasks.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Tasks</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {completedTasks} of {tasks.length} completed
                {tasks.filter(t => t.status === 'in_progress').length > 0 &&
                  ` · ${tasks.filter(t => t.status === 'in_progress').length} in progress`}
                {tasks.filter(t => t.status === 'blocked').length > 0 &&
                  ` · ${tasks.filter(t => t.status === 'blocked').length} blocked`}
              </p>
            </div>
            <Link href={`/dashboard/projects/${projectId}/tasks`}>
              <Button variant="outline" size="sm">View All Tasks</Button>
            </Link>
          </div>
          {/* Mini progress bar */}
          {tasks.length > 0 && (
            <div className="mt-3 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${(completedTasks / tasks.length) * 100}%` }}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
