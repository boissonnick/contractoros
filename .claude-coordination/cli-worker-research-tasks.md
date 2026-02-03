# CLI Worker Prompt: Integration Research Tasks (7-14)

**Copy this entire prompt into a new Claude Code session to execute research tasks.**

---

## Context

You are CLI 4 working on ContractorOS Sprint 39. Your role is to create comprehensive research documents for future integration work. These documents will guide implementation in future sprints.

**Project:** ContractorOS - Construction project management platform
**Location:** `/Users/nickbodkins/contractoros`
**Output Directory:** `docs/research/`

---

## Your Tasks

Create the following research documents. Each should follow the template below and be thorough enough to guide implementation.

### Task 7: Animation Guidelines (Issue #28)
**File:** `docs/ANIMATION_GUIDELINES.md`
**Effort:** 2-3h

Create animation design guidelines for the platform:
- Animation philosophy (subtle, purposeful, non-distracting)
- Approved animation types (fade, slide, scale)
- Forbidden animations (bounce, continuous pulse, spin except loading)
- CSS/Tailwind implementation patterns
- Accessibility considerations (prefers-reduced-motion)
- Examples of good vs bad animations

---

### Task 8: Bank Integration Research (Issue #51)
**File:** `docs/research/BANK_INTEGRATION.md`
**Effort:** 20-30h

Research bank transaction connectivity:

**Vendors to Evaluate:**
- Plaid (market leader)
- Yodlee (enterprise focus)
- MX (credit union focus)
- Finicity (Mastercard)

**Research Areas:**
1. Pricing models (per-connection, per-API-call, tiered)
2. API capabilities (transactions, balances, identity, auth)
3. Security requirements (PCI-DSS, SOC2, encryption)
4. OAuth/Link flow implementation
5. Webhook support for real-time updates
6. Sandbox/testing environments

**Deliverable:** Vendor comparison matrix with recommendation

---

### Task 9: Neobank Integration Research (Issue #52)
**File:** `docs/research/NEOBANK_INTEGRATION.md`
**Effort:** 4-6h

Research neobank/corporate card integrations:

**Vendors:**
- Brex (startup focused)
- Ramp (expense management)
- Mercury (banking for startups)
- Relay (small business)
- BlueVine (business banking)

**Research Areas:**
1. API capabilities (transactions, cards, spend limits)
2. Real-time transaction webhooks
3. Receipt matching features
4. Category mapping
5. Integration complexity

---

### Task 10: Payroll Integration Planning (Issue #58)
**File:** `docs/research/PAYROLL_INTEGRATION.md`
**Effort:** 8-12h

Map ContractorOS payroll data to external providers:

**Target Platforms:**
- Gusto (SMB leader)
- ADP (enterprise)
- QuickBooks Payroll
- Paychex

**Research Areas:**
1. API capabilities (employees, payroll runs, time)
2. OAuth connection flow
3. Data field mapping (our fields → their fields)
4. Bi-directional sync requirements
5. Compliance considerations

**Include:** Data mapping table showing field translations

---

### Task 11: Messaging Architecture Research (Issue #61)
**File:** `docs/research/MESSAGING_ARCHITECTURE.md`
**Effort:** 40-60h (comprehensive)

Design messaging/communication platform:

**Competitive Analysis:**
- Slack (channels, threads, integrations)
- Microsoft Teams (enterprise, Office integration)
- Asana/Monday.com (project-linked messaging)
- Buildertrend/Procore (construction-specific)

**Open Source Evaluation:**
- Rocket.Chat
- Mattermost
- Zulip

**Architecture Decisions:**
1. Real-time technology (WebSockets, Firebase RTDB, Pusher)
2. Message storage (Firestore, dedicated DB)
3. Thread model (flat, threaded, project-linked)
4. Multi-channel (in-app, SMS, email) routing
5. Search and history requirements
6. File/media sharing
7. @mentions and notifications

**Include:** Architecture diagram proposal

---

### Task 12: Custom Reports Builder Research (Issue #67)
**File:** `docs/research/CUSTOM_REPORTS.md`
**Effort:** 30-40h

Research custom reporting capabilities:

**Tools to Evaluate:**
| Tool | Type | Use Case |
|------|------|----------|
| Metabase | BI Platform | Self-serve analytics |
| Apache Superset | BI Platform | Open source alternative |
| Grafana | Dashboards | Ops/metrics focus |
| Recharts | Library | React-native charts |
| Plotly | Library | Interactive visualization |
| BIRT | Reporting | Document generation |

**Requirements to Address:**
1. Drag-and-drop report builder
2. Saved report templates
3. Scheduled report delivery
4. Export formats (PDF, Excel, CSV)
5. Real-time vs cached data
6. Permission model (who can build/view)

---

### Task 13: AI-Powered Insights Research (Issue #73)
**File:** `docs/research/AI_INSIGHTS.md`
**Effort:** 12-16h

Design AI-powered business insights:

**Feature Categories:**
1. **Anomaly Detection**
   - Unusual expenses (amount, category, frequency)
   - Schedule slippage patterns
   - Budget overrun predictions

2. **Predictive Insights**
   - Project completion estimates
   - Cash flow forecasting
   - Resource utilization predictions

3. **Natural Language**
   - Report summaries in plain English
   - "What's at risk this week?"
   - Trend explanations

4. **Actionable Alerts**
   - Proactive recommendations
   - Risk notifications
   - Optimization suggestions

**Technical Approach:**
- Model selection (OpenAI, Claude, custom)
- Data pipeline for training/inference
- Privacy/security considerations
- Cost estimation

---

### Task 14: AI Provider Management Research (Issues #88, #90-93)
**File:** `docs/research/AI_PROVIDER_MANAGEMENT.md`
**Effort:** 20-30h

Design multi-provider AI configuration:

**Features:**
1. **Default AI Toggle (#88)**
   - Opt-in/out for AI features
   - Anonymized data contribution

2. **User OAuth Connection (#90)**
   - Connect user's own OpenAI account
   - Connect Anthropic account
   - Connect Google AI account

3. **API Key Management (#91)**
   - Secure key storage (AES-256)
   - Key rotation support
   - Usage tracking

4. **Multi-Provider Support (#92)**
   - Provider selection per feature
   - Fallback chains
   - Cost optimization routing

5. **Security (#93)**
   - Encryption at rest
   - Audit logging
   - Per-org isolation
   - Key expiration

**Include:** Security architecture diagram

---

## Document Template

Use this structure for each research document:

```markdown
# [Feature Name] Research

**Author:** CLI 4 (Research Worker)
**Date:** 2026-02-XX
**Status:** Draft
**Sprint:** 39
**Issue:** #XX

---

## Executive Summary

[2-3 paragraph overview of findings and recommendation]

---

## Requirements

### Business Requirements
- Requirement 1
- Requirement 2

### Technical Requirements
- Requirement 1
- Requirement 2

---

## Options Evaluated

| Option | Pros | Cons | Cost | Complexity | Recommendation |
|--------|------|------|------|------------|----------------|
| A | ... | ... | $X/mo | Low | ⭐ Recommended |
| B | ... | ... | $Y/mo | Medium | |
| C | ... | ... | $Z/mo | High | |

### Option A: [Name]
[Detailed analysis]

### Option B: [Name]
[Detailed analysis]

---

## Recommendation

[Clear recommendation with rationale]

---

## Implementation Plan

### Phase 1: Foundation (X weeks)
- Task 1
- Task 2

### Phase 2: Core Features (X weeks)
- Task 1
- Task 2

### Phase 3: Polish (X weeks)
- Task 1
- Task 2

---

## Estimated Effort

| Phase | Hours | Dependencies |
|-------|-------|--------------|
| Research | X | None |
| Design | X | Research |
| Implementation | X | Design |
| Testing | X | Implementation |
| **Total** | **X** | |

---

## Security Considerations

- Consideration 1
- Consideration 2

---

## Open Questions

- [ ] Question 1
- [ ] Question 2

---

## References

- [Link 1](url)
- [Link 2](url)
```

---

## Execution Instructions

1. Create docs/research/ directory if it doesn't exist
2. Work through tasks in order (7 first, then 8-14)
3. Use WebSearch for current pricing and API documentation
4. Be thorough - these docs guide future implementation
5. Commit each document as you complete it:
   ```bash
   git add docs/research/FILENAME.md
   git commit -m "docs(research): Add [Feature] research document"
   ```

---

## Commands

```bash
# Create research directory
mkdir -p /Users/nickbodkins/contractoros/docs/research

# Check existing docs
ls -la /Users/nickbodkins/contractoros/docs/

# Commit a research doc
cd /Users/nickbodkins/contractoros
git add docs/research/BANK_INTEGRATION.md
git commit -m "docs(research): Add bank integration research

Evaluates Plaid, Yodlee, MX, Finicity for transaction connectivity.
Recommends Plaid for SMB market fit and developer experience.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

Each document should:
- [ ] Follow the template structure
- [ ] Include vendor/option comparison matrix
- [ ] Have clear recommendation with rationale
- [ ] Include implementation phases with effort estimates
- [ ] Address security considerations
- [ ] List open questions for future resolution
- [ ] Be committed to git

---

**Start with Task 7 (Animation Guidelines) as it's quickest, then proceed to the integration research tasks.**
