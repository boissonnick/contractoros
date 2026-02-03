import {
  OffboardingOptions,
  OffboardingReport,
  OffboardingWizardState,
  UserRole,
} from '@/types';

export interface OffboardingTargetUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface TeamMember {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
}

export interface ConfirmStepProps {
  targetUser: OffboardingTargetUser;
  impactPreview: OffboardingWizardState['impactPreview'];
}

export interface ReassignStepProps {
  teamMembers: TeamMember[];
  loadingTeam: boolean;
  selectedUser: OffboardingWizardState['reassignToUser'];
  impactPreview: OffboardingWizardState['impactPreview'];
  onSelectUser: (user: { id: string; name: string } | null) => void;
}

export interface DataHandlingStepProps {
  options: Partial<OffboardingOptions>;
  onUpdateOptions: (updates: Partial<OffboardingOptions>) => void;
}

export interface ReviewStepProps {
  targetUser: OffboardingTargetUser;
  options: Partial<OffboardingOptions>;
  reassignToUser: OffboardingWizardState['reassignToUser'];
  impactPreview: OffboardingWizardState['impactPreview'];
  error: string | null;
}

export interface CompleteStepProps {
  report: OffboardingReport | null;
}
