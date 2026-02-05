# ContractorOS Strategic Roadmap - Next Sprints

> **Created:** 2026-02-02
> **Author:** Controller Session (Claude Opus 4.5)
> **Purpose:** Comprehensive platform analysis and sprint planning for hardening, demo account, and AI Assistant completion

---

## Executive Summary

ContractorOS is **~75% complete** with strong foundations in place. The platform has:
- **80+ dashboard pages** across 5 portals
- **272+ components** with consistent UI patterns
- **57 custom hooks** for data management
- **355+ TypeScript definitions** for type safety
- **13 E2E test suites** for quality assurance

### What's Working Well
- Project Management: 95% complete
- Financial System (Invoices, Estimates): 90% complete
- Scheduling & Calendar: 85% complete
- Client Portal: 80% complete
- Mobile Components: 70% complete

### What Needs Work
- AI Assistant: 90% architecture, 70% functionality
- Integrations (QBO, Twilio): 60% complete
- Offline/PWA: 50% complete
- Demo Data: 0% complete

---

## Platform Completeness Analysis

### Feature Completion Matrix

| Module | Pages | Components | Hooks | Completion |
|--------|-------|------------|-------|------------|
| **Dashboard Core** | 12 | 45 | 12 | 95% |
| **Projects** | 8 | 32 | 8 | 95% |
| **Estimates** | 6 | 24 | 6 | 90% |
| **Invoices** | 5 | 18 | 5 | 90% |
| **Clients** | 4 | 14 | 4 | 90% |
| **Scheduling** | 4 | 16 | 4 | 85% |
| **Time Tracking** | 3 | 12 | 4 | 85% |
| **Materials** | 3 | 10 | 3 | 80% |
| **Client Portal** | 6 | 20 | 5 | 80% |
| **E-Signature** | 4 | 15 | 4 | 75% |
| **Sub Portal** | 5 | 14 | 3 | 70% |
| **Field Portal** | 4 | 12 | 3 | 65% |
| **Reports** | 4 | 18 | 4 | 60% |
| **AI Assistant** | 2 | 8 | 2 | 70% |
| **Notifications** | 2 | 6 | 2 | 60% |
| **Offline/PWA** | 1 | 4 | 2 | 50% |
| **Intelligence** | 2 | 8 | 3 | 40% |

### "Coming Soon" Placeholders Found

| Location | Feature | Priority |
|----------|---------|----------|
| `/dashboard/reports/custom` | Custom report builder | P2 |
| `/dashboard/settings/billing` | Subscription management | P3 |
| `/dashboard/integrations/zapier` | Zapier integration | P3 |
| `/dashboard/templates/contracts` | Contract templates | P2 |
| `/field/safety-checklist` | Safety checklist feature | P2 |
| `/sub/documents` | Document management | P2 |

---

## Security Audit Summary

### ✅ Completed Security Fixes (This Session)

| Fix | Commit | Description |
|-----|--------|-------------|
| Twilio Webhook Auth | `d53ba56` | HMAC-SHA1 signature verification |
| Stream Auth | `2d00ef0` | Firebase token verification for SSE |
| Payment Link Auth | `e63756b` | Token validation for payment endpoints |
| Firestore Indexes | `9923533` | 12 composite indexes added |

### ⚠️ Remaining Security Items

| Issue | Severity | Location | Fix Required |
|-------|----------|----------|--------------|
| Rate limiting not enforced | Medium | `lib/assistant/security/rate-limiter.ts` | Wire up to API routes |
| Prompt guard audit logging | Low | `lib/assistant/security/prompt-guard.ts` | Add Firestore logging |
| API key exposure in client | Medium | Various hooks | Move to server-side |
| Missing CSRF protection | Medium | Form submissions | Add CSRF tokens |
| Incomplete auth on uploads | Medium | File upload routes | Verify all routes |

### Security Recommendations

1. **Enable rate limiting** on all API routes (30 min)
2. **Add audit logging** for security events (2 hours)
3. **Review all API routes** for auth verification (1 hour)
4. **Add CSRF protection** to forms (2 hours)

---

## Incomplete Features Inventory

### High Priority (Blocks core workflows)

| Feature | Location | Status | Fix Effort |
|---------|----------|--------|------------|
| **Signed PDF Generation** | `lib/esignature/pdf-service.ts` | Returns error | 8 hours |
| **OpenAI Model Adapter** | `lib/assistant/models/` | Not implemented | 4 hours |
| **Document PDF Types** | `lib/esignature/pdf-service.ts` | Only estimates work | 6 hours |
| **Message File Uploads** | `app/client/[token]/messages/` | TODO placeholder | 4 hours |
| **Auto-numbering** | Estimates/Invoices | Manual entry only | 2 hours |

### Medium Priority (Important but workarounds exist)

| Feature | Location | Status | Fix Effort |
|---------|----------|--------|------------|
| AI TTS (Text-to-Speech) | VoiceInput component | Not implemented | 4 hours |
| AI Quick Actions | useAssistant hook | Only 2 of 7 work | 6 hours |
| AI Settings UI | Settings page | Not built | 6 hours |
| AI Message Persistence | Firestore | Not implemented | 4 hours |
| Widget Lazy Loading | widget-registry.ts | Returns null | 2 hours |
| Bulk Operation Confirmations | Bulk components | Basic only | 3 hours |

### Low Priority (Polish items)

| Feature | Location | Status | Fix Effort |
|---------|----------|--------|------------|
| W-9 Upload | Onboarding | TODO placeholder | 2 hours |
| Voice Log Pub/Sub | API route | Blocking call | 3 hours |
| Report Pagination | Reports system | TODO in docs | 4 hours |
| Multi-language | Throughout | Not started | 40+ hours |

---

## AI Assistant Completion Plan

### Current Status: 70% Functional

**What Works:**
- ✅ Chat UI with streaming responses
- ✅ Multi-model support (Gemini default, Claude pro)
- ✅ Voice input via Web Speech API
- ✅ Context building (org, project, user)
- ✅ Server-side data loading
- ✅ Security (prompt guard, output guard)
- ✅ Keyboard shortcuts (Cmd+K)

**What's Missing:**

| Feature | Priority | Effort | Sprint |
|---------|----------|--------|--------|
| Text-to-Speech responses | P1 | 4h | 24 |
| Settings UI page | P1 | 6h | 24 |
| Message persistence | P1 | 4h | 24 |
| Quick action handlers (5 remaining) | P1 | 6h | 24 |
| OpenAI adapter | P2 | 4h | 24 |
| Suggested actions AI | P2 | 4h | 25 |
| Usage tracking dashboard | P2 | 4h | 25 |
| Offline message queue | P3 | 4h | 26 |
| Conversation history | P3 | 3h | 26 |

### AI Sprint 24 Plan (Recommended)

**Duration:** 2 days
**Focus:** Make AI Assistant fully functional

Tasks:
1. Build Settings UI at `/dashboard/settings/assistant`
2. Implement TTS with Web Speech API
3. Add message persistence to Firestore
4. Wire up remaining quick actions
5. Add OpenAI adapter for enterprise tier
6. Test voice input/output flow end-to-end

---

## Demo Account Plan

### Purpose
Create a realistic demo organization with:
- 12 months of historical data
- Active projects in various states
- Financial records (paid, unpaid, overdue)
- Team members with activity
- Client interactions

### Demo Organization Structure

```
Demo Organization: "Horizon Construction Co."
├── Owner: Mike Johnson (owner@demo.contractoros.com)
├── Project Manager: Sarah Williams
├── Foreman: Carlos Rodriguez
├── Field Workers: 3 employees
└── Office Staff: 1 admin

Clients (8):
├── Residential (5)
│   ├── Smith Family - Kitchen Remodel (completed)
│   ├── Garcia Residence - Bathroom Addition (active)
│   ├── Thompson Home - Deck Build (upcoming)
│   ├── Wilson Property - Fence Installation (completed)
│   └── Brown House - Basement Finish (on hold)
└── Commercial (3)
    ├── Downtown Cafe - Tenant Improvement (active)
    ├── Main St. Retail - Storefront Renovation (completed)
    └── Office Park - Suite Buildout (upcoming)

Projects (12):
├── Completed (5) - with full history
├── Active (4) - various stages
├── Upcoming (2) - scheduled
└── On Hold (1) - pending client decision
```

### Data Requirements

| Data Type | Records | Date Range |
|-----------|---------|------------|
| Projects | 12 | 12 months |
| Estimates | 18 | 14 months |
| Invoices | 45 | 12 months |
| Payments | 38 | 12 months |
| Time Entries | 500+ | 12 months |
| Tasks | 150+ | 12 months |
| Photos | 80+ | 10 months |
| Messages | 120+ | 12 months |
| Change Orders | 8 | 8 months |
| Daily Logs | 200+ | 10 months |

### Demo Data Seed Script

Create `scripts/seed-demo-data.ts`:

```typescript
// Phases:
// 1. Create organization & users
// 2. Create clients with history
// 3. Create projects with realistic timelines
// 4. Generate financial records
// 5. Add time tracking data
// 6. Create communication history
// 7. Add photos and documents
```

### Demo Scenarios to Support

| Scenario | Data Required |
|----------|---------------|
| New estimate walkthrough | Empty client, blank estimate |
| Active project management | Project at 60% with issues |
| Invoice collection | Mix of paid/unpaid/overdue |
| Client portal demo | Active project with messages |
| Reporting demo | Full year of financial data |
| Mobile field demo | Active project with photos |
| AI Assistant demo | Rich context to query |

---

## Sprint Planning: Next 4 Sprints

### Sprint 24: AI Assistant Completion (2 days)
**Goal:** Make AI Assistant production-ready

| Task | Assignee | Hours |
|------|----------|-------|
| Settings UI page | Session 1 | 6 |
| TTS implementation | Session 1 | 4 |
| Message persistence | Session 2 | 4 |
| Quick action handlers | Session 2 | 6 |
| OpenAI adapter | Session 3 | 4 |
| E2E AI testing | Session 4 | 4 |

**Deliverable:** Fully functional AI Assistant

### Sprint 25: Platform Hardening (2 days)
**Goal:** Fix remaining security and incomplete features

| Task | Assignee | Hours |
|------|----------|-------|
| Signed PDF generation | Session 1 | 8 |
| Rate limiting enforcement | Session 2 | 2 |
| Audit logging | Session 2 | 3 |
| Auto-numbering system | Session 3 | 2 |
| File upload completion | Session 3 | 4 |
| Security audit fixes | Session 4 | 4 |

**Deliverable:** Production-hardened platform

### Sprint 26: Demo Account (2 days)
**Goal:** Create comprehensive demo data

| Task | Assignee | Hours |
|------|----------|-------|
| Seed script framework | Session 1 | 4 |
| Organization & users | Session 1 | 2 |
| Projects & clients | Session 2 | 4 |
| Financial records | Session 2 | 4 |
| Time & activities | Session 3 | 4 |
| Photos & documents | Session 3 | 3 |
| Verify & test | Session 4 | 4 |

**Deliverable:** Realistic demo organization

### Sprint 27: Polish & Launch Prep (3 days)
**Goal:** Final polish before beta

| Task | Assignee | Hours |
|------|----------|-------|
| UI consistency audit | Session 1 | 6 |
| Error handling review | Session 2 | 4 |
| Performance optimization | Session 2 | 4 |
| Documentation update | Session 3 | 4 |
| Full E2E regression | Session 4 | 8 |
| Bug fixes from testing | All | 8 |

**Deliverable:** Beta-ready platform

---

## Technical Debt Inventory

### Must Fix Before Beta

| Item | Location | Effort | Impact |
|------|----------|--------|--------|
| No pagination on lists | All list pages | 8h | Scale issues |
| Silent error handling | Various hooks | 4h | User confusion |
| Missing loading states | Some pages | 3h | UX issues |
| Inconsistent date formats | Throughout | 2h | Confusion |
| Duplicate utilities | convertTimestamps | ✅ Fixed | - |

### Can Defer

| Item | Location | Effort | Impact |
|------|----------|--------|--------|
| Unit tests missing | All components | 40h+ | Dev velocity |
| Storybook setup | Components | 8h | Documentation |
| API documentation | All routes | 8h | Integration |
| i18n framework | Throughout | 40h+ | Markets |

---

## Recommended CLI Prompts for Next Session

### Session 1: AI Settings & TTS
```
You are SESSION 1: AI Assistant Settings. Your task is to:

1. Create apps/web/app/dashboard/settings/assistant/page.tsx
   - Toggle to enable/disable AI Assistant
   - Model selector (Gemini Free / Claude Pro / GPT-4 Enterprise)
   - Response style (concise / detailed)
   - Voice settings (enable TTS, voice selection)

2. Update lib/assistant/voice-service.ts
   - Add text-to-speech using window.speechSynthesis
   - Support voice selection
   - Handle speech queue

3. Add Firestore schema for settings:
   organizations/{orgId}/settings/assistant

DO NOT touch files outside your assigned scope.
Run 'npx tsc --noEmit' when done.
```

### Session 2: Message Persistence & Actions
```
You are SESSION 2: AI Message Persistence. Your task is to:

1. Add Firestore collection: organizations/{orgId}/assistantConversations/{conversationId}/messages/{messageId}

2. Update useAssistant.ts to:
   - Save messages to Firestore
   - Load conversation history on mount
   - Support conversation management (new, clear, history)

3. Implement remaining quick action handlers:
   - create_estimate → navigate to /estimates/new with prefill
   - log_time → open time entry modal
   - take_photo → trigger mobile camera
   - view_report → navigate to specific report
   - send_message → open messaging panel

DO NOT touch files outside your assigned scope.
Run 'npx tsc --noEmit' when done.
```

### Session 3: OpenAI Adapter
```
You are SESSION 3: OpenAI Adapter. Your task is to:

1. Create apps/web/lib/assistant/models/openai-adapter.ts
   - Implement ModelAdapter interface
   - Support chat() and stream() methods
   - Use openai package from npm
   - Handle rate limits gracefully

2. Update model-router.ts to support OpenAI
   - Add 'openai' case to getModelAdapter()
   - Configure for GPT-4o and GPT-4o-mini

3. Add OPENAI_API_KEY to environment variables documentation

DO NOT touch files outside your assigned scope.
Run 'npx tsc --noEmit' when done.
```

### Session 4: E2E AI Testing
```
You are SESSION 4: AI Assistant E2E Testing. Your task is to:

1. Create apps/web/e2e/suites/24-ai-assistant.md with tests:
   - AI panel opens with Cmd+K
   - Chat message sends and receives response
   - Voice input activates (if browser supports)
   - Quick actions navigate correctly
   - Settings page loads and saves
   - Model selection works
   - Error states display correctly

2. Run tests against localhost:3000 using Chrome MCP
3. Document any failures in test results

Report findings but DO NOT fix bugs directly.
```

---

## Success Metrics

### Sprint 24 (AI Complete)
- [ ] Settings page functional
- [ ] TTS working in Chrome/Safari
- [ ] Messages persist across sessions
- [ ] All 7 quick actions work
- [ ] OpenAI adapter functional

### Sprint 25 (Hardened)
- [ ] All security items addressed
- [ ] Signed PDF generation works
- [ ] Auto-numbering implemented
- [ ] No "not implemented" errors

### Sprint 26 (Demo Ready)
- [ ] Demo org with 12 months data
- [ ] All demo scenarios work
- [ ] Demo can run without errors
- [ ] AI has rich context to query

### Sprint 27 (Beta Ready)
- [ ] E2E tests 100% passing
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] Performance acceptable

---

## Appendix: File Inventory

### Key Directories

```
apps/web/
├── app/                    # 80+ pages
│   ├── dashboard/          # Main PM dashboard (35 pages)
│   ├── client/             # Client portal (6 pages)
│   ├── sub/                # Sub portal (5 pages)
│   ├── field/              # Field portal (4 pages)
│   ├── sign/               # E-signature (2 pages)
│   ├── api/                # API routes (25+ routes)
│   └── onboarding/         # Onboarding (3 pages)
├── components/             # 272+ components
│   ├── ui/                 # Shared UI (40+)
│   ├── projects/           # Project components
│   ├── estimates/          # Estimate components
│   ├── invoices/           # Invoice components
│   ├── assistant/          # AI assistant
│   └── ...
├── lib/                    # Utilities & hooks
│   ├── hooks/              # 57 custom hooks
│   ├── firebase/           # Firebase config
│   ├── assistant/          # AI assistant lib
│   └── ...
└── types/                  # TypeScript (6000+ lines)
```

---

*Document generated by Controller Session analysis of platform completeness, security audit, incomplete features scan, and AI assistant audit agents.*
