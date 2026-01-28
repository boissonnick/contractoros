"use client";

import React from 'react';
import { UserCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TeamMember {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: string;
}

interface TaskAssignmentProps {
  assignedTo: string[];
  onAssignedToChange: (uids: string[]) => void;
  assignedSubId: string;
  onAssignedSubChange: (subId: string) => void;
  teamMembers: TeamMember[];
}

export default function TaskAssignment({
  assignedTo,
  onAssignedToChange,
  assignedSubId,
  onAssignedSubChange,
  teamMembers,
}: TaskAssignmentProps) {
  const assignedMembers = teamMembers.filter((m) => assignedTo.includes(m.uid));
  const unassignedMembers = teamMembers.filter((m) => !assignedTo.includes(m.uid));

  const handleAssign = (uid: string) => {
    if (!assignedTo.includes(uid)) {
      onAssignedToChange([...assignedTo, uid]);
    }
  };

  const handleUnassign = (uid: string) => {
    onAssignedToChange(assignedTo.filter((id) => id !== uid));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Assigned To
      </label>

      {/* Current assignees */}
      {assignedMembers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {assignedMembers.map((member) => (
            <span
              key={member.uid}
              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full px-2.5 py-1 text-sm"
            >
              <UserCircleIcon className="h-4 w-4" />
              {member.displayName}
              <button
                type="button"
                onClick={() => handleUnassign(member.uid)}
                className="text-blue-400 hover:text-blue-600"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add assignee dropdown */}
      {unassignedMembers.length > 0 && (
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          value=""
          onChange={(e) => {
            if (e.target.value) handleAssign(e.target.value);
          }}
        >
          <option value="">Add team member...</option>
          {unassignedMembers.map((m) => (
            <option key={m.uid} value={m.uid}>
              {m.displayName} ({m.role})
            </option>
          ))}
        </select>
      )}

      {/* Subcontractor assignment */}
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subcontractor
        </label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter subcontractor ID (will be replaced with picker)"
          value={assignedSubId}
          onChange={(e) => onAssignedSubChange(e.target.value)}
        />
      </div>
    </div>
  );
}
