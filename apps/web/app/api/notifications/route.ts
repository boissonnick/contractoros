import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { verifyAuth } from '@/lib/api/auth';

/**
 * GET /api/notifications
 * Returns notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  const { user, error } = await verifyAuth(request);

  if (error) return error;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const unreadOnly = searchParams.get('unread') === 'true';

    // Query notifications for the user
    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(Math.min(limitParam, 100))
    );

    if (unreadOnly) {
      q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc'),
        limit(Math.min(limitParam, 100))
      );
    }

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({
      notifications,
      count: notifications.length,
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Creates a new notification (typically called by server-side code or Cloud Functions)
 */
export async function POST(request: NextRequest) {
  const { user, error } = await verifyAuth(request);

  if (error) return error;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, type, title, body: messageBody, link, projectId } = body;

    // Validate required fields
    if (!userId || !type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = [
      'invoice_paid',
      'payment_received',
      'task_assigned',
      'task_due',
      'project_update',
      'mention',
      'estimate_approved',
      'signature_requested',
      'signature_completed',
      'system',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Create notification
    const notification = {
      orgId: user.orgId,
      userId,
      type,
      title,
      body: messageBody || '',
      link: link || null,
      projectId: projectId || null,
      isRead: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'notifications'), notification);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Notification created successfully',
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
