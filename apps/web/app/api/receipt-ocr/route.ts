import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

const FUNCTION_URL = 'https://us-east1-contractoros-483812.cloudfunctions.net/processReceiptOCR';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header from the client request
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, data: null, error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the token to ensure it's valid
    try {
      await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { success: false, data: null, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();

    // Forward the request to the Cloud Function with service account auth
    // For Gen 2 functions with IAM, we need to get an identity token
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth();

    // Get an ID token for the Cloud Function
    const client = await auth.getIdTokenClient(FUNCTION_URL);
    const headers = await client.getRequestHeaders();

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        // Pass the user's token in a custom header for the function to verify
        'X-User-Token': idToken,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Receipt OCR proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
