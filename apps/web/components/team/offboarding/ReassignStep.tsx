"use client";

import React from 'react';
import { Badge } from '@/components/ui';
import { CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { ReassignStepProps } from './types';

export function ReassignStep({
  teamMembers,
  loadingTeam,
  selectedUser,
  impactPreview,
  onSelectUser,
}: ReassignStepProps) {
  const hasWorkToReassign =
    impactPreview && (impactPreview.taskCount > 0 || impactPreview.projectCount > 0);

  return (
    <div className="space-y-4">
      {!hasWorkToReassign ? (
        <div className="text-center py-8">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-900 font-medium">No work to reassign</p>
          <p className="text-sm text-gray-500 mt-1">
            This user has no assigned tasks or managed projects.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Select a team member to receive the {impactPreview?.taskCount || 0} tasks and{' '}
            {impactPreview?.projectCount || 0} projects currently assigned to this user.
          </p>

          {/* No reassignment option */}
          <label
            className={cn(
              'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
              !selectedUser
                ? 'border-brand-primary bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <input
              type="radio"
              name="reassign"
              checked={!selectedUser}
              onChange={() => onSelectUser(null)}
              className="h-4 w-4 text-brand-primary focus:ring-brand-primary/20"
            />
            <div>
              <p className="font-medium text-gray-900">Leave unassigned</p>
              <p className="text-sm text-gray-500">Tasks will have no assignee</p>
            </div>
          </label>

          {/* Team member options */}
          {loadingTeam ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : teamMembers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No other team members available for reassignment.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teamMembers.map((member) => (
                <label
                  key={member.id}
                  className={cn(
                    'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                    selectedUser?.id === member.id
                      ? 'border-brand-primary bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="reassign"
                    checked={selectedUser?.id === member.id}
                    onChange={() =>
                      onSelectUser({ id: member.id, name: member.displayName })
                    }
                    className="h-4 w-4 text-brand-primary focus:ring-brand-primary/20"
                  />
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{member.displayName}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                  <Badge variant="default" size="sm">
                    {member.role}
                  </Badge>
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
