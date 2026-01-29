"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Button, Card } from '@/components/ui';
import { ScheduleConflict } from '@/types';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  UserGroupIcon,
  MapPinIcon,
  CloudIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

export interface ConflictAlertProps {
  conflicts: ScheduleConflict[];
  onResolve?: (conflictId: string) => void;
  onDismiss?: (conflictId: string) => void;
  onViewEvent?: (eventId: string) => void;
  className?: string;
}

const getConflictIcon = (type: ScheduleConflict['type']) => {
  switch (type) {
    case 'crew_overlap':
      return <UserGroupIcon className="h-5 w-5" />;
    case 'location_overlap':
      return <MapPinIcon className="h-5 w-5" />;
    case 'weather':
      return <CloudIcon className="h-5 w-5" />;
    case 'equipment_overlap':
    case 'resource_shortage':
      return <CubeIcon className="h-5 w-5" />;
    default:
      return <ExclamationTriangleIcon className="h-5 w-5" />;
  }
};

const getConflictLabel = (type: ScheduleConflict['type']) => {
  switch (type) {
    case 'crew_overlap':
      return 'Crew Conflict';
    case 'location_overlap':
      return 'Location Conflict';
    case 'weather':
      return 'Weather Warning';
    case 'equipment_overlap':
      return 'Equipment Conflict';
    case 'resource_shortage':
      return 'Resource Shortage';
    default:
      return 'Schedule Conflict';
  }
};

export default function ConflictAlert({
  conflicts,
  onResolve,
  onDismiss,
  onViewEvent,
  className,
}: ConflictAlertProps) {
  const unresolvedConflicts = conflicts.filter((c) => !c.resolved);

  if (unresolvedConflicts.length === 0) {
    return null;
  }

  const errorConflicts = unresolvedConflicts.filter((c) => c.severity === 'error');
  const warningConflicts = unresolvedConflicts.filter((c) => c.severity === 'warning');

  return (
    <div className={cn('space-y-3', className)}>
      {/* Error-level conflicts */}
      {errorConflicts.map((conflict) => (
        <Card
          key={conflict.id}
          className="border-red-200 bg-red-50"
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg text-red-600">
                {getConflictIcon(conflict.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-red-800">
                    {getConflictLabel(conflict.type)}
                  </span>
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                    Requires Action
                  </span>
                </div>

                <p className="text-sm text-red-700 mt-1">
                  {conflict.description}
                </p>

                {/* Affected events */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {conflict.eventTitles.map((title, idx) => (
                    <button
                      key={idx}
                      onClick={() => onViewEvent?.(conflict.eventIds[idx])}
                      className="px-2 py-0.5 bg-white border border-red-200 rounded text-xs text-red-700 hover:bg-red-50"
                    >
                      {title}
                    </button>
                  ))}
                </div>

                {/* Affected crew */}
                {conflict.affectedUserNames && conflict.affectedUserNames.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                    <UserGroupIcon className="h-3 w-3" />
                    <span>Affected: {conflict.affectedUserNames.join(', ')}</span>
                  </div>
                )}

                {/* Suggested resolution */}
                {conflict.suggestedResolution && (
                  <div className="mt-2 text-xs text-red-600 italic">
                    Suggestion: {conflict.suggestedResolution}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {onResolve && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onResolve(conflict.id)}
                  >
                    Resolve
                  </Button>
                )}
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(conflict.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Warning-level conflicts */}
      {warningConflicts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-800">
                {warningConflicts.length} Warning{warningConflicts.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {warningConflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="flex items-start justify-between p-2 bg-white rounded border border-amber-100"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">
                      {getConflictIcon(conflict.type)}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-amber-800">
                        {getConflictLabel(conflict.type)}
                      </span>
                      <p className="text-xs text-amber-600">
                        {conflict.description}
                      </p>
                    </div>
                  </div>
                  {onDismiss && (
                    <button
                      onClick={() => onDismiss(conflict.id)}
                      className="p-1 text-amber-400 hover:text-amber-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Inline conflict badge for event cards
export function ConflictBadge({
  hasConflict,
  severity = 'warning',
  onClick,
}: {
  hasConflict: boolean;
  severity?: 'warning' | 'error';
  onClick?: () => void;
}) {
  if (!hasConflict) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
        severity === 'error'
          ? 'bg-red-100 text-red-700'
          : 'bg-amber-100 text-amber-700'
      )}
    >
      <ExclamationTriangleIcon className="h-3 w-3" />
      Conflict
    </button>
  );
}
