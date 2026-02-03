# Playwright E2E Testing Implementation Plan

> **Status:** Planning
> **Created:** 2026-02-03
> **Scope:** Full Playwright integration with test users and seeded demo data

---

## Executive Summary

This plan integrates Playwright as the E2E testing framework for ContractorOS, replacing the current markdown-based manual testing approach. It includes:

1. **Playwright setup** with TypeScript and parallel execution
2. **8 test user accounts** covering all portal/role combinations
3. **Dedicated test organization** with fully seeded demo data
4. **Auth state management** for fast, isolated test runs
5. **CI/CD integration** with GitHub Actions

---

## Phase 1: Playwright Setup & Configuration

### 1.1 Install Dependencies

```bash
cd apps/web
npm install -D @playwright/test
npx playwright install  # Install browsers
```

### 1.2 Create Playwright Config

**File:** `apps/web/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html', { outputFolder: 'e2e/playwright-report' }],
    ['json', { outputFile: 'e2e/playwright-report/results.json' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    // Auth setup - runs first to create auth states
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      dependencies: ['setup'],
    },

    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad Pro 11'] },
      dependencies: ['setup'],
    },
  ],

  // Local dev server
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 1.3 Directory Structure

```
apps/web/e2e/
├── playwright/                    # NEW: Playwright tests
│   ├── setup/
│   │   └── auth.setup.ts          # Auth state generation
│   ├── fixtures/
│   │   ├── test-users.ts          # Test user definitions
│   │   ├── test-fixtures.ts       # Custom Playwright fixtures
│   │   └── page-objects/          # Page Object Models
│   │       ├── login.page.ts
│   │       ├── dashboard.page.ts
│   │       ├── projects.page.ts
│   │       └── ...
│   ├── suites/
│   │   ├── smoke.spec.ts
│   │   ├── auth.spec.ts
│   │   ├── rbac.spec.ts
│   │   ├── projects.spec.ts
│   │   ├── clients.spec.ts
│   │   ├── team.spec.ts
│   │   ├── finances.spec.ts
│   │   ├── scheduling.spec.ts
│   │   ├── documents.spec.ts
│   │   └── portals/
│   │       ├── client-portal.spec.ts
│   │       ├── sub-portal.spec.ts
│   │       └── field-portal.spec.ts
│   ├── utils/
│   │   ├── helpers.ts
│   │   └── selectors.ts
│   └── .auth/                     # Auth state storage (gitignored)
│       ├── owner.json
│       ├── pm.json
│       ├── finance.json
│       ├── employee.json
│       ├── contractor.json
│       ├── client.json
│       ├── subcontractor.json
│       └── field.json
├── suites/                        # EXISTING: Manual test specs
└── functionality/                 # EXISTING: Functionality tests
```

---

## Phase 2: Test Users & Authentication

### 2.1 Test User Matrix

| User | Email | Role | Portal Access | Key Permissions |
|------|-------|------|---------------|-----------------|
| **Owner** | `e2e-owner@contractoros.test` | OWNER | Dashboard, All | Full system access |
| **Project Manager** | `e2e-pm@contractoros.test` | PM | Dashboard | Projects, clients, team, no payroll |
| **Finance Manager** | `e2e-finance@contractoros.test` | FINANCE | Dashboard | Invoices, expenses, payroll, reports |
| **Employee** | `e2e-employee@contractoros.test` | EMPLOYEE | Field Portal | Assigned tasks, time tracking |
| **Contractor (1099)** | `e2e-contractor@contractoros.test` | CONTRACTOR | Sub Portal | Own bids, assigned work |
| **Subcontractor** | `e2e-sub@contractoros.test` | SUB | Sub Portal | Bid on projects, manage crew |
| **Client** | `e2e-client@contractoros.test` | CLIENT | Client Portal | Own projects, approvals, messages |
| **Field Worker** | `e2e-field@contractoros.test` | EMPLOYEE (Field) | Field Portal | Daily logs, photos, time clock |

### 2.2 Test User Configuration

**File:** `apps/web/e2e/playwright/fixtures/test-users.ts`

```typescript
export const TEST_ORG = {
  id: 'e2e-test-org-001',
  name: 'E2E Test Construction Co.',
  address: '999 Test Boulevard, Denver, CO 80202',
  email: 'e2e@contractoros.test',
  phone: '(303) 555-9999',
};

export const TEST_USERS = {
  owner: {
    uid: 'e2e-user-owner',
    email: 'e2e-owner@contractoros.test',
    password: process.env.E2E_TEST_PASSWORD || 'E2eTestPassword123!',
    displayName: 'E2E Owner',
    role: 'OWNER',
    orgId: TEST_ORG.id,
    phone: '(303) 555-0001',
    salary: 150000,
    specialty: 'General Contractor',
  },
  pm: {
    uid: 'e2e-user-pm',
    email: 'e2e-pm@contractoros.test',
    password: process.env.E2E_TEST_PASSWORD || 'E2eTestPassword123!',
    displayName: 'E2E Project Manager',
    role: 'PM',
    orgId: TEST_ORG.id,
    phone: '(303) 555-0002',
    salary: 85000,
    specialty: 'Project Management',
  },
  finance: {
    uid: 'e2e-user-finance',
    email: 'e2e-finance@contractoros.test',
    password: process.env.E2E_TEST_PASSWORD || 'E2eTestPassword123!',
    displayName: 'E2E Finance Manager',
    role: 'FINANCE',
    orgId: TEST_ORG.id,
    phone: '(303) 555-0003',
    salary: 75000,
    specialty: 'Financial Operations',
  },
  employee: {
    uid: 'e2e-user-employee',
    email: 'e2e-employee@contractoros.test',
    password: process.env.E2E_TEST_PASSWORD || 'E2eTestPassword123!',
    displayName: 'E2E Employee',
    role: 'EMPLOYEE',
    employeeType: 'hourly',
    orgId: TEST_ORG.id,
    phone: '(303) 555-0004',
    hourlyRate: 35,
    trade: 'Carpenter',
  },
  contractor: {
    uid: 'e2e-user-contractor',
    email: 'e2e-contractor@contractoros.test',
    password: process.env.E2E_TEST_PASSWORD || 'E2eTestPassword123!',
    displayName: 'E2E Contractor',
    role: 'CONTRACTOR',
    orgId: TEST_ORG.id,
    phone: '(303) 555-0005',
    hourlyRate: 65,
    companyName: 'E2E Electrical LLC',
    trade: 'Electrician',
    taxClassification: '1099',
  },
  subcontractor: {
    uid: 'e2e-user-sub',
    email: 'e2e-sub@contractoros.test',
    password: process.env.E2E_TEST_PASSWORD || 'E2eTestPassword123!',
    displayName: 'E2E Subcontractor',
    role: 'SUB',
    orgId: TEST_ORG.id,
    phone: '(303) 555-0006',
    companyName: 'E2E Plumbing Co.',
    trade: 'Plumber',
    licenseNumber: 'PLB-E2E-001',
  },
  client: {
    uid: 'e2e-user-client',
    email: 'e2e-client@contractoros.test',
    password: process.env.E2E_TEST_PASSWORD || 'E2eTestPassword123!',
    displayName: 'E2E Test Client',
    role: 'CLIENT',
    orgId: TEST_ORG.id,
    phone: '(303) 555-0007',
    clientId: 'e2e-client-001', // Links to client record
  },
  field: {
    uid: 'e2e-user-field',
    email: 'e2e-field@contractoros.test',
    password: process.env.E2E_TEST_PASSWORD || 'E2eTestPassword123!',
    displayName: 'E2E Field Worker',
    role: 'EMPLOYEE',
    employeeType: 'field',
    orgId: TEST_ORG.id,
    phone: '(303) 555-0008',
    hourlyRate: 28,
    trade: 'General Laborer',
  },
} as const;

export type TestUserKey = keyof typeof TEST_USERS;
```

### 2.3 Auth Setup Script

**File:** `apps/web/e2e/playwright/setup/auth.setup.ts`

```typescript
import { test as setup, expect } from '@playwright/test';
import { TEST_USERS, TestUserKey } from '../fixtures/test-users';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '../.auth');

// Create authenticated states for each user type
for (const [userKey, user] of Object.entries(TEST_USERS)) {
  setup(`authenticate as ${userKey}`, async ({ page }) => {
    // Go to login page
    await page.goto('/login');

    // Fill credentials
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for dashboard to load (confirms successful auth)
    await expect(page).toHaveURL(/\/(dashboard|client|sub|field)/);

    // Save auth state
    await page.context().storageState({
      path: path.join(AUTH_DIR, `${userKey}.json`)
    });
  });
}
```

### 2.4 Custom Fixtures for Auth

**File:** `apps/web/e2e/playwright/fixtures/test-fixtures.ts`

```typescript
import { test as base } from '@playwright/test';
import { TEST_USERS, TestUserKey } from './test-users';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '../.auth');

// Extend Playwright's test with user-specific fixtures
export const test = base.extend<{
  userRole: TestUserKey;
}>({
  userRole: ['owner', { option: true }],

  // Override storageState based on userRole
  storageState: async ({ userRole }, use) => {
    await use(path.join(AUTH_DIR, `${userRole}.json`));
  },
});

// Helper to create role-specific test
export function testAs(role: TestUserKey) {
  return test.extend({
    userRole: [role, { option: true }],
  });
}

// Pre-configured test instances for each role
export const ownerTest = testAs('owner');
export const pmTest = testAs('pm');
export const financeTest = testAs('finance');
export const employeeTest = testAs('employee');
export const contractorTest = testAs('contractor');
export const subcontractorTest = testAs('subcontractor');
export const clientTest = testAs('client');
export const fieldTest = testAs('field');

export { expect } from '@playwright/test';
```

---

## Phase 3: Test Data Seeding

### 3.1 E2E Test Seed Script

**File:** `scripts/seed-demo/seed-e2e-test-data.ts`

```typescript
/**
 * Seed script for E2E Playwright tests
 * Creates a dedicated test organization with all user types and comprehensive data
 *
 * Usage: npx ts-node seed-e2e-test-data.ts
 */

import { getDb } from './db';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getApps } from 'firebase-admin/app';

const db = getDb();
const auth = getAuth(getApps()[0]);

// ============================================
// E2E Test Constants
// ============================================

const E2E_ORG_ID = 'e2e-test-org-001';
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD || 'E2eTestPassword123!';

const E2E_ORG = {
  id: E2E_ORG_ID,
  name: 'E2E Test Construction Co.',
  address: {
    street: '999 Test Boulevard',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
  },
  phone: '(303) 555-9999',
  email: 'e2e@contractoros.test',
  createdAt: Timestamp.now(),
  subscription: {
    plan: 'enterprise',
    status: 'active',
    trialEndsAt: null,
  },
  settings: {
    timezone: 'America/Denver',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
  },
};

const E2E_USERS = [
  {
    uid: 'e2e-user-owner',
    email: 'e2e-owner@contractoros.test',
    displayName: 'E2E Owner',
    role: 'OWNER',
    phone: '(303) 555-0001',
    salary: 150000,
    specialty: 'General Contractor',
    trade: 'General Contractor',
  },
  {
    uid: 'e2e-user-pm',
    email: 'e2e-pm@contractoros.test',
    displayName: 'E2E Project Manager',
    role: 'PM',
    phone: '(303) 555-0002',
    salary: 85000,
    specialty: 'Project Management',
  },
  {
    uid: 'e2e-user-finance',
    email: 'e2e-finance@contractoros.test',
    displayName: 'E2E Finance Manager',
    role: 'FINANCE',
    phone: '(303) 555-0003',
    salary: 75000,
    specialty: 'Financial Operations',
  },
  {
    uid: 'e2e-user-employee',
    email: 'e2e-employee@contractoros.test',
    displayName: 'E2E Employee',
    role: 'EMPLOYEE',
    employeeType: 'hourly',
    phone: '(303) 555-0004',
    hourlyRate: 35,
    trade: 'Carpenter',
  },
  {
    uid: 'e2e-user-contractor',
    email: 'e2e-contractor@contractoros.test',
    displayName: 'E2E Contractor',
    role: 'CONTRACTOR',
    phone: '(303) 555-0005',
    hourlyRate: 65,
    companyName: 'E2E Electrical LLC',
    trade: 'Electrician',
    taxClassification: '1099',
  },
  {
    uid: 'e2e-user-sub',
    email: 'e2e-sub@contractoros.test',
    displayName: 'E2E Subcontractor',
    role: 'SUB',
    phone: '(303) 555-0006',
    companyName: 'E2E Plumbing Co.',
    trade: 'Plumber',
    licenseNumber: 'PLB-E2E-001',
  },
  {
    uid: 'e2e-user-client',
    email: 'e2e-client@contractoros.test',
    displayName: 'E2E Test Client',
    role: 'CLIENT',
    phone: '(303) 555-0007',
    clientId: 'e2e-client-001',
  },
  {
    uid: 'e2e-user-field',
    email: 'e2e-field@contractoros.test',
    displayName: 'E2E Field Worker',
    role: 'EMPLOYEE',
    employeeType: 'field',
    phone: '(303) 555-0008',
    hourlyRate: 28,
    trade: 'General Laborer',
  },
];

// E2E Test Clients
const E2E_CLIENTS = [
  {
    id: 'e2e-client-001',
    firstName: 'Test',
    lastName: 'Homeowner',
    email: 'e2e-client@contractoros.test',
    phone: '(303) 555-0007',
    isCommercial: false,
    address: {
      street: '100 Test Home Lane',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
    },
    userId: 'e2e-user-client', // Links to portal user
  },
  {
    id: 'e2e-client-002',
    firstName: 'Business',
    lastName: 'Owner',
    companyName: 'Test Commercial LLC',
    email: 'business@testcommercial.test',
    phone: '(303) 555-8001',
    isCommercial: true,
    address: {
      street: '500 Business Park Drive',
      city: 'Denver',
      state: 'CO',
      zip: '80203',
    },
  },
  {
    id: 'e2e-client-003',
    firstName: 'Residential',
    lastName: 'Customer',
    email: 'residential@test.test',
    phone: '(303) 555-8002',
    isCommercial: false,
    address: {
      street: '200 Suburb Street',
      city: 'Lakewood',
      state: 'CO',
      zip: '80226',
    },
  },
];

// E2E Test Projects
const E2E_PROJECTS = [
  {
    id: 'e2e-project-active',
    name: 'E2E Active Kitchen Remodel',
    clientId: 'e2e-client-001',
    status: 'active',
    phase: 'construction',
    budget: 75000,
    address: {
      street: '100 Test Home Lane',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
    },
    startDate: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // 30 days ago
    targetEndDate: Timestamp.fromDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)), // 60 days from now
    assignedUsers: ['e2e-user-pm', 'e2e-user-employee', 'e2e-user-field'],
    description: 'Complete kitchen renovation including cabinets, countertops, and appliances.',
  },
  {
    id: 'e2e-project-planning',
    name: 'E2E Bathroom Addition',
    clientId: 'e2e-client-001',
    status: 'active',
    phase: 'planning',
    budget: 45000,
    address: {
      street: '100 Test Home Lane',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
    },
    startDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days from now
    targetEndDate: Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
    assignedUsers: ['e2e-user-pm'],
    description: 'New master bathroom addition.',
  },
  {
    id: 'e2e-project-completed',
    name: 'E2E Completed Deck Build',
    clientId: 'e2e-client-003',
    status: 'completed',
    phase: 'closeout',
    budget: 25000,
    actualCost: 23500,
    address: {
      street: '200 Suburb Street',
      city: 'Lakewood',
      state: 'CO',
      zip: '80226',
    },
    startDate: Timestamp.fromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
    completedDate: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    assignedUsers: ['e2e-user-pm', 'e2e-user-employee'],
    description: 'Completed composite deck with pergola.',
  },
  {
    id: 'e2e-project-commercial',
    name: 'E2E Office Buildout',
    clientId: 'e2e-client-002',
    status: 'active',
    phase: 'construction',
    budget: 250000,
    address: {
      street: '500 Business Park Drive',
      city: 'Denver',
      state: 'CO',
      zip: '80203',
    },
    startDate: Timestamp.fromDate(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)),
    targetEndDate: Timestamp.fromDate(new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)),
    assignedUsers: ['e2e-user-pm', 'e2e-user-employee', 'e2e-user-contractor', 'e2e-user-sub'],
    description: 'Full office buildout for tech company - 5,000 sq ft.',
  },
];

// E2E Test Tasks
const E2E_TASKS = [
  // Active project tasks
  {
    id: 'e2e-task-pending',
    title: 'Install Cabinet Hardware',
    projectId: 'e2e-project-active',
    status: 'pending',
    priority: 'medium',
    assigneeId: 'e2e-user-employee',
    dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'e2e-task-in-progress',
    title: 'Install Countertops',
    projectId: 'e2e-project-active',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'e2e-user-employee',
    dueDate: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'e2e-task-completed',
    title: 'Demo Old Cabinets',
    projectId: 'e2e-project-active',
    status: 'completed',
    priority: 'high',
    assigneeId: 'e2e-user-field',
    completedAt: Timestamp.fromDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)),
  },
  {
    id: 'e2e-task-blocked',
    title: 'Electrical for Island',
    projectId: 'e2e-project-active',
    status: 'blocked',
    priority: 'high',
    assigneeId: 'e2e-user-contractor',
    blockedReason: 'Waiting for permit approval',
  },
  // Commercial project tasks
  {
    id: 'e2e-task-commercial-1',
    title: 'Rough Plumbing',
    projectId: 'e2e-project-commercial',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'e2e-user-sub',
    dueDate: Timestamp.fromDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)),
  },
];

// E2E Invoices
const E2E_INVOICES = [
  {
    id: 'e2e-invoice-draft',
    projectId: 'e2e-project-active',
    clientId: 'e2e-client-001',
    status: 'draft',
    amount: 15000,
    description: 'Progress billing - Kitchen Phase 1',
    lineItems: [
      { description: 'Cabinet demolition', amount: 2500 },
      { description: 'Cabinet installation (50%)', amount: 7500 },
      { description: 'Plumbing rough-in', amount: 5000 },
    ],
  },
  {
    id: 'e2e-invoice-sent',
    projectId: 'e2e-project-active',
    clientId: 'e2e-client-001',
    status: 'sent',
    amount: 25000,
    sentAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
    dueDate: Timestamp.fromDate(new Date(Date.now() + 23 * 24 * 60 * 60 * 1000)),
    description: 'Initial deposit - Kitchen Remodel',
  },
  {
    id: 'e2e-invoice-paid',
    projectId: 'e2e-project-completed',
    clientId: 'e2e-client-003',
    status: 'paid',
    amount: 23500,
    paidAt: Timestamp.fromDate(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)),
    description: 'Final payment - Deck Build',
  },
  {
    id: 'e2e-invoice-overdue',
    projectId: 'e2e-project-commercial',
    clientId: 'e2e-client-002',
    status: 'overdue',
    amount: 50000,
    sentAt: Timestamp.fromDate(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)),
    dueDate: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
    description: 'Progress billing - Office Buildout Phase 1',
  },
];

// E2E Subcontractor Bids
const E2E_BIDS = [
  {
    id: 'e2e-bid-pending',
    projectId: 'e2e-project-active',
    subcontractorId: 'e2e-user-sub',
    trade: 'Plumbing',
    status: 'pending',
    amount: 8500,
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
    scope: 'Kitchen plumbing - relocate sink, add disposal, connect dishwasher',
  },
  {
    id: 'e2e-bid-accepted',
    projectId: 'e2e-project-commercial',
    subcontractorId: 'e2e-user-sub',
    trade: 'Plumbing',
    status: 'accepted',
    amount: 45000,
    submittedAt: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    acceptedAt: Timestamp.fromDate(new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)),
    scope: 'Full office plumbing - restrooms, break room, water heater',
  },
];

// ============================================
// Seed Functions
// ============================================

async function createFirebaseAuthUsers(): Promise<void> {
  console.log('\n[1/6] Creating Firebase Auth users...');

  for (const user of E2E_USERS) {
    try {
      // Check if user exists
      try {
        await auth.getUser(user.uid);
        console.log(`  → User ${user.email} already exists, updating...`);
        await auth.updateUser(user.uid, {
          email: user.email,
          password: E2E_PASSWORD,
          displayName: user.displayName,
        });
      } catch {
        // User doesn't exist, create
        await auth.createUser({
          uid: user.uid,
          email: user.email,
          password: E2E_PASSWORD,
          displayName: user.displayName,
        });
        console.log(`  ✓ Created auth user: ${user.email}`);
      }
    } catch (err) {
      console.error(`  ✗ Failed to create ${user.email}:`, err);
    }
  }
}

async function seedOrganization(): Promise<void> {
  console.log('\n[2/6] Seeding organization...');

  await db.collection('organizations').doc(E2E_ORG_ID).set({
    ...E2E_ORG,
    updatedAt: Timestamp.now(),
  }, { merge: true });

  console.log(`  ✓ Organization: ${E2E_ORG.name}`);
}

async function seedUsers(): Promise<void> {
  console.log('\n[3/6] Seeding user profiles...');

  const batch = db.batch();
  const usersRef = db.collection('users');

  for (const user of E2E_USERS) {
    const userRef = usersRef.doc(user.uid);
    batch.set(userRef, {
      ...user,
      orgId: E2E_ORG_ID,
      isActive: true,
      onboardingCompleted: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }

  await batch.commit();
  console.log(`  ✓ Created ${E2E_USERS.length} user profiles`);
}

async function seedClients(): Promise<void> {
  console.log('\n[4/6] Seeding clients...');

  const batch = db.batch();
  const clientsRef = db.collection('organizations').doc(E2E_ORG_ID).collection('clients');

  for (const client of E2E_CLIENTS) {
    const clientRef = clientsRef.doc(client.id);
    batch.set(clientRef, {
      ...client,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }

  await batch.commit();
  console.log(`  ✓ Created ${E2E_CLIENTS.length} clients`);
}

async function seedProjects(): Promise<void> {
  console.log('\n[5/6] Seeding projects, tasks, invoices, and bids...');

  const batch = db.batch();
  const orgRef = db.collection('organizations').doc(E2E_ORG_ID);

  // Projects
  for (const project of E2E_PROJECTS) {
    const projectRef = orgRef.collection('projects').doc(project.id);
    batch.set(projectRef, {
      ...project,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }
  console.log(`  → ${E2E_PROJECTS.length} projects`);

  // Tasks
  for (const task of E2E_TASKS) {
    const taskRef = orgRef.collection('tasks').doc(task.id);
    batch.set(taskRef, {
      ...task,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }
  console.log(`  → ${E2E_TASKS.length} tasks`);

  // Invoices
  for (const invoice of E2E_INVOICES) {
    const invoiceRef = orgRef.collection('invoices').doc(invoice.id);
    batch.set(invoiceRef, {
      ...invoice,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }
  console.log(`  → ${E2E_INVOICES.length} invoices`);

  // Bids
  for (const bid of E2E_BIDS) {
    const bidRef = orgRef.collection('bids').doc(bid.id);
    batch.set(bidRef, {
      ...bid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }
  console.log(`  → ${E2E_BIDS.length} bids`);

  await batch.commit();
  console.log('  ✓ All project data seeded');
}

async function seedAdditionalData(): Promise<void> {
  console.log('\n[6/6] Seeding additional test data...');

  const batch = db.batch();
  const orgRef = db.collection('organizations').doc(E2E_ORG_ID);

  // Time entries for employee
  const timeEntries = [
    {
      id: 'e2e-time-1',
      userId: 'e2e-user-employee',
      projectId: 'e2e-project-active',
      date: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
      clockIn: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000)),
      clockOut: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000)),
      hours: 8,
      status: 'approved',
    },
    {
      id: 'e2e-time-2',
      userId: 'e2e-user-field',
      projectId: 'e2e-project-active',
      date: Timestamp.fromDate(new Date()),
      clockIn: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
      clockOut: null,
      hours: null,
      status: 'active',
    },
  ];

  for (const entry of timeEntries) {
    const entryRef = orgRef.collection('timeEntries').doc(entry.id);
    batch.set(entryRef, entry, { merge: true });
  }
  console.log(`  → ${timeEntries.length} time entries`);

  // Expenses
  const expenses = [
    {
      id: 'e2e-expense-1',
      projectId: 'e2e-project-active',
      userId: 'e2e-user-employee',
      category: 'materials',
      vendor: 'Home Depot',
      amount: 450.00,
      description: 'Cabinet hardware',
      status: 'pending',
      date: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
    },
    {
      id: 'e2e-expense-2',
      projectId: 'e2e-project-active',
      userId: 'e2e-user-pm',
      category: 'materials',
      vendor: 'Tile Shop',
      amount: 2350.00,
      description: 'Backsplash tile',
      status: 'approved',
      date: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    },
  ];

  for (const expense of expenses) {
    const expenseRef = orgRef.collection('expenses').doc(expense.id);
    batch.set(expenseRef, expense, { merge: true });
  }
  console.log(`  → ${expenses.length} expenses`);

  // Daily logs
  const dailyLogs = [
    {
      id: 'e2e-log-1',
      projectId: 'e2e-project-active',
      userId: 'e2e-user-field',
      date: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
      weather: 'sunny',
      temperature: 72,
      workSummary: 'Completed cabinet installation in kitchen. Began prep work for countertop template.',
      safetyNotes: 'No incidents. All PPE worn.',
    },
  ];

  for (const log of dailyLogs) {
    const logRef = orgRef.collection('dailyLogs').doc(log.id);
    batch.set(logRef, log, { merge: true });
  }
  console.log(`  → ${dailyLogs.length} daily logs`);

  await batch.commit();
  console.log('  ✓ Additional data seeded');
}

// ============================================
// Main Execution
// ============================================

async function main(): Promise<void> {
  console.log('═'.repeat(60));
  console.log('  E2E TEST DATA SEED');
  console.log('  Organization: E2E Test Construction Co.');
  console.log('  Database: contractoros (named)');
  console.log('═'.repeat(60));

  try {
    await createFirebaseAuthUsers();
    await seedOrganization();
    await seedUsers();
    await seedClients();
    await seedProjects();
    await seedAdditionalData();

    console.log('\n' + '═'.repeat(60));
    console.log('  ✅ E2E TEST DATA SEED COMPLETE');
    console.log('═'.repeat(60));
    console.log('\nTest users created:');
    for (const user of E2E_USERS) {
      console.log(`  • ${user.displayName} (${user.role}): ${user.email}`);
    }
    console.log(`\nPassword for all users: ${E2E_PASSWORD}`);

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

main();
```

### 3.2 NPM Scripts

Add to `apps/web/package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report e2e/playwright-report",
    "test:e2e:smoke": "playwright test --grep @smoke",
    "test:e2e:rbac": "playwright test --grep @rbac",
    "test:e2e:mobile": "playwright test --project=mobile-chrome --project=mobile-safari",
    "e2e:seed": "cd ../../scripts/seed-demo && npx ts-node seed-e2e-test-data.ts",
    "e2e:setup": "npm run e2e:seed && npx playwright install"
  }
}
```

---

## Phase 4: Example Test Suites

### 4.1 Smoke Tests

**File:** `apps/web/e2e/playwright/suites/smoke.spec.ts`

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Smoke Tests @smoke', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ContractorOS/);
  });

  test('login page accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('dashboard loads for authenticated user', async ({ page }) => {
    // Uses owner auth state by default
    await page.goto('/dashboard');
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('client portal accessible', async ({ page }) => {
    await page.goto('/client');
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/(login|client)/);
  });
});
```

### 4.2 RBAC Tests

**File:** `apps/web/e2e/playwright/suites/rbac.spec.ts`

```typescript
import {
  ownerTest,
  pmTest,
  financeTest,
  employeeTest,
  clientTest,
  expect
} from '../fixtures/test-fixtures';

ownerTest.describe('Owner RBAC @rbac', () => {
  ownerTest('can access all dashboard sections', async ({ page }) => {
    await page.goto('/dashboard');

    // Check sidebar navigation items
    await expect(page.getByRole('link', { name: /projects/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /clients/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /team/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /finances/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
  });

  ownerTest('can access payroll', async ({ page }) => {
    await page.goto('/dashboard/payroll');
    await expect(page.getByRole('heading', { name: /payroll/i })).toBeVisible();
  });

  ownerTest('can access organization settings', async ({ page }) => {
    await page.goto('/dashboard/settings/organization');
    await expect(page).toHaveURL(/settings\/organization/);
  });
});

pmTest.describe('PM RBAC @rbac', () => {
  pmTest('can access projects', async ({ page }) => {
    await page.goto('/dashboard/projects');
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();
  });

  pmTest('cannot access payroll', async ({ page }) => {
    await page.goto('/dashboard/payroll');
    // Should redirect or show access denied
    await expect(page.getByText(/access denied|unauthorized/i)).toBeVisible()
      .catch(() => expect(page).not.toHaveURL(/payroll/));
  });

  pmTest('cannot access organization settings', async ({ page }) => {
    await page.goto('/dashboard/settings/organization');
    await expect(page).not.toHaveURL(/settings\/organization/);
  });
});

financeTest.describe('Finance RBAC @rbac', () => {
  financeTest('can access invoices', async ({ page }) => {
    await page.goto('/dashboard/invoices');
    await expect(page.getByRole('heading', { name: /invoices/i })).toBeVisible();
  });

  financeTest('can access payroll', async ({ page }) => {
    await page.goto('/dashboard/payroll');
    await expect(page.getByRole('heading', { name: /payroll/i })).toBeVisible();
  });

  financeTest('cannot manage team roles', async ({ page }) => {
    await page.goto('/dashboard/team');
    // Should not see role management options
    await expect(page.getByRole('button', { name: /change role/i })).not.toBeVisible();
  });
});

employeeTest.describe('Employee RBAC @rbac', () => {
  employeeTest('sees limited navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Should see assigned work
    await expect(page.getByRole('link', { name: /my tasks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /time/i })).toBeVisible();

    // Should NOT see admin features
    await expect(page.getByRole('link', { name: /settings/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /finances/i })).not.toBeVisible();
  });

  employeeTest('can only view assigned projects', async ({ page }) => {
    await page.goto('/dashboard/projects');
    // Should only see projects they're assigned to
    await expect(page.getByText('E2E Active Kitchen Remodel')).toBeVisible();
  });
});

clientTest.describe('Client Portal RBAC @rbac', () => {
  clientTest('redirected to client portal', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/client/);
  });

  clientTest('can view own projects only', async ({ page }) => {
    await page.goto('/client');
    await expect(page.getByText('E2E Active Kitchen Remodel')).toBeVisible();
    // Should not see commercial project
    await expect(page.getByText('E2E Office Buildout')).not.toBeVisible();
  });

  clientTest('can view and pay invoices', async ({ page }) => {
    await page.goto('/client/invoices');
    await expect(page.getByText('$25,000')).toBeVisible(); // Sent invoice
  });
});
```

### 4.3 Portal-Specific Tests

**File:** `apps/web/e2e/playwright/suites/portals/client-portal.spec.ts`

```typescript
import { clientTest, expect } from '../../fixtures/test-fixtures';

clientTest.describe('Client Portal @portal @client', () => {
  clientTest.beforeEach(async ({ page }) => {
    await page.goto('/client');
  });

  clientTest('displays project dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /my projects/i })).toBeVisible();
  });

  clientTest('can view project details', async ({ page }) => {
    await page.getByText('E2E Active Kitchen Remodel').click();
    await expect(page.getByText('Kitchen Remodel')).toBeVisible();
    await expect(page.getByText('$75,000')).toBeVisible(); // Budget
  });

  clientTest('can view and approve selections', async ({ page }) => {
    await page.goto('/client/selections');
    await expect(page.getByRole('heading', { name: /selections/i })).toBeVisible();
  });

  clientTest('can send messages to contractor', async ({ page }) => {
    await page.goto('/client/messages');
    await expect(page.getByRole('textbox', { name: /message/i })).toBeVisible();
  });

  clientTest('can view project photos', async ({ page }) => {
    await page.goto('/client/photos');
    await expect(page.getByRole('heading', { name: /photos/i })).toBeVisible();
  });

  clientTest('can view documents and sign', async ({ page }) => {
    await page.goto('/client/documents');
    await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible();
  });
});
```

---

## Phase 5: CI/CD Integration

### 5.1 GitHub Actions Workflow

**File:** `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      test_suite:
        description: 'Test suite to run'
        required: false
        default: 'all'
        type: choice
        options:
          - all
          - smoke
          - rbac
          - mobile

env:
  BASE_URL: ${{ secrets.E2E_BASE_URL || 'http://localhost:3000' }}
  E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/web/package-lock.json

      - name: Install dependencies
        run: |
          cd apps/web
          npm ci

      - name: Install Playwright browsers
        run: |
          cd apps/web
          npx playwright install --with-deps

      - name: Seed E2E test data
        run: |
          cd scripts/seed-demo
          npm install
          npx ts-node seed-e2e-test-data.ts
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}

      - name: Run E2E tests
        run: |
          cd apps/web
          if [ "${{ github.event.inputs.test_suite }}" = "smoke" ]; then
            npm run test:e2e:smoke
          elif [ "${{ github.event.inputs.test_suite }}" = "rbac" ]; then
            npm run test:e2e:rbac
          elif [ "${{ github.event.inputs.test_suite }}" = "mobile" ]; then
            npm run test:e2e:mobile
          else
            npm run test:e2e
          fi

      - name: Upload test report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: apps/web/e2e/playwright-report/
          retention-days: 30

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: apps/web/test-results/
          retention-days: 7
```

### 5.2 Pre-commit Hook (Optional)

**File:** `.husky/pre-push`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run smoke tests before push
cd apps/web && npm run test:e2e:smoke
```

---

## Phase 6: Page Object Models

### 6.1 Login Page

**File:** `apps/web/e2e/playwright/fixtures/page-objects/login.page.ts`

```typescript
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: /sign in/i });
    this.errorMessage = page.getByRole('alert');
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async expectError(message: string | RegExp) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectRedirectToDashboard() {
    await expect(this.page).toHaveURL(/\/(dashboard|client|sub|field)/);
  }
}
```

### 6.2 Dashboard Page

**File:** `apps/web/e2e/playwright/fixtures/page-objects/dashboard.page.ts`

```typescript
import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly projectsLink: Locator;
  readonly clientsLink: Locator;
  readonly teamLink: Locator;
  readonly financesLink: Locator;
  readonly settingsLink: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.getByRole('navigation');
    this.projectsLink = page.getByRole('link', { name: /projects/i });
    this.clientsLink = page.getByRole('link', { name: /clients/i });
    this.teamLink = page.getByRole('link', { name: /team/i });
    this.financesLink = page.getByRole('link', { name: /finances/i });
    this.settingsLink = page.getByRole('link', { name: /settings/i });
    this.userMenu = page.getByRole('button', { name: /user menu/i });
    this.logoutButton = page.getByRole('menuitem', { name: /logout/i });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async navigateTo(section: 'projects' | 'clients' | 'team' | 'finances' | 'settings') {
    const links = {
      projects: this.projectsLink,
      clients: this.clientsLink,
      team: this.teamLink,
      finances: this.financesLink,
      settings: this.settingsLink,
    };
    await links[section].click();
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await expect(this.page).toHaveURL(/\/login/);
  }

  async expectNavItemVisible(item: string) {
    await expect(this.page.getByRole('link', { name: new RegExp(item, 'i') })).toBeVisible();
  }

  async expectNavItemHidden(item: string) {
    await expect(this.page.getByRole('link', { name: new RegExp(item, 'i') })).not.toBeVisible();
  }
}
```

---

## Implementation Timeline

| Phase | Tasks | Estimated Effort |
|-------|-------|------------------|
| **Phase 1** | Playwright setup, config, directory structure | 2-3 hours |
| **Phase 2** | Test users, auth fixtures, auth setup script | 3-4 hours |
| **Phase 3** | E2E seed script with full demo data | 4-5 hours |
| **Phase 4** | Core test suites (smoke, RBAC, portals) | 6-8 hours |
| **Phase 5** | CI/CD integration | 2-3 hours |
| **Phase 6** | Page Object Models | 4-5 hours |

**Total estimated effort:** 21-28 hours

---

## Files to Create

```
apps/web/
├── playwright.config.ts                          # Playwright configuration
├── e2e/
│   └── playwright/
│       ├── setup/
│       │   └── auth.setup.ts                     # Auth state generation
│       ├── fixtures/
│       │   ├── test-users.ts                     # Test user definitions
│       │   ├── test-fixtures.ts                  # Custom fixtures
│       │   └── page-objects/
│       │       ├── login.page.ts
│       │       ├── dashboard.page.ts
│       │       ├── projects.page.ts
│       │       └── clients.page.ts
│       ├── suites/
│       │   ├── smoke.spec.ts
│       │   ├── auth.spec.ts
│       │   ├── rbac.spec.ts
│       │   ├── projects.spec.ts
│       │   ├── clients.spec.ts
│       │   ├── team.spec.ts
│       │   ├── finances.spec.ts
│       │   └── portals/
│       │       ├── client-portal.spec.ts
│       │       ├── sub-portal.spec.ts
│       │       └── field-portal.spec.ts
│       ├── utils/
│       │   └── helpers.ts
│       └── .auth/                                # Auth states (gitignored)
│           └── .gitkeep

scripts/seed-demo/
└── seed-e2e-test-data.ts                         # E2E test data seeder

.github/workflows/
└── e2e-tests.yml                                 # CI/CD workflow
```

---

## Next Steps

1. **Review this plan** and confirm scope
2. **Phase 1:** Install Playwright and create config
3. **Phase 3:** Create seed script (can run in parallel with Phase 2)
4. **Phase 2:** Create test user fixtures and auth setup
5. **Phase 4:** Implement test suites incrementally
6. **Phase 5:** Set up CI/CD
7. **Phase 6:** Add Page Object Models for maintainability

---

## Questions to Confirm

1. Should E2E tests run against a dedicated Firebase project or the main `contractoros-483812` project with isolated test org?
2. Do you want test data cleanup scripts (delete all e2e- prefixed data)?
3. Any additional user roles beyond the 8 defined (e.g., read-only viewer)?
4. Preferred test tagging strategy (@smoke, @rbac, @critical, @regression)?
