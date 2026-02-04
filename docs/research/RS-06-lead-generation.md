# RS-06: Lead Generation Platform Integration Research

**Research Date:** February 3, 2026
**Status:** Complete
**Priority:** High
**Scope:** Contractor lead generation platforms API integration analysis

---

## Executive Summary

This document provides comprehensive research on integrating seven major lead generation platforms with ContractorOS. The goal is to automatically import contractor leads into the ContractorOS CRM, enabling faster response times and centralized lead management.

### Key Findings

| Platform | API Available | Integration Method | Priority |
|----------|--------------|-------------------|----------|
| Meta (Facebook) Lead Ads | Yes - Full API | Direct API + Webhooks | **P1** |
| Thumbtack | Yes - Full API | OAuth + Webhooks | **P1** |
| Angi/HomeAdvisor | Yes - Partner API | Email to API (crmintegrations@angi.com) | **P2** |
| Google Business Profile | Yes - Restricted | API (requires approval) | **P2** |
| Nextdoor for Business | Yes - Ads API | GraphQL API + Conversion API | **P2** |
| Houzz Pro | Limited | Zapier Integration | **P3** |
| Yelp for Business | Yes - Partner Only | Leads API (advertising partners) | **P3** |

**Recommendation:** Start with Meta Lead Ads and Thumbtack due to robust APIs and real-time webhook support. These provide the best developer experience and fastest time-to-market. Consider Nextdoor as a strong P2 candidate due to its neighborhood-focused audience ideal for local contractors.

---

## Platform Comparison Matrix

| Feature | Meta Lead Ads | Thumbtack | Angi | Google Business | Nextdoor | Houzz Pro | Yelp |
|---------|--------------|-----------|------|-----------------|----------|-----------|------|
| **Public API** | Yes | Yes | Partner Only | Restricted | Yes (request access) | No | Partner Only |
| **Authentication** | OAuth 2.0 | OAuth 2.0 | API Key | OAuth 2.0 | OAuth 2.0 | N/A | API Key |
| **Real-time Webhooks** | Yes | Yes | Yes | Limited | Yes (CAPI) | Via Zapier | Yes |
| **Two-way Messaging** | Yes | Yes | Limited | Yes | Via Ads | No | Yes |
| **Lead Cost Model** | Ad spend | Per lead | Per lead | Free (organic) | Ad spend | Subscription | Advertising |
| **Zapier Support** | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| **Response Time SLA** | None | 4 hours recommended | None formal | None | None | None | None |
| **Developer Portal** | Excellent | Good | Basic | Good | Good | None | Good |

---

## Platform Deep Dives

### 1. Meta (Facebook) Lead Ads

**Overview:** Meta's Lead Ads allow contractors to capture leads directly from Facebook and Instagram ads with pre-filled contact forms.

#### API Availability

- **API:** Facebook Marketing API + Graph API + Conversions API (CAPI v2)
- **Documentation:** https://developers.facebook.com/docs/marketing-api/guides/lead-ads
- **Authentication:** OAuth 2.0 with page-level access tokens
- **Rate Limits:** Varies by app level; use page tokens for better limits

#### Lead Data Available

| Field | Availability | Notes |
|-------|--------------|-------|
| Full Name | Yes | Pre-filled from Facebook profile |
| Email | Yes | Pre-filled from Facebook profile |
| Phone | Yes | Pre-filled from Facebook profile |
| Address | Yes | Can be requested in form |
| Project Type | Yes | Custom question fields |
| Project Description | Yes | Custom question fields |
| Timeline | Yes | Custom question fields |
| Budget | Yes | Custom question fields |
| Preferred Contact Method | Yes | Custom question fields |

#### Integration Methods

1. **Direct Webhook Integration (Recommended)**
   - Subscribe to `leadgen` field on Facebook Page
   - Receive POST request within 3 seconds of form submission
   - Payload includes all form field values

2. **Graph API Polling**
   - Poll `/leadgen_forms/{form-id}/leads` endpoint
   - Returns JSON array of leads
   - 1-15 minute delay; less efficient than webhooks

3. **Zapier/Make Integration**
   - Quick setup without custom development
   - Trigger: New Lead in Facebook Lead Ads
   - Action: Create Client in ContractorOS

#### Webhook Payload Example

```json
{
  "entry": [{
    "id": "page_id",
    "time": 1706992800,
    "changes": [{
      "field": "leadgen",
      "value": {
        "form_id": "form_123",
        "leadgen_id": "lead_456",
        "created_time": 1706992800,
        "page_id": "page_id"
      }
    }]
  }]
}
```

Then fetch full lead data via Graph API:
```
GET /{leadgen_id}?fields=field_data,created_time,ad_id
```

#### Lead Response Requirements

- No formal SLA requirement
- Meta stores leads for 90 days only
- Real-time sync critical for data retention

#### Implementation Considerations

- Requires Facebook App with `leads_retrieval` and `pages_read_engagement` permissions
- Must verify business and complete app review for production access
- CAPI integration improves lead quality by sending conversion signals back to Meta

---

### 2. Thumbtack Pro

**Overview:** Thumbtack connects homeowners with local service professionals. Their Pro API enables direct lead transfer and two-way messaging.

#### API Availability

- **API:** Thumbtack Pro API (Negotiations + Messages)
- **Documentation:** https://developers.thumbtack.com/docs/
- **Authentication:** OAuth 2.0 authorization code flow
- **Access:** Request via developer portal

#### Lead Data Available

| Field | Availability | Notes |
|-------|--------------|-------|
| Customer Name | Yes | In lead payload |
| Phone | Yes | May be masked initially |
| Email | Limited | After customer engagement |
| Project Category | Yes | Service type requested |
| Project Description | Yes | Customer's project details |
| Location | Yes | ZIP code or city |
| Timeline | Yes | When project needed |
| Budget | Sometimes | If customer provides |
| Attachments | Yes | Photos/documents |

#### Integration Methods

1. **Webhook API (Recommended)**
   - Create webhook per business
   - Receive `NegotiationCreated` events for new leads
   - Receive `MessageCreated` events for customer messages

2. **Custom Lead Integration**
   - Configure in Thumbtack Pro settings
   - Forward leads to custom endpoint
   - Supports major CRMs

3. **Third-Party Platforms**
   - ServiceTitan, Jobber, GoSite have native integrations
   - Zapier available for custom workflows

#### Webhook Payload Structure

```json
{
  "leadID": "lead_123",
  "customerID": "cust_456",
  "businessID": "biz_789",
  "leadType": "instant_match",
  "leadPrice": 25.00,
  "chargeState": "Charged",
  "message": {
    "messageID": "msg_001",
    "createTimestamp": 1706992800,
    "text": "Looking for kitchen remodel quote",
    "attachments": [{
      "fileName": "kitchen_photo.jpg",
      "fileSize": 245678,
      "mimeType": "image/jpeg",
      "url": "https://..."
    }]
  }
}
```

#### Lead Response Requirements

- **4-hour response recommended** - affects search ranking
- **Top Pro status** requires fast response times
- 35-50% of jobs go to first responder
- Shared leads = multiple contractors compete

#### Implementation Considerations

- OAuth flow requires user consent per business
- Webhook authentication via username/password
- Two-way messaging enables in-app responses
- Lead costs vary by category ($15-$100+)

---

### 3. Angi (formerly HomeAdvisor)

**Overview:** Angi/HomeAdvisor is a major lead source for home service contractors, offering both exclusive and shared leads.

#### API Availability

- **API:** Partner API (not public)
- **Access:** Email crmintegrations@angi.com with account ID
- **Authentication:** API key + webhook URL
- **Setup Time:** ~72 business hours after request

#### Lead Data Available

| Field | Availability | Notes |
|-------|--------------|-------|
| Customer Name | Yes | Full name |
| Phone | Yes | May use temporary number |
| Email | Yes | Direct email |
| Address | Yes | Service location |
| Project Type | Yes | Category/service |
| Project Description | Yes | Customer's request |
| Timeline | Yes | When needed |
| Budget | Sometimes | If provided |

#### Integration Methods

1. **Direct API Integration**
   - Email crmintegrations@angi.com
   - Provide Angi account ID + webhook URL
   - Leads pushed automatically

2. **Zapier Webhook Integration**
   - Create Zapier webhook catch
   - Email webhook URL to Angi
   - Map fields to CRM

3. **Native CRM Integrations**
   - ServiceTitan, Jobber, Workiz, Contractor+
   - Pre-built connectors available

#### Lead Flow

```
Angi Lead Created
    |
    v
Angi API pushes to webhook
    |
    v
ContractorOS receives POST
    |
    v
Create Client + Opportunity
```

#### Lead Response Requirements

- No formal SLA
- Fast response improves conversion
- Privacy features may mask phone until customer opts in
- Lead costs: $15-$100+ per lead

#### Implementation Considerations

- Not a self-service API
- Requires contacting Angi support
- Some CRMs need Zapier intermediary
- $350/year listing fee + per-lead costs

---

### 4. Google Business Profile

**Overview:** Google Business Profile (GBP) drives significant local lead volume through search, maps, and messaging.

#### API Availability

- **APIs:** Business Profile API + Business Messages API
- **Documentation:** https://developers.google.com/my-business
- **Authentication:** OAuth 2.0
- **Access:** Restricted; requires application and approval

#### Lead Data Available

| Field | Availability | Notes |
|-------|--------------|-------|
| Customer Name | Via Messages | From conversation |
| Phone | Via Messages/Call | Click-to-call data |
| Email | Limited | If customer provides |
| Location | Via Insights | Search location data |
| Project Details | Via Messages | From conversation |

#### Integration Methods

1. **Business Messages API**
   - Real-time messaging with customers
   - Chatbot/automation support
   - Requires partner status for full access

2. **Business Profile API**
   - Manage reviews, posts, Q&A
   - Access messaging conversations
   - Notification callbacks

3. **Third-Party Platforms**
   - n8n, Pipedream, PinMeTo offer integrations
   - Automation of review responses, lead capture

#### 2026 Updates

- AI-generated Q&A system auto-answers common questions
- Enhanced Local Service Ads integration
- AR store tours for visual businesses
- Focus on engagement metrics for ranking

#### Lead Response Requirements

- No formal SLA
- Response time affects GBP ranking
- AI features can automate initial responses

#### Implementation Considerations

- API access approval can be challenging
- Primarily for large businesses/agencies
- Best for capturing messaging leads
- Combine with Local Service Ads for maximum impact

---

### 5. Houzz Pro

**Overview:** Houzz Pro is popular for design-build contractors, kitchen/bath remodelers, and interior designers.

#### API Availability

- **Public API:** Not available
- **Integration:** Via Zapier only
- **Custom Development:** Third-party services (Constacloud) offer custom API development

#### Lead Data Available

| Field | Availability | Notes |
|-------|--------------|-------|
| Lead Name | Yes | Via Zapier |
| Email | Yes | Via Zapier |
| Phone | Yes | Via Zapier |
| Project Type | Yes | From questionnaire |
| Project Description | Yes | From message/inquiry |
| Location | Yes | From lead form |
| Budget | Sometimes | Via questionnaire |
| Photos | Yes | Customer uploads |

#### Integration Methods

1. **Zapier Integration (Primary Method)**
   - Trigger: New Lead in Houzz Pro
   - Action: Create record in ContractorOS
   - Requires Houzz Pro + Zapier subscriptions

2. **Gmail Chrome Extension**
   - Sync emails to Houzz Pro
   - Add leads from Gmail
   - Quick-reply templates

3. **Email Import**
   - Forward lead emails to Houzz Pro
   - Manual import option

#### Available Zapier Actions

- Create Lead
- Create Project
- Trigger on new leads

#### Lead Response Requirements

- No formal SLA
- Email/mobile push notifications
- Daily digest option

#### Implementation Considerations

- No direct API limits flexibility
- Zapier adds cost and latency
- Best for design/remodel contractors
- Lead quality concerns reported by some users

---

### 6. Yelp for Business

**Overview:** Yelp is a major local search and review platform with business lead features.

#### API Availability

- **Fusion/Places API:** Public (business data, reviews)
- **Leads API:** Partner only (advertising partners)
- **Documentation:** https://docs.developer.yelp.com/docs/leads-api
- **Authentication:** API Key (Bearer token)

#### Lead Data Available (Leads API - Partner Only)

| Field | Availability | Notes |
|-------|--------------|-------|
| Customer Name | Yes | Lead contact |
| Phone | Yes | Lead phone |
| Email | Yes | Lead email |
| Project Type | Yes | Service category |
| Interaction History | Yes | All touchpoints |

#### Integration Methods

1. **Leads API (Advertising Partners)**
   - Webhook notifications for new leads
   - Read APIs: Get Lead, Get Interaction Events
   - Write APIs: Mark read, Reply, Mark replied externally
   - Only for businesses advertising on Yelp

2. **Yelp Fusion API (Public)**
   - Search businesses
   - Get business details
   - Read reviews
   - Not lead-specific

3. **Yelp AI API**
   - MCP (Model Context Protocol) integration
   - AI-powered queries
   - Real-time Yelp data in apps

#### Pricing

- Free tier: 500 calls/day
- Plus/Enterprise: 5,000+ calls/day
- Contact for higher volumes

#### Lead Response Requirements

- No formal SLA
- Fast response improves conversion

#### Implementation Considerations

- Leads API requires Yelp advertising relationship
- Fusion API useful for business data enrichment
- Not ideal for direct lead import unless advertising

---

### 7. Nextdoor for Business

**Overview:** Nextdoor is a neighborhood-focused social network ideal for local contractors. They offer lead generation ads and a Conversion API for tracking offline conversions.

#### API Availability

- **API:** Nextdoor Ads API (GraphQL) + Conversion API (CAPI)
- **Documentation:** https://developer.nextdoor.com/
- **Authentication:** OAuth 2.0
- **Access:** Request access via developer portal

#### Lead Data Available

| Field | Availability | Notes |
|-------|--------------|-------|
| Customer Name | Yes | Via lead form |
| Email | Yes | Via lead form |
| Phone | Yes | Via lead form |
| Neighborhood | Yes | Location data |
| Project Type | Yes | Custom form fields |
| Project Description | Yes | Custom form fields |

#### Integration Methods

1. **Nextdoor Ads API (Recommended)**
   - GraphQL-based API for campaign management
   - Create and manage lead generation ads
   - Access lead form submissions
   - Generate reports on ad performance

2. **Conversion API (CAPI)**
   - Track offline conversions from leads
   - Supported events: `conversion`, `lead`, `purchase`, `sign_up`
   - Custom conversion tracking (custom_conversion_1 through custom_conversion_10)
   - Unified mechanism for online and offline conversions

3. **Zapier Integration**
   - Connect Nextdoor to LeadConnector and other CRMs
   - Trigger: New lead submitted via Nextdoor
   - Action: Create lead in ContractorOS

#### Key API Resources

The Ads API grants access to:
- Profile management
- Advertiser accounts
- Campaign creation/updates
- Ad group management
- Ad creative management
- Media uploads
- Performance reports

#### Developer Access Process

1. Visit https://developer.nextdoor.com/
2. Request API access via the portal
3. After approval, generate access token at https://ads.nextdoor.com/v2/manage/api
4. Token valid for one week; must refresh regularly

#### Lead Response Requirements

- No formal SLA
- Neighborhood-focused audience expects local, responsive businesses
- Community trust important for conversion

#### Implementation Considerations

- Ideal for local/neighborhood marketing
- Strong for home services targeting specific areas
- CAPI useful for measuring offline conversions (in-home estimates, etc.)
- GraphQL queries provide flexible data retrieval
- Access token requires weekly refresh

---

## Recommended Integration Architecture

### Phase 1: Priority Platforms (Meta + Thumbtack)

```
                    +-------------------+
                    |   ContractorOS    |
                    |   Lead Ingestion  |
                    |      Service      |
                    +--------+----------+
                             |
           +-----------------+------------------+
           |                                    |
    +------v------+                     +-------v-------+
    | Meta Lead   |                     | Thumbtack     |
    | Ads Webhook |                     | Pro Webhook   |
    +-------------+                     +---------------+
           |                                    |
    Facebook/Instagram                   Thumbtack App
       Lead Forms                        Negotiations
```

### Phase 2: Secondary Platforms (Angi + GBP + Nextdoor)

```
    +-------------+           +---------------+           +---------------+
    | Angi Leads  |           | GBP Messages  |           | Nextdoor      |
    | Webhook/API |           | API Callback  |           | Ads API/CAPI  |
    +------+------+           +-------+-------+           +-------+-------+
           |                          |                           |
           +--------------------------+---------------------------+
                                      |
                              +-------v--------+
                              | ContractorOS   |
                              | Lead Service   |
                              +----------------+
```

### Phase 3: Tertiary Platforms (Houzz + Yelp)

```
    +-------------+                     +---------------+
    | Houzz Pro   |                     | Yelp Leads    |
    | via Zapier  |                     | (if partner)  |
    +------+------+                     +-------+-------+
           |                                    |
           +----------------+-------------------+
                            |
                    +-------v--------+
                    | ContractorOS   |
                    | Lead Service   |
                    +----------------+
```

---

## Data Mapping: Platform Fields to ContractorOS Client

### ContractorOS Client Schema

```typescript
interface LeadSource {
  platform: 'meta' | 'thumbtack' | 'angi' | 'google' | 'nextdoor' | 'houzz' | 'yelp';
  platformLeadId: string;
  platformCampaignId?: string;
  leadCost?: number;
  importedAt: Timestamp;
}

interface Client {
  // Standard fields
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;

  // Lead-specific
  source: 'lead-generation';
  leadSource: LeadSource;
  projectType?: string;
  projectDescription?: string;
  estimatedBudget?: number;
  preferredTimeline?: string;

  // Tracking
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  responseTime?: number; // seconds to first response
}
```

### Field Mapping Table

| ContractorOS Field | Meta Lead Ads | Thumbtack | Angi | GBP | Nextdoor | Houzz | Yelp |
|-------------------|---------------|-----------|------|-----|----------|-------|------|
| `firstName` | `field_data[first_name]` | `customerName` (parse) | `name` (parse) | Message name | Lead form | Lead name | `contact.name` |
| `lastName` | `field_data[last_name]` | `customerName` (parse) | `name` (parse) | Message name | Lead form | Lead name | `contact.name` |
| `email` | `field_data[email]` | After engagement | `email` | If provided | Lead form | Lead email | `contact.email` |
| `phone` | `field_data[phone_number]` | `phone` (may be masked) | `phone` | Click-to-call | Lead form | Lead phone | `contact.phone` |
| `address.street` | `field_data[street_address]` | N/A | `address` | N/A | N/A | Location | N/A |
| `address.city` | `field_data[city]` | Location | `address` | Search area | Neighborhood | Location | N/A |
| `address.zip` | `field_data[zip]` | ZIP | `zip` | N/A | Neighborhood | Location | N/A |
| `projectType` | Custom question | `category` | `serviceType` | Message context | Custom field | Questionnaire | `category` |
| `projectDescription` | Custom question | `message.text` | `description` | Message content | Custom field | Message | Interaction |
| `estimatedBudget` | Custom question | If provided | If provided | N/A | Custom field | Questionnaire | N/A |
| `preferredTimeline` | Custom question | `timeline` | `timeline` | N/A | Custom field | Questionnaire | N/A |
| `leadSource.platform` | `'meta'` | `'thumbtack'` | `'angi'` | `'google'` | `'nextdoor'` | `'houzz'` | `'yelp'` |
| `leadSource.platformLeadId` | `leadgen_id` | `leadID` | Lead ID | Message ID | Lead ID | Lead ID | Lead ID |
| `leadSource.leadCost` | N/A (ad spend) | `leadPrice` | Lead cost | N/A | N/A (ad spend) | N/A | N/A |

---

## Implementation Recommendations

### Priority 1: Meta Lead Ads + Thumbtack

**Why First:**
- Robust, well-documented APIs
- Real-time webhook support
- Two-way messaging capability
- Best developer experience
- Highest ROI platforms for contractors

**Implementation Steps:**

1. **Meta Lead Ads**
   - Create Facebook App
   - Request `leads_retrieval` permission
   - Set up webhook endpoint
   - Subscribe to page `leadgen` events
   - Implement lead fetch via Graph API
   - Optional: Add CAPI for conversion optimization

2. **Thumbtack**
   - Request API access via developer portal
   - Implement OAuth 2.0 flow
   - Create webhook per connected business
   - Handle `NegotiationCreated` + `MessageCreated` events
   - Implement two-way messaging

### Priority 2: Angi + Google Business Profile + Nextdoor

**Why Second:**
- Major lead volume for home services
- Requires more setup/approval time
- Less developer-friendly but high value
- Nextdoor offers neighborhood-focused local audience ideal for contractors

**Implementation Steps:**

1. **Angi**
   - Email crmintegrations@angi.com
   - Create webhook endpoint
   - Provide account ID + webhook URL
   - Wait 72 hours for activation
   - Test lead flow

2. **Google Business Profile**
   - Apply for API access
   - Implement OAuth flow
   - Set up Business Messages callbacks
   - Consider Local Service Ads integration

3. **Nextdoor**
   - Request API access at developer.nextdoor.com
   - Implement OAuth 2.0 flow
   - Set up Ads API integration for lead gen campaigns
   - Implement Conversion API for offline conversion tracking
   - Handle weekly token refresh

### Priority 3: Houzz Pro + Yelp

**Why Third:**
- Limited API availability
- Niche audiences
- Lower priority for general contractors

**Implementation Steps:**

1. **Houzz Pro**
   - Set up Zapier integration
   - Create webhook receiver
   - Map Zapier fields to ContractorOS

2. **Yelp**
   - Evaluate advertising partnership
   - If partner: implement Leads API
   - If not: use Fusion API for data enrichment

---

## Cost Considerations

| Platform | Setup Cost | Ongoing Cost | Lead Cost |
|----------|-----------|--------------|-----------|
| Meta Lead Ads | Free (API) | Ad spend | Varies by CPL |
| Thumbtack | Free (API) | Platform fees | $15-$100+/lead |
| Angi | $350/year | Platform fees | $15-$100+/lead |
| Google Business | Free (API) | Optional LSA spend | Free (organic) |
| Nextdoor | Free (API) | Ad spend | Varies by CPL |
| Houzz Pro | Free (Zapier) | Zapier + Houzz Pro subscription | Subscription included |
| Yelp | Free (Fusion) | Advertising required for Leads API | Advertising spend |

---

## Alternative Integration: Email Parsing

For platforms without robust APIs (or as a fallback), email parsing provides a universal integration method.

### How It Works

1. Lead platform sends notification email to contractor
2. Email forwarded to parser service (Mailparser, Parseur, or Zapier Email Parser)
3. Parser extracts structured data from email body
4. Webhook sends parsed data to ContractorOS API
5. Lead created in CRM automatically

### Recommended Tools

| Tool | Cost | Features | Best For |
|------|------|----------|----------|
| **Zapier Email Parser** | Free (with Zapier) | Template-based, integrates with Zapier ecosystem | Quick setup |
| **Mailparser** | $39+/month | Advanced rules, high volume | Enterprise |
| **Parseur** | $39+/month | Visual editor, no-code | Non-technical users |

### Email Parsing Flow

```
Lead Platform Email
        |
        v
Parser Inbox (forward or BCC)
        |
        v
Template Matching & Extraction
        |
        v
Webhook POST to ContractorOS
        |
        v
Create Client + Notification
```

### Use Cases

- **Houzz Pro** - Primary integration method (no direct API)
- **Angi** - Backup if webhook fails
- **Local directories** - Chamber of commerce, local listing sites
- **Website contact forms** - Gmail/Outlook lead emails
- **Phone services** - Voicemail transcription emails

### Implementation Considerations

- Requires email template creation per source
- ~30 second delay vs real-time webhooks
- Works with any email-based lead source
- Good fallback for API failures

---

## Competitor Analysis: How Others Handle Lead Import

### ServiceTitan

- **Native integrations**: Thumbtack, Angi, Google LSA
- **Approach**: Pre-built connectors with one-click setup
- **Notable**: Real-time lead notifications, automatic job creation
- **Lead tracking**: Full attribution from source to closed job

### Jobber

- **Native integrations**: Thumbtack, limited others
- **Approach**: Client hub + manual import
- **Notable**: Strong CRM but fewer lead source integrations
- **Zapier**: Available for additional sources

### Housecall Pro

- **Native integrations**: Google LSA, basic lead capture
- **Approach**: Web forms + Google Ads integration
- **Notable**: Review request automation post-job
- **Gap**: Fewer third-party lead platform integrations

### Buildertrend

- **Native integrations**: Website lead forms, CRM hub
- **Approach**: All-in-one from lead to invoice
- **Notable**: Full customer journey tracking
- **Gap**: Limited external lead platform APIs

### Key Takeaways for ContractorOS

1. **Start with top platforms** - ServiceTitan's success with Thumbtack/Angi validates priority
2. **Real-time is critical** - 35-50% of jobs go to first responder
3. **Attribution matters** - Track lead source to closed job
4. **One-click setup wins** - Pre-built connectors beat custom config
5. **Fallback options needed** - Email parsing for long tail

---

## Security Considerations

1. **OAuth Token Storage**
   - Store tokens securely (GCP Secret Manager)
   - Implement token refresh logic
   - Scope tokens to minimum required permissions

2. **Webhook Verification**
   - Validate webhook signatures (Meta, Thumbtack)
   - Use HTTPS endpoints only
   - Implement webhook authentication

3. **Data Privacy**
   - Handle PII according to privacy policies
   - Implement data retention policies
   - Support lead opt-out/deletion requests

4. **Rate Limiting**
   - Implement exponential backoff
   - Cache responses where appropriate
   - Monitor API usage

---

## Estimated Development Effort

| Platform | Complexity | Dev Days | Notes |
|----------|------------|----------|-------|
| **Meta Lead Ads** | Medium | 5-7 days | OAuth, webhook, Graph API |
| **Thumbtack** | Medium | 5-7 days | OAuth, webhooks, messaging |
| **Angi** | Low | 2-3 days | Webhook only, contact-based setup |
| **Google Business Profile** | High | 7-10 days | Approval process, complex API |
| **Nextdoor** | Medium | 4-6 days | GraphQL, CAPI integration |
| **Houzz Pro** | Low | 1-2 days | Zapier webhook only |
| **Yelp** | Medium | 3-5 days | Partner-only, conditional |
| **Email Parser (fallback)** | Low | 2-3 days | Template per source |

### Total Estimated Effort

- **Phase 1 (P1 platforms)**: 10-14 dev days
- **Phase 2 (P2 platforms)**: 13-19 dev days
- **Phase 3 (P3 platforms)**: 6-10 dev days
- **Total MVP**: ~29-43 dev days (6-9 weeks with 1 developer)

### Recommended Team

- 1 Backend Developer (API integrations, webhooks)
- 0.5 Frontend Developer (lead management UI)
- QA support for integration testing

---

## Next Steps

1. **Phase 1 (Weeks 1-4):**
   - [ ] Set up Meta Lead Ads webhook infrastructure
   - [ ] Implement Thumbtack OAuth + webhook integration
   - [ ] Create unified lead ingestion service
   - [ ] Build lead notification system (email + push)

2. **Phase 2 (Weeks 5-8):**
   - [ ] Contact Angi for API access
   - [ ] Apply for Google Business Profile API
   - [ ] Request Nextdoor API access
   - [ ] Implement secondary platform integrations
   - [ ] Add Nextdoor Conversion API for offline tracking

3. **Phase 3 (Weeks 9-12):**
   - [ ] Evaluate Houzz Pro Zapier integration
   - [ ] Assess Yelp advertising partnership value
   - [ ] Build lead analytics dashboard
   - [ ] Implement email parsing fallback for non-API platforms

---

## Sources

### Google Business Profile
- [Google Business Profile APIs | Google for Developers](https://developers.google.com/my-business)
- [Google Business Profile 2026 Updates | OAK Interactive](https://oakinteractive.com/whats-new-in-google-business-profile-the-2026-updates-you-cant-ignore/)
- [My Business Notifications API | Google for Developers](https://developers.google.com/my-business/reference/notifications/rest)
- [Business Messages API | Google for Developers](https://developers.google.com/business-communications/business-messages/reference/rest)

### Houzz Pro
- [Houzz Pro | GetApp](https://www.getapp.com/construction-software/a/houzz-pro/integrations/)
- [Houzz Pro Integrations | Zapier](https://zapier.com/apps/houzz-pro/integrations)
- [How to Integrate Zapier with Houzz Pro | Houzz](https://www.houzz.com/pro-help/r/how-to-integrate-zapier-with-houzz-pro)
- [Houzz Pro Lead Generation](https://pro.houzz.com/for-pros/feature-lead-generation)

### Angi/HomeAdvisor
- [Angi Leads Integration | Hatch](https://www.usehatchapp.com/knowledge/angi-leads-integration)
- [Angi Leads Integration | ServiceTitan](https://help.servicetitan.com/how-to/angi-leads-integration)
- [Setting up API Integration with Angi | Angi Help Center](https://intercom.help/angi/en/articles/10288125-setting-up-api-integration-with-angi)
- [Angi Leads Integration | Workiz](https://help.workiz.com/hc/en-us/articles/18054420625553-How-to-land-more-jobs-using-the-Angi-Leads-HomeAdvisor-Pro-integration)

### Thumbtack
- [Thumbtack Developer Portal](https://developers.thumbtack.com/)
- [Thumbtack API Reference](https://api.thumbtack.com/docs/)
- [Implementing the Thumbtack Leads API](https://developers.thumbtack.com/guides/2h0b5q80VWk2mEqqMduxuJ)
- [Thumbtack Messaging API](https://developers.thumbtack.com/guides/71p9Y1LY8UJG8wSrA5bfWa)
- [Thumbtack for Contractors | Jobber](https://www.getjobber.com/academy/thumbtack-for-contractors/)

### Yelp
- [Yelp Leads API Documentation](https://docs.developer.yelp.com/docs/leads-api)
- [Yelp Leads Webhooks](https://docs.developer.yelp.com/docs/leads-webhooks)
- [Yelp Fusion API | Yelp Data Licensing](https://business.yelp.com/data/products/fusion/)
- [Yelp Leads API - Zapier Integration](https://docs.developer.yelp.com/docs/leads-api-zapier-integration)

### Meta/Facebook
- [Facebook Lead Generation API Guide | LeadSync](https://leadsync.me/blog/meta-lead-gen-api-guide/)
- [Facebook Lead Ads API Essentials | Rollout](https://rollout.com/integration-guides/facebook-lead-ads/api-essentials)
- [Meta Conversions API for Lead Ads | Privyr](https://help.privyr.com/knowledge-base/meta-conversions-api/)
- [Top Facebook Lead Ads CRM Integrations | LeadsBridge](https://leadsbridge.com/blog/the-best-facebook-lead-ads-integrations-for-your-marketing-campaigns/)

### Nextdoor
- [Nextdoor for Developers](https://developer.nextdoor.com/)
- [Nextdoor Ads API](https://documenter.getpostman.com/view/12046385/T1LSAjx1)
- [Nextdoor Conversion API | Commanders Act](https://doc.commandersact.com/features/destinations/destinations-catalog/nextdoor-conversion-api)
- [Nextdoor Ads API Program Launch](https://about.nextdoor.com/press-releases/nextdoor-launches-ads-api-program-offering-advertisers-an-easier-way-to-extend-their-campaigns-to-nextdoor)
- [Nextdoor Developer Site Launch](https://about.nextdoor.com/press-releases/partnerships/nextdoor-launches-developer-site-to-connect-partners-with-the-power-of-local)

### Competitor Research
- [HouseCall Pro vs Jobber vs ServiceTitan | Contractor+](https://contractorplus.app/blog/housecall-pro-vs-jobber-vs-servicetitan)
- [Buildertrend vs Procore | Buildern](https://buildern.com/resources/blog/buildertrend-vs-procore/)
- [Thumbtack vs Angi | Topline Pro](https://www.toplinepro.com/blog/thumbtack-vs-angi)

### Email Parsing & Integration
- [Email Parser Lead Capture | Mailparser](https://mailparser.io/case-studies/lead-capturing/)
- [Zapier Email Parser for Lead Integration](https://help.realvolve.com/hc/en-us/articles/360034035192-How-to-Set-up-an-Email-Parser-for-Zapier-Lead-Integration)
- [Parseur Email to CRM](https://parseur.com/use-case/emails-to-crm)
