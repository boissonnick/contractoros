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
} from '@heroicons/react/24/outline';

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
