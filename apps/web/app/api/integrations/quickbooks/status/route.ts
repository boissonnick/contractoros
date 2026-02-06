/**
 * QuickBooks Status API Route
 *
 * Returns the current QuickBooks connection status.
 *
 * GET /api/integrations/quickbooks/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api/auth';
import { getConnection, isQuickBooksConfigured } from '@/lib/integrations/quickbooks/oauth';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
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

  try {
    // Check if QuickBooks is configured at the platform level
    const isConfigured = isQuickBooksConfigured();

    if (!isConfigured) {
      return NextResponse.json({
        configured: false,
        connected: false,
        message: 'QuickBooks integration is not configured for this platform',
      });
    }

    // Get connection status for this org
    const connection = await getConnection(user.orgId);

    if (!connection || !connection.isConnected) {
      return NextResponse.json({
        configured: true,
        connected: false,
        message: 'QuickBooks is not connected',
      });
    }

    // Check if token is expired
    const now = new Date();
    const isTokenValid = connection.tokenExpiresAt && connection.tokenExpiresAt > now;

    return NextResponse.json({
      configured: true,
      connected: true,
      companyName: connection.companyName,
      companyId: connection.realmId,
      tokenValid: isTokenValid,
      tokenExpiresAt: connection.tokenExpiresAt?.toISOString(),
    });
  } catch (error) {
    logger.error('Error checking QBO status', { error, route: 'qbo-status' });
    return NextResponse.json(
      { error: 'Failed to check QuickBooks status' },
      { status: 500 }
    );
  }
}
