#!/usr/bin/env ts-node
/**
 * Fix Project Categories
 *
 * Updates project documents in Firestore to have proper category arrays.
 * Supports both explicit project ID mappings and name-based inference.
 *
 * Usage:
 *   npx ts-node scripts/seed-demo/fix-project-categories.ts          # Dry run (default)
 *   npx ts-node scripts/seed-demo/fix-project-categories.ts --apply  # Apply changes
 *
 * Category Values:
 *   - residential
 *   - commercial
 *   - renovation
 *   - addition
 *   - new_construction
 *   - tenant_improvement
 *   - historic
 */

import * as admin from 'firebase-admin';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  logSection,
  logProgress,
  logSuccess,
  logWarning,
} from './utils';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'contractoros-483812',
  });
}

const db = getDb();

// ============================================
// Category Mappings by Project ID
// ============================================

/**
 * Explicit category mappings for known project IDs.
 * These take precedence over name-based inference.
 */
const PROJECT_CATEGORIES: Record<string, string[]> = {
  // Completed Projects
  'demo-proj-smith-kitchen': ['residential', 'renovation'],
  'demo-proj-wilson-fence': ['residential', 'addition'],
  'demo-proj-mainst-retail': ['commercial'],
  'demo-proj-garcia-bath': ['residential', 'renovation'],
  'demo-proj-cafe-ti': ['commercial', 'tenant_improvement'],

  // Active Projects
  'demo-proj-thompson-deck': ['residential', 'addition'],
  'demo-proj-office-park': ['commercial', 'tenant_improvement'],
  'demo-proj-garcia-basement': ['residential', 'renovation'],
  'demo-proj-brown-kitchen': ['residential', 'renovation'],

  // Upcoming Projects
  'demo-proj-thompson-garage': ['residential', 'addition'],
  'demo-proj-smith-bathroom': ['residential', 'renovation'],

  // On Hold Projects
  'demo-proj-wilson-pool': ['residential', 'addition'],

  // Historical / Alternate IDs (for backwards compatibility)
  'proj-smith-kitchen': ['residential', 'renovation'],
  'proj-garcia-bath': ['residential', 'renovation'],
  'proj-mainst-retail': ['commercial'],
  'proj-cafe-ti': ['commercial', 'tenant_improvement'],
  'proj-thompson-deck': ['residential', 'addition'],
  'proj-office-200': ['commercial', 'tenant_improvement'],
  'proj-historic-home': ['residential', 'renovation', 'historic'],
  'historic-home-restoration': ['residential', 'renovation', 'historic'],
};

// ============================================
// Name Pattern Matchers for Category Inference
// ============================================

interface CategoryPattern {
  patterns: RegExp[];
  categories: string[];
}

const CATEGORY_PATTERNS: CategoryPattern[] = [
  // Commercial patterns
  {
    patterns: [/retail/i, /office/i, /cafe/i, /restaurant/i, /storefront/i, /commercial/i, /business/i],
    categories: ['commercial'],
  },
  // Tenant improvement patterns
  {
    patterns: [/tenant improvement/i, /\bti\b/i, /buildout/i, /build-out/i, /suite/i],
    categories: ['commercial', 'tenant_improvement'],
  },
  // Historic patterns
  {
    patterns: [/historic/i, /restoration/i, /heritage/i],
    categories: ['residential', 'renovation', 'historic'],
  },
  // Renovation patterns
  {
    patterns: [/kitchen/i, /bath/i, /basement/i, /remodel/i, /renovation/i, /update/i, /finish/i],
    categories: ['residential', 'renovation'],
  },
  // Addition patterns
  {
    patterns: [/deck/i, /fence/i, /addition/i, /garage/i, /pool house/i, /sunroom/i, /patio/i],
    categories: ['residential', 'addition'],
  },
  // New construction patterns
  {
    patterns: [/new home/i, /new build/i, /new construction/i, /ground-up/i, /custom home/i],
    categories: ['residential', 'new_construction'],
  },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Infer categories from project name using pattern matching.
 */
function inferCategoriesFromName(name: string): string[] {
  for (const { patterns, categories } of CATEGORY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(name)) {
        return categories;
      }
    }
  }
  // Default fallback
  return ['residential'];
}

/**
 * Get categories for a project, preferring explicit mapping over inference.
 */
function getCategoriesForProject(projectId: string, projectName: string): string[] {
  // Check explicit mapping first
  if (PROJECT_CATEGORIES[projectId]) {
    return PROJECT_CATEGORIES[projectId];
  }

  // Try to match by partial ID (without prefix)
  for (const [key, categories] of Object.entries(PROJECT_CATEGORIES)) {
    if (projectId.includes(key.replace('demo-proj-', '').replace('proj-', '')) ||
        key.includes(projectId.replace('demo-proj-', '').replace('proj-', ''))) {
      return categories;
    }
  }

  // Fall back to name-based inference
  return inferCategoriesFromName(projectName);
}

// ============================================
// Main Function
// ============================================

interface FixResult {
  projectId: string;
  projectName: string;
  oldCategories: string[] | undefined;
  newCategories: string[];
  changed: boolean;
}

async function fixProjectCategories(dryRun: boolean = true): Promise<FixResult[]> {
  logSection(dryRun ? 'Fix Project Categories (DRY RUN)' : 'Fix Project Categories (APPLYING CHANGES)');

  if (dryRun) {
    logWarning('This is a dry run. No changes will be made.');
    logWarning('Run with --apply flag to apply changes.');
    console.log('');
  }

  // Projects are stored in top-level 'projects' collection
  const projectsRef = db.collection('projects');

  // Get all demo projects for the org
  const snapshot = await projectsRef
    .where('orgId', '==', DEMO_ORG_ID)
    .where('isDemoData', '==', true)
    .get();

  if (snapshot.empty) {
    logProgress('No demo projects found for org: ' + DEMO_ORG_ID);

    // Try without isDemoData filter (some projects may not have this flag)
    const allOrgProjects = await projectsRef
      .where('orgId', '==', DEMO_ORG_ID)
      .get();

    if (allOrgProjects.empty) {
      logWarning('No projects found at all for this org.');
      return [];
    }

    logProgress(`Found ${allOrgProjects.size} projects without isDemoData flag.`);
  }

  const results: FixResult[] = [];
  const batch = db.batch();
  let updateCount = 0;

  const docs = snapshot.empty
    ? (await projectsRef.where('orgId', '==', DEMO_ORG_ID).get()).docs
    : snapshot.docs;

  for (const doc of docs) {
    const projectId = doc.id;
    const data = doc.data();
    const projectName = data.name || 'Unknown';

    const oldCategories = data.categories as string[] | undefined;
    const newCategories = getCategoriesForProject(projectId, projectName);

    // Check if categories need updating
    const oldSet = new Set(oldCategories || []);
    const newSet = new Set(newCategories);
    const changed = oldSet.size !== newSet.size ||
                    [...newSet].some(cat => !oldSet.has(cat));

    results.push({
      projectId,
      projectName,
      oldCategories,
      newCategories,
      changed,
    });

    if (changed && !dryRun) {
      batch.update(doc.ref, {
        categories: newCategories,
        category: newCategories[0], // Keep primary category for backwards compatibility
        updatedAt: admin.firestore.Timestamp.now(),
      });
      updateCount++;
    }
  }

  // Display results
  logSection('Results');
  console.log('');
  console.log('  Project ID                      | Name                        | Old Categories       | New Categories       | Changed');
  console.log('  ' + '-'.repeat(130));

  for (const result of results) {
    const id = result.projectId.padEnd(32);
    const name = result.projectName.substring(0, 26).padEnd(27);
    const oldCats = (result.oldCategories?.join(', ') || '(none)').padEnd(20);
    const newCats = result.newCategories.join(', ').padEnd(20);
    const changed = result.changed ? 'YES' : 'no';

    console.log(`  ${id} | ${name} | ${oldCats} | ${newCats} | ${changed}`);
  }
  console.log('');

  // Summary
  const changedCount = results.filter(r => r.changed).length;
  logProgress(`Total projects: ${results.length}`);
  logProgress(`Projects requiring update: ${changedCount}`);

  if (!dryRun && updateCount > 0) {
    await batch.commit();
    logSuccess(`Updated ${updateCount} projects`);
  } else if (dryRun && changedCount > 0) {
    logWarning(`Dry run complete. ${changedCount} projects would be updated.`);
    logWarning('Run with --apply flag to apply changes.');
  } else {
    logSuccess('All projects already have correct categories.');
  }

  return results;
}

// ============================================
// CLI Entry Point
// ============================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const applyChanges = args.includes('--apply');
  const dryRun = !applyChanges;

  fixProjectCategories(dryRun)
    .then((results) => {
      const changedCount = results.filter(r => r.changed).length;
      if (dryRun) {
        console.log(`\nDry run complete. ${changedCount} projects would be updated.`);
        console.log('Run with --apply flag to apply changes.');
      } else {
        console.log(`\nUpdated ${changedCount} project categories.`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nError fixing project categories:', error);
      process.exit(1);
    });
}

// Export for use by other scripts
export { fixProjectCategories, getCategoriesForProject, PROJECT_CATEGORIES };
