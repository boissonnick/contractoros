"use client";

import React, { useState } from 'react';
import { TaskPriority, TaskDependency, Task, ProjectPhase, RecurrenceConfig, TaskChecklistItem } from '@/types';
import { Button, Input, Textarea, Select } from '@/components/ui';
import InlineCreateModal from '@/components/ui/InlineCreateModal';
import PhaseForm from '@/components/projects/phases/PhaseForm';
import { NewTaskInput } from '@/lib/hooks/useTasks';
import TaskDependencySelector from './TaskDependencySelector';
import TaskAssignment from './TaskAssignment';
import TaskChecklist from './TaskChecklist';
import RecurringTaskConfig from './RecurringTaskConfig';
import TaskTemplateSelector from './TaskTemplateSelector';
import { DefaultTaskTemplate } from '@/lib/constants/defaultTaskTemplates';
import { PlusIcon, DocumentDuplicateIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

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
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  // Sprint 5: Checklist & Recurring
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>(task?.checklist || []);
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring || false);
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig | undefined>(task?.recurrenceConfig);

  const handleTemplateSelect = (template: DefaultTaskTemplate) => {
    setTitle(template.defaultTitle);
    setDescription(template.defaultDescription || '');
    setPriority(template.defaultPriority);
    setTrade(template.trade || '');
    setEstimatedHours(template.defaultEstimatedHours?.toString() || '');
    // Convert template checklist items to full TaskChecklistItems
    if (template.defaultChecklist) {
      setChecklist(
        template.defaultChecklist.map((item, index) => ({
          id: `checklist-${Date.now()}-${index}`,
          title: item.title,
          isCompleted: false,
          order: index,
        }))
      );
    }
    setShowTemplateSelector(false);
  };

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
      checklist: checklist.length > 0 ? checklist : undefined,
      isRecurring: isRecurring || undefined,
      recurrenceConfig: isRecurring ? recurrenceConfig : undefined,
    });
  };

  // Exclude current task from dependency options
  const dependencyOptions = allTasks.filter((t) => t.id !== task?.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Template Button (only for new tasks) */}
      {!task && (
        <button
          type="button"
          onClick={() => setShowTemplateSelector(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
          Start from Template
        </button>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TaskTemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

      {/* Checklist */}
      <div className="border-t border-gray-100 pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Checklist
        </label>
        <TaskChecklist
          checklist={checklist}
          onChange={setChecklist}
          editable
        />
      </div>

      {/* Advanced Options Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        {showAdvanced ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )}
        Advanced Options
      </button>

      {/* Advanced: Recurring Task Config */}
      {showAdvanced && (
        <div className="border-t border-gray-100 pt-4">
          <RecurringTaskConfig
            config={recurrenceConfig}
            onChange={setRecurrenceConfig}
            isEnabled={isRecurring}
            onToggle={setIsRecurring}
          />
        </div>
      )}

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
