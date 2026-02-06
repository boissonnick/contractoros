/**
 * Twilio Client Configuration
 *
 * Server-side Twilio SDK initialization for handling SMS messages.
 * Uses Twilio's official Node.js library.
 *
 * IMPORTANT: This file should only be imported in server components and API routes.
 * For client-safe phone utilities, import from './phoneUtils' instead.
 */

import 'server-only';
import Twilio from 'twilio';

// Re-export client-safe utilities for backward compatibility in server code
export {
  isValidE164,
  formatToE164,
  formatPhoneForDisplay,
} from './phoneUtils';
import { logger } from '@/lib/utils/logger';

// Environment variables
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioWebhookUrl = process.env.TWILIO_WEBHOOK_URL;

if (!twilioAccountSid && process.env.NODE_ENV === 'production') {
  logger.warn('Warning: TWILIO_ACCOUNT_SID is not set. SMS functionality will not work.', { component: 'sms-twilioClient' });
}

/**
 * Server-side Twilio client instance
 * Only use this in API routes and server components
 */
export const twilio = twilioAccountSid && twilioAuthToken
  ? Twilio(twilioAccountSid, twilioAuthToken)
  : null;

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return !!twilioAccountSid && !!twilioAuthToken && !!twilioPhoneNumber;
}

/**
 * Get the default Twilio phone number
 */
export function getDefaultPhoneNumber(): string {
  return twilioPhoneNumber || '';
}

/**
 * Get the webhook URL for incoming messages
 */
export function getWebhookUrl(): string {
  return twilioWebhookUrl || '';
}

/**
 * Twilio account SID for reference
 */
export const accountSid = twilioAccountSid || '';
