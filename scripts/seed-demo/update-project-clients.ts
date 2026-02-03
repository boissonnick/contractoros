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

// Client to project mappings
const PROJECT_CLIENT_MAP: Record<string, { clientId: string; clientName: string }> = {
  'demo-proj-smith-kitchen': { clientId: 'demo-client-chen', clientName: 'Michael Chen' },
  'demo-proj-garcia-bath': { clientId: 'demo-client-martinez', clientName: 'Robert Martinez' },
  'demo-proj-mainst-retail': { clientId: 'demo-client-techcorp', clientName: 'TechCorp Inc' },
  'demo-proj-cafe-ti': { clientId: 'demo-client-property-group', clientName: 'Property Group LLC' },
  'demo-proj-thompson-deck': { clientId: 'demo-client-heritage', clientName: 'Heritage Trust' },
  'demo-proj-office-park': { clientId: 'demo-client-techcorp', clientName: 'TechCorp Inc' },
  'demo-proj-garcia-basement': { clientId: 'demo-client-martinez', clientName: 'Robert Martinez' },
};

async function updateProjectClients(): Promise<number> {
  logSection('Updating Project Clients');

  const projectsRef = db
    .collection('organizations')
    .doc(DEMO_ORG_ID)
    .collection('projects');

  // Get all demo projects
  const snapshot = await projectsRef.where('isDemoData', '==', true).get();

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
