"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, Badge, Button } from '@/components/ui';
import {
  CheckCircleIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BanknotesIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

// TODO: Replace with import from '@/types' once types agent adds these
type SubOnboardingStepId = 'company_info' | 'insurance' | 'w9' | 'banking' | 'safety_certs' | 'agreement';
type SubOnboardingStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

interface SubOnboardingStep {
  id: SubOnboardingStepId;
  label: string;
  description: string;
  status: SubOnboardingStepStatus;
  completedAt?: Date;
  requiredDocType?: string;
}

// Step icons mapping
const STEP_ICONS: Record<SubOnboardingStepId, React.ComponentType<{ className?: string }>> = {
  company_info: BuildingOfficeIcon,
  insurance: ShieldCheckIcon,
  w9: DocumentTextIcon,
  banking: BanknotesIcon,
  safety_certs: AcademicCapIcon,
  agreement: DocumentCheckIcon,
};

// Step ordering
const STEP_ORDER: SubOnboardingStepId[] = [
  'company_info',
  'insurance',
  'w9',
  'banking',
  'safety_certs',
  'agreement',
];

// Status badge variant mapping
const STATUS_VARIANT: Record<SubOnboardingStepStatus, 'success' | 'info' | 'warning' | 'default'> = {
  completed: 'success',
  in_progress: 'info',
  pending: 'default',
  skipped: 'warning',
};

const STATUS_LABELS: Record<SubOnboardingStepStatus, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending',
  skipped: 'Skipped',
};

interface SubOnboardingChecklistProps {
  subcontractorId: string;
  steps: SubOnboardingStep[];
  onStepAction?: (stepId: SubOnboardingStepId) => void;
  compact?: boolean;
}

/**
 * Step-by-step onboarding checklist for new subcontractors.
 * Displays progress through: Company Info, Insurance, W-9, Banking, Safety Certs, Agreement.
 * Follows the pattern from components/team/OnboardingChecklist.tsx.
 */
export default function SubOnboardingChecklist({
  subcontractorId,
  steps,
  onStepAction,
  compact = false,
}: SubOnboardingChecklistProps) {
  const [expandedStep, setExpandedStep] = useState<SubOnboardingStepId | null>(null);

  // Sort steps by defined order and build a map for quick lookup
  const stepsMap = useMemo(() => {
    const map = new Map<SubOnboardingStepId, SubOnboardingStep>();
    steps.forEach((step) => map.set(step.id, step));
    return map;
  }, [steps]);

  // Ordered steps with fallback for missing ones
  const orderedSteps = useMemo(() => {
    return STEP_ORDER.map((id) => {
      const step = stepsMap.get(id);
      if (step) return step;
      // Fallback for missing steps
      return {
        id,
        label: id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: '',
        status: 'pending' as SubOnboardingStepStatus,
      };
    });
  }, [stepsMap]);

  // Calculate overall progress
  const completedCount = orderedSteps.filter(
    (s) => s.status === 'completed' || s.status === 'skipped'
  ).length;
  const totalCount = orderedSteps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Determine the current active step (first non-completed, non-skipped)
  const currentStepId = orderedSteps.find(
    (s) => s.status !== 'completed' && s.status !== 'skipped'
  )?.id || null;

  const toggleStep = (stepId: SubOnboardingStepId) => {
    setExpandedStep((prev) => (prev === stepId ? null : stepId));
  };

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm font-semibold text-gray-900">
              Onboarding Progress
            </h3>
            <span className="text-xs font-medium text-gray-500">
              {completedCount}/{totalCount} steps complete
            </span>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                progressPercent === 100
                  ? 'bg-green-500'
                  : progressPercent > 50
                    ? 'bg-blue-500'
                    : 'bg-blue-400'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Completion banner */}
      {progressPercent === 100 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircleSolidIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-800 font-medium">
            Onboarding complete! This subcontractor is fully set up.
          </p>
        </div>
      )}

      {/* Steps list */}
      <Card className="divide-y divide-gray-100 overflow-hidden">
        {orderedSteps.map((step, index) => {
          const StepIcon = STEP_ICONS[step.id];
          const isCompleted = step.status === 'completed';
          const isSkipped = step.status === 'skipped';
          const isCurrent = step.id === currentStepId;
          const isExpanded = expandedStep === step.id;
          const isDone = isCompleted || isSkipped;

          return (
            <div key={step.id}>
              {/* Step row */}
              <button
                type="button"
                onClick={() => toggleStep(step.id)}
                className={cn(
                  'w-full px-4 py-3 flex items-center gap-4 text-left transition-colors',
                  isCurrent && 'bg-blue-50/50',
                  !isCurrent && 'hover:bg-gray-50'
                )}
              >
                {/* Step number / checkmark */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircleSolidIcon className="h-5 w-5 text-green-600" />
                    </div>
                  ) : isSkipped ? (
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-400">--</span>
                    </div>
                  ) : isCurrent ? (
                    <div className="h-8 w-8 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700">{index + 1}</span>
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-500">{index + 1}</span>
                    </div>
                  )}
                </div>

                {/* Step info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <StepIcon className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isCompleted ? 'text-green-600' :
                    isCurrent ? 'text-blue-600' : 'text-gray-400'
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isCompleted ? 'text-green-700' :
                      isCurrent ? 'text-blue-900' :
                      isSkipped ? 'text-gray-400 line-through' : 'text-gray-700'
                    )}>
                      {step.label}
                    </p>
                    {!compact && step.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="hidden sm:block flex-shrink-0">
                  <Badge
                    variant={STATUS_VARIANT[step.status]}
                    size="sm"
                  >
                    {STATUS_LABELS[step.status]}
                  </Badge>
                </div>

                {/* Completed timestamp */}
                {isCompleted && step.completedAt && !compact && (
                  <span className="hidden lg:block text-xs text-gray-400 flex-shrink-0">
                    {step.completedAt.toLocaleDateString()}
                  </span>
                )}

                {/* Expand arrow */}
                <div className="flex-shrink-0 text-gray-400">
                  {isExpanded ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="pl-12">
                    {/* Step description */}
                    <p className="text-sm text-gray-600 mb-3">
                      {step.description || getDefaultDescription(step.id)}
                    </p>

                    {/* Required document info */}
                    {step.requiredDocType && (
                      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                        <DocumentTextIcon className="h-4 w-4" />
                        <span>Required document: <strong>{step.requiredDocType}</strong></span>
                      </div>
                    )}

                    {/* Completion timestamp */}
                    {isCompleted && step.completedAt && (
                      <p className="text-xs text-green-600 mb-3">
                        Completed on {step.completedAt.toLocaleDateString()} at {step.completedAt.toLocaleTimeString()}
                      </p>
                    )}

                    {/* Action button for incomplete steps */}
                    {!isDone && onStepAction && (
                      <Button
                        variant={isCurrent ? 'primary' : 'outline'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStepAction(step.id);
                        }}
                      >
                        {isCurrent ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            {getActionLabel(step.id)}
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Start Step
                          </>
                        )}
                      </Button>
                    )}

                    {/* Mark complete button for current steps */}
                    {isDone && (
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <CheckCircleSolidIcon className="h-4 w-4" />
                        <span>{isSkipped ? 'This step was skipped' : 'This step is complete'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/** Default descriptions for each onboarding step */
function getDefaultDescription(stepId: SubOnboardingStepId): string {
  const descriptions: Record<SubOnboardingStepId, string> = {
    company_info: 'Provide your company name, address, trade specialty, and contact information.',
    insurance: 'Upload your certificate of insurance (COI) with current coverage details.',
    w9: 'Submit your W-9 form for tax reporting purposes.',
    banking: 'Add your banking details for receiving payments.',
    safety_certs: 'Upload required safety certifications (OSHA, first aid, etc.).',
    agreement: 'Review and sign the subcontractor agreement.',
  };
  return descriptions[stepId];
}

/** Action button labels for each step */
function getActionLabel(stepId: SubOnboardingStepId): string {
  const labels: Record<SubOnboardingStepId, string> = {
    company_info: 'Complete Profile',
    insurance: 'Upload Insurance',
    w9: 'Upload W-9',
    banking: 'Add Banking Info',
    safety_certs: 'Upload Certificates',
    agreement: 'Review & Sign',
  };
  return labels[stepId];
}

export { SubOnboardingChecklist };
