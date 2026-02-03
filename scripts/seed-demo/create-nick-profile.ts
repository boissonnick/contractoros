import * as admin from 'firebase-admin';
import { applicationDefault } from 'firebase-admin/app';
import { Timestamp } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: applicationDefault(),
    projectId: 'contractoros-483812',
  });
}

import { getDb } from "./db";
const db = getDb();

async function createProfile() {
  const uid = 'u8hwVPLEv4YL9D71ymBwCOrmKta2';
  const orgId = 'u8hwVPLEv4YL9D71ymBwCOrmKta2';

  const userProfile = {
    uid,
    orgId,
    email: 'nick@aroutewest.com',
    displayName: 'Nick Bodkins',
    role: 'OWNER',
    phone: '',
    photoURL: null,
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  console.log('Creating user profile for nick@aroutewest.com...');
  console.log('  UID:', uid);
  console.log('  OrgId:', orgId);

  await db.collection('users').doc(uid).set(userProfile, { merge: true });

  console.log('User profile created successfully!');

  // Also update the organization to have nick as the owner
  await db.collection('organizations').doc(orgId).update({
    ownerUid: uid,
    updatedAt: Timestamp.now(),
  });

  console.log('Organization owner updated to nick.');
}

createProfile().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
