"use client";

import React, { useState } from 'react';
import { ScheduleAssignment, UserProfile, Project } from '@/types';
import { Button, Input } from '@/components/ui';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AssignmentFormProps {
  initialData?: ScheduleAssignment;
  users: Pick<UserProfile, 'uid' | 'displayName' | 'role'>[];
  projects: Pick<Project, 'id' | 'name'>[];
  onSubmit: (data: Omit<ScheduleAssignment, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function AssignmentForm({ initialData, users, projects, onSubmit, onCancel }: AssignmentFormProps) {
  const [userId, setUserId] = useState(initialData?.userId || '');
  const [projectId, setProjectId] = useState(initialData?.projectId || '');
  const [date, setDate] = useState(initialData?.date ? initialData.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(initialData?.startTime || '08:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '17:00');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [saving, setSaving] = useState(false);

  const selectedUser = users.find(u => u.uid === userId);
  const selectedProject = projects.find(p => p.id === projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !projectId || !date) return;
    setSaving(true);
    try {
      await onSubmit({
        userId,
        projectId,
        date: new Date(date + 'T00:00:00'),
        startTime,
        endTime,
        status: initialData?.status || 'scheduled',
        userName: selectedUser?.displayName,
        projectName: selectedProject?.name,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">{initialData ? 'Edit Assignment' : 'New Assignment'}</h3>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
            <select value={userId} onChange={e => setUserId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required>
              <option value="">Select...</option>
              {users.map(u => <option key={u.uid} value={u.uid}>{u.displayName} ({u.role})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" required>
              <option value="">Select...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <Input label="End Time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
          <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>{initialData ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
