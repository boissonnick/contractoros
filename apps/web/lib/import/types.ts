/**
 * CSV Import Types
 *
 * Types for the CSV import system that allows importing
 * clients, projects, contacts, and communication logs.
 */

// Import job status
export type ImportStatus =
  | 'uploading'
  | 'mapping'
  | 'validating'
  | 'importing'
  | 'completed'
  | 'failed'
  | 'rolled_back';

// Target entity types
export type ImportTarget = 'clients' | 'projects' | 'contacts' | 'communication_logs';

// Data types for column mapping
export type ColumnDataType =
  | 'string'
  | 'email'
  | 'phone'
  | 'date'
  | 'number'
  | 'boolean'
  | 'currency'
  | 'enum';

// Transform operations
export type ColumnTransform =
  | 'uppercase'
  | 'lowercase'
  | 'trim'
  | 'phone_format'
  | 'date_format'
  | 'currency_format'
  | 'none';

// Column mapping
export interface ColumnMapping {
  sourceColumn: string;        // CSV header
  targetField: string;         // Database field
  dataType: ColumnDataType;
  required: boolean;
  defaultValue?: string;
  transform?: ColumnTransform;
  enumValues?: string[];       // For enum types
}

// Field definition for target entities
export interface FieldDefinition {
  name: string;                // Field path (e.g., 'address.street')
  label: string;               // Display label
  type: ColumnDataType;
  required: boolean;
  enumValues?: string[];       // Valid values for enum types
  description?: string;        // Help text
  example?: string;            // Example value
}

// Validation error
export interface ImportValidationError {
  row: number;
  column: string;
  value: string;
  error: string;
  severity: 'error' | 'warning';
}

// Parsed row from CSV
export interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
  isValid: boolean;
  errors: ImportValidationError[];
}

// Import job
export interface ImportJob {
  id: string;
  orgId: string;
  userId: string;
  userName: string;

  target: ImportTarget;
  fileName: string;
  fileSize: number;

  status: ImportStatus;

  mappings: ColumnMapping[];

  totalRows: number;
  validRows: number;
  importedRows: number;
  skippedRows: number;
  errors: ImportValidationError[];

  createdRecordIds: string[];   // For rollback

  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Import summary for dashboard
export interface ImportSummary {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalRecordsImported: number;
  recentJobs: ImportJob[];
}

// Field definitions for each target
export const IMPORT_FIELD_DEFINITIONS: Record<ImportTarget, FieldDefinition[]> = {
  clients: [
    { name: 'displayName', label: 'Client Name', type: 'string', required: true, example: 'John Smith' },
    { name: 'email', label: 'Email', type: 'email', required: false, example: 'john@example.com' },
    { name: 'phone', label: 'Phone', type: 'phone', required: false, example: '(555) 123-4567' },
    { name: 'companyName', label: 'Company', type: 'string', required: false, example: 'Smith Construction' },
    { name: 'address.street', label: 'Street Address', type: 'string', required: false, example: '123 Main St' },
    { name: 'address.city', label: 'City', type: 'string', required: false, example: 'Austin' },
    { name: 'address.state', label: 'State', type: 'string', required: false, example: 'TX' },
    { name: 'address.zip', label: 'ZIP Code', type: 'string', required: false, example: '78701' },
    { name: 'status', label: 'Status', type: 'enum', required: false, enumValues: ['active', 'past', 'potential', 'inactive'], example: 'active' },
    { name: 'source', label: 'Lead Source', type: 'enum', required: false, enumValues: ['referral', 'google', 'social_media', 'yard_sign', 'vehicle_wrap', 'website', 'repeat', 'other'], example: 'referral' },
    { name: 'notes', label: 'Notes', type: 'string', required: false, example: 'Referred by Jane Doe' },
  ],
  projects: [
    { name: 'name', label: 'Project Name', type: 'string', required: true, example: 'Kitchen Remodel' },
    { name: 'clientEmail', label: 'Client Email', type: 'email', required: false, description: 'Used to link to existing client', example: 'john@example.com' },
    { name: 'clientName', label: 'Client Name', type: 'string', required: false, description: 'Alternative to client email for lookup', example: 'John Smith' },
    { name: 'address.street', label: 'Project Address', type: 'string', required: false, example: '123 Main St' },
    { name: 'address.city', label: 'City', type: 'string', required: false, example: 'Austin' },
    { name: 'address.state', label: 'State', type: 'string', required: false, example: 'TX' },
    { name: 'address.zip', label: 'ZIP Code', type: 'string', required: false, example: '78701' },
    { name: 'budget', label: 'Budget', type: 'currency', required: false, example: '50000' },
    { name: 'status', label: 'Status', type: 'enum', required: false, enumValues: ['lead', 'bidding', 'planning', 'active', 'on_hold', 'completed', 'cancelled'], example: 'active' },
    { name: 'startDate', label: 'Start Date', type: 'date', required: false, example: '2026-02-01' },
    { name: 'estimatedEndDate', label: 'End Date', type: 'date', required: false, example: '2026-04-15' },
    { name: 'description', label: 'Description', type: 'string', required: false, example: 'Full kitchen renovation' },
  ],
  contacts: [
    { name: 'name', label: 'Contact Name', type: 'string', required: true, example: 'Jane Smith' },
    { name: 'email', label: 'Email', type: 'email', required: false, example: 'jane@example.com' },
    { name: 'phone', label: 'Phone', type: 'phone', required: false, example: '(555) 987-6543' },
    { name: 'role', label: 'Role/Title', type: 'string', required: false, example: 'Site Manager' },
    { name: 'clientEmail', label: 'Client Email', type: 'email', required: false, description: 'Links contact to client', example: 'john@example.com' },
    { name: 'clientName', label: 'Client Name', type: 'string', required: false, description: 'Alternative to client email for lookup', example: 'John Smith' },
    { name: 'isPrimary', label: 'Primary Contact', type: 'boolean', required: false, example: 'true' },
    { name: 'notes', label: 'Notes', type: 'string', required: false, example: 'Prefers text messages' },
  ],
  communication_logs: [
    { name: 'date', label: 'Date', type: 'date', required: true, example: '2026-01-15' },
    { name: 'type', label: 'Type', type: 'enum', required: true, enumValues: ['call', 'email', 'text', 'meeting', 'site_visit', 'other'], example: 'call' },
    { name: 'clientEmail', label: 'Client Email', type: 'email', required: false, description: 'Links log to client', example: 'john@example.com' },
    { name: 'clientName', label: 'Client Name', type: 'string', required: false, description: 'Alternative to client email for lookup', example: 'John Smith' },
    { name: 'summary', label: 'Summary', type: 'string', required: true, example: 'Discussed project timeline' },
    { name: 'notes', label: 'Notes', type: 'string', required: false, example: 'Follow up next week' },
    { name: 'direction', label: 'Direction', type: 'enum', required: false, enumValues: ['inbound', 'outbound'], example: 'outbound' },
  ],
};

// Import target labels and descriptions
export const IMPORT_TARGET_INFO: Record<ImportTarget, { label: string; description: string; icon: string }> = {
  clients: {
    label: 'Clients',
    description: 'Import client records with contact info, addresses, and status',
    icon: 'UserGroupIcon',
  },
  projects: {
    label: 'Projects',
    description: 'Import project records and optionally link to existing clients',
    icon: 'BuildingOffice2Icon',
  },
  contacts: {
    label: 'Contacts',
    description: 'Import additional contacts and link to existing clients',
    icon: 'UserIcon',
  },
  communication_logs: {
    label: 'Communication Logs',
    description: 'Import call/email/meeting logs for client history',
    icon: 'ChatBubbleLeftRightIcon',
  },
};

// Status labels and colors
export const IMPORT_STATUS_INFO: Record<ImportStatus, { label: string; color: 'default' | 'warning' | 'success' | 'error' | 'info' }> = {
  uploading: { label: 'Uploading', color: 'info' },
  mapping: { label: 'Mapping Columns', color: 'info' },
  validating: { label: 'Validating', color: 'warning' },
  importing: { label: 'Importing', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
  rolled_back: { label: 'Rolled Back', color: 'default' },
};

// Common header aliases for auto-mapping
export const HEADER_ALIASES: Record<string, string[]> = {
  'displayName': ['name', 'client name', 'client', 'full name', 'customer name', 'customer'],
  'email': ['email', 'email address', 'e-mail', 'client email', 'contact email'],
  'phone': ['phone', 'phone number', 'telephone', 'mobile', 'cell', 'contact phone'],
  'companyName': ['company', 'company name', 'business', 'business name', 'organization'],
  'address.street': ['street', 'address', 'street address', 'address line 1', 'address 1'],
  'address.city': ['city', 'town'],
  'address.state': ['state', 'province', 'region'],
  'address.zip': ['zip', 'zip code', 'postal code', 'postcode'],
  'status': ['status', 'client status', 'state'],
  'source': ['source', 'lead source', 'referral source', 'how did you hear'],
  'notes': ['notes', 'comments', 'description', 'memo'],
  'budget': ['budget', 'amount', 'total', 'value', 'contract value'],
  'startDate': ['start date', 'start', 'begin date', 'commencement'],
  'estimatedEndDate': ['end date', 'finish date', 'completion date', 'due date'],
  'date': ['date', 'log date', 'communication date', 'call date'],
  'type': ['type', 'communication type', 'log type', 'category'],
  'summary': ['summary', 'subject', 'topic', 'title'],
  'role': ['role', 'title', 'position', 'job title'],
  'isPrimary': ['primary', 'is primary', 'main contact', 'primary contact'],
  'direction': ['direction', 'inbound/outbound', 'in/out'],
};
