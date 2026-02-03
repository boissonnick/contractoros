/**
 * Update Time Entry Tasks
 * Sprint 37B - Team Productivity Enhancement (#74)
 *
 * Links existing time entries to tasks by:
 * 1. Matching projectId between time entries and tasks
 * 2. Checking if the time entry user is assigned to the task
 * 3. Picking a random matching task and updating taskId
 *
 * Also adds approval workflow variance:
 * - 10% of entries: status = 'pending_approval'
 * - 5% of entries: status = 'rejected' with rejectionReason
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  logSection,
  logProgress,
  logSuccess,
  logWarning,
  randomItem,
} from './utils';
import { getDb } from './db';

// Initialize Firebase Admin if needed
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'contractoros-483812',
  });
}

const db = getDb();

// Rejection reasons for realistic data
const REJECTION_REASONS = [
  'Hours exceed daily limit - please verify',
  'Missing project assignment',
  'Clock-in time appears incorrect',
  'Overlapping time entry detected',
  'Please add task description',
  'Verify break times',
  'Project code mismatch',
];

interface Task {
  id: string;
  projectId: string;
  title: string;
  assignedTo: string[];
}

interface TimeEntryUpdate {
  docRef: FirebaseFirestore.DocumentReference;
  updates: Record<string, unknown>;
}

async function fetchTasks(): Promise<Task[]> {
  logProgress('Fetching tasks...');

  // Tasks are stored in top-level 'tasks' collection with orgId field
  const tasksSnapshot = await db
    .collection('tasks')
    .where('orgId', '==', DEMO_ORG_ID)
    .get();

  const tasks: Task[] = tasksSnapshot.docs.map((doc) => ({
    id: doc.id,
    projectId: doc.data().projectId,
    title: doc.data().title,
    assignedTo: doc.data().assignedTo || [],
  }));

  logSuccess(`Found ${tasks.length} tasks`);
  return tasks;
}

async function fetchTimeEntries(): Promise<FirebaseFirestore.QuerySnapshot> {
  logProgress('Fetching time entries...');

  const snapshot = await db
    .collection('organizations')
    .doc(DEMO_ORG_ID)
    .collection('timeEntries')
    .get();

  logSuccess(`Found ${snapshot.size} time entries`);
  return snapshot;
}

function buildProjectTaskMap(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();

  for (const task of tasks) {
    if (!task.projectId) continue;

    const existing = map.get(task.projectId) || [];
    existing.push(task);
    map.set(task.projectId, existing);
  }

  return map;
}

function findMatchingTask(
  projectId: string | undefined,
  userId: string,
  projectTaskMap: Map<string, Task[]>
): Task | null {
  if (!projectId) return null;

  const projectTasks = projectTaskMap.get(projectId);
  if (!projectTasks || projectTasks.length === 0) return null;

  // Filter tasks where user is assigned
  const userTasks = projectTasks.filter(
    (task) => task.assignedTo && task.assignedTo.includes(userId)
  );

  // If user has assigned tasks, pick one randomly
  if (userTasks.length > 0) {
    return randomItem(userTasks);
  }

  // Fallback: pick any task from the project (for demo coverage)
  return randomItem(projectTasks);
}

async function updateTimeEntryTasks(): Promise<{
  linked: number;
  pendingApproval: number;
  rejected: number;
  skipped: number;
}> {
  logSection('Updating Time Entry Tasks');

  // Fetch all data
  const [tasks, timeEntriesSnapshot] = await Promise.all([
    fetchTasks(),
    fetchTimeEntries(),
  ]);

  if (tasks.length === 0) {
    logWarning('No tasks found - cannot link time entries');
    return { linked: 0, pendingApproval: 0, rejected: 0, skipped: timeEntriesSnapshot.size };
  }

  // Build lookup map
  const projectTaskMap = buildProjectTaskMap(tasks);
  logProgress(`Built task map for ${projectTaskMap.size} projects`);

  // Prepare updates
  const updates: TimeEntryUpdate[] = [];
  let linkedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  let skippedCount = 0;

  timeEntriesSnapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    const projectId = data.projectId;
    const userId = data.userId;

    // Find matching task
    const matchingTask = findMatchingTask(projectId, userId, projectTaskMap);

    if (!matchingTask) {
      skippedCount++;
      return;
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      taskId: matchingTask.id,
      taskName: matchingTask.title,
      updatedAt: Timestamp.now(),
    };

    // Determine approval status variance
    // Only apply to entries that are currently 'approved'
    const random = Math.random();
    if (data.status === 'approved') {
      if (random < 0.05) {
        // 5% rejected
        updateData.status = 'rejected';
        updateData.rejectedBy = data.approvedBy || 'demo-mike-johnson';
        updateData.rejectedByName = data.approvedByName || 'Mike Johnson';
        updateData.rejectedAt = Timestamp.now();
        updateData.rejectionReason = randomItem(REJECTION_REASONS);
        // Clear approval fields
        updateData.approvedBy = null;
        updateData.approvedByName = null;
        updateData.approvedAt = null;
        rejectedCount++;
      } else if (random < 0.15) {
        // 10% pending approval
        updateData.status = 'pending_approval';
        // Clear approval fields
        updateData.approvedBy = null;
        updateData.approvedByName = null;
        updateData.approvedAt = null;
        pendingCount++;
      }
    }

    updates.push({
      docRef: doc.ref,
      updates: updateData,
    });
    linkedCount++;
  });

  // Execute batch updates
  if (updates.length === 0) {
    logWarning('No time entries to update');
    return { linked: 0, pendingApproval: 0, rejected: 0, skipped: skippedCount };
  }

  logProgress(`Preparing ${updates.length} updates...`);

  // Firestore batch limit is 500
  const BATCH_SIZE = 500;
  let processedCount = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = updates.slice(i, i + BATCH_SIZE);

    for (const update of chunk) {
      batch.update(update.docRef, update.updates);
    }

    await batch.commit();
    processedCount += chunk.length;
    logProgress(`Batch progress: ${processedCount}/${updates.length}`);
  }

  logSuccess(`Linked ${linkedCount} time entries to tasks`);
  logSuccess(`Set ${pendingCount} entries to pending_approval`);
  logSuccess(`Set ${rejectedCount} entries to rejected`);
  logProgress(`Skipped ${skippedCount} entries (no matching project tasks)`);

  return {
    linked: linkedCount,
    pendingApproval: pendingCount,
    rejected: rejectedCount,
    skipped: skippedCount,
  };
}

// Run if executed directly
if (require.main === module) {
  updateTimeEntryTasks()
    .then((result) => {
      console.log('\n========================================');
      console.log('  Time Entry Task Linking Complete');
      console.log('========================================');
      console.log(`  Linked to tasks:     ${result.linked}`);
      console.log(`  Pending approval:    ${result.pendingApproval}`);
      console.log(`  Rejected:            ${result.rejected}`);
      console.log(`  Skipped (no match):  ${result.skipped}`);
      console.log('========================================\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error updating time entry tasks:', error);
      process.exit(1);
    });
}

export { updateTimeEntryTasks };
