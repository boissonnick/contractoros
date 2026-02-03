"use client";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  OffboardingOptions,
  OffboardingReport,
  OffboardingRecord,
  OffboardingAction,
  UserDataArchive,
  UserProfile,
  UserRole,
} from '@/types';

/**
 * Get preview of what will be affected by offboarding a user
 */
export async function getOffboardingImpactPreview(
  orgId: string,
  userId: string
): Promise<{
  taskCount: number;
  projectCount: number;
  timeEntryCount: number;
  expenseCount: number;
}> {
  const [tasksSnap, projectsSnap, timeEntriesSnap, expensesSnap] = await Promise.all([
    // Tasks assigned to user
    getDocs(
      query(
        collection(db, 'tasks'),
        where('orgId', '==', orgId),
        where('assignedTo', 'array-contains', userId)
      )
    ),
    // Projects created by or assigned to user
    getDocs(
      query(
        collection(db, 'projects'),
        where('orgId', '==', orgId),
        where('projectManagerId', '==', userId)
      )
    ),
    // Time entries by user
    getDocs(
      query(
        collection(db, 'timeEntries'),
        where('orgId', '==', orgId),
        where('userId', '==', userId)
      )
    ),
    // Expenses submitted by user
    getDocs(
      query(
        collection(db, 'expenses'),
        where('orgId', '==', orgId),
        where('submittedBy', '==', userId)
      )
    ),
  ]);

  return {
    taskCount: tasksSnap.size,
    projectCount: projectsSnap.size,
    timeEntryCount: timeEntriesSnap.size,
    expenseCount: expensesSnap.size,
  };
}

/**
 * Initiates the offboarding process for a user
 * Creates an offboarding record and starts the process
 */
export async function initiateOffboarding(
  orgId: string,
  userId: string,
  userName: string,
  userEmail: string,
  userRole: UserRole,
  options: OffboardingOptions,
  initiatedBy: string,
  initiatedByName: string
): Promise<string> {
  // Create offboarding record
  const offboardingRecord: Omit<OffboardingRecord, 'id'> = {
    orgId,
    userId,
    userName,
    userEmail,
    userRole,
    status: 'pending',
    options,
    initiatedBy,
    initiatedByName,
    createdAt: new Date(),
  };

  const docRef = await addDoc(
    collection(db, `organizations/${orgId}/offboardings`),
    {
      ...offboardingRecord,
      createdAt: Timestamp.now(),
      options: {
        ...options,
        effectiveDate: Timestamp.fromDate(options.effectiveDate),
      },
    }
  );

  return docRef.id;
}

/**
 * Revokes access for a user by deactivating their account
 * This disables login and clears active sessions
 */
export async function revokeAccess(
  orgId: string,
  userId: string
): Promise<OffboardingAction> {
  const action: OffboardingAction = {
    action: 'revoke_access',
    description: 'Deactivating user account and revoking access',
    timestamp: new Date(),
    success: false,
  };

  try {
    // Update user profile to inactive
    await updateDoc(doc(db, 'users', userId), {
      isActive: false,
      deactivatedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Note: To fully revoke Firebase Auth sessions, you would need a Cloud Function
    // that calls admin.auth().revokeRefreshTokens(userId)
    // For now, we mark the user as inactive which the app checks on each request

    action.success = true;
    action.description = 'User account deactivated successfully';
  } catch (error) {
    action.error = error instanceof Error ? error.message : 'Unknown error revoking access';
    console.error('Error revoking access:', error);
  }

  return action;
}

/**
 * Reassigns all tasks from one user to another
 */
export async function reassignTasks(
  orgId: string,
  fromUserId: string,
  toUserId: string
): Promise<OffboardingAction> {
  const action: OffboardingAction = {
    action: 'reassign_task',
    description: 'Reassigning tasks to new owner',
    timestamp: new Date(),
    success: false,
    metadata: { fromUserId, toUserId, count: 0 },
  };

  try {
    // Find all tasks assigned to the user
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('orgId', '==', orgId),
      where('assignedTo', 'array-contains', fromUserId)
    );
    const tasksSnap = await getDocs(tasksQuery);

    if (tasksSnap.empty) {
      action.success = true;
      action.description = 'No tasks to reassign';
      return action;
    }

    // Batch update all tasks
    const batch = writeBatch(db);
    let count = 0;

    tasksSnap.docs.forEach((taskDoc) => {
      const data = taskDoc.data();
      const assignedTo = (data.assignedTo as string[]) || [];

      // Replace fromUserId with toUserId in the assignedTo array
      const newAssignedTo = assignedTo.map((id) =>
        id === fromUserId ? toUserId : id
      );

      batch.update(doc(db, 'tasks', taskDoc.id), {
        assignedTo: newAssignedTo,
        updatedAt: Timestamp.now(),
      });
      count++;
    });

    await batch.commit();

    action.success = true;
    action.description = `Reassigned ${count} task(s) to new owner`;
    action.metadata = { ...action.metadata, count };
  } catch (error) {
    action.error = error instanceof Error ? error.message : 'Unknown error reassigning tasks';
    console.error('Error reassigning tasks:', error);
  }

  return action;
}

/**
 * Transfers project ownership from one user to another
 */
export async function transferProjects(
  orgId: string,
  fromUserId: string,
  toUserId: string
): Promise<OffboardingAction> {
  const action: OffboardingAction = {
    action: 'transfer_project',
    description: 'Transferring project ownership',
    timestamp: new Date(),
    success: false,
    metadata: { fromUserId, toUserId, count: 0 },
  };

  try {
    // Find all projects where user is project manager
    const projectsQuery = query(
      collection(db, 'projects'),
      where('orgId', '==', orgId),
      where('projectManagerId', '==', fromUserId)
    );
    const projectsSnap = await getDocs(projectsQuery);

    if (projectsSnap.empty) {
      action.success = true;
      action.description = 'No projects to transfer';
      return action;
    }

    // Batch update all projects
    const batch = writeBatch(db);
    let count = 0;

    projectsSnap.docs.forEach((projectDoc) => {
      batch.update(doc(db, 'projects', projectDoc.id), {
        projectManagerId: toUserId,
        updatedAt: Timestamp.now(),
      });
      count++;
    });

    await batch.commit();

    action.success = true;
    action.description = `Transferred ${count} project(s) to new owner`;
    action.metadata = { ...action.metadata, count };
  } catch (error) {
    action.error = error instanceof Error ? error.message : 'Unknown error transferring projects';
    console.error('Error transferring projects:', error);
  }

  return action;
}

/**
 * Archives user data for compliance/audit purposes
 */
export async function archiveUserData(
  orgId: string,
  userId: string,
  createdBy: string
): Promise<OffboardingAction> {
  const action: OffboardingAction = {
    action: 'archive_data',
    description: 'Archiving user data for compliance',
    timestamp: new Date(),
    success: false,
  };

  try {
    // Get user profile
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const userData = userDoc.data() as UserProfile;

    // Get counts of user's data
    const [tasksSnap, projectsSnap, timeEntriesSnap, expensesSnap, photosSnap] =
      await Promise.all([
        getDocs(
          query(
            collection(db, 'tasks'),
            where('orgId', '==', orgId),
            where('assignedTo', 'array-contains', userId)
          )
        ),
        getDocs(
          query(
            collection(db, 'projects'),
            where('orgId', '==', orgId),
            where('projectManagerId', '==', userId)
          )
        ),
        getDocs(
          query(
            collection(db, 'timeEntries'),
            where('orgId', '==', orgId),
            where('userId', '==', userId)
          )
        ),
        getDocs(
          query(
            collection(db, 'expenses'),
            where('orgId', '==', orgId),
            where('submittedBy', '==', userId)
          )
        ),
        getDocs(
          query(
            collection(db, 'photos'),
            where('orgId', '==', orgId),
            where('uploadedBy', '==', userId)
          )
        ),
      ]);

    // Create archive record
    const archive: Omit<UserDataArchive, 'id'> = {
      orgId,
      userId,
      userName: userData.displayName || 'Unknown',
      userEmail: userData.email || '',
      profileSnapshot: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        phone: userData.phone,
        trade: userData.trade,
        createdAt: userData.createdAt,
      },
      activitySummary: {
        totalTasks: tasksSnap.size,
        totalProjects: projectsSnap.size,
        totalTimeEntries: timeEntriesSnap.size,
        totalExpenses: expensesSnap.size,
        totalPhotos: photosSnap.size,
      },
      archivedCollections: [
        { collection: 'tasks', documentCount: tasksSnap.size },
        { collection: 'projects', documentCount: projectsSnap.size },
        { collection: 'timeEntries', documentCount: timeEntriesSnap.size },
        { collection: 'expenses', documentCount: expensesSnap.size },
        { collection: 'photos', documentCount: photosSnap.size },
      ],
      createdAt: new Date(),
      createdBy,
      // Retain for 7 years (common compliance requirement)
      retainUntil: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000),
    };

    await addDoc(collection(db, `organizations/${orgId}/userArchives`), {
      ...archive,
      createdAt: Timestamp.now(),
      retainUntil: Timestamp.fromDate(archive.retainUntil),
      profileSnapshot: {
        ...archive.profileSnapshot,
        createdAt: archive.profileSnapshot.createdAt
          ? Timestamp.fromDate(new Date(archive.profileSnapshot.createdAt))
          : null,
      },
    });

    action.success = true;
    action.description = 'User data archived successfully';
    action.metadata = {
      totalTasks: tasksSnap.size,
      totalProjects: projectsSnap.size,
      totalTimeEntries: timeEntriesSnap.size,
      totalExpenses: expensesSnap.size,
      totalPhotos: photosSnap.size,
    };
  } catch (error) {
    action.error = error instanceof Error ? error.message : 'Unknown error archiving data';
    console.error('Error archiving user data:', error);
  }

  return action;
}

/**
 * Generates a summary report of the offboarding process
 */
export function generateOffboardingReport(
  userId: string,
  userName: string,
  userEmail: string,
  options: OffboardingOptions,
  actions: OffboardingAction[],
  initiatedBy: string
): OffboardingReport {
  const tasksReassigned =
    actions
      .filter((a) => a.action === 'reassign_task' && a.success)
      .reduce((sum, a) => sum + ((a.metadata?.count as number) || 0), 0);

  const projectsTransferred =
    actions
      .filter((a) => a.action === 'transfer_project' && a.success)
      .reduce((sum, a) => sum + ((a.metadata?.count as number) || 0), 0);

  const dataArchived = actions.some(
    (a) => a.action === 'archive_data' && a.success
  );

  const accessRevoked = actions.some(
    (a) => a.action === 'revoke_access' && a.success
  );

  const errors = actions
    .filter((a) => !a.success && a.error)
    .map((a) => a.error as string);

  return {
    userId,
    userName,
    userEmail,
    tasksReassigned,
    projectsTransferred,
    dataArchived,
    accessRevoked,
    completedAt: new Date(),
    initiatedBy,
    effectiveDate: options.effectiveDate,
    errors: errors.length > 0 ? errors : undefined,
    actionLog: actions,
  };
}

/**
 * Executes the full offboarding process
 */
export async function executeOffboarding(
  offboardingId: string,
  orgId: string,
  userId: string,
  userName: string,
  userEmail: string,
  options: OffboardingOptions,
  initiatedBy: string
): Promise<OffboardingReport> {
  const actions: OffboardingAction[] = [];

  // Update status to in_progress
  await updateDoc(doc(db, `organizations/${orgId}/offboardings`, offboardingId), {
    status: 'in_progress',
    startedAt: Timestamp.now(),
  });

  try {
    // Step 1: Revoke access (if immediate)
    if (options.revokeSessionsImmediately !== false) {
      const revokeAction = await revokeAccess(orgId, userId);
      actions.push(revokeAction);
    }

    // Step 2: Reassign tasks (if a new owner is specified)
    if (options.reassignTasksTo) {
      const reassignAction = await reassignTasks(
        orgId,
        userId,
        options.reassignTasksTo
      );
      actions.push(reassignAction);

      // Also transfer projects
      const transferAction = await transferProjects(
        orgId,
        userId,
        options.reassignTasksTo
      );
      actions.push(transferAction);
    }

    // Step 3: Archive data (if requested)
    if (options.archiveData) {
      const archiveAction = await archiveUserData(orgId, userId, initiatedBy);
      actions.push(archiveAction);
    }

    // Generate report
    const report = generateOffboardingReport(
      userId,
      userName,
      userEmail,
      options,
      actions,
      initiatedBy
    );

    // Calculate restorable until date (30 days)
    const restorableUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Update offboarding record with completion
    const hasErrors = actions.some((a) => !a.success);
    await updateDoc(doc(db, `organizations/${orgId}/offboardings`, offboardingId), {
      status: hasErrors ? 'failed' : 'completed',
      completedAt: Timestamp.now(),
      restorableUntil: Timestamp.fromDate(restorableUntil),
      report: {
        ...report,
        completedAt: Timestamp.now(),
        effectiveDate: Timestamp.fromDate(report.effectiveDate),
        actionLog: report.actionLog.map((a) => ({
          ...a,
          timestamp: Timestamp.fromDate(a.timestamp),
        })),
      },
    });

    return report;
  } catch (error) {
    // Update status to failed
    await updateDoc(doc(db, `organizations/${orgId}/offboardings`, offboardingId), {
      status: 'failed',
      completedAt: Timestamp.now(),
    });
    throw error;
  }
}

/**
 * Restores an offboarded user (within 30-day window)
 */
export async function restoreUser(
  offboardingId: string,
  orgId: string,
  userId: string,
  restoredBy: string
): Promise<boolean> {
  try {
    // Check if offboarding record exists and is restorable
    const offboardingDoc = await getDoc(
      doc(db, `organizations/${orgId}/offboardings`, offboardingId)
    );

    if (!offboardingDoc.exists()) {
      throw new Error('Offboarding record not found');
    }

    const offboarding = offboardingDoc.data() as OffboardingRecord;

    if (offboarding.status !== 'completed') {
      throw new Error('Can only restore completed offboardings');
    }

    if (offboarding.restorableUntil) {
      const restorableUntil =
        offboarding.restorableUntil instanceof Timestamp
          ? offboarding.restorableUntil.toDate()
          : new Date(offboarding.restorableUntil);

      if (new Date() > restorableUntil) {
        throw new Error('Restore window has expired (30 days)');
      }
    }

    // Reactivate user
    await updateDoc(doc(db, 'users', userId), {
      isActive: true,
      deactivatedAt: null,
      updatedAt: Timestamp.now(),
    });

    // Update offboarding record
    await updateDoc(doc(db, `organizations/${orgId}/offboardings`, offboardingId), {
      restoredAt: Timestamp.now(),
      restoredBy,
    });

    return true;
  } catch (error) {
    console.error('Error restoring user:', error);
    throw error;
  }
}

/**
 * Gets all offboarding records for an organization
 */
export async function getOffboardingRecords(
  orgId: string
): Promise<OffboardingRecord[]> {
  const snap = await getDocs(
    query(
      collection(db, `organizations/${orgId}/offboardings`),
      where('status', 'in', ['completed', 'in_progress', 'pending'])
    )
  );

  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      startedAt: data.startedAt?.toDate(),
      completedAt: data.completedAt?.toDate(),
      restorableUntil: data.restorableUntil?.toDate(),
      restoredAt: data.restoredAt?.toDate(),
      options: {
        ...data.options,
        effectiveDate: data.options?.effectiveDate?.toDate() || new Date(),
      },
    } as OffboardingRecord;
  });
}

/**
 * Gets offboarded users who can still be restored (within 30-day window)
 */
export async function getRestorableUsers(
  orgId: string
): Promise<OffboardingRecord[]> {
  const records = await getOffboardingRecords(orgId);
  const now = new Date();

  return records.filter((r) => {
    if (r.status !== 'completed') return false;
    if (r.restoredAt) return false; // Already restored
    if (!r.restorableUntil) return false;
    return r.restorableUntil > now;
  });
}
