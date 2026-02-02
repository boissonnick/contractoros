/**
 * RFI List & Create API - Sprint 34
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

async function getNextRFINumber(db: FirebaseFirestore.Firestore, orgId: string, projectId: string): Promise<string> {
  const snapshot = await db
    .collection('organizations').doc(orgId)
    .collection('rfis')
    .where('projectId', '==', projectId)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) return 'RFI-001';
  const lastNumber = snapshot.docs[0].data().number || 'RFI-000';
  const num = parseInt(lastNumber.split('-')[1] || '0', 10) + 1;
  return `RFI-${num.toString().padStart(3, '0')}`;
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
    const assignedTo = searchParams.get('assignedTo');

    const db = getFirestore();
    let query: FirebaseFirestore.Query = db
      .collection('organizations').doc(auth.orgId)
      .collection('rfis')
      .where('projectId', '==', projectId);

    if (status) query = query.where('status', '==', status);
    if (assignedTo) query = query.where('assignedTo', '==', assignedTo);

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const rfis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ rfis });
  } catch (error) {
    console.error('Error fetching RFIs:', error);
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

    const number = await getNextRFINumber(db, auth.orgId, projectId);

    const rfi = {
      ...body,
      projectId,
      orgId: auth.orgId,
      number,
      status: body.status || 'draft',
      priority: body.priority || 'normal',
      createdBy: auth.uid,
      createdByName: auth.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments: body.attachments || [],
    };

    const docRef = await db
      .collection('organizations').doc(auth.orgId)
      .collection('rfis')
      .add(rfi);

    return NextResponse.json({ id: docRef.id, ...rfi });
  } catch (error) {
    console.error('Error creating RFI:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
