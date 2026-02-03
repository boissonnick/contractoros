/**
 * Shared Firestore database connection for seed scripts
 *
 * IMPORTANT: This project uses a NAMED Firestore database called "contractoros"
 * All seed scripts MUST use this module to ensure data goes to the correct database.
 */

import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const CONFIG = {
  projectId: 'contractoros-483812',
  databaseId: 'contractoros', // CRITICAL: Named database, NOT default!
  serviceAccountPath: path.join(__dirname, 'service-account.json'),
};

let _db: Firestore | null = null;

/**
 * Get the Firestore database instance connected to the "contractoros" named database.
 * This is a singleton - multiple calls return the same instance.
 */
export function getDb(): Firestore {
  if (_db) return _db;

  // Initialize app if not already done
  let app;
  if (getApps().length === 0) {
    let credential;
    if (fs.existsSync(CONFIG.serviceAccountPath)) {
      credential = cert(JSON.parse(fs.readFileSync(CONFIG.serviceAccountPath, 'utf8')));
    } else {
      credential = applicationDefault();
    }
    app = initializeApp({ credential, projectId: CONFIG.projectId });
  } else {
    app = getApps()[0];
  }

  // CRITICAL: Use named database "contractoros"
  _db = getFirestore(app, CONFIG.databaseId);

  console.log(`[db] Connected to Firestore database: ${CONFIG.databaseId}`);

  return _db;
}

export { CONFIG };
