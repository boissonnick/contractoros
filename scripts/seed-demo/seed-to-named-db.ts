/**
 * Seed demo data to the named "contractoros" database
 * This script copies the essential data to the correct database that the app uses
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const CONFIG = {
  projectId: 'contractoros-483812',
  serviceAccountPath: path.join(__dirname, 'service-account.json'),
  databaseId: 'contractoros', // Named database the app uses
};

async function main() {
  console.log('='.repeat(60));
  console.log('  Seeding to named database: contractoros');
  console.log('='.repeat(60));

  // Initialize Firebase
  let credential;
  if (fs.existsSync(CONFIG.serviceAccountPath)) {
    credential = cert(JSON.parse(fs.readFileSync(CONFIG.serviceAccountPath, 'utf8')));
  } else {
    credential = applicationDefault();
  }

  const app = initializeApp({
    credential,
    projectId: CONFIG.projectId,
  });

  // Connect to the NAMED database "contractoros"
  const db = getFirestore(app, CONFIG.databaseId);

  console.log('\nConnected to database:', CONFIG.databaseId);

  const orgId = 'u8hwVPLEv4YL9D71ymBwCOrmKta2';
  const now = Timestamp.now();

  // 1. Create user profile for nick
  console.log('\n1. Creating user profile...');
  await db.collection('users').doc(orgId).set({
    uid: orgId,
    orgId: orgId,
    email: 'nick@aroutewest.com',
    displayName: 'Nick Bodkins',
    role: 'OWNER',
    phone: '',
    photoURL: null,
    isActive: true,
    onboardingCompleted: true,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
  console.log('   ✓ User profile created');

  // 2. Create organization
  console.log('\n2. Creating organization...');
  await db.collection('organizations').doc(orgId).set({
    id: orgId,
    name: 'Horizon Construction Co.',
    ownerUid: orgId,
    address: '1500 Market Street, Suite 200, Denver, CO 80202',
    phone: '(303) 555-0100',
    email: 'info@horizonconstruction.demo',
    plan: 'professional',
    onboardingCompleted: true,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
  console.log('   ✓ Organization created');

  // 3. Create demo clients
  console.log('\n3. Creating clients...');
  const clients = [
    { id: 'demo-client-smith', firstName: 'Robert', lastName: 'Smith', email: 'robert.smith@email.demo', phone: '(303) 555-1001', isCommercial: false, status: 'active' },
    { id: 'demo-client-garcia', firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@email.demo', phone: '(303) 555-1002', isCommercial: false, status: 'active' },
    { id: 'demo-client-thompson', firstName: 'James', lastName: 'Thompson', email: 'james.thompson@email.demo', phone: '(303) 555-1003', isCommercial: false, status: 'past' },
    { id: 'demo-client-wilson', firstName: 'Jennifer', lastName: 'Wilson', email: 'jennifer.wilson@email.demo', phone: '(303) 555-1004', isCommercial: false, status: 'active' },
    { id: 'demo-client-brown', firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@email.demo', phone: '(303) 555-1005', isCommercial: false, status: 'potential' },
    { id: 'demo-client-downtown-cafe', firstName: 'Tom', lastName: 'Richards', companyName: 'Downtown Cafe LLC', email: 'tom@downtowncafe.demo', phone: '(303) 555-2001', isCommercial: true, status: 'past' },
    { id: 'demo-client-main-st-retail', firstName: 'Susan', lastName: 'Martinez', companyName: 'Main Street Retail Group', email: 'susan@mainstreet.demo', phone: '(303) 555-2002', isCommercial: true, status: 'active' },
    { id: 'demo-client-office-park', firstName: 'David', lastName: 'Anderson', companyName: 'Office Park LLC', email: 'david@officeparkllc.demo', phone: '(303) 555-2003', isCommercial: true, status: 'active' },
  ];

  const clientsRef = db.collection('organizations').doc(orgId).collection('clients');
  for (const client of clients) {
    const displayName = client.companyName || `${client.firstName} ${client.lastName}`;
    await clientsRef.doc(client.id).set({
      ...client,
      orgId,
      displayName,
      notes: [],
      projectIds: [],
      financials: {
        lifetimeValue: Math.floor(Math.random() * 150000) + 10000,
        totalProjects: Math.floor(Math.random() * 5) + 1,
        completedProjects: Math.floor(Math.random() * 3),
        activeProjects: Math.floor(Math.random() * 2),
        outstandingBalance: Math.floor(Math.random() * 20000),
        averageProjectValue: Math.floor(Math.random() * 50000) + 10000,
      },
      createdAt: now,
      updatedAt: now,
    }, { merge: true });
    console.log(`   ✓ ${displayName}`);
  }

  // 4. Create some projects
  console.log('\n4. Creating projects...');
  const projects = [
    { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel', clientId: 'demo-client-smith', status: 'active', category: 'renovation', address: { street: '1234 Maple Street', city: 'Denver', state: 'CO', zip: '80202' } },
    { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath', clientId: 'demo-client-garcia', status: 'active', category: 'renovation', address: { street: '567 Oak Avenue', city: 'Lakewood', state: 'CO', zip: '80226' } },
    { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront', clientId: 'demo-client-main-st-retail', status: 'active', category: 'commercial', address: { street: '250 Main Street', city: 'Denver', state: 'CO', zip: '80202' } },
    { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI', clientId: 'demo-client-downtown-cafe', status: 'completed', category: 'commercial', address: { street: '100 Main Street', city: 'Denver', state: 'CO', zip: '80202' } },
    { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build', clientId: 'demo-client-thompson', status: 'completed', category: 'outdoor', address: { street: '890 Pine Road', city: 'Aurora', state: 'CO', zip: '80012' } },
  ];

  for (const project of projects) {
    await db.collection('projects').doc(project.id).set({
      ...project,
      orgId,
      description: `Demo project: ${project.name}`,
      budget: Math.floor(Math.random() * 100000) + 20000,
      startDate: now,
      createdAt: now,
      updatedAt: now,
    }, { merge: true });
    console.log(`   ✓ ${project.name}`);
  }

  // 5. Create some tasks
  console.log('\n5. Creating tasks...');
  const taskTitles = [
    'Frame kitchen walls', 'Install electrical rough-in', 'Plumbing rough-in',
    'Drywall installation', 'Cabinet installation', 'Countertop templating',
    'Tile backsplash', 'Paint walls', 'Install fixtures', 'Final walkthrough'
  ];

  for (let i = 0; i < 20; i++) {
    const projectIndex = i % projects.length;
    await db.collection('tasks').doc(`demo-task-${i}`).set({
      id: `demo-task-${i}`,
      orgId,
      projectId: projects[projectIndex].id,
      title: taskTitles[i % taskTitles.length],
      description: 'Demo task description',
      status: ['pending', 'in_progress', 'completed'][Math.floor(Math.random() * 3)],
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      createdAt: now,
      updatedAt: now,
    }, { merge: true });
  }
  console.log('   ✓ 20 tasks created');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  SEED COMPLETE');
  console.log('='.repeat(60));
  console.log(`\n  Database: ${CONFIG.databaseId}`);
  console.log(`  Org ID: ${orgId}`);
  console.log(`  User: nick@aroutewest.com`);
  console.log(`  Clients: ${clients.length}`);
  console.log(`  Projects: ${projects.length}`);
  console.log(`  Tasks: 20`);
  console.log('\n  Refresh your browser to see the data!\n');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
