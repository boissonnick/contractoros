"use client";

import React, { useState, useMemo } from 'react';
import { useSafetyInspections, useSafetyIncidents, useToolboxTalks } from '@/lib/hooks/useSafety';
import { Card, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function SafetyPage() {
  const { inspections, loading: inspLoading } = useSafetyInspections();
  const { incidents, loading: incLoading } = useSafetyIncidents();
  const { talks, loading: talksLoading } = useToolboxTalks();

  const [activeTab, setActiveTab] = useState<'inspections' | 'incidents' | 'toolbox'>('inspections');

  const stats = useMemo(() => ({
    totalInspections: inspections.length,
    passedInspections: inspections.filter((i) => i.status === 'passed').length,
    openIncidents: incidents.filter((i) => i.status !== 'closed').length,
    toolboxTalks: talks.length,
  }), [inspections, incidents, talks]);

  const loading = inspLoading || incLoading || talksLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Safety & Compliance</h1>
          <p className="text-gray-500 mt-1">Manage inspections, incidents, and safety meetings</p>
        </div>
        <Button variant="primary" size="sm">
          <PlusIcon className="h-4 w-4 mr-1" />
          New {activeTab === 'inspections' ? 'Inspection' : activeTab === 'incidents' ? 'Incident' : 'Toolbox Talk'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.totalInspections}</p>
          <p className="text-xs text-gray-500">Inspections</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-700">{stats.passedInspections}</p>
          <p className="text-xs text-gray-500">Passed</p>
        </Card>
        <Card className="p-4 text-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-orange-600">{stats.openIncidents}</p>
          <p className="text-xs text-gray-500">Open Incidents</p>
        </Card>
        <Card className="p-4 text-center">
          <MegaphoneIcon className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.toolboxTalks}</p>
          <p className="text-xs text-gray-500">Toolbox Talks</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        {(['inspections', 'incidents', 'toolbox'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            {tab === 'inspections' ? 'Inspections' : tab === 'incidents' ? 'Incidents' : 'Toolbox Talks'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'inspections' && (
        <div className="space-y-3">
          {inspections.length === 0 ? (
            <Card className="p-8 text-center">
              <ShieldCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No inspections recorded yet</p>
            </Card>
          ) : (
            inspections.map((insp) => (
              <Card key={insp.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{insp.type.replace('_', ' ').toUpperCase()} Inspection</p>
                      <Badge className={cn(
                        insp.status === 'passed' ? 'bg-green-100 text-green-700' :
                        insp.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      )}>
                        {insp.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {insp.projectName} &bull; {format(insp.scheduledDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <p className="text-sm text-gray-400">{insp.inspectorName}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <Card className="p-8 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No incidents recorded</p>
            </Card>
          ) : (
            incidents.map((inc) => (
              <Card key={inc.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{inc.description.slice(0, 50)}...</p>
                      <Badge className={cn(
                        inc.severity === 'near_miss' ? 'bg-yellow-100 text-yellow-700' :
                        inc.severity === 'first_aid' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {inc.severity.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {inc.projectName} &bull; {format(inc.date, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge className={cn(
                    inc.status === 'resolved' || inc.status === 'closed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  )}>
                    {inc.status}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'toolbox' && (
        <div className="space-y-3">
          {talks.length === 0 ? (
            <Card className="p-8 text-center">
              <MegaphoneIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No toolbox talks recorded</p>
            </Card>
          ) : (
            talks.map((talk) => (
              <Card key={talk.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{talk.topic}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {talk.projectName || 'General'} &bull; {format(talk.date, 'MMM d, yyyy')} &bull; {talk.attendees.length} attendees
                    </p>
                  </div>
                  <p className="text-sm text-gray-400">{talk.conductedByName}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
