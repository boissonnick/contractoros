/**
 * Update Task Completions for Realistic Performance Metrics
 *
 * This script updates completed tasks to have varied completedAt dates
 * and actualHours for more realistic performance tracking:
 * - 30% early: -1 to -5 days before dueDate
 * - 40% on-time: within +/-1 day of dueDate
 * - 30% late: +1 to +10 days after dueDate
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  logSection,
  logProgress,
  logSuccess,
  logWarning,
} from './utils';

// Types for completion timing
type CompletionTiming = 'early' | 'on_time' | 'late';

interface TaskDoc {
  id: string;
  status: string;
  dueDate?: Timestamp | null;
  completedAt?: Timestamp | null;
  estimatedHours?: number;
  actualHours?: number;
}


/**
 * Randomly select completion timing based on distribution:
 * 30% early, 40% on-time, 30% late
 */
function getCompletionTiming(): CompletionTiming {
  const rand = Math.random();
  if (rand < 0.30) return 'early';
  if (rand < 0.70) return 'on_time';
  return 'late';
}

/**
 * Calculate the offset in days based on timing
 */
function getDayOffset(timing: CompletionTiming): number {
  switch (timing) {
    case 'early':
      // -1 to -5 days (before due date)
      return -Math.floor(Math.random() * 5 + 1);
    case 'on_time':
      // -1, 0, or +1 days
      return Math.floor(Math.random() * 3) - 1;
    case 'late':
      // +1 to +10 days
      return Math.floor(Math.random() * 10 + 1);
  }
}

/**
 * Calculate actualHours multiplier based on timing
 */
function getHoursMultiplier(timing: CompletionTiming): number {
  switch (timing) {
    case 'early':
      // 0.7 to 0.95 (finished faster)
      return 0.7 + Math.random() * 0.25;
    case 'on_time':
      // 0.9 to 1.1 (close to estimate)
      return 0.9 + Math.random() * 0.2;
    case 'late':
      // 1.1 to 1.4 (took longer)
      return 1.1 + Math.random() * 0.3;
  }
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Main function to update task completions
 */
async function updateTaskCompletions(): Promise<void> {
  const db = getDb();

  logSection('Updating Task Completion Timing');
  logProgress(`Organization ID: ${DEMO_ORG_ID}`);

  // Fetch all completed tasks for the organization
  logProgress('Fetching completed tasks...');
  const tasksSnapshot = await db
    .collection('tasks')
    .where('orgId', '==', DEMO_ORG_ID)
    .where('status', '==', 'completed')
    .get();

  if (tasksSnapshot.empty) {
    logWarning('No completed tasks found. Make sure to run seed-tasks.ts first.');
    return;
  }

  logProgress(`Found ${tasksSnapshot.size} completed tasks`);

  // Collect tasks with valid dueDate
  const tasksToUpdate: Array<{ doc: FirebaseFirestore.QueryDocumentSnapshot; data: TaskDoc }> = [];
  let skippedCount = 0;

  for (const doc of tasksSnapshot.docs) {
    const data = doc.data() as TaskDoc;
    data.id = doc.id;

    if (!data.dueDate) {
      skippedCount++;
      continue;
    }

    tasksToUpdate.push({ doc, data });
  }

  if (skippedCount > 0) {
    logWarning(`Skipped ${skippedCount} tasks without dueDate`);
  }

  logProgress(`Processing ${tasksToUpdate.length} tasks with valid due dates...`);

  // Track timing distribution for reporting
  const timingStats = { early: 0, on_time: 0, late: 0 };

  // Process in batches of 500 (Firestore limit)
  const BATCH_SIZE = 500;
  let processedCount = 0;

  for (let i = 0; i < tasksToUpdate.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = tasksToUpdate.slice(i, i + BATCH_SIZE);

    for (const { doc, data } of chunk) {
      const timing = getCompletionTiming();
      timingStats[timing]++;

      const dueDate = data.dueDate!.toDate();
      const dayOffset = getDayOffset(timing);
      const newCompletedAt = addDays(dueDate, dayOffset);

      // Calculate actualHours based on estimatedHours
      const estimatedHours = data.estimatedHours || 8; // Default to 8 if not set
      const multiplier = getHoursMultiplier(timing);
      const newActualHours = Math.round(estimatedHours * multiplier * 10) / 10; // Round to 1 decimal

      const updateData = {
        completedAt: Timestamp.fromDate(newCompletedAt),
        actualHours: newActualHours,
        updatedAt: Timestamp.now(),
      };

      batch.update(doc.ref, updateData as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>);
    }

    await batch.commit();
    processedCount += chunk.length;
    logProgress(`Updated ${processedCount}/${tasksToUpdate.length} tasks`);
  }

  // Print summary
  logSection('Update Complete');
  logSuccess(`Total tasks updated: ${tasksToUpdate.length}`);
  logSuccess(`Early completions (30% target): ${timingStats.early} (${((timingStats.early / tasksToUpdate.length) * 100).toFixed(1)}%)`);
  logSuccess(`On-time completions (40% target): ${timingStats.on_time} (${((timingStats.on_time / tasksToUpdate.length) * 100).toFixed(1)}%)`);
  logSuccess(`Late completions (30% target): ${timingStats.late} (${((timingStats.late / tasksToUpdate.length) * 100).toFixed(1)}%)`);
}

// ============================================
// Run if executed directly
// ============================================

if (require.main === module) {
  updateTaskCompletions()
    .then(() => {
      console.log('\nTask completion timing updated successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nError updating task completions:', error);
      process.exit(1);
    });
}

export { updateTaskCompletions };
