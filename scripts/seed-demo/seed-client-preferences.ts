/**
 * Seed Client Preferences
 * Creates client preference records for demo clients
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_CLIENTS,
  daysAgo,
  generateId,
  randomItem,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';

const db = getDb();

// Communication preferences
type CommunicationPreference = 'email' | 'phone' | 'text' | 'portal';
type ContactTime = 'morning' | 'afternoon' | 'evening' | 'anytime';

// Client preference templates
const PREFERENCE_TEMPLATES = [
  {
    communication: 'email' as CommunicationPreference,
    contactTime: 'morning' as ContactTime,
    notifications: { progressUpdates: true, invoices: true, scheduling: true },
    notes: 'Prefers detailed written updates',
  },
  {
    communication: 'phone' as CommunicationPreference,
    contactTime: 'afternoon' as ContactTime,
    notifications: { progressUpdates: true, invoices: true, scheduling: false },
    notes: 'Call for important updates, email for routine',
  },
  {
    communication: 'text' as CommunicationPreference,
    contactTime: 'anytime' as ContactTime,
    notifications: { progressUpdates: false, invoices: true, scheduling: true },
    notes: 'Quick texts preferred over calls',
  },
  {
    communication: 'portal' as CommunicationPreference,
    contactTime: 'evening' as ContactTime,
    notifications: { progressUpdates: true, invoices: true, scheduling: true },
    notes: 'Checks portal regularly - prefers self-service',
  },
];

// Design preferences
const DESIGN_STYLES = ['modern', 'traditional', 'transitional', 'contemporary', 'farmhouse', 'industrial'];
const COLOR_PALETTES = ['neutral', 'warm', 'cool', 'bold', 'earth-tones', 'monochromatic'];

async function seedClientPreferences(): Promise<number> {
  logSection('Seeding Client Preferences');

  const preferencesRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('clientPreferences');
  const preferences: any[] = [];

  // Map of client data
  const clients = [
    { ...DEMO_CLIENTS.smith, projectType: 'residential' },
    { ...DEMO_CLIENTS.garcia, projectType: 'residential' },
    { ...DEMO_CLIENTS.thompson, projectType: 'residential' },
    { ...DEMO_CLIENTS.wilson, projectType: 'residential' },
    { ...DEMO_CLIENTS.brown, projectType: 'residential' },
    { ...DEMO_CLIENTS.downtownCafe, projectType: 'commercial' },
    { ...DEMO_CLIENTS.mainStRetail, projectType: 'commercial' },
    { ...DEMO_CLIENTS.officePark, projectType: 'commercial' },
  ];

  for (const client of clients) {
    const template = randomItem(PREFERENCE_TEMPLATES);
    const isCommercial = client.projectType === 'commercial';

    const preference = {
      id: generateId('pref'),
      orgId: DEMO_ORG_ID,
      clientId: client.id,
      clientName: 'companyName' in client && client.companyName
        ? client.companyName
        : `${client.firstName} ${client.lastName}`,

      // Communication preferences
      preferredCommunication: template.communication,
      preferredContactTime: template.contactTime,
      allowTextMessages: template.communication === 'text' || Math.random() > 0.3,
      allowEmailMarketing: !isCommercial && Math.random() > 0.4,

      // Notification preferences
      notifications: {
        progressUpdates: template.notifications.progressUpdates,
        photoUpdates: !isCommercial,
        invoices: template.notifications.invoices,
        scheduling: template.notifications.scheduling,
        dailyDigest: isCommercial,
        weeklyReport: true,
      },

      // Design preferences (residential only)
      designPreferences: !isCommercial ? {
        style: randomItem(DESIGN_STYLES),
        colorPalette: randomItem(COLOR_PALETTES),
        priorities: randomItem([
          ['quality', 'timeline', 'budget'],
          ['budget', 'quality', 'timeline'],
          ['timeline', 'quality', 'budget'],
        ]),
        mustHaves: randomItem([
          ['Energy efficiency', 'Natural light'],
          ['Storage space', 'Easy maintenance'],
          ['Modern fixtures', 'Open layout'],
        ]),
        avoidList: randomItem([
          ['Dark colors', 'Brass fixtures'],
          ['Tile flooring', 'Wallpaper'],
          ['Popcorn ceilings', 'Carpet'],
        ]),
      } : undefined,

      // Budget preferences
      budgetPreferences: {
        preferFixedPrice: !isCommercial,
        requireApprovalOver: isCommercial ? 5000 : 1000,
        paymentMethod: isCommercial ? 'check' : randomItem(['credit_card', 'check', 'ach']),
        invoiceFrequency: isCommercial ? 'monthly' : 'milestone',
      },

      // Scheduling preferences
      schedulingPreferences: {
        preferredWorkDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        preferredStartTime: isCommercial ? '07:00' : '08:00',
        preferredEndTime: isCommercial ? '18:00' : '17:00',
        weekendWorkOk: isCommercial,
        holidayWorkOk: false,
        notifyBeforeArrival: !isCommercial,
        notifyMinutesBefore: 30,
      },

      // Site access
      siteAccess: {
        hasKeys: !isCommercial,
        hasCode: true,
        accessCode: isCommercial ? undefined : `${Math.floor(1000 + Math.random() * 9000)}`,
        lockboxLocation: !isCommercial ? randomItem(['Front porch', 'Side gate', 'Back door']) : undefined,
        parkingInstructions: isCommercial
          ? 'Use visitor parking lot on west side'
          : 'Street parking available',
        petInstructions: !isCommercial && Math.random() > 0.5
          ? randomItem(['Friendly dog - may bark', 'Cat - keep doors closed', 'No pets'])
          : undefined,
      },

      // Special instructions
      notes: template.notes,
      specialInstructions: isCommercial
        ? 'Coordinate with building management for after-hours access. Loading dock available for deliveries.'
        : randomItem([
          'Ring doorbell on arrival. Side gate code is same as entry.',
          'Please text when arriving. Neighbor has spare key if needed.',
          'Work can proceed when owners not home. Call with questions.',
        ]),

      createdAt: daysAgo(Math.floor(Math.random() * 90) + 30),
      updatedAt: daysAgo(Math.floor(Math.random() * 14)),
      isDemoData: true,
    };

    preferences.push(preference);
    logProgress(`Created preferences for ${preference.clientName}`);
  }

  // Helper to remove undefined values recursively
  const removeUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(removeUndefined);
    if (typeof obj !== 'object') return obj;
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)])
    );
  };

  await executeBatchWrites(
    db,
    preferences,
    (batch, pref) => {
      const ref = preferencesRef.doc(pref.id);
      const cleanPref = removeUndefined({
        ...pref,
        createdAt: toTimestamp(pref.createdAt),
        updatedAt: toTimestamp(pref.updatedAt),
      });
      batch.set(ref, cleanPref);
    },
    'Client Preferences'
  );

  logSuccess(`Created ${preferences.length} client preference records`);
  return preferences.length;
}

export { seedClientPreferences };

// Run if executed directly
if (require.main === module) {
  seedClientPreferences()
    .then((count) => {
      console.log(`\n✅ Created ${count} client preference records`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding client preferences:', error);
      process.exit(1);
    });
}
