/**
 * AP Invoicing Cloud Functions
 *
 * Recalculates project profitability when a subcontractor invoice
 * is approved or marked as paid.
 *
 * Uses onDocumentWritten to handle create/update/delete in a single trigger.
 */

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { recalculateProjectProfitability } from "../job-costing/recalculate";

const REGION = "us-east1";

function getDb() {
  return getFirestore(admin.app(), "contractoros");
}

/**
 * Recalculate profitability when a subcontractor invoice is written.
 * Only triggers recalculation when status changes to 'approved' or 'paid',
 * since those are the states that affect actual project costs.
 */
export const onSubInvoiceWrite = onDocumentWritten(
  {
    document: "organizations/{orgId}/subcontractorInvoices/{invoiceId}",
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

    // Only recalculate on status changes that affect costs
    const beforeStatus = beforeData?.status;
    const afterStatus = afterData?.status;

    const costAffectingStatuses = ["approved", "paid"];
    const wasCostAffecting = costAffectingStatuses.includes(beforeStatus);
    const isCostAffecting = costAffectingStatuses.includes(afterStatus);

    // Skip if neither before nor after is cost-affecting
    if (!wasCostAffecting && !isCostAffecting) {
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
