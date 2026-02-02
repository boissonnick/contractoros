/**
 * Seed Organization
 * Creates "Horizon Construction Co." - the demo organization
 */

import { Firestore } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_ORG_NAME,
  DEMO_USERS,
  monthsAgo,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
} from './utils';

export interface SeedOrganizationResult {
  orgId: string;
  createdAt: Date;
}

export async function seedOrganization(
  db: Firestore
): Promise<SeedOrganizationResult> {
  logSection('Seeding Organization');

  const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);
  const existingOrg = await orgRef.get();

  // Organization created 14 months ago for realistic history
  const createdAt = monthsAgo(14);

  if (existingOrg.exists) {
    logProgress('Organization already exists, updating...');
  } else {
    logProgress('Creating new organization...');
  }

  const organizationData = {
    id: DEMO_ORG_ID,
    name: DEMO_ORG_NAME,
    ownerUid: DEMO_USERS.owner.uid,

    // Company details
    address: '1500 Market Street, Suite 200, Denver, CO 80202',
    phone: '(303) 555-0100',
    email: 'info@horizonconstruction.demo',
    website: 'https://horizonconstruction.demo',

    // License & insurance
    contractorLicense: 'CO-GC-2020-12345',
    insuranceInfo: {
      provider: 'BuildSafe Insurance Co.',
      policyNumber: 'BSI-2024-HC-001',
      generalLiability: 2000000,
      workersComp: 1000000,
      expirationDate: toTimestamp(new Date('2026-12-31')),
    },

    // Branding
    branding: {
      primaryColor: '#1e40af',    // Deep blue
      secondaryColor: '#3b82f6',  // Lighter blue
      accentColor: '#f97316',     // Orange accent
      logoURL: null,              // No logo for demo
    },

    // Settings
    settings: {
      timezone: 'America/Denver',
      workdayStart: '07:00',
      workdayEnd: '17:00',
      overtimeThreshold: 40,
      requireGeoLocation: true,
    },

    // Plan & features
    plan: 'professional',
    planFeatures: {
      maxProjects: 50,
      maxUsers: 25,
      maxStorage: 50, // GB
      hasClientPortal: true,
      hasSubPortal: true,
      hasFieldApp: true,
      hasAdvancedReporting: true,
      hasApiAccess: true,
    },

    // Onboarding
    onboardingCompleted: true,

    // Business info
    businessType: 'llc',
    ein: '**-***4567', // Masked EIN
    yearEstablished: 2018,

    // Primary services
    primaryTrades: [
      'General Contracting',
      'Remodeling',
      'Additions',
      'Kitchen & Bath',
      'Basement Finishing',
    ],

    // Service area
    serviceArea: {
      cities: ['Denver', 'Aurora', 'Lakewood', 'Centennial', 'Littleton', 'Englewood'],
      radius: 30, // miles from Denver
    },

    // Timestamps
    createdAt: toTimestamp(createdAt),
    updatedAt: toTimestamp(new Date()),
  };

  await orgRef.set(organizationData, { merge: true });

  // Also create the org's settings subcollections if needed
  await seedOrgSettings(db, DEMO_ORG_ID);

  logSuccess(`Organization "${DEMO_ORG_NAME}" created/updated`);
  logSuccess(`  Location: Denver, CO`);
  logSuccess(`  Plan: Professional`);
  logSuccess(`  Created: ${createdAt.toLocaleDateString()}`);

  return {
    orgId: DEMO_ORG_ID,
    createdAt,
  };
}

/**
 * Seed organization-level settings
 */
async function seedOrgSettings(db: Firestore, orgId: string): Promise<void> {
  logProgress('Seeding organization settings...');

  // Estimate settings
  const estimateSettingsRef = db
    .collection('organizations')
    .doc(orgId)
    .collection('settings')
    .doc('estimates');

  await estimateSettingsRef.set({
    prefix: 'EST',
    nextNumber: 1047,
    defaultTerms: `Thank you for considering Horizon Construction Co. for your project.

This estimate is valid for 30 days from the date issued.

Payment Terms:
- 30% deposit upon contract signing
- Progress payments as work is completed
- Final payment upon project completion

All work will be performed in a professional manner in accordance with industry standards. Permits and inspections are included unless otherwise noted.

Please contact us with any questions.`,
    defaultValidDays: 30,
    showLineItemPrices: true,
    showMarkup: false,
  }, { merge: true });

  // Invoice settings
  const invoiceSettingsRef = db
    .collection('organizations')
    .doc(orgId)
    .collection('settings')
    .doc('invoices');

  await invoiceSettingsRef.set({
    prefix: 'INV',
    nextNumber: 2089,
    defaultTerms: `Payment is due within 30 days of invoice date.

Accepted payment methods:
- Check payable to "Horizon Construction Co."
- ACH/Bank transfer
- Credit card (3% processing fee applies)

Late payments may be subject to a 1.5% monthly finance charge.

Thank you for your business!`,
    defaultDueDays: 30,
    acceptCreditCards: true,
    creditCardFee: 3,
    acceptAch: true,
  }, { merge: true });

  // Change order settings
  const coSettingsRef = db
    .collection('organizations')
    .doc(orgId)
    .collection('settings')
    .doc('changeOrders');

  await coSettingsRef.set({
    prefix: 'CO',
    nextNumber: 156,
    requireSignature: true,
    defaultMarkup: 15,
  }, { merge: true });

  // Notification preferences
  const notificationSettingsRef = db
    .collection('organizations')
    .doc(orgId)
    .collection('settings')
    .doc('notifications');

  await notificationSettingsRef.set({
    emailNotifications: true,
    smsNotifications: false,
    dailyDigest: true,
    projectUpdates: true,
    invoiceReminders: true,
    timeEntryReminders: true,
  }, { merge: true });

  logSuccess('Organization settings configured');
}
