"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserInvitation, InvitationStatus, UserRole } from '@/types';
import { useAuth } from '@/lib/auth';
import { toast } from '@/components/ui';
import { logger } from '@/lib/utils/logger';

// Generate a secure random token for invitation links
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function useInvitations() {
  const { profile } = useAuth();
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgId = profile?.orgId;

  // Subscribe to invitations for the organization
  useEffect(() => {
    if (!orgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- onSnapshot callback is an async event handler
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `organizations/${orgId}/invitations`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          expiresAt: doc.data().expiresAt?.toDate() || new Date(),
          acceptedAt: doc.data().acceptedAt?.toDate(),
          revokedAt: doc.data().revokedAt?.toDate(),
        })) as UserInvitation[];
        setInvitations(data);
        setLoading(false);
      },
      (err) => {
        logger.error('Error loading invitations', { error: err, hook: 'useInvitations' });
        setError('Failed to load invitations');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  // Send a new invitation
  const sendInvitation = useCallback(
    async (email: string, role: UserRole, message?: string): Promise<UserInvitation | null> => {
      if (!orgId || !profile) {
        toast.error('You must be logged in to send invitations');
        return null;
      }

      // Check if invitation already exists for this email
      const existingQ = query(
        collection(db, `organizations/${orgId}/invitations`),
        where('email', '==', email.toLowerCase()),
        where('status', '==', 'pending')
      );
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
        toast.error('An invitation has already been sent to this email');
        return null;
      }

      // Check if user already exists in organization
      const userQ = query(
        collection(db, 'users'),
        where('orgId', '==', orgId),
        where('email', '==', email.toLowerCase())
      );
      const userSnap = await getDocs(userQ);
      if (!userSnap.empty) {
        toast.error('This user is already a member of your organization');
        return null;
      }

      try {
        const token = generateToken();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const invitationData = {
          orgId,
          email: email.toLowerCase(),
          role,
          status: 'pending' as InvitationStatus,
          invitedBy: profile.uid,
          invitedByName: profile.displayName || profile.email,
          token,
          expiresAt: Timestamp.fromDate(expiresAt),
          createdAt: Timestamp.now(),
          message: message || undefined,
        };

        const docRef = await addDoc(collection(db, `organizations/${orgId}/invitations`), invitationData);

        // In a real app, you would trigger an email here via Cloud Functions
        // For now, we'll just show a success message with the link
        const inviteUrl = `${window.location.origin}/invite/${token}`;
        logger.debug('Invitation link', { data: inviteUrl, hook: 'useInvitations' });

        toast.success(`Invitation sent to ${email}`);

        return {
          id: docRef.id,
          ...invitationData,
          createdAt: now,
          expiresAt,
        };
      } catch (err) {
        logger.error('Error sending invitation', { error: err, hook: 'useInvitations' });
        toast.error('Failed to send invitation');
        return null;
      }
    },
    [orgId, profile]
  );

  // Revoke an invitation
  const revokeInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      if (!profile) {
        toast.error('You must be logged in to revoke invitations');
        return false;
      }

      try {
        await updateDoc(doc(db, `organizations/${profile.orgId}/invitations`, invitationId), {
          status: 'revoked' as InvitationStatus,
          revokedAt: Timestamp.now(),
          revokedBy: profile.uid,
        });

        toast.success('Invitation revoked');
        return true;
      } catch (err) {
        logger.error('Error revoking invitation', { error: err, hook: 'useInvitations' });
        toast.error('Failed to revoke invitation');
        return false;
      }
    },
    [profile]
  );

  // Resend an invitation (creates a new one with same details)
  const resendInvitation = useCallback(
    async (invitation: UserInvitation): Promise<UserInvitation | null> => {
      // First revoke the old one
      await revokeInvitation(invitation.id);

      // Then create a new one
      return sendInvitation(invitation.email, invitation.role, invitation.message);
    },
    [revokeInvitation, sendInvitation]
  );

  // Delete an invitation permanently
  const deleteInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      if (!orgId) {
        toast.error('Organization not found');
        return false;
      }
      try {
        await deleteDoc(doc(db, `organizations/${orgId}/invitations`, invitationId));
        toast.success('Invitation deleted');
        return true;
      } catch (err) {
        logger.error('Error deleting invitation', { error: err, hook: 'useInvitations' });
        toast.error('Failed to delete invitation');
        return false;
      }
    },
    [orgId]
  );

  // Get pending invitations only
  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  // Check if an invitation is expired
  const isExpired = (invitation: UserInvitation): boolean => {
    return new Date() > new Date(invitation.expiresAt);
  };

  return {
    invitations,
    pendingInvitations,
    loading,
    error,
    sendInvitation,
    revokeInvitation,
    resendInvitation,
    deleteInvitation,
    isExpired,
  };
}
