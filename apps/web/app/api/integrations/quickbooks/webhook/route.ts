/**
 * QuickBooks Webhook Handler
 *
 * Receives webhook notifications from QuickBooks Online when entities change.
 * Used primarily for syncing payments and customer updates.
 *
 * POST /api/integrations/quickbooks/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { QBOWebhookPayload } from '@/lib/integrations/quickbooks/types';
import { processPaymentWebhook } from '@/lib/integrations/quickbooks/sync-payments';
import { pullCustomersFromQBO } from '@/lib/integrations/quickbooks/sync-customers';
import { pullInvoiceUpdatesFromQBO } from '@/lib/integrations/quickbooks/sync-invoices';
import { logger } from '@/lib/utils/logger';

// Webhook verifier token from Intuit Developer Portal
const WEBHOOK_VERIFIER_TOKEN = process.env.QUICKBOOKS_WEBHOOK_TOKEN;

/**
 * Verify the webhook signature using HMAC-SHA256
 */
function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!WEBHOOK_VERIFIER_TOKEN) {
    logger.error('QUICKBOOKS_WEBHOOK_TOKEN not configured', { route: 'qbo-webhook' });
    return false;
  }

  const hash = crypto
    .createHmac('sha256', WEBHOOK_VERIFIER_TOKEN)
    .update(payload)
    .digest('base64');

  return hash === signature;
}

/**
 * Get organization ID from realm ID
 * Looks up which org is connected to this QBO realm
 */
async function getOrgIdFromRealmId(realmId: string): Promise<string | null> {
  // Query all orgs to find the one connected to this realm
  const orgsSnapshot = await adminDb
    .collectionGroup('accountingConnections')
    .where('companyId', '==', realmId)
    .where('provider', '==', 'quickbooks')
    .where('isConnected', '==', true)
    .limit(1)
    .get();

  if (orgsSnapshot.empty) {
    return null;
  }

  // Extract orgId from the path: organizations/{orgId}/accountingConnections/quickbooks
  const docPath = orgsSnapshot.docs[0].ref.path;
  const pathParts = docPath.split('/');
  const orgIdIndex = pathParts.indexOf('organizations') + 1;

  return pathParts[orgIdIndex] || null;
}

/**
 * POST: Handle webhook notifications from QuickBooks
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify signature
    const signature = request.headers.get('intuit-signature');
    if (!signature) {
      logger.warn('Missing intuit-signature header', { route: 'qbo-webhook' });
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      logger.warn('Invalid webhook signature', { route: 'qbo-webhook' });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    let payload: QBOWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Process each notification
    const results: Array<{
      realmId: string;
      entityType: string;
      entityId: string;
      operation: string;
      result: string;
    }> = [];

    for (const notification of payload.eventNotifications || []) {
      const { realmId, dataChangeEvent } = notification;

      // Find the org for this realm
      const orgId = await getOrgIdFromRealmId(realmId);
      if (!orgId) {
        logger.warn(`No org found for realm ${realmId}`, { route: 'qbo-webhook' });
        continue;
      }

      // Process each entity change
      for (const entity of dataChangeEvent?.entities || []) {
        const { name: entityType, id: entityId, operation } = entity;

        try {
          // Process based on entity type and operation
          switch (entityType) {
            case 'Payment':
              if (operation === 'Create' || operation === 'Update') {
                const paymentResult = await processPaymentWebhook(orgId, entityId);
                results.push({
                  realmId,
                  entityType,
                  entityId,
                  operation,
                  result: paymentResult.recorded ? 'recorded' : 'skipped',
                });
              }
              break;

            case 'Customer':
              if (operation === 'Create' || operation === 'Update') {
                // Pull updated customer data
                await pullCustomersFromQBO(orgId, { maxResults: 10 });
                results.push({
                  realmId,
                  entityType,
                  entityId,
                  operation,
                  result: 'synced',
                });
              }
              break;

            case 'Invoice':
              if (operation === 'Update') {
                // Pull invoice updates (for balance/payment status)
                await pullInvoiceUpdatesFromQBO(orgId, { maxResults: 10 });
                results.push({
                  realmId,
                  entityType,
                  entityId,
                  operation,
                  result: 'synced',
                });
              }
              break;

            default:
              results.push({
                realmId,
                entityType,
                entityId,
                operation,
                result: 'ignored',
              });
          }
        } catch (error) {
          logger.error(
            `Error processing webhook for ${entityType} ${entityId}`, { error, route: 'qbo-webhook' }
          );
          results.push({
            realmId,
            entityType,
            entityId,
            operation,
            result: `error: ${error instanceof Error ? error.message : 'Unknown'}`,
          });
        }
      }
    }

    // Return 200 quickly (QBO expects fast response)
    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    logger.error('Webhook handler error', { error, route: 'qbo-webhook' });
    // Still return 200 to prevent QBO from retrying
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET: Webhook validation endpoint
 * QuickBooks sends a GET request to validate the endpoint during setup
 */
export async function GET(request: NextRequest) {
  const challengeCode = request.nextUrl.searchParams.get('challenge');

  if (challengeCode) {
    // Respond with the challenge code for validation
    return new NextResponse(challengeCode, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  return NextResponse.json({
    status: 'active',
    message: 'QuickBooks webhook endpoint is active',
  });
}
