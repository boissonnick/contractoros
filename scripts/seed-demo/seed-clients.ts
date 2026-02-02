/**
 * Seed Clients
 * Creates demo clients for Horizon Construction Co.
 *
 * Residential (5):
 * - Smith, Garcia, Thompson, Wilson, Brown families
 *
 * Commercial (3):
 * - Downtown Cafe LLC
 * - Main Street Retail Group
 * - Office Park LLC
 */

import { Firestore } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_CLIENTS,
  DEMO_USERS,
  monthsAgo,
  daysAgo,
  toTimestamp,
  generateId,
  randomAmount,
  logSection,
  logProgress,
  logSuccess,
} from './utils';

export interface SeedClientsResult {
  clientCount: number;
  clients: typeof DEMO_CLIENTS;
}

export async function seedClients(
  db: Firestore,
  orgId: string
): Promise<SeedClientsResult> {
  logSection('Seeding Clients');

  const clientsRef = db
    .collection('organizations')
    .doc(orgId)
    .collection('clients');

  const batch = db.batch();

  // Client acquisition dates for realistic history
  const clientDates = {
    smith: monthsAgo(11),      // Long-time client
    garcia: monthsAgo(9),
    downtownCafe: monthsAgo(8), // Commercial
    thompson: monthsAgo(6),
    wilson: monthsAgo(4),
    mainStRetail: monthsAgo(3), // Commercial
    brown: monthsAgo(2),        // Newer client
    officePark: monthsAgo(1),   // Newest commercial
  };

  // ==========================================
  // Residential Clients
  // ==========================================

  // Smith Family - Long-time client with multiple projects
  logProgress('Creating client: Smith family...');
  const smithRef = clientsRef.doc(DEMO_CLIENTS.smith.id);
  batch.set(smithRef, createClientDoc({
    ...DEMO_CLIENTS.smith,
    status: 'active',
    source: 'referral',
    sourceDetails: 'Referred by neighbor',
    createdAt: clientDates.smith,
    notes: [
      {
        id: generateId('note'),
        content: 'Great clients to work with. Very responsive and decisive.',
        createdBy: DEMO_USERS.pm.uid,
        createdByName: DEMO_USERS.pm.displayName,
        createdAt: toTimestamp(daysAgo(60)),
        isPinned: true,
      },
    ],
    financials: {
      lifetimeValue: 145000,
      totalProjects: 3,
      completedProjects: 2,
      activeProjects: 1,
      outstandingBalance: 12500,
      lastPaymentDate: toTimestamp(daysAgo(14)),
      lastPaymentAmount: 15000,
      averageProjectValue: 48333,
    },
    projectIds: ['proj-smith-kitchen', 'proj-smith-bath', 'proj-smith-deck'],
    tags: ['repeat-client', 'referral-source', 'responsive'],
  }));

  // Garcia Family
  logProgress('Creating client: Garcia family...');
  const garciaRef = clientsRef.doc(DEMO_CLIENTS.garcia.id);
  batch.set(garciaRef, createClientDoc({
    ...DEMO_CLIENTS.garcia,
    status: 'active',
    source: 'google',
    createdAt: clientDates.garcia,
    notes: [],
    financials: {
      lifetimeValue: 78000,
      totalProjects: 1,
      completedProjects: 0,
      activeProjects: 1,
      outstandingBalance: 28000,
      lastPaymentDate: toTimestamp(daysAgo(30)),
      lastPaymentAmount: 25000,
      averageProjectValue: 78000,
    },
    projectIds: ['proj-garcia-basement'],
    tags: ['in-progress'],
  }));

  // Thompson Family
  logProgress('Creating client: Thompson family...');
  const thompsonRef = clientsRef.doc(DEMO_CLIENTS.thompson.id);
  batch.set(thompsonRef, createClientDoc({
    ...DEMO_CLIENTS.thompson,
    status: 'past',
    source: 'referral',
    sourceDetails: 'Referred by Smith family',
    createdAt: clientDates.thompson,
    notes: [
      {
        id: generateId('note'),
        content: 'Project completed on time. Client was very happy with the work.',
        createdBy: DEMO_USERS.owner.uid,
        createdByName: DEMO_USERS.owner.displayName,
        createdAt: toTimestamp(daysAgo(45)),
        isPinned: false,
      },
    ],
    financials: {
      lifetimeValue: 52000,
      totalProjects: 1,
      completedProjects: 1,
      activeProjects: 0,
      outstandingBalance: 0,
      lastPaymentDate: toTimestamp(daysAgo(45)),
      lastPaymentAmount: 12000,
      averageProjectValue: 52000,
    },
    projectIds: ['proj-thompson-addition'],
    tags: ['completed', 'satisfied'],
  }));

  // Wilson Family
  logProgress('Creating client: Wilson family...');
  const wilsonRef = clientsRef.doc(DEMO_CLIENTS.wilson.id);
  batch.set(wilsonRef, createClientDoc({
    ...DEMO_CLIENTS.wilson,
    status: 'active',
    source: 'social_media',
    sourceDetails: 'Found us on Instagram',
    createdAt: clientDates.wilson,
    notes: [],
    financials: {
      lifetimeValue: 95000,
      totalProjects: 2,
      completedProjects: 1,
      activeProjects: 1,
      outstandingBalance: 18500,
      lastPaymentDate: toTimestamp(daysAgo(7)),
      lastPaymentAmount: 20000,
      averageProjectValue: 47500,
    },
    projectIds: ['proj-wilson-remodel', 'proj-wilson-garage'],
    tags: ['active'],
  }));

  // Brown Family - Newer client
  logProgress('Creating client: Brown family...');
  const brownRef = clientsRef.doc(DEMO_CLIENTS.brown.id);
  batch.set(brownRef, createClientDoc({
    ...DEMO_CLIENTS.brown,
    status: 'potential',
    source: 'website',
    createdAt: clientDates.brown,
    notes: [
      {
        id: generateId('note'),
        content: 'Interested in master bath renovation. Estimate sent, waiting for response.',
        createdBy: DEMO_USERS.pm.uid,
        createdByName: DEMO_USERS.pm.displayName,
        createdAt: toTimestamp(daysAgo(10)),
        isPinned: true,
      },
    ],
    financials: {
      lifetimeValue: 0,
      totalProjects: 0,
      completedProjects: 0,
      activeProjects: 0,
      outstandingBalance: 0,
      averageProjectValue: 0,
    },
    projectIds: [],
    tags: ['lead', 'estimate-sent'],
  }));

  // ==========================================
  // Commercial Clients
  // ==========================================

  // Downtown Cafe LLC
  logProgress('Creating client: Downtown Cafe LLC...');
  const cafeRef = clientsRef.doc(DEMO_CLIENTS.downtownCafe.id);
  batch.set(cafeRef, createClientDoc({
    ...DEMO_CLIENTS.downtownCafe,
    status: 'past',
    source: 'referral',
    sourceDetails: 'Referred by commercial real estate agent',
    createdAt: clientDates.downtownCafe,
    contacts: [
      {
        id: generateId('contact'),
        type: 'secondary',
        name: 'Lisa Chen',
        email: 'lisa@downtowncafe.demo',
        phone: '(303) 555-2011',
        relationship: 'Manager',
      },
    ],
    notes: [
      {
        id: generateId('note'),
        content: 'Commercial build-out completed. They may need additional work for patio expansion in spring.',
        createdBy: DEMO_USERS.owner.uid,
        createdByName: DEMO_USERS.owner.displayName,
        createdAt: toTimestamp(daysAgo(90)),
        isPinned: false,
      },
    ],
    financials: {
      lifetimeValue: 125000,
      totalProjects: 1,
      completedProjects: 1,
      activeProjects: 0,
      outstandingBalance: 0,
      lastPaymentDate: toTimestamp(daysAgo(85)),
      lastPaymentAmount: 25000,
      averageProjectValue: 125000,
    },
    projectIds: ['proj-cafe-buildout'],
    tags: ['commercial', 'completed', 'potential-repeat'],
  }));

  // Main Street Retail Group
  logProgress('Creating client: Main Street Retail Group...');
  const retailRef = clientsRef.doc(DEMO_CLIENTS.mainStRetail.id);
  batch.set(retailRef, createClientDoc({
    ...DEMO_CLIENTS.mainStRetail,
    status: 'active',
    source: 'other',
    sourceDetails: 'Commercial bid submission',
    createdAt: clientDates.mainStRetail,
    contacts: [
      {
        id: generateId('contact'),
        type: 'secondary',
        name: 'Kevin White',
        email: 'kevin@mainstreet.demo',
        phone: '(303) 555-2012',
        relationship: 'Property Manager',
      },
    ],
    notes: [],
    financials: {
      lifetimeValue: 215000,
      totalProjects: 2,
      completedProjects: 1,
      activeProjects: 1,
      outstandingBalance: 45000,
      lastPaymentDate: toTimestamp(daysAgo(21)),
      lastPaymentAmount: 35000,
      averageProjectValue: 107500,
    },
    projectIds: ['proj-retail-storefront', 'proj-retail-tenant'],
    tags: ['commercial', 'active', 'multi-location'],
  }));

  // Office Park LLC
  logProgress('Creating client: Office Park LLC...');
  const officeRef = clientsRef.doc(DEMO_CLIENTS.officePark.id);
  batch.set(officeRef, createClientDoc({
    ...DEMO_CLIENTS.officePark,
    status: 'active',
    source: 'referral',
    sourceDetails: 'Referred by Main Street Retail Group',
    createdAt: clientDates.officePark,
    contacts: [
      {
        id: generateId('contact'),
        type: 'secondary',
        name: 'Patricia Lee',
        email: 'patricia@officeparkllc.demo',
        phone: '(303) 555-2013',
        relationship: 'Facilities Director',
      },
    ],
    notes: [
      {
        id: generateId('note'),
        content: 'Large potential client. Starting with conference room renovation as a trial project.',
        createdBy: DEMO_USERS.owner.uid,
        createdByName: DEMO_USERS.owner.displayName,
        createdAt: toTimestamp(daysAgo(20)),
        isPinned: true,
      },
    ],
    financials: {
      lifetimeValue: 35000,
      totalProjects: 1,
      completedProjects: 0,
      activeProjects: 1,
      outstandingBalance: 10500,
      lastPaymentDate: toTimestamp(daysAgo(15)),
      lastPaymentAmount: 10500,
      averageProjectValue: 35000,
    },
    projectIds: ['proj-office-conference'],
    tags: ['commercial', 'new', 'growth-potential'],
  }));

  // Commit all clients
  await batch.commit();

  logSuccess('All clients created successfully!');
  logSuccess('  5 Residential: Smith, Garcia, Thompson, Wilson, Brown');
  logSuccess('  3 Commercial: Downtown Cafe, Main St Retail, Office Park');
  logSuccess('  Total: 8 clients');

  return {
    clientCount: 8,
    clients: DEMO_CLIENTS,
  };
}

/**
 * Helper to create a properly structured client document
 */
function createClientDoc(data: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isCommercial: boolean;
  companyName?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  status: 'active' | 'past' | 'potential' | 'inactive';
  source: 'referral' | 'google' | 'social_media' | 'website' | 'other';
  sourceDetails?: string;
  createdAt: Date;
  contacts?: Array<{
    id: string;
    type: 'primary' | 'secondary' | 'emergency';
    name: string;
    email?: string;
    phone?: string;
    relationship?: string;
  }>;
  notes: Array<{
    id: string;
    content: string;
    createdBy: string;
    createdByName: string;
    createdAt: FirebaseFirestore.Timestamp;
    isPinned: boolean;
  }>;
  financials: {
    lifetimeValue: number;
    totalProjects: number;
    completedProjects: number;
    activeProjects: number;
    outstandingBalance: number;
    lastPaymentDate?: FirebaseFirestore.Timestamp;
    lastPaymentAmount?: number;
    averageProjectValue: number;
  };
  projectIds: string[];
  tags?: string[];
}): Record<string, unknown> {
  const displayName = data.isCommercial && data.companyName
    ? data.companyName
    : `${data.firstName} ${data.lastName}`;

  return {
    id: data.id,
    orgId: DEMO_ORG_ID,

    // Basic info
    firstName: data.firstName,
    lastName: data.lastName,
    displayName,
    companyName: data.companyName || null,
    isCommercial: data.isCommercial,

    // Contact info
    email: data.email,
    phone: data.phone || null,
    preferredCommunication: 'email',

    // Primary contact
    contacts: [
      {
        id: generateId('contact'),
        type: 'primary',
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        relationship: data.isCommercial ? 'Primary Contact' : 'Self',
      },
      ...(data.contacts || []),
    ],

    // Addresses
    addresses: [
      {
        id: generateId('addr'),
        type: data.isCommercial ? 'property' : 'billing',
        label: data.isCommercial ? 'Business Location' : 'Home',
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        zip: data.address.zip,
        isDefault: true,
      },
    ],

    // Status & tracking
    status: data.status,
    source: data.source,
    sourceDetails: data.sourceDetails || null,

    // Notes
    notes: data.notes,
    tags: data.tags || [],

    // Financials
    financials: data.financials,

    // Projects
    projectIds: data.projectIds,

    // Dates
    firstContactDate: toTimestamp(data.createdAt),
    lastContactDate: toTimestamp(daysAgo(Math.floor(Math.random() * 30))),
    createdAt: toTimestamp(data.createdAt),
    updatedAt: toTimestamp(new Date()),
  };
}
