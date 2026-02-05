/**
 * Job Costing Cloud Functions
 *
 * Triggers that auto-recalculate projectProfitability whenever
 * time entries or expenses are written.
 *
 * Uses onDocumentWritten to handle create/update/delete in a single trigger.
 */

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { recalculateProjectProfitability } from "./recalculate";

const REGION = "us-east1";

function getDb() {
  return getFirestore(admin.app(), "contractoros");
}

/**
 * Recalculate profitability when a time entry is created, updated, or deleted.
 */
export const onTimeEntryWrite = onDocumentWritten(
  {
    document: "organizations/{orgId}/timeEntries/{entryId}",
    database: "contractoros",
    region: REGION,
  },
  async (event) => {
    const db = getDb();
    const { orgId } = event.params;

    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    const beforeProjectId = beforeData?.projectId;
    const afterProjectId = afterData?.projectId;

    // No project associated — skip
    if (!beforeProjectId && !afterProjectId) {
      return;
    }

    // If projectId changed, recalculate both old and new
    if (beforeProjectId && afterProjectId && beforeProjectId !== afterProjectId) {
      await Promise.all([
        recalculateProjectProfitability(db, orgId, beforeProjectId),
        recalculateProjectProfitability(db, orgId, afterProjectId),
      ]);
      return;
    }

    const projectId = afterProjectId || beforeProjectId;
    if (projectId) {
      await recalculateProjectProfitability(db, orgId, projectId);
    }
  }
);

/**
 * Recalculate profitability when an expense is created, updated, or deleted.
 */
export const onExpenseWrite = onDocumentWritten(
  {
    document: "organizations/{orgId}/expenses/{expenseId}",
    database: "contractoros",
    region: REGION,
  },
  async (event) => {
    const db = getDb();
    const { orgId } = event.params;

    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    const beforeProjectId = beforeData?.projectId;
    const afterProjectId = afterData?.projectId;

    // No project associated — skip
    if (!beforeProjectId && !afterProjectId) {
      return;
    }

    // If projectId changed, recalculate both old and new
    if (beforeProjectId && afterProjectId && beforeProjectId !== afterProjectId) {
      await Promise.all([
        recalculateProjectProfitability(db, orgId, beforeProjectId),
        recalculateProjectProfitability(db, orgId, afterProjectId),
      ]);
      return;
    }

    const projectId = afterProjectId || beforeProjectId;
    if (projectId) {
      await recalculateProjectProfitability(db, orgId, projectId);
    }
  }
);
