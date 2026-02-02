/**
 * Bulk Operations Types
 *
 * Core types for the bulk operations system.
 */

import { ProjectStatus, TaskStatus } from '@/types';

// Available bulk actions
export type BulkAction =
  | 'delete'
  | 'archive'
  | 'unarchive'
  | 'update_status'
  | 'assign'
  | 'unassign'
  | 'tag'
  | 'untag';

// Entity types that support bulk operations
export type BulkEntityType =
  | 'projects'
  | 'tasks'
  | 'invoices'
  | 'expenses'
  | 'time_entries'
  | 'clients';

// Bulk operation definition
export interface BulkOperation<T = unknown> {
  type: BulkEntityType;
  ids: string[];
  action: BulkAction;
  params?: T;
}

// Status update params
export interface StatusUpdateParams {
  newStatus: ProjectStatus | TaskStatus | string;
}

// Assignment params
export interface AssignmentParams {
  userIds: string[];
  replace?: boolean; // Replace all assignments or add to existing
}

// Tag params
export interface TagParams {
  tags: string[];
  replace?: boolean;
}

// Result for a single item in bulk operation
export interface BulkItemResult {
  id: string;
  success: boolean;
  error?: string;
}

// Overall bulk operation result
export interface BulkResult {
  success: string[];
  failed: { id: string; error: string }[];
  total: number;
  duration: number; // milliseconds
}

// Progress callback for tracking bulk operation progress
export interface BulkProgressCallback {
  (progress: BulkProgress): void;
}

export interface BulkProgress {
  completed: number;
  total: number;
  currentItem?: string;
  successCount: number;
  failedCount: number;
}

// Validation result
export interface BulkValidationResult {
  valid: boolean;
  errors: BulkValidationError[];
}

export interface BulkValidationError {
  code: string;
  message: string;
  field?: string;
}

// Action configuration for UI
export interface BulkActionConfig {
  action: BulkAction;
  label: string;
  icon: string;
  description?: string;
  destructive?: boolean;
  requiresConfirmation?: boolean;
  confirmationType?: 'simple' | 'type_to_confirm';
  confirmationMessage?: string;
  allowedEntityTypes: BulkEntityType[];
  requiredPermissions?: string[];
}

// Available actions configuration
export const BULK_ACTIONS: BulkActionConfig[] = [
  {
    action: 'update_status',
    label: 'Change Status',
    icon: 'ArrowPathIcon',
    description: 'Update the status of selected items',
    allowedEntityTypes: ['projects', 'tasks', 'invoices', 'expenses'],
  },
  {
    action: 'assign',
    label: 'Assign',
    icon: 'UserPlusIcon',
    description: 'Assign selected items to team members',
    allowedEntityTypes: ['projects', 'tasks'],
  },
  {
    action: 'archive',
    label: 'Archive',
    icon: 'ArchiveBoxIcon',
    description: 'Archive selected items',
    requiresConfirmation: true,
    confirmationType: 'simple',
    confirmationMessage: 'Are you sure you want to archive these items?',
    allowedEntityTypes: ['projects', 'tasks', 'invoices', 'clients'],
  },
  {
    action: 'unarchive',
    label: 'Unarchive',
    icon: 'ArchiveBoxArrowDownIcon',
    description: 'Restore archived items',
    allowedEntityTypes: ['projects', 'tasks', 'invoices', 'clients'],
  },
  {
    action: 'tag',
    label: 'Add Tags',
    icon: 'TagIcon',
    description: 'Add tags to selected items',
    allowedEntityTypes: ['projects', 'tasks'],
  },
  {
    action: 'delete',
    label: 'Delete',
    icon: 'TrashIcon',
    description: 'Permanently delete selected items',
    destructive: true,
    requiresConfirmation: true,
    confirmationType: 'type_to_confirm',
    confirmationMessage: 'This action cannot be undone. Type DELETE to confirm.',
    allowedEntityTypes: ['tasks', 'expenses', 'time_entries'],
    requiredPermissions: ['admin', 'owner'],
  },
];

// Get actions available for a specific entity type
export function getAvailableActions(entityType: BulkEntityType): BulkActionConfig[] {
  return BULK_ACTIONS.filter((action) =>
    action.allowedEntityTypes.includes(entityType)
  );
}

// Constants
export const MAX_BULK_ITEMS = 100;
export const FIRESTORE_BATCH_LIMIT = 500;
