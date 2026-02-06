/**
 * Review Automation Trigger Functions
 *
 * Creates review requests automatically based on automation rules
 * when projects complete or invoices are paid.
 */

import { getFirestore, Firestore, Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

// Lazy initialization for Firestore
let _db: Firestore | null = null;
function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(admin.app(), "contractoros");
  }
  return _db;
}

/**
 * Automation rule structure
 */
interface AutomationRule {
  id: string;
  orgId: string;
  name: string;
  enabled: boolean;
  trigger: "project_completed" | "invoice_paid" | "manual";
  delayDays: number;
  channel: "sms" | "email";
  templateId?: string;
}

/**
 * Project data structure
 */
interface ProjectData {
  id: string;
  orgId: string;
  clientId: string;
  name: string;
  status: string;
}

/**
 * Client data structure
 */
interface ClientData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

/**
 * Check if a review request already exists for this project
 */
async function reviewRequestExists(orgId: string, projectId: string): Promise<boolean> {
  const snapshot = await getDb()
    .collection("organizations")
    .doc(orgId)
    .collection("reviewRequests")
    .where("projectId", "==", projectId)
    .limit(1)
    .get();

  return !snapshot.empty;
}

/**
 * Get active automation rules for an organization
 */
async function getActiveRules(
  orgId: string,
  trigger: "project_completed" | "invoice_paid"
): Promise<AutomationRule[]> {
  const snapshot = await getDb()
    .collection("organizations")
    .doc(orgId)
    .collection("reviewAutomationRules")
    .where("enabled", "==", true)
    .where("trigger", "==", trigger)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AutomationRule[];
}

/**
 * Get client data
 */
async function getClient(orgId: string, clientId: string): Promise<ClientData | null> {
  const doc = await getDb()
    .collection("organizations")
    .doc(orgId)
    .collection("clients")
    .doc(clientId)
    .get();

  if (!doc.exists) return null;

  return { id: doc.id, ...doc.data() } as ClientData;
}

/**
 * Create a scheduled review request
 * If delayDays > 0, the request will be created with a scheduledFor date
 */
async function createReviewRequest(
  orgId: string,
  projectId: string,
  client: ClientData,
  rule: AutomationRule
): Promise<string> {
  const db = getDb();

  // Determine contact info based on channel
  const recipientEmail = rule.channel === "email" ? client.email : undefined;
  const recipientPhone = rule.channel === "sms" ? client.phone : undefined;

  // Validate contact info exists
  if (rule.channel === "email" && !recipientEmail) {
    console.log(`Cannot create review request: Client ${client.id} has no email address`);
    throw new Error("Client has no email address");
  }
  if (rule.channel === "sms" && !recipientPhone) {
    console.log(`Cannot create review request: Client ${client.id} has no phone number`);
    throw new Error("Client has no phone number");
  }

  // Calculate scheduled send time
  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + (rule.delayDays || 0));

  const requestData = {
    orgId,
    projectId,
    clientId: client.id,
    channel: rule.channel,
    status: rule.delayDays > 0 ? "scheduled" : "pending",
    templateId: rule.templateId || null,
    recipientName: client.name,
    recipientEmail: recipientEmail || null,
    recipientPhone: recipientPhone || null,
    automationRuleId: rule.id,
    scheduledFor: rule.delayDays > 0 ? Timestamp.fromDate(scheduledFor) : null,
    retryCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await db
    .collection("organizations")
    .doc(orgId)
    .collection("reviewRequests")
    .add(requestData);

  // Update rule stats
  await db
    .collection("organizations")
    .doc(orgId)
    .collection("reviewAutomationRules")
    .doc(rule.id)
    .update({
      requestsSent: admin.firestore.FieldValue.increment(1),
      updatedAt: Timestamp.now(),
    });

  console.log(`Created review request ${docRef.id} for project ${projectId} via rule ${rule.id}`);
  return docRef.id;
}

/**
 * Handle project completion - check for automation rules and create requests
 */
export async function handleProjectCompleted(
  orgId: string,
  projectId: string,
  projectData: ProjectData
): Promise<void> {
  // Check if request already exists
  const exists = await reviewRequestExists(orgId, projectId);
  if (exists) {
    console.log(`Review request already exists for project ${projectId}, skipping automation`);
    return;
  }

  // Get active rules for project_completed trigger
  const rules = await getActiveRules(orgId, "project_completed");
  if (rules.length === 0) {
    console.log(`No active automation rules for project_completed in org ${orgId}`);
    return;
  }

  // Get client data
  if (!projectData.clientId) {
    console.log(`Project ${projectId} has no clientId, cannot create review request`);
    return;
  }

  const client = await getClient(orgId, projectData.clientId);
  if (!client) {
    console.log(`Client ${projectData.clientId} not found for project ${projectId}`);
    return;
  }

  // Create review request for the first matching rule
  // (In the future, we could support multiple rules with different channels)
  const rule = rules[0];
  try {
    await createReviewRequest(orgId, projectId, client, rule);
  } catch (error) {
    console.error(`Failed to create review request for project ${projectId}:`, error);
  }
}

/**
 * Handle invoice payment - check for automation rules and create requests
 */
export async function handleInvoicePaid(
  orgId: string,
  invoiceId: string,
  projectId: string | undefined,
  clientId: string
): Promise<void> {
  if (!projectId) {
    console.log(`Invoice ${invoiceId} has no projectId, cannot create review request`);
    return;
  }

  // Check if request already exists
  const exists = await reviewRequestExists(orgId, projectId);
  if (exists) {
    console.log(`Review request already exists for project ${projectId}, skipping automation`);
    return;
  }

  // Get active rules for invoice_paid trigger
  const rules = await getActiveRules(orgId, "invoice_paid");
  if (rules.length === 0) {
    console.log(`No active automation rules for invoice_paid in org ${orgId}`);
    return;
  }

  // Get client data
  const client = await getClient(orgId, clientId);
  if (!client) {
    console.log(`Client ${clientId} not found for invoice ${invoiceId}`);
    return;
  }

  // Create review request for the first matching rule
  const rule = rules[0];
  try {
    await createReviewRequest(orgId, projectId, client, rule);
  } catch (error) {
    console.error(`Failed to create review request for invoice ${invoiceId}:`, error);
  }
}
