/**
 * Punch List API - Sprint 33
 * CRUD operations for punch items
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
  } catch {
    return null;
  }
}

// GET - List punch items for project
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

    await initializeAdminApp();
    const db = getFirestore();

    let query: FirebaseFirestore.Query = db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('punchItems')
      .where('projectId', '==', projectId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching punch items:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST - Create punch item
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

    const punchItem = {
      ...body,
      projectId,
      orgId: auth.orgId,
      status: 'open',
      createdBy: auth.uid,
      createdByName: auth.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      photoUrls: body.photoUrls || [],
      completionPhotoUrls: [],
      clientReported: body.clientReported || false,
    };

    const docRef = await db
      .collection('organizations')
      .doc(auth.orgId)
      .collection('punchItems')
      .add(punchItem);

    return NextResponse.json({ id: docRef.id, ...punchItem });
  } catch (error) {
    console.error('Error creating punch item:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
