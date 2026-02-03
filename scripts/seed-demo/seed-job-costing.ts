/**
 * Seed Job Costing Data for Sprint 38
 * Creates realistic job cost tracking data for demo projects
 */

import { getDb } from './db';
import { Timestamp } from 'firebase-admin/firestore';

const db = getDb();
const orgId = 'u8hwVPLEv4YL9D71ymBwCOrmKta2';

const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel', budget: 85000 },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath', budget: 45000 },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront', budget: 125000 },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI', budget: 95000 },
  { id: 'demo-proj-thompson-deck', name: 'Thompson Deck Build', budget: 35000 },
];

// Cost categories
const COST_CATEGORIES = ['labor', 'materials', 'equipment', 'subcontractor', 'permits', 'overhead'] as const;

// Realistic cost items by category
const COST_ITEMS = {
  labor: [
    { description: 'Framing labor', unitCost: 45 },
    { description: 'Electrical rough-in', unitCost: 65 },
    { description: 'Plumbing rough-in', unitCost: 70 },
    { description: 'Drywall installation', unitCost: 35 },
    { description: 'Painting', unitCost: 40 },
    { description: 'Tile installation', unitCost: 55 },
    { description: 'Cabinet installation', unitCost: 50 },
    { description: 'Trim carpentry', unitCost: 48 },
  ],
  materials: [
    { description: 'Lumber package', unitCost: 2500 },
    { description: 'Electrical supplies', unitCost: 1800 },
    { description: 'Plumbing fixtures', unitCost: 3200 },
    { description: 'Drywall & finishing', unitCost: 1200 },
    { description: 'Paint & supplies', unitCost: 800 },
    { description: 'Tile & grout', unitCost: 2800 },
    { description: 'Cabinets', unitCost: 8500 },
    { description: 'Countertops', unitCost: 4500 },
    { description: 'Hardware & fixtures', unitCost: 1500 },
  ],
  equipment: [
    { description: 'Scaffolding rental', unitCost: 450 },
    { description: 'Power tool rental', unitCost: 250 },
    { description: 'Dumpster rental', unitCost: 600 },
    { description: 'Lift rental', unitCost: 350 },
  ],
  subcontractor: [
    { description: 'HVAC contractor', unitCost: 8500 },
    { description: 'Electrical contractor', unitCost: 6500 },
    { description: 'Plumbing contractor', unitCost: 7200 },
    { description: 'Flooring specialist', unitCost: 4800 },
  ],
  permits: [
    { description: 'Building permit', unitCost: 1200 },
    { description: 'Electrical permit', unitCost: 350 },
    { description: 'Plumbing permit', unitCost: 300 },
  ],
  overhead: [
    { description: 'Project management', unitCost: 2500 },
    { description: 'Insurance allocation', unitCost: 1800 },
    { description: 'Supervision', unitCost: 3200 },
  ],
};

async function seedJobCosting() {
  console.log('='.repeat(50));
  console.log('Seeding Job Costing Data');
  console.log('='.repeat(50));

  const now = Timestamp.now();
  const jobCostingRef = db.collection('organizations').doc(orgId).collection('jobCostingData');
  const financesRef = db.collection('organizations').doc(orgId).collection('finances');

  let totalCosts = 0;
  let costCount = 0;

  for (const project of DEMO_PROJECTS) {
    console.log(`\nProject: ${project.name}`);

    let projectTotalBudget = 0;
    let projectTotalActual = 0;
    const projectCosts: any[] = [];

    // Generate costs for each category
    for (const category of COST_CATEGORIES) {
      const items = COST_ITEMS[category];
      // Use 2-4 items per category
      const numItems = Math.floor(Math.random() * 3) + 2;
      const selectedItems = items.slice(0, Math.min(numItems, items.length));

      for (const item of selectedItems) {
        // Add some variance to costs
        const budgetAmount = item.unitCost * (0.9 + Math.random() * 0.2);
        // Actual can be over or under budget
        const actualAmount = budgetAmount * (0.85 + Math.random() * 0.3);
        const variance = actualAmount - budgetAmount;
        const variancePercent = (variance / budgetAmount) * 100;

        const costDoc = {
          id: `cost-${project.id}-${category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          orgId,
          projectId: project.id,
          projectName: project.name,
          category,
          description: item.description,
          budgetAmount: Math.round(budgetAmount * 100) / 100,
          actualAmount: Math.round(actualAmount * 100) / 100,
          variance: Math.round(variance * 100) / 100,
          variancePercent: Math.round(variancePercent * 10) / 10,
          status: actualAmount > 0 ? 'incurred' : 'budgeted',
          date: Timestamp.fromDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)),
          createdAt: now,
          updatedAt: now,
        };

        projectCosts.push(costDoc);
        projectTotalBudget += budgetAmount;
        projectTotalActual += actualAmount;
        totalCosts += actualAmount;
        costCount++;
      }
    }

    // Write all costs for this project
    const batch = db.batch();
    for (const cost of projectCosts) {
      batch.set(jobCostingRef.doc(cost.id), cost);
    }
    await batch.commit();

    console.log(`  - ${projectCosts.length} cost items created`);
    console.log(`  - Budget: $${Math.round(projectTotalBudget).toLocaleString()}`);
    console.log(`  - Actual: $${Math.round(projectTotalActual).toLocaleString()}`);

    // Create finance summary for this project
    const financeSummary = {
      id: `finance-${project.id}`,
      orgId,
      projectId: project.id,
      projectName: project.name,
      totalBudget: project.budget,
      totalSpent: Math.round(projectTotalActual),
      totalCommitted: Math.round(projectTotalBudget),
      remainingBudget: project.budget - Math.round(projectTotalActual),
      percentComplete: Math.round((projectTotalActual / project.budget) * 100),
      laborCosts: projectCosts.filter(c => c.category === 'labor').reduce((sum, c) => sum + c.actualAmount, 0),
      materialCosts: projectCosts.filter(c => c.category === 'materials').reduce((sum, c) => sum + c.actualAmount, 0),
      equipmentCosts: projectCosts.filter(c => c.category === 'equipment').reduce((sum, c) => sum + c.actualAmount, 0),
      subcontractorCosts: projectCosts.filter(c => c.category === 'subcontractor').reduce((sum, c) => sum + c.actualAmount, 0),
      overheadCosts: projectCosts.filter(c => c.category === 'overhead').reduce((sum, c) => sum + c.actualAmount, 0),
      permitCosts: projectCosts.filter(c => c.category === 'permits').reduce((sum, c) => sum + c.actualAmount, 0),
      createdAt: now,
      updatedAt: now,
    };

    await financesRef.doc(financeSummary.id).set(financeSummary);
  }

  console.log('\n' + '='.repeat(50));
  console.log('Job Costing Seed Complete');
  console.log('='.repeat(50));
  console.log(`Total cost items: ${costCount}`);
  console.log(`Total costs: $${Math.round(totalCosts).toLocaleString()}`);
  console.log(`Finance summaries: ${DEMO_PROJECTS.length}`);
}

seedJobCosting()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
