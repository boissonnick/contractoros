/**
 * Custom Report Builder Types and Utilities
 *
 * Provides the core logic for building custom reports with:
 * - Configuration schema
 * - Query builder from config
 * - Export to PDF/CSV
 */

import { collection, query, where, orderBy, getDocs, QueryConstraint, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ============================================================================
// Types
// ============================================================================

export type VisualizationType = 'table' | 'bar' | 'line' | 'pie';
export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
export type FilterOperator = 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'isNull' | 'isNotNull';
export type DataSourceType = 'projects' | 'tasks' | 'expenses' | 'invoices' | 'timeEntries' | 'clients' | 'subcontractors' | 'materials';
export type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'currency';

export interface ReportField {
  id: string;
  source: string; // Field path in the data source (e.g., 'name', 'budget', 'status')
  label: string; // Display label
  type: FieldType;
  aggregation?: AggregationType;
  format?: string; // Optional format string for display
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
  value2?: unknown; // For 'between' operator
}

export interface CustomReportConfig {
  id: string;
  name: string;
  description?: string;
  dataSource: DataSourceType;
  fields: ReportField[];
  filters: ReportFilter[];
  visualization: VisualizationType;
  groupBy?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  isShared?: boolean;
  sharedWith?: string[]; // User IDs
}

export interface DataSourceField {
  id: string;
  label: string;
  source: string;
  type: FieldType;
  category: string;
  aggregatable: boolean;
  filterable: boolean;
}

export interface DataSourceConfig {
  id: DataSourceType;
  label: string;
  collectionPath: (orgId: string) => string;
  fields: DataSourceField[];
}

// ============================================================================
// Data Source Definitions
// ============================================================================

export const DATA_SOURCES: Record<DataSourceType, DataSourceConfig> = {
  projects: {
    id: 'projects',
    label: 'Projects',
    collectionPath: (orgId) => `organizations/${orgId}/projects`,
    fields: [
      { id: 'name', label: 'Project Name', source: 'name', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'status', label: 'Status', source: 'status', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'budget', label: 'Budget', source: 'budget', type: 'currency', category: 'Financial', aggregatable: true, filterable: true },
      { id: 'spent', label: 'Amount Spent', source: 'totalSpent', type: 'currency', category: 'Financial', aggregatable: true, filterable: true },
      { id: 'progress', label: 'Progress %', source: 'progress', type: 'number', category: 'Progress', aggregatable: true, filterable: true },
      { id: 'startDate', label: 'Start Date', source: 'startDate', type: 'date', category: 'Dates', aggregatable: false, filterable: true },
      { id: 'endDate', label: 'End Date', source: 'endDate', type: 'date', category: 'Dates', aggregatable: false, filterable: true },
      { id: 'clientId', label: 'Client', source: 'clientId', type: 'string', category: 'Relationships', aggregatable: false, filterable: true },
      { id: 'projectManager', label: 'Project Manager', source: 'projectManagerId', type: 'string', category: 'Relationships', aggregatable: false, filterable: true },
    ],
  },
  tasks: {
    id: 'tasks',
    label: 'Tasks',
    collectionPath: (orgId) => `organizations/${orgId}/tasks`,
    fields: [
      { id: 'title', label: 'Task Title', source: 'title', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'status', label: 'Status', source: 'status', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'priority', label: 'Priority', source: 'priority', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'estimatedHours', label: 'Estimated Hours', source: 'estimatedHours', type: 'number', category: 'Time', aggregatable: true, filterable: true },
      { id: 'actualHours', label: 'Actual Hours', source: 'actualHours', type: 'number', category: 'Time', aggregatable: true, filterable: true },
      { id: 'dueDate', label: 'Due Date', source: 'dueDate', type: 'date', category: 'Dates', aggregatable: false, filterable: true },
      { id: 'completedAt', label: 'Completed Date', source: 'completedAt', type: 'date', category: 'Dates', aggregatable: false, filterable: true },
      { id: 'assigneeId', label: 'Assignee', source: 'assigneeId', type: 'string', category: 'Relationships', aggregatable: false, filterable: true },
      { id: 'projectId', label: 'Project', source: 'projectId', type: 'string', category: 'Relationships', aggregatable: false, filterable: true },
    ],
  },
  expenses: {
    id: 'expenses',
    label: 'Expenses',
    collectionPath: (orgId) => `organizations/${orgId}/expenses`,
    fields: [
      { id: 'description', label: 'Description', source: 'description', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'category', label: 'Category', source: 'category', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'status', label: 'Status', source: 'status', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'amount', label: 'Amount', source: 'amount', type: 'currency', category: 'Financial', aggregatable: true, filterable: true },
      { id: 'date', label: 'Date', source: 'date', type: 'date', category: 'Dates', aggregatable: false, filterable: true },
      { id: 'projectId', label: 'Project', source: 'projectId', type: 'string', category: 'Relationships', aggregatable: false, filterable: true },
      { id: 'submittedBy', label: 'Submitted By', source: 'submittedBy', type: 'string', category: 'Relationships', aggregatable: false, filterable: true },
    ],
  },
  invoices: {
    id: 'invoices',
    label: 'Invoices',
    collectionPath: (orgId) => `organizations/${orgId}/invoices`,
    fields: [
      { id: 'invoiceNumber', label: 'Invoice Number', source: 'invoiceNumber', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'status', label: 'Status', source: 'status', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'total', label: 'Total', source: 'total', type: 'currency', category: 'Financial', aggregatable: true, filterable: true },
      { id: 'amountPaid', label: 'Amount Paid', source: 'amountPaid', type: 'currency', category: 'Financial', aggregatable: true, filterable: true },
      { id: 'amountDue', label: 'Amount Due', source: 'amountDue', type: 'currency', category: 'Financial', aggregatable: true, filterable: true },
      { id: 'issueDate', label: 'Issue Date', source: 'issueDate', type: 'date', category: 'Dates', aggregatable: false, filterable: true },
      { id: 'dueDate', label: 'Due Date', source: 'dueDate', type: 'date', category: 'Dates', aggregatable: false, filterable: true },
      { id: 'clientId', label: 'Client', source: 'clientId', type: 'string', category: 'Relationships', aggregatable: false, filterable: true },
      { id: 'projectId', label: 'Project', source: 'projectId', type: 'string', category: 'Relationships', aggregatable: false, filterable: true },
    ],
  },
  timeEntries: {
    id: 'timeEntries',
    label: 'Time Entries',
    collectionPath: (orgId) => `organizations/${orgId}/timeEntries`,
    fields: [
      { id: 'description', label: 'Description', source: 'description', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'hours', label: 'Hours', source: 'hours', type: 'number', category: 'Time', aggregatable: true, filterable: true },
      { id: 'billable', label: 'Billable', source: 'billable', type: 'boolean', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'hourlyRate', label: 'Hourly Rate', source: 'hourlyRate', type: 'currency', category: 'Financial', aggregatable: true, filterable: true },
      { id: 'date', label: 'Date', source: 'date', type: 'date', category: 'Dates', aggregatable: false, filterable: true },
      { id: 'userId', label: 'User', source: 'userId', type: 'string', category: 'Relationships', aggregatable: false, filterable: true },
      { id: 'projectId', label: 'Project', source: 'projectId', type: 'string', category: 'Relationships', aggregatable: false, filterable: true },
      { id: 'taskId', label: 'Task', source: 'taskId', type: 'string', category: 'Relationships', aggregatable: false, filterable: true },
    ],
  },
  clients: {
    id: 'clients',
    label: 'Clients',
    collectionPath: (orgId) => `organizations/${orgId}/clients`,
    fields: [
      { id: 'name', label: 'Client Name', source: 'name', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'email', label: 'Email', source: 'email', type: 'string', category: 'Contact', aggregatable: false, filterable: true },
      { id: 'phone', label: 'Phone', source: 'phone', type: 'string', category: 'Contact', aggregatable: false, filterable: true },
      { id: 'status', label: 'Status', source: 'status', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'totalProjects', label: 'Total Projects', source: 'totalProjects', type: 'number', category: 'Metrics', aggregatable: true, filterable: true },
      { id: 'totalRevenue', label: 'Total Revenue', source: 'totalRevenue', type: 'currency', category: 'Financial', aggregatable: true, filterable: true },
      { id: 'createdAt', label: 'Created Date', source: 'createdAt', type: 'date', category: 'Dates', aggregatable: false, filterable: true },
    ],
  },
  subcontractors: {
    id: 'subcontractors',
    label: 'Subcontractors',
    collectionPath: (orgId) => `organizations/${orgId}/subcontractors`,
    fields: [
      { id: 'companyName', label: 'Company Name', source: 'companyName', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'contactName', label: 'Contact Name', source: 'contactName', type: 'string', category: 'Contact', aggregatable: false, filterable: true },
      { id: 'email', label: 'Email', source: 'email', type: 'string', category: 'Contact', aggregatable: false, filterable: true },
      { id: 'specialty', label: 'Specialty', source: 'specialty', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'status', label: 'Status', source: 'status', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'rating', label: 'Rating', source: 'rating', type: 'number', category: 'Metrics', aggregatable: true, filterable: true },
      { id: 'totalBids', label: 'Total Bids', source: 'totalBids', type: 'number', category: 'Metrics', aggregatable: true, filterable: true },
    ],
  },
  materials: {
    id: 'materials',
    label: 'Materials',
    collectionPath: (orgId) => `organizations/${orgId}/materials`,
    fields: [
      { id: 'name', label: 'Material Name', source: 'name', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'category', label: 'Category', source: 'category', type: 'string', category: 'Basic', aggregatable: false, filterable: true },
      { id: 'quantity', label: 'Quantity', source: 'quantity', type: 'number', category: 'Inventory', aggregatable: true, filterable: true },
      { id: 'unitCost', label: 'Unit Cost', source: 'unitCost', type: 'currency', category: 'Financial', aggregatable: true, filterable: true },
      { id: 'totalCost', label: 'Total Cost', source: 'totalCost', type: 'currency', category: 'Financial', aggregatable: true, filterable: true },
      { id: 'projectId', label: 'Project', source: 'projectId', type: 'string', category: 'Relationships', aggregatable: false, filterable: true },
      { id: 'orderedDate', label: 'Ordered Date', source: 'orderedDate', type: 'date', category: 'Dates', aggregatable: false, filterable: true },
    ],
  },
};

// ============================================================================
// Query Builder
// ============================================================================

export function buildQueryConstraints(filters: ReportFilter[]): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  for (const filter of filters) {
    const { field, operator, value, value2 } = filter;

    switch (operator) {
      case 'equals':
        constraints.push(where(field, '==', value));
        break;
      case 'notEquals':
        constraints.push(where(field, '!=', value));
        break;
      case 'greaterThan':
        constraints.push(where(field, '>', value));
        break;
      case 'lessThan':
        constraints.push(where(field, '<', value));
        break;
      case 'between':
        if (value !== undefined) constraints.push(where(field, '>=', value));
        if (value2 !== undefined) constraints.push(where(field, '<=', value2));
        break;
      case 'in':
        if (Array.isArray(value) && value.length > 0) {
          constraints.push(where(field, 'in', value));
        }
        break;
      case 'contains':
        // Firestore doesn't support contains directly, so we use range query for prefix match
        if (typeof value === 'string') {
          constraints.push(where(field, '>=', value));
          constraints.push(where(field, '<=', value + '\uf8ff'));
        }
        break;
      case 'isNull':
        constraints.push(where(field, '==', null));
        break;
      case 'isNotNull':
        constraints.push(where(field, '!=', null));
        break;
    }
  }

  return constraints;
}

export async function executeReportQuery(
  orgId: string,
  config: CustomReportConfig
): Promise<Record<string, unknown>[]> {
  const dataSource = DATA_SOURCES[config.dataSource];
  if (!dataSource) {
    throw new Error(`Unknown data source: ${config.dataSource}`);
  }

  const collectionPath = dataSource.collectionPath(orgId);
  const constraints = buildQueryConstraints(config.filters);

  // Add sorting if specified
  if (config.sortBy) {
    constraints.push(orderBy(config.sortBy, config.sortDirection || 'asc'));
  }

  const q = query(collection(db, collectionPath), ...constraints);
  const snapshot = await getDocs(q);

  const results = snapshot.docs.map((doc) => {
    const data = doc.data();
    const result: Record<string, unknown> = { id: doc.id };

    // Extract only the fields specified in the config
    for (const field of config.fields) {
      let value = data[field.source];

      // Convert Firestore Timestamp to Date
      if (value instanceof Timestamp) {
        value = value.toDate();
      }

      result[field.id] = value;
    }

    return result;
  });

  // Apply grouping and aggregation if needed
  if (config.groupBy) {
    return aggregateResults(results, config);
  }

  return results;
}

// ============================================================================
// Aggregation
// ============================================================================

function aggregateResults(
  results: Record<string, unknown>[],
  config: CustomReportConfig
): Record<string, unknown>[] {
  if (!config.groupBy) return results;

  const groups = new Map<string, Record<string, unknown>[]>();

  // Group results
  for (const result of results) {
    const groupKey = String(result[config.groupBy] || 'Unknown');
    const group = groups.get(groupKey) || [];
    group.push(result);
    groups.set(groupKey, group);
  }

  // Aggregate each group
  const aggregated: Record<string, unknown>[] = [];

  groups.forEach((groupResults, groupKey) => {
    const row: Record<string, unknown> = {
      [config.groupBy as string]: groupKey,
      _count: groupResults.length,
    };

    for (const field of config.fields) {
      if (field.aggregation && field.aggregation !== 'none') {
        const values = groupResults
          .map((r: Record<string, unknown>) => r[field.id])
          .filter((v: unknown): v is number => typeof v === 'number');

        row[field.id] = calculateAggregation(values, field.aggregation);
      }
    }

    aggregated.push(row);
  });

  return aggregated;
}

function calculateAggregation(values: number[], aggregation: AggregationType): number {
  if (values.length === 0) return 0;

  switch (aggregation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return values.length;
    default:
      return 0;
  }
}

// ============================================================================
// Export Functions
// ============================================================================

export function exportToCSV(
  data: Record<string, unknown>[],
  fields: ReportField[]
): string {
  if (data.length === 0) return '';

  // Header row
  const headers = fields.map((f) => `"${f.label}"`).join(',');

  // Data rows
  const rows = data.map((row) => {
    return fields
      .map((field) => {
        const value = row[field.id];
        if (value === null || value === undefined) return '""';
        if (value instanceof Date) return `"${value.toISOString()}"`;
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return String(value);
      })
      .join(',');
  });

  return [headers, ...rows].join('\n');
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Formatting Helpers
// ============================================================================

export function formatFieldValue(value: unknown, type: FieldType): string {
  if (value === null || value === undefined) return '-';

  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(value));
    case 'number':
      return new Intl.NumberFormat('en-US').format(Number(value));
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      return String(value);
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return String(value);
  }
}

// ============================================================================
// Default Report Config
// ============================================================================

export function createDefaultReportConfig(): Omit<CustomReportConfig, 'id'> {
  return {
    name: 'New Report',
    description: '',
    dataSource: 'projects',
    fields: [],
    filters: [],
    visualization: 'table',
    sortDirection: 'asc',
    isShared: false,
  };
}

export function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Visualization Labels
// ============================================================================

export const VISUALIZATION_OPTIONS: Array<{ value: VisualizationType; label: string; icon: string }> = [
  { value: 'table', label: 'Table', icon: 'TableCellsIcon' },
  { value: 'bar', label: 'Bar Chart', icon: 'ChartBarIcon' },
  { value: 'line', label: 'Line Chart', icon: 'ChartBarSquareIcon' },
  { value: 'pie', label: 'Pie Chart', icon: 'ChartPieIcon' },
];

export const AGGREGATION_OPTIONS: Array<{ value: AggregationType; label: string }> = [
  { value: 'none', label: 'No Aggregation' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

export const FILTER_OPERATOR_OPTIONS: Array<{ value: FilterOperator; label: string; types: FieldType[] }> = [
  { value: 'equals', label: 'Equals', types: ['string', 'number', 'date', 'boolean', 'currency'] },
  { value: 'notEquals', label: 'Not Equals', types: ['string', 'number', 'date', 'boolean', 'currency'] },
  { value: 'contains', label: 'Contains', types: ['string'] },
  { value: 'greaterThan', label: 'Greater Than', types: ['number', 'date', 'currency'] },
  { value: 'lessThan', label: 'Less Than', types: ['number', 'date', 'currency'] },
  { value: 'between', label: 'Between', types: ['number', 'date', 'currency'] },
  { value: 'in', label: 'In List', types: ['string'] },
  { value: 'isNull', label: 'Is Empty', types: ['string', 'number', 'date', 'boolean', 'currency'] },
  { value: 'isNotNull', label: 'Is Not Empty', types: ['string', 'number', 'date', 'boolean', 'currency'] },
];
