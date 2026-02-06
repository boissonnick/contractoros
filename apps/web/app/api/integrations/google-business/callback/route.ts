/**
 * Google Business Profile OAuth - Callback Handler
 * GET /api/integrations/google-business/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  decodeAuthState,
  exchangeCodeForTokens,
  storeConnection,
} from '@/lib/integrations/google-business/oauth';
import {
  fetchAccounts,
  fetchLocations,
} from '@/lib/integrations/google-business/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth error
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/integrations/google-business?error=oauth_denied',
        request.url
      )
    );
  }

  // Validate required params
  if (!code || !state) {
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/integrations/google-business?error=invalid_callback',
        request.url
      )
    );
  }

  try {
    // Decode state
    const authState = decodeAuthState(state);
    const { orgId, userId } = authState;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Fetch accounts and locations to get business info
    const accounts = await fetchAccounts(tokens.accessToken);

    if (accounts.length === 0) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/integrations/google-business?error=no_accounts',
          request.url
        )
      );
    }

    // Get first account's locations
    const firstAccount = accounts[0];
    const locations = await fetchLocations(
      tokens.accessToken,
      firstAccount.name
    );

    if (locations.length === 0) {
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings/integrations/google-business?error=no_locations',
          request.url
        )
      );
    }

    // Store connection with first location (user can change later)
    const firstLocation = locations[0];
    await storeConnection(
      orgId,
      tokens,
      firstAccount.name,
      firstLocation.name,
      firstLocation.title || firstLocation.locationName,
      userId
    );

    console.log(
      `Google Business connected for org ${orgId}: ${firstLocation.title || firstLocation.locationName}`
    );

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/integrations/google-business?success=connected',
        request.url
      )
    );
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings/integrations/google-business?error=connection_failed',
        request.url
      )
    );
  }
}
