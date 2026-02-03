/**
 * Seed Scope of Work Items
 * Creates scope items for demo projects
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  daysAgo,
  generateId,
  randomInt,
  randomItem,
  toTimestamp,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';

const db = getDb();

// Demo projects
const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build' },
  { id: 'demo-proj-office-park', name: 'Office Park Suite 200' },
  { id: 'demo-proj-garcia-basement', name: 'Garcia Basement Finish' },
];

// Scope item templates by project type
const SCOPE_TEMPLATES = {
  kitchen: [
    { title: 'Demolition', description: 'Remove existing cabinets, countertops, and flooring', estimatedHours: 16 },
    { title: 'Rough Plumbing', description: 'Install new supply and drain lines for sink and dishwasher', estimatedHours: 12 },
    { title: 'Rough Electrical', description: 'Install circuits for appliances, outlets, and under-cabinet lighting', estimatedHours: 16 },
    { title: 'Cabinet Installation', description: 'Install base and wall cabinets per approved layout', estimatedHours: 24 },
    { title: 'Countertop Installation', description: 'Template and install quartz countertops', estimatedHours: 8 },
    { title: 'Backsplash Tile', description: 'Install subway tile backsplash with accent strip', estimatedHours: 12 },
    { title: 'Flooring', description: 'Install LVP flooring with transitions', estimatedHours: 8 },
    { title: 'Finish Plumbing', description: 'Install sink, faucet, garbage disposal, and dishwasher connection', estimatedHours: 6 },
    { title: 'Finish Electrical', description: 'Install outlets, switches, and light fixtures', estimatedHours: 8 },
    { title: 'Paint and Trim', description: 'Paint walls and install trim and molding', estimatedHours: 16 },
  ],
  bathroom: [
    { title: 'Demolition', description: 'Remove existing fixtures, tile, and vanity', estimatedHours: 12 },
    { title: 'Rough Plumbing', description: 'Relocate drain and supply lines as needed', estimatedHours: 16 },
    { title: 'Rough Electrical', description: 'Install GFCI circuits and exhaust fan rough-in', estimatedHours: 8 },
    { title: 'Waterproofing', description: 'Install waterproof membrane in shower area', estimatedHours: 4 },
    { title: 'Tile Installation', description: 'Install floor and shower tile with linear drain', estimatedHours: 32 },
    { title: 'Vanity Installation', description: 'Install double vanity and plumbing fixtures', estimatedHours: 8 },
    { title: 'Finish Electrical', description: 'Install vanity lights, exhaust fan, and GFCI outlets', estimatedHours: 6 },
    { title: 'Mirror and Accessories', description: 'Install mirror, towel bars, and toilet paper holder', estimatedHours: 4 },
  ],
  commercial: [
    { title: 'Site Prep and Demo', description: 'Prepare site and remove existing buildout', estimatedHours: 40 },
    { title: 'Framing', description: 'Frame walls per approved floor plan', estimatedHours: 48 },
    { title: 'MEP Rough-In', description: 'Install mechanical, electrical, and plumbing rough-in', estimatedHours: 80 },
    { title: 'Insulation', description: 'Install batt and rigid insulation as required', estimatedHours: 16 },
    { title: 'Drywall', description: 'Hang, tape, and finish drywall', estimatedHours: 48 },
    { title: 'Ceiling Grid', description: 'Install acoustical ceiling grid and tiles', estimatedHours: 24 },
    { title: 'Flooring', description: 'Install commercial flooring per specification', estimatedHours: 32 },
    { title: 'Paint', description: 'Prime and paint all surfaces', estimatedHours: 40 },
    { title: 'MEP Trim', description: 'Install fixtures, devices, and equipment', estimatedHours: 32 },
    { title: 'Punch List', description: 'Complete final punch list items and cleanup', estimatedHours: 16 },
  ],
  deck: [
    { title: 'Site Preparation', description: 'Mark layout and clear vegetation', estimatedHours: 4 },
    { title: 'Footings', description: 'Dig and pour concrete footings', estimatedHours: 8 },
    { title: 'Post Installation', description: 'Set and brace posts', estimatedHours: 4 },
    { title: 'Framing', description: 'Install beams and joists', estimatedHours: 16 },
    { title: 'Decking', description: 'Install composite deck boards', estimatedHours: 16 },
    { title: 'Railing', description: 'Install railing posts, rails, and balusters', estimatedHours: 12 },
    { title: 'Stairs', description: 'Build and install stairs with landing', estimatedHours: 8 },
    { title: 'Finishing', description: 'Install trim and final details', estimatedHours: 4 },
  ],
  basement: [
    { title: 'Permit and Planning', description: 'Obtain permits and finalize layout', estimatedHours: 8 },
    { title: 'Egress Window', description: 'Cut and install egress window well', estimatedHours: 16 },
    { title: 'Framing', description: 'Frame walls and soffits', estimatedHours: 32 },
    { title: 'Electrical Rough-In', description: 'Install circuits and boxes', estimatedHours: 24 },
    { title: 'Plumbing Rough-In', description: 'Install bathroom plumbing', estimatedHours: 20 },
    { title: 'HVAC', description: 'Extend ductwork and install returns', estimatedHours: 16 },
    { title: 'Insulation', description: 'Install wall insulation', estimatedHours: 8 },
    { title: 'Drywall', description: 'Hang, tape, and finish drywall', estimatedHours: 40 },
    { title: 'Flooring', description: 'Install LVP flooring throughout', estimatedHours: 16 },
    { title: 'Trim and Paint', description: 'Install trim and paint all surfaces', estimatedHours: 24 },
  ],
};

// Map projects to template types
const PROJECT_TYPES: Record<string, keyof typeof SCOPE_TEMPLATES> = {
  'demo-proj-smith-kitchen': 'kitchen',
  'demo-proj-garcia-bath': 'bathroom',
  'demo-proj-mainst-retail': 'commercial',
  'demo-proj-cafe-ti': 'commercial',
  'demo-proj-thompson-deck': 'deck',
  'demo-proj-office-park': 'commercial',
  'demo-proj-garcia-basement': 'basement',
};

async function seedScopes(): Promise<number> {
  logSection('Seeding Scopes');

  const scopesRef = db.collection('organizations').doc(DEMO_ORG_ID).collection('scopes');
  const scopes: any[] = [];

  for (const project of DEMO_PROJECTS) {
    const projectType = PROJECT_TYPES[project.id] || 'commercial';
    const templates = SCOPE_TEMPLATES[projectType];

    const scopeItems = templates.map((template, index) => ({
      id: generateId('si'),
      title: template.title,
      description: template.description,
      specifications: `See drawings and specifications for ${template.title.toLowerCase()} requirements.`,
      materials: [],
      laborDescription: template.description,
      estimatedHours: template.estimatedHours,
      estimatedCost: template.estimatedHours * 75, // $75/hr labor
      order: index + 1,
    }));

    const scope = {
      id: generateId('scope'),
      orgId: DEMO_ORG_ID,
      projectId: project.id,
      projectName: project.name,
      version: 1,
      status: randomItem(['draft', 'sent', 'approved', 'approved']),
      items: scopeItems,
      approvals: [],
      createdBy: DEMO_USERS.pm.uid,
      createdByName: DEMO_USERS.pm.displayName,
      createdAt: daysAgo(randomInt(30, 90)),
      isDemoData: true,
    };

    scopes.push(scope);
    logProgress(`Created scope for ${project.name}: ${scopeItems.length} items`);
  }

  await executeBatchWrites(
    db,
    scopes,
    (batch, scope) => {
      const ref = scopesRef.doc(scope.id);
      batch.set(ref, {
        ...scope,
        createdAt: toTimestamp(scope.createdAt),
        updatedAt: Timestamp.now(),
      });
    },
    'Scopes'
  );

  logSuccess(`Created ${scopes.length} scopes`);
  return scopes.length;
}

export { seedScopes };

// Run if executed directly
if (require.main === module) {
  seedScopes()
    .then((count) => {
      console.log(`\n✅ Created ${count} scopes`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding scopes:', error);
      process.exit(1);
    });
}
