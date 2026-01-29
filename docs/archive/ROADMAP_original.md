# ContractorOS — Complete Feature Scope & Roadmap

> The self-hosted, field-first construction management platform.
> Better than BuilderTrend, Knowify, Procore, and Billdr — combined.

---

## Competitive Landscape

### Platforms Analyzed
| Platform | Price | Strengths | Weaknesses |
|----------|-------|-----------|------------|
| **BuilderTrend** | $499–$1,099/mo | Full-featured residential, client portal, selections | Buggy mobile, steep learning curve, too many clicks, no free trial |
| **Knowify** | $149–$249/mo | Great job costing, AIA billing, QuickBooks sync | Scheduling is weak, time tracking glitches, proposal handling limited |
| **Billdr PRO** | $160/mo+ | Fast quoting (3hr→30sec), great client portal, easy onboarding | Smaller feature set, new platform, less proven at scale |
| **Procore** | $10k–$50k/yr | Enterprise-grade, subcontractor compliance, RFIs | Overkill for small teams, very expensive, complex setup |
| **Fieldwire** | $39–$59/user/mo | Best task management, blueprint markup, punch lists | Weak financials, no client portal, limited scheduling |
| **Contractor Foreman** | $49–$148/mo | Cheapest full-featured, 100+ features | UI feels dated, overwhelming feature count |
| **Workyard** | $6–$13/user/mo | Best GPS time tracking, geofencing, mileage | Only time tracking, no project management |
| **ContractorOS** | **Free (self-hosted)** | All-in-one, open, fast, mobile-first, modern UI | Under development |

### Our Competitive Advantages
1. **Free & self-hosted** — No monthly fees, full data ownership
2. **Field-first mobile UX** — Built for phones first, not desktop retrofitted
3. **Modern tech stack** — Next.js 14, Firebase, real-time sync, PWA
4. **Fast onboarding** — Usable in under 5 minutes, not 5 days
5. **Minimal clicks** — Every action in 2-3 taps
6. **Offline-capable** — Works in basements, rural sites, no-signal zones
7. **Open architecture** — API-first, extensible, no vendor lock-in
8. **AI-powered** — Weather forecasts, cost predictions, smart scheduling (planned)

---

## Current State & Critical Fixes Needed

### What's Built ✅
- Firebase Auth with email/password
- Role-based routing (OWNER, PM, EMPLOYEE, CONTRACTOR, SUB, CLIENT)
- Dashboard shells for all roles
- Project list, creation wizard, detail page with Kanban task board
- User onboarding flow with role selection
- Registration with invite token support
- Team management and invite system
- Daily logs per project
- UI component library (Button, Input, Card, Badge, Avatar, EmptyState)
- Standalone Docker deployment on Cloud Run

### Critical Fixes Before Continued Development 🔴
1. **AuthProvider architecture** — Move to root layout, remove duplicates from route layouts
2. **20+ missing route pages** — Every nav link leads to a page that doesn't exist
3. **Error handling** — Replace all `alert()` calls with toast notifications; add error boundaries
4. **Firebase config** — Move API keys to environment variables (`NEXT_PUBLIC_FIREBASE_*`)
5. **Silent failures** — Data fetch errors must show error UI, not just `console.error`
6. **Type safety** — Remove all `as any` casts, properly handle Firestore Timestamps
7. **Form validation** — Wire up react-hook-form + Zod (already installed, not used)
8. **No pagination** — All queries fetch entire collections, will break at scale
9. **No data caching** — Every navigation makes fresh API calls
10. **Accessibility** — Modals need keyboard handlers, focus trapping, escape-to-close

---

## Complete Feature Scope

### TIER 1: Core Platform (Phases 1–3)

#### 1.1 Authentication & Identity
- [ ] **Fix: AuthProvider at root layout**
- [x] Email/password authentication
- [x] Role-based access control (OWNER, PM, EMPLOYEE, CONTRACTOR, SUB, CLIENT)
- [x] User registration with invite token support
- [x] First-time onboarding flow
- [ ] Password reset / forgot password
- [ ] Email verification
- [ ] Profile management (edit name, phone, photo, trade)
- [ ] Session management / force logout
- [ ] Multi-factor authentication (SMS or TOTP)
- [ ] Social login (Google, Apple) for quick client access
- [ ] SSO/SAML for enterprise teams

#### 1.2 Organization Management
- [x] Organization creation during onboarding
- [ ] Organization settings (timezone, work hours, overtime rules)
- [ ] Multiple organizations per user
- [ ] Organization branding (logo, colors for client-facing pages)
- [ ] Subscription/billing management (for future SaaS model)

#### 1.3 Team Management
- [x] Team directory with role badges
- [x] Team invite system with email + role
- [ ] Pending invite management (resend, cancel, expire)
- [ ] Role change / permission editing
- [ ] Deactivate / reactivate team members
- [ ] Skills & certifications tracking (trade licenses, OSHA, etc.)
- [ ] Emergency contact information
- [ ] Employee directory with search and filters

#### 1.4 Project Management
- [x] Project list with search/filter
- [x] Multi-step project creation wizard
- [x] Project detail page
- [ ] Project status workflow (lead → bidding → planning → active → completed)
- [ ] Project templates (kitchen remodel, full reno, new build, etc.)
- [ ] Project archiving and deletion
- [ ] Project duplication / cloning
- [ ] Project timeline with milestones
- [ ] Project notes and activity feed
- [ ] Project tags and categories
- [ ] Multi-project dashboard view

#### 1.5 Task & Scope Management
- [x] Kanban task board (To Do, In Progress, Review, Done)
- [x] Quick task creation
- [x] Task status movement
- [ ] Task list view (sortable table)
- [ ] Task detail modal/page
- [ ] Task assignment to team members
- [ ] Task priority (low, medium, high, urgent) with visual indicators
- [ ] Task due dates and reminders
- [ ] Task estimated vs actual hours
- [ ] Task dependencies (blocked by / blocks)
- [ ] Subtasks and checklists
- [ ] Task templates by trade
- [ ] Task comments and attachments
- [ ] Recurring tasks
- [ ] Bulk task operations (assign, move, delete)
- [ ] Task search and filtering

#### 1.6 Scheduling
- [ ] **Gantt chart view** (interactive, drag-and-drop)
- [ ] Calendar view (day/week/month)
- [ ] Resource scheduling (assign people to dates/projects)
- [ ] Conflict detection (double-booked workers)
- [ ] Schedule templates
- [ ] Schedule sharing with clients
- [ ] Google Calendar / Apple Calendar sync
- [ ] Weather-based schedule adjustments
- [ ] Critical path analysis

---

### TIER 2: Field Operations (Phases 4–5)

#### 2.1 Time Tracking & Clock In/Out
- [x] Basic clock in/out from field dashboard
- [ ] **GPS-verified clock in/out** with location recording
- [ ] **Geofencing** — Auto clock in/out when entering/leaving job site boundaries
- [ ] **Facial recognition / photo verification** — Prevent buddy punching
- [ ] Break tracking (lunch, 15-min breaks)
- [ ] Project/task-based time allocation
- [ ] Weekly timesheet view
- [ ] Timesheet approval workflow (submit → PM review → approve/reject)
- [ ] Overtime calculation (configurable thresholds)
- [ ] Pay period summaries
- [ ] Export to payroll (CSV, QuickBooks, ADP formats)
- [ ] Mileage and travel time tracking
- [ ] Crew clock-in (foreman clocks in entire crew)
- [ ] Offline clock in/out with background sync
- [ ] Historical time entry corrections with audit trail
- [ ] Per diem tracking

#### 2.2 Daily Logs
- [x] Daily log creation with work performed
- [x] Weather conditions (manual selection)
- [x] Worker count tracking
- [x] Materials and equipment notes
- [x] Delay and safety documentation
- [ ] **Weather API integration** — Auto-populate weather from forecast data
- [ ] Photo attachments to daily logs
- [ ] Visitor log (inspectors, clients, vendors on site)
- [ ] Equipment usage log
- [ ] Delivery tracking
- [ ] Daily log templates
- [ ] Daily log PDF export
- [ ] Daily log email to stakeholders
- [ ] Voice-to-text for log entries (field workers have dirty hands)

#### 2.3 GPS & Location Services
- [ ] **Real-time crew location map** — See where all workers are right now
- [ ] **Geofence creation** — Draw boundaries around job sites
- [ ] Location history / breadcrumb trails
- [ ] Drive time estimation between sites
- [ ] Mileage calculation and reporting
- [ ] Location-based project assignment
- [ ] Safety zone alerts

#### 2.4 Weather Integration
- [ ] **7-day weather forecast per project** (via weather API by project zip code)
- [ ] Severe weather alerts for active job sites
- [ ] Weather impact on scheduling (auto-suggest reschedule)
- [ ] Historical weather data for daily logs
- [ ] Temperature and wind speed display on dashboards

#### 2.5 Photos & Documentation
- [ ] **Camera integration** — Take photos directly in-app
- [ ] Photo tagging (before/after/progress/issue/receipt)
- [ ] Photo annotation / markup
- [ ] Photo timeline per project
- [ ] Photo gallery with filtering
- [ ] Document upload (plans, permits, contracts)
- [ ] Document versioning
- [ ] Blueprint/drawing viewer with pinch-zoom
- [ ] Drawing markup tools (redline, annotate)
- [ ] QR code links to documents on-site
- [ ] OCR for receipts and invoices
- [ ] Bulk photo upload

#### 2.6 Tool & Equipment Tracking 🆕
- [ ] **Tool inventory database** — Catalog all owned tools and equipment
- [ ] **Barcode/QR code scanning** — Scan tools in/out to staff via phone camera
- [ ] **Visual identification** — Take photo of tool for identification
- [ ] Check-out / check-in workflow (who has what)
- [ ] Tool assignment to projects and workers
- [ ] Tool location tracking
- [ ] Maintenance scheduling and reminders (service dates, calibration)
- [ ] Tool condition reporting (good, needs repair, retired)
- [ ] Lost/damaged tool reporting
- [ ] Tool purchase history and depreciation
- [ ] Equipment rental tracking (vendor, cost, return date)
- [ ] Barcode label printing support
- [ ] Low inventory alerts for consumable supplies
- [ ] Tool transfer between job sites

#### 2.7 Safety & Compliance
- [ ] **Safety inspection checklists** (customizable templates)
- [ ] Incident reporting with photos and GPS
- [ ] OSHA compliance tracking
- [ ] Toolbox talk / safety meeting log
- [ ] JSA (Job Safety Analysis) forms
- [ ] PPE tracking per worker
- [ ] Near-miss reporting
- [ ] Safety training records
- [ ] Emergency action plans per site
- [ ] First aid log

---

### TIER 3: Financial Tools (Phase 6)

#### 3.1 Estimates & Proposals
- [ ] **Estimate builder** with line items
- [ ] Cost catalog / unit price database
- [ ] Material cost lookup
- [ ] Labor rate calculations
- [ ] Markup and margin settings
- [ ] Estimate templates by project type
- [ ] Proposal generation (branded PDF)
- [ ] Multiple proposal revisions per project
- [ ] Digital signature for acceptance
- [ ] Estimate comparison (internal vs competitor bids)
- [ ] Win/loss tracking

#### 3.2 Invoicing & Billing
- [ ] **Invoice creation** from project/estimate data
- [ ] Progress billing (% complete)
- [ ] AIA-style billing (G702/G703)
- [ ] Change order management with approval workflow
- [ ] Payment tracking (partial, full, overdue)
- [ ] Automated payment reminders
- [ ] Invoice PDF export with branding
- [ ] Online payment portal for clients
- [ ] Recurring invoices for retainers
- [ ] Credit memo support
- [ ] Late fee calculations
- [ ] Lien waiver generation

#### 3.3 Expense Management
- [ ] **Expense capture** (receipt photo + amount)
- [ ] Expense categorization (materials, tools, permits, travel, meals)
- [ ] Expense approval workflow
- [ ] Per-project expense tracking
- [ ] Reimbursement tracking
- [ ] Purchase order creation and management
- [ ] Vendor management database
- [ ] Credit card transaction import
- [ ] Expense reports (weekly/monthly/per project)

#### 3.4 Job Costing & Budgeting
- [ ] **Budget vs actual tracking** per project
- [ ] Cost code system
- [ ] Labor cost tracking (hours × rate)
- [ ] Material cost tracking
- [ ] Subcontractor cost tracking
- [ ] Profit margin analysis per project
- [ ] Real-time profitability dashboard
- [ ] Earned value analysis
- [ ] Cost forecasting
- [ ] Budget alerts (80%, 90%, 100% thresholds)

#### 3.5 Accounting Integration
- [ ] **QuickBooks Online two-way sync**
- [ ] Xero integration
- [ ] CSV export for any accounting system
- [ ] Chart of accounts mapping
- [ ] Tax rate configuration
- [ ] 1099 preparation support

---

### TIER 4: Compliance & Tax (Phase 7) 🆕

#### 4.1 W-9 & Tax Form Collection
- [ ] **Digital W-9 collection** — Send via email/SMS, collect e-signed
- [ ] **TIN verification** — Validate SSN/EIN against IRS records
- [ ] W-9 storage with encryption (4-year retention)
- [ ] Auto-request W-9 during subcontractor onboarding
- [ ] Block payments until W-9 is on file
- [ ] W-9 expiration and renewal reminders
- [ ] Bulk W-9 request for all active subs
- [ ] W-9 audit trail (who submitted, when, verified status)

#### 4.2 1099 Filing
- [ ] **1099-NEC generation** for subcontractors
- [ ] Automatic payment threshold tracking ($600+, $2,000 starting 2026)
- [ ] 1099 filing to IRS (direct or via integration)
- [ ] Copy distribution to subcontractors
- [ ] Year-end tax summary report
- [ ] Backup withholding tracking (24% when missing W-9)

#### 4.3 Insurance & License Compliance
- [ ] **Certificate of Insurance (COI) tracking**
- [ ] Insurance expiration alerts
- [ ] License verification per trade
- [ ] Workers' comp verification
- [ ] Bonding requirements tracking
- [ ] Compliance dashboard (who's current, who's expired)
- [ ] Auto-request updated COIs before expiration
- [ ] Pre-qualification forms for new subcontractors

#### 4.4 Payroll Integration
- [ ] **Certified payroll reports** (Davis-Bacon / prevailing wage)
- [ ] ADP / Gusto / Paychex export
- [ ] Overtime rule configuration (federal, state, local)
- [ ] Holiday pay tracking
- [ ] PTO/vacation tracking
- [ ] Worker classification (W-2 vs 1099) enforcement

---

### TIER 5: Communication & Client Experience (Phase 8)

#### 5.1 In-App Messaging
- [ ] **Real-time chat** (project-based channels)
- [ ] Direct messages between team members
- [ ] @mentions and notifications
- [ ] File/photo sharing in messages
- [ ] Read receipts
- [ ] Message search
- [ ] Threaded conversations
- [ ] Offline message queue

#### 5.2 Notifications
- [ ] **Push notifications** (PWA)
- [ ] Email notifications (configurable per event type)
- [ ] SMS notifications for critical alerts
- [ ] Notification preferences per user
- [ ] Daily digest option
- [ ] Quiet hours setting

#### 5.3 Client Portal
- [x] Project progress view
- [x] Photo gallery
- [x] Invoice history
- [ ] **Selection boards** — Clients choose fixtures, finishes, colors
- [ ] Approval workflows (selections, change orders, draws)
- [ ] Online payment portal
- [ ] Project schedule visibility
- [ ] Milestone notifications
- [ ] Document access (contracts, permits, warranties)
- [ ] Support/request submission
- [ ] Automated progress emails with photos
- [ ] Client satisfaction surveys
- [ ] Warranty tracking and claims

#### 5.4 Subcontractor Portal
- [x] Sub dashboard with bids and availability
- [ ] **Bid request / response system**
- [ ] Bid comparison matrix
- [ ] Contract e-signing
- [ ] Insurance document upload
- [ ] Performance rating system
- [ ] Preferred subcontractor list
- [ ] Sub availability calendar
- [ ] Sub payment history

---

### TIER 6: Intelligence & Reporting (Phase 9)

#### 6.1 Dashboards & Analytics
- [ ] **Executive dashboard** — Revenue, profitability, backlog
- [ ] Project health dashboard (on-time, on-budget indicators)
- [ ] Labor utilization reports
- [ ] Subcontractor performance reports
- [ ] Cash flow forecasting
- [ ] Revenue pipeline (leads → active → complete)
- [ ] Customer acquisition metrics
- [ ] Equipment utilization reports

#### 6.2 Reports
- [ ] **Custom report builder**
- [ ] Project profitability report
- [ ] Labor cost report by project/worker/period
- [ ] Expense report with category breakdowns
- [ ] Time tracking report
- [ ] Safety incident report
- [ ] Client payment aging report
- [ ] Tax summary report
- [ ] Tool inventory report
- [ ] Scheduled PDF delivery via email

#### 6.3 AI-Powered Features (Future)
- [ ] **Smart scheduling** — AI suggests optimal crew assignments
- [ ] **Cost prediction** — Estimate accuracy based on historical data
- [ ] **Photo analysis** — AI detects completion percentage from photos
- [ ] **Weather impact prediction** — Auto-adjust schedules
- [ ] **Material quantity estimation** from blueprints
- [ ] **Anomaly detection** — Flag unusual time entries or expenses
- [ ] **Voice assistant** — Hands-free daily log entry

---

### TIER 7: Platform & Infrastructure (Phase 10)

#### 7.1 PWA / Mobile
- [ ] **PWA manifest and service worker**
- [ ] **Offline mode** — Full functionality without internet
- [ ] Background sync when connection returns
- [ ] Home screen install prompt
- [ ] Push notifications
- [ ] Camera/GPS hardware access
- [ ] Barcode scanner access
- [ ] Biometric app lock

#### 7.2 Performance & Scalability
- [ ] **Firestore query pagination** on all list pages
- [ ] **Data caching layer** (React Query or SWR)
- [ ] Image compression and lazy loading
- [ ] Bundle size optimization (code splitting per route)
- [ ] CDN for static assets
- [ ] Database indexes for all common queries
- [ ] Real-time listeners for live data (Firestore onSnapshot)
- [ ] Server-side rendering for public pages

#### 7.3 Security
- [ ] **Environment variables for all secrets**
- [ ] Firestore security rules (per-org, per-role)
- [ ] Rate limiting on Cloud Functions
- [ ] Input sanitization on all forms
- [ ] CSRF protection
- [ ] Content Security Policy headers
- [ ] Audit logging (who did what, when)
- [ ] Data encryption at rest
- [ ] GDPR compliance tools (data export, deletion)

#### 7.4 Integrations
- [ ] **QuickBooks Online** (two-way sync)
- [ ] **Google Calendar** sync
- [ ] **Apple Calendar** sync
- [ ] Weather API (OpenWeatherMap or WeatherAPI)
- [ ] Google Maps / Mapbox for location services
- [ ] Stripe for payment processing
- [ ] Twilio for SMS notifications
- [ ] SendGrid for email
- [ ] Zapier webhooks
- [ ] REST API for custom integrations
- [ ] Webhook system for third-party apps

#### 7.5 DevOps & Quality
- [ ] Automated testing (unit, integration, e2e)
- [ ] CI/CD pipeline via Cloud Build
- [ ] Staging environment
- [ ] Feature flags for gradual rollout
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Automated database backups
- [ ] Blue/green deployments

---

## UX Principles

1. **Field-first** — Every feature works great on a phone with one hand, in the sun, with dirty hands
2. **Minimal clicks** — Every action in 2-3 taps max
3. **Offline-capable** — Full functionality in basements, rural areas, and tunnels
4. **Fast** — Sub-second response times, skeleton loading, optimistic updates
5. **Intuitive** — No training needed for basic tasks. Complex features have inline guidance
6. **Visual** — Progress bars, status colors, photos over text, charts over tables
7. **Accessible** — WCAG 2.1 AA, keyboard navigation, screen reader support
8. **Consistent** — Design system enforced across all pages
9. **Forgiving** — Undo support, confirmation for destructive actions, auto-save drafts
10. **Contextual** — Show what's relevant to each role. Owners see money, workers see tasks

---

## Design System

### Colors
- **Primary**: Blue (#2563EB) — Trust, professionalism
- **Success**: Green (#16A34A) — Completed, approved, on-budget
- **Warning**: Amber (#D97706) — Attention needed, approaching limits
- **Error**: Red (#DC2626) — Issues, overdue, over-budget
- **Info**: Indigo (#4F46E5) — Notifications, tips
- **Neutral**: Gray scale — Text, backgrounds, borders

### Typography
- **Headings**: Inter Bold, clear hierarchy
- **Body**: Inter Regular, 16px base for readability
- **Data**: Tabular numbers for financial data
- **Field Labels**: Semi-bold, smaller size

### Components
- Cards with subtle shadows and hover states
- Large touch targets (48px minimum)
- Clear visual feedback for all interactions
- Smooth 200ms transitions
- Consistent spacing (4/8/12/16/24/32/48px scale)
- Toast notifications (not alert boxes)
- Skeleton loaders for perceived performance
- Pull-to-refresh on mobile lists

---

## Technical Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router) | SSR, routing, performance |
| Styling | Tailwind CSS | Utility-first CSS |
| State | React Context + React Query | Auth state + data caching |
| Forms | react-hook-form + Zod | Validation, performance |
| Animation | Framer Motion | Smooth transitions |
| Auth | Firebase Auth | Email/password, social, MFA |
| Database | Firestore | Real-time NoSQL |
| Storage | Firebase Storage | Photos, documents |
| Functions | Firebase Cloud Functions Gen 2 | Backend logic, webhooks |
| Hosting | Cloud Run (Docker) | Scalable container hosting |
| CI/CD | Cloud Build | Automated deployment |
| Monitoring | Sentry + Firebase Analytics | Error and performance tracking |
| Weather | OpenWeatherMap API | Forecast integration |
| Maps | Google Maps API | Geolocation, geofencing |
| Payments | Stripe | Client payment processing |
| Email | SendGrid | Transactional email |
| SMS | Twilio | Notifications, 2FA |

---

## Implementation Priority

### Sprint 1: Fix Foundations
1. Move AuthProvider to root layout
2. Add environment variables for Firebase config
3. Add toast notification system (replace all `alert()`)
4. Add error boundaries
5. Wire up react-hook-form + Zod on all forms
6. Create all missing route pages (even as stubs)

### Sprint 2: Core Features Complete
7. Project status workflow
8. Task detail page with assignment
9. Time tracking with GPS
10. Timesheet approval workflow
11. Daily log improvements (weather API, photos)
12. Profile management page

### Sprint 3: Financial Foundation
13. Estimate builder
14. Invoice creation
15. Payment tracking
16. Expense capture
17. Budget vs actual tracking
18. Job costing

### Sprint 4: Field Ops
19. Tool & equipment tracking with barcode scanning
20. Geofencing for auto clock in/out
21. Real-time crew location map
22. Photo capture and annotation
23. Safety inspection checklists
24. Offline mode (PWA service worker)

### Sprint 5: Compliance & Communication
25. W-9 collection and verification
26. 1099 filing support
27. Insurance/COI tracking
28. In-app messaging
29. Push notifications
30. Email notifications

### Sprint 6: Client & Sub Experience
31. Client selections board
32. Client payment portal
33. Bid request/response system
34. Sub performance ratings
35. Contract e-signing
36. Automated progress updates

### Sprint 7: Intelligence
37. Executive dashboard with analytics
38. Custom report builder
39. QuickBooks integration
40. Calendar sync
41. AI-powered scheduling
42. Cost prediction

---

## Feature Count Summary

| Category | Features |
|----------|----------|
| Auth & Identity | 11 |
| Organization | 5 |
| Team Management | 8 |
| Project Management | 11 |
| Task & Scope | 16 |
| Scheduling | 9 |
| Time Tracking | 16 |
| Daily Logs | 14 |
| GPS & Location | 7 |
| Weather | 5 |
| Photos & Docs | 12 |
| Tool Tracking | 14 |
| Safety & Compliance | 10 |
| Estimates & Proposals | 11 |
| Invoicing & Billing | 12 |
| Expenses | 9 |
| Job Costing | 10 |
| Accounting | 5 |
| W-9 & Tax | 8 |
| 1099 Filing | 5 |
| Insurance & Compliance | 8 |
| Payroll | 6 |
| Messaging | 8 |
| Notifications | 6 |
| Client Portal | 13 |
| Sub Portal | 9 |
| Analytics | 8 |
| Reports | 10 |
| AI Features | 7 |
| PWA / Mobile | 8 |
| Performance | 8 |
| Security | 9 |
| Integrations | 11 |
| DevOps | 8 |
| **TOTAL** | **~311 features** |

---

## Research Sources

- [BuilderTrend](https://buildertrend.com/) — Residential construction management
- [Knowify](https://knowify.com/) — Subcontractor job costing & QuickBooks integration
- [Billdr PRO](https://www.billdr.ai/) — Fast quoting & client portals
- [Procore](https://www.procore.com/) — Enterprise construction management
- [Fieldwire](https://www.fieldwire.com/) — Field task management
- [Contractor Foreman](https://www.contractorforeman.com/) — Budget-friendly all-in-one
- [Workyard](https://www.workyard.com/) — GPS time tracking
- [CrewTracks](https://www.crewtracks.com/) — Crew tracking
- [BusyBusy](https://busybusy.com/) — Free time tracking
- [TaxBandits](https://developer.taxbandits.com/) — W-9 automation
- [TrustLayer](https://www.trustlayer.io/) — Insurance compliance
- [GigaTrak](https://www.gigatrak.com/) — Tool barcode tracking
- [Asset Panda](https://www.assetpanda.com/) — Equipment management
