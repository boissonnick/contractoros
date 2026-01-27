"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Project, Task, TaskStatus, UserProfile } from '@/types';
import { Button, Card, Badge, StatusBadge, Avatar, Input } from '@/components/ui';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowLeftIcon,
  PlusIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const taskColumns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'pending', title: 'To Do', color: 'bg-gray-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'review', title: 'Review', color: 'bg-yellow-100' },
  { id: 'completed', title: 'Done', color: 'bg-green-100' },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [client, setClient] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch project
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          router.push('/dashboard/projects');
          return;
        }
        const projectData = { id: projectDoc.id, ...projectDoc.data() } as Project;
        setProject(projectData);

        // Fetch client
        if (projectData.clientId) {
          const clientDoc = await getDoc(doc(db, 'users', projectData.clientId));
          if (clientDoc.exists()) {
            setClient({ uid: clientDoc.id, ...clientDoc.data() } as UserProfile);
          }
        }

        // Fetch tasks
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('projectId', '==', projectId)
        );
        const tasksSnap = await getDocs(tasksQuery);
        setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Task[]);

      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectId, router]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !profile?.uid) return;

    setAddingTask(true);
    try {
      const taskData: Partial<Task> = {
        projectId,
        title: newTaskTitle.trim(),
        status: 'pending',
        priority: 'medium',
        assignedTo: [],
        createdAt: Timestamp.now() as any,
      };

      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      setTasks(prev => [...prev, { id: docRef.id, ...taskData } as Task]);
      setNewTaskTitle('');
      setShowAddTask(false);
    } catch (error) {
      console.error('Error adding task:', error);
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
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) return null;

  const getTasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            All Projects
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <StatusBadge status={project.status as any} />
          </div>
          {project.description && (
            <p className="text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Cog6ToothIcon className="h-4 w-4" />}>
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPinIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {project.address.city}, {project.address.state}
              </p>
            </div>
          </div>
        </Card>

        {client && (
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <Avatar name={client.displayName} size="sm" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Client</p>
                <p className="text-sm font-medium text-gray-900 truncate">{client.displayName}</p>
              </div>
            </div>
          </Card>
        )}

        {project.budget && (
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Budget</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(project.budget)}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tasks</p>
              <p className="text-sm font-medium text-gray-900">
                {getTasksByStatus('completed').length} / {tasks.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Task Board */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowAddTask(true)}
          >
            Add Task
          </Button>
        </div>

        {/* Add Task Modal */}
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
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleAddTask} loading={addingTask}>
                  Add Task
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Kanban Board */}
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
                        {/* Quick move buttons */}
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

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href={`/dashboard/projects/${projectId}/photos`}>
          <Card hover className="text-center">
            <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Photos</p>
          </Card>
        </Link>
        <Link href={`/dashboard/projects/${projectId}/logs`}>
          <Card hover className="text-center">
            <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Daily Logs</p>
          </Card>
        </Link>
        <Link href={`/dashboard/projects/${projectId}/messages`}>
          <Card hover className="text-center">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Messages</p>
          </Card>
        </Link>
        <Link href={`/dashboard/projects/${projectId}/finances`}>
          <Card hover className="text-center">
            <CurrencyDollarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Finances</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
