import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import { DEMO_PROJECT, DEMO_PHASES } from './demoProjectTemplate';

export async function seedDemoData(orgId: string, ownerUid: string): Promise<string> {
  const now = Timestamp.now();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // Started a week ago

  // Create demo project
  const projectRef = doc(collection(db, 'projects'));
  const projectId = projectRef.id;

  await setDoc(projectRef, {
    orgId,
    name: DEMO_PROJECT.name,
    description: DEMO_PROJECT.description,
    address: DEMO_PROJECT.address,
    status: DEMO_PROJECT.status,
    clientId: ownerUid, // Owner is the client for demo
    pmId: ownerUid,
    startDate: Timestamp.fromDate(startDate),
    budget: DEMO_PROJECT.budget,
    currentSpend: 3200,
    isDemoData: true,
    createdAt: now,
    updatedAt: now,
  });

  // Create phases and tasks
  let dayOffset = 0;

  for (const phase of DEMO_PHASES) {
    const phaseRef = doc(collection(db, 'projects', projectId, 'phases'));
    const phaseStart = new Date(startDate);
    phaseStart.setDate(phaseStart.getDate() + dayOffset);
    const phaseEnd = new Date(phaseStart);
    phaseEnd.setDate(phaseEnd.getDate() + phase.estimatedDuration);

    const completedTasks = phase.tasks.filter(t => t.status === 'completed').length;

    await setDoc(phaseRef, {
      projectId,
      name: phase.name,
      order: phase.order,
      status: phase.order === 0 ? 'active' : 'upcoming',
      startDate: Timestamp.fromDate(phaseStart),
      endDate: Timestamp.fromDate(phaseEnd),
      estimatedDuration: phase.estimatedDuration,
      budgetAmount: phase.budgetAmount,
      actualCost: phase.order === 0 ? 3200 : 0,
      assignedTeamMembers: [ownerUid],
      assignedSubcontractors: [],
      progressPercent: Math.round((completedTasks / phase.tasks.length) * 100),
      tasksTotal: phase.tasks.length,
      tasksCompleted: completedTasks,
      dependencies: [],
      documents: [],
      milestones: [],
      createdAt: now,
      updatedAt: now,
    });

    // Create tasks for this phase
    let taskOrder = 0;
    for (const task of phase.tasks) {
      const taskStart = new Date(phaseStart);
      taskStart.setDate(taskStart.getDate() + taskOrder);

      await addDoc(collection(db, 'tasks'), {
        orgId,
        projectId,
        phaseId: phaseRef.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignedTo: [ownerUid],
        startDate: Timestamp.fromDate(taskStart),
        duration: task.duration,
        estimatedHours: task.estimatedHours,
        dependencies: [],
        attachments: [],
        order: taskOrder,
        createdBy: ownerUid,
        isDemoData: true,
        createdAt: now,
        updatedAt: now,
      });

      taskOrder++;
    }

    dayOffset += phase.estimatedDuration;
  }

  return projectId;
}
