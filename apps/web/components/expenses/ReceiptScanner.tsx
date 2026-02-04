'use client';

import { getAuth } from 'firebase/auth';

/**
 * OCR result from the processReceiptOCR Cloud Function
 */
export interface ReceiptOCRResult {
  vendor: string | null;
  date: string | null; // YYYY-MM-DD format
  total: number | null;
  subtotal: number | null;
  tax: number | null;
  currency: string;
  paymentMethod: 'cash' | 'card' | 'check' | 'other' | null;
  category:
    | 'materials'
    | 'tools'
    | 'equipment_rental'
    | 'fuel'
    | 'vehicle'
    | 'subcontractor'
    | 'permits'
    | 'labor'
    | 'office'
    | 'travel'
    | 'meals'
    | 'insurance'
    | 'utilities'
    | 'marketing'
    | 'other';
  costType:
    | 'MATERIALS'
    | 'EQUIPMENT'
    | 'OVERHEAD'
    | 'LABOR'
    | 'SUBCONTRACTOR'
    | 'OTHER_DIRECT';
  lineItems: Array<{
    description: string;
    quantity: number | null;
    unitPrice: number | null;
    totalPrice: number | null;
  }>;
  confidence: number; // 0.0 - 1.0
  rawText?: string;
  modelUsed: string;
  processingTimeMs: number;
}

interface ProcessReceiptResponse {
  success: boolean;
  data: ReceiptOCRResult | null;
  error?: string;
}

interface ProcessReceiptRequest {
  imageBase64: string;
  mimeType: string;
  orgId: string;
  projectId?: string;
}

// Use local API route to proxy to Cloud Function (avoids CORS issues)
const API_URL = '/api/receipt-ocr';

/**
 * Call the processReceiptOCR Cloud Function to extract expense data from a receipt image
 *
 * @param imageBase64 - Base64-encoded image data (without data URI prefix)
 * @param mimeType - Image MIME type (image/jpeg, image/png, etc.)
 * @param orgId - Organization ID
 * @param projectId - Optional project ID to associate with the expense
 * @returns OCR result with extracted expense data
 * @throws Error if OCR fails or user is rate-limited
 */
export async function scanReceipt(
  imageBase64: string,
  mimeType: string,
  orgId: string,
  projectId?: string
): Promise<ReceiptOCRResult> {
  // Get the current user's ID token for authentication
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User must be authenticated to scan receipts');
  }

  const idToken = await user.getIdToken();

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      imageBase64,
      mimeType,
      orgId,
      projectId,
    } as ProcessReceiptRequest),
  });

  const data: ProcessReceiptResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new Error(data.error || 'Failed to process receipt');
  }

  return data.data;
}

/**
 * Get confidence level label and color based on OCR confidence score
 */
export function getConfidenceDisplay(confidence: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (confidence >= 0.9) {
    return {
      label: 'High confidence',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    };
  }
  if (confidence >= 0.7) {
    return {
      label: 'Good confidence',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
    };
  }
  if (confidence >= 0.5) {
    return {
      label: 'Medium confidence',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
    };
  }
  return {
    label: 'Low confidence - please verify',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
  };
}
