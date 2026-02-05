/**
 * Core recalculation logic for project profitability.
 *
 * Queries time entries, expenses, project data, and invoices to produce
 * an aggregated ProjectProfitability document.
 */

import { Firestore, FieldValue } from "firebase-admin/firestore";
import { CostCategory, mapExpenseCategory } from "./category-mapping";

interface UserCostCache {
  hourlyCost: number;
  hourlyRate: number;
}

function emptyCostsByCategory(): Record<CostCategory, number> {
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

export async function recalculateProjectProfitability(
  db: Firestore,
  orgId: string,
  projectId: string
): Promise<void> {
  const orgRef = db.collection("organizations").doc(orgId);

  // Cache for user cost rates
  const userCostCache = new Map<string, UserCostCache>();

  async function getUserCost(userId: string): Promise<UserCostCache> {
    if (userCostCache.has(userId)) {
      return userCostCache.get(userId)!;
    }
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const result: UserCostCache = {
      hourlyCost: userData?.hourlyCost ?? userData?.hourlyRate ?? 0,
      hourlyRate: userData?.hourlyRate ?? 0,
    };
    if (result.hourlyCost === 0 && result.hourlyRate === 0) {
      console.warn(`[job-costing] User ${userId} has no hourlyCost or hourlyRate`);
    }
    userCostCache.set(userId, result);
    return result;
  }

  // 1. Query completed/approved time entries for this project
  const timeEntriesSnap = await orgRef
    .collection("timeEntries")
    .where("projectId", "==", projectId)
    .where("status", "in", ["completed", "approved"])
    .get();

  let totalLaborHours = 0;
  let laborCostInternal = 0;

  for (const doc of timeEntriesSnap.docs) {
    const entry = doc.data();
    const totalMinutes = entry.totalMinutes ?? entry.duration ?? 0;
    const hours = totalMinutes / 60;
    totalLaborHours += hours;

    const userId = entry.userId || entry.uid || "";
    if (userId) {
      const userCost = await getUserCost(userId);
      laborCostInternal += hours * userCost.hourlyCost;
    }
  }

  // 2. Query approved/paid expenses for this project
  const expensesSnap = await orgRef
    .collection("expenses")
    .where("projectId", "==", projectId)
    .where("status", "in", ["approved", "paid"])
    .get();

  const costsByCategory = emptyCostsByCategory();
  costsByCategory.labor_internal = laborCostInternal;

  for (const doc of expensesSnap.docs) {
    const expense = doc.data();
    const amount = expense.amount ?? 0;
    const category = mapExpenseCategory(expense.category || "other");
    costsByCategory[category] += amount;
  }

  // 3. Read project document for budget and contract value
  // Projects can be at the top level or under organizations
  let projectData: FirebaseFirestore.DocumentData | undefined;

  // Try org-scoped first
  const orgProjectDoc = await orgRef.collection("projects").doc(projectId).get();
  if (orgProjectDoc.exists) {
    projectData = orgProjectDoc.data();
  } else {
    // Fall back to top-level projects collection
    const topProjectDoc = await db.collection("projects").doc(projectId).get();
    if (topProjectDoc.exists) {
      projectData = topProjectDoc.data();
    }
  }

  const contractValue = projectData?.contractValue ?? projectData?.budget ?? 0;
  const originalBudget = projectData?.budget ?? contractValue;
  const changeOrdersValue = projectData?.changeOrdersTotal ?? 0;

  // 4. Read invoices for this project
  let invoicedAmount = 0;
  let collectedAmount = 0;

  // Try org-scoped invoices
  const orgInvoicesSnap = await orgRef
    .collection("invoices")
    .where("projectId", "==", projectId)
    .get();

  if (!orgInvoicesSnap.empty) {
    for (const doc of orgInvoicesSnap.docs) {
      const invoice = doc.data();
      invoicedAmount += invoice.total ?? invoice.amount ?? 0;
      if (invoice.status === "paid") {
        collectedAmount += invoice.total ?? invoice.amount ?? 0;
      } else if (invoice.paidAmount) {
        collectedAmount += invoice.paidAmount;
      }
    }
  } else {
    // Fall back to top-level invoices collection
    const topInvoicesSnap = await db
      .collection("invoices")
      .where("projectId", "==", projectId)
      .get();

    for (const doc of topInvoicesSnap.docs) {
      const invoice = doc.data();
      invoicedAmount += invoice.total ?? invoice.amount ?? 0;
      if (invoice.status === "paid") {
        collectedAmount += invoice.total ?? invoice.amount ?? 0;
      } else if (invoice.paidAmount) {
        collectedAmount += invoice.paidAmount;
      }
    }
  }

  // 5. Calculate totals
  const totalCosts = Object.values(costsByCategory).reduce((a, b) => a + b, 0);
  const totalContractValue = contractValue + changeOrdersValue;
  const grossProfit = totalContractValue - totalCosts;
  const grossMargin = totalContractValue > 0
    ? (grossProfit / totalContractValue) * 100
    : 0;

  const laborCosts = costsByCategory.labor_internal + costsByCategory.labor_subcontractor;
  const materialCosts = costsByCategory.materials;
  const otherCosts =
    costsByCategory.equipment_rental +
    costsByCategory.permits_fees +
    costsByCategory.overhead +
    costsByCategory.other;

  const budgetVariance = originalBudget - totalCosts;
  const budgetVariancePercent = originalBudget > 0
    ? (budgetVariance / originalBudget) * 100
    : 0;

  const laborCostPerHour = totalLaborHours > 0
    ? laborCosts / totalLaborHours
    : 0;

  const isOverBudget = totalCosts > originalBudget && originalBudget > 0;
  const isAtRisk = grossMargin < 10 && totalContractValue > 0;

  // 6. Write profitability document
  const profitabilityData = {
    projectId,
    orgId,
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
    isOverBudget,
    isAtRisk,
    marginAlertThreshold: 10,
    lastUpdated: FieldValue.serverTimestamp(),
    lastUpdatedBy: "cloud-function",
    calculationVersion: 1,
  };

  await orgRef
    .collection("projectProfitability")
    .doc(projectId)
    .set(profitabilityData);

  console.log(
    `[job-costing] Recalculated profitability for project ${projectId}: ` +
    `costs=$${totalCosts.toFixed(2)}, margin=${grossMargin.toFixed(1)}%`
  );
}
