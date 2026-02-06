/**
 * Google Business Profile - Fetch Locations
 * GET /api/integrations/google-business/locations
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, verifyAdminAccess } from '@/lib/api/auth';
import { getValidAccessToken } from '@/lib/integrations/google-business/oauth';
import {
  fetchAccounts,
  fetchLocations,
} from '@/lib/integrations/google-business/api';

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

  // Verify admin access
  const adminError = verifyAdminAccess(user);
  if (adminError) {
    return adminError;
  }

  try {
    const credentials = await getValidAccessToken(user.orgId);
    if (!credentials) {
      return NextResponse.json(
        { error: 'No valid Google Business connection' },
        { status: 404 }
      );
    }

    // Fetch all accounts and their locations
    const accounts = await fetchAccounts(credentials.accessToken);
    const allLocations: Array<{
      name: string;
      locationId: string;
      title: string;
      address: string;
    }> = [];

    for (const account of accounts) {
      const locations = await fetchLocations(
        credentials.accessToken,
        account.name
      );

      for (const location of locations) {
        const address = location.storefrontAddress
          ? [
              ...(location.storefrontAddress.addressLines || []),
              location.storefrontAddress.locality,
              location.storefrontAddress.administrativeArea,
              location.storefrontAddress.postalCode,
            ]
              .filter(Boolean)
              .join(', ')
          : '';

        allLocations.push({
          name: location.name,
          locationId: location.name.split('/').pop() || location.name,
          title: location.title || location.locationName,
          address,
        });
      }
    }

    return NextResponse.json({ locations: allLocations });
  } catch (err) {
    console.error('Error fetching Google Business locations:', err);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
