"use client";

import React, { useState, useCallback } from 'react';
import { Task, TaskStatus, ProjectPhase, TaskChecklistItem } from '@/types';
import { Button, Badge, toast } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  PaperClipIcon,
  ListBulletIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import TaskForm from './TaskForm';
import TaskComments from './TaskComments';
import TaskActivityLog from './TaskActivityLog';
import TaskAttachments from './TaskAttachments';
import TaskChecklist from './TaskChecklist';
import { formatDate } from '@/lib/date-utils';

type Tab = 'details' | 'checklist' | 'comments' | 'activity' | 'attachments';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'details', label: 'Details', icon: ListBulletIcon },
  { id: 'checklist', label: 'Checklist', icon: CheckCircleIcon },
  { id: 'comments', label: 'Comments', icon: ChatBubbleLeftIcon },
  { id: 'activity', label: 'Activity', icon: ClockIcon },
  { id: 'attachments', label: 'Files', icon: PaperClipIcon },
];

const statusLabels: Record<TaskStatus, string> = {
  pending: 'To Do',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  review: 'Review',
  completed: 'Done',
};

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  review: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

interface TaskDetailModalProps {
  task: Task;
  projectId: string;
  phases?: ProjectPhase[];
  allTasks?: Task[];
  teamMembers?: { uid: string; displayName: string; photoURL?: string; role: string }[];
  userId?: string;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

export default function TaskDetailModal({
  task,
  projectId,
  phases = [],
  allTasks = [],
  teamMembers = [],
  userId,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Handle close with unsaved changes confirmation
  const handleClose = () => {
    if (editing && isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setIsDirty(false);
        setEditing(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    await onUpdate(task.id, {
      status: newStatus,
      ...(newStatus === 'completed' ? { completedAt: new Date() } : {}),
    });
  };

  const handleSave = useCallback(
    async (data: Parameters<typeof onUpdate>[1]) => {
      setSaving(true);
      try {
        await onUpdate(task.id, data as Partial<Task>);
        setIsDirty(false);
        setEditing(false);
        toast.success('Task updated');
      } catch {
        toast.error('Failed to update task');
      } finally {
        setSaving(false);
      }
    },
    [task.id, onUpdate]
  );

  const handleAttachmentsChange = async (attachments: Task['attachments']) => {
    await onUpdate(task.id, { attachments });
  };

  const handleChecklistChange = async (checklist: TaskChecklistItem[]) => {
    try {
      await onUpdate(task.id, { checklist });
      // Show subtle feedback for checklist completion
      const completedCount = checklist.filter(item => item.isCompleted).length;
      const totalCount = checklist.length;
      if (totalCount > 0 && completedCount === totalCount) {
        toast.success('Checklist complete!');
      }
    } catch {
      toast.error('Failed to update checklist');
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(task.id);
      onClose();
    }
  };

  const phaseName = phases.find((p) => p.id === task.phaseId)?.name;
  const checklistProgress = task.checklist?.length
    ? Math.round((task.checklist.filter(item => item.isCompleted).length / task.checklist.length) * 100)
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-[10vh] overflow-y-auto overscroll-contain">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{task.title}</h2>
              {task.isRecurring && (
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <ArrowPathIcon className="h-3 w-3" />
                  Recurring
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {phaseName && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {phaseName}
                </span>
              )}
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded', statusColors[task.status])}>
                {statusLabels[task.status]}
              </span>
              {checklistProgress !== null && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  Checklist: {checklistProgress}%
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-4 p-2 -m-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Status quick-change */}
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-gray-500 mr-1">Status:</span>
          {(Object.keys(statusLabels) as TaskStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={cn(
                'text-xs px-2 py-1 rounded transition-colors',
                task.status === status
                  ? statusColors[status]
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              )}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const showBadge = tab.id === 'checklist' && task.checklist && task.checklist.length > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {showBadge && (
                  <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {task.checklist!.filter(item => item.isCompleted).length}/{task.checklist!.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-4 flex-1 overflow-y-auto min-h-0">
          {activeTab === 'details' && (
            editing ? (
              <TaskForm
                task={task}
                projectId={projectId}
                phases={phases}
                allTasks={allTasks}
                teamMembers={teamMembers}
                onSubmit={async (data) => {
                  await handleSave(data as Partial<Task>);
                }}
                onCancel={() => {
                  if (isDirty) {
                    if (window.confirm('You have unsaved changes. Discard them?')) {
                      setIsDirty(false);
                      setEditing(false);
                    }
                  } else {
                    setEditing(false);
                  }
                }}
                onDirtyChange={setIsDirty}
                loading={saving}
              />
            ) : (
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {task.description || 'No description.'}
                  </p>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phase</span>
                    <div className="mt-0.5">
                      <select
                        value={task.phaseId || ''}
                        onChange={(e) => onUpdate(task.id, { phaseId: e.target.value || undefined })}
                        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      >
                        <option value="">No phase</option>
                        {phases.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</span>
                    <p className="text-gray-700 capitalize mt-0.5">{task.priority}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trade</span>
                    <p className="text-gray-700 mt-0.5">{task.trade || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Date</span>
                    <p className="text-gray-700 mt-0.5">
                      {task.startDate ? formatDate(task.startDate) : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</span>
                    <p className="text-gray-700 mt-0.5">
                      {task.dueDate ? formatDate(task.dueDate) : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Est. Hours</span>
                    <p className="text-gray-700 mt-0.5">{task.estimatedHours ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actual Hours</span>
                    <p className="text-gray-700 mt-0.5">{task.actualHours ?? '—'}</p>
                  </div>
                </div>

                {/* Hours comparison */}
                {task.estimatedHours && task.actualHours && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Hours Tracking</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className={cn(
                          'text-sm font-medium',
                          task.actualHours > task.estimatedHours ? 'text-red-600' : 'text-green-600'
                        )}>
                          {task.actualHours}h / {task.estimatedHours}h
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            task.actualHours > task.estimatedHours ? 'bg-red-500' : 'bg-green-500'
                          )}
                          style={{
                            width: `${Math.min((task.actualHours / task.estimatedHours) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      {task.actualHours > task.estimatedHours && (
                        <p className="text-xs text-red-600 mt-1">
                          {(task.actualHours - task.estimatedHours).toFixed(1)}h over estimate
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Assignees */}
                {task.assignedTo.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned To</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {task.assignedTo.map((uid) => {
                        const member = teamMembers.find((m) => m.uid === uid);
                        return (
                          <span key={uid} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {member?.displayName || uid}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dependencies */}
                {task.dependencies.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dependencies</span>
                    <div className="space-y-1 mt-1">
                      {task.dependencies.map((dep) => {
                        const depTask = allTasks.find((t) => t.id === dep.taskId);
                        return (
                          <div key={dep.taskId} className="text-xs text-gray-600 flex items-center gap-1.5">
                            <span className={cn(
                              'w-2 h-2 rounded-full',
                              depTask?.status === 'completed' ? 'bg-green-400' : 'bg-gray-300'
                            )} />
                            {depTask?.title || dep.taskId}
                            <span className="text-gray-400">({dep.type})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recurring info */}
                {task.isRecurring && task.recurrenceConfig && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recurrence</span>
                    <div className="mt-1 p-2 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700">
                        Every {task.recurrenceConfig.interval > 1 ? task.recurrenceConfig.interval + ' ' : ''}
                        {task.recurrenceConfig.frequency}
                        {task.recurrenceConfig.endDate && (
                          <> until {formatDate(task.recurrenceConfig.endDate)}</>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Edit button */}
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    Edit Task
                  </Button>
                </div>
              </div>
            )
          )}

          {activeTab === 'checklist' && (
            <TaskChecklist
              checklist={task.checklist || []}
              onChange={handleChecklistChange}
              editable={true}
              userId={userId}
            />
          )}

          {activeTab === 'comments' && (
            <TaskComments taskId={task.id} />
          )}

          {activeTab === 'activity' && (
            <TaskActivityLog taskId={task.id} />
          )}

          {activeTab === 'attachments' && (
            <TaskAttachments
              taskId={task.id}
              projectId={projectId}
              attachments={task.attachments}
              onAttachmentsChange={handleAttachmentsChange}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Created {formatDate(task.createdAt)}
            {task.updatedAt && ` · Updated ${formatDate(task.updatedAt)}`}
          </div>
          {onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Delete this task?</span>
                <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>No</Button>
                <Button size="sm" variant="primary" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Yes, Delete</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setConfirmDelete(true)} className="text-red-600 border-red-200 hover:bg-red-50">
                Delete
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
