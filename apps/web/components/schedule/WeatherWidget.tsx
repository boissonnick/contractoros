"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import {
  WeatherForecast,
  WeatherCondition,
  WeatherImpact,
  WEATHER_CONDITIONS,
} from '@/types';
import {
  SunIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

// TODO: Replace with real weather API integration (OpenWeatherMap, WeatherAPI, etc.)
// API integration should fetch based on project location or org default location

/**
 * Weather data structure for the simplified widget interface
 */
export interface SimpleWeatherData {
  current: {
    temp: number;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  }>;
  alerts?: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Props for the simplified WeatherWidget (uses mock data)
 */
export interface SimpleWeatherWidgetProps {
  location?: string;
  className?: string;
}

/**
 * Props for the full WeatherWidget (requires forecast data)
 */
export interface WeatherWidgetProps {
  forecasts: WeatherForecast[];
  dates?: Date[];
  onDateSelect?: (date: Date) => void;
  compact?: boolean;
  className?: string;
}

const getWeatherIcon = (condition: WeatherCondition) => {
  const config = WEATHER_CONDITIONS.find((w) => w.value === condition);
  return config?.icon || '🌤️';
};

const getImpactColor = (impact: WeatherImpact) => {
  switch (impact) {
    case 'severe':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-green-100 text-green-800 border-green-200';
  }
};

const getImpactText = (impact: WeatherImpact) => {
  switch (impact) {
    case 'severe':
      return 'Work not recommended';
    case 'high':
      return 'Major impact expected';
    case 'moderate':
      return 'Some delays possible';
    case 'low':
      return 'Minor considerations';
    default:
      return 'Good conditions';
  }
};

export default function WeatherWidget({
  forecasts,
  dates,
  onDateSelect,
  compact = false,
  className,
}: WeatherWidgetProps) {
  // Use provided dates or generate a week from today
  const displayDates = dates || Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const getForecastForDate = (date: Date): WeatherForecast | undefined => {
    return forecasts.find(
      (f) => f.date.toDateString() === date.toDateString()
    );
  };

  if (compact) {
    return (
      <div className={cn('flex gap-1 overflow-x-auto', className)}>
        {displayDates.slice(0, 7).map((date, idx) => {
          const forecast = getForecastForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <button
              key={idx}
              onClick={() => onDateSelect?.(date)}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg min-w-[60px] transition-colors',
                isToday ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50',
                forecast?.impact && forecast.impact !== 'none' && getImpactColor(forecast.impact)
              )}
            >
              <span className="text-xs text-gray-500">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-lg my-1">
                {forecast ? getWeatherIcon(forecast.condition) : '—'}
              </span>
              {forecast && (
                <span className="text-xs font-medium">
                  {Math.round(forecast.tempHigh)}°
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Weather Forecast</h3>
        <span className="text-xs text-gray-500">7-day outlook</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {displayDates.map((date, idx) => {
          const forecast = getForecastForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <button
              key={idx}
              onClick={() => onDateSelect?.(date)}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg transition-colors',
                isToday && 'ring-2 ring-blue-500',
                forecast?.impact && forecast.impact !== 'none'
                  ? getImpactColor(forecast.impact)
                  : 'hover:bg-gray-50'
              )}
            >
              <span className="text-xs font-medium text-gray-600">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-xs text-gray-400">
                {date.getDate()}
              </span>
              <span className="text-2xl my-2">
                {forecast ? getWeatherIcon(forecast.condition) : '—'}
              </span>
              {forecast ? (
                <>
                  <span className="text-sm font-semibold">
                    {Math.round(forecast.tempHigh)}°
                  </span>
                  <span className="text-xs text-gray-500">
                    {Math.round(forecast.tempLow)}°
                  </span>
                  {forecast.precipitation > 20 && (
                    <span className="text-xs text-blue-600 mt-1">
                      {forecast.precipitation}%
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-400">No data</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Impact warnings */}
      {forecasts.some((f) => f.impact && f.impact !== 'none' && f.impact !== 'low') && (
        <div className="mt-4 space-y-2">
          {forecasts
            .filter((f) => f.impact && f.impact !== 'none' && f.impact !== 'low')
            .slice(0, 3)
            .map((forecast, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-lg border',
                  getImpactColor(forecast.impact)
                )}
              >
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium">
                    {forecast.date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="mx-1">·</span>
                  <span>{getImpactText(forecast.impact)}</span>
                  {forecast.affectedTrades && forecast.affectedTrades.length > 0 && (
                    <div className="text-xs mt-0.5 opacity-75">
                      Affects: {forecast.affectedTrades.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}

// ============================================
// SimpleWeatherWidget - Standalone with Mock Data
// ============================================

// Mock weather data - TODO: Replace with API call
const MOCK_WEATHER_DATA: SimpleWeatherData = {
  current: {
    temp: 52,
    condition: 'cloudy',
    humidity: 65,
    windSpeed: 12,
  },
  forecast: [
    { day: 'Today', high: 55, low: 42, condition: 'cloudy' },
    { day: 'Tue', high: 48, low: 38, condition: 'rainy' },
    { day: 'Wed', high: 45, low: 35, condition: 'rainy' },
    { day: 'Thu', high: 52, low: 40, condition: 'cloudy' },
    { day: 'Fri', high: 58, low: 44, condition: 'sunny' },
  ],
  alerts: [
    {
      type: 'Rain Warning',
      message: 'Heavy rain expected Tuesday-Wednesday. Consider rescheduling outdoor concrete work.',
      severity: 'medium',
    },
  ],
};

type SimpleCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';

const getSimpleConditionIcon = (condition: SimpleCondition): React.ReactNode => {
  const iconClass = 'h-6 w-6';
  switch (condition) {
    case 'sunny':
      return <SunIcon className={cn(iconClass, 'text-amber-500')} />;
    case 'cloudy':
      return <CloudIcon className={cn(iconClass, 'text-gray-500')} />;
    case 'rainy':
      return (
        <svg className={cn(iconClass, 'text-blue-500')} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 16.5v2.25m3-2.25v2.25m3-2.25v2.25" />
        </svg>
      );
    case 'stormy':
      return <BoltIcon className={cn(iconClass, 'text-purple-600')} />;
    case 'snowy':
      return (
        <svg className={cn(iconClass, 'text-blue-300')} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
          <circle cx="8" cy="18" r="1" fill="currentColor" />
          <circle cx="12" cy="19" r="1" fill="currentColor" />
          <circle cx="16" cy="18" r="1" fill="currentColor" />
        </svg>
      );
    default:
      return <CloudIcon className={cn(iconClass, 'text-gray-500')} />;
  }
};

const getSmallConditionIcon = (condition: SimpleCondition): React.ReactNode => {
  const iconClass = 'h-4 w-4';
  switch (condition) {
    case 'sunny':
      return <SunIcon className={cn(iconClass, 'text-amber-500')} />;
    case 'cloudy':
      return <CloudIcon className={cn(iconClass, 'text-gray-400')} />;
    case 'rainy':
      return (
        <svg className={cn(iconClass, 'text-blue-500')} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v1m3-1v1m3-1v1" />
        </svg>
      );
    case 'stormy':
      return <BoltIcon className={cn(iconClass, 'text-purple-600')} />;
    case 'snowy':
      return (
        <svg className={cn(iconClass, 'text-blue-300')} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        </svg>
      );
    default:
      return <CloudIcon className={cn(iconClass, 'text-gray-400')} />;
  }
};

const getAlertSeverityStyles = (severity: 'low' | 'medium' | 'high') => {
  switch (severity) {
    case 'high':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'medium':
      return 'bg-amber-50 border-amber-200 text-amber-800';
    case 'low':
      return 'bg-blue-50 border-blue-200 text-blue-700';
  }
};

const isBadWeather = (condition: SimpleCondition): boolean => {
  return ['rainy', 'stormy', 'snowy'].includes(condition);
};

/**
 * Simplified WeatherWidget with built-in mock data.
 * Perfect for dashboard sidebars and schedule headers.
 *
 * TODO: Integrate with weather API for real data based on project/org location
 */
export function SimpleWeatherWidget({
  location = 'Portland, OR',
  className,
}: SimpleWeatherWidgetProps) {
  // TODO: Replace with actual API call using location
  const weather = MOCK_WEATHER_DATA;
  const showOutdoorWarning = isBadWeather(weather.current.condition) ||
    weather.forecast.slice(0, 3).some(f => isBadWeather(f.condition));

  return (
    <Card className={cn('p-4', className)}>
      {/* Header with location */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Weather</h3>
        <span className="text-xs text-gray-500">{location}</span>
      </div>

      {/* Current conditions */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          {getSimpleConditionIcon(weather.current.condition)}
          <span className="text-3xl font-bold text-gray-900">
            {weather.current.temp}°
          </span>
        </div>
        <div className="text-xs text-gray-500 space-y-0.5">
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" />
            </svg>
            <span>Humidity: {weather.current.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Wind: {weather.current.windSpeed} mph</span>
          </div>
        </div>
      </div>

      {/* 5-day mini forecast */}
      <div className="flex justify-between gap-1 py-2 border-t border-gray-100">
        {weather.forecast.map((day, idx) => (
          <div
            key={idx}
            className={cn(
              'flex flex-col items-center py-2 px-1.5 rounded-lg flex-1 min-w-0',
              idx === 0 && 'bg-blue-50'
            )}
          >
            <span className="text-[10px] font-medium text-gray-500 truncate">
              {day.day}
            </span>
            <div className="my-1">
              {getSmallConditionIcon(day.condition)}
            </div>
            <span className="text-xs font-semibold text-gray-900">
              {day.high}°
            </span>
            <span className="text-[10px] text-gray-400">
              {day.low}°
            </span>
          </div>
        ))}
      </div>

      {/* Weather alerts */}
      {weather.alerts && weather.alerts.length > 0 && (
        <div className="mt-3 space-y-2">
          {weather.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={cn(
                'flex items-start gap-2 p-2 rounded-lg border text-xs',
                getAlertSeverityStyles(alert.severity)
              )}
            >
              <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{alert.type}:</span>{' '}
                <span>{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outdoor work warning */}
      {showOutdoorWarning && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">Weather may impact outdoor work</span>
        </div>
      )}
    </Card>
  );
}

// Mini weather indicator for calendar cells
export function WeatherIndicator({
  forecast,
  size = 'sm',
}: {
  forecast?: WeatherForecast;
  size?: 'sm' | 'md';
}) {
  if (!forecast) return null;

  const icon = getWeatherIcon(forecast.condition);
  const hasImpact = forecast.impact && forecast.impact !== 'none';

  return (
    <div
      className={cn(
        'flex items-center gap-0.5',
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}
      title={`${WEATHER_CONDITIONS.find((w) => w.value === forecast.condition)?.label} - ${Math.round(forecast.tempHigh)}°F`}
    >
      <span>{icon}</span>
      <span className="text-gray-500">{Math.round(forecast.tempHigh)}°</span>
      {hasImpact && (
        <ExclamationTriangleIcon
          className={cn(
            'text-amber-500',
            size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
          )}
        />
      )}
    </div>
  );
}
