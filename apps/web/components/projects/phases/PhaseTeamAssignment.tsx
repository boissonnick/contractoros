"use client";

import React, { useState } from 'react';
import { ProjectPhase } from '@/types';
import { Button, Input } from '@/components/ui';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PhaseTeamAssignmentProps {
  phase: ProjectPhase;
  onUpdate: (data: { assignedTeamMembers: string[]; assignedSubcontractors: string[] }) => void;
}

export default function PhaseTeamAssignment({ phase, onUpdate }: PhaseTeamAssignmentProps) {
  const [newMember, setNewMember] = useState('');
  const [newSub, setNewSub] = useState('');

  const addMember = () => {
    const val = newMember.trim();
    if (!val || phase.assignedTeamMembers.includes(val)) return;
    onUpdate({
      assignedTeamMembers: [...phase.assignedTeamMembers, val],
      assignedSubcontractors: phase.assignedSubcontractors,
    });
    setNewMember('');
  };

  const removeMember = (uid: string) => {
    onUpdate({
      assignedTeamMembers: phase.assignedTeamMembers.filter(m => m !== uid),
      assignedSubcontractors: phase.assignedSubcontractors,
    });
  };

  const addSub = () => {
    const val = newSub.trim();
    if (!val || phase.assignedSubcontractors.includes(val)) return;
    onUpdate({
      assignedTeamMembers: phase.assignedTeamMembers,
      assignedSubcontractors: [...phase.assignedSubcontractors, val],
    });
    setNewSub('');
  };

  const removeSub = (id: string) => {
    onUpdate({
      assignedTeamMembers: phase.assignedTeamMembers,
      assignedSubcontractors: phase.assignedSubcontractors.filter(s => s !== id),
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Team</h4>

      {/* Team Members */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Team Members</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {phase.assignedTeamMembers.length === 0 && (
            <span className="text-xs text-gray-400">No members assigned</span>
          )}
          {phase.assignedTeamMembers.map((uid) => (
            <span key={uid} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
              {uid}
              <button onClick={() => removeMember(uid)} className="hover:text-red-500">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            placeholder="User ID"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
          />
          <Button variant="secondary" size="sm" onClick={addMember} icon={<UserPlusIcon className="h-4 w-4" />}>
            Add
          </Button>
        </div>
      </div>

      {/* Subcontractors */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Subcontractors</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {phase.assignedSubcontractors.length === 0 && (
            <span className="text-xs text-gray-400">No subs assigned</span>
          )}
          {phase.assignedSubcontractors.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-xs">
              {id}
              <button onClick={() => removeSub(id)} className="hover:text-red-500">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            placeholder="Sub ID"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSub())}
          />
          <Button variant="secondary" size="sm" onClick={addSub} icon={<UserPlusIcon className="h-4 w-4" />}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
