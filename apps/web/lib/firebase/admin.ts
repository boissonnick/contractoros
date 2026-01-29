import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

// Singleton instances
let _app: App | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

/**
 * Get or initialize the Firebase Admin app
 */
function getApp(): App {
  if (_app) return _app;

  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  // Check for service account credentials
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      _app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (error) {
      console.error('Failed to parse Firebase service account:', error);
      throw new Error('Invalid Firebase service account configuration');
    }
  } else {
    // Use default credentials (for GCP environments)
    _app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  return _app;
}

/**
 * Get the Firestore Admin instance
 */
function getDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getApp());
  return _db;
}

/**
 * Get the Auth Admin instance
 */
function getAdminAuthInstance(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getApp());
  return _auth;
}

// Export lazy-loaded getters
export const adminDb = {
  collection: (path: string) => getDb().collection(path),
  doc: (path: string) => getDb().doc(path),
  batch: () => getDb().batch(),
  runTransaction: <T>(updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>) =>
    getDb().runTransaction(updateFunction),
};

export const adminAuth = {
  getUser: (uid: string) => getAdminAuthInstance().getUser(uid),
  getUserByEmail: (email: string) => getAdminAuthInstance().getUserByEmail(email),
  createUser: (properties: Parameters<Auth['createUser']>[0]) => getAdminAuthInstance().createUser(properties),
  updateUser: (uid: string, properties: Parameters<Auth['updateUser']>[1]) => getAdminAuthInstance().updateUser(uid, properties),
  deleteUser: (uid: string) => getAdminAuthInstance().deleteUser(uid),
  verifyIdToken: (idToken: string) => getAdminAuthInstance().verifyIdToken(idToken),
  createCustomToken: (uid: string, claims?: Record<string, unknown>) => getAdminAuthInstance().createCustomToken(uid, claims),
};

export { Timestamp, FieldValue };
