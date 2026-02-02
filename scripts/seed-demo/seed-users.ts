/**
 * Seed Users
 * Creates demo users for Horizon Construction Co.
 *
 * Users:
 * - Owner: Mike Johnson
 * - PM: Sarah Williams
 * - Foreman: Carlos Rodriguez
 * - Field Workers: Jake Thompson, Maria Santos, David Chen
 * - Office Admin: Emily Parker
 */

import { Firestore } from 'firebase-admin/firestore';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  monthsAgo,
  daysAgo,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
} from './utils';

export interface SeedUsersResult {
  userCount: number;
  users: typeof DEMO_USERS;
}

export async function seedUsers(
  db: Firestore,
  orgId: string
): Promise<SeedUsersResult> {
  logSection('Seeding Users');

  const usersRef = db.collection('users');
  const batch = db.batch();

  // Track hire dates for realistic progression
  const hireDates = {
    owner: monthsAgo(14),      // Founded company
    pm: monthsAgo(12),         // Hired early
    foreman: monthsAgo(10),    // Experienced hire
    fieldWorker1: monthsAgo(8), // Jake
    fieldWorker2: monthsAgo(6), // Maria
    fieldWorker3: monthsAgo(3), // David (newest)
    admin: monthsAgo(11),       // Emily
  };

  // Owner - Mike Johnson
  logProgress('Creating owner: Mike Johnson...');
  const ownerRef = usersRef.doc(DEMO_USERS.owner.uid);
  batch.set(ownerRef, {
    uid: DEMO_USERS.owner.uid,
    email: DEMO_USERS.owner.email,
    displayName: DEMO_USERS.owner.displayName,
    phone: DEMO_USERS.owner.phone,
    role: DEMO_USERS.owner.role,
    orgId: orgId,
    isActive: true,
    onboardingCompleted: true,

    // Compensation
    salary: DEMO_USERS.owner.salary,
    paySchedule: 'biweekly',
    payMethod: 'direct_deposit',
    taxClassification: 'W2',

    // Profile
    specialty: DEMO_USERS.owner.specialty,
    trade: DEMO_USERS.owner.trade,
    bio: 'Founder and owner of Horizon Construction. 20+ years of experience in residential and commercial construction throughout the Denver metro area.',

    // Contact
    address: '4521 Summit View Drive, Golden, CO 80401',
    emergencyContact: {
      name: 'Linda Johnson',
      relationship: 'Spouse',
      phone: '(303) 555-0150',
    },

    // Time off
    ptoBalance: 0, // Owners don't track PTO
    sickLeaveBalance: 0,

    // Timestamps
    createdAt: toTimestamp(hireDates.owner),
    updatedAt: toTimestamp(new Date()),
  });

  // PM - Sarah Williams
  logProgress('Creating PM: Sarah Williams...');
  const pmRef = usersRef.doc(DEMO_USERS.pm.uid);
  batch.set(pmRef, {
    uid: DEMO_USERS.pm.uid,
    email: DEMO_USERS.pm.email,
    displayName: DEMO_USERS.pm.displayName,
    phone: DEMO_USERS.pm.phone,
    role: DEMO_USERS.pm.role,
    orgId: orgId,
    isActive: true,
    onboardingCompleted: true,

    // Compensation
    salary: DEMO_USERS.pm.salary,
    paySchedule: 'biweekly',
    payMethod: 'direct_deposit',
    taxClassification: 'W2',

    // Profile
    specialty: DEMO_USERS.pm.specialty,
    bio: 'Experienced project manager with a focus on client communication and schedule optimization. PMP certified.',

    // Contact
    address: '892 Aspen Way, Lakewood, CO 80214',
    emergencyContact: {
      name: 'Tom Williams',
      relationship: 'Spouse',
      phone: '(303) 555-0151',
    },

    certifications: [
      { name: 'PMP', issuingBody: 'PMI', number: 'PMP-2021-SW' },
      { name: 'OSHA 10', issuingBody: 'OSHA', number: 'OSHA-10-2023-SW' },
    ],

    // Time off (accrued over employment)
    ptoBalance: 64, // 8 days
    sickLeaveBalance: 32, // 4 days
    ptoAccrualRate: 6.67, // ~20 days/year
    sickAccrualRate: 3.33, // ~10 days/year

    // Timestamps
    createdAt: toTimestamp(hireDates.pm),
    updatedAt: toTimestamp(new Date()),
  });

  // Foreman - Carlos Rodriguez
  logProgress('Creating foreman: Carlos Rodriguez...');
  const foremanRef = usersRef.doc(DEMO_USERS.foreman.uid);
  batch.set(foremanRef, {
    uid: DEMO_USERS.foreman.uid,
    email: DEMO_USERS.foreman.email,
    displayName: DEMO_USERS.foreman.displayName,
    phone: DEMO_USERS.foreman.phone,
    role: DEMO_USERS.foreman.role,
    employeeType: DEMO_USERS.foreman.employeeType,
    orgId: orgId,
    isActive: true,
    onboardingCompleted: true,

    // Compensation
    hourlyRate: DEMO_USERS.foreman.hourlyRate,
    overtimeRate: 1.5,
    doubleTimeRate: 2.0,
    paySchedule: 'weekly',
    payMethod: 'direct_deposit',
    taxClassification: 'W2',

    // Profile
    specialty: DEMO_USERS.foreman.specialty,
    trade: DEMO_USERS.foreman.trade,
    trades: ['General Contractor', 'Carpenter', 'Concrete'],
    bio: 'Lead foreman with expertise in residential construction. Bilingual (English/Spanish). Known for quality craftsmanship and team leadership.',

    // Contact
    address: '2341 Mesa Drive, Aurora, CO 80011',
    emergencyContact: {
      name: 'Ana Rodriguez',
      relationship: 'Spouse',
      phone: '(303) 555-0152',
    },

    certifications: DEMO_USERS.foreman.certifications,

    // Time off
    ptoBalance: 48, // 6 days
    sickLeaveBalance: 24, // 3 days
    ptoAccrualRate: 5, // ~15 days/year
    sickAccrualRate: 2.5,

    // Timestamps
    createdAt: toTimestamp(hireDates.foreman),
    updatedAt: toTimestamp(new Date()),
  });

  // Field Worker 1 - Jake Thompson
  logProgress('Creating field worker: Jake Thompson...');
  const jake = DEMO_USERS.fieldWorker1;
  const jakeRef = usersRef.doc(jake.uid);
  batch.set(jakeRef, {
    uid: jake.uid,
    email: jake.email,
    displayName: jake.displayName,
    phone: jake.phone,
    role: jake.role,
    employeeType: jake.employeeType,
    orgId: orgId,
    isActive: true,
    onboardingCompleted: true,

    // Compensation
    hourlyRate: jake.hourlyRate,
    overtimeRate: 1.5,
    doubleTimeRate: 2.0,
    paySchedule: 'weekly',
    payMethod: 'direct_deposit',
    taxClassification: 'W2',

    // Profile
    specialty: jake.specialty,
    trade: jake.trade,
    trades: ['Carpenter', 'Drywall'],
    bio: 'Skilled carpenter specializing in framing and rough carpentry. Quick learner with attention to detail.',

    // Contact
    address: '1567 Prairie Lane, Centennial, CO 80112',
    emergencyContact: {
      name: 'Beth Thompson',
      relationship: 'Mother',
      phone: '(303) 555-0153',
    },

    certifications: jake.certifications,

    // Time off
    ptoBalance: 32, // 4 days
    sickLeaveBalance: 16, // 2 days
    ptoAccrualRate: 4,
    sickAccrualRate: 2,

    // Timestamps
    createdAt: toTimestamp(hireDates.fieldWorker1),
    updatedAt: toTimestamp(new Date()),
  });

  // Field Worker 2 - Maria Santos
  logProgress('Creating field worker: Maria Santos...');
  const maria = DEMO_USERS.fieldWorker2;
  const mariaRef = usersRef.doc(maria.uid);
  batch.set(mariaRef, {
    uid: maria.uid,
    email: maria.email,
    displayName: maria.displayName,
    phone: maria.phone,
    role: maria.role,
    employeeType: maria.employeeType,
    orgId: orgId,
    isActive: true,
    onboardingCompleted: true,

    // Compensation
    hourlyRate: maria.hourlyRate,
    overtimeRate: 1.5,
    doubleTimeRate: 2.0,
    paySchedule: 'weekly',
    payMethod: 'direct_deposit',
    taxClassification: 'W2',

    // Profile
    specialty: maria.specialty,
    trade: maria.trade,
    trades: ['Carpenter', 'Flooring', 'Painter'],
    bio: 'Finish carpenter with excellent trim and cabinet installation skills. Eye for detail and quality finishes.',

    // Contact
    address: '3456 Garden Street, Littleton, CO 80120',
    emergencyContact: {
      name: 'Jose Santos',
      relationship: 'Brother',
      phone: '(303) 555-0154',
    },

    certifications: maria.certifications,

    // Time off
    ptoBalance: 24, // 3 days
    sickLeaveBalance: 12,
    ptoAccrualRate: 4,
    sickAccrualRate: 2,

    // Timestamps
    createdAt: toTimestamp(hireDates.fieldWorker2),
    updatedAt: toTimestamp(new Date()),
  });

  // Field Worker 3 - David Chen
  logProgress('Creating field worker: David Chen...');
  const david = DEMO_USERS.fieldWorker3;
  const davidRef = usersRef.doc(david.uid);
  batch.set(davidRef, {
    uid: david.uid,
    email: david.email,
    displayName: david.displayName,
    phone: david.phone,
    role: david.role,
    employeeType: david.employeeType,
    orgId: orgId,
    isActive: true,
    onboardingCompleted: true,

    // Compensation
    hourlyRate: david.hourlyRate,
    overtimeRate: 1.5,
    doubleTimeRate: 2.0,
    paySchedule: 'weekly',
    payMethod: 'direct_deposit',
    taxClassification: 'W2',

    // Profile
    specialty: david.specialty,
    trade: david.trade,
    trades: ['General Contractor'],
    bio: 'Enthusiastic team member eager to learn all aspects of construction. Reliable and hardworking.',

    // Contact
    address: '789 University Blvd, Denver, CO 80210',
    emergencyContact: {
      name: 'Wei Chen',
      relationship: 'Father',
      phone: '(303) 555-0155',
    },

    certifications: david.certifications,

    // Time off (newest employee)
    ptoBalance: 8, // 1 day
    sickLeaveBalance: 8,
    ptoAccrualRate: 4,
    sickAccrualRate: 2,

    // Timestamps
    createdAt: toTimestamp(hireDates.fieldWorker3),
    updatedAt: toTimestamp(new Date()),
  });

  // Office Admin - Emily Parker
  logProgress('Creating office admin: Emily Parker...');
  const emily = DEMO_USERS.admin;
  const emilyRef = usersRef.doc(emily.uid);
  batch.set(emilyRef, {
    uid: emily.uid,
    email: emily.email,
    displayName: emily.displayName,
    phone: emily.phone,
    role: emily.role,
    employeeType: emily.employeeType,
    orgId: orgId,
    isActive: true,
    onboardingCompleted: true,

    // Compensation
    salary: emily.salary,
    paySchedule: 'biweekly',
    payMethod: 'direct_deposit',
    taxClassification: 'W2',

    // Profile
    specialty: emily.specialty,
    bio: 'Office administrator handling invoicing, scheduling, and customer communications. Expert in QuickBooks and construction management software.',

    // Contact
    address: '456 Cherry Lane, Englewood, CO 80110',
    emergencyContact: {
      name: 'Mark Parker',
      relationship: 'Spouse',
      phone: '(303) 555-0156',
    },

    // Time off
    ptoBalance: 56, // 7 days
    sickLeaveBalance: 28,
    ptoAccrualRate: 5,
    sickAccrualRate: 2.5,

    // Timestamps
    createdAt: toTimestamp(hireDates.admin),
    updatedAt: toTimestamp(new Date()),
  });

  // Commit all users
  await batch.commit();

  logSuccess('All users created successfully!');
  logSuccess('  1 Owner: Mike Johnson');
  logSuccess('  1 Project Manager: Sarah Williams');
  logSuccess('  1 Foreman: Carlos Rodriguez');
  logSuccess('  3 Field Workers: Jake, Maria, David');
  logSuccess('  1 Office Admin: Emily Parker');
  logSuccess('  Total: 7 users');

  return {
    userCount: 7,
    users: DEMO_USERS,
  };
}
