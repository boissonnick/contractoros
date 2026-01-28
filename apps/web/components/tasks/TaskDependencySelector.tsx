"use client";

import React, { useState } from 'react';
import { Task, TaskDependency, DependencyType } from '@/types';
import { Button } from '@/components/ui';
import { LinkIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

const dependencyTypeLabels: Record<DependencyType, string> = {
  'finish-to-start': 'Finish → Start (FS)',
  'start-to-start': 'Start → Start (SS)',
  'finish-to-finish': 'Finish → Finish (FF)',
  'start-to-finish': 'Start → Finish (SF)',
};

interface TaskDependencySelectorProps {
  dependencies: TaskDependency[];
  onChange: (deps: TaskDependency[]) => void;
  availableTasks: Task[];
}

export default function TaskDependencySelector({
  dependencies,
  onChange,
  availableTasks,
}: TaskDependencySelectorProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [selectedType, setSelectedType] = useState<DependencyType>('finish-to-start');
  const [lag, setLag] = useState('0');

  const usedTaskIds = new Set(dependencies.map((d) => d.taskId));
  const unusedTasks = availableTasks.filter((t) => !usedTaskIds.has(t.id));

  const handleAdd = () => {
    if (!selectedTaskId) return;
    onChange([
      ...dependencies,
      { taskId: selectedTaskId, type: selectedType, lag: parseInt(lag) || 0 },
    ]);
    setSelectedTaskId('');
    setSelectedType('finish-to-start');
    setLag('0');
    setShowAdd(false);
  };

  const handleRemove = (taskId: string) => {
    onChange(dependencies.filter((d) => d.taskId !== taskId));
  };

  const getTaskTitle = (taskId: string) => {
    return availableTasks.find((t) => t.id === taskId)?.title || taskId;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Dependencies
      </label>

      {/* Existing dependencies */}
      {dependencies.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {dependencies.map((dep) => (
            <div
              key={dep.taskId}
              className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-1.5 text-sm"
            >
              <LinkIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="flex-1 truncate text-gray-700">
                {getTaskTitle(dep.taskId)}
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {dependencyTypeLabels[dep.type]}
              </span>
              {dep.lag !== 0 && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {dep.lag > 0 ? `+${dep.lag}d` : `${dep.lag}d`}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(dep.taskId)}
                className="text-gray-400 hover:text-red-500"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add dependency */}
      {showAdd ? (
        <div className="border border-gray-200 rounded-md p-3 space-y-2 bg-gray-50">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Depends on</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
            >
              <option value="">Select a task...</option>
              {unusedTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DependencyType)}
              >
                {(Object.entries(dependencyTypeLabels) as [DependencyType, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lag (days)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={lag}
                onChange={(e) => setLag(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={handleAdd} disabled={!selectedTaskId} type="button">
              Add
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} type="button">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          disabled={unusedTasks.length === 0}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add dependency
        </button>
      )}
    </div>
  );
}
