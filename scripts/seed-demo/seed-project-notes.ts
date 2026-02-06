#!/usr/bin/env ts-node
/**
 * Seed Project Notes & Activity Feed for ContractorOS
 *
 * Creates realistic project notes and activity entries as subcollections:
 * - projects/{projectId}/notes    (~50 notes across 8 projects)
 * - projects/{projectId}/activities  (~150 activities across 8 projects)
 *
 * Projects are stored at TOP-LEVEL 'projects' collection (not org-scoped).
 *
 * Usage:
 *   cd scripts/seed-demo && npx ts-node seed-project-notes.ts
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  generateId,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  daysAgo,
  monthsAgo,
  randomItem,
  randomInt,
  randomDateBetween,
  randomWorkDateTime,
  executeBatchWrites,
} from './utils';

const db = getDb();

// ============================================
// Demo Project Definitions
// ============================================

interface DemoProjectRef {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'planning' | 'on_hold';
  startDaysAgo: number;     // how many days ago the project started
  endDaysAgo?: number;      // how many days ago it completed (undefined = ongoing)
  phases: string[];
  clientName: string;
  budget: number;
}

const DEMO_PROJECTS: DemoProjectRef[] = [
  // Completed projects
  {
    id: 'demo-proj-smith-kitchen',
    name: 'Smith Kitchen Remodel',
    status: 'completed',
    startDaysAgo: 270,
    endDaysAgo: 240,
    phases: ['Demo & Prep', 'Rough-In', 'Cabinets & Countertops', 'Tile & Flooring', 'Paint & Finish'],
    clientName: 'Robert Smith',
    budget: 45000,
  },
  {
    id: 'demo-proj-garcia-bath',
    name: 'Garcia Master Bath',
    status: 'completed',
    startDaysAgo: 90,
    endDaysAgo: 58,
    phases: ['Demo', 'Plumbing & Electrical', 'Tile Work', 'Vanity & Fixtures', 'Final Details'],
    clientName: 'Maria Garcia',
    budget: 32000,
  },
  // Active projects
  {
    id: 'demo-proj-thompson-deck',
    name: 'Thompson Deck Build',
    status: 'active',
    startDaysAgo: 14,
    phases: ['Permits & Footings', 'Framing', 'Decking', 'Railing & Stairs', 'Lighting & Punch'],
    clientName: 'James Thompson',
    budget: 18000,
  },
  {
    id: 'demo-proj-office-park',
    name: 'Office Park Suite 200',
    status: 'active',
    startDaysAgo: 30,
    phases: ['Demo', 'Framing', 'MEP Rough-In', 'Drywall', 'Flooring & Paint', 'Final Trim'],
    clientName: 'David Anderson',
    budget: 95000,
  },
  {
    id: 'demo-proj-garcia-basement',
    name: 'Garcia Basement Finish',
    status: 'active',
    startDaysAgo: 21,
    phases: ['Framing & Egress', 'Rough MEP', 'Insulation & Drywall', 'Flooring', 'Bathroom Tile', 'Paint & Trim'],
    clientName: 'Maria Garcia',
    budget: 55000,
  },
  {
    id: 'demo-proj-brown-kitchen',
    name: 'Brown Kitchen Update',
    status: 'active',
    startDaysAgo: 7,
    phases: ['Prep & Demo', 'Cabinet Refacing', 'Countertops', 'Backsplash & Floor', 'Final Details'],
    clientName: 'Michael Brown',
    budget: 28000,
  },
  // Include 2 completed commercial for variety
  {
    id: 'demo-proj-mainst-retail',
    name: 'Main St. Retail Storefront',
    status: 'completed',
    startDaysAgo: 210,
    endDaysAgo: 120,
    phases: ['Demo', 'Storefront Install', 'MEP Rough-In', 'Drywall & Paint', 'Flooring', 'Millwork & Fixtures', 'Final Punch'],
    clientName: 'Susan Martinez',
    budget: 125000,
  },
  {
    id: 'demo-proj-cafe-ti',
    name: 'Downtown Cafe TI',
    status: 'completed',
    startDaysAgo: 75,
    endDaysAgo: 28,
    phases: ['Demo & Site Prep', 'Framing & MEP', 'Drywall & Ceiling', 'Flooring & Paint', 'Final & Inspection'],
    clientName: 'Tom Richards',
    budget: 78000,
  },
];

// ============================================
// Demo User Helpers
// ============================================

const USERS = [
  { uid: DEMO_USERS.owner.uid, name: DEMO_USERS.owner.displayName },
  { uid: DEMO_USERS.pm.uid, name: DEMO_USERS.pm.displayName },
  { uid: DEMO_USERS.foreman.uid, name: DEMO_USERS.foreman.displayName },
];

function randomUser() {
  return randomItem(USERS);
}

// ============================================
// Note Templates (per project context)
// ============================================

interface NoteTemplate {
  content: string;
  isPinned: boolean;
}

const NOTE_TEMPLATES_BY_CONTEXT: Record<string, NoteTemplate[]> = {
  kitchen: [
    { content: 'Client requested additional outlet in kitchen island — confirmed with electrician, adding dedicated 20A circuit.', isPinned: true },
    { content: 'Backsplash tile is on backorder. Supplier says 5 business days. Adjusted schedule accordingly.', isPinned: false },
    { content: 'Cabinet delivery confirmed for next Tuesday AM. Need two crew members on site to unload.', isPinned: true },
    { content: 'Client picked Caesarstone Calacatta Nuvo for countertops. Template scheduled for Thursday.', isPinned: false },
    { content: 'Plumber noted existing drain line is cast iron — will need to transition to PVC under the sink. Minor additional cost.', isPinned: false },
    { content: 'Hood vent duct routing finalized. Going through the soffit to exterior wall. Verified no structural conflicts.', isPinned: false },
    { content: 'Under-cabinet LED lighting spec: WAC Lighting InvisiLED, 3000K, dimmable. Client approved sample.', isPinned: false },
    { content: 'Demo revealed old knob-and-tube wiring behind the wall. Electrician will remove and replace with Romex.', isPinned: true },
    { content: 'Final punch list walkthrough with client completed. Only 3 minor touch-ups remaining.', isPinned: false },
    { content: 'GC warranty letter and appliance manuals handed to client at project close.', isPinned: false },
  ],
  bathroom: [
    { content: 'Tile selection finalized — Daltile RevoTile marble-look for shower walls, coordinating floor tile.', isPinned: false },
    { content: 'Heated floor mat installed and tested before tile overlay. Working correctly on both zones.', isPinned: false },
    { content: 'Shower niche placement confirmed at 48" center from floor. Client wants 2 niches, not 1 as originally planned.', isPinned: true },
    { content: 'Plumbing rough-in passed inspection. Inspector noted all connections are clean.', isPinned: false },
    { content: 'Glass shower door measurements taken. Lead time is 3 weeks — ordered today.', isPinned: true },
    { content: 'Client changed vanity selection from 48" single to 60" double. Updated PO submitted.', isPinned: false },
    { content: 'Waterproofing membrane applied and cured. Ready for tile installation tomorrow.', isPinned: false },
    { content: 'Mirror and accessories installed. Client very happy with the final result.', isPinned: false },
  ],
  deck: [
    { content: 'Permit approved by city — building dept stamped on 1/22. Good for 6 months.', isPinned: true },
    { content: 'Concrete footings passed inspection. Inspector verified depth at 42" below grade per code.', isPinned: false },
    { content: 'Composite decking (Trex Transcend, Havana Gold) delivered and staged in garage.', isPinned: false },
    { content: 'Weather delayed concrete pour by 2 days — temps were below 40F. Rescheduled for Thursday.', isPinned: true },
    { content: 'Client wants to add a built-in bench along the south railing. Getting material pricing now.', isPinned: false },
    { content: 'Low-voltage lighting spec confirmed: Kichler LED deck lights, 2700K warm white, 8 total.', isPinned: false },
    { content: 'Ledger board attached with structural lag bolts and flashing tape. Ready for joist hangers.', isPinned: false },
  ],
  commercial: [
    { content: 'Fire marshal reviewed plans — requires additional exit signage at rear corridor. Minor cost add.', isPinned: true },
    { content: 'ADA compliance review completed. Restroom door widths meet 36" minimum. Thresholds verified.', isPinned: false },
    { content: 'HVAC subcontractor needs 2 additional supply registers in conference room per updated load calc.', isPinned: true },
    { content: 'Landlord approved electrical plans. Can proceed with panel upgrade next week.', isPinned: false },
    { content: 'T-bar ceiling grid layout confirmed with architect. Light fixture placement adjusted per tenant request.', isPinned: false },
    { content: 'Building management requires after-hours work notification 48 hrs in advance. Noted for crew.', isPinned: false },
    { content: 'Polished concrete floor sample approved. Contractor scheduled for next month.', isPinned: false },
    { content: 'Certificate of Occupancy received! Tenant can begin move-in.', isPinned: true },
    { content: 'Punch list items from landlord rep completed. Final sign-off expected Friday.', isPinned: false },
    { content: 'Custom millwork shop drawings reviewed and approved. Fabrication lead time: 4 weeks.', isPinned: false },
  ],
  basement: [
    { content: 'Egress window well excavation complete. Window unit ordered — Anderson 4030 casement.', isPinned: true },
    { content: 'Moisture test results: slab reading under 3 lbs, good for direct-adhered LVP flooring.', isPinned: false },
    { content: 'Client decided on a wet bar instead of the originally planned dry bar. Plumbing rough-in added.', isPinned: true },
    { content: 'Framing inspection passed. Inspector approved all headers and fire blocking.', isPinned: false },
    { content: 'Sound insulation (Roxul Safe\'n\'Sound) going in all bedroom walls per client request.', isPinned: false },
    { content: 'Bathroom rough-in: shower drain location confirmed at center of 36x36 base. No conflicts with existing sewer line.', isPinned: false },
    { content: 'Client wants LVP throughout (no carpet). Adjusted material order. Cost savings of ~$400.', isPinned: false },
    { content: 'Low ceiling area near HVAC — confirmed 7\'2" clearance. Meets minimum code but will use flush-mount lights.', isPinned: true },
  ],
};

function getNotesForProject(project: DemoProjectRef): NoteTemplate[] {
  const name = project.name.toLowerCase();
  if (name.includes('kitchen')) return NOTE_TEMPLATES_BY_CONTEXT.kitchen;
  if (name.includes('bath')) return NOTE_TEMPLATES_BY_CONTEXT.bathroom;
  if (name.includes('deck')) return NOTE_TEMPLATES_BY_CONTEXT.deck;
  if (name.includes('basement')) return NOTE_TEMPLATES_BY_CONTEXT.basement;
  if (name.includes('retail') || name.includes('cafe') || name.includes('office') || name.includes('suite')) {
    return NOTE_TEMPLATES_BY_CONTEXT.commercial;
  }
  return NOTE_TEMPLATES_BY_CONTEXT.commercial; // fallback
}

// ============================================
// Activity Feed Generation
// ============================================

type ProjectActivityType =
  | 'project_created'
  | 'project_updated'
  | 'status_changed'
  | 'phase_started'
  | 'phase_completed'
  | 'task_created'
  | 'task_completed'
  | 'note_added'
  | 'document_uploaded'
  | 'photo_uploaded'
  | 'team_member_added'
  | 'team_member_removed'
  | 'budget_updated'
  | 'invoice_sent'
  | 'payment_received'
  | 'rfi_created'
  | 'rfi_answered'
  | 'submittal_created'
  | 'submittal_approved'
  | 'punch_item_created'
  | 'punch_item_completed';

interface ActivityEntry {
  id: string;
  projectId: string;
  orgId: string;
  type: ProjectActivityType;
  title: string;
  description: string | null;
  userId: string;
  userName: string;
  metadata: Record<string, unknown> | null;
  createdAt: Timestamp;
}

function generateActivities(project: DemoProjectRef): ActivityEntry[] {
  const activities: ActivityEntry[] = [];
  const projectStart = daysAgo(project.startDaysAgo);
  const projectEnd = project.endDaysAgo ? daysAgo(project.endDaysAgo) : new Date();
  const durationDays = project.startDaysAgo - (project.endDaysAgo ?? 0);

  // Helper to create activity entries at specific time offsets
  function addActivity(
    type: ProjectActivityType,
    title: string,
    dayOffset: number, // days after project start
    user?: { uid: string; name: string },
    description?: string,
    metadata?: Record<string, unknown>,
  ) {
    const actualUser = user || randomUser();
    const activityDate = new Date(projectStart);
    activityDate.setDate(activityDate.getDate() + dayOffset);
    // Ensure we don't go past project end or into the future
    const clampedDate = activityDate > projectEnd ? projectEnd : activityDate;
    const workTime = randomWorkDateTime(clampedDate);

    activities.push({
      id: generateId('act'),
      projectId: project.id,
      orgId: DEMO_ORG_ID,
      type,
      title,
      description: description ?? null,
      userId: actualUser.uid,
      userName: actualUser.name,
      metadata: metadata ?? null,
      createdAt: toTimestamp(workTime),
    });
  }

  const pm = { uid: DEMO_USERS.pm.uid, name: DEMO_USERS.pm.displayName };
  const owner = { uid: DEMO_USERS.owner.uid, name: DEMO_USERS.owner.displayName };
  const foreman = { uid: DEMO_USERS.foreman.uid, name: DEMO_USERS.foreman.displayName };

  // 1. Project created (always first)
  addActivity('project_created', `Project "${project.name}" created`, 0, pm,
    `New project created for ${project.clientName}. Budget: $${project.budget.toLocaleString()}.`);

  // 2. Team members added (day 0-1)
  addActivity('team_member_added', `${DEMO_USERS.foreman.displayName} added to project`, 0, pm,
    undefined, { memberId: DEMO_USERS.foreman.uid, memberName: DEMO_USERS.foreman.displayName, role: 'Foreman' });

  addActivity('team_member_added', `${DEMO_USERS.fieldWorker1.displayName} added to project`, 1, pm,
    undefined, { memberId: DEMO_USERS.fieldWorker1.uid, memberName: DEMO_USERS.fieldWorker1.displayName, role: 'Field Worker' });

  // 3. Phase activities — spread through the project timeline
  const phaseDuration = Math.max(1, Math.floor(durationDays / project.phases.length));

  for (let i = 0; i < project.phases.length; i++) {
    const phaseStartOffset = i * phaseDuration;
    const phaseEndOffset = Math.min((i + 1) * phaseDuration, durationDays);
    const phaseName = project.phases[i];

    // Phase started
    addActivity('phase_started', `Phase "${phaseName}" started`, phaseStartOffset, foreman,
      `Beginning ${phaseName} phase.`, { phaseName, phaseIndex: i });

    // Tasks created during the phase (2-3 per phase)
    const taskCount = randomInt(2, 3);
    const taskNames = getTaskNamesForPhase(phaseName);
    for (let t = 0; t < taskCount && t < taskNames.length; t++) {
      const taskDayOffset = phaseStartOffset + randomInt(0, Math.max(1, Math.floor(phaseDuration / 3)));
      addActivity('task_created', `Task "${taskNames[t]}" created`, taskDayOffset, pm,
        undefined, { taskName: taskNames[t], phaseName });
    }

    // Tasks completed (for completed phases)
    if (project.status === 'completed' || phaseEndOffset < durationDays) {
      for (let t = 0; t < taskCount && t < taskNames.length; t++) {
        const completeDayOffset = phaseStartOffset + randomInt(Math.floor(phaseDuration / 2), phaseDuration);
        addActivity('task_completed', `Task "${taskNames[t]}" completed`, completeDayOffset, foreman,
          undefined, { taskName: taskNames[t], phaseName });
      }
    }

    // Document uploads (1 per phase, sometimes)
    if (Math.random() > 0.4) {
      const docNames = ['Inspection report', 'Material submittal', 'Shop drawing', 'RFI response', 'Change order form', 'Photo documentation'];
      const docName = randomItem(docNames);
      addActivity('document_uploaded', `"${docName}" uploaded`, phaseStartOffset + randomInt(1, Math.max(2, phaseDuration - 1)), pm,
        undefined, { documentName: docName, phaseName });
    }

    // Photo uploads (1-2 per phase)
    if (Math.random() > 0.3) {
      addActivity('photo_uploaded', `Progress photos uploaded for ${phaseName}`, phaseStartOffset + randomInt(1, Math.max(2, phaseDuration)), foreman,
        `${randomInt(3, 8)} photos documenting ${phaseName} progress.`, { photoCount: randomInt(3, 8), phaseName });
    }

    // Phase completed (for phases that are done)
    if (project.status === 'completed' || phaseEndOffset < durationDays) {
      addActivity('phase_completed', `Phase "${phaseName}" completed`, phaseEndOffset, foreman,
        `${phaseName} phase completed successfully.`, { phaseName, phaseIndex: i });
    }
  }

  // 4. Budget updates (1-2 per project)
  if (durationDays > 7) {
    addActivity('budget_updated', 'Budget updated', randomInt(3, Math.min(10, durationDays)), owner,
      `Budget adjusted based on initial material pricing.`,
      { previousBudget: project.budget, newBudget: project.budget + randomInt(-2000, 5000) });
  }

  // 5. RFI activity (for larger projects)
  if (project.budget > 30000 && durationDays > 14) {
    const rfiDay = randomInt(5, Math.min(20, durationDays));
    addActivity('rfi_created', 'RFI submitted for design clarification', rfiDay, foreman,
      'Requesting clarification on structural detail.', { rfiNumber: 1 });
    addActivity('rfi_answered', 'RFI #1 answered by architect', rfiDay + randomInt(2, 5), pm,
      'Design clarification provided. Proceed as noted.', { rfiNumber: 1 });
  }

  // 6. Invoice & payment (for completed projects)
  if (project.status === 'completed' && project.endDaysAgo) {
    // Progress invoice mid-project
    const invoiceDay = Math.floor(durationDays * 0.5);
    addActivity('invoice_sent', `Progress invoice #1 sent to ${project.clientName}`, invoiceDay, pm,
      `Invoice for 50% completion milestone — $${Math.round(project.budget * 0.5).toLocaleString()}.`,
      { invoiceAmount: Math.round(project.budget * 0.5), invoiceNumber: 1 });

    addActivity('payment_received', `Payment received from ${project.clientName}`, invoiceDay + randomInt(5, 14), pm,
      `Payment of $${Math.round(project.budget * 0.5).toLocaleString()} received.`,
      { paymentAmount: Math.round(project.budget * 0.5), invoiceNumber: 1 });

    // Final invoice
    addActivity('invoice_sent', `Final invoice #2 sent to ${project.clientName}`, durationDays - 2, pm,
      `Final invoice for remaining balance — $${Math.round(project.budget * 0.5).toLocaleString()}.`,
      { invoiceAmount: Math.round(project.budget * 0.5), invoiceNumber: 2 });

    addActivity('payment_received', `Final payment received from ${project.clientName}`, durationDays + randomInt(3, 10), pm,
      `Final payment received. Project fully paid.`,
      { paymentAmount: Math.round(project.budget * 0.5), invoiceNumber: 2 });
  }

  // 7. Status changes for completed projects
  if (project.status === 'completed') {
    addActivity('status_changed', 'Project marked as completed', durationDays, pm,
      `Project "${project.name}" has been completed.`,
      { previousStatus: 'active', newStatus: 'completed' });
  }

  // 8. Note added activities (a few scattered)
  const noteCount = randomInt(2, 4);
  for (let n = 0; n < noteCount; n++) {
    const noteDay = randomInt(1, Math.max(2, durationDays - 1));
    addActivity('note_added', 'Note added to project', noteDay, randomUser(),
      'Internal note added.', { notePreview: 'Project update...' });
  }

  // 9. Punch list items (for projects near completion or completed)
  if (project.status === 'completed') {
    const punchStart = durationDays - randomInt(3, 7);
    addActivity('punch_item_created', 'Punch list items created', punchStart, foreman,
      `${randomInt(4, 8)} punch list items identified during final walkthrough.`);
    addActivity('punch_item_completed', 'All punch list items completed', durationDays - 1, foreman,
      'All punch list items have been addressed and verified.');
  }

  // Sort activities chronologically
  activities.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);

  return activities;
}

// Task name helper for realistic activity descriptions
function getTaskNamesForPhase(phaseName: string): string[] {
  const phase = phaseName.toLowerCase();

  if (phase.includes('demo') || phase.includes('prep')) {
    return ['Strip existing finishes', 'Remove old fixtures', 'Protect adjacent areas', 'Dispose of debris'];
  }
  if (phase.includes('rough') || phase.includes('mep') || phase.includes('plumbing') || phase.includes('electrical')) {
    return ['Run electrical circuits', 'Install plumbing rough-in', 'Set HVAC ductwork', 'Frame inspection prep'];
  }
  if (phase.includes('framing') || phase.includes('egress')) {
    return ['Set wall plates', 'Install headers', 'Frame partition walls', 'Install blocking'];
  }
  if (phase.includes('cabinet') || phase.includes('vanity') || phase.includes('millwork')) {
    return ['Install base cabinets', 'Install uppers', 'Template countertops', 'Install hardware'];
  }
  if (phase.includes('tile') || phase.includes('floor') || phase.includes('decking')) {
    return ['Prep substrate', 'Set tile / decking', 'Grout and seal', 'Install transitions'];
  }
  if (phase.includes('paint') || phase.includes('finish') || phase.includes('trim') || phase.includes('detail')) {
    return ['Prime surfaces', 'Apply finish coats', 'Install trim', 'Touch-up and detail'];
  }
  if (phase.includes('drywall') || phase.includes('insulation') || phase.includes('ceiling')) {
    return ['Hang drywall', 'Tape and mud', 'Sand and prime', 'Install ceiling grid'];
  }
  if (phase.includes('store') || phase.includes('install')) {
    return ['Set storefront frames', 'Install glazing', 'Seal and flash', 'Hardware install'];
  }
  if (phase.includes('railing') || phase.includes('stair') || phase.includes('gate') || phase.includes('fence')) {
    return ['Set railing posts', 'Install balusters', 'Attach handrail', 'Final adjustments'];
  }
  if (phase.includes('light') || phase.includes('punch') || phase.includes('final') || phase.includes('inspection')) {
    return ['Install fixtures', 'Final connections', 'Clean site', 'Prepare punch list'];
  }
  if (phase.includes('permit') || phase.includes('footing') || phase.includes('foundation') || phase.includes('post')) {
    return ['Submit permit application', 'Dig footings', 'Set forms', 'Pour concrete'];
  }
  if (phase.includes('roof') || phase.includes('exterior')) {
    return ['Install sheathing', 'Apply underlayment', 'Set roofing material', 'Flash penetrations'];
  }
  if (phase.includes('countertop')) {
    return ['Template counters', 'Fabricate slabs', 'Install countertops', 'Seal and polish'];
  }
  if (phase.includes('backsplash')) {
    return ['Layout pattern', 'Set backsplash tile', 'Grout', 'Seal'];
  }

  // Fallback
  return ['Begin phase work', 'Continue work items', 'Quality check', 'Phase wrap-up'];
}

// ============================================
// Note Generation
// ============================================

interface NoteEntry {
  id: string;
  projectId: string;
  orgId: string;
  content: string;
  isPinned: boolean;
  userId: string;
  userName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function generateNotes(project: DemoProjectRef): NoteEntry[] {
  const notes: NoteEntry[] = [];
  const templates = getNotesForProject(project);
  const projectStart = daysAgo(project.startDaysAgo);
  const projectEnd = project.endDaysAgo ? daysAgo(project.endDaysAgo) : new Date();

  // Pick 5-10 notes from the templates (or all if fewer available)
  const count = Math.min(templates.length, randomInt(5, 10));
  const selectedTemplates = [...templates].sort(() => 0.5 - Math.random()).slice(0, count);

  for (const template of selectedTemplates) {
    const user = randomUser();
    const noteDate = randomWorkDateTime(randomDateBetween(projectStart, projectEnd));

    notes.push({
      id: generateId('note'),
      projectId: project.id,
      orgId: DEMO_ORG_ID,
      content: template.content,
      isPinned: template.isPinned,
      userId: user.uid,
      userName: user.name,
      createdAt: toTimestamp(noteDate),
      updatedAt: toTimestamp(noteDate),
    });
  }

  // Sort chronologically
  notes.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);

  return notes;
}

// ============================================
// Main Seed Function
// ============================================

async function seedProjectNotes(): Promise<void> {
  logSection('Seeding Project Notes & Activities');

  let totalNotes = 0;
  let totalActivities = 0;
  const allWrites: { ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown> }[] = [];

  for (const project of DEMO_PROJECTS) {
    logProgress(`Processing: ${project.name} (${project.status})`);

    // Generate notes
    const notes = generateNotes(project);
    for (const note of notes) {
      const ref = db.collection('projects').doc(project.id).collection('notes').doc(note.id);
      allWrites.push({ ref, data: note as unknown as Record<string, unknown> });
    }
    totalNotes += notes.length;
    logProgress(`  Notes: ${notes.length}`);

    // Generate activities
    const activities = generateActivities(project);
    for (const activity of activities) {
      const ref = db.collection('projects').doc(project.id).collection('activities').doc(activity.id);
      allWrites.push({ ref, data: activity as unknown as Record<string, unknown> });
    }
    totalActivities += activities.length;
    logProgress(`  Activities: ${activities.length}`);
  }

  // Write in batches of 500 (Firestore limit)
  logProgress(`Writing ${allWrites.length} documents in batches...`);
  const BATCH_SIZE = 500;
  for (let i = 0; i < allWrites.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = allWrites.slice(i, i + BATCH_SIZE);
    for (const { ref, data } of chunk) {
      batch.set(ref, data);
    }
    await batch.commit();
    logProgress(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allWrites.length / BATCH_SIZE)} committed`);
  }

  logSuccess(`Created ${totalNotes} notes across ${DEMO_PROJECTS.length} projects`);
  logSuccess(`Created ${totalActivities} activities across ${DEMO_PROJECTS.length} projects`);

  // Summary
  logSection('Project Notes & Activities Summary');
  console.log(`  Total Notes:      ${totalNotes}`);
  console.log(`  Total Activities: ${totalActivities}`);
  console.log(`  Total Documents:  ${totalNotes + totalActivities}`);
  console.log(`  Projects Seeded:  ${DEMO_PROJECTS.length}`);
}

// ============================================
// Run
// ============================================

seedProjectNotes()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('\nError seeding project notes:', e);
    process.exit(1);
  });
