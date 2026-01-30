'use client';

import React from 'react';
import {
  SunIcon,
  CloudIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { DailyWeatherForecast, WeatherCondition } from '@/types';
import { WeatherRiskBadge } from './WeatherRiskBadge';
import { cn } from '@/lib/utils';

interface WeatherForecastCardProps {
  forecast: DailyWeatherForecast;
  isToday?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Get appropriate weather icon based on condition
 */
function WeatherIcon({ condition, className }: { condition: WeatherCondition; className?: string }) {
  switch (condition) {
    case 'clear':
      return <SunIcon className={cn('text-yellow-500', className)} />;
    case 'partly_cloudy':
      return <CloudIcon className={cn('text-gray-400', className)} />;
    case 'cloudy':
      return <CloudIcon className={cn('text-gray-500', className)} />;
    case 'rain':
    case 'heavy_rain':
      return (
        <svg className={cn('text-blue-500', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14a4 4 0 014-4h8a4 4 0 110 8H8a4 4 0 01-4-4zm6 4v3m4-3v3m-8-2v2m12-2v2" />
        </svg>
      );
    case 'storm':
      return (
        <svg className={cn('text-purple-600', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'snow':
    case 'extreme_cold':
      return (
        <svg className={cn('text-blue-300', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18m0-18l-4 4m4-4l4 4m-4 14l-4-4m4 4l4-4M3 12h18M3 12l4-4m-4 4l4 4m14-4l-4-4m4 4l-4 4" />
        </svg>
      );
    case 'extreme_heat':
      return (
        <svg className={cn('text-red-500', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    default:
      return <CloudIcon className={cn('text-gray-400', className)} />;
  }
}

/**
 * Format date to short day name
 */
function formatDay(date: Date, isToday: boolean): string {
  if (isToday) return 'Today';
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Weather forecast card for a single day
 */
export function WeatherForecastCard({
  forecast,
  isToday = false,
  compact = false,
  className,
}: WeatherForecastCardProps) {
  const hasRisk = forecast.riskLevel !== 'none';

  if (compact) {
    return (
      <div
        className={cn(
          'flex flex-col items-center p-2 rounded-lg',
          isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50',
          hasRisk && 'ring-1 ring-inset',
          forecast.riskLevel === 'severe' && 'ring-orange-400',
          forecast.riskLevel === 'high' && 'ring-red-300',
          forecast.riskLevel === 'moderate' && 'ring-amber-300',
          className
        )}
      >
        <span className="text-xs font-medium text-gray-600">
          {formatDay(forecast.date, isToday)}
        </span>
        <WeatherIcon condition={forecast.condition} className="h-6 w-6 my-1" />
        <div className="text-sm font-semibold">
          {Math.round(forecast.highTemp)}°
        </div>
        <div className="text-xs text-gray-500">
          {Math.round(forecast.lowTemp)}°
        </div>
        {hasRisk && (
          <WeatherRiskBadge level={forecast.riskLevel} showLabel={false} size="sm" className="mt-1" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200',
        hasRisk && 'border-l-4',
        forecast.riskLevel === 'severe' && 'border-l-orange-700',
        forecast.riskLevel === 'high' && 'border-l-red-500',
        forecast.riskLevel === 'moderate' && 'border-l-amber-500',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              {formatDay(forecast.date, isToday)}
            </span>
            {isToday && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                Today
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">{Math.round(forecast.highTemp)}°</span>
            <span className="text-lg text-gray-500">{Math.round(forecast.lowTemp)}°</span>
          </div>
        </div>
        <WeatherIcon condition={forecast.condition} className="h-10 w-10" />
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14a4 4 0 014-4h8a4 4 0 110 8H8a4 4 0 01-4-4zm6 4v2" />
          </svg>
          {forecast.precipitation}%
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          {Math.round(forecast.windSpeed)} mph
        </span>
      </div>

      {hasRisk && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <WeatherRiskBadge level={forecast.riskLevel} size="sm" />
            {forecast.riskFactors.length > 0 && (
              <span className="text-xs text-gray-500">
                {forecast.riskFactors.length} factor{forecast.riskFactors.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {forecast.riskFactors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {forecast.riskFactors.slice(0, 2).map((factor, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  {factor.description}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
