import { db } from '@/lib/firebase/config';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

export async function resetUserOnboarding(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    onboardingCompleted: false,
    onboardingStep: null,
    updatedAt: Timestamp.now(),
  });
}

export async function resetOrgOnboarding(orgId: string): Promise<void> {
  await updateDoc(doc(db, 'organizations', orgId), {
    onboardingCompleted: false,
    updatedAt: Timestamp.now(),
  });
}
