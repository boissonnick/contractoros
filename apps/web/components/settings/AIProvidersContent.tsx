"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, Button, Badge, toast } from '@/components/ui';
import {
  AIProviderType,
  AIProviderConfig,
  AIProviderConnectionStatus,
  AI_PROVIDER_INFO,
} from '@/types';
import {
  subscribeToProviderConfigs,
  saveProviderConfig,
  disconnectProvider,
  validateProviderCredentials,
  getApiKeyLastFour,
  isValidKeyFormat,
  getStatusColors,
  DEFAULT_OLLAMA_URL,
} from '@/lib/ai/providers';
import { cn } from '@/lib/utils';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  LinkIcon,
  InformationCircleIcon,
  ServerIcon,
  KeyIcon,
  CloudIcon,
  ChevronUpDownIcon,
  Cog6ToothIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useAIProviderSettings } from '@/lib/hooks/useAIProviderSettings';
import AIProviderPriority, { AIUsageSummary } from '@/components/settings/AIProviderPriority';
import type {
  AIProviderPriority as AIProviderPriorityType,
  AIFeatureModelAssignment,
  AIFeatureType,
} from '@/types';

// ============================================================================
// Provider Icons
// ============================================================================

function OpenAIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function AnthropicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.604 3.295c-.198-.61-.71-.97-1.36-.97h-2.77l-5.47 17.35h2.91l1.26-4.15h5.96l1.25 4.15h2.94l-4.72-16.38zm-4.53 10.39l2.03-6.71 2.06 6.71h-4.09zm-4.49-10.39H5.69l-5.47 17.35h2.91l1.26-4.15h5.96l1.25 4.15h2.94l-4.98-17.35z"/>
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function OllamaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="4" fill="currentColor"/>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

const PROVIDER_ICONS: Record<AIProviderType, React.FC<{ className?: string }>> = {
  openai: OpenAIIcon,
  anthropic: AnthropicIcon,
  google: GoogleIcon,
  ollama: OllamaIcon,
};

// ============================================================================
// Connection Status Badge
// ============================================================================

function StatusBadge({ status }: { status: AIProviderConnectionStatus }) {
  const colors = getStatusColors(status);
  const labels: Record<AIProviderConnectionStatus, string> = {
    connected: 'Connected',
    disconnected: 'Not Connected',
    pending: 'Connecting...',
    error: 'Error',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        colors.bg,
        colors.text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
      {labels[status]}
    </span>
  );
}

// ============================================================================
// API Key Input Component
// ============================================================================

interface ApiKeyInputProps {
  provider: AIProviderType;
  value: string;
  onChange: (value: string) => void;
  onValidate: () => void;
  validating: boolean;
  placeholder?: string;
}

function ApiKeyInput({
  provider,
  value,
  onChange,
  onValidate,
  validating,
  placeholder,
}: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const isOllama = provider === 'ollama';

  const placeholderText = placeholder || (isOllama
    ? 'http://localhost:11434'
    : `Enter your ${AI_PROVIDER_INFO[provider].name} API key`);

  const inputType = isOllama ? 'url' : (showKey ? 'text' : 'password');

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholderText}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
        />
        {!isOllama && (
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showKey ? (
              <EyeSlashIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={onValidate}
        disabled={!value || validating}
        loading={validating}
      >
        {validating ? 'Validating...' : 'Connect'}
      </Button>
    </div>
  );
}

// ============================================================================
// Provider Card Component
// ============================================================================

interface ProviderCardProps {
  provider: AIProviderType;
  config: AIProviderConfig | null;
  onConnect: (provider: AIProviderType, credential: string) => Promise<void>;
  onDisconnect: (provider: AIProviderType) => Promise<void>;
  connecting: boolean;
  disconnecting: boolean;
}

function ProviderCard({
  provider,
  config,
  onConnect,
  onDisconnect,
  connecting,
  disconnecting,
}: ProviderCardProps) {
  const [apiKey, setApiKey] = useState('');
  const [expanded, setExpanded] = useState(false);
  const info = AI_PROVIDER_INFO[provider];
  const Icon = PROVIDER_ICONS[provider];
  const isConnected = config?.connected && config.connectionStatus === 'connected';
  const isOllama = provider === 'ollama';

  const handleConnect = async () => {
    await onConnect(provider, apiKey);
    setApiKey('');
    setExpanded(false);
  };

  const handleDisconnect = async () => {
    await onDisconnect(provider);
  };

  return (
    <Card className={cn('transition-all', expanded && 'ring-2 ring-blue-200')}>
      <div className="flex items-start gap-4">
        {/* Provider Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            info.bgColor
          )}
        >
          <Icon className={cn('w-6 h-6', info.iconColor)} />
        </div>

        {/* Provider Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{info.name}</h3>
            <StatusBadge status={config?.connectionStatus || 'disconnected'} />
          </div>
          <p className="text-sm text-gray-600 mb-2">{info.description}</p>

          {/* Features */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {info.features.slice(0, 4).map((feature) => (
              <span
                key={feature}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Connection info when connected */}
          {isConnected && config && (
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              {config.apiKeyLastFour && (
                <span className="flex items-center gap-1">
                  <KeyIcon className="w-3.5 h-3.5" />
                  Key ending in ****{config.apiKeyLastFour}
                </span>
              )}
              {config.localUrl && (
                <span className="flex items-center gap-1">
                  <ServerIcon className="w-3.5 h-3.5" />
                  {config.localUrl}
                </span>
              )}
              {config.connectionDate && (
                <span>
                  Connected {new Date(config.connectionDate).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {/* API Key Input (when expanded and not connected) */}
          {expanded && !isConnected && (
            <div className="mt-3 space-y-3">
              <ApiKeyInput
                provider={provider}
                value={apiKey}
                onChange={setApiKey}
                onValidate={handleConnect}
                validating={connecting}
                placeholder={isOllama ? DEFAULT_OLLAMA_URL : undefined}
              />
              <p className="text-xs text-gray-500">
                {isOllama ? (
                  <>
                    Make sure Ollama is running locally.{' '}
                    <a
                      href={info.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Installation guide
                    </a>
                  </>
                ) : (
                  <>
                    Get your API key from{' '}
                    <a
                      href={info.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {info.name}
                    </a>
                    . Your key is stored securely and never shared.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0">
          {isConnected ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDisconnect}
              loading={disconnecting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              variant={expanded ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Cancel' : 'Connect'}
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {config?.lastError && config.connectionStatus === 'error' && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-start gap-2">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 font-medium">Connection Error</p>
            <p className="text-xs text-red-600">{config.lastError}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// Tab Component
// ============================================================================

interface TabProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

function Tab({ label, active, onClick, icon: Icon }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ============================================================================
// Feature labels for display
// ============================================================================

const FEATURE_LABELS: Record<AIFeatureType, string> = {
  assistant: 'AI Assistant Chat',
  estimates: 'Estimate Analysis',
  photo_analysis: 'Photo Analysis',
  document_analysis: 'Document Parsing',
  project_summary: 'Project Summaries',
  nl_query: 'Natural Language Queries',
};

const FEATURE_DESCRIPTIONS: Record<AIFeatureType, string> = {
  assistant: 'Powers the AI assistant for answering questions and providing help',
  estimates: 'Analyzes estimates for completeness and suggests pricing',
  photo_analysis: 'Tags photos and identifies safety issues',
  document_analysis: 'Extracts data from uploaded documents',
  project_summary: 'Generates project status summaries',
  nl_query: 'Processes natural language data queries',
};

// Toggle component for priority tab
function PriorityToggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        enabled ? 'bg-blue-600' : 'bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          enabled ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

// ============================================================================
// Provider Priority Tab Component
// ============================================================================

interface ProviderPriorityTabProps {
  connectedProviders: string[];
}

function ProviderPriorityTab({ connectedProviders }: ProviderPriorityTabProps) {
  const {
    settings,
    monthlyUsage,
    loading,
    error,
    updateSettings,
    availableModels,
    activeProvider,
  } = useAIProviderSettings();

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<{
    providerPriorities: AIProviderPriorityType[];
    featureAssignments: AIFeatureModelAssignment[];
    enableAutomaticFallback: boolean;
    maxFallbackAttempts: number;
    monthlyBudget?: number;
    alertThresholdPercent?: number;
  } | null>(null);

  // Sync local settings when loaded
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        providerPriorities: settings.providerPriorities,
        featureAssignments: settings.featureAssignments,
        enableAutomaticFallback: settings.enableAutomaticFallback,
        maxFallbackAttempts: settings.maxFallbackAttempts,
        monthlyBudget: settings.monthlyBudget,
        alertThresholdPercent: settings.alertThresholdPercent,
      });
    }
  }, [settings]);

  const handleProviderPrioritiesChange = (priorities: AIProviderPriorityType[]) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, providerPriorities: priorities });
    setHasChanges(true);
  };

  const handleFeatureModelChange = (
    feature: AIFeatureType,
    modelKey: string,
    fallbackModelKey?: string
  ) => {
    if (!localSettings) return;

    const newAssignments = localSettings.featureAssignments.map((a) =>
      a.feature === feature ? { ...a, modelKey, fallbackModelKey } : a
    );

    if (!newAssignments.find((a) => a.feature === feature)) {
      newAssignments.push({ feature, modelKey, fallbackModelKey });
    }

    setLocalSettings({ ...localSettings, featureAssignments: newAssignments });
    setHasChanges(true);
  };

  const handleToggleFallback = (enabled: boolean) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, enableAutomaticFallback: enabled });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localSettings) return;

    setSaving(true);
    try {
      await updateSettings({
        providerPriorities: localSettings.providerPriorities,
        featureAssignments: localSettings.featureAssignments,
        enableAutomaticFallback: localSettings.enableAutomaticFallback,
        maxFallbackAttempts: localSettings.maxFallbackAttempts,
        monthlyBudget: localSettings.monthlyBudget,
        alertThresholdPercent: localSettings.alertThresholdPercent,
      });
      setHasChanges(false);
      toast.success('AI provider settings saved');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <p className="text-red-700">{error}</p>
      </Card>
    );
  }

  return (
    <>
      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      )}

      {/* Active Provider Status */}
      {activeProvider && (
        <Card className="border-2 border-green-200 bg-green-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-green-700">Active Provider</p>
              <p className="font-semibold text-green-900">
                {activeProvider.providerId.charAt(0).toUpperCase() +
                  activeProvider.providerId.slice(1)}
              </p>
            </div>
            {activeProvider.costPer1kTokens === 0 && (
              <Badge className="bg-green-100 text-green-700">Free Tier</Badge>
            )}
          </div>
        </Card>
      )}

      {/* Monthly Usage Summary */}
      {monthlyUsage ? (
        <AIUsageSummary
          totalCost={monthlyUsage.totalCost}
          totalTokens={monthlyUsage.totalTokens}
          totalRequests={monthlyUsage.totalRequests}
          budget={localSettings?.monthlyBudget}
          period={new Date().toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        />
      ) : (
        <Card className="bg-gray-50">
          <div className="flex items-center gap-3">
            <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">No usage data yet this month</p>
              <p className="text-xs text-gray-400">
                Usage statistics will appear here after making AI requests
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Provider Priority Section */}
      <Card>
        {localSettings && (
          <AIProviderPriority
            priorities={localSettings.providerPriorities}
            onChange={handleProviderPrioritiesChange}
            disabled={saving}
          />
        )}
      </Card>

      {/* Fallback Settings */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <ArrowPathIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Automatic Fallback</h3>
              <p className="text-sm text-gray-500">
                Automatically try the next provider when one fails
              </p>
            </div>
          </div>
          <PriorityToggle
            enabled={localSettings?.enableAutomaticFallback ?? true}
            onChange={handleToggleFallback}
            disabled={saving}
          />
        </div>

        {localSettings?.enableAutomaticFallback && (
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Fallback Attempts
            </label>
            <select
              value={localSettings.maxFallbackAttempts}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  maxFallbackAttempts: parseInt(e.target.value),
                })
              }
              disabled={saving}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 provider</option>
              <option value={2}>2 providers</option>
              <option value={3}>3 providers</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Number of providers to try before giving up
            </p>
          </div>
        )}
      </Card>

      {/* Per-Feature Model Selection */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Cog6ToothIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Feature Model Assignment</h3>
            <p className="text-sm text-gray-500">
              Choose which model powers each AI feature
            </p>
          </div>
        </div>

        <div className="space-y-1">
          {(Object.keys(FEATURE_LABELS) as AIFeatureType[]).map((feature) => {
            const assignment = localSettings?.featureAssignments.find(
              (a) => a.feature === feature
            );
            const currentModel = assignment?.modelKey || 'gemini-2.0-flash';

            return (
              <div
                key={feature}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{FEATURE_LABELS[feature]}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {FEATURE_DESCRIPTIONS[feature]}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <select
                    value={currentModel}
                    onChange={(e) =>
                      handleFeatureModelChange(
                        feature,
                        e.target.value,
                        assignment?.fallbackModelKey
                      )
                    }
                    disabled={saving || availableModels.length === 0}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 min-w-[180px]"
                  >
                    {availableModels.length === 0 ? (
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash (Default)</option>
                    ) : (
                      availableModels.map((model) => (
                        <option key={model.key} value={model.key}>
                          {model.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="bg-gray-50">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-gray-900">About Provider Fallback</h4>
            <p className="text-sm text-gray-600 mt-1">
              When automatic fallback is enabled, if the primary provider fails (rate
              limits, errors, or downtime), requests are automatically routed to the next
              enabled provider in priority order.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <BoltIcon className="h-4 w-4 text-amber-500" />
                Gemini is free for standard usage (rate limited)
              </li>
              <li className="flex items-center gap-2">
                <KeyIcon className="h-4 w-4 text-green-500" />
                Configure API keys in the Connections tab to enable more providers
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </>
  );
}

// ============================================================================
// Main Content Component (exported for dynamic import)
// ============================================================================

export default function AIProvidersContent() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'connections' | 'priority'>('connections');
  const [configs, setConfigs] = useState<Record<AIProviderType, AIProviderConfig | null>>({
    openai: null,
    anthropic: null,
    google: null,
    ollama: null,
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<AIProviderType | null>(null);
  const [disconnecting, setDisconnecting] = useState<AIProviderType | null>(null);

  const orgId = profile?.orgId;
  const userId = profile?.uid;

  // Subscribe to provider configs
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToProviderConfigs(
      orgId,
      (loadedConfigs) => {
        const configMap: Record<AIProviderType, AIProviderConfig | null> = {
          openai: null,
          anthropic: null,
          google: null,
          ollama: null,
        };
        loadedConfigs.forEach((config) => {
          configMap[config.provider] = config;
        });
        setConfigs(configMap);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading AI provider configs:', error);
        toast.error('Failed to load AI provider configurations');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  // Connect provider
  const handleConnect = useCallback(
    async (provider: AIProviderType, credential: string) => {
      if (!orgId || !userId) {
        toast.error('You must be logged in to connect providers');
        return;
      }

      // Validate key format first
      if (!isValidKeyFormat(provider, credential)) {
        toast.error(
          provider === 'ollama'
            ? 'Please enter a valid URL (e.g., http://localhost:11434)'
            : 'Invalid API key format'
        );
        return;
      }

      setConnecting(provider);

      try {
        // Validate credentials with the provider
        const result = await validateProviderCredentials(provider, credential);

        if (!result.valid) {
          toast.error(result.message + (result.error ? `: ${result.error}` : ''));

          // Save error state
          await saveProviderConfig(
            orgId,
            provider,
            {
              connected: false,
              connectionStatus: 'error',
              lastError: result.error || result.message,
              lastErrorAt: new Date(),
            },
            userId
          );
          return;
        }

        // Save successful connection
        await saveProviderConfig(
          orgId,
          provider,
          {
            connected: true,
            connectionStatus: 'connected',
            connectionDate: new Date(),
            hasApiKey: provider !== 'ollama',
            apiKeyLastFour: provider !== 'ollama' ? getApiKeyLastFour(credential) : undefined,
            localUrl: provider === 'ollama' ? credential : undefined,
            availableModels: result.models,
            lastError: undefined,
            lastErrorAt: undefined,
          },
          userId
        );

        toast.success(`${AI_PROVIDER_INFO[provider].name} connected successfully!`);

        // Note: In production, the API key should be sent to a secure backend
        // endpoint that stores it in GCP Secret Manager, not in Firestore
        console.info(
          `[AI Providers] ${provider} connected. Note: API key should be stored securely via backend endpoint.`
        );
      } catch (error) {
        console.error(`Error connecting ${provider}:`, error);
        toast.error(`Failed to connect ${AI_PROVIDER_INFO[provider].name}`);
      } finally {
        setConnecting(null);
      }
    },
    [orgId, userId]
  );

  // Disconnect provider
  const handleDisconnect = useCallback(
    async (provider: AIProviderType) => {
      if (!orgId || !userId) return;

      setDisconnecting(provider);

      try {
        await disconnectProvider(orgId, provider, userId);
        toast.success(`${AI_PROVIDER_INFO[provider].name} disconnected`);
      } catch (error) {
        console.error(`Error disconnecting ${provider}:`, error);
        toast.error(`Failed to disconnect ${AI_PROVIDER_INFO[provider].name}`);
      } finally {
        setDisconnecting(null);
      }
    },
    [orgId, userId]
  );

  // Count connected providers
  const connectedCount = Object.values(configs).filter(
    (c) => c?.connected && c.connectionStatus === 'connected'
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <CloudIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Providers</h2>
            <p className="text-sm text-gray-500">
              Connect AI models and configure provider priorities
            </p>
          </div>
        </div>
        {connectedCount > 0 && (
          <Badge className="bg-green-100 text-green-700">
            {connectedCount} provider{connectedCount !== 1 ? 's' : ''} connected
          </Badge>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <Tab
          label="Connections"
          active={activeTab === 'connections'}
          onClick={() => setActiveTab('connections')}
          icon={LinkIcon}
        />
        <Tab
          label="Priority & Fallback"
          active={activeTab === 'priority'}
          onClick={() => setActiveTab('priority')}
          icon={ChevronUpDownIcon}
        />
      </div>

      {activeTab === 'connections' && (
        <>
          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-100">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">
                  Bring Your Own AI Model
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  Connect your API keys to use premium AI models like GPT-4o and Claude Sonnet.
                  By default, ContractorOS uses Google Gemini 2.0 Flash (free tier).
                  Your API keys are stored securely and never shared.
                </p>
              </div>
            </div>
          </Card>

          {/* Cloud Providers Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Cloud Providers
            </h3>
            <div className="space-y-4">
              <ProviderCard
                provider="openai"
                config={configs.openai}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                connecting={connecting === 'openai'}
                disconnecting={disconnecting === 'openai'}
              />
              <ProviderCard
                provider="anthropic"
                config={configs.anthropic}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                connecting={connecting === 'anthropic'}
                disconnecting={disconnecting === 'anthropic'}
              />
              <ProviderCard
                provider="google"
                config={configs.google}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                connecting={connecting === 'google'}
                disconnecting={disconnecting === 'google'}
              />
            </div>
          </section>

          {/* Local Providers Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Local Providers
            </h3>
            <div className="space-y-4">
              <ProviderCard
                provider="ollama"
                config={configs.ollama}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                connecting={connecting === 'ollama'}
                disconnecting={disconnecting === 'ollama'}
              />
            </div>
          </section>

          {/* Backend Requirements Notice */}
          <Card className="bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <ExclamationCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-900">
                  Backend Integration Required
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  This feature requires backend API endpoints to securely store API keys.
                  See the documentation for required endpoints:
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                  <li><code className="bg-amber-100 px-1 rounded">POST /api/ai/providers/connect</code> - Store encrypted API key</li>
                  <li><code className="bg-amber-100 px-1 rounded">POST /api/ai/providers/disconnect</code> - Remove stored key</li>
                  <li><code className="bg-amber-100 px-1 rounded">POST /api/ai/providers/validate</code> - Server-side key validation</li>
                  <li><code className="bg-amber-100 px-1 rounded">GET /api/ai/providers/status</code> - Get connection status</li>
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'priority' && (
        <ProviderPriorityTab connectedProviders={Object.keys(configs).filter(
          (k) => configs[k as AIProviderType]?.connected && configs[k as AIProviderType]?.connectionStatus === 'connected'
        )} />
      )}
    </div>
  );
}
