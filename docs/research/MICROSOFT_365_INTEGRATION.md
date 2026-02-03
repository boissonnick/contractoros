# Microsoft 365 / Azure AD Integration Research

> **Feature Request:** F3, #95 - Microsoft 365/Azure AD Integration
> **Research Date:** February 2026
> **Status:** Research Complete - Ready for Implementation Planning

---

## Executive Summary

This document outlines the integration strategy for Microsoft 365 and Azure AD (now Microsoft Entra ID) with ContractorOS. The integration enables enterprise customers to:

1. **Single Sign-On (SSO)** - Users authenticate with existing Microsoft accounts
2. **Directory Sync** - Auto-provision users from Azure AD
3. **Calendar Integration** - Sync project schedules with Outlook
4. **Teams Integration** - Notifications and collaboration features
5. **Document Storage** - OneDrive/SharePoint integration for project files

---

## Table of Contents

1. [Azure AD Setup](#1-azure-ad-setup)
2. [Directory Sync](#2-directory-sync)
3. [Feature Integration](#3-feature-integration)
4. [Implementation Plan](#4-implementation-plan)
5. [Enterprise Considerations](#5-enterprise-considerations)
6. [Security & Compliance](#6-security--compliance)
7. [Code Examples](#7-code-examples)

---

## 1. Azure AD Setup

### 1.1 App Registration in Azure Portal

#### Step 1: Create App Registration

1. Navigate to [Azure Portal](https://portal.azure.com/)
2. Search for "Microsoft Entra ID" (formerly Azure AD)
3. Go to **Manage** > **App registrations** > **New registration**

```
App Name: ContractorOS
Supported account types:
  - Single tenant: "Accounts in this organizational directory only"
  - Multi-tenant: "Accounts in any organizational directory"
Redirect URI: https://yourdomain.com/api/auth/callback/azure-ad
```

#### Step 2: Configure Redirect URIs

```plaintext
Development:
  - http://localhost:3000/api/auth/callback/azure-ad
  - http://localhost:3000/api/auth/callback/microsoft

Production:
  - https://app.contractoros.com/api/auth/callback/azure-ad
  - https://app.contractoros.com/api/auth/callback/microsoft
```

**Platform Configuration:**
- Type: Web
- Enable: Access tokens, ID tokens

#### Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Set expiration (recommended: 24 months)
4. Copy and securely store the secret value

### 1.2 Required API Permissions

#### Delegated Permissions (User Context)

| Permission | Purpose | Admin Consent |
|------------|---------|---------------|
| `User.Read` | Read signed-in user profile | No |
| `User.ReadBasic.All` | Read basic profiles of all users | No |
| `Calendars.ReadWrite` | Read/write user calendars | No |
| `Calendars.ReadWrite.Shared` | Access shared calendars | No |
| `offline_access` | Maintain access to data | No |
| `openid` | Sign users in | No |
| `profile` | View users' basic profile | No |
| `email` | View users' email address | No |

#### Application Permissions (Daemon/Background)

| Permission | Purpose | Admin Consent |
|------------|---------|---------------|
| `User.Read.All` | Read all user profiles | Yes |
| `Directory.Read.All` | Read directory data | Yes |
| `Group.Read.All` | Read all groups | Yes |
| `Calendars.Read` | Read all calendars | Yes |

> **Note:** Application permissions always require admin consent. Use delegated permissions when possible.

### 1.3 SSO Protocol Selection: OIDC vs SAML

#### Recommendation: **OpenID Connect (OIDC)**

| Factor | OIDC | SAML |
|--------|------|------|
| Protocol | OAuth 2.0 based | XML based |
| Token Format | JWT | XML Assertion |
| Implementation Complexity | Lower | Higher |
| Mobile Support | Excellent | Limited |
| API Access | Built-in (access tokens) | Requires separate OAuth |
| Firebase Compatibility | Native support | Requires custom handling |

**Why OIDC for ContractorOS:**
- Native Firebase Authentication support for Microsoft provider
- JWT tokens work seamlessly with existing auth flow
- Simpler implementation with NextAuth.js
- Better support for SPA/mobile architectures

### 1.4 Enterprise Application Configuration

For enterprise customers requiring SAML:

1. **Azure Portal** > **Enterprise applications** > **New application**
2. Select **Create your own application**
3. Choose **Integrate any other application (Non-gallery)**
4. Configure SAML settings:

```xml
<!-- SAML Configuration -->
Identifier (Entity ID): https://app.contractoros.com
Reply URL (ACS): https://app.contractoros.com/api/auth/saml/callback
Sign-on URL: https://app.contractoros.com/login
Logout URL: https://app.contractoros.com/api/auth/logout
```

---

## 2. Directory Sync

### 2.1 Microsoft Graph API for User Data

#### User List Endpoint

```http
GET https://graph.microsoft.com/v1.0/users
Authorization: Bearer {access_token}

# With selected fields
GET https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,jobTitle,department,userPrincipalName
```

#### User Profile Response

```json
{
  "id": "87d349ed-44d7-43e1-9a83-5f2406dee5bd",
  "displayName": "John Smith",
  "givenName": "John",
  "surname": "Smith",
  "mail": "john.smith@company.com",
  "userPrincipalName": "john.smith@company.com",
  "jobTitle": "Project Manager",
  "department": "Construction",
  "officeLocation": "Seattle Office",
  "mobilePhone": "+1 555-123-4567"
}
```

### 2.2 Group-Based Role Mapping

#### Fetch User Groups

```http
GET https://graph.microsoft.com/v1.0/me/memberOf
Authorization: Bearer {access_token}
```

#### Recommended Group-to-Role Mapping

| Azure AD Group | ContractorOS Role |
|----------------|-------------------|
| `ContractorOS-Owners` | OWNER |
| `ContractorOS-PMs` | PM |
| `ContractorOS-Field` | FIELD |
| `ContractorOS-Office` | OFFICE |
| `ContractorOS-Viewers` | VIEWER |

#### Implementation Strategy

```typescript
// lib/microsoft/role-mapper.ts
interface RoleMappingConfig {
  groupId: string;
  groupName: string;
  contractorosRole: UserRole;
}

const DEFAULT_ROLE_MAPPINGS: RoleMappingConfig[] = [
  { groupId: '', groupName: 'ContractorOS-Owners', contractorosRole: 'OWNER' },
  { groupId: '', groupName: 'ContractorOS-PMs', contractorosRole: 'PM' },
  { groupId: '', groupName: 'ContractorOS-Field', contractorosRole: 'FIELD' },
  { groupId: '', groupName: 'ContractorOS-Office', contractorosRole: 'OFFICE' },
  { groupId: '', groupName: 'ContractorOS-Viewers', contractorosRole: 'VIEWER' },
];

export function mapAzureGroupsToRole(
  userGroups: string[],
  mappings: RoleMappingConfig[]
): UserRole {
  // Priority order: OWNER > PM > FIELD > OFFICE > VIEWER
  const roleHierarchy: UserRole[] = ['OWNER', 'PM', 'FIELD', 'OFFICE', 'VIEWER'];

  for (const role of roleHierarchy) {
    const mapping = mappings.find(m => m.contractorosRole === role);
    if (mapping && userGroups.includes(mapping.groupId)) {
      return role;
    }
  }

  return 'VIEWER'; // Default role
}
```

### 2.3 Sync Strategies

#### Strategy 1: Delta Queries (Recommended)

Delta queries enable incremental sync by tracking changes since the last request.

```http
# Initial sync - get all users
GET https://graph.microsoft.com/v1.0/users/delta

# Subsequent syncs - get only changes
GET https://graph.microsoft.com/v1.0/users/delta?$deltatoken={deltaToken}
```

**Benefits:**
- Efficient - only fetches changed data
- Reduces API calls and bandwidth
- Delta tokens valid for 7 days

**Implementation Pattern:**

```typescript
// lib/microsoft/directory-sync.ts
interface DeltaSyncState {
  deltaLink: string | null;
  lastSyncAt: Timestamp;
}

export async function syncUsersFromAzureAD(
  accessToken: string,
  orgId: string,
  state: DeltaSyncState
): Promise<DeltaSyncState> {
  const client = getGraphClient(accessToken);

  let url = state.deltaLink || '/users/delta?$select=id,displayName,mail,jobTitle,department';
  let hasMore = true;

  while (hasMore) {
    const response = await client.api(url).get();

    // Process users
    for (const user of response.value) {
      if (user['@removed']) {
        await handleUserRemoved(orgId, user.id);
      } else {
        await upsertUserFromAzure(orgId, user);
      }
    }

    // Check for more pages
    if (response['@odata.nextLink']) {
      url = response['@odata.nextLink'];
    } else {
      hasMore = false;
      return {
        deltaLink: response['@odata.deltaLink'],
        lastSyncAt: Timestamp.now(),
      };
    }
  }
}
```

#### Strategy 2: Change Notifications (Webhooks)

Real-time notifications when directory changes occur.

```http
POST https://graph.microsoft.com/v1.0/subscriptions
Content-Type: application/json

{
  "changeType": "created,updated,deleted",
  "notificationUrl": "https://app.contractoros.com/api/webhooks/microsoft-graph",
  "resource": "/users",
  "expirationDateTime": "2026-02-10T18:23:45.9356913Z",
  "clientState": "secretClientValue"
}
```

**Webhook Payload:**

```json
{
  "value": [
    {
      "subscriptionId": "7f105c7d-2dc5-4530-97cd-4e7ae6534c07",
      "changeType": "updated",
      "resource": "users/87d349ed-44d7-43e1-9a83-5f2406dee5bd",
      "resourceData": {
        "id": "87d349ed-44d7-43e1-9a83-5f2406dee5bd",
        "@odata.type": "#Microsoft.Graph.User"
      }
    }
  ]
}
```

#### Strategy 3: Hybrid Approach (Recommended)

Combine webhooks with delta queries for robust sync:

1. **Webhooks** - Real-time notifications trigger immediate sync
2. **Delta Queries** - Scheduled backup sync (every 6-12 hours)
3. **Full Sync** - Weekly complete reconciliation

```typescript
// Recommended sync architecture
const SYNC_CONFIG = {
  webhookEnabled: true,
  deltaQueryInterval: 6 * 60 * 60 * 1000, // 6 hours
  fullSyncInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
  subscriptionRenewalBuffer: 24 * 60 * 60 * 1000, // 24 hours before expiry
};
```

### 2.4 User Lifecycle Events

#### User Created

```typescript
async function handleUserCreated(orgId: string, azureUser: AzureUser) {
  const existingUser = await findUserByEmail(orgId, azureUser.mail);

  if (!existingUser) {
    // Create new user with pending status
    await createUser({
      orgId,
      email: azureUser.mail,
      displayName: azureUser.displayName,
      role: mapAzureGroupsToRole(azureUser.memberOf),
      source: 'azure_ad',
      azureObjectId: azureUser.id,
      status: 'pending_invite', // Or 'active' for JIT provisioning
    });

    // Send welcome email
    await sendWelcomeEmail(azureUser.mail, orgId);
  }
}
```

#### User Updated

```typescript
async function handleUserUpdated(orgId: string, azureUser: AzureUser) {
  const user = await findUserByAzureId(orgId, azureUser.id);

  if (user) {
    // Update synced fields only
    await updateUser(user.id, {
      displayName: azureUser.displayName,
      jobTitle: azureUser.jobTitle,
      department: azureUser.department,
      phone: azureUser.mobilePhone,
      updatedAt: Timestamp.now(),
    });

    // Check for role changes via group membership
    const newRole = mapAzureGroupsToRole(azureUser.memberOf);
    if (newRole !== user.role) {
      await updateUserRole(user.id, newRole);
      await logAuditEvent('role_changed_via_azure_sync', user.id, { oldRole: user.role, newRole });
    }
  }
}
```

#### User Deleted/Disabled

```typescript
async function handleUserRemoved(orgId: string, azureUserId: string) {
  const user = await findUserByAzureId(orgId, azureUserId);

  if (user) {
    // Soft delete - mark as disabled
    await updateUser(user.id, {
      status: 'disabled',
      disabledAt: Timestamp.now(),
      disabledReason: 'azure_ad_removal',
    });

    // Revoke active sessions
    await revokeUserSessions(user.id);

    // Log audit event
    await logAuditEvent('user_disabled_azure_sync', user.id);
  }
}
```

---

## 3. Feature Integration

### 3.1 Outlook Calendar Sync

#### Required Permissions

```plaintext
Delegated:
  - Calendars.ReadWrite
  - Calendars.ReadWrite.Shared (for shared project calendars)
```

#### Sync Project Schedules to Outlook

```typescript
// lib/microsoft/calendar-sync.ts
import { Client } from '@microsoft/microsoft-graph-client';

interface CalendarEvent {
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  body?: { contentType: string; content: string };
  categories?: string[];
}

export async function syncProjectToOutlook(
  accessToken: string,
  project: Project,
  phases: Phase[]
): Promise<void> {
  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  // Create or find ContractorOS calendar
  const calendar = await getOrCreateCalendar(client, 'ContractorOS Projects');

  for (const phase of phases) {
    const event: CalendarEvent = {
      subject: `[${project.name}] ${phase.name}`,
      start: {
        dateTime: phase.startDate.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: phase.endDate.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      location: project.address ? { displayName: project.address } : undefined,
      body: {
        contentType: 'HTML',
        content: `
          <p><strong>Project:</strong> ${project.name}</p>
          <p><strong>Phase:</strong> ${phase.name}</p>
          <p><strong>Status:</strong> ${phase.status}</p>
          <p><a href="https://app.contractoros.com/dashboard/projects/${project.id}">View in ContractorOS</a></p>
        `,
      },
      categories: ['ContractorOS'],
    };

    // Check if event exists (by extended property or subject match)
    const existingEvent = await findExistingEvent(client, calendar.id, phase.id);

    if (existingEvent) {
      await client.api(`/me/calendars/${calendar.id}/events/${existingEvent.id}`)
        .update(event);
    } else {
      await client.api(`/me/calendars/${calendar.id}/events`)
        .post({
          ...event,
          singleValueExtendedProperties: [
            {
              id: 'String {66f5a359-4659-4830-9070-00047ec6ac6e} Name ContractorosPhaseId',
              value: phase.id,
            },
          ],
        });
    }
  }
}

async function getOrCreateCalendar(client: Client, calendarName: string) {
  // Try to find existing calendar
  const calendars = await client.api('/me/calendars')
    .filter(`name eq '${calendarName}'`)
    .get();

  if (calendars.value.length > 0) {
    return calendars.value[0];
  }

  // Create new calendar
  return await client.api('/me/calendars').post({
    name: calendarName,
    color: 'lightBlue',
  });
}
```

#### Bidirectional Sync Considerations

```typescript
// Subscribe to calendar changes for bidirectional sync
async function subscribeToCalendarChanges(accessToken: string) {
  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  const subscription = await client.api('/subscriptions').post({
    changeType: 'created,updated,deleted',
    notificationUrl: 'https://app.contractoros.com/api/webhooks/outlook-calendar',
    resource: '/me/calendars/{calendar-id}/events',
    expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    clientState: 'contractoros-calendar-sync',
  });

  return subscription;
}
```

### 3.2 Microsoft Teams Integration

> **Important:** Microsoft 365 Connectors (Incoming Webhooks) are deprecated as of December 2024. Use Power Automate Workflows or Microsoft Graph API for Teams integration.

#### Option 1: Power Automate Workflows (Recommended)

Create workflow templates for customers to install:

1. **Project Update Notifications**
2. **Daily Log Summaries**
3. **Task Assignment Alerts**
4. **Safety Incident Notifications**

#### Option 2: Teams Bot (Advanced)

```typescript
// For rich interactive experiences, create a Teams Bot
// This requires Microsoft Bot Framework registration

// Notification types
interface TeamsNotification {
  type: 'project_update' | 'task_assigned' | 'daily_log' | 'safety_alert';
  title: string;
  message: string;
  actionUrl: string;
  priority: 'normal' | 'high' | 'urgent';
}

// Adaptive Card template for project updates
const projectUpdateCard = {
  type: 'AdaptiveCard',
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  version: '1.4',
  body: [
    {
      type: 'TextBlock',
      size: 'Medium',
      weight: 'Bolder',
      text: '${title}',
    },
    {
      type: 'FactSet',
      facts: [
        { title: 'Project', value: '${projectName}' },
        { title: 'Status', value: '${status}' },
        { title: 'Updated By', value: '${updatedBy}' },
      ],
    },
  ],
  actions: [
    {
      type: 'Action.OpenUrl',
      title: 'View in ContractorOS',
      url: '${actionUrl}',
    },
  ],
};
```

#### Option 3: Microsoft Graph Chat Messages

```typescript
// Send messages to Teams channels via Graph API
async function sendTeamsMessage(
  accessToken: string,
  teamId: string,
  channelId: string,
  message: string
) {
  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  await client.api(`/teams/${teamId}/channels/${channelId}/messages`).post({
    body: {
      contentType: 'html',
      content: message,
    },
  });
}
```

### 3.3 OneDrive/SharePoint Document Storage

#### Integration Strategy

```typescript
// lib/microsoft/document-storage.ts
interface DocumentSyncConfig {
  strategy: 'mirror' | 'link' | 'hybrid';
  sharePointSiteId?: string;
  documentLibraryId?: string;
}

// Option 1: Mirror - Copy files to OneDrive/SharePoint
async function mirrorDocumentToOneDrive(
  accessToken: string,
  document: ProjectDocument,
  targetFolder: string
) {
  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  // Get file content from Firebase Storage
  const fileContent = await downloadFromFirebase(document.storageUrl);

  // Upload to OneDrive
  await client.api(`/me/drive/root:/${targetFolder}/${document.name}:/content`)
    .put(fileContent);
}

// Option 2: Link - Store OneDrive links in ContractorOS
interface LinkedDocument {
  id: string;
  name: string;
  oneDriveId: string;
  webUrl: string;
  downloadUrl: string;
  mimeType: string;
  size: number;
}

async function linkOneDriveDocument(
  accessToken: string,
  driveItemId: string,
  projectId: string
): Promise<LinkedDocument> {
  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  const item = await client.api(`/me/drive/items/${driveItemId}`).get();

  return {
    id: item.id,
    name: item.name,
    oneDriveId: item.id,
    webUrl: item.webUrl,
    downloadUrl: item['@microsoft.graph.downloadUrl'],
    mimeType: item.file.mimeType,
    size: item.size,
  };
}
```

#### SharePoint Integration for Enterprise

```typescript
// Access SharePoint document libraries
async function getSharePointDocuments(
  accessToken: string,
  siteId: string,
  libraryId: string
) {
  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  const items = await client
    .api(`/sites/${siteId}/drives/${libraryId}/root/children`)
    .get();

  return items.value;
}
```

### 3.4 SSO with Existing Microsoft Accounts

#### Firebase Authentication with Microsoft Provider

ContractorOS uses Firebase Authentication, which has built-in support for Microsoft OAuth.

```typescript
// lib/firebase/microsoft-auth.ts
import {
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  linkWithPopup
} from 'firebase/auth';
import { auth } from './config';

const microsoftProvider = new OAuthProvider('microsoft.com');

// Configure provider for specific tenant (enterprise)
export function configureMicrosoftProvider(tenantId?: string) {
  microsoftProvider.setCustomParameters({
    // For multi-tenant: use 'common' or 'organizations'
    // For single tenant: use specific tenant ID
    tenant: tenantId || 'organizations',
    // Prompt user to select account
    prompt: 'select_account',
  });

  // Request scopes
  microsoftProvider.addScope('User.Read');
  microsoftProvider.addScope('Calendars.ReadWrite');

  return microsoftProvider;
}

// Sign in with Microsoft
export async function signInWithMicrosoft(tenantId?: string) {
  const provider = configureMicrosoftProvider(tenantId);

  try {
    const result = await signInWithPopup(auth, provider);

    // Get OAuth access token for Microsoft Graph API calls
    const credential = OAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    return {
      user: result.user,
      accessToken,
    };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled');
    }
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with this email. Please sign in with your original method.');
    }
    throw error;
  }
}

// Link existing account with Microsoft
export async function linkAccountWithMicrosoft(tenantId?: string) {
  const provider = configureMicrosoftProvider(tenantId);
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('No user signed in');
  }

  const result = await linkWithPopup(currentUser, provider);
  const credential = OAuthProvider.credentialFromResult(result);

  return {
    user: result.user,
    accessToken: credential?.accessToken,
  };
}
```

#### Token Management for Graph API

```typescript
// Store and refresh Microsoft tokens
interface MicrosoftTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scopes: string[];
}

// Store tokens securely (server-side)
async function storeMicrosoftTokens(
  userId: string,
  tokens: MicrosoftTokens
) {
  // Store in Firestore with encryption
  await db.collection('users').doc(userId).collection('integrations').doc('microsoft').set({
    ...tokens,
    updatedAt: Timestamp.now(),
  });
}

// Refresh token when expired
async function refreshMicrosoftToken(refreshToken: string) {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID!,
      client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  return response.json();
}
```

---

## 4. Implementation Plan

### Phase 1: Azure AD SSO (Weeks 1-2)

**Goal:** Enable Microsoft account sign-in

| Task | Priority | Effort |
|------|----------|--------|
| Register app in Azure Portal | P0 | 2h |
| Configure Firebase Microsoft provider | P0 | 2h |
| Create sign-in button/flow | P0 | 4h |
| Handle account linking | P1 | 4h |
| Add tenant configuration for enterprise | P1 | 4h |
| Test with multiple account types | P0 | 4h |
| Documentation | P1 | 2h |

**Environment Variables:**

```bash
# .env.local
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=common  # or specific tenant ID
```

**Acceptance Criteria:**
- [ ] Users can sign in with personal Microsoft accounts
- [ ] Users can sign in with work/school accounts
- [ ] Existing users can link Microsoft accounts
- [ ] Enterprise tenants can restrict to their domain

### Phase 2: User Directory Import (Weeks 3-4)

**Goal:** Auto-provision users from Azure AD

| Task | Priority | Effort |
|------|----------|--------|
| Build Microsoft Graph client wrapper | P0 | 4h |
| Create directory sync service | P0 | 8h |
| Implement delta query sync | P0 | 8h |
| Build group-to-role mapping UI | P1 | 8h |
| Create webhook handler for real-time sync | P1 | 8h |
| Add sync status dashboard | P2 | 4h |
| Handle user lifecycle events | P0 | 8h |

**Database Schema Additions:**

```typescript
// types/index.ts additions
interface AzureADConfig {
  tenantId: string;
  clientId: string;
  syncEnabled: boolean;
  lastSyncAt: Timestamp;
  deltaLink?: string;
  roleMappings: {
    groupId: string;
    groupName: string;
    role: UserRole;
  }[];
}

interface User {
  // ... existing fields
  azureObjectId?: string;
  source: 'manual' | 'azure_ad' | 'google';
  syncedAt?: Timestamp;
}
```

**Acceptance Criteria:**
- [ ] Initial bulk import of users works
- [ ] Delta sync catches changes within 15 minutes
- [ ] Group membership maps to correct roles
- [ ] Disabled users in Azure AD are disabled in app
- [ ] Sync errors are logged and visible to admins

### Phase 3: Calendar & Teams Integration (Weeks 5-6)

**Goal:** Connect project schedules with Microsoft 365

| Task | Priority | Effort |
|------|----------|--------|
| Implement Outlook calendar sync | P0 | 12h |
| Create sync settings UI | P1 | 6h |
| Build Teams notification workflow templates | P1 | 8h |
| Add OneDrive document linking | P2 | 8h |
| Create bidirectional calendar sync | P2 | 12h |
| Test with various M365 license types | P0 | 4h |

**Acceptance Criteria:**
- [ ] Project phases appear in user's Outlook calendar
- [ ] Calendar events link back to ContractorOS
- [ ] Teams channels receive project notifications
- [ ] Documents can be linked from OneDrive
- [ ] Sync preferences are per-user configurable

---

## 5. Enterprise Considerations

### 5.1 Multi-tenant vs Single-tenant

#### Single-tenant App

**Best for:** Dedicated enterprise deployments

```plaintext
Supported account types: "Accounts in this organizational directory only"
Tenant ID: {specific-tenant-guid}
```

**Pros:**
- Simpler consent flow
- No data isolation concerns
- Easier security review

**Cons:**
- Requires separate app registration per customer
- More deployment overhead

#### Multi-tenant App

**Best for:** SaaS model (ContractorOS default)

```plaintext
Supported account types: "Accounts in any organizational directory"
Tenant ID: "organizations" or "common"
```

**Pros:**
- Single app registration serves all customers
- Easier onboarding
- Centralized updates

**Cons:**
- Requires admin consent in each tenant
- More complex data isolation
- Stricter security requirements

### 5.2 Admin Consent Flow

#### Consent Link Generator

```typescript
function generateAdminConsentUrl(tenantId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.AZURE_AD_CLIENT_ID!,
    redirect_uri: redirectUri,
    state: crypto.randomUUID(),
    scope: 'https://graph.microsoft.com/.default',
  });

  return `https://login.microsoftonline.com/${tenantId}/adminconsent?${params}`;
}
```

#### Admin Consent UI Flow

```typescript
// pages/settings/integrations/microsoft.tsx
export default function MicrosoftIntegrationPage() {
  const [consentStatus, setConsentStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  const handleAdminConsent = async () => {
    const consentUrl = generateAdminConsentUrl(
      tenantId || 'organizations',
      `${window.location.origin}/api/auth/microsoft/admin-consent-callback`
    );

    window.location.href = consentUrl;
  };

  return (
    <div>
      <h2>Microsoft 365 Integration</h2>

      {consentStatus === 'pending' && (
        <Alert variant="warning">
          <p>Admin consent is required to enable directory sync.</p>
          <Button onClick={handleAdminConsent}>
            Grant Admin Consent
          </Button>
        </Alert>
      )}

      {consentStatus === 'granted' && (
        <Alert variant="success">
          <p>Admin consent granted. Directory sync is available.</p>
        </Alert>
      )}
    </div>
  );
}
```

### 5.3 Conditional Access Compatibility

#### Common Conditional Access Scenarios

| Policy | Impact | Mitigation |
|--------|--------|------------|
| MFA Required | Users prompted for MFA | Supported natively |
| Compliant Device | May block non-corporate devices | Document requirement |
| IP Location | May block remote users | Add ContractorOS IPs to allowed list |
| App Protection | May require managed apps | Provide compliance documentation |

#### Handling Conditional Access Errors

```typescript
// Handle AADSTS53003 - Conditional Access blocked
async function handleConditionalAccessError(error: any) {
  if (error.code === 'auth/conditional-access-blocked' ||
      error.message?.includes('AADSTS53003')) {
    return {
      error: 'conditional_access_blocked',
      message: 'Your organization\'s security policies blocked this sign-in. Please contact your IT administrator.',
      adminAction: 'Review Conditional Access policies for ContractorOS app',
    };
  }
  throw error;
}
```

### 5.4 Data Residency & Compliance

#### Considerations for Enterprise Customers

1. **Data Location:** Microsoft Graph data resides in customer's M365 tenant region
2. **Data Caching:** Minimize caching of Microsoft data; refresh from source
3. **Audit Logging:** Log all Graph API operations for compliance
4. **Data Deletion:** Honor Microsoft data subject requests

```typescript
// Compliance-aware data handling
interface MicrosoftDataPolicy {
  cacheUserProfileDuration: number; // 0 = no caching
  cacheCalendarEventsDuration: number;
  logAllApiCalls: boolean;
  encryptStoredTokens: boolean;
}

const ENTERPRISE_DATA_POLICY: MicrosoftDataPolicy = {
  cacheUserProfileDuration: 3600, // 1 hour
  cacheCalendarEventsDuration: 300, // 5 minutes
  logAllApiCalls: true,
  encryptStoredTokens: true,
};
```

---

## 6. Security & Compliance

### 6.1 Token Security

#### Access Token Handling

```typescript
// NEVER expose tokens to client-side code
// Use server-side API routes for Graph API calls

// api/microsoft/calendar.ts
export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return unauthorized();

  // Retrieve tokens server-side
  const tokens = await getMicrosoftTokens(session.user.id);

  // Make Graph API call
  const events = await fetchCalendarEvents(tokens.accessToken);

  return Response.json(events);
}
```

#### Refresh Token Storage

```typescript
// Store refresh tokens encrypted in Firestore
import { encrypt, decrypt } from '@/lib/crypto';

async function storeRefreshToken(userId: string, refreshToken: string) {
  const encryptedToken = encrypt(refreshToken, process.env.TOKEN_ENCRYPTION_KEY!);

  await db.collection('users').doc(userId)
    .collection('secure')
    .doc('microsoft')
    .set({
      refreshToken: encryptedToken,
      updatedAt: Timestamp.now(),
    });
}
```

### 6.2 Scope Minimization

Request only necessary permissions:

```typescript
// Good - minimal scopes
const REQUIRED_SCOPES = [
  'User.Read',           // Read own profile
  'Calendars.ReadWrite', // Calendar sync
];

// Avoid - overly broad scopes
const AVOID_SCOPES = [
  'Directory.ReadWrite.All',  // Too broad
  'Mail.ReadWrite',           // Not needed
];
```

### 6.3 Audit Logging

```typescript
// Log all Microsoft integration actions
interface MicrosoftAuditEvent {
  action: 'sso_login' | 'directory_sync' | 'calendar_sync' | 'token_refresh';
  userId: string;
  orgId: string;
  success: boolean;
  details?: Record<string, any>;
  timestamp: Timestamp;
}

async function logMicrosoftAudit(event: MicrosoftAuditEvent) {
  await db.collection('auditLogs').add({
    ...event,
    integration: 'microsoft_365',
    timestamp: Timestamp.now(),
  });
}
```

---

## 7. Code Examples

### 7.1 Complete Microsoft Graph Client

```typescript
// lib/microsoft/graph-client.ts
import { Client, ClientOptions } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

export function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

export class MicrosoftGraphService {
  private client: Client;

  constructor(accessToken: string) {
    this.client = createGraphClient(accessToken);
  }

  // User operations
  async getCurrentUser() {
    return this.client.api('/me').select('id,displayName,mail,jobTitle,department').get();
  }

  async getUsers(filter?: string) {
    let request = this.client.api('/users').select('id,displayName,mail,jobTitle,department,accountEnabled');
    if (filter) request = request.filter(filter);
    return request.get();
  }

  async getUserGroups(userId: string) {
    return this.client.api(`/users/${userId}/memberOf`).get();
  }

  // Calendar operations
  async getCalendars() {
    return this.client.api('/me/calendars').get();
  }

  async createEvent(calendarId: string, event: any) {
    return this.client.api(`/me/calendars/${calendarId}/events`).post(event);
  }

  async updateEvent(calendarId: string, eventId: string, event: any) {
    return this.client.api(`/me/calendars/${calendarId}/events/${eventId}`).update(event);
  }

  async deleteEvent(calendarId: string, eventId: string) {
    return this.client.api(`/me/calendars/${calendarId}/events/${eventId}`).delete();
  }

  // Directory sync
  async getUsersDelta(deltaLink?: string) {
    const url = deltaLink || '/users/delta?$select=id,displayName,mail,jobTitle,department,accountEnabled';
    return this.client.api(url).get();
  }

  // Subscriptions
  async createSubscription(resource: string, changeTypes: string[], notificationUrl: string, expirationMinutes: number = 4230) {
    const expiration = new Date(Date.now() + expirationMinutes * 60 * 1000);

    return this.client.api('/subscriptions').post({
      changeType: changeTypes.join(','),
      notificationUrl,
      resource,
      expirationDateTime: expiration.toISOString(),
      clientState: process.env.WEBHOOK_CLIENT_STATE,
    });
  }

  async renewSubscription(subscriptionId: string, expirationMinutes: number = 4230) {
    const expiration = new Date(Date.now() + expirationMinutes * 60 * 1000);

    return this.client.api(`/subscriptions/${subscriptionId}`).update({
      expirationDateTime: expiration.toISOString(),
    });
  }
}
```

### 7.2 Webhook Handler

```typescript
// app/api/webhooks/microsoft-graph/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';

export async function POST(request: NextRequest) {
  // Handle validation request
  const validationToken = request.nextUrl.searchParams.get('validationToken');
  if (validationToken) {
    return new NextResponse(validationToken, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const body = await request.json();

  // Verify client state
  for (const notification of body.value) {
    if (notification.clientState !== process.env.WEBHOOK_CLIENT_STATE) {
      console.error('Invalid client state');
      continue;
    }

    // Process notification
    await processNotification(notification);
  }

  return NextResponse.json({ status: 'ok' });
}

async function processNotification(notification: any) {
  const { resource, changeType, resourceData } = notification;

  // Queue for processing (avoid blocking webhook response)
  await db.collection('webhookQueue').add({
    source: 'microsoft_graph',
    resource,
    changeType,
    resourceData,
    receivedAt: new Date(),
    status: 'pending',
  });

  // Optionally trigger immediate processing
  // await triggerSyncWorker();
}
```

### 7.3 Directory Sync Worker

```typescript
// lib/microsoft/sync-worker.ts
import { MicrosoftGraphService } from './graph-client';
import { db } from '@/lib/firebase/config';
import { Timestamp } from 'firebase/firestore';

interface SyncResult {
  created: number;
  updated: number;
  disabled: number;
  errors: string[];
}

export async function runDirectorySync(
  orgId: string,
  accessToken: string
): Promise<SyncResult> {
  const graph = new MicrosoftGraphService(accessToken);
  const result: SyncResult = { created: 0, updated: 0, disabled: 0, errors: [] };

  try {
    // Get org's Azure AD config
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    const azureConfig = orgDoc.data()?.azureADConfig;

    // Fetch users with delta query
    const deltaResponse = await graph.getUsersDelta(azureConfig?.deltaLink);

    for (const azureUser of deltaResponse.value) {
      try {
        if (azureUser['@removed']) {
          await disableUser(orgId, azureUser.id);
          result.disabled++;
        } else {
          const isNew = await upsertUser(orgId, azureUser, azureConfig?.roleMappings);
          if (isNew) result.created++;
          else result.updated++;
        }
      } catch (error: any) {
        result.errors.push(`User ${azureUser.id}: ${error.message}`);
      }
    }

    // Save delta link for next sync
    await db.collection('organizations').doc(orgId).update({
      'azureADConfig.deltaLink': deltaResponse['@odata.deltaLink'],
      'azureADConfig.lastSyncAt': Timestamp.now(),
    });

  } catch (error: any) {
    result.errors.push(`Sync failed: ${error.message}`);
  }

  // Log sync result
  await db.collection('syncLogs').add({
    orgId,
    integration: 'azure_ad',
    result,
    completedAt: Timestamp.now(),
  });

  return result;
}

async function upsertUser(
  orgId: string,
  azureUser: any,
  roleMappings: any[]
): Promise<boolean> {
  const userRef = db.collection('organizations').doc(orgId)
    .collection('users')
    .where('azureObjectId', '==', azureUser.id);

  const existing = await userRef.get();

  const userData = {
    displayName: azureUser.displayName,
    email: azureUser.mail,
    jobTitle: azureUser.jobTitle,
    department: azureUser.department,
    azureObjectId: azureUser.id,
    source: 'azure_ad',
    status: azureUser.accountEnabled ? 'active' : 'disabled',
    syncedAt: Timestamp.now(),
  };

  if (existing.empty) {
    // Create new user
    await db.collection('organizations').doc(orgId)
      .collection('users').add({
        ...userData,
        role: 'VIEWER', // Default role, can be updated via group mapping
        createdAt: Timestamp.now(),
      });
    return true;
  } else {
    // Update existing user
    await existing.docs[0].ref.update(userData);
    return false;
  }
}

async function disableUser(orgId: string, azureObjectId: string): Promise<void> {
  const userRef = db.collection('organizations').doc(orgId)
    .collection('users')
    .where('azureObjectId', '==', azureObjectId);

  const existing = await userRef.get();

  if (!existing.empty) {
    await existing.docs[0].ref.update({
      status: 'disabled',
      disabledAt: Timestamp.now(),
      disabledReason: 'azure_ad_removal',
    });
  }
}
```

---

## References

### Microsoft Documentation

- [Microsoft Entra ID App Registration](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)
- [Microsoft Graph API Overview](https://learn.microsoft.com/en-us/graph/overview)
- [Microsoft Graph Permissions Reference](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Delta Query Overview](https://learn.microsoft.com/en-us/graph/delta-query-overview)
- [Change Notifications API](https://learn.microsoft.com/en-us/graph/api/resources/change-notifications-api-overview)
- [Outlook Calendar API](https://learn.microsoft.com/en-us/graph/outlook-calendar-concept-overview)
- [Admin Consent Flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-admin-consent)
- [Multi-tenant App Conversion](https://learn.microsoft.com/en-us/entra/identity-platform/howto-convert-app-to-be-multi-tenant)

### Firebase Documentation

- [Firebase Microsoft OAuth](https://firebase.google.com/docs/auth/web/microsoft-oauth)

### Integration Guides

- [NextAuth.js Azure AD Provider](https://next-auth.js.org/providers/azure-ad)
- [Microsoft Graph SDK for JavaScript](https://github.com/microsoftgraph/msgraph-sdk-javascript)

---

## Appendix A: Environment Variables

```bash
# Azure AD / Microsoft Entra ID
AZURE_AD_CLIENT_ID=your-app-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=common  # or specific tenant GUID

# Webhook Security
WEBHOOK_CLIENT_STATE=random-secret-for-webhook-validation

# Token Encryption (for storing refresh tokens)
TOKEN_ENCRYPTION_KEY=32-byte-hex-string

# Microsoft Graph API
GRAPH_API_SCOPES=User.Read,Calendars.ReadWrite
```

## Appendix B: Firestore Schema Additions

```typescript
// organizations/{orgId}
interface Organization {
  // ... existing fields
  azureADConfig?: {
    enabled: boolean;
    tenantId: string;
    clientId: string;
    syncEnabled: boolean;
    lastSyncAt: Timestamp;
    deltaLink?: string;
    roleMappings: RoleMapping[];
    calendarSyncEnabled: boolean;
    teamsSyncEnabled: boolean;
  };
}

// organizations/{orgId}/users/{userId}
interface User {
  // ... existing fields
  azureObjectId?: string;
  source: 'manual' | 'azure_ad' | 'google' | 'email';
  syncedAt?: Timestamp;
  microsoftLinked?: boolean;
}

// users/{userId}/integrations/microsoft
interface MicrosoftIntegration {
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  expiresAt: number;
  scopes: string[];
  calendarSyncEnabled: boolean;
  selectedCalendarId?: string;
  lastCalendarSync?: Timestamp;
}
```

## Appendix C: API Rate Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Microsoft Graph (delegated) | 10,000 requests/10 min | Per app + user |
| Microsoft Graph (application) | 100,000 requests/10 min | Per app |
| Delta queries | No specific limit | Subject to general limits |
| Webhooks | 100,000 notifications/min | Per app |
| Batch requests | 20 requests per batch | Reduce total calls |

---

*Document Version: 1.0*
*Last Updated: February 2026*
*Author: Claude Code Research Agent*
