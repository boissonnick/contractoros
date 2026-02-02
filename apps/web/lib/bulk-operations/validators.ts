/**
 * Bulk Operations Validators
 *
 * Validation logic for bulk operations.
 */

import {
  BulkOperation,
  BulkValidationResult,
  BulkValidationError,
  BulkAction,
  BulkEntityType,
  MAX_BULK_ITEMS,
  BULK_ACTIONS,
  StatusUpdateParams,
  AssignmentParams,
  TagParams,
} from './types';
import { ProjectStatus, TaskStatus } from '@/types';

// Valid statuses for each entity type
const VALID_PROJECT_STATUSES: ProjectStatus[] = [
  'lead',
  'bidding',
  'planning',
  'active',
  'on_hold',
  'completed',
  'cancelled',
];

const VALID_TASK_STATUSES: TaskStatus[] = [
  'pending',
  'assigned',
  'in_progress',
  'blocked',
  'review',
  'completed',
];

/**
 * Validate a bulk operation
 */
export function validateBulkOperation(
  operation: BulkOperation,
  userRole?: string
): BulkValidationResult {
  const errors: BulkValidationError[] = [];

  // Check if ids array exists and is not empty
  if (!operation.ids || !Array.isArray(operation.ids)) {
    errors.push({
      code: 'INVALID_IDS',
      message: 'IDs must be provided as an array',
      field: 'ids',
    });
    return { valid: false, errors };
  }

  if (operation.ids.length === 0) {
    errors.push({
      code: 'EMPTY_IDS',
      message: 'At least one item must be selected',
      field: 'ids',
    });
  }

  // Check max items limit
  if (operation.ids.length > MAX_BULK_ITEMS) {
    errors.push({
      code: 'TOO_MANY_ITEMS',
      message: `Cannot process more than ${MAX_BULK_ITEMS} items at once`,
      field: 'ids',
    });
  }

  // Check for duplicate IDs
  const uniqueIds = new Set(operation.ids);
  if (uniqueIds.size !== operation.ids.length) {
    errors.push({
      code: 'DUPLICATE_IDS',
      message: 'Duplicate IDs found in selection',
      field: 'ids',
    });
  }

  // Validate IDs format (should be non-empty strings)
  const invalidIds = operation.ids.filter(
    (id) => typeof id !== 'string' || id.trim() === ''
  );
  if (invalidIds.length > 0) {
    errors.push({
      code: 'INVALID_ID_FORMAT',
      message: 'All IDs must be non-empty strings',
      field: 'ids',
    });
  }

  // Validate entity type
  if (!isValidEntityType(operation.type)) {
    errors.push({
      code: 'INVALID_ENTITY_TYPE',
      message: `Invalid entity type: ${operation.type}`,
      field: 'type',
    });
  }

  // Validate action
  if (!isValidAction(operation.action)) {
    errors.push({
      code: 'INVALID_ACTION',
      message: `Invalid action: ${operation.action}`,
      field: 'action',
    });
  }

  // Validate action is allowed for entity type
  if (isValidEntityType(operation.type) && isValidAction(operation.action)) {
    const actionConfig = BULK_ACTIONS.find((a) => a.action === operation.action);
    if (actionConfig && !actionConfig.allowedEntityTypes.includes(operation.type)) {
      errors.push({
        code: 'ACTION_NOT_ALLOWED',
        message: `Action "${operation.action}" is not allowed for ${operation.type}`,
        field: 'action',
      });
    }

    // Check permissions for restricted actions
    if (actionConfig?.requiredPermissions && userRole) {
      if (!actionConfig.requiredPermissions.includes(userRole.toLowerCase())) {
        errors.push({
          code: 'PERMISSION_DENIED',
          message: `You don't have permission to perform "${operation.action}"`,
          field: 'action',
        });
      }
    }
  }

  // Validate action-specific parameters
  const paramErrors = validateActionParams(operation);
  errors.push(...paramErrors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate action-specific parameters
 */
function validateActionParams(operation: BulkOperation): BulkValidationError[] {
  const errors: BulkValidationError[] = [];

  switch (operation.action) {
    case 'update_status': {
      const params = operation.params as StatusUpdateParams | undefined;
      if (!params?.newStatus) {
        errors.push({
          code: 'MISSING_STATUS',
          message: 'New status is required for status update',
          field: 'params.newStatus',
        });
      } else {
        // Validate status based on entity type
        if (operation.type === 'projects') {
          if (!VALID_PROJECT_STATUSES.includes(params.newStatus as ProjectStatus)) {
            errors.push({
              code: 'INVALID_STATUS',
              message: `Invalid project status: ${params.newStatus}`,
              field: 'params.newStatus',
            });
          }
        } else if (operation.type === 'tasks') {
          if (!VALID_TASK_STATUSES.includes(params.newStatus as TaskStatus)) {
            errors.push({
              code: 'INVALID_STATUS',
              message: `Invalid task status: ${params.newStatus}`,
              field: 'params.newStatus',
            });
          }
        }
      }
      break;
    }

    case 'assign':
    case 'unassign': {
      const params = operation.params as AssignmentParams | undefined;
      if (!params?.userIds || !Array.isArray(params.userIds)) {
        errors.push({
          code: 'MISSING_USER_IDS',
          message: 'User IDs are required for assignment',
          field: 'params.userIds',
        });
      } else if (params.userIds.length === 0) {
        errors.push({
          code: 'EMPTY_USER_IDS',
          message: 'At least one user must be specified',
          field: 'params.userIds',
        });
      }
      break;
    }

    case 'tag':
    case 'untag': {
      const params = operation.params as TagParams | undefined;
      if (!params?.tags || !Array.isArray(params.tags)) {
        errors.push({
          code: 'MISSING_TAGS',
          message: 'Tags are required',
          field: 'params.tags',
        });
      } else if (params.tags.length === 0) {
        errors.push({
          code: 'EMPTY_TAGS',
          message: 'At least one tag must be specified',
          field: 'params.tags',
        });
      }
      break;
    }

    case 'archive':
    case 'unarchive':
    case 'delete':
      // No additional params required
      break;
  }

  return errors;
}

/**
 * Check if entity type is valid
 */
function isValidEntityType(type: string): type is BulkEntityType {
  const validTypes: BulkEntityType[] = [
    'projects',
    'tasks',
    'invoices',
    'expenses',
    'time_entries',
    'clients',
  ];
  return validTypes.includes(type as BulkEntityType);
}

/**
 * Check if action is valid
 */
function isValidAction(action: string): action is BulkAction {
  const validActions: BulkAction[] = [
    'delete',
    'archive',
    'unarchive',
    'update_status',
    'assign',
    'unassign',
    'tag',
    'untag',
  ];
  return validActions.includes(action as BulkAction);
}

/**
 * Validate that user has permission for the operation
 */
export function validateUserPermission(
  action: BulkAction,
  userRole: string,
  entityOwnerId?: string,
  currentUserId?: string
): BulkValidationResult {
  const errors: BulkValidationError[] = [];

  const actionConfig = BULK_ACTIONS.find((a) => a.action === action);

  if (actionConfig?.requiredPermissions) {
    const hasPermission =
      actionConfig.requiredPermissions.includes(userRole.toLowerCase()) ||
      (entityOwnerId && entityOwnerId === currentUserId);

    if (!hasPermission) {
      errors.push({
        code: 'PERMISSION_DENIED',
        message: `You don't have permission to perform this action`,
        field: 'action',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if an action requires confirmation
 */
export function requiresConfirmation(action: BulkAction): boolean {
  const actionConfig = BULK_ACTIONS.find((a) => a.action === action);
  return actionConfig?.requiresConfirmation ?? false;
}

/**
 * Check if an action is destructive
 */
export function isDestructiveAction(action: BulkAction): boolean {
  const actionConfig = BULK_ACTIONS.find((a) => a.action === action);
  return actionConfig?.destructive ?? false;
}

/**
 * Get confirmation type for an action
 */
export function getConfirmationType(
  action: BulkAction
): 'simple' | 'type_to_confirm' | null {
  const actionConfig = BULK_ACTIONS.find((a) => a.action === action);
  return actionConfig?.confirmationType ?? null;
}
