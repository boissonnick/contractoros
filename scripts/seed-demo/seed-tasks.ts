/**
 * Seed Tasks for Demo Data
 *
 * Generates 15-25 realistic construction tasks per project with:
 * - Comprehensive phase-based task templates
 * - Proper task dependencies (Gantt-ready)
 * - Varied statuses based on project progress
 * - Realistic assignments, due dates, and categories
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { MESSAGE_TOPICS } from './data/message-templates';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';
import { DEMO_PROJECTS, DEMO_DATA_PREFIX } from './seed-activities';

// Types matching the Task interface
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'blocked' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';

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
  dependencies: Array<{ taskId: string; type: DependencyType; lag: number }>;
  attachments: Array<{ id: string; name: string; url: string; type: string; size: number; uploadedBy: string; uploadedAt: Date }>;
  checklist?: Array<{ id: string; title: string; isCompleted: boolean; completedAt?: Date; completedBy?: string; order: number }>;
  tags?: string[];
  notes?: string;
  order: number;
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

// ============================================
// COMPREHENSIVE TASK TEMPLATES BY CONSTRUCTION PHASE
// ============================================

interface TaskTemplate {
  title: string;
  description?: string;
  category: 'preparation' | 'installation' | 'subcontractor' | 'inspection' | 'clientMeeting' | 'materialDelivery';
  hours: number;
  priority: TaskPriority;
  trade?: string;
  checklistItems?: string[];
  dependsOnPrevious?: boolean; // If true, depends on previous task in phase
}

// Pre-Construction Phase Tasks
const PRE_CONSTRUCTION_TASKS: TaskTemplate[] = [
  { title: 'Submit permit application', category: 'preparation', hours: 4, priority: 'urgent', checklistItems: ['Prepare drawings', 'Complete application form', 'Submit fees', 'Track permit status'] },
  { title: 'Schedule utility locates', category: 'preparation', hours: 2, priority: 'high', trade: 'General' },
  { title: 'Conduct site survey', category: 'preparation', hours: 6, priority: 'high', trade: 'General', dependsOnPrevious: true },
  { title: 'Order long-lead materials', category: 'materialDelivery', hours: 3, priority: 'high', checklistItems: ['Review material list', 'Get vendor quotes', 'Place orders', 'Confirm lead times'] },
  { title: 'Hold pre-construction meeting', category: 'clientMeeting', hours: 2, priority: 'medium', checklistItems: ['Review scope', 'Discuss timeline', 'Confirm access', 'Document decisions'] },
  { title: 'Verify permit approval', category: 'inspection', hours: 1, priority: 'urgent', dependsOnPrevious: true },
  { title: 'Set up temporary utilities', category: 'preparation', hours: 4, priority: 'medium', trade: 'General' },
  { title: 'Install site protection', category: 'preparation', hours: 3, priority: 'medium', description: 'Install floor protection, door coverings, and dust barriers' },
];

// Demolition Phase Tasks
const DEMOLITION_TASKS: TaskTemplate[] = [
  { title: 'Disconnect utilities at work area', category: 'subcontractor', hours: 4, priority: 'urgent', trade: 'Electrical', checklistItems: ['Turn off breakers', 'Cap electrical', 'Shut off water', 'Cap plumbing'] },
  { title: 'Remove existing fixtures', category: 'installation', hours: 6, priority: 'high', dependsOnPrevious: true },
  { title: 'Demo walls and ceilings', category: 'installation', hours: 12, priority: 'high', dependsOnPrevious: true },
  { title: 'Remove flooring', category: 'installation', hours: 8, priority: 'medium' },
  { title: 'Haul debris and dumpster run', category: 'preparation', hours: 4, priority: 'medium', dependsOnPrevious: true },
  { title: 'Inspect substructure for damage', category: 'inspection', hours: 2, priority: 'high', checklistItems: ['Check joists', 'Inspect subfloor', 'Document any rot', 'Note repairs needed'] },
  { title: 'Clean and prep work area', category: 'preparation', hours: 3, priority: 'medium', dependsOnPrevious: true },
];

// Foundation Phase Tasks (for new construction / additions)
const FOUNDATION_TASKS: TaskTemplate[] = [
  { title: 'Excavate foundation area', category: 'subcontractor', hours: 16, priority: 'high', trade: 'Excavation' },
  { title: 'Install footings forms', category: 'installation', hours: 8, priority: 'high', dependsOnPrevious: true },
  { title: 'Schedule footing inspection', category: 'inspection', hours: 1, priority: 'urgent' },
  { title: 'Pour concrete footings', category: 'subcontractor', hours: 6, priority: 'high', trade: 'Concrete', dependsOnPrevious: true },
  { title: 'Install foundation forms', category: 'installation', hours: 12, priority: 'high', dependsOnPrevious: true },
  { title: 'Schedule foundation inspection', category: 'inspection', hours: 1, priority: 'urgent' },
  { title: 'Pour foundation walls', category: 'subcontractor', hours: 8, priority: 'high', trade: 'Concrete', dependsOnPrevious: true },
  { title: 'Waterproof foundation', category: 'subcontractor', hours: 6, priority: 'high', trade: 'Waterproofing' },
  { title: 'Backfill and grade', category: 'subcontractor', hours: 8, priority: 'medium', trade: 'Excavation', dependsOnPrevious: true },
];

// Framing Phase Tasks
const FRAMING_TASKS: TaskTemplate[] = [
  { title: 'Deliver framing lumber', category: 'materialDelivery', hours: 2, priority: 'high' },
  { title: 'Install sill plates and anchors', category: 'installation', hours: 4, priority: 'high', trade: 'Framing', dependsOnPrevious: true },
  { title: 'Frame exterior walls', category: 'installation', hours: 24, priority: 'high', trade: 'Framing', dependsOnPrevious: true },
  { title: 'Frame interior walls', category: 'installation', hours: 16, priority: 'high', trade: 'Framing' },
  { title: 'Install floor joists', category: 'installation', hours: 12, priority: 'high', trade: 'Framing' },
  { title: 'Install subfloor sheathing', category: 'installation', hours: 8, priority: 'medium', trade: 'Framing', dependsOnPrevious: true },
  { title: 'Frame roof / set trusses', category: 'installation', hours: 16, priority: 'high', trade: 'Framing' },
  { title: 'Install roof sheathing', category: 'installation', hours: 8, priority: 'high', trade: 'Framing', dependsOnPrevious: true },
  { title: 'Schedule framing inspection', category: 'inspection', hours: 2, priority: 'urgent', checklistItems: ['Review code requirements', 'Prep site', 'Be present', 'Address corrections'] },
  { title: 'Install windows and exterior doors', category: 'installation', hours: 8, priority: 'high', trade: 'Framing' },
];

// MEP Rough-In Phase Tasks
const MEP_ROUGH_IN_TASKS: TaskTemplate[] = [
  { title: 'Electrical rough-in', category: 'subcontractor', hours: 24, priority: 'high', trade: 'Electrical', checklistItems: ['Run romex', 'Install boxes', 'Panel work', 'Low voltage'] },
  { title: 'Plumbing rough-in', category: 'subcontractor', hours: 20, priority: 'high', trade: 'Plumbing', checklistItems: ['Run supply lines', 'Install drains', 'Vent stack', 'Water heater prep'] },
  { title: 'HVAC rough-in', category: 'subcontractor', hours: 16, priority: 'high', trade: 'HVAC', checklistItems: ['Install ductwork', 'Set equipment pad', 'Run refrigerant lines', 'Install registers'] },
  { title: 'Install blocking for fixtures', category: 'installation', hours: 4, priority: 'medium', trade: 'Framing' },
  { title: 'Run data / low voltage cabling', category: 'subcontractor', hours: 8, priority: 'medium', trade: 'Low Voltage' },
  { title: 'Install fire stopping', category: 'installation', hours: 4, priority: 'high' },
  { title: 'Schedule rough inspection', category: 'inspection', hours: 2, priority: 'urgent', checklistItems: ['Electrical inspection', 'Plumbing inspection', 'Mechanical inspection', 'Address corrections'] },
];

// Insulation & Drywall Phase Tasks
const INSULATION_DRYWALL_TASKS: TaskTemplate[] = [
  { title: 'Install exterior insulation', category: 'installation', hours: 8, priority: 'high' },
  { title: 'Install interior insulation', category: 'installation', hours: 12, priority: 'high', dependsOnPrevious: true },
  { title: 'Schedule insulation inspection', category: 'inspection', hours: 1, priority: 'urgent' },
  { title: 'Hang drywall', category: 'subcontractor', hours: 24, priority: 'high', trade: 'Drywall', dependsOnPrevious: true },
  { title: 'Tape and mud drywall - first coat', category: 'subcontractor', hours: 12, priority: 'high', trade: 'Drywall', dependsOnPrevious: true },
  { title: 'Drywall finishing - second coat', category: 'subcontractor', hours: 8, priority: 'medium', trade: 'Drywall', dependsOnPrevious: true },
  { title: 'Drywall finishing - final coat', category: 'subcontractor', hours: 6, priority: 'medium', trade: 'Drywall', dependsOnPrevious: true },
  { title: 'Sand and prep for paint', category: 'installation', hours: 6, priority: 'medium', dependsOnPrevious: true },
];

// Finishes Phase Tasks
const FINISHES_TASKS: TaskTemplate[] = [
  { title: 'Prime walls and ceilings', category: 'installation', hours: 8, priority: 'medium' },
  { title: 'Paint walls - first coat', category: 'installation', hours: 12, priority: 'medium', dependsOnPrevious: true },
  { title: 'Paint walls - final coat', category: 'installation', hours: 10, priority: 'medium', dependsOnPrevious: true },
  { title: 'Install flooring', category: 'subcontractor', hours: 16, priority: 'high', trade: 'Flooring', checklistItems: ['Acclimate materials', 'Prep subfloor', 'Install flooring', 'Install transitions'] },
  { title: 'Install tile (bathrooms/kitchen)', category: 'subcontractor', hours: 20, priority: 'high', trade: 'Tile' },
  { title: 'Grout and seal tile', category: 'subcontractor', hours: 8, priority: 'medium', trade: 'Tile', dependsOnPrevious: true },
  { title: 'Install cabinets', category: 'installation', hours: 16, priority: 'high', trade: 'Carpentry', checklistItems: ['Set base cabinets', 'Level and shim', 'Install uppers', 'Install hardware'] },
  { title: 'Install countertops', category: 'subcontractor', hours: 6, priority: 'high', trade: 'Countertops', dependsOnPrevious: true },
  { title: 'Install interior trim and doors', category: 'installation', hours: 16, priority: 'medium', trade: 'Carpentry' },
  { title: 'Paint trim and doors', category: 'installation', hours: 8, priority: 'medium', dependsOnPrevious: true },
];

// MEP Finish Phase Tasks
const MEP_FINISH_TASKS: TaskTemplate[] = [
  { title: 'Install electrical devices and covers', category: 'subcontractor', hours: 8, priority: 'high', trade: 'Electrical' },
  { title: 'Install light fixtures', category: 'subcontractor', hours: 6, priority: 'high', trade: 'Electrical' },
  { title: 'Install plumbing fixtures', category: 'subcontractor', hours: 8, priority: 'high', trade: 'Plumbing', checklistItems: ['Install sinks', 'Install toilets', 'Install faucets', 'Test for leaks'] },
  { title: 'Install appliances', category: 'installation', hours: 6, priority: 'high' },
  { title: 'HVAC startup and balance', category: 'subcontractor', hours: 4, priority: 'high', trade: 'HVAC' },
  { title: 'Test all systems', category: 'inspection', hours: 4, priority: 'high', checklistItems: ['Test electrical', 'Test plumbing', 'Test HVAC', 'Document issues'] },
];

// Punch List / Closeout Phase Tasks
const PUNCH_LIST_TASKS: TaskTemplate[] = [
  { title: 'Create punch list', category: 'inspection', hours: 3, priority: 'high', checklistItems: ['Walk entire project', 'Document defects', 'Photograph issues', 'Prioritize items'] },
  { title: 'Complete punch list items', category: 'installation', hours: 12, priority: 'high', dependsOnPrevious: true },
  { title: 'Touch-up paint', category: 'installation', hours: 4, priority: 'low' },
  { title: 'Final cleaning', category: 'preparation', hours: 6, priority: 'medium', description: 'Deep clean all surfaces, windows, fixtures' },
  { title: 'Client walkthrough', category: 'clientMeeting', hours: 2, priority: 'high', checklistItems: ['Demonstrate systems', 'Review maintenance', 'Document concerns', 'Get sign-off'] },
  { title: 'Schedule final inspection', category: 'inspection', hours: 2, priority: 'urgent' },
  { title: 'Final inspection', category: 'inspection', hours: 2, priority: 'urgent', dependsOnPrevious: true },
  { title: 'Obtain certificate of occupancy', category: 'inspection', hours: 2, priority: 'urgent', dependsOnPrevious: true },
  { title: 'Compile closeout documents', category: 'preparation', hours: 4, priority: 'medium', checklistItems: ['Warranties', 'Manuals', 'As-builts', 'Lien releases'] },
  { title: 'Final project handoff', category: 'clientMeeting', hours: 2, priority: 'high', description: 'Deliver keys, remotes, documents, and warranty information' },
];

// Kitchen Remodel Specific Tasks
const KITCHEN_SPECIFIC_TASKS: TaskTemplate[] = [
  { title: 'Template countertops', category: 'subcontractor', hours: 2, priority: 'high', trade: 'Countertops' },
  { title: 'Install backsplash', category: 'subcontractor', hours: 12, priority: 'medium', trade: 'Tile' },
  { title: 'Install under-cabinet lighting', category: 'subcontractor', hours: 4, priority: 'low', trade: 'Electrical' },
  { title: 'Install range hood', category: 'installation', hours: 3, priority: 'medium' },
  { title: 'Install garbage disposal', category: 'subcontractor', hours: 2, priority: 'medium', trade: 'Plumbing' },
];

// Bathroom Specific Tasks
const BATHROOM_SPECIFIC_TASKS: TaskTemplate[] = [
  { title: 'Install shower pan/base', category: 'subcontractor', hours: 4, priority: 'high', trade: 'Plumbing' },
  { title: 'Install cement board', category: 'installation', hours: 6, priority: 'high' },
  { title: 'Waterproof shower', category: 'installation', hours: 4, priority: 'urgent' },
  { title: 'Tile shower walls', category: 'subcontractor', hours: 16, priority: 'high', trade: 'Tile' },
  { title: 'Install shower door/enclosure', category: 'installation', hours: 4, priority: 'medium' },
  { title: 'Install vanity and mirror', category: 'installation', hours: 4, priority: 'medium' },
  { title: 'Install bathroom accessories', category: 'installation', hours: 2, priority: 'low', description: 'Towel bars, TP holders, hooks' },
];

// Commercial Specific Tasks
const COMMERCIAL_SPECIFIC_TASKS: TaskTemplate[] = [
  { title: 'Install fire suppression system', category: 'subcontractor', hours: 16, priority: 'urgent', trade: 'Fire Protection' },
  { title: 'Install suspended ceiling grid', category: 'installation', hours: 12, priority: 'medium' },
  { title: 'Install ceiling tiles', category: 'installation', hours: 8, priority: 'medium', dependsOnPrevious: true },
  { title: 'Install commercial flooring (VCT/carpet)', category: 'subcontractor', hours: 16, priority: 'high', trade: 'Flooring' },
  { title: 'Install ADA fixtures', category: 'subcontractor', hours: 6, priority: 'high', trade: 'Plumbing' },
  { title: 'Install exit signs and emergency lighting', category: 'subcontractor', hours: 4, priority: 'urgent', trade: 'Electrical' },
  { title: 'Health department inspection', category: 'inspection', hours: 2, priority: 'urgent' },
];

// Deck / Exterior Specific Tasks
const DECK_SPECIFIC_TASKS: TaskTemplate[] = [
  { title: 'Dig and pour footings', category: 'installation', hours: 8, priority: 'high' },
  { title: 'Install post brackets and posts', category: 'installation', hours: 6, priority: 'high', dependsOnPrevious: true },
  { title: 'Install ledger board', category: 'installation', hours: 4, priority: 'high' },
  { title: 'Install beams and joists', category: 'installation', hours: 12, priority: 'high', dependsOnPrevious: true },
  { title: 'Install decking boards', category: 'installation', hours: 16, priority: 'high', dependsOnPrevious: true },
  { title: 'Build and install stairs', category: 'installation', hours: 8, priority: 'high' },
  { title: 'Install railing posts', category: 'installation', hours: 4, priority: 'high' },
  { title: 'Install railings and balusters', category: 'installation', hours: 8, priority: 'high', dependsOnPrevious: true },
  { title: 'Install post caps and trim', category: 'installation', hours: 3, priority: 'low' },
  { title: 'Apply deck stain/sealer', category: 'installation', hours: 6, priority: 'medium' },
];

// ============================================
// TASK PHASE MAPPING
// ============================================

type PhaseCategory = 'pre-construction' | 'demo' | 'foundation' | 'framing' | 'mep-rough' | 'insulation-drywall' | 'finishes' | 'mep-finish' | 'punch-list';

function categorizePhase(phaseName: string): PhaseCategory {
  const name = phaseName.toLowerCase();

  if (name.includes('permit') || name.includes('pre') || name.includes('prep') || name.includes('planning')) {
    return 'pre-construction';
  }
  if (name.includes('demo')) {
    return 'demo';
  }
  if (name.includes('foundation') || name.includes('footing') || name.includes('excavat')) {
    return 'foundation';
  }
  if (name.includes('fram') || name.includes('structure') || name.includes('roof')) {
    return 'framing';
  }
  if (name.includes('rough') || name.includes('mep') && !name.includes('finish')) {
    return 'mep-rough';
  }
  if (name.includes('insul') || name.includes('drywall') || name.includes('sheetrock')) {
    return 'insulation-drywall';
  }
  if (name.includes('finish') || name.includes('paint') || name.includes('floor') || name.includes('tile') || name.includes('cabinet') || name.includes('counter') || name.includes('trim')) {
    return 'finishes';
  }
  if (name.includes('fixture') || name.includes('device') || name.includes('appliance')) {
    return 'mep-finish';
  }
  if (name.includes('punch') || name.includes('closeout') || name.includes('final') || name.includes('inspection') || name.includes('complete')) {
    return 'punch-list';
  }

  return 'finishes'; // Default
}

function getTasksForPhase(phaseCategory: PhaseCategory): TaskTemplate[] {
  switch (phaseCategory) {
    case 'pre-construction': return PRE_CONSTRUCTION_TASKS;
    case 'demo': return DEMOLITION_TASKS;
    case 'foundation': return FOUNDATION_TASKS;
    case 'framing': return FRAMING_TASKS;
    case 'mep-rough': return MEP_ROUGH_IN_TASKS;
    case 'insulation-drywall': return INSULATION_DRYWALL_TASKS;
    case 'finishes': return FINISHES_TASKS;
    case 'mep-finish': return MEP_FINISH_TASKS;
    case 'punch-list': return PUNCH_LIST_TASKS;
  }
}

// Get project-specific additional tasks
function getProjectSpecificTasks(projectName: string): TaskTemplate[] {
  const name = projectName.toLowerCase();

  if (name.includes('kitchen')) {
    return KITCHEN_SPECIFIC_TASKS;
  }
  if (name.includes('bath')) {
    return BATHROOM_SPECIFIC_TASKS;
  }
  if (name.includes('office') || name.includes('retail') || name.includes('cafe') || name.includes('commercial') || name.includes('storefront')) {
    return COMMERCIAL_SPECIFIC_TASKS;
  }
  if (name.includes('deck') || name.includes('fence') || name.includes('pool') || name.includes('patio')) {
    return DECK_SPECIFIC_TASKS;
  }

  return [];
}

// ============================================
// TEAM MEMBERS FOR ASSIGNMENT
// ============================================

const FIELD_WORKERS = [
  DEMO_USERS.foreman,
  DEMO_USERS.fieldWorker1,
  DEMO_USERS.fieldWorker2,
  DEMO_USERS.fieldWorker3,
];

const ALL_TEAM = [
  DEMO_USERS.owner,
  DEMO_USERS.pm,
  ...FIELD_WORKERS,
];

// Get assignee based on task category and trade
function getAssignee(
  template: TaskTemplate
): { userId: string; userName: string; subId?: string } {
  const { category, trade } = template;

  if (category === 'subcontractor') {
    // Subcontractor tasks get assigned to foreman to coordinate
    return {
      userId: DEMO_USERS.foreman.uid,
      userName: DEMO_USERS.foreman.displayName,
      subId: `sub-${(trade || 'general').toLowerCase().replace(/\s+/g, '-')}`,
    };
  }

  if (category === 'inspection') {
    // Inspections assigned to PM
    return { userId: DEMO_USERS.pm.uid, userName: DEMO_USERS.pm.displayName };
  }

  if (category === 'clientMeeting') {
    // Client meetings - owner or PM
    if (Math.random() > 0.4) {
      return { userId: DEMO_USERS.owner.uid, userName: DEMO_USERS.owner.displayName };
    }
    return { userId: DEMO_USERS.pm.uid, userName: DEMO_USERS.pm.displayName };
  }

  if (category === 'materialDelivery' || category === 'preparation') {
    // Prep work - any team member
    const member = randomElement(ALL_TEAM);
    return { userId: member.uid, userName: member.displayName };
  }

  // Installation tasks - field workers
  const worker = randomElement(FIELD_WORKERS);
  return { userId: worker.uid, userName: worker.displayName };
}

// ============================================
// STATUS DETERMINATION
// ============================================

function getTaskStatus(
  projectStatus: string,
  phaseIndex: number,
  totalPhases: number,
  taskIndex: number,
  totalTasks: number
): TaskStatus {
  // Completed projects - all tasks done
  if (projectStatus === 'completed') {
    return 'completed';
  }

  // On hold projects - mix of blocked and pending
  if (projectStatus === 'on_hold') {
    const random = Math.random();
    if (random < 0.3) return 'blocked';
    if (random < 0.5) return 'in_progress';
    return 'pending';
  }

  // Planning projects - mostly pending with some assigned
  if (projectStatus === 'planning' || projectStatus === 'bidding') {
    return Math.random() > 0.8 ? 'assigned' : 'pending';
  }

  // Active projects - determine by phase and task position
  const phaseProgress = phaseIndex / totalPhases;
  const taskProgress = taskIndex / totalTasks;
  const overallProgress = (phaseProgress * 0.7) + (taskProgress * 0.3);

  // Simulate project being about 60% through active phase
  const activeThreshold = 0.6;

  if (overallProgress < activeThreshold - 0.2) {
    // Early tasks - completed
    return 'completed';
  } else if (overallProgress < activeThreshold - 0.1) {
    // Recent tasks - completed or in review
    return Math.random() > 0.3 ? 'completed' : 'review';
  } else if (overallProgress < activeThreshold) {
    // Current tasks - in progress
    const random = Math.random();
    if (random < 0.4) return 'in_progress';
    if (random < 0.6) return 'review';
    if (random < 0.8) return 'completed';
    return 'assigned';
  } else if (overallProgress < activeThreshold + 0.15) {
    // Upcoming tasks - assigned or pending
    return Math.random() > 0.5 ? 'assigned' : 'pending';
  } else {
    // Future tasks - pending
    return 'pending';
  }
}

// ============================================
// CHECKLIST GENERATION
// ============================================

function generateChecklist(template: TaskTemplate, status: TaskStatus): TaskSeed['checklist'] {
  if (!template.checklistItems || template.checklistItems.length === 0) {
    return undefined;
  }

  const completionRate = status === 'completed' ? 1.0 :
                         status === 'review' ? 0.9 :
                         status === 'in_progress' ? 0.5 :
                         status === 'assigned' ? 0.1 : 0;

  return template.checklistItems.map((title, index) => {
    const isCompleted = Math.random() < completionRate;
    return {
      id: generateId(),
      title,
      isCompleted,
      order: index,
      completedAt: isCompleted ? new Date(Date.now() - randomInt(1, 10) * 24 * 60 * 60 * 1000) : undefined,
      completedBy: isCompleted ? randomElement(FIELD_WORKERS).uid : undefined,
    };
  });
}

// ============================================
// MAIN TASK GENERATION
// ============================================

export function generateTasks(orgId: string): TaskSeed[] {
  const tasks: TaskSeed[] = [];
  let taskIdCounter = 1;

  // Filter to projects that should have tasks
  const projectsWithTasks = DEMO_PROJECTS.filter(p =>
    p.status === 'active' || p.status === 'completed' || p.status === 'on_hold'
  );

  console.log(`Generating tasks for ${projectsWithTasks.length} projects...`);

  for (const project of projectsWithTasks) {
    const projectTasks: TaskSeed[] = [];
    const phases = project.phases || [];

    // Base date for the project
    const projectStart = project.startDate
      ? new Date(project.startDate)
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    let currentDate = new Date(projectStart);
    let taskOrder = 0;

    // Track previous task ID for dependencies
    let previousTaskId: string | null = null;
    let previousPhaseLastTaskId: string | null = null;

    // Generate tasks for each phase
    for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
      const phaseName = phases[phaseIndex];
      const phaseCategory = categorizePhase(phaseName);
      const phaseTasks = getTasksForPhase(phaseCategory);

      // Select a subset of tasks (not all) to create variety
      const taskCount = Math.min(phaseTasks.length, randomInt(3, 6));
      const selectedTasks = randomElements(phaseTasks, taskCount);

      // Sort to maintain logical order based on original index
      selectedTasks.sort((a, b) => {
        return phaseTasks.indexOf(a) - phaseTasks.indexOf(b);
      });

      // Track first task of phase to create phase-to-phase dependency
      let firstTaskOfPhase: string | null = null;

      for (let i = 0; i < selectedTasks.length; i++) {
        const template = selectedTasks[i];
        const assignee = getAssignee(template);

        const status = getTaskStatus(
          project.status,
          phaseIndex,
          phases.length,
          i,
          selectedTasks.length
        );

        // Calculate dates
        const startDate = new Date(currentDate);
        const duration = Math.max(1, Math.ceil(template.hours / 8)); // Convert hours to days
        const dueDate = addDays(startDate, duration);

        const taskId = `${DEMO_DATA_PREFIX}task_${String(taskIdCounter++).padStart(4, '0')}`;

        if (!firstTaskOfPhase) {
          firstTaskOfPhase = taskId;
        }

        // Build dependencies
        const dependencies: TaskSeed['dependencies'] = [];

        // If this task depends on previous and we have a previous task in this phase
        if (template.dependsOnPrevious && previousTaskId) {
          dependencies.push({
            taskId: previousTaskId,
            type: 'finish_to_start',
            lag: 0,
          });
        }

        // First task of phase depends on last task of previous phase
        if (i === 0 && previousPhaseLastTaskId && phaseIndex > 0) {
          dependencies.push({
            taskId: previousPhaseLastTaskId,
            type: 'finish_to_start',
            lag: 0,
          });
        }

        // Calculate actual hours for completed tasks
        const actualHours = status === 'completed'
          ? template.hours + randomInt(-Math.floor(template.hours * 0.2), Math.floor(template.hours * 0.3))
          : undefined;

        const task: TaskSeed = {
          id: taskId,
          orgId,
          projectId: project.id,
          phaseId: `${project.id}_phase_${phaseIndex}`,
          title: template.title,
          description: template.description || `${template.title} for ${project.name}. Part of ${phaseName} phase.`,
          status,
          priority: template.priority,
          assignedTo: status !== 'pending' ? [assignee.userId] : [],
          assignedSubId: assignee.subId,
          trade: template.trade || (template.category === 'subcontractor' ? randomElement(MESSAGE_TOPICS.trades) : undefined),
          startDate: status !== 'pending' ? startDate : undefined,
          dueDate,
          duration,
          estimatedHours: template.hours,
          actualHours,
          completedAt: status === 'completed' ? addDays(startDate, duration) : undefined,
          dependencies,
          attachments: [],
          checklist: generateChecklist(template, status),
          tags: [phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-'), template.category],
          notes: Math.random() > 0.8 ? `Notes for ${template.title}` : undefined,
          order: taskOrder++,
          createdBy: DEMO_USERS.owner.uid,
          createdAt: new Date(projectStart),
          updatedAt: status === 'completed' ? addDays(startDate, duration) : new Date(),
        };

        projectTasks.push(task);
        previousTaskId = taskId;

        // Advance current date
        currentDate = addDays(currentDate, Math.max(1, Math.ceil(duration / 2)));
      }

      // Track last task of phase
      if (projectTasks.length > 0) {
        previousPhaseLastTaskId = projectTasks[projectTasks.length - 1].id;
      }
    }

    // Add project-specific tasks for active projects
    if (project.status === 'active') {
      const specificTasks = getProjectSpecificTasks(project.name);
      if (specificTasks.length > 0) {
        const selectedSpecific = randomElements(specificTasks, Math.min(specificTasks.length, randomInt(2, 4)));

        for (const template of selectedSpecific) {
          const assignee = getAssignee(template);
          const status = randomElement(['pending', 'assigned', 'in_progress'] as TaskStatus[]);
          const dueDate = addDays(new Date(), randomInt(3, 21));

          const task: TaskSeed = {
            id: `${DEMO_DATA_PREFIX}task_${String(taskIdCounter++).padStart(4, '0')}`,
            orgId,
            projectId: project.id,
            title: template.title,
            description: template.description || `${template.title} for ${project.name}.`,
            status,
            priority: template.priority,
            assignedTo: status !== 'pending' ? [assignee.userId] : [],
            assignedSubId: assignee.subId,
            trade: template.trade,
            dueDate,
            duration: Math.max(1, Math.ceil(template.hours / 8)),
            estimatedHours: template.hours,
            dependencies: [],
            attachments: [],
            checklist: generateChecklist(template, status),
            tags: [template.category],
            order: taskOrder++,
            createdBy: DEMO_USERS.owner.uid,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          projectTasks.push(task);
        }
      }
    }

    // Add overdue tasks for active projects (realistic scenario)
    if (project.status === 'active' && Math.random() > 0.5) {
      const overdueTask: TaskSeed = {
        id: `${DEMO_DATA_PREFIX}task_${String(taskIdCounter++).padStart(4, '0')}`,
        orgId,
        projectId: project.id,
        title: randomElement([
          'Follow up on material lead time',
          'Resolve inspection comments',
          'Complete punch list items',
          'Submit RFI response',
          'Schedule subcontractor',
        ]),
        description: 'This task needs immediate attention.',
        status: 'in_progress',
        priority: 'urgent',
        assignedTo: [DEMO_USERS.pm.uid],
        dueDate: addDays(new Date(), -randomInt(1, 5)), // Past due
        duration: 1,
        estimatedHours: 4,
        dependencies: [],
        attachments: [],
        tags: ['overdue', 'urgent'],
        order: taskOrder++,
        createdBy: DEMO_USERS.owner.uid,
        createdAt: addDays(new Date(), -randomInt(5, 10)),
        updatedAt: new Date(),
      };
      projectTasks.push(overdueTask);
    }

    tasks.push(...projectTasks);
    console.log(`  - ${project.name}: ${projectTasks.length} tasks`);
  }

  console.log(`\nGenerated ${tasks.length} total tasks across ${projectsWithTasks.length} projects`);

  // Validate dependencies
  validateDependencies(tasks);

  return tasks;
}

// Validate that all dependencies reference existing tasks
function validateDependencies(tasks: TaskSeed[]): void {
  const taskIds = new Set(tasks.map(t => t.id));
  let invalidCount = 0;

  for (const task of tasks) {
    task.dependencies = task.dependencies.filter(dep => {
      if (!taskIds.has(dep.taskId)) {
        invalidCount++;
        return false;
      }
      return true;
    });
  }

  if (invalidCount > 0) {
    console.log(`Removed ${invalidCount} invalid dependencies`);
  }
}

// ============================================
// FIRESTORE CONVERSION
// ============================================

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
// SEED TO FIRESTORE
// ============================================

async function seedTasks(): Promise<void> {
  const admin = await import('firebase-admin');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'contractoros-483812' });
  }

  const { getDb } = await import('./db');
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

// Export for use in other scripts
export { DEMO_DATA_PREFIX };

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
