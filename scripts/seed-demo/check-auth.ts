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
const orgId = 'u8hwVPLEv4YL9D71ymBwCOrmKta2';

async function check() {
  const org = await db.collection('organizations').doc(orgId).get();
  if (org.exists) {
    const data = org.data();
    console.log('Organization owner info:');
    console.log('  ownerUid:', data?.ownerUid);
    console.log('  name:', data?.name);
  }

  // Try to list Firebase Auth users
  const auth = admin.auth();
  try {
    const listResult = await auth.listUsers(20);
    console.log('\nFirebase Auth users:');
    listResult.users.forEach((user) => {
      console.log('  uid:', user.uid, '| email:', user.email);
    });
  } catch (e: any) {
    console.log('Could not list auth users:', e.message);
  }
}

check().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
