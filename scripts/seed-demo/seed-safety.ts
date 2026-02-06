/**
 * Seed Safety Data (Inspections, Incidents, Toolbox Talks)
 *
 * Creates 12 safety inspections, 3 incidents, and 6 toolbox talks
 * with realistic construction safety management data.
 * Uses the named "contractoros" database via shared db.ts module.
 */

import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  generateId,
  randomInt,
  randomItem,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';

// ============================================
// Safety Types
// ============================================

type InspectionType = 'daily' | 'weekly' | 'monthly' | 'osha' | 'custom';
type InspectionStatus = 'scheduled' | 'passed' | 'failed' | 'needs_correction';
type IncidentSeverity = 'near_miss' | 'first_aid' | 'medical' | 'lost_time' | 'fatality';
type IncidentStatus = 'reported' | 'investigating' | 'resolved' | 'closed';

// ============================================
// Demo Projects
// ============================================

const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
  { id: 'demo-proj-wilson-fence', name: 'Wilson Fence Install' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
];

// ============================================
// Safety Checklist Templates
// ============================================

const CHECKLIST_ITEMS = {
  ppe: [
    { label: 'Hard hats worn by all workers on site', category: 'PPE' },
    { label: 'Safety glasses/goggles available and in use', category: 'PPE' },
    { label: 'High-visibility vests worn in traffic areas', category: 'PPE' },
    { label: 'Steel-toe boots worn by all workers', category: 'PPE' },
    { label: 'Hearing protection available near loud equipment', category: 'PPE' },
    { label: 'Gloves appropriate for task being performed', category: 'PPE' },
  ],
  fallProtection: [
    { label: 'Guardrails in place at open edges above 6 feet', category: 'Fall Protection' },
    { label: 'Harness and lanyard available for elevated work', category: 'Fall Protection' },
    { label: 'Ladders inspected and in good condition', category: 'Fall Protection' },
    { label: 'Scaffold properly erected with toe boards', category: 'Fall Protection' },
    { label: 'Floor openings covered and marked', category: 'Fall Protection' },
  ],
  fireAndElectrical: [
    { label: 'Fire extinguisher accessible and inspected', category: 'Fire Safety' },
    { label: 'Electrical cords free of damage and properly grounded', category: 'Electrical' },
    { label: 'GFCI protection on all temporary power outlets', category: 'Electrical' },
    { label: 'No exposed live wiring in work area', category: 'Electrical' },
    { label: 'Hot work permit obtained if welding/cutting', category: 'Fire Safety' },
  ],
  housekeeping: [
    { label: 'Work area free of tripping hazards', category: 'Housekeeping' },
    { label: 'Materials stored properly and secured', category: 'Housekeeping' },
    { label: 'Debris removed from walkways and stairs', category: 'Housekeeping' },
    { label: 'Dumpster not overflowing', category: 'Housekeeping' },
    { label: 'Emergency exits clear and accessible', category: 'Housekeeping' },
  ],
  general: [
    { label: 'First aid kit stocked and accessible', category: 'General' },
    { label: 'Emergency contact info posted on site', category: 'General' },
    { label: 'SDS/MSDS sheets available for chemicals on site', category: 'General' },
    { label: 'Adequate lighting in all work areas', category: 'General' },
    { label: 'Signage posted for restricted areas', category: 'General' },
  ],
};

// ============================================
// Inspection Templates
// ============================================

interface InspectionTemplate {
  type: InspectionType;
  status: InspectionStatus;
  overallNotes: string;
  issueCount: number;
}

const INSPECTION_TEMPLATES: InspectionTemplate[] = [
  // 8 passed
  { type: 'daily', status: 'passed', overallNotes: 'All items in compliance. Good housekeeping throughout site.', issueCount: 0 },
  { type: 'daily', status: 'passed', overallNotes: 'Site in good order. Workers wearing proper PPE. No hazards noted.', issueCount: 0 },
  { type: 'weekly', status: 'passed', overallNotes: 'Weekly walk-through complete. Fire extinguishers current. First aid stocked.', issueCount: 0 },
  { type: 'weekly', status: 'passed', overallNotes: 'All scaffolding inspected and tagged. Fall protection in place.', issueCount: 0 },
  { type: 'monthly', status: 'passed', overallNotes: 'Monthly comprehensive inspection passed. All deficiencies from last month corrected.', issueCount: 0 },
  { type: 'daily', status: 'passed', overallNotes: 'Morning inspection. Crew briefed on day\'s hazards. PPE compliance 100%.', issueCount: 0 },
  { type: 'osha', status: 'passed', overallNotes: 'OSHA voluntary self-inspection completed. All standards met. Documentation current.', issueCount: 0 },
  { type: 'daily', status: 'passed', overallNotes: 'End of day inspection. Site secured. Materials covered. No open excavations left unprotected.', issueCount: 0 },
  // 2 needs_correction
  { type: 'weekly', status: 'needs_correction', overallNotes: 'Two items require correction: missing fire extinguisher tag and extension cord showing wear. Corrections due within 48 hours.', issueCount: 2 },
  { type: 'daily', status: 'needs_correction', overallNotes: 'One worker found without hard hat in active area. Verbal warning issued. Guardrail at stairwell needs repair.', issueCount: 2 },
  // 1 failed
  { type: 'monthly', status: 'failed', overallNotes: 'Multiple deficiencies found: scaffold missing mid-rail, no GFCI on temp power, debris blocking exit. Work stopped until corrections made.', issueCount: 4 },
  // 1 scheduled
  { type: 'weekly', status: 'scheduled', overallNotes: '', issueCount: 0 },
];

// ============================================
// Incident Templates
// ============================================

interface IncidentTemplate {
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  description: string;
  rootCause: string;
  correctiveActions: string;
  time: string;
}

const INCIDENT_TEMPLATES: IncidentTemplate[] = [
  {
    severity: 'near_miss',
    status: 'resolved',
    location: 'Kitchen work area - near island framing',
    description: 'A 2x4 board fell from an overhead stack while a worker was passing below. The board landed approximately 2 feet from the worker. No contact was made and no injuries occurred.',
    rootCause: 'Lumber was stacked too high on temporary platform without securing ties. Board shifted when adjacent piece was removed.',
    correctiveActions: 'Implemented maximum stack height of 4 feet for overhead storage. All stacked materials must be secured with strapping. Toolbox talk conducted on material storage safety.',
    time: '10:15 AM',
  },
  {
    severity: 'near_miss',
    status: 'resolved',
    location: 'Parking area adjacent to dumpster',
    description: 'A delivery truck backed up without a spotter and nearly struck a worker walking behind the vehicle. Worker noticed and moved out of the way in time.',
    rootCause: 'No spotter was assigned for the delivery. Driver could not see pedestrian area behind truck.',
    correctiveActions: 'All delivery trucks must use a spotter when reversing on site. Designated pedestrian walkway marked with cones. All deliveries require coordination with site foreman.',
    time: '1:30 PM',
  },
  {
    severity: 'first_aid',
    status: 'investigating',
    location: 'Retail storefront - tile cutting station',
    description: 'Worker sustained a minor cut to left forearm while handling a cut ceramic tile. The tile edge was sharp and cut through the worker\'s long-sleeve shirt. First aid was administered on site - wound cleaned and bandaged. Worker returned to duty.',
    rootCause: 'Worker was not wearing cut-resistant sleeves while handling sharp tile edges. Under investigation for additional contributing factors.',
    correctiveActions: 'Pending investigation completion. Initial action: cut-resistant arm sleeves added to required PPE for tile work.',
    time: '2:45 PM',
  },
];

// ============================================
// Toolbox Talk Templates
// ============================================

interface ToolboxTalkTemplate {
  topic: string;
  content: string;
  duration: number; // minutes
}

const TOOLBOX_TALK_TEMPLATES: ToolboxTalkTemplate[] = [
  {
    topic: 'Fall Protection Awareness',
    content: 'Reviewed OSHA 1926.502 fall protection requirements. Key points: 6-foot trigger height for general industry, proper harness inspection (check webbing, stitching, D-rings, buckles), 100% tie-off when working at height. Demonstrated proper harness donning procedure. Discussed anchor point requirements - must support 5,000 lbs per worker.',
    duration: 20,
  },
  {
    topic: 'Ladder Safety',
    content: 'Covered proper ladder selection, inspection, and use. Key points: 3-point contact at all times, 4:1 ratio for extension ladders, do not stand on top 2 rungs, secure top and bottom before climbing. Inspected all ladders on site - removed 1 ladder with cracked side rail. Reviewed difference between Type I, IA, and II duty ratings.',
    duration: 15,
  },
  {
    topic: 'Heat Illness Prevention',
    content: 'With temperatures expected above 90F this week, reviewed heat illness prevention plan. Key points: drink water every 15-20 minutes even if not thirsty, take breaks in shade, know the signs of heat exhaustion (heavy sweating, weakness, nausea, dizziness). Buddy system in effect - watch each other for symptoms. Cool water station set up at job trailer.',
    duration: 15,
  },
  {
    topic: 'Electrical Safety on the Jobsite',
    content: 'Reviewed electrical hazards common on construction sites. Key points: always use GFCI protection, inspect cords daily before use, never remove the ground pin from plugs, keep electrical equipment away from water, de-energize and lock out/tag out before working on electrical systems. Reviewed location of main disconnect for each active project.',
    duration: 20,
  },
  {
    topic: 'Excavation & Trenching Safety',
    content: 'Covered OSHA 1926 Subpart P requirements for excavations. Key points: any trench deeper than 5 feet requires protective systems (sloping, shoring, or trench box), call 811 before any digging, competent person must inspect daily and after rain, keep spoils at least 2 feet from edge. Reviewed our trenching plan for the upcoming utility work.',
    duration: 25,
  },
  {
    topic: 'Fire Prevention & Extinguisher Use',
    content: 'Reviewed fire prevention measures and extinguisher use. Key points: PASS method (Pull pin, Aim at base, Squeeze handle, Sweep side to side), know extinguisher types (A, B, C, ABC), hot work permits required for welding/cutting, maintain 20-foot clearance from combustibles. Located all fire extinguishers on site and verified inspection tags current.',
    duration: 15,
  },
];

// ============================================
// Helper: Generate Checklist
// ============================================

function generateChecklist(status: InspectionStatus, issueCount: number): { id: string; label: string; passed: boolean; notes: string | null }[] {
  const allItems = [
    ...CHECKLIST_ITEMS.ppe,
    ...CHECKLIST_ITEMS.fallProtection,
    ...CHECKLIST_ITEMS.fireAndElectrical,
    ...CHECKLIST_ITEMS.housekeeping,
    ...CHECKLIST_ITEMS.general,
  ];

  // Pick 8-12 items for each inspection
  const numItems = randomInt(8, 12);
  const shuffled = [...allItems].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, numItems);

  const failNotes = [
    'Corrective action required. Deadline: end of day.',
    'Deficiency documented. Supervisor notified.',
    'Item needs immediate attention before work continues.',
    'Non-compliant. Correction ordered.',
  ];

  return selected.map((item, idx) => {
    const failed = status !== 'passed' && status !== 'scheduled' && idx < issueCount;
    return {
      id: generateId('chk'),
      label: item.label,
      passed: !failed,
      notes: failed ? randomItem(failNotes) : null,
    };
  });
}

// ============================================
// Seed Safety Inspections
// ============================================

async function seedSafetyInspections(): Promise<number> {
  logSection('Seeding Safety Inspections');

  const db = getDb();
  const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);
  const inspectionsRef = orgRef.collection('safetyInspections');

  const inspections: any[] = [];

  for (let i = 0; i < 12; i++) {
    const template = INSPECTION_TEMPLATES[i];
    const project = randomItem(DEMO_PROJECTS);

    const scheduledDate = template.status === 'scheduled'
      ? new Date(Date.now() + randomInt(1, 5) * 86400000) // future
      : daysAgo(randomInt(1, 60));

    const completedDate = template.status !== 'scheduled'
      ? new Date(scheduledDate.getTime() + randomInt(0, 2) * 3600000) // same day, 0-2 hours later
      : undefined;

    const checklist = template.status === 'scheduled'
      ? []
      : generateChecklist(template.status, template.issueCount);

    const inspection = {
      id: generateId('insp'),
      orgId: DEMO_ORG_ID,
      projectId: project.id,
      projectName: project.name,
      inspectorId: DEMO_USERS.foreman.uid,
      inspectorName: DEMO_USERS.foreman.displayName,
      type: template.type,
      status: template.status,
      scheduledDate,
      completedDate: completedDate || null,
      checklist,
      overallNotes: template.overallNotes || null,
      photos: [], // No demo photos
      issuesFound: template.issueCount,
      createdAt: template.status === 'scheduled' ? daysAgo(randomInt(1, 3)) : scheduledDate,
      updatedAt: completedDate || scheduledDate,
      isDemoData: true,
    };

    inspections.push(inspection);
    logProgress(`Inspection [${template.status.toUpperCase()}] (${template.type}): ${project.name}`);
  }

  // Write to Firestore
  await executeBatchWrites(
    db,
    inspections,
    (batch, insp) => {
      const ref = inspectionsRef.doc(insp.id);
      batch.set(ref, {
        ...insp,
        scheduledDate: toTimestamp(insp.scheduledDate),
        completedDate: insp.completedDate ? toTimestamp(insp.completedDate) : null,
        createdAt: toTimestamp(insp.createdAt),
        updatedAt: toTimestamp(insp.updatedAt),
      });
    },
    'Safety Inspections'
  );

  logSuccess(`Created ${inspections.length} safety inspections`);
  return inspections.length;
}

// ============================================
// Seed Safety Incidents
// ============================================

async function seedSafetyIncidents(): Promise<number> {
  logSection('Seeding Safety Incidents');

  const db = getDb();
  const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);
  const incidentsRef = orgRef.collection('safetyIncidents');

  const incidentProjects = [DEMO_PROJECTS[0], DEMO_PROJECTS[2], DEMO_PROJECTS[4]]; // Smith Kitchen, Main St Retail, Cafe TI
  const incidents: any[] = [];

  for (let i = 0; i < 3; i++) {
    const template = INCIDENT_TEMPLATES[i];
    const project = incidentProjects[i];
    const incidentDate = daysAgo(randomInt(7, 45));

    // Witnesses - pick 1-2 field workers
    const allFieldWorkers = [
      { id: DEMO_USERS.fieldWorker1.uid, name: DEMO_USERS.fieldWorker1.displayName },
      { id: DEMO_USERS.fieldWorker2.uid, name: DEMO_USERS.fieldWorker2.displayName },
      { id: DEMO_USERS.fieldWorker3.uid, name: DEMO_USERS.fieldWorker3.displayName },
    ];
    const witnessCount = randomInt(1, 2);
    const witnesses = allFieldWorkers.sort(() => Math.random() - 0.5).slice(0, witnessCount).map(w => w.name);

    // Injured workers (only for first_aid severity)
    const injuredWorkers = template.severity === 'first_aid'
      ? [DEMO_USERS.fieldWorker1.displayName]
      : [];

    const incident = {
      id: generateId('incident'),
      orgId: DEMO_ORG_ID,
      projectId: project.id,
      projectName: project.name,
      reportedBy: DEMO_USERS.foreman.uid,
      reportedByName: DEMO_USERS.foreman.displayName,
      severity: template.severity,
      date: incidentDate,
      time: template.time,
      location: template.location,
      description: template.description,
      injuredWorkers,
      witnesses,
      rootCause: template.status === 'resolved' ? template.rootCause : (template.status === 'investigating' ? template.rootCause : null),
      correctiveActions: template.status === 'resolved' ? template.correctiveActions : (template.status === 'investigating' ? template.correctiveActions : null),
      photos: [], // No demo photos
      isOshaReportable: false, // near_miss and first_aid are not OSHA reportable
      status: template.status,
      createdAt: incidentDate,
      updatedAt: template.status === 'resolved' ? daysAgo(randomInt(1, 5)) : incidentDate,
      isDemoData: true,
    };

    incidents.push(incident);
    logProgress(`Incident [${template.status.toUpperCase()}] (${template.severity}): ${template.description.substring(0, 60)}...`);
  }

  // Write to Firestore
  await executeBatchWrites(
    db,
    incidents,
    (batch, inc) => {
      const ref = incidentsRef.doc(inc.id);
      batch.set(ref, {
        ...inc,
        date: toTimestamp(inc.date),
        createdAt: toTimestamp(inc.createdAt),
        updatedAt: toTimestamp(inc.updatedAt),
      });
    },
    'Safety Incidents'
  );

  logSuccess(`Created ${incidents.length} safety incidents`);
  return incidents.length;
}

// ============================================
// Seed Toolbox Talks
// ============================================

async function seedToolboxTalks(): Promise<number> {
  logSection('Seeding Toolbox Talks');

  const db = getDb();
  const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);
  const talksRef = orgRef.collection('toolboxTalks');

  const talks: any[] = [];

  const allCrewMembers = [
    { userId: DEMO_USERS.foreman.uid, name: DEMO_USERS.foreman.displayName },
    { userId: DEMO_USERS.fieldWorker1.uid, name: DEMO_USERS.fieldWorker1.displayName },
    { userId: DEMO_USERS.fieldWorker2.uid, name: DEMO_USERS.fieldWorker2.displayName },
    { userId: DEMO_USERS.fieldWorker3.uid, name: DEMO_USERS.fieldWorker3.displayName },
  ];

  for (let i = 0; i < 6; i++) {
    const template = TOOLBOX_TALK_TEMPLATES[i];
    const project = randomItem(DEMO_PROJECTS);
    const talkDate = daysAgo(randomInt(3, 60));

    // Attendees: 3-4 crew members
    const attendeeCount = randomInt(3, 4);
    const shuffledCrew = [...allCrewMembers].sort(() => Math.random() - 0.5);
    const attendees = shuffledCrew.slice(0, attendeeCount).map(member => ({
      userId: member.userId,
      name: member.name,
      signature: `Signed: ${member.name}`, // Simple signature placeholder
    }));

    const talk = {
      id: generateId('talk'),
      orgId: DEMO_ORG_ID,
      projectId: project.id,
      projectName: project.name,
      conductedBy: DEMO_USERS.foreman.uid,
      conductedByName: DEMO_USERS.foreman.displayName,
      date: talkDate,
      topic: template.topic,
      content: template.content,
      attendees,
      duration: template.duration,
      createdAt: talkDate,
      isDemoData: true,
    };

    talks.push(talk);
    logProgress(`Toolbox Talk: "${template.topic}" (${template.duration} min, ${attendees.length} attendees)`);
  }

  // Write to Firestore
  await executeBatchWrites(
    db,
    talks,
    (batch, talk) => {
      const ref = talksRef.doc(talk.id);
      batch.set(ref, {
        ...talk,
        date: toTimestamp(talk.date),
        createdAt: toTimestamp(talk.createdAt),
      });
    },
    'Toolbox Talks'
  );

  logSuccess(`Created ${talks.length} toolbox talks`);
  return talks.length;
}

// ============================================
// Main Seed Function
// ============================================

async function seedSafety(): Promise<{ inspections: number; incidents: number; talks: number }> {
  const inspections = await seedSafetyInspections();
  const incidents = await seedSafetyIncidents();
  const talks = await seedToolboxTalks();
  return { inspections, incidents, talks };
}

// ============================================
// Main Export
// ============================================

export { seedSafetyInspections, seedSafetyIncidents, seedToolboxTalks, seedSafety };

// Run if executed directly
if (require.main === module) {
  seedSafety()
    .then(({ inspections, incidents, talks }) => {
      console.log(`\nCompleted: Created ${inspections} inspections, ${incidents} incidents, ${talks} toolbox talks`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding safety data:', error);
      process.exit(1);
    });
}
