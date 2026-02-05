'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  DataSourcePicker,
  FieldSelector,
  FilterBuilder,
  VisualizationPicker,
  ReportPreview,
} from '@/components/reports/ReportBuilder';
import {
  CustomReportConfig,
  ReportField,
  ReportFilter,
  DataSourceType,
  VisualizationType,
  DATA_SOURCES,
  createDefaultReportConfig,
  generateReportId,
  exportToCSV,
  downloadCSV,
} from '@/lib/reports/report-builder';
import { useCustomReports } from '@/lib/hooks/useCustomReports';
import { SkeletonTable } from '@/components/ui/Skeleton';
import {
  BookmarkIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PlayIcon,
  FolderOpenIcon,
  PlusIcon,
  ArrowLeftIcon,
  TrashIcon,
  Cog6ToothIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { ReportScheduleModal } from '@/components/reports/ReportScheduleModal';
import { ReportShareModal } from '@/components/reports/ReportShareModal';
import { useReportSchedules } from '@/lib/hooks/useReportSchedules';
import { useReportShares } from '@/lib/hooks/useReportShares';

export default function ReportBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');
  const { loading: authLoading } = useAuth();

  const {
    reports,
    loading: reportsLoading,
    createReport,
    updateReport,
    deleteReport,
    executeReport,
    executing,
    reportData,
    reportError,
  } = useCustomReports();

  // Report config state
  const [config, setConfig] = useState<CustomReportConfig>(() => ({
    id: generateReportId(),
    ...createDefaultReportConfig(),
  }));

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Schedule & share hooks
  const {
    saveSchedule,
    getScheduleForReport,
  } = useReportSchedules(reportId || undefined);

  const {
    shares,
    createShare,
    revokeShare,
  } = useReportShares(reportId || undefined);

  // Load report from URL param
  useEffect(() => {
    if (reportId && reports.length > 0) {
      const existingReport = reports.find((r) => r.id === reportId);
      if (existingReport) {
        setConfig(existingReport);
        setHasUnsavedChanges(false);
      }
    }
  }, [reportId, reports]);

  // Update config helpers
  const updateConfig = useCallback((updates: Partial<CustomReportConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  const handleDataSourceChange = useCallback((dataSource: DataSourceType) => {
    // Reset fields and filters when data source changes
    updateConfig({
      dataSource,
      fields: [],
      filters: [],
      groupBy: undefined,
      sortBy: undefined,
    });
  }, [updateConfig]);

  const handleFieldsChange = useCallback((fields: ReportField[]) => {
    updateConfig({ fields });
  }, [updateConfig]);

  const handleFiltersChange = useCallback((filters: ReportFilter[]) => {
    updateConfig({ filters });
  }, [updateConfig]);

  const handleVisualizationChange = useCallback((visualization: VisualizationType) => {
    updateConfig({ visualization });
  }, [updateConfig]);

  // Run report
  const handleRunReport = useCallback(async () => {
    if (config.fields.length === 0) return;
    await executeReport(config);
  }, [config, executeReport]);

  // Save report
  const handleSaveReport = useCallback(async () => {
    if (!config.name.trim()) {
      setShowSaveModal(true);
      return;
    }

    setSaving(true);
    try {
      if (reportId) {
        // Update existing report
        const { id: _id, createdAt: _createdAt, ...updates } = config;
        await updateReport(reportId, updates);
      } else {
        // Create new report
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...reportData } = config;
        const newId = await createReport(reportData);
        router.push(`/dashboard/reports/builder?id=${newId}`);
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save report:', error);
    } finally {
      setSaving(false);
      setShowSaveModal(false);
    }
  }, [config, reportId, createReport, updateReport, router]);

  // Export report
  const handleExport = useCallback(() => {
    if (reportData.length === 0) return;
    const csv = exportToCSV(reportData, config.fields);
    const filename = `${config.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`;
    downloadCSV(csv, filename);
  }, [reportData, config]);

  // Delete report
  const handleDeleteReport = useCallback(async () => {
    if (!reportId) return;
    try {
      await deleteReport(reportId);
      router.push('/dashboard/reports/builder');
      setConfig({ id: generateReportId(), ...createDefaultReportConfig() });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
    setShowDeleteConfirm(false);
  }, [reportId, deleteReport, router]);

  // New report
  const handleNewReport = useCallback(() => {
    router.push('/dashboard/reports/builder');
    setConfig({ id: generateReportId(), ...createDefaultReportConfig() });
    setHasUnsavedChanges(false);
  }, [router]);

  // Load report
  const handleLoadReport = useCallback((report: CustomReportConfig) => {
    router.push(`/dashboard/reports/builder?id=${report.id}`);
    setShowLoadModal(false);
  }, [router]);

  // Get available fields for groupBy and sortBy
  const availableFields = DATA_SOURCES[config.dataSource]?.fields || [];

  if (authLoading) {
    return (
      <div className="p-6">
        <SkeletonTable rows={5} columns={4} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.push('/dashboard/reports')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={config.name}
                onChange={(e) => updateConfig({ name: e.target.value })}
                placeholder="Report Name"
                className="text-base sm:text-lg font-semibold bg-transparent border-0 border-b-2 border-transparent focus:border-brand-primary focus:ring-0 px-1 min-w-0"
              />
              {hasUnsavedChanges && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex-shrink-0">
                  Unsaved
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleNewReport}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="New report"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLoadModal(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Load report"
            >
              <FolderOpenIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Load</span>
            </button>

            <button
              type="button"
              onClick={handleSaveReport}
              disabled={saving}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Save report"
            >
              <BookmarkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={reportData.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {reportId && (
              <>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Schedule report"
                >
                  <ClockIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Schedule</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share report"
                >
                  <ShareIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete report"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleRunReport}
              disabled={config.fields.length === 0 || executing}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm text-white bg-brand-primary hover:bg-brand-primary-dark rounded-lg transition-colors disabled:opacity-50"
              title="Run report"
            >
              <PlayIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{executing ? 'Running...' : 'Run Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - Data Source & Fields */}
        <div className="lg:w-80 flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto p-4 space-y-6">
          <DataSourcePicker
            value={config.dataSource}
            onChange={handleDataSourceChange}
          />

          <FieldSelector
            dataSource={config.dataSource}
            selectedFields={config.fields}
            onFieldsChange={handleFieldsChange}
          />
        </div>

        {/* Center Canvas - Preview */}
        <div className="flex-1 bg-gray-100 overflow-y-auto p-4 sm:p-6">
          <ReportPreview
            config={config}
            data={reportData}
            loading={executing}
            error={reportError}
            onRefresh={handleRunReport}
          />
        </div>

        {/* Right Sidebar - Filters & Settings */}
        <div className="lg:w-80 flex-shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto p-4 space-y-6">
          <FilterBuilder
            dataSource={config.dataSource}
            filters={config.filters}
            onFiltersChange={handleFiltersChange}
          />

          <VisualizationPicker
            value={config.visualization}
            onChange={handleVisualizationChange}
          />

          {/* Advanced Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Cog6ToothIcon className="h-4 w-4" />
              Advanced Options
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Group By
              </label>
              <select
                value={config.groupBy || ''}
                onChange={(e) => updateConfig({ groupBy: e.target.value || undefined })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              >
                <option value="">No grouping</option>
                {availableFields.map((field) => (
                  <option key={field.id} value={field.source}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={config.sortBy || ''}
                  onChange={(e) => updateConfig({ sortBy: e.target.value || undefined })}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="">Default order</option>
                  {config.fields.map((field) => (
                    <option key={field.id} value={field.source}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <select
                  value={config.sortDirection || 'asc'}
                  onChange={(e) =>
                    updateConfig({ sortDirection: e.target.value as 'asc' | 'desc' })
                  }
                  disabled={!config.sortBy}
                  className="w-24 text-sm border border-gray-200 rounded-lg px-2 py-2 disabled:opacity-50"
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Description
              </label>
              <textarea
                value={config.description || ''}
                onChange={(e) => updateConfig({ description: e.target.value })}
                placeholder="Optional description for this report..."
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Load Reports Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Load Report</h2>
              <p className="text-sm text-gray-500">
                Select a saved report to load
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {reportsLoading ? (
                <div className="py-8 text-center text-gray-500">Loading...</div>
              ) : reports.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No saved reports yet
                </div>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => handleLoadReport(report)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-brand-primary hover:bg-brand-primary/5 transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {report.name}
                      </div>
                      {report.description && (
                        <div className="text-sm text-gray-500 truncate">
                          {report.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {DATA_SOURCES[report.dataSource]?.label} &bull;{' '}
                        {report.fields.length} fields
                        {report.updatedAt && (
                          <> &bull; Updated {new Date(report.updatedAt).toLocaleDateString()}</>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Report?
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete &quot;{config.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReport}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      <ReportScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={saveSchedule}
        reportId={reportId || config.id}
        reportName={config.name}
        existingSchedule={reportId ? getScheduleForReport(reportId) : null}
      />

      {/* Share Modal */}
      <ReportShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onCreateShare={async (shareConfig) => {
          const share = await createShare(shareConfig);
          return { ...share, reportName: config.name };
        }}
        onRevokeShare={revokeShare}
        reportId={reportId || config.id}
        reportName={config.name}
        existingShares={shares}
      />
    </div>
  );
}
