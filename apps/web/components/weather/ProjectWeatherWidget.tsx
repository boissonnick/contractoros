'use client';

import React from 'react';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { useProjectWeatherRisk } from '@/lib/hooks/useWeatherRisk';
import { Project, Phase } from '@/types';
import { WeatherForecastCard } from './WeatherForecastCard';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';

// Helper to format address
function formatAddress(address: Project['address'] | undefined): string {
  if (!address) return 'Project Location';
  if (typeof address === 'object') {
    return `${address.city}, ${address.state}`;
  }
  return 'Project Location';
}

interface ProjectWeatherWidgetProps {
  project: Pick<Project, 'id' | 'name' | 'address'>;
  phases?: Pick<Phase, 'id' | 'name' | 'trades'>[];
  compact?: boolean;
  className?: string;
}

/**
 * Widget displaying weather forecast and risk for a project
 */
export function ProjectWeatherWidget({
  project,
  phases = [],
  compact = false,
  className,
}: ProjectWeatherWidgetProps) {
  const { profile } = useAuth();
  const { forecast, loading, error, refresh } = useProjectWeatherRisk(
    profile?.orgId,
    project,
    phases
  );

  const today = new Date().toDateString();

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <div className="h-32 bg-gray-100 rounded" />
      </Card>
    );
  }

  if (error || !forecast) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-between text-gray-500">
          <span className="text-sm">Weather data unavailable</span>
          <button
            onClick={refresh}
            className="p-1 hover:bg-gray-100 rounded"
            title="Retry"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={cn('p-3', className)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4" />
            <span className="truncate">{formatAddress(project.address)}</span>
          </div>
          {forecast.highRiskDays > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {forecast.highRiskDays} risk day{forecast.highRiskDays > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {forecast.forecasts.slice(0, 5).map((day, i) => (
            <WeatherForecastCard
              key={i}
              forecast={day}
              isToday={day.date.toDateString() === today}
              compact
            />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Weather Forecast</h3>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
            <MapPinIcon className="h-4 w-4" />
            <span>{formatAddress(project.address)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {forecast.highRiskDays > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-700 rounded-lg text-sm">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <span>{forecast.highRiskDays} high-risk day{forecast.highRiskDays > 1 ? 's' : ''}</span>
            </div>
          )}
          <button
            onClick={refresh}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            title="Refresh forecast"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {forecast.forecasts.slice(0, 5).map((day, i) => (
          <WeatherForecastCard
            key={i}
            forecast={day}
            isToday={day.date.toDateString() === today}
          />
        ))}
      </div>

      {forecast.nextRiskyDay && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Weather Alert
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                High-risk conditions expected on{' '}
                {forecast.nextRiskyDay.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
                . Plan accordingly.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>
          Last updated: {forecast.fetchedAt.toLocaleTimeString()}
        </span>
        <span>
          Data source: OpenWeatherMap
        </span>
      </div>
    </Card>
  );
}
