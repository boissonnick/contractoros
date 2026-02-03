"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy, limit } from 'firebase/firestore';
import { TimeEntry, Task, ScheduleAssignment, Project, Geofence } from '@/types';
import { isWithinGeofence } from '@/lib/geofence';
import {
  PlayIcon,
  StopIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import {
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { FirestoreError } from '@/components/ui';
import { formatDate } from '@/lib/date-utils';
import { OfflineProjectButton } from '@/components/offline/OfflineProjectButton';

export default function FieldPage() {
  const { user, profile } = useAuth();
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [todaysSchedule, setTodaysSchedule] = useState<ScheduleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [clockingIn, setClockingIn] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name'>[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [geofenceWarning, setGeofenceWarning] = useState('');

  // Get current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(pos),
        (err) => console.error('Location error:', err)
      );
    }
  }, []);

  // Update elapsed time
  useEffect(() => {
    if (!activeEntry) {
      setElapsedTime('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const start = activeEntry.clockIn instanceof Date
        ? activeEntry.clockIn
        : new Date((activeEntry.clockIn as any).seconds * 1000);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEntry]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user?.uid || !profile?.orgId) {
      setLoading(false);
      return;
    }

    setFetchError(null);
    setLoading(true);

    try {
      // Check for active time entry (org-scoped collection)
      const activeQuery = query(
        collection(db, `organizations/${profile.orgId}/timeEntries`),
        where('userId', '==', user.uid),
        where('status', '==', 'active')
      );
      const activeSnap = await getDocs(activeQuery);
      if (!activeSnap.empty) {
        setActiveEntry({ id: activeSnap.docs[0].id, ...activeSnap.docs[0].data() } as TimeEntry);
      }

      // Fetch today's tasks
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('assignedTo', 'array-contains', user.uid),
        where('status', 'in', ['assigned', 'in_progress'])
      );
      const tasksSnap = await getDocs(tasksQuery);
      setTodaysTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Task[]);

      // Fetch projects for org
      const projectsQuery = query(
        collection(db, 'projects'),
        where('orgId', '==', profile.orgId),
        where('status', '==', 'active')
      );
      const projectsSnap = await getDocs(projectsQuery);
      setProjects(projectsSnap.docs.map(d => ({ id: d.id, name: (d.data() as { name: string }).name })));

      // Fetch geofences for org
      const geofencesQuery = query(
        collection(db, 'geofences'),
        where('orgId', '==', profile.orgId)
      );
      const geofencesSnap = await getDocs(geofencesQuery);
      setGeofences(geofencesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Geofence[]);

    } catch (error) {
      console.error('Error fetching field data:', error);
      setFetchError('Failed to load data. The database may be unreachable.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, profile?.orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClockIn = async () => {
    if (!user?.uid || !profile?.orgId) return;

    setClockingIn(true);
    setGeofenceWarning('');

    // Geofence check
    if (selectedProject && location && geofences.length > 0) {
      const projectFences = geofences.filter(g => g.projectId === selectedProject && g.isActive);
      if (projectFences.length > 0) {
        const insideFence = projectFences.some(f =>
          isWithinGeofence(location.coords.latitude, location.coords.longitude, f.center.lat, f.center.lng, f.radiusMeters)
        );
        if (!insideFence) {
          setGeofenceWarning('You are outside the project geofence. Clock-in recorded with warning.');
        }
      }
    }

    try {
      const entry: Partial<TimeEntry> = {
        userId: user.uid,
        projectId: selectedProject,
        clockIn: Timestamp.now() as any,
        status: 'active',
        createdAt: Timestamp.now() as any,
      };

      if (location) {
        entry.clockInLocation = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date(),
        };
      }

      const docRef = await addDoc(collection(db, `organizations/${profile.orgId}/timeEntries`), entry);
      setActiveEntry({ id: docRef.id, ...entry } as TimeEntry);
    } catch (error) {
      console.error('Error clocking in:', error);
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeEntry?.id) return;

    setClockingIn(true);
    try {
      const clockOut = Timestamp.now();
      const clockIn = activeEntry.clockIn instanceof Date
        ? activeEntry.clockIn
        : new Date((activeEntry.clockIn as any).seconds * 1000);
      const totalMinutes = Math.floor((clockOut.toDate().getTime() - clockIn.getTime()) / 60000);

      await updateDoc(doc(db, `organizations/${profile!.orgId}/timeEntries`, activeEntry.id), {
        clockOut,
        totalMinutes,
        status: 'completed',
        updatedAt: Timestamp.now(),
      });
      setActiveEntry(null);
    } catch (error) {
      console.error('Error clocking out:', error);
    } finally {
      setClockingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (fetchError) {
    return <FirestoreError message={fetchError} onRetry={fetchData} />;
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {profile?.displayName?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          {formatDate(now, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Time Clock Card */}
      <div className={`rounded-2xl p-6 ${activeEntry ? 'bg-green-600' : 'bg-brand-primary'} text-white`}>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ClockIcon className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">
              {activeEntry ? 'Currently Working' : 'Ready to Work'}
            </span>
          </div>

          <div className="text-5xl font-bold font-mono mb-6">
            {elapsedTime}
          </div>

          {location && (
            <div className="flex items-center justify-center gap-1 text-sm opacity-75 mb-4">
              <MapPinIcon className="h-4 w-4" />
              <span>Location tracked</span>
            </div>
          )}

          {!activeEntry && projects.length > 0 && (
            <div className="mb-4 max-w-xs mx-auto space-y-2">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-gray-900 bg-white/90 border-0 focus:ring-2 focus:ring-white"
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {selectedProject && (
                <div className="bg-white/20 rounded-lg p-2">
                  <OfflineProjectButton
                    projectId={selectedProject}
                    projectName={projects.find(p => p.id === selectedProject)?.name}
                    variant="compact"
                    className="justify-center text-white [&_span]:text-white [&_button]:text-white/80 [&_button:hover]:text-white"
                  />
                </div>
              )}
            </div>
          )}

          {geofenceWarning && (
            <div className="mb-4 max-w-xs mx-auto bg-yellow-100 text-yellow-800 text-xs rounded-lg px-3 py-2">
              {geofenceWarning}
            </div>
          )}

          <button
            onClick={activeEntry ? handleClockOut : handleClockIn}
            disabled={clockingIn}
            className={`w-full max-w-xs mx-auto flex items-center justify-center gap-3 py-4 px-8 rounded-xl font-bold text-lg transition-all ${
              activeEntry
                ? 'bg-white text-red-600 hover:bg-red-50'
                : 'bg-white text-blue-600 hover:bg-blue-50'
            } disabled:opacity-50`}
          >
            {clockingIn ? (
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : activeEntry ? (
              <>
                <StopIcon className="h-6 w-6" />
                Clock Out
              </>
            ) : (
              <>
                <PlayIcon className="h-6 w-6" />
                Clock In
              </>
            )}
          </button>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Today's Tasks</h2>
          <Link href="/field/tasks" className="text-sm text-blue-600 hover:text-blue-700">
            View all
          </Link>
        </div>

        {todaysTasks.length > 0 ? (
          <div className="space-y-3">
            {todaysTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className={`p-2 rounded-full ${
                  task.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {task.status === 'in_progress' ? (
                    <ClockIcon className="h-5 w-5 text-blue-600" />
                  ) : (
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{task.title}</p>
                  {task.estimatedHours && (
                    <p className="text-sm text-gray-500">Est. {task.estimatedHours}h</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No tasks assigned for today</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/field/photos"
          className="bg-white rounded-xl border p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-medium text-gray-900">Take Photo</p>
          <p className="text-sm text-gray-500">Document progress</p>
        </Link>

        <Link
          href="/field/issue"
          className="bg-white rounded-xl border p-4 text-center hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <p className="font-medium text-gray-900">Report Issue</p>
          <p className="text-sm text-gray-500">Flag a blocker</p>
        </Link>
      </div>

      {/* Offline Access Card - shown when a project is selected or user has an active entry */}
      {(selectedProject || activeEntry?.projectId) && (
        <OfflineProjectButton
          projectId={selectedProject || activeEntry?.projectId || ''}
          projectName={projects.find(p => p.id === (selectedProject || activeEntry?.projectId))?.name}
          variant="card"
        />
      )}
    </div>
  );
}
