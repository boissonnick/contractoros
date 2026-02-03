# Messaging Architecture Research

**Author:** CLI 4 (Research Worker)
**Date:** 2026-02-02
**Status:** Draft
**Sprint:** 39
**Issue:** #61

---

## Executive Summary

This document evaluates messaging architecture options for ContractorOS to enable real-time communication between contractors, clients, subcontractors, and field workers. After analyzing competitive solutions (Slack, Teams, Procore, Buildertrend), open-source options (Rocket.Chat, Mattermost), and infrastructure providers (Firebase, Pusher, Twilio), we recommend a **hybrid architecture**:

1. **Real-time Layer:** Firebase Realtime Database + Cloud Firestore
2. **Push Notifications:** Firebase Cloud Messaging (FCM)
3. **SMS/Email:** Twilio + SendGrid (existing integrations)
4. **Thread Model:** Project-linked conversations with @mentions

This approach leverages our existing Firebase infrastructure, provides cross-platform real-time messaging, and integrates SMS/email for multi-channel delivery. The construction industry requires field-friendly messaging that works offline and surfaces messages in context of projects.

---

## Requirements

### Business Requirements

- Real-time messaging between all user types
- Project-linked conversations (messages tied to projects)
- @mentions with push notifications
- File/photo sharing in chat
- Offline message queue for field workers
- SMS fallback for non-app users
- Client portal messaging
- Message search and history

### Technical Requirements

- Real-time WebSocket/long-poll delivery
- Push notifications (iOS, Android, Web)
- Offline-first architecture
- End-to-end encryption (optional, for sensitive projects)
- Message persistence and search
- Multi-tenant data isolation
- Rate limiting and abuse prevention

---

## Competitive Analysis

### Enterprise Messaging Platforms

| Platform | Strengths | Weaknesses | Construction Fit |
|----------|-----------|------------|------------------|
| **Slack** | Channels, threads, 2600+ integrations | $8.75+/user/mo, no project linking | Low |
| **Microsoft Teams** | Office integration, enterprise | Complex, heavy client | Low |
| **Procore** | RFIs, submittals, 500+ integrations | $10K+/year, enterprise only | High (competitor) |
| **Buildertrend** | Client portal, approvals | No threads, limited search | Medium (competitor) |

### Slack Architecture Insights

Slack's architecture provides valuable patterns:
- **Channels** — Named conversation containers
- **Threads** — Replies to specific messages
- **@mentions** — Notification targeting
- **Presence** — Online/offline status
- **Search** — Full-text message search

2026 updates include AI-suggested channel sections and split-view for threads.

### Procore Communication

Procore's approach:
- 90% of users report improved field-to-office communication
- Messages tied to RFIs, submittals, punch lists
- Integrates with Microsoft Teams
- No native voice/video

### Buildertrend Communication

Buildertrend's approach:
- Client communication portal
- In-platform messaging
- Subcontractor updates
- Limited version control
- No issue escalation workflows

---

## Open Source Options

| Platform | License | Self-Hosted | Real-time | E2E Encryption |
|----------|---------|-------------|-----------|----------------|
| **Rocket.Chat** | MIT | Yes | Yes | Yes |
| **Mattermost** | Apache 2.0 | Yes | Yes | At rest only |
| **Zulip** | Apache 2.0 | Yes | Yes | No |
| **Element (Matrix)** | Apache 2.0 | Yes | Yes | Yes |

### Rocket.Chat

- DoD-certified security
- End-to-end encryption
- Air-gapped deployment support
- Rich API for customization
- Good for government/defense contractors

### Mattermost

- Developer/DevOps focused
- GitHub, GitLab, Jira integrations
- Strong workflow automation
- Encryption at rest/transit only

### Recommendation

**Not recommended for ContractorOS** — Adding a separate messaging platform increases complexity. Better to build messaging into our existing Firebase infrastructure.

---

## Infrastructure Providers

### Real-Time Messaging

| Provider | Protocol | Global | Pricing | Best For |
|----------|----------|--------|---------|----------|
| **Firebase RTDB** | WebSocket | 17 DCs | Pay-per-use | Existing Firebase users |
| **Pusher** | WebSocket | Single DC* | Per-connection | Simple pub/sub |
| **Ably** | WebSocket | 15+ DCs | Per-message | Enterprise scale |
| **Socket.IO** | WebSocket | Self-host | Free | Full control |

*Pusher requires choosing single datacenter per app

### Firebase Advantages

Since ContractorOS already uses Firebase:
- No new infrastructure
- Integrated authentication
- Existing Firestore patterns
- Real-time listeners built-in
- Offline persistence included

### Push Notifications

| Provider | Platforms | Cost | Delivery |
|----------|-----------|------|----------|
| **FCM** | iOS, Android, Web | Free | Google infrastructure |
| **OneSignal** | All | Free tier + paid | Managed |
| **Pusher Beams** | All | Per-device | Managed |

**Recommendation:** FCM (already using Firebase)

### Multi-Channel (SMS/Email)

| Provider | Channels | Pricing |
|----------|----------|---------|
| **Twilio** | SMS, WhatsApp, Voice | ~$0.0079/SMS |
| **SendGrid** | Email | $19.95+/month |
| **Courier** | Orchestration | Per-notification |

**Recommendation:** Continue with Twilio (SMS) + SendGrid (Email)

---

## Recommended Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ContractorOS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Messaging Service Layer                       │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │ Conversation │  │   Message    │  │    Notification      │  │   │
│  │  │   Manager    │  │   Handler    │  │       Router         │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │   │
│  └─────────┼─────────────────┼─────────────────────┼───────────────┘   │
│            │                 │                     │                    │
│            ▼                 ▼                     ▼                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Firebase Layer                               │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │  Firestore   │  │  Realtime    │  │       FCM            │  │   │
│  │  │(Persistence) │  │  Database    │  │  (Push Notifications)│  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   External Channels                              │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │   Twilio     │  │  SendGrid    │  │    Web Push          │  │   │
│  │  │    (SMS)     │  │   (Email)    │  │   (Service Worker)   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Model

```typescript
// Conversation container
interface Conversation {
  id: string;
  orgId: string;
  type: 'project' | 'direct' | 'group' | 'client';

  // Linking
  projectId?: string;       // If project-linked
  participants: string[];   // User IDs

  // Metadata
  title?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt: Timestamp;
  lastMessage?: MessagePreview;

  // State
  isArchived: boolean;
  isPinned: boolean;
}

// Individual message
interface Message {
  id: string;
  conversationId: string;
  orgId: string;

  // Content
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'system';

  // Threading
  parentId?: string;        // For thread replies
  threadCount?: number;     // Reply count for parent

  // Attachments
  attachments?: Attachment[];

  // Mentions
  mentions?: string[];      // User IDs mentioned

  // State
  createdAt: Timestamp;
  editedAt?: Timestamp;
  deletedAt?: Timestamp;

  // Read tracking
  readBy: { [userId: string]: Timestamp };
}

// Attachment
interface Attachment {
  id: string;
  type: 'image' | 'file' | 'photo';
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
}

// User's conversation state
interface ConversationMember {
  conversationId: string;
  userId: string;
  joinedAt: Timestamp;
  lastReadAt: Timestamp;
  unreadCount: number;
  isMuted: boolean;
  notificationPreference: 'all' | 'mentions' | 'none';
}
```

### Firestore Structure

```
organizations/{orgId}/
  conversations/{conversationId}
    - type, title, participants, lastMessage
    messages/{messageId}
      - content, senderId, mentions, attachments
    members/{userId}
      - lastReadAt, unreadCount, isMuted

  # Denormalized for user inbox
  users/{userId}/
    conversations/{conversationId}
      - lastReadAt, unreadCount, preview
```

### Real-Time Delivery

```typescript
// Client-side: Subscribe to conversations
function useConversationMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const messagesRef = collection(
      db,
      `organizations/${orgId}/conversations/${conversationId}/messages`
    );

    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(newMessages.reverse());
    });

    return () => unsubscribe();
  }, [conversationId]);

  return messages;
}
```

### Push Notification Flow

```
1. User sends message with @mention
   └─▶ Cloud Function triggers

2. Cloud Function processes
   └─▶ Identifies mentioned users
   └─▶ Checks notification preferences
   └─▶ Routes to appropriate channels

3. Notification routing
   ├─▶ FCM (if app installed, online)
   ├─▶ Web Push (if browser, online)
   ├─▶ Email (if preference set)
   └─▶ SMS (if critical, preference set)
```

### Cloud Function: Send Notification

```typescript
// functions/src/messaging.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const onNewMessage = functions.firestore
  .document('organizations/{orgId}/conversations/{convId}/messages/{msgId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const { orgId, convId } = context.params;

    // Get mentioned users
    const mentions = message.mentions || [];
    if (mentions.length === 0) return;

    // Get conversation for context
    const convDoc = await admin.firestore()
      .doc(`organizations/${orgId}/conversations/${convId}`)
      .get();
    const conversation = convDoc.data();

    // Send notifications to mentioned users
    for (const userId of mentions) {
      await sendNotification(userId, {
        title: `${message.senderName} mentioned you`,
        body: message.content.substring(0, 100),
        data: {
          type: 'message',
          conversationId: convId,
          messageId: snap.id,
          projectId: conversation?.projectId || '',
        },
      });
    }
  });

async function sendNotification(userId: string, notification: Notification) {
  // Get user's FCM tokens
  const tokensDoc = await admin.firestore()
    .doc(`users/${userId}/private/fcmTokens`)
    .get();
  const tokens = tokensDoc.data()?.tokens || [];

  if (tokens.length > 0) {
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
    });
  }

  // Check SMS preference for critical notifications
  const userDoc = await admin.firestore().doc(`users/${userId}`).get();
  const user = userDoc.data();

  if (user?.notificationPreferences?.sms && notification.data.priority === 'high') {
    await sendSMS(user.phone, `${notification.title}: ${notification.body}`);
  }
}
```

---

## Thread Model

### Options Evaluated

| Model | Description | Pros | Cons |
|-------|-------------|------|------|
| **Flat** | All messages in linear list | Simple, familiar | Hard to track topics |
| **Threaded** | Reply chains under messages | Organized discussions | Can get deep/confusing |
| **Project-Linked** | Conversations tied to projects | Contextual, construction-relevant | Requires project selection |
| **Hybrid** | Flat with optional threads | Flexibility | Complexity |

### Recommendation: Project-Linked with Threads

```
Project: Kitchen Remodel
├── General Discussion (conversation)
│   ├── Message 1
│   │   └── Thread reply 1.1
│   │   └── Thread reply 1.2
│   └── Message 2
├── RFI #23: Cabinet Specs (conversation, auto-created)
│   └── Discussion messages...
└── Change Order #5 (conversation, auto-created)
    └── Discussion messages...

Direct Messages
├── John Smith ↔ You
└── Sarah Jones ↔ You

Client Portal
└── Client: Johnson Family (conversation)
    └── Messages visible to client
```

### Benefits for Construction

1. **Context** — Messages tied to projects, RFIs, change orders
2. **Searchable** — Find "what did we discuss about cabinet specs?"
3. **Auditable** — Conversation history for disputes
4. **Multi-party** — GC, subs, clients in appropriate conversations

---

## Multi-Channel Routing

### Channel Selection Logic

```typescript
async function routeNotification(
  userId: string,
  notification: Notification,
  urgency: 'low' | 'normal' | 'high' | 'critical'
) {
  const user = await getUser(userId);
  const prefs = user.notificationPreferences;

  // Always try push first
  if (prefs.push !== 'none') {
    await sendPushNotification(userId, notification);
  }

  // Email for non-critical, async
  if (urgency !== 'critical' && prefs.email) {
    await queueEmail(user.email, notification);
  }

  // SMS for critical or if push failed
  if (urgency === 'critical' && prefs.sms) {
    await sendSMS(user.phone, notification);
  }

  // SMS fallback if no recent app activity
  const lastActive = user.lastActiveAt;
  const hoursSinceActive = (Date.now() - lastActive.toMillis()) / 3600000;

  if (hoursSinceActive > 24 && urgency !== 'low' && prefs.sms) {
    await sendSMS(user.phone, notification);
  }
}
```

### Notification Types

| Type | Default Channel | Urgency |
|------|-----------------|---------|
| New message | Push | Normal |
| @mention | Push + Badge | High |
| Client message | Push + Email | High |
| RFI response | Push + Email | High |
| Change order approval | Push + Email + SMS | Critical |
| Payment received | Push + Email | Normal |

---

## Offline Support

### Offline Queue (Field Workers)

```typescript
// Offline message queue using IndexedDB
interface OfflineMessage {
  id: string;          // Temporary local ID
  conversationId: string;
  content: string;
  attachments: LocalAttachment[];
  createdAt: number;   // Timestamp
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
}

// On reconnect, sync pending messages
async function syncOfflineMessages() {
  const pending = await db.offlineMessages
    .where('status')
    .equals('pending')
    .toArray();

  for (const msg of pending) {
    try {
      await db.offlineMessages.update(msg.id, { status: 'syncing' });
      await sendMessage(msg);
      await db.offlineMessages.update(msg.id, { status: 'synced' });
    } catch (error) {
      await db.offlineMessages.update(msg.id, {
        status: 'failed',
        retryCount: msg.retryCount + 1,
      });
    }
  }
}
```

### Firestore Offline Persistence

Firestore already provides offline persistence:
```typescript
// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support
  }
});
```

---

## Search Architecture

### Option A: Firestore Full-Text (Limited)

Firestore doesn't support full-text search natively. Options:
- Array-contains for tags
- Prefix matching (startAt/endAt)
- External search service

### Option B: Algolia Integration

```typescript
// Index messages to Algolia via Cloud Function
export const indexMessage = functions.firestore
  .document('organizations/{orgId}/conversations/{convId}/messages/{msgId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const { orgId, convId, msgId } = context.params;

    await algoliaIndex.saveObject({
      objectID: msgId,
      orgId,
      conversationId: convId,
      content: message.content,
      senderName: message.senderName,
      createdAt: message.createdAt.toMillis(),
    });
  });
```

### Option C: Typesense (Self-Hosted)

Open-source alternative to Algolia:
- Lower cost at scale
- Self-hosted option
- Good typo tolerance

### Recommendation

Start with basic Firestore queries (recent messages, by conversation). Add Algolia/Typesense when search becomes critical (post-MVP).

---

## Implementation Plan

### Phase 1: Core Messaging (4 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Data model & Firestore structure | 8h | None |
| Conversation list UI | 12h | Data model |
| Message thread UI | 16h | List UI |
| Send message functionality | 8h | Thread UI |
| Real-time updates | 8h | Send |
| **Subtotal** | **52h** | |

### Phase 2: Project Integration (2 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Project-linked conversations | 8h | Phase 1 |
| Auto-create RFI/CO conversations | 6h | Project link |
| Message from project context | 8h | Auto-create |
| **Subtotal** | **22h** | |

### Phase 3: Notifications (3 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| @mention parsing & detection | 8h | Phase 1 |
| FCM push setup | 12h | Mentions |
| Web Push (Service Worker) | 12h | FCM |
| Notification preferences UI | 8h | Push |
| **Subtotal** | **40h** | |

### Phase 4: Multi-Channel (2 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| SMS notification routing | 8h | Phase 3 |
| Email notification templates | 8h | Routing |
| Channel selection logic | 6h | Email |
| **Subtotal** | **22h** | |

### Phase 5: Advanced Features (3 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| File/photo attachments | 12h | Phase 1 |
| Offline message queue | 12h | Attachments |
| Read receipts | 8h | Offline |
| Message search (basic) | 8h | Read receipts |
| **Subtotal** | **40h** | |

### Phase 6: Polish (2 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Unread badges & counts | 6h | Phase 5 |
| Typing indicators | 4h | Badges |
| Message reactions | 6h | Typing |
| Archive/mute conversations | 4h | Reactions |
| **Subtotal** | **20h** | |

---

## Estimated Effort

| Phase | Hours | Dependencies |
|-------|-------|--------------|
| Research | 20h | None (complete) |
| Phase 1: Core | 52h | Research |
| Phase 2: Projects | 22h | Phase 1 |
| Phase 3: Notifications | 40h | Phase 1 |
| Phase 4: Multi-Channel | 22h | Phase 3 |
| Phase 5: Advanced | 40h | Phase 4 |
| Phase 6: Polish | 20h | Phase 5 |
| **Total** | **216h** | |

**Estimated Duration:** 16-20 weeks (single developer)

---

## Security Considerations

### Data Isolation

- Messages scoped to organization
- Firestore rules enforce org membership
- Client conversations isolated from internal

### Encryption

| Layer | Encryption |
|-------|------------|
| In transit | TLS 1.3 (Firebase default) |
| At rest | AES-256 (Firebase default) |
| End-to-end | Optional (future, for sensitive projects) |

### Access Control

```javascript
// Firestore rules
match /organizations/{orgId}/conversations/{convId} {
  allow read: if isMember(orgId) && isParticipant(convId);
  allow write: if isMember(orgId) && isParticipant(convId);

  match /messages/{msgId} {
    allow read: if isMember(orgId) && isParticipant(convId);
    allow create: if isMember(orgId) && isParticipant(convId);
    allow update: if isMessageOwner(msgId); // Edit own messages
    allow delete: if isMessageOwner(msgId) || isAdmin(orgId);
  }
}

function isParticipant(convId) {
  return request.auth.uid in get(/databases/$(database)/documents/
    organizations/$(orgId)/conversations/$(convId)).data.participants;
}
```

### Abuse Prevention

- Rate limit message sends (10/minute per user)
- Content moderation (optional profanity filter)
- Attachment size limits (10MB)
- Report/block functionality

---

## Open Questions

- [ ] Should clients see all project messages or filtered view?
- [ ] How do we handle message retention (legal/compliance)?
- [ ] Do we need message editing? Deletion? Soft delete only?
- [ ] Should there be channel/topic separation within projects?
- [ ] Voice/video calling integration? (Twilio Video, Daily.co)
- [ ] AI-powered message summarization for long threads?

---

## References

- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [FCM Architecture](https://firebase.google.com/docs/cloud-messaging/fcm-architecture)
- [Slack API](https://api.slack.com/)
- [Slack Architecture](https://systemdesign.one/slack-architecture/)
- [Rocket.Chat](https://github.com/RocketChat/Rocket.Chat)
- [Mattermost](https://mattermost.com/)
- [Twilio SMS API](https://www.twilio.com/en-us/messaging/channels/sms)
- [SendGrid Email API](https://sendgrid.com/)
- [Procore Communication](https://www.procore.com/)
- [Buildertrend Communication](https://buildertrend.com/)
