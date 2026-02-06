'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import {
  DailyLogEntry,
  DailyLogCategory,
  WeatherCondition,
  DAILY_LOG_CATEGORIES,
  WEATHER_CONDITIONS,
  Project,
} from '@/types';
import { logger } from '@/lib/utils/logger';

const dailyLogSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  crewCount: z.coerce.number().min(0).optional(),
  hoursWorked: z.coerce.number().min(0).optional(),
  weatherCondition: z.string().optional(),
  temperatureHigh: z.coerce.number().optional(),
  temperatureLow: z.coerce.number().optional(),
  weatherNotes: z.string().optional(),
  safetyNotes: z.string().optional(),
  isPrivate: z.boolean().optional(),
  requiresFollowUp: z.boolean().optional(),
  followUpDate: z.string().optional(),
  tags: z.string().optional(),
  workPerformed: z.array(z.object({ value: z.string() })).optional(),
  issues: z.array(z.object({
    description: z.string(),
    impact: z.enum(['low', 'medium', 'high']),
    resolved: z.boolean(),
    resolution: z.string().optional(),
  })).optional(),
});

type DailyLogFormData = z.output<typeof dailyLogSchema>;

interface DailyLogFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<DailyLogEntry, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  log?: DailyLogEntry;
  defaultProjectId?: string;
  mode?: 'create' | 'edit';
}

export function DailyLogFormModal({
  open,
  onClose,
  onSubmit,
  log,
  defaultProjectId,
  mode = 'create',
}: DailyLogFormModalProps) {
  const { data: projects = [] } = useProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'work' | 'weather' | 'issues'>('basic');

  const getDefaultValues = useCallback((): Partial<DailyLogFormData> => {
    if (log) {
      return {
        projectId: log.projectId,
        date: log.date,
        category: log.category,
        title: log.title,
        description: log.description,
        crewCount: log.crewCount,
        hoursWorked: log.hoursWorked,
        weatherCondition: log.weather?.condition,
        temperatureHigh: log.weather?.temperatureHigh,
        temperatureLow: log.weather?.temperatureLow,
        weatherNotes: log.weather?.notes,
        safetyNotes: log.safetyNotes,
        isPrivate: log.isPrivate,
        requiresFollowUp: log.requiresFollowUp,
        followUpDate: log.followUpDate?.toISOString().split('T')[0],
        tags: log.tags?.join(', '),
        workPerformed: log.workPerformed?.map(w => ({ value: w })) || [],
        issues: log.issues || [],
      };
    }

    return {
      projectId: defaultProjectId || '',
      date: new Date().toISOString().split('T')[0],
      category: 'progress',
      title: '',
      description: '',
      workPerformed: [],
      issues: [],
    };
  }, [log, defaultProjectId]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<z.input<typeof dailyLogSchema>, unknown, DailyLogFormData>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: getDefaultValues(),
  });

  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({
    control,
    name: 'workPerformed',
  });

  const { fields: issueFields, append: appendIssue, remove: removeIssue } = useFieldArray({
    control,
    name: 'issues',
  });

  const _selectedProjectId = watch('projectId');
  const requiresFollowUp = watch('requiresFollowUp');

  // Reset form when log changes
  useEffect(() => {
    if (open) {
      reset(getDefaultValues());
    }
  }, [open, log, reset, getDefaultValues]);

  const handleFormSubmit = async (data: DailyLogFormData) => {
    setIsSubmitting(true);
    try {
      const selectedProject = (projects as Project[]).find((p: Project) => p.id === data.projectId);

      const logData: Omit<DailyLogEntry, 'id' | 'orgId' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'> = {
        projectId: data.projectId,
        projectName: selectedProject?.name || 'Unknown Project',
        date: data.date,
        category: data.category as DailyLogCategory,
        title: data.title,
        description: data.description,
        photos: log?.photos || [],
        crewCount: data.crewCount,
        hoursWorked: data.hoursWorked,
        workPerformed: data.workPerformed?.map(w => w.value).filter(Boolean),
        issues: data.issues?.filter(i => i.description),
        safetyNotes: data.safetyNotes,
        isPrivate: data.isPrivate,
        requiresFollowUp: data.requiresFollowUp,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        tags: data.tags?.split(',').map(t => t.trim()).filter(Boolean),
      };

      // Add weather if condition specified
      if (data.weatherCondition) {
        logData.weather = {
          condition: data.weatherCondition as WeatherCondition,
          temperatureHigh: data.temperatureHigh,
          temperatureLow: data.temperatureLow,
          notes: data.weatherNotes,
        };
      }

      await onSubmit(logData);
      reset();
      onClose();
    } catch (error) {
      logger.error('Error submitting daily log', { error: error, component: 'DailyLogFormModal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Daily Log' : 'Add Daily Log Entry'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          {(['basic', 'work', 'weather', 'issues'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                activeTab === tab
                  ? 'bg-brand-100 text-brand-primary'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Basic Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {/* Project and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('projectId')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                >
                  <option value="">Select project</option>
                  {(projects as Project[])
                    .filter((p: Project) => p.status === 'active')
                    .map((project: Project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </select>
                {errors.projectId && (
                  <p className="text-red-500 text-xs mt-1">{errors.projectId.message}</p>
                )}
              </div>
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
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {DAILY_LOG_CATEGORIES.map((cat) => (
                  <label
                    key={cat.value}
                    className="flex items-center justify-center p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                    style={{
                      borderColor: watch('category') === cat.value ? cat.color : '#e5e7eb',
                      backgroundColor: watch('category') === cat.value ? `${cat.color}10` : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      {...register('category')}
                      value={cat.value}
                      className="sr-only"
                    />
                    <span className="text-xs text-center">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('title')}
                placeholder="Brief summary of the log entry"
                error={errors.title?.message}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                rows={4}
                placeholder="Detailed description of activities, observations, or notes..."
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Flags */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isPrivate')}
                  className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
                />
                <span className="text-sm text-gray-700">Private (PM/Owner only)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('requiresFollowUp')}
                  className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
                />
                <span className="text-sm text-gray-700">Requires follow-up</span>
              </label>
            </div>

            {requiresFollowUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Date
                </label>
                <Input
                  type="date"
                  {...register('followUpDate')}
                />
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <Input
                {...register('tags')}
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>
        )}

        {/* Work Tab */}
        {activeTab === 'work' && (
          <div className="space-y-4">
            {/* Crew and Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crew Count
                </label>
                <Input
                  type="number"
                  min="0"
                  {...register('crewCount')}
                  placeholder="Number of workers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours Worked
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  {...register('hoursWorked')}
                  placeholder="Total hours"
                />
              </div>
            </div>

            {/* Work Performed */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Work Performed
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => appendWork({ value: '' })}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {workFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      {...register(`workPerformed.${index}.value`)}
                      placeholder="Work item description"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeWork(index)}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {workFields.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No work items added</p>
                )}
              </div>
            </div>

            {/* Safety Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Safety Notes
              </label>
              <textarea
                {...register('safetyNotes')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                rows={3}
                placeholder="Any safety observations, incidents, or concerns..."
              />
            </div>
          </div>
        )}

        {/* Weather Tab */}
        {activeTab === 'weather' && (
          <div className="space-y-4">
            {/* Weather Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weather Condition
              </label>
              <div className="grid grid-cols-3 gap-2">
                {WEATHER_CONDITIONS.map((w) => (
                  <label
                    key={w.value}
                    className={`flex items-center justify-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
                      watch('weatherCondition') === w.value
                        ? 'border-brand-primary bg-brand-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('weatherCondition')}
                      value={w.value}
                      className="sr-only"
                    />
                    <span className="text-sm">{w.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  High Temp (°F)
                </label>
                <Input
                  type="number"
                  {...register('temperatureHigh')}
                  placeholder="e.g., 75"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Low Temp (°F)
                </label>
                <Input
                  type="number"
                  {...register('temperatureLow')}
                  placeholder="e.g., 55"
                />
              </div>
            </div>

            {/* Weather Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weather Notes
              </label>
              <textarea
                {...register('weatherNotes')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                rows={2}
                placeholder="Additional weather-related notes..."
              />
            </div>
          </div>
        )}

        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Issues / Delays
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => appendIssue({ description: '', impact: 'low', resolved: false })}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Issue
              </Button>
            </div>

            <div className="space-y-4">
              {issueFields.map((field, index) => (
                <div key={field.id} className="p-3 border border-gray-200 rounded-md space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-700">Issue #{index + 1}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeIssue(index)}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <Input
                      {...register(`issues.${index}.description`)}
                      placeholder="What is the issue?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Impact</label>
                      <select
                        {...register(`issues.${index}.impact`)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary/20 sm:text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...register(`issues.${index}.resolved`)}
                          className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20"
                        />
                        <span className="text-sm text-gray-700">Resolved</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Resolution (if resolved)</label>
                    <Input
                      {...register(`issues.${index}.resolution`)}
                      placeholder="How was it resolved?"
                    />
                  </div>
                </div>
              ))}
              {issueFields.length === 0 && (
                <p className="text-sm text-gray-500 italic text-center py-4">
                  No issues logged. Click &quot;Add Issue&quot; to report problems or delays.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Log Entry'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
