# RS-02: Payroll Platform Integration Research (Expanded)

**Research Date:** February 3, 2026
**Author:** Claude Research Agent
**Status:** Complete
**Priority:** High (Integration Strategy)
**Version:** 2.0 (Expanded with competitive analysis and architecture decisions)

---

## Executive Summary

This expanded report analyzes payroll platform integration options for ContractorOS, covering seven major platforms (Gusto, ADP, Paychex, QuickBooks Payroll, Rippling, OnPay, Patriot Payroll), competitive analysis of Procore and Buildertrend, and detailed architecture recommendations.

**Key Findings:**
- **Gusto** is the recommended first integration due to excellent API documentation, construction-friendly features, strong SMB market share (400,000+ businesses), and proven construction software partnerships (native Buildertrend integration)
- **Finch Unified API** provides the best cost-benefit ratio at ~$65/connection/month covering 220+ systems vs. 200+ hours engineering time per direct integration
- **ADP** and **Paychex** are important for mid-market contractors but have gated API access and complex partner requirements
- **ContractorOS should be the source of truth for hours worked**, while employee records should sync FROM payroll TO ContractorOS
- **Buildertrend + Gusto** is the reference integration model for SMB construction - we should follow this pattern

**Recommended Integration Priority:**
1. Finch Unified API (covers 220+ systems in ~40 hours)
2. Direct Gusto integration (deeper features, 80 hours)
3. ADP API Central (enterprise customers, on-request)

---

## Market Overview

### Construction Payroll Software Market (2024-2033)

| Metric | Value | Source |
|--------|-------|--------|
| Market Size (2024) | $1.25-2.7 Billion | [Market Research Intellect](https://www.marketresearchintellect.com/product/construction-payroll-software-market/) |
| Projected Size (2032-2033) | $1.84-5.3 Billion | [Data Horizon Research](https://datahorizzonresearch.com/construction-payroll-software-market-45761) |
| CAGR | 4.9-7.3% | Industry reports |
| Cloud adoption rate | Fastest growing segment | [Verified Market Reports](https://www.verifiedmarketreports.com/product/construction-payroll-software-market/) |
| North America | Prime region (early adopter) | Industry reports |
| Error reduction with integration | 65%+ | [Digital Journal](https://www.digitaljournal.com/pr/news/indnewswire/payroll-platforms-cloud-tools-reshaping-1530499330.html) |

### Small Business Payroll Market Size

| Metric | Value | Source |
|--------|-------|--------|
| Market Size (2024) | $5.6 Billion | [Verified Market Reports](https://www.verifiedmarketreports.com/product/small-business-payroll-software-market/) |
| Projected Size (2033) | $12.3 Billion | [Verified Market Reports](https://www.verifiedmarketreports.com/product/small-business-payroll-software-market/) |
| CAGR (2026-2033) | 9.5% | [Verified Market Reports](https://www.verifiedmarketreports.com/product/small-business-payroll-software-market/) |
| Cloud-based market share | 35% | [IMARC Group](https://www.imarcgroup.com/cloud-based-payroll-software-market) |
| Top 10 vendors concentration | 54.1% | [People Managing People](https://peoplemanagingpeople.com/strategy-operations/payroll-finance/payroll-software-market-size/) |
| SMBs outsourcing payroll | 23% | Industry reports |

### Construction-Specific Payroll Challenges

| Challenge | Impact | Solution Requirements |
|-----------|--------|----------------------|
| Multi-rate pay | Workers change classifications same day | Multiple pay rates per employee |
| Prevailing wage/Davis-Bacon | Government contract compliance | Certified payroll reports |
| Union fringe benefits | Complex deduction calculations | Configurable deduction codes |
| Job costing | Labor allocation to projects | Project/cost code tracking |
| Multi-state operations | Tax compliance across jurisdictions | Automatic state tax handling |
| Temporary workers/subcontractors | 1099 and W-2 mix | Contractor payment support |

### Market Leaders

The payroll market is dominated by three major players, with newer entrants gaining ground:

1. **ADP** - Enterprise and mid-market leader
2. **Paychex** - Strong SMB and mid-market presence
3. **Gusto** - Fast-growing SMB focused, 400,000+ businesses
4. **Rippling** - Modern all-in-one HR platform
5. **QuickBooks Payroll** - Strong with existing QBO users

---

## Platform Comparison Matrix

| Feature | Gusto | ADP | Paychex | QuickBooks Payroll | Rippling | OnPay |
|---------|-------|-----|---------|-------------------|----------|-------|
| **Market Focus** | SMB | Enterprise/Mid | SMB/Mid | SMB | SMB/Mid | SMB |
| **Construction Focus** | Good | Excellent | Good | Moderate | Good | Moderate |
| **API Available** | Yes | Yes | Yes | Yes (Limited) | Yes | Partner Only |
| **REST API** | Yes | Yes | Yes | Yes | Yes | Yes |
| **OAuth 2.0** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Webhooks** | Yes | Yes | Yes | Limited | Yes | Unknown |
| **Sandbox** | Yes | Yes | Yes | Yes | Yes | Yes (Partner) |
| **Documentation** | Excellent | Good | Good | Moderate | Good | Limited |
| **Time to Production** | 1-2 months | 2-3 months | 2+ months | 2+ months | 1-2 months | Partner only |
| **Base Price** | $40/mo | ~$79/mo | $39/mo | $50/mo | $8/user | $40/mo |
| **Per Employee** | $6 | $4-6 | $5 | $6 | Included | $6 |

---

## Detailed Platform Analysis

### 1. Gusto

**Overview:** Gusto is a payroll and benefits platform serving over 400,000 businesses, with strong SMB focus and excellent developer experience. It supports both W-2 employees and 1099 contractors in a single system.

**API Capabilities:**

| Category | Capability | Endpoint Examples |
|----------|-----------|-------------------|
| **Read - Employees** | Full employee data, demographics | `GET /v1/employees/{id}` |
| **Read - Compensation** | Pay rates, FLSA status, history | `GET /v1/jobs/{job_id}/compensations` |
| **Read - Pay History** | Pay stubs, payroll details | `GET /v1/employees/{id}/pay_stubs` |
| **Read - Tax Info** | Federal tax withholding | `GET /v1/employees/{uuid}/federal_taxes` |
| **Write - Time Sheets** | Time entries, hours worked | `POST /v1/companies/{id}/time_tracking/time_sheets` |
| **Write - Payroll** | Update payroll with hours | `PUT /v1/companies/{id}/payrolls/:start/:end` |
| **Write - Submit** | Finalize payroll | `PUT /v1/payrolls/{id}/submit` |

**Key Technical Details:**
- **Authentication:** OAuth 2.0 with scopes (e.g., `employees:read`, `payrolls:write`)
- **Rate Limit:** 200 requests/minute
- **Pagination:** 25 records/page default, supports `page` and `per` parameters
- **Versioning:** Uses `version` field for optimistic locking on updates
- **Webhooks:** Event-driven with HMAC signature verification (`X-Gusto-Signature`)

**Webhook Events:**
- `payroll.paid` - When payroll credits are generated
- `employee.created`, `employee.updated`
- `company.onboarded`

**Partner Program:**
- Two tiers: **App Integrations** (read/write to customer data) and **Embedded Payroll** (white-label)
- Production access requires QA review (1-2 months timeline)
- Custom pricing for Embedded Payroll partners
- Sandbox available at `api.gusto-demo.com`

**Construction-Specific Features:**
- Supports both W-2 and 1099 in same system
- Automatic 1099 preparation and filing
- Job-level compensation tracking
- Workers' comp integration

**Documentation Quality:** Excellent - [docs.gusto.com](https://docs.gusto.com/)

---

### 2. ADP

**Overview:** ADP is the market leader for mid-to-enterprise payroll, with strong construction industry presence. Offers multiple products: RUN (small business), Workforce Now (mid-market), and Vantage/Enterprise (large).

**API Capabilities:**

| Category | Capability | Description |
|----------|-----------|-------------|
| **Workers v2 API** | Employee sync | Read/write worker demographics, job info |
| **Pay Data Input v1** | Payroll batch | Submit earnings, deductions, reimbursements |
| **Time Off API** | PTO management | Read/write time-off requests and balances |
| **Onboarding API** | New hire setup | Onboard new hires into ADP |
| **Recruiting API** | Job/applicant data | Read job postings and applicants |

**Payroll Data Input Details:**
```
Endpoints support:
- Hours for Regular and Overtime earnings
- Rate and Hours combined
- Deduction codes (all client-defined codes supported)
- Reimbursements
- Batch processing for multiple employees
```

**Key Technical Details:**
- **Authentication:** OAuth 2.0 with OpenID Connect
- **SSO Required:** Integration with ADP Single Sign-On is mandatory
- **Application Types:**
  - **Data Connector:** No end-user involvement, scheduled sync
  - **End User Application:** Requires user authorization flow
- **Security Review:** Required for all partners (ISO 27001 based questionnaire)

**Partner Program Requirements:**
- Must sign Developer Participation Agreement (DPA)
- Security review required (questionnaire + documentation)
- Target milestone dates required within 30 days
- Must have substantial shared client base or differentiated HCM solution
- Registration at [partners.adp.com](https://partners.adp.com/)

**API Central Features:**
- Self-service API discovery tool
- Use case templates and code samples
- Virtual support available

**Construction-Specific Features:**
- Excellent multi-state compliance
- Union wage support
- Certified payroll reports
- Job costing integration

**Documentation Quality:** Good - [developers.adp.com](https://developers.adp.com/)

---

### 3. Paychex

**Overview:** Paychex Flex is a comprehensive payroll platform popular with SMBs and mid-market companies. Offers good scalability and customization options.

**API Capabilities:**

| Category | Capability | Notes |
|----------|-----------|-------|
| **Employee Data** | Read/write demographics | Standard CRUD operations |
| **Payroll** | Submit payroll batches | Requires Flex account |
| **Webhooks** | Event notifications | Domain-based subscriptions |
| **Time Off** | PTO requests/balances | Read and write |

**Key Technical Details:**
- **Authentication:** OAuth 2.0 with Client ID/Secret
- **Webhooks:**
  - `CLT_ACCESS` domain for integration approvals
  - Notifications indicate change occurred (must query for details)
  - Retry every 5 minutes if no 2XX response
- **Rate Limiting:** Not publicly specified (adjusted per use case)
- **Sandbox:** Available via Paychex Flex account

**Partner Requirements:**
- Must be existing Paychex client with Flex account
- Super Admin or Security Admin role required
- Production keys can take weeks to months

**Construction-Specific Features:**
- Weekly, biweekly, semimonthly, monthly pay schedules
- 1099 contractor support
- Multiple payment methods (direct deposit, check, prepaid card)
- Mobile app for on-the-go management

**Documentation Quality:** Good - [developer.paychex.com](https://developer.paychex.com/)

---

### 4. QuickBooks Payroll (Intuit)

**Overview:** QuickBooks Payroll integrates tightly with QuickBooks Online accounting, making it popular with contractors already using QBO for financials.

**API Capabilities:**

| Category | Capability | Access Level |
|----------|-----------|--------------|
| **Time API** | Time entries with compensation | Premium (Beta) |
| **Payroll Compensation** | Pay rate data | Silver+ tier |
| **Projects API** | Job costing | Gold+ tier |
| **Standard Payroll** | Basic operations | Partner program |

**Key Technical Details:**
- **Authentication:** OAuth 2.0
- **Gated Access:** All APIs require approved partner status
- **Premium APIs:** Time API with Payroll Compensation requires Gold/Platinum tier
- **Security Assessment:** Annual comprehensive review required
- **Timeline:** Up to 2 months for production keys

**Partner Program Tiers:**
- **Silver:** Basic access, can request Payroll Compensation API
- **Gold/Platinum:** Full Premium API access
- International support (UK, Australia, Canada) as of November 2025

**Construction-Specific Features:**
- Deep accounting integration (job costing to GL)
- Project-based payroll allocation
- Progress invoicing alignment

**Documentation Quality:** Moderate - [developer.intuit.com](https://developer.intuit.com/)

---

### 5. Rippling

**Overview:** Rippling is a modern, all-in-one platform combining HR, payroll, IT, and spend management. Strong with tech-forward construction companies.

**API Capabilities:**

| Category | Capability | Version |
|----------|-----------|---------|
| **Workers** | Employee CRUD | V1 (Partners), V2 (Customers) |
| **Payroll** | Submit pay data | V1 |
| **Time & Attendance** | Time entries | V1 |
| **Webhooks** | Real-time events | V1 |

**Key Technical Details:**
- **Authentication:** OAuth 2.0 (authorization code flow)
- **Token Endpoint:** `https://api.rippling.com/api/o/token/`
- **Versioning:** Date-based (YYYY-MM-DD format)
- **Pagination:** Cursor and limit-based
- **Query Params:** Supports `expand`, `order_by`, `filter`

**Important Note:** V2 endpoints are currently only available for Rippling customers, not integration partners. Partners should use V1.

**Construction-Specific Features:**
- Multi-state compliance
- Contractor payments
- Time tracking built-in
- Equipment/asset management

**Documentation Quality:** Good - [developer.rippling.com](https://developer.rippling.com/)

---

### 6. OnPay

**Overview:** OnPay is an affordable payroll solution named "Best Affordable" by Forbes Advisor. Simple pricing at $49/mo + $6/person with no hidden fees.

**API Capabilities:**

| Category | Capability | Notes |
|----------|-----------|-------|
| **Authentication** | OAuth 2.0 (Authorization Code + Refresh) | Standard OAUTH2 protocol |
| **Response Format** | JSON, REST design | Standard HTTP response codes |
| **API Tokens** | Available from management panel | For internal integrations |
| **Client Registration** | Not required | Client ID = domain name |

**Key Technical Details:**
- Access tokens provided after successful authorization
- Refresh token available for token renewal
- 4XX/5XX responses include detailed error messages in JSON
- Recommended: Use existing OAUTH2 library implementation

**Pricing (End User):**
- Base: $49/month
- Per worker: $6/person
- No setup fees or hidden costs

**Integration Recommendation:**
OnPay has limited public API documentation. For ContractorOS integration, recommend using Finch unified API which provides "Assisted" integration to OnPay through their unified data model.

**Construction Fit:** Moderate - Good for very small contractors (1-50 employees) prioritizing simplicity and affordability.

**Documentation Quality:** Basic - [onpay.io/docs/technical/api_v1.html](https://onpay.io/docs/technical/api_v1.html)

---

### 7. Patriot Payroll

**Overview:** Patriot is the most affordable payroll option, ideal for very small contractors (1-25 employees). **No native public API** for third-party developers.

**API Capabilities:**

| Category | Status | Alternative |
|----------|--------|-------------|
| **Public REST API** | Not available | Use Finch/Zapier |
| **Direct Integration** | Not available | Contact support |
| **Third-party Access** | Via unified APIs only | Finch (Assisted mode) |

**Integration Options:**
1. **Finch "Assisted" Integration** - Human-in-the-loop, data refreshed every 7 days
2. **Zapier** - Basic automation for simple workflows
3. **Native Integrations** - QuickBooks Online/Desktop, QuickBooks Time only

**Pricing (End User):**
- Basic Payroll: $17/month + $4/employee
- Full Service: $37/month + $4/employee

**Construction Fit:** Basic - Best for very small contractors (1-25 employees) who prioritize cost over features. Not suitable for complex time tracking integration.

**Recommendation:** If customer uses Patriot, route through Finch unified API. Not a priority for direct integration.

**Documentation Quality:** N/A (no public API documentation)

---

## Unified API Comparison: Finch vs Merge

For covering the long-tail of payroll providers, unified APIs offer significant advantages:

### Comparison Table

| Feature | Finch | Merge |
|---------|-------|-------|
| **Pricing** | $65/connection/month | $65/connected account/month |
| **Provider Coverage** | 220+ HRIS/Payroll | 200+ (across 7 categories) |
| **Focus** | HR & Payroll specialist | Broader (HR, ATS, Accounting) |
| **Integration Type** | Mixed (API + Assisted) | API-first |
| **Assisted Integrations** | Majority use SFTP/human | Minimal |
| **Data Sync** | Daily (auto), 7-day (assisted) | Daily/hourly |
| **Write APIs** | Scale plan only | Available |
| **Support** | Account manager on highest tier | CSM on Professional+ |
| **SOC 2** | Yes | Yes |
| **HIPAA** | Yes | Check tier |

### Recommendation: Finch for Primary Unified API

**Why Finch:**
- Deeper payroll/HRIS focus (vs. Merge's broader scope)
- Better coverage for payroll-specific use cases
- 80% of US employers covered
- Deduction management support

**Caveat:** Many Finch integrations are "assisted" (human-in-the-loop with 7-day sync). For real-time needs, prioritize direct integrations with Gusto/ADP.

### Cost Analysis

| Approach | One-Time Cost | Monthly Cost | Time to Market |
|----------|---------------|--------------|----------------|
| Direct Gusto | 80 hours (~$16K) | $0 | 2-4 months |
| Direct ADP | 120 hours (~$24K) | Custom | 4-6 months |
| Finch (covers 220+) | 40 hours (~$8K) | $65/connection | 2-3 weeks |
| Both (recommended) | 120 hours (~$24K) | $65/connection | 3-4 months |

---

## Competitive Analysis

### How Procore Handles Payroll Integration

**Strategy:** Procore focuses on time tracking with payroll as an integration point, not a native feature.

**Architecture:**
```
Field Worker (Procore Mobile)
    |
    v
Procore Timesheets (approval workflow)
    |
    v
Export Options:
    |---> Direct to Sage HCM (native)
    |---> Direct to Criterion HCM (native)
    |---> CSV Export (manual upload)
    |---> Public API (custom integration)
        |
        v
    Payroll System (ADP, Gusto, etc.)
```

**Key Features:**
- **Timecard tool** - Mobile/web time entry with project/cost code allocation
- **Timesheets tool** - Custom fields, built-in approval workflows before export
- **Public API** - Pull time data from third-party systems, push to payroll
- **Automatic export** - Direct integration to Sage/Criterion HCM

**Payroll Partners:**
- Sage HCM (project data sync, labor cost allocation)
- Criterion HCM (real-time timesheet sync, payroll processing)
- ExakTime (time tracking accuracy)
- busybusy (GPS-enabled time tracking)

**Lessons for ContractorOS:**
1. Keep time tracking as core feature, payroll as integration
2. Support both direct export and API push
3. Approval workflow is critical before payroll sync
4. Maintain cost code/project allocation through the entire chain

---

### How Buildertrend Handles Payroll Integration

**Strategy:** Buildertrend has a **native Gusto integration** as their primary payroll partner.

**Architecture:**
```
Buildertrend Time Clock
    |
    v
Shift Approval (Foreman)
    |
    v
Buildertrend API Sync
    |
    v
Gusto Payroll Processing
```

**Integration Features:**
- Employee sync (Buildertrend -> Gusto, one-way for linking)
- Time Clock shift sync (Buildertrend -> Gusto)
- Automatic overtime calculation (configured in both systems)
- Multi-state tax handling (Gusto handles compliance)
- QuickBooks/Xero accounting sync (via Gusto)

**Key Workflow:**
1. Employees clock in/out in Buildertrend mobile app
2. Foreman approves shifts in Buildertrend
3. **Only approved shifts** sync to Gusto
4. Gusto processes payroll with Buildertrend hours
5. Taxes filed automatically across all 50 states

**Important Limitations:**
- Only syncs **hourly employees** (not salary-based)
- **Rate changes must be made in Gusto** (not Buildertrend)
- Buildertrend only sends hours - compensation managed in Gusto
- No native ADP integration (Gusto is preferred partner)

**Data Flow Details:**
| Data | Direction | Notes |
|------|-----------|-------|
| Employee records | Gusto -> BT (link only) | Employees created in Gusto |
| Pay rates | Gusto (source) | Rate changes in Gusto only |
| Hours worked | BT -> Gusto | After approval |
| Overtime | Calculated in both | Setup required in both systems |
| Tax withholding | Gusto (exclusive) | BT never touches taxes |

**Lessons for ContractorOS:**
1. **Gusto is the preferred partner** for SMB construction software
2. **Approval workflow is mandatory** before payroll sync
3. **Keep rate management in payroll system** (single source of truth)
4. **Start with hourly employees** (salary support can come later)
5. Never attempt to handle tax calculations - leave to payroll provider

---

## Architecture Decisions

### Question 1: Should ContractorOS be the "source of truth" for hours?

**Answer: YES**

**Rationale:**
- ContractorOS captures field-verified time with project/cost code context
- Construction requires job-level allocation that payroll systems don't understand
- Approval workflows happen in ContractorOS (foreman/PM approval)
- Payroll systems are designed to receive hours, not capture them

**Implementation:**
```
ContractorOS Time Entry
    |
    +-- Employee clocks in/out (mobile)
    +-- Project/cost code allocation
    +-- Break tracking (compliance)
    +-- GPS verification (optional)
    |
    v
Approval Workflow
    |
    +-- Foreman daily approval
    +-- PM period approval
    |
    v
Payroll Export (batch at pay period end)
```

---

### Question 2: Should employee records sync FROM payroll TO ContractorOS?

**Answer: YES**

**Rationale:**
- Payroll system is the legal employer of record
- Tax information (W-4, state withholding) managed in payroll
- Employee onboarding happens in payroll (compliance docs)
- Rate changes should originate in payroll (single source of truth)

**Data Flow:**
```
Payroll System (Source of Truth)
    |
    +-- Employee created
    +-- Rate changed
    +-- Employee terminated
    |
    v (Webhook or daily sync)
ContractorOS
    |
    +-- Upsert employee record
    +-- Update display rate
    +-- Mark inactive/terminated
```

---

### Question 3: How do we handle rate changes?

**Answer: Event-driven sync from payroll**

**Flow:**
1. Admin changes rate in payroll system (Gusto/ADP)
2. Payroll triggers `employee.updated` webhook
3. ContractorOS receives webhook via Finch or direct integration
4. Update `employees.hourlyRate` in Firestore
5. **Historical time entries retain original rate** (audit compliance)
6. Future time entries use new rate
7. Optionally notify PM of budget impact

**Data Model:**
```typescript
interface EmployeeRateHistory {
  employeeId: string;
  rates: {
    rate: number;
    effectiveFrom: Timestamp;
    effectiveTo: Timestamp | null;
    source: 'payroll_sync' | 'manual';
    syncedAt: Timestamp;
  }[];
}
```

---

### Question 4: What happens when an employee is terminated in payroll?

**Answer: Graceful deactivation with data retention**

**Flow:**
1. Admin terminates employee in payroll system
2. Payroll triggers `employee.terminated` webhook
3. ContractorOS receives event with termination date
4. Update employee status to `terminated`
5. Remove from future schedules (effective date forward)
6. Retain all historical data (time entries, project assignments)
7. **Do NOT delete user account** (audit trail requirement)
8. Optionally revoke app access

**Implementation:**
```typescript
async function handleEmployeeTerminated(event: WebhookEvent) {
  const { individual_id, termination_date } = event.data;

  const employee = await findEmployeeByPayrollId(individual_id);
  if (!employee) return;

  // Update status (soft delete)
  await updateEmployee(employee.id, {
    status: 'terminated',
    terminationDate: termination_date,
    isActive: false,
    updatedAt: Timestamp.now(),
    updatedBy: 'payroll_sync'
  });

  // Remove from future schedules
  await removeFromFutureSchedules(employee.id, termination_date);

  // Keep historical data intact
  // Notify relevant managers
  await notifyTermination(employee);
}
```

---

### Question 5: Recommended Data Flow Pattern

**360-Degree (Bidirectional) Integration:**

```
                    EMPLOYEE DATA (Payroll -> ContractorOS)
┌─────────────────────────────────────────────────────────────────┐
│                     PAYROLL SYSTEM                               │
│              (Source of Truth for Employee Data)                 │
│                                                                  │
│  Employee records, Pay rates, Tax info, Benefits, Status        │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                        [Webhooks: employee.*, company.*]
                                  │
                                  v
┌─────────────────────────────────────────────────────────────────┐
│                   FINCH UNIFIED API                              │
│              (Normalizes 220+ providers)                         │
│                                                                  │
│  Consistent data model, OAuth management, Webhook forwarding    │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  v
┌─────────────────────────────────────────────────────────────────┐
│                     CONTRACTOROS                                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Employee Sync Service                          │ │
│  │  - Map payroll employee to ContractorOS user               │ │
│  │  - Sync rates (with history)                               │ │
│  │  - Handle terminations                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Time Entry Management                          │ │
│  │         (SOURCE OF TRUTH FOR HOURS)                        │ │
│  │  - Clock in/out, Breaks                                    │ │
│  │  - Project/cost code allocation                            │ │
│  │  - Approval workflows (Foreman -> PM)                      │ │
│  │  - Overtime calculation                                     │ │
│  └─────────────────────────────┬──────────────────────────────┘ │
│                                │                                 │
└────────────────────────────────┼─────────────────────────────────┘
                                 │
                       [Batch: Approved time entries]
                       [Trigger: Pay period close or manual]
                                 │
                                 v
┌─────────────────────────────────────────────────────────────────┐
│                   FINCH UNIFIED API                              │
│              (Transform to provider format)                      │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  v
┌─────────────────────────────────────────────────────────────────┐
│                     PAYROLL SYSTEM                               │
│                                                                  │
│  Receives hours -> Processes payroll -> Returns pay statements  │
└─────────────────────────────────────────────────────────────────┘
                    TIME/HOURS DATA (ContractorOS -> Payroll)
```

---

### Sync Frequency Recommendations

| Data Type | Method | Frequency | Rationale |
|-----------|--------|-----------|-----------|
| Employee directory | Webhook + daily poll | Real-time + daily fallback | Catch missed events |
| Pay rates | Webhook | Real-time | Affects time valuations |
| Employment status | Webhook | Real-time | Access control implications |
| Time entries (out) | Batch | Pay period end | Matches payroll cycle |
| Pay statements (in) | Pull after payroll | Post-processing | Compliance/reporting |
| Benefits/deductions | Webhook | Real-time | Benefits compliance |

---

### Conflict Resolution Strategies

**Employee Matching (Import):**

| Strategy | Confidence | Method |
|----------|------------|--------|
| Email match | Highest | Exact email comparison |
| Name + phone | Medium | Fuzzy match with verification |
| Manual matching | Fallback | Admin UI for ambiguous cases |

**Rate Conflicts:**

| Scenario | Resolution |
|----------|------------|
| Rate differs between systems | Payroll is authoritative, update ContractorOS |
| Rate change mid-pay-period | Apply new rate from effective date forward |
| Historical rate needed | Maintain rate history for audit |

**Time Entry Conflicts:**

| Scenario | Resolution |
|----------|------------|
| Time rejected by payroll | Surface error to admin, allow correction |
| Time submitted after close | Queue for next pay period or off-cycle |
| Duplicate submission | Idempotency check on payroll ID |

**Overview:** OnPay is a straightforward payroll solution popular with small businesses. API access is limited to approved partners only.

**API Capabilities:**
- Partner-only access (must contact OnPay directly)
- OAuth 2.0 authentication
- Access tokens valid for 2 hours
- Refresh token exchange supported

**Key Limitation:** No public API documentation - requires direct partnership agreement.

**Recommended Approach:** Use Finch unified API for OnPay integration if needed.

**Documentation Quality:** Limited (partner-only)

---

## Unified API Option: Finch

**Overview:** Finch provides a unified API to access 200+ HRIS and payroll systems, including all platforms listed above.

**Key Benefits:**
- Single integration covers multiple payroll providers
- Standardized data format across all systems
- Reduces integration maintenance burden
- 66% faster time-to-market (per Human Interest case study)

**Supported Use Cases:**
- Employee/organization directory sync
- Payroll data read (pay statements, pay history)
- Deduction management
- Benefits administration

**Data Types Available:**
- **Organization:** Company structure, locations, departments
- **Payroll:** Pay statements, compensation, tax data
- **Benefits:** Deduction management, enrollment

**Pricing:** Contact Finch directly - usage-based model

**Consideration for ContractorOS:**
Finch could be valuable as a fallback for payroll providers we don't directly integrate with, but for primary targets (Gusto, ADP), direct integration offers more control and deeper functionality.

**Documentation:** [tryfinch.com](https://www.tryfinch.com/)

---

## Data Flow Architecture Recommendations

### Source of Truth Analysis

| Data Type | Source of Truth | Direction | Rationale |
|-----------|-----------------|-----------|-----------|
| **Employee Records** | Payroll System | Payroll -> ContractorOS | Payroll is authoritative for legal employment records, tax info |
| **Pay Rates** | Payroll System | Payroll -> ContractorOS | Rates set in payroll for compliance, sync to COS for display |
| **Time/Hours Worked** | ContractorOS | ContractorOS -> Payroll | Field time tracking is our core value; we capture this data |
| **Job Assignments** | ContractorOS | ContractorOS -> Payroll | We manage project/job structure |
| **Tax Withholding** | Payroll System | Read-only | Never write tax data |
| **Pay History** | Payroll System | Payroll -> ContractorOS | For employee self-service in our portal |

### Recommended Sync Patterns

```
EMPLOYEE SYNC (Payroll -> ContractorOS)
+-------------------+     Webhook/Poll     +------------------+
|  Payroll System   | ------------------> |   ContractorOS   |
|  (Source of Truth)|                      |   (Consumer)     |
+-------------------+                      +------------------+
     Employee created/updated                   Upsert employee
     Pay rate changed                           Update rate display
     Employee terminated                        Mark inactive

TIME ENTRY SYNC (ContractorOS -> Payroll)
+------------------+     Batch/Real-time   +-------------------+
|   ContractorOS   | ------------------> |  Payroll System   |
| (Source of Truth)|                      |   (Consumer)      |
+------------------+                      +-------------------+
     Daily time entries                       Import hours
     Overtime calculations                    Pay period summary
     Job cost allocation                      Process payroll
```

### Sync Frequency Recommendations

| Data Type | Frequency | Method |
|-----------|-----------|--------|
| Employee records | Real-time (webhook) or daily | Webhook preferred, poll fallback |
| Pay rates | Real-time (webhook) or weekly | Webhook preferred |
| Time entries to payroll | Batch (before pay period close) | Scheduled job |
| Pay history | Weekly or on-demand | Poll or user-triggered |

### Rate Change Handling

When pay rates change in the payroll system:

1. **Webhook triggers** (if available) or **daily sync job** detects rate change
2. ContractorOS updates `employees.hourlyRate` or `employees.salary`
3. Future time entry valuations use new rate
4. Historical entries retain original rate (audit compliance)
5. Optionally notify project managers of rate changes for budget impact

### Edge Cases to Handle

| Scenario | Resolution |
|----------|------------|
| Employee in payroll but not ContractorOS | Create employee record, flag for assignment |
| Employee in ContractorOS but not payroll | Flag as "pending payroll setup" |
| Rate differs between systems | Payroll is authoritative, update ContractorOS |
| Time entry submitted after payroll close | Queue for next pay period or off-cycle |
| Payroll rejects time entry | Surface error to admin, allow correction |

---

## Implementation Recommendations

### Priority Order

| Priority | Platform | Rationale |
|----------|----------|-----------|
| **1** | **Gusto** | Best API, construction-friendly, large SMB base (400K+ businesses) |
| **2** | **Finch (Unified)** | Covers 200+ systems as fallback, reduces long-tail complexity |
| **3** | **ADP** | Mid-market necessity, excellent compliance features |
| **4** | **QuickBooks Payroll** | Synergy with existing QBO accounting integration |
| **5** | **Paychex** | Good mid-market coverage |
| **6** | **Rippling** | Modern platform, growing share |

### Phase 1: Gusto Integration (Recommended First)

**Scope:**
- OAuth 2.0 connection flow
- Employee sync (read from Gusto)
- Compensation/rate sync (read from Gusto)
- Time entry export (write to Gusto)
- Pay history display (read from Gusto)
- Webhook handlers for real-time updates

**Estimated Effort:** 4-6 weeks development + 4-6 weeks Gusto QA review

**Key Endpoints to Implement:**

```typescript
// Employee Sync
GET /v1/companies/{company_id}/employees
GET /v1/employees/{employee_id}
GET /v1/jobs/{job_id}/compensations

// Time Tracking
POST /v1/companies/{company_id}/time_tracking/time_sheets
PUT /v1/companies/{company_id}/payrolls/:start_date/:end_date

// Payroll
GET /v1/companies/{company_id}/payrolls?processing_statuses=unprocessed
PUT /v1/payrolls/{payroll_id}/submit

// Pay History
GET /v1/employees/{employee_id}/pay_stubs
```

### Phase 2: Finch Integration

**Scope:**
- Unified API integration for secondary providers
- Covers OnPay, smaller regional providers
- Standardized data model adapter

**Estimated Effort:** 2-3 weeks (leverages existing Gusto patterns)

### Phase 3: ADP Integration

**Scope:**
- Partner program application and approval
- Security questionnaire completion
- Workers v2 API integration
- Pay Data Input v1 API integration

**Estimated Effort:** 6-8 weeks development + 2-3 months partner approval

---

## Sample API Integration Code

### Gusto OAuth Flow

```typescript
// lib/integrations/gusto/auth.ts
import { db } from '@/lib/firebase/config';

const GUSTO_AUTH_URL = 'https://api.gusto.com/oauth/authorize';
const GUSTO_TOKEN_URL = 'https://api.gusto.com/oauth/token';

export async function initiateGustoAuth(orgId: string): Promise<string> {
  const state = crypto.randomUUID();

  // Store state for verification
  await db.collection('organizations').doc(orgId)
    .collection('integrations').doc('gusto')
    .set({ pendingState: state, status: 'pending' }, { merge: true });

  const params = new URLSearchParams({
    client_id: process.env.GUSTO_CLIENT_ID!,
    redirect_uri: process.env.GUSTO_REDIRECT_URI!,
    response_type: 'code',
    state,
  });

  return `${GUSTO_AUTH_URL}?${params.toString()}`;
}

export async function handleGustoCallback(
  code: string,
  state: string,
  orgId: string
): Promise<void> {
  // Verify state matches
  const integrationDoc = await db.collection('organizations').doc(orgId)
    .collection('integrations').doc('gusto').get();

  if (integrationDoc.data()?.pendingState !== state) {
    throw new Error('Invalid state parameter');
  }

  // Exchange code for tokens
  const response = await fetch(GUSTO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GUSTO_CLIENT_ID!,
      client_secret: process.env.GUSTO_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GUSTO_REDIRECT_URI!,
    }),
  });

  const tokens = await response.json();

  // Store tokens securely
  await db.collection('organizations').doc(orgId)
    .collection('integrations').doc('gusto')
    .set({
      status: 'connected',
      accessToken: tokens.access_token, // Encrypt in production!
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      connectedAt: new Date(),
    }, { merge: true });
}
```

### Employee Sync from Gusto

```typescript
// lib/integrations/gusto/sync.ts
interface GustoEmployee {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  jobs: Array<{
    uuid: string;
    title: string;
    compensations: Array<{
      rate: string;
      payment_unit: 'Hour' | 'Year';
      flsa_status: 'Exempt' | 'Nonexempt';
    }>;
  }>;
}

export async function syncEmployeesFromGusto(orgId: string): Promise<void> {
  const integration = await getGustoIntegration(orgId);
  const companyId = integration.gustoCompanyId;

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.gusto.com/v1/companies/${companyId}/employees?page=${page}&per=25`,
      {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const employees: GustoEmployee[] = await response.json();

    if (employees.length === 0) {
      hasMore = false;
      continue;
    }

    // Batch write to Firestore
    const batch = db.batch();

    for (const emp of employees) {
      const primaryJob = emp.jobs[0];
      const compensation = primaryJob?.compensations[0];

      const employeeRef = db.collection('organizations').doc(orgId)
        .collection('employees').doc(emp.uuid);

      batch.set(employeeRef, {
        gustoId: emp.uuid,
        firstName: emp.first_name,
        lastName: emp.last_name,
        email: emp.email,
        title: primaryJob?.title || '',
        hourlyRate: compensation?.payment_unit === 'Hour'
          ? parseFloat(compensation.rate)
          : null,
        salary: compensation?.payment_unit === 'Year'
          ? parseFloat(compensation.rate)
          : null,
        isExempt: compensation?.flsa_status === 'Exempt',
        syncedAt: new Date(),
        source: 'gusto',
      }, { merge: true });
    }

    await batch.commit();
    page++;
  }
}
```

### Time Entry Export to Gusto

```typescript
// lib/integrations/gusto/timeExport.ts
interface TimeSheetPayload {
  entity_uuid: string;
  entity_type: 'Employee';
  job_uuid: string;
  time_zone: string;
  shift_started_at: string;
  shift_ended_at: string;
  entries: Array<{
    hours_worked: string;
    pay_classification: 'regular' | 'overtime';
  }>;
}

export async function exportTimeEntriesToGusto(
  orgId: string,
  payPeriodStart: Date,
  payPeriodEnd: Date
): Promise<{ success: number; failed: number }> {
  const integration = await getGustoIntegration(orgId);
  const companyId = integration.gustoCompanyId;

  // Get time entries for pay period
  const timeEntries = await db.collection('organizations').doc(orgId)
    .collection('timeEntries')
    .where('date', '>=', payPeriodStart)
    .where('date', '<=', payPeriodEnd)
    .where('status', '==', 'approved')
    .get();

  let success = 0;
  let failed = 0;

  // Group by employee and date
  const grouped = groupTimeEntriesByEmployee(timeEntries.docs);

  for (const [employeeId, entries] of Object.entries(grouped)) {
    const employee = await getEmployeeByGustoId(orgId, employeeId);

    for (const entry of entries) {
      const payload: TimeSheetPayload = {
        entity_uuid: employee.gustoId,
        entity_type: 'Employee',
        job_uuid: employee.gustoJobId,
        time_zone: 'America/Los_Angeles',
        shift_started_at: entry.startTime.toISOString(),
        shift_ended_at: entry.endTime.toISOString(),
        entries: [
          {
            hours_worked: entry.regularHours.toFixed(2),
            pay_classification: 'regular',
          },
          ...(entry.overtimeHours > 0 ? [{
            hours_worked: entry.overtimeHours.toFixed(2),
            pay_classification: 'overtime' as const,
          }] : []),
        ],
      };

      try {
        const response = await fetch(
          `https://api.gusto.com/v1/companies/${companyId}/time_tracking/time_sheets`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${integration.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          success++;
        } else {
          console.error('Failed to export time entry:', await response.text());
          failed++;
        }
      } catch (error) {
        console.error('Error exporting time entry:', error);
        failed++;
      }
    }
  }

  return { success, failed };
}
```

---

## Security Considerations

### Token Storage
- Store OAuth tokens encrypted in Firestore
- Use Google Cloud Secret Manager for encryption keys
- Implement token refresh logic with proper locking

### Data Privacy
- Never store SSN or full tax IDs
- Mask sensitive employee data in logs
- Implement audit logging for all sync operations

### Rate Limiting
- Implement exponential backoff for API failures
- Respect provider rate limits (Gusto: 200/min)
- Use batch operations where possible

### Webhook Verification
- Verify HMAC signatures (Gusto: `X-Gusto-Signature`)
- Validate webhook source IPs if available
- Implement idempotency for webhook processing

---

## Cost Analysis

### Direct Integration Costs

| Platform | Partner Fees | Development | QA/Approval | Total Estimate |
|----------|--------------|-------------|-------------|----------------|
| Gusto | Custom pricing | 4-6 weeks | 4-6 weeks | $30-50K |
| ADP | Requires agreement | 6-8 weeks | 8-12 weeks | $50-80K |
| Paychex | TBD | 4-6 weeks | 6-8 weeks | $40-60K |
| QuickBooks | Partner tier fees | 4-6 weeks | 6-8 weeks | $40-60K |

### Finch (Unified API) Alternative

| Item | Cost |
|------|------|
| Integration development | 2-3 weeks |
| Monthly usage | Based on connected employers |
| Total first year estimate | $20-40K (depending on volume) |

### Recommendation

Start with Gusto direct integration for best user experience, then add Finch as a fallback for other providers. This hybrid approach balances depth of integration with breadth of coverage.

---

## Next Steps

1. **Immediate:** Apply for Gusto developer account at [dev.gusto.com](https://dev.gusto.com)
2. **Week 1-2:** Set up sandbox environment, explore API endpoints
3. **Week 2-4:** Design database schema for integration metadata
4. **Week 4-8:** Implement core sync logic (employees, time entries)
5. **Week 8-10:** Build UI for connection flow and sync status
6. **Week 10-14:** Submit for Gusto QA review
7. **Week 14-16:** Address QA feedback, launch to production

---

## Sample API Endpoints to Explore

### Finch Unified API

```bash
# Authentication - Exchange code for token
POST https://api.tryfinch.com/auth/token
Content-Type: application/json
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "code": "AUTH_CODE",
  "redirect_uri": "YOUR_REDIRECT_URI"
}

# Get company information
GET https://api.tryfinch.com/employer/company
Authorization: Bearer {access_token}

# Get employee directory
GET https://api.tryfinch.com/employer/directory
Authorization: Bearer {access_token}

# Get individual employee details
POST https://api.tryfinch.com/employer/individual
Authorization: Bearer {access_token}
Content-Type: application/json
{
  "requests": [{ "individual_id": "abc123" }]
}

# Get employment data (includes pay rate)
POST https://api.tryfinch.com/employer/employment
Authorization: Bearer {access_token}
Content-Type: application/json
{
  "requests": [{ "individual_id": "abc123" }]
}

# Get pay statements
GET https://api.tryfinch.com/employer/pay-statement?start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer {access_token}
```

### Gusto Direct API

```bash
# List employees
GET https://api.gusto.com/v1/companies/{company_uuid}/employees
Authorization: Bearer {access_token}

# Get employee detail
GET https://api.gusto.com/v1/employees/{employee_uuid}
Authorization: Bearer {access_token}

# Get compensations
GET https://api.gusto.com/v1/employees/{employee_uuid}/compensations
Authorization: Bearer {access_token}

# Submit time tracking data
POST https://api.gusto.com/v1/companies/{company_uuid}/time_tracking/time_sheets
Authorization: Bearer {access_token}
Content-Type: application/json
{
  "entity_uuid": "employee_uuid",
  "entity_type": "Employee",
  "job_uuid": "job_uuid",
  "time_zone": "America/Los_Angeles",
  "shift_started_at": "2026-02-03T08:00:00-08:00",
  "shift_ended_at": "2026-02-03T17:00:00-08:00",
  "entries": [
    { "hours_worked": "8.00", "pay_classification": "regular" }
  ]
}

# Create webhook subscription
POST https://api.gusto.com/v1/webhook_subscriptions
Authorization: Bearer {access_token}
Content-Type: application/json
{
  "url": "https://api.contractoros.com/webhooks/gusto",
  "subscription_types": ["Employee", "Payroll", "Company", "Contractor"]
}

# Get unprocessed payroll
GET https://api.gusto.com/v1/companies/{company_uuid}/payrolls?processing_statuses=unprocessed
Authorization: Bearer {access_token}
```

### ADP API

```bash
# Get workers list
GET https://api.adp.com/hr/v2/workers
Authorization: Bearer {access_token}
X-ADP-Client-ID: {client_id}

# Submit time card batch
POST https://api.adp.com/time/v2/time-cards
Authorization: Bearer {access_token}
Content-Type: application/json
{
  "events": [{
    "data": {
      "transform": {
        "timeCard": {
          "associateOID": "worker_oid",
          "timePeriod": {
            "startDate": "2026-02-01",
            "endDate": "2026-02-07"
          },
          "dailyTotals": [{
            "entryDate": "2026-02-03",
            "timeDuration": "PT8H",
            "payCode": {
              "codeValue": "REG"
            }
          }]
        }
      }
    }
  }]
}

# Submit pay data input (batch)
POST https://api.adp.com/payroll/v1/pay-data-input
Authorization: Bearer {access_token}
Content-Type: application/json
{
  "events": [{
    "data": {
      "eventContext": {
        "worker": { "associateOID": "worker_oid" }
      },
      "transform": {
        "payDataInput": {
          "payInputs": [{
            "payInputType": "earnings",
            "earningCode": { "codeValue": "REG" },
            "hours": 40
          }]
        }
      }
    }
  }]
}
```

---

## Implementation Roadmap

### Phase 1: Finch Setup (Weeks 1-2) - 31 hours

| Task | Hours | Dependencies |
|------|-------|--------------|
| Create Finch developer account | 1h | None |
| Implement OAuth 2.0 flow | 8h | Account |
| Build connection management UI | 12h | OAuth |
| Set up webhook handler endpoint | 6h | UI |
| Test with sandbox environment | 4h | All above |

### Phase 2: Employee Import (Weeks 3-4) - 36 hours

| Task | Hours | Dependencies |
|------|-------|--------------|
| Employee directory sync service | 10h | Phase 1 |
| Employee matching UI (email, name, manual) | 12h | Sync service |
| Rate import and history tracking | 8h | Matching |
| Termination handling (soft delete, schedule removal) | 6h | Import |

### Phase 3: Time Export (Weeks 5-7) - 48 hours

| Task | Hours | Dependencies |
|------|-------|--------------|
| Pay period alignment logic | 8h | Phase 2 |
| Time entry aggregation (by employee, pay type) | 10h | Pay periods |
| Export approval workflow (PM approval before push) | 12h | Aggregation |
| Push to payroll API (Finch/Gusto) | 10h | Approval |
| Status tracking and error handling | 8h | Push |

### Phase 4: Reconciliation (Week 8) - 24 hours

| Task | Hours | Dependencies |
|------|-------|--------------|
| Pay statement import | 8h | Phase 3 |
| Reconciliation reports (hours submitted vs. paid) | 10h | Import |
| Discrepancy alerts | 6h | Reports |

### Total Estimated Effort

| Phase | Hours | Duration |
|-------|-------|----------|
| Phase 1: Finch Setup | 31h | 2 weeks |
| Phase 2: Employee Import | 36h | 2 weeks |
| Phase 3: Time Export | 48h | 3 weeks |
| Phase 4: Reconciliation | 24h | 1 week |
| **Total** | **139h** | **8 weeks** |

---

## Open Questions for Product

1. **Multiple connections?** Should an org connect to multiple payroll systems simultaneously?
2. **Certified payroll?** Do we need WH-347 report support for Davis-Bacon Act compliance?
3. **Contractor support?** How do we handle 1099 contractors in payroll sync (different workflow)?
4. **Historical import?** Should we import historical pay statements on initial connection?
5. **Fallback behavior?** What happens if webhook fails - poll as backup?
6. **Rate change notifications?** Should we notify PMs when employee rates change (budget impact)?

---

## References

### Official Platform Documentation
- [Gusto Developer Docs](https://docs.gusto.com/) - Excellent, comprehensive
- [Gusto Embedded Payroll](https://embedded.gusto.com/) - White-label option
- [Gusto Webhook Events](https://docs.gusto.com/embedded-payroll/docs/webhook-events) - Event reference
- [ADP Developer Resources](https://developers.adp.com/) - Enterprise-focused
- [ADP API Central](https://www.adp.com/what-we-offer/integrations/api-central.aspx) - Self-service
- [Paychex Developer Portal](https://developer.paychex.com/) - Mid-market
- [Intuit Developer](https://developer.intuit.com/) - QuickBooks Payroll
- [QuickBooks Payroll API](https://developer.intuit.com/app/developer/qbo/docs/workflows/integrate-with-payroll-api) - Premium tier
- [Rippling Developer](https://developer.rippling.com/) - Modern platform
- [OnPay API](https://onpay.io/docs/technical/api_v1.html) - Basic documentation

### Unified API Platforms
- [Finch API](https://www.tryfinch.com/) - Primary recommendation
- [Finch Developer Docs](https://developer.tryfinch.com/) - Technical documentation
- [Merge Unified API](https://www.merge.dev/) - Alternative option
- [Bindbee](https://www.bindbee.dev/) - Another alternative

### Competitor Integrations
- [Buildertrend + Gusto Integration](https://buildertrend.com/integration/gusto/) - Reference model
- [Gusto + Buildertrend Help](https://support.gusto.com/article/232383527100000/Integrate-with-Buildertrend) - Implementation details
- [Procore Workforce Management](https://www.procore.com/workforce-management) - Enterprise approach
- [Procore Timesheets](https://www.procore.com/resource-tracking/timesheets) - Time tracking

### Market Research
- [Construction Payroll Software Market](https://www.marketresearchintellect.com/product/construction-payroll-software-market/) - Market size
- [Best Construction Payroll Software 2026](https://www.workyard.com/compare/construction-payroll-software) - Comparison
- [Payroll Integration Guide](https://www.tryfinch.com/blog/the-ultimate-guide-to-payroll-integrations) - Finch
- [Time Tracking Integration Benefits](https://arcoro.com/resources/benefits-of-time-tracking-payroll-integration) - Best practices

### Integration Best Practices
- [Construction Payroll Workflow](https://www.ebacon.com/payroll/streamlining-your-construction-payroll-workflow-efficiency-a-complete-guide/) - eBacon
- [Payroll Integration Patterns](https://peoplemanagingpeople.com/payroll-compensation/payroll-integration/) - People Managing People
- [Employee Offboarding Automation](https://blog.invgate.com/employee-offboarding-automation) - Termination workflows

---

*Report generated for ContractorOS integration planning.*
*Version 2.0 - February 3, 2026*
*Expanded with competitive analysis, architecture decisions, and unified API comparison.*
