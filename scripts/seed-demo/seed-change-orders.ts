/**
 * Seed Change Orders for Demo Data
 *
 * Generates 8 change orders:
 * - 5 approved (added to project totals)
 * - 2 pending
 * - 1 declined
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { CHANGE_ORDER_REASONS } from './data/message-templates';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  daysAgo,
  monthsAgo,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  generateId as genId,
  executeBatchWrites,
} from './utils';
import { DEMO_PROJECTS, DEMO_DATA_PREFIX } from './seed-activities';

// Convert DEMO_CLIENTS object to array with displayName
const CLIENT_LIST = Object.values(DEMO_CLIENTS).map(client => ({
  ...client,
  displayName: ('companyName' in client && client.companyName) || `${client.firstName} ${client.lastName}`,
}));

// Types matching the ChangeOrder interface
export type ChangeOrderStatus =
  | 'draft'
  | 'pending_pm'
  | 'pending_owner'
  | 'pending_client'
  | 'approved'
  | 'rejected';

export type ScopeChangeType = 'add' | 'remove' | 'modify';

export interface ScopeChangeSeed {
  id: string;
  type: ScopeChangeType;
  phaseId?: string;
  originalDescription?: string;
  proposedDescription: string;
  costImpact: number;
}

export interface ChangeOrderImpactSeed {
  costChange: number;
  scheduleChange: number;
  affectedPhaseIds: string[];
  affectedTaskIds: string[];
}

export interface ChangeOrderApprovalSeed {
  role: 'pm' | 'owner' | 'client';
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  decidedAt?: Date;
}

export interface ChangeOrderHistoryEntrySeed {
  id: string;
  action: string;
  userId: string;
  userName: string;
  details?: string;
  timestamp: Date;
}

export interface ChangeOrderSeed {
  id: string;
  projectId: string;
  orgId: string;
  number: string;
  title: string;
  description: string;
  reason: string;
  scopeChanges: ScopeChangeSeed[];
  impact: ChangeOrderImpactSeed;
  photos: string[];
  documents: string[];
  status: ChangeOrderStatus;
  approvals: ChangeOrderApprovalSeed[];
  history: ChangeOrderHistoryEntrySeed[];
  newScopeVersionId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Utility functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Get client for a project based on clientId
function getClientForProject(projectId: string): typeof CLIENT_LIST[0] | undefined {
  const project = DEMO_PROJECTS.find(p => p.id === projectId);
  if (!project) return undefined;
  return CLIENT_LIST.find(client => client.id === project.clientId);
}

// Predefined change orders with realistic scenarios
const CHANGE_ORDER_DEFINITIONS: Array<{
  projectId: string;
  title: string;
  description: string;
  reason: string;
  scopeChanges: Array<{
    type: ScopeChangeType;
    description: string;
    costImpact: number;
    phaseHint?: string;
  }>;
  scheduleImpact: number;
  status: ChangeOrderStatus;
  approvalComments?: string;
  rejectionReason?: string;
}> = [
  // Approved change orders (5)
  {
    projectId: 'demo-proj-brown-kitchen', // Kitchen Renovation
    title: 'Add undercabinet lighting',
    description: 'Install LED undercabinet lighting throughout kitchen. Includes dimmer switch and all wiring.',
    reason: 'Client requested upgrade',
    scopeChanges: [
      {
        type: 'add',
        description: 'LED undercabinet lighting system with dimmer switch',
        costImpact: 1200,
        phaseHint: 'Finishes',
      },
    ],
    scheduleImpact: 1,
    status: 'approved',
    approvalComments: 'Great addition that will really enhance the kitchen.',
  },
  {
    projectId: 'demo-proj-brown-kitchen', // Kitchen Renovation
    title: 'Upgrade to quartz countertops',
    description: 'Upgrade from Level 2 granite to premium quartz countertops. Includes additional edge detail.',
    reason: 'Client requested upgrade',
    scopeChanges: [
      {
        type: 'modify',
        description: 'Upgrade countertop material from Level 2 granite to premium Silestone quartz',
        costImpact: 2800,
        phaseHint: 'Finishes',
      },
      {
        type: 'add',
        description: 'Premium edge profile (waterfall edge on island)',
        costImpact: 700,
        phaseHint: 'Finishes',
      },
    ],
    scheduleImpact: 0,
    status: 'approved',
    approvalComments: 'The quartz will be much more durable. Approved!',
  },
  {
    projectId: 'demo-proj-office-park', // Office Build-Out
    title: 'Additional electrical outlets',
    description: 'Add 20 floor outlets in open workspace area for workstation power. Includes dedicated circuits.',
    reason: 'Design modification',
    scopeChanges: [
      {
        type: 'add',
        description: '20 floor outlets with dedicated 20A circuits',
        costImpact: 3500,
        phaseHint: 'Rough-In',
      },
    ],
    scheduleImpact: 2,
    status: 'approved',
    approvalComments: 'Essential for the workspace functionality. Proceed.',
  },
  {
    projectId: 'demo-proj-office-park', // Office Build-Out
    title: 'Glass partition walls',
    description: 'Replace 2 solid walls with glass partitions for conference rooms. Includes frosted privacy bands.',
    reason: 'Client preference change',
    scopeChanges: [
      {
        type: 'modify',
        description: 'Replace 2 drywall conference room walls with glass partitions',
        costImpact: 6500,
        phaseHint: 'Finishes',
      },
      {
        type: 'add',
        description: 'Frosted vinyl privacy bands (4ft height)',
        costImpact: 800,
        phaseHint: 'Finishes',
      },
    ],
    scheduleImpact: 3,
    status: 'approved',
    approvalComments: 'This will really open up the space. Great suggestion.',
  },
  {
    projectId: 'demo-proj-thompson-deck', // Deck Replacement
    title: 'Add built-in bench seating',
    description: 'Add L-shaped built-in bench seating along two sides of the deck. Includes storage compartments.',
    reason: 'Scope addition',
    scopeChanges: [
      {
        type: 'add',
        description: 'L-shaped composite deck bench (12ft total)',
        costImpact: 2400,
        phaseHint: 'Decking',
      },
      {
        type: 'add',
        description: 'Storage compartments under bench seating',
        costImpact: 600,
        phaseHint: 'Decking',
      },
    ],
    scheduleImpact: 2,
    status: 'approved',
    approvalComments: 'Perfect! This was on our wish list.',
  },
  // Pending change orders (2)
  {
    projectId: 'demo-proj-brown-kitchen', // Kitchen Renovation
    title: 'Relocate electrical panel',
    description: 'Relocate main electrical panel from kitchen wall to garage. Required due to new cabinet layout.',
    reason: 'Field condition discovery',
    scopeChanges: [
      {
        type: 'modify',
        description: 'Relocate 200A main panel to garage wall',
        costImpact: 3800,
        phaseHint: 'Rough-In',
      },
      {
        type: 'add',
        description: 'New conduit runs and wall repair at original location',
        costImpact: 1000,
        phaseHint: 'Rough-In',
      },
    ],
    scheduleImpact: 3,
    status: 'pending_client',
  },
  {
    projectId: 'demo-proj-garcia-bath', // Bathroom Remodel
    title: 'Upgrade to heated floors',
    description: 'Add electric radiant floor heating under bathroom tile. Includes thermostat and all electrical.',
    reason: 'Client requested upgrade',
    scopeChanges: [
      {
        type: 'add',
        description: 'Electric radiant floor heating system with programmable thermostat',
        costImpact: 1800,
        phaseHint: 'Rough-In',
      },
    ],
    scheduleImpact: 1,
    status: 'pending_client',
  },
  // Rejected change order (1)
  {
    projectId: 'demo-proj-brown-kitchen', // Kitchen Renovation
    title: 'Add skylight above island',
    description: 'Install 24x48 skylight above kitchen island for natural light.',
    reason: 'Client requested upgrade',
    scopeChanges: [
      {
        type: 'add',
        description: '24x48 Velux skylight with curb mount',
        costImpact: 1800,
        phaseHint: 'Finishes',
      },
      {
        type: 'add',
        description: 'Roof framing modifications and shaft construction',
        costImpact: 2200,
        phaseHint: 'Finishes',
      },
    ],
    scheduleImpact: 5,
    status: 'rejected',
    rejectionReason: 'Structural engineer review indicates roof truss configuration would require significant modification. Cost would exceed $8,000 including engineering. Client decided to decline.',
  },
];

// Generate approvals based on status
function generateApprovals(
  status: ChangeOrderStatus,
  projectId: string,
  approvalComments?: string,
  rejectionReason?: string
): ChangeOrderApprovalSeed[] {
  const client = getClientForProject(projectId);
  const owner = DEMO_USERS.owner;
  const pm = DEMO_USERS.pm;

  const baseApprovals: ChangeOrderApprovalSeed[] = [
    {
      role: 'pm',
      userId: pm.uid,
      userName: pm.displayName,
      status: 'pending',
    },
    {
      role: 'owner',
      userId: owner.uid,
      userName: owner.displayName,
      status: 'pending',
    },
  ];

  if (client) {
    baseApprovals.push({
      role: 'client',
      userId: client.id,
      userName: client.displayName,
      status: 'pending',
    });
  }

  // Update based on status
  if (status === 'approved') {
    return baseApprovals.map((approval, index) => ({
      ...approval,
      status: 'approved' as const,
      comments: index === baseApprovals.length - 1 ? approvalComments : 'Approved',
      decidedAt: addDays(new Date(), -(baseApprovals.length - index)),
    }));
  }

  if (status === 'rejected') {
    // PM and owner approved, client rejected
    return baseApprovals.map((approval, index) => ({
      ...approval,
      status: approval.role === 'client' ? 'rejected' as const : 'approved' as const,
      comments: approval.role === 'client' ? rejectionReason : 'Approved',
      decidedAt: addDays(new Date(), -(baseApprovals.length - index)),
    }));
  }

  if (status === 'pending_client') {
    // PM and owner approved, waiting on client
    return baseApprovals.map(approval => ({
      ...approval,
      status: approval.role === 'client' ? 'pending' as const : 'approved' as const,
      comments: approval.role !== 'client' ? 'Approved' : undefined,
      decidedAt: approval.role !== 'client' ? addDays(new Date(), -2) : undefined,
    }));
  }

  if (status === 'pending_owner') {
    // PM approved, waiting on owner and client
    return baseApprovals.map(approval => ({
      ...approval,
      status: approval.role === 'pm' ? 'approved' as const : 'pending' as const,
      comments: approval.role === 'pm' ? 'Approved' : undefined,
      decidedAt: approval.role === 'pm' ? addDays(new Date(), -3) : undefined,
    }));
  }

  return baseApprovals;
}

// Generate history entries
function generateHistory(
  status: ChangeOrderStatus,
  createdAt: Date
): ChangeOrderHistoryEntrySeed[] {
  const history: ChangeOrderHistoryEntrySeed[] = [];
  const owner = DEMO_USERS.owner;
  const pm = DEMO_USERS.pm;

  // Created
  history.push({
    id: generateId(),
    action: 'created',
    userId: owner.uid,
    userName: owner.displayName,
    details: 'Change order created',
    timestamp: createdAt,
  });

  // Submitted for review
  history.push({
    id: generateId(),
    action: 'submitted',
    userId: owner.uid,
    userName: owner.displayName,
    details: 'Submitted for approval',
    timestamp: addDays(createdAt, 1),
  });

  if (status === 'approved' || status === 'rejected' || status === 'pending_client') {
    // PM approved
    history.push({
      id: generateId(),
      action: 'approved',
      userId: pm.uid,
      userName: pm.displayName,
      details: 'PM approved the change order',
      timestamp: addDays(createdAt, 2),
    });

    // Owner approved
    history.push({
      id: generateId(),
      action: 'approved',
      userId: owner.uid,
      userName: owner.displayName,
      details: 'Owner approved the change order',
      timestamp: addDays(createdAt, 3),
    });
  }

  if (status === 'approved') {
    history.push({
      id: generateId(),
      action: 'approved',
      userId: 'client',
      userName: 'Client',
      details: 'Client approved the change order',
      timestamp: addDays(createdAt, 4),
    });
  }

  if (status === 'rejected') {
    history.push({
      id: generateId(),
      action: 'rejected',
      userId: 'client',
      userName: 'Client',
      details: 'Client declined the change order',
      timestamp: addDays(createdAt, 4),
    });
  }

  return history;
}

// Main function to generate change orders
export function generateChangeOrders(orgId: string): ChangeOrderSeed[] {
  const changeOrders: ChangeOrderSeed[] = [];

  CHANGE_ORDER_DEFINITIONS.forEach((definition, index) => {
    const project = DEMO_PROJECTS.find(p => p.id === definition.projectId);
    if (!project) return;

    // Calculate total cost impact
    const totalCost = definition.scopeChanges.reduce((sum, sc) => sum + sc.costImpact, 0);

    // Create scope changes with proper structure
    const scopeChanges: ScopeChangeSeed[] = definition.scopeChanges.map((sc, scIndex) => ({
      id: generateId(),
      type: sc.type,
      proposedDescription: sc.description,
      originalDescription: sc.type === 'modify' ? 'Original specification' : undefined,
      costImpact: sc.costImpact,
      phaseId: sc.phaseHint ? `${project.id}_phase_${project.phases?.findIndex(p => p.toLowerCase().includes(sc.phaseHint?.toLowerCase() || '')) || 0}` : undefined,
    }));

    // Create impact
    const impact: ChangeOrderImpactSeed = {
      costChange: totalCost,
      scheduleChange: definition.scheduleImpact,
      affectedPhaseIds: [...new Set(scopeChanges.filter(sc => sc.phaseId).map(sc => sc.phaseId!))],
      affectedTaskIds: [],
    };

    // Generate created date (different for each CO)
    const baseDate = project.startDate
      ? new Date(project.startDate)
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const createdAt = addDays(baseDate, 7 + index * 5);

    const changeOrder: ChangeOrderSeed = {
      id: `${DEMO_DATA_PREFIX}co_${String(index + 1).padStart(3, '0')}`,
      projectId: definition.projectId,
      orgId,
      number: `CO-${String(index + 1).padStart(3, '0')}`,
      title: definition.title,
      description: definition.description,
      reason: definition.reason,
      scopeChanges,
      impact,
      photos: [],
      documents: [],
      status: definition.status,
      approvals: generateApprovals(
        definition.status,
        definition.projectId,
        definition.approvalComments,
        definition.rejectionReason
      ),
      history: generateHistory(definition.status, createdAt),
      newScopeVersionId: definition.status === 'approved' ? generateId() : undefined,
      createdBy: DEMO_USERS.owner.uid,
      createdAt,
      updatedAt: addDays(createdAt, definition.status === 'approved' || definition.status === 'rejected' ? 4 : 2),
    };

    changeOrders.push(changeOrder);
  });

  // Log summary
  const approved = changeOrders.filter(co => co.status === 'approved').length;
  const pending = changeOrders.filter(co => co.status.startsWith('pending')).length;
  const rejected = changeOrders.filter(co => co.status === 'rejected').length;
  const totalApprovedValue = changeOrders
    .filter(co => co.status === 'approved')
    .reduce((sum, co) => sum + co.impact.costChange, 0);

  console.log(`Generated ${changeOrders.length} change orders:`);
  console.log(`  - ${approved} approved ($${totalApprovedValue.toLocaleString()} total)`);
  console.log(`  - ${pending} pending`);
  console.log(`  - ${rejected} rejected`);

  return changeOrders;
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
export function convertToFirestore(changeOrder: ChangeOrderSeed): Record<string, unknown> {
  const data = {
    ...changeOrder,
    createdAt: Timestamp.fromDate(changeOrder.createdAt),
    updatedAt: changeOrder.updatedAt ? Timestamp.fromDate(changeOrder.updatedAt) : Timestamp.now(),
    scopeChanges: changeOrder.scopeChanges.map(sc => removeUndefined({
      ...sc,
    })),
    approvals: changeOrder.approvals.map(a => removeUndefined({
      ...a,
      decidedAt: a.decidedAt ? Timestamp.fromDate(a.decidedAt) : null,
    })),
    history: changeOrder.history.map(h => ({
      ...h,
      timestamp: Timestamp.fromDate(h.timestamp),
    })),
  };
  return removeUndefined(data);
}

// ============================================
// Seed Change Orders to Firestore
// ============================================

async function seedChangeOrders(): Promise<void> {
  const admin = await import('firebase-admin');

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'contractoros-483812' });
  }

  const db = admin.firestore();
  const orgId = DEMO_ORG_ID;

  logSection('Seeding Change Orders');

  const changeOrders = generateChangeOrders(orgId);

  logProgress(`Writing ${changeOrders.length} change orders to Firestore...`);

  await executeBatchWrites(
    db,
    changeOrders,
    (batch, co) => {
      const ref = db.collection('organizations').doc(orgId).collection('changeOrders').doc(co.id);
      batch.set(ref, convertToFirestore(co));
    },
    'Change Orders'
  );

  logSuccess(`Seeded ${changeOrders.length} change orders`);
}

// ============================================
// Run if executed directly
// ============================================

if (require.main === module) {
  seedChangeOrders()
    .then(() => {
      console.log('\n✅ Change orders seeded successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error seeding change orders:', error);
      process.exit(1);
    });
}
