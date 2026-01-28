import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

export async function acceptInvite(inviteId: string, uid: string, email: string, displayName: string) {
  const inviteRef = doc(db, 'invites', inviteId);
  const inviteSnap = await getDoc(inviteRef);

  if (!inviteSnap.exists()) {
    throw new Error('Invite not found');
  }

  const invite = inviteSnap.data();

  if (invite.status !== 'pending') {
    throw new Error('This invite has already been used or expired');
  }

  // Check expiry
  if (invite.expiresAt?.toDate() < new Date()) {
    await updateDoc(inviteRef, { status: 'expired' });
    throw new Error('This invite has expired');
  }

  // Create user profile
  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    displayName,
    role: invite.role,
    employeeType: invite.employeeType || null,
    orgId: invite.orgId,
    permissions: {
      projectIds: invite.projectIds || [],
    },
    isActive: true,
    onboardingCompleted: false,
    createdAt: Timestamp.now(),
  });

  // Mark invite as accepted
  await updateDoc(inviteRef, {
    status: 'accepted',
    acceptedAt: Timestamp.now(),
    acceptedBy: uid,
  });

  return {
    role: invite.role,
    orgId: invite.orgId,
    employeeType: invite.employeeType,
  };
}
