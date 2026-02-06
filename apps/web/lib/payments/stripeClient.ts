/**
 * Stripe Client Configuration
 *
 * Server-side Stripe SDK initialization for handling payments.
 * Uses Stripe's official Node.js library with TypeScript support.
 */

import Stripe from 'stripe';
import { logger } from '@/lib/utils/logger';

// Stripe API version - use the latest stable version
const STRIPE_API_VERSION = '2023-10-16';

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  logger.warn('Warning: STRIPE_SECRET_KEY is not set. Payment functionality will not work.', { component: 'payments-stripeClient' });
}

/**
 * Server-side Stripe instance
 * Only use this in API routes and server components
 */
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
      typescript: true,
      appInfo: {
        name: 'ContractorOS',
        version: '1.0.0',
      },
    })
  : null;

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!stripeSecretKey && !!stripe;
}

/**
 * Stripe publishable key for client-side use
 */
export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

/**
 * Stripe webhook secret for verifying webhook signatures
 */
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
