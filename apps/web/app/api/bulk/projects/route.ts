/**
 * Bulk Projects API Route
 *
 * Handles bulk operations on projects.
 *
 * POST /api/bulk/projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, verifyAdminAccess } from '@/lib/api/auth';
import { validateBulkOperation } from '@/lib/bulk-operations/validators';
import {
  bulkUpdateProjectStatus,
  bulkArchiveProjects,
  bulkAssignProjectManager,
  bulkTagProjects,
} from '@/lib/bulk-operations/operations/project-operations';
import {
  BulkOperation,
  BulkResult,
  StatusUpdateParams,
  AssignmentParams,
  TagParams,
} from '@/lib/bulk-operations/types';
import { ProjectStatus } from '@/types';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  // Verify authentication
  const { user, error: authError } = await verifyAuth(request);

  if (authError) {
    return authError;
  }

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Verify admin access for bulk operations
  const adminError = verifyAdminAccess(user);
  if (adminError) {
    return adminError;
  }

  try {
    const body = await request.json();
    const operation: BulkOperation = {
      type: 'projects',
      ids: body.ids,
      action: body.action,
      params: body.params,
    };

    // Validate the operation
    const validation = validateBulkOperation(operation, user.role);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    let result: BulkResult;

    switch (operation.action) {
      case 'update_status': {
        const params = operation.params as StatusUpdateParams;
        if (!params?.newStatus) {
          return NextResponse.json(
            { error: 'New status is required' },
            { status: 400 }
          );
        }
        result = await bulkUpdateProjectStatus(
          user.orgId,
          operation.ids,
          params.newStatus as ProjectStatus
        );
        break;
      }

      case 'archive': {
        result = await bulkArchiveProjects(
          user.orgId,
          operation.ids,
          true, // archive = true
          user.uid
        );
        break;
      }

      case 'unarchive': {
        result = await bulkArchiveProjects(
          user.orgId,
          operation.ids,
          false, // archive = false
          user.uid
        );
        break;
      }

      case 'assign': {
        const params = operation.params as AssignmentParams;
        if (!params?.userIds || params.userIds.length === 0) {
          return NextResponse.json(
            { error: 'User ID is required for assignment' },
            { status: 400 }
          );
        }
        // For project manager assignment, we use the first userId
        // In a real scenario, you might want to fetch the user's display name
        result = await bulkAssignProjectManager(
          user.orgId,
          operation.ids,
          params.userIds[0],
          '' // TODO: Could fetch user name here
        );
        break;
      }

      case 'tag': {
        const params = operation.params as TagParams;
        if (!params?.tags || params.tags.length === 0) {
          return NextResponse.json(
            { error: 'Tags are required' },
            { status: 400 }
          );
        }
        result = await bulkTagProjects(
          user.orgId,
          operation.ids,
          params.tags,
          params.replace
        );
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported action for projects: ${operation.action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action: operation.action,
      result,
    });
  } catch (error) {
    logger.error('Bulk project operation error', { error, route: 'bulk-projects' });

    return NextResponse.json(
      {
        error: 'Failed to perform bulk operation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available actions for projects
export async function GET(request: NextRequest) {
  const { user, error: authError } = await verifyAuth(request);

  if (authError) {
    return authError;
  }

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Return available actions for projects
  const availableActions = [
    {
      action: 'update_status',
      label: 'Change Status',
      description: 'Update project status',
      requiresParams: true,
      paramsSchema: {
        newStatus: {
          type: 'select',
          options: [
            'lead',
            'bidding',
            'planning',
            'active',
            'on_hold',
            'completed',
            'cancelled',
          ],
        },
      },
    },
    {
      action: 'archive',
      label: 'Archive',
      description: 'Archive selected projects',
      requiresConfirmation: true,
    },
    {
      action: 'unarchive',
      label: 'Unarchive',
      description: 'Restore archived projects',
    },
    {
      action: 'assign',
      label: 'Assign PM',
      description: 'Assign a project manager',
      requiresParams: true,
      paramsSchema: {
        userIds: {
          type: 'user_select',
          multiple: false,
        },
      },
    },
    {
      action: 'tag',
      label: 'Add Tags',
      description: 'Add tags to projects',
      requiresParams: true,
      paramsSchema: {
        tags: {
          type: 'tags',
        },
      },
    },
  ];

  return NextResponse.json({
    entityType: 'projects',
    actions: availableActions,
  });
}
