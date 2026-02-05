# ContractorOS Deployment & Infrastructure Checklist

> **Purpose:** Ensure no Firebase rules, indexes, or infrastructure changes are forgotten when building features.
> **Last Updated:** 2026-01-28

---

## Pre-Development Checklist

Before starting a new feature, verify:

- [ ] Firebase CLI authenticated: `firebase login`
- [ ] gcloud CLI authenticated: `gcloud auth login`
- [ ] Local `.env.local` file exists with all secrets
- [ ] Emulators can start: `npm run emulators`

---

## Feature Development Checklist

### 1. Firestore Collections

When adding a new collection:

- [ ] **Define the collection name** in hook file as constant
- [ ] **Add Firestore security rules** in `firestore.rules`
- [ ] **Add composite indexes** if needed in `firestore.indexes.json`
- [ ] **Document the schema** in `docs/ARCHITECTURE.md`

#### Security Rules Template
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuth() {
      return request.auth != null;
    }

    function isOrgMember(orgId) {
      return isAuth() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.orgId == orgId;
    }

    function isOwner(resource) {
      return isAuth() && resource.data.createdBy == request.auth.uid;
    }

    // NEW COLLECTION: Add rules here
    match /myNewCollection/{docId} {
      allow read: if isOrgMember(resource.data.orgId);
      allow create: if isOrgMember(request.resource.data.orgId);
      allow update: if isOrgMember(resource.data.orgId);
      allow delete: if isOrgMember(resource.data.orgId) && isOwner(resource);
    }
  }
}
```

#### Deploying Rules
```bash
# Deploy rules only
firebase deploy --only firestore:rules

# Deploy indexes only
firebase deploy --only firestore:indexes

# Deploy both
firebase deploy --only firestore
```

### 2. Cloud Functions

When adding a new Cloud Function:

- [ ] **Add function to `functions/src/index.ts`**
- [ ] **Install dependencies** in `functions/package.json` if needed
- [ ] **Build functions:** `npm run build:functions`
- [ ] **Deploy functions:** `npm run deploy:functions`

#### Function Types Reference
```typescript
// HTTP Callable
export const myFunction = onCall({ region: REGION }, async (request) => {
  // ...
});

// Firestore Trigger
export const onDocCreated = onDocumentCreated(
  { document: 'collection/{docId}', region: REGION },
  async (event) => {
    // ...
  }
);

// Firestore Update Trigger
export const onDocUpdated = onDocumentUpdated(
  { document: 'collection/{docId}', region: REGION },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    // ...
  }
);
```

### 3. Firebase Storage

When adding file uploads:

- [ ] **Add storage rules** in `storage.rules`
- [ ] **Create storage helper** in `lib/firebase/storage.ts`
- [ ] **Handle upload errors** with user feedback

#### Storage Rules Template
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Organization files
    match /organizations/{orgId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Signature documents
    match /signatures/{requestId}/{allPaths=**} {
      allow read: if true; // Public for signing
      allow write: if request.auth != null;
    }
  }
}
```

### 4. Environment Variables

When adding new secrets:

- [ ] **Add to GCP Secret Manager:**
  ```bash
  echo -n "value" | gcloud secrets create SECRET_NAME --data-file=- --project=contractoros-483812
  ```
- [ ] **Grant Cloud Build access:**
  ```bash
  gcloud secrets add-iam-policy-binding SECRET_NAME \
    --member="serviceAccount:424251610296@cloudbuild.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project=contractoros-483812
  ```
- [ ] **Update `cloudbuild.yaml`** availableSecrets section
- [ ] **Update `Dockerfile`** if NEXT_PUBLIC_* variable
- [ ] **Update `.env.example`** for local dev documentation
- [ ] **Update `docker-build-local.sh`** for local builds

---

## Collection Reference

### Current Collections & Their Rules

| Collection | Rules Status | Index Status | Notes |
|------------|--------------|--------------|-------|
| `users` | ✅ Deployed | - | User profiles |
| `organizations` | ✅ Deployed | - | Org settings |
| `projects` | ✅ Deployed | ✅ | Project data |
| `phases` | ✅ Deployed | - | Project phases |
| `tasks` | ✅ Deployed | ✅ | Task management |
| `clients` | ✅ Deployed | - | Client CRM |
| `communicationLogs` | ✅ Deployed | - | Client comms |
| `signatureRequests` | ✅ Deployed | - | E-signatures (public + org access) |
| `estimates` | ✅ Deployed | - | Estimates |
| `notificationPreferences` | ✅ Deployed | - | User notification settings |

### Required Firestore Rules Updates

Add these rules to `firestore.rules`:

```javascript
// Clients collection
match /clients/{clientId} {
  allow read: if isOrgMember(resource.data.orgId);
  allow create: if isOrgMember(request.resource.data.orgId);
  allow update: if isOrgMember(resource.data.orgId);
  allow delete: if isOrgMember(resource.data.orgId);
}

// Communication logs
match /communicationLogs/{logId} {
  allow read: if isOrgMember(resource.data.orgId);
  allow create: if isOrgMember(request.resource.data.orgId);
  allow update: if isOrgMember(resource.data.orgId);
  allow delete: if isOrgMember(resource.data.orgId);
}

// Signature requests
match /signatureRequests/{requestId} {
  allow read: if isOrgMember(resource.data.orgId);
  allow create: if isOrgMember(request.resource.data.orgId);
  allow update: if isOrgMember(resource.data.orgId);
  allow delete: if false; // Never delete signature requests
}

// Public access for signing (magic link)
match /signatureRequests/{requestId} {
  allow read: if true; // Token validation happens in app
  allow update: if request.resource.data.keys().hasOnly(['signers', 'status', 'auditTrail', 'updatedAt']);
}
```

---

## Post-Feature Deployment

After feature is complete:

- [ ] **Run TypeScript check:** `npx tsc --noEmit`
- [ ] **Deploy Firestore rules:** `firebase deploy --only firestore:rules`
- [ ] **Deploy indexes:** `firebase deploy --only firestore:indexes`
- [ ] **Deploy functions (if changed):** `npm run deploy:functions`
- [ ] **Test in production** with a test org
- [ ] **Update SPRINT_STATUS.md** with completion

---

## CLI Authentication Commands

### Firebase CLI
```bash
# Login
firebase login

# Check current project
firebase projects:list
firebase use contractoros-483812

# Logout
firebase logout
```

### Google Cloud CLI
```bash
# Login
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project contractoros-483812

# Check auth
gcloud auth list

# Logout
gcloud auth revoke
```

### Common Issues

**"Permission denied" on Firestore:**
1. Check if rules are deployed: `firebase deploy --only firestore:rules`
2. Verify user is authenticated
3. Check orgId matches in query

**"Missing index" error:**
1. Click the link in the error to create index
2. Or add to `firestore.indexes.json` and deploy

**"Function deployment failed":**
1. Check `functions/package.json` dependencies
2. Run `cd functions && npm install`
3. Check for TypeScript errors: `cd functions && npm run build`

---

## Quick Reference

### Deploy Commands
```bash
# Everything
firebase deploy

# Just rules
firebase deploy --only firestore:rules

# Just functions
firebase deploy --only functions

# Just indexes
firebase deploy --only firestore:indexes

# Specific function
firebase deploy --only functions:functionName
```

### Local Development
```bash
# Start emulators
npm run emulators

# Start dev server
npm run dev

# Emulator URLs
# Auth: http://localhost:9099
# Firestore: http://localhost:8080
# Functions: http://localhost:5001
```

---

## Testing Requirements

### Pre-Commit Testing (MANDATORY)

Run these before EVERY commit:

```bash
# 1. TypeScript check (catches type errors)
cd apps/web && npx tsc --noEmit

# 2. Lint check (catches style issues)
npm run lint

# 3. Build check (catches runtime issues)
npm run build
```

### Manual Testing Checklist

For EVERY new feature, verify:

```markdown
## CRUD Operations
- [ ] Create with all required fields works
- [ ] Create with optional fields empty works
- [ ] Read displays data correctly
- [ ] Update saves changes
- [ ] Delete with confirmation works
- [ ] Toast notifications appear on all operations

## Error Handling
- [ ] Invalid data shows error toast
- [ ] Network error shows retry option
- [ ] Permission denied shows clear message

## Permission Testing
- [ ] Test as OWNER role
- [ ] Test as PM role
- [ ] Test as EMPLOYEE role

## UI/UX
- [ ] Loading states show skeletons
- [ ] Empty states display properly
- [ ] Real-time updates work
```

### Firestore Rules Testing

**Before deploying rules to production:**

1. Start emulators: `npm run emulators`
2. Test CRUD operations against emulator
3. Verify permission denied for unauthorized access
4. Then deploy: `firebase deploy --only firestore:rules --project contractoros-483812`

### Common Mistakes to Avoid

| Mistake | Symptom | Prevention |
|---------|---------|------------|
| Rules not deployed | "permission-denied" error | Always deploy rules with new collections |
| Type mismatch | TypeScript errors at runtime | Define types FIRST in `types/index.ts` |
| Missing required field | Create fails silently | Check type definition for required fields |
| Wrong field name | Data doesn't save/display | Match field names EXACTLY to type |
| No error handling | Silent failures | Always add try/catch with toast |

See `docs/TESTING_STRATEGY.md` for comprehensive testing guidelines.

---

## Documentation Requirements

### For Every Feature

1. **Update CHANGELOG.md** with version entry
2. **Update SPRINT_STATUS.md** with progress
3. **Add to help docs plan** if user-facing
