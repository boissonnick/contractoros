# ContractorOS

A production-ready contractor management web application deployed on Google Cloud.

## Architecture

- **Frontend:** Next.js 14 App Router deployed to Cloud Run (us-west1)
- **Backend:** Firebase Cloud Functions Gen 2 (us-east1)
- **Auth:** Firebase Authentication (email/password)
- **Database:** Firestore

## Project Structure

```
/
├── apps/
│   └── web/                    # Next.js 14 frontend
│       ├── app/                # App Router pages
│       │   ├── login/          # Login page
│       │   └── portal/         # Protected portals
│       │       ├── client/     # Client portal
│       │       └── sub/        # Subcontractor portal
│       ├── components/         # React components
│       ├── context/            # React contexts
│       ├── lib/                # Utilities and Firebase config
│       └── types/              # TypeScript types
├── functions/                  # Firebase Cloud Functions
│   └── src/
│       └── index.ts            # Function definitions
├── firebase.json               # Firebase configuration
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Firestore indexes
└── cloudbuild.yaml             # Cloud Build configuration
```

## Development

### Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud SDK (optional, for local gcloud commands)

### Local Development

1. Install dependencies:
   ```bash
   cd apps/web && npm install
   cd ../../functions && npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Run Firebase emulators (optional):
   ```bash
   npm run emulators
   ```

## Deployment

### Frontend (Cloud Run)

The frontend is automatically deployed via Cloud Build when changes are pushed to the main branch.

### Functions

Deploy functions manually:
```bash
npm run deploy:functions
```

## Environment Variables

### Frontend (apps/web)

The Firebase configuration is embedded in `lib/firebase/config.ts`. For production, you may want to use environment variables:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Functions

Functions use Firebase Admin SDK which automatically authenticates in Google Cloud environments.

## Security

- All Firestore access is protected by security rules
- User authentication is handled client-side only
- No privileged logic in Next.js pages
- All secrets use environment variables or Secret Manager
