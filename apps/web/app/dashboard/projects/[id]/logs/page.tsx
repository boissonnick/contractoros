"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { Button, Card, Input, Avatar, Badge } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlusIcon,
  SunIcon,
  CloudIcon,
  BoltIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CameraIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Project, DailyLog } from '@/types';

interface DailyLogWithId extends DailyLog {
  id: string;
}

const weatherIcons: Record<string, React.ReactNode> = {
  sunny: <SunIcon className="h-5 w-5 text-yellow-500" />,
  cloudy: <CloudIcon className="h-5 w-5 text-gray-500" />,
  rainy: <BoltIcon className="h-5 w-5 text-blue-500" />,
  stormy: <BoltIcon className="h-5 w-5 text-purple-500" />,
};

const weatherOptions = [
  { value: 'sunny', label: 'Sunny', temp: 'Clear skies' },
  { value: 'cloudy', label: 'Cloudy', temp: 'Overcast' },
  { value: 'rainy', label: 'Rainy', temp: 'Precipitation' },
  { value: 'stormy', label: 'Stormy', temp: 'Severe weather' },
];

export default function ProjectLogsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  const { user, profile } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<DailyLogWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewLog, setShowNewLog] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newLog, setNewLog] = useState({
    weather: 'sunny',
    temperature: '',
    workersOnSite: '',
    workPerformed: '',
    materials: '',
    equipment: '',
    delays: '',
    safetyNotes: '',
    notes: '',
  });

  useEffect(() => {
    loadProjectAndLogs();
  }, [projectId]);

  const loadProjectAndLogs = async () => {
    setLoading(true);
    try {
      // Load project
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        setProject({ ...projectDoc.data(), id: projectDoc.id } as Project);
      }

      // Load logs
      const logsQuery = query(
        collection(db, 'dailyLogs'),
        where('projectId', '==', projectId),
        orderBy('date', 'desc')
      );
      const logsSnap = await getDocs(logsQuery);
      const logsData = logsSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date?.toDate() || new Date(),
      })) as DailyLogWithId[];
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLog = async () => {
    if (!user?.uid || !profile?.orgId) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'dailyLogs'), {
        projectId,
        orgId: profile.orgId,
        date: Timestamp.now(),
        weather: {
          condition: newLog.weather,
          temperature: newLog.temperature ? parseInt(newLog.temperature) : null,
        },
        workersOnSite: newLog.workersOnSite ? parseInt(newLog.workersOnSite) : 0,
        workPerformed: newLog.workPerformed,
        materials: newLog.materials,
        equipment: newLog.equipment,
        delays: newLog.delays,
        safetyNotes: newLog.safetyNotes,
        notes: newLog.notes,
        photos: [],
        createdBy: user.uid,
        createdAt: Timestamp.now(),
      });

      setShowNewLog(false);
      setNewLog({
        weather: 'sunny',
        temperature: '',
        workersOnSite: '',
        workPerformed: '',
        materials: '',
        equipment: '',
        delays: '',
        safetyNotes: '',
        notes: '',
      });
      loadProjectAndLogs();
    } catch (error) {
      console.error('Error creating log:', error);
      alert('Failed to create log. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleLogExpand = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">Daily Logs</h1>
              <p className="text-sm text-gray-500">{project?.name}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowNewLog(true)}
              icon={<PlusIcon className="h-5 w-5" />}
            >
              New Log
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Log Form */}
        {showNewLog && (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Daily Log - {formatDate(new Date())}
              </h2>
              <button
                onClick={() => setShowNewLog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-6">
              {/* Weather Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weather Conditions
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {weatherOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setNewLog({ ...newLog, weather: option.value })}
                      className={cn(
                        'p-3 rounded-lg border-2 text-center transition-all',
                        newLog.weather === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex justify-center mb-1">
                        {weatherIcons[option.value]}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{option.label}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <Input
                    label="Temperature (°F)"
                    type="number"
                    placeholder="75"
                    value={newLog.temperature}
                    onChange={(e) => setNewLog({ ...newLog, temperature: e.target.value })}
                  />
                  <Input
                    label="Workers on Site"
                    type="number"
                    placeholder="8"
                    value={newLog.workersOnSite}
                    onChange={(e) => setNewLog({ ...newLog, workersOnSite: e.target.value })}
                  />
                </div>
              </div>

              {/* Work Performed */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Performed Today
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the work completed today..."
                  value={newLog.workPerformed}
                  onChange={(e) => setNewLog({ ...newLog, workPerformed: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Materials & Equipment */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Materials Used
                  </label>
                  <textarea
                    rows={2}
                    placeholder="List materials used..."
                    value={newLog.materials}
                    onChange={(e) => setNewLog({ ...newLog, materials: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment Used
                  </label>
                  <textarea
                    rows={2}
                    placeholder="List equipment used..."
                    value={newLog.equipment}
                    onChange={(e) => setNewLog({ ...newLog, equipment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Delays & Safety */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delays or Issues
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any delays or issues encountered..."
                    value={newLog.delays}
                    onChange={(e) => setNewLog({ ...newLog, delays: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Safety Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Safety observations or incidents..."
                    value={newLog.safetyNotes}
                    onChange={(e) => setNewLog({ ...newLog, safetyNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Any other notes or observations..."
                  value={newLog.notes}
                  onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowNewLog(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateLog}
                  loading={saving}
                  disabled={!newLog.workPerformed.trim()}
                >
                  Save Daily Log
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Logs List */}
        {logs.length === 0 && !showNewLog ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No daily logs yet</h3>
            <p className="text-gray-500 mb-6">Start documenting your project progress with daily logs.</p>
            <Button
              variant="primary"
              onClick={() => setShowNewLog(true)}
              icon={<PlusIcon className="h-5 w-5" />}
            >
              Create First Log
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id} className="overflow-hidden">
                <button
                  onClick={() => toggleLogExpand(log.id)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {formatDate(log.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {weatherIcons[log.weather?.condition || 'sunny']}
                      {log.weather?.temperature && (
                        <span className="text-sm text-gray-500">{log.weather.temperature}°F</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{log.workersOnSite || 0} workers</span>
                    </div>
                  </div>
                  {expandedLog === log.id ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {expandedLog === log.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    {log.workPerformed && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Work Performed</h4>
                        <p className="text-gray-600 whitespace-pre-wrap">{log.workPerformed}</p>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      {log.materials && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Materials</h4>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{log.materials}</p>
                        </div>
                      )}
                      {log.equipment && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Equipment</h4>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{log.equipment}</p>
                        </div>
                      )}
                    </div>

                    {log.delays && (
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-800 mb-1">Delays/Issues</h4>
                        <p className="text-sm text-yellow-700 whitespace-pre-wrap">{log.delays}</p>
                      </div>
                    )}

                    {log.safetyNotes && (
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-orange-800 mb-1">Safety Notes</h4>
                        <p className="text-sm text-orange-700 whitespace-pre-wrap">{log.safetyNotes}</p>
                      </div>
                    )}

                    {log.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Additional Notes</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{log.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
