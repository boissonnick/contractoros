'use client';

import { useState, useEffect } from 'react';
import {
  CloudIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SunIcon,
  CloudIcon as CloudyIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import {
  OfflineDailyLog,
  getOfflineDailyLogService,
  WEATHER_CONDITIONS,
} from '@/lib/offline/offline-daily-logs';
import { getCachedTeam, CachedTeamMember } from '@/lib/offline/cache-team';
import { useNetworkStatus } from '@/lib/offline/network-status';
import { DailyLogCategory, WeatherCondition } from '@/types';

interface OfflineDailyLogFormProps {
  projectId: string;
  projectName: string;
  orgId: string;
  userId: string;
  userName: string;
  onSave?: (localId: string) => void;
  onCancel?: () => void;
  existingLog?: OfflineDailyLog;
}

const CATEGORIES: { value: DailyLogCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'progress', label: 'Progress Update' },
  { value: 'issue', label: 'Issue/Problem' },
  { value: 'safety', label: 'Safety' },
  { value: 'weather', label: 'Weather Delay' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'subcontractor', label: 'Subcontractor' },
];

export function OfflineDailyLogForm({
  projectId,
  projectName,
  orgId,
  userId,
  userName,
  onSave,
  onCancel,
  existingLog,
}: OfflineDailyLogFormProps) {
  const { isOnline } = useNetworkStatus();
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<CachedTeamMember[]>([]);

  // Form state
  const [date, setDate] = useState(
    existingLog?.date || new Date().toISOString().split('T')[0]
  );
  const [category, setCategory] = useState<DailyLogCategory>(
    existingLog?.category || 'progress'
  );
  const [title, setTitle] = useState(existingLog?.title || '');
  const [description, setDescription] = useState(existingLog?.description || '');
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition | ''>(
    existingLog?.weather?.condition || ''
  );
  const [tempHigh, setTempHigh] = useState<string>(
    existingLog?.weather?.tempHigh?.toString() || ''
  );
  const [tempLow, setTempLow] = useState<string>(
    existingLog?.weather?.tempLow?.toString() || ''
  );
  const [workPerformed, setWorkPerformed] = useState(
    existingLog?.workPerformed?.join('\n') || ''
  );
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(
    existingLog?.workersOnSite || []
  );
  const [hoursWorked, setHoursWorked] = useState<string>(
    existingLog?.hoursWorked?.toString() || '8'
  );
  const [delays, setDelays] = useState(existingLog?.delays || '');
  const [issues, setIssues] = useState(existingLog?.issues || '');
  const [notes, setNotes] = useState(existingLog?.notes || '');

  // Load cached team members
  useEffect(() => {
    async function loadTeam() {
      const team = await getCachedTeam(orgId);
      setTeamMembers(team);
    }
    loadTeam();
  }, [orgId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const service = getOfflineDailyLogService();

      const logData = {
        projectId,
        projectName,
        orgId,
        userId,
        userName,
        date,
        category,
        title: title || `Daily Log - ${new Date(date).toLocaleDateString()}`,
        description,
        weather: weatherCondition
          ? {
              condition: weatherCondition,
              tempHigh: tempHigh ? parseInt(tempHigh) : undefined,
              tempLow: tempLow ? parseInt(tempLow) : undefined,
            }
          : undefined,
        workPerformed: workPerformed
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        workersOnSite: selectedWorkers,
        crewCount: selectedWorkers.length,
        hoursWorked: parseFloat(hoursWorked) || 8,
        delays: delays || undefined,
        issues: issues || undefined,
        notes: notes || undefined,
      };

      let localId: string;
      if (existingLog) {
        await service.updateDailyLog(existingLog.localId, logData);
        localId = existingLog.localId;
      } else {
        localId = await service.createDailyLog(logData);
      }

      onSave?.(localId);
    } catch (error) {
      console.error('Failed to save daily log:', error);
    } finally {
      setSaving(false);
    }
  };

  // Toggle worker selection
  const toggleWorker = (workerId: string) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Offline indicator */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          isOnline
            ? 'bg-green-50 text-green-700'
            : 'bg-amber-50 text-amber-700'
        }`}
      >
        {isOnline ? (
          <>
            <CloudIcon className="h-5 w-5" />
            <span>Online - will sync immediately</span>
          </>
        ) : (
          <>
            <CloudArrowUpIcon className="h-5 w-5" />
            <span>Offline - will sync when connected</span>
          </>
        )}
      </div>

      {/* Date and Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DailyLogCategory)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`Daily Log - ${new Date(date).toLocaleDateString()}`}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Weather Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <SunIcon className="h-5 w-5 text-amber-500" />
          <h3 className="font-medium text-gray-900">Weather</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Condition</label>
            <select
              value={weatherCondition}
              onChange={(e) => setWeatherCondition(e.target.value as WeatherCondition)}
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
            >
              <option value="">Select...</option>
              {WEATHER_CONDITIONS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">High (F)</label>
            <input
              type="number"
              value={tempHigh}
              onChange={(e) => setTempHigh(e.target.value)}
              placeholder="--"
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Low (F)</label>
            <input
              type="number"
              value={tempLow}
              onChange={(e) => setTempLow(e.target.value)}
              placeholder="--"
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Work Performed */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <DocumentTextIcon className="h-4 w-4 inline mr-1" />
          Work Performed (one item per line)
        </label>
        <textarea
          value={workPerformed}
          onChange={(e) => setWorkPerformed(e.target.value)}
          rows={4}
          placeholder="- Installed drywall in master bedroom&#10;- Ran electrical in kitchen&#10;- Framed closet"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Workers on Site */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium text-gray-900">Workers on Site</h3>
          </div>
          <span className="text-sm text-gray-500">
            {selectedWorkers.length} selected
          </span>
        </div>
        {teamMembers.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {teamMembers.map((member) => (
              <button
                key={member.uid}
                type="button"
                onClick={() => toggleWorker(member.uid)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  selectedWorkers.includes(member.uid)
                    ? 'bg-blue-100 border-blue-300 border'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    selectedWorkers.includes(member.uid)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{member.displayName}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No cached team members. Connect to load team.
          </p>
        )}
      </div>

      {/* Hours Worked */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <ClockIcon className="h-4 w-4 inline mr-1" />
          Total Hours Worked
        </label>
        <input
          type="number"
          step="0.5"
          min="0"
          max="24"
          value={hoursWorked}
          onChange={(e) => setHoursWorked(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Description/Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Summary/Notes
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Overall progress, key accomplishments, general notes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Issues/Delays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <ExclamationTriangleIcon className="h-4 w-4 inline mr-1 text-amber-500" />
            Delays
          </label>
          <textarea
            value={delays}
            onChange={(e) => setDelays(e.target.value)}
            rows={2}
            placeholder="Weather delays, material shortages..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <ExclamationTriangleIcon className="h-4 w-4 inline mr-1 text-red-500" />
            Issues
          </label>
          <textarea
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            rows={2}
            placeholder="Problems encountered, safety concerns..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? (
            'Saving...'
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              {isOnline ? 'Save & Sync' : 'Save Offline'}
            </>
          )}
        </Button>
      </div>

      {/* Pending sync indicator */}
      {existingLog?.syncStatus === 'pending' && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          <CloudArrowUpIcon className="h-5 w-5" />
          <span>This log is saved locally and will sync when online</span>
        </div>
      )}
    </form>
  );
}

export default OfflineDailyLogForm;
