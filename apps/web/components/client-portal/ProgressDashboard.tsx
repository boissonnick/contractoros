'use client';

import { useMemo } from 'react';
import { Project, Activity } from '@/types';
import {
  ClockIcon,
  CalendarIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface Phase {
  id: string;
  name: string;
  progress: number;
  status: 'completed' | 'in_progress' | 'upcoming';
}

interface Milestone {
  id: string;
  name: string;
  date: Date;
  completed: boolean;
}

interface ProgressDashboardProps {
  project: Project;
  phases: Phase[];
  milestones: Milestone[];
  recentActivity: Activity[];
  estimatedCompletionDate?: Date;
}

export function ProgressDashboard({
  project,
  phases,
  milestones,
  recentActivity,
  estimatedCompletionDate,
}: ProgressDashboardProps) {
  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (phases.length === 0) return 0;
    const totalProgress = phases.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(totalProgress / phases.length);
  }, [phases]);

  // Sort milestones by date
  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [milestones]);

  // Calculate circle dash offset for progress ring
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (overallProgress / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Top Row: Progress Circle + Completion Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Circular Progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Overall Progress</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{overallProgress}%</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            {project.name}
          </p>
        </div>

        {/* Estimated Completion */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Estimated Completion</h3>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <CalendarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              {estimatedCompletionDate ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 tracking-tight">
                    {new Date(estimatedCompletionDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(estimatedCompletionDate).getFullYear()}
                  </p>
                </>
              ) : (
                <p className="text-gray-500">To be determined</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phase Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Phase Progress</h3>
        <div className="space-y-4">
          {phases.map((phase) => (
            <div key={phase.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {phase.status === 'completed' ? (
                    <CheckCircleSolidIcon className="h-4 w-4 text-green-500" />
                  ) : phase.status === 'in_progress' ? (
                    <ClockIcon className="h-4 w-4 text-blue-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className="text-sm font-medium text-gray-700">{phase.name}</span>
                </div>
                <span className="text-sm text-gray-500">{phase.progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    phase.status === 'completed'
                      ? 'bg-green-500'
                      : phase.status === 'in_progress'
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row: Milestones + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Milestones */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Milestones</h3>
          {sortedMilestones.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No milestones set</p>
          ) : (
            <div className="space-y-3">
              {sortedMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    milestone.completed ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  {milestone.completed ? (
                    <CheckCircleSolidIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <FlagIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${milestone.completed ? 'text-green-700' : 'text-gray-700'}`}>
                      {milestone.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(milestone.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {activity.action} - {activity.entityName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                      {new Date(activity.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProgressDashboard;
