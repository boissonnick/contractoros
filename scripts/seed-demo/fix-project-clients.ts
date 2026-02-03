#!/usr/bin/env ts-node
/**
 * Fix Project Clients
 *
 * Updates existing projects with correct clientId and clientName fields.
 * This script is useful when projects exist but are missing client references,
 * or when client data needs to be re-synced.
 *
 * Usage:
 *   npx ts-node scripts/seed-demo/fix-project-clients.ts
 */

import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_CLIENTS,
  logSection,
  logProgress,
  logSuccess,
  logWarning,
} from './utils';

// ============================================
// Project-to-Client Mappings
// ============================================

interface ProjectClientMapping {
  projectId: string;
  clientId: string;
  clientName: string;
  description: string; // for logging
}

/**
 * Complete mapping of all demo projects to their clients.
 * Derived from seed-projects.ts project definitions.
 */
const PROJECT_CLIENTS: ProjectClientMapping[] = [
  // Smith Family Projects (3)
  {
    projectId: 'demo-proj-smith-kitchen',
    clientId: DEMO_CLIENTS.smith.id,
    clientName: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`,
    description: 'Smith Kitchen Remodel',
  },
  {
    projectId: 'demo-proj-smith-bathroom',
    clientId: DEMO_CLIENTS.smith.id,
    clientName: `${DEMO_CLIENTS.smith.firstName} ${DEMO_CLIENTS.smith.lastName}`,
    description: 'Smith Bathroom Remodel',
  },
  // Note: Client doc references proj-smith-bath, proj-smith-deck which may be legacy IDs

  // Garcia Family Projects (2)
  {
    projectId: 'demo-proj-garcia-bath',
    clientId: DEMO_CLIENTS.garcia.id,
    clientName: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`,
    description: 'Garcia Master Bath',
  },
  {
    projectId: 'demo-proj-garcia-basement',
    clientId: DEMO_CLIENTS.garcia.id,
    clientName: `${DEMO_CLIENTS.garcia.firstName} ${DEMO_CLIENTS.garcia.lastName}`,
    description: 'Garcia Basement Finish',
  },

  // Thompson Family Projects (2)
  {
    projectId: 'demo-proj-thompson-deck',
    clientId: DEMO_CLIENTS.thompson.id,
    clientName: `${DEMO_CLIENTS.thompson.firstName} ${DEMO_CLIENTS.thompson.lastName}`,
    description: 'Thompson Deck Build',
  },
  {
    projectId: 'demo-proj-thompson-garage',
    clientId: DEMO_CLIENTS.thompson.id,
    clientName: `${DEMO_CLIENTS.thompson.firstName} ${DEMO_CLIENTS.thompson.lastName}`,
    description: 'Thompson Garage Addition',
  },

  // Wilson Family Projects (2)
  {
    projectId: 'demo-proj-wilson-fence',
    clientId: DEMO_CLIENTS.wilson.id,
    clientName: `${DEMO_CLIENTS.wilson.firstName} ${DEMO_CLIENTS.wilson.lastName}`,
    description: 'Wilson Fence Installation',
  },
  {
    projectId: 'demo-proj-wilson-pool',
    clientId: DEMO_CLIENTS.wilson.id,
    clientName: `${DEMO_CLIENTS.wilson.firstName} ${DEMO_CLIENTS.wilson.lastName}`,
    description: 'Wilson Pool House',
  },

  // Brown Family Projects (1)
  {
    projectId: 'demo-proj-brown-kitchen',
    clientId: DEMO_CLIENTS.brown.id,
    clientName: `${DEMO_CLIENTS.brown.firstName} ${DEMO_CLIENTS.brown.lastName}`,
    description: 'Brown Kitchen Update',
  },

  // Commercial: Downtown Cafe (1)
  {
    projectId: 'demo-proj-cafe-ti',
    clientId: DEMO_CLIENTS.downtownCafe.id,
    clientName: DEMO_CLIENTS.downtownCafe.companyName || `${DEMO_CLIENTS.downtownCafe.firstName} ${DEMO_CLIENTS.downtownCafe.lastName}`,
    description: 'Downtown Cafe TI',
  },

  // Commercial: Main Street Retail (1)
  {
    projectId: 'demo-proj-mainst-retail',
    clientId: DEMO_CLIENTS.mainStRetail.id,
    clientName: DEMO_CLIENTS.mainStRetail.companyName || `${DEMO_CLIENTS.mainStRetail.firstName} ${DEMO_CLIENTS.mainStRetail.lastName}`,
    description: 'Main St. Retail Storefront',
  },

  // Commercial: Office Park (1)
  {
    projectId: 'demo-proj-office-park',
    clientId: DEMO_CLIENTS.officePark.id,
    clientName: DEMO_CLIENTS.officePark.companyName || `${DEMO_CLIENTS.officePark.firstName} ${DEMO_CLIENTS.officePark.lastName}`,
    description: 'Office Park Suite 200',
  },
];

// ============================================
// Main Fix Function
// ============================================

async function fixProjectClients(): Promise<void> {
  logSection('Fixing Project Client References');

  const db = getDb();
  const projectsRef = db.collection('projects');

  let updatedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  logProgress(`Processing ${PROJECT_CLIENTS.length} project mappings...`);

  for (const mapping of PROJECT_CLIENTS) {
    try {
      const projectDoc = await projectsRef.doc(mapping.projectId).get();

      if (!projectDoc.exists) {
        logWarning(`Project not found: ${mapping.projectId} (${mapping.description})`);
        notFoundCount++;
        continue;
      }

      // Verify this is the correct org's project
      const projectData = projectDoc.data();
      if (projectData?.orgId !== DEMO_ORG_ID) {
        logWarning(`Project ${mapping.projectId} belongs to different org, skipping`);
        continue;
      }

      // Update project with client reference
      await projectsRef.doc(mapping.projectId).update({
        clientId: mapping.clientId,
        clientName: mapping.clientName,
        updatedAt: new Date(),
      });

      logProgress(`Updated: ${mapping.description} -> ${mapping.clientName}`);
      updatedCount++;
    } catch (error) {
      console.error(`Error updating ${mapping.projectId}:`, error);
      errorCount++;
    }
  }

  // Summary
  logSection('Fix Summary');
  logSuccess(`Updated: ${updatedCount} projects`);
  if (notFoundCount > 0) {
    logWarning(`Not Found: ${notFoundCount} projects`);
  }
  if (errorCount > 0) {
    logWarning(`Errors: ${errorCount} projects`);
  }
}

// ============================================
// Dry Run Function (Preview Changes)
// ============================================

async function dryRunFixProjectClients(): Promise<void> {
  logSection('Dry Run - Project Client Mappings Preview');

  const db = getDb();
  const projectsRef = db.collection('projects');

  logProgress('Checking which projects exist and their current client data...\n');

  for (const mapping of PROJECT_CLIENTS) {
    try {
      const projectDoc = await projectsRef.doc(mapping.projectId).get();

      if (!projectDoc.exists) {
        console.log(`  [ ] ${mapping.projectId} - NOT FOUND`);
        continue;
      }

      const data = projectDoc.data();
      const currentClientId = data?.clientId || 'none';
      const currentClientName = data?.clientName || 'none';

      if (currentClientId === mapping.clientId && currentClientName === mapping.clientName) {
        console.log(`  [=] ${mapping.description} - already correct`);
      } else {
        console.log(`  [*] ${mapping.description}`);
        console.log(`      Current: clientId=${currentClientId}, clientName=${currentClientName}`);
        console.log(`      Will update to: clientId=${mapping.clientId}, clientName=${mapping.clientName}`);
      }
    } catch (error) {
      console.log(`  [!] ${mapping.projectId} - ERROR: ${error}`);
    }
  }
}

// ============================================
// Run Script
// ============================================

const isDryRun = process.argv.includes('--dry-run');

if (require.main === module) {
  const runFunction = isDryRun ? dryRunFixProjectClients : fixProjectClients;
  const mode = isDryRun ? 'DRY RUN' : 'LIVE';

  console.log(`\nRunning in ${mode} mode...\n`);

  runFunction()
    .then(() => {
      console.log('\nDone!');
      if (isDryRun) {
        console.log('To apply changes, run without --dry-run flag.');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nError:', error);
      process.exit(1);
    });
}

// Export for use by other scripts
export { fixProjectClients, dryRunFixProjectClients, PROJECT_CLIENTS };
