'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  FileUploader,
  DataPreview,
  ColumnMapper,
  ValidationReport,
  ImportProgress,
} from '@/components/import';
import {
  ImportTarget,
  ImportStatus,
  ColumnMapping,
  ParsedRow,
  ImportValidationError,
  IMPORT_TARGET_INFO,
  IMPORT_FIELD_DEFINITIONS,
} from '@/lib/import/types';
import { parseFile, ParseResult } from '@/lib/import/csv-parser';
import { generateMappings, updateMapping, validateMappings } from '@/lib/import/column-mapper';
import { validateRows } from '@/lib/import/validators';
import {
  createImportJob,
  updateImportJob,
  executeImport,
} from '@/lib/import/import-service';
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

type ImportStep = 'select' | 'upload' | 'map' | 'validate' | 'import' | 'complete';

const STEP_ORDER: ImportStep[] = ['select', 'upload', 'map', 'validate', 'import', 'complete'];

const TARGET_ICONS: Record<ImportTarget, React.ComponentType<{ className?: string }>> = {
  clients: UserGroupIcon,
  projects: BuildingOffice2Icon,
  contacts: UserIcon,
  communication_logs: ChatBubbleLeftRightIcon,
};

export default function ImportContent() {
  const { profile } = useAuth();
  const orgId = profile?.orgId;

  // Wizard state
  const [step, setStep] = useState<ImportStep>('select');
  const [target, setTarget] = useState<ImportTarget | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [validatedRows, setValidatedRows] = useState<ParsedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ImportValidationError[]>([]);
  const [importStatus, setImportStatus] = useState<ImportStatus>('mapping');
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step navigation
  const currentStepIndex = STEP_ORDER.indexOf(step);
  const canGoBack = currentStepIndex > 0 && step !== 'import' && step !== 'complete';
  const canGoNext = () => {
    switch (step) {
      case 'select':
        return target !== null;
      case 'upload':
        return file !== null && parseResult !== null && parseResult.errors.filter(e => e.severity === 'error').length === 0;
      case 'map':
        return mappings.length > 0 && validateMappings(mappings, target!).isValid;
      case 'validate':
        return validatedRows.filter(r => r.isValid).length > 0;
      default:
        return false;
    }
  };

  const goBack = () => {
    const newIndex = Math.max(0, currentStepIndex - 1);
    setStep(STEP_ORDER[newIndex]);
  };

  const goNext = async () => {
    if (!canGoNext()) return;

    const nextIndex = Math.min(STEP_ORDER.length - 1, currentStepIndex + 1);
    const nextStep = STEP_ORDER[nextIndex];

    // Handle step transitions
    if (nextStep === 'validate' && parseResult) {
      // Run validation
      const { validRows, errors } = validateRows(parseResult.rows, mappings);
      setValidatedRows(validRows);
      setValidationErrors(errors);
    }

    if (nextStep === 'import') {
      // Start import
      await startImport();
      return;
    }

    setStep(nextStep);
  };

  // File handling
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const result = await parseFile(selectedFile);
      setParseResult(result);

      // Auto-generate mappings if we have a target
      if (target && result.headers.length > 0) {
        const autoMappings = generateMappings(result.headers, target);
        setMappings(autoMappings);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [target]);

  // Target selection
  const handleTargetSelect = (selectedTarget: ImportTarget) => {
    setTarget(selectedTarget);

    // If we already have a file parsed, regenerate mappings
    if (parseResult && parseResult.headers.length > 0) {
      const autoMappings = generateMappings(parseResult.headers, selectedTarget);
      setMappings(autoMappings);
    }
  };

  // Mapping changes
  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    if (!target) return;
    const updated = updateMapping(mappings, sourceColumn, targetField, target);
    setMappings(updated);
  };

  // Start import
  const startImport = async () => {
    if (!orgId || !profile || !target || !file) return;

    setStep('import');
    setImportStatus('importing');
    setImportProgress(0);
    setImportedCount(0);

    try {
      // Create import job
      const newJobId = await createImportJob(
        orgId,
        profile.uid,
        profile.displayName || 'Unknown',
        target,
        file.name,
        file.size,
        validatedRows.length
      );
      setJobId(newJobId);

      // Update job with mappings
      await updateImportJob(orgId, newJobId, {
        mappings,
        status: 'importing',
        startedAt: new Date(),
      });

      // Execute import
      const validRowsOnly = validatedRows.filter(r => r.isValid);
      const { importedIds, errors } = await executeImport(
        orgId,
        newJobId,
        target,
        validRowsOnly,
        mappings,
        (imported, total) => {
          setImportProgress((imported / total) * 100);
          setImportedCount(imported);
        }
      );

      // Update job completion
      await updateImportJob(orgId, newJobId, {
        status: errors.length > 0 && importedIds.length === 0 ? 'failed' : 'completed',
        importedRows: importedIds.length,
        skippedRows: validatedRows.length - importedIds.length,
        errors: [...validationErrors, ...errors],
        createdRecordIds: importedIds,
        completedAt: new Date(),
      });

      setImportStatus(errors.length > 0 && importedIds.length === 0 ? 'failed' : 'completed');
      setStep('complete');
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus('failed');

      if (jobId) {
        await updateImportJob(orgId, jobId, {
          status: 'failed',
          errors: [...validationErrors, {
            row: 0,
            column: '',
            value: '',
            error: error instanceof Error ? error.message : 'Import failed',
            severity: 'error',
          }],
          completedAt: new Date(),
        });
      }
    }
  };

  // Reset wizard
  const resetWizard = () => {
    setStep('select');
    setTarget(null);
    setFile(null);
    setParseResult(null);
    setMappings([]);
    setValidatedRows([]);
    setValidationErrors([]);
    setImportStatus('mapping');
    setImportProgress(0);
    setImportedCount(0);
    setJobId(null);
  };

  // Get sample data for mapper
  const getSampleData = (): Record<string, string> => {
    if (!parseResult || parseResult.rows.length === 0) return {};
    return parseResult.rows[0].data;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-heading tracking-tight">Import Data</h1>
        <p className="text-gray-500 mt-1">
          Import clients, projects, contacts, or communication logs from CSV files
        </p>
      </div>

      {/* Progress indicator */}
      {step !== 'select' && (
        <div className="flex items-center justify-center gap-2">
          {STEP_ORDER.slice(1, -1).map((s, index) => {
            const stepIndex = STEP_ORDER.indexOf(s);
            const isActive = step === s;
            const isComplete = currentStepIndex > stepIndex;

            return (
              <React.Fragment key={s}>
                {index > 0 && (
                  <div className={`w-12 h-0.5 ${isComplete ? 'bg-brand-primary' : 'bg-gray-200'}`} />
                )}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${isActive ? 'bg-blue-600 text-white' : ''}
                    ${isComplete ? 'bg-blue-600 text-white' : ''}
                    ${!isActive && !isComplete ? 'bg-gray-200 text-gray-600' : ''}
                  `}
                >
                  {isComplete ? <CheckIcon className="h-4 w-4" /> : index + 1}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Step content */}
      <Card className="p-6">
        {/* Step 1: Select target */}
        {step === 'select' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">What would you like to import?</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select the type of data you want to import from your CSV file
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(IMPORT_TARGET_INFO) as ImportTarget[]).map((t) => {
                const info = IMPORT_TARGET_INFO[t];
                const Icon = TARGET_ICONS[t];
                const isSelected = target === t;

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTargetSelect(t)}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}
                      `}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {info.label}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {target && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Available fields for {IMPORT_TARGET_INFO[target].label}:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {IMPORT_FIELD_DEFINITIONS[target].map((field) => (
                    <Badge
                      key={field.name}
                      variant={field.required ? 'default' : 'info'}
                    >
                      {field.label}
                      {field.required && ' *'}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">* Required fields</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Upload file */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Upload your CSV file</h2>
              <p className="text-sm text-gray-500 mt-1">
                Make sure your file has a header row with column names
              </p>
            </div>

            <FileUploader
              onFileSelect={handleFileSelect}
              disabled={isProcessing}
            />

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                Parsing file...
              </div>
            )}

            {parseResult && parseResult.rows.length > 0 && (
              <DataPreview
                headers={parseResult.headers}
                rows={parseResult.rows}
                totalRows={parseResult.totalRows}
              />
            )}

            {parseResult && parseResult.errors.filter(e => e.severity === 'error').length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800">
                  File has errors that must be fixed before import
                </p>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {parseResult.errors.filter(e => e.severity === 'error').slice(0, 5).map((e, i) => (
                    <li key={i}>{e.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Map columns */}
        {step === 'map' && target && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Map your columns</h2>
              <p className="text-sm text-gray-500 mt-1">
                We&apos;ve auto-detected some mappings. Review and adjust as needed.
              </p>
            </div>

            <ColumnMapper
              mappings={mappings}
              target={target}
              onMappingChange={handleMappingChange}
              sampleData={getSampleData()}
            />
          </div>
        )}

        {/* Step 4: Validate */}
        {step === 'validate' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Review validation results</h2>
              <p className="text-sm text-gray-500 mt-1">
                Check for errors before importing. Invalid rows will be skipped.
              </p>
            </div>

            <ValidationReport
              errors={validationErrors}
              totalRows={validatedRows.length}
              validRows={validatedRows.filter(r => r.isValid).length}
            />

            {validatedRows.filter(r => r.isValid).length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>{validatedRows.filter(r => r.isValid).length}</strong> records will be imported.
                  {validatedRows.filter(r => !r.isValid).length > 0 && (
                    <span className="text-blue-600">
                      {' '}{validatedRows.filter(r => !r.isValid).length} rows with errors will be skipped.
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Import progress */}
        {(step === 'import' || step === 'complete') && (
          <div className="space-y-6">
            <ImportProgress
              status={importStatus}
              progress={importProgress}
              importedCount={importedCount}
              totalCount={validatedRows.filter(r => r.isValid).length}
              errors={validationErrors.filter(e => e.severity === 'error').length}
            />

            {step === 'complete' && importStatus === 'completed' && (
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  Your {IMPORT_TARGET_INFO[target!]?.label.toLowerCase()} have been imported successfully.
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={resetWizard}>
                    Import More Data
                  </Button>
                  <Button
                    onClick={() => window.location.href = `/dashboard/${target === 'clients' ? 'clients' : target === 'projects' ? 'projects' : 'clients'}`}
                  >
                    View Imported Data
                  </Button>
                </div>
              </div>
            )}

            {step === 'complete' && importStatus === 'failed' && (
              <div className="text-center space-y-4">
                <p className="text-sm text-red-600">
                  The import failed. Please check your data and try again.
                </p>
                <Button variant="outline" onClick={resetWizard}>
                  Start Over
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {step !== 'import' && step !== 'complete' && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div>
              {canGoBack && (
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            <Button
              onClick={goNext}
              disabled={!canGoNext() || isProcessing}
            >
              {step === 'validate' ? 'Start Import' : 'Continue'}
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
