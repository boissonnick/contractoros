/**
 * Natural Language Query Parser - Sprint 31
 *
 * Parses natural language queries into structured ParsedQuery objects
 * for execution against Firestore.
 *
 * Examples:
 * - "show overdue invoices" → { entity: 'invoices', filters: [{ field: 'status', operator: 'eq', value: 'overdue' }] }
 * - "invoices over $5000" → { entity: 'invoices', filters: [{ field: 'amount', operator: 'gt', value: 5000 }] }
 * - "projects for Smith" → { entity: 'projects', filters: [{ field: 'clientName', operator: 'contains', value: 'Smith' }] }
 */

import type {
  ParsedQuery,
  QueryEntityType,
  QueryFilter,
  QueryFilterOperator,
} from '@/types';

// ===========================================
// ENTITY DETECTION
// ===========================================

/**
 * Entity aliases and keywords
 */
const ENTITY_KEYWORDS: Record<QueryEntityType, string[]> = {
  invoices: ['invoice', 'invoices', 'bill', 'bills', 'payment', 'payments'],
  projects: ['project', 'projects', 'job', 'jobs'],
  clients: ['client', 'clients', 'customer', 'customers', 'homeowner', 'homeowners'],
  tasks: ['task', 'tasks', 'todo', 'todos', 'to-do', 'to-dos', 'item', 'items'],
  timeEntries: ['time', 'hours', 'timesheet', 'timesheets', 'time entry', 'time entries', 'worked'],
  expenses: ['expense', 'expenses', 'cost', 'costs', 'spending', 'receipt', 'receipts'],
  estimates: ['estimate', 'estimates', 'quote', 'quotes', 'proposal', 'proposals', 'bid', 'bids'],
  photos: ['photo', 'photos', 'picture', 'pictures', 'image', 'images'],
  dailyLogs: ['daily log', 'daily logs', 'log', 'logs', 'report', 'reports', 'journal'],
  subcontractors: ['subcontractor', 'subcontractors', 'sub', 'subs', 'vendor', 'vendors'],
  scheduleEvents: ['event', 'events', 'schedule', 'schedules', 'appointment', 'appointments', 'meeting', 'meetings'],
};

/**
 * Detect entity type from query text
 */
function detectEntity(query: string): { entity: QueryEntityType; confidence: number } | null {
  const lowerQuery = query.toLowerCase();

  // Check each entity type
  for (const [entity, keywords] of Object.entries(ENTITY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        // Higher confidence for exact matches
        const confidence = lowerQuery.includes(` ${keyword}`) || lowerQuery.startsWith(keyword)
          ? 0.95
          : 0.8;
        return { entity: entity as QueryEntityType, confidence };
      }
    }
  }

  return null;
}

// ===========================================
// STATUS FILTER DETECTION
// ===========================================

/**
 * Status keywords by entity type
 */
const STATUS_KEYWORDS: Record<string, Record<string, string>> = {
  invoices: {
    overdue: 'overdue',
    'past due': 'overdue',
    late: 'overdue',
    unpaid: 'sent',
    outstanding: 'sent',
    pending: 'draft',
    paid: 'paid',
    draft: 'draft',
  },
  projects: {
    active: 'ACTIVE',
    ongoing: 'ACTIVE',
    'in progress': 'ACTIVE',
    completed: 'COMPLETED',
    finished: 'COMPLETED',
    done: 'COMPLETED',
    'on hold': 'ON_HOLD',
    paused: 'ON_HOLD',
    cancelled: 'CANCELLED',
  },
  tasks: {
    open: 'open',
    pending: 'pending',
    'in progress': 'in_progress',
    completed: 'completed',
    done: 'completed',
    overdue: 'overdue',
  },
  estimates: {
    pending: 'pending',
    sent: 'sent',
    accepted: 'accepted',
    approved: 'accepted',
    declined: 'declined',
    rejected: 'declined',
    draft: 'draft',
  },
  clients: {
    active: 'active',
    inactive: 'inactive',
  },
  subcontractors: {
    active: 'ACTIVE',
    approved: 'APPROVED',
    pending: 'PENDING',
  },
};

/**
 * Detect status filter from query
 */
function detectStatusFilter(query: string, entity: QueryEntityType): QueryFilter | null {
  const lowerQuery = query.toLowerCase();
  const entityStatuses = STATUS_KEYWORDS[entity];

  if (!entityStatuses) return null;

  for (const [keyword, value] of Object.entries(entityStatuses)) {
    if (lowerQuery.includes(keyword)) {
      return {
        field: 'status',
        operator: 'eq',
        value,
      };
    }
  }

  return null;
}

// ===========================================
// AMOUNT FILTER DETECTION
// ===========================================

/**
 * Parse monetary amounts from text
 * Handles: $5000, $5,000, 5000 dollars, 5k, etc.
 */
function parseAmount(text: string): number | null {
  // Match patterns like $5,000 or $5000 or 5000
  const dollarMatch = text.match(/\$([0-9,]+(?:\.[0-9]{2})?)/);
  if (dollarMatch) {
    return parseFloat(dollarMatch[1].replace(/,/g, ''));
  }

  // Match patterns like "5k" or "5K"
  const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    return parseFloat(kMatch[1]) * 1000;
  }

  // Match plain numbers followed by "dollars"
  const dollarsMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*dollars?/i);
  if (dollarsMatch) {
    return parseFloat(dollarsMatch[1].replace(/,/g, ''));
  }

  return null;
}

/**
 * Detect amount filter with comparison operator
 */
function detectAmountFilter(query: string, entity: QueryEntityType): QueryFilter | null {
  const lowerQuery = query.toLowerCase();

  // Check if this entity has an amount field
  const amountEntities = ['invoices', 'expenses', 'estimates', 'projects'];
  if (!amountEntities.includes(entity)) return null;

  // Determine the amount field name
  const fieldName = entity === 'projects' ? 'budget' : 'amount';

  // Patterns: "over $5000", "more than $5000", "greater than $5000"
  const overMatch = query.match(/(?:over|more than|greater than|above|exceeding|>)\s*\$?([0-9,k]+)/i);
  if (overMatch) {
    const amount = parseAmount(`$${overMatch[1]}`);
    if (amount !== null) {
      return { field: fieldName, operator: 'gt', value: amount };
    }
  }

  // Patterns: "under $5000", "less than $5000", "below $5000"
  const underMatch = query.match(/(?:under|less than|below|<)\s*\$?([0-9,k]+)/i);
  if (underMatch) {
    const amount = parseAmount(`$${underMatch[1]}`);
    if (amount !== null) {
      return { field: fieldName, operator: 'lt', value: amount };
    }
  }

  // Patterns: "at least $5000", "minimum $5000"
  const atLeastMatch = query.match(/(?:at least|minimum|min)\s*\$?([0-9,k]+)/i);
  if (atLeastMatch) {
    const amount = parseAmount(`$${atLeastMatch[1]}`);
    if (amount !== null) {
      return { field: fieldName, operator: 'gte', value: amount };
    }
  }

  // Patterns: "between $1000 and $5000"
  const betweenMatch = query.match(/between\s*\$?([0-9,k]+)\s*(?:and|to|-)\s*\$?([0-9,k]+)/i);
  if (betweenMatch) {
    const amount1 = parseAmount(`$${betweenMatch[1]}`);
    const amount2 = parseAmount(`$${betweenMatch[2]}`);
    if (amount1 !== null && amount2 !== null) {
      return {
        field: fieldName,
        operator: 'between',
        value: Math.min(amount1, amount2),
        value2: Math.max(amount1, amount2),
      };
    }
  }

  return null;
}

// ===========================================
// DATE FILTER DETECTION
// ===========================================

/**
 * Get start and end of various time periods
 */
function getDateRange(period: string): { start: Date; end: Date } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };

    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    }

    case 'tomorrow': {
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      return {
        start: tomorrow,
        end: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    }

    case 'this_week': {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      return { start: startOfWeek, end: endOfWeek };
    }

    case 'last_week': {
      const dayOfWeek = today.getDay();
      const startOfLastWeek = new Date(today.getTime() - (dayOfWeek + 7) * 24 * 60 * 60 * 1000);
      const endOfLastWeek = new Date(startOfLastWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      return { start: startOfLastWeek, end: endOfLastWeek };
    }

    case 'next_week': {
      const dayOfWeek = today.getDay();
      const startOfNextWeek = new Date(today.getTime() + (7 - dayOfWeek) * 24 * 60 * 60 * 1000);
      const endOfNextWeek = new Date(startOfNextWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      return { start: startOfNextWeek, end: endOfNextWeek };
    }

    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start: startOfMonth, end: endOfMonth };
    }

    case 'last_month': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start: startOfLastMonth, end: endOfLastMonth };
    }

    case 'this_year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { start: startOfYear, end: endOfYear };
    }

    case 'last_30_days': {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start: thirtyDaysAgo, end: now };
    }

    case 'last_90_days': {
      const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { start: ninetyDaysAgo, end: now };
    }

    default:
      return null;
  }
}

/**
 * Detect date-related filters
 */
function detectDateFilter(query: string, entity: QueryEntityType): {
  filters: QueryFilter[];
  dateRange?: { field: string; start: Date; end: Date };
} {
  const lowerQuery = query.toLowerCase();
  const filters: QueryFilter[] = [];
  let dateRange: { field: string; start: Date; end: Date } | undefined;

  // Determine the date field based on entity
  const dateFieldMap: Record<QueryEntityType, string> = {
    invoices: 'dueDate',
    projects: 'startDate',
    clients: 'createdAt',
    tasks: 'dueDate',
    timeEntries: 'date',
    expenses: 'date',
    estimates: 'createdAt',
    photos: 'uploadedAt',
    dailyLogs: 'date',
    subcontractors: 'createdAt',
    scheduleEvents: 'startTime',
  };

  const dateField = dateFieldMap[entity];

  // Check for time period keywords
  const periodPatterns: [RegExp, string][] = [
    [/\btoday\b/i, 'today'],
    [/\byesterday\b/i, 'yesterday'],
    [/\btomorrow\b/i, 'tomorrow'],
    [/\bthis week\b/i, 'this_week'],
    [/\blast week\b/i, 'last_week'],
    [/\bnext week\b/i, 'next_week'],
    [/\bthis month\b/i, 'this_month'],
    [/\blast month\b/i, 'last_month'],
    [/\bthis year\b/i, 'this_year'],
    [/\blast 30 days\b/i, 'last_30_days'],
    [/\blast 90 days\b/i, 'last_90_days'],
    [/\bpast month\b/i, 'last_30_days'],
    [/\brecent\b/i, 'last_30_days'],
  ];

  for (const [pattern, period] of periodPatterns) {
    if (pattern.test(lowerQuery)) {
      const range = getDateRange(period);
      if (range) {
        dateRange = { field: dateField, ...range };
        break;
      }
    }
  }

  // Check for "due" qualifier for invoices/tasks
  if ((entity === 'invoices' || entity === 'tasks') && lowerQuery.includes('due')) {
    // "due today", "due this week", etc. - already handled above
    // "due soon" - next 7 days
    if (lowerQuery.includes('due soon')) {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      dateRange = { field: 'dueDate', start: now, end: weekFromNow };
    }
  }

  return { filters, dateRange };
}

// ===========================================
// NAME/TEXT FILTER DETECTION
// ===========================================

/**
 * Detect name/text search filters
 */
function detectNameFilter(query: string, entity: QueryEntityType): QueryFilter | null {
  const lowerQuery = query.toLowerCase();

  // Patterns: "for Smith", "from Smith", "client Smith", "named Smith"
  const forMatch = query.match(/(?:for|from|client|named|by)\s+["']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)["']?/i);

  if (forMatch) {
    const name = forMatch[1].trim();

    // Determine the field based on entity
    if (entity === 'projects' || entity === 'invoices' || entity === 'estimates') {
      return { field: 'clientName', operator: 'contains', value: name };
    }
    if (entity === 'clients') {
      return { field: 'name', operator: 'contains', value: name };
    }
    if (entity === 'tasks' || entity === 'timeEntries') {
      return { field: 'assigneeName', operator: 'contains', value: name };
    }
  }

  // Pattern: "project XYZ" where XYZ is likely a project name
  const projectMatch = query.match(/project\s+["']?([^"']+?)["']?(?:\s|$)/i);
  if (projectMatch && entity !== 'projects') {
    return { field: 'projectName', operator: 'contains', value: projectMatch[1].trim() };
  }

  return null;
}

// ===========================================
// SORT DETECTION
// ===========================================

/**
 * Detect sort order from query
 */
function detectSort(query: string, entity: QueryEntityType): { field: string; direction: 'asc' | 'desc' } | undefined {
  const lowerQuery = query.toLowerCase();

  // "by date", "by amount", "by name"
  const byFieldMatch = lowerQuery.match(/(?:sort(?:ed)?|order(?:ed)?|by)\s+(\w+)/);

  // "newest", "oldest", "highest", "lowest", "largest", "smallest"
  if (lowerQuery.includes('newest') || lowerQuery.includes('most recent') || lowerQuery.includes('latest')) {
    return { field: 'createdAt', direction: 'desc' };
  }
  if (lowerQuery.includes('oldest') || lowerQuery.includes('earliest')) {
    return { field: 'createdAt', direction: 'asc' };
  }
  if (lowerQuery.includes('highest') || lowerQuery.includes('largest') || lowerQuery.includes('biggest')) {
    const amountField = entity === 'projects' ? 'budget' : 'amount';
    return { field: amountField, direction: 'desc' };
  }
  if (lowerQuery.includes('lowest') || lowerQuery.includes('smallest')) {
    const amountField = entity === 'projects' ? 'budget' : 'amount';
    return { field: amountField, direction: 'asc' };
  }

  // Parse "by X" patterns
  if (byFieldMatch) {
    const field = byFieldMatch[1];
    const fieldMap: Record<string, string> = {
      date: 'createdAt',
      amount: 'amount',
      name: 'name',
      status: 'status',
      due: 'dueDate',
      budget: 'budget',
      created: 'createdAt',
      updated: 'updatedAt',
    };

    const mappedField = fieldMap[field];
    if (mappedField) {
      // Default to descending for dates and amounts, ascending for names
      const direction = ['name', 'status'].includes(field) ? 'asc' : 'desc';
      return { field: mappedField, direction };
    }
  }

  return undefined;
}

// ===========================================
// LIMIT DETECTION
// ===========================================

/**
 * Detect limit from query
 */
function detectLimit(query: string): number | undefined {
  const lowerQuery = query.toLowerCase();

  // Patterns: "top 5", "first 10", "5 most", "show 10"
  const limitMatch = lowerQuery.match(/(?:top|first|show|get|find)\s+(\d+)/);
  if (limitMatch) {
    return parseInt(limitMatch[1], 10);
  }

  // Pattern: "5 invoices", "10 projects"
  const numberFirstMatch = lowerQuery.match(/^(\d+)\s+\w+/);
  if (numberFirstMatch) {
    return parseInt(numberFirstMatch[1], 10);
  }

  return undefined;
}

// ===========================================
// AGGREGATION DETECTION
// ===========================================

/**
 * Detect if query is asking for aggregation
 */
function detectAggregation(query: string): { type: 'count' | 'sum' | 'avg' | 'min' | 'max'; field?: string } | undefined {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('how many') || lowerQuery.includes('count of') || lowerQuery.includes('number of')) {
    return { type: 'count' };
  }
  if (lowerQuery.includes('total') && (lowerQuery.includes('amount') || lowerQuery.includes('value') || lowerQuery.includes('sum'))) {
    return { type: 'sum', field: 'amount' };
  }
  if (lowerQuery.includes('average') || lowerQuery.includes('avg')) {
    return { type: 'avg', field: 'amount' };
  }

  return undefined;
}

// ===========================================
// MAIN PARSER
// ===========================================

/**
 * Parse a natural language query into a structured ParsedQuery
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const originalText = query.trim();
  const ambiguities: string[] = [];
  let overallConfidence = 1.0;

  // Step 1: Detect entity
  const entityResult = detectEntity(originalText);
  if (!entityResult) {
    // Default to invoices if no entity detected
    ambiguities.push('Could not determine what type of data you want. Defaulting to invoices.');
    overallConfidence *= 0.5;
  }

  const entity = entityResult?.entity || 'invoices';
  overallConfidence *= entityResult?.confidence || 0.5;

  // Step 2: Collect filters
  const filters: QueryFilter[] = [];

  // Status filter
  const statusFilter = detectStatusFilter(originalText, entity);
  if (statusFilter) {
    filters.push(statusFilter);
  }

  // Amount filter
  const amountFilter = detectAmountFilter(originalText, entity);
  if (amountFilter) {
    filters.push(amountFilter);
  }

  // Date filter
  const dateResult = detectDateFilter(originalText, entity);
  if (dateResult.filters.length > 0) {
    filters.push(...dateResult.filters);
  }

  // Name filter
  const nameFilter = detectNameFilter(originalText, entity);
  if (nameFilter) {
    filters.push(nameFilter);
  }

  // Step 3: Detect sort
  const sort = detectSort(originalText, entity);

  // Step 4: Detect limit
  const limit = detectLimit(originalText);

  // Step 5: Detect aggregation
  const aggregation = detectAggregation(originalText);

  // Step 6: Calculate confidence
  // Reduce confidence if we found very few filters
  if (filters.length === 0 && !dateResult.dateRange && !aggregation) {
    overallConfidence *= 0.7;
    ambiguities.push('No specific filters detected. Showing all records.');
  }

  // Build suggestions
  const suggestions: string[] = [];
  if (filters.length === 0) {
    suggestions.push(`Try adding filters like "overdue ${entity}" or "over $1000"`);
  }
  if (!limit) {
    suggestions.push('Add "top 10" or "first 5" to limit results');
  }

  return {
    originalText,
    entity,
    filters,
    sort,
    limit: limit || 25, // Default limit
    dateRange: dateResult.dateRange,
    aggregation,
    confidence: Math.round(overallConfidence * 100) / 100,
    ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

/**
 * Validate a parsed query before execution
 */
export function validateParsedQuery(query: ParsedQuery): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!query.entity) {
    errors.push('No entity type specified');
  }

  // Check for conflicting filters
  const fieldCounts = new Map<string, number>();
  for (const filter of query.filters) {
    const count = fieldCounts.get(filter.field) || 0;
    fieldCounts.set(filter.field, count + 1);
  }

  fieldCounts.forEach((count, field) => {
    if (count > 2) {
      errors.push(`Multiple conflicting filters on field: ${field}`);
    }
  });

  // Validate limit
  if (query.limit && (query.limit < 1 || query.limit > 1000)) {
    errors.push('Limit must be between 1 and 1000');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a human-readable description of the query
 */
export function describeQuery(query: ParsedQuery): string {
  const parts: string[] = [];

  // Entity
  parts.push(`Searching for ${query.entity}`);

  // Filters
  for (const filter of query.filters) {
    const opText: Record<QueryFilterOperator, string> = {
      eq: 'equals',
      neq: 'not equals',
      gt: 'greater than',
      lt: 'less than',
      gte: 'at least',
      lte: 'at most',
      contains: 'containing',
      in: 'in',
      not_in: 'not in',
      between: 'between',
    };

    if (filter.operator === 'between') {
      parts.push(`where ${filter.field} is between ${filter.value} and ${filter.value2}`);
    } else {
      parts.push(`where ${filter.field} ${opText[filter.operator]} "${filter.value}"`);
    }
  }

  // Date range
  if (query.dateRange) {
    parts.push(`from ${query.dateRange.start.toLocaleDateString()} to ${query.dateRange.end.toLocaleDateString()}`);
  }

  // Sort
  if (query.sort) {
    parts.push(`sorted by ${query.sort.field} (${query.sort.direction === 'desc' ? 'newest first' : 'oldest first'})`);
  }

  // Limit
  if (query.limit) {
    parts.push(`limited to ${query.limit} results`);
  }

  return parts.join(', ');
}
