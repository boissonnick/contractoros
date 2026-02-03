# Google Workspace Integration Research

> **Feature:** F3 - Google Workspace Integration (#94)
> **Status:** Research Complete
> **Last Updated:** 2026-02-03

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [OAuth Setup Requirements](#1-oauth-setup-requirements)
3. [Directory Sync Architecture](#2-directory-sync-architecture)
4. [Feature Integration](#3-feature-integration)
5. [Implementation Plan](#4-implementation-plan)
6. [Security Considerations](#5-security-considerations)
7. [Technical Specifications](#6-technical-specifications)
8. [References](#7-references)

---

## Executive Summary

This document outlines the integration of Google Workspace with ContractorOS to enable:

- **User Management**: Auto-provision users from Google Admin Directory
- **Calendar Sync**: Bidirectional sync with Google Calendar for scheduling
- **Email Integration**: Gmail connectivity for project messaging
- **Document Storage**: Google Drive integration for file management
- **Video Calls**: Google Meet integration for virtual meetings

### Key Benefits

| Benefit | Impact |
|---------|--------|
| Reduced onboarding friction | Users sign in with existing Google accounts |
| Centralized user management | Admin changes in Google propagate to ContractorOS |
| Familiar tooling | Teams use Google tools they already know |
| Enterprise-ready | Supports Google Workspace Business/Enterprise |

---

## 1. OAuth Setup Requirements

### 1.1 Google Cloud Console Project Setup

#### Step 1: Create or Configure GCP Project

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing `contractoros-483812`
3. Enable the following APIs:
   - Admin SDK API
   - Google Calendar API
   - Gmail API
   - Google Drive API
   - Google Meet REST API

```bash
# Enable APIs via gcloud CLI
gcloud services enable admin.googleapis.com --project=contractoros-483812
gcloud services enable calendar-json.googleapis.com --project=contractoros-483812
gcloud services enable gmail.googleapis.com --project=contractoros-483812
gcloud services enable drive.googleapis.com --project=contractoros-483812
gcloud services enable meet.googleapis.com --project=contractoros-483812
```

#### Step 2: Configure OAuth Consent Screen

Navigate to **APIs & Services > OAuth consent screen** (or **Google Auth platform > Branding** in newer UI):

| Field | Value |
|-------|-------|
| User Type | External (or Internal for Workspace-only) |
| App Name | ContractorOS |
| User Support Email | support@contractoros.com |
| App Logo | ContractorOS logo (512x512) |
| App Domain | contractoros.com |
| Authorized Domains | contractoros.com |
| Developer Contact | dev@contractoros.com |

**Required Links:**
- Homepage: `https://contractoros.com`
- Privacy Policy: `https://contractoros.com/privacy`
- Terms of Service: `https://contractoros.com/terms`

### 1.2 Required OAuth Scopes

#### Directory API Scopes (User Sync)

| Scope | Description | Sensitivity |
|-------|-------------|-------------|
| `https://www.googleapis.com/auth/admin.directory.user.readonly` | View users in domain | Sensitive |
| `https://www.googleapis.com/auth/admin.directory.group.readonly` | View groups in domain | Sensitive |
| `https://www.googleapis.com/auth/admin.directory.orgunit.readonly` | View organizational units | Sensitive |

#### Calendar API Scopes

| Scope | Description | Sensitivity |
|-------|-------------|-------------|
| `https://www.googleapis.com/auth/calendar.readonly` | View calendar events | Sensitive |
| `https://www.googleapis.com/auth/calendar.events` | Create/modify events | Sensitive |
| `https://www.googleapis.com/auth/calendar.calendarlist.readonly` | View calendar list | Sensitive |

#### Gmail API Scopes

| Scope | Description | Sensitivity |
|-------|-------------|-------------|
| `https://www.googleapis.com/auth/gmail.readonly` | Read emails | Restricted |
| `https://www.googleapis.com/auth/gmail.send` | Send emails | Restricted |
| `https://www.googleapis.com/auth/gmail.modify` | Read/write emails | Restricted |

#### Drive API Scopes

| Scope | Description | Sensitivity |
|-------|-------------|-------------|
| `https://www.googleapis.com/auth/drive.file` | App-created files only | Standard |
| `https://www.googleapis.com/auth/drive.readonly` | Read all files | Sensitive |
| `https://www.googleapis.com/auth/drive` | Full access | Restricted |

#### Meet API Scopes

| Scope | Description | Sensitivity |
|-------|-------------|-------------|
| `https://www.googleapis.com/auth/meetings.space.created` | Manage created meetings | Sensitive |
| `https://www.googleapis.com/auth/meetings.space.readonly` | View meeting spaces | Sensitive |

### 1.3 Domain Verification Steps

1. **Add Domain to GCP Project**
   - Go to **OAuth consent screen > Authorized domains**
   - Add `contractoros.com`

2. **Verify Domain in Google Search Console**
   - Navigate to [Google Search Console](https://search.google.com/search-console)
   - Add property for `contractoros.com`
   - Verify via DNS TXT record or HTML file upload

3. **DNS TXT Record Method**
   ```
   TXT record: google-site-verification=<verification-code>
   ```

4. **Link Search Console to GCP**
   - Verification must be done by a project owner/editor
   - Verification valid for 7 days before publishing

### 1.4 OAuth Credentials Setup

#### Create OAuth 2.0 Client ID

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application**
4. Configure:

| Field | Value |
|-------|-------|
| Name | ContractorOS Web Client |
| Authorized JavaScript origins | `https://contractoros.com`, `http://localhost:3000` |
| Authorized redirect URIs | `https://contractoros.com/api/auth/callback/google`, `http://localhost:3000/api/auth/callback/google` |

5. Download `credentials.json` and store securely

#### Environment Variables

```bash
# Add to GCP Secret Manager
GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_REDIRECT_URI=https://contractoros.com/api/auth/callback/google
```

---

## 2. Directory Sync Architecture

### 2.1 Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Google Workspace  │     │    ContractorOS     │     │      Firestore      │
│   Admin Directory   │────▶│    Sync Service     │────▶│   users collection  │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │
         │  Push Notifications       │  Polling Fallback
         │  (Webhooks)               │  (Every 15 min)
         ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│   Cloud Function    │     │   Cloud Scheduler   │
│   Webhook Handler   │     │   Sync Trigger      │
└─────────────────────┘     └─────────────────────┘
```

### 2.2 User Import from Admin Directory API

#### API Endpoint

```
GET https://admin.googleapis.com/admin/directory/v1/users
```

#### Sample Request

```typescript
// lib/google/directory-sync.ts
import { google } from 'googleapis';

interface GoogleUser {
  id: string;
  primaryEmail: string;
  name: {
    givenName: string;
    familyName: string;
    fullName: string;
  };
  orgUnitPath: string;
  isAdmin: boolean;
  customSchemas?: {
    ContractorOS?: {
      role?: string;
      department?: string;
    };
  };
}

export async function listGoogleUsers(
  auth: any,
  domain: string,
  pageToken?: string
): Promise<{ users: GoogleUser[]; nextPageToken?: string }> {
  const admin = google.admin({ version: 'directory_v1', auth });

  const response = await admin.users.list({
    domain,
    maxResults: 100,
    pageToken,
    projection: 'full',
    orderBy: 'email',
  });

  return {
    users: response.data.users || [],
    nextPageToken: response.data.nextPageToken,
  };
}
```

### 2.3 Role Mapping

#### Google to ContractorOS Role Mapping

| Google Workspace Role | Org Unit Pattern | ContractorOS Role |
|----------------------|------------------|-------------------|
| Super Admin | - | OWNER |
| Admin | - | PM |
| Manager OU | `/Managers/*` | PM |
| Field Staff OU | `/Field/*` | FOREMAN |
| Office Staff OU | `/Office/*` | OFFICE_STAFF |
| Default | - | FIELD_WORKER |

#### Role Mapping Configuration

```typescript
// lib/google/role-mapper.ts
import { UserRole } from '@/types';

interface RoleMappingConfig {
  adminMapping: UserRole;
  orgUnitMappings: {
    pattern: RegExp;
    role: UserRole;
  }[];
  defaultRole: UserRole;
}

const DEFAULT_ROLE_CONFIG: RoleMappingConfig = {
  adminMapping: 'PM',
  orgUnitMappings: [
    { pattern: /^\/Executives/i, role: 'OWNER' },
    { pattern: /^\/Managers/i, role: 'PM' },
    { pattern: /^\/Foremen/i, role: 'FOREMAN' },
    { pattern: /^\/Office/i, role: 'OFFICE_STAFF' },
    { pattern: /^\/Field/i, role: 'FIELD_WORKER' },
  ],
  defaultRole: 'FIELD_WORKER',
};

export function mapGoogleUserToRole(
  googleUser: GoogleUser,
  config: RoleMappingConfig = DEFAULT_ROLE_CONFIG
): UserRole {
  // Super admins become Owners
  if (googleUser.isAdmin) {
    return config.adminMapping;
  }

  // Check org unit mappings
  for (const mapping of config.orgUnitMappings) {
    if (mapping.pattern.test(googleUser.orgUnitPath)) {
      return mapping.role;
    }
  }

  // Custom schema override
  if (googleUser.customSchemas?.ContractorOS?.role) {
    return googleUser.customSchemas.ContractorOS.role as UserRole;
  }

  return config.defaultRole;
}
```

### 2.4 Sync Strategy: Webhooks vs Polling

#### Option A: Push Notifications (Webhooks) - Recommended

**Setup Webhook Channel:**

```typescript
// functions/src/google/directory-webhook.ts
import { google } from 'googleapis';

export async function setupUserWatchChannel(
  auth: any,
  domain: string,
  webhookUrl: string
): Promise<{ channelId: string; expiration: number }> {
  const admin = google.admin({ version: 'directory_v1', auth });

  const channelId = `contractoros-${domain}-${Date.now()}`;

  const response = await admin.users.watch({
    domain,
    event: 'add,update,delete',
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
      token: process.env.WEBHOOK_VERIFICATION_TOKEN,
      expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return {
    channelId: response.data.id!,
    expiration: parseInt(response.data.expiration!),
  };
}
```

**Webhook Handler Cloud Function:**

```typescript
// functions/src/google/webhook-handler.ts
import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

export const googleDirectoryWebhook = functions.https.onRequest(
  async (req, res) => {
    // Verify webhook token
    const token = req.headers['x-goog-channel-token'];
    if (token !== process.env.WEBHOOK_VERIFICATION_TOKEN) {
      res.status(401).send('Invalid token');
      return;
    }

    const resourceState = req.headers['x-goog-resource-state'];
    const messageNumber = req.headers['x-goog-message-number'];

    // Handle sync message (initial setup confirmation)
    if (resourceState === 'sync') {
      console.log('Webhook channel established');
      res.status(200).send('OK');
      return;
    }

    // Trigger full sync on user changes
    if (resourceState === 'exists' || resourceState === 'not_exists') {
      await triggerDirectorySync();
    }

    res.status(200).send('OK');
  }
);
```

**Channel Renewal:**

```typescript
// Webhook channels expire (max 7 days for Directory API)
// Schedule renewal before expiration
export const renewWebhookChannels = functions.pubsub
  .schedule('every 5 days')
  .onRun(async () => {
    const db = getFirestore(undefined, 'contractoros');
    const orgs = await db.collection('organizations')
      .where('googleWorkspace.enabled', '==', true)
      .get();

    for (const org of orgs.docs) {
      const config = org.data().googleWorkspace;
      await setupUserWatchChannel(
        await getOrgAuth(org.id),
        config.domain,
        config.webhookUrl
      );
    }
  });
```

#### Option B: Polling Fallback

```typescript
// functions/src/google/directory-poll.ts
import * as functions from 'firebase-functions';

export const pollGoogleDirectory = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    const db = getFirestore(undefined, 'contractoros');
    const orgs = await db.collection('organizations')
      .where('googleWorkspace.enabled', '==', true)
      .where('googleWorkspace.webhookActive', '==', false)
      .get();

    for (const org of orgs.docs) {
      await syncOrganizationUsers(org.id);
    }
  });
```

### 2.5 Handling User Additions/Removals

#### User Provisioning Flow

```typescript
// lib/google/user-provisioner.ts
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

interface SyncResult {
  added: number;
  updated: number;
  deactivated: number;
  errors: string[];
}

export async function syncOrganizationUsers(
  orgId: string
): Promise<SyncResult> {
  const db = getFirestore(undefined, 'contractoros');
  const auth = getAuth();

  const result: SyncResult = {
    added: 0,
    updated: 0,
    deactivated: 0,
    errors: [],
  };

  const org = await db.collection('organizations').doc(orgId).get();
  const config = org.data()?.googleWorkspace;

  if (!config?.enabled) return result;

  // Get current users from Google
  const googleUsers = await fetchAllGoogleUsers(config.domain);
  const googleEmailSet = new Set(googleUsers.map(u => u.primaryEmail));

  // Get current users from ContractorOS
  const existingUsers = await db.collection('users')
    .where('orgId', '==', orgId)
    .where('googleWorkspace.synced', '==', true)
    .get();

  const existingEmailMap = new Map(
    existingUsers.docs.map(d => [d.data().email, d])
  );

  const batch = db.batch();

  // Process Google users
  for (const googleUser of googleUsers) {
    const existing = existingEmailMap.get(googleUser.primaryEmail);

    if (existing) {
      // Update existing user
      const updates = buildUserUpdates(existing.data(), googleUser);
      if (Object.keys(updates).length > 0) {
        batch.update(existing.ref, updates);
        result.updated++;
      }
      existingEmailMap.delete(googleUser.primaryEmail);
    } else {
      // Create new user
      try {
        // Create Firebase Auth user
        const authUser = await auth.createUser({
          email: googleUser.primaryEmail,
          displayName: googleUser.name.fullName,
          disabled: false,
        });

        // Create Firestore user document
        const userRef = db.collection('users').doc(authUser.uid);
        batch.set(userRef, {
          email: googleUser.primaryEmail,
          displayName: googleUser.name.fullName,
          firstName: googleUser.name.givenName,
          lastName: googleUser.name.familyName,
          orgId,
          role: mapGoogleUserToRole(googleUser),
          status: 'active',
          googleWorkspace: {
            synced: true,
            googleId: googleUser.id,
            lastSyncedAt: Timestamp.now(),
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        result.added++;
      } catch (error) {
        result.errors.push(`Failed to create ${googleUser.primaryEmail}: ${error}`);
      }
    }
  }

  // Deactivate users removed from Google
  for (const [email, userDoc] of existingEmailMap) {
    batch.update(userDoc.ref, {
      status: 'inactive',
      'googleWorkspace.removedFromDirectory': true,
      'googleWorkspace.lastSyncedAt': Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    result.deactivated++;
  }

  await batch.commit();

  // Log sync results
  await db.collection('organizations').doc(orgId)
    .collection('syncLogs').add({
      type: 'google_directory',
      timestamp: Timestamp.now(),
      result,
    });

  return result;
}
```

---

## 3. Feature Integration

### 3.1 Google Calendar Sync

#### Integration Points

| ContractorOS Feature | Calendar Sync Behavior |
|---------------------|------------------------|
| Project Schedule | Create calendar with all project milestones |
| Task Due Dates | Create events for assigned tasks |
| Meetings | Create events with Google Meet links |
| Time Off | Sync with user's calendar availability |

#### Calendar Sync Implementation

```typescript
// lib/google/calendar-sync.ts
import { google, calendar_v3 } from 'googleapis';

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  location?: string;
  conferenceData?: boolean; // Add Google Meet
}

export async function createCalendarEvent(
  auth: any,
  calendarId: string,
  event: CalendarEvent
): Promise<calendar_v3.Schema$Event> {
  const calendar = google.calendar({ version: 'v3', auth });

  const eventResource: calendar_v3.Schema$Event = {
    summary: event.summary,
    description: event.description,
    start: {
      dateTime: event.start.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: event.end.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    attendees: event.attendees?.map(email => ({ email })),
    location: event.location,
  };

  // Add Google Meet conferencing
  if (event.conferenceData) {
    eventResource.conferenceData = {
      createRequest: {
        requestId: `contractoros-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: eventResource,
    conferenceDataVersion: event.conferenceData ? 1 : undefined,
  });

  return response.data;
}

export async function syncProjectToCalendar(
  auth: any,
  project: Project,
  userId: string
): Promise<void> {
  // Create or get project calendar
  const calendarId = await getOrCreateProjectCalendar(auth, project);

  // Sync milestones
  for (const phase of project.phases || []) {
    await createCalendarEvent(auth, calendarId, {
      summary: `[${project.name}] ${phase.name}`,
      description: phase.description,
      start: phase.startDate,
      end: phase.endDate,
    });
  }

  // Share calendar with team
  await shareCalendarWithTeam(auth, calendarId, project.team);
}
```

### 3.2 Gmail Integration

#### Use Cases

| Feature | Gmail Integration |
|---------|-------------------|
| Project Messages | Send/receive via Gmail |
| RFI Notifications | Email RFI to stakeholders |
| Daily Logs | Email digest to clients |
| Change Orders | Email for approval workflow |

#### Gmail API Implementation

```typescript
// lib/google/gmail-integration.ts
import { google } from 'googleapis';

export async function sendEmail(
  auth: any,
  to: string[],
  subject: string,
  body: string,
  attachments?: { filename: string; data: Buffer; mimeType: string }[]
): Promise<string> {
  const gmail = google.gmail({ version: 'v1', auth });

  // Build MIME message
  const messageParts = [
    `To: ${to.join(', ')}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="boundary"',
    '',
    '--boundary',
    'Content-Type: text/html; charset=utf-8',
    '',
    body,
  ];

  if (attachments) {
    for (const attachment of attachments) {
      messageParts.push(
        '--boundary',
        `Content-Type: ${attachment.mimeType}`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        '',
        attachment.data.toString('base64')
      );
    }
  }

  messageParts.push('--boundary--');

  const raw = Buffer.from(messageParts.join('\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return response.data.id!;
}

export async function watchInbox(
  auth: any,
  webhookUrl: string
): Promise<{ historyId: string; expiration: string }> {
  const gmail = google.gmail({ version: 'v1', auth });

  const response = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName: 'projects/contractoros-483812/topics/gmail-notifications',
      labelIds: ['INBOX'],
    },
  });

  return {
    historyId: response.data.historyId!,
    expiration: response.data.expiration!,
  };
}
```

### 3.3 Google Drive Integration

#### Folder Structure

```
ContractorOS/
├── {Organization Name}/
│   ├── Projects/
│   │   ├── {Project Name}/
│   │   │   ├── Documents/
│   │   │   ├── Photos/
│   │   │   ├── RFIs/
│   │   │   ├── Change Orders/
│   │   │   └── Contracts/
│   │   └── ...
│   ├── Templates/
│   └── Shared/
```

#### Drive Integration Implementation

```typescript
// lib/google/drive-integration.ts
import { google } from 'googleapis';

export async function createProjectFolder(
  auth: any,
  orgFolderId: string,
  projectName: string
): Promise<{ folderId: string; subfolders: Record<string, string> }> {
  const drive = google.drive({ version: 'v3', auth });

  // Create main project folder
  const projectFolder = await drive.files.create({
    requestBody: {
      name: projectName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [orgFolderId],
    },
  });

  const projectFolderId = projectFolder.data.id!;
  const subfolders: Record<string, string> = {};

  // Create subfolders
  const subfolderNames = [
    'Documents',
    'Photos',
    'RFIs',
    'Change Orders',
    'Contracts',
    'Daily Logs',
  ];

  for (const name of subfolderNames) {
    const subfolder = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [projectFolderId],
      },
    });
    subfolders[name.toLowerCase().replace(' ', '_')] = subfolder.data.id!;
  }

  return { folderId: projectFolderId, subfolders };
}

export async function uploadFile(
  auth: any,
  folderId: string,
  filename: string,
  mimeType: string,
  content: Buffer
): Promise<{ fileId: string; webViewLink: string }> {
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: content,
    },
    fields: 'id,webViewLink',
  });

  return {
    fileId: response.data.id!,
    webViewLink: response.data.webViewLink!,
  };
}

export async function shareWithTeam(
  auth: any,
  fileId: string,
  emails: string[],
  role: 'reader' | 'writer' | 'commenter' = 'reader'
): Promise<void> {
  const drive = google.drive({ version: 'v3', auth });

  for (const email of emails) {
    await drive.permissions.create({
      fileId,
      requestBody: {
        type: 'user',
        role,
        emailAddress: email,
      },
      sendNotificationEmail: false,
    });
  }
}
```

### 3.4 Google Meet Integration

#### Creating Meeting Spaces

```typescript
// lib/google/meet-integration.ts
import { google } from 'googleapis';

export async function createMeetingSpace(
  auth: any,
  config: {
    accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
    entryPointAccess?: 'ALL' | 'CREATOR_APP_ONLY';
  } = {}
): Promise<{ meetingUri: string; meetingCode: string }> {
  const meet = google.meet({ version: 'v2', auth });

  const response = await meet.spaces.create({
    requestBody: {
      config: {
        accessType: config.accessType || 'TRUSTED',
        entryPointAccess: config.entryPointAccess || 'ALL',
      },
    },
  });

  return {
    meetingUri: response.data.meetingUri!,
    meetingCode: response.data.meetingCode!,
  };
}

// Alternative: Create meeting via Calendar (more common approach)
export async function createMeetingWithCalendar(
  auth: any,
  title: string,
  startTime: Date,
  endTime: Date,
  attendees: string[]
): Promise<{ meetLink: string; eventId: string }> {
  const calendar = google.calendar({ version: 'v3', auth });

  const event = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: title,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      attendees: attendees.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `contractoros-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  return {
    meetLink: event.data.hangoutLink!,
    eventId: event.data.id!,
  };
}
```

---

## 4. Implementation Plan

### Phase 1: OAuth Connection + User Import (Weeks 1-3)

#### Week 1: OAuth Infrastructure

| Task | Priority | Effort |
|------|----------|--------|
| Set up GCP OAuth credentials | High | 2h |
| Configure OAuth consent screen | High | 2h |
| Implement OAuth flow in Next.js | High | 8h |
| Create Google provider in NextAuth | High | 4h |
| Store tokens securely (Firestore encrypted) | High | 4h |

#### Week 2: Directory Sync Backend

| Task | Priority | Effort |
|------|----------|--------|
| Create Cloud Function for user sync | High | 8h |
| Implement role mapping configuration | High | 4h |
| Build webhook handler for push notifications | Medium | 8h |
| Create polling fallback mechanism | Medium | 4h |
| Add sync logging and monitoring | Medium | 4h |

#### Week 3: Admin UI + Testing

| Task | Priority | Effort |
|------|----------|--------|
| Create Workspace connection settings page | High | 8h |
| Build user sync status dashboard | High | 4h |
| Implement role mapping UI | Medium | 4h |
| E2E testing with test Workspace domain | High | 8h |
| Documentation and error handling | Medium | 4h |

### Phase 2: Calendar Sync (Weeks 4-5)

#### Week 4: Calendar Integration

| Task | Priority | Effort |
|------|----------|--------|
| Implement Calendar API connection | High | 4h |
| Create project calendar sync | High | 8h |
| Build task-to-event sync | High | 8h |
| Add bidirectional sync (changes in Google) | Medium | 8h |

#### Week 5: Calendar UI + Testing

| Task | Priority | Effort |
|------|----------|--------|
| Create calendar sync settings UI | High | 4h |
| Build calendar preview component | Medium | 4h |
| Implement conflict resolution | High | 8h |
| Testing and bug fixes | High | 8h |

### Phase 3: Gmail/Drive Integration (Weeks 6-8)

#### Week 6: Gmail Integration

| Task | Priority | Effort |
|------|----------|--------|
| Implement Gmail API connection | High | 4h |
| Create email sending from ContractorOS | High | 8h |
| Build inbox sync for project threads | Medium | 8h |
| Add email templates | Medium | 4h |

#### Week 7: Drive Integration

| Task | Priority | Effort |
|------|----------|--------|
| Implement Drive API connection | High | 4h |
| Create project folder structure | High | 8h |
| Build file upload to Drive | High | 8h |
| Implement file sharing with permissions | Medium | 4h |

#### Week 8: Testing + Polish

| Task | Priority | Effort |
|------|----------|--------|
| Integration testing (all features) | High | 16h |
| Performance optimization | Medium | 8h |
| Documentation | Medium | 4h |
| Beta release preparation | High | 4h |

### Milestone Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | 3 weeks | OAuth login, user sync, role mapping |
| Phase 2 | 2 weeks | Calendar sync, meeting creation |
| Phase 3 | 3 weeks | Gmail messaging, Drive storage |
| **Total** | **8 weeks** | Full Google Workspace integration |

---

## 5. Security Considerations

### 5.1 Minimum Required Scopes

**Principle of Least Privilege:** Request only the scopes absolutely needed for each feature.

#### MVP Scopes (Phase 1)

```typescript
const MVP_SCOPES = [
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
  'openid',
  'email',
  'profile',
];
```

#### Full Integration Scopes

```typescript
const FULL_SCOPES = {
  // User Sync
  directory: [
    'https://www.googleapis.com/auth/admin.directory.user.readonly',
    'https://www.googleapis.com/auth/admin.directory.group.readonly',
  ],

  // Calendar
  calendar: [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
  ],

  // Gmail (request only when email feature enabled)
  gmail: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
  ],

  // Drive (use drive.file when possible - app-created files only)
  drive: [
    'https://www.googleapis.com/auth/drive.file',
  ],

  // Meet
  meet: [
    'https://www.googleapis.com/auth/meetings.space.created',
  ],
};
```

### 5.2 Token Management

#### Secure Token Storage

```typescript
// lib/google/token-store.ts
import { getFirestore } from 'firebase-admin/firestore';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
}

export async function storeUserTokens(
  userId: string,
  tokens: TokenData
): Promise<void> {
  const db = getFirestore(undefined, 'contractoros');

  // Store encrypted in Firestore
  // Refresh token is sensitive - consider Secret Manager for production
  await db.collection('users').doc(userId).update({
    'googleWorkspace.tokens': {
      access_token: tokens.access_token, // Short-lived, OK in Firestore
      refresh_token_ref: `projects/contractoros-483812/secrets/google-refresh-${userId}`,
      expiry_date: tokens.expiry_date,
      scope: tokens.scope,
    },
    'googleWorkspace.lastTokenRefresh': new Date(),
  });

  // Store refresh token in Secret Manager
  const client = new SecretManagerServiceClient();
  await client.addSecretVersion({
    parent: `projects/contractoros-483812/secrets/google-refresh-${userId}`,
    payload: {
      data: Buffer.from(tokens.refresh_token),
    },
  });
}

export async function refreshAccessToken(userId: string): Promise<string> {
  const { OAuth2Client } = require('google-auth-library');
  const db = getFirestore(undefined, 'contractoros');

  const userDoc = await db.collection('users').doc(userId).get();
  const tokenData = userDoc.data()?.googleWorkspace?.tokens;

  // Get refresh token from Secret Manager
  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name: `${tokenData.refresh_token_ref}/versions/latest`,
  });
  const refreshToken = version.payload?.data?.toString();

  // Refresh the token
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  // Update stored tokens
  await storeUserTokens(userId, credentials as TokenData);

  return credentials.access_token!;
}
```

### 5.3 Admin Consent Requirements

#### Domain-Wide Delegation (Enterprise Only)

For organizations requiring admin-managed access without per-user consent:

1. **Create Service Account**
   - Go to **APIs & Services > Credentials > Create Credentials > Service Account**
   - Grant appropriate roles (no GCP roles needed for Workspace-only access)

2. **Enable Domain-Wide Delegation**
   - Edit service account > Enable "Domain-wide delegation"
   - Note the Client ID (OAuth 2.0 Client ID)

3. **Configure in Admin Console**
   - Go to [Admin Console](https://admin.google.com) > Security > API Controls
   - Click "Manage Domain Wide Delegation"
   - Add new client with service account Client ID
   - Add required scopes

4. **Security Best Practices**
   - Use separate service accounts per integration
   - Regularly audit delegation permissions
   - Enable Multi-party approval for delegation changes
   - Monitor via Admin SDK Reports API

```typescript
// lib/google/service-account-auth.ts
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export async function getServiceAccountAuth(
  adminEmail: string,
  scopes: string[]
): Promise<JWT> {
  const auth = new google.auth.JWT({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
    scopes,
    subject: adminEmail, // Impersonate this admin user
  });

  await auth.authorize();
  return auth;
}
```

### 5.4 Security Audit Checklist

| Check | Frequency | Owner |
|-------|-----------|-------|
| Review OAuth scopes in use | Monthly | Security |
| Audit service account permissions | Quarterly | Admin |
| Check for unused delegations | Quarterly | Admin |
| Review sync logs for anomalies | Weekly | DevOps |
| Test token refresh flow | Per release | QA |
| Verify webhook authenticity | Per release | Backend |

---

## 6. Technical Specifications

### 6.1 Database Schema Additions

```typescript
// types/index.ts additions

interface GoogleWorkspaceConfig {
  enabled: boolean;
  domain: string;
  adminEmail: string; // For service account impersonation
  webhookChannelId?: string;
  webhookExpiration?: Timestamp;
  lastSyncAt?: Timestamp;
  syncStatus: 'active' | 'paused' | 'error';
  features: {
    userSync: boolean;
    calendarSync: boolean;
    gmailIntegration: boolean;
    driveIntegration: boolean;
    meetIntegration: boolean;
  };
  roleMapping: {
    adminMapping: UserRole;
    orgUnitMappings: { pattern: string; role: UserRole }[];
    defaultRole: UserRole;
  };
}

interface UserGoogleWorkspaceData {
  synced: boolean;
  googleId: string;
  lastSyncedAt: Timestamp;
  tokens?: {
    access_token: string;
    refresh_token_ref: string;
    expiry_date: number;
    scope: string;
  };
  calendar?: {
    enabled: boolean;
    syncedCalendarId?: string;
  };
  drive?: {
    enabled: boolean;
    rootFolderId?: string;
  };
}

// Add to Organization type
interface Organization {
  // ... existing fields
  googleWorkspace?: GoogleWorkspaceConfig;
}

// Add to User type
interface User {
  // ... existing fields
  googleWorkspace?: UserGoogleWorkspaceData;
}
```

### 6.2 Firestore Rules Additions

```javascript
// firestore.rules additions

// Google Workspace sync logs (admin only)
match /organizations/{orgId}/syncLogs/{logId} {
  allow read: if isAdmin() && isSameOrg(orgId);
  allow write: if false; // Only Cloud Functions write
}

// Google tokens (user owns their tokens)
match /users/{userId} {
  allow read: if isOwner(userId) || isAdmin();
  allow update: if isOwner(userId) &&
    !request.resource.data.diff(resource.data).affectedKeys()
      .hasAny(['role', 'orgId', 'status']); // Users can't change their role
}
```

### 6.3 API Endpoints

```typescript
// app/api/google/route.ts

// POST /api/google/connect - Initiate OAuth flow
// GET /api/google/callback - Handle OAuth callback
// POST /api/google/sync - Trigger manual sync
// GET /api/google/status - Get sync status
// DELETE /api/google/disconnect - Remove integration

// app/api/google/calendar/route.ts
// POST /api/google/calendar/sync - Sync calendar
// GET /api/google/calendar/events - Get events

// app/api/google/drive/route.ts
// POST /api/google/drive/upload - Upload file
// GET /api/google/drive/files - List files
```

### 6.4 Environment Variables

```bash
# .env.local additions
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account.json
GOOGLE_WEBHOOK_VERIFICATION_TOKEN=<random-secure-token>

# GCP Secret Manager refs (production)
# GOOGLE_CLIENT_SECRET -> projects/contractoros-483812/secrets/google-client-secret
# GOOGLE_SERVICE_ACCOUNT_KEY -> projects/contractoros-483812/secrets/google-sa-key
```

---

## 7. References

### Official Google Documentation

- [Admin SDK Directory API Authorization Guide](https://developers.google.com/workspace/admin/directory/v1/guides/authorizing)
- [Admin SDK API Reference](https://developers.google.com/workspace/admin/reference-overview)
- [Configure OAuth Consent Screen](https://developers.google.com/workspace/guides/configure-oauth-consent)
- [OAuth Consent Screen Configuration (Marketplace)](https://developers.google.com/workspace/marketplace/configure-oauth-consent-screen)
- [Brand Verification Requirements](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification)
- [Sensitive Scope Verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)

### API-Specific Documentation

- [Directory API Push Notifications](https://developers.google.com/workspace/admin/directory/v1/guides/push)
- [Google Calendar API Scopes](https://developers.google.com/workspace/calendar/api/auth)
- [Google Calendar Node.js Quickstart](https://developers.google.com/workspace/calendar/api/quickstart/nodejs)
- [Gmail API Node.js Quickstart](https://developers.google.com/gmail/api/quickstart/nodejs)
- [Google Drive API Scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [Google Drive API Overview](https://developers.google.com/workspace/drive/api/guides/about-sdk)
- [Google Meet REST API Overview](https://developers.google.com/workspace/meet/api/guides/overview)
- [Google Meet SDK Overview](https://developers.google.com/workspace/meet/overview)

### Security Best Practices

- [Domain-wide Delegation Best Practices](https://support.google.com/a/answer/14437356?hl=en)
- [Control API Access with Domain-wide Delegation](https://support.google.com/a/answer/162106?hl=en)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes)

### Tutorials and Guides

- [Implement Admin SDK Directory API - DEV Community](https://dev.to/osinachiuro/implement-admin-sdk-directory-api-for-google-workspace-management-37nd)
- [How to Use Google Workspace API - Bindbee](https://www.bindbee.dev/blog/google-workspace-api)
- [Create OAuth App for Google Workspace - Apideck](https://developers.apideck.com/connectors/google-workspace/docs/application_owner+oauth_credentials)
- [Google Workspace Admin API Integration - Rollout](https://content.rollout.com/integration-guides/google-workspace-admin/sdk/step-by-step-guide-to-building-a-google-workspace-admin-api-integration-in-js)
- [How to Integrate with Google Meet - Recall.ai](https://www.recall.ai/blog/how-to-integrate-with-google-meet)

### npm Packages

- [googleapis](https://github.com/googleapis/google-api-nodejs-client) - Google's official Node.js client
- [@google-cloud/local-auth](https://www.npmjs.com/package/@google-cloud/local-auth) - Local authentication helper
- [google-auth-library](https://www.npmjs.com/package/google-auth-library) - Auth library for Node.js

---

## Appendix A: Verification Checklist

Before going to production:

- [ ] OAuth consent screen approved by Google
- [ ] Domain verification complete in Search Console
- [ ] All sensitive scopes verified (may take 2-4 weeks)
- [ ] Privacy policy updated to mention Google data usage
- [ ] Terms of service updated
- [ ] Service account keys rotated and secured
- [ ] Webhook endpoints secured with verification tokens
- [ ] Token encryption implemented
- [ ] Rate limiting configured for API calls
- [ ] Error handling for quota limits
- [ ] Monitoring and alerting set up
- [ ] Sync failure notifications configured
- [ ] User documentation written
- [ ] Admin training completed

---

## Appendix B: API Rate Limits

| API | Default Limit | Notes |
|-----|---------------|-------|
| Admin SDK Directory | 2400 requests/min | Per-project |
| Calendar API | 1,000,000 requests/day | Per-project |
| Gmail API | 250 quota units/user/sec | Varies by method |
| Drive API | 20,000 requests/100 sec | Per-project |
| Meet API | 100 requests/min | Per-user |

Implement exponential backoff for 429 errors.
