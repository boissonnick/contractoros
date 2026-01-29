import { NextRequest, NextResponse } from 'next/server';
import { twilio, isTwilioConfigured, getDefaultPhoneNumber, formatToE164 } from '@/lib/sms/twilioClient';
import { adminDb, Timestamp } from '@/lib/firebase/admin';
import { renderTemplate } from '@/lib/sms/smsUtils';

export const runtime = 'nodejs';

/**
 * POST /api/sms
 * Send an SMS message
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Twilio is configured
    if (!isTwilioConfigured() || !twilio) {
      return NextResponse.json(
        { error: 'SMS functionality is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      orgId,
      to,
      message,
      templateId,
      templateVariables,
      recipientId,
      recipientType,
      recipientName,
      projectId,
      invoiceId,
      taskId,
      createdBy,
      metadata = {},
    } = body;

    // Validate required fields
    if (!orgId || !to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: orgId, to, message' },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedTo = formatToE164(to);
    const from = getDefaultPhoneNumber();

    if (!from) {
      return NextResponse.json(
        { error: 'No Twilio phone number configured' },
        { status: 500 }
      );
    }

    // Render template if using one
    const finalMessage = templateId && templateVariables
      ? renderTemplate(message, templateVariables)
      : message;

    // Create SMS record in Firestore first
    const smsData = {
      orgId,
      to: formattedTo,
      from,
      body: finalMessage,
      direction: 'outbound',
      status: 'queued',
      recipientId: recipientId || null,
      recipientType: recipientType || null,
      recipientName: recipientName || null,
      projectId: projectId || null,
      invoiceId: invoiceId || null,
      taskId: taskId || null,
      templateId: templateId || null,
      templateVariables: templateVariables || null,
      createdAt: Timestamp.now(),
      createdBy: createdBy || null,
      metadata,
    };

    const docRef = await adminDb.collection('smsMessages').add(smsData);

    // Send via Twilio
    try {
      const twilioMessage = await twilio.messages.create({
        body: finalMessage,
        to: formattedTo,
        from,
      });

      // Update with Twilio response
      await docRef.update({
        twilioMessageSid: twilioMessage.sid,
        twilioAccountSid: twilioMessage.accountSid,
        status: twilioMessage.status,
        price: twilioMessage.price,
        priceUnit: twilioMessage.priceUnit,
        sentAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json({
        id: docRef.id,
        messageSid: twilioMessage.sid,
        status: twilioMessage.status,
        to: formattedTo,
      });
    } catch (twilioError) {
      // Update record with error
      const errorMessage = twilioError instanceof Error ? twilioError.message : 'Failed to send';
      const errorCode = (twilioError as { code?: number })?.code?.toString();

      await docRef.update({
        status: 'failed',
        errorCode: errorCode || null,
        errorMessage,
        updatedAt: Timestamp.now(),
      });

      console.error('Twilio send error:', twilioError);
      return NextResponse.json(
        { error: errorMessage, code: errorCode },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sms
 * Get SMS messages for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const phoneNumber = searchParams.get('phoneNumber');
    const direction = searchParams.get('direction');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    let query = adminDb
      .collection('smsMessages')
      .where('orgId', '==', orgId);

    if (phoneNumber) {
      query = query.where('to', '==', formatToE164(phoneNumber));
    }

    if (direction) {
      query = query.where('direction', '==', direction);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || null,
      deliveredAt: doc.data().deliveredAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get SMS messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
