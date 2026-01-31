/**
 * QuickBooks Disconnect API Route
 *
 * Disconnects the QuickBooks integration by revoking tokens
 * and removing the stored connection.
 *
 * POST /api/integrations/quickbooks/disconnect
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, verifyAdminAccess } from '@/lib/api/auth';
import { deleteConnection, getConnection } from '@/lib/integrations/quickbooks/oauth';

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
    // Check if there's an existing connection
    const connection = await getConnection(user.orgId);

    if (!connection || !connection.isConnected) {
      return NextResponse.json(
        { error: 'QuickBooks is not connected' },
        { status: 400 }
      );
    }

    // Delete the connection (this also revokes tokens)
    await deleteConnection(user.orgId);

    console.log(`QBO disconnected for org ${user.orgId}`);

    return NextResponse.json({
      success: true,
      message: 'QuickBooks disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting QBO:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect QuickBooks' },
      { status: 500 }
    );
  }
}
