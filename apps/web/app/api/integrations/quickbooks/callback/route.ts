/**
 * QuickBooks OAuth Callback Route
 *
 * Handles the OAuth 2.0 callback from QuickBooks.
 * Exchanges the authorization code for tokens and stores the connection.
 *
 * GET /api/integrations/quickbooks/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  decodeAuthState,
  exchangeCodeForTokens,
  storeConnection,
} from '@/lib/integrations/quickbooks/oauth';
import { getCompanyInfo } from '@/lib/integrations/quickbooks/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Check for OAuth errors
  const error = searchParams.get('error');
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Unknown error';
    console.error('QBO OAuth error:', error, errorDescription);

    // Redirect to integrations page with error
    const errorUrl = new URL('/dashboard/settings/integrations', request.url);
    errorUrl.searchParams.set('qbo_error', errorDescription);
    return NextResponse.redirect(errorUrl);
  }

  // Get required parameters
  const code = searchParams.get('code');
  const realmId = searchParams.get('realmId');
  const state = searchParams.get('state');

  if (!code || !realmId || !state) {
    console.error('QBO callback missing required parameters');
    const errorUrl = new URL('/dashboard/settings/integrations', request.url);
    errorUrl.searchParams.set('qbo_error', 'Missing required OAuth parameters');
    return NextResponse.redirect(errorUrl);
  }

  try {
    // Decode and validate state
    const authState = decodeAuthState(state);

    if (!authState.orgId || !authState.userId) {
      throw new Error('Invalid state: missing orgId or userId');
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, realmId);

    // Get company info to store company name
    let companyName = 'QuickBooks Company';
    try {
      // Temporarily store tokens to make API call
      await storeConnection(authState.orgId, tokens, companyName);

      // Now fetch actual company info
      const companyInfo = await getCompanyInfo(authState.orgId);
      companyName = companyInfo.CompanyName;

      // Update with real company name
      await storeConnection(authState.orgId, tokens, companyName);
    } catch (companyError) {
      // Non-fatal: we still have the connection, just not the company name
      console.error('Failed to fetch QBO company info:', companyError);
    }

    // Log successful connection
    console.log(`QBO connected for org ${authState.orgId}: ${companyName} (${realmId})`);

    // Redirect to success page
    const successUrl = new URL(authState.returnUrl || '/dashboard/settings/integrations', request.url);
    successUrl.searchParams.set('qbo_connected', 'true');
    successUrl.searchParams.set('qbo_company', companyName);
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('QBO callback error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to complete connection';
    const errorUrl = new URL('/dashboard/settings/integrations', request.url);
    errorUrl.searchParams.set('qbo_error', errorMessage);
    return NextResponse.redirect(errorUrl);
  }
}
