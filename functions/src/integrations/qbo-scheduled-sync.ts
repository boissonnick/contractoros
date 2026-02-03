/**
 * QuickBooks Online Scheduled Sync Cloud Function
 *
 * Automatically syncs data between ContractorOS and QuickBooks Online
 * for organizations with active QBO connections.
 *
 * Runs daily and syncs:
 * - Invoices (bidirectional - push new, pull updates)
 * - Expenses (push to QBO)
 * - Payments (pull from QBO)
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { Firestore, Timestamp } from "firebase-admin/firestore";

// Define secrets for QBO OAuth
const qboClientId = defineSecret("QUICKBOOKS_CLIENT_ID");
const qboClientSecret = defineSecret("QUICKBOOKS_CLIENT_SECRET");

// Lazy initialization pattern for named Firestore database
let _db: Firestore | null = null;
function getDb(): Firestore {
  if (!_db) {
    // Use named database 'contractoros'
    // Note: For firebase-admin, we need to specify the database at initialization
    // Since admin.initializeApp() is called in index.ts, we use getFirestore with the named database
    const { getFirestore } = require("firebase-admin/firestore") as typeof import("firebase-admin/firestore");
    _db = getFirestore(admin.app(), "contractoros");
  }
  return _db as Firestore;
}

// Region configuration
const REGION = "us-east1";

// ============================================
// Types
// ============================================

interface IntegrationSyncLog {
  id: string;
  orgId: string;
  integrationType: "quickbooks" | "gusto" | "stripe";
  status: "success" | "partial" | "failed";
  startedAt: Date;
  completedAt: Date;
  itemsSynced: number;
  errors: string[];
  details: Record<string, unknown>;
}

interface QBOConnection {
  isConnected: boolean;
  provider: string;
  companyId: string;
  companyName: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: FirebaseFirestore.Timestamp;
  syncSettings: {
    autoSyncInvoices: boolean;
    autoSyncExpenses: boolean;
    autoSyncPayments: boolean;
    syncFrequency: string;
  };
  lastSyncAt?: FirebaseFirestore.Timestamp;
}

interface Organization {
  id: string;
  name: string;
}

interface SyncResult {
  itemsSynced: number;
  itemsFailed: number;
  errors: string[];
  details: Record<string, unknown>;
}

// QBO API endpoints
const QBO_API_ENDPOINTS = {
  sandbox: "https://sandbox-quickbooks.api.intuit.com",
  production: "https://quickbooks.api.intuit.com",
} as const;

const QBO_AUTH_ENDPOINTS = {
  token: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
} as const;

// ============================================
// Token Management
// ============================================

/**
 * Refresh QBO access token if expired or about to expire
 */
async function refreshAccessToken(
  orgId: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date } | null> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const response = await fetch(QBO_AUTH_ENDPOINTS.token, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Token refresh failed for org ${orgId}:`, errorText);
      return null;
    }

    const data = await response.json();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
    };
  } catch (error) {
    console.error(`Token refresh error for org ${orgId}:`, error);
    return null;
  }
}

/**
 * Get valid access token, refreshing if necessary
 */
async function getValidAccessToken(
  orgId: string,
  connection: QBOConnection,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  const tokenExpiresAt = connection.tokenExpiresAt?.toDate() || new Date(0);

  if (now.getTime() > tokenExpiresAt.getTime() - bufferTime) {
    // Token is expired or about to expire, refresh it
    const newTokens = await refreshAccessToken(
      orgId,
      connection.refreshToken,
      clientId,
      clientSecret
    );

    if (!newTokens) {
      return null;
    }

    // Update tokens in Firestore
    const db = getDb();
    await db
      .collection("organizations")
      .doc(orgId)
      .collection("accountingConnections")
      .doc("quickbooks")
      .update({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        tokenExpiresAt: Timestamp.fromDate(newTokens.expiresAt),
        updatedAt: Timestamp.now(),
      });

    return newTokens.accessToken;
  }

  return connection.accessToken;
}

// ============================================
// QBO API Helpers
// ============================================

/**
 * Make an authenticated request to QBO API
 */
async function qboApiRequest<T>(
  accessToken: string,
  realmId: string,
  method: "GET" | "POST",
  endpoint: string,
  body?: Record<string, unknown>
): Promise<T | null> {
  const environment =
    (process.env.QUICKBOOKS_ENVIRONMENT as "sandbox" | "production") || "sandbox";
  const baseUrl = QBO_API_ENDPOINTS[environment];
  const url = `${baseUrl}/v3/company/${realmId}${endpoint}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      console.error(`QBO API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("QBO API request failed:", error);
    return null;
  }
}

/**
 * Query QBO entities
 */
async function qboQuery<T>(
  accessToken: string,
  realmId: string,
  entity: string,
  query?: string,
  maxResults = 100
): Promise<T[]> {
  let queryString = `SELECT * FROM ${entity}`;

  if (query) {
    queryString += ` WHERE ${query}`;
  }

  queryString += ` MAXRESULTS ${maxResults}`;

  const encodedQuery = encodeURIComponent(queryString);
  const response = await qboApiRequest<{ QueryResponse: Record<string, T[]> }>(
    accessToken,
    realmId,
    "GET",
    `/query?query=${encodedQuery}`
  );

  if (!response) {
    return [];
  }

  return response.QueryResponse[entity] || [];
}

// ============================================
// Sync Operations
// ============================================

/**
 * Sync invoices for an organization
 * - Push new/updated invoices to QBO
 * - Pull payment updates from QBO
 */
async function syncInvoices(
  orgId: string,
  accessToken: string,
  realmId: string,
  lastSyncAt: Date | null
): Promise<SyncResult> {
  const db = getDb();
  const result: SyncResult = {
    itemsSynced: 0,
    itemsFailed: 0,
    errors: [],
    details: { pushed: 0, pulled: 0 },
  };

  try {
    // Pull invoice updates from QBO (for payment sync)
    let query = "";
    if (lastSyncAt) {
      const dateStr = lastSyncAt.toISOString().split("T")[0];
      query = `MetaData.LastUpdatedTime > '${dateStr}'`;
    }

    const qboInvoices = await qboQuery<{
      Id: string;
      Balance: number;
      TotalAmt: number;
      SyncToken: string;
    }>(accessToken, realmId, "Invoice", query);

    // Get local invoice mappings
    const mappingsSnapshot = await db
      .collection(`organizations/${orgId}/qboEntityMappings`)
      .where("entityType", "==", "invoice")
      .get();

    const mappingsByQboId = new Map<
      string,
      { localId: string; qboSyncToken: string }
    >();
    mappingsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      mappingsByQboId.set(data.qboId, {
        localId: data.localId,
        qboSyncToken: data.qboSyncToken,
      });
    });

    // Update local invoices with balance changes from QBO
    for (const qboInvoice of qboInvoices) {
      const mapping = mappingsByQboId.get(qboInvoice.Id);
      if (!mapping) continue;

      try {
        const invoiceRef = db
          .collection("organizations")
          .doc(orgId)
          .collection("invoices")
          .doc(mapping.localId);

        const invoiceDoc = await invoiceRef.get();
        if (!invoiceDoc.exists) continue;

        const invoiceData = invoiceDoc.data();
        const currentAmountDue = invoiceData?.amountDue || 0;
        const newAmountDue = qboInvoice.Balance;

        // Only update if balance changed
        if (currentAmountDue !== newAmountDue) {
          const amountPaid = qboInvoice.TotalAmt - qboInvoice.Balance;
          const updates: Record<string, unknown> = {
            amountDue: newAmountDue,
            amountPaid: amountPaid,
            updatedAt: Timestamp.now(),
          };

          // Update status if fully paid
          if (newAmountDue === 0 && qboInvoice.TotalAmt > 0) {
            updates.status = "paid";
            updates.paidAt = Timestamp.now();
          }

          await invoiceRef.update(updates);

          // Update mapping sync token
          await db
            .collection(`organizations/${orgId}/qboEntityMappings`)
            .where("entityType", "==", "invoice")
            .where("qboId", "==", qboInvoice.Id)
            .get()
            .then((snapshot) => {
              snapshot.docs.forEach((doc) => {
                doc.ref.update({
                  qboSyncToken: qboInvoice.SyncToken,
                  lastSyncedAt: Timestamp.now(),
                });
              });
            });

          result.itemsSynced++;
          (result.details.pulled as number)++;
        }
      } catch (error) {
        result.itemsFailed++;
        result.errors.push(
          `Invoice ${qboInvoice.Id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  } catch (error) {
    result.errors.push(
      `Invoice sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return result;
}

/**
 * Sync expenses for an organization
 * - Push approved expenses to QBO as Purchases
 */
async function syncExpenses(
  orgId: string,
  accessToken: string,
  realmId: string,
  lastSyncAt: Date | null
): Promise<SyncResult> {
  const db = getDb();
  const result: SyncResult = {
    itemsSynced: 0,
    itemsFailed: 0,
    errors: [],
    details: { pushed: 0 },
  };

  try {
    // Get approved expenses that haven't been synced
    let expensesQuery = db
      .collection("organizations")
      .doc(orgId)
      .collection("expenses")
      .where("status", "==", "approved");

    if (lastSyncAt) {
      expensesQuery = expensesQuery.where(
        "updatedAt",
        ">=",
        Timestamp.fromDate(lastSyncAt)
      );
    }

    const expensesSnapshot = await expensesQuery.limit(50).get();

    for (const expenseDoc of expensesSnapshot.docs) {
      const expense = expenseDoc.data();

      // Check if already synced
      const existingMapping = await db
        .collection(`organizations/${orgId}/qboEntityMappings`)
        .where("entityType", "==", "expense")
        .where("localId", "==", expenseDoc.id)
        .get();

      if (!existingMapping.empty) {
        // Already synced, skip
        continue;
      }

      try {
        // Create Purchase in QBO
        const purchaseData = {
          PaymentType: "Cash",
          TxnDate: new Date().toISOString().split("T")[0],
          TotalAmt: expense.amount,
          Line: [
            {
              Amount: expense.amount,
              DetailType: "AccountBasedExpenseLineDetail",
              AccountBasedExpenseLineDetail: {
                AccountRef: { value: "1" }, // Default expense account
              },
              Description: expense.description || "Expense from ContractorOS",
            },
          ],
          PrivateNote: `ContractorOS Expense: ${expense.category || "General"}`,
        };

        const createdPurchase = await qboApiRequest<{
          Purchase: { Id: string; SyncToken: string };
        }>(accessToken, realmId, "POST", "/purchase", purchaseData);

        if (createdPurchase?.Purchase?.Id) {
          // Create mapping
          await db.collection(`organizations/${orgId}/qboEntityMappings`).add({
            entityType: "expense",
            localId: expenseDoc.id,
            qboId: createdPurchase.Purchase.Id,
            qboSyncToken: createdPurchase.Purchase.SyncToken || "0",
            lastSyncedAt: Timestamp.now(),
            syncStatus: "synced",
          });

          result.itemsSynced++;
          (result.details.pushed as number)++;
        }
      } catch (error) {
        result.itemsFailed++;
        result.errors.push(
          `Expense ${expenseDoc.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  } catch (error) {
    result.errors.push(
      `Expense sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return result;
}

/**
 * Sync payments for an organization
 * - Pull new payments from QBO
 */
async function syncPayments(
  orgId: string,
  accessToken: string,
  realmId: string,
  lastSyncAt: Date | null
): Promise<SyncResult> {
  const db = getDb();
  const result: SyncResult = {
    itemsSynced: 0,
    itemsFailed: 0,
    errors: [],
    details: { pulled: 0 },
  };

  try {
    // Query payments from QBO
    let query = "";
    if (lastSyncAt) {
      const dateStr = lastSyncAt.toISOString().split("T")[0];
      query = `MetaData.LastUpdatedTime > '${dateStr}'`;
    }

    const qboPayments = await qboQuery<{
      Id: string;
      TotalAmt: number;
      TxnDate: string;
      CustomerRef?: { value: string; name: string };
      PaymentMethodRef?: { name: string };
      SyncToken: string;
      Line?: Array<{
        LinkedTxn?: Array<{ TxnId: string; TxnType: string }>;
      }>;
    }>(accessToken, realmId, "Payment", query);

    for (const qboPayment of qboPayments) {
      // Check if payment already synced
      const existingMapping = await db
        .collection(`organizations/${orgId}/qboEntityMappings`)
        .where("entityType", "==", "payment")
        .where("qboId", "==", qboPayment.Id)
        .get();

      if (!existingMapping.empty) {
        // Already synced, skip
        continue;
      }

      try {
        // Find linked invoice
        const linkedInvoice = qboPayment.Line?.flatMap(
          (line) =>
            line.LinkedTxn?.filter((txn) => txn.TxnType === "Invoice") || []
        )?.[0];

        if (!linkedInvoice) {
          continue; // No linked invoice, skip
        }

        // Find local invoice mapping
        const invoiceMappingSnapshot = await db
          .collection(`organizations/${orgId}/qboEntityMappings`)
          .where("entityType", "==", "invoice")
          .where("qboId", "==", linkedInvoice.TxnId)
          .get();

        if (invoiceMappingSnapshot.empty) {
          continue; // Invoice not synced, skip
        }

        const invoiceMapping = invoiceMappingSnapshot.docs[0].data();

        // Get the invoice to get project and client IDs
        const invoiceDoc = await db
          .collection("organizations")
          .doc(orgId)
          .collection("invoices")
          .doc(invoiceMapping.localId)
          .get();

        if (!invoiceDoc.exists) {
          continue;
        }

        const invoiceData = invoiceDoc.data();

        // Create local payment record
        const paymentRef = await db
          .collection("organizations")
          .doc(orgId)
          .collection("payments")
          .add({
            invoiceId: invoiceMapping.localId,
            projectId: invoiceData?.projectId || "",
            clientId: invoiceData?.clientId || "",
            amount: qboPayment.TotalAmt,
            paymentDate: Timestamp.fromDate(new Date(qboPayment.TxnDate)),
            paymentMethod: qboPayment.PaymentMethodRef?.name || "Other",
            referenceNumber: qboPayment.Id,
            qboPaymentId: qboPayment.Id,
            createdAt: Timestamp.now(),
          });

        // Create mapping
        await db.collection(`organizations/${orgId}/qboEntityMappings`).add({
          entityType: "payment",
          localId: paymentRef.id,
          qboId: qboPayment.Id,
          qboSyncToken: qboPayment.SyncToken || "0",
          lastSyncedAt: Timestamp.now(),
          syncStatus: "synced",
        });

        result.itemsSynced++;
        (result.details.pulled as number)++;
      } catch (error) {
        result.itemsFailed++;
        result.errors.push(
          `Payment ${qboPayment.Id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  } catch (error) {
    result.errors.push(
      `Payment sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  return result;
}

// ============================================
// Main Sync Logic
// ============================================

/**
 * Perform full sync for an organization
 */
async function syncOrganization(
  org: Organization,
  connection: QBOConnection,
  clientId: string,
  clientSecret: string
): Promise<IntegrationSyncLog> {
  const startedAt = new Date();
  const db = getDb();
  const errors: string[] = [];
  let totalSynced = 0;
  const details: Record<string, unknown> = {};

  console.log(`Starting QBO sync for org: ${org.name} (${org.id})`);

  // Get valid access token
  const accessToken = await getValidAccessToken(
    org.id,
    connection,
    clientId,
    clientSecret
  );

  if (!accessToken) {
    return {
      id: "",
      orgId: org.id,
      integrationType: "quickbooks",
      status: "failed",
      startedAt,
      completedAt: new Date(),
      itemsSynced: 0,
      errors: ["Failed to get valid access token. Re-authentication may be required."],
      details: {},
    };
  }

  const lastSyncAt = connection.lastSyncAt?.toDate() || null;
  const realmId = connection.companyId;

  // Sync invoices if enabled
  if (connection.syncSettings.autoSyncInvoices) {
    const invoiceResult = await syncInvoices(org.id, accessToken, realmId, lastSyncAt);
    totalSynced += invoiceResult.itemsSynced;
    errors.push(...invoiceResult.errors);
    details.invoices = invoiceResult.details;
    details.invoicesSynced = invoiceResult.itemsSynced;
    details.invoicesFailed = invoiceResult.itemsFailed;
  }

  // Sync expenses if enabled
  if (connection.syncSettings.autoSyncExpenses) {
    const expenseResult = await syncExpenses(org.id, accessToken, realmId, lastSyncAt);
    totalSynced += expenseResult.itemsSynced;
    errors.push(...expenseResult.errors);
    details.expenses = expenseResult.details;
    details.expensesSynced = expenseResult.itemsSynced;
    details.expensesFailed = expenseResult.itemsFailed;
  }

  // Sync payments if enabled
  if (connection.syncSettings.autoSyncPayments) {
    const paymentResult = await syncPayments(org.id, accessToken, realmId, lastSyncAt);
    totalSynced += paymentResult.itemsSynced;
    errors.push(...paymentResult.errors);
    details.payments = paymentResult.details;
    details.paymentsSynced = paymentResult.itemsSynced;
    details.paymentsFailed = paymentResult.itemsFailed;
  }

  const completedAt = new Date();

  // Determine status
  let status: IntegrationSyncLog["status"];
  if (errors.length === 0) {
    status = "success";
  } else if (totalSynced > 0) {
    status = "partial";
  } else {
    status = "failed";
  }

  // Update last sync time on connection
  await db
    .collection("organizations")
    .doc(org.id)
    .collection("accountingConnections")
    .doc("quickbooks")
    .update({
      lastSyncAt: Timestamp.now(),
      lastSyncStatus: status,
      updatedAt: Timestamp.now(),
    });

  // Create sync log
  const logRef = await db
    .collection("organizations")
    .doc(org.id)
    .collection("integrationSyncLogs")
    .add({
      orgId: org.id,
      integrationType: "quickbooks",
      status,
      startedAt: Timestamp.fromDate(startedAt),
      completedAt: Timestamp.fromDate(completedAt),
      itemsSynced: totalSynced,
      errors: errors.slice(0, 100), // Limit stored errors
      details,
    });

  console.log(
    `QBO sync completed for org ${org.id}: ${status}, ${totalSynced} items synced, ${errors.length} errors`
  );

  return {
    id: logRef.id,
    orgId: org.id,
    integrationType: "quickbooks",
    status,
    startedAt,
    completedAt,
    itemsSynced: totalSynced,
    errors: errors.slice(0, 100),
    details,
  };
}

/**
 * Main function to sync all organizations with active QBO connections
 */
async function runScheduledSync(
  clientId: string,
  clientSecret: string
): Promise<{
  success: boolean;
  orgsProcessed: number;
  totalItemsSynced: number;
  errors: string[];
}> {
  const db = getDb();
  const errors: string[] = [];
  let orgsProcessed = 0;
  let totalItemsSynced = 0;

  console.log("Starting scheduled QBO sync for all organizations");

  try {
    // Get all organizations
    const orgsSnapshot = await db.collection("organizations").get();

    for (const orgDoc of orgsSnapshot.docs) {
      const org: Organization = {
        id: orgDoc.id,
        name: orgDoc.data().name || "Unknown Org",
      };

      // Check for active QBO connection
      const connectionDoc = await db
        .collection("organizations")
        .doc(org.id)
        .collection("accountingConnections")
        .doc("quickbooks")
        .get();

      if (!connectionDoc.exists) {
        continue; // No QBO connection, skip
      }

      const connection = connectionDoc.data() as QBOConnection;

      if (!connection.isConnected) {
        continue; // Connection not active, skip
      }

      // Check sync frequency (only sync if set to 'daily' or 'auto')
      const syncFrequency = connection.syncSettings?.syncFrequency || "manual";
      if (syncFrequency === "manual") {
        continue; // Manual sync only, skip
      }

      try {
        const result = await syncOrganization(org, connection, clientId, clientSecret);
        orgsProcessed++;
        totalItemsSynced += result.itemsSynced;
        errors.push(...result.errors);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push(`Org ${org.id}: ${errorMessage}`);
      }

      // Rate limiting: wait between orgs to avoid API throttling
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    errors.push(`Scheduled sync failed: ${errorMessage}`);
  }

  console.log(
    `Scheduled QBO sync completed: ${orgsProcessed} orgs processed, ${totalItemsSynced} items synced, ${errors.length} errors`
  );

  return {
    success: errors.length === 0,
    orgsProcessed,
    totalItemsSynced,
    errors: errors.slice(0, 50), // Limit returned errors
  };
}

// ============================================
// Cloud Function Exports
// ============================================

/**
 * Scheduled function - runs daily at 2:00 AM Pacific
 * Syncs all organizations with active QBO connections
 */
export const qboScheduledSync = onSchedule(
  {
    schedule: "0 2 * * *", // 2:00 AM daily
    timeZone: "America/Los_Angeles",
    region: REGION,
    secrets: [qboClientId, qboClientSecret],
    memory: "512MiB",
    timeoutSeconds: 540, // 9 minutes max
    retryCount: 1,
  },
  async () => {
    console.log("Starting scheduled QBO sync");
    const result = await runScheduledSync(
      qboClientId.value(),
      qboClientSecret.value()
    );
    console.log("Scheduled QBO sync complete:", result);
  }
);

/**
 * HTTP trigger for manual sync or testing
 * POST /qboManualSync
 * Body: { orgId?: string } - optional org ID to sync specific org
 */
export const qboManualSync = onRequest(
  {
    region: REGION,
    cors: true,
    secrets: [qboClientId, qboClientSecret],
    memory: "512MiB",
    timeoutSeconds: 300, // 5 minutes max
  },
  async (req, res) => {
    // Only allow POST
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Verify authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      // Verify Firebase ID token
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      const db = getDb();
      const { orgId } = req.body || {};

      if (orgId) {
        // Sync specific organization
        // Verify user has access to this org
        const userDoc = await db.collection("users").doc(decodedToken.uid).get();
        const userData = userDoc.data();

        if (userData?.orgId !== orgId && !["OWNER", "PM"].includes(userData?.role)) {
          res.status(403).json({ error: "Access denied to this organization" });
          return;
        }

        // Get connection
        const connectionDoc = await db
          .collection("organizations")
          .doc(orgId)
          .collection("accountingConnections")
          .doc("quickbooks")
          .get();

        if (!connectionDoc.exists) {
          res.status(404).json({ error: "No QuickBooks connection found" });
          return;
        }

        const connection = connectionDoc.data() as QBOConnection;

        if (!connection.isConnected) {
          res.status(400).json({ error: "QuickBooks is not connected" });
          return;
        }

        const orgDoc = await db.collection("organizations").doc(orgId).get();
        const org: Organization = {
          id: orgId,
          name: orgDoc.data()?.name || "Unknown Org",
        };

        const result = await syncOrganization(
          org,
          connection,
          qboClientId.value(),
          qboClientSecret.value()
        );

        res.status(result.status === "failed" ? 500 : 200).json({
          success: result.status !== "failed",
          status: result.status,
          itemsSynced: result.itemsSynced,
          errors: result.errors,
          details: result.details,
        });
      } else {
        // Run full scheduled sync (admin only)
        const userDoc = await db.collection("users").doc(decodedToken.uid).get();
        const userData = userDoc.data();

        if (!["OWNER"].includes(userData?.role)) {
          res
            .status(403)
            .json({ error: "Only organization owners can run full sync" });
          return;
        }

        const result = await runScheduledSync(
          qboClientId.value(),
          qboClientSecret.value()
        );

        res.status(result.success ? 200 : 500).json(result);
      }
    } catch (error) {
      console.error("Manual sync error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);
