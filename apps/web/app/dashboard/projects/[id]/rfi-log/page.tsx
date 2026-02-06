'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Tab } from '@headlessui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { Button, EmptyState } from '@/components/ui';
import { RFICard, RFI } from '@/components/rfis/RFICard';
import { RFIFormModal } from '@/components/rfis/RFIFormModal';
import { SubmittalCard, Submittal } from '@/components/submittals/SubmittalCard';
import { SubmittalFormModal } from '@/components/submittals/SubmittalFormModal';
import { cn } from '@/lib/utils';

// Mock data - replace with actual hooks
const MOCK_RFIS: RFI[] = [];
const MOCK_SUBMITTALS: Submittal[] = [];
const MOCK_TEAM_MEMBERS = [
  { id: '1', name: 'John Smith', type: 'team' as const },
  { id: '2', name: 'Sarah Johnson', type: 'team' as const },
  { id: '3', name: 'ABC Electrical', type: 'sub' as const, company: 'ABC Electric Co' },
];
const MOCK_REVIEWERS = [
  { id: '1', name: 'John Smith', role: 'Project Manager' },
  { id: '2', name: 'Sarah Johnson', role: 'Architect' },
];

const RFI_STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Responded', value: 'responded' },
  { label: 'Closed', value: 'closed' },
];

const SUBMITTAL_STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Revise & Resubmit', value: 'revise' },
];

export default function RFILogPage() {
  const params = useParams();
  const projectId = params?.id as string;

  // State
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [showRFIModal, setShowRFIModal] = useState(false);
  const [showSubmittalModal, setShowSubmittalModal] = useState(false);

  // TODO: Replace with actual data hooks
  const rfis = MOCK_RFIS;
  const submittals = MOCK_SUBMITTALS;
  const _loading = false;

  // Filter RFIs
  const filteredRFIs = useMemo(() => {
    return rfis.filter((rfi) => {
      const matchesSearch =
        !searchQuery ||
        rfi.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rfi.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || rfi.status === statusFilter;
      const matchesAssignee = !assigneeFilter || rfi.assignedTo?.id === assigneeFilter;
      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [rfis, searchQuery, statusFilter, assigneeFilter]);

  // Filter Submittals
  const filteredSubmittals = useMemo(() => {
    return submittals.filter((submittal) => {
      const matchesSearch =
        !searchQuery ||
        submittal.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submittal.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || submittal.status === statusFilter;
      const matchesAssignee = !assigneeFilter || submittal.reviewer?.id === assigneeFilter;
      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [submittals, searchQuery, statusFilter, assigneeFilter]);

  // Handlers
  const handleRFISubmit = async (data: any, isDraft: boolean) => {
    console.log('RFI submitted:', data, isDraft);
    // TODO: Implement API call
  };

  const handleSubmittalSubmit = async (data: any) => {
    console.log('Submittal submitted:', data);
    // TODO: Implement API call
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    console.log(`Exporting ${selectedTab === 0 ? 'RFIs' : 'Submittals'} as ${format}`);
    // TODO: Implement export
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setAssigneeFilter('');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">RFI & Submittal Log</h1>
          <p className="text-gray-500 mt-1">Manage requests for information and submittals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => selectedTab === 0 ? setShowRFIModal(true) : setShowSubmittalModal(true)}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            New {selectedTab === 0 ? 'RFI' : 'Submittal'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          <Tab
            className={({ selected }) =>
              cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                selected
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              )
            }
          >
            <DocumentTextIcon className="h-4 w-4" />
            RFIs
            {rfis.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                {rfis.length}
              </span>
            )}
          </Tab>
          <Tab
            className={({ selected }) =>
              cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                selected
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              )
            }
          >
            <ClipboardDocumentListIcon className="h-4 w-4" />
            Submittals
            {submittals.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                {submittals.length}
              </span>
            )}
          </Tab>
        </Tab.List>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by number or title..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            {(selectedTab === 0 ? RFI_STATUS_OPTIONS : SUBMITTAL_STATUS_OPTIONS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            <option value="">All {selectedTab === 0 ? 'Assignees' : 'Reviewers'}</option>
            {(selectedTab === 0 ? MOCK_TEAM_MEMBERS : MOCK_REVIEWERS).map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>

          {(searchQuery || statusFilter || assigneeFilter) && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>

        <Tab.Panels>
          {/* RFIs Panel */}
          <Tab.Panel>
            {filteredRFIs.length === 0 ? (
              <EmptyState
                icon={<DocumentTextIcon className="h-full w-full" />}
                title={searchQuery || statusFilter ? 'No matching RFIs' : 'No RFIs yet'}
                description={
                  searchQuery || statusFilter
                    ? 'Try adjusting your filters'
                    : 'Create your first Request for Information to get started'
                }
                action={{
                  label: 'Create RFI',
                  onClick: () => setShowRFIModal(true),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRFIs.map((rfi) => (
                  <RFICard
                    key={rfi.id}
                    rfi={rfi}
                    onView={(r) => console.log('View RFI:', r.id)}
                    onRespond={(r) => console.log('Respond to RFI:', r.id)}
                    onClose={(r) => console.log('Close RFI:', r.id)}
                  />
                ))}
              </div>
            )}
          </Tab.Panel>

          {/* Submittals Panel */}
          <Tab.Panel>
            {filteredSubmittals.length === 0 ? (
              <EmptyState
                icon={<ClipboardDocumentListIcon className="h-full w-full" />}
                title={searchQuery || statusFilter ? 'No matching submittals' : 'No submittals yet'}
                description={
                  searchQuery || statusFilter
                    ? 'Try adjusting your filters'
                    : 'Create your first submittal to get started'
                }
                action={{
                  label: 'Create Submittal',
                  onClick: () => setShowSubmittalModal(true),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubmittals.map((submittal) => (
                  <SubmittalCard
                    key={submittal.id}
                    submittal={submittal}
                    onView={(s) => console.log('View Submittal:', s.id)}
                    onReview={(s) => console.log('Review Submittal:', s.id)}
                    onRevise={(s) => console.log('Revise Submittal:', s.id)}
                  />
                ))}
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modals */}
      <RFIFormModal
        isOpen={showRFIModal}
        onClose={() => setShowRFIModal(false)}
        onSubmit={handleRFISubmit}
        teamMembers={MOCK_TEAM_MEMBERS}
        projectId={projectId}
      />

      <SubmittalFormModal
        isOpen={showSubmittalModal}
        onClose={() => setShowSubmittalModal(false)}
        onSubmit={handleSubmittalSubmit}
        reviewers={MOCK_REVIEWERS}
        projectId={projectId}
      />
    </div>
  );
}
