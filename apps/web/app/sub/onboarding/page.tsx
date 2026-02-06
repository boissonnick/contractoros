"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { PageHeader } from '@/components/ui';
import SubOnboardingChecklist from '@/components/sub-portal/OnboardingChecklist';
import { SectionErrorBoundary } from '@/components/ui/SectionErrorBoundary';
import { toast } from '@/components/ui/Toast';
import { logger } from '@/lib/utils/logger';

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

const DEFAULT_STEPS: SubOnboardingStep[] = [
  {
    id: 'company_info',
    label: 'Company Information',
    description: 'Provide your company name, address, trade specialty, and contact information.',
    status: 'pending',
  },
  {
    id: 'insurance',
    label: 'Insurance Certificate',
    description: 'Upload your certificate of insurance (COI) with current coverage details.',
    status: 'pending',
    requiredDocType: 'insurance_coi',
  },
  {
    id: 'w9',
    label: 'W-9 Tax Form',
    description: 'Submit your W-9 form for tax reporting purposes.',
    status: 'pending',
    requiredDocType: 'w9',
  },
  {
    id: 'banking',
    label: 'Banking Details',
    description: 'Add your banking details for receiving payments via direct deposit.',
    status: 'pending',
  },
  {
    id: 'safety_certs',
    label: 'Safety Certifications',
    description: 'Upload required safety certifications (OSHA 10/30, first aid, etc.).',
    status: 'pending',
    requiredDocType: 'safety_cert',
  },
  {
    id: 'agreement',
    label: 'Subcontractor Agreement',
    description: 'Review and sign the master subcontractor agreement.',
    status: 'pending',
    requiredDocType: 'signed_agreement',
  },
];

export default function SubOnboardingPage() {
  const { user, profile } = useAuth();
  const [steps, setSteps] = useState<SubOnboardingStep[]>(DEFAULT_STEPS);
  const [loading, setLoading] = useState(true);

  const subcontractorId = user?.uid || '';
  const orgId = profile?.orgId;

  // Load saved onboarding progress
  useEffect(() => {
    if (!subcontractorId || !orgId) {
      setLoading(false);
      return;
    }

    const loadProgress = async () => {
      try {
        const progressRef = doc(
          db,
          `organizations/${orgId}/subOnboarding`,
          subcontractorId
        );
        const snap = await getDoc(progressRef);

        if (snap.exists()) {
          const data = snap.data();
          const savedSteps = data.steps as Array<{
            id: SubOnboardingStepId;
            status: SubOnboardingStepStatus;
            completedAt?: Timestamp;
          }> | undefined;

          if (savedSteps && Array.isArray(savedSteps)) {
            // Merge saved progress with default steps
            const mergedSteps = DEFAULT_STEPS.map((defaultStep) => {
              const saved = savedSteps.find((s) => s.id === defaultStep.id);
              if (saved) {
                return {
                  ...defaultStep,
                  status: saved.status,
                  completedAt: saved.completedAt
                    ? (saved.completedAt instanceof Timestamp
                        ? saved.completedAt.toDate()
                        : new Date(saved.completedAt as unknown as string))
                    : undefined,
                };
              }
              return defaultStep;
            });
            setSteps(mergedSteps);
          }
        }
      } catch (err) {
        logger.error('Failed to load onboarding progress', {
          error: err,
          page: 'sub-onboarding',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [subcontractorId, orgId]);

  // Handle step action (mark as in_progress or completed)
  const handleStepAction = useCallback(
    async (stepId: SubOnboardingStepId) => {
      if (!subcontractorId || !orgId) return;

      const currentStep = steps.find((s) => s.id === stepId);
      if (!currentStep) return;

      // Toggle: pending -> in_progress -> completed
      let newStatus: SubOnboardingStepStatus;
      if (currentStep.status === 'pending') {
        newStatus = 'in_progress';
      } else if (currentStep.status === 'in_progress') {
        newStatus = 'completed';
      } else {
        return; // Already completed or skipped
      }

      const now = new Date();
      const updatedSteps = steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              status: newStatus,
              completedAt: newStatus === 'completed' ? now : s.completedAt,
            }
          : s
      );

      setSteps(updatedSteps);

      try {
        const progressRef = doc(
          db,
          `organizations/${orgId}/subOnboarding`,
          subcontractorId
        );
        await setDoc(
          progressRef,
          {
            subcontractorId,
            steps: updatedSteps.map((s) => ({
              id: s.id,
              status: s.status,
              completedAt: s.completedAt
                ? Timestamp.fromDate(s.completedAt)
                : null,
            })),
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );

        if (newStatus === 'completed') {
          toast.success(`"${currentStep.label}" marked as complete`);
        } else {
          toast.info(`Started "${currentStep.label}"`);
        }
      } catch (err) {
        logger.error('Failed to save onboarding progress', {
          error: err,
          page: 'sub-onboarding',
        });
        toast.error('Failed to save progress');
        // Revert
        setSteps(steps);
      }
    },
    [steps, subcontractorId, orgId]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Get Started"
        description="Complete these steps to finish your subcontractor onboarding"
      />

      <SectionErrorBoundary sectionName="Onboarding Checklist">
        <SubOnboardingChecklist
          subcontractorId={subcontractorId}
          steps={steps}
          onStepAction={handleStepAction}
        />
      </SectionErrorBoundary>
    </div>
  );
}
