# Payroll Integration Research

**Author:** CLI 4 (Research Worker)
**Date:** 2026-02-02
**Status:** Draft
**Sprint:** 39
**Issue:** #58

---

## Executive Summary

This document evaluates payroll provider integrations for ContractorOS to enable seamless time-to-payroll workflows for construction businesses. After evaluating Gusto, ADP, QuickBooks Payroll, and Paychex, we recommend a **tiered approach** using a unified API:

1. **Primary: Finch Unified API** — Connect to 200+ payroll systems via single integration
2. **Direct Integration: Gusto** — Best SMB fit, excellent developer experience
3. **Enterprise Option: ADP API Central** — For large contractors on ADP Workforce Now

The construction industry needs bi-directional sync: pushing time entries from ContractorOS to payroll and pulling employee/rate data back. Using Finch reduces integration effort from 200+ hours (multiple direct integrations) to ~40 hours (single unified API).

---

## Requirements

### Business Requirements

- Sync time entries from ContractorOS to payroll systems
- Import employee data (names, rates, tax info)
- Support multiple pay types (hourly, salary, overtime, PTO)
- Handle construction-specific needs (prevailing wage, certified payroll)
- Weekly/bi-weekly/semi-monthly pay periods
- Job costing by project

### Technical Requirements

- REST API with JSON
- OAuth 2.0 authentication
- Webhook support for sync notifications
- Sandbox/testing environments
- Rate limiting appropriate for batch operations
- GDPR/privacy compliance for employee data

---

## ContractorOS Payroll Data Model

### Current Types (types/index.ts)

```typescript
// PayrollEntry (lines 6410-6471)
interface PayrollEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeType: EmployeeType;

  // Hours
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours: number;
  ptoHours: number;
  sickHours: number;
  holidayHours: number;

  // Rates
  regularRate: number;
  overtimeRate: number;    // Multiplier (1.5)
  doubleTimeRate: number;  // Multiplier (2.0)

  // Earnings
  regularPay: number;
  overtimePay: number;
  grossPay: number;
  netPay: number;

  // Deductions
  federalWithholding: number;
  stateWithholding: number;
  socialSecurity: number;
  medicare: number;
  // ...etc
}

// PayrollRun (lines 6474-6504)
interface PayrollRun {
  id: string;
  orgId: string;
  payPeriod: PayPeriod;
  status: PayrollRunStatus;
  entries: PayrollEntry[];
  // ...etc
}
```

---

## Options Evaluated

| Provider | Target Market | API Access | Integration Effort | Cost | Recommendation |
|----------|---------------|------------|-------------------|------|----------------|
| **Finch** | All (unified) | Open | Low (40h) | $0.50-2/employee | Primary |
| **Gusto** | SMB | Partner program | Medium (80h) | $80+$12/person | Direct fallback |
| **ADP** | Mid-Enterprise | API Central | High (120h) | Custom | Enterprise only |
| **QuickBooks** | SMB | Partner program | Medium (80h) | Varies | Via Finch |
| **Paychex** | SMB-Mid | Developer portal | High (100h) | Custom | Via Finch |

---

## Detailed Analysis

### Option A: Finch Unified API (Recommended)

**Overview:** Single API to connect with 200+ HRIS and payroll systems including Gusto, ADP, QuickBooks, Paychex, BambooHR, Rippling, and more.

#### Why Finch?

Instead of building individual integrations with each payroll provider:
- **One integration** → 200+ systems
- **Normalized data** → Consistent employee/payroll schema
- **Assisted connections** → Finch helps with providers without APIs
- **Reduced maintenance** → Finch handles API changes

#### Pricing

| Tier | Cost | Includes |
|------|------|----------|
| **Starter** | $0.50/employee/mo | Core data sync |
| **Growth** | $1.00/employee/mo | + Webhooks, faster sync |
| **Enterprise** | $2.00/employee/mo | + Assisted connections |

For 100 employees: $50-200/month vs. 200+ hours engineering time

#### Supported Providers

Finch connects to (partial list):
- Gusto, ADP Workforce Now, Paychex Flex
- QuickBooks Payroll, Rippling, Deel
- BambooHR, Zenefits, Paylocity
- Namely, Justworks, TriNet
- 190+ more...

#### API Capabilities

```javascript
// Finch API endpoints
GET  /employer/company         // Company info
GET  /employer/directory       // Employee list
GET  /employer/individual      // Employee details
GET  /employer/employment      // Employment details (title, dept)
GET  /employer/payment         // Pay statements
GET  /employer/pay-statement   // Detailed earnings/deductions

// Write APIs (for payroll sync)
POST /employer/pay-statement   // Create pay entries
```

#### Data Model Mapping

| ContractorOS Field | Finch Field | Notes |
|-------------------|-------------|-------|
| `employeeId` | `individual_id` | Unique identifier |
| `employeeName` | `first_name + last_name` | Combined |
| `regularRate` | `income.amount` | From employment data |
| `regularHours` | `earnings.hours` | In pay statement |
| `overtimeHours` | `earnings.hours` (type: overtime) | Separate entry |
| `grossPay` | `gross_pay` | Total earnings |
| `netPay` | `net_pay` | After deductions |
| `federalWithholding` | `taxes.type: federal` | Tax entry |
| `stateWithholding` | `taxes.type: state` | Tax entry |

---

### Option B: Gusto Direct Integration

**Overview:** Direct integration with Gusto for customers specifically on Gusto payroll.

#### Access Requirements

- Apply to **App Integrations Program**
- Security review required
- ~2 months for production keys
- Annual security assessment

#### API Capabilities

```javascript
// Gusto API endpoints
GET  /v1/companies/:id/employees        // Employee list
GET  /v1/employees/:id                   // Employee details
GET  /v1/companies/:id/payrolls          // Payroll runs
POST /v1/companies/:id/payrolls/:id/calculate  // Calculate payroll
GET  /v1/companies/:id/pay_periods       // Pay periods

// Time tracking sync
POST /v1/companies/:id/time_off_entries  // Time off
POST /v1/companies/:id/pay_schedules     // Schedules
```

#### Time Tracking API

Gusto offers a dedicated Time Tracking API:
- Send classified time data directly
- Payroll-aware pay types (regular, OT, holiday)
- Compliance-checked entries

```javascript
// Sync time entries to Gusto
POST /v1/companies/:company_id/time_tracking/pay_periods/:pay_period_id

{
  "employee_uuid": "abc123",
  "pay_type": "regular",
  "hours": 8.0,
  "date": "2026-02-02"
}
```

#### Pricing

| Plan | Base | Per Person |
|------|------|------------|
| Simple | $40/mo | $6/person |
| Plus | $80/mo | $12/person |
| Premium | Custom | Custom |

Time tracking requires Plus plan ($80 + $12/person).

---

### Option C: ADP API Central

**Overview:** Enterprise-grade API for ADP Workforce Now customers.

#### Access Requirements

- ADP API Central subscription
- Developer agreement required
- OAuth 2.0 + client certificates
- Partner program may require business development investment

#### API Capabilities

```javascript
// ADP Workforce Now APIs
GET  /hr/v2/workers                    // Employee list
GET  /payroll/v1/payroll-outputs       // Payroll results
POST /time/v2/time-cards               // Time entries
GET  /payroll/v1/earnings              // Earnings setup
GET  /payroll/v1/deductions            // Deduction config
```

#### When to Use ADP

- Customer already on ADP Workforce Now
- Large contractor (100+ employees)
- Need deep HR/benefits integration
- Compliance-heavy requirements

---

### Option D: QuickBooks Payroll

**Overview:** Intuit's payroll with tight QuickBooks accounting integration.

#### Access Requirements

- Intuit App Partner Program (tiered)
- Time API requires Gold/Platinum tier
- Annual security assessment
- ~2 months for production keys

#### Premium Time API (Nov 2025)

New Time API with Payroll Compensation:
- Pay type aware (salary, hourly, OT, holiday)
- Integrates with QuickBooks time tracking
- Enables rich billing/reporting

```javascript
// Time API with Payroll Compensation
POST /v3/company/:companyId/timeactivity

{
  "EmployeeRef": { "value": "123" },
  "Hours": 8,
  "Minutes": 0,
  "PayTypeRef": { "value": "hourly" },
  "TxnDate": "2026-02-02"
}
```

#### Why Via Finch Instead?

- Complex partner requirements
- Long approval process
- Finch normalizes the data anyway

---

### Option E: Paychex

**Overview:** Mid-market payroll provider with developer portal.

#### Access Requirements

- Apply via developer.paychex.com
- REST API with OAuth 2.0
- Partner agreement required
- Sandbox available

#### API Capabilities

```javascript
// Paychex Flex APIs
GET  /companies/:id/workers         // Employee list
POST /companies/:id/checks          // Create paycheck
GET  /companies/:id/payrolls        // Payroll history
POST /companies/:id/timecards       // Time entries
```

#### Notes

- Only supports employee user types (not contractors)
- Rate limiting requires careful batching
- Documentation quality varies

---

## Recommendation

### Integration Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                       ContractorOS                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Payroll Integration Layer                    │  │
│  │                                                          │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │ Time Entry     │  │ Employee       │                 │  │
│  │  │ Sync Service   │  │ Import Service │                 │  │
│  │  └───────┬────────┘  └───────┬────────┘                 │  │
│  └──────────┼───────────────────┼───────────────────────────┘  │
│             │                   │                              │
│             ▼                   ▼                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Finch Unified API                      │  │
│  │                                                          │  │
│  │  Gusto │ ADP │ QuickBooks │ Paychex │ Rippling │ 195+   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Primary: Finch Unified API

- **Single integration** covers 200+ providers
- **$0.50-2.00/employee/month** is negligible vs. dev cost
- **Normalized data model** simplifies our code
- **Webhooks** for real-time sync

### Fallback: Direct Gusto

For customers who need deeper Gusto features not exposed via Finch:
- Advanced time tracking rules
- Custom pay types
- Direct tax filing visibility

---

## Field Mapping Tables

### Employee Data (Import from Payroll)

| ContractorOS | Finch | Gusto | ADP |
|-------------|-------|-------|-----|
| `userId` | `individual_id` | `uuid` | `worker_id` |
| `displayName` | `first_name + last_name` | `first_name + last_name` | `legal_name` |
| `email` | `emails[0].data` | `email` | `email_address` |
| `phone` | `phone_numbers[0].data` | `phone` | `phone_number` |
| `startDate` | `start_date` | `hire_date` | `hire_date` |
| `payRate` | `income.amount` | `hourly_rate` | `pay_rate.amount` |
| `paySchedule` | N/A | `pay_schedule` | `pay_frequency` |

### Time Entry Data (Export to Payroll)

| ContractorOS | Finch | Gusto | ADP |
|-------------|-------|-------|-----|
| `regularHours` | `earnings[type=regular].hours` | `regular_hours` | `regular_time_hours` |
| `overtimeHours` | `earnings[type=overtime].hours` | `overtime_hours` | `overtime_hours` |
| `doubleTimeHours` | `earnings[type=double_time].hours` | `double_overtime_hours` | `double_time_hours` |
| `ptoHours` | `earnings[type=pto].hours` | `paid_time_off` | `pto_hours` |
| `sickHours` | `earnings[type=sick].hours` | `sick_time` | `sick_hours` |
| `projectId` | `metadata.project_id` | `job_id` | `labor_allocation.job` |

### Pay Statement Data (Import)

| ContractorOS | Finch | Gusto | ADP |
|-------------|-------|-------|-----|
| `grossPay` | `gross_pay` | `gross_pay.amount` | `gross_pay` |
| `netPay` | `net_pay` | `net_pay.amount` | `net_pay` |
| `federalWithholding` | `taxes[type=federal].amount` | `taxes.federal_income_tax` | `federal_tax` |
| `stateWithholding` | `taxes[type=state].amount` | `taxes.state_income_tax` | `state_tax` |
| `socialSecurity` | `taxes[type=fica].employer_amount` | `taxes.social_security` | `fica_ee` |
| `medicare` | `taxes[type=fica].employee_amount` | `taxes.medicare` | `medicare_ee` |

---

## Implementation Plan

### Phase 1: Finch Setup (1 week)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Finch developer account | 1h | None |
| OAuth flow implementation | 6h | Account |
| Connection management UI | 8h | OAuth |
| Webhook handler setup | 4h | UI |
| **Subtotal** | **19h** | |

### Phase 2: Employee Import (1-2 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Employee directory sync | 8h | Phase 1 |
| Pay rate import | 4h | Employees |
| Mapping/matching UI | 8h | Import |
| Conflict resolution | 6h | Matching |
| **Subtotal** | **26h** | |

### Phase 3: Time Export (2 weeks)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Time entry aggregation | 8h | Phase 2 |
| Pay period alignment | 6h | Aggregation |
| Push to payroll API | 8h | Alignment |
| Status tracking | 4h | Push |
| Error handling/retry | 6h | Status |
| **Subtotal** | **32h** | |

### Phase 4: Bi-directional Sync (1 week)

| Task | Effort | Dependencies |
|------|--------|--------------|
| Webhook processing | 6h | Phase 3 |
| Pay statement import | 8h | Webhooks |
| Reconciliation reports | 6h | Import |
| **Subtotal** | **20h** | |

---

## Estimated Effort

| Phase | Hours | Dependencies |
|-------|-------|--------------|
| Research | 12h | None (complete) |
| Phase 1: Finch Setup | 19h | Research |
| Phase 2: Employee Import | 26h | Phase 1 |
| Phase 3: Time Export | 32h | Phase 2 |
| Phase 4: Bi-directional | 20h | Phase 3 |
| **Total** | **109h** | |

**Estimated Duration:** 6-8 weeks

---

## Security Considerations

### Data Privacy

- Employee PII (SSN, addresses) requires encryption at rest
- Limit data access to org admins only
- Audit log all payroll data access
- GDPR considerations for employee consent

### Token Management

```typescript
interface PayrollConnection {
  id: string;
  orgId: string;
  provider: string;           // 'finch', 'gusto', etc.
  accessToken: string;        // Encrypted
  refreshToken?: string;      // Encrypted
  expiresAt: Timestamp;
  scopes: string[];
  status: 'active' | 'expired' | 'revoked';
}
```

### Compliance

| Requirement | Approach |
|-------------|----------|
| SOC 2 | Finch is SOC 2 certified |
| Employee consent | OAuth flow requires employee auth |
| Data retention | Follow payroll provider policies |
| Audit trail | Log all sync operations |

---

## Open Questions

- [ ] Should we support multiple payroll connections per org?
- [ ] How do we handle employees in ContractorOS not in payroll system?
- [ ] What's the reconciliation workflow when hours don't match?
- [ ] Do we need certified payroll report support (Davis-Bacon)?
- [ ] How do we handle multi-state employees?
- [ ] Should payroll sync be real-time or batch (daily/weekly)?

---

## References

- [Finch Documentation](https://developer.tryfinch.com/)
- [Finch Integrations](https://www.tryfinch.com/integrations)
- [Gusto Developer Docs](https://docs.gusto.com/)
- [Gusto Time Tracking API](https://docs.gusto.com/app-integrations/docs/syncing-time-tracking-data)
- [ADP Developer Portal](https://developers.adp.com/)
- [ADP API Central](https://www.adp.com/what-we-offer/integrations/api-central.aspx)
- [Intuit Payroll API](https://developer.intuit.com/app/developer/payroll-time/docs/get-started)
- [Paychex Developer](https://developer.paychex.com/)
