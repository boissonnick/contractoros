'use client';

/**
 * OfflineTimeEntryForm
 * A time entry form that works fully offline using cached project data
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ClockIcon,
  CloudIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui';
import { useNetworkStatus } from '@/lib/offline/network-status';
import { getCachedProjectsWithRefresh, CachedProject } from '@/lib/offline/cache-projects';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

const offlineEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  clockInTime: z.string().min(1, 'Start time is required'),
  clockOutTime: z.string().min(1, 'End time is required'),
  projectId: z.string().optional(),
  notes: z.string().optional(),
  breakMinutes: z.coerce.number().min(0),
}).refine((data) => {
  if (data.clockInTime && data.clockOutTime) {
    return data.clockInTime < data.clockOutTime;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['clockOutTime'],
});

type OfflineEntryFormData = z.output<typeof offlineEntrySchema>;

interface OfflineTimeEntryFormProps {
  onSubmit: (entry: {
    projectId?: string;
    projectName?: string;
    notes?: string;
    clockIn: Date;
    clockOut: Date;
    breakMinutes?: number;
  }) => Promise<void>;
  onCancel?: () => void;
  initialProjectId?: string;
  mode?: 'create' | 'edit';
  compact?: boolean;
}

export function OfflineTimeEntryForm({
  onSubmit,
  onCancel,
  initialProjectId,
  mode: _mode = 'create',
  compact = false,
}: OfflineTimeEntryFormProps) {
  const { profile } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [projects, setProjects] = useState<CachedProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load cached projects
  useEffect(() => {
    const loadProjects = async () => {
      if (!profile?.orgId) return;

      setLoadingProjects(true);
      try {
        const cached = await getCachedProjectsWithRefresh(profile.orgId);
        setProjects(cached);
      } catch (error) {
        logger.error('Failed to load cached projects', { error: error, component: 'OfflineTimeEntryForm' });
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [profile?.orgId]);

  const now = new Date();
  const defaultValues: Partial<OfflineEntryFormData> = {
    date: now.toISOString().split('T')[0],
    clockInTime: '09:00',
    clockOutTime: '17:00',
    projectId: initialProjectId || '',
    notes: '',
    breakMinutes: 0,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<z.input<typeof offlineEntrySchema>, unknown, OfflineEntryFormData>({
    resolver: zodResolver(offlineEntrySchema),
    defaultValues,
  });

  // Watch for calculating duration
  const _watchDate = watch('date');
  const watchClockIn = watch('clockInTime');
  const watchClockOut = watch('clockOutTime');
  const watchBreak = watch('breakMinutes');

  // Calculate duration
  const calculateDuration = (): string => {
    if (!watchClockIn || !watchClockOut) return '--';

    const [inHour, inMin] = watchClockIn.split(':').map(Number);
    const [outHour, outMin] = watchClockOut.split(':').map(Number);

    const totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin) - (Number(watchBreak) || 0);

    if (totalMinutes <= 0) return '--';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  const handleFormSubmit = async (data: OfflineEntryFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('saving');

    try {
      // Parse dates
      const clockIn = new Date(`${data.date}T${data.clockInTime}`);
      const clockOut = new Date(`${data.date}T${data.clockOutTime}`);

      // Get project name from cached projects
      const selectedProject = projects.find((p) => p.id === data.projectId);

      await onSubmit({
        clockIn,
        clockOut,
        projectId: data.projectId || undefined,
        projectName: selectedProject?.name,
        notes: data.notes,
        breakMinutes: data.breakMinutes,
      });

      setSubmitStatus('saved');
      setTimeout(() => setSubmitStatus('idle'), 2000);
      reset(defaultValues);
    } catch (error) {
      logger.error('Error submitting time entry', { error: error, component: 'OfflineTimeEntryForm' });
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status indicator
  const StatusIndicator = () => {
    if (submitStatus === 'saving') {
      return (
        <div className="flex items-center gap-2 text-brand-primary">
          <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Saving{!isOnline ? ' offline' : ''}...</span>
        </div>
      );
    }

    if (submitStatus === 'saved') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircleIcon className="w-5 h-5" />
          <span className="text-sm">
            {isOnline ? 'Saved' : 'Saved offline - will sync when connected'}
          </span>
        </div>
      );
    }

    if (submitStatus === 'error') {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span className="text-sm">Failed to save. Please try again.</span>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className={cn('p-4', compact && 'p-3')}>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-md mb-4">
          <CloudIcon className="w-5 h-5" />
          <span className="text-sm font-medium">You&apos;re offline - entries will sync when connected</span>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            {...register('date')}
            error={errors.date?.message}
          />
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <Input
              type="time"
              {...register('clockInTime')}
              error={errors.clockInTime?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            <Input
              type="time"
              {...register('clockOutTime')}
              error={errors.clockOutTime?.message}
            />
          </div>
        </div>

        {/* Break Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Break Time (minutes)
          </label>
          <Input
            type="number"
            min="0"
            max="480"
            step="5"
            {...register('breakMinutes')}
            error={errors.breakMinutes?.message}
            placeholder="30"
          />
        </div>

        {/* Duration Summary */}
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
          <ClockIcon className="w-4 h-4" />
          <span>Total working time: <strong>{calculateDuration()}</strong></span>
        </div>

        {/* Project Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project
          </label>
          {loadingProjects ? (
            <div className="flex items-center gap-2 text-gray-500 py-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span className="text-sm">Loading projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-sm text-gray-500 py-2">
              No projects cached. Connect to internet to load projects.
            </div>
          ) : (
            <select
              {...register('projectId')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
            >
              <option value="">No project selected</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                  {project.clientName ? ` (${project.clientName})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            {...register('notes')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
            rows={2}
            placeholder="Work description (optional)"
          />
        </div>

        {/* Status Indicator */}
        <div className="min-h-6">
          <StatusIndicator />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {!isOnline && <CloudArrowUpIcon className="w-4 h-4" />}
            {isSubmitting ? 'Saving...' : isOnline ? 'Save Entry' : 'Save Offline'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default OfflineTimeEntryForm;
