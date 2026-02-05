/**
 * User Onboarding Service
 *
 * Handles automated onboarding flow for new users:
 * - Initiates onboarding process
 * - Sends welcome emails
 * - Sets up user defaults
 * - Assigns users to default projects based on role
 */

import { db } from '@/lib/firebase/config';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { UserProfile, UserRole, OnboardingStatus, OnboardingStep } from '@/types';

// Onboarding step definitions
export const ONBOARDING_STEPS: { id: OnboardingStep; label: string; description: string }[] = [
  {
    id: 'invite_sent',
    label: 'Invite Sent',
    description: 'Invitation email has been sent to the user',
  },
  {
    id: 'email_verified',
    label: 'Email Verified',
    description: 'User has verified their email address',
  },
  {
    id: 'profile_completed',
    label: 'Profile Completed',
    description: 'User has completed their profile setup',
  },
  {
    id: 'first_login',
    label: 'First Login',
    description: 'User has logged in for the first time',
  },
];

// Default notification preferences by role
const DEFAULT_NOTIFICATION_PREFS: Record<UserRole, {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  taskAssignments: boolean;
  projectUpdates: boolean;
  scheduleReminders: boolean;
}> = {
  OWNER: {
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    dailyDigest: true,
    weeklyReport: true,
    taskAssignments: true,
    projectUpdates: true,
    scheduleReminders: true,
  },
  PM: {
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    dailyDigest: true,
    weeklyReport: true,
    taskAssignments: true,
    projectUpdates: true,
    scheduleReminders: true,
  },
  EMPLOYEE: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    dailyDigest: false,
    weeklyReport: false,
    taskAssignments: true,
    projectUpdates: false,
    scheduleReminders: true,
  },
  CONTRACTOR: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    dailyDigest: false,
    weeklyReport: false,
    taskAssignments: true,
    projectUpdates: false,
    scheduleReminders: true,
  },
  SUB: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: false,
    dailyDigest: false,
    weeklyReport: false,
    taskAssignments: true,
    projectUpdates: false,
    scheduleReminders: false,
  },
  CLIENT: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: false,
    dailyDigest: false,
    weeklyReport: false,
    taskAssignments: false,
    projectUpdates: true,
    scheduleReminders: false,
  },
};

// Default dashboard layout by role
const DEFAULT_DASHBOARD_LAYOUTS: Record<UserRole, string[]> = {
  OWNER: ['revenue_overview', 'project_status', 'team_activity', 'upcoming_deadlines', 'cash_flow'],
  PM: ['my_projects', 'task_overview', 'team_schedule', 'pending_approvals', 'project_timeline'],
  EMPLOYEE: ['my_tasks', 'schedule_today', 'time_clock', 'recent_photos'],
  CONTRACTOR: ['my_tasks', 'schedule_week', 'time_tracking', 'recent_work'],
  SUB: ['assigned_work', 'schedule', 'documents'],
  CLIENT: ['project_progress', 'recent_updates', 'documents', 'invoices'],
};

/**
 * Initiates the onboarding process for a new user
 */
export async function initiateOnboarding(
  userId: string,
  options?: {
    sendEmail?: boolean;
    projectIds?: string[];
  }
): Promise<OnboardingStatus | null> {
  try {
    // Get user document
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.error(`User ${userId} not found`);
      return null;
    }

    const user = { ...userDoc.data(), uid: userId } as UserProfile;
    const now = new Date();

    // Create onboarding status
    const onboardingStatus: OnboardingStatus = {
      userId,
      inviteSent: true,
      inviteSentAt: now,
      emailVerified: false,
      profileCompleted: false,
      firstLoginAt: undefined,
      completedAt: undefined,
      currentStep: 'invite_sent',
      steps: {
        invite_sent: { completed: true, completedAt: now },
        email_verified: { completed: false },
        profile_completed: { completed: false },
        first_login: { completed: false },
      },
    };

    // Save onboarding status to Firestore
    await addDoc(collection(db, 'organizations', user.orgId, 'onboardingStatuses'), {
      ...onboardingStatus,
      inviteSentAt: Timestamp.fromDate(now),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Send welcome email if requested
    if (options?.sendEmail !== false) {
      await sendWelcomeEmail(user);
    }

    // Set up user defaults
    await setupUserDefaults(user);

    // Assign to default projects based on role
    if (options?.projectIds && options.projectIds.length > 0) {
      await assignToProjects(user, options.projectIds);
    } else {
      await assignToDefaultProjects(user, user.role);
    }

    return onboardingStatus;
  } catch (error) {
    console.error('Error initiating onboarding:', error);
    throw error;
  }
}

/**
 * Sends a welcome email to a new user
 */
export async function sendWelcomeEmail(
  user: UserProfile,
  options?: {
    customMessage?: string;
    loginUrl?: string;
  }
): Promise<boolean> {
  try {
    // Get organization details
    const orgDoc = await getDoc(doc(db, 'organizations', user.orgId));
    const orgData = orgDoc.data();
    const companyName = orgData?.name || 'ContractorOS';
    const companyPhone = orgData?.phone || '';

    // Base URL for login
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.contractoros.com';
    const loginUrl = options?.loginUrl || `${baseUrl}/login`;

    // Create email record in Firestore to be processed by Cloud Function
    await addDoc(collection(db, 'mail'), {
      to: user.email,
      template: {
        name: 'welcome_user',
        data: {
          userName: user.displayName || user.email?.split('@')[0] || 'there',
          userEmail: user.email,
          role: getRoleLabel(user.role),
          companyName,
          companyPhone,
          loginUrl,
          customMessage: options?.customMessage || '',
          supportEmail: orgData?.email || 'support@contractoros.com',
        },
      },
      createdAt: Timestamp.now(),
    });

    // Update onboarding status to mark invite sent
    await updateOnboardingStep(user.uid, user.orgId, 'invite_sent', true);

    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * Sets up default user preferences
 */
export async function setupUserDefaults(user: UserProfile): Promise<void> {
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', user.uid);

    // Get default preferences for role
    const notificationPrefs = DEFAULT_NOTIFICATION_PREFS[user.role] || DEFAULT_NOTIFICATION_PREFS.EMPLOYEE;
    const dashboardLayout = DEFAULT_DASHBOARD_LAYOUTS[user.role] || DEFAULT_DASHBOARD_LAYOUTS.EMPLOYEE;

    // Update user document with defaults
    batch.update(userRef, {
      notificationPreferences: notificationPrefs,
      dashboardLayout,
      theme: 'system',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
      onboardingStep: 'profile',
      updatedAt: Timestamp.now(),
    });

    // Create user preferences document
    const prefsRef = doc(db, 'organizations', user.orgId, 'userPreferences', user.uid);
    batch.set(prefsRef, {
      userId: user.uid,
      notifications: notificationPrefs,
      dashboardWidgets: dashboardLayout,
      defaultView: user.role === 'EMPLOYEE' || user.role === 'CONTRACTOR' ? 'tasks' : 'dashboard',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await batch.commit();
  } catch (error) {
    console.error('Error setting up user defaults:', error);
    throw error;
  }
}

/**
 * Assigns user to projects based on their role
 */
export async function assignToDefaultProjects(
  user: UserProfile,
  role: UserRole
): Promise<string[]> {
  try {
    const assignedProjectIds: string[] = [];

    // Role-based project assignment logic
    switch (role) {
      case 'OWNER':
      case 'PM':
        // Owners and PMs can see all projects - no auto-assignment needed
        break;

      case 'EMPLOYEE':
      case 'CONTRACTOR':
        // Get active projects and assign to default projects
        const activeProjectsQuery = query(
          collection(db, 'organizations', user.orgId, 'projects'),
          where('status', 'in', ['active', 'planning'])
        );
        const projectsSnap = await getDocs(activeProjectsQuery);

        // Assign to up to 3 most recent active projects by default
        const projects = projectsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .slice(0, 3);

        for (const project of projects) {
          await assignToProjects(user, [project.id]);
          assignedProjectIds.push(project.id);
        }
        break;

      case 'SUB':
        // Subs are assigned to specific projects via bid acceptance
        break;

      case 'CLIENT':
        // Clients are linked to their own projects
        break;
    }

    return assignedProjectIds;
  } catch (error) {
    console.error('Error assigning to default projects:', error);
    throw error;
  }
}

/**
 * Assigns user to specific projects
 */
export async function assignToProjects(
  user: UserProfile,
  projectIds: string[]
): Promise<void> {
  try {
    const batch = writeBatch(db);

    for (const projectId of projectIds) {
      // Add user to project team members
      const projectRef = doc(db, 'organizations', user.orgId, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        const currentTeam = projectData.teamMemberIds || [];

        if (!currentTeam.includes(user.uid)) {
          batch.update(projectRef, {
            teamMemberIds: [...currentTeam, user.uid],
            updatedAt: Timestamp.now(),
          });
        }
      }

      // Create project assignment record
      const assignmentRef = doc(collection(db, 'organizations', user.orgId, 'projectAssignments'));
      batch.set(assignmentRef, {
        userId: user.uid,
        projectId,
        role: user.role,
        assignedAt: Timestamp.now(),
        assignedBy: 'system',
        status: 'active',
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error assigning to projects:', error);
    throw error;
  }
}

/**
 * Updates a specific onboarding step
 */
export async function updateOnboardingStep(
  userId: string,
  orgId: string,
  step: OnboardingStep,
  completed: boolean
): Promise<void> {
  try {
    // Find the onboarding status document
    const statusQuery = query(
      collection(db, 'organizations', orgId, 'onboardingStatuses'),
      where('userId', '==', userId)
    );
    const statusSnap = await getDocs(statusQuery);

    if (statusSnap.empty) {
      console.warn(`No onboarding status found for user ${userId}`);
      return;
    }

    const statusDoc = statusSnap.docs[0];
    const now = new Date();

    // Update the step
    const updateData: Record<string, unknown> = {
      [`steps.${step}.completed`]: completed,
      [`steps.${step}.completedAt`]: completed ? Timestamp.fromDate(now) : null,
      updatedAt: Timestamp.now(),
    };

    // Update current step based on completion
    if (completed) {
      const nextStep = getNextStep(step);
      if (nextStep) {
        updateData.currentStep = nextStep;
      }

      // Mark specific fields
      switch (step) {
        case 'invite_sent':
          updateData.inviteSent = true;
          updateData.inviteSentAt = Timestamp.fromDate(now);
          break;
        case 'email_verified':
          updateData.emailVerified = true;
          break;
        case 'profile_completed':
          updateData.profileCompleted = true;
          break;
        case 'first_login':
          updateData.firstLoginAt = Timestamp.fromDate(now);
          break;
      }

      // Check if all steps are complete
      const statusData = statusDoc.data();
      const allSteps = ['invite_sent', 'email_verified', 'profile_completed', 'first_login'];
      const completedSteps = allSteps.filter(s =>
        s === step ? true : statusData.steps?.[s]?.completed
      );

      if (completedSteps.length === allSteps.length) {
        updateData.completedAt = Timestamp.fromDate(now);
      }
    }

    await updateDoc(statusDoc.ref, updateData);
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    throw error;
  }
}

/**
 * Gets the current onboarding status for a user
 */
export async function getOnboardingStatus(
  userId: string,
  orgId: string
): Promise<OnboardingStatus | null> {
  try {
    const statusQuery = query(
      collection(db, 'organizations', orgId, 'onboardingStatuses'),
      where('userId', '==', userId)
    );
    const statusSnap = await getDocs(statusQuery);

    if (statusSnap.empty) {
      return null;
    }

    const doc = statusSnap.docs[0];
    const data = doc.data();

    return {
      userId: data.userId,
      inviteSent: data.inviteSent || false,
      inviteSentAt: data.inviteSentAt?.toDate(),
      emailVerified: data.emailVerified || false,
      profileCompleted: data.profileCompleted || false,
      firstLoginAt: data.firstLoginAt?.toDate(),
      completedAt: data.completedAt?.toDate(),
      currentStep: data.currentStep,
      steps: data.steps,
    };
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return null;
  }
}

/**
 * Bulk initiate onboarding for multiple users
 */
export async function bulkInitiateOnboarding(
  userIds: string[],
  options?: {
    sendEmail?: boolean;
    projectIds?: string[];
  }
): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [] as string[], failed: [] as string[] };

  for (const userId of userIds) {
    try {
      const status = await initiateOnboarding(userId, options);
      if (status) {
        results.success.push(userId);
      } else {
        results.failed.push(userId);
      }
    } catch {
      results.failed.push(userId);
    }
  }

  return results;
}

/**
 * Resend welcome email to a user
 */
export async function resendWelcomeEmail(
  userId: string,
  _orgId: string
): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }

    const user = { ...userDoc.data(), uid: userId } as UserProfile;
    return await sendWelcomeEmail(user);
  } catch (error) {
    console.error('Error resending welcome email:', error);
    return false;
  }
}

// Helper functions
function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    OWNER: 'Owner',
    PM: 'Project Manager',
    EMPLOYEE: 'Employee',
    CONTRACTOR: 'Contractor',
    SUB: 'Subcontractor',
    CLIENT: 'Client',
  };
  return labels[role] || 'Team Member';
}

function getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
  const stepOrder: OnboardingStep[] = ['invite_sent', 'email_verified', 'profile_completed', 'first_login'];
  const currentIndex = stepOrder.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === stepOrder.length - 1) {
    return null;
  }
  return stepOrder[currentIndex + 1];
}

const userOnboarding = {
  initiateOnboarding,
  sendWelcomeEmail,
  setupUserDefaults,
  assignToDefaultProjects,
  assignToProjects,
  updateOnboardingStep,
  getOnboardingStatus,
  bulkInitiateOnboarding,
  resendWelcomeEmail,
  ONBOARDING_STEPS,
};

export default userOnboarding;
