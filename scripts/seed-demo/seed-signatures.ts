/**
 * Seed Signature Requests for Demo Data
 *
 * Creates 10 e-signature requests with varied statuses and document types.
 * Uses the named "contractoros" database via shared db.ts module.
 *
 * Distribution:
 *   - 3 signed (completed)
 *   - 2 pending
 *   - 2 sent
 *   - 1 viewed
 *   - 1 declined
 *   - 1 expired
 *
 * Uses the actual SignatureRequest type from lib/esignature/types.ts.
 * Collection: top-level 'signatureRequests' (not a subcollection).
 */

import { getDb } from './db';
import {
  DEMO_ORG_ID,
  DEMO_USERS,
  DEMO_CLIENTS,
  daysAgo,
  monthsAgo,
  toTimestamp,
  randomInt,
  generateId,
  logSection,
  logProgress,
  logSuccess,
  executeBatchWrites,
} from './utils';

// ============================================
// Types (matching lib/esignature/types.ts)
// ============================================

type SignatureRequestStatus = 'draft' | 'pending' | 'viewed' | 'signed' | 'declined' | 'expired' | 'cancelled';
type SignatureDocumentType = 'estimate' | 'contract' | 'change_order' | 'scope_of_work' | 'invoice' | 'lien_waiver' | 'custom';
type SignerStatus = 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';
type SignatureAuditAction = 'created' | 'sent' | 'viewed' | 'signed' | 'declined' | 'reminder_sent' | 'expired' | 'cancelled' | 'downloaded' | 'voided';

// ============================================
// Demo Projects
// ============================================

const DEMO_PROJECTS = [
  { id: 'demo-proj-smith-kitchen', name: 'Smith Kitchen Remodel' },
  { id: 'demo-proj-garcia-bath', name: 'Garcia Master Bath' },
  { id: 'demo-proj-mainst-retail', name: 'Main St. Retail Storefront' },
  { id: 'demo-proj-wilson-fence', name: 'Wilson Fence Install' },
  { id: 'demo-proj-cafe-ti', name: 'Downtown Cafe TI' },
];

// ============================================
// Helper: Build Audit Trail
// ============================================

function buildAuditEntry(
  action: SignatureAuditAction,
  timestamp: Date,
  actor?: { id?: string; name?: string; email?: string; role?: string },
  details?: string,
) {
  return {
    id: generateId('aud'),
    action,
    timestamp,
    actorId: actor?.id || null,
    actorName: actor?.name || null,
    actorEmail: actor?.email || null,
    actorRole: actor?.role || 'system',
    ipAddress: null,
    userAgent: null,
    geoLocation: null,
    details: details || null,
    metadata: null,
  };
}

// ============================================
// Helper: Build Signer
// ============================================

function buildSigner(
  client: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  },
  role: string,
  order: number,
  status: SignerStatus,
  dates: {
    signedAt?: Date;
    viewedAt?: Date;
    declinedAt?: Date;
  } = {},
) {
  const viewCount = dates.viewedAt ? randomInt(1, 4) : 0;
  const tokenExpiry = new Date();
  tokenExpiry.setDate(tokenExpiry.getDate() + 30);

  return {
    id: generateId('signer'),
    order,
    name: `${client.firstName} ${client.lastName}`,
    email: client.email,
    phone: client.phone,
    role,
    accessToken: generateId('tok'),
    tokenExpiresAt: tokenExpiry,
    status,
    signatureData: status === 'signed' ? {
      method: 'type' as const,
      typedName: `${client.firstName} ${client.lastName}`,
      typedFont: 'Dancing Script',
      width: 300,
      height: 60,
    } : null,
    signedAt: dates.signedAt || null,
    signedIpAddress: status === 'signed' ? '192.168.1.' + randomInt(10, 250) : null,
    signedUserAgent: status === 'signed' ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' : null,
    declinedAt: dates.declinedAt || null,
    declineReason: status === 'declined' ? 'Need to review with spouse before signing.' : null,
    viewedAt: dates.viewedAt || null,
    viewCount,
    lastViewedAt: dates.viewedAt || null,
    remindersSent: status === 'pending' ? randomInt(0, 2) : 0,
    lastReminderAt: null,
  };
}

// ============================================
// Signature Request Templates
// ============================================

function buildSignatureRequests() {
  const owner = DEMO_USERS.owner;
  const pm = DEMO_USERS.pm;

  const requests: any[] = [];

  // ---------- 1. SIGNED: Smith Kitchen - Contract ----------
  const signed1CreatedAt = daysAgo(45);
  const signed1SentAt = daysAgo(44);
  const signed1SignedAt = daysAgo(42);
  requests.push({
    id: generateId('sig'),
    orgId: DEMO_ORG_ID,
    projectId: DEMO_PROJECTS[0].id,
    documentType: 'contract' as SignatureDocumentType,
    documentId: 'demo-contract-smith-001',
    documentTitle: 'Smith Kitchen Remodel - Construction Contract',
    documentPdfUrl: null,
    signers: [
      buildSigner(DEMO_CLIENTS.smith, 'Property Owner', 1, 'signed', {
        viewedAt: daysAgo(43),
        signedAt: signed1SignedAt,
      }),
    ],
    currentSignerIndex: 0,
    status: 'signed' as SignatureRequestStatus,
    emailSubject: 'Please sign: Smith Kitchen Remodel Contract',
    emailMessage: 'Hi Robert, please review and sign the attached construction contract for your kitchen remodel project.',
    expiresAt: daysAgo(14), // Already past but signed
    remindersSent: 0,
    lastReminderAt: null,
    completedAt: signed1SignedAt,
    signedDocumentUrl: null,
    auditTrail: [
      buildAuditEntry('created', signed1CreatedAt, { id: owner.uid, name: owner.displayName, role: 'sender' }),
      buildAuditEntry('sent', signed1SentAt, { id: owner.uid, name: owner.displayName, role: 'sender' }),
      buildAuditEntry('viewed', daysAgo(43), { email: DEMO_CLIENTS.smith.email, role: 'signer' }),
      buildAuditEntry('signed', signed1SignedAt, { email: DEMO_CLIENTS.smith.email, name: 'Robert Smith', role: 'signer' }),
    ],
    createdBy: owner.uid,
    createdByName: owner.displayName,
    createdAt: signed1CreatedAt,
    updatedAt: signed1SignedAt,
  });

  // ---------- 2. SIGNED: Garcia Bath - Estimate ----------
  const signed2CreatedAt = daysAgo(30);
  const signed2SentAt = daysAgo(29);
  const signed2SignedAt = daysAgo(26);
  requests.push({
    id: generateId('sig'),
    orgId: DEMO_ORG_ID,
    projectId: DEMO_PROJECTS[1].id,
    documentType: 'estimate' as SignatureDocumentType,
    documentId: 'demo-estimate-garcia-001',
    documentTitle: 'Garcia Master Bath Renovation - Estimate',
    documentPdfUrl: null,
    signers: [
      buildSigner(DEMO_CLIENTS.garcia, 'Homeowner', 1, 'signed', {
        viewedAt: daysAgo(28),
        signedAt: signed2SignedAt,
      }),
    ],
    currentSignerIndex: 0,
    status: 'signed' as SignatureRequestStatus,
    emailSubject: 'Estimate for your Master Bath Renovation',
    emailMessage: 'Hi Maria, here is the estimate for your master bathroom renovation. Please review and sign to proceed.',
    expiresAt: daysAgo(0), // Past but signed
    remindersSent: 1,
    lastReminderAt: daysAgo(28),
    completedAt: signed2SignedAt,
    signedDocumentUrl: null,
    auditTrail: [
      buildAuditEntry('created', signed2CreatedAt, { id: pm.uid, name: pm.displayName, role: 'sender' }),
      buildAuditEntry('sent', signed2SentAt, { id: pm.uid, name: pm.displayName, role: 'sender' }),
      buildAuditEntry('reminder_sent', daysAgo(28), { role: 'system' }, 'Automatic reminder sent'),
      buildAuditEntry('viewed', daysAgo(28), { email: DEMO_CLIENTS.garcia.email, role: 'signer' }),
      buildAuditEntry('signed', signed2SignedAt, { email: DEMO_CLIENTS.garcia.email, name: 'Maria Garcia', role: 'signer' }),
    ],
    createdBy: pm.uid,
    createdByName: pm.displayName,
    createdAt: signed2CreatedAt,
    updatedAt: signed2SignedAt,
  });

  // ---------- 3. SIGNED: Main St Retail - Change Order ----------
  const signed3CreatedAt = daysAgo(14);
  const signed3SentAt = daysAgo(13);
  const signed3SignedAt = daysAgo(10);
  requests.push({
    id: generateId('sig'),
    orgId: DEMO_ORG_ID,
    projectId: DEMO_PROJECTS[2].id,
    documentType: 'change_order' as SignatureDocumentType,
    documentId: 'demo-co-mainst-001',
    documentTitle: 'Main St. Retail - Change Order #1 (Electrical Panel Upgrade)',
    documentPdfUrl: null,
    signers: [
      buildSigner(DEMO_CLIENTS.mainStRetail, 'Client Representative', 1, 'signed', {
        viewedAt: daysAgo(12),
        signedAt: signed3SignedAt,
      }),
    ],
    currentSignerIndex: 0,
    status: 'signed' as SignatureRequestStatus,
    emailSubject: 'Change Order #1 - Electrical Panel Upgrade',
    emailMessage: 'Susan, please review and sign the change order for the electrical panel upgrade. Additional cost: $3,200.',
    expiresAt: daysAgo(-7), // Not yet expired
    remindersSent: 0,
    lastReminderAt: null,
    completedAt: signed3SignedAt,
    signedDocumentUrl: null,
    auditTrail: [
      buildAuditEntry('created', signed3CreatedAt, { id: owner.uid, name: owner.displayName, role: 'sender' }),
      buildAuditEntry('sent', signed3SentAt, { id: owner.uid, name: owner.displayName, role: 'sender' }),
      buildAuditEntry('viewed', daysAgo(12), { email: DEMO_CLIENTS.mainStRetail.email, role: 'signer' }),
      buildAuditEntry('signed', signed3SignedAt, { email: DEMO_CLIENTS.mainStRetail.email, name: 'Susan Martinez', role: 'signer' }),
    ],
    createdBy: owner.uid,
    createdByName: owner.displayName,
    createdAt: signed3CreatedAt,
    updatedAt: signed3SignedAt,
  });

  // ---------- 4. PENDING: Wilson Fence - Contract ----------
  const pending1CreatedAt = daysAgo(3);
  const pending1SentAt = daysAgo(3);
  requests.push({
    id: generateId('sig'),
    orgId: DEMO_ORG_ID,
    projectId: DEMO_PROJECTS[3].id,
    documentType: 'contract' as SignatureDocumentType,
    documentId: 'demo-contract-wilson-001',
    documentTitle: 'Wilson Fence Installation - Construction Agreement',
    documentPdfUrl: null,
    signers: [
      buildSigner(DEMO_CLIENTS.wilson, 'Property Owner', 1, 'sent'),
    ],
    currentSignerIndex: 0,
    status: 'pending' as SignatureRequestStatus,
    emailSubject: 'Contract for Fence Installation',
    emailMessage: 'Jennifer, attached is the construction agreement for your fence installation project. Please review and sign at your convenience.',
    expiresAt: new Date(Date.now() + 27 * 86400000), // Expires in 27 days
    remindersSent: 0,
    lastReminderAt: null,
    completedAt: null,
    signedDocumentUrl: null,
    auditTrail: [
      buildAuditEntry('created', pending1CreatedAt, { id: pm.uid, name: pm.displayName, role: 'sender' }),
      buildAuditEntry('sent', pending1SentAt, { id: pm.uid, name: pm.displayName, role: 'sender' }),
    ],
    createdBy: pm.uid,
    createdByName: pm.displayName,
    createdAt: pending1CreatedAt,
    updatedAt: pending1SentAt,
  });

  // ---------- 5. PENDING: Cafe TI - Scope of Work ----------
  const pending2CreatedAt = daysAgo(5);
  const pending2SentAt = daysAgo(4);
  requests.push({
    id: generateId('sig'),
    orgId: DEMO_ORG_ID,
    projectId: DEMO_PROJECTS[4].id,
    documentType: 'scope_of_work' as SignatureDocumentType,
    documentId: 'demo-sow-cafe-001',
    documentTitle: 'Downtown Cafe TI - Scope of Work',
    documentPdfUrl: null,
    signers: [
      buildSigner(DEMO_CLIENTS.downtownCafe, 'Business Owner', 1, 'sent'),
    ],
    currentSignerIndex: 0,
    status: 'pending' as SignatureRequestStatus,
    emailSubject: 'Scope of Work - Downtown Cafe Renovation',
    emailMessage: 'Tom, please review the scope of work for the tenant improvement project. Sign to authorize the work to begin.',
    expiresAt: new Date(Date.now() + 25 * 86400000),
    remindersSent: 1,
    lastReminderAt: daysAgo(1),
    completedAt: null,
    signedDocumentUrl: null,
    auditTrail: [
      buildAuditEntry('created', pending2CreatedAt, { id: owner.uid, name: owner.displayName, role: 'sender' }),
      buildAuditEntry('sent', pending2SentAt, { id: owner.uid, name: owner.displayName, role: 'sender' }),
      buildAuditEntry('reminder_sent', daysAgo(1), { role: 'system' }, 'Automatic reminder sent'),
    ],
    createdBy: owner.uid,
    createdByName: owner.displayName,
    createdAt: pending2CreatedAt,
    updatedAt: daysAgo(1),
  });

  // ---------- 6. SENT: Smith Kitchen - Change Order ----------
  const sent1CreatedAt = daysAgo(1);
  const sent1SentAt = daysAgo(1);
  requests.push({
    id: generateId('sig'),
    orgId: DEMO_ORG_ID,
    projectId: DEMO_PROJECTS[0].id,
    documentType: 'change_order' as SignatureDocumentType,
    documentId: 'demo-co-smith-002',
    documentTitle: 'Smith Kitchen - Change Order #2 (Upgraded Backsplash)',
    documentPdfUrl: null,
    signers: [
      buildSigner(DEMO_CLIENTS.smith, 'Property Owner', 1, 'sent'),
    ],
    currentSignerIndex: 0,
    status: 'pending' as SignatureRequestStatus,
    emailSubject: 'Change Order #2 - Upgraded Backsplash Tile',
    emailMessage: 'Robert, please review the change order for the upgraded backsplash tile. Net additional cost: $875.',
    expiresAt: new Date(Date.now() + 29 * 86400000),
    remindersSent: 0,
    lastReminderAt: null,
    completedAt: null,
    signedDocumentUrl: null,
    auditTrail: [
      buildAuditEntry('created', sent1CreatedAt, { id: pm.uid, name: pm.displayName, role: 'sender' }),
      buildAuditEntry('sent', sent1SentAt, { id: pm.uid, name: pm.displayName, role: 'sender' }),
    ],
    createdBy: pm.uid,
    createdByName: pm.displayName,
    createdAt: sent1CreatedAt,
    updatedAt: sent1SentAt,
  });

  // ---------- 7. SENT: Garcia Bath - Lien Waiver ----------
  const sent2CreatedAt = daysAgo(2);
  const sent2SentAt = daysAgo(2);
  requests.push({
    id: generateId('sig'),
    orgId: DEMO_ORG_ID,
    projectId: DEMO_PROJECTS[1].id,
    documentType: 'lien_waiver' as SignatureDocumentType,
    documentId: 'demo-lw-garcia-001',
    documentTitle: 'Garcia Master Bath - Conditional Lien Waiver (Progress)',
    documentPdfUrl: null,
    signers: [
      buildSigner(DEMO_CLIENTS.garcia, 'Homeowner', 1, 'sent'),
    ],
    currentSignerIndex: 0,
    status: 'pending' as SignatureRequestStatus,
    emailSubject: 'Lien Waiver - Garcia Master Bath Progress Payment',
    emailMessage: 'Maria, please sign the conditional lien waiver for the progress payment received. This is a standard document for your records.',
    expiresAt: new Date(Date.now() + 28 * 86400000),
    remindersSent: 0,
    lastReminderAt: null,
    completedAt: null,
    signedDocumentUrl: null,
    auditTrail: [
      buildAuditEntry('created', sent2CreatedAt, { id: owner.uid, name: owner.displayName, role: 'sender' }),
      buildAuditEntry('sent', sent2SentAt, { id: owner.uid, name: owner.displayName, role: 'sender' }),
    ],
    createdBy: owner.uid,
    createdByName: owner.displayName,
    createdAt: sent2CreatedAt,
    updatedAt: sent2SentAt,
  });

  // ---------- 8. VIEWED: Main St Retail - Change Order #2 ----------
  const viewed1CreatedAt = daysAgo(6);
  const viewed1SentAt = daysAgo(5);
  const viewed1ViewedAt = daysAgo(4);
  requests.push({
    id: generateId('sig'),
    orgId: DEMO_ORG_ID,
    projectId: DEMO_PROJECTS[2].id,
    documentType: 'change_order' as SignatureDocumentType,
    documentId: 'demo-co-mainst-002',
    documentTitle: 'Main St. Retail - Change Order #2 (Additional Outlet Locations)',
    documentPdfUrl: null,
    signers: [
      buildSigner(DEMO_CLIENTS.mainStRetail, 'Client Representative', 1, 'viewed', {
        viewedAt: viewed1ViewedAt,
      }),
    ],
    currentSignerIndex: 0,
    status: 'viewed' as SignatureRequestStatus,
    emailSubject: 'Change Order #2 - Additional Outlet Locations',
    emailMessage: 'Susan, please review and sign the change order for the additional outlet locations requested. Additional cost: $1,450.',
    expiresAt: new Date(Date.now() + 24 * 86400000),
    remindersSent: 1,
    lastReminderAt: daysAgo(2),
    completedAt: null,
    signedDocumentUrl: null,
    auditTrail: [
      buildAuditEntry('created', viewed1CreatedAt, { id: pm.uid, name: pm.displayName, role: 'sender' }),
      buildAuditEntry('sent', viewed1SentAt, { id: pm.uid, name: pm.displayName, role: 'sender' }),
      buildAuditEntry('viewed', viewed1ViewedAt, { email: DEMO_CLIENTS.mainStRetail.email, name: 'Susan Martinez', role: 'signer' }),
      buildAuditEntry('reminder_sent', daysAgo(2), { role: 'system' }, 'Automatic reminder sent'),
    ],
    createdBy: pm.uid,
    createdByName: pm.displayName,
    createdAt: viewed1CreatedAt,
    updatedAt: viewed1ViewedAt,
  });

  // ---------- 9. DECLINED: Wilson Fence - Estimate ----------
  const declined1CreatedAt = daysAgo(20);
  const declined1SentAt = daysAgo(19);
  const declined1ViewedAt = daysAgo(18);
  const declined1DeclinedAt = daysAgo(17);
  requests.push({
    id: generateId('sig'),
    orgId: DEMO_ORG_ID,
    projectId: DEMO_PROJECTS[3].id,
    documentType: 'estimate' as SignatureDocumentType,
    documentId: 'demo-estimate-wilson-001',
    documentTitle: 'Wilson Fence Installation - Initial Estimate (Rev A)',
    documentPdfUrl: null,
    signers: [
      buildSigner(DEMO_CLIENTS.wilson, 'Property Owner', 1, 'declined', {
        viewedAt: declined1ViewedAt,
        declinedAt: declined1DeclinedAt,
      }),
    ],
    currentSignerIndex: 0,
    status: 'declined' as SignatureRequestStatus,
    emailSubject: 'Estimate for Fence Installation',
    emailMessage: 'Jennifer, here is the estimate for your fence installation project. Please review and sign to move forward.',
    expiresAt: daysAgo(0),
    remindersSent: 0,
    lastReminderAt: null,
    completedAt: null,
    signedDocumentUrl: null,
    auditTrail: [
      buildAuditEntry('created', declined1CreatedAt, { id: owner.uid, name: owner.displayName, role: 'sender' }),
      buildAuditEntry('sent', declined1SentAt, { id: owner.uid, name: owner.displayName, role: 'sender' }),
      buildAuditEntry('viewed', declined1ViewedAt, { email: DEMO_CLIENTS.wilson.email, name: 'Jennifer Wilson', role: 'signer' }),
      buildAuditEntry('declined', declined1DeclinedAt, { email: DEMO_CLIENTS.wilson.email, name: 'Jennifer Wilson', role: 'signer' }, 'Need to review with spouse before signing.'),
    ],
    createdBy: owner.uid,
    createdByName: owner.displayName,
    createdAt: declined1CreatedAt,
    updatedAt: declined1DeclinedAt,
  });

  // ---------- 10. EXPIRED: Cafe TI - Estimate ----------
  const expired1CreatedAt = monthsAgo(2);
  const expired1SentAt = new Date(expired1CreatedAt.getTime() + 86400000);
  const expired1ExpiresAt = new Date(expired1CreatedAt.getTime() + 30 * 86400000);
  requests.push({
    id: generateId('sig'),
    orgId: DEMO_ORG_ID,
    projectId: DEMO_PROJECTS[4].id,
    documentType: 'estimate' as SignatureDocumentType,
    documentId: 'demo-estimate-cafe-old',
    documentTitle: 'Downtown Cafe TI - Estimate (Superseded)',
    documentPdfUrl: null,
    signers: [
      buildSigner(DEMO_CLIENTS.downtownCafe, 'Business Owner', 1, 'pending'),
    ],
    currentSignerIndex: 0,
    status: 'expired' as SignatureRequestStatus,
    emailSubject: 'Estimate for Cafe Renovation',
    emailMessage: 'Tom, please review the estimate for the tenant improvement project.',
    expiresAt: expired1ExpiresAt,
    remindersSent: 3,
    lastReminderAt: new Date(expired1ExpiresAt.getTime() - 3 * 86400000),
    completedAt: null,
    signedDocumentUrl: null,
    auditTrail: [
      buildAuditEntry('created', expired1CreatedAt, { id: pm.uid, name: pm.displayName, role: 'sender' }),
      buildAuditEntry('sent', expired1SentAt, { id: pm.uid, name: pm.displayName, role: 'sender' }),
      buildAuditEntry('reminder_sent', new Date(expired1ExpiresAt.getTime() - 14 * 86400000), { role: 'system' }, 'Reminder sent - 14 days remaining'),
      buildAuditEntry('reminder_sent', new Date(expired1ExpiresAt.getTime() - 7 * 86400000), { role: 'system' }, 'Reminder sent - 7 days remaining'),
      buildAuditEntry('reminder_sent', new Date(expired1ExpiresAt.getTime() - 3 * 86400000), { role: 'system' }, 'Reminder sent - 3 days remaining'),
      buildAuditEntry('expired', expired1ExpiresAt, { role: 'system' }, 'Signature request expired after 30 days'),
    ],
    createdBy: pm.uid,
    createdByName: pm.displayName,
    createdAt: expired1CreatedAt,
    updatedAt: expired1ExpiresAt,
  });

  return requests;
}

// ============================================
// Firestore Conversion
// ============================================

function convertDatesToTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return toTimestamp(obj);
  if (Array.isArray(obj)) return obj.map(item => convertDatesToTimestamps(item));
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertDatesToTimestamps(value);
    }
    return result;
  }
  return obj;
}

// ============================================
// Seed Function
// ============================================

async function seedSignatures(): Promise<number> {
  logSection('Seeding Signature Requests');

  const db = getDb();
  const requests = buildSignatureRequests();

  logProgress(`Preparing ${requests.length} signature requests...`);

  // Write to Firestore (top-level 'signatureRequests' collection)
  await executeBatchWrites(
    db,
    requests,
    (batch, req) => {
      const ref = db.collection('signatureRequests').doc(req.id);
      batch.set(ref, convertDatesToTimestamps(req));
    },
    'Signature Requests'
  );

  // Log summary
  const statusCounts: Record<string, number> = {};
  for (const req of requests) {
    statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
  }
  logSuccess(`Created ${requests.length} signature requests`);
  for (const [status, count] of Object.entries(statusCounts)) {
    logProgress(`  ${status}: ${count}`);
  }

  return requests.length;
}

// ============================================
// Main Export
// ============================================

export { seedSignatures };

// Run if executed directly
if (require.main === module) {
  seedSignatures()
    .then((count) => {
      console.log(`\nCompleted: Created ${count} signature requests`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding signature requests:', error);
      process.exit(1);
    });
}
