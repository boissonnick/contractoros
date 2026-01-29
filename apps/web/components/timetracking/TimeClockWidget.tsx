'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ClockIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
  MapPinIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useActiveTimeEntry } from '@/lib/hooks/useTimeEntries';
import { useProjects } from '@/lib/hooks/useQueryHooks';
import { TimeEntry, TimeEntryLocation, BreakType, BREAK_TYPES, Project } from '@/types';

interface TimeClockWidgetProps {
  showProjectSelector?: boolean;
  compact?: boolean;
  onClockIn?: (entryId: string) => void;
  onClockOut?: (entry: TimeEntry) => void;
}

export function TimeClockWidget({
  showProjectSelector = true,
  compact = false,
  onClockIn,
  onClockOut,
}: TimeClockWidgetProps) {
  const { activeEntry, isClockingLoading, clockIn, clockOut, startBreak, endBreak } = useActiveTimeEntry();
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [isLoading, setIsLoading] = useState(false);
  const [showBreakMenu, setShowBreakMenu] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<TimeEntryLocation | null>(null);

  // Format elapsed time
  const formatElapsed = useCallback((startTime: Date, breaks: TimeEntry['breaks'] = []): string => {
    const now = new Date();
    let totalMs = now.getTime() - startTime.getTime();

    // Subtract completed breaks
    for (const brk of breaks) {
      if (brk.endTime) {
        totalMs -= new Date(brk.endTime).getTime() - new Date(brk.startTime).getTime();
      }
    }

    // Check if currently on break
    const activeBreak = breaks.find(b => !b.endTime);
    if (activeBreak) {
      totalMs -= now.getTime() - new Date(activeBreak.startTime).getTime();
    }

    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Update elapsed time every second
  useEffect(() => {
    if (activeEntry && (activeEntry.status === 'active' || activeEntry.status === 'paused')) {
      const interval = setInterval(() => {
        setElapsedTime(formatElapsed(activeEntry.clockIn, activeEntry.breaks));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime('00:00:00');
    }
  }, [activeEntry, formatElapsed]);

  // Get current location
  const getCurrentLocation = useCallback((): Promise<TimeEntryLocation | null> => {
    return new Promise((resolve) => {
      if (!locationEnabled || !navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [locationEnabled]);

  // Handle clock in
  const handleClockIn = async () => {
    setIsLoading(true);
    try {
      const location = await getCurrentLocation();
      const selectedProject = (projects as Project[]).find((p: Project) => p.id === selectedProjectId);

      const entryId = await clockIn({
        projectId: selectedProjectId || undefined,
        projectName: selectedProject?.name,
        location: location || undefined,
      });

      onClockIn?.(entryId);
    } catch (error) {
      console.error('Clock in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle clock out
  const handleClockOut = async () => {
    if (!activeEntry) return;

    setIsLoading(true);
    try {
      const location = await getCurrentLocation();
      await clockOut(activeEntry.id, { location: location || undefined });
      onClockOut?.(activeEntry);
    } catch (error) {
      console.error('Clock out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle start break
  const handleStartBreak = async (type: BreakType) => {
    if (!activeEntry) return;

    setIsLoading(true);
    try {
      const breakInfo = BREAK_TYPES.find(b => b.value === type);
      await startBreak(activeEntry.id, type, breakInfo?.isPaid);
      setShowBreakMenu(false);
    } catch (error) {
      console.error('Start break error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle end break
  const handleEndBreak = async () => {
    if (!activeEntry) return;

    const activeBreak = activeEntry.breaks.find(b => !b.endTime);
    if (!activeBreak) return;

    setIsLoading(true);
    try {
      await endBreak(activeEntry.id, activeBreak.id);
    } catch (error) {
      console.error('End break error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check location permission
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationEnabled(result.state === 'granted');
      });
    }
  }, []);

  const isOnBreak = activeEntry?.status === 'paused';
  const isClockedIn = activeEntry && (activeEntry.status === 'active' || activeEntry.status === 'paused');

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {isClockedIn ? (
          <>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isOnBreak ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-pulse'}`} />
              <span className="font-mono text-lg font-semibold">{elapsedTime}</span>
            </div>
            {isOnBreak ? (
              <Button size="sm" onClick={handleEndBreak} disabled={isLoading}>
                <PlayIcon className="h-4 w-4 mr-1" />
                Resume
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setShowBreakMenu(!showBreakMenu)} disabled={isLoading}>
                  <PauseIcon className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="danger" onClick={handleClockOut} disabled={isLoading}>
                  <StopIcon className="h-4 w-4 mr-1" />
                  Out
                </Button>
              </>
            )}
          </>
        ) : (
          <Button size="sm" onClick={handleClockIn} disabled={isLoading || isClockingLoading}>
            <PlayIcon className="h-4 w-4 mr-1" />
            Clock In
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Time Clock</h3>
          </div>
          {isClockedIn && (
            <Badge variant={isOnBreak ? 'warning' : 'success'}>
              {isOnBreak ? 'On Break' : 'Clocked In'}
            </Badge>
          )}
        </div>

        {/* Timer Display */}
        <div className="text-center py-6">
          <div className={`font-mono text-5xl font-bold ${isClockedIn ? (isOnBreak ? 'text-yellow-600' : 'text-green-600') : 'text-gray-400'}`}>
            {elapsedTime}
          </div>
          {isClockedIn && activeEntry.projectName && (
            <div className="mt-2 flex items-center justify-center gap-1 text-sm text-gray-600">
              <BriefcaseIcon className="h-4 w-4" />
              {activeEntry.projectName}
            </div>
          )}
          {isClockedIn && activeEntry.clockInLocation && (
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <MapPinIcon className="h-3 w-3" />
              Location recorded
            </div>
          )}
        </div>

        {/* Project Selector (when not clocked in) */}
        {!isClockedIn && showProjectSelector && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project (optional)
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">No project selected</option>
              {(projects as Project[])
                .filter((p: Project) => p.status === 'active')
                .map((project: Project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Location Toggle */}
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4" />
            <span>Track location</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!locationEnabled && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  () => setLocationEnabled(true),
                  () => setLocationEnabled(false)
                );
              } else {
                setLocationEnabled(!locationEnabled);
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              locationEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                locationEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isClockedIn ? (
            <>
              {isOnBreak ? (
                <Button className="flex-1" onClick={handleEndBreak} disabled={isLoading}>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Resume Work
                </Button>
              ) : (
                <>
                  <div className="relative flex-1">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowBreakMenu(!showBreakMenu)}
                      disabled={isLoading}
                    >
                      <PauseIcon className="h-5 w-5 mr-2" />
                      Break
                    </Button>
                    {showBreakMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        {BREAK_TYPES.map((breakType) => (
                          <button
                            key={breakType.value}
                            onClick={() => handleStartBreak(breakType.value)}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            {breakType.label}
                            <span className="text-gray-500 ml-1">
                              ({breakType.defaultMinutes}min, {breakType.isPaid ? 'paid' : 'unpaid'})
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={handleClockOut}
                    disabled={isLoading}
                  >
                    <StopIcon className="h-5 w-5 mr-2" />
                    Clock Out
                  </Button>
                </>
              )}
            </>
          ) : (
            <Button
              className="w-full"
              size="lg"
              onClick={handleClockIn}
              disabled={isLoading || isClockingLoading}
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Clock In
            </Button>
          )}
        </div>

        {/* Break Summary */}
        {isClockedIn && activeEntry.breaks.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Breaks taken: {activeEntry.breaks.filter(b => b.endTime).length}
              {activeEntry.totalBreakMinutes && (
                <span className="ml-2">
                  ({Math.round(activeEntry.totalBreakMinutes)} min total)
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
