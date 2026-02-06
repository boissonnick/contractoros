import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { UserProfile } from '@/types';
import { setSessionCookie, clearSessionCookie } from '@/lib/auth/session-cookie';
import { logger } from '@/lib/utils/logger';

const AUTH_TIMEOUT_MS = 10_000;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  profileError: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  authError: null,
  profileError: null,
  signOut: async () => {},
});

/**
 * Hook for accessing authentication state and user profile.
 *
 * Provides the current Firebase user, their Firestore profile, loading state,
 * authentication errors, and a sign-out function.
 *
 * @returns {AuthContextType} Authentication state and operations
 * @returns {User|null} user - Firebase Auth user object or null if not authenticated
 * @returns {UserProfile|null} profile - Firestore user profile with role, orgId, permissions
 * @returns {boolean} loading - True while auth state is being determined
 * @returns {string|null} authError - Error message if auth initialization failed
 * @returns {string|null} profileError - Error message if profile loading failed
 * @returns {Function} signOut - Async function to sign out the current user
 *
 * @example
 * // Basic usage - check authentication
 * const { user, profile, loading } = useAuth();
 *
 * if (loading) return <Spinner />;
 * if (!user) return <LoginPage />;
 *
 * @example
 * // Access user role and organization
 * const { profile } = useAuth();
 * const isAdmin = profile?.role === 'OWNER' || profile?.role === 'PM';
 * const orgId = profile?.orgId;
 *
 * @example
 * // Sign out
 * const { signOut } = useAuth();
 * await signOut();
 */
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children?: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Ref to track profile subscription for cleanup
  const profileUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let didResolve = false;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      didResolve = true;
      setAuthError(null);
      setUser(currentUser);

      // Clean up previous profile listener
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      if (currentUser) {
        // Set session cookie for middleware
        try {
          const idToken = await currentUser.getIdToken();
          await setSessionCookie(idToken);
        } catch (e) {
          logger.warn('Failed to set session cookie', { error: e, module: 'auth' });
        }

        // Set up real-time profile listener
        const userDocRef = doc(db, 'users', currentUser.uid);

        profileUnsubRef.current = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
              setProfileError(null);
            } else {
              logger.warn('User authenticated but no profile found in Firestore', { module: 'auth' });
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            logger.error('Error fetching user profile', { error, module: 'auth' });
            setProfileError(error.message || 'Failed to load user profile');
            setProfile(null);
            setLoading(false);
          }
        );
      } else {
        clearSessionCookie();
        setProfile(null);
        setProfileError(null);
        setLoading(false);
      }
    });

    // Timeout: if onAuthStateChanged hasn't fired after AUTH_TIMEOUT_MS,
    // surface an error so the UI can offer Retry / Go to Login.
    const timer = setTimeout(() => {
      if (!didResolve) {
        setAuthError('Auth is taking longer than expected. The server may be unreachable.');
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    return () => {
      unsubscribe();
      clearTimeout(timer);
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }
    };
  }, []);

  const signOut = async () => {
    try {
      clearSessionCookie();
      await firebaseSignOut(auth);
      setProfile(null);
      setUser(null);
      setProfileError(null);
    } catch (error) {
      logger.error('Error signing out', { error, module: 'auth' });
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, authError, profileError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
