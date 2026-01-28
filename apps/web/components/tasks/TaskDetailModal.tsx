"use client";

import React, { useState, useCallback } from 'react';
import { Task, TaskStatus, ProjectPhase } from '@/types';
import { Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  PaperClipIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import TaskForm from './TaskForm';
import TaskComments from './TaskComments';
import TaskActivityLog from './TaskActivityLog';
import TaskAttachments from './TaskAttachments';

type Tab = 'details' | 'comments' | 'activity' | 'attachments';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'details', label: 'Details', icon: ListBulletIcon },
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
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        setEditing(false);
      } finally {
        setSaving(false);
      }
    },
    [task.id, onUpdate]
  );

  const handleAttachmentsChange = async (attachments: Task['attachments']) => {
    await onUpdate(task.id, { attachments });
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(task.id);
      onClose();
    }
  };

  const phaseName = phases.find((p) => p.id === task.phaseId)?.name;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-[10vh] overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{task.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              {phaseName && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {phaseName}
                </span>
              )}
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded', statusColors[task.status])}>
                {statusLabels[task.status]}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4">
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
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-4 max-h-[50vh] overflow-y-auto">
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
                onCancel={() => setEditing(false)}
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
                      {task.startDate ? new Date(task.startDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</span>
                    <p className="text-gray-700 mt-0.5">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
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

                {/* Edit button */}
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    Edit Task
                  </Button>
                </div>
              </div>
            )
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
            Created {new Date(task.createdAt).toLocaleDateString()}
            {task.updatedAt && ` · Updated ${new Date(task.updatedAt).toLocaleDateString()}`}
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
