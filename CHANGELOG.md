# ContractorOS Changelog

All notable changes to ContractorOS are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- FEAT-M5: Photo & Progress Documentation
- FEAT-M6: Payment Processing (Stripe)
- FEAT-L2: SMS/Text Workflows (Twilio)
- Help Center & Documentation System

---

## [1.4.0] - 2026-01-28

### Added - Client Management (FEAT-L4)
- **Client List Page** (`/dashboard/clients`)
  - Search by name, email, company
  - Filter by status (active, past, potential, inactive)
  - Stats cards showing client counts
  - Files: `app/dashboard/clients/page.tsx`

- **Client Detail Page** (`/dashboard/clients/[id]`)
  - 5-tab interface: Overview, Projects, Communication, Notes, Financials
  - Contact information display and edit
  - Address management (multiple addresses)
  - Files: `app/dashboard/clients/[id]/page.tsx`

- **Client Modals**
  - `AddClientModal` - 3-step wizard (contact, details, address)
  - `EditClientModal` - Full client editing
  - `AddCommunicationLogModal` - Log calls, emails, meetings
  - `AddNoteModal` - Quick note entry
  - Files: `components/clients/*.tsx`

- **Client Data Hook** (`lib/hooks/useClients.ts`)
  - Real-time client list with filtering
  - CRUD operations with toast notifications
  - Communication log management

- **Client Types** (`types/index.ts`)
  - `ClientStatus`, `ClientSource`, `ClientCommunicationPreference`
  - `Client`, `ClientFinancials`, `ClientAddress`, `ClientNote`
  - `ClientCommunicationLog`

- **Firestore Rules**
  - `clients` collection - org-scoped CRUD
  - `communicationLogs` collection - org-scoped with creator edit rights

### Changed
- Updated settings navigation to include Clients section

---

## [1.3.0] - 2026-01-27

### Added - E-Signature System (FEAT-L1)
- **Signature Request Workflow**
  - Send documents for signature via email
  - Magic link authentication (no login required)
  - Multi-signer support
  - Files: `lib/esignature/signature-service.ts`

- **Public Signing Page** (`/sign/[token]`)
  - Token-based access
  - Signature capture (draw, type, upload)
  - Audit trail tracking
  - Files: `app/sign/[token]/page.tsx`

- **Signature Components**
  - `SignaturePad` - Canvas-based signature capture
  - `SendForSignatureModal` - Send workflow
  - `SignatureStatusBadge` - Status display
  - Files: `components/esignature/*.tsx`

- **PDF Generation**
  - Estimate to PDF conversion
  - React-PDF renderer integration
  - Files: `lib/esignature/pdf-service.ts`

- **Signatures Dashboard** (`/dashboard/signatures`)
  - Track all signature requests
  - Status filtering
  - Resend/cancel actions

- **Email Templates** (Cloud Functions)
  - Signature request email
  - Signature reminder email
  - Signature completed notification
  - Files: `functions/src/email/emailTemplates.ts`

- **Firestore Rules**
  - `signatureRequests` collection
  - Public read for magic link access
  - Limited public update for signing

### Changed
- Estimates page now includes "Send for Signature" action
- Added signature status to estimate detail view

---

## [1.2.0] - 2026-01-26

### Added - Settings Pages
- **Integrations Page** (`/dashboard/settings/integrations`)
  - QuickBooks Online connection
  - Xero connection
  - OAuth flow simulation
  - Sync settings (auto-sync invoices, expenses, payments)
  - Chart of accounts mapping
  - Files: `app/dashboard/settings/integrations/page.tsx`

- **Tax Rates Page** (`/dashboard/settings/tax-rates`)
  - Full CRUD for tax rates
  - Default rate designation
  - Applies-to selection (estimates, invoices)
  - Files: `app/dashboard/settings/tax-rates/page.tsx`

- **Data Export Page** (`/dashboard/settings/data-export`)
  - Export: Invoices, Expenses, Estimates, Payments, Projects, Team
  - Format: CSV or Excel
  - Date range filter
  - Files: `app/dashboard/settings/data-export/page.tsx`

- **Notification Preferences** (`/dashboard/settings/notifications`)
  - Email notification toggles
  - Push notification toggles
  - Category-based controls
  - Files: `app/dashboard/settings/notifications/page.tsx`

### Changed
- Settings layout with better navigation
- Added hooks: `useAccountingConnection`, `useTaxRates`, `useNotificationPreferences`

---

## [1.1.0] - 2026-01-25

### Added - Foundation & Bug Fixes
- **Toast Notification System**
  - `react-hot-toast` integration
  - Success, error, warning, info variants
  - Files: `components/ui/Toast.tsx`

- **BaseModal Component**
  - Standardized modal behavior
  - Consistent close button positioning
  - Scroll handling
  - Files: `components/ui/BaseModal.tsx`

- **Brand Color System**
  - CSS variables for dynamic theming
  - ThemeProvider with Firestore sync
  - Tailwind integration (`brand-primary`, etc.)
  - Files: `lib/theme/ThemeProvider.tsx`, `tailwind.config.js`

- **Phase Dropdown in TaskDetailModal**
  - BUG-001 fix
  - Phase selection in task editing
  - Files: `components/tasks/TaskDetailModal.tsx`

### Changed
- All modals now use consistent styling
- Error handling improved with toast notifications

---

## [1.0.0] - 2026-01-20

### Added - Initial Platform
- **Dashboard Portal** (`/dashboard/*`)
  - Project management
  - Task management (Kanban, List, Gantt views)
  - Phase management
  - Subcontractor management

- **Core Features**
  - Firebase Authentication
  - Firestore database
  - Real-time subscriptions
  - File uploads (Firebase Storage)

- **UI Component Library**
  - Button, Card, Badge, Input
  - EmptyState, Skeleton loading
  - AppShell layout

---

## Version Numbering

- **Major (X.0.0)**: Breaking changes, major features
- **Minor (0.X.0)**: New features, non-breaking
- **Patch (0.0.X)**: Bug fixes, small improvements

---

## How to Update This Changelog

### For New Features
```markdown
## [X.X.0] - YYYY-MM-DD

### Added - Feature Name (FEAT-XXX)
- **Component/Page Name** (`route/path`)
  - Key functionality 1
  - Key functionality 2
  - Files: `path/to/files.tsx`
```

### For Bug Fixes
```markdown
### Fixed
- BUG-XXX: Brief description of fix
  - What was broken
  - How it was fixed
  - Files affected
```

### For Changes
```markdown
### Changed
- Component/feature that was modified
  - What changed
  - Why it changed
```

### For Deprecations
```markdown
### Deprecated
- Feature/component being phased out
  - Replacement recommendation
  - Timeline for removal
```
