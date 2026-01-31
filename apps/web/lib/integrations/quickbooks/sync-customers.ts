/**
 * QuickBooks Customer Sync
 *
 * Bidirectional synchronization between ContractorOS Clients and QBO Customers.
 */

import { adminDb, Timestamp } from '@/lib/firebase/admin';
import { Client, ClientAddress } from '@/types';
import { qboCreate, qboUpdate, qboQuery, QBOClientError } from './client';
import { QBOCustomer, QBOAddress, QBOEntityMapping } from './types';
import {
  getMapping,
  getMappingByQboId,
  upsertMapping,
  markMappingError,
} from './entity-mapping';
import { startSyncLog, completeSyncLog, failSyncLog, SyncResult } from './sync-logger';

// ============================================
// Field Mapping: ContractorOS Client → QBO Customer
// ============================================

/**
 * Convert a ContractorOS Client to a QBO Customer
 */
export function clientToQBOCustomer(client: Client): Partial<QBOCustomer> {
  // Get primary/billing address
  const billingAddress = client.addresses.find(a => a.type === 'billing' || a.isDefault)
    || client.addresses[0];

  const customer: Partial<QBOCustomer> = {
    DisplayName: client.displayName,
    GivenName: client.firstName,
    FamilyName: client.lastName,
    Active: client.status === 'active',
  };

  // Company name for commercial clients
  if (client.isCommercial && client.companyName) {
    customer.CompanyName = client.companyName;
  }

  // Email
  if (client.email) {
    customer.PrimaryEmailAddr = { Address: client.email };
  }

  // Phone
  if (client.phone) {
    customer.PrimaryPhone = { FreeFormNumber: client.phone };
  }

  // Billing address
  if (billingAddress) {
    customer.BillAddr = addressToQBO(billingAddress);
  }

  // Notes - combine pinned notes
  const pinnedNotes = client.notes
    .filter(n => n.isPinned)
    .map(n => n.content)
    .join('\n');
  if (pinnedNotes) {
    customer.Notes = pinnedNotes.substring(0, 4000); // QBO limit
  }

  return customer;
}

/**
 * Convert ContractorOS address to QBO address format
 */
function addressToQBO(address: ClientAddress): QBOAddress {
  return {
    Line1: address.street,
    City: address.city,
    CountrySubDivisionCode: address.state,
    PostalCode: address.zip,
    Country: 'US', // Default to US
  };
}

// ============================================
// Field Mapping: QBO Customer → ContractorOS Client
// ============================================

/**
 * Convert QBO Customer fields to Client update data
 * Note: This returns partial data for updating, not creating
 */
export function qboCustomerToClientUpdate(customer: QBOCustomer): Partial<Client> {
  const update: Partial<Client> = {
    displayName: customer.DisplayName,
  };

  if (customer.GivenName) {
    update.firstName = customer.GivenName;
  }

  if (customer.FamilyName) {
    update.lastName = customer.FamilyName;
  }

  if (customer.CompanyName) {
    update.companyName = customer.CompanyName;
    update.isCommercial = true;
  }

  if (customer.PrimaryEmailAddr?.Address) {
    update.email = customer.PrimaryEmailAddr.Address;
  }

  if (customer.PrimaryPhone?.FreeFormNumber) {
    update.phone = customer.PrimaryPhone.FreeFormNumber;
  }

  // Status based on Active flag
  if (customer.Active === false) {
    update.status = 'inactive';
  }

  return update;
}

/**
 * Convert QBO address to ContractorOS address format
 */
function qboToAddress(qboAddr: QBOAddress, type: 'billing' | 'property' = 'billing'): ClientAddress {
  return {
    id: crypto.randomUUID(),
    type,
    street: qboAddr.Line1 || '',
    city: qboAddr.City || '',
    state: qboAddr.CountrySubDivisionCode || '',
    zip: qboAddr.PostalCode || '',
    isDefault: type === 'billing',
  };
}

// ============================================
// Sync Operations
// ============================================

/**
 * Push a single client to QuickBooks
 * Creates new customer if not mapped, updates if mapped
 */
export async function pushClientToQBO(
  orgId: string,
  client: Client
): Promise<{ qboId: string; created: boolean }> {
  // Check for existing mapping using entity-mapping module
  const mapping = await getMapping(orgId, 'client', client.id);

  const customerData = clientToQBOCustomer(client);

  if (mapping) {
    // Update existing customer
    const updateData = {
      ...customerData,
      Id: mapping.qboId,
      SyncToken: mapping.qboSyncToken,
    };

    const updated = await qboUpdate<QBOCustomer>(orgId, 'Customer', updateData);

    // Update mapping with new sync token using entity-mapping module
    await upsertMapping(orgId, 'client', client.id, mapping.qboId, updated.SyncToken || mapping.qboSyncToken);

    return { qboId: mapping.qboId, created: false };
  } else {
    // Create new customer
    const created = await qboCreate<QBOCustomer>(orgId, 'Customer', customerData);

    if (!created.Id) {
      throw new QBOClientError('Customer created but no ID returned', 'SYNC_ERROR');
    }

    // Create mapping using entity-mapping module
    await upsertMapping(orgId, 'client', client.id, created.Id, created.SyncToken || '0');

    return { qboId: created.Id, created: true };
  }
}

/**
 * Pull customers from QuickBooks and update local clients
 * Only updates clients that have existing mappings
 */
export async function pullCustomersFromQBO(
  orgId: string,
  options: {
    modifiedSince?: Date;
    maxResults?: number;
  } = {}
): Promise<{
  updated: number;
  errors: Array<{ qboId: string; error: string }>;
}> {
  const { modifiedSince, maxResults = 100 } = options;

  // Build query
  let query = '';
  if (modifiedSince) {
    const dateStr = modifiedSince.toISOString().split('T')[0];
    query = `MetaData.LastUpdatedTime > '${dateStr}'`;
  }

  // Fetch customers from QBO
  const response = await qboQuery<QBOCustomer>(orgId, 'Customer', query, maxResults);
  const customers = response.QueryResponse.Customer || [];

  let updated = 0;
  const errors: Array<{ qboId: string; error: string }> = [];

  for (const customer of customers) {
    if (!customer.Id) continue;

    try {
      // Find mapping for this QBO customer using entity-mapping module
      const mapping = await getMappingByQboId(orgId, 'client', customer.Id);

      if (!mapping) {
        // No local client mapped to this QBO customer - skip
        continue;
      }

      // Update local client
      const updateData = qboCustomerToClientUpdate(customer);

      await adminDb
        .collection('organizations')
        .doc(orgId)
        .collection('clients')
        .doc(mapping.localId)
        .update({
          ...updateData,
          updatedAt: Timestamp.now(),
        });

      // Update mapping using entity-mapping module
      await upsertMapping(orgId, 'client', mapping.localId, customer.Id, customer.SyncToken || mapping.qboSyncToken);

      updated++;
    } catch (error) {
      errors.push({
        qboId: customer.Id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { updated, errors };
}

/**
 * Sync a batch of clients to QuickBooks
 * Uses sync-logger for audit trail
 */
export async function syncClientsToQBO(
  orgId: string,
  clientIds?: string[]
): Promise<{
  created: number;
  updated: number;
  errors: Array<{ clientId: string; error: string }>;
}> {
  // Start sync log for audit trail
  const logId = await startSyncLog(orgId, 'sync_customers');

  let created = 0;
  let updated = 0;
  const errors: Array<{ clientId: string; error: string }> = [];

  try {
    // Get clients to sync
    const clientsQuery = adminDb
      .collection('organizations')
      .doc(orgId)
      .collection('clients');

    if (clientIds && clientIds.length > 0) {
      // Firestore 'in' query limited to 30 items
      const batches: string[][] = [];
      for (let i = 0; i < clientIds.length; i += 30) {
        batches.push(clientIds.slice(i, i + 30));
      }

      for (const batch of batches) {
        const snapshot = await clientsQuery.where('__name__', 'in', batch).get();

        for (const doc of snapshot.docs) {
          const client = { id: doc.id, ...doc.data() } as Client;
          try {
            const result = await pushClientToQBO(orgId, client);
            if (result.created) {
              created++;
            } else {
              updated++;
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push({ clientId: client.id, error: errorMessage });
          }
        }
      }
    } else {
      // Sync all active clients
      const snapshot = await clientsQuery
        .where('status', '==', 'active')
        .get();

      for (const doc of snapshot.docs) {
        const client = { id: doc.id, ...doc.data() } as Client;
        try {
          const result = await pushClientToQBO(orgId, client);
          if (result.created) {
            created++;
          } else {
            updated++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ clientId: client.id, error: errorMessage });
        }
      }
    }

    // Complete sync log with results
    await completeSyncLog(orgId, logId, {
      itemsSynced: created + updated,
      itemsFailed: errors.length,
      errors: errors.map(e => `${e.clientId}: ${e.error}`),
    });

    return { created, updated, errors };
  } catch (error) {
    // Mark sync as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await failSyncLog(orgId, logId, errorMessage);
    throw error;
  }
}

/**
 * Find a QBO customer by email (for initial linking)
 */
export async function findQBOCustomerByEmail(
  orgId: string,
  email: string
): Promise<QBOCustomer | null> {
  const query = `PrimaryEmailAddr = '${email}'`;
  const response = await qboQuery<QBOCustomer>(orgId, 'Customer', query, 1);
  const customers = response.QueryResponse.Customer || [];
  return customers[0] || null;
}

/**
 * Auto-link existing clients to QBO customers by email
 */
export async function autoLinkClientsByEmail(
  orgId: string
): Promise<{
  linked: number;
  notFound: number;
  errors: Array<{ clientId: string; error: string }>;
}> {
  // Get all clients without QBO mapping
  const clientsSnapshot = await adminDb
    .collection('organizations')
    .doc(orgId)
    .collection('clients')
    .where('status', '==', 'active')
    .get();

  let linked = 0;
  let notFound = 0;
  const errors: Array<{ clientId: string; error: string }> = [];

  for (const doc of clientsSnapshot.docs) {
    const client = { id: doc.id, ...doc.data() } as Client;

    // Check if already mapped using entity-mapping module
    const existingMapping = await getMapping(orgId, 'client', client.id);
    if (existingMapping) continue;

    if (!client.email) {
      notFound++;
      continue;
    }

    try {
      const qboCustomer = await findQBOCustomerByEmail(orgId, client.email);

      if (qboCustomer && qboCustomer.Id) {
        // Create mapping using entity-mapping module
        await upsertMapping(orgId, 'client', client.id, qboCustomer.Id, qboCustomer.SyncToken || '0');
        linked++;
      } else {
        notFound++;
      }
    } catch (error) {
      errors.push({
        clientId: client.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { linked, notFound, errors };
}

// ============================================
// Status Functions
// ============================================

/**
 * Get sync status for a client
 */
export async function getClientSyncStatus(
  orgId: string,
  clientId: string
): Promise<{
  isSynced: boolean;
  qboId?: string;
  lastSyncedAt?: Date;
  syncStatus?: string;
  syncError?: string;
} | null> {
  const mapping = await getMapping(orgId, 'client', clientId);

  if (!mapping) {
    return { isSynced: false };
  }

  return {
    isSynced: true,
    qboId: mapping.qboId,
    lastSyncedAt: mapping.lastSyncedAt,
    syncStatus: mapping.syncStatus,
    syncError: mapping.syncError,
  };
}
