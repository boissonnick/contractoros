/**
 * Submittal List & Create API - Sprint 34
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/assistant/firebase-admin-init';

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
    return { uid: decodedToken.uid, orgId: userData.orgId, name: userData.displayName || 'Unknown' };
  } catch { return null; }
}

async function getNextSubmittalNumber(db: FirebaseFirestore.Firestore, orgId: string, projectId: string): Promise<string> {
  const snapshot = await db
    .collection('organizations').doc(orgId)
    .collection('submittals')
    .where('projectId', '==', projectId)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) return 'SUB-001';
  const lastNumber = snapshot.docs[0].data().number || 'SUB-000';
  const num = parseInt(lastNumber.split('-')[1] || '0', 10) + 1;
  return `SUB-${num.toString().padStart(3, '0')}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const db = getFirestore();
    let query: FirebaseFirestore.Query = db
      .collection('organizations').doc(auth.orgId)
      .collection('submittals')
      .where('projectId', '==', projectId);

    if (status) query = query.where('status', '==', status);
    if (type) query = query.where('type', '==', type);

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const submittals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ submittals });
  } catch (error) {
    console.error('Error fetching submittals:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { projectId } = await params;
    const body = await request.json();
    const db = getFirestore();

    const number = await getNextSubmittalNumber(db, auth.orgId, projectId);

    const submittal = {
      ...body,
      projectId,
      orgId: auth.orgId,
      number,
      status: body.status || 'pending',
      type: body.type || 'other',
      revisionNumber: body.revisionNumber || 1,
      createdBy: auth.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      documents: body.documents || [],
    };

    const docRef = await db
      .collection('organizations').doc(auth.orgId)
      .collection('submittals')
      .add(submittal);

    return NextResponse.json({ id: docRef.id, ...submittal });
  } catch (error) {
    console.error('Error creating submittal:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
