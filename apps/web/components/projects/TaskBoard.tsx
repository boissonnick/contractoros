"use client";

import React, { useState } from 'react';
import { Task, TaskStatus, ProjectPhase } from '@/types';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { Button, Card, Badge, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

const taskColumns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'pending', title: 'To Do', color: 'bg-gray-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'review', title: 'Review', color: 'bg-yellow-100' },
  { id: 'completed', title: 'Done', color: 'bg-green-100' },
];

interface TaskBoardProps {
  projectId: string;
  tasks: Task[];
  phases?: ProjectPhase[];
  selectedPhaseId?: string | null;
  onTasksChange: (tasks: Task[]) => void;
}

export default function TaskBoard({ projectId, tasks, phases, selectedPhaseId, onTasksChange }: TaskBoardProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  const filteredTasks = selectedPhaseId
    ? tasks.filter(t => t.phaseId === selectedPhaseId)
    : tasks;

  const getTasksByStatus = (status: TaskStatus) => filteredTasks.filter(t => t.status === status);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    setAddingTask(true);
    try {
      const taskData: Partial<Task> = {
        projectId,
        title: newTaskTitle.trim(),
        status: 'pending',
        priority: 'medium',
        assignedTo: [],
        phaseId: selectedPhaseId || undefined,
        createdAt: Timestamp.now() as any,
      };

      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      onTasksChange([...tasks, { id: docRef.id, ...taskData } as Task]);
      setNewTaskTitle('');
      setShowAddTask(false);
    } catch (error) {
      logger.error('Error adding task', { error: error, component: 'TaskBoard' });
    } finally {
      setAddingTask(false);
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      onTasksChange(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (error) {
      logger.error('Error moving task', { error: error, component: 'TaskBoard' });
    }
  };

  const selectedPhase = phases?.find(p => p.id === selectedPhaseId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
          {selectedPhase && (
            <p className="text-sm text-gray-500">Showing tasks for: {selectedPhase.name}</p>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() => setShowAddTask(true)}
        >
          Add Task
        </Button>
      </div>

      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Task</h3>
              <button onClick={() => setShowAddTask(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <Input
              label="Task Title"
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
            {selectedPhase && (
              <p className="text-xs text-gray-500 mt-2">Phase: {selectedPhase.name}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddTask} loading={addingTask}>Add Task</Button>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {taskColumns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div key={column.id} className={cn('rounded-xl p-4', column.color)}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">{column.title}</h3>
                <span className="text-sm text-gray-500">{columnTasks.length}</span>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-sm font-medium text-gray-900 mb-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant={
                        task.priority === 'urgent' ? 'danger' :
                        task.priority === 'high' ? 'warning' :
                        'default'
                      } size="sm">
                        {task.priority}
                      </Badge>
                      <div className="flex gap-1">
                        {column.id !== 'pending' && (
                          <button
                            onClick={() => handleMoveTask(task.id, taskColumns[taskColumns.findIndex(c => c.id === column.id) - 1]?.id || 'pending')}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Move left"
                          >
                            ←
                          </button>
                        )}
                        {column.id !== 'completed' && (
                          <button
                            onClick={() => handleMoveTask(task.id, taskColumns[taskColumns.findIndex(c => c.id === column.id) + 1]?.id || 'completed')}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Move right"
                          >
                            →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-sm text-gray-400">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
