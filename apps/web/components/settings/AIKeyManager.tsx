"use client";

import React, { useState, useCallback } from 'react';
import { Card, Button, Badge, toast, useConfirmDialog } from '@/components/ui';
import { AIModelProvider, AIKeyConfig, AIKeyValidationStatus } from '@/types';
import {
  validateAPIKey,
  getKeyLastFour,
  PROVIDER_CONFIG,
} from '@/lib/ai/key-validation';
import { cn } from '@/lib/utils';
import {
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  TrashIcon,
  LinkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

export interface AIKeyManagerProps {
  provider: AIModelProvider;
  config?: AIKeyConfig | null;
  onKeySet: (provider: AIModelProvider, apiKey: string, lastFour: string, models: string[]) => Promise<void>;
  onKeyClear: (provider: AIModelProvider) => Promise<void>;
  disabled?: boolean;
}

/**
 * Status icon component for validation status
 */
function StatusIcon({ status }: { status: AIKeyValidationStatus }) {
  switch (status) {
    case 'valid':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'invalid':
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    case 'expired':
      return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
    case 'validating':
      return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'not_set':
    default:
      return <KeyIcon className="h-5 w-5 text-gray-400" />;
  }
}

/**
 * Status badge for validation status
 */
function StatusBadge({ status }: { status: AIKeyValidationStatus }) {
  const configs: Record<AIKeyValidationStatus, { label: string; className: string }> = {
    valid: { label: 'Valid', className: 'bg-green-100 text-green-700' },
    invalid: { label: 'Invalid', className: 'bg-red-100 text-red-700' },
    expired: { label: 'Expired', className: 'bg-amber-100 text-amber-700' },
    validating: { label: 'Validating...', className: 'bg-blue-100 text-blue-700' },
    not_set: { label: 'Not Set', className: 'bg-gray-100 text-gray-500' },
  };

  const config = configs[status];
  return <Badge className={cn('text-xs', config.className)}>{config.label}</Badge>;
}

/**
 * AIKeyManager - Component for managing AI provider API keys
 *
 * Features:
 * - Masked input field showing only last 4 characters when set
 * - Validate key button that tests connection
 * - Clear key button with confirmation dialog
 * - Visual status indicators (valid/invalid/not set)
 *
 * SECURITY NOTE: API keys entered here should be sent to a Cloud Function
 * for validation and storage in GCP Secret Manager. Never store raw keys
 * in Firestore or browser storage.
 */
export default function AIKeyManager({
  provider,
  config,
  onKeySet,
  onKeyClear,
  disabled = false,
}: AIKeyManagerProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [localStatus, setLocalStatus] = useState<AIKeyValidationStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const providerConfig = PROVIDER_CONFIG[provider];
  const currentStatus = localStatus || config?.validationStatus || 'not_set';
  const hasKey = config?.keySet || false;

  // Confirm dialog for clearing key
  const { confirm: confirmClear, DialogComponent: ClearDialog } = useConfirmDialog();

  /**
   * Validate the entered API key
   */
  const handleValidate = useCallback(async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setValidating(true);
    setLocalStatus('validating');
    setErrorMessage(null);

    try {
      const result = await validateAPIKey(provider, apiKey);

      if (result.valid) {
        setLocalStatus('valid');
        const lastFour = getKeyLastFour(apiKey);

        // Call the parent handler to store the key securely
        await onKeySet(provider, apiKey, lastFour, result.models || []);

        toast.success(`${providerConfig.displayName} API key validated and saved`);
        setApiKey(''); // Clear the input after successful save
      } else {
        setLocalStatus('invalid');
        setErrorMessage(result.error || 'Invalid API key');
        toast.error(result.error || 'Invalid API key');
      }
    } catch (error) {
      logger.error('[AIKeyManager] Validation error', { error: error, component: 'AIKeyManager' });
      setLocalStatus('invalid');
      setErrorMessage('Failed to validate API key. Please try again.');
      toast.error('Failed to validate API key');
    } finally {
      setValidating(false);
    }
  }, [apiKey, provider, providerConfig.displayName, onKeySet]);

  /**
   * Clear the stored API key
   */
  const handleClear = useCallback(async () => {
    try {
      await onKeyClear(provider);
      setLocalStatus('not_set');
      setApiKey('');
      setErrorMessage(null);
      toast.success(`${providerConfig.displayName} API key removed`);
    } catch (error) {
      logger.error('[AIKeyManager] Clear error', { error: error, component: 'AIKeyManager' });
      toast.error('Failed to remove API key');
    }
  }, [provider, providerConfig.displayName, onKeyClear]);

  /**
   * Re-validate an existing key
   */
  const handleRevalidate = useCallback(async () => {
    if (!hasKey) return;

    setValidating(true);
    setLocalStatus('validating');

    // In a real implementation, this would call a Cloud Function
    // that retrieves the key from Secret Manager and validates it
    toast.info('Re-validation would be handled by a Cloud Function in production');

    setTimeout(() => {
      setValidating(false);
      setLocalStatus(config?.validationStatus || 'valid');
    }, 1500);
  }, [hasKey, config?.validationStatus]);

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', providerConfig.bgColor)}>
            <KeyIcon className={cn('h-5 w-5', providerConfig.color)} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{providerConfig.displayName}</h4>
            <p className="text-sm text-gray-500">API Key Authentication</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon status={currentStatus} />
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      {/* Key Display (when set) */}
      {hasKey && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Current Key</p>
              <p className="text-sm text-gray-500 font-mono">
                {providerConfig.keyPrefix}...{config?.keyLastFour || '****'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRevalidate}
                disabled={disabled || validating}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Re-validate key"
              >
                <ArrowPathIcon className={cn('h-4 w-4', validating && 'animate-spin')} />
              </button>
              <button
                onClick={async () => {
                  const confirmed = await confirmClear({
                    title: `Remove ${providerConfig.displayName} API Key?`,
                    message: `This will remove your ${providerConfig.displayName} API key. You'll need to enter a new key to use ${providerConfig.displayName} models.`,
                    confirmLabel: 'Remove Key',
                    variant: 'danger',
                  });
                  if (confirmed) {
                    handleClear();
                  }
                }}
                disabled={disabled}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                title="Remove key"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Models available with this key */}
          {config?.availableModels && config.availableModels.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Available Models</p>
              <div className="flex flex-wrap gap-1.5">
                {config.availableModels.slice(0, 5).map((model) => (
                  <span
                    key={model}
                    className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600"
                  >
                    {model}
                  </span>
                ))}
                {config.availableModels.length > 5 && (
                  <span className="text-xs text-gray-400">
                    +{config.availableModels.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Last validated */}
          {config?.validatedAt && (
            <p className="mt-2 text-xs text-gray-400">
              Last validated: {new Date(config.validatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Key Input (when not set or updating) */}
      {!hasKey && (
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setLocalStatus(null);
                setErrorMessage(null);
              }}
              placeholder={providerConfig.keyPlaceholder}
              disabled={disabled || validating}
              className={cn(
                'w-full px-3 py-2 pr-10 border rounded-lg text-sm font-mono',
                'focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary',
                'disabled:opacity-50 disabled:bg-gray-50',
                errorMessage ? 'border-red-300' : 'border-gray-300'
              )}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              {showKey ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Error message */}
          {errorMessage && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <XCircleIcon className="h-4 w-4" />
              {errorMessage}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleValidate}
              disabled={disabled || validating || !apiKey.trim()}
              loading={validating}
            >
              {validating ? 'Validating...' : 'Validate & Save'}
            </Button>
            <a
              href={providerConfig.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Get API Key
            </a>
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
        <div className="flex items-start gap-2">
          <InformationCircleIcon className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700">
            <p className="font-medium mb-1">Security Note</p>
            <p>
              Your API key will be encrypted and stored securely in Google Cloud Secret Manager.
              It is never stored in plain text or in the browser.
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Clear Dialog */}
      <ClearDialog />
    </Card>
  );
}

/**
 * Props for AIKeyManagerGroup
 */
export interface AIKeyManagerGroupProps {
  configs: Record<AIModelProvider, AIKeyConfig | null>;
  onKeySet: (provider: AIModelProvider, apiKey: string, lastFour: string, models: string[]) => Promise<void>;
  onKeyClear: (provider: AIModelProvider) => Promise<void>;
  disabled?: boolean;
  providers?: AIModelProvider[];
}

/**
 * AIKeyManagerGroup - Renders key managers for multiple providers
 */
export function AIKeyManagerGroup({
  configs,
  onKeySet,
  onKeyClear,
  disabled = false,
  providers = ['openai', 'claude', 'gemini'],
}: AIKeyManagerGroupProps) {
  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <AIKeyManager
          key={provider}
          provider={provider}
          config={configs[provider]}
          onKeySet={onKeySet}
          onKeyClear={onKeyClear}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
