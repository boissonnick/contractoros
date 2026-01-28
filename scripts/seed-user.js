#!/usr/bin/env node
/**
 * Seed a user profile in Firestore for testing
 *
 * Usage:
 *   node scripts/seed-user.js <uid> <email> <orgId>
 *
 * Example:
 *   node scripts/seed-user.js abc123 test@example.com org-001
 *
 * This creates a user document and org document if they don't exist.
 */

const admin = require('firebase-admin');

// Initialize with default credentials (uses GOOGLE_APPLICATION_CREDENTIALS or gcloud auth)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'contractoros-483812',
  });
}

const db = admin.firestore();

async function seedUser(uid, email, orgId) {
  if (!uid || !email) {
    console.error('Usage: node scripts/seed-user.js <uid> <email> [orgId]');
    console.error('Example: node scripts/seed-user.js abc123 test@example.com');
    process.exit(1);
  }

  const finalOrgId = orgId || `org-${uid.slice(0, 8)}`;

  console.log(`Creating user profile for UID: ${uid}`);
  console.log(`Email: ${email}`);
  console.log(`Org ID: ${finalOrgId}`);

  try {
    // Check if org exists, create if not
    const orgRef = db.collection('organizations').doc(finalOrgId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      console.log('Creating organization...');
      await orgRef.set({
        id: finalOrgId,
        name: 'Test Organization',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ownerId: uid,
      });
      console.log('Organization created.');
    } else {
      console.log('Organization already exists.');
    }

    // Create or update user profile
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    const userData = {
      uid: uid,
      email: email,
      displayName: email.split('@')[0],
      role: 'OWNER',
      orgId: finalOrgId,
      isActive: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!userDoc.exists) {
      userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await userRef.set(userData);
      console.log('User profile created.');
    } else {
      await userRef.update(userData);
      console.log('User profile updated.');
    }

    console.log('\nDone! Refresh your browser to see the changes.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const [,, uid, email, orgId] = process.argv;
seedUser(uid, email, orgId);
