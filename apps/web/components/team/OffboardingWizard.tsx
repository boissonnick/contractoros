"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { BaseModal, Button, toast } from '@/components/ui';
import {
  OffboardingOptions,
  OffboardingReport,
  OffboardingWizardStep,
  OffboardingWizardState,
  UserRole,
} from '@/types';
import {
  UserMinusIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  initiateOffboarding,
  executeOffboarding,
  getOffboardingImpactPreview,
} from '@/lib/offboarding/user-offboarding';
import { useAuth } from '@/lib/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  ConfirmStep,
  ReassignStep,
  DataHandlingStep,
  ReviewStep,
  ProcessingStep,
  CompleteStep,
  TeamMember,
} from './offboarding';

interface OffboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  /** The user to be offboarded */
  targetUser: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  /** Callback when offboarding completes */
  onComplete?: (report: OffboardingReport) => void;
}

const STEP_CONFIG: Record<OffboardingWizardStep, { title: string; description: string }> = {
  confirm: {
    title: 'Confirm Offboarding',
    description: 'Review the user to be offboarded',
  },
  reassign: {
    title: 'Reassign Work',
    description: 'Transfer tasks and projects to another team member',
  },
  data_handling: {
    title: 'Data Handling',
    description: 'Choose how to handle user data',
  },
  review: {
    title: 'Review & Confirm',
    description: 'Review all settings before proceeding',
  },
  processing: {
    title: 'Processing',
    description: 'Offboarding in progress...',
  },
  complete: {
    title: 'Complete',
    description: 'Offboarding completed successfully',
  },
};

const STEP_ORDER: OffboardingWizardStep[] = [
  'confirm',
  'reassign',
  'data_handling',
  'review',
  'processing',
  'complete',
];

export function OffboardingWizard({
  isOpen,
  onClose,
  targetUser,
  onComplete,
}: OffboardingWizardProps) {
  const { profile } = useAuth();
  const [state, setState] = useState<OffboardingWizardState>({
    currentStep: 'confirm',
    targetUser: targetUser,
    options: {
      archiveData: true,
      sendNotification: true,
      effectiveDate: new Date(),
    },
    reassignToUser: null,
    impactPreview: null,
    isProcessing: false,
    report: null,
    error: null,
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Load team members for reassignment
  useEffect(() => {
    if (!profile?.orgId || !isOpen) return;

    async function loadTeamMembers() {
      setLoadingTeam(true);
      try {
        const q = query(
          collection(db, 'users'),
          where('orgId', '==', profile!.orgId),
          where('isActive', '==', true)
        );
        const snap = await getDocs(q);
        const members = snap.docs
          .map((d) => ({
            id: d.id,
            displayName: d.data().displayName || 'Unnamed',
            email: d.data().email || '',
            role: d.data().role as UserRole,
          }))
          .filter((m) => m.id !== targetUser.id && m.role !== 'CLIENT');
        setTeamMembers(members);
      } catch (err) {
        console.error('Error loading team members:', err);
      } finally {
        setLoadingTeam(false);
      }
    }

    loadTeamMembers();
  }, [profile, isOpen, targetUser.id]);

  // Load impact preview when wizard opens
  useEffect(() => {
    if (!profile?.orgId || !isOpen || !targetUser.id) return;

    async function loadImpact() {
      try {
        const preview = await getOffboardingImpactPreview(profile!.orgId, targetUser.id);
        setState((prev) => ({ ...prev, impactPreview: preview }));
      } catch (err) {
        console.error('Error loading impact preview:', err);
      }
    }

    loadImpact();
  }, [profile, isOpen, targetUser.id]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setState({
        currentStep: 'confirm',
        targetUser: targetUser,
        options: {
          archiveData: true,
          sendNotification: true,
          effectiveDate: new Date(),
        },
        reassignToUser: null,
        impactPreview: null,
        isProcessing: false,
        report: null,
        error: null,
      });
    }
  }, [isOpen, targetUser]);

  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep);

  const goToStep = useCallback((step: OffboardingWizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step, error: null }));
  }, []);

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      goToStep(STEP_ORDER[nextIndex]);
    }
  }, [currentStepIndex, goToStep]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(STEP_ORDER[prevIndex]);
    }
  }, [currentStepIndex, goToStep]);

  const handleStartOffboarding = useCallback(async () => {
    if (!profile?.orgId || !profile?.uid) return;

    setState((prev) => ({ ...prev, isProcessing: true, error: null }));
    goToStep('processing');

    try {
      const options: OffboardingOptions = {
        archiveData: state.options.archiveData ?? true,
        sendNotification: state.options.sendNotification ?? true,
        effectiveDate: state.options.effectiveDate ?? new Date(),
        reassignTasksTo: state.reassignToUser?.id,
        reason: state.options.reason,
        notes: state.options.notes,
        revokeSessionsImmediately: true,
      };

      // Create the offboarding record
      const offboardingId = await initiateOffboarding(
        profile.orgId,
        targetUser.id,
        targetUser.name,
        targetUser.email,
        targetUser.role,
        options,
        profile.uid,
        profile.displayName || 'Unknown'
      );

      // Execute the offboarding
      const report = await executeOffboarding(
        offboardingId,
        profile.orgId,
        targetUser.id,
        targetUser.name,
        targetUser.email,
        options,
        profile.uid
      );

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        report,
        currentStep: 'complete',
      }));

      onComplete?.(report);
      toast.success('User offboarded successfully');
    } catch (err) {
      console.error('Offboarding failed:', err);
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: err instanceof Error ? err.message : 'Offboarding failed',
        currentStep: 'review',
      }));
      toast.error('Offboarding failed');
    }
  }, [profile, targetUser, state.options, state.reassignToUser, goToStep, onComplete]);

  const handleClose = useCallback(() => {
    if (state.isProcessing) {
      return; // Don't allow closing during processing
    }
    onClose();
  }, [state.isProcessing, onClose]);

  // Render step content
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'confirm':
        return (
          <ConfirmStep
            targetUser={targetUser}
            impactPreview={state.impactPreview}
          />
        );
      case 'reassign':
        return (
          <ReassignStep
            teamMembers={teamMembers}
            loadingTeam={loadingTeam}
            selectedUser={state.reassignToUser}
            impactPreview={state.impactPreview}
            onSelectUser={(user) => setState((prev) => ({ ...prev, reassignToUser: user }))}
          />
        );
      case 'data_handling':
        return (
          <DataHandlingStep
            options={state.options}
            onUpdateOptions={(updates) =>
              setState((prev) => ({
                ...prev,
                options: { ...prev.options, ...updates },
              }))
            }
          />
        );
      case 'review':
        return (
          <ReviewStep
            targetUser={targetUser}
            options={state.options}
            reassignToUser={state.reassignToUser}
            impactPreview={state.impactPreview}
            error={state.error}
          />
        );
      case 'processing':
        return <ProcessingStep />;
      case 'complete':
        return <CompleteStep report={state.report} />;
      default:
        return null;
    }
  };

  // Render footer buttons
  const renderFooter = () => {
    if (state.currentStep === 'processing') {
      return null;
    }

    if (state.currentStep === 'complete') {
      return (
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        </div>
      );
    }

    return (
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={state.currentStep === 'confirm' ? handleClose : goBack}
          disabled={state.isProcessing}
        >
          {state.currentStep === 'confirm' ? (
            'Cancel'
          ) : (
            <>
              <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
              Back
            </>
          )}
        </Button>

        {state.currentStep === 'review' ? (
          <Button
            variant="danger"
            onClick={handleStartOffboarding}
            disabled={state.isProcessing}
          >
            <UserMinusIcon className="h-4 w-4 mr-1.5" />
            Confirm Offboarding
          </Button>
        ) : (
          <Button variant="primary" onClick={goNext}>
            Next
            <ArrowRightIcon className="h-4 w-4 ml-1.5" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <BaseModal
      open={isOpen}
      onClose={handleClose}
      title={STEP_CONFIG[state.currentStep].title}
      subtitle={STEP_CONFIG[state.currentStep].description}
      size="lg"
      preventOutsideClose={state.isProcessing}
      footer={renderFooter()}
    >
      {/* Progress indicator */}
      {!['processing', 'complete'].includes(state.currentStep) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {STEP_ORDER.slice(0, 4).map((step, index) => (
              <React.Fragment key={step}>
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                    index < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : index === currentStepIndex
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {index < currentStepIndex ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div
                    className={cn(
                      'flex-1 h-1 mx-2',
                      index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Confirm</span>
            <span>Reassign</span>
            <span>Data</span>
            <span>Review</span>
          </div>
        </div>
      )}

      {renderStepContent()}
    </BaseModal>
  );
}

export default OffboardingWizard;
