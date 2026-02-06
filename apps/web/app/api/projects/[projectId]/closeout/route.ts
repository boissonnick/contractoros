/**
 * Closeout Checklist API - Sprint 33
 * Project closeout checklist management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/assistant/firebase-admin-init';
import { logger } from '@/lib/utils/logger';

// Default closeout checklist template
const DEFAULT_CHECKLIST_ITEMS = [
  { id: 'doc-1', label: 'All permits closed out', category: 'documentation' as const, completed: false },
  { id: 'doc-2', label: 'As-built drawings submitted', category: 'documentation' as const, completed: false },
  { id: 'doc-3', label: 'Product manuals delivered', category: 'documentation' as const, completed: false },
  { id: 'doc-4', label: 'Warranty documents compiled', category: 'warranty' as const, completed: false },
  { id: 'insp-1', label: 'Final inspection passed', category: 'inspection' as const, completed: false },
  { id: 'insp-2', label: 'Certificate of occupancy obtained', category: 'inspection' as const, completed: false },
  { id: 'client-1', label: 'Final walkthrough completed', category: 'client' as const, completed: false },
  { id: 'client-2', label: 'Punch list items resolved', category: 'client' as const, completed: false },
  { id: 'client-3', label: 'Client sign-off obtained', category: 'client' as const, completed: false },
  { id: 'fin-1', label: 'Final invoice sent', category: 'financial' as const, completed: false },
  { id: 'fin-2', label: 'Final payment received', category: 'financial' as const, completed: false },
  { id: 'fin-3', label: 'Retainage released', category: 'financial' as const, completed: false },
  { id: 'war-1', label: 'Warranty period start date documented', category: 'warranty' as const, completed: false },
  { id: 'war-2', label: 'Warranty contacts provided to client', category: 'warranty' as const, completed: false },
];

async function verifyAuth(request: NextRequest) {
  await initializeAdminApp();
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.slice(7);
    const decodedToken = await getAuth().verifyIdToken(token);
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (!userData?.orgId) return null;
    return { uid: decodedToken.uid, orgId: userData.orgId };
  } catch {
    return null;
  }
}

// GET - Get closeout checklist for project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;

    await initializeAdminApp();
    const db = getFirestore();

    const checklistRef = db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('closeoutChecklists')
      .doc(projectId);

    const doc = await checklistRef.get();

    if (!doc.exists) {
      // Return default template if no checklist exists
      return NextResponse.json({
        checklist: {
          id: projectId,
          projectId,
          orgId: auth.orgId,
          items: DEFAULT_CHECKLIST_ITEMS,
          completedCount: 0,
          totalCount: DEFAULT_CHECKLIST_ITEMS.length,
        },
        isNew: true,
      });
    }

    return NextResponse.json({ checklist: { id: doc.id, ...doc.data() }, isNew: false });
  } catch (error) {
    logger.error('Error fetching closeout checklist', { error, route: 'project-closeout' });
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST - Create or update closeout checklist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;
    const body = await request.json();

    await initializeAdminApp();
    const db = getFirestore();

    const items = body.items || DEFAULT_CHECKLIST_ITEMS;
    const completedCount = items.filter((item: { completed: boolean }) => item.completed).length;

    const checklist = {
      projectId,
      orgId: auth.orgId,
      items,
      completedCount,
      totalCount: items.length,
      updatedAt: new Date(),
      ...(completedCount === items.length ? { completedAt: new Date(), completedBy: auth.uid } : {}),
    };

    await db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('closeoutChecklists')
      .doc(projectId)
      .set(checklist, { merge: true });

    return NextResponse.json({ success: true, checklist: { id: projectId, ...checklist } });
  } catch (error) {
    logger.error('Error saving closeout checklist', { error, route: 'project-closeout' });
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
