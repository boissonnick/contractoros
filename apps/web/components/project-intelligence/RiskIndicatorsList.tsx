/**
 * RiskIndicatorsList Component
 *
 * Displays a list of project risk indicators with severity levels,
 * descriptions, and mitigation suggestions.
 */

'use client';

import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { ProjectRiskIndicator, RiskLevel, RISK_TYPE_LABELS, RISK_LEVEL_STYLES } from '@/types';

interface RiskIndicatorsListProps {
  risks: ProjectRiskIndicator[];
  onAcknowledge?: (riskId: string) => void;
  showMitigation?: boolean;
  maxDisplay?: number;
  className?: string;
}

const LEVEL_ICONS: Record<RiskLevel, React.ElementType> = {
  low: InformationCircleIcon,
  medium: ExclamationTriangleIcon,
  high: ExclamationTriangleIcon,
  critical: XCircleIcon,
};

function RiskCard({
  risk,
  onAcknowledge,
  showMitigation = true,
}: {
  risk: ProjectRiskIndicator;
  onAcknowledge?: (riskId: string) => void;
  showMitigation?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = LEVEL_ICONS[risk.level];
  const styles = RISK_LEVEL_STYLES[risk.level];
  const typeLabel = RISK_TYPE_LABELS[risk.type];

  return (
    <div
      className={`rounded-lg border ${
        risk.level === 'critical'
          ? 'border-red-200 bg-red-50'
          : risk.level === 'high'
          ? 'border-orange-200 bg-orange-50'
          : risk.level === 'medium'
          ? 'border-yellow-200 bg-yellow-50'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className={`p-1.5 rounded-full ${styles.bg}`}>
            <Icon className={`w-4 h-4 ${styles.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-medium text-gray-900">{risk.title}</h4>
              <span className={`px-1.5 py-0.5 text-xs rounded ${styles.bg} ${styles.text}`}>
                {risk.level}
              </span>
            </div>
            <p className="text-sm text-gray-600">{risk.description}</p>
            {risk.impact && (
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">Impact:</span> {risk.impact}
              </p>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {expanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>{' '}
                <span className="text-gray-900">{typeLabel}</span>
              </div>
              {showMitigation && risk.mitigation && (
                <div>
                  <span className="text-gray-500">Mitigation:</span>{' '}
                  <span className="text-gray-900">{risk.mitigation}</span>
                </div>
              )}
              <div className="text-xs text-gray-500">
                Detected: {new Date(risk.detectedAt).toLocaleDateString()}
                {risk.acknowledgedAt && (
                  <span className="ml-2">
                    • Acknowledged: {new Date(risk.acknowledgedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {onAcknowledge && !risk.acknowledgedAt && (
              <button
                onClick={() => onAcknowledge(risk.id)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Acknowledge
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function RiskIndicatorsList({
  risks,
  onAcknowledge,
  showMitigation = true,
  maxDisplay = 10,
  className = '',
}: RiskIndicatorsListProps) {
  const [showAll, setShowAll] = useState(false);

  // Sort by severity
  const sortedRisks = [...risks].sort((a, b) => {
    const levelOrder: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return levelOrder[a.level] - levelOrder[b.level];
  });

  const displayedRisks = showAll ? sortedRisks : sortedRisks.slice(0, maxDisplay);

  if (risks.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 text-center ${className}`}>
        <ShieldCheckIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="font-medium text-gray-900">No Active Risks</h3>
        <p className="text-sm text-gray-500 mt-1">
          This project is currently free of identified risks.
        </p>
      </div>
    );
  }

  // Count by level
  const criticalCount = risks.filter(r => r.level === 'critical').length;
  const highCount = risks.filter(r => r.level === 'high').length;
  const mediumCount = risks.filter(r => r.level === 'medium').length;
  const lowCount = risks.filter(r => r.level === 'low').length;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header with counts */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Risk Indicators</h3>
            <p className="text-sm text-gray-500">{risks.length} active risk{risks.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                {criticalCount} Critical
              </span>
            )}
            {highCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                {highCount} High
              </span>
            )}
            {mediumCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                {mediumCount} Med
              </span>
            )}
            {lowCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                {lowCount} Low
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Risk list */}
      <div className="p-4 space-y-3">
        {displayedRisks.map(risk => (
          <RiskCard
            key={risk.id}
            risk={risk}
            onAcknowledge={onAcknowledge}
            showMitigation={showMitigation}
          />
        ))}

        {sortedRisks.length > maxDisplay && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-2 text-sm text-brand-primary hover:text-brand-primary-dark font-medium"
          >
            Show {sortedRisks.length - maxDisplay} more risks
          </button>
        )}
      </div>
    </div>
  );
}

export default RiskIndicatorsList;
