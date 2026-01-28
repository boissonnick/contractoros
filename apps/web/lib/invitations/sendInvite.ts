import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { UserRole, EmployeeType } from '@/types';

export interface InvitePayload {
  name: string;
  email: string;
  role: UserRole;
  employeeType?: EmployeeType;
  orgId: string;
  invitedBy: string;
  projectIds?: string[];
}

export async function sendInvite(payload: InvitePayload): Promise<string> {
  const email = payload.email.toLowerCase().trim();

  // Check for existing user
  const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
  if (!usersSnap.empty) {
    throw new Error('A user with this email already exists');
  }

  // Check for pending invite
  const invitesSnap = await getDocs(
    query(collection(db, 'invites'), where('email', '==', email), where('status', '==', 'pending'))
  );
  if (!invitesSnap.empty) {
    throw new Error('A pending invite already exists for this email');
  }

  const now = Timestamp.now();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days

  const inviteRef = await addDoc(collection(db, 'invites'), {
    email,
    name: payload.name.trim(),
    role: payload.role,
    employeeType: payload.employeeType || null,
    orgId: payload.orgId,
    invitedBy: payload.invitedBy,
    projectIds: payload.projectIds || [],
    status: 'pending',
    createdAt: now,
    expiresAt,
  });

  return inviteRef.id;
}
