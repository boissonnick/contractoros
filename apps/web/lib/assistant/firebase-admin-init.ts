/**
 * Firebase Admin SDK Initialization
 *
 * Ensures Firebase Admin is initialized exactly once.
 * Used by server-side context loader and API routes.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { logger } from '@/lib/utils/logger';

let adminApp: App | null = null;

/**
 * Initialize Firebase Admin SDK if not already initialized
 */
export async function initializeAdminApp(): Promise<App> {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // Initialize based on environment
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Production: Use service account from environment variable
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } catch (error) {
      logger.error('Failed to parse service account key', { error, module: 'firebase-admin-init' });
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY');
    }
  } else {
    // Development: Use application default credentials or project ID
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  return adminApp;
}

/**
 * Get the initialized admin app
 */
export function getAdminApp(): App {
  if (!adminApp) {
    throw new Error('Firebase Admin not initialized. Call initializeAdminApp() first.');
  }
  return adminApp;
}
