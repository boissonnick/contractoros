/**
 * Seed Project Profitability
 *
 * Runs the same calculation logic as the Cloud Function for all existing
 * projects in the demo org. Populates projectProfitability documents so
 * the UI has data immediately.
 */

import { getDb } from './db';
import { DEMO_ORG_ID, logSection, logSuccess, logProgress } from './utils';

type CostCategory =
  | 'labor_internal'
  | 'labor_subcontractor'
  | 'materials'
  | 'equipment_rental'
  | 'permits_fees'
  | 'overhead'
  | 'other';

const EXPENSE_TO_COST: Record<string, CostCategory> = {
  materials: 'materials',
  tools: 'materials',
  subcontractor: 'labor_subcontractor',
  equipment_rental: 'equipment_rental',
  permits: 'permits_fees',
  labor: 'labor_internal',
  office: 'overhead',
  insurance: 'overhead',
  utilities: 'overhead',
  marketing: 'overhead',
  fuel: 'other',
  vehicle: 'other',
  travel: 'other',
  meals: 'other',
  other: 'other',
};

function emptyCosts(): Record<CostCategory, number> {
  return {
    labor_internal: 0,
    labor_subcontractor: 0,
    materials: 0,
    equipment_rental: 0,
    permits_fees: 0,
    overhead: 0,
    other: 0,
  };
}

async function main() {
  logSection('Seeding Project Profitability');

  const db = getDb();
  const orgRef = db.collection('organizations').doc(DEMO_ORG_ID);

  // Cache user cost rates
  const userCostCache = new Map<string, number>();
  const usersSnap = await db.collection('users').where('orgId', '==', DEMO_ORG_ID).get();
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    userCostCache.set(userDoc.id, data.hourlyCost ?? data.hourlyRate ?? 0);
  }
  logProgress(`Cached ${userCostCache.size} user cost rates`);

  // Get all projects (try org-scoped first, then top-level)
  let projectDocs = (await orgRef.collection('projects').get()).docs;
  if (projectDocs.length === 0) {
    projectDocs = (await db.collection('projects').where('orgId', '==', DEMO_ORG_ID).get()).docs;
  }
  logProgress(`Found ${projectDocs.length} projects`);

  let count = 0;

  for (const projDoc of projectDocs) {
    const projectId = projDoc.id;
    const projectData = projDoc.data();

    // Time entries → labor cost
    const timeSnap = await orgRef
      .collection('timeEntries')
      .where('projectId', '==', projectId)
      .where('status', 'in', ['completed', 'approved'])
      .get();

    let totalLaborHours = 0;
    let laborCostInternal = 0;

    for (const teDoc of timeSnap.docs) {
      const entry = teDoc.data();
      const minutes = entry.totalMinutes ?? entry.duration ?? 0;
      const hours = minutes / 60;
      totalLaborHours += hours;
      const userId = entry.userId || entry.uid || '';
      if (userId && userCostCache.has(userId)) {
        laborCostInternal += hours * userCostCache.get(userId)!;
      }
    }

    // Expenses
    const expSnap = await orgRef
      .collection('expenses')
      .where('projectId', '==', projectId)
      .where('status', 'in', ['approved', 'paid'])
      .get();

    const costsByCategory = emptyCosts();
    costsByCategory.labor_internal = laborCostInternal;

    for (const expDoc of expSnap.docs) {
      const exp = expDoc.data();
      const cat = EXPENSE_TO_COST[exp.category || 'other'] || 'other';
      costsByCategory[cat] += exp.amount ?? 0;
    }

    // Invoices
    let invoicedAmount = 0;
    let collectedAmount = 0;

    const orgInvSnap = await orgRef.collection('invoices').where('projectId', '==', projectId).get();
    const invDocs = orgInvSnap.empty
      ? (await db.collection('invoices').where('projectId', '==', projectId).get()).docs
      : orgInvSnap.docs;

    for (const invDoc of invDocs) {
      const inv = invDoc.data();
      invoicedAmount += inv.total ?? inv.amount ?? 0;
      if (inv.status === 'paid') {
        collectedAmount += inv.total ?? inv.amount ?? 0;
      } else if (inv.paidAmount) {
        collectedAmount += inv.paidAmount;
      }
    }

    // Calculate
    const contractValue = projectData.contractValue ?? projectData.budget ?? 0;
    const originalBudget = projectData.budget ?? contractValue;
    const changeOrdersValue = projectData.changeOrdersTotal ?? 0;
    const totalContractValue = contractValue + changeOrdersValue;
    const totalCosts = Object.values(costsByCategory).reduce((a, b) => a + b, 0);
    const grossProfit = totalContractValue - totalCosts;
    const grossMargin = totalContractValue > 0 ? (grossProfit / totalContractValue) * 100 : 0;
    const laborCosts = costsByCategory.labor_internal + costsByCategory.labor_subcontractor;
    const materialCosts = costsByCategory.materials;
    const otherCosts = costsByCategory.equipment_rental + costsByCategory.permits_fees + costsByCategory.overhead + costsByCategory.other;
    const budgetVariance = originalBudget - totalCosts;
    const budgetVariancePercent = originalBudget > 0 ? (budgetVariance / originalBudget) * 100 : 0;
    const laborCostPerHour = totalLaborHours > 0 ? laborCosts / totalLaborHours : 0;

    await orgRef.collection('projectProfitability').doc(projectId).set({
      projectId,
      orgId: DEMO_ORG_ID,
      contractValue,
      changeOrdersValue,
      totalContractValue,
      invoicedAmount,
      collectedAmount,
      totalCosts,
      costsByCategory,
      committedCosts: 0,
      projectedFinalCost: totalCosts,
      grossProfit,
      grossMargin,
      projectedProfit: grossProfit,
      projectedMargin: grossMargin,
      originalBudget,
      budgetVariance,
      budgetVariancePercent,
      laborCosts,
      materialCosts,
      otherCosts,
      totalLaborHours,
      laborCostPerHour,
      isOverBudget: totalCosts > originalBudget && originalBudget > 0,
      isAtRisk: grossMargin < 10 && totalContractValue > 0,
      marginAlertThreshold: 10,
      lastUpdated: new Date(),
      lastUpdatedBy: 'seed-script',
      calculationVersion: 1,
    });

    count++;
    logProgress(`${projectId}: costs=$${totalCosts.toFixed(2)}, margin=${grossMargin.toFixed(1)}%`);
  }

  logSuccess(`Seeded profitability for ${count} projects`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
