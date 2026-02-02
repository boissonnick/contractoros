import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase/admin';
import { verifyAuthAndOrg } from '@/lib/api/auth';

export const runtime = 'nodejs';

// Mailgun configuration
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

interface Signer {
  id: string;
  name: string;
  email: string;
  status: string;
  accessToken: string;
  remindersSent: number;
}

/**
 * POST /api/esignature/send-reminder
 * Send a reminder email to a signer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, requestId, signerIndex } = body;

    // Validate required fields
    if (!orgId || !requestId || signerIndex === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: orgId, requestId, signerIndex' },
        { status: 400 }
      );
    }

    // Verify authentication
    const { user, error: authError } = await verifyAuthAndOrg(request, orgId);
    if (authError) return authError;

    // Get the signature request
    const requestRef = adminDb.collection('signatureRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return NextResponse.json(
        { error: 'Signature request not found' },
        { status: 404 }
      );
    }

    const requestData = requestDoc.data();
    if (!requestData) {
      return NextResponse.json(
        { error: 'Invalid signature request data' },
        { status: 500 }
      );
    }

    // Verify org ownership
    if (requestData.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const signers = requestData.signers as Signer[];
    const signer = signers[signerIndex];

    if (!signer) {
      return NextResponse.json(
        { error: 'Signer not found at specified index' },
        { status: 404 }
      );
    }

    if (signer.status === 'signed') {
      return NextResponse.json(
        { error: 'Signer has already signed' },
        { status: 400 }
      );
    }

    // Get organization details for branding
    const orgDoc = await adminDb.collection('organizations').doc(orgId).get();
    const orgData = orgDoc.data();
    const orgName = orgData?.name || 'ContractorOS';

    // Build the signing URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const signUrl = `${baseUrl}/sign/${signer.accessToken}`;

    // Send reminder email via Mailgun
    if (MAILGUN_API_KEY && MAILGUN_DOMAIN) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">Reminder: Document Awaiting Your Signature</h2>
          <p>Hello ${signer.name},</p>
          <p>This is a friendly reminder that you have a document waiting for your signature:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>${requestData.documentTitle}</strong>
            <br/>
            <span style="color: #6b7280;">from ${orgName}</span>
          </div>
          <p>Please click the button below to review and sign the document:</p>
          <a href="${signUrl}" style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Review & Sign Document
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please contact the sender directly.
          </p>
        </div>
      `;

      const formData = new URLSearchParams();
      formData.append('from', `${orgName} <noreply@${MAILGUN_DOMAIN}>`);
      formData.append('to', signer.email);
      formData.append('subject', `Reminder: Please sign "${requestData.documentTitle}"`);
      formData.append('html', emailHtml);

      const response = await fetch(
        `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Mailgun error:', errorText);
        return NextResponse.json(
          { error: 'Failed to send reminder email' },
          { status: 500 }
        );
      }
    } else {
      console.warn('Mailgun not configured, skipping email send');
    }

    // Update the signature request with reminder info
    const updatedSigners = [...signers];
    updatedSigners[signerIndex] = {
      ...signer,
      remindersSent: (signer.remindersSent || 0) + 1,
    };

    const auditEntry = {
      id: `audit_${Date.now()}`,
      action: 'reminder_sent',
      timestamp: Timestamp.now(),
      actorId: user?.uid,
      actorName: user?.email || 'System',
      actorRole: 'sender',
      details: `Reminder sent to ${signer.name} (${signer.email})`,
    };

    await requestRef.update({
      signers: updatedSigners,
      remindersSent: (requestData.remindersSent || 0) + 1,
      lastReminderAt: Timestamp.now(),
      auditTrail: [...(requestData.auditTrail || []), auditEntry],
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${signer.email}`,
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}
