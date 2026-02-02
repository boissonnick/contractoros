'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DocumentPlusIcon,
  ArrowRightIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

export interface ChangeOrderDetection {
  id: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskName?: string;
  originalScope: string;
  detectedChange: string;
  changeType: 'addition' | 'modification' | 'removal';
  estimatedImpact?: {
    cost?: number;
    days?: number;
  };
  confidence: number;
  sourceType: 'email' | 'message' | 'daily_log' | 'task_update';
  sourceRef?: string;
  detectedAt: Date;
}

interface ChangeOrderAlertProps {
  detection: ChangeOrderDetection;
  onCreateChangeOrder?: (detectionId: string) => void;
  onDismiss?: (detectionId: string) => void;
}

const CHANGE_TYPE_CONFIG: Record<ChangeOrderDetection['changeType'], {
  label: string;
  color: string;
  bgColor: string;
}> = {
  addition: { label: 'Addition', color: 'text-green-700', bgColor: 'bg-green-100' },
  modification: { label: 'Modification', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  removal: { label: 'Removal', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export function ChangeOrderAlert({
  detection,
  onCreateChangeOrder,
  onDismiss,
}: ChangeOrderAlertProps) {
  const [isCreating, setIsCreating] = useState(false);
  const typeConfig = CHANGE_TYPE_CONFIG[detection.changeType];

  const handleCreate = async () => {
    if (!onCreateChangeOrder) return;
    setIsCreating(true);
    try {
      onCreateChangeOrder(detection.id);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="border border-orange-200 rounded-lg bg-orange-50 p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  Scope Change Detected
                </h4>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {detection.projectName}
                {detection.taskName && ` / ${detection.taskName}`}
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(detection.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Scope comparison */}
          <div className="mt-3 space-y-2">
            {/* Original scope */}
            <div className="p-2 bg-white/60 rounded border border-orange-100">
              <p className="text-[10px] text-gray-500 uppercase font-medium mb-1">
                Original Scope
              </p>
              <p className="text-xs text-gray-700 line-clamp-2">
                {detection.originalScope}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowsRightLeftIcon className="h-4 w-4 text-orange-400" />
            </div>

            {/* Detected change */}
            <div className="p-2 bg-orange-100/50 rounded border border-orange-200">
              <p className="text-[10px] text-orange-600 uppercase font-medium mb-1">
                Detected Change
              </p>
              <p className="text-xs text-gray-900 font-medium line-clamp-2">
                {detection.detectedChange}
              </p>
            </div>
          </div>

          {/* Impact estimate */}
          {detection.estimatedImpact && (
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="text-gray-500">Estimated impact:</span>
              {detection.estimatedImpact.cost && (
                <span className="text-orange-700 font-medium">
                  +${detection.estimatedImpact.cost.toLocaleString()}
                </span>
              )}
              {detection.estimatedImpact.days && (
                <span className="text-orange-700 font-medium">
                  +{detection.estimatedImpact.days} days
                </span>
              )}
            </div>
          )}

          {/* Source and confidence */}
          <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-500">
            <span>
              Source: <span className="capitalize">{detection.sourceType.replace('_', ' ')}</span>
            </span>
            <span>
              {Math.round(detection.confidence * 100)}% confidence
            </span>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            {onCreateChangeOrder && (
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                <DocumentPlusIcon className="h-3.5 w-3.5" />
                {isCreating ? 'Creating...' : 'Create Change Order'}
              </button>
            )}
            <Link
              href={`/dashboard/projects/${detection.projectId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-800"
            >
              View Project
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangeOrderAlert;
