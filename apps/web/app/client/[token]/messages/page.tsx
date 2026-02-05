'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PortalNav, MessageThread, ThreadMessage } from '@/components/client-portal';
import {
  uploadMultipleAttachments,
} from '@/lib/storage/message-attachments';

interface ClientPortalData {
  projectId: string;
  projectName: string;
  orgId: string;
  companyName?: string;
  clientId: string;
  clientName: string;
}

export default function MessagesPage() {
  const params = useParams();
  const token = params.token as string;

  const [portalData, setPortalData] = useState<ClientPortalData | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    async function fetchPortalData() {
      if (!token) {
        setError('Invalid link');
        setLoading(false);
        return;
      }

      try {
        // Fetch client portal access token
        const tokenDoc = await getDoc(doc(db, 'clientPortalTokens', token));

        if (!tokenDoc.exists()) {
          setError('This link is invalid or has expired');
          setLoading(false);
          return;
        }

        const tokenData = tokenDoc.data();
        const projectId = tokenData.projectId;
        const orgId = tokenData.orgId;
        const clientId = tokenData.clientId;

        // Fetch project details
        const projectDoc = await getDoc(
          doc(db, `organizations/${orgId}/projects/${projectId}`)
        );

        if (!projectDoc.exists()) {
          setError('Project not found');
          setLoading(false);
          return;
        }

        const projectData = projectDoc.data();

        // Fetch organization for company name
        const orgDoc = await getDoc(doc(db, `organizations/${orgId}`));
        const companyName = orgDoc.exists() ? orgDoc.data()?.name : undefined;

        // Fetch client details
        const clientDoc = await getDoc(doc(db, `organizations/${orgId}/clients/${clientId}`));
        const clientName = clientDoc.exists()
          ? clientDoc.data()?.name || 'Client'
          : 'Client';

        setPortalData({
          projectId,
          projectName: projectData.name || 'Project',
          orgId,
          companyName,
          clientId,
          clientName,
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching portal data:', err);
        setError('Failed to load messages');
        setLoading(false);
      }
    }

    fetchPortalData();
  }, [token]);

  // Real-time subscription to messages
  useEffect(() => {
    if (!portalData) return;

    const messagesQuery = query(
      collection(
        db,
        `organizations/${portalData.orgId}/projects/${portalData.projectId}/messages`
      ),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData: ThreadMessage[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            content: data.content,
            senderType: data.senderType || (data.senderId === portalData.clientId ? 'client' : 'contractor'),
            senderName: data.senderName || 'Unknown',
            createdAt: data.createdAt?.toDate() || new Date(),
            attachments: data.attachments,
          };
        });
        setMessages(messagesData);
      },
      (err) => {
        console.error('Error listening to messages:', err);
      }
    );

    return () => unsubscribe();
  }, [portalData]);

  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!portalData) return;

    try {
      // Upload attachments if any
      let uploadedAttachments: { url: string; type: 'image' | 'file'; name: string }[] = [];

      if (attachments && attachments.length > 0) {
        setUploadProgress({ current: 0, total: attachments.length, percentage: 0 });

        const uploaded = await uploadMultipleAttachments(
          attachments,
          portalData.orgId,
          portalData.projectId,
          (current, total, progress) => {
            setUploadProgress({
              current,
              total,
              percentage: progress.percentage,
            });
          }
        );

        uploadedAttachments = uploaded.map((att) => ({
          url: att.url,
          type: att.type === 'image' ? 'image' as const : 'file' as const,
          name: att.name,
        }));

        setUploadProgress(null);
      }

      // Save message to Firestore
      await addDoc(
        collection(
          db,
          `organizations/${portalData.orgId}/projects/${portalData.projectId}/messages`
        ),
        {
          content,
          senderType: 'client',
          senderId: portalData.clientId,
          senderName: portalData.clientName,
          createdAt: serverTimestamp(),
          attachments: uploadedAttachments,
        }
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setUploadProgress(null);
      throw err; // Re-throw to let MessageThread handle the error UI
    }
  }, [portalData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse bg-white border-b p-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
        </div>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-gray-400">Loading messages...</div>
        </div>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold font-heading tracking-tight text-gray-900 mb-2">
            {error || 'Something went wrong'}
          </h1>
          <p className="text-gray-500">Please contact your contractor for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <PortalNav
        token={token}
        projectName={portalData.projectName}
        companyName={portalData.companyName}
      />

      <main className="flex-1 overflow-hidden pb-16 md:pb-0">
        <div className="max-w-2xl mx-auto h-full bg-white md:my-4 md:rounded-lg md:border md:shadow-sm">
          <MessageThread
            messages={messages}
            contractorName={portalData.companyName}
            clientName={portalData.clientName}
            onSendMessage={handleSendMessage}
            uploadProgress={uploadProgress}
            className="h-full"
          />
        </div>
      </main>
    </div>
  );
}
