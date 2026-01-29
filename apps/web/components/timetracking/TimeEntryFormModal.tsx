'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import BaseModal from '@/components/ui/BaseModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { TimeEntry, TimeEntryBreak, Project } from '@/types';

const timeEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  clockInTime: z.string().min(1, 'Clock in time is required'),
  clockOutTime: z.string().min(1, 'Clock out time is required'),
  projectId: z.string().optional(),
  notes: z.string().optional(),
  breakMinutes: z.coerce.number().min(0).optional(),
}).refine((data) => {
  if (data.clockInTime && data.clockOutTime) {
    return data.clockInTime < data.clockOutTime;
  }
  return true;
}, {
  message: 'Clock out time must be after clock in time',
  path: ['clockOutTime'],
});

type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

interface TimeEntryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<TimeEntry, 'id' | 'orgId' | 'userId' | 'userName' | 'userRole' | 'type' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  entry?: TimeEntry;
  mode?: 'create' | 'edit';
}

export function TimeEntryFormModal({
  open,
  onClose,
  onSubmit,
  entry,
  mode = 'create',
}: TimeEntryFormModalProps) {
  const { data: projects = [] } = useProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get default values
  const getDefaultValues = (): Partial<TimeEntryFormData> => {
    if (entry) {
      const clockInDate = new Date(entry.clockIn);
      const clockOutDate = entry.clockOut ? new Date(entry.clockOut) : null;

      return {
        date: clockInDate.toISOString().split('T')[0],
        clockInTime: clockInDate.toTimeString().slice(0, 5),
        clockOutTime: clockOutDate ? clockOutDate.toTimeString().slice(0, 5) : '',
        projectId: entry.projectId || '',
        notes: entry.notes || '',
        breakMinutes: entry.totalBreakMinutes || 0,
      };
    }

    const now = new Date();
    return {
      date: now.toISOString().split('T')[0],
      clockInTime: '09:00',
      clockOutTime: '17:00',
      projectId: '',
      notes: '',
      breakMinutes: 0,
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: getDefaultValues(),
  });

  const handleFormSubmit = async (data: TimeEntryFormData) => {
    setIsSubmitting(true);
    try {
      // Parse dates
      const clockIn = new Date(`${data.date}T${data.clockInTime}`);
      const clockOut = new Date(`${data.date}T${data.clockOutTime}`);

      // Get project name
      const selectedProject = (projects as Project[]).find((p: Project) => p.id === data.projectId);

      // Create breaks array if break minutes specified
      const breaks: TimeEntryBreak[] = [];
      if (data.breakMinutes && data.breakMinutes > 0) {
        // Create a single unpaid break for the break minutes
        const breakStart = new Date(clockIn.getTime() + (4 * 60 * 60 * 1000)); // 4 hours after clock in
        const breakEnd = new Date(breakStart.getTime() + (data.breakMinutes * 60 * 1000));
        breaks.push({
          id: `break_${Date.now()}`,
          type: 'lunch',
          startTime: breakStart,
          endTime: breakEnd,
          duration: data.breakMinutes,
          isPaid: false,
        });
      }

      await onSubmit({
        clockIn,
        clockOut,
        projectId: data.projectId || undefined,
        projectName: selectedProject?.name,
        notes: data.notes,
        breaks,
        totalBreakMinutes: data.breakMinutes,
      });

      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting time entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Time Entry' : 'Add Manual Time Entry'}
    >
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
              Clock In <span className="text-red-500">*</span>
            </label>
            <Input
              type="time"
              {...register('clockInTime')}
              error={errors.clockInTime?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clock Out <span className="text-red-500">*</span>
            </label>
            <Input
              type="time"
              {...register('clockOutTime')}
              error={errors.clockOutTime?.message}
            />
          </div>
        </div>

        {/* Break Minutes */}
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
          <p className="text-xs text-gray-500 mt-1">
            Unpaid break time to deduct from total hours
          </p>
        </div>

        {/* Project */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project
          </label>
          <select
            {...register('projectId')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">No project selected</option>
            {(projects as Project[])
              .filter((p: Project) => p.status === 'active' || (entry && p.id === entry.projectId))
              .map((project: Project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            {...register('notes')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            rows={3}
            placeholder="Work performed, reason for manual entry, etc."
          />
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-3 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Summary</h4>
          <p className="text-sm text-gray-600">
            This will create a manual time entry that may require approval depending on your organization&apos;s settings.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Entry'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
