'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  FlagIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { useIssues } from '@/lib/hooks/useIssues';
import { toast } from '@/components/ui/Toast';
import { IssueSeverity, Project } from '@/types';
import { logger } from '@/lib/utils/logger';

const SEVERITY_OPTIONS: {
  value: IssueSeverity;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}[] = [
  {
    value: 'low',
    label: 'Low',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: 'info',
  },
  {
    value: 'medium',
    label: 'Medium',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    icon: 'warning',
  },
  {
    value: 'high',
    label: 'High',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
    icon: 'alert',
  },
  {
    value: 'critical',
    label: 'Critical',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    icon: 'critical',
  },
];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function FieldIssuePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { issues, loading: issuesLoading, addIssue } = useIssues();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IssueSeverity>('medium');
  const [projectId, setProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load active projects
  useEffect(() => {
    if (!profile?.orgId) return;

    const loadProjects = async () => {
      try {
        const q = query(
          collection(db, 'projects'),
          where('orgId', '==', profile.orgId),
          where('status', '==', 'active'),
          orderBy('name', 'asc')
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Project
        );
        setProjects(items);
      } catch (err) {
        logger.error('Failed to load projects', { error: err, page: 'field-issue' });
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, [profile?.orgId]);

  const handleSubmit = async () => {
    if (!user?.uid || !projectId || !title.trim()) {
      toast.warning('Missing fields', 'Please fill in project, title, and severity.');
      return;
    }

    setSubmitting(true);
    try {
      await addIssue({
        projectId,
        reportedBy: user.uid,
        title: title.trim(),
        description: description.trim(),
        severity,
        status: 'open',
      });
      toast.success('Issue reported', 'Your issue has been submitted successfully.');
      setTitle('');
      setDescription('');
      setSeverity('medium');
      setProjectId('');
    } catch (err) {
      logger.error('Failed to report issue', { error: err, page: 'field-issue' });
      toast.error('Failed to report issue', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // My recent issues (last 10, reported by current user)
  const myRecentIssues = issues
    .filter((i) => i.reportedBy === user?.uid)
    .slice(0, 10);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight">Report Issue</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-4">
        {/* Project Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project
          </label>
          {projectsLoading ? (
            <div className="w-full h-11 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Issue Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide details about the issue, what happened, and any relevant context..."
            rows={4}
            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
          />
        </div>

        {/* Severity Cards */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severity
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SEVERITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSeverity(option.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  severity === option.value
                    ? `${option.bgColor} border-current ${option.color} ring-2 ring-offset-1`
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FlagIcon className="h-5 w-5" />
                  <span className="font-medium text-sm">{option.label}</span>
                </div>
                {severity === option.value && (
                  <CheckCircleIcon className="h-4 w-4 mt-1" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !projectId || !title.trim()}
          className="w-full py-3 bg-brand-primary text-white font-medium rounded-xl shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Submitting...
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              Report Issue
            </>
          )}
        </button>
      </div>

      {/* Recent Issues */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-3">
          Your Recent Issues
        </h2>

        {issuesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border shadow-sm p-4 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : myRecentIssues.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No issues reported yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Issues you report will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRecentIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-white rounded-xl border shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 tracking-tight truncate">
                      {issue.title}
                    </h3>
                    {issue.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                        {issue.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[issue.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {issue.status === 'open' && (
                          <ClockIcon className="h-3 w-3" />
                        )}
                        {issue.status === 'resolved' && (
                          <CheckCircleIcon className="h-3 w-3" />
                        )}
                        {STATUS_LABELS[issue.status] || issue.status}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          issue.severity === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : issue.severity === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : issue.severity === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {issue.createdAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
