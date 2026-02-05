# Epic: Lead Generation Integration Platform

> **Version:** 1.0
> **Created:** 2026-01-31
> **Status:** BACKLOG
> **Priority:** P1 (Strategic Differentiator)
> **Estimated Size:** XL (16-20 weeks)
> **Business Value:** "Killer feature" - eliminates manual data entry across lead platforms

---

## Executive Summary

This epic covers the integration of major lead generation platforms into ContractorOS, creating a unified lead management hub that eliminates the need for contractors to manually transfer data between platforms. This includes:

1. **Lead Source Integrations** - Thumbtack, Angi, Google LSA, Meta Lead Ads, and others
2. **Website Builder** - White-label website creation for contractors
3. **Unified Lead Dashboard** - Single view of all leads across platforms
4. **Ad Spend Visibility** - Where supported, aggregate ad performance data
5. **Website Lead Capture** - Embed forms, chatbots, and tracking

---

## Strategic Value

### Why This Is a "Killer Feature"

Contractors currently:
- Log into 5-7 different platforms daily to check leads
- Manually copy/paste lead information into their CRM
- Lose leads due to slow response times (speed to lead is critical)
- Have no unified view of marketing ROI across channels
- Pay for duplicate CRM features in each platform

**ContractorOS Solution:**
- Single inbox for ALL leads from ALL sources
- Automatic lead creation in our CRM
- Real-time notifications via push/SMS
- Marketing ROI dashboard showing cost-per-lead by source
- Two-way messaging without leaving the platform

### Competitive Advantage

| Competitor | Lead Integrations | Our Advantage |
|------------|-------------------|---------------|
| ServiceTitan | 5+ native (expensive) | More sources, lower cost |
| Housecall Pro | 3 native | Better UX, website builder |
| Jobber | 2 native + Zapier | Direct integrations, no Zapier fees |
| JobNimbus | Zapier only | Native integrations |

---

## Platform API Research Summary

### Tier 1: Full Integration Possible

| Platform | API Type | Lead Access | Messaging | Ad Management | Webhooks |
|----------|----------|-------------|-----------|---------------|----------|
| **Thumbtack** | Partner API | Yes | Yes (2-way) | No | Yes |
| **Angi/HomeAdvisor** | Webhook | Yes | No | No | Yes |
| **Google LSA** | Google Ads API | Yes | Limited | Yes (budget/bidding) | Yes |
| **Meta Lead Ads** | Marketing API | Yes | N/A | Yes | Yes |
| **Google Business Profile** | GBP API | Limited | No (deprecated) | N/A | No |

### Tier 2: Zapier/Webhook Integration

| Platform | Integration Method | Lead Access | Notes |
|----------|-------------------|-------------|-------|
| **Houzz Pro** | Zapier (one-way IN) | Import only | Cannot export leads |
| **Bark** | Zapier webhook | Yes | Pay-per-lead model |
| **Nextdoor** | Zapier + Partnership | Yes | Requires approval |
| **Porch** | Partnership required | Partner only | No public API |

### Tier 3: Regional/Specialty

| Platform | Region | Integration | Notes |
|----------|--------|-------------|-------|
| **Checkatrade** | UK | Official API | For UK expansion |
| **HomeStars** | Canada | Third-party aggregator | For Canada expansion |
| **Yelp** | US | Partner-only | Requires contracted partnership |

---

## Feature Breakdown

### Phase 1: Lead Inbox Foundation (4 weeks)

#### LEAD-001: Unified Lead Inbox
**Priority:** P0 | **Size:** L (2 weeks)

Create the core lead management interface that aggregates leads from all sources.

**Features:**
- Lead list view with source icons (Thumbtack, Angi, Google, etc.)
- Lead detail panel with full information
- Status workflow: New → Contacted → Qualified → Won/Lost
- Quick actions: Call, Text, Email, Create Project
- Filters: Source, Status, Date Range, Assignment
- Sort: Newest, Response Time, Value
- Search across all lead fields

**Schema:**
```typescript
interface Lead {
  id: string;
  organizationId: string;

  // Source tracking
  source: LeadSource;
  sourceLeadId: string;  // External platform's lead ID
  sourceMetadata: Record<string, any>;

  // Contact info
  contact: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    phoneMasked?: boolean;  // Angi masks numbers
    phoneExpiration?: Date;
  };

  // Location
  address?: {
    street?: string;
    city: string;
    state: string;
    zip: string;
  };

  // Project details
  category: string;  // e.g., "Bathroom Remodel"
  description: string;
  details: LeadDetail[];  // Q&A from intake

  // Timing
  timeline?: string;  // "ASAP", "1-2 weeks", etc.
  preferredSchedule?: {
    date?: Date;
    timeSlot?: string;
  };

  // Platform-specific
  leadCost?: number;  // What we paid for this lead
  leadType?: string;  // instant_book, request_quote, etc.

  // Workflow
  status: LeadStatus;
  assignedTo?: string;
  priority: 'high' | 'medium' | 'low';

  // Conversion
  convertedToClientId?: string;
  convertedToProjectId?: string;

  // Activity
  lastContactedAt?: Date;
  responseTimeSeconds?: number;

  // Timestamps
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

type LeadSource =
  | 'thumbtack'
  | 'angi'
  | 'google_lsa'
  | 'google_gbp'
  | 'meta_lead_ads'
  | 'houzz'
  | 'bark'
  | 'nextdoor'
  | 'porch'
  | 'website'
  | 'referral'
  | 'manual';

type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal_sent'
  | 'won'
  | 'lost'
  | 'unresponsive';

interface LeadDetail {
  question: string;
  answer: string;
}
```

**Files:**
```
apps/web/types/leads.ts
apps/web/lib/hooks/useLeads.ts
apps/web/app/dashboard/leads/page.tsx
apps/web/app/dashboard/leads/[id]/page.tsx
apps/web/components/leads/
├── LeadList.tsx
├── LeadCard.tsx
├── LeadDetail.tsx
├── LeadStatusBadge.tsx
├── LeadSourceIcon.tsx
├── LeadFilters.tsx
├── LeadConvertModal.tsx
└── index.ts
```

**Firestore:**
```
organizations/{orgId}/leads/{leadId}
```

---

#### LEAD-002: Lead Webhook Infrastructure
**Priority:** P0 | **Size:** M (1 week)

Build the webhook receiver infrastructure to accept leads from external platforms.

**Features:**
- Secure webhook endpoints per platform
- Signature verification (HMAC, API key)
- Payload parsing and normalization
- Duplicate detection
- Error handling and retry queue
- Webhook logs for debugging

**Files:**
```
apps/web/app/api/webhooks/
├── thumbtack/route.ts
├── angi/route.ts
├── meta/route.ts
└── generic/route.ts

apps/web/lib/webhooks/
├── verify-signature.ts
├── normalize-lead.ts
├── duplicate-check.ts
└── types.ts
```

---

#### LEAD-003: Real-Time Lead Notifications
**Priority:** P0 | **Size:** S (1 week)

Instant notifications when new leads arrive.

**Features:**
- Push notifications (browser/PWA)
- SMS notification option
- Email notification option
- Sound alerts in dashboard
- Notification preferences per source
- "Speed to lead" timer display

**Integration with existing SMS module:**
- Use existing Twilio infrastructure
- New lead notification template
- Link to respond directly

---

### Phase 2: Platform Integrations (6 weeks)

#### LEAD-010: Thumbtack Integration
**Priority:** P0 | **Size:** L (2 weeks)

Full integration with Thumbtack Partner API.

**Requirements:**
- Apply for Thumbtack Partner API access
- Contact: teampartnerships@thumbtack.com
- Sign Pro API Terms of Use Agreement

**Features:**
- OAuth 2.0 connection flow
- Lead webhook receiver
- Two-way messaging integration
- Lead feedback submission
- Business listing sync
- Review notifications

**API Capabilities:**
| Feature | Supported |
|---------|-----------|
| Receive leads | Yes (webhook) |
| Send messages | Yes |
| Receive messages | Yes |
| Submit lead feedback | Yes |
| Manage budget | No |
| Access reviews | Yes |

**Implementation:**
```
apps/web/lib/integrations/thumbtack/
├── client.ts           # API client
├── oauth.ts            # OAuth flow
├── webhooks.ts         # Webhook handlers
├── messaging.ts        # Two-way messaging
├── types.ts            # Thumbtack types
└── index.ts

apps/web/app/api/integrations/thumbtack/
├── callback/route.ts   # OAuth callback
├── webhook/route.ts    # Lead webhook
└── message/route.ts    # Message webhook

functions/src/integrations/thumbtack/
├── processLead.ts      # Lead processing
├── sendMessage.ts      # Send message
└── index.ts
```

**Settings UI:**
- Connect/Disconnect button
- Account selector (for multi-business)
- Notification preferences
- Lead auto-assignment rules

---

#### LEAD-011: Angi/HomeAdvisor Integration
**Priority:** P0 | **Size:** M (1.5 weeks)

Webhook-based integration with Angi Leads.

**Requirements:**
- Email: crmintegrations@angi.com
- Provide webhook URL and account number
- API Key authentication

**Features:**
- Lead webhook receiver
- Lead field mapping
- Phone number handling (masked numbers)
- Appointment sync
- TrustedForm compliance data

**API Capabilities:**
| Feature | Supported |
|---------|-----------|
| Receive leads | Yes (webhook) |
| Send messages | No |
| Access reviews | No |
| Manage ads | No |

**Lead Payload Fields:**
- Contact info (may be masked)
- Service category
- Project details (Q&A)
- Lead fee amount
- Appointment info
- Compliance data

**Implementation:**
```
apps/web/lib/integrations/angi/
├── client.ts
├── webhooks.ts
├── field-mapping.ts
├── types.ts
└── index.ts

apps/web/app/api/integrations/angi/
└── webhook/route.ts
```

---

#### LEAD-012: Google Local Services Ads Integration
**Priority:** P0 | **Size:** L (2 weeks)

Integration with Google Ads API for LSA campaigns.

**Requirements:**
- Google Ads API Developer Token
- OAuth 2.0 setup (client ID + secret)
- Access to customer's LSA account

**Features:**
- Lead retrieval via API
- Call recording access
- Budget management
- Bidding strategy control
- Performance reporting
- Lead feedback submission

**API Capabilities:**
| Feature | Supported |
|---------|-----------|
| Retrieve leads | Yes |
| Call recordings | Yes |
| Manage budget | Yes |
| Bidding control | Yes |
| Campaign status | Yes |
| Create campaigns | No |

**Implementation:**
```
apps/web/lib/integrations/google-lsa/
├── client.ts
├── oauth.ts
├── leads.ts
├── campaigns.ts
├── reporting.ts
├── types.ts
└── index.ts

apps/web/app/api/integrations/google/
├── callback/route.ts
├── leads/route.ts
└── campaigns/route.ts

functions/src/integrations/google-lsa/
├── fetchLeads.ts       # Scheduled lead fetch
├── syncCampaigns.ts    # Campaign sync
└── index.ts
```

**Settings UI:**
- Google account connection
- LSA account selector
- Budget visibility toggle
- Lead sync frequency
- Notification preferences

---

#### LEAD-013: Meta Lead Ads Integration
**Priority:** P1 | **Size:** M (1 week)

Facebook/Instagram Lead Ads integration.

**Requirements:**
- Meta Marketing API access
- Facebook Page Admin access
- Business Manager verification

**Features:**
- Real-time lead webhooks
- Lead form data sync
- Custom audience sync (future)
- Ad performance data

**Implementation:**
```
apps/web/lib/integrations/meta/
├── client.ts
├── oauth.ts
├── webhooks.ts
├── leads.ts
├── types.ts
└── index.ts

apps/web/app/api/integrations/meta/
├── callback/route.ts
└── webhook/route.ts
```

---

#### LEAD-014: Google Business Profile Integration
**Priority:** P2 | **Size:** S (3 days)

Limited integration for GBP review monitoring.

**Note:** GBP chat/messaging was deprecated in 2024. Q&A API deprecated November 2025.

**Features:**
- Review monitoring
- Review reply capability
- Business info sync

**Limitations:**
- No lead capture (messaging deprecated)
- Access approval is difficult
- Limited to review management

---

### Phase 3: Website Builder (4 weeks)

#### LEAD-020: White-Label Website Platform
**Priority:** P1 | **Size:** XL (4 weeks)

Enable contractors to build and host their own websites within ContractorOS.

**Recommended Approach: Duda White-Label**

After extensive research, **Duda** is the recommended platform:
- Full white-label capability
- Proven SaaS integration
- SSO support
- Complete API
- $149/month + $17/site

**Alternative: Build with Payload CMS**
- Open-source, self-hosted
- Full control
- Higher development cost
- More maintenance burden

**Features:**
- Template gallery (contractor-specific)
- Drag-and-drop editor
- Mobile-responsive
- Custom domain support
- SSL certificates
- Lead capture forms (integrated with Lead Inbox)
- SEO tools
- Analytics

**Integration Points:**
- Website form submissions → Lead Inbox
- Client portal links from website
- Project gallery from photos
- Review widget from client feedback
- Estimate request → Create Lead

**Implementation Options:**

**Option A: Duda Integration (Recommended)**
```
apps/web/lib/integrations/duda/
├── client.ts           # Duda API client
├── sso.ts              # Single sign-on
├── sites.ts            # Site management
├── templates.ts        # Template sync
└── types.ts

apps/web/app/dashboard/website/
├── page.tsx            # Website management
├── editor/page.tsx     # Embedded Duda editor
├── analytics/page.tsx  # Website analytics
└── templates/page.tsx  # Template gallery
```

**Option B: Self-Hosted (Payload CMS)**
```
apps/web/lib/website-builder/
├── payload-config.ts
├── collections/
│   ├── pages.ts
│   ├── media.ts
│   └── forms.ts
├── blocks/
│   ├── hero.ts
│   ├── services.ts
│   ├── gallery.ts
│   ├── testimonials.ts
│   └── contact-form.ts
└── themes/

apps/builder/                # Separate Next.js app for builder
├── app/
├── components/
└── lib/
```

**Pricing Model:**
- Include basic site in platform subscription
- Premium templates: one-time fee
- Custom domain: included
- Additional sites: $10/month each

---

#### LEAD-021: Website Lead Capture Forms
**Priority:** P1 | **Size:** M (1 week)

Embed lead capture forms on contractor websites.

**Features:**
- Drag-and-drop form builder
- Multi-step forms
- Conditional logic
- File uploads (project photos)
- Custom fields
- Form analytics
- Spam protection (reCAPTCHA)
- Email notifications

**Form Types:**
- Contact form
- Estimate request
- Appointment booking
- Project inquiry

**Implementation:**
```
apps/web/components/website/
├── FormBuilder.tsx
├── FormField.tsx
├── FormPreview.tsx
├── EmbedCode.tsx
└── index.ts

apps/web/app/api/public/lead-form/route.ts  # Public endpoint
```

---

#### LEAD-022: Website Chat Widget
**Priority:** P2 | **Size:** S (1 week)

Live chat widget for contractor websites.

**Features:**
- Embed code for any website
- Offline message collection
- Business hours awareness
- Mobile-friendly
- Typing indicators
- File sharing
- Quick replies

**Integration:**
- Messages sync with Communication Hub
- Lead creation from chat
- SMS fallback for offline

---

### Phase 4: Advanced Features (4 weeks)

#### LEAD-030: Marketing ROI Dashboard
**Priority:** P1 | **Size:** M (2 weeks)

Unified view of marketing performance across all lead sources.

**Metrics:**
- Leads by source
- Cost per lead by source
- Conversion rate by source
- Revenue by source (when linked to projects)
- Response time by source
- Lead quality score

**Visualizations:**
- Lead funnel by source
- Cost trends over time
- Source comparison charts
- Geographic heat map
- Best performing times

**Data Sources:**
- Lead Inbox data
- Thumbtack lead costs
- Angi lead fees
- Google LSA spend
- Meta Ads spend
- Linked project revenue

**Implementation:**
```
apps/web/app/dashboard/marketing/
├── page.tsx            # Marketing dashboard
├── sources/page.tsx    # Source comparison
├── roi/page.tsx        # ROI analysis
└── reports/page.tsx    # Custom reports

apps/web/components/marketing/
├── LeadFunnel.tsx
├── SourceComparison.tsx
├── CostTrends.tsx
├── ROICalculator.tsx
└── index.ts
```

---

#### LEAD-031: Lead Scoring & Auto-Assignment
**Priority:** P2 | **Size:** M (1 week)

Intelligent lead prioritization and routing.

**Scoring Factors:**
- Lead source quality (historical conversion)
- Project value estimate
- Location (travel distance)
- Timeline urgency
- Detail completeness
- Response to similar projects

**Auto-Assignment Rules:**
- Round-robin
- Weighted by capacity
- By service category
- By location/territory
- By performance (top closers get hot leads)

---

#### LEAD-032: Two-Way Messaging Hub
**Priority:** P1 | **Size:** M (1 week)

Unified messaging across platforms that support it.

**Supported Platforms:**
- Thumbtack (native)
- Website chat
- SMS (existing)
- Email

**Features:**
- Single conversation view per lead
- Platform indicator on messages
- Template quick replies
- Attachment support
- Read receipts (where available)

---

### Phase 5: Zapier Integration (2 weeks)

#### LEAD-040: Zapier App
**Priority:** P2 | **Size:** M (2 weeks)

Create a Zapier integration for platforms without direct APIs.

**Triggers:**
- New Lead Created
- Lead Status Changed
- Lead Converted to Project
- New Message Received

**Actions:**
- Create Lead
- Update Lead Status
- Add Note to Lead
- Assign Lead

**Searches:**
- Find Lead by Email/Phone
- Find Lead by Source ID

**Use Cases:**
- Houzz Pro → ContractorOS (one-way)
- Bark → ContractorOS
- Any other lead source

---

## Technical Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      External Lead Sources                       │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────┤
│ Thumbtack│   Angi   │Google LSA│   Meta   │  Houzz   │ Website │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬────┘
     │          │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Webhook/API Gateway                           │
│  - Signature verification                                        │
│  - Rate limiting                                                 │
│  - Payload normalization                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Lead Processing Pipeline                      │
│  - Duplicate detection                                           │
│  - Field mapping                                                 │
│  - Enrichment                                                    │
│  - Scoring                                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Firestore                                 │
│  organizations/{orgId}/leads/{leadId}                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
     ┌───────────┐    ┌───────────┐    ┌───────────┐
     │Lead Inbox │    │Notifications│   │ Messaging │
     │    UI     │    │   System   │    │   Hub     │
     └───────────┘    └───────────┘    └───────────┘
```

### Security Considerations

1. **Webhook Security**
   - HMAC signature verification (platform-specific)
   - API key validation
   - IP allowlisting where possible
   - Rate limiting

2. **OAuth Token Storage**
   - Encrypt tokens at rest
   - Use GCP Secret Manager
   - Automatic token refresh

3. **Data Privacy**
   - Lead data scoped to organization
   - PII handling compliance
   - Data retention policies

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
- [ ] Lead types and schema
- [ ] Lead Inbox UI
- [ ] Webhook infrastructure
- [ ] Notification system

### Phase 2: Core Integrations (Weeks 5-10)
- [ ] Thumbtack integration
- [ ] Angi integration
- [ ] Google LSA integration
- [ ] Meta Lead Ads integration

### Phase 3: Website Builder (Weeks 11-14)
- [ ] Duda white-label setup OR Payload CMS build
- [ ] Template gallery
- [ ] Lead capture forms
- [ ] Chat widget

### Phase 4: Advanced Features (Weeks 15-18)
- [ ] Marketing ROI dashboard
- [ ] Lead scoring
- [ ] Two-way messaging hub
- [ ] Zapier app

### Phase 5: Polish & Launch (Weeks 19-20)
- [ ] Documentation
- [ ] Onboarding flow
- [ ] Beta testing
- [ ] Marketing materials

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Lead response time | < 5 minutes | Time from receipt to first contact |
| Lead conversion rate | 25%+ | Leads → Projects |
| Platform connections | 3+ per user | Active integrations |
| Website adoption | 30% of users | Users with active website |
| Daily active usage | 80%+ | Users checking leads daily |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Partner API access denied | High | Start with Zapier fallback, build relationships |
| Thumbtack changes API | Medium | Abstract API layer, monitor changes |
| Duda pricing increases | Medium | Have Payload CMS as backup option |
| Integration complexity | High | Phased rollout, start with 2-3 platforms |
| User adoption | Medium | Strong onboarding, show clear ROI |

---

## Resource Requirements

### Development
- 2 full-stack developers
- 1 designer (templates, UI)
- 16-20 weeks

### External Costs
| Item | Cost | Frequency |
|------|------|-----------|
| Duda White Label | $149 + $17/site | Monthly |
| Google Ads API | Free | N/A |
| Twilio (notifications) | Existing | Monthly |
| Zapier Partner | Free tier | Monthly |

### Partner Applications
- Thumbtack Partner API
- Meta Marketing API
- Google Ads API Developer Token
- Duda Partner Program

---

## Appendix: Platform-Specific Documentation

### Thumbtack
- Developer Portal: https://developers.thumbtack.com/
- Partner Contact: teampartnerships@thumbtack.com
- OAuth Scope: `messages`, `availability`, `bookings`, `targeting`

### Angi
- CRM Integration: crmintegrations@angi.com
- Pro Support: prosupport@angi.com
- Business Center: https://office.angi.com

### Google LSA
- Developer Docs: https://developers.google.com/local-services-ads
- Google Ads API: https://developers.google.com/google-ads/api

### Meta
- Marketing API: https://developers.facebook.com/docs/marketing-api
- Lead Ads: https://developers.facebook.com/docs/marketing-api/guides/lead-ads

### Duda
- White Label: https://www.duda.co/website-builder/white-label
- API Docs: https://developer.duda.co/
- Partner Contact: partners@duda.co

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-31 | 1.0 | Initial epic scope document |
