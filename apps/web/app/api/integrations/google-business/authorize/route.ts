/**
 * Google Business Profile OAuth - Initiate Authorization
 * GET /api/integrations/google-business/authorize
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, verifyAdminAccess } from '@/lib/api/auth';
import {
  getAuthorizationUrl,
  generateNonce,
  isGoogleBusinessConfigured,
} from '@/lib/integrations/google-business/oauth';

export async function GET(request: NextRequest) {
  // Check if integration is configured
  if (!isGoogleBusinessConfigured()) {
    return NextResponse.json(
      { error: 'Google Business integration is not configured' },
      { status: 503 }
    );
  }

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

  try {
    // Generate authorization URL with state
    const state = {
      orgId: user.orgId,
      userId: user.uid,
      nonce: generateNonce(),
    };

    const authUrl = getAuthorizationUrl(state);

    // Check if client wants JSON response
    const format = request.nextUrl.searchParams.get('format');
    if (format === 'json') {
      return NextResponse.json({ authUrl });
    }

    // Redirect to Google authorization
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Google Business auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Business connection' },
      { status: 500 }
    );
  }
}
