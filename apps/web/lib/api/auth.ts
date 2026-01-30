/**
 * API Route Authentication Helper
 * Provides secure authentication verification for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export interface AuthenticatedUser {
  uid: string;
  email: string | undefined;
  orgId: string;
  role: string;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error: NextResponse | null;
}

/**
 * Verify the authentication token from the request and get user details
 * Returns the authenticated user's UID and organization ID, or an error response
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        ),
      };
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Missing authentication token' },
          { status: 401 }
        ),
      };
    }

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Get the user's profile to get their orgId
    const userProfileDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

    if (!userProfileDoc.exists) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'User profile not found' },
          { status: 403 }
        ),
      };
    }

    const profile = userProfileDoc.data();

    if (!profile?.orgId) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'User not associated with an organization' },
          { status: 403 }
        ),
      };
    }

    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        orgId: profile.orgId,
        role: profile.role || 'EMPLOYEE',
      },
      error: null,
    };
  } catch (error) {
    console.error('Auth verification error:', error);

    // Check for specific Firebase Auth errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return {
          user: null,
          error: NextResponse.json(
            { error: 'Authentication token expired' },
            { status: 401 }
          ),
        };
      }
      if (error.message.includes('invalid')) {
        return {
          user: null,
          error: NextResponse.json(
            { error: 'Invalid authentication token' },
            { status: 401 }
          ),
        };
      }
    }

    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Verify that the authenticated user belongs to the specified organization
 */
export function verifyOrgAccess(user: AuthenticatedUser, requestedOrgId: string): NextResponse | null {
  if (user.orgId !== requestedOrgId) {
    return NextResponse.json(
      { error: 'Access denied: Organization mismatch' },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Verify that the authenticated user has admin privileges (OWNER or PM)
 */
export function verifyAdminAccess(user: AuthenticatedUser): NextResponse | null {
  if (!['OWNER', 'PM'].includes(user.role)) {
    return NextResponse.json(
      { error: 'Access denied: Admin privileges required' },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Combined helper: Verify auth and org access in one call
 */
export async function verifyAuthAndOrg(
  request: NextRequest,
  orgId: string
): Promise<{ user: AuthenticatedUser | null; error: NextResponse | null }> {
  const { user, error: authError } = await verifyAuth(request);

  if (authError) {
    return { user: null, error: authError };
  }

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  const orgError = verifyOrgAccess(user, orgId);
  if (orgError) {
    return { user: null, error: orgError };
  }

  return { user, error: null };
}
