/**
 * Query Executor - Sprint 31
 *
 * Executes ParsedQuery objects against Firestore.
 * Used by the natural language query feature.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  QueryConstraint,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  ParsedQuery,
  QueryResult,
  QueryEntityType,
  QueryFilter,
} from '@/types';

// ===========================================
// ENTITY TO COLLECTION MAPPING
// ===========================================

/**
 * Map entity types to Firestore collection paths
 */
function getCollectionPath(entity: QueryEntityType, orgId: string): string {
  const pathMap: Record<QueryEntityType, string> = {
    invoices: `organizations/${orgId}/invoices`,
    projects: `organizations/${orgId}/projects`,
    clients: `organizations/${orgId}/clients`,
    tasks: `organizations/${orgId}/tasks`,
    timeEntries: `organizations/${orgId}/timeEntries`,
    expenses: `organizations/${orgId}/expenses`,
    estimates: `organizations/${orgId}/estimates`,
    photos: `organizations/${orgId}/photos`,
    dailyLogs: `organizations/${orgId}/dailyLogs`,
    subcontractors: `organizations/${orgId}/subcontractors`,
    scheduleEvents: `organizations/${orgId}/scheduleEvents`,
  };

  return pathMap[entity];
}

// ===========================================
// FIELD NAME MAPPING
// ===========================================

/**
 * Map common field names to actual Firestore field names by entity
 */
function mapFieldName(field: string, entity: QueryEntityType): string {
  // Common mappings across entities
  const commonMappings: Record<string, string> = {
    created: 'createdAt',
    updated: 'updatedAt',
    date: 'date',
  };

  // Entity-specific mappings
  const entityMappings: Record<QueryEntityType, Record<string, string>> = {
    invoices: {
      amount: 'totalAmount',
      total: 'totalAmount',
      client: 'clientName',
      due: 'dueDate',
      paid: 'paidDate',
    },
    projects: {
      client: 'clientName',
      type: 'projectType',
      start: 'startDate',
      end: 'endDate',
    },
    clients: {
      revenue: 'totalRevenue',
      outstanding: 'outstandingBalance',
      balance: 'outstandingBalance',
    },
    tasks: {
      assignee: 'assigneeId',
      assigned: 'assigneeId',
      due: 'dueDate',
      project: 'projectId',
    },
    timeEntries: {
      hours: 'duration',
      duration: 'duration',
      worker: 'userId',
      user: 'userId',
      project: 'projectId',
    },
    expenses: {
      amount: 'amount',
      vendor: 'vendor',
      category: 'category',
      project: 'projectId',
    },
    estimates: {
      amount: 'totalAmount',
      total: 'totalAmount',
      client: 'clientName',
      project: 'projectName',
    },
    photos: {
      uploaded: 'uploadedAt',
      uploader: 'uploadedBy',
      project: 'projectId',
    },
    dailyLogs: {
      author: 'authorId',
      weather: 'weather',
      project: 'projectId',
    },
    subcontractors: {
      trade: 'trade',
      company: 'companyName',
    },
    scheduleEvents: {
      start: 'startTime',
      end: 'endTime',
      type: 'eventType',
      project: 'projectId',
    },
  };

  // Check entity-specific mapping first
  const entityMap = entityMappings[entity];
  if (entityMap && entityMap[field]) {
    return entityMap[field];
  }

  // Check common mapping
  if (commonMappings[field]) {
    return commonMappings[field];
  }

  // Return original field name
  return field;
}

// ===========================================
// FILTER TO CONSTRAINT CONVERSION
// ===========================================

/**
 * Convert a QueryFilter to a Firestore QueryConstraint
 */
function filterToConstraint(filter: QueryFilter, entity: QueryEntityType): QueryConstraint | null {
  const field = mapFieldName(filter.field, entity);
  let value = filter.value;

  // Convert dates to Firestore Timestamps
  if (value instanceof Date) {
    value = Timestamp.fromDate(value);
  }

  switch (filter.operator) {
    case 'eq':
      return where(field, '==', value);

    case 'neq':
      return where(field, '!=', value);

    case 'gt':
      return where(field, '>', value);

    case 'lt':
      return where(field, '<', value);

    case 'gte':
      return where(field, '>=', value);

    case 'lte':
      return where(field, '<=', value);

    case 'in':
      if (Array.isArray(value)) {
        return where(field, 'in', value);
      }
      return null;

    case 'not_in':
      if (Array.isArray(value)) {
        return where(field, 'not-in', value);
      }
      return null;

    case 'contains':
      // Firestore doesn't support native contains for strings
      // We'll handle this with client-side filtering
      return null;

    case 'between':
      // Firestore doesn't support between directly
      // We'll add two constraints
      return null;

    default:
      return null;
  }
}

// ===========================================
// DATE RANGE HANDLING
// ===========================================

/**
 * Convert date range to Firestore constraints
 */
function dateRangeToConstraints(
  dateRange: { field: string; start: Date; end: Date },
  entity: QueryEntityType
): QueryConstraint[] {
  const field = mapFieldName(dateRange.field, entity);
  const startTimestamp = Timestamp.fromDate(dateRange.start);
  const endTimestamp = Timestamp.fromDate(dateRange.end);

  return [
    where(field, '>=', startTimestamp),
    where(field, '<=', endTimestamp),
  ];
}

// ===========================================
// SORT HANDLING
// ===========================================

/**
 * Convert sort specification to Firestore orderBy constraint
 */
function sortToConstraint(
  sort: { field: string; direction: 'asc' | 'desc' },
  entity: QueryEntityType
): QueryConstraint {
  const field = mapFieldName(sort.field, entity);
  return orderBy(field, sort.direction);
}

// ===========================================
// CLIENT-SIDE FILTERS
// ===========================================

/**
 * Apply filters that can't be done in Firestore (e.g., contains)
 */
function applyClientSideFilters<T extends DocumentData>(
  items: T[],
  filters: QueryFilter[],
  entity: QueryEntityType
): T[] {
  let result = [...items];

  for (const filter of filters) {
    if (filter.operator === 'contains') {
      const field = mapFieldName(filter.field, entity);
      const searchValue = String(filter.value).toLowerCase();

      result = result.filter(item => {
        const fieldValue = item[field];
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(searchValue);
        }
        return false;
      });
    }

    if (filter.operator === 'between' && filter.value2 !== undefined) {
      const field = mapFieldName(filter.field, entity);
      const min = filter.value as number;
      const max = filter.value2 as number;

      result = result.filter(item => {
        const fieldValue = item[field];
        if (typeof fieldValue === 'number') {
          return fieldValue >= min && fieldValue <= max;
        }
        return false;
      });
    }
  }

  return result;
}

// ===========================================
// RESULT FORMATTING
// ===========================================

/**
 * Format query results for return
 */
function formatResults<T>(
  items: T[],
  query: ParsedQuery,
  executionTimeMs: number
): QueryResult<T> {
  const hasMore = items.length >= (query.limit || 25);

  return {
    success: true,
    data: items,
    totalCount: items.length,
    hasMore,
    query,
    executionTimeMs,
  };
}

// ===========================================
// MAIN EXECUTOR
// ===========================================

/**
 * Execute a parsed query against Firestore
 */
export async function executeQuery<T = DocumentData>(
  parsedQuery: ParsedQuery,
  orgId: string,
  options?: {
    /** Custom converter for results */
    converter?: (id: string, data: DocumentData) => T;
    /** Skip client-side filtering (for performance) */
    skipClientFilters?: boolean;
  }
): Promise<QueryResult<T>> {
  const startTime = Date.now();

  try {
    // Validate orgId
    if (!orgId) {
      return {
        success: false,
        data: [],
        totalCount: 0,
        hasMore: false,
        query: parsedQuery,
        executionTimeMs: Date.now() - startTime,
        error: 'Organization ID is required',
      };
    }

    // Get collection path
    const collectionPath = getCollectionPath(parsedQuery.entity, orgId);
    if (!collectionPath) {
      return {
        success: false,
        data: [],
        totalCount: 0,
        hasMore: false,
        query: parsedQuery,
        executionTimeMs: Date.now() - startTime,
        error: `Unknown entity type: ${parsedQuery.entity}`,
      };
    }

    // Build constraints
    const constraints: QueryConstraint[] = [];
    const clientSideFilters: QueryFilter[] = [];

    // Add filter constraints
    for (const filter of parsedQuery.filters) {
      const constraint = filterToConstraint(filter, parsedQuery.entity);
      if (constraint) {
        constraints.push(constraint);
      } else {
        // Filter needs client-side handling
        clientSideFilters.push(filter);
      }
    }

    // Add date range constraints
    if (parsedQuery.dateRange) {
      const dateConstraints = dateRangeToConstraints(parsedQuery.dateRange, parsedQuery.entity);
      constraints.push(...dateConstraints);
    }

    // Add sort constraint
    if (parsedQuery.sort) {
      constraints.push(sortToConstraint(parsedQuery.sort, parsedQuery.entity));
    }

    // Add limit (fetch extra if we need client-side filtering)
    const fetchLimit = clientSideFilters.length > 0
      ? Math.min((parsedQuery.limit || 25) * 3, 100) // Fetch more for client filtering
      : parsedQuery.limit || 25;
    constraints.push(firestoreLimit(fetchLimit));

    // Build and execute query
    const collectionRef = collection(db, collectionPath);
    const q = constraints.length > 0
      ? query(collectionRef, ...constraints)
      : query(collectionRef);

    const snapshot = await getDocs(q);

    // Convert results
    let items: T[] = snapshot.docs.map(doc => {
      if (options?.converter) {
        return options.converter(doc.id, doc.data());
      }
      return { id: doc.id, ...doc.data() } as T;
    });

    // Apply client-side filters
    if (!options?.skipClientFilters && clientSideFilters.length > 0) {
      items = applyClientSideFilters(items as DocumentData[], clientSideFilters, parsedQuery.entity) as T[];
    }

    // Apply limit after client filtering
    if (parsedQuery.limit && items.length > parsedQuery.limit) {
      items = items.slice(0, parsedQuery.limit);
    }

    const executionTimeMs = Date.now() - startTime;
    return formatResults(items, parsedQuery, executionTimeMs);

  } catch (error) {
    console.error('[QueryExecutor] Error executing query:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for common Firestore errors
    let suggestion: string | undefined;
    if (errorMessage.includes('index')) {
      suggestion = 'This query requires a composite index. Check the Firestore console.';
    } else if (errorMessage.includes('permission')) {
      suggestion = 'You may not have permission to access this data.';
    }

    return {
      success: false,
      data: [],
      totalCount: 0,
      hasMore: false,
      query: parsedQuery,
      executionTimeMs: Date.now() - startTime,
      error: errorMessage,
      suggestion,
    };
  }
}

/**
 * Execute an aggregation query
 */
export async function executeAggregation(
  parsedQuery: ParsedQuery,
  orgId: string
): Promise<{
  success: boolean;
  value: number;
  error?: string;
}> {
  if (!parsedQuery.aggregation) {
    return { success: false, value: 0, error: 'No aggregation specified' };
  }

  // For count, we can just get the items and count
  const result = await executeQuery(parsedQuery, orgId);

  if (!result.success) {
    return { success: false, value: 0, error: result.error };
  }

  const { type, field } = parsedQuery.aggregation;

  switch (type) {
    case 'count':
      return { success: true, value: result.data.length };

    case 'sum':
      if (!field) return { success: false, value: 0, error: 'Sum requires a field' };
      const sum = result.data.reduce((acc: number, item: unknown) => {
        const val = (item as Record<string, unknown>)[field];
        return acc + (typeof val === 'number' ? val : 0);
      }, 0);
      return { success: true, value: sum };

    case 'avg':
      if (!field) return { success: false, value: 0, error: 'Average requires a field' };
      const total = result.data.reduce((acc: number, item: unknown) => {
        const val = (item as Record<string, unknown>)[field];
        return acc + (typeof val === 'number' ? val : 0);
      }, 0);
      const avg = result.data.length > 0 ? total / result.data.length : 0;
      return { success: true, value: avg };

    case 'min':
      if (!field) return { success: false, value: 0, error: 'Min requires a field' };
      const min = result.data.reduce((acc: number, item: unknown) => {
        const val = (item as Record<string, unknown>)[field];
        return typeof val === 'number' ? Math.min(acc, val) : acc;
      }, Infinity);
      return { success: true, value: min === Infinity ? 0 : min };

    case 'max':
      if (!field) return { success: false, value: 0, error: 'Max requires a field' };
      const max = result.data.reduce((acc: number, item: unknown) => {
        const val = (item as Record<string, unknown>)[field];
        return typeof val === 'number' ? Math.max(acc, val) : acc;
      }, -Infinity);
      return { success: true, value: max === -Infinity ? 0 : max };

    default:
      return { success: false, value: 0, error: `Unknown aggregation type: ${type}` };
  }
}

/**
 * Get field value suggestions for auto-complete
 * (e.g., list of status values for invoices)
 */
export function getFieldSuggestions(entity: QueryEntityType, field: string): string[] {
  const suggestions: Record<QueryEntityType, Record<string, string[]>> = {
    invoices: {
      status: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
    },
    projects: {
      status: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
      projectType: ['residential', 'commercial', 'industrial', 'renovation', 'new_construction'],
    },
    tasks: {
      status: ['open', 'in_progress', 'completed', 'cancelled'],
      priority: ['low', 'medium', 'high', 'urgent'],
    },
    estimates: {
      status: ['draft', 'pending', 'sent', 'accepted', 'declined', 'expired'],
    },
    clients: {
      status: ['active', 'inactive', 'prospect'],
      type: ['residential', 'commercial'],
    },
    expenses: {
      category: ['materials', 'labor', 'equipment', 'permits', 'subcontractor', 'other'],
    },
    subcontractors: {
      status: ['PENDING', 'APPROVED', 'ACTIVE', 'INACTIVE', 'REJECTED'],
    },
    timeEntries: {},
    photos: {},
    dailyLogs: {},
    scheduleEvents: {
      eventType: ['meeting', 'inspection', 'delivery', 'milestone', 'deadline', 'other'],
    },
  };

  return suggestions[entity]?.[field] || [];
}
