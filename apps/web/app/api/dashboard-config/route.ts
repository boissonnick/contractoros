import { NextRequest, NextResponse } from 'next/server';
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { verifyAuth } from '@/lib/api/auth';
import { DashboardLayout, Widget } from '@/lib/dashboard-widgets/types';
import { getDefaultLayout } from '@/lib/dashboard-widgets/layout-manager';

const COLLECTION_PATH = 'users';
const SUBCOLLECTION = 'dashboardConfig';
const DOC_ID = 'layout';

/**
 * GET /api/dashboard-config
 * Returns the user's dashboard configuration or default layout
 */
export async function GET(request: NextRequest) {
  const { user, error } = await verifyAuth(request);

  if (error) return error;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const docRef = doc(db, COLLECTION_PATH, user.uid, SUBCOLLECTION, DOC_ID);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      // Return default layout for new users
      const defaultLayout = getDefaultLayout(user.uid, user.orgId);
      return NextResponse.json({
        layout: {
          ...defaultLayout,
          lastModified: defaultLayout.lastModified.toISOString(),
        },
        isDefault: true,
      });
    }

    const data = snapshot.data();

    // Validate user owns this config
    if (data.userId !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const layout: DashboardLayout = {
      userId: data.userId,
      orgId: data.orgId,
      widgets: data.widgets || [],
      gridColumns: data.gridColumns || 12,
      lastModified: data.lastModified?.toDate() || new Date(),
    };

    return NextResponse.json({
      layout: {
        ...layout,
        lastModified: layout.lastModified.toISOString(),
      },
      isDefault: false,
    });
  } catch (err) {
    console.error('Error fetching dashboard config:', err);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard-config
 * Saves the user's dashboard configuration
 */
export async function PUT(request: NextRequest) {
  const { user, error } = await verifyAuth(request);

  if (error) return error;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { widgets, gridColumns } = body as {
      widgets?: Widget[];
      gridColumns?: number;
    };

    // Validate input
    if (!widgets || !Array.isArray(widgets)) {
      return NextResponse.json(
        { error: 'Invalid widgets array' },
        { status: 400 }
      );
    }

    // Validate each widget has required fields
    for (const widget of widgets) {
      if (!widget.id || !widget.type || !widget.position) {
        return NextResponse.json(
          { error: 'Invalid widget structure' },
          { status: 400 }
        );
      }
    }

    const docRef = doc(db, COLLECTION_PATH, user.uid, SUBCOLLECTION, DOC_ID);

    // Check if config exists and user owns it
    const existingDoc = await getDoc(docRef);
    if (existingDoc.exists() && existingDoc.data().userId !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = {
      userId: user.uid,
      orgId: user.orgId,
      widgets,
      gridColumns: gridColumns || 12,
      lastModified: Timestamp.now(),
    };

    await setDoc(docRef, data, { merge: true });

    return NextResponse.json({
      success: true,
      layout: {
        ...data,
        lastModified: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Error saving dashboard config:', err);
    return NextResponse.json(
      { error: 'Failed to save dashboard configuration' },
      { status: 500 }
    );
  }
}
