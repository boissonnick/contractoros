/**
 * Utility functions for demo data seeding
 * Provides helpers for date generation, amounts, and constants
 */

import { Timestamp } from 'firebase-admin/firestore';

// ============================================
// Demo Organization Constants
// ============================================

export const DEMO_ORG_ID = 'demo-horizon-construction';
export const DEMO_ORG_NAME = 'Horizon Construction Co.';

// ============================================
// Demo Users
// ============================================

export const DEMO_USERS = {
  owner: {
    uid: 'demo-mike-johnson',
    email: 'mike@horizonconstruction.demo',
    displayName: 'Mike Johnson',
    role: 'OWNER' as const,
    phone: '(303) 555-0100',
    hourlyRate: 0, // Salaried
    salary: 150000,
    specialty: 'Owner / General Contractor',
    trade: 'General Contractor',
  },
  pm: {
    uid: 'demo-sarah-williams',
    email: 'sarah@horizonconstruction.demo',
    displayName: 'Sarah Williams',
    role: 'PM' as const,
    phone: '(303) 555-0101',
    hourlyRate: 0,
    salary: 85000,
    specialty: 'Project Manager',
  },
  foreman: {
    uid: 'demo-carlos-rodriguez',
    email: 'carlos@horizonconstruction.demo',
    displayName: 'Carlos Rodriguez',
    role: 'EMPLOYEE' as const,
    employeeType: 'FOREMAN' as const,
    phone: '(303) 555-0102',
    hourlyRate: 45,
    specialty: 'Site Foreman',
    trade: 'General Contractor',
    certifications: [
      { name: 'OSHA 30', issuingBody: 'OSHA', number: 'OSHA-30-2024-CR' },
      { name: 'First Aid/CPR', issuingBody: 'Red Cross', number: 'RC-FA-2025' },
    ],
  },
  fieldWorker1: {
    uid: 'demo-jake-thompson',
    email: 'jake@horizonconstruction.demo',
    displayName: 'Jake Thompson',
    role: 'EMPLOYEE' as const,
    employeeType: 'FIELD' as const,
    phone: '(303) 555-0103',
    hourlyRate: 32,
    specialty: 'Carpenter',
    trade: 'Carpenter',
    certifications: [
      { name: 'OSHA 10', issuingBody: 'OSHA', number: 'OSHA-10-2024-JT' },
    ],
  },
  fieldWorker2: {
    uid: 'demo-maria-santos',
    email: 'maria@horizonconstruction.demo',
    displayName: 'Maria Santos',
    role: 'EMPLOYEE' as const,
    employeeType: 'FIELD' as const,
    phone: '(303) 555-0104',
    hourlyRate: 35,
    specialty: 'Finish Carpenter',
    trade: 'Carpenter',
    certifications: [
      { name: 'OSHA 10', issuingBody: 'OSHA', number: 'OSHA-10-2024-MS' },
    ],
  },
  fieldWorker3: {
    uid: 'demo-david-chen',
    email: 'david@horizonconstruction.demo',
    displayName: 'David Chen',
    role: 'EMPLOYEE' as const,
    employeeType: 'FIELD' as const,
    phone: '(303) 555-0105',
    hourlyRate: 30,
    specialty: 'General Laborer',
    trade: 'General Contractor',
    certifications: [
      { name: 'OSHA 10', issuingBody: 'OSHA', number: 'OSHA-10-2024-DC' },
    ],
  },
  admin: {
    uid: 'demo-emily-parker',
    email: 'emily@horizonconstruction.demo',
    displayName: 'Emily Parker',
    role: 'EMPLOYEE' as const,
    employeeType: 'OFFICE' as const,
    phone: '(303) 555-0106',
    hourlyRate: 0,
    salary: 55000,
    specialty: 'Office Administrator',
  },
} as const;

// ============================================
// Demo Clients
// ============================================

export const DEMO_CLIENTS = {
  // Residential clients
  smith: {
    id: 'demo-client-smith',
    firstName: 'Robert',
    lastName: 'Smith',
    email: 'robert.smith@email.demo',
    phone: '(303) 555-1001',
    isCommercial: false,
    address: {
      street: '1234 Maple Street',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
    },
  },
  garcia: {
    id: 'demo-client-garcia',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria.garcia@email.demo',
    phone: '(303) 555-1002',
    isCommercial: false,
    address: {
      street: '567 Oak Avenue',
      city: 'Lakewood',
      state: 'CO',
      zip: '80226',
    },
  },
  thompson: {
    id: 'demo-client-thompson',
    firstName: 'James',
    lastName: 'Thompson',
    email: 'james.thompson@email.demo',
    phone: '(303) 555-1003',
    isCommercial: false,
    address: {
      street: '890 Pine Road',
      city: 'Aurora',
      state: 'CO',
      zip: '80012',
    },
  },
  wilson: {
    id: 'demo-client-wilson',
    firstName: 'Jennifer',
    lastName: 'Wilson',
    email: 'jennifer.wilson@email.demo',
    phone: '(303) 555-1004',
    isCommercial: false,
    address: {
      street: '234 Birch Lane',
      city: 'Centennial',
      state: 'CO',
      zip: '80112',
    },
  },
  brown: {
    id: 'demo-client-brown',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@email.demo',
    phone: '(303) 555-1005',
    isCommercial: false,
    address: {
      street: '678 Cedar Court',
      city: 'Littleton',
      state: 'CO',
      zip: '80120',
    },
  },
  // Commercial clients
  downtownCafe: {
    id: 'demo-client-downtown-cafe',
    firstName: 'Tom',
    lastName: 'Richards',
    companyName: 'Downtown Cafe LLC',
    email: 'tom@downtowncafe.demo',
    phone: '(303) 555-2001',
    isCommercial: true,
    address: {
      street: '100 Main Street',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
    },
  },
  mainStRetail: {
    id: 'demo-client-main-st-retail',
    firstName: 'Susan',
    lastName: 'Martinez',
    companyName: 'Main Street Retail Group',
    email: 'susan@mainstreet.demo',
    phone: '(303) 555-2002',
    isCommercial: true,
    address: {
      street: '250 Main Street',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
    },
  },
  officePark: {
    id: 'demo-client-office-park',
    firstName: 'David',
    lastName: 'Anderson',
    companyName: 'Office Park LLC',
    email: 'david@officeparkllc.demo',
    phone: '(303) 555-2003',
    isCommercial: true,
    address: {
      street: '500 Business Parkway',
      city: 'Englewood',
      state: 'CO',
      zip: '80111',
    },
  },
} as const;

// ============================================
// Date Helper Functions
// ============================================

/**
 * Get a date N days ago from now
 */
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Get a date N months ago from now
 */
export function monthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

/**
 * Get a date N days from now (future)
 */
export function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Generate a random timestamp during work hours (7am-5pm) on a given base date
 */
export function randomWorkDateTime(baseDate: Date): Date {
  const date = new Date(baseDate);
  // Work hours: 7:00 AM to 5:00 PM
  const hour = Math.floor(Math.random() * 10) + 7; // 7-16 (7am-4pm)
  const minute = Math.floor(Math.random() * 60);
  date.setHours(hour, minute, 0, 0);
  return date;
}

/**
 * Convert a JavaScript Date to Firestore Timestamp
 */
export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Generate a date between two dates
 */
export function randomDateBetween(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

// ============================================
// Amount Helper Functions
// ============================================

/**
 * Generate a random dollar amount between min and max, rounded to cents
 */
export function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random item from an array
 */
export function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// ============================================
// ID Generation
// ============================================

/**
 * Generate a unique ID with a prefix
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================
// Batch Write Helper
// ============================================

/**
 * Execute batch writes in chunks of 500 (Firestore limit)
 */
export async function executeBatchWrites<T>(
  db: FirebaseFirestore.Firestore,
  items: T[],
  writeOperation: (batch: FirebaseFirestore.WriteBatch, item: T) => void,
  progressLabel: string
): Promise<void> {
  const BATCH_SIZE = 500;
  let processedCount = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = items.slice(i, i + BATCH_SIZE);

    for (const item of chunk) {
      writeOperation(batch, item);
    }

    await batch.commit();
    processedCount += chunk.length;
    console.log(`  ${progressLabel}: ${processedCount}/${items.length}`);
  }
}

// ============================================
// Console Output Helpers
// ============================================

export function logSection(title: string): void {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(50));
}

export function logProgress(message: string): void {
  console.log(`  → ${message}`);
}

export function logSuccess(message: string): void {
  console.log(`  ✓ ${message}`);
}

export function logWarning(message: string): void {
  console.log(`  ⚠ ${message}`);
}
