"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { BaseModal, Button, Badge, toast } from '@/components/ui';
import {
  OffboardingOptions,
  OffboardingReport,
  OffboardingWizardStep,
  OffboardingWizardState,
  UserProfile,
  UserRole,
  OFFBOARDING_STATUS_LABELS,
} from '@/types';
import {
  UserMinusIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  FolderIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  TrashIcon,
  BellIcon,
  CalendarIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  initiateOffboarding,
  executeOffboarding,
  getOffboardingImpactPreview,
} from '@/lib/offboarding/user-offboarding';
import { useAuth } from '@/lib/auth';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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

interface TeamMember {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
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
  }, [profile?.orgId, isOpen, targetUser.id]);

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
  }, [profile?.orgId, isOpen, targetUser.id]);

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
        return (
          <CompleteStep
            report={state.report}
          />
        );
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

// Step 1: Confirm
function ConfirmStep({
  targetUser,
  impactPreview,
}: {
  targetUser: OffboardingWizardProps['targetUser'];
  impactPreview: OffboardingWizardState['impactPreview'];
}) {
  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">
            You are about to offboard this user
          </p>
          <p className="text-sm text-amber-700 mt-1">
            This action will revoke their access, and optionally reassign their work
            and archive their data. This can be reversed within 30 days.
          </p>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{targetUser.name}</p>
            <p className="text-sm text-gray-500">{targetUser.email}</p>
            <Badge variant="default" className="mt-1">
              {targetUser.role}
            </Badge>
          </div>
        </div>
      </div>

      {/* Impact preview */}
      {impactPreview && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Impact Summary</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
              <FolderIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">{impactPreview.taskCount}</p>
                <p className="text-xs text-gray-500">Tasks assigned</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">{impactPreview.projectCount}</p>
                <p className="text-xs text-gray-500">Projects managed</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
              <ClockIcon className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">{impactPreview.timeEntryCount}</p>
                <p className="text-xs text-gray-500">Time entries</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg">
              <CurrencyDollarIcon className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900">{impactPreview.expenseCount}</p>
                <p className="text-xs text-gray-500">Expenses submitted</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 2: Reassign
function ReassignStep({
  teamMembers,
  loadingTeam,
  selectedUser,
  impactPreview,
  onSelectUser,
}: {
  teamMembers: TeamMember[];
  loadingTeam: boolean;
  selectedUser: OffboardingWizardState['reassignToUser'];
  impactPreview: OffboardingWizardState['impactPreview'];
  onSelectUser: (user: { id: string; name: string } | null) => void;
}) {
  const hasWorkToReassign =
    impactPreview && (impactPreview.taskCount > 0 || impactPreview.projectCount > 0);

  return (
    <div className="space-y-4">
      {!hasWorkToReassign ? (
        <div className="text-center py-8">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-900 font-medium">No work to reassign</p>
          <p className="text-sm text-gray-500 mt-1">
            This user has no assigned tasks or managed projects.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Select a team member to receive the {impactPreview?.taskCount || 0} tasks and{' '}
            {impactPreview?.projectCount || 0} projects currently assigned to this user.
          </p>

          {/* No reassignment option */}
          <label
            className={cn(
              'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
              !selectedUser
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <input
              type="radio"
              name="reassign"
              checked={!selectedUser}
              onChange={() => onSelectUser(null)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">Leave unassigned</p>
              <p className="text-sm text-gray-500">Tasks will have no assignee</p>
            </div>
          </label>

          {/* Team member options */}
          {loadingTeam ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : teamMembers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No other team members available for reassignment.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teamMembers.map((member) => (
                <label
                  key={member.id}
                  className={cn(
                    'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                    selectedUser?.id === member.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="reassign"
                    checked={selectedUser?.id === member.id}
                    onChange={() =>
                      onSelectUser({ id: member.id, name: member.displayName })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{member.displayName}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                  <Badge variant="default" size="sm">
                    {member.role}
                  </Badge>
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Step 3: Data handling
function DataHandlingStep({
  options,
  onUpdateOptions,
}: {
  options: Partial<OffboardingOptions>;
  onUpdateOptions: (updates: Partial<OffboardingOptions>) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Choose how to handle the user's data and configure notification settings.
      </p>

      {/* Archive data option */}
      <div className="space-y-3">
        <label
          className={cn(
            'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
            options.archiveData
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <input
            type="radio"
            name="dataHandling"
            checked={options.archiveData === true}
            onChange={() => onUpdateOptions({ archiveData: true })}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ArchiveBoxIcon className="h-5 w-5 text-blue-600" />
              <p className="font-medium text-gray-900">Archive data (Recommended)</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Preserve user data for compliance and audit purposes.
              Data will be retained for 7 years as per standard compliance requirements.
            </p>
          </div>
        </label>

        <label
          className={cn(
            'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
            options.archiveData === false
              ? 'border-amber-500 bg-amber-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <input
            type="radio"
            name="dataHandling"
            checked={options.archiveData === false}
            onChange={() => onUpdateOptions({ archiveData: false })}
            className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <TrashIcon className="h-5 w-5 text-amber-600" />
              <p className="font-medium text-gray-900">Skip archiving</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              User data will not be separately archived. Existing records in
              projects will remain intact but user profile will be marked inactive.
            </p>
          </div>
        </label>
      </div>

      {/* Notification toggle */}
      <div className="pt-4 border-t border-gray-200">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <BellIcon className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900">Send notifications</p>
              <p className="text-sm text-gray-500">
                Notify relevant team members about this offboarding
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={options.sendNotification}
            onClick={() =>
              onUpdateOptions({ sendNotification: !options.sendNotification })
            }
            className={cn(
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              options.sendNotification ? 'bg-blue-600' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                options.sendNotification ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </label>
      </div>

      {/* Optional reason */}
      <div className="pt-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reason for offboarding (optional)
        </label>
        <textarea
          value={options.reason || ''}
          onChange={(e) => onUpdateOptions({ reason: e.target.value })}
          placeholder="e.g., Resignation, end of contract, restructuring..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>
    </div>
  );
}

// Step 4: Review
function ReviewStep({
  targetUser,
  options,
  reassignToUser,
  impactPreview,
  error,
}: {
  targetUser: OffboardingWizardProps['targetUser'];
  options: Partial<OffboardingOptions>;
  reassignToUser: OffboardingWizardState['reassignToUser'];
  impactPreview: OffboardingWizardState['impactPreview'];
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Offboarding failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        {/* User */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 text-gray-600">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm">User to offboard</span>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900">{targetUser.name}</p>
            <p className="text-sm text-gray-500">{targetUser.email}</p>
          </div>
        </div>

        {/* Reassignment */}
        <div className="flex justify-between items-start pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <FolderIcon className="h-4 w-4" />
            <span className="text-sm">Work reassigned to</span>
          </div>
          <div className="text-right">
            {reassignToUser ? (
              <p className="font-medium text-gray-900">{reassignToUser.name}</p>
            ) : (
              <p className="text-gray-500">No reassignment</p>
            )}
            {impactPreview && (
              <p className="text-xs text-gray-500">
                {impactPreview.taskCount} tasks, {impactPreview.projectCount} projects
              </p>
            )}
          </div>
        </div>

        {/* Data handling */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <ArchiveBoxIcon className="h-4 w-4" />
            <span className="text-sm">Data archiving</span>
          </div>
          <Badge variant={options.archiveData ? 'success' : 'default'}>
            {options.archiveData ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {/* Notifications */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <BellIcon className="h-4 w-4" />
            <span className="text-sm">Notifications</span>
          </div>
          <Badge variant={options.sendNotification ? 'success' : 'default'}>
            {options.sendNotification ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {/* Reason */}
        {options.reason && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DocumentTextIcon className="h-4 w-4" />
              <span className="text-sm">Reason</span>
            </div>
            <p className="text-sm text-gray-900">{options.reason}</p>
          </div>
        )}
      </div>

      {/* Final warning */}
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <ShieldCheckIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">
            This action will immediately revoke access
          </p>
          <p className="text-sm text-red-700 mt-1">
            The user will no longer be able to sign in. You have 30 days to
            restore their access if needed.
          </p>
        </div>
      </div>
    </div>
  );
}

// Processing step
function ProcessingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-lg font-medium text-gray-900">Processing offboarding...</p>
      <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
    </div>
  );
}

// Complete step
function CompleteStep({ report }: { report: OffboardingReport | null }) {
  if (!report) return null;

  const hasErrors = report.errors && report.errors.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        {hasErrors ? (
          <ExclamationTriangleIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        ) : (
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        )}
        <h3 className="text-xl font-semibold text-gray-900">
          {hasErrors ? 'Offboarding completed with warnings' : 'Offboarding complete'}
        </h3>
        <p className="text-gray-500 mt-1">
          {report.userName} has been offboarded from the organization
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Access revoked</span>
          <Badge variant={report.accessRevoked ? 'success' : 'danger'}>
            {report.accessRevoked ? 'Yes' : 'No'}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Tasks reassigned</span>
          <span className="font-medium text-gray-900">{report.tasksReassigned}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Projects transferred</span>
          <span className="font-medium text-gray-900">{report.projectsTransferred}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Data archived</span>
          <Badge variant={report.dataArchived ? 'success' : 'default'}>
            {report.dataArchived ? 'Yes' : 'No'}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Completed at</span>
          <span className="text-sm text-gray-900">
            {format(new Date(report.completedAt), 'MMM d, yyyy h:mm a')}
          </span>
        </div>
      </div>

      {/* Errors */}
      {hasErrors && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Warnings</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            {report.errors!.map((err, i) => (
              <li key={i}>- {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Restore notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <CalendarIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">30-day restoration window</p>
          <p className="text-sm text-blue-700 mt-1">
            This user can be restored within 30 days from the Team Settings page.
            After that, the offboarding becomes permanent.
          </p>
        </div>
      </div>
    </div>
  );
}

export default OffboardingWizard;
