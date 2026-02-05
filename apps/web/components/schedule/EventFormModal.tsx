"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';
import BaseModal from '@/components/ui/BaseModal';
import {
  ScheduleEvent,
  ScheduleEventType,
  ScheduleEventStatus,
  SCHEDULE_EVENT_TYPES,
  SCHEDULE_EVENT_STATUSES,
  RecurrencePattern,
} from '@/types';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  FolderIcon,
  BellIcon,
  CloudIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: EventFormData) => Promise<void>;
  event?: ScheduleEvent | null;
  initialDate?: Date;
  projects?: { id: string; name: string; phases?: { id: string; name: string }[] }[];
  users?: { id: string; name: string; role?: string }[];
  loading?: boolean;
}

export interface EventFormData {
  title: string;
  description?: string;
  type: ScheduleEventType;
  status: ScheduleEventStatus;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  estimatedHours?: number;
  location?: string;
  address?: string;
  projectId?: string;
  projectName?: string;
  phaseId?: string;
  phaseName?: string;
  assignedUserIds: string[];
  leadUserId?: string;
  weatherSensitive: boolean;
  notifyAssignees: boolean;
  notifyClient: boolean;
  reminderMinutes?: number[];
  internalNotes?: string;
  clientVisibleNotes?: string;
  color?: string;
  recurrence: RecurrencePattern;
  recurrenceEndDate?: Date;
}

const REMINDER_OPTIONS = [
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
];

const RECURRENCE_OPTIONS: { value: RecurrencePattern; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

export default function EventFormModal({
  open,
  onClose,
  onSave,
  event,
  initialDate,
  projects = [],
  users = [],
  loading = false,
}: EventFormModalProps) {
  const isEditing = !!event;

  const getDefaultStartDate = () => {
    if (initialDate) {
      const d = new Date(initialDate);
      d.setHours(9, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  };

  const getDefaultEndDate = (start: Date) => {
    const d = new Date(start);
    d.setHours(start.getHours() + 1);
    return d;
  };

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    type: 'job',
    status: 'scheduled',
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(getDefaultStartDate()),
    allDay: false,
    estimatedHours: undefined,
    location: '',
    address: '',
    projectId: '',
    projectName: '',
    phaseId: '',
    phaseName: '',
    assignedUserIds: [],
    leadUserId: '',
    weatherSensitive: false,
    notifyAssignees: true,
    notifyClient: false,
    reminderMinutes: [60],
    internalNotes: '',
    clientVisibleNotes: '',
    color: '',
    recurrence: 'none',
    recurrenceEndDate: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens or event changes
  useEffect(() => {
    if (open) {
      if (event) {
        setFormData({
          title: event.title,
          description: event.description || '',
          type: event.type,
          status: event.status,
          startDate: event.startDate,
          endDate: event.endDate,
          allDay: event.allDay,
          estimatedHours: event.estimatedHours,
          location: event.location || '',
          address: event.address || '',
          projectId: event.projectId || '',
          projectName: event.projectName || '',
          phaseId: event.phaseId || '',
          phaseName: event.phaseName || '',
          assignedUserIds: event.assignedUserIds || [],
          leadUserId: event.leadUserId || '',
          weatherSensitive: event.weatherSensitive,
          notifyAssignees: event.notifyAssignees,
          notifyClient: event.notifyClient,
          reminderMinutes: event.reminderMinutes || [60],
          internalNotes: event.internalNotes || '',
          clientVisibleNotes: event.clientVisibleNotes || '',
          color: event.color || '',
          recurrence: event.recurrence,
          recurrenceEndDate: event.recurrenceEndDate,
        });
      } else {
        setFormData({
          title: '',
          description: '',
          type: 'job',
          status: 'scheduled',
          startDate: getDefaultStartDate(),
          endDate: getDefaultEndDate(getDefaultStartDate()),
          allDay: false,
          estimatedHours: undefined,
          location: '',
          address: '',
          projectId: '',
          projectName: '',
          phaseId: '',
          phaseName: '',
          assignedUserIds: [],
          leadUserId: '',
          weatherSensitive: false,
          notifyAssignees: true,
          notifyClient: false,
          reminderMinutes: [60],
          internalNotes: '',
          clientVisibleNotes: '',
          color: '',
          recurrence: 'none',
          recurrenceEndDate: undefined,
        });
      }
      setErrors({});
    }
  }, [open, event, initialDate]);

  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  const handleChange = (field: keyof EventFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    setFormData((prev) => ({
      ...prev,
      projectId,
      projectName: project?.name || '',
      phaseId: '',
      phaseName: '',
    }));
  };

  const handlePhaseChange = (phaseId: string) => {
    const project = projects.find((p) => p.id === formData.projectId);
    const phase = project?.phases?.find((ph) => ph.id === phaseId);
    setFormData((prev) => ({
      ...prev,
      phaseId,
      phaseName: phase?.name || '',
    }));
  };

  const toggleUser = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedUserIds: prev.assignedUserIds.includes(userId)
        ? prev.assignedUserIds.filter((id) => id !== userId)
        : [...prev.assignedUserIds, userId],
    }));
  };

  const toggleReminder = (minutes: number) => {
    setFormData((prev) => ({
      ...prev,
      reminderMinutes: prev.reminderMinutes?.includes(minutes)
        ? prev.reminderMinutes.filter((m) => m !== minutes)
        : [...(prev.reminderMinutes || []), minutes],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.endDate <= formData.startDate) {
      newErrors.endDate = 'End time must be after start time';
    }

    if (formData.recurrence !== 'none' && !formData.recurrenceEndDate) {
      newErrors.recurrenceEndDate = 'End date required for recurring events';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSave(formData);
    onClose();
  };

  const selectedProject = projects.find((p) => p.id === formData.projectId);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Event' : 'Create Event'}
      size="lg"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Event title"
              error={errors.title}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {SCHEDULE_EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {SCHEDULE_EVENT_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium">Date & Time</h3>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allDay}
              onChange={(e) => handleChange('allDay', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">All day event</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start
              </label>
              <input
                type={formData.allDay ? 'date' : 'datetime-local'}
                value={formData.allDay
                  ? formData.startDate.toISOString().slice(0, 10)
                  : formatDateForInput(formData.startDate)}
                onChange={(e) => handleChange('startDate', new Date(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End
              </label>
              <input
                type={formData.allDay ? 'date' : 'datetime-local'}
                value={formData.allDay
                  ? formData.endDate.toISOString().slice(0, 10)
                  : formatDateForInput(formData.endDate)}
                onChange={(e) => handleChange('endDate', new Date(e.target.value))}
                className={cn(
                  'w-full border rounded-lg px-3 py-2 text-sm',
                  errors.endDate ? 'border-red-300' : 'border-gray-300'
                )}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {!formData.allDay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Hours
              </label>
              <input
                type="number"
                value={formData.estimatedHours || ''}
                onChange={(e) => handleChange('estimatedHours', parseFloat(e.target.value) || undefined)}
                min="0"
                step="0.5"
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g., 4"
              />
            </div>
          )}
        </div>

        {/* Recurrence */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium">Recurrence</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repeat
              </label>
              <select
                value={formData.recurrence}
                onChange={(e) => handleChange('recurrence', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.recurrence !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repeat Until
                </label>
                <input
                  type="date"
                  value={formData.recurrenceEndDate?.toISOString().slice(0, 10) || ''}
                  onChange={(e) => handleChange('recurrenceEndDate', e.target.value ? new Date(e.target.value) : undefined)}
                  className={cn(
                    'w-full border rounded-lg px-3 py-2 text-sm',
                    errors.recurrenceEndDate ? 'border-red-300' : 'border-gray-300'
                  )}
                />
                {errors.recurrenceEndDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.recurrenceEndDate}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium">Location</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Name
              </label>
              <Input
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., Client's Home"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Main St"
              />
            </div>
          </div>
        </div>

        {/* Project Assignment */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium">Project</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProject?.phases && selectedProject.phases.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phase
                </label>
                <select
                  value={formData.phaseId}
                  onChange={(e) => handlePhaseChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">No phase</option>
                  {selectedProject.phases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Crew Assignment */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium">Crew Assignment</h3>
          </div>

          <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-sm text-gray-500">No team members available</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedUserIds.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{user.name}</span>
                    {user.role && (
                      <span className="text-xs text-gray-500">({user.role})</span>
                    )}
                    {formData.leadUserId === user.id && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        Lead
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {formData.assignedUserIds.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crew Lead
              </label>
              <select
                value={formData.leadUserId}
                onChange={(e) => handleChange('leadUserId', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">No lead assigned</option>
                {formData.assignedUserIds.map((userId) => {
                  const user = users.find((u) => u.id === userId);
                  return (
                    <option key={userId} value={userId}>
                      {user?.name || userId}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium">Notifications</h3>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyAssignees}
                onChange={(e) => handleChange('notifyAssignees', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Notify assigned crew members</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyClient}
                onChange={(e) => handleChange('notifyClient', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Notify client</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminders
            </label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleReminder(opt.value)}
                  className={cn(
                    'px-2 py-1 text-xs rounded border transition-colors',
                    formData.reminderMinutes?.includes(opt.value)
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Weather */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CloudIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium">Weather Considerations</h3>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.weatherSensitive}
              onChange={(e) => handleChange('weatherSensitive', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">
              This event is weather-sensitive (outdoor work, concrete pour, etc.)
            </span>
          </label>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="font-medium">Notes</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes (crew only)
            </label>
            <textarea
              value={formData.internalNotes}
              onChange={(e) => handleChange('internalNotes', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Notes visible only to your team..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client-Visible Notes
            </label>
            <textarea
              value={formData.clientVisibleNotes}
              onChange={(e) => handleChange('clientVisibleNotes', e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Notes visible to the client..."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading}>
          {isEditing ? 'Save Changes' : 'Create Event'}
        </Button>
      </div>
    </BaseModal>
  );
}
