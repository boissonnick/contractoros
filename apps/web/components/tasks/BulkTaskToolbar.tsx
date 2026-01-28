"use client";

import React, { useState } from 'react';
import { TaskStatus, TaskPriority } from '@/types';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  XMarkIcon,
  TrashIcon,
  ArrowRightIcon,
  UserPlusIcon,
  FlagIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface BulkTaskToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusChange: (status: TaskStatus) => Promise<void>;
  onBulkPriorityChange: (priority: TaskPriority) => Promise<void>;
  onBulkAssign: (assigneeIds: string[]) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  teamMembers?: { uid: string; displayName: string }[];
}

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  { value: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'review', label: 'Review', color: 'bg-purple-100 text-purple-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-gray-500' },
  { value: 'medium', label: 'Medium', color: 'text-blue-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
];

export default function BulkTaskToolbar({
  selectedCount,
  onClearSelection,
  onBulkStatusChange,
  onBulkPriorityChange,
  onBulkAssign,
  onBulkDelete,
  teamMembers = [],
}: BulkTaskToolbarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusChange = async (status: TaskStatus) => {
    setIsProcessing(true);
    try {
      await onBulkStatusChange(status);
    } finally {
      setIsProcessing(false);
      setShowStatusMenu(false);
    }
  };

  const handlePriorityChange = async (priority: TaskPriority) => {
    setIsProcessing(true);
    try {
      await onBulkPriorityChange(priority);
    } finally {
      setIsProcessing(false);
      setShowPriorityMenu(false);
    }
  };

  const handleAssign = async (uid: string) => {
    setIsProcessing(true);
    try {
      await onBulkAssign([uid]);
    } finally {
      setIsProcessing(false);
      setShowAssignMenu(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} task(s)?`)) return;
    setIsProcessing(true);
    try {
      await onBulkDelete();
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3">
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-700">
          <CheckCircleIcon className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <button
            onClick={onClearSelection}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Status change */}
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-gray-700"
            onClick={() => {
              setShowStatusMenu(!showStatusMenu);
              setShowPriorityMenu(false);
              setShowAssignMenu(false);
            }}
            disabled={isProcessing}
          >
            <ArrowRightIcon className="h-4 w-4 mr-1" />
            Status
          </Button>
          {showStatusMenu && (
            <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-40">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', opt.color)}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority change */}
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-gray-700"
            onClick={() => {
              setShowPriorityMenu(!showPriorityMenu);
              setShowStatusMenu(false);
              setShowAssignMenu(false);
            }}
            disabled={isProcessing}
          >
            <FlagIcon className="h-4 w-4 mr-1" />
            Priority
          </Button>
          {showPriorityMenu && (
            <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-36">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handlePriorityChange(opt.value)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-gray-50',
                    opt.color
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assign */}
        {teamMembers.length > 0 && (
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-gray-700"
              onClick={() => {
                setShowAssignMenu(!showAssignMenu);
                setShowStatusMenu(false);
                setShowPriorityMenu(false);
              }}
              disabled={isProcessing}
            >
              <UserPlusIcon className="h-4 w-4 mr-1" />
              Assign
            </Button>
            {showAssignMenu && (
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-48 max-h-60 overflow-y-auto">
                {teamMembers.map((member) => (
                  <button
                    key={member.uid}
                    onClick={() => handleAssign(member.uid)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {member.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete */}
        <div className="pl-2 border-l border-gray-700">
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:bg-red-900/50 hover:text-red-300"
            onClick={handleDelete}
            disabled={isProcessing}
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
