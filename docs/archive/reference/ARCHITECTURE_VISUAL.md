# ContractorOS Architecture — Visual Guide

> **Last Updated:** February 2026
> **Version:** 1.0
> **Purpose:** Visual reference for frontend/backend interaction and database structure

---

## Table of Contents

1. [High-Level System Overview](#1-high-level-system-overview)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Frontend ↔ Backend Interaction](#4-frontend--backend-interaction)
5. [Database Schema & Relationships](#5-database-schema--relationships)
6. [Authentication & Authorization Flow](#6-authentication--authorization-flow)
7. [Real-Time Data Flow](#7-real-time-data-flow)
8. [External Integrations](#8-external-integrations)
9. [Deployment Architecture](#9-deployment-architecture)

---

## 1. High-Level System Overview

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              CONTRACTOROS PLATFORM                                    │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│    ┌─────────────────────────────────────────────────────────────────────────────┐   │
│    │                        CLIENT LAYER (Next.js 14)                            │   │
│    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │   │
│    │  │ Dashboard│ │  Field   │ │  Client  │ │   Sub    │ │  Public Signing  │  │   │
│    │  │  Portal  │ │  Portal  │ │  Portal  │ │  Portal  │ │  /sign/[token]   │  │   │
│    │  │ /dashboard│ │  /field  │ │ /client  │ │  /sub    │ │  /pay/[token]    │  │   │
│    │  │  (PM/    │ │(Employee/│ │(Homeowner│ │ (Subcon- │ │  (Magic Links)   │  │   │
│    │  │  Owner)  │ │Contractor│ │   s)     │ │ tractors)│ │                  │  │   │
│    │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │   │
│    └───────┼────────────┼────────────┼────────────┼─────────────────┼────────────┘   │
│            │            │            │            │                 │                │
│            └────────────┴────────────┴────────────┴─────────────────┘                │
│                                      │                                               │
│                                      ▼                                               │
│    ┌─────────────────────────────────────────────────────────────────────────────┐   │
│    │                       SERVICE LAYER (Next.js API Routes)                     │   │
│    │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐  │   │
│    │  │ Assistant │ │ Payments  │ │Integrations│ │  Projects │ │ Communication │  │   │
│    │  │   /api/   │ │   /api/   │ │   /api/    │ │   /api/   │ │    /api/      │  │   │
│    │  │ assistant/│ │ payments/ │ │integrations│ │ projects/ │ │ sms/, notify/ │  │   │
│    │  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └───────┬───────┘  │   │
│    └────────┼─────────────┼─────────────┼─────────────┼─────────────────┼────────┘   │
│             │             │             │             │                 │            │
│             ▼             ▼             ▼             ▼                 ▼            │
│    ┌─────────────────────────────────────────────────────────────────────────────┐   │
│    │                    CLOUD FUNCTIONS (Firebase Gen 2)                          │   │
│    │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐  │   │
│    │  │  Email    │ │Auth Hooks │ │ Scheduled │ │  Firestore │ │    Admin      │  │   │
│    │  │ Sending   │ │ onCreate  │ │  Tasks    │ │  Triggers  │ │   Functions   │  │   │
│    │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────────┘  │   │
│    └─────────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                               │
│                                      ▼                                               │
│    ┌─────────────────────────────────────────────────────────────────────────────┐   │
│    │                         DATA LAYER (Firebase)                                │   │
│    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │   │
│    │  │   Firestore     │  │ Firebase Auth   │  │    Cloud Storage            │  │   │
│    │  │   (Database)    │  │ (Authentication)│  │    (Files/Photos)           │  │   │
│    │  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │   │
│    └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                       │
└──────────────────────────────────────────────────────────────────────────────────────┘

                                EXTERNAL SERVICES
    ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
    │  Stripe   │ │ QuickBooks│ │  Twilio   │ │  Mailgun  │ │ Google AI │
    │ (Payments)│ │(Accounting)│ │   (SMS)   │ │  (Email)  │ │ (Gemini)  │
    └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘
```

---

## 2. Frontend Architecture

### 2.1 Route Structure by Portal

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS APP ROUTER                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  /                                                                                   │
│  ├── login/                    ─── Authentication entry point                        │
│  ├── register/                 ─── User registration                                 │
│  ├── onboarding/               ─── Setup flows                                       │
│  │   ├── contractor/                                                                 │
│  │   ├── client/                                                                     │
│  │   ├── employee/                                                                   │
│  │   ├── company-setup/                                                              │
│  │   └── preferences/                                                                │
│  │                                                                                   │
│  ├── dashboard/                ─── PM/OWNER PORTAL (56+ pages)                       │
│  │   ├── page.tsx                  Home dashboard                                    │
│  │   ├── projects/                 Project management                                │
│  │   │   ├── page.tsx              List all projects                                 │
│  │   │   ├── new/                  Create project                                    │
│  │   │   └── [id]/                 Project details                                   │
│  │   │       ├── activity/                                                           │
│  │   │       ├── photos/                                                             │
│  │   │       ├── materials/                                                          │
│  │   │       ├── payments/                                                           │
│  │   │       ├── change-orders/                                                      │
│  │   │       ├── quote/                                                              │
│  │   │       ├── rfis/                                                               │
│  │   │       ├── punch-list/                                                         │
│  │   │       ├── selections/                                                         │
│  │   │       └── messages/                                                           │
│  │   ├── clients/                  Client management                                 │
│  │   ├── team/                     Team management                                   │
│  │   ├── schedule/                 Calendar/scheduling                               │
│  │   ├── time/                     Time tracking                                     │
│  │   ├── finances/                 Financial overview                                │
│  │   ├── invoices/                 Invoice management                                │
│  │   ├── expenses/                 Expense tracking                                  │
│  │   ├── payroll/                  Payroll processing                                │
│  │   ├── equipment/                Equipment tracking                                │
│  │   ├── materials/                Material inventory                                │
│  │   ├── documents/                Document management                               │
│  │   ├── photos/                   Photo gallery                                     │
│  │   ├── reports/                  Reporting                                         │
│  │   ├── messaging/                Internal messaging                                │
│  │   ├── leads/                    Lead management                                   │
│  │   ├── safety/                   Safety compliance                                 │
│  │   ├── permits/                  Permit tracking                                   │
│  │   ├── warranties/               Warranty management                               │
│  │   ├── estimates/                Estimating                                        │
│  │   ├── notifications/            Notification center                               │
│  │   └── settings/                 Settings & config                                 │
│  │       ├── profile/                                                                │
│  │       ├── team/                                                                   │
│  │       ├── roles/                                                                  │
│  │       ├── integrations/                                                           │
│  │       ├── templates/                                                              │
│  │       ├── assistant/                                                              │
│  │       └── billing/                                                                │
│  │                                                                                   │
│  ├── field/                    ─── FIELD PORTAL (Employee/Contractor)                │
│  │   ├── page.tsx                  Daily overview, clock in/out                      │
│  │   ├── daily-log/                Daily activity logging                            │
│  │   ├── tasks/                    Task management                                   │
│  │   ├── schedule/                 Work schedule                                     │
│  │   ├── voice-logs/               Voice command logging                             │
│  │   └── photos/                   Photo capture/upload                              │
│  │                                                                                   │
│  ├── sub/                      ─── SUBCONTRACTOR PORTAL                              │
│  │   ├── page.tsx                  Dashboard                                         │
│  │   ├── bids/                     Bid management                                    │
│  │   ├── invoices/                 Payment tracking                                  │
│  │   ├── photos/                   Project photos                                    │
│  │   ├── projects/[id]/            Project details                                   │
│  │   └── schedule/                 Work schedule                                     │
│  │                                                                                   │
│  ├── client/                   ─── CLIENT PORTAL (Homeowners)                        │
│  │   ├── page.tsx                  Project overview                                  │
│  │   ├── projects/                 Project list & details                            │
│  │   │   └── [id]/                                                                   │
│  │   │       ├── scope/                                                              │
│  │   │       ├── change-orders/                                                      │
│  │   │       └── selections/                                                         │
│  │   ├── invoices/                 Payment history                                   │
│  │   ├── messages/                 Communication                                     │
│  │   ├── documents/                Project documents                                 │
│  │   └── photos/                   Project photos                                    │
│  │                                                                                   │
│  ├── admin/                    ─── SUPER ADMIN                                       │
│  │   └── users/[uid]/              User management                                   │
│  │                                                                                   │
│  ├── sign/[token]/             ─── PUBLIC E-SIGNATURE                                │
│  │                                                                                   │
│  └── pay/[token]/              ─── PUBLIC PAYMENT LINKS                              │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              COMPONENT HIERARCHY                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  apps/web/components/                                                                │
│  │                                                                                   │
│  ├── ui/                       ─── BASE UI COMPONENTS                                │
│  │   ├── AppShell.tsx              Main layout wrapper                               │
│  │   ├── PageHeader.tsx            Page title, description, actions                  │
│  │   ├── Button.tsx                Primary button component                          │
│  │   ├── Card.tsx                  Card container                                    │
│  │   ├── Modal.tsx                 Dialog/modal wrapper                              │
│  │   ├── FormModal.tsx             Standard modal with form                          │
│  │   ├── DataTable.tsx             Sortable, filterable table                        │
│  │   ├── FilterBar.tsx             Search and filter controls                        │
│  │   ├── StatsGrid.tsx             KPI cards with trends                             │
│  │   ├── EmptyState.tsx            No-data placeholder                               │
│  │   ├── Skeleton.tsx              Loading skeletons                                 │
│  │   ├── Select.tsx                Dropdown select                                   │
│  │   ├── Input.tsx                 Form input                                        │
│  │   └── Toast.tsx                 Notifications                                     │
│  │                                                                                   │
│  ├── auth/                     ─── AUTHENTICATION                                    │
│  │   ├── AuthGuard.tsx             Route protection HOC                              │
│  │   ├── LoginForm.tsx             Login form                                        │
│  │   └── InviteForm.tsx            Team invitation form                              │
│  │                                                                                   │
│  ├── assistant/                ─── AI ASSISTANT                                      │
│  │   ├── AssistantPanel.tsx        Main chat panel                                   │
│  │   ├── MessageList.tsx           Chat messages                                     │
│  │   ├── DocumentUpload.tsx        Document analysis                                 │
│  │   └── VoiceInput.tsx            Voice commands                                    │
│  │                                                                                   │
│  ├── projects/                 ─── PROJECT COMPONENTS                                │
│  │   ├── ProjectCard.tsx           Project summary card                              │
│  │   ├── ProjectForm.tsx           Create/edit project                               │
│  │   ├── PhaseTimeline.tsx         Phase progress                                    │
│  │   └── ActivityFeed.tsx          Activity log                                      │
│  │                                                                                   │
│  ├── field/                    ─── FIELD PORTAL                                      │
│  │   ├── TimeClockWidget.tsx       Clock in/out                                      │
│  │   ├── TaskList.tsx              Today's tasks                                     │
│  │   └── PhotoCapture.tsx          Photo upload                                      │
│  │                                                                                   │
│  ├── materials/                ─── MATERIAL MANAGEMENT                               │
│  ├── equipment/                ─── EQUIPMENT TRACKING                                │
│  ├── payroll/                  ─── PAYROLL PROCESSING                                │
│  ├── invoices/                 ─── INVOICING                                         │
│  ├── reports/                  ─── REPORTING                                         │
│  ├── schedule/                 ─── SCHEDULING                                        │
│  ├── client-portal/            ─── CLIENT COMPONENTS                                 │
│  ├── messaging/                ─── MESSAGING                                         │
│  ├── signatures/               ─── E-SIGNATURE                                       │
│  ├── intelligence/             ─── AI INTELLIGENCE                                   │
│  ├── automation/               ─── AUTOMATION                                        │
│  └── offline/                  ─── OFFLINE SUPPORT                                   │
│      └── SyncStatusIndicator.tsx   Sync status display                               │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 State Management Pattern (Firestore-Centric)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         STATE MANAGEMENT (No Redux/Zustand)                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                          REACT CONTEXT PROVIDERS                             │   │
│   │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │   │
│   │  │   AuthContext    │  │   ToastContext   │  │    AssistantContext      │   │   │
│   │  │  (user, profile) │  │   (notifications)│  │    (AI chat state)       │   │   │
│   │  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘   │   │
│   └───────────┼────────────────────────────────────────────────┼─────────────────┘   │
│               │                                                │                     │
│               ▼                                                ▼                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                           CUSTOM HOOKS LAYER                                 │   │
│   │                                                                              │   │
│   │   GENERIC HOOKS                          DOMAIN HOOKS                        │   │
│   │   ┌────────────────────────┐             ┌────────────────────────┐          │   │
│   │   │ useFirestoreCollection │             │ useProjects()          │          │   │
│   │   │ - Real-time subscriptions│           │ useClients()           │          │   │
│   │   │ - Query constraints    │  ◀────────  │ useTasks()             │          │   │
│   │   │ - Auto-cleanup         │   wraps     │ useTimeEntries()       │          │   │
│   │   │ - Loading/error states │             │ useInvoices()          │          │   │
│   │   └────────────────────────┘             │ usePayroll()           │          │   │
│   │                                          │ useEquipment()         │          │   │
│   │   ┌────────────────────────┐             │ useMaterials()         │          │   │
│   │   │ useFirestoreCrud       │             │ useSchedule()          │          │   │
│   │   │ - create()             │             │ useMessages()          │          │   │
│   │   │ - update()             │             │ ...70+ domain hooks    │          │   │
│   │   │ - remove()             │             └────────────────────────┘          │   │
│   │   │ - batchCreate()        │                                                 │   │
│   │   │ - batchUpdate()        │                                                 │   │
│   │   │ - batchRemove()        │                                                 │   │
│   │   └────────────────────────┘                                                 │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                               │                                                      │
│                               ▼                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                          FIRESTORE (Real-Time DB)                            │   │
│   │                                                                              │   │
│   │    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐               │   │
│   │    │  onSnapshot  │     │   getDocs    │     │   setDoc     │               │   │
│   │    │  (real-time) │     │  (one-time)  │     │   (write)    │               │   │
│   │    └──────────────┘     └──────────────┘     └──────────────┘               │   │
│   │                                                                              │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

                            DATA FLOW PATTERN

    ┌─────────┐     ┌─────────┐     ┌─────────────┐     ┌──────────────┐
    │  Page   │────▶│  Hook   │────▶│  Firestore  │────▶│   Real-time  │
    │Component│     │useXxx() │     │  onSnapshot │     │   Updates    │
    └─────────┘     └─────────┘     └─────────────┘     └──────┬───────┘
         ▲                                                      │
         │                                                      │
         └──────────────────────────────────────────────────────┘
                        State auto-updates on changes
```

---

## 3. Backend Architecture

### 3.1 API Routes Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS API ROUTES (44 Routes)                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  apps/web/app/api/                                                                   │
│  │                                                                                   │
│  ├── assistant/                ─── AI ASSISTANT SERVICES                             │
│  │   ├── route.ts                  Main chat endpoint (POST)                         │
│  │   ├── stream/route.ts           Streaming responses (SSE)                         │
│  │   ├── analyze-photo/            Image analysis                                    │
│  │   ├── analyze-document/         Document analysis                                 │
│  │   └── project-summary/          Auto-generated summaries                          │
│  │                                                                                   │
│  ├── payments/                 ─── STRIPE PAYMENT PROCESSING                         │
│  │   ├── route.ts                  Create PaymentIntent (POST)                       │
│  │   ├── [id]/route.ts             Get/update payment                                │
│  │   ├── [id]/refund/route.ts      Process refund                                    │
│  │   └── link/route.ts             Generate payment links                            │
│  │                                                                                   │
│  ├── integrations/             ─── EXTERNAL INTEGRATIONS                             │
│  │   └── quickbooks/                                                                 │
│  │       ├── connect/route.ts      OAuth initiation                                  │
│  │       ├── callback/route.ts     OAuth callback                                    │
│  │       ├── sync/route.ts         Bi-directional sync                               │
│  │       ├── webhook/route.ts      QBO webhooks                                      │
│  │       ├── status/route.ts       Connection status                                 │
│  │       └── disconnect/route.ts   Revoke access                                     │
│  │                                                                                   │
│  ├── projects/                 ─── PROJECT MANAGEMENT                                │
│  │   └── [projectId]/                                                                │
│  │       ├── rfis/                 RFI management                                    │
│  │       ├── submittals/           Submittal management                              │
│  │       ├── punch-list/           Punch list items                                  │
│  │       └── closeout/route.ts     Project closeout                                  │
│  │                                                                                   │
│  ├── sms/                      ─── TWILIO SMS                                        │
│  │   ├── route.ts                  Send SMS                                          │
│  │   └── webhooks/route.ts         Incoming messages                                 │
│  │                                                                                   │
│  ├── notifications/route.ts    ─── PUSH NOTIFICATIONS                                │
│  │                                                                                   │
│  ├── bulk/                     ─── BULK OPERATIONS                                   │
│  │   └── projects/route.ts                                                           │
│  │                                                                                   │
│  ├── automation/               ─── AI AUTOMATION                                     │
│  │   └── budget-analysis/route.ts                                                    │
│  │                                                                                   │
│  ├── client/                   ─── CLIENT PORTAL APIs                                │
│  ├── voice-logs/               ─── VOICE COMMANDS                                    │
│  ├── equipment/                ─── EQUIPMENT TRACKING                                │
│  ├── esignature/               ─── E-SIGNATURE                                       │
│  ├── dashboard-config/         ─── DYNAMIC CONFIG                                    │
│  ├── webhooks/                 ─── INCOMING WEBHOOKS                                 │
│  └── health/route.ts           ─── HEALTH CHECK                                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Cloud Functions Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                      FIREBASE CLOUD FUNCTIONS (Gen 2)                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  functions/src/                                                                      │
│  │                                                                                   │
│  ├── index.ts                  ─── FUNCTION EXPORTS                                  │
│  │                                                                                   │
│  ├── email/                    ─── EMAIL SERVICE (Mailgun)                           │
│  │   ├── sendInviteEmail.ts        Team invitation emails                            │
│  │   ├── sendSignatureEmails.ts    E-signature requests/completion                   │
│  │   ├── automatedEmails.ts        Invoice reminders, payment confirms               │
│  │   └── emailTemplates.ts         HTML template rendering                           │
│  │                                                                                   │
│  ├── triggers/                 ─── FIRESTORE TRIGGERS                                │
│  │   ├── onUserCreate.ts           Auth trigger → create profile                     │
│  │   ├── onInvoiceCreate.ts        Invoice → send notification                       │
│  │   └── onPaymentReceived.ts      Payment → update status                           │
│  │                                                                                   │
│  ├── scheduled/                ─── SCHEDULED TASKS                                   │
│  │   ├── fetchMaterialPrices.ts    Daily material price updates                      │
│  │   ├── fetchLaborRates.ts        Daily labor rate updates                          │
│  │   └── cleanupExpired.ts         Cleanup old tokens/sessions                       │
│  │                                                                                   │
│  ├── http/                     ─── HTTP ENDPOINTS                                    │
│  │   ├── healthCheck.ts            /health endpoint                                  │
│  │   ├── getUserProfile.ts         Profile fetching                                  │
│  │   └── updateUserProfile.ts      Profile updates                                   │
│  │                                                                                   │
│  └── admin/                    ─── ADMIN UTILITIES                                   │
│      └── admin.ts                  Admin operations                                  │
│                                                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  FUNCTION TRIGGER TYPES:                                                             │
│                                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                   │
│  │   AUTH TRIGGER   │  │ FIRESTORE TRIGGER│  │ SCHEDULED TRIGGER│                   │
│  │                  │  │                  │  │                  │                   │
│  │ onUserCreated    │  │ onDocumentCreated│  │ onSchedule       │                   │
│  │ onUserDeleted    │  │ onDocumentUpdated│  │ (cron expression)│                   │
│  │                  │  │ onDocumentDeleted│  │                  │                   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘                   │
│                                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐                                         │
│  │   HTTP TRIGGER   │  │  CALLABLE FUNC   │                                         │
│  │                  │  │                  │                                         │
│  │ onRequest        │  │ onCall           │                                         │
│  │ (REST endpoints) │  │ (client SDK)     │                                         │
│  └──────────────────┘  └──────────────────┘                                         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend ↔ Backend Interaction

### 4.1 Data Flow Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW PATTERNS                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  PATTERN 1: REAL-TIME SUBSCRIPTION (Primary Pattern)                                 │
│  ─────────────────────────────────────────────────────                               │
│                                                                                      │
│    ┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────────┐        │
│    │  Page   │────▶│ useProjects │────▶│  Firestore  │────▶│  onSnapshot   │        │
│    │Component│     │    hook     │     │   Query     │     │  Listener     │        │
│    └────┬────┘     └──────┬──────┘     └──────┬──────┘     └───────┬───────┘        │
│         │                 │                   │                     │               │
│         │    { items,     │                   │                     │               │
│         │◀──  loading,  ──┤                   │                     │               │
│         │     error }     │                   │                     │               │
│         │                 │                   │                     │               │
│         │                 │                   │    Auto-update      │               │
│         │                 │◀──────────────────┼─────────────────────┘               │
│         │◀────────────────┘    on data change                                       │
│    Re-render                                                                         │
│                                                                                      │
│  PATTERN 2: API ROUTE CALL (Complex Operations)                                      │
│  ───────────────────────────────────────────────                                     │
│                                                                                      │
│    ┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────────┐        │
│    │  Page   │────▶│   fetch()   │────▶│  API Route  │────▶│ External Svc  │        │
│    │Component│     │  /api/xxx   │     │  handler    │     │ (Stripe/AI)   │        │
│    └────┬────┘     └──────┬──────┘     └──────┬──────┘     └───────┬───────┘        │
│         │                 │                   │                     │               │
│         │    Response     │◀──────────────────┼─────────────────────┘               │
│         │◀────────────────┘                   │                                     │
│    Update state                               │                                     │
│         │                                     │                                     │
│         │                 ┌───────────────────┘                                     │
│         │                 │ Write to Firestore                                      │
│         │                 ▼                                                          │
│         │         ┌───────────────┐                                                  │
│         │◀────────│ Subscription  │   (if subscribed to affected collection)        │
│                   │   Updates     │                                                  │
│                   └───────────────┘                                                  │
│                                                                                      │
│  PATTERN 3: CLOUD FUNCTION TRIGGER                                                   │
│  ─────────────────────────────────                                                   │
│                                                                                      │
│    ┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────────┐        │
│    │  Page   │────▶│ crud.create │────▶│  Firestore  │────▶│ Cloud Function│        │
│    │Component│     │   (hook)    │     │  Document   │     │   Trigger     │        │
│    └─────────┘     └─────────────┘     └──────┬──────┘     └───────┬───────┘        │
│                                               │                     │               │
│                                               │                     ▼               │
│                                               │             ┌───────────────┐       │
│                                               │             │ Send Email    │       │
│                                               │             │ Update Stats  │       │
│                                               │             │ Sync External │       │
│                                               │             └───────────────┘       │
│                                               │                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            AUTHENTICATION FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  LOGIN FLOW                                                                          │
│  ──────────                                                                          │
│                                                                                      │
│    ┌──────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────────┐       │
│    │  /login  │────▶│ Firebase    │────▶│ Auth State  │────▶│ Firestore     │       │
│    │   page   │     │ signIn()    │     │ Changed     │     │ getDoc(user)  │       │
│    └──────────┘     └─────────────┘     └──────┬──────┘     └───────┬───────┘       │
│                                                │                     │              │
│                                                │  user: {...}        │              │
│                                                │◀─────────────────────┘              │
│                                                │  profile: {...}                     │
│                                                │                                     │
│                                                ▼                                     │
│                                        ┌───────────────┐                            │
│                                        │ AuthContext   │                            │
│                                        │ { user,       │                            │
│                                        │   profile,    │                            │
│                                        │   loading }   │                            │
│                                        └───────┬───────┘                            │
│                                                │                                     │
│                                                ▼                                     │
│                                    ┌───────────────────────┐                        │
│                                    │   ROLE-BASED REDIRECT │                        │
│                                    │                       │                        │
│                                    │  OWNER/PM  → /dashboard│                       │
│                                    │  EMPLOYEE  → /field    │                       │
│                                    │  SUB       → /sub      │                       │
│                                    │  CLIENT    → /client   │                       │
│                                    └───────────────────────┘                        │
│                                                                                      │
│  API AUTHORIZATION                                                                   │
│  ─────────────────                                                                   │
│                                                                                      │
│    ┌──────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────────┐       │
│    │  Client  │────▶│ Authorization│────▶│  API Route  │────▶│ Firebase Admin│      │
│    │  fetch() │     │ Bearer Token│     │  Handler    │     │ verifyIdToken│       │
│    └──────────┘     └─────────────┘     └──────┬──────┘     └───────┬───────┘       │
│                                                │                     │              │
│                                                │  { uid, orgId,      │              │
│                                                │    email, role }    │              │
│                                                │◀─────────────────────┘              │
│                                                │                                     │
│                                                ▼                                     │
│                                    ┌───────────────────────┐                        │
│                                    │   PROCESS REQUEST     │                        │
│                                    │   with verified user  │                        │
│                                    └───────────────────────┘                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Example: Project Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       EXAMPLE: CREATE PROJECT FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   1. USER ACTION                                                                     │
│   ┌───────────────────────────────────────────────────────────────────────────┐     │
│   │  User fills form at /dashboard/projects/new → clicks "Create Project"      │     │
│   └───────────────────────────────────────────────────────────────────────────┘     │
│                                                     │                                │
│                                                     ▼                                │
│   2. HOOK INVOCATION                                                                 │
│   ┌───────────────────────────────────────────────────────────────────────────┐     │
│   │  const { create } = useProjectCrud();                                      │     │
│   │  await create({                                                            │     │
│   │    name: "Kitchen Remodel",                                                │     │
│   │    clientId: "client_123",                                                 │     │
│   │    status: "planning",                                                     │     │
│   │    ...                                                                     │     │
│   │  });                                                                       │     │
│   └───────────────────────────────────────────────────────────────────────────┘     │
│                                                     │                                │
│                                                     ▼                                │
│   3. FIRESTORE WRITE                                                                 │
│   ┌───────────────────────────────────────────────────────────────────────────┐     │
│   │  setDoc(doc(db, "projects", newId), {                                      │     │
│   │    ...projectData,                                                         │     │
│   │    orgId: user.orgId,                                                      │     │
│   │    createdBy: user.uid,                                                    │     │
│   │    createdAt: serverTimestamp(),                                           │     │
│   │    updatedAt: serverTimestamp()                                            │     │
│   │  });                                                                       │     │
│   └───────────────────────────────────────────────────────────────────────────┘     │
│                                                     │                                │
│                                                     ▼                                │
│   4. SECURITY RULES CHECK                                                            │
│   ┌───────────────────────────────────────────────────────────────────────────┐     │
│   │  match /projects/{projectId} {                                             │     │
│   │    allow create: if isAuthenticated()                                      │     │
│   │                  && request.resource.data.orgId == getOrgId()              │     │
│   │                  && isAdmin();   // OWNER or PM only                       │     │
│   │  }                                                                         │     │
│   └───────────────────────────────────────────────────────────────────────────┘     │
│                                                     │                                │
│                                                     ▼                                │
│   5. CLOUD FUNCTION TRIGGER (Optional)                                               │
│   ┌───────────────────────────────────────────────────────────────────────────┐     │
│   │  exports.onProjectCreate = onDocumentCreated("projects/{id}", (event) => { │     │
│   │    // Send notification to team                                            │     │
│   │    // Create activity log entry                                            │     │
│   │    // Initialize default phases                                            │     │
│   │  });                                                                       │     │
│   └───────────────────────────────────────────────────────────────────────────┘     │
│                                                     │                                │
│                                                     ▼                                │
│   6. SUBSCRIPTION UPDATE                                                             │
│   ┌───────────────────────────────────────────────────────────────────────────┐     │
│   │  // Projects list page has active subscription                             │     │
│   │  onSnapshot(query(collection(db, "projects"), where("orgId", "==", orgId)),│     │
│   │    (snapshot) => {                                                         │     │
│   │      setProjects(snapshot.docs.map(...)); // Auto-updates with new project│     │
│   │    }                                                                       │     │
│   │  );                                                                        │     │
│   └───────────────────────────────────────────────────────────────────────────┘     │
│                                                     │                                │
│                                                     ▼                                │
│   7. UI UPDATE                                                                       │
│   ┌───────────────────────────────────────────────────────────────────────────┐     │
│   │  Toast: "Project created successfully"                                     │     │
│   │  Projects list re-renders with new project                                 │     │
│   │  Navigate to /dashboard/projects/{newId}                                   │     │
│   └───────────────────────────────────────────────────────────────────────────┘     │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema & Relationships

### 5.1 Collection Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        FIRESTORE COLLECTION STRUCTURE                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TOP-LEVEL COLLECTIONS (Shared Across Orgs)                                          │
│  ───────────────────────────────────────────                                         │
│                                                                                      │
│  users/                        ─── User profiles (all orgs)                          │
│  ├── {uid}                         Document per user                                 │
│  │   ├── email: string                                                               │
│  │   ├── displayName: string                                                         │
│  │   ├── role: "OWNER" | "PM" | "EMPLOYEE" | "CONTRACTOR" | "CLIENT" | "SUB"         │
│  │   ├── orgId: string                                                               │
│  │   ├── photoURL?: string                                                           │
│  │   ├── phone?: string                                                              │
│  │   ├── preferences: {...}                                                          │
│  │   └── reminders/            ─── Subcollection                                     │
│  │       └── {reminderId}                                                            │
│  │                                                                                   │
│  projects/                     ─── Project master records                            │
│  ├── {projectId}                                                                     │
│  │   ├── name: string                                                                │
│  │   ├── clientId: string      ─── FK to clients                                     │
│  │   ├── orgId: string         ─── FK to organization                                │
│  │   ├── status: "planning" | "active" | "paused" | "completed"                      │
│  │   ├── address: {...}                                                              │
│  │   ├── budget: number                                                              │
│  │   ├── startDate: timestamp                                                        │
│  │   ├── endDate?: timestamp                                                         │
│  │   ├── phases/               ─── Subcollection                                     │
│  │   │   └── {phaseId}                                                               │
│  │   ├── quoteSections/        ─── Subcollection                                     │
│  │   │   └── {sectionId}                                                             │
│  │   ├── clientPreferences/    ─── Subcollection                                     │
│  │   ├── activity/             ─── Subcollection                                     │
│  │   └── notes/                ─── Subcollection                                     │
│  │                                                                                   │
│  tasks/                        ─── Task management                                   │
│  ├── {taskId}                                                                        │
│  │   ├── projectId: string     ─── FK to project                                     │
│  │   ├── assigneeId: string    ─── FK to user                                        │
│  │   ├── title: string                                                               │
│  │   ├── status: "pending" | "in_progress" | "completed"                             │
│  │   ├── dueDate?: timestamp                                                         │
│  │   ├── comments/             ─── Subcollection                                     │
│  │   └── activity/             ─── Subcollection                                     │
│  │                                                                                   │
│  invoices/                     ─── Invoice records                                   │
│  ├── {invoiceId}                                                                     │
│  │   ├── projectId: string                                                           │
│  │   ├── clientId: string                                                            │
│  │   ├── orgId: string                                                               │
│  │   ├── number: string        ─── Invoice number (INV-001)                          │
│  │   ├── status: "draft" | "sent" | "paid" | "overdue"                               │
│  │   ├── lineItems: [{...}]                                                          │
│  │   ├── total: number                                                               │
│  │   └── dueDate: timestamp                                                          │
│  │                                                                                   │
│  (50+ more top-level collections...)                                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Organization-Scoped Collections

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    ORGANIZATION-SCOPED COLLECTIONS                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  organizations/{orgId}/        ─── Organization root                                 │
│  │                                                                                   │
│  ├── clients/                  ─── Client profiles for this org                      │
│  │   └── {clientId}                                                                  │
│  │       ├── name: string                                                            │
│  │       ├── email: string                                                           │
│  │       ├── phone?: string                                                          │
│  │       ├── address: {...}                                                          │
│  │       └── notes?: string                                                          │
│  │                                                                                   │
│  ├── invoices/                 ─── Invoices                                          │
│  ├── payments/                 ─── Payment records                                   │
│  ├── expenses/                 ─── Expense tracking                                  │
│  │                                                                                   │
│  ├── materials/                ─── Material inventory                                │
│  │   └── {materialId}                                                                │
│  │       ├── name: string                                                            │
│  │       ├── sku?: string                                                            │
│  │       ├── quantity: number                                                        │
│  │       ├── unitCost: number                                                        │
│  │       └── locationId?: string                                                     │
│  │                                                                                   │
│  ├── equipment/                ─── Equipment tracking                                │
│  │   └── {equipmentId}                                                               │
│  │       ├── name: string                                                            │
│  │       ├── serialNumber?: string                                                   │
│  │       ├── status: "available" | "checked_out" | "maintenance"                     │
│  │       └── currentUserId?: string                                                  │
│  │                                                                                   │
│  ├── equipmentCheckouts/       ─── Checkout history                                  │
│  ├── materialAllocations/      ─── Material allocations                              │
│  ├── materialTransactions/     ─── Movement logs                                     │
│  ├── storageLocations/         ─── Warehouse locations                               │
│  ├── lowStockAlerts/           ─── Inventory alerts                                  │
│  │                                                                                   │
│  ├── timeEntries/              ─── Time tracking                                     │
│  │   └── {entryId}                                                                   │
│  │       ├── userId: string                                                          │
│  │       ├── projectId: string                                                       │
│  │       ├── clockIn: timestamp                                                      │
│  │       ├── clockOut?: timestamp                                                    │
│  │       └── duration?: number                                                       │
│  │                                                                                   │
│  ├── timesheetPeriods/         ─── Timesheet periods                                 │
│  ├── weeklyTimesheets/         ─── Weekly summaries                                  │
│  ├── timeTrackingSettings/     ─── Config                                            │
│  │                                                                                   │
│  ├── payrollRuns/              ─── Payroll batches                                   │
│  │   └── {runId}                                                                     │
│  │       ├── periodStart: timestamp                                                  │
│  │       ├── periodEnd: timestamp                                                    │
│  │       ├── status: "draft" | "processing" | "completed"                            │
│  │       └── entries: [{...}]                                                        │
│  │                                                                                   │
│  ├── payrollSettings/          ─── Payroll config                                    │
│  │                                                                                   │
│  ├── scheduleEvents/           ─── Calendar events                                   │
│  ├── crewAvailability/         ─── Availability calendar                             │
│  ├── timeOffRequests/          ─── PTO requests                                      │
│  │                                                                                   │
│  ├── invitations/              ─── Team invites                                      │
│  ├── dailyLogs/                ─── Daily activity logs                               │
│  ├── suppliers/                ─── Vendor management                                 │
│  ├── purchaseOrders/           ─── PO management                                     │
│  ├── tools/                    ─── Tool inventory                                    │
│  │                                                                                   │
│  ├── quoteTemplates/           ─── Quote templates                                   │
│  ├── emailTemplates/           ─── Email templates                                   │
│  ├── emailLogs/                ─── Sent email tracking                               │
│  │                                                                                   │
│  ├── settings/                 ─── Organization settings                             │
│  │   ├── ai                        AI assistant settings                             │
│  │   ├── numbering                 Document numbering config                         │
│  │   └── numberingCounters         Auto-increment counters                           │
│  │                                                                                   │
│  ├── aiUsage/                  ─── AI usage tracking                                 │
│  ├── aiSecurityLogs/           ─── AI security audit                                 │
│  ├── assistantConversations/   ─── Chat history                                      │
│  ├── aiSuggestions/            ─── AI recommendations                                │
│  ├── documentAnalyses/         ─── AI doc analysis                                   │
│  ├── photoAnalyses/            ─── AI photo analysis                                 │
│  │                                                                                   │
│  ├── auditLogs/                ─── System audit trail                                │
│  ├── voiceCommands/            ─── Voice command logs                                │
│  ├── voiceCommandLogs/         ─── Voice activity                                    │
│  ├── automationAlerts/         ─── Automation notifications                          │
│  │                                                                                   │
│  ├── punchItems/               ─── Punch list items                                  │
│  ├── closeoutChecklists/       ─── Project closeout                                  │
│  ├── rfis/                     ─── Request for Information                           │
│  ├── submittals/               ─── Submittal tracking                                │
│  ├── projectSelections/        ─── Selections                                        │
│  ├── projectProgress/          ─── Progress tracking                                 │
│  └── clientNotes/              ─── Client notes                                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       ENTITY RELATIONSHIP DIAGRAM                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                              ┌─────────────────┐                                     │
│                              │  ORGANIZATION   │                                     │
│                              │─────────────────│                                     │
│                              │ id              │                                     │
│                              │ name            │                                     │
│                              │ settings        │                                     │
│                              └────────┬────────┘                                     │
│                                       │                                              │
│                          ┌────────────┼────────────┐                                 │
│                          │            │            │                                 │
│                          ▼            ▼            ▼                                 │
│              ┌───────────────┐ ┌───────────┐ ┌───────────┐                          │
│              │    USERS      │ │  CLIENTS  │ │ PROJECTS  │                          │
│              │───────────────│ │───────────│ │───────────│                          │
│              │ id            │ │ id        │ │ id        │                          │
│              │ orgId ◄───────┼─┤ orgId     │ │ orgId     │                          │
│              │ email         │ │ name      │ │ clientId ◄┼──────────┐               │
│              │ role          │ │ email     │ │ name      │          │               │
│              │ displayName   │ │ phone     │ │ status    │          │               │
│              └───────┬───────┘ └─────┬─────┘ └─────┬─────┘          │               │
│                      │               │             │                │               │
│      ┌───────────────┼───────────────┘             │                │               │
│      │               │                             │                │               │
│      ▼               ▼                             ▼                │               │
│  ┌─────────┐   ┌───────────┐              ┌───────────────┐        │               │
│  │ TIME    │   │ MESSAGES  │              │    TASKS      │        │               │
│  │ ENTRIES │   │───────────│              │───────────────│        │               │
│  │─────────│   │ channelId │              │ projectId ◄───┼────────┘               │
│  │ userId  │   │ senderId  │              │ assigneeId    │                        │
│  │projectId│   │ content   │              │ title         │                        │
│  │ clockIn │   └───────────┘              │ status        │                        │
│  │clockOut │                              │ dueDate       │                        │
│  └─────────┘                              └───────┬───────┘                        │
│                                                   │                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐      │
│  │                         PROJECT RELATED ENTITIES                          │      │
│  │                                                                           │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │      │
│  │  │ INVOICES │ │ EXPENSES │ │  PHOTOS  │ │   RFIs   │ │ CHANGE ORDERS│   │      │
│  │  │──────────│ │──────────│ │──────────│ │──────────│ │──────────────│   │      │
│  │  │projectId │ │projectId │ │projectId │ │projectId │ │  projectId   │   │      │
│  │  │ clientId │ │ vendorId │ │ uploadedBy│ │ status   │ │   status     │   │      │
│  │  │ status   │ │ category │ │ url      │ │ question │ │   amount     │   │      │
│  │  │ total    │ │ amount   │ │ caption  │ │ answer   │ │   approved   │   │      │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │      │
│  │                                                                           │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │      │
│  │  │  PHASES  │ │ SCHEDULE │ │ MATERIALS│ │ BIDS     │ │  PUNCH LIST  │   │      │
│  │  │──────────│ │  EVENTS  │ │ ALLOCATED│ │──────────│ │──────────────│   │      │
│  │  │projectId │ │──────────│ │──────────│ │projectId │ │  projectId   │   │      │
│  │  │ name     │ │projectId │ │projectId │ │ subId    │ │   status     │   │      │
│  │  │ progress │ │ date     │ │ quantity │ │ amount   │ │   location   │   │      │
│  │  │ order    │ │ assignees│ │ cost     │ │ status   │ │   assignee   │   │      │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │      │
│  └──────────────────────────────────────────────────────────────────────────┘      │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────┐      │
│  │                         STANDALONE ENTITIES                               │      │
│  │                                                                           │      │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │      │
│  │  │ SUBCONTRACTORS│ │  EQUIPMENT   │ │   PAYROLL    │ │ E-SIGNATURES   │  │      │
│  │  │──────────────│ │──────────────│ │    RUNS      │ │────────────────│  │      │
│  │  │ orgId        │ │ orgId        │ │──────────────│ │ documentId     │  │      │
│  │  │ company      │ │ name         │ │ orgId        │ │ signerEmail    │  │      │
│  │  │ trades       │ │ status       │ │ periodStart  │ │ status         │  │      │
│  │  │ contact      │ │ currentUser  │ │ periodEnd    │ │ signedAt       │  │      │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────┘  │      │
│  └──────────────────────────────────────────────────────────────────────────┘      │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Key Relationships

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            KEY RELATIONSHIPS                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ORGANIZATION ← owns → USER                                                          │
│  ────────────────────────────────────────────────────────────────────────────────── │
│  • User.orgId → Organization.id                                                      │
│  • One organization has many users                                                   │
│  • Users can only access data within their org                                       │
│                                                                                      │
│  CLIENT ← has → PROJECT                                                              │
│  ────────────────────────────────────────────────────────────────────────────────── │
│  • Project.clientId → Client.id                                                      │
│  • One client can have many projects                                                 │
│  • Client portal shows only their projects                                           │
│                                                                                      │
│  PROJECT ← contains → TASK                                                           │
│  ────────────────────────────────────────────────────────────────────────────────── │
│  • Task.projectId → Project.id                                                       │
│  • Tasks are grouped by project                                                      │
│  • Task progress affects project progress                                            │
│                                                                                      │
│  USER ← assigned → TASK                                                              │
│  ────────────────────────────────────────────────────────────────────────────────── │
│  • Task.assigneeId → User.id                                                         │
│  • Field workers see only their assigned tasks                                       │
│                                                                                      │
│  PROJECT ← has → INVOICE                                                             │
│  ────────────────────────────────────────────────────────────────────────────────── │
│  • Invoice.projectId → Project.id                                                    │
│  • Invoice.clientId → Client.id                                                      │
│  • Invoices track billing per project                                                │
│                                                                                      │
│  USER ← logs → TIME_ENTRY                                                            │
│  ────────────────────────────────────────────────────────────────────────────────── │
│  • TimeEntry.userId → User.id                                                        │
│  • TimeEntry.projectId → Project.id                                                  │
│  • Time entries aggregate to payroll                                                 │
│                                                                                      │
│  SUBCONTRACTOR ← submits → BID                                                       │
│  ────────────────────────────────────────────────────────────────────────────────── │
│  • Bid.subId → Subcontractor.id                                                      │
│  • Bid.projectId → Project.id (or bidSolicitation)                                   │
│  • Subs bid on project phases/scopes                                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Authentication & Authorization Flow

### 6.1 Role-Based Access Control

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                      ROLE-BASED ACCESS CONTROL (RBAC)                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ROLE HIERARCHY                                                                      │
│  ──────────────                                                                      │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │    OWNER                                                                     │    │
│  │    ┌───────────────────────────────────────────────────────────────────┐    │    │
│  │    │ • Full organization access                                         │    │    │
│  │    │ • Manage billing, settings, integrations                          │    │    │
│  │    │ • Delete organization data                                         │    │    │
│  │    │ • All PM permissions                                               │    │    │
│  │    └───────────────────────────────────────────────────────────────────┘    │    │
│  │                         │                                                    │    │
│  │                         ▼                                                    │    │
│  │    PM (Project Manager)                                                      │    │
│  │    ┌───────────────────────────────────────────────────────────────────┐    │    │
│  │    │ • Create/edit/delete projects                                      │    │    │
│  │    │ • Manage clients, invoices, expenses                               │    │    │
│  │    │ • Approve time entries, payroll                                    │    │    │
│  │    │ • Full dashboard access                                            │    │    │
│  │    │ • All EMPLOYEE permissions                                         │    │    │
│  │    └───────────────────────────────────────────────────────────────────┘    │    │
│  │                         │                                                    │    │
│  │                         ▼                                                    │    │
│  │    EMPLOYEE / CONTRACTOR                                                     │    │
│  │    ┌───────────────────────────────────────────────────────────────────┐    │    │
│  │    │ • Clock in/out, log time                                           │    │    │
│  │    │ • View assigned tasks & projects                                   │    │    │
│  │    │ • Upload photos, daily logs                                        │    │    │
│  │    │ • Field portal only                                                │    │    │
│  │    └───────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │    CLIENT (External)                                                         │    │
│  │    ┌───────────────────────────────────────────────────────────────────┐    │    │
│  │    │ • View ONLY their assigned projects                                │    │    │
│  │    │ • View invoices, make payments                                     │    │    │
│  │    │ • Approve selections, change orders                                │    │    │
│  │    │ • Communicate via messages                                         │    │    │
│  │    │ • CANNOT see other clients' data                                   │    │    │
│  │    └───────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                              │    │
│  │    SUB (Subcontractor - External)                                            │    │
│  │    ┌───────────────────────────────────────────────────────────────────┐    │    │
│  │    │ • View/submit bids                                                 │    │    │
│  │    │ • View assigned work                                               │    │    │
│  │    │ • Submit invoices                                                  │    │    │
│  │    │ • Upload photos                                                    │    │    │
│  │    │ • Limited to their scope                                           │    │    │
│  │    └───────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Firestore Security Rules Pattern

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                     FIRESTORE SECURITY RULES PATTERN                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  HELPER FUNCTIONS                                                                    │
│  ─────────────────                                                                   │
│                                                                                      │
│  function isAuthenticated() {                                                        │
│    return request.auth != null;                                                      │
│  }                                                                                   │
│                                                                                      │
│  function getOrgId() {                                                               │
│    return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.orgId;│
│  }                                                                                   │
│                                                                                      │
│  function isSameOrg(orgId) {                                                         │
│    return getOrgId() == orgId;                                                       │
│  }                                                                                   │
│                                                                                      │
│  function isAdmin() {                                                                │
│    let role = get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;│
│    return role == "OWNER" || role == "PM";                                           │
│  }                                                                                   │
│                                                                                      │
│  function isOwner(userId) {                                                          │
│    return request.auth.uid == userId;                                                │
│  }                                                                                   │
│                                                                                      │
│  RULE PATTERNS                                                                       │
│  ─────────────                                                                       │
│                                                                                      │
│  // Organization-scoped collection                                                   │
│  match /organizations/{orgId}/clients/{clientId} {                                   │
│    allow read, write: if isAuthenticated() && isSameOrg(orgId);                      │
│  }                                                                                   │
│                                                                                      │
│  // Top-level with org check                                                         │
│  match /projects/{projectId} {                                                       │
│    allow read: if isAuthenticated()                                                  │
│                && isSameOrg(resource.data.orgId);                                    │
│    allow create: if isAuthenticated()                                                │
│                  && isSameOrg(request.resource.data.orgId)                           │
│                  && isAdmin();                                                       │
│    allow update, delete: if isAuthenticated()                                        │
│                          && isSameOrg(resource.data.orgId)                           │
│                          && isAdmin();                                               │
│  }                                                                                   │
│                                                                                      │
│  // Client isolation (security critical!)                                            │
│  match /projects/{projectId} {                                                       │
│    // Clients can ONLY see their own projects                                        │
│    allow read: if isAuthenticated()                                                  │
│                && resource.data.clientId == request.auth.uid;                        │
│  }                                                                                   │
│                                                                                      │
│  // User-owned data                                                                  │
│  match /timeEntries/{entryId} {                                                      │
│    allow read: if isAuthenticated()                                                  │
│                && (isOwner(resource.data.userId) || isAdmin());                      │
│    allow create: if isAuthenticated()                                                │
│                  && isOwner(request.resource.data.userId);                           │
│    allow update: if isAuthenticated()                                                │
│                  && (isOwner(resource.data.userId) || isAdmin());                    │
│  }                                                                                   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Real-Time Data Flow

### 7.1 Subscription Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        SUBSCRIPTION LIFECYCLE                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   COMPONENT MOUNT                                                                    │
│   ───────────────                                                                    │
│                                                                                      │
│   ┌──────────────────────────────────────────────────────────────────────────┐      │
│   │  function ProjectsPage() {                                                │      │
│   │    const { items, loading, error } = useProjects();                       │      │
│   │                                      ▲                                    │      │
│   │                                      │                                    │      │
│   │    // items auto-updates when        │                                    │      │
│   │    // Firestore data changes         │                                    │      │
│   │  }                                   │                                    │      │
│   └──────────────────────────────────────┼───────────────────────────────────┘      │
│                                          │                                          │
│                                          │                                          │
│   HOOK INITIALIZATION                    │                                          │
│   ───────────────────                    │                                          │
│                                          │                                          │
│   ┌──────────────────────────────────────┼───────────────────────────────────┐      │
│   │  function useProjects() {            │                                    │      │
│   │    useEffect(() => {                 │                                    │      │
│   │      const q = query(                │                                    │      │
│   │        collection(db, "projects"),   │                                    │      │
│   │        where("orgId", "==", orgId),  │                                    │      │
│   │        orderBy("createdAt", "desc")  │                                    │      │
│   │      );                              │                                    │      │
│   │                                      │                                    │      │
│   │      const unsubscribe = onSnapshot( │                                    │      │
│   │        q,                            │                                    │      │
│   │        (snapshot) => {               │                                    │      │
│   │          const data = snapshot.docs.map(converter);                       │      │
│   │          setItems(data); ────────────┘                                    │      │
│   │        }                                                                  │      │
│   │      );                                                                   │      │
│   │                                                                           │      │
│   │      return () => unsubscribe(); // Cleanup on unmount                    │      │
│   │    }, [orgId]);                                                           │      │
│   │  }                                                                        │      │
│   └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
│                                                                                      │
│   DATA CHANGE EVENT                                                                  │
│   ─────────────────                                                                  │
│                                                                                      │
│   ┌──────────────────────────────────────────────────────────────────────────┐      │
│   │                                                                           │      │
│   │  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐    │      │
│   │  │ User B     │───▶│ Firestore  │───▶│ onSnapshot │───▶│ User A     │    │      │
│   │  │ creates    │    │ writes     │    │ fires      │    │ sees new   │    │      │
│   │  │ project    │    │ document   │    │ callback   │    │ project    │    │      │
│   │  └────────────┘    └────────────┘    └────────────┘    └────────────┘    │      │
│   │                                                                           │      │
│   │  Timeline: < 1 second end-to-end for real-time updates                   │      │
│   │                                                                           │      │
│   └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
│                                                                                      │
│   COMPONENT UNMOUNT                                                                  │
│   ─────────────────                                                                  │
│                                                                                      │
│   ┌──────────────────────────────────────────────────────────────────────────┐      │
│   │                                                                           │      │
│   │  // Cleanup function runs automatically                                   │      │
│   │  return () => unsubscribe();                                              │      │
│   │                                                                           │      │
│   │  // Prevents memory leaks                                                 │      │
│   │  // Stops unnecessary network traffic                                     │      │
│   │                                                                           │      │
│   └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Offline Support

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            OFFLINE SUPPORT                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  SERVICE WORKER (sw.js)                                                              │
│  ──────────────────────                                                              │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                            │      │
│  │  CACHE STRATEGY                                                            │      │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │      │
│  │  │ Static      │    │ API         │    │ Images      │                    │      │
│  │  │ Assets      │    │ Responses   │    │ & Files     │                    │      │
│  │  │─────────────│    │─────────────│    │─────────────│                    │      │
│  │  │ Cache-First │    │ Network-    │    │ Cache-First │                    │      │
│  │  │             │    │ First with  │    │ with        │                    │      │
│  │  │ (JS, CSS,   │    │ Fallback    │    │ Network     │                    │      │
│  │  │  fonts)     │    │             │    │ Refresh     │                    │      │
│  │  └─────────────┘    └─────────────┘    └─────────────┘                    │      │
│  │                                                                            │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
│  OFFLINE DATA QUEUE                                                                  │
│  ──────────────────                                                                  │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                            │      │
│  │  ┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌────────────┐  │      │
│  │  │ User    │────▶│ IndexedDB   │────▶│ Online      │────▶│ Firestore  │  │      │
│  │  │ Action  │     │ Queue       │     │ Sync        │     │ Write      │  │      │
│  │  │(offline)│     │ (pending)   │     │ (when back) │     │ (success)  │  │      │
│  │  └─────────┘     └─────────────┘     └─────────────┘     └────────────┘  │      │
│  │                                                                            │      │
│  │  Supported offline actions:                                                │      │
│  │  • Clock in/out                                                            │      │
│  │  • Photo capture (queued upload)                                           │      │
│  │  • Daily log entries                                                       │      │
│  │  • Task status updates                                                     │      │
│  │                                                                            │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
│  SYNC STATUS INDICATOR                                                               │
│  ─────────────────────                                                               │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                            │      │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │      │
│  │  │  ● Online                     │  ○ Offline                          │  │      │
│  │  │  ✓ All synced                 │  ⏳ 3 pending changes               │  │      │
│  │  │                               │  ↻ Syncing when online...           │  │      │
│  │  └─────────────────────────────────────────────────────────────────────┘  │      │
│  │                                                                            │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. External Integrations

### 8.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL INTEGRATIONS                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  STRIPE (Payments)                                                                   │
│  ─────────────────                                                                   │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                            │      │
│  │  ┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌────────────┐  │      │
│  │  │ Client  │────▶│ /api/       │────▶│ Stripe SDK  │────▶│ Stripe     │  │      │
│  │  │ Portal  │     │ payments    │     │ create      │     │ API        │  │      │
│  │  │         │     │             │     │ PaymentIntent    │            │  │      │
│  │  └─────────┘     └─────────────┘     └─────────────┘     └──────┬─────┘  │      │
│  │       ▲                                                          │        │      │
│  │       │                                                          │        │      │
│  │       │          ┌─────────────┐     ┌─────────────┐             │        │      │
│  │       └──────────│ Confirm     │◀────│ Webhook     │◀────────────┘        │      │
│  │                  │ Payment     │     │ /api/webhooks              │        │      │
│  │                  └─────────────┘     └─────────────┘                       │      │
│  │                                                                            │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
│  QUICKBOOKS (Accounting)                                                             │
│  ───────────────────────                                                             │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                            │      │
│  │  OAUTH FLOW                                                                │      │
│  │  ┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌────────────┐  │      │
│  │  │ Settings│────▶│ /api/qb/    │────▶│ QBO OAuth   │────▶│ Store      │  │      │
│  │  │ Page    │     │ connect     │     │ Consent     │     │ Tokens     │  │      │
│  │  └─────────┘     └─────────────┘     └─────────────┘     └────────────┘  │      │
│  │                                                                            │      │
│  │  SYNC FLOW                                                                 │      │
│  │  ┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌────────────┐  │      │
│  │  │ Trigger │────▶│ /api/qb/    │────▶│ QBO API     │◀───▶│ Firestore  │  │      │
│  │  │ Sync    │     │ sync        │     │ (Customers, │     │ (Clients,  │  │      │
│  │  │         │     │             │     │  Invoices)  │     │  Invoices) │  │      │
│  │  └─────────┘     └─────────────┘     └─────────────┘     └────────────┘  │      │
│  │                                                                            │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
│  TWILIO (SMS)                                                                        │
│  ────────────                                                                        │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                            │      │
│  │  OUTBOUND                                                                  │      │
│  │  ┌─────────┐     ┌─────────────┐     ┌─────────────┐                      │      │
│  │  │ App     │────▶│ /api/sms    │────▶│ Twilio API  │────▶ 📱              │      │
│  │  │         │     │             │     │             │                      │      │
│  │  └─────────┘     └─────────────┘     └─────────────┘                      │      │
│  │                                                                            │      │
│  │  INBOUND                                                                   │      │
│  │  📱 ────▶ Twilio ────▶ /api/sms/webhooks ────▶ Firestore (smsMessages)    │      │
│  │                                                                            │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
│  AI MODELS (Assistant)                                                               │
│  ─────────────────────                                                               │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                            │      │
│  │  ┌─────────┐     ┌─────────────┐     ┌─────────────────────────────────┐  │      │
│  │  │ Chat    │────▶│ /api/       │────▶│ PRIMARY: Google Gemini          │  │      │
│  │  │ Panel   │     │ assistant   │     │ FALLBACK: Anthropic Claude      │  │      │
│  │  │         │     │ (rate limit,│     │                                 │  │      │
│  │  │         │     │  validate)  │     │ Features:                       │  │      │
│  │  │         │     │             │     │ • Project context awareness     │  │      │
│  │  │         │◀────│◀────────────│◀────│ • Photo/document analysis       │  │      │
│  │  │ Response│     │ (stream)    │     │ • Usage tracking                │  │      │
│  │  └─────────┘     └─────────────┘     └─────────────────────────────────┘  │      │
│  │                                                                            │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
│  MAILGUN (Email via Cloud Functions)                                                 │
│  ───────────────────────────────────                                                 │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                            │      │
│  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                  │      │
│  │  │ Firestore   │────▶│ Cloud       │────▶│ Mailgun     │────▶ 📧          │      │
│  │  │ Trigger     │     │ Function    │     │ API         │                  │      │
│  │  │ (onCreate)  │     │ (template)  │     │             │                  │      │
│  │  └─────────────┘     └─────────────┘     └─────────────┘                  │      │
│  │                                                                            │      │
│  │  Triggers:                                                                 │      │
│  │  • Team invitation                                                         │      │
│  │  • E-signature request                                                     │      │
│  │  • Invoice sent                                                            │      │
│  │  • Payment confirmation                                                    │      │
│  │                                                                            │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Deployment Architecture

### 9.1 Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       DEPLOYMENT ARCHITECTURE                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  GOOGLE CLOUD PLATFORM (Project: contractoros-483812)                                │
│  ────────────────────────────────────────────────────                                │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                            │      │
│  │                              INTERNET                                      │      │
│  │                                  │                                         │      │
│  │                                  ▼                                         │      │
│  │                         ┌───────────────┐                                  │      │
│  │                         │ Cloud Load    │                                  │      │
│  │                         │ Balancer      │                                  │      │
│  │                         │ (HTTPS/SSL)   │                                  │      │
│  │                         └───────┬───────┘                                  │      │
│  │                                 │                                          │      │
│  │              ┌──────────────────┼──────────────────┐                       │      │
│  │              │                  │                  │                       │      │
│  │              ▼                  ▼                  ▼                       │      │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │      │
│  │  │   CLOUD RUN     │ │   CLOUD RUN     │ │   CLOUD RUN     │              │      │
│  │  │  (us-west1)     │ │  (us-west1)     │ │  (us-west1)     │              │      │
│  │  │                 │ │                 │ │                 │              │      │
│  │  │  Next.js App    │ │  Next.js App    │ │  Next.js App    │              │      │
│  │  │  (Container)    │ │  (Container)    │ │  (Container)    │              │      │
│  │  │                 │ │                 │ │                 │              │      │
│  │  │  Min: 1         │ │                 │ │  Max: 10        │              │      │
│  │  │  (auto-scaling) │ │                 │ │  (auto-scaling) │              │      │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘              │      │
│  │              │                  │                  │                       │      │
│  │              └──────────────────┼──────────────────┘                       │      │
│  │                                 │                                          │      │
│  │                                 ▼                                          │      │
│  │  ┌──────────────────────────────────────────────────────────────────┐     │      │
│  │  │                        FIREBASE SERVICES                          │     │      │
│  │  │                                                                   │     │      │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │     │      │
│  │  │  │ Firestore   │  │  Firebase   │  │   Cloud Functions       │   │     │      │
│  │  │  │ (Database)  │  │  Auth       │  │   (us-east1)            │   │     │      │
│  │  │  │             │  │             │  │                         │   │     │      │
│  │  │  │ Multi-region│  │ Email/Pass  │  │ • Email triggers        │   │     │      │
│  │  │  │ (nam5)      │  │ Phone       │  │ • Firestore triggers    │   │     │      │
│  │  │  │             │  │ Google SSO  │  │ • Scheduled tasks       │   │     │      │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │     │      │
│  │  │                                                                   │     │      │
│  │  │  ┌─────────────┐  ┌─────────────────────────────────────────┐   │     │      │
│  │  │  │ Cloud       │  │   Secret Manager                         │   │     │      │
│  │  │  │ Storage     │  │                                          │   │     │      │
│  │  │  │ (Files)     │  │   • FIREBASE_* keys                      │   │     │      │
│  │  │  │             │  │   • STRIPE_* keys                        │   │     │      │
│  │  │  │ • Photos    │  │   • QUICKBOOKS_* keys                    │   │     │      │
│  │  │  │ • Documents │  │   • TWILIO_* keys                        │   │     │      │
│  │  │  │ • Exports   │  │   • MAILGUN_* keys                       │   │     │      │
│  │  │  └─────────────┘  └─────────────────────────────────────────┘   │     │      │
│  │  │                                                                   │     │      │
│  │  └──────────────────────────────────────────────────────────────────┘     │      │
│  │                                                                            │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            CI/CD PIPELINE                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐   │
│  │  Git    │────▶│ Cloud Build │────▶│  Artifact   │────▶│    Cloud Run        │   │
│  │  Push   │     │             │     │  Registry   │     │    Deploy           │   │
│  │ (main)  │     │ • tsc check │     │             │     │                     │   │
│  │         │     │ • Docker    │     │ Container   │     │ • Zero-downtime     │   │
│  │         │     │   build     │     │ Image       │     │ • Traffic splitting │   │
│  │         │     │ • Push      │     │             │     │ • Auto-rollback     │   │
│  └─────────┘     └─────────────┘     └─────────────┘     └─────────────────────┘   │
│                                                                                      │
│  LOCAL DEVELOPMENT                                                                   │
│  ─────────────────                                                                   │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                            │      │
│  │  # Build & Test                                                            │      │
│  │  npx tsc --noEmit                    # Type check                          │      │
│  │  npm run build                       # Production build                    │      │
│  │                                                                            │      │
│  │  # Local Docker                                                            │      │
│  │  ./docker-build-local.sh             # Build with secrets                  │      │
│  │  docker run -p 3000:8080 contractoros-web                                  │      │
│  │                                                                            │      │
│  │  # Firebase Deploy                                                         │      │
│  │  firebase deploy --only firestore    # Rules & indexes                     │      │
│  │  firebase deploy --only functions    # Cloud functions                     │      │
│  │                                                                            │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Quick Reference

### Collection Naming Convention

| Pattern | Example | Usage |
|---------|---------|-------|
| `camelCase` | `timeEntries` | All collection names |
| `{orgId}/...` | `organizations/{orgId}/clients` | Org-scoped data |
| `{parentId}/subcol` | `projects/{id}/phases` | Nested collections |

### Common Query Patterns

```javascript
// Org-filtered list
query(collection(db, "projects"),
  where("orgId", "==", orgId),
  orderBy("createdAt", "desc")
)

// User-specific
query(collection(db, "timeEntries"),
  where("userId", "==", userId),
  where("date", ">=", startDate),
  where("date", "<=", endDate)
)

// Status filtering
query(collection(db, "invoices"),
  where("orgId", "==", orgId),
  where("status", "==", "pending"),
  orderBy("dueDate", "asc")
)
```

### Key Files

| File | Purpose |
|------|---------|
| `apps/web/types/index.ts` | All TypeScript interfaces |
| `firestore.rules` | Security rules |
| `firestore.indexes.json` | Composite indexes |
| `apps/web/lib/hooks/` | Data hooks |
| `apps/web/components/ui/` | Base UI components |
| `functions/src/` | Cloud Functions |

---

**Document Version:** 1.0
**Maintainer:** ContractorOS Team
**Review Cycle:** Update with each major architectural change
