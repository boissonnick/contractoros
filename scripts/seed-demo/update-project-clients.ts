/**
 * Update Demo Project Clients
 * Sprint 38 - CLI 1, Task 1
 *
 * Links demo clients to demo projects
 */

import * as admin from 'firebase-admin';
import {
  DEMO_ORG_ID,
  logSection,
  logProgress,
  logSuccess,
} from './utils';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'contractoros-483812',
  });
}

import { getDb } from "./db";
const db = getDb();

// Client to project mappings (must match DEMO_CLIENTS in utils.ts)
const PROJECT_CLIENT_MAP: Record<string, { clientId: string; clientName: string }> = {
  'demo-proj-smith-kitchen': { clientId: 'demo-client-smith', clientName: 'Robert Smith' },
  'demo-proj-smith-bathroom': { clientId: 'demo-client-smith', clientName: 'Robert Smith' },
  'demo-proj-garcia-bath': { clientId: 'demo-client-garcia', clientName: 'Maria Garcia' },
  'demo-proj-garcia-basement': { clientId: 'demo-client-garcia', clientName: 'Maria Garcia' },
  'demo-proj-thompson-deck': { clientId: 'demo-client-thompson', clientName: 'James Thompson' },
  'demo-proj-thompson-garage': { clientId: 'demo-client-thompson', clientName: 'James Thompson' },
  'demo-proj-wilson-fence': { clientId: 'demo-client-wilson', clientName: 'Jennifer Wilson' },
  'demo-proj-wilson-pool': { clientId: 'demo-client-wilson', clientName: 'Jennifer Wilson' },
  'demo-proj-brown-kitchen': { clientId: 'demo-client-brown', clientName: 'Michael Brown' },
  'demo-proj-mainst-retail': { clientId: 'demo-client-main-st-retail', clientName: 'Main Street Retail Group' },
  'demo-proj-cafe-ti': { clientId: 'demo-client-downtown-cafe', clientName: 'Downtown Cafe LLC' },
  'demo-proj-office-park': { clientId: 'demo-client-office-park', clientName: 'Office Park LLC' },
};

async function updateProjectClients(): Promise<number> {
  logSection('Updating Project Clients');

  // NOTE: Projects are stored in top-level 'projects' collection, NOT subcollection
  const projectsRef = db.collection('projects');

  // Get all demo projects for this org
  const snapshot = await projectsRef
    .where('orgId', '==', DEMO_ORG_ID)
    .where('isDemoData', '==', true)
    .get();

  if (snapshot.empty) {
    logProgress('No demo projects found');
    return 0;
  }

  let updatedCount = 0;
  const batch = db.batch();

  for (const doc of snapshot.docs) {
    const projectId = doc.id;
    const clientInfo = PROJECT_CLIENT_MAP[projectId];

    if (clientInfo) {
      logProgress(`Linking ${projectId} to ${clientInfo.clientName}`);

      batch.update(doc.ref, {
        clientId: clientInfo.clientId,
        clientName: clientInfo.clientName,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      updatedCount++;
    }
  }

  await batch.commit();
  logSuccess(`Updated ${updatedCount} projects with client assignments`);

  return updatedCount;
}

// Run if executed directly
if (require.main === module) {
  updateProjectClients()
    .then((count) => {
      console.log(`\n✅ Updated ${count} project-client links`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error updating project clients:', error);
      process.exit(1);
    });
}

export { updateProjectClients };
