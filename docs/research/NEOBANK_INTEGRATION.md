# Neobank Integration Research

**Author:** CLI 4 (Research Worker)
**Date:** 2026-02-02
**Status:** Draft
**Sprint:** 39
**Issue:** #52

---

## Executive Summary

This document evaluates neobank and corporate card integrations for ContractorOS to enable expense tracking, transaction categorization, and receipt matching for construction businesses. After evaluating Brex, Ramp, Mercury, Relay, and BlueVine, we recommend a **tiered approach**:

1. **Primary: Ramp** — Best expense management features with 95% same-day receipt matching
2. **Secondary: Mercury** — Best for banking automation with robust API
3. **Alternative: Brex** — Strong for startups with new AI-native accounting API (Jan 2026)

The construction industry benefits most from receipt matching and expense categorization, making Ramp's automation capabilities particularly valuable. For pure banking operations, Mercury's developer-friendly API provides the best flexibility.

---

## Requirements

### Business Requirements

- Automatic expense categorization for construction costs
- Receipt capture and matching to transactions
- Real-time transaction webhooks
- Category mapping to project cost codes
- Sync with QuickBooks/accounting
- Support for multiple cards per organization

### Technical Requirements

- REST API with JSON responses
- OAuth 2.0 or API key authentication
- Webhook support for real-time updates
- React/Next.js compatibility
- Sandbox/testing environment
- Rate limiting appropriate for our scale

---

## Options Evaluated

| Provider | Primary Use | API Maturity | Receipt Matching | Cost | Recommendation |
|----------|-------------|--------------|------------------|------|----------------|
| **Ramp** | Expense Mgmt | High | 95% same-day | Free* | Primary |
| **Mercury** | Banking | High | Via integrations | Free** | Secondary |
| **Brex** | Corp Cards | High | AI-powered | Free* | Alternative |
| **Relay** | SMB Banking | Medium | Via Plaid/Yodlee | Free-$30/mo | Specialized |
| **BlueVine** | SMB Banking | Low | Limited | Free | Not recommended |

*Corporate card products typically free; revenue from interchange
**Banking products typically free; revenue from deposits

---

## Detailed Analysis

### Option A: Ramp (Primary Recommendation)

**Overview:** Expense management platform with corporate cards, known for best-in-class receipt automation.

#### Key Strengths

| Feature | Capability |
|---------|------------|
| **Receipt Matching** | 95% matched same-day, OCR-powered |
| **Auto-categorization** | ML-driven expense coding |
| **Real-time sync** | Instant transaction visibility |
| **API Access** | Full OpenAPI spec available |
| **QuickBooks Sync** | 5-minute setup |

#### API Capabilities

```javascript
// Ramp API endpoints (docs.ramp.com)
GET  /developer/v1/transactions     // List transactions
GET  /developer/v1/transactions/:id // Transaction details
POST /developer/v1/receipts         // Upload receipt
GET  /developer/v1/cards            // List cards
GET  /developer/v1/users            // List cardholders

// Webhook events
- transaction.created
- transaction.updated
- receipt.matched
- card.created
```

#### Receipt Matching

Ramp's OCR-powered system:
1. Identifies merchant, amount, date
2. Matches to correct transaction
3. 95% matched same day
4. Auto-retry for 7 days

**Submission methods:**
- Email: receipts@ramp.com
- Mobile app (iOS/Android)
- Slack integration
- SMS (text to Ramp)
- API upload

#### Integration Pattern

```typescript
// Example: Sync Ramp transactions to project
interface RampTransaction {
  id: string;
  amount: number;
  merchant_name: string;
  category_name: string;
  receipt_id?: string;
  memo?: string;
  transaction_date: string;
}

// Webhook handler
async function handleRampWebhook(event: RampWebhookEvent) {
  if (event.type === 'transaction.created') {
    await syncTransactionToProject(event.data);
  }
}
```

#### Pricing

- Corporate cards: Free (interchange revenue)
- Expense management: Included
- API access: Included
- Enterprise features: Custom pricing

---

### Option B: Mercury (Secondary Recommendation)

**Overview:** Modern business banking with excellent developer API, popular with startups and tech companies.

#### Key Strengths

| Feature | Capability |
|---------|------------|
| **API Banking** | Full banking operations via API |
| **Automation** | Payouts, reconciliation, monitoring |
| **Developer DX** | Clear docs, easy authentication |
| **FDIC Insured** | Via partner banks |
| **Free** | No monthly fees |

#### API Capabilities

```javascript
// Mercury API endpoints (mercury.com/api)
GET  /api/v1/accounts              // List accounts
GET  /api/v1/accounts/:id/transactions  // Transaction history
POST /api/v1/accounts/:id/transactions  // Initiate payment
GET  /api/v1/recipients            // Payment recipients

// Available via Pipedream/Zapier:
- New transaction triggers
- Account balance monitoring
- Payment automation
```

#### Integration Pattern

```typescript
// Automate Mercury → Accounting sync
interface MercuryTransaction {
  id: string;
  amount: number;
  counterparty: string;
  kind: 'credit' | 'debit';
  status: 'pending' | 'sent' | 'completed';
  created_at: string;
}

// Watch for new transactions
async function syncMercuryTransactions() {
  const transactions = await mercury.getTransactions({
    account_id: ACCOUNT_ID,
    start_date: lastSync,
  });

  for (const txn of transactions) {
    await recordToFirestore(txn);
    await syncToQuickBooks(txn);
  }
}
```

#### Pricing

- Checking accounts: Free
- Debit cards: Free
- API access: Included
- Wire transfers: $5 domestic, $20 international

---

### Option C: Brex (Alternative)

**Overview:** Corporate card and expense platform focused on startups, with new AI-native accounting API (Jan 2026).

#### Key Strengths

| Feature | Capability |
|---------|------------|
| **AI Coding** | Auto-suggest expense fields |
| **Real-time ERP Sync** | Two-way data flow |
| **Virtual Cards** | Instant creation via API |
| **Spend Controls** | Per-card limits, categories |
| **Travel** | Built-in travel booking |

#### 2026 AI-Native API (New)

Brex announced AI-native Accounting API (Jan 2026):
- Two-way ERP data flow
- AI-driven expense coding
- Pattern recognition for auto-rules
- Real-time sync vs. traditional bank feeds

```javascript
// Brex API capabilities
POST /v2/cards              // Create virtual card
PUT  /v2/cards/:id/limits   // Update spend limits
GET  /v2/expenses           // List expenses
POST /v2/transfers          // Initiate payment

// Webhook events
- expense.created
- expense.updated
- card.transaction
```

#### Pricing

- Corporate cards: Free
- Premium features: Tiered pricing
- API access: Included

---

### Option D: Relay Financial

**Overview:** Small business banking built for teams, with profit-first accounting support.

#### Features

| Feature | Capability |
|---------|------------|
| **Sub-accounts** | Up to 20 under main login |
| **QuickBooks/Xero** | Native integration |
| **Gusto Payroll** | Direct connection |
| **Plaid/Yodlee** | Third-party data access |
| **Sandbox** | Developer testing environment |

#### API Status

- Native integrations: Strong
- Public API: Limited (via Plaid/Yodlee)
- 2026 Roadmap: Open Banking API expansion

#### Pricing

- Basic: Free
- Pro: $30/month (additional features, free wires)

---

### Option E: BlueVine

**Overview:** SMB banking with high-yield checking, limited API capabilities.

#### Features

| Feature | Capability |
|---------|------------|
| **Interest** | 1.30% on balances up to $250K |
| **FDIC** | Up to $3M via IntraFi |
| **QuickBooks** | Native integration |
| **Invoicing** | Stripe-powered payment links |

#### API Status

- Public API: Limited/not documented
- Integrations: Via native connections only
- Developer resources: Minimal

**Not recommended** for custom integrations due to limited API access.

---

## Recommendation

### Integration Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    ContractorOS                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │     Ramp      │  │    Mercury    │  │     Brex      │   │
│  │  (Expenses)   │  │   (Banking)   │  │ (Alternative) │   │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘   │
│          │                  │                  │            │
│          ▼                  ▼                  ▼            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │           Unified Transaction Layer                   │ │
│  │  - Category mapping to projects                       │ │
│  │  - Receipt attachment                                 │ │
│  │  - QuickBooks sync                                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Primary: Ramp

For expense management with corporate cards:
- Best receipt matching (95% same-day)
- Strong API with webhooks
- ML-powered categorization
- QuickBooks native sync

### Secondary: Mercury

For banking operations:
- Full API banking
- Transaction automation
- Reconciliation workflows
- Developer-friendly

### Why Not Brex First?

Brex is excellent, but Ramp's receipt matching is more mature. However, Brex's new AI-native API (Jan 2026) is worth monitoring—it may become the leader in automated expense coding.

---

## Implementation Plan

### Phase 1: Ramp Integration (2 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Ramp developer account setup | 1h | None |
| OAuth/API key configuration | 2h | Account |
| Transaction sync implementation | 8h | Config |
| Webhook handler for real-time | 6h | Sync |
| Receipt display UI | 6h | Transactions |
| **Subtotal** | **23h** | |

### Phase 2: Category Mapping (1 week)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Category → Project code mapping | 6h | Transactions |
| Manual override UI | 4h | Mapping |
| Learning/suggestion system | 8h | Overrides |
| **Subtotal** | **18h** | |

### Phase 3: Mercury Integration (1 week)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Mercury API setup | 2h | None |
| Transaction import | 6h | Setup |
| Balance display | 4h | Import |
| Payment initiation | 6h | Display |
| **Subtotal** | **18h** | |

---

## Estimated Effort

| Phase | Hours | Dependencies |
|-------|-------|--------------|
| Research | 6h | None (complete) |
| Phase 1: Ramp | 23h | Research |
| Phase 2: Mapping | 18h | Phase 1 |
| Phase 3: Mercury | 18h | Phase 1 |
| **Total** | **65h** | |

**Estimated Duration:** 4-5 weeks

---

## Security Considerations

### API Key Storage

```typescript
// Store API keys encrypted in Firestore
interface NeobankConnection {
  id: string;
  orgId: string;
  provider: 'ramp' | 'mercury' | 'brex';
  credentials: string; // Encrypted
  status: 'active' | 'expired' | 'error';
  lastSync: Timestamp;
}
```

### Data Handling

- Never store full card numbers
- Encrypt API tokens at rest
- Audit log all API calls
- Scope access to organization

### Compliance

| Provider | SOC 2 | PCI | FDIC |
|----------|-------|-----|------|
| Ramp | Yes | Yes | Via partner |
| Mercury | Yes | N/A | Yes (partner) |
| Brex | Yes | Yes | Via partner |

---

## Open Questions

- [ ] Should we support multiple neobank connections per org?
- [ ] How do we handle transaction deduplication across providers?
- [ ] Should category mapping be org-level or user-level?
- [ ] Do we need Brex integration given Ramp similarity?
- [ ] What's our strategy for users without neobank accounts?

---

## References

- [Ramp Developer API](https://docs.ramp.com/)
- [Ramp OpenAPI Spec](https://docs.ramp.com/openapi/developer-api.json)
- [Mercury API](https://mercury.com/api)
- [Brex Developer Portal](https://developer.brex.com/)
- [Brex Expenses API](https://developer.brex.com/openapi/expenses_api/)
- [Relay Integrations](https://relayfi.com/integrations)
- [BlueVine Integrations](https://www.bluevine.com/blog/software-integrations-for-business-checking-account)
