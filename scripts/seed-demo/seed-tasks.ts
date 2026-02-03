/**
 * Seed Tasks for Demo Data
 *
 * Generates 150+ tasks across all projects with realistic
 * assignments, due dates, and categories.
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { TASK_CATEGORIES, MESSAGE_TOPICS } from './data/message-templates';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  daysAgo,
  monthsAgo,
  daysFromNow,
  toTimestamp,
  randomItem,
  randomInt as randomIntUtil,
  logSection,
  logProgress,
  logSuccess,
  generateId as genId,
  executeBatchWrites,
} from './utils';
import { DEMO_PROJECTS, DEMO_DATA_PREFIX } from './seed-activities';

// Types matching the Task interface
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'blocked' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskSeed {
  id: string;
  orgId: string;
  projectId: string;
  phaseId?: string;
  parentTaskId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string[];
  assignedSubId?: string;
  trade?: string;
  startDate?: Date;
  dueDate?: Date;
  duration?: number;
  estimatedHours?: number;
  actualHours?: number;
  completedAt?: Date;
  dependencies: Array<{ taskId: string; type: string; lag: number }>;
  attachments: Array<{ id: string; name: string; url: string; type: string; size: number; uploadedBy: string; uploadedAt: Date }>;
  checklist?: Array<{ id: string; title: string; isCompleted: boolean; completedAt?: Date; completedBy?: string; order: number }>;
  tags?: string[];
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Utility functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Task definitions by project type and phase
const TASK_TEMPLATES = {
  kitchen: {
    demo: [
      { title: 'Remove existing cabinets', category: 'installation', hours: 8, priority: 'high' as TaskPriority },
      { title: 'Demo countertops and backsplash', category: 'installation', hours: 6, priority: 'high' as TaskPriority },
      { title: 'Remove old flooring', category: 'installation', hours: 8, priority: 'medium' as TaskPriority },
      { title: 'Disconnect and cap plumbing', category: 'subcontractor', hours: 4, priority: 'high' as TaskPriority },
      { title: 'Disconnect electrical outlets', category: 'subcontractor', hours: 3, priority: 'high' as TaskPriority },
      { title: 'Haul away debris', category: 'preparation', hours: 4, priority: 'medium' as TaskPriority },
    ],
    roughIn: [
      { title: 'Rough plumbing for new layout', category: 'subcontractor', hours: 16, priority: 'high' as TaskPriority },
      { title: 'Electrical rough-in', category: 'subcontractor', hours: 12, priority: 'high' as TaskPriority },
      { title: 'Install blocking for cabinets', category: 'installation', hours: 4, priority: 'medium' as TaskPriority },
      { title: 'Frame for island if applicable', category: 'installation', hours: 8, priority: 'medium' as TaskPriority },
      { title: 'Schedule rough inspection', category: 'inspection', hours: 2, priority: 'urgent' as TaskPriority },
      { title: 'Install new ductwork', category: 'subcontractor', hours: 8, priority: 'medium' as TaskPriority },
    ],
    finishes: [
      { title: 'Install base cabinets', category: 'installation', hours: 12, priority: 'high' as TaskPriority },
      { title: 'Install upper cabinets', category: 'installation', hours: 10, priority: 'high' as TaskPriority },
      { title: 'Install countertops', category: 'installation', hours: 8, priority: 'high' as TaskPriority },
      { title: 'Install backsplash tile', category: 'installation', hours: 16, priority: 'medium' as TaskPriority },
      { title: 'Install new flooring', category: 'installation', hours: 16, priority: 'medium' as TaskPriority },
      { title: 'Install sink and faucet', category: 'subcontractor', hours: 4, priority: 'high' as TaskPriority },
      { title: 'Install appliances', category: 'installation', hours: 6, priority: 'high' as TaskPriority },
      { title: 'Install cabinet hardware', category: 'installation', hours: 4, priority: 'low' as TaskPriority },
      { title: 'Install pendant lighting', category: 'subcontractor', hours: 4, priority: 'medium' as TaskPriority },
      { title: 'Paint walls and trim', category: 'installation', hours: 12, priority: 'medium' as TaskPriority },
    ],
    punchList: [
      { title: 'Touch-up paint', category: 'installation', hours: 2, priority: 'low' as TaskPriority },
      { title: 'Adjust cabinet doors', category: 'installation', hours: 2, priority: 'low' as TaskPriority },
      { title: 'Final cleaning', category: 'preparation', hours: 4, priority: 'medium' as TaskPriority },
      { title: 'Client walkthrough', category: 'clientMeeting', hours: 2, priority: 'high' as TaskPriority },
      { title: 'Final inspection', category: 'inspection', hours: 2, priority: 'urgent' as TaskPriority },
    ],
  },
  bathroom: {
    demo: [
      { title: 'Remove existing fixtures', category: 'installation', hours: 4, priority: 'high' as TaskPriority },
      { title: 'Demo tile and flooring', category: 'installation', hours: 8, priority: 'high' as TaskPriority },
      { title: 'Remove vanity', category: 'installation', hours: 2, priority: 'medium' as TaskPriority },
      { title: 'Cap plumbing lines', category: 'subcontractor', hours: 3, priority: 'high' as TaskPriority },
    ],
    roughIn: [
      { title: 'Plumbing rough-in', category: 'subcontractor', hours: 12, priority: 'high' as TaskPriority },
      { title: 'Electrical rough-in', category: 'subcontractor', hours: 6, priority: 'high' as TaskPriority },
      { title: 'Install new subfloor', category: 'installation', hours: 4, priority: 'medium' as TaskPriority },
      { title: 'Frame shower niche', category: 'installation', hours: 3, priority: 'medium' as TaskPriority },
      { title: 'Schedule rough inspection', category: 'inspection', hours: 2, priority: 'urgent' as TaskPriority },
    ],
    finishes: [
      { title: 'Install cement board', category: 'installation', hours: 6, priority: 'high' as TaskPriority },
      { title: 'Tile shower walls', category: 'installation', hours: 16, priority: 'high' as TaskPriority },
      { title: 'Tile floor', category: 'installation', hours: 8, priority: 'high' as TaskPriority },
      { title: 'Grout tile', category: 'installation', hours: 4, priority: 'medium' as TaskPriority },
      { title: 'Install vanity', category: 'installation', hours: 4, priority: 'high' as TaskPriority },
      { title: 'Install toilet', category: 'subcontractor', hours: 2, priority: 'high' as TaskPriority },
      { title: 'Install fixtures', category: 'subcontractor', hours: 4, priority: 'high' as TaskPriority },
      { title: 'Install mirror and accessories', category: 'installation', hours: 2, priority: 'low' as TaskPriority },
      { title: 'Paint', category: 'installation', hours: 4, priority: 'medium' as TaskPriority },
    ],
  },
  commercial: {
    demo: [
      { title: 'Demo existing walls', category: 'installation', hours: 24, priority: 'high' as TaskPriority },
      { title: 'Remove flooring', category: 'installation', hours: 16, priority: 'medium' as TaskPriority },
      { title: 'Remove ceiling tiles', category: 'installation', hours: 8, priority: 'medium' as TaskPriority },
      { title: 'Clear and clean space', category: 'preparation', hours: 8, priority: 'medium' as TaskPriority },
    ],
    roughIn: [
      { title: 'Frame office walls', category: 'installation', hours: 40, priority: 'high' as TaskPriority },
      { title: 'Frame conference rooms', category: 'installation', hours: 24, priority: 'high' as TaskPriority },
      { title: 'Electrical rough-in', category: 'subcontractor', hours: 60, priority: 'high' as TaskPriority },
      { title: 'Plumbing for restrooms', category: 'subcontractor', hours: 24, priority: 'high' as TaskPriority },
      { title: 'HVAC ductwork', category: 'subcontractor', hours: 40, priority: 'high' as TaskPriority },
      { title: 'Fire suppression system', category: 'subcontractor', hours: 24, priority: 'urgent' as TaskPriority },
      { title: 'Data cabling rough-in', category: 'subcontractor', hours: 16, priority: 'medium' as TaskPriority },
      { title: 'Schedule rough inspections', category: 'inspection', hours: 4, priority: 'urgent' as TaskPriority },
    ],
    drywall: [
      { title: 'Hang drywall', category: 'installation', hours: 40, priority: 'high' as TaskPriority },
      { title: 'Tape and mud', category: 'installation', hours: 32, priority: 'medium' as TaskPriority },
      { title: 'Sand and prep for paint', category: 'installation', hours: 16, priority: 'medium' as TaskPriority },
      { title: 'Prime walls', category: 'installation', hours: 12, priority: 'medium' as TaskPriority },
    ],
    finishes: [
      { title: 'Paint offices', category: 'installation', hours: 32, priority: 'medium' as TaskPriority },
      { title: 'Install flooring', category: 'installation', hours: 40, priority: 'high' as TaskPriority },
      { title: 'Install ceiling grid', category: 'installation', hours: 24, priority: 'medium' as TaskPriority },
      { title: 'Install ceiling tiles', category: 'installation', hours: 16, priority: 'medium' as TaskPriority },
      { title: 'Install doors and hardware', category: 'installation', hours: 16, priority: 'high' as TaskPriority },
      { title: 'Install restroom fixtures', category: 'subcontractor', hours: 8, priority: 'high' as TaskPriority },
      { title: 'Install lighting', category: 'subcontractor', hours: 16, priority: 'high' as TaskPriority },
      { title: 'Install HVAC registers', category: 'subcontractor', hours: 8, priority: 'medium' as TaskPriority },
    ],
    punchList: [
      { title: 'Touch-up paint', category: 'installation', hours: 8, priority: 'low' as TaskPriority },
      { title: 'Clean all surfaces', category: 'preparation', hours: 16, priority: 'medium' as TaskPriority },
      { title: 'Test all systems', category: 'inspection', hours: 8, priority: 'high' as TaskPriority },
      { title: 'Final walkthrough', category: 'clientMeeting', hours: 4, priority: 'high' as TaskPriority },
      { title: 'Certificate of occupancy', category: 'inspection', hours: 4, priority: 'urgent' as TaskPriority },
    ],
  },
  deck: {
    demo: [
      { title: 'Remove existing deck boards', category: 'installation', hours: 8, priority: 'high' as TaskPriority },
      { title: 'Remove railing', category: 'installation', hours: 4, priority: 'medium' as TaskPriority },
      { title: 'Inspect existing structure', category: 'inspection', hours: 2, priority: 'high' as TaskPriority },
      { title: 'Remove rotted framing', category: 'installation', hours: 6, priority: 'high' as TaskPriority },
    ],
    framing: [
      { title: 'Install ledger board', category: 'installation', hours: 4, priority: 'high' as TaskPriority },
      { title: 'Set support posts', category: 'installation', hours: 8, priority: 'high' as TaskPriority },
      { title: 'Install beams', category: 'installation', hours: 6, priority: 'high' as TaskPriority },
      { title: 'Frame deck joists', category: 'installation', hours: 12, priority: 'high' as TaskPriority },
      { title: 'Schedule framing inspection', category: 'inspection', hours: 2, priority: 'urgent' as TaskPriority },
    ],
    decking: [
      { title: 'Install composite decking', category: 'installation', hours: 24, priority: 'high' as TaskPriority },
      { title: 'Install stair stringers', category: 'installation', hours: 6, priority: 'high' as TaskPriority },
      { title: 'Install stair treads', category: 'installation', hours: 4, priority: 'medium' as TaskPriority },
    ],
    railsFinish: [
      { title: 'Install railing posts', category: 'installation', hours: 6, priority: 'high' as TaskPriority },
      { title: 'Install railing and balusters', category: 'installation', hours: 12, priority: 'high' as TaskPriority },
      { title: 'Install post caps', category: 'installation', hours: 2, priority: 'low' as TaskPriority },
      { title: 'Final inspection', category: 'inspection', hours: 2, priority: 'urgent' as TaskPriority },
      { title: 'Client walkthrough', category: 'clientMeeting', hours: 1, priority: 'high' as TaskPriority },
    ],
  },
};

// Additional standalone tasks
const STANDALONE_TASKS = [
  { title: 'Order custom cabinet doors', category: 'materialDelivery', hours: 2, priority: 'high' as TaskPriority },
  { title: 'Schedule material delivery', category: 'materialDelivery', hours: 1, priority: 'medium' as TaskPriority },
  { title: 'Verify permit status', category: 'inspection', hours: 1, priority: 'high' as TaskPriority },
  { title: 'Submit change order', category: 'clientMeeting', hours: 2, priority: 'medium' as TaskPriority },
  { title: 'Review subcontractor bids', category: 'subcontractor', hours: 3, priority: 'medium' as TaskPriority },
  { title: 'Site safety inspection', category: 'inspection', hours: 1, priority: 'high' as TaskPriority },
  { title: 'Update project schedule', category: 'preparation', hours: 2, priority: 'medium' as TaskPriority },
  { title: 'Material selection meeting', category: 'clientMeeting', hours: 2, priority: 'medium' as TaskPriority },
  { title: 'Coordinate with HOA', category: 'preparation', hours: 2, priority: 'medium' as TaskPriority },
  { title: 'Obtain utility locate', category: 'preparation', hours: 1, priority: 'high' as TaskPriority },
];

// All field workers for assignment
const FIELD_WORKERS = [
  DEMO_USERS.foreman,
  DEMO_USERS.fieldWorker1,
  DEMO_USERS.fieldWorker2,
  DEMO_USERS.fieldWorker3,
];

// Get assignee based on task category
function getAssignee(
  category: string,
  priority: TaskPriority
): { userId: string; userName: string; subId?: string } {
  if (category === 'subcontractor') {
    // For subcontractor tasks, assign to a field worker (simulating sub coordination)
    const worker = randomElement(FIELD_WORKERS);
    return {
      userId: worker.uid,
      userName: worker.displayName,
      subId: `sub-${worker.uid}`, // Placeholder sub ID
    };
  }

  if (category === 'inspection') {
    // Assign to PM
    return { userId: DEMO_USERS.pm.uid, userName: DEMO_USERS.pm.displayName };
  }

  if (category === 'clientMeeting') {
    // Assign to owner or PM
    if (Math.random() > 0.5) {
      return { userId: DEMO_USERS.owner.uid, userName: DEMO_USERS.owner.displayName };
    }
    return { userId: DEMO_USERS.pm.uid, userName: DEMO_USERS.pm.displayName };
  }

  // Regular field work - assign to field workers
  const worker = randomElement(FIELD_WORKERS);
  return { userId: worker.uid, userName: worker.displayName };
}

// Determine task status based on project progress
function getTaskStatus(
  projectStatus: string,
  phaseStatus: string | undefined,
  phaseProgress: number,
  taskIndex: number,
  totalTasks: number
): TaskStatus {
  if (projectStatus === 'completed') {
    return 'completed';
  }

  if (projectStatus === 'on_hold') {
    return Math.random() > 0.7 ? 'blocked' : 'pending';
  }

  if (phaseStatus === 'completed') {
    return 'completed';
  }

  if (phaseStatus === 'active') {
    const taskProgress = taskIndex / totalTasks;
    if (taskProgress < phaseProgress / 100 - 0.1) {
      return 'completed';
    } else if (taskProgress < phaseProgress / 100 + 0.1) {
      return randomElement(['in_progress', 'review']);
    } else {
      return randomElement(['pending', 'assigned']);
    }
  }

  return 'pending';
}

// Generate checklist items for certain tasks
function generateChecklist(taskTitle: string): TaskSeed['checklist'] {
  if (Math.random() > 0.3) return undefined; // 30% of tasks have checklists

  const checklistItems: Record<string, string[]> = {
    install: ['Verify measurements', 'Gather materials', 'Complete installation', 'Clean up work area', 'Document with photos'],
    inspection: ['Prepare site', 'Review requirements', 'Be present for inspector', 'Address any comments', 'Obtain sign-off'],
    meeting: ['Prepare agenda', 'Review progress photos', 'Discuss timeline', 'Review pending decisions', 'Document action items'],
  };

  let items: string[] = [];
  if (taskTitle.toLowerCase().includes('install')) {
    items = checklistItems.install;
  } else if (taskTitle.toLowerCase().includes('inspection')) {
    items = checklistItems.inspection;
  } else if (taskTitle.toLowerCase().includes('meeting') || taskTitle.toLowerCase().includes('walkthrough')) {
    items = checklistItems.meeting;
  } else {
    return undefined;
  }

  return items.map((title, index) => ({
    id: generateId(),
    title,
    isCompleted: Math.random() > 0.5,
    order: index,
    completedAt: Math.random() > 0.5 ? new Date(Date.now() - randomInt(1, 10) * 24 * 60 * 60 * 1000) : undefined,
    completedBy: Math.random() > 0.5 ? DEMO_USERS.foreman.uid : undefined,
  }));
}

// Get project type for template selection
function getProjectType(projectName: string): keyof typeof TASK_TEMPLATES {
  const name = projectName.toLowerCase();
  if (name.includes('office') || name.includes('retail') || name.includes('cafe')) return 'commercial';
  if (name.includes('deck') || name.includes('fence') || name.includes('pool')) return 'deck';
  if (name.includes('bath')) return 'bathroom';
  return 'kitchen'; // Default to kitchen
}

// Get phase template key
function getPhaseKey(phaseName: string, projectType: keyof typeof TASK_TEMPLATES): string {
  const name = phaseName.toLowerCase();
  const templates = TASK_TEMPLATES[projectType];
  const phaseKeys = Object.keys(templates);

  for (const key of phaseKeys) {
    if (name.includes(key.toLowerCase()) || key.toLowerCase().includes(name)) {
      return key;
    }
  }

  // Fallback mapping
  if (name.includes('demo')) return 'demo';
  if (name.includes('rough') || name.includes('framing')) return 'roughIn';
  if (name.includes('finish') || name.includes('drywall') || name.includes('paint')) return 'finishes';
  if (name.includes('punch') || name.includes('complete')) return 'punchList';
  if (name.includes('deck')) return 'decking';
  if (name.includes('rail')) return 'railsFinish';

  return phaseKeys[0]; // Default to first phase
}

// Main function to generate tasks
export function generateTasks(orgId: string): TaskSeed[] {
  const tasks: TaskSeed[] = [];
  let taskIdCounter = 1;

  // Filter to projects that should have tasks
  const projectsWithTasks = DEMO_PROJECTS.filter(p =>
    p.status === 'active' || p.status === 'completed' || p.status === 'on_hold'
  );

  for (const project of projectsWithTasks) {
    const projectType = getProjectType(project.name);
    const templates = TASK_TEMPLATES[projectType];
    const phases = project.phases || [];

    // Base date for the project
    const projectStart = project.startDate
      ? new Date(project.startDate)
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    let currentDate = new Date(projectStart);

    // Generate tasks for each phase (phases are strings like "Demo & Prep")
    for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
      const phaseName = phases[phaseIndex];
      const phaseKey = getPhaseKey(phaseName, projectType);
      const phaseTasks = templates[phaseKey as keyof typeof templates] || [];

      // Estimate phase progress based on project status and phase position
      const phaseProgress = project.status === 'completed' ? 100 :
        (phaseIndex < phases.length / 2) ? 100 :
        (phaseIndex === Math.floor(phases.length / 2)) ? 50 : 0;
      const phaseStatus = phaseProgress === 100 ? 'completed' :
        phaseProgress > 0 ? 'active' : 'upcoming';

      for (let i = 0; i < phaseTasks.length; i++) {
        const taskTemplate = phaseTasks[i];
        const assignee = getAssignee(taskTemplate.category, taskTemplate.priority);

        const status = getTaskStatus(
          project.status,
          phaseStatus,
          phaseProgress,
          i,
          phaseTasks.length
        );

        const startDate = new Date(currentDate);
        const duration = Math.ceil(taskTemplate.hours / 8); // Convert hours to days
        const dueDate = addDays(startDate, duration);

        const task: TaskSeed = {
          id: `${DEMO_DATA_PREFIX}task_${String(taskIdCounter++).padStart(4, '0')}`,
          orgId,
          projectId: project.id,
          phaseId: `${project.id}_phase_${phaseIndex}`,
          title: taskTemplate.title,
          description: `${taskTemplate.title} for ${project.name}. Part of ${phaseName} phase.`,
          status,
          priority: taskTemplate.priority,
          assignedTo: [assignee.userId],
          assignedSubId: assignee.subId,
          trade: taskTemplate.category === 'subcontractor'
            ? randomElement(MESSAGE_TOPICS.trades)
            : undefined,
          startDate: status !== 'pending' ? startDate : undefined,
          dueDate,
          duration,
          estimatedHours: taskTemplate.hours,
          actualHours: status === 'completed'
            ? taskTemplate.hours + randomInt(-2, 4)
            : undefined,
          completedAt: status === 'completed'
            ? addDays(startDate, duration)
            : undefined,
          dependencies: [],
          attachments: [],
          checklist: generateChecklist(taskTemplate.title),
          tags: [phaseName.toLowerCase(), taskTemplate.category],
          notes: Math.random() > 0.7
            ? `Notes for ${taskTemplate.title}`
            : undefined,
          createdBy: DEMO_USERS.owner.uid,
          createdAt: new Date(projectStart),
          updatedAt: status === 'completed'
            ? addDays(startDate, duration)
            : new Date(),
        };

        tasks.push(task);

        // Advance current date
        currentDate = addDays(currentDate, Math.ceil(duration / 2));
      }
    }

    // Add some standalone tasks for active projects
    if (project.status === 'active') {
      const standaloneCount = randomInt(2, 4);
      const selectedStandalone = randomElements(STANDALONE_TASKS, standaloneCount);

      for (const taskTemplate of selectedStandalone) {
        const assignee = getAssignee(taskTemplate.category, taskTemplate.priority);
        const dueDate = addDays(new Date(), randomInt(1, 14));

        const task: TaskSeed = {
          id: `${DEMO_DATA_PREFIX}task_${String(taskIdCounter++).padStart(4, '0')}`,
          orgId,
          projectId: project.id,
          title: taskTemplate.title,
          description: `${taskTemplate.title} for ${project.name}.`,
          status: randomElement(['pending', 'assigned', 'in_progress']),
          priority: taskTemplate.priority,
          assignedTo: [assignee.userId],
          assignedSubId: assignee.subId,
          dueDate,
          duration: 1,
          estimatedHours: taskTemplate.hours,
          dependencies: [],
          attachments: [],
          tags: [taskTemplate.category],
          createdBy: DEMO_USERS.owner.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        tasks.push(task);
      }
    }
  }

  console.log(`Generated ${tasks.length} tasks across ${projectsWithTasks.length} projects`);

  // Add dependencies between sequential tasks within each project
  addTaskDependencies(tasks);

  return tasks;
}

/**
 * Add dependencies between tasks to create proper Gantt chart relationships
 * Tasks within the same phase depend on the previous task in that phase
 * First task of each phase depends on last task of previous phase
 */
function addTaskDependencies(tasks: TaskSeed[]): void {
  // Group tasks by project
  const tasksByProject: Record<string, TaskSeed[]> = {};
  for (const task of tasks) {
    if (!tasksByProject[task.projectId]) {
      tasksByProject[task.projectId] = [];
    }
    tasksByProject[task.projectId].push(task);
  }

  // For each project, set up dependencies based on order and phase
  for (const projectId of Object.keys(tasksByProject)) {
    const projectTasks = tasksByProject[projectId];

    // Sort by start date to establish order
    projectTasks.sort((a, b) => {
      const aTime = a.startDate?.getTime() || 0;
      const bTime = b.startDate?.getTime() || 0;
      return aTime - bTime;
    });

    // Add dependencies - each task depends on the previous one (finish-to-start)
    for (let i = 1; i < projectTasks.length; i++) {
      const currentTask = projectTasks[i];
      const previousTask = projectTasks[i - 1];

      // Only add dependency if both tasks have dates and current isn't completed
      if (previousTask.id && currentTask.status !== 'completed') {
        // Add 30% chance of dependency to create realistic schedule
        if (Math.random() < 0.3 || i <= 3) {
          currentTask.dependencies.push({
            taskId: previousTask.id,
            type: 'finish_to_start',
            lag: 0, // days
          });
        }
      }
    }

    // Ensure at least first 5 tasks have sequential dependencies
    for (let i = 1; i < Math.min(5, projectTasks.length); i++) {
      const currentTask = projectTasks[i];
      const previousTask = projectTasks[i - 1];

      if (!currentTask.dependencies.find(d => d.taskId === previousTask.id)) {
        currentTask.dependencies.push({
          taskId: previousTask.id,
          type: 'finish_to_start',
          lag: 0,
        });
      }
    }
  }

  console.log('Added task dependencies for Gantt chart');
}

// Export for seeding
export { DEMO_DATA_PREFIX };

// Helper to remove undefined values from an object
function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
}

// Conversion function for Firestore
export function convertToFirestore(task: TaskSeed): Record<string, unknown> {
  const data = {
    ...task,
    startDate: task.startDate ? Timestamp.fromDate(task.startDate) : null,
    dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
    completedAt: task.completedAt ? Timestamp.fromDate(task.completedAt) : null,
    createdAt: Timestamp.fromDate(task.createdAt),
    updatedAt: task.updatedAt ? Timestamp.fromDate(task.updatedAt) : Timestamp.now(),
    checklist: task.checklist?.map(item => removeUndefined({
      ...item,
      completedAt: item.completedAt ? Timestamp.fromDate(item.completedAt) : null,
    })) || [],
    attachments: task.attachments.map(a => ({
      ...a,
      uploadedAt: Timestamp.fromDate(a.uploadedAt),
    })),
  };
  return removeUndefined(data);
}

// ============================================
// Seed Tasks to Firestore
// ============================================

async function seedTasks(): Promise<void> {
  const admin = await import('firebase-admin');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'contractoros-483812' });
  }

  import { getDb } from "./db";
const db = getDb();
  const orgId = DEMO_ORG_ID;

  logSection('Seeding Tasks');

  const tasks = generateTasks(orgId);

  logProgress(`Writing ${tasks.length} tasks to Firestore...`);

  await executeBatchWrites(
    db,
    tasks,
    (batch, task) => {
      // NOTE: Tasks stored in top-level 'tasks' collection with orgId field
      const ref = db.collection('tasks').doc(task.id);
      batch.set(ref, convertToFirestore(task));
    },
    'Tasks'
  );

  logSuccess(`Seeded ${tasks.length} tasks`);
}

// ============================================
// Run if executed directly
// ============================================

if (require.main === module) {
  seedTasks()
    .then(() => {
      console.log('\n✅ Tasks seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error seeding tasks:', error);
      process.exit(1);
    });
}
