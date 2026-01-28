"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useScheduleAssignments } from '@/lib/hooks/useScheduleAssignments';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile, Project, ScheduleAssignment } from '@/types';
import ScheduleCalendar from '@/components/schedule/ScheduleCalendar';
import CrewAvailabilityGrid from '@/components/schedule/CrewAvailabilityGrid';
import AssignmentForm from '@/components/schedule/AssignmentForm';
import { Card, Button } from '@/components/ui';
import { PlusIcon, CalendarDaysIcon, UsersIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

type Tab = 'calendar' | 'crew';

export default function SchedulePage() {
  const { profile } = useAuth();
  const { assignments, loading, createAssignment, updateAssignment, deleteAssignment } = useScheduleAssignments({ orgId: profile?.orgId });
  const [tab, setTab] = useState<Tab>('calendar');
  const [calView, setCalView] = useState<'week' | 'month'>('week');
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ScheduleAssignment | null>(null);
  const [prefillDate, setPrefillDate] = useState<Date | undefined>();
  const [team, setTeam] = useState<Pick<UserProfile, 'uid' | 'displayName' | 'role'>[]>([]);
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name'>[]>([]);

  useEffect(() => {
    if (!profile?.orgId) return;
    getDocs(query(collection(db, 'users'), where('orgId', '==', profile.orgId))).then(snap => {
      setTeam(snap.docs.map(d => {
        const data = d.data();
        return { uid: d.id, displayName: data.displayName || '', role: data.role || '' };
      }));
    });
    getDocs(query(collection(db, 'projects'), where('orgId', '==', profile.orgId))).then(snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, name: d.data().name || '' })));
    });
  }, [profile?.orgId]);

  const handleAddForDate = (date: Date) => {
    setPrefillDate(date);
    setShowForm(true);
  };

  const handleClickAssignment = (a: ScheduleAssignment) => {
    setEditingAssignment(a);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: Omit<ScheduleAssignment, 'id' | 'createdAt'>) => {
    if (editingAssignment) {
      await updateAssignment(editingAssignment.id, data);
    } else {
      await createAssignment(data);
    }
    setShowForm(false);
    setEditingAssignment(null);
    setPrefillDate(undefined);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">Manage team assignments and view availability.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)} icon={<PlusIcon className="h-4 w-4" />}>
          Add Assignment
        </Button>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200">
        <button onClick={() => setTab('calendar')} className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px', tab === 'calendar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500')}>
          <CalendarDaysIcon className="h-4 w-4" /> Calendar
        </button>
        <button onClick={() => setTab('crew')} className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px', tab === 'crew' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500')}>
          <UsersIcon className="h-4 w-4" /> Crew Availability
        </button>
      </div>

      {tab === 'calendar' && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setCalView('week')} className={cn('px-3 py-1 text-xs rounded-full', calView === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}>Week</button>
            <button onClick={() => setCalView('month')} className={cn('px-3 py-1 text-xs rounded-full', calView === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}>Month</button>
          </div>
          <ScheduleCalendar
            assignments={assignments}
            view={calView}
            onAddAssignment={handleAddForDate}
            onClickAssignment={handleClickAssignment}
          />
        </Card>
      )}

      {tab === 'crew' && (
        <Card>
          <CrewAvailabilityGrid teamMembers={team.filter(m => ['EMPLOYEE', 'CONTRACTOR', 'SUB'].includes(m.role))} orgId={profile?.orgId || ''} />
        </Card>
      )}

      {showForm && (
        <AssignmentForm
          initialData={editingAssignment || (prefillDate ? { date: prefillDate, userId: '', projectId: '', startTime: '08:00', endTime: '17:00', status: 'scheduled' } as ScheduleAssignment : undefined)}
          users={team}
          projects={projects}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowForm(false); setEditingAssignment(null); setPrefillDate(undefined); }}
        />
      )}
    </div>
  );
}
