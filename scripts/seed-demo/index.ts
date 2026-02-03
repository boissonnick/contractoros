/**
 * Demo Data Seed Script
 * Creates "Horizon Construction Co." with 12 months of realistic data
 *
 * Usage:
 *   npx ts-node scripts/seed-demo/index.ts
 *
 * Prerequisites:
 *   - Place service-account.json in scripts/seed-demo/
 *   - Or set GOOGLE_APPLICATION_CREDENTIALS environment variable
 *
 * This script creates:
 *   - 1 Organization (Horizon Construction Co.)
 *   - 7 Users (owner, PM, foreman, 3 field workers, 1 admin)
 *   - 8 Clients (5 residential, 3 commercial)
 *   - Projects, financials, time entries, activities (via separate modules)
 */

import { initializeApp, cert, applicationDefault, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Import seed modules
import { seedOrganization } from './seed-organization';
import { seedUsers } from './seed-users';
import { seedClients } from './seed-clients';
// Note: seedProjects runs standalone (npx ts-node scripts/seed-demo/seed-projects.ts)
import { seedInvoices, getInvoiceSummary } from './seed-financials';
import { seedPayments, getPaymentSummary } from './seed-payments';
import { seedExpenses, getExpenseSummary } from './seed-expenses';
import { seedTimeEntries, getTimeEntrySummary } from './seed-time-entries';
// import { seedActivities } from './seed-activities';

import { DEMO_ORG_ID, logSection, logSuccess, logWarning } from './utils';

// Configuration
const CONFIG = {
  projectId: 'contractoros-483812',
  serviceAccountPath: path.join(__dirname, 'service-account.json'),
};

async function initializeFirebase(): Promise<FirebaseFirestore.Firestore> {
  console.log('Initializing Firebase Admin SDK...');

  let credential;

  // Check for service account file
  if (fs.existsSync(CONFIG.serviceAccountPath)) {
    console.log(`  Using service account: ${CONFIG.serviceAccountPath}`);
    const serviceAccount = JSON.parse(
      fs.readFileSync(CONFIG.serviceAccountPath, 'utf8')
    ) as ServiceAccount;
    credential = cert(serviceAccount);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log(`  Using GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    const serviceAccount = JSON.parse(
      fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')
    ) as ServiceAccount;
    credential = cert(serviceAccount);
  } else {
    // Try default credentials (gcloud auth application-default)
    console.log('  Using default application credentials (gcloud auth)');
    credential = applicationDefault();
  }

  const app = initializeApp({
    credential,
    projectId: CONFIG.projectId,
  });

  // Use named database "contractoros" to match the app's configuration
  const db = getFirestore(app, 'contractoros');

  // Verify connection
  try {
    await db.collection('_healthcheck').doc('test').get();
    console.log('  Firestore connection verified');
  } catch (error) {
    throw new Error(`Failed to connect to Firestore: ${error}`);
  }

  return db;
}

async function checkExistingData(db: FirebaseFirestore.Firestore): Promise<boolean> {
  const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);
  const orgDoc = await orgRef.get();
  return orgDoc.exists;
}

async function main() {
  console.log('\n');
  console.log('='.repeat(60));
  console.log('  ContractorOS Demo Data Seed Script');
  console.log('  Horizon Construction Co. - Denver, CO');
  console.log('='.repeat(60));
  console.log('\n');

  try {
    // Initialize Firebase
    const db = await initializeFirebase();

    // Check for existing data
    const dataExists = await checkExistingData(db);
    if (dataExists) {
      logWarning('Demo organization already exists!');
      logWarning('Existing data will be updated/merged.');
      console.log('\n');
    }

    // Seed organization
    const { orgId } = await seedOrganization(db);

    // Seed users
    const { userCount } = await seedUsers(db, orgId);

    // Seed clients
    const { clientCount } = await seedClients(db, orgId);

    // Note: Projects should be seeded separately:
    // npx ts-node scripts/seed-demo/seed-projects.ts

    // Seed financials
    const { count: invoiceCount } = await seedInvoices(db, orgId);
    const { count: paymentCount } = await seedPayments(db, orgId);
    const { count: expenseCount } = await seedExpenses(db, orgId);
    const { count: timeEntryCount } = await seedTimeEntries(db, orgId);

    // await seedActivities(db, orgId);

    // Get summaries for display
    const invoiceSummary = getInvoiceSummary();
    const paymentSummary = getPaymentSummary();
    const expenseSummary = getExpenseSummary();
    const timeSummary = getTimeEntrySummary();

    // Summary
    logSection('Seed Complete!');
    console.log('\n  Summary:');
    console.log(`    Organization: Horizon Construction Co.`);
    console.log(`    Org ID: ${orgId}`);
    console.log(`    Users: ${userCount}`);
    console.log(`    Clients: ${clientCount}`);
    console.log(`\n  Financials:`);
    console.log(`    Invoices: ${invoiceCount} (${invoiceSummary.paid} paid, ${invoiceSummary.current} current, ${invoiceSummary.overdue} overdue)`);
    console.log(`    Payments: ${paymentCount} ($${paymentSummary.totalAmount.toLocaleString()} total)`);
    console.log(`    Expenses: ${expenseCount} ($${Math.round(expenseSummary.totalAmount).toLocaleString()} total)`);
    console.log(`    Time Entries: ${timeEntryCount} (${timeSummary.totalHours} hours)`);
    console.log('\n  Demo accounts:');
    console.log('    Owner:   mike@horizonconstruction.demo');
    console.log('    PM:      sarah@horizonconstruction.demo');
    console.log('    Foreman: carlos@horizonconstruction.demo');
    console.log('\n  Note: These are demo accounts with .demo email domain.');
    console.log('  To log in, create Firebase Auth users with these emails');
    console.log('  or use Firebase Auth emulator.\n');

    logSuccess('Demo data seeded successfully!');

  } catch (error) {
    console.error('\n  ERROR: Seed failed');
    console.error(`  ${error}`);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
