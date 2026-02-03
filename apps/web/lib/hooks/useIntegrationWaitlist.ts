/**
 * Integration Waitlist Hook
 *
 * Manages waitlist signups for upcoming integrations (Gusto, Stripe, etc.).
 * Stores entries in Firestore at the organization level.
 *
 * @example
 * const { signup, loading, success, error } = useIntegrationWaitlist();
 *
 * await signup({
 *   email: 'user@company.com',
 *   companyName: 'Acme Construction',
 *   integrationType: 'gusto',
 *   employeeCount: 25,
 * });
 */

'use client';

import { useState, useCallback } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';

export type IntegrationType = 'gusto' | 'stripe' | 'xero' | 'adp' | 'other';

export interface WaitlistEntry {
  id: string;
  email: string;
  companyName: string;
  integrationType: IntegrationType;
  employeeCount?: number;
  monthlyVolume?: string; // For payment integrations
  notes?: string;
  createdAt: Date;
  orgId?: string;
  userId?: string;
}

export interface WaitlistSignupData {
  email: string;
  companyName: string;
  integrationType: IntegrationType;
  employeeCount?: number;
  monthlyVolume?: string;
  notes?: string;
}

export interface UseIntegrationWaitlistResult {
  /**
   * Sign up for the integration waitlist
   */
  signup: (data: WaitlistSignupData) => Promise<string>;

  /**
   * Loading state during signup
   */
  loading: boolean;

  /**
   * Success state after signup
   */
  success: boolean;

  /**
   * Error message if signup failed
   */
  error: string | null;

  /**
   * Reset the form state
   */
  reset: () => void;
}

export function useIntegrationWaitlist(): UseIntegrationWaitlistResult {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = useCallback(
    async (data: WaitlistSignupData): Promise<string> => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        // Validate required fields
        if (!data.email || !data.companyName || !data.integrationType) {
          throw new Error('Please fill in all required fields');
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          throw new Error('Please enter a valid email address');
        }

        // Create the waitlist entry
        const waitlistRef = collection(db, 'integrationWaitlist');
        const docRef = await addDoc(waitlistRef, {
          email: data.email.toLowerCase().trim(),
          companyName: data.companyName.trim(),
          integrationType: data.integrationType,
          employeeCount: data.employeeCount || null,
          monthlyVolume: data.monthlyVolume || null,
          notes: data.notes || null,
          orgId: profile?.orgId || null,
          userId: profile?.uid || null,
          createdAt: Timestamp.now(),
        });

        setSuccess(true);
        return docRef.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to join waitlist';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [profile?.orgId, profile?.uid]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setSuccess(false);
    setError(null);
  }, []);

  return {
    signup,
    loading,
    success,
    error,
    reset,
  };
}

export default useIntegrationWaitlist;
