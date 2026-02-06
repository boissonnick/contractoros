/**
 * Google Business Profile OAuth - Disconnect
 * POST /api/integrations/google-business/disconnect
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, verifyAdminAccess } from '@/lib/api/auth';
import {
  deleteConnection,
  getConnection,
} from '@/lib/integrations/google-business/oauth';
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

  // Verify admin access (only OWNER/PM can disconnect integrations)
  const adminError = verifyAdminAccess(user);
  if (adminError) {
    return adminError;
  }

  try {
    const body = await request.json();
    const { connectionId } = body;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // Check if there's an existing connection
    const connection = await getConnection(user.orgId, connectionId);

    if (!connection || !connection.isConnected) {
      return NextResponse.json(
        { error: 'Google Business is not connected' },
        { status: 400 }
      );
    }

    // Delete the connection (this also revokes tokens)
    await deleteConnection(user.orgId, connectionId);

    logger.info(`Google Business disconnected for org ${user.orgId}`, { route: 'google-business-disconnect' });

    return NextResponse.json({
      success: true,
      message: 'Google Business disconnected successfully',
    });
  } catch (error) {
    logger.error('Error disconnecting Google Business', { error, route: 'google-business-disconnect' });
    return NextResponse.json(
      { error: 'Failed to disconnect Google Business' },
      { status: 500 }
    );
  }
}
