/**
 * Update Demo Project Categories
 * Sprint 37C - Task 1
 *
 * Updates existing demo projects to have proper category arrays
 * for the category filter to work correctly.
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

// Project category mappings
const PROJECT_CATEGORIES: Record<string, string[]> = {
  'demo-proj-smith-kitchen': ['residential', 'renovation'],
  'demo-proj-wilson-fence': ['residential', 'addition'],
  'demo-proj-mainst-retail': ['commercial'],
  'demo-proj-garcia-bath': ['residential', 'renovation'],
  'demo-proj-cafe-ti': ['commercial'],
  'demo-proj-thompson-deck': ['residential', 'addition'],
  'demo-proj-office-park': ['commercial'],
  'demo-proj-garcia-basement': ['residential', 'renovation'],
  'demo-proj-brown-kitchen': ['residential', 'renovation'],
  // Historical project names (in case they exist)
  'historic-home-restoration': ['residential', 'renovation'],
  'kitchen-renovation-demo': ['residential', 'renovation'],
  'office-build-out': ['commercial'],
  'multi-unit-housing': ['residential', 'new_construction'],
  'bathroom-remodel': ['residential', 'renovation'],
  'deck-replacement': ['residential', 'addition'],
  'basement-finishing': ['residential', 'renovation'],
  'sunroom-addition': ['residential', 'addition'],
  'ashview-drive': ['residential'],
};

async function updateProjectCategories(): Promise<number> {
  logSection('Updating Project Categories');

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
    const data = doc.data();
    const projectName = data.name?.toLowerCase().replace(/\s+/g, '-') || '';

    // Find matching categories
    let categories: string[] = PROJECT_CATEGORIES[projectId] || [];

    // Try to match by name if ID doesn't match
    if (categories.length === 0) {
      for (const [key, cats] of Object.entries(PROJECT_CATEGORIES)) {
        if (projectName.includes(key.replace('demo-proj-', '').replace(/-/g, ' ')) ||
            key.includes(projectName)) {
          categories = cats;
          break;
        }
      }
    }

    // Infer categories from project name if still empty
    if (categories.length === 0) {
      if (data.name?.toLowerCase().includes('kitchen') ||
          data.name?.toLowerCase().includes('bath') ||
          data.name?.toLowerCase().includes('basement')) {
        categories = ['residential', 'renovation'];
      } else if (data.name?.toLowerCase().includes('deck') ||
                 data.name?.toLowerCase().includes('fence') ||
                 data.name?.toLowerCase().includes('addition')) {
        categories = ['residential', 'addition'];
      } else if (data.name?.toLowerCase().includes('retail') ||
                 data.name?.toLowerCase().includes('office') ||
                 data.name?.toLowerCase().includes('cafe') ||
                 data.name?.toLowerCase().includes('commercial')) {
        categories = ['commercial'];
      } else {
        categories = ['residential']; // Default fallback
      }
    }

    logProgress(`Updating ${data.name}: ${categories.join(', ')}`);

    batch.update(doc.ref, {
      categories: categories,
      category: categories[0], // Keep primary category for backwards compatibility
      updatedAt: admin.firestore.Timestamp.now(),
    });

    updatedCount++;
  }

  await batch.commit();
  logSuccess(`Updated ${updatedCount} projects with categories`);

  return updatedCount;
}

// Run if executed directly
if (require.main === module) {
  updateProjectCategories()
    .then((count) => {
      console.log(`\n✅ Updated ${count} project categories`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error updating categories:', error);
      process.exit(1);
    });
}

export { updateProjectCategories };
