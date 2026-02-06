"use client";

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  useClient,
  useClientProjects,
  useClientCommunicationLog,
  CLIENT_STATUS_LABELS,
  CLIENT_SOURCE_LABELS,
} from '@/lib/hooks/useClients';
import { ClientStatus, ClientSource, ClientNote, ClientCommunicationLog } from '@/types';
import { Button, Card, Badge, EmptyState } from '@/components/ui';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { EditClientModal, AddCommunicationLogModal, AddNoteModal } from '@/components/clients';
import { cn } from '@/lib/utils';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';
import { logger } from '@/lib/utils/logger';

type TabType = 'overview' | 'projects' | 'communication' | 'notes' | 'financials';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <UserCircleIcon className="h-4 w-4" /> },
  { id: 'projects', label: 'Projects', icon: <BriefcaseIcon className="h-4 w-4" /> },
  { id: 'communication', label: 'Communication', icon: <ChatBubbleLeftRightIcon className="h-4 w-4" /> },
  { id: 'notes', label: 'Notes', icon: <DocumentTextIcon className="h-4 w-4" /> },
  { id: 'financials', label: 'Financials', icon: <CurrencyDollarIcon className="h-4 w-4" /> },
];

const statusColors: Record<ClientStatus, string> = {
  active: 'bg-green-100 text-green-700',
  potential: 'bg-blue-100 text-blue-700',
  past: 'bg-gray-100 text-gray-700',
  inactive: 'bg-red-100 text-red-700',
};

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);

  const {
    client,
    loading,
    error,
    updateClient,
    deleteClient,
    addNote,
    deleteNote,
  } = useClient(clientId, profile?.orgId || '');

  const { projects, loading: projectsLoading } = useClientProjects(clientId, profile?.orgId || '');
  const { logs, loading: logsLoading, addLog } = useClientCommunicationLog(clientId, profile?.orgId || '');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) return;

    try {
      await deleteClient();
      toast.success('Client deleted');
      router.push('/dashboard/clients');
    } catch (err) {
      logger.error('Error deleting client', { error: err, page: 'client-detail' });
      toast.error('Failed to delete client');
    }
  };

  const handleStatusChange = async (newStatus: ClientStatus) => {
    try {
      await updateClient({ status: newStatus });
      toast.success('Status updated');
    } catch (err) {
      logger.error('Error updating status', { error: err, page: 'client-detail' });
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <SkeletonCard className="h-[200px]" />
        <SkeletonCard className="h-[400px]" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error ? 'Error Loading Client' : 'Client Not Found'}
          </h3>
          <p className="text-gray-500 mb-4">
            {error?.message || 'The client you are looking for does not exist.'}
          </p>
          <Button variant="secondary" onClick={() => router.push('/dashboard/clients')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/dashboard/clients')}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{client.displayName}</h1>
              <Badge className={statusColors[client.status]}>
                {CLIENT_STATUS_LABELS[client.status]}
              </Badge>
            </div>
            {client.companyName && client.companyName !== client.displayName && (
              <p className="text-gray-500 flex items-center gap-1">
                <BuildingOfficeIcon className="h-4 w-4" />
                {client.companyName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={client.status}
            onChange={(e) => handleStatusChange(e.target.value as ClientStatus)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            <PencilSquareIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="secondary"
            className="!text-red-600 hover:!bg-red-50"
            onClick={handleDelete}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BriefcaseIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {client.financials?.totalProjects || 0}
              </p>
              <p className="text-xs text-gray-500">Total Projects</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {client.financials?.completedProjects || 0}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {formatCurrency(client.financials?.lifetimeValue || 0)}
              </p>
              <p className="text-xs text-gray-500">Lifetime Value</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ExclamationCircleIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {formatCurrency(client.financials?.outstandingBalance || 0)}
              </p>
              <p className="text-xs text-gray-500">Outstanding</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {formatCurrency(client.financials?.averageProjectValue || 0)}
              </p>
              <p className="text-xs text-gray-500">Avg Project</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab client={client} />
        )}
        {activeTab === 'projects' && (
          <ProjectsTab
            projects={projects}
            loading={projectsLoading}
            onNavigate={(projectId) => router.push(`/dashboard/projects/${projectId}`)}
            formatCurrency={formatCurrency}
          />
        )}
        {activeTab === 'communication' && (
          <CommunicationTab
            logs={logs}
            loading={logsLoading}
            onAddLog={() => setShowAddLogModal(true)}
          />
        )}
        {activeTab === 'notes' && (
          <NotesTab
            notes={client.notes || []}
            onAddNote={() => setShowAddNoteModal(true)}
            onDeleteNote={deleteNote}
          />
        )}
        {activeTab === 'financials' && (
          <FinancialsTab client={client} formatCurrency={formatCurrency} />
        )}
      </div>

      {/* Modals */}
      {client && (
        <EditClientModal
          client={client}
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={async (updates) => {
            await updateClient(updates);
          }}
        />
      )}

      <AddCommunicationLogModal
        isOpen={showAddLogModal}
        onClose={() => setShowAddLogModal(false)}
        onAdd={async (log) => {
          await addLog({
            ...log,
            clientId,
            orgId: profile?.orgId || '',
            createdBy: profile?.uid || '',
            createdByName: profile?.displayName || profile?.email || 'Unknown',
          });
        }}
      />

      <AddNoteModal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        onAdd={async (content) => {
          await addNote({
            content,
            createdBy: profile?.uid || '',
            createdByName: profile?.displayName || profile?.email || 'Unknown',
          });
        }}
      />
    </div>
  );
}

// Overview Tab
function OverviewTab({ client }: { client: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <a href={`mailto:${client.email}`} className="text-brand-primary hover:underline">
                {client.email}
              </a>
            </div>
          </div>
          {client.phone && (
            <div className="flex items-center gap-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <a href={`tel:${client.phone}`} className="text-brand-primary hover:underline">
                  {client.phone}
                </a>
              </div>
            </div>
          )}
          {client.address && (
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-900">
                  {client.address.street}<br />
                  {client.address.city}, {client.address.state} {client.address.zip}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Client Details */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Client Details</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <TagIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Source</p>
              <p className="text-gray-900">
                {client.source ? CLIENT_SOURCE_LABELS[client.source as ClientSource] : 'Not specified'}
              </p>
            </div>
          </div>
          {client.referredBy && (
            <div className="flex items-center gap-3">
              <UserCircleIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Referred By</p>
                <p className="text-gray-900">{client.referredBy}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">First Contact</p>
              <p className="text-gray-900">
                {client.firstContactDate
                  ? format(new Date(client.firstContactDate), 'MMMM d, yyyy')
                  : 'Not recorded'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Last Contact</p>
              <p className="text-gray-900">
                {client.lastContactDate
                  ? formatDistanceToNow(new Date(client.lastContactDate), { addSuffix: true })
                  : 'Not recorded'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tags */}
      {client.tags && client.tags.length > 0 && (
        <Card className="p-6 md:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {client.tags.map((tag: string, index: number) => (
              <Badge key={index} className="bg-gray-100 text-gray-700">
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// Projects Tab
function ProjectsTab({
  projects,
  loading,
  onNavigate,
  formatCurrency,
}: {
  projects: any[];
  loading: boolean;
  onNavigate: (id: string) => void;
  formatCurrency: (amount: number) => string;
}) {
  const projectStatusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return <SkeletonCard className="h-[200px]" />;
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<BriefcaseIcon className="h-full w-full" />}
        title="No projects yet"
        description="This client doesn't have any projects yet."
      />
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onNavigate(project.id)}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={projectStatusColors[project.status] || 'bg-gray-100 text-gray-700'}>
                  {project.status}
                </Badge>
              </div>
              <h4 className="font-medium text-gray-900">{project.name}</h4>
              <p className="text-sm text-gray-500 mt-1">
                Created {format(new Date(project.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {formatCurrency(project.budget || 0)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Communication Tab
function CommunicationTab({
  logs,
  loading,
  onAddLog,
}: {
  logs: ClientCommunicationLog[];
  loading: boolean;
  onAddLog: () => void;
}) {
  const typeIcons: Record<string, React.ReactNode> = {
    call: <PhoneIcon className="h-5 w-5" />,
    email: <EnvelopeIcon className="h-5 w-5" />,
    meeting: <UserCircleIcon className="h-5 w-5" />,
    note: <DocumentTextIcon className="h-5 w-5" />,
  };

  if (loading) {
    return <SkeletonCard className="h-[200px]" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={onAddLog}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Log Communication
        </Button>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={<ChatBubbleLeftRightIcon className="h-full w-full" />}
          title="No communication logged"
          description="Start logging calls, emails, and meetings with this client."
        />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {typeIcons[log.type] || <DocumentTextIcon className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 capitalize">{log.type}</span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  {log.subject && (
                    <p className="font-medium text-gray-700">{log.subject}</p>
                  )}
                  <p className="text-gray-600 mt-1">{log.content}</p>
                  <p className="text-xs text-gray-400 mt-2">by {log.createdByName}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Notes Tab
function NotesTab({
  notes,
  onAddNote,
  onDeleteNote,
}: {
  notes: ClientNote[];
  onAddNote: () => void;
  onDeleteNote: (noteId: string) => Promise<void>;
}) {
  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await onDeleteNote(noteId);
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={onAddNote}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="h-full w-full" />}
          title="No notes yet"
          description="Add notes to keep track of important information about this client."
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    by {note.createdByName} · {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="!text-red-600 hover:!bg-red-50"
                  onClick={() => handleDelete(note.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Financials Tab
function FinancialsTab({
  client,
  formatCurrency,
}: {
  client: any;
  formatCurrency: (amount: number) => string;
}) {
  const financials = client.financials || {};

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Lifetime Value</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(financials.lifetimeValue || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Outstanding Balance</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(financials.outstandingBalance || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Project Value</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {formatCurrency(financials.averageProjectValue || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Payment</p>
            {financials.lastPaymentDate ? (
              <>
                <p className="text-lg font-bold text-gray-900 tracking-tight">
                  {formatCurrency(financials.lastPaymentAmount || 0)}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(financials.lastPaymentDate), 'MMM d, yyyy')}
                </p>
              </>
            ) : (
              <p className="text-lg text-gray-500">No payments</p>
            )}
          </div>
        </div>
      </Card>

      {/* Project Breakdown */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Project Breakdown</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-900">
              {financials.totalProjects || 0}
            </p>
            <p className="text-sm text-gray-500">Total Projects</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">
              {financials.completedProjects || 0}
            </p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">
              {financials.activeProjects || 0}
            </p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
