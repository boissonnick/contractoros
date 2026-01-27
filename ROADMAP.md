# ContractorOS Feature Roadmap

> Building a better, self-hosted alternative to BuilderTrend

## Our Advantages Over BuilderTrend

| BuilderTrend Pain Point | ContractorOS Solution |
|------------------------|----------------------|
| $499-$1,099/month | Free, self-hosted |
| No free trial | Open source, instant access |
| Buggy mobile app | PWA-first, offline-capable |
| Steep learning curve | Intuitive, minimal onboarding |
| "10x more clicks" | Streamlined workflows |
| Can't open multiple tabs | Modern SPA architecture |
| Weak financial module | Clean invoicing + accounting sync |
| Slow, cumbersome UI | Fast, responsive design |
| Limited offline | Full offline support |
| Duplicate data entry | Smart templates, auto-fill |

---

## Phase 1: Foundation (MVP) ✅

### Authentication & Users
- [x] Firebase Auth (email/password)
- [x] Role-based access (OWNER, PM, EMPLOYEE, CONTRACTOR, SUB, CLIENT)
- [x] Role-based routing
- [ ] User registration with invite codes
- [ ] Password reset flow
- [ ] Profile management

### Core UI
- [x] Responsive AppShell layout
- [x] Mobile-first bottom navigation
- [x] Desktop sidebar navigation
- [x] Loading states
- [x] Tailwind CSS styling
- [ ] Dark mode support
- [ ] PWA manifest & service worker

### Dashboards
- [x] OWNER/PM management dashboard
- [x] Field worker (EMPLOYEE/CONTRACTOR) dashboard with time clock
- [x] Subcontractor dashboard
- [x] Client portal

---

## Phase 2: Project Management 🚧

### Projects
- [x] Project list with search/filter
- [ ] **Project creation wizard** (address, client, budget, dates)
- [ ] Project detail view
- [ ] Project status workflow
- [ ] Project templates
- [ ] Project archiving

### Tasks & Scope
- [ ] **Task board** (Kanban view)
- [ ] Task list view
- [ ] Task creation with estimates
- [ ] Task assignment
- [ ] Task dependencies
- [ ] Task templates by trade
- [ ] Subtasks

### Scheduling
- [ ] **Gantt chart** (drag-and-drop)
- [ ] Calendar view
- [ ] Resource scheduling
- [ ] Conflict detection
- [ ] Schedule templates

---

## Phase 3: Field Operations 📱

### Time Tracking
- [x] Clock in/out with GPS
- [ ] **Break tracking**
- [ ] Timesheet approval workflow
- [ ] Weekly timesheet view
- [ ] Overtime calculation
- [ ] Export to payroll

### Daily Logs
- [ ] **Daily log creation**
- [ ] Weather tracking
- [ ] Photo attachments
- [ ] Worker attendance
- [ ] Notes & observations
- [ ] Delay documentation

### Photos & Documents
- [ ] **Photo capture** (camera integration)
- [ ] Photo tagging (before/after/progress)
- [ ] Document upload
- [ ] Document versioning
- [ ] Drawing/blueprint viewer
- [ ] Markup tools

---

## Phase 4: Financial Tools 💰

### Estimates & Proposals
- [ ] **Estimate builder**
- [ ] Line item templates
- [ ] Material cost lookup
- [ ] Labor rate calculation
- [ ] Proposal generation (PDF)
- [ ] Digital signature

### Invoicing
- [ ] **Invoice creation**
- [ ] Progress billing
- [ ] Change order tracking
- [ ] Payment tracking
- [ ] Payment reminders
- [ ] Invoice PDF export

### Budgeting
- [ ] **Job costing**
- [ ] Budget vs. actual tracking
- [ ] Purchase order management
- [ ] Cost code tracking
- [ ] Profit margin analysis

### Accounting Integration
- [ ] QuickBooks Online sync
- [ ] Xero sync
- [ ] Export to CSV

---

## Phase 5: Team & Communication 👥

### Team Management
- [ ] **Team directory**
- [ ] User invitations
- [ ] Role management
- [ ] Availability calendar
- [ ] Skills/certifications tracking

### Subcontractor Management
- [ ] **Bid requests**
- [ ] Bid comparison
- [ ] Contract management
- [ ] Insurance tracking
- [ ] Performance ratings

### Communication
- [ ] **In-app messaging**
- [ ] Project comments
- [ ] @mentions
- [ ] Email notifications
- [ ] Push notifications
- [ ] Client update broadcasts

---

## Phase 6: Client Experience 🏠

### Client Portal
- [x] Project progress view
- [x] Photo gallery
- [x] Invoice history
- [ ] **Selection boards** (fixtures, finishes)
- [ ] Approval workflow
- [ ] Payment portal
- [ ] Warranty tracking
- [ ] Support requests

### Client Communication
- [ ] Automated progress updates
- [ ] Milestone notifications
- [ ] Survey/feedback forms

---

## Phase 7: Advanced Features 🚀

### Reporting
- [ ] **Dashboard analytics**
- [ ] Project profitability reports
- [ ] Labor reports
- [ ] Subcontractor reports
- [ ] Custom report builder

### Integrations
- [ ] Google Calendar sync
- [ ] Apple Calendar sync
- [ ] Zapier webhooks
- [ ] API for custom integrations

### Mobile (PWA)
- [ ] Offline mode
- [ ] Background sync
- [ ] Push notifications
- [ ] Home screen install

---

## UX Principles

1. **Mobile-first** - Field workers use phones/tablets
2. **Minimal clicks** - Every action should be 2-3 taps max
3. **Offline-capable** - Works in basements and rural areas
4. **Fast** - Sub-second response times
5. **Intuitive** - No training required for basic tasks
6. **Visual** - Photos and progress bars over text
7. **Accessible** - Works for all team members

---

## Design System

### Colors
- **Primary**: Blue (#2563EB) - Trust, professionalism
- **Success**: Green (#16A34A) - Completed, approved
- **Warning**: Yellow (#CA8A04) - Attention needed
- **Error**: Red (#DC2626) - Issues, overdue
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Headings**: Bold, clear hierarchy
- **Body**: Readable on all devices
- **Data**: Monospace for numbers/times

### Components
- Cards with subtle shadows
- Large touch targets (44px+)
- Clear visual feedback
- Smooth animations
- Consistent spacing (8px grid)

---

## Technical Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Auth**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions (Gen 2)
- **Hosting**: Cloud Run (Docker)
- **CI/CD**: Cloud Build

---

## Priority Order

1. ✅ Auth & role-based dashboards
2. 🚧 Project creation & detail views
3. ⬜ Task management (Kanban)
4. ⬜ Daily logs & photos
5. ⬜ Estimate & invoice creation
6. ⬜ Team communication
7. ⬜ Client selections
8. ⬜ Reporting & analytics
9. ⬜ Offline PWA
10. ⬜ Integrations
