# Messaging Architecture Research

**Author:** CLI 4 (Research Worker)
**Date:** 2026-02-03 (Updated)
**Status:** Complete
**Sprint:** 39
**Issue:** #61

---

## Executive Summary

This document evaluates messaging architecture options for ContractorOS to enable real-time, context-aware communication between contractors, clients, subcontractors, and field workers. After analyzing competitive solutions (Slack, Teams, Asana, Monday.com, Procore, Buildertrend), open-source options (Rocket.Chat, Mattermost, Zulip), and infrastructure providers (Firebase, Twilio, SendGrid), we recommend a **unified inbox architecture** with:

1. **Unified Inbox Layer:** Single interface consolidating SMS, email, in-app, and push notifications
2. **Real-time Layer:** Firebase Realtime Database + Cloud Firestore
3. **Push Notifications:** Firebase Cloud Messaging (FCM)
4. **Multi-channel Delivery:** Twilio (SMS) + SendGrid (Email) with intelligent routing
5. **Context Persistence:** Messages linked to projects, tasks, RFIs, and change orders
6. **AI-Assisted Responses:** Phase 4 enhancement for smart replies and summaries

This approach addresses fragmentation across communication channels while leveraging our existing Firebase infrastructure. The construction industry requires field-friendly messaging that works offline, surfaces messages in project context, and reaches users on their preferred channel.

---

## Table of Contents

1. [Requirements](#requirements)
2. [Competitive Analysis](#competitive-analysis)
3. [Open Source Evaluation](#open-source-evaluation)
4. [Infrastructure Providers](#infrastructure-providers)
5. [Recommended Architecture](#recommended-architecture)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Security Considerations](#security-considerations)
8. [References](#references)

---

## Requirements

### Business Requirements

| Category | Requirements |
|----------|--------------|
| **Multi-channel** | Unified inbox for SMS, email, in-app, push notifications |
| **Context-aware** | Messages linked to projects, tasks, RFIs, change orders |
| **Real-time** | Instant message delivery with WebSocket/long-poll |
| **Offline-first** | Message queue for field workers without connectivity |
| **User preferences** | Channel routing based on user settings and urgency |
| **Thread support** | Organized conversations with reply chains |
| **File sharing** | Photos, documents, attachments in messages |
| **Search** | Full-text search across message history |
| **Multi-party** | GC, subs, clients in appropriate conversations |

### Technical Requirements

| Category | Requirements |
|----------|--------------|
| **Delivery** | Real-time WebSocket, push notifications (iOS, Android, Web) |
| **Persistence** | Message history with retention policies |
| **Isolation** | Multi-tenant data isolation at organization level |
| **Scale** | Support 1000+ concurrent users per organization |
| **Latency** | < 500ms message delivery within app |
| **Reliability** | 99.9% uptime for message delivery |
| **Security** | TLS in transit, AES-256 at rest, optional E2E encryption |

---

## Competitive Analysis

### 1. Slack

**Overview:** Enterprise messaging platform with 2600+ integrations, evolved into an "intelligent workspace hub" in 2025-2026.

**Architecture Insights:**
- Channel-based architecture organizing conversations around teams, projects, or topics
- Stateful Channel Servers holding message history in-memory for fast retrieval
- Push-first mentality using WebSockets for real-time delivery (<500ms globally)
- Serves tens of millions of channels per host with linear scalability
- LAMP stack (Linux-Apache-MySQL-PHP) with Consul for service registry

**Multi-channel Features:**
- Channels & Direct Messaging (core)
- Slack Huddles (real-time audio/video with thread archiving)
- Workflow Builder (drag-and-drop automation)
- Slack Canvas (collaborative documentation)
- Universal Search with AI enhancement

**2025-2026 Updates:**
- AI-powered summarization and recaps
- AI teammates (beta) for workflow automation
- Enhanced mobile experience with split-view threads
- Deeper integration possibilities

**Strengths:**
- Mature threading model (replies to specific messages)
- @mentions with notification targeting
- Presence indicators (online/offline status)
- Shared channels across organizations

**Weaknesses for Construction:**
- $8.75+/user/month (expensive at scale)
- No native project/task linking
- Requires separate tool for project management
- Overkill for field workers who need simple SMS

**Construction Fit:** Low - Not designed for project context or multi-channel delivery

**Sources:**
- [Slack Review 2026](https://www.linktly.com/productivity-software/slack-review-2/)
- [Slack Architecture](https://systemdesign.one/slack-architecture/)
- [Slack Engineering - Real-time Messaging](https://slack.engineering/real-time-messaging/)

---

### 2. Microsoft Teams

**Overview:** Enterprise communication platform integrated with Microsoft 365, offering chat, video, and phone system.

**SMS Integration Architecture:**
- Native SMS via PSTN Calling Plans (US, Puerto Rico, Canada only)
- Requires 10DLC (10 Digit Long Code) network registration
- TCR (The Campaign Registry) brand and campaign approval required
- Approval process takes up to one business week

**Technical Requirements:**
- Teams Calling Plan phone number assigned to users
- Users must be "voice enabled"
- Native supports only 1,000 messages per group chat
- No MMS, no automation, limited compliance tools

**Third-Party SMS Extensions:**
- **YakChat:** SMS/MMS with Outlook, Active Directory, SharePoint integration
- **TrueDialog:** Embeds SMS/MMS directly into Teams and Outlook
- **Twilio Integration:** Global messaging infrastructure with Teams collaboration

**Email Integration:**
- Deep Microsoft 365 integration (Outlook, Exchange)
- Unified inbox for emails and chat
- Calendar integration for scheduling

**Notification Routing:**
- Activity feed for in-app notifications
- Push notifications via Microsoft infrastructure
- Email digests configurable

**Mobile Experience:**
- Native iOS/Android apps
- Offline message access
- Background sync

**Strengths:**
- Enterprise-grade security and compliance
- Unified with Office 365 ecosystem
- Strong video conferencing

**Weaknesses for Construction:**
- Complex setup and heavy client
- Native SMS limited to US/CA
- Requires Microsoft 365 subscription
- Not field-worker friendly

**Construction Fit:** Low - Too enterprise-focused for construction field teams

**Sources:**
- [Microsoft Teams SMS Integration Guide](https://www.geeky-gadgets.com/microsoft-teams-sms-integration-guide/)
- [Planning for SMS in Teams](https://learn.microsoft.com/en-us/microsoftteams/sms-overview)
- [YakChat SMS for Teams](https://www.yakchat.com/sms-for-microsoft-teams)

---

### 3. Asana

**Overview:** Work management platform with built-in communication features for task-centric collaboration.

**Multi-channel Approach:**
- Comments on tasks with file sharing and tagging
- Direct messaging between collaborators
- Project message boards for hub-style discussions
- Video recording/embedding directly in chat
- Centralized inbox for all project updates

**Thread/Conversation Context:**
- Every task becomes a "mini-collaboration hub"
- Comments tied directly to tasks
- Internal links to tasks and projects in messages
- AI-powered task summarization

**Notification Routing:**
- Inbox with all task and project updates
- Email notifications configurable by type
- Slack/Teams integration for real-time alerts
- Mobile push notifications

**2025 Updates:**
- Fall 2025 Release with "Asana AI" enhancements
- AI teammates (beta) that adapt to workflows
- Enhanced collaboration features

**Strengths:**
- Context preserved - messages tied to tasks
- Built-in direct messaging
- Strong project management integration
- AI task summaries

**Weaknesses for Construction:**
- Limited SMS capabilities
- No native multi-channel inbox
- Collaboration features less robust than dedicated chat
- Not designed for external client communication

**Construction Fit:** Medium - Good task context but lacks SMS/field support

**Sources:**
- [Asana vs Monday Comparison 2025](https://zapier.com/blog/monday-vs-asana/)
- [Asana Direct Messaging](https://forum.asana.com/t/direct-messaging/35184)

---

### 4. Monday.com

**Overview:** Work OS platform with collaborative features for cross-departmental communication.

**Multi-channel Approach:**
- Updates section for in-context task discussions
- Monday workdocs for real-time document collaboration
- Private boards for confidential conversations
- Integrated team communication options

**Thread/Conversation Context:**
- Context-specific discussions within tasks
- Real-time updates on work items
- Comments attached to specific columns/items

**Notification Routing:**
- In-app notification bell
- Email notifications
- Mobile push
- Slack/Teams integrations

**2025 Updates:**
- November 2025: "Autopilot Hub" for centralized automation overview
- Enhanced integration workflows

**Strengths:**
- Visual work management
- Strong automation capabilities
- Cross-departmental collaboration
- Real-time updates

**Weaknesses for Construction:**
- Limited real-time chat features
- No built-in issue escalation workflows
- Coordination gets harder at scale
- No robust version control for documents

**Construction Fit:** Medium - Good for project tracking, weak on real-time communication

**Sources:**
- [Asana vs Monday Features 2025](https://www.meegle.com/blogs/monday-vs-asana)
- [Monday.com vs Asana Expert Reviews](https://thedigitalprojectmanager.com/tools/monday-vs-asana/)

---

### 5. Construction-Specific Platforms

#### Procore

**Overview:** Construction project management platform used by GCs and owners.

**Communication Features:**
- Messages tied to RFIs, submittals, punch lists
- 90% of users report improved field-to-office communication
- Conversation tracking and clear records
- 500+ integrations including Microsoft Teams

**Strengths:**
- Purpose-built for construction
- Context linking to construction documents
- Industry-standard tool

**Weaknesses:**
- $10K+/year (enterprise pricing)
- No native voice/video
- Heavy for small contractors

**Construction Fit:** High (competitor) - Industry standard but expensive

#### Buildertrend

**Overview:** Cloud-based construction software for residential builders and remodelers.

**Communication Features:**
- Client communication portal
- Real-time updates
- Messaging and file-sharing
- Subcontractor updates

**Strengths:**
- Client engagement portal
- Homeowner progress tracking
- All-in-one system
- User-friendly

**Weaknesses:**
- No threads
- Limited search
- No version control
- No issue escalation workflows

**Construction Fit:** High (competitor) - Good for residential, limited enterprise features

#### Raken

**Overview:** Construction productivity software focused on field reporting and messaging.

**Communication Features:**
- Single channel for field-to-office communication
- Cloud storage with mobile data capture
- Real-time information sharing

**Strengths:**
- Field-first design
- Mobile-optimized
- Safety and schedule integration

**Construction Fit:** High - Field-focused messaging

**Sources:**
- [Procore vs PlanGrid 2025](https://www.selecthub.com/construction-management-software/procore-vs-plangrid/)
- [Buildertrend vs Procore 2026](https://buildern.com/resources/blog/buildertrend-vs-procore/)
- [Raken Messaging Features](https://www.rakenapp.com/features/messaging)
- [Construction Communication Best Practices 2025](https://www.textline.com/blog/construction-site-communication)

---

## Open Source Evaluation

### Comparison Matrix

| Feature | Rocket.Chat | Mattermost | Zulip |
|---------|-------------|------------|-------|
| **License** | MIT | Apache 2.0 / AGPL | Apache 2.0 |
| **Best For** | Omnichannel, external comms | Developer teams, DevOps | Async teams, organized discussions |
| **UI Style** | Highly customizable | Slack-like | Thread/topic-based (email-like) |
| **Tech Stack** | JavaScript/Meteor | Go + React | Python + React Native |
| **Self-Hosted** | Yes | Yes | Yes |
| **Real-time** | Yes | Yes | Yes |
| **E2E Encryption** | Yes | At rest only | No |
| **Integrations** | Good | Extensive (Jira, GitHub) | 90+ native |
| **Community** | Large | Large | Smaller but focused |

---

### Rocket.Chat

**Overview:** Open-source team communication platform with omnichannel capabilities.

**Pricing (2025-2026):**
| Plan | Price | Users | Features |
|------|-------|-------|----------|
| **Community** | Free | Unlimited | Core chat, self-hosted only |
| **Starter** | Free | Up to 50 | Premium features, 100 omnichannel contacts |
| **Pro** | $8/user/mo | 51-500 | 15K omnichannel contacts, webform/email support |
| **Enterprise** | Custom | Unlimited | High availability, multi-instance, advanced governance |

**Key Features:**
- DoD-certified security
- End-to-end encryption
- Air-gapped deployment support
- WhatsApp, SMS, email integration (omnichannel)
- Federation support via Matrix protocol
- Rich API for customization

**Omnichannel Capabilities:**
- Unified inbox for multiple channels
- Chat routing to agents
- Canned responses
- Customer history

**Strengths:**
- True omnichannel support (WhatsApp, SMS, email)
- Enterprise-grade security
- Self-hosted with full data control
- Good for government/defense contractors

**Weaknesses:**
- Meteor framework (performance concerns at scale)
- Limited apps/integrations compared to Slack
- Self-hosted maintenance burden

**Construction Fit:** Medium - Good omnichannel but requires hosting infrastructure

**Sources:**
- [Rocket.Chat Pricing](https://www.rocket.chat/pricing)
- [Rocket.Chat Plans Documentation](https://docs.rocket.chat/docs/our-plans)

---

### Mattermost

**Overview:** Open-source, self-hosted team collaboration platform focused on security and developer workflows.

**Pricing (2025-2026):**
| Plan | Price | Features |
|------|-------|----------|
| **Entry (Free)** | Free | 10K message history, self-hosted |
| **Team Edition** | Free | Full features, under 250 users, no SSO |
| **Professional** | $10/user/mo | SSO, advanced permissions |
| **Enterprise** | Custom | High availability, compliance, dedicated support |

**Technical Architecture:**
- Written in Go + React (high performance)
- PostgreSQL database
- Server-side rendering (light client footprint)
- Self-hosted or cloud options

**Key Features:**
- Developer/DevOps focused
- GitHub, GitLab, Jira integrations
- Workflow automation (Playbooks)
- Encryption at rest and in transit
- Compliance features (HIPAA, SOC2)

**Licensing:**
- Minimum 11 users for paid licenses
- Annual subscription based on activated users
- Quarterly true-up reporting required

**Strengths:**
- High performance (Go backend)
- Strong developer integrations
- Self-hosted with full control
- Compliance certifications

**Weaknesses:**
- No E2E encryption
- Complex setup for self-hosted
- Developer-focused (not field-worker friendly)
- Requires ongoing maintenance

**Construction Fit:** Low - Too developer-focused, complex for field teams

**Sources:**
- [Mattermost Pricing](https://mattermost.com/pricing/)
- [Mattermost Editions Documentation](https://docs.mattermost.com/product-overview/editions-and-offerings.html)
- [Self-Hosted Subscriptions](https://docs.mattermost.com/product-overview/self-hosted-subscriptions.html)

---

### Zulip

**Overview:** Open-source chat with unique topic-based threading for organized, asynchronous communication.

**Pricing (2025-2026):**
| Plan | Price | Features |
|------|-------|----------|
| **Self-Hosted** | Free | All features, unlimited users |
| **Community** | Free | For open-source, research, non-profits |
| **Cloud Free** | Free | 10K message search history |
| **Cloud Standard** | Paid | Full history, sponsorship available |

**Unique Architecture:**
- Topic-based threading (each message belongs to a stream + topic)
- Email-inbox-like organization
- Perfect for asynchronous, globally-distributed teams
- 100% open-source (no "open core" catch)

**Key Features:**
- Topics within streams (like email threads)
- 90+ native integrations
- Hubot, Zapier, IFTTT support
- Powerful API
- Full export/import for migration

**Sponsorship Program:**
- 1500+ organizations sponsored
- Free for open-source, educators, researchers, non-profits
- Developing world discounts available

**Strengths:**
- Unique threading keeps conversations organized
- Truly free self-hosted option
- Ideal for async communication
- No vendor lock-in (easy migration)

**Weaknesses:**
- Smaller community than Slack/Mattermost
- Learning curve for topic-based threading
- No E2E encryption
- Less familiar UI paradigm

**Construction Fit:** Low - Topic-based threading too complex for field workers

**Sources:**
- [Zulip Plans and Pricing](https://zulip.com/plans/)
- [Self-host Zulip](https://zulip.com/self-hosting/)
- [Zulip for Open Source](https://zulip.com/for/open-source/)

---

### Open Source Recommendation

**NOT recommended for ContractorOS** - Adding a separate messaging platform increases operational complexity without solving our core problem (multi-channel unification). Better to build messaging into our existing Firebase infrastructure with purpose-built features for construction workflows.

**If open source is mandated:** Rocket.Chat is the best fit due to omnichannel capabilities, but requires significant hosting and maintenance investment.

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

### Firebase Cloud Messaging (FCM)

**Architecture:**
1. FCM connection server accepts message requests
2. Performs fanout via topics, generates message metadata
3. Platform-specific transport layer routes to device
4. Client SDK receives and displays notification

**Message Types:**
- **Notification messages:** Automatically displayed by FCM SDK
- **Data messages:** Processed by client application

**Priority Levels:**
- **Normal:** Batched delivery when device in Doze mode
- **High:** Immediate delivery, can wake sleeping device

**Best Practices:**
- Store FCM tokens in database, update on app events
- Process payloads immediately in `onMessageReceived`
- Use topics for broadcast messages
- Implement token refresh handling

**Cost:** Free (as of April 2025)

**Sources:**
- [FCM Architectural Overview](https://firebase.google.com/docs/cloud-messaging/fcm-architecture)
- [FCM on Android 2025](https://firebase.blog/posts/2025/04/fcm-on-android/)

---

### Multi-Channel (SMS/Email)

#### Twilio SMS

**Architecture Best Practices:**
- Separate mailstreams for transactional vs. marketing
- Use 10DLC for business SMS (US requirement)
- Implement webhook handlers for delivery status
- Store message SID for tracking

**Pricing:** ~$0.0079/segment

#### SendGrid Email

**Architecture Best Practices:**
- Separate subusers for transactional and marketing
- Domain authentication (SPF, DKIM, DMARC)
- Use API over SMTP for better performance
- Dynamic templates with Handlebars syntax

**Integration Pattern:**
```
if (user.has_phone && notification.prefers_sms) {
  send via Twilio
} else {
  send via SendGrid
}
```

**Channel Routing Logic:**
- Don't send both SMS and email simultaneously unless user requests
- Use if/then logic to try preferred channel first
- Track delivery status across both channels
- Manage consent separately per channel

**Sources:**
- [Twilio + SendGrid Integration Best Practices](https://www.courier.com/blog/how-to-add-a-direct-twilio-sms-integration-with-sendgrid-emails)
- [SendGrid API Getting Started](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/api-getting-started)

---

### Notification Routing Architecture

**System Design Pattern:**

```
┌─────────────────┐
│ Notification    │
│ Event           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Preference │
│ Database        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│ Priority Queue  │────▶│ Channel      │
│ System          │     │ Providers    │
└─────────────────┘     │ ├─ FCM       │
                        │ ├─ Twilio    │
                        │ └─ SendGrid  │
                        └──────────────┘
```

**User Preference Hierarchy:**
1. Individual recipient settings (highest priority)
2. Channel priority (order of channels)
3. Notification type defaults
4. System defaults (lowest priority)

**Priority-Based Overrides:**
- Critical notifications (e.g., system down, emergency) bypass user preferences
- Include priority field in event contract
- Maximum priority skips preference checks

**Quiet Hours Support:**
- Store user timezone
- Check quiet hours before sending
- Queue non-urgent for delivery after quiet hours
- Allow override for urgent notifications

**Sources:**
- [Courier Channel Priority](https://www.courier.com/docs/platform/sending/channel-priority)
- [Designing a Notification System](https://www.systemdesignhandbook.com/guides/design-a-notification-system/)

---

## Recommended Architecture

### Unified Inbox Concept

A unified inbox consolidates multiple communication channels into a single interface:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         UNIFIED INBOX                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Channel Abstraction Layer                      │   │
│  │                                                                   │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │   │
│  │  │   In-App   │  │    SMS     │  │   Email    │  │    Push    │  │   │
│  │  │  Messages  │  │  (Twilio)  │  │ (SendGrid) │  │   (FCM)    │  │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  │   │
│  │        │               │               │               │         │   │
│  │        └───────────────┴───────────────┴───────────────┘         │   │
│  │                                │                                  │   │
│  └────────────────────────────────┼──────────────────────────────────┘   │
│                                   │                                       │
│                                   ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Message Normalization                          │   │
│  │                                                                   │   │
│  │  - Unified message format                                         │   │
│  │  - Attachment handling                                            │   │
│  │  - Metadata extraction                                            │   │
│  │  - Thread correlation                                             │   │
│  └────────────────────────────────┬──────────────────────────────────┘   │
│                                   │                                       │
│                                   ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Context Persistence                            │   │
│  │                                                                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │ Projects │  │  Tasks   │  │   RFIs   │  │  Change Orders   │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Channel Abstraction

All channels normalized to a common message format:

```typescript
// Unified message representation
interface UnifiedMessage {
  id: string;
  orgId: string;
  conversationId: string;

  // Channel info
  channel: 'in_app' | 'sms' | 'email' | 'push';
  externalId?: string;        // Twilio SID, SendGrid message ID

  // Content
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  contentHtml?: string;       // For email
  subject?: string;           // For email

  // Context linking
  contextType?: 'project' | 'task' | 'rfi' | 'change_order' | 'invoice';
  contextId?: string;

  // Threading
  parentId?: string;
  threadCount?: number;

  // Attachments
  attachments?: Attachment[];

  // Metadata
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Timestamp;
  deliveredAt?: Timestamp;
  readAt?: Timestamp;
}
```

### Context Persistence

Messages automatically linked to construction entities:

```typescript
// Context linking rules
interface ContextLinkingRule {
  patterns: RegExp[];         // Match patterns in message
  contextType: string;
  extractId: (match: RegExpMatchArray) => string;
}

const LINKING_RULES: ContextLinkingRule[] = [
  {
    patterns: [/RFI[- ]?#?(\d+)/i, /request for information[- ]?#?(\d+)/i],
    contextType: 'rfi',
    extractId: (match) => match[1],
  },
  {
    patterns: [/CO[- ]?#?(\d+)/i, /change order[- ]?#?(\d+)/i],
    contextType: 'change_order',
    extractId: (match) => match[1],
  },
  {
    patterns: [/invoice[- ]?#?(\d+)/i, /inv[- ]?#?(\d+)/i],
    contextType: 'invoice',
    extractId: (match) => match[1],
  },
  {
    patterns: [/project[: ](.+?)(?:\s|$)/i],
    contextType: 'project',
    extractId: (match) => match[1].trim(),
  },
];
```

### Notification Routing Rules

```typescript
interface NotificationRoutingConfig {
  userId: string;

  // Channel preferences
  channels: {
    inApp: boolean;
    push: boolean;
    email: boolean;
    sms: boolean;
  };

  // Priority-based routing
  priorityRouting: {
    low: ['inApp'];
    normal: ['inApp', 'push'];
    high: ['inApp', 'push', 'email'];
    critical: ['inApp', 'push', 'email', 'sms'];
  };

  // Type-based overrides
  typeOverrides: {
    [notificationType: string]: {
      channels: string[];
      priority: 'low' | 'normal' | 'high' | 'critical';
    };
  };

  // Quiet hours
  quietHours: {
    enabled: boolean;
    startTime: string;      // "22:00"
    endTime: string;        // "07:00"
    timezone: string;
    allowCritical: boolean;
  };

  // Fallback rules
  fallbackAfterMinutes: number;   // Send SMS if push not read after X minutes
}

// Routing logic
async function routeNotification(
  userId: string,
  notification: Notification
): Promise<DeliveryResult[]> {
  const config = await getRoutingConfig(userId);
  const results: DeliveryResult[] = [];

  // Check quiet hours
  if (isQuietHours(config) && notification.priority !== 'critical') {
    return queueForLater(notification, config.quietHours.endTime);
  }

  // Get channels for this priority
  let channels = config.priorityRouting[notification.priority];

  // Apply type overrides
  if (config.typeOverrides[notification.type]) {
    channels = config.typeOverrides[notification.type].channels;
  }

  // Filter by user preferences
  channels = channels.filter(ch => config.channels[ch]);

  // Send to each channel
  for (const channel of channels) {
    const result = await sendToChannel(channel, notification);
    results.push(result);
  }

  // Schedule fallback if needed
  if (config.fallbackAfterMinutes && !channels.includes('sms')) {
    scheduleFallback(userId, notification, config.fallbackAfterMinutes);
  }

  return results;
}
```

### Data Model

```typescript
// Conversation container
interface Conversation {
  id: string;
  orgId: string;
  type: 'project' | 'direct' | 'group' | 'client' | 'support';

  // Linking
  projectId?: string;
  taskId?: string;
  rfiId?: string;
  changeOrderId?: string;

  // Participants
  participants: string[];
  participantDetails: {
    [userId: string]: {
      name: string;
      avatar?: string;
      role: string;
      isExternal: boolean;   // Client, sub, etc.
    };
  };

  // Metadata
  title?: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt: Timestamp;
  lastMessage?: MessagePreview;

  // Channel tracking
  channels: ('in_app' | 'sms' | 'email')[];

  // State
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
}

// Individual message
interface Message {
  id: string;
  conversationId: string;
  orgId: string;

  // Channel
  channel: 'in_app' | 'sms' | 'email' | 'push';
  externalId?: string;

  // Content
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'system';

  // Threading
  parentId?: string;
  threadCount?: number;

  // Attachments
  attachments?: Attachment[];

  // Mentions
  mentions?: string[];

  // Context
  contextType?: string;
  contextId?: string;
  contextTitle?: string;

  // State
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Timestamp;
  editedAt?: Timestamp;
  deletedAt?: Timestamp;

  // Read tracking
  readBy: { [userId: string]: Timestamp };
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
    - type, title, participants, lastMessage, channels
    messages/{messageId}
      - content, senderId, mentions, attachments, channel
    members/{userId}
      - lastReadAt, unreadCount, isMuted

  # Context-based indexes
  conversationsByProject/{projectId}
    - conversationIds[]
  conversationsByRfi/{rfiId}
    - conversationIds[]

  # User inbox (denormalized)
  users/{userId}/
    inbox/{conversationId}
      - lastReadAt, unreadCount, preview, priority
    notificationPreferences/
      - channels, quietHours, typeOverrides
```

---

## Implementation Roadmap

### Phase 1: Unified Inbox UI (6 weeks)

**Objective:** Create single interface for viewing all messages across channels

| Task | Effort | Dependencies |
|------|--------|--------------|
| Unified inbox data model | 16h | None |
| Inbox list component | 20h | Data model |
| Conversation view component | 24h | Inbox list |
| Message composer | 16h | Conversation view |
| Real-time subscriptions | 12h | Composer |
| Unread counts & badges | 8h | Real-time |
| Mobile responsive UI | 16h | All above |
| **Subtotal** | **112h** | |

**Deliverables:**
- `/dashboard/inbox` page with conversation list
- Conversation detail view with message history
- Send message functionality (in-app only)
- Real-time message updates
- Mobile-optimized interface

---

### Phase 2: SMS/Email Integration (6 weeks)

**Objective:** Integrate Twilio and SendGrid for multi-channel delivery

| Task | Effort | Dependencies |
|------|--------|--------------|
| Twilio webhook handlers | 16h | Phase 1 |
| SendGrid webhook handlers | 16h | Phase 1 |
| Inbound message processing | 16h | Webhooks |
| Outbound message routing | 12h | Inbound |
| Delivery status tracking | 8h | Routing |
| Channel switching UI | 12h | Status tracking |
| Message templates | 12h | Channel switching |
| Opt-out handling | 8h | Templates |
| **Subtotal** | **100h** | |

**Deliverables:**
- Receive SMS messages in unified inbox
- Receive email replies in unified inbox
- Send messages via SMS or email from inbox
- Track delivery status across channels
- Manage opt-outs and compliance

---

### Phase 3: Context Linking (4 weeks)

**Objective:** Link messages to projects, tasks, RFIs, change orders

| Task | Effort | Dependencies |
|------|--------|--------------|
| Context detection rules | 12h | Phase 2 |
| Auto-linking engine | 16h | Detection rules |
| Context sidebar in inbox | 12h | Auto-linking |
| Message from entity pages | 12h | Context sidebar |
| Activity feed integration | 8h | From entity |
| Search with context filters | 12h | Activity feed |
| **Subtotal** | **72h** | |

**Deliverables:**
- Messages auto-linked to relevant entities
- View message history from project/task/RFI pages
- Filter inbox by project or entity
- Activity feed shows message activity
- Search across all messages with filters

---

### Phase 4: AI-Assisted Responses (4 weeks)

**Objective:** Smart replies, summaries, and response suggestions

| Task | Effort | Dependencies |
|------|--------|--------------|
| Message summarization | 16h | Phase 3 |
| Smart reply suggestions | 20h | Summarization |
| Response templates with AI | 12h | Smart replies |
| Conversation insights | 12h | Templates |
| AI preference settings | 8h | Insights |
| **Subtotal** | **68h** | |

**Deliverables:**
- AI-generated conversation summaries
- Suggested quick replies based on context
- Smart templates that fill in details
- Insights on response times and patterns
- User control over AI features

---

### Total Estimated Effort

| Phase | Duration | Effort | Dependencies |
|-------|----------|--------|--------------|
| Phase 1: Unified Inbox UI | 6 weeks | 112h | None |
| Phase 2: SMS/Email Integration | 6 weeks | 100h | Phase 1 |
| Phase 3: Context Linking | 4 weeks | 72h | Phase 2 |
| Phase 4: AI-Assisted Responses | 4 weeks | 68h | Phase 3 |
| **Total** | **20 weeks** | **352h** | |

**Resource:** 1-2 developers, 5-6 months

---

## Security Considerations

### Data Isolation

- Messages scoped to organization via Firestore rules
- External participants (clients, subs) only see their conversations
- Sensitive conversations can be restricted to specific roles

### Encryption

| Layer | Encryption | Notes |
|-------|------------|-------|
| In transit | TLS 1.3 | Firebase default |
| At rest | AES-256 | Firebase default |
| End-to-end | Optional | For sensitive projects (future) |

### Access Control

```javascript
// Firestore rules
match /organizations/{orgId}/conversations/{convId} {
  allow read: if isMember(orgId) && isParticipant(convId);
  allow write: if isMember(orgId) && isParticipant(convId);

  match /messages/{msgId} {
    allow read: if isMember(orgId) && isParticipant(convId);
    allow create: if isMember(orgId) && isParticipant(convId);
    allow update: if isMessageOwner(msgId);
    allow delete: if isMessageOwner(msgId) || isAdmin(orgId);
  }
}

function isParticipant(convId) {
  return request.auth.uid in get(/databases/$(database)/documents/
    organizations/$(orgId)/conversations/$(convId)).data.participants;
}
```

### Compliance

- SMS: TCPA compliance with opt-out handling
- Email: CAN-SPAM compliance with unsubscribe
- Data retention: Configurable retention policies
- Audit logging: All message events logged

### Abuse Prevention

- Rate limiting: 10 messages/minute per user
- Content filtering: Optional profanity filter
- Attachment limits: 10MB per file, 50MB per conversation
- Report/block functionality

---

## Open Questions

- [ ] Should clients see all project messages or filtered view?
- [ ] Message retention policy (30 days? 1 year? Indefinite?)
- [ ] Message editing allowed? Soft delete only?
- [ ] Voice/video calling integration? (Twilio Video, Daily.co)
- [ ] WhatsApp Business integration for international?
- [ ] AI cost allocation per organization?

---

## References

### Platform Documentation
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [FCM Architecture](https://firebase.google.com/docs/cloud-messaging/fcm-architecture)
- [Twilio SMS API](https://www.twilio.com/en-us/messaging/channels/sms)
- [SendGrid Email API](https://sendgrid.com/)

### Competitive Analysis Sources
- [Slack Review 2026](https://www.linktly.com/productivity-software/slack-review-2/)
- [Slack Architecture](https://systemdesign.one/slack-architecture/)
- [Microsoft Teams SMS Overview](https://learn.microsoft.com/en-us/microsoftteams/sms-overview)
- [Asana vs Monday 2025](https://zapier.com/blog/monday-vs-asana/)
- [Buildertrend vs Procore 2026](https://buildern.com/resources/blog/buildertrend-vs-procore/)

### Open Source Documentation
- [Rocket.Chat Pricing](https://www.rocket.chat/pricing)
- [Mattermost Pricing](https://mattermost.com/pricing/)
- [Zulip Plans](https://zulip.com/plans/)
- [Self-Hosted Chat Comparison](https://www.admin-magazine.com/Archive/2025/86/Zulip-Mattermost-and-Rocket.Chat)

### Construction Industry
- [Construction Site Communication Best Practices 2025](https://www.textline.com/blog/construction-site-communication)
- [Raken Messaging Features](https://www.rakenapp.com/features/messaging)
- [Construction Text Messaging Guide](https://www.eyrus.com/the-ultimate-guide-to-construction-text-messaging-software)

### Architecture Patterns
- [Unified Messaging Architecture](https://www.nextiva.com/blog/unified-messaging.html)
- [Notification System Design](https://www.systemdesignhandbook.com/guides/design-a-notification-system/)
- [Courier Channel Priority](https://www.courier.com/docs/platform/sending/channel-priority)
- [Twilio + SendGrid Best Practices](https://www.courier.com/blog/how-to-add-a-direct-twilio-sms-integration-with-sendgrid-emails)
