"use client";

import React, { useState } from 'react';
import { TaskPriority, TaskDependency, Task, ProjectPhase } from '@/types';
import { Button, Input, Textarea, Select } from '@/components/ui';
import InlineCreateModal from '@/components/ui/InlineCreateModal';
import PhaseForm from '@/components/projects/phases/PhaseForm';
import { NewTaskInput } from '@/lib/hooks/useTasks';
import TaskDependencySelector from './TaskDependencySelector';
import TaskAssignment from './TaskAssignment';
import { PlusIcon } from '@heroicons/react/24/outline';

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface TaskFormProps {
  /** If provided, form is in edit mode */
  task?: Task;
  projectId: string;
  phases?: ProjectPhase[];
  allTasks?: Task[];          // for dependency selector
  teamMembers?: { uid: string; displayName: string; photoURL?: string; role: string }[];
  onSubmit: (data: NewTaskInput) => Promise<void>;
  onCancel: () => void;
  onPhaseCreated?: (phase: ProjectPhase) => void;
  loading?: boolean;
}

export default function TaskForm({
  task,
  projectId,
  phases = [],
  allTasks = [],
  teamMembers = [],
  onSubmit,
  onCancel,
  onPhaseCreated,
  loading = false,
}: TaskFormProps) {
  const [showCreatePhase, setShowCreatePhase] = useState(false);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [phaseId, setPhaseId] = useState(task?.phaseId || '');
  const [parentTaskId] = useState(task?.parentTaskId || '');
  const [trade, setTrade] = useState(task?.trade || '');
  const [assignedTo, setAssignedTo] = useState<string[]>(task?.assignedTo || []);
  const [assignedSubId, setAssignedSubId] = useState(task?.assignedSubId || '');
  const [startDate, setStartDate] = useState(
    task?.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ''
  );
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [duration, setDuration] = useState(task?.duration?.toString() || '');
  const [estimatedHours, setEstimatedHours] = useState(task?.estimatedHours?.toString() || '');
  const [dependencies, setDependencies] = useState<TaskDependency[]>(task?.dependencies || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      phaseId: phaseId || undefined,
      parentTaskId: parentTaskId || undefined,
      priority,
      assignedTo,
      assignedSubId: assignedSubId || undefined,
      trade: trade || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      dependencies,
    });
  };

  // Exclude current task from dependency options
  const dependencyOptions = allTasks.filter((t) => t.id !== task?.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <Input
        label="Task Title"
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />

      {/* Description */}
      <Textarea
        label="Description"
        placeholder="Add details, notes, or requirements..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      {/* Phase + Priority row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Phase</label>
            <button
              type="button"
              onClick={() => setShowCreatePhase(true)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
            >
              <PlusIcon className="h-3 w-3" /> Create Phase
            </button>
          </div>
          <select
            value={phaseId}
            onChange={(e) => setPhaseId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">No phase</option>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          options={priorityOptions}
        />
      </div>

      {/* Create Phase Modal */}
      <InlineCreateModal open={showCreatePhase} onClose={() => setShowCreatePhase(false)} title="Create New Phase">
        <PhaseForm
          allPhases={phases}
          projectId={projectId}
          onSubmit={async (data) => {
            // The parent will handle Firestore write; we just need to close and notify
            const newPhase = { ...data, id: '', createdAt: new Date() } as ProjectPhase;
            onPhaseCreated?.(newPhase);
            setShowCreatePhase(false);
          }}
          onCancel={() => setShowCreatePhase(false)}
        />
      </InlineCreateModal>

      {/* Trade */}
      <Input
        label="Trade"
        placeholder="e.g. Electrical, Plumbing, HVAC..."
        value={trade}
        onChange={(e) => setTrade(e.target.value)}
      />

      {/* Dates */}
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <Input
          label="Duration (days)"
          type="number"
          min="0"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>

      {/* Estimated hours */}
      <Input
        label="Estimated Hours"
        type="number"
        min="0"
        step="0.5"
        value={estimatedHours}
        onChange={(e) => setEstimatedHours(e.target.value)}
      />

      {/* Assignment */}
      <TaskAssignment
        assignedTo={assignedTo}
        onAssignedToChange={setAssignedTo}
        assignedSubId={assignedSubId}
        onAssignedSubChange={setAssignedSubId}
        teamMembers={teamMembers}
      />

      {/* Dependencies */}
      <TaskDependencySelector
        dependencies={dependencies}
        onChange={setDependencies}
        availableTasks={dependencyOptions}
      />

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading} disabled={!title.trim()}>
          {task ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
