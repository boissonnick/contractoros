# Environment Configuration

**Last Updated:** 2026-02-04
**Purpose:** Complete environment setup and tool configuration for ContractorOS development

---

## Quick Reference

| Tool | Version | Status | Path |
|------|---------|--------|------|
| **Node.js** | v22.x | ✅ Required | `/opt/homebrew/opt/node@22/bin/` |
| **npm** | v10.x | ✅ Required | System default |
| **Firebase CLI** | v15.4.0+ | ✅ Required | `/opt/homebrew/bin/firebase` |
| **Docker Desktop** | Latest | ✅ Required | System app |
| **gcloud SDK** | Latest | ✅ Required | `/opt/homebrew/bin/gcloud` |
| **TypeScript** | v5.x | ✅ Auto-installed | npm package |

---

## Node.js Setup

### Installation (Homebrew)

```bash
# Install Node.js 22
brew install node@22

# Link to system
brew link node@22

# Verify installation
node --version  # Should be v22.x
npm --version   # Should be v10.x
```

### Using nvm (Alternative)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 22
nvm install 22
nvm use 22

# Set as default
nvm alias default 22
```

### .nvmrc Configuration

The project includes `.nvmrc` for automatic version switching:

```bash
# Auto-switch when entering project directory
cd /path/to/contractoros
nvm use  # Reads .nvmrc and switches to Node 22
```

**File location:** `/Users/nickbodkins/contractoros/.nvmrc`
**Contents:** `22`

---

## Firebase CLI

### Installation

```bash
# Install via npm (recommended)
npm install -g firebase-tools

# Or via Homebrew
brew install firebase-cli

# Verify installation
firebase --version  # Should be v15.4.0 or higher
```

### Authentication

```bash
# Login to Firebase
firebase login

# Select project
firebase use contractoros-483812

# Verify current project
firebase projects:list
```

### Common Commands

```bash
# Deploy Firestore rules & indexes
firebase deploy --only firestore --project contractoros-483812

# Deploy Cloud Functions
firebase deploy --only functions --project contractoros-483812

# Local emulator (for testing)
firebase emulators:start --only firestore

# View logs
firebase functions:log --project contractoros-483812
```

---

## Docker Desktop

### Installation

Download from: https://www.docker.com/products/docker-desktop/

**Mac:** Install Docker Desktop for Mac (Apple Silicon or Intel)

### Verification

```bash
# Check Docker daemon is running
docker ps

# Check Docker version
docker --version

# Test with hello-world
docker run hello-world
```

### Docker Configuration for ContractorOS

**Image name:** `contractoros-web`
**Container name:** `contractoros-web`
**Port mapping:** 3000:8080 (host:container)

**Resource limits (recommended):**
- CPUs: 4
- Memory: 8GB
- Swap: 2GB
- Disk image size: 64GB

---

## Google Cloud SDK

### Installation

```bash
# Install via Homebrew
brew install --cask google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### Authentication & Configuration

```bash
# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project contractoros-483812

# Application default credentials (for local development)
gcloud auth application-default login

# Verify configuration
gcloud config list
```

### Service Account (CI/CD)

For automated deployments, use service account:

**Location:** GCP IAM → Service Accounts
**Key storage:** GCP Secret Manager or GitHub Secrets
**Never commit:** Service account keys to git

---

## Development Environment Setup

### Initial Setup (First Time)

```bash
# 1. Clone repository
git clone [repository-url]
cd contractoros

# 2. Switch to Node 22
nvm use  # or ensure Node 22 is active

# 3. Install dependencies
cd apps/web
npm install

# 4. Create .env.local (see Environment Variables section)
cp .env.example .env.local
# Edit .env.local with your Firebase config

# 5. Verify TypeScript
npx tsc --noEmit

# 6. Start development server
npm run dev  # http://localhost:3000
```

### Daily Development Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Ensure Node 22
nvm use

# 3. Update dependencies (if package.json changed)
npm install

# 4. Type check before coding
cd apps/web
npx tsc --noEmit

# 5. Start dev server
npm run dev
```

---

## Environment Variables

### Firebase Configuration

**Required in `.env.local`:**

```bash
# Firebase Web SDK Config (6 variables)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=contractoros-483812.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=contractoros-483812
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=contractoros-483812.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Mailgun (email notifications)
MAILGUN_API_KEY=key-...
MAILGUN_DOMAIN=mg.yourdomain.com

# QuickBooks (if configured)
QUICKBOOKS_CLIENT_ID=...
QUICKBOOKS_CLIENT_SECRET=...
```

### Getting Firebase Config

1. Go to Firebase Console: https://console.firebase.google.com
2. Select `contractoros-483812` project
3. Click gear icon → Project settings
4. Scroll to "Your apps" → Web app
5. Copy config values to `.env.local`

### Secret Management

**Local development:** `.env.local` (git-ignored)
**Production:** GCP Secret Manager
**CI/CD:** GitHub Secrets or Cloud Build secrets

**Never commit:**
- `.env.local`
- Service account keys
- API keys
- Firebase config (except in Secret Manager)

---

## Docker Build Configuration

### Local Docker Build

```bash
# Build with .env.local (recommended)
cd apps/web
./docker-build-local.sh

# Manual build (NOT recommended - missing env vars)
docker build -t contractoros-web .
```

### Docker Build Script (`docker-build-local.sh`)

```bash
#!/bin/bash
# Builds Docker image with .env.local secrets

# Read .env.local and pass as build args
docker build \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=$(grep NEXT_PUBLIC_FIREBASE_API_KEY .env.local | cut -d '=' -f2) \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$(grep NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN .env.local | cut -d '=' -f2) \
  # ... (all other env vars)
  -t contractoros-web .
```

**Why needed:** Next.js build-time requires `NEXT_PUBLIC_*` variables

### Running Docker Container

```bash
# Stop and remove old container
docker stop contractoros-web
docker rm contractoros-web

# Run new container
docker run -d \
  -p 3000:8080 \
  --name contractoros-web \
  contractoros-web

# View logs
docker logs -f contractoros-web

# Check status
docker ps | grep contractoros-web
```

---

## Firestore Database Configuration

### Named Database: `contractoros`

**CRITICAL:** This project uses a named Firestore database, not the default database.

### Viewing Data in Firebase Console

1. Go to Firebase Console → Firestore Database
2. **Select database:** Click dropdown at top
3. **Choose:** `contractoros` (NOT `(default)`)
4. Now you'll see app data

### Code Configuration

**Web app (`apps/web/lib/firebase/config.ts`):**
```typescript
import { getFirestore } from 'firebase/firestore';
export const db = getFirestore(app, "contractoros");
```

**Cloud Functions & Scripts:**
```typescript
import { getFirestore } from 'firebase-admin/firestore';
const db = getFirestore(app, 'contractoros');
```

**Common mistake:**
```typescript
// WRONG - uses default database
const db = getFirestore(app);  // Data won't appear in app!
```

---

## IDE Configuration

### VS Code (Recommended)

**Extensions:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Firebase
- Docker

**Settings (`.vscode/settings.json`):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

### TypeScript Configuration

**Location:** `apps/web/tsconfig.json`

**Key settings:**
- `strict: true` — All strict type checking
- `noEmit: true` — Type check only, Next.js handles build
- Path aliases: `@/*` → `./` (root of apps/web/)

**Type check command:**
```bash
cd apps/web
npx tsc --noEmit
```

---

## Troubleshooting

### Node Version Issues

**Symptom:** `Error: The engine "node" is incompatible with this module`

**Fix:**
```bash
nvm use 22
# or
nvm install 22 && nvm use 22
```

### Firebase CLI Not Found

**Symptom:** `firebase: command not found`

**Fix:**
```bash
# If installed via npm
npm install -g firebase-tools

# Add to PATH (if needed)
export PATH=$PATH:$(npm bin -g)
```

### Docker Build Fails

**Symptom:** `auth/invalid-api-key` or build errors

**Fix:**
```bash
# Use docker-build-local.sh script (reads .env.local)
./docker-build-local.sh

# NOT this:
docker build -t contractoros-web .  # Missing env vars!
```

### Container Already Exists

**Symptom:** `Error: container name already in use`

**Fix:**
```bash
docker stop contractoros-web
docker rm contractoros-web
# Then run again
```

### Port Already in Use

**Symptom:** `Error: bind: address already in use`

**Fix:**
```bash
# Find process on port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use different port
docker run -d -p 3001:8080 --name contractoros-web contractoros-web
```

---

## Performance Optimization

### Development Server

**Faster rebuilds:**
```bash
# Use turbo cache
npm run dev -- --turbo
```

**Reduce memory usage:**
```bash
# Limit Node memory
NODE_OPTIONS='--max-old-space-size=4096' npm run dev
```

### Docker Build Cache

**Speed up builds:**
```bash
# Use buildkit
export DOCKER_BUILDKIT=1

# Build with cache
docker build --cache-from contractoros-web:latest -t contractoros-web .
```

---

## Production Deployment

### Cloud Run Configuration

**Service:** `contractoros-web`
**Region:** `us-west1`
**Platform:** Cloud Run (fully managed)
**Min instances:** 1
**Max instances:** 10
**Memory:** 512MB
**CPU:** 1

### Deployment Methods

**Method 1: Cloud Build (Automated)**
```bash
# Triggered automatically on git push to main
# Configured in cloudbuild.yaml
```

**Method 2: Manual Deploy**
```bash
# Build and push to GCR
gcloud builds submit --config cloudbuild.yaml

# Deploy to Cloud Run
gcloud run deploy contractoros-web \
  --image gcr.io/contractoros-483812/contractoros-web \
  --region us-west1 \
  --platform managed
```

---

## References

- **Firebase Console:** https://console.firebase.google.com
- **GCP Console:** https://console.cloud.google.com
- **Docker Hub:** https://hub.docker.com
- **Node.js Releases:** https://nodejs.org/en/about/releases/
- **Firebase CLI Docs:** https://firebase.google.com/docs/cli

---

*For daily commands, see `CLAUDE.md` → Critical Commands section*
