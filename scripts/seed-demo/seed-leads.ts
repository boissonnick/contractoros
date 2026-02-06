/**
 * Seed Leads & Service Tickets
 *
 * Creates 15 leads across pipeline stages and 8 service tickets
 * with realistic construction company sales pipeline and maintenance data.
 * Uses the named "contractoros" database via shared db.ts module.
 */

import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  daysAgo,
  generateId,
  randomInt,
  randomItem,
  randomAmount,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';

// ============================================
// Lead & Service Ticket Types
// ============================================

type LeadSource = 'website' | 'referral' | 'advertising' | 'social' | 'other';
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketStatus = 'open' | 'scheduled' | 'in_progress' | 'completed' | 'closed';

// ============================================
// Demo Projects (for converted leads & tickets)
// ============================================

const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
  { id: 'demo-proj-wilson-fence', name: 'Wilson Fence Install' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
];

// ============================================
// Lead Templates
// ============================================

const LEAD_NAMES = [
  { name: 'Alex Rivera', email: 'alex.rivera@email.demo', phone: '(303) 555-3001', company: undefined },
  { name: 'Patricia Chen', email: 'patricia.chen@email.demo', phone: '(303) 555-3002', company: undefined },
  { name: 'Brandon Okafor', email: 'brandon.okafor@email.demo', phone: '(303) 555-3003', company: undefined },
  { name: 'Stephanie Nguyen', email: 'stephanie.nguyen@email.demo', phone: '(303) 555-3004', company: undefined },
  { name: 'Marcus Webb', email: 'marcus.webb@email.demo', phone: '(303) 555-3005', company: undefined },
  { name: 'Diana Kowalski', email: 'diana.kowalski@email.demo', phone: '(303) 555-3006', company: 'Kowalski Interiors' },
  { name: 'Tyler Morrison', email: 'tyler.morrison@email.demo', phone: '(303) 555-3007', company: undefined },
  { name: 'Amanda Fletcher', email: 'amanda.fletcher@email.demo', phone: '(303) 555-3008', company: undefined },
  { name: 'Derek Huang', email: 'derek.huang@email.demo', phone: '(303) 555-3009', company: 'Huang Properties LLC' },
  { name: 'Natalie Brooks', email: 'natalie.brooks@email.demo', phone: '(303) 555-3010', company: undefined },
  { name: 'Jordan Patel', email: 'jordan.patel@email.demo', phone: '(303) 555-3011', company: 'Patel Development Group' },
  { name: 'Cassandra Ellis', email: 'cassandra.ellis@email.demo', phone: '(303) 555-3012', company: undefined },
  { name: 'Ryan Schwartz', email: 'ryan.schwartz@email.demo', phone: '(303) 555-3013', company: undefined },
  { name: 'Megan Tran', email: 'megan.tran@email.demo', phone: '(303) 555-3014', company: 'Highland Realty' },
  { name: 'Keith Donovan', email: 'keith.donovan@email.demo', phone: '(303) 555-3015', company: undefined },
];

const PROJECT_TYPES = [
  'Kitchen Remodel',
  'Bathroom Renovation',
  'Deck Build',
  'Basement Finish',
  'Whole Home Renovation',
  'Garage Conversion',
  'Addition',
  'Fence Installation',
  'Exterior Siding',
  'Commercial Tenant Improvement',
  'Office Build-Out',
  'Retail Storefront',
];

const LEAD_NOTES_BY_STATUS: Record<LeadStatus, string[]> = {
  new: [
    'Submitted inquiry through website contact form. Interested in kitchen remodel.',
    'Called office asking about availability for upcoming project.',
    'Referred by existing client. Wants to discuss renovation options.',
  ],
  contacted: [
    'Spoke on phone, scheduled site visit for next week. Seems very interested.',
    'Sent introductory email with portfolio. Awaiting response to schedule walkthrough.',
    'Had initial phone call. Client is comparing 3 contractors. Need to follow up.',
  ],
  qualified: [
    'Site visit completed. Project is well-defined. Budget aligns with scope. Ready for proposal.',
    'Met on-site, discussed scope and timeline. Client has financing approved.',
    'Reviewed plans with client. Good fit for our team. Preparing estimate.',
  ],
  proposal_sent: [
    'Proposal sent via email. $45K kitchen remodel with 6-week timeline. Follow up in 3 days.',
    'Estimate delivered during in-person meeting. Client reviewing with spouse.',
  ],
  won: [
    'Contract signed! Deposit received. Project start date confirmed.',
    'Client accepted proposal. Starting permitting process.',
  ],
  lost: [
    'Went with a lower-priced competitor. Budget was the deciding factor.',
    'Project postponed indefinitely due to personal reasons.',
  ],
};

const LOST_REASONS = [
  'Chose lower bid from competitor',
  'Project postponed indefinitely',
  'Budget constraints - project scaled down',
  'Went with contractor closer to their location',
  'Decided to DIY part of the project',
];

// ============================================
// Service Ticket Templates
// ============================================

const TICKET_TEMPLATES = [
  {
    title: 'Leaking kitchen faucet - warranty repair',
    description: 'Client reports the kitchen faucet installed during remodel is dripping. Under 1-year warranty. Need plumber to inspect and repair or replace.',
    priority: 'medium' as TicketPriority,
  },
  {
    title: 'Deck railing loose - safety concern',
    description: 'Client noticed one section of deck railing is wobbly. Posts may need re-anchoring. This is a safety issue and should be addressed promptly.',
    priority: 'high' as TicketPriority,
  },
  {
    title: 'Paint touch-up needed in hallway',
    description: 'Minor paint chips and scuffs appeared in the hallway near the bathroom remodel area. Client requesting touch-up as part of warranty.',
    priority: 'low' as TicketPriority,
  },
  {
    title: 'HVAC not cooling properly after install',
    description: 'New mini-split unit installed 3 months ago is not maintaining set temperature. May need refrigerant charge check or thermostat recalibration.',
    priority: 'high' as TicketPriority,
  },
  {
    title: 'Cabinet door alignment issue',
    description: 'Two upper cabinet doors in the kitchen are not closing flush. Hinges may need adjustment. Client noticed after settling period.',
    priority: 'low' as TicketPriority,
  },
  {
    title: 'Bathroom tile grout cracking',
    description: 'Grout lines in the shower are showing hairline cracks after 6 months. Need to inspect for potential water intrusion and re-grout if necessary.',
    priority: 'medium' as TicketPriority,
  },
  {
    title: 'Garage door opener malfunction',
    description: 'Garage door opener installed during renovation stopped working intermittently. Client reports it works sometimes but not consistently.',
    priority: 'medium' as TicketPriority,
  },
  {
    title: 'Exterior light fixture flickering',
    description: 'New exterior sconce light installed on front porch is flickering. Could be a wiring connection issue or defective fixture. Under warranty.',
    priority: 'urgent' as TicketPriority,
  },
];

// ============================================
// Client references for service tickets
// ============================================

const TICKET_CLIENTS = [
  { id: DEMO_CLIENTS.smith.id, name: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`, projectId: DEMO_PROJECTS[0].id, projectName: DEMO_PROJECTS[0].name },
  { id: DEMO_CLIENTS.garcia.id, name: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`, projectId: DEMO_PROJECTS[1].id, projectName: DEMO_PROJECTS[1].name },
  { id: DEMO_CLIENTS.wilson.id, name: `${DEMO_CLIENTS.wilson.firstName} ${DEMO_CLIENTS.wilson.lastName}`, projectId: DEMO_PROJECTS[3].id, projectName: DEMO_PROJECTS[3].name },
  { id: DEMO_CLIENTS.thompson.id, name: `${DEMO_CLIENTS.thompson.firstName} ${DEMO_CLIENTS.thompson.lastName}`, projectId: undefined, projectName: undefined },
  { id: DEMO_CLIENTS.downtownCafe.id, name: `${DEMO_CLIENTS.downtownCafe.firstName} ${DEMO_CLIENTS.downtownCafe.lastName}`, projectId: DEMO_PROJECTS[4].id, projectName: DEMO_PROJECTS[4].name },
  { id: DEMO_CLIENTS.mainStRetail.id, name: `${DEMO_CLIENTS.mainStRetail.firstName} ${DEMO_CLIENTS.mainStRetail.lastName}`, projectId: DEMO_PROJECTS[2].id, projectName: DEMO_PROJECTS[2].name },
  { id: DEMO_CLIENTS.brown.id, name: `${DEMO_CLIENTS.brown.firstName} ${DEMO_CLIENTS.brown.lastName}`, projectId: undefined, projectName: undefined },
  { id: DEMO_CLIENTS.smith.id, name: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`, projectId: DEMO_PROJECTS[0].id, projectName: DEMO_PROJECTS[0].name },
];

// ============================================
// Seed Leads
// ============================================

async function seedLeads(): Promise<number> {
  logSection('Seeding Leads');

  const db = getDb();
  const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);
  const leadsRef = orgRef.collection('leads');

  // Define lead distribution: 3 new, 3 contacted, 3 qualified, 2 proposal_sent, 2 won, 2 lost
  const statusDistribution: LeadStatus[] = [
    'new', 'new', 'new',
    'contacted', 'contacted', 'contacted',
    'qualified', 'qualified', 'qualified',
    'proposal_sent', 'proposal_sent',
    'won', 'won',
    'lost', 'lost',
  ];

  const sources: LeadSource[] = ['website', 'referral', 'advertising', 'social', 'other'];
  const leads: any[] = [];

  for (let i = 0; i < 15; i++) {
    const leadInfo = LEAD_NAMES[i];
    const status = statusDistribution[i];
    const source = randomItem(sources);
    const projectType = randomItem(PROJECT_TYPES);
    const estimatedValue = randomAmount(15000, 150000);
    const createdAt = daysAgo(randomInt(3, 120));

    // Determine assignment
    const isAssigned = status !== 'new' || Math.random() < 0.3;
    const assignee = randomItem([DEMO_USERS.owner, DEMO_USERS.pm]);

    // Determine dates based on status
    const lastContactDate = status !== 'new' ? daysAgo(randomInt(1, 14)) : undefined;
    const nextFollowUpDate = ['contacted', 'qualified', 'proposal_sent'].includes(status)
      ? new Date(Date.now() + randomInt(1, 10) * 86400000)
      : undefined;

    // Won leads get a converted project ID
    const convertedProjectId = status === 'won'
      ? randomItem(DEMO_PROJECTS).id
      : undefined;

    // Lost leads get a reason
    const lostReason = status === 'lost'
      ? randomItem(LOST_REASONS)
      : undefined;

    const notes = randomItem(LEAD_NOTES_BY_STATUS[status]);

    const lead = {
      id: generateId('lead'),
      orgId: DEMO_ORG_ID,
      name: leadInfo.name,
      email: leadInfo.email,
      phone: leadInfo.phone,
      company: leadInfo.company || null,
      source,
      status,
      projectType,
      estimatedValue,
      notes,
      assignedTo: isAssigned ? assignee.uid : null,
      assignedToName: isAssigned ? assignee.displayName : null,
      lastContactDate: lastContactDate || null,
      nextFollowUpDate: nextFollowUpDate || null,
      lostReason: lostReason || null,
      convertedProjectId: convertedProjectId || null,
      createdAt,
      updatedAt: lastContactDate || createdAt,
      isDemoData: true,
    };

    leads.push(lead);
    logProgress(`Lead [${status.toUpperCase()}]: ${lead.name} - ${projectType} ($${estimatedValue.toLocaleString()})`);
  }

  // Write to Firestore
  await executeBatchWrites(
    db,
    leads,
    (batch, lead) => {
      const ref = leadsRef.doc(lead.id);
      batch.set(ref, {
        ...lead,
        lastContactDate: lead.lastContactDate ? toTimestamp(lead.lastContactDate) : null,
        nextFollowUpDate: lead.nextFollowUpDate ? toTimestamp(lead.nextFollowUpDate) : null,
        createdAt: toTimestamp(lead.createdAt),
        updatedAt: toTimestamp(lead.updatedAt),
      });
    },
    'Leads'
  );

  logSuccess(`Created ${leads.length} leads across all pipeline stages`);
  return leads.length;
}

// ============================================
// Seed Service Tickets
// ============================================

async function seedServiceTickets(): Promise<number> {
  logSection('Seeding Service Tickets');

  const db = getDb();
  const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);
  const ticketsRef = orgRef.collection('serviceTickets');

  // Status distribution: 2 open, 2 scheduled, 2 in_progress, 1 completed, 1 closed
  const statusDistribution: TicketStatus[] = [
    'open', 'open',
    'scheduled', 'scheduled',
    'in_progress', 'in_progress',
    'completed',
    'closed',
  ];

  const tickets: any[] = [];

  for (let i = 0; i < 8; i++) {
    const template = TICKET_TEMPLATES[i];
    const status = statusDistribution[i];
    const client = TICKET_CLIENTS[i];
    const createdAt = daysAgo(randomInt(3, 45));

    // Assignment for non-open tickets
    const isAssigned = status !== 'open';
    const assignee = randomItem([DEMO_USERS.foreman, DEMO_USERS.fieldWorker1]);

    // Scheduled date for scheduled/in_progress/completed/closed
    const scheduledDate = ['scheduled', 'in_progress', 'completed', 'closed'].includes(status)
      ? (status === 'scheduled'
        ? new Date(Date.now() + randomInt(1, 7) * 86400000) // future
        : daysAgo(randomInt(1, 10))) // past
      : undefined;

    // Completed date for completed/closed
    const completedDate = ['completed', 'closed'].includes(status)
      ? daysAgo(randomInt(1, 5))
      : undefined;

    // Resolution for completed/closed
    const resolutions: Record<string, string> = {
      'Leaking kitchen faucet - warranty repair': 'Replaced cartridge in faucet. Leak resolved. No charge - covered under warranty.',
      'Deck railing loose - safety concern': 'Re-anchored railing posts with structural screws and added blocking. Railing is now solid.',
      'Paint touch-up needed in hallway': 'Touched up paint in 4 locations using leftover paint from original job. Walls look great.',
      'HVAC not cooling properly after install': 'Found low refrigerant charge. Topped off and tested. Unit now cooling to set temp within 15 minutes.',
      'Cabinet door alignment issue': 'Adjusted hinges on both doors. Doors now close flush and align properly.',
      'Bathroom tile grout cracking': 'Removed cracked grout and re-grouted shower area. Applied grout sealer. No water intrusion found.',
      'Garage door opener malfunction': 'Replaced faulty logic board in opener. Door now operates consistently. Tested 20 cycles.',
      'Exterior light fixture flickering': 'Found loose wire nut at junction box. Secured connection and tested. Light is now steady.',
    };

    const resolution = ['completed', 'closed'].includes(status)
      ? resolutions[template.title] || 'Issue resolved satisfactorily.'
      : undefined;

    const ticket = {
      id: generateId('ticket'),
      orgId: DEMO_ORG_ID,
      clientId: client.id,
      clientName: client.name,
      projectId: client.projectId || null,
      projectName: client.projectName || null,
      title: template.title,
      description: template.description,
      priority: template.priority,
      status,
      assignedTo: isAssigned ? assignee.uid : null,
      assignedToName: isAssigned ? assignee.displayName : null,
      scheduledDate: scheduledDate || null,
      completedDate: completedDate || null,
      resolution: resolution || null,
      createdAt,
      updatedAt: completedDate || scheduledDate || createdAt,
      isDemoData: true,
    };

    tickets.push(ticket);
    logProgress(`Ticket [${status.toUpperCase()}] (${template.priority}): ${template.title.substring(0, 50)}...`);
  }

  // Write to Firestore
  await executeBatchWrites(
    db,
    tickets,
    (batch, ticket) => {
      const ref = ticketsRef.doc(ticket.id);
      batch.set(ref, {
        ...ticket,
        scheduledDate: ticket.scheduledDate ? toTimestamp(ticket.scheduledDate) : null,
        completedDate: ticket.completedDate ? toTimestamp(ticket.completedDate) : null,
        createdAt: toTimestamp(ticket.createdAt),
        updatedAt: toTimestamp(ticket.updatedAt),
      });
    },
    'Service Tickets'
  );

  logSuccess(`Created ${tickets.length} service tickets`);
  return tickets.length;
}

// ============================================
// Main Seed Function
// ============================================

async function seedLeadsAndTickets(): Promise<{ leads: number; tickets: number }> {
  const leads = await seedLeads();
  const tickets = await seedServiceTickets();
  return { leads, tickets };
}

// ============================================
// Main Export
// ============================================

export { seedLeads, seedServiceTickets, seedLeadsAndTickets };

// Run if executed directly
if (require.main === module) {
  seedLeadsAndTickets()
    .then(({ leads, tickets }) => {
      console.log(`\nCompleted: Created ${leads} leads and ${tickets} service tickets`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding leads and service tickets:', error);
      process.exit(1);
    });
}
