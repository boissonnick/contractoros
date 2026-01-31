/**
 * QuickBooks Entity Mapping
 *
 * Manages bidirectional ID mappings between ContractorOS entities and QuickBooks Online.
 * Stores mappings in Firestore for persistent tracking of synced entities.
 */

import { adminDb, Timestamp } from '@/lib/firebase/admin';
import { QBOEntityMapping } from './types';

// Firestore collection path helper
const getMappingsCollectionPath = (orgId: string) =>
  `organizations/${orgId}/qboEntityMappings`;

/**
 * Get a mapping by local entity ID
 */
export async function getMapping(
  orgId: string,
  entityType: QBOEntityMapping['entityType'],
  localId: string
): Promise<QBOEntityMapping | null> {
  const collectionRef = adminDb.collection(getMappingsCollectionPath(orgId));

  const snapshot = await collectionRef
    .where('entityType', '==', entityType)
    .where('localId', '==', localId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return docToMapping(doc.id, doc.data());
}

/**
 * Get a mapping by QuickBooks entity ID
 */
export async function getMappingByQboId(
  orgId: string,
  entityType: QBOEntityMapping['entityType'],
  qboId: string
): Promise<QBOEntityMapping | null> {
  const collectionRef = adminDb.collection(getMappingsCollectionPath(orgId));

  const snapshot = await collectionRef
    .where('entityType', '==', entityType)
    .where('qboId', '==', qboId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return docToMapping(doc.id, doc.data());
}

/**
 * Create a new entity mapping
 */
export async function createMapping(
  orgId: string,
  mapping: Omit<QBOEntityMapping, 'id' | 'orgId'>
): Promise<string> {
  const collectionRef = adminDb.collection(getMappingsCollectionPath(orgId));

  const docRef = await collectionRef.add({
    ...mapping,
    orgId,
    lastSyncedAt: Timestamp.now(),
  });

  return docRef.id;
}

/**
 * Update an existing mapping
 */
export async function updateMapping(
  orgId: string,
  mappingId: string,
  updates: Partial<Pick<QBOEntityMapping, 'qboSyncToken' | 'syncStatus' | 'syncError'>>
): Promise<void> {
  const docRef = adminDb
    .collection(getMappingsCollectionPath(orgId))
    .doc(mappingId);

  await docRef.update({
    ...updates,
    lastSyncedAt: Timestamp.now(),
  });
}

/**
 * Delete a mapping
 */
export async function deleteMapping(
  orgId: string,
  mappingId: string
): Promise<void> {
  const docRef = adminDb
    .collection(getMappingsCollectionPath(orgId))
    .doc(mappingId);

  await docRef.delete();
}

/**
 * Get all mappings for an organization, optionally filtered by entity type
 */
export async function getAllMappings(
  orgId: string,
  entityType?: QBOEntityMapping['entityType']
): Promise<QBOEntityMapping[]> {
  const collectionRef = adminDb.collection(getMappingsCollectionPath(orgId));

  let query: FirebaseFirestore.Query = collectionRef;

  if (entityType) {
    query = query.where('entityType', '==', entityType);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => docToMapping(doc.id, doc.data()));
}

/**
 * Get mappings by local IDs (batch lookup)
 */
export async function getMappingsByLocalIds(
  orgId: string,
  entityType: QBOEntityMapping['entityType'],
  localIds: string[]
): Promise<Map<string, QBOEntityMapping>> {
  if (localIds.length === 0) {
    return new Map();
  }

  // Firestore 'in' queries are limited to 30 items
  const results = new Map<string, QBOEntityMapping>();
  const chunks = chunkArray(localIds, 30);

  for (const chunk of chunks) {
    const collectionRef = adminDb.collection(getMappingsCollectionPath(orgId));

    const snapshot = await collectionRef
      .where('entityType', '==', entityType)
      .where('localId', 'in', chunk)
      .get();

    for (const doc of snapshot.docs) {
      const mapping = docToMapping(doc.id, doc.data());
      results.set(mapping.localId, mapping);
    }
  }

  return results;
}

/**
 * Get mappings by QBO IDs (batch lookup)
 */
export async function getMappingsByQboIds(
  orgId: string,
  entityType: QBOEntityMapping['entityType'],
  qboIds: string[]
): Promise<Map<string, QBOEntityMapping>> {
  if (qboIds.length === 0) {
    return new Map();
  }

  const results = new Map<string, QBOEntityMapping>();
  const chunks = chunkArray(qboIds, 30);

  for (const chunk of chunks) {
    const collectionRef = adminDb.collection(getMappingsCollectionPath(orgId));

    const snapshot = await collectionRef
      .where('entityType', '==', entityType)
      .where('qboId', 'in', chunk)
      .get();

    for (const doc of snapshot.docs) {
      const mapping = docToMapping(doc.id, doc.data());
      results.set(mapping.qboId, mapping);
    }
  }

  return results;
}

/**
 * Create or update a mapping (upsert)
 */
export async function upsertMapping(
  orgId: string,
  entityType: QBOEntityMapping['entityType'],
  localId: string,
  qboId: string,
  qboSyncToken: string
): Promise<string> {
  const existing = await getMapping(orgId, entityType, localId);

  if (existing) {
    await updateMapping(orgId, existing.id, {
      qboSyncToken,
      syncStatus: 'synced',
      syncError: undefined,
    });
    return existing.id;
  }

  return createMapping(orgId, {
    entityType,
    localId,
    qboId,
    qboSyncToken,
    lastSyncedAt: new Date(),
    syncStatus: 'synced',
  });
}

/**
 * Mark a mapping as having an error
 */
export async function markMappingError(
  orgId: string,
  mappingId: string,
  error: string
): Promise<void> {
  await updateMapping(orgId, mappingId, {
    syncStatus: 'error',
    syncError: error,
  });
}

// Helper: Convert Firestore doc to QBOEntityMapping
function docToMapping(
  id: string,
  data: FirebaseFirestore.DocumentData
): QBOEntityMapping {
  return {
    id,
    orgId: data.orgId,
    entityType: data.entityType,
    localId: data.localId,
    qboId: data.qboId,
    qboSyncToken: data.qboSyncToken,
    lastSyncedAt: data.lastSyncedAt?.toDate() || new Date(),
    syncStatus: data.syncStatus || 'synced',
    syncError: data.syncError,
  };
}

// Helper: Split array into chunks
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
