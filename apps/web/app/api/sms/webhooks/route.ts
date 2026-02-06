import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb, Timestamp } from '@/lib/firebase/admin';
import { isOptOutRequest, isOptInRequest } from '@/lib/sms/smsUtils';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

/**
 * Verify Twilio webhook signature using HMAC-SHA1
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  if (!TWILIO_AUTH_TOKEN) {
    logger.error('TWILIO_AUTH_TOKEN not configured', { route: 'sms-webhook' });
    return false;
  }

  // Sort params by key and concatenate key+value
  const sortedKeys = Object.keys(params).sort();
  let dataString = url;
  for (const key of sortedKeys) {
    dataString += key + params[key];
  }

  // Compute HMAC-SHA1 and base64 encode
  const computedSignature = crypto
    .createHmac('sha1', TWILIO_AUTH_TOKEN)
    .update(dataString)
    .digest('base64');

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature)
    );
  } catch {
    // Lengths don't match
    return false;
  }
}

/**
 * POST /api/sms/webhooks
 * Handle incoming Twilio webhooks for message status updates and incoming messages
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Verify TWILIO_AUTH_TOKEN is configured
    if (!TWILIO_AUTH_TOKEN) {
      logger.error('TWILIO_AUTH_TOKEN not configured - rejecting webhook', { route: 'sms-webhook' });
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 403 }
      );
    }

    // Security: Verify X-Twilio-Signature header is present
    const twilioSignature = request.headers.get('X-Twilio-Signature');
    if (!twilioSignature) {
      logger.warn('Missing X-Twilio-Signature header', { route: 'sms-webhook' });
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 403 }
      );
    }

    // Parse form data (Twilio sends as application/x-www-form-urlencoded)
    const formData = await request.formData();
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Security: Verify Twilio signature
    // Use the full URL from the request
    const webhookUrl = request.url;
    if (!verifyTwilioSignature(webhookUrl, data, twilioSignature)) {
      logger.warn('Invalid Twilio signature - rejecting webhook', { route: 'sms-webhook' });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // Determine webhook type
    const messageSid = data.MessageSid || data.SmsSid;
    const messageStatus = data.MessageStatus;
    const from = data.From;
    const to = data.To;
    const body = data.Body;

    if (messageStatus) {
      // This is a status callback
      return await handleStatusCallback(messageSid, messageStatus, data);
    } else if (from && to && body) {
      // This is an incoming message
      return await handleIncomingMessage(messageSid, from, to, body, data);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook error', { error, route: 'sms-webhook' });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle message status updates
 */
async function handleStatusCallback(
  messageSid: string,
  status: string,
  data: Record<string, string>
) {
  try {
    // Find the message by Twilio SID
    const snapshot = await adminDb
      .collection('smsMessages')
      .where('twilioMessageSid', '==', messageSid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      logger.info(`Message not found for SID: ${messageSid}`, { route: 'sms-webhook' });
      return NextResponse.json({ received: true });
    }

    const docRef = snapshot.docs[0].ref;
    const updates: Record<string, unknown> = {
      status,
      updatedAt: Timestamp.now(),
    };

    // Add timing info based on status
    if (status === 'delivered') {
      updates.deliveredAt = Timestamp.now();
    }

    // Add error info if failed
    if (status === 'failed' || status === 'undelivered') {
      updates.errorCode = data.ErrorCode || null;
      updates.errorMessage = data.ErrorMessage || null;
    }

    // Add pricing info if available
    if (data.Price) {
      updates.price = data.Price;
      updates.priceUnit = data.PriceUnit || 'USD';
    }

    await docRef.update(updates);

    logger.info(`Updated message ${messageSid} to status: ${status}`, { route: 'sms-webhook' });
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Status callback error', { error, route: 'sms-webhook' });
    return NextResponse.json(
      { error: 'Failed to process status callback' },
      { status: 500 }
    );
  }
}

/**
 * Handle incoming messages
 */
async function handleIncomingMessage(
  messageSid: string,
  from: string,
  to: string,
  body: string,
  data: Record<string, string>
) {
  try {
    // Find the org that owns this phone number
    const phoneSnapshot = await adminDb
      .collection('twilioPhoneNumbers')
      .where('phoneNumber', '==', to)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    let orgId: string | null = null;

    if (!phoneSnapshot.empty) {
      orgId = phoneSnapshot.docs[0].data().orgId;
    }

    // Store the incoming message
    const incomingData = {
      orgId,
      to,
      from,
      body,
      direction: 'inbound',
      status: 'delivered',
      twilioMessageSid: messageSid,
      twilioAccountSid: data.AccountSid || null,
      createdAt: Timestamp.now(),
      deliveredAt: Timestamp.now(),
    };

    const _docRef = await adminDb.collection('smsMessages').add(incomingData);

    // Handle opt-out/opt-in requests
    if (isOptOutRequest(body)) {
      await handleOptOut(from, orgId);
    } else if (isOptInRequest(body)) {
      await handleOptIn(from, orgId);
    }

    // Update or create conversation
    if (orgId) {
      await updateConversation(orgId, from, body, 'inbound');
    }

    logger.info(`Received message from ${from}: ${body.substring(0, 50)}...`, { route: 'sms-webhook' });

    // Return TwiML response (empty to not send auto-reply)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        headers: { 'Content-Type': 'application/xml' },
      }
    );
  } catch (error) {
    logger.error('Incoming message error', { error, route: 'sms-webhook' });
    return NextResponse.json(
      { error: 'Failed to process incoming message' },
      { status: 500 }
    );
  }
}

/**
 * Handle opt-out request
 */
async function handleOptOut(phoneNumber: string, orgId: string | null) {
  try {
    // Check if opt-out record exists
    const existingSnapshot = await adminDb
      .collection('smsOptOuts')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      // Already opted out, update timestamp
      await existingSnapshot.docs[0].ref.update({
        updatedAt: Timestamp.now(),
      });
    } else {
      // Create new opt-out record
      await adminDb.collection('smsOptOuts').add({
        phoneNumber,
        orgId,
        optedOutAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      });
    }

    logger.info(`Opt-out recorded for ${phoneNumber}`, { route: 'sms-webhook' });
  } catch (error) {
    logger.error('Opt-out error', { error, route: 'sms-webhook' });
  }
}

/**
 * Handle opt-in request
 */
async function handleOptIn(phoneNumber: string, _orgId: string | null) {
  try {
    // Find and delete opt-out record
    const snapshot = await adminDb
      .collection('smsOptOuts')
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
      logger.info(`Opt-in recorded for ${phoneNumber}`, { route: 'sms-webhook' });
    }
  } catch (error) {
    logger.error('Opt-in error', { error, route: 'sms-webhook' });
  }
}

/**
 * Update or create conversation record
 */
async function updateConversation(
  orgId: string,
  phoneNumber: string,
  lastMessage: string,
  direction: 'inbound' | 'outbound'
) {
  try {
    // Find existing conversation
    const snapshot = await adminDb
      .collection('smsConversations')
      .where('orgId', '==', orgId)
      .where('phoneNumber', '==', phoneNumber)
      .limit(1)
      .get();

    const conversationData = {
      orgId,
      phoneNumber,
      lastMessageAt: Timestamp.now(),
      lastMessagePreview: lastMessage.substring(0, 100),
      lastMessageDirection: direction,
      updatedAt: Timestamp.now(),
    };

    if (snapshot.empty) {
      // Create new conversation
      await adminDb.collection('smsConversations').add({
        ...conversationData,
        unreadCount: direction === 'inbound' ? 1 : 0,
        createdAt: Timestamp.now(),
      });
    } else {
      // Update existing conversation
      const doc = snapshot.docs[0];
      const currentData = doc.data();
      const newUnreadCount = direction === 'inbound'
        ? (currentData.unreadCount || 0) + 1
        : currentData.unreadCount || 0;

      await doc.ref.update({
        ...conversationData,
        unreadCount: newUnreadCount,
      });
    }
  } catch (error) {
    logger.error('Update conversation error', { error, route: 'sms-webhook' });
  }
}
