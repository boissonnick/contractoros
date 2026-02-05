'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { NotificationProjectSettings } from '@/types';
import { Card } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  doc,
  updateDoc,
  setDoc,
  collection,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FolderIcon,
  BellSlashIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function Toggle({ label, description, checked, onChange, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className={cn('text-sm font-medium', disabled ? 'text-gray-400' : 'text-gray-900')}>
          {label}
        </p>
        {description && (
          <p className={cn('text-xs', disabled ? 'text-gray-300' : 'text-gray-500')}>
            {description}
          </p>
        )}
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          disabled && 'opacity-50 cursor-not-allowed',
          checked ? 'bg-blue-600' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
            checked && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}

interface Project {
  id: string;
  name: string;
}

interface ProjectNotificationSettingsProps {
  projectSettings: NotificationProjectSettings[];
  preferencesId: string | null;
  onUpdate: () => void;
}

export function ProjectNotificationSettings({
  projectSettings = [],
  preferencesId,
  onUpdate,
}: ProjectNotificationSettingsProps) {
  const { user, profile } = useAuth();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Get projects that already have custom settings
  const configuredProjectIds = new Set(projectSettings.map((ps) => ps.projectId));

  // Get available projects (not yet configured)
  const availableProjects = (projects as Project[]).filter(
    (p) => !configuredProjectIds.has(p.id)
  );

  // Get muted projects for display
  const mutedProjects = projectSettings.filter((ps) => ps.muted);

  const saveProjectSettings = useCallback(
    async (settings: NotificationProjectSettings[]) => {
      if (!user?.uid || !profile?.orgId) return false;
      setSaving(true);

      try {
        if (preferencesId) {
          await updateDoc(doc(db, 'notificationPreferences', preferencesId), {
            projectSettings: settings,
          });
        } else {
          // Create new preferences document with project settings
          const newDocRef = doc(collection(db, 'notificationPreferences'));
          await setDoc(newDocRef, {
            userId: user.uid,
            orgId: profile.orgId,
            email: {
              enabled: true,
              taskAssigned: true,
              taskDueSoon: true,
              invoicePaid: true,
              invoiceOverdue: true,
              rfiCreated: true,
              expenseApproved: true,
              changeOrderPending: true,
              selectionPending: true,
              messages: false,
              mentions: true,
              dailyDigest: false,
            },
            push: {
              enabled: true,
              taskAssigned: true,
              taskDueSoon: true,
              invoicePaid: true,
              changeOrderPending: true,
              messages: true,
              mentions: true,
            },
            projectSettings: settings,
          });
        }
        onUpdate();
        return true;
      } catch (error) {
        console.error('Failed to save project notification settings:', error);
        toast.error('Failed to save project settings');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [user?.uid, profile?.orgId, preferencesId, onUpdate]
  );

  const handleAddProject = async () => {
    if (!selectedProjectId) return;

    const project = (projects as Project[]).find((p) => p.id === selectedProjectId);
    if (!project) return;

    const newSettings: NotificationProjectSettings = {
      projectId: selectedProjectId,
      projectName: project.name,
      muted: false,
      taskNotifications: true,
      rfiNotifications: true,
      expenseNotifications: true,
      changeOrderNotifications: true,
      updatedAt: new Date(),
    };

    const success = await saveProjectSettings([...projectSettings, newSettings]);
    if (success) {
      setSelectedProjectId('');
      toast.success(`Added notification settings for ${project.name}`);
    }
  };

  const handleToggleSetting = async (
    projectId: string,
    field: keyof Omit<NotificationProjectSettings, 'projectId' | 'projectName' | 'updatedAt'>,
    currentValue: boolean
  ) => {
    const updatedSettings = projectSettings.map((ps) =>
      ps.projectId === projectId
        ? { ...ps, [field]: !currentValue, updatedAt: new Date() }
        : ps
    );
    await saveProjectSettings(updatedSettings);
  };

  const handleMuteProject = async (projectId: string, isMuted: boolean) => {
    const updatedSettings = projectSettings.map((ps) =>
      ps.projectId === projectId ? { ...ps, muted: !isMuted, updatedAt: new Date() } : ps
    );
    const project = projectSettings.find((ps) => ps.projectId === projectId);
    await saveProjectSettings(updatedSettings);
    toast.success(
      isMuted
        ? `Unmuted notifications for ${project?.projectName}`
        : `Muted notifications for ${project?.projectName}`
    );
  };

  const handleRemoveProject = async (projectId: string) => {
    const project = projectSettings.find((ps) => ps.projectId === projectId);
    const updatedSettings = projectSettings.filter((ps) => ps.projectId !== projectId);
    await saveProjectSettings(updatedSettings);
    toast.success(`Removed settings for ${project?.projectName}`);
  };

  const handleUnmuteProject = async (projectId: string) => {
    await handleMuteProject(projectId, true);
  };

  return (
    <Card className="p-5">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <FolderIcon className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Project-Specific Settings</h3>
          {projectSettings.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {projectSettings.length} configured
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="mt-4 space-y-6">
          <p className="text-sm text-gray-500">
            Customize notification preferences for specific projects. You can mute projects
            entirely or choose which notification types you receive.
          </p>

          {/* Muted Projects Section */}
          {mutedProjects.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <BellSlashIcon className="h-4 w-4 text-gray-500" />
                <h4 className="text-sm font-medium text-gray-700">Muted Projects</h4>
              </div>
              <div className="space-y-2">
                {mutedProjects.map((ps) => (
                  <div
                    key={ps.projectId}
                    className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-gray-200"
                  >
                    <span className="text-sm text-gray-700">{ps.projectName}</span>
                    <button
                      onClick={() => handleUnmuteProject(ps.projectId)}
                      disabled={saving}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      Unmute
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Project Section */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add Project Settings</h4>
            {projectsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Loading projects...
              </div>
            ) : availableProjects.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                All projects have custom settings configured.
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a project...</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddProject}
                  disabled={!selectedProjectId || saving}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Configured Projects */}
          {projectSettings.length > 0 && (
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Configured Projects</h4>
              {projectSettings.map((ps) => (
                <div
                  key={ps.projectId}
                  className={cn(
                    'border rounded-lg p-4',
                    ps.muted ? 'border-gray-200 bg-gray-50' : 'border-gray-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{ps.projectName}</span>
                      {ps.muted && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                          Muted
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveProject(ps.projectId)}
                      disabled={saving}
                      className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                      title="Remove project settings"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1 divide-y divide-gray-100">
                    <Toggle
                      label="Mute All Notifications"
                      description="Block all notifications from this project"
                      checked={ps.muted}
                      onChange={() => handleMuteProject(ps.projectId, ps.muted)}
                      disabled={saving}
                    />
                    <Toggle
                      label="Task Notifications"
                      description="Task assignments and updates"
                      checked={ps.taskNotifications}
                      onChange={() =>
                        handleToggleSetting(ps.projectId, 'taskNotifications', ps.taskNotifications)
                      }
                      disabled={ps.muted || saving}
                    />
                    <Toggle
                      label="RFI Notifications"
                      description="New RFIs and responses"
                      checked={ps.rfiNotifications}
                      onChange={() =>
                        handleToggleSetting(ps.projectId, 'rfiNotifications', ps.rfiNotifications)
                      }
                      disabled={ps.muted || saving}
                    />
                    <Toggle
                      label="Expense Notifications"
                      description="Expense approvals and updates"
                      checked={ps.expenseNotifications}
                      onChange={() =>
                        handleToggleSetting(
                          ps.projectId,
                          'expenseNotifications',
                          ps.expenseNotifications
                        )
                      }
                      disabled={ps.muted || saving}
                    />
                    <Toggle
                      label="Change Order Notifications"
                      description="Change order submissions and approvals"
                      checked={ps.changeOrderNotifications ?? true}
                      onChange={() =>
                        handleToggleSetting(
                          ps.projectId,
                          'changeOrderNotifications',
                          ps.changeOrderNotifications ?? true
                        )
                      }
                      disabled={ps.muted || saving}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default ProjectNotificationSettings;
