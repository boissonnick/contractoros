/**
 * QuickBooks Connect API Route
 *
 * Initiates the OAuth 2.0 flow by redirecting to QuickBooks authorization.
 * GET /api/integrations/quickbooks/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, verifyAdminAccess } from '@/lib/api/auth';
import {
  getAuthorizationUrl,
  generateNonce,
  isQuickBooksConfigured,
} from '@/lib/integrations/quickbooks/oauth';
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

  // Verify admin access (only OWNER/PM can connect integrations)
  const adminError = verifyAdminAccess(user);
  if (adminError) {
    return adminError;
  }

  // Check if QuickBooks is configured
  if (!isQuickBooksConfigured()) {
    return NextResponse.json(
      { error: 'QuickBooks integration is not configured' },
      { status: 503 }
    );
  }

  // Get return URL from query params (optional)
  const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/dashboard/settings/integrations';

  try {
    // Generate state with security nonce
    const state = {
      orgId: user.orgId,
      userId: user.uid,
      returnUrl,
      nonce: generateNonce(),
    };

    // Get authorization URL
    const authUrl = getAuthorizationUrl(state);

    // Return the URL for client-side redirect
    // (Or redirect directly if this is a direct navigation)
    const format = request.nextUrl.searchParams.get('format');

    if (format === 'json') {
      return NextResponse.json({ authUrl });
    }

    // Direct redirect
    return NextResponse.redirect(authUrl);
  } catch (error) {
    logger.error('Error generating QBO auth URL', { error, route: 'qbo-connect' });
    return NextResponse.json(
      { error: 'Failed to initiate QuickBooks connection' },
      { status: 500 }
    );
  }
}
