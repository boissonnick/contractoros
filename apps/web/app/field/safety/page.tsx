'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeftIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
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
import { useSafetyIncidents } from '@/lib/hooks/useSafety';
import { toast } from '@/components/ui/Toast';
import { IncidentSeverity, Project } from '@/types';
import { logger } from '@/lib/utils/logger';

const SEVERITY_OPTIONS: {
  value: IncidentSeverity;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}[] = [
  {
    value: 'near_miss',
    label: 'Near Miss',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Close call, no injury',
  },
  {
    value: 'first_aid',
    label: 'First Aid',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    description: 'Minor, treated on site',
  },
  {
    value: 'medical',
    label: 'Medical',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
    description: 'Requires medical attention',
  },
  {
    value: 'lost_time',
    label: 'Lost Time',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Worker unable to return',
  },
  {
    value: 'fatality',
    label: 'Fatality',
    color: 'text-red-900',
    bgColor: 'bg-red-100 border-red-300',
    description: 'Fatal incident',
  },
];

const INCIDENT_STATUS_COLORS: Record<string, string> = {
  reported: 'bg-red-100 text-red-700',
  investigating: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  reported: 'Reported',
  investigating: 'Investigating',
  resolved: 'Resolved',
  closed: 'Closed',
};

const SEVERITY_BADGE_COLORS: Record<string, string> = {
  near_miss: 'bg-blue-100 text-blue-700',
  first_aid: 'bg-amber-100 text-amber-700',
  medical: 'bg-orange-100 text-orange-700',
  lost_time: 'bg-red-100 text-red-700',
  fatality: 'bg-red-200 text-red-900',
};

export default function FieldSafetyPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { incidents, loading: incidentsLoading, addIncident } = useSafetyIncidents();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Form state
  const [projectId, setProjectId] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('near_miss');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [injuredWorkersText, setInjuredWorkersText] = useState('');
  const [witnessesText, setWitnessesText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-detect OSHA reportable
  const isOshaReportable =
    severity === 'medical' || severity === 'lost_time' || severity === 'fatality';

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
        logger.error('Failed to load projects', { error: err, page: 'field-safety' });
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, [profile?.orgId]);

  const selectedProject = projects.find((p) => p.id === projectId);

  const handleSubmit = async () => {
    if (!user?.uid || !profile || !projectId || !description.trim()) {
      toast.warning(
        'Missing fields',
        'Please fill in project, severity, and description.'
      );
      return;
    }

    if (!location.trim()) {
      toast.warning('Missing location', 'Please describe where the incident occurred.');
      return;
    }

    setSubmitting(true);
    try {
      const injuredWorkers = injuredWorkersText
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean);
      const witnesses = witnessesText
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean);

      await addIncident({
        projectId,
        projectName: selectedProject?.name || '',
        reportedBy: user.uid,
        reportedByName: profile.displayName || user.email || 'Unknown',
        severity,
        date: new Date(),
        location: location.trim(),
        description: description.trim(),
        injuredWorkers,
        witnesses,
        photos: [],
        isOshaReportable,
        status: 'reported',
      });

      toast.success(
        'Incident reported',
        'Your safety incident has been submitted successfully.'
      );

      // Clear form
      setProjectId('');
      setSeverity('near_miss');
      setLocation('');
      setDescription('');
      setInjuredWorkersText('');
      setWitnessesText('');
    } catch (err) {
      logger.error('Failed to report incident', { error: err, page: 'field-safety' });
      toast.error('Failed to report incident', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Recent incidents (last 10)
  const recentIncidents = incidents.slice(0, 10);

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
          <h1 className="text-lg font-semibold tracking-tight">
            Safety Incident
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* OSHA Banner - shown when reportable severity selected */}
      {isOshaReportable && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              OSHA Reportable Incident
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              This severity level may require OSHA reporting within 8-24 hours.
              Notify your safety officer immediately.
            </p>
          </div>
        </div>
      )}

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
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{option.label}</span>
                  {severity === option.value && (
                    <CheckCircleIcon className="h-4 w-4" />
                  )}
                </div>
                <p className="text-xs mt-0.5 opacity-75">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., 2nd floor, east wing scaffolding"
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
            placeholder="What happened? Describe the incident in detail, including events leading up to it..."
            rows={4}
            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
          />
        </div>

        {/* Injured Workers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Injured Workers
          </label>
          <input
            type="text"
            value={injuredWorkersText}
            onChange={(e) => setInjuredWorkersText(e.target.value)}
            placeholder="Comma-separated names (e.g., John Doe, Jane Smith)"
            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
          <p className="text-xs text-gray-400 mt-1">
            Leave blank if no injuries occurred
          </p>
        </div>

        {/* Witnesses */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Witnesses
          </label>
          <input
            type="text"
            value={witnessesText}
            onChange={(e) => setWitnessesText(e.target.value)}
            placeholder="Comma-separated names (e.g., Mike Johnson, Sarah Lee)"
            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>

        {/* OSHA Indicator */}
        <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
          <div
            className={`w-3 h-3 rounded-full ${
              isOshaReportable ? 'bg-red-500' : 'bg-green-500'
            }`}
          />
          <span className="text-sm text-gray-700">
            {isOshaReportable
              ? 'OSHA reportable - will be flagged for review'
              : 'Not OSHA reportable'}
          </span>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !projectId || !description.trim() || !location.trim()}
          className="w-full py-3 bg-red-600 text-white font-medium rounded-xl shadow-sm hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Submitting...
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              Report Safety Incident
            </>
          )}
        </button>
      </div>

      {/* Recent Incidents */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-semibold text-gray-900 tracking-tight mb-3">
          Recent Incidents
        </h2>

        {incidentsLoading ? (
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
        ) : recentIncidents.length === 0 ? (
          <div className="text-center py-12">
            <ShieldExclamationIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No incidents reported</p>
            <p className="text-sm text-gray-400 mt-1">
              Safety incidents will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentIncidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-white rounded-xl border shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          SEVERITY_BADGE_COLORS[incident.severity] ||
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {incident.severity.replace('_', ' ')}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          INCIDENT_STATUS_COLORS[incident.status] ||
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {INCIDENT_STATUS_LABELS[incident.status] ||
                          incident.status}
                      </span>
                      {incident.isOshaReportable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          OSHA
                        </span>
                      )}
                    </div>
                    {incident.projectName && (
                      <p className="text-sm font-medium text-gray-900 mt-1.5">
                        {incident.projectName}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                      {incident.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {incident.location}
                      {incident.reportedByName &&
                        ` - Reported by ${incident.reportedByName}`}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {incident.date.toLocaleDateString('en-US', {
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
