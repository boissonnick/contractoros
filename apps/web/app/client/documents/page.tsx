"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { logger } from '@/lib/utils/logger';

interface ClientDocument {
  id: string;
  name: string;
  type: 'contract' | 'permit' | 'warranty' | 'insurance' | 'change_order' | 'invoice' | 'other';
  projectName?: string;
  projectId?: string;
  fileURL?: string;
  status?: string;
  date: Date;
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof DocumentTextIcon; color: string }> = {
  contract: { label: 'Contract', icon: DocumentTextIcon, color: 'bg-blue-100 text-blue-600' },
  permit: { label: 'Permit', icon: ClipboardDocumentCheckIcon, color: 'bg-green-100 text-green-600' },
  warranty: { label: 'Warranty', icon: ShieldCheckIcon, color: 'bg-purple-100 text-purple-600' },
  insurance: { label: 'Insurance', icon: ShieldCheckIcon, color: 'bg-yellow-100 text-yellow-600' },
  change_order: { label: 'Change Order', icon: DocumentTextIcon, color: 'bg-orange-100 text-orange-600' },
  invoice: { label: 'Invoice', icon: DocumentTextIcon, color: 'bg-teal-100 text-teal-600' },
  other: { label: 'Document', icon: FolderIcon, color: 'bg-gray-100 text-gray-600' },
};

export default function ClientDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    async function loadDocuments() {
      if (!user?.uid) return;

      try {
        const docs: ClientDocument[] = [];

        // Step 1: Get client's project IDs for project-scoped queries
        const projectsSnap = await getDocs(
          query(collection(db, 'projects'), where('clientId', '==', user.uid))
        );
        const projectIds = projectsSnap.docs.map((d) => d.id);
        const projectNameMap = new Map<string, string>();
        projectsSnap.docs.forEach((d) => {
          projectNameMap.set(d.id, d.data().name || 'Project');
        });

        // Step 2: Load invoices for this client
        const invSnap = await getDocs(
          query(collection(db, 'invoices'), where('clientId', '==', user.uid))
        );
        invSnap.docs.forEach((d) => {
          const data = d.data();
          docs.push({
            id: d.id,
            name: `Invoice #${data.invoiceNumber || d.id.slice(0, 6)}`,
            type: 'invoice',
            projectName: data.projectName || projectNameMap.get(data.projectId) || '',
            projectId: data.projectId || '',
            status: data.status || '',
            date: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          });
        });

        // Step 3: Load change orders
        const coSnap = await getDocs(
          query(collection(db, 'changeOrders'), where('clientId', '==', user.uid))
        );
        coSnap.docs.forEach((d) => {
          const data = d.data();
          docs.push({
            id: d.id,
            name: `Change Order: ${data.title || 'Untitled'}`,
            type: 'change_order',
            projectName: data.projectName || projectNameMap.get(data.projectId) || '',
            projectId: data.projectId || '',
            status: data.status || '',
            date: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          });
        });

        // Step 4: Load signature requests (contracts)
        const sigSnap = await getDocs(
          query(collection(db, 'signatureRequests'), where('clientId', '==', user.uid))
        );
        sigSnap.docs.forEach((d) => {
          const data = d.data();
          docs.push({
            id: d.id,
            name: `Contract: ${data.title || data.documentName || 'Untitled'}`,
            type: 'contract',
            projectName: data.projectName || projectNameMap.get(data.projectId) || '',
            projectId: data.projectId || '',
            fileURL: data.signedDocumentUrl || data.documentUrl || undefined,
            status: data.status || '',
            date: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          });
        });

        // Step 5: Load permits (project-scoped, batched for Firestore 'in' limit of 30)
        if (projectIds.length > 0) {
          for (let i = 0; i < projectIds.length; i += 30) {
            const batch = projectIds.slice(i, i + 30);
            const permitsSnap = await getDocs(
              query(collection(db, 'permits'), where('projectId', 'in', batch))
            );
            permitsSnap.docs.forEach((d) => {
              const data = d.data();
              docs.push({
                id: d.id,
                name: `Permit: ${data.permitType || data.type || 'General'}${data.number ? ` #${data.number}` : ''}`,
                type: 'permit',
                projectName: projectNameMap.get(data.projectId) || '',
                projectId: data.projectId || '',
                fileURL: data.fileUrl || data.documentUrl || undefined,
                status: data.status || '',
                date: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
              });
            });
          }
        }

        // Step 6: Load warranties (project-scoped, with expiration status)
        if (projectIds.length > 0) {
          for (let i = 0; i < projectIds.length; i += 30) {
            const batch = projectIds.slice(i, i + 30);
            const warrantiesSnap = await getDocs(
              query(collection(db, 'warranties'), where('projectId', 'in', batch))
            );
            warrantiesSnap.docs.forEach((d) => {
              const data = d.data();
              const expirationDate = data.expirationDate
                ? (data.expirationDate as Timestamp).toDate()
                : null;
              const isExpired = expirationDate ? expirationDate < new Date() : false;
              docs.push({
                id: d.id,
                name: `Warranty: ${data.type || data.itemName || 'General'}`,
                type: 'warranty',
                projectName: projectNameMap.get(data.projectId) || '',
                projectId: data.projectId || '',
                fileURL: data.fileUrl || data.documentUrl || undefined,
                status: isExpired ? 'expired' : 'active',
                date: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
              });
            });
          }
        }

        // Step 7: Load insurance certificates (project-scoped documents with type 'insurance')
        if (projectIds.length > 0) {
          for (let i = 0; i < projectIds.length; i += 30) {
            const batch = projectIds.slice(i, i + 30);
            const insuranceSnap = await getDocs(
              query(
                collection(db, 'documents'),
                where('projectId', 'in', batch),
                where('type', '==', 'insurance')
              )
            );
            insuranceSnap.docs.forEach((d) => {
              const data = d.data();
              docs.push({
                id: d.id,
                name: data.name || 'Insurance Certificate',
                type: 'insurance',
                projectName: projectNameMap.get(data.projectId) || '',
                projectId: data.projectId || '',
                fileURL: data.url || data.fileUrl || undefined,
                status: data.status || 'active',
                date: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
              });
            });
          }
        }

        // Sort by date descending
        docs.sort((a, b) => b.date.getTime() - a.date.getTime());
        setDocuments(docs);
      } catch (err) {
        logger.error('Error loading documents', { error: err, page: 'client-documents' });
      } finally {
        setLoading(false);
      }
    }
    loadDocuments();
  }, [user?.uid]);

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
      if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [documents, search, typeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Documents</h1>
        <p className="text-gray-500 mt-1">Access contracts, invoices, change orders, and other project documents</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'invoice', 'change_order', 'contract', 'permit', 'warranty', 'insurance'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                typeFilter === t ? 'bg-brand-primary/10 text-brand-primary' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {t === 'all' ? 'All' : TYPE_CONFIG[t]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <FolderIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No documents found</p>
          <p className="text-sm text-gray-400 mt-1">
            {documents.length === 0
              ? 'Documents will appear here as your project progresses.'
              : 'Try adjusting your search or filter.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => {
            const config = TYPE_CONFIG[doc.type] || TYPE_CONFIG.other;
            const Icon = config.icon;
            return (
              <Card key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('p-2 rounded-xl flex-shrink-0', config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {doc.projectName && (
                          <span className="text-xs text-gray-500">{doc.projectName}</span>
                        )}
                        <span className="text-xs text-gray-400">
                          {format(doc.date, 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status && (
                      <Badge className="bg-gray-100 text-gray-600 text-xs">{doc.status}</Badge>
                    )}
                    {doc.fileURL && (
                      <a
                        href={doc.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-brand-600"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
