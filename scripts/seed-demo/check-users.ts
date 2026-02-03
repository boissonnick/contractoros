import * as admin from 'firebase-admin';
import { applicationDefault } from 'firebase-admin/app';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: applicationDefault(),
    projectId: 'contractoros-483812',
  });
}

import { getDb } from "./db";
const db = getDb();

async function check() {
  const allUsers = await db.collection('users').limit(30).get();
  console.log('All users (up to 30):');
  allUsers.docs.forEach((d) => {
    const data = d.data();
    console.log('  uid:', d.id, '| email:', data.email, '| orgId:', data.orgId);
  });
}

check().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
