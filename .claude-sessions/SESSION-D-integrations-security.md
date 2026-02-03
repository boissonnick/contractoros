# Session D: Integrations + Security

> **Run Command:** `claude "Execute session D from .claude-sessions/SESSION-D-integrations-security.md"`
> **Duration:** 4-6 hours
> **Phases:** 7 + 8
> **Priority:** 🔴 P0 (Security) + 🟠 P2 (Integrations)
> **Prerequisites:** Sessions A, B, and C complete

---

## Pre-Session Checklist

Before starting, verify previous sessions completed:
```bash
cd apps/web && npx tsc --noEmit                    # Must pass
npm run test                                       # Tests should pass
# Verify Coming Soon pages converted:
grep -r "ComingSoon" apps/web/app/ | wc -l        # Should be 0 or minimal
```

---

## PHASE 7: Integrations (2-3 hours)

### Batch 7.1: SMS Implementation
**Launch these 3 agents in parallel:**

#### Agent 1: Cloud Function - sendSMS + Webhook
```
Task: Implement Twilio SMS Cloud Functions.

CONTEXT:
- Twilio is partially configured but not connected
- Need Cloud Functions to send/receive SMS
- Database collections exist (smsMessages, smsConversations)

CREATE: functions/src/sms/index.ts

REQUIREMENTS:
1. sendSMS function (HTTP callable):
   ```typescript
   import * as functions from 'firebase-functions';
   import twilio from 'twilio';

   const client = twilio(
     process.env.TWILIO_ACCOUNT_SID,
     process.env.TWILIO_AUTH_TOKEN
   );

   export const sendSMS = functions.https.onCall(async (data, context) => {
     // Verify auth
     if (!context.auth) {
       throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
     }

     const { to, message, projectId, orgId } = data;

     // Send via Twilio
     const result = await client.messages.create({
       body: message,
       from: process.env.TWILIO_PHONE_NUMBER,
       to: to,
     });

     // Log to Firestore
     const db = getFirestore(admin.app(), 'contractoros');
     await db.collection('organizations').doc(orgId)
       .collection('smsMessages').add({
         to,
         body: message,
         projectId,
         twilioSid: result.sid,
         status: result.status,
         direction: 'outbound',
         sentAt: admin.firestore.FieldValue.serverTimestamp(),
         sentBy: context.auth.uid,
       });

     return { success: true, sid: result.sid };
   });
   ```

2. smsWebhook function (HTTP endpoint for incoming):
   ```typescript
   export const smsWebhook = functions.https.onRequest(async (req, res) => {
     const { From, Body, MessageSid } = req.body;

     // Find conversation by phone number
     // Store incoming message
     // Trigger notification to relevant users

     res.status(200).send('<Response></Response>');
   });
   ```

3. Add to functions/src/index.ts exports

4. Add environment variables:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER

5. Deploy: firebase deploy --only functions

DELIVERABLE: SMS send and receive Cloud Functions deployed
```

#### Agent 2: useSMS Hook + Conversation UI
```
Task: Create frontend hook and conversation UI for SMS.

CREATE: apps/web/lib/hooks/useSMS.ts

```typescript
interface UseSMSResult {
  conversations: SMSConversation[];
  messages: SMSMessage[];
  loading: boolean;
  error: Error | null;
  sendMessage: (to: string, message: string, projectId?: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
}

export function useSMS(orgId: string): UseSMSResult {
  // Fetch conversations for org
  // Real-time listener for messages
  // Send via callable Cloud Function
}
```

CREATE: apps/web/components/sms/SMSConversation.tsx

```typescript
interface SMSConversationProps {
  conversation: SMSConversation;
  messages: SMSMessage[];
  onSendMessage: (message: string) => void;
}

export function SMSConversation({
  conversation,
  messages,
  onSendMessage,
}: SMSConversationProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with contact info */}
      <div className="border-b p-4">
        <h3>{conversation.contactName || conversation.phoneNumber}</h3>
        <p className="text-sm text-gray-500">{conversation.phoneNumber}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map(msg => (
          <SMSBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <SMSInput onSend={onSendMessage} />
      </div>
    </div>
  );
}
```

CREATE: apps/web/app/dashboard/messaging/sms/page.tsx
- List of SMS conversations
- Click to open conversation
- New message button

DELIVERABLE: SMS hook and conversation UI components
```

#### Agent 3: SMS Templates Management
```
Task: Create SMS template management UI.

CONTEXT:
- smsTemplates collection exists in Firestore
- Contractors want reusable message templates

CREATE: apps/web/app/dashboard/settings/sms-templates/page.tsx

REQUIREMENTS:
1. List existing templates
2. Create new template:
   - Name
   - Message body with variables
   - Category (reminder, update, notification)
3. Edit/delete templates
4. Variable placeholders:
   - {{clientName}}
   - {{projectName}}
   - {{appointmentDate}}
   - {{amount}}

IMPLEMENTATION:
```typescript
interface SMSTemplate {
  id: string;
  name: string;
  body: string;
  category: 'reminder' | 'update' | 'notification' | 'custom';
  variables: string[];
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Template editor with variable insertion
<TemplateEditor
  template={template}
  onSave={saveTemplate}
  availableVariables={['clientName', 'projectName', ...]}
/>

// Preview with sample data
<TemplatePreview
  template={template.body}
  sampleData={{
    clientName: 'John Smith',
    projectName: 'Kitchen Renovation',
  }}
/>
```

ALSO CREATE: useSMSTemplates hook for CRUD operations

DELIVERABLE: SMS templates management page
```

**Wait for Batch 7.1 to complete.**

---

### Batch 7.2: QBO + Integration Dashboard
**Launch these 3 agents in parallel:**

#### Agent 4: QBO Scheduled Sync
```
Task: Add scheduled QuickBooks sync Cloud Function.

CONTEXT:
- QBO integration is 60% complete
- Manual sync only - needs automation
- Files: apps/web/lib/integrations/quickbooks/

CREATE: functions/src/integrations/qbo-scheduled-sync.ts

```typescript
import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

export const qboScheduledSync = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async (context) => {
    const db = getFirestore(admin.app(), 'contractoros');

    // Get all orgs with active QBO connection
    const connections = await db.collectionGroup('accountingConnections')
      .where('provider', '==', 'quickbooks')
      .where('isActive', '==', true)
      .get();

    for (const conn of connections.docs) {
      try {
        const orgId = conn.ref.parent.parent?.id;
        if (!orgId) continue;

        // Check if token needs refresh
        const tokenData = conn.data();
        if (isTokenExpired(tokenData)) {
          await refreshToken(orgId, tokenData);
        }

        // Sync customers
        await syncCustomers(orgId);

        // Sync invoices (sent in last 7 days)
        await syncRecentInvoices(orgId);

        // Pull payment updates
        await syncPayments(orgId);

        // Log success
        await logSync(orgId, 'success');
      } catch (error) {
        await logSync(conn.ref.parent.parent?.id, 'error', error.message);
      }
    }
  });

function isTokenExpired(tokenData: any): boolean {
  const expiresAt = tokenData.expiresAt?.toDate();
  return expiresAt && expiresAt < new Date(Date.now() + 5 * 60 * 1000);
}
```

ADD TO: functions/src/index.ts

DELIVERABLE: QBO auto-syncs every 6 hours
```

#### Agent 5: Integration Status Dashboard
```
Task: Create dashboard showing all integration statuses.

CREATE: apps/web/app/dashboard/settings/integrations/status/page.tsx

REQUIREMENTS:
1. Show all integrations with status:
   - QuickBooks: Connected/Disconnected, last sync, sync health
   - Twilio: Configured/Not configured, message count
   - Mailgun: Configured, emails sent
   - Google Maps: API key status

2. For each integration show:
   - Connection status (green/yellow/red)
   - Last activity
   - Error count (if any)
   - Quick actions (sync now, disconnect, configure)

3. Sync history:
   - Recent sync logs
   - Success/failure rate
   - Data synced counts

IMPLEMENTATION:
```typescript
<div className="space-y-6">
  <PageHeader title="Integration Status" />

  <div className="grid gap-4 md:grid-cols-2">
    <IntegrationCard
      name="QuickBooks Online"
      status={qboStatus}
      icon={<QBOIcon />}
      lastSync={qboLastSync}
      actions={[
        { label: 'Sync Now', onClick: triggerSync },
        { label: 'Settings', href: '/settings/integrations/quickbooks' },
      ]}
    />

    <IntegrationCard
      name="Twilio SMS"
      status={twilioStatus}
      icon={<TwilioIcon />}
      stats={{ sent: 142, received: 89 }}
      actions={[
        { label: 'Configure', href: '/settings/integrations/twilio' },
      ]}
    />

    {/* More integrations */}
  </div>

  <SyncHistoryTable logs={syncLogs} />
</div>
```

DELIVERABLE: Integration status dashboard page
```

#### Agent 6: Gusto/Stripe Stub Pages
```
Task: Improve stub pages for future integrations.

CONTEXT:
- Gusto and Stripe integrations are planned but not built
- Need better "coming soon" experience

UPDATE: apps/web/app/dashboard/settings/integrations/gusto/page.tsx
UPDATE: apps/web/app/dashboard/settings/integrations/stripe/page.tsx

REQUIREMENTS:
1. Show what the integration will do
2. Collect interest (notify me when ready)
3. Link to documentation
4. Estimated availability

IMPLEMENTATION:
```typescript
<IntegrationComingSoon
  name="Gusto"
  icon={<GustoIcon />}
  description="Sync employee data, timesheets, and payroll with Gusto for seamless payroll processing."
  features={[
    'Automatic timesheet sync',
    'Employee data import',
    'Payroll status updates',
    'Direct deposit tracking',
  ]}
  estimatedDate="Q2 2026"
  onNotifyMe={subscribeToUpdates}
/>
```

Also add "Notify Me" functionality:
- Store email/userId in a waitlist collection
- Show confirmation when subscribed

DELIVERABLE: Improved integration stub pages with waitlist
```

**Wait for Batch 7.2 to complete.**

---

## PHASE 8: Security Hardening (2-3 hours)

### Batch 8.1: Core Security
**Launch these 3 agents in parallel:**

#### Agent 7: Field-Level Encryption for PII
```
Task: Implement encryption for sensitive personal data.

CONTEXT:
- Currently PII (email, phone, SSN) stored in plaintext
- Need encryption at rest for compliance

APPROACH:
Use Firebase Extensions or custom encryption with Cloud KMS.

CREATE: apps/web/lib/security/encryption.ts

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// In production, key should come from Cloud KMS
const getEncryptionKey = async (): Promise<Buffer> => {
  // For now, from environment variable
  // TODO: Migrate to Cloud KMS for production
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('Encryption key not configured');
  return Buffer.from(key, 'hex');
};

export async function encryptField(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export async function decryptField(ciphertext: string): Promise<string> {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  const key = await getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Fields that should be encrypted
export const ENCRYPTED_FIELDS = [
  'ssn',
  'taxId',
  'bankAccount',
  'routingNumber',
];

// Helper to encrypt object fields
export async function encryptSensitiveFields<T extends object>(
  obj: T,
  fields: (keyof T)[]
): Promise<T> {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      (result as any)[field] = await encryptField(result[field] as string);
    }
  }
  return result;
}
```

UPDATE HOOKS:
- When saving user profiles, encrypt sensitive fields
- When reading, decrypt for display
- Add isEncrypted flag to track migration status

MIGRATION SCRIPT:
Create scripts/migrate-encrypt-pii.ts to encrypt existing data

DELIVERABLE: Encryption utilities and integration with sensitive data
```

#### Agent 8: Rate Limiting on API Routes
```
Task: Add rate limiting to all remaining unprotected API routes.

CONTEXT:
- Some API routes have rate limiting, many don't
- Need consistent protection

AUDIT FIRST:
```bash
# Find all API routes
find apps/web/app/api -name "route.ts" -type f

# Check which have rate limiting
grep -r "rateLimit" apps/web/app/api/
```

CREATE: apps/web/lib/api/rate-limit-middleware.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;      // Time window in ms
  maxRequests: number;   // Max requests per window
  identifier?: (req: NextRequest) => string;  // Custom identifier
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 100,
};

// In-memory store (use Redis in production for multi-instance)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: Partial<RateLimitConfig> = {}
) {
  const { windowMs, maxRequests, identifier } = { ...defaultConfig, ...config };

  return async (req: NextRequest) => {
    const key = identifier
      ? identifier(req)
      : req.headers.get('x-forwarded-for') || 'anonymous';

    const now = Date.now();
    const record = requestCounts.get(key);

    if (!record || record.resetAt < now) {
      requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    } else if (record.count >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((record.resetAt - now) / 1000)),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(record.resetAt),
          },
        }
      );
    } else {
      record.count++;
    }

    return handler(req);
  };
}
```

UPDATE ALL API ROUTES:
- Wrap handlers with withRateLimit
- Use appropriate limits per endpoint type:
  - Auth endpoints: 10/min
  - Read endpoints: 100/min
  - Write endpoints: 30/min
  - Upload endpoints: 10/min

DELIVERABLE: All API routes protected with rate limiting
```

#### Agent 9: Audit Logging Improvements
```
Task: Enhance audit logging for security-sensitive actions.

CONTEXT:
- Basic audit logs exist
- Need comprehensive logging for compliance

CREATE: apps/web/lib/audit/audit-logger.ts

```typescript
interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  orgId: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure';
  errorMessage?: string;
}

type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.password_change'
  | 'user.role_change'
  | 'user.invite'
  | 'user.delete'
  | 'data.export'
  | 'data.delete'
  | 'settings.change'
  | 'integration.connect'
  | 'integration.disconnect'
  | 'payment.process'
  | 'document.sign'
  | 'access.denied';

export async function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
  const db = getDb();
  await db.collection('organizations').doc(event.orgId)
    .collection('auditLogs').add({
      ...event,
      timestamp: serverTimestamp(),
    });
}

// Convenience functions
export const auditLogger = {
  login: (userId: string, orgId: string, success: boolean) =>
    logAuditEvent({
      userId,
      orgId,
      action: 'user.login',
      resource: 'auth',
      resourceId: userId,
      details: {},
      result: success ? 'success' : 'failure',
    }),

  dataExport: (userId: string, orgId: string, exportType: string) =>
    logAuditEvent({
      userId,
      orgId,
      action: 'data.export',
      resource: exportType,
      resourceId: '',
      details: { exportType },
      result: 'success',
    }),

  // More convenience methods...
};
```

INTEGRATE INTO:
- Auth flows (login, logout, password change)
- Role changes
- Data exports
- Settings changes
- Integration connections
- Payment processing
- Document signing
- Access denied events

CREATE: apps/web/app/dashboard/settings/audit-log/page.tsx
- View audit logs
- Filter by action, user, date
- Export for compliance

DELIVERABLE: Comprehensive audit logging system
```

**Wait for Batch 8.1 to complete.**

---

### Batch 8.2: Compliance & Session Management
**Launch these 3 agents in parallel:**

#### Agent 10: Data Retention Policy
```
Task: Implement automatic data retention/archival.

CONTEXT:
- Data grows indefinitely
- Need retention policies for compliance and performance

CREATE: functions/src/maintenance/data-retention.ts

```typescript
import * as functions from 'firebase-functions';

export const enforceDataRetention = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = getFirestore(admin.app(), 'contractoros');
    const now = new Date();

    // Get retention policies
    const policies = [
      { collection: 'activityLogs', retentionDays: 90 },
      { collection: 'auditLogs', retentionDays: 365 },
      { collection: 'smsMessages', retentionDays: 180 },
      { collection: 'voiceLogs', retentionDays: 90 },
    ];

    for (const policy of policies) {
      const cutoffDate = new Date(now.getTime() - policy.retentionDays * 24 * 60 * 60 * 1000);

      // Archive old records
      const oldRecords = await db.collectionGroup(policy.collection)
        .where('createdAt', '<', cutoffDate)
        .limit(500)  // Batch size
        .get();

      // Move to archive bucket or delete based on policy
      for (const doc of oldRecords.docs) {
        // Option 1: Archive to Cloud Storage
        await archiveToStorage(policy.collection, doc.id, doc.data());

        // Option 2: Delete
        await doc.ref.delete();
      }

      console.log(`Processed ${oldRecords.size} ${policy.collection} records`);
    }
  });
```

CREATE: apps/web/app/dashboard/settings/data-retention/page.tsx
- Show current retention policies
- Allow customization (within limits)
- Show archive status

DELIVERABLE: Automated data retention with configurable policies
```

#### Agent 11: GDPR Data Export Tool
```
Task: Create tool for users to export their data (GDPR compliance).

CREATE: apps/web/app/dashboard/settings/export-data/page.tsx

REQUIREMENTS:
1. User can request export of their data
2. Generates downloadable file with:
   - Profile information
   - Time entries
   - Messages sent
   - Activity history
3. Notifies when export is ready
4. Logs export in audit trail

IMPLEMENTATION:
```typescript
// Export request page
export default function ExportDataPage() {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportReady, setExportReady] = useState<string | null>(null);

  const requestExport = async () => {
    setExporting(true);
    const result = await fetch('/api/gdpr/export', {
      method: 'POST',
    });
    const { downloadUrl } = await result.json();
    setExportReady(downloadUrl);
    setExporting(false);
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Export Your Data"
        description="Download a copy of all your personal data stored in ContractorOS"
      />

      <Card>
        <p>Your export will include:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Profile information</li>
          <li>Time entries</li>
          <li>Messages you've sent</li>
          <li>Activity history</li>
          <li>Documents you've uploaded</li>
        </ul>

        <Button
          onClick={requestExport}
          loading={exporting}
          className="mt-4"
        >
          Request Data Export
        </Button>

        {exportReady && (
          <Alert variant="success" className="mt-4">
            Your export is ready!
            <a href={exportReady} download>Download</a>
          </Alert>
        )}
      </Card>
    </div>
  );
}
```

CREATE: apps/web/app/api/gdpr/export/route.ts
- Collect user's data from all collections
- Generate JSON/CSV file
- Upload to secure location
- Return download URL (expires in 24h)

DELIVERABLE: GDPR-compliant data export functionality
```

#### Agent 12: Session Timeout + Force Logout
```
Task: Implement session management with timeout and force logout.

CONTEXT:
- Currently sessions persist indefinitely
- Need timeout for security
- Need ability to force logout (stolen device, etc.)

CREATE: apps/web/lib/auth/session-manager.ts

```typescript
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity

export class SessionManager {
  private lastActivity: number;
  private timeoutTimer: NodeJS.Timeout | null = null;

  constructor(private onTimeout: () => void) {
    this.lastActivity = Date.now();
    this.startTimer();
    this.setupActivityListeners();
  }

  private setupActivityListeners() {
    if (typeof window !== 'undefined') {
      ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, () => this.recordActivity());
      });
    }
  }

  private recordActivity() {
    this.lastActivity = Date.now();
  }

  private startTimer() {
    this.timeoutTimer = setInterval(() => {
      const now = Date.now();
      const idleTime = now - this.lastActivity;

      if (idleTime > IDLE_TIMEOUT_MS) {
        this.onTimeout();
      }
    }, 60 * 1000); // Check every minute
  }

  destroy() {
    if (this.timeoutTimer) {
      clearInterval(this.timeoutTimer);
    }
  }
}
```

UPDATE: AuthProvider
- Track session start time
- Check against max session duration
- Show warning before timeout
- Force logout on timeout

CREATE: Force logout via other sessions
```typescript
// In user profile, store active sessions
interface UserSession {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  startedAt: Date;
  lastActiveAt: Date;
}

// API to list and revoke sessions
// /api/sessions - GET list, DELETE revoke
```

CREATE: apps/web/app/dashboard/settings/sessions/page.tsx
- Show active sessions
- "Log out all other devices" button
- Individual session revocation

DELIVERABLE: Session timeout + force logout functionality
```

**Wait for Batch 8.2 to complete.**

---

### Batch 8.3: Security Verification
**Launch these 2 agents in parallel:**

#### Agent 13: Run Security E2E Tests
```
Task: Execute all security-related E2E tests and fix any failures.

CONTEXT:
- Security tests in apps/web/e2e/suites/02-rbac.md
- Must all pass before launch

STEPS:
1. Review the test suite:
   apps/web/e2e/suites/02-rbac.md

2. Execute tests using Chrome MCP:
   - Test client data isolation (BUG-001)
   - Test client portal isolation (BUG-002)
   - Test PM payroll access denied (BUG-003)
   - Test employee admin buttons hidden (BUG-005)
   - Test contractor admin buttons hidden (BUG-006)

3. Document any failures

4. Fix any issues found

5. Re-run until all pass

DELIVERABLE: All security E2E tests passing, results documented
```

#### Agent 14: Verify Encryption + Create Security Checklist
```
Task: Verify encryption is working and create pre-launch security checklist.

VERIFICATION:
1. Test encryption/decryption manually
2. Verify encrypted fields in Firestore (should be unreadable)
3. Verify decryption works in UI

CREATE: docs/SECURITY_CHECKLIST.md

```markdown
# ContractorOS Security Checklist

## Pre-Launch Verification

### Authentication & Authorization
- [ ] Firebase Auth properly configured
- [ ] All routes require authentication (except public)
- [ ] RBAC enforced on all endpoints
- [ ] Client isolation verified (BUG-001 test passing)
- [ ] Role-based UI elements hidden appropriately

### Data Protection
- [ ] PII fields encrypted at rest
- [ ] Encryption key in Secret Manager
- [ ] Data retention policies active
- [ ] GDPR export tool functional

### API Security
- [ ] All API routes rate-limited
- [ ] CORS configured correctly
- [ ] No sensitive data in URLs
- [ ] Input validation on all endpoints

### Infrastructure
- [ ] Firestore rules deployed and tested
- [ ] Cloud Functions using named database
- [ ] Secrets in Secret Manager (not env vars)
- [ ] SSL/TLS configured

### Monitoring & Logging
- [ ] Audit logging active
- [ ] Error tracking (Sentry) configured
- [ ] Security alerts configured
- [ ] Login attempt monitoring

### Session Management
- [ ] Session timeout implemented
- [ ] Force logout capability
- [ ] Session list viewable by user
- [ ] Max session duration enforced

## Regular Security Tasks

### Weekly
- [ ] Review failed login attempts
- [ ] Check rate limit triggers
- [ ] Review audit logs for anomalies

### Monthly
- [ ] Dependency vulnerability scan
- [ ] Review user access levels
- [ ] Test backup/restore procedures

### Quarterly
- [ ] Penetration test
- [ ] Security policy review
- [ ] Incident response drill
```

DELIVERABLE: Encryption verified, security checklist created
```

**Wait for Batch 8.3 to complete.**

---

## VERIFICATION & SELF-IMPROVEMENT

### Final Verification
```bash
# TypeScript check
cd apps/web && npx tsc --noEmit

# Run all tests
npm run test

# Deploy Cloud Functions
cd functions && npm run deploy

# Verify SMS works (if Twilio configured)
# Verify QBO sync runs

# Run security tests
# Execute apps/web/e2e/suites/02-rbac.md

# Check encryption
# Manually verify encrypted fields in Firestore
```

### Self-Improvement Analysis

**Launch this agent after all work is complete:**

#### Agent 15: Session D Retrospective
```
Task: Analyze Session D and update documentation.

PROCESS:
1. ANALYZE INTEGRATION PATTERNS:
   - How was Twilio integrated? Document pattern.
   - How does QBO sync work? Document.
   - What's the pattern for future integrations?

2. ANALYZE SECURITY IMPLEMENTATIONS:
   - Did encryption work as expected?
   - Any edge cases with rate limiting?
   - Session management gotchas?

3. UPDATE CLAUDE.MD:
   Add sections for:
   - Integration patterns (Cloud Functions + Frontend hooks)
   - Security utilities (encryption, rate limiting)
   - Audit logging conventions
   - API route security checklist

4. UPDATE ARCHITECTURE.md:
   Add:
   - Integration architecture diagram
   - Security layer description
   - Data flow for sensitive operations

5. CREATE INTEGRATION_GUIDE.md:
   Document how to add new integrations:
   - Cloud Function setup
   - Frontend hook pattern
   - OAuth flow (if applicable)
   - Webhook handling

6. CREATE SESSION LEARNINGS:
   .claude-sessions/SESSION-D-learnings.md
   - Integrations completed
   - Security measures implemented
   - Patterns established
   - Remaining security items

7. UPDATE SPRINT_STATUS.md:
   Mark Phases 7 and 8 complete.

DELIVERABLE: Comprehensive documentation for integrations and security
```

---

## Session D Completion Checklist

### Integrations (Phase 7)
- [ ] SMS sendSMS Cloud Function deployed
- [ ] SMS webhook receiving messages
- [ ] useSMS hook working
- [ ] SMS conversation UI functional
- [ ] SMS templates management
- [ ] QBO scheduled sync (6-hour cron)
- [ ] Integration status dashboard
- [ ] Gusto/Stripe stub pages improved

### Security (Phase 8)
- [ ] PII field encryption implemented
- [ ] Encryption/decryption verified
- [ ] Rate limiting on all API routes
- [ ] Audit logging comprehensive
- [ ] Data retention policy active
- [ ] GDPR data export working
- [ ] Session timeout implemented
- [ ] Force logout capability
- [ ] Security E2E tests passing
- [ ] Security checklist created

### Quality
- [ ] TypeScript passing
- [ ] All tests passing
- [ ] Cloud Functions deployed
- [ ] Self-improvement complete
- [ ] Documentation updated

---

## Next Session

After completing Session D, proceed to:
**Session E: Launch Prep + Deploy** (`.claude-sessions/SESSION-E-launch-prep-deploy.md`)
