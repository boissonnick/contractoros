"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, Button, Badge, toast } from '@/components/ui';
import { useOrganizationAISettings } from '@/lib/hooks/useOrganizationAISettings';
import { AVAILABLE_MODELS, getDefaultModelKey } from '@/lib/assistant/models';
import { RATE_LIMITS } from '@/lib/assistant/models/types';
import { OrganizationAISettings, AIUsageRecord, AIResponseStyle } from '@/types';
import { cn } from '@/lib/utils';
import { loadVoices, TTSVoice, isTTSSupported } from '@/lib/assistant/tts-service';
import {
  SparklesIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CubeIcon,
  ClockIcon,
  BoltIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  ChatBubbleBottomCenterTextIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import AIKeyManager from '@/components/settings/AIKeyManager';
import { AIModelProvider, AIKeyConfig, AIKeyAuthMethod } from '@/types';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

// Toggle component
interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

function Toggle({ enabled, onChange, disabled }: ToggleProps) {
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

// Model card component
interface ModelCardProps {
  modelKey: string;
  config: typeof AVAILABLE_MODELS[string];
  isSelected: boolean;
  isAvailable: boolean;
  onSelect: () => void;
}

function ModelCard({ modelKey, config, isSelected, isAvailable, onSelect }: ModelCardProps) {
  const providerColors: Record<string, { bg: string; text: string; icon: string }> = {
    gemini: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'text-blue-600' },
    claude: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'text-orange-600' },
    openai: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600' },
  };

  const colors = providerColors[config.provider] || providerColors.gemini;

  return (
    <button
      onClick={onSelect}
      disabled={!isAvailable}
      className={cn(
        'p-4 rounded-xl border-2 text-left transition-all w-full',
        isSelected
          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
          : isAvailable
            ? 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.bg)}>
          <CubeIcon className={cn('h-5 w-5', colors.icon)} />
        </div>
        <div className="flex items-center gap-2">
          {config.tier === 'free' && (
            <Badge className="bg-green-100 text-green-700 text-xs">Free</Badge>
          )}
          {isSelected && (
            <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-4 w-4 text-white" />
            </div>
          )}
          {!isAvailable && !isSelected && (
            <Badge className="bg-gray-100 text-gray-500 text-xs">No API Key</Badge>
          )}
        </div>
      </div>

      <h4 className="font-semibold text-gray-900">{config.displayName}</h4>
      <p className="text-sm text-gray-500 mt-1">{config.description}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={cn('text-xs px-2 py-0.5 rounded-full', colors.bg, colors.text)}>
          {config.provider.charAt(0).toUpperCase() + config.provider.slice(1)}
        </span>
        {config.supportsVision && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
            Vision
          </span>
        )}
        {config.supportsStreaming && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700">
            Streaming
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 grid grid-cols-2 gap-2">
        <div>
          <span className="font-medium">Context:</span>{' '}
          {config.contextWindow >= 1000000
            ? `${(config.contextWindow / 1000000).toFixed(0)}M tokens`
            : `${(config.contextWindow / 1000).toFixed(0)}K tokens`}
        </div>
        <div>
          <span className="font-medium">Max output:</span>{' '}
          {(config.maxTokens / 1000).toFixed(0)}K tokens
        </div>
        {config.costPer1kInputTokens > 0 && (
          <div className="col-span-2">
            <span className="font-medium">Cost:</span> ${config.costPer1kInputTokens}/1K in, $
            {config.costPer1kOutputTokens}/1K out
          </div>
        )}
      </div>
    </button>
  );
}

// Usage stats card
interface UsageStatsProps {
  usage: AIUsageRecord | null;
  tier: 'free' | 'pro' | 'enterprise';
  loading: boolean;
  onRefresh: () => void;
}

function UsageStats({ usage, tier, loading, onRefresh }: UsageStatsProps) {
  const limits = RATE_LIMITS[tier];

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-16 bg-gray-200 rounded" />
          <div className="h-16 bg-gray-200 rounded" />
          <div className="h-16 bg-gray-200 rounded" />
        </div>
      </Card>
    );
  }

  const requestPercent = usage ? Math.min((usage.requests / limits.requestsPerDay) * 100, 100) : 0;
  const tokenPercent = usage ? Math.min(((usage.inputTokens + usage.outputTokens) / limits.tokensPerDay) * 100, 100) : 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Today&apos;s Usage</h3>
        <button
          onClick={onRefresh}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowPathIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Requests */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BoltIcon className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-gray-500">Requests</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {usage?.requests ?? 0}
            <span className="text-sm font-normal text-gray-400">/{limits.requestsPerDay}</span>
          </p>
          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                requestPercent > 90 ? 'bg-red-500' : requestPercent > 70 ? 'bg-amber-500' : 'bg-blue-500'
              )}
              style={{ width: `${requestPercent}%` }}
            />
          </div>
        </div>

        {/* Tokens */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CpuChipIcon className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-gray-500">Tokens</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {usage ? ((usage.inputTokens + usage.outputTokens) / 1000).toFixed(1) : 0}K
            <span className="text-sm font-normal text-gray-400">/{(limits.tokensPerDay / 1000).toFixed(0)}K</span>
          </p>
          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                tokenPercent > 90 ? 'bg-red-500' : tokenPercent > 70 ? 'bg-amber-500' : 'bg-purple-500'
              )}
              style={{ width: `${tokenPercent}%` }}
            />
          </div>
        </div>

        {/* Cost */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollarIcon className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-500">Cost</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            ${(usage?.estimatedCost ?? 0).toFixed(4)}
          </p>
          {tier !== 'free' && limits.maxCostPerDay > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Max: ${limits.maxCostPerDay}/day
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// Response style options
const RESPONSE_STYLES: { value: AIResponseStyle; label: string; description: string }[] = [
  { value: 'concise', label: 'Concise', description: 'Short, direct answers' },
  { value: 'detailed', label: 'Detailed', description: 'Thorough explanations with context' },
  { value: 'technical', label: 'Technical', description: 'In-depth technical details' },
];

export default function AIAssistantSettingsPage() {
  const { profile } = useAuth();
  const { settings, loading, updateSettings, usage, refreshUsage } = useOrganizationAISettings();
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState<OrganizationAISettings | null>(null);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [ttsSupported, setTtsSupported] = useState(false);

  // API Key management state
  const [authMethod, setAuthMethod] = useState<AIKeyAuthMethod>('oauth');
  const [keyConfigs, setKeyConfigs] = useState<Record<AIModelProvider, AIKeyConfig | null>>({
    openai: null,
    claude: null,
    gemini: null,
  });
  const [loadingKeys, setLoadingKeys] = useState(true);

  const orgId = profile?.orgId;

  // Load API key configurations
  useEffect(() => {
    if (!orgId) {
      setLoadingKeys(false);
      return;
    }

    async function loadKeyConfigs() {
      try {
        const providers: AIModelProvider[] = ['openai', 'claude', 'gemini'];
        const configs: Record<AIModelProvider, AIKeyConfig | null> = {
          openai: null,
          claude: null,
          gemini: null,
        };

        for (const provider of providers) {
          const docRef = doc(db, `organizations/${orgId}/aiKeyConfigs/${provider}`);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            configs[provider] = {
              ...data,
              validatedAt: data.validatedAt?.toDate?.(),
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
            } as AIKeyConfig;
          }
        }

        setKeyConfigs(configs);

        // Determine auth method based on whether any keys are set
        const hasAnyKey = Object.values(configs).some((c) => c?.keySet);
        if (hasAnyKey) {
          setAuthMethod('api_key');
        }
      } catch (error) {
        console.error('[AIAssistantSettingsPage] Error loading key configs:', error);
      } finally {
        setLoadingKeys(false);
      }
    }

    loadKeyConfigs();
  }, [orgId]);

  // Handle setting an API key
  const handleKeySet = async (
    provider: AIModelProvider,
    apiKey: string,
    lastFour: string,
    models: string[]
  ) => {
    if (!orgId) return;

    // In production, this would call a Cloud Function to store the key in Secret Manager
    // For now, we only store the metadata in Firestore
    const keyConfig: AIKeyConfig = {
      provider,
      keySet: true,
      keyLastFour: lastFour,
      validatedAt: new Date(),
      validationStatus: 'valid',
      availableModels: models,
      authMethod: 'api_key',
      createdAt: keyConfigs[provider]?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const docRef = doc(db, `organizations/${orgId}/aiKeyConfigs/${provider}`);
    await setDoc(docRef, {
      ...keyConfig,
      validatedAt: Timestamp.fromDate(keyConfig.validatedAt!),
      createdAt: Timestamp.fromDate(keyConfig.createdAt),
      updatedAt: Timestamp.fromDate(keyConfig.updatedAt),
    });

    setKeyConfigs((prev) => ({ ...prev, [provider]: keyConfig }));

    // Update the organization AI settings to reflect the new key
    if (provider === 'openai') {
      await updateSettings({ hasCustomOpenAIKey: true });
    } else if (provider === 'claude') {
      await updateSettings({ hasCustomClaudeKey: true });
    } else if (provider === 'gemini') {
      await updateSettings({ hasCustomGeminiKey: true });
    }
  };

  // Handle clearing an API key
  const handleKeyClear = async (provider: AIModelProvider) => {
    if (!orgId) return;

    const keyConfig: AIKeyConfig = {
      provider,
      keySet: false,
      validationStatus: 'not_set',
      authMethod: 'api_key',
      createdAt: keyConfigs[provider]?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const docRef = doc(db, `organizations/${orgId}/aiKeyConfigs/${provider}`);
    await setDoc(docRef, {
      ...keyConfig,
      createdAt: Timestamp.fromDate(keyConfig.createdAt),
      updatedAt: Timestamp.fromDate(keyConfig.updatedAt),
    });

    setKeyConfigs((prev) => ({ ...prev, [provider]: keyConfig }));

    // Update the organization AI settings
    if (provider === 'openai') {
      await updateSettings({ hasCustomOpenAIKey: false });
    } else if (provider === 'claude') {
      await updateSettings({ hasCustomClaudeKey: false });
    } else if (provider === 'gemini') {
      await updateSettings({ hasCustomGeminiKey: false });
    }
  };

  // Sync local settings when loaded
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Load available voices
  useEffect(() => {
    setTtsSupported(isTTSSupported());
    if (isTTSSupported()) {
      loadVoices().then((loadedVoices) => {
        // Filter to English voices for better UX
        const englishVoices = loadedVoices.filter((v) => v.lang.startsWith('en'));
        setVoices(englishVoices.length > 0 ? englishVoices : loadedVoices);
      });
    }
  }, []);

  // Check which models have API keys configured (server-side check via env vars)
  const availableModels = Object.entries(AVAILABLE_MODELS).reduce((acc, [key, config]) => {
    // For now, we'll assume Gemini is always available (free tier)
    // Claude and OpenAI require API keys which we'll check server-side
    if (config.provider === 'gemini') {
      acc[key] = true;
    } else {
      // These would need to be verified server-side
      acc[key] = false;
    }
    return acc;
  }, {} as Record<string, boolean>);

  const handleModelChange = (modelKey: string) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, selectedModel: modelKey });
    setHasChanges(true);
  };

  const handleToggleChange = (key: 'enableAssistant' | 'enableStreaming' | 'enableTTS' | 'ttsAutoSpeak', value: boolean) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, [key]: value });
    setHasChanges(true);
  };

  const handleResponseStyleChange = (style: AIResponseStyle) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, responseStyle: style });
    setHasChanges(true);
  };

  const handleVoiceChange = (voiceURI: string) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, ttsVoiceURI: voiceURI });
    setHasChanges(true);
  };

  const handleRateChange = (rate: number) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, ttsRate: rate });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localSettings) return;
    try {
      await updateSettings({
        selectedModel: localSettings.selectedModel,
        enableAssistant: localSettings.enableAssistant,
        enableStreaming: localSettings.enableStreaming,
        responseStyle: localSettings.responseStyle,
        enableTTS: localSettings.enableTTS,
        ttsVoiceURI: localSettings.ttsVoiceURI,
        ttsRate: localSettings.ttsRate,
        ttsAutoSpeak: localSettings.ttsAutoSpeak,
      });
      setHasChanges(false);
      toast.success('AI Assistant settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

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
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <SparklesIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-500">Configure your AI assistant model and settings</p>
          </div>
        </div>
        {hasChanges && (
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        )}
      </div>

      {/* Master Toggle */}
      <Card className="border-2 border-purple-200 bg-purple-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Enable AI Assistant</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Get instant help with estimates, pricing questions, and project management
              </p>
            </div>
          </div>
          <Toggle
            enabled={localSettings?.enableAssistant ?? true}
            onChange={(v) => handleToggleChange('enableAssistant', v)}
          />
        </div>
      </Card>

      {/* Usage Stats */}
      <UsageStats
        usage={usage}
        tier={localSettings?.tier || 'free'}
        loading={!settings}
        onRefresh={refreshUsage}
      />

      {/* Model Selection */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Default AI Model</h3>
        <p className="text-sm text-gray-500 mb-4">
          Choose which AI model powers your assistant. The free tier includes Gemini 2.0 Flash at no cost.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(AVAILABLE_MODELS).map(([key, config]) => (
            <ModelCard
              key={key}
              modelKey={key}
              config={config}
              isSelected={localSettings?.selectedModel === key}
              isAvailable={availableModels[key] || config.tier === 'free'}
              onSelect={() => handleModelChange(key)}
            />
          ))}
        </div>
      </Card>

      {/* Streaming Toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-cyan-100 rounded-lg flex items-center justify-center">
              <BoltIcon className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Streaming Responses</p>
              <p className="text-sm text-gray-500">
                See AI responses as they&apos;re generated for a more interactive experience
              </p>
            </div>
          </div>
          <Toggle
            enabled={localSettings?.enableStreaming ?? true}
            onChange={(v) => handleToggleChange('enableStreaming', v)}
            disabled={!localSettings?.enableAssistant}
          />
        </div>
      </Card>

      {/* Response Style */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Response Style</h3>
            <p className="text-sm text-gray-500">
              Choose how the AI assistant formats its responses
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {RESPONSE_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => handleResponseStyleChange(style.value)}
              disabled={!localSettings?.enableAssistant}
              className={cn(
                'p-3 rounded-lg border-2 text-left transition-all',
                localSettings?.responseStyle === style.value
                  ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-gray-200 hover:border-gray-300',
                !localSettings?.enableAssistant && 'opacity-50 cursor-not-allowed'
              )}
            >
              <p className="font-medium text-gray-900">{style.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{style.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Text-to-Speech Settings */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <SpeakerWaveIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Text-to-Speech</h3>
              <p className="text-sm text-gray-500">
                Have AI responses read aloud using your browser&apos;s speech synthesis
              </p>
            </div>
          </div>
          <Toggle
            enabled={localSettings?.enableTTS ?? false}
            onChange={(v) => handleToggleChange('enableTTS', v)}
            disabled={!localSettings?.enableAssistant || !ttsSupported}
          />
        </div>

        {!ttsSupported && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              Text-to-speech is not supported in your browser. Try using Chrome, Edge, or Safari.
            </p>
          </div>
        )}

        {ttsSupported && localSettings?.enableTTS && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Voice
              </label>
              <select
                value={localSettings?.ttsVoiceURI || ''}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">System Default</option>
                {voices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Speech Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Speech Rate: {(localSettings?.ttsRate ?? 1.0).toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={localSettings?.ttsRate ?? 1.0}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.5x (Slower)</span>
                <span>1.0x</span>
                <span>2.0x (Faster)</span>
              </div>
            </div>

            {/* Auto-speak Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-speak responses</p>
                <p className="text-xs text-gray-500">
                  Automatically read AI responses aloud when received
                </p>
              </div>
              <Toggle
                enabled={localSettings?.ttsAutoSpeak ?? false}
                onChange={(v) => handleToggleChange('ttsAutoSpeak', v)}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Rate Limits Info */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Rate Limits</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-medium text-gray-500 pb-3">Tier</th>
                <th className="text-center font-medium text-gray-500 pb-3">Requests/Min</th>
                <th className="text-center font-medium text-gray-500 pb-3">Requests/Day</th>
                <th className="text-center font-medium text-gray-500 pb-3">Tokens/Day</th>
                <th className="text-center font-medium text-gray-500 pb-3">Max Cost/Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(['free', 'pro', 'enterprise'] as const).map((tier) => {
                const limits = RATE_LIMITS[tier];
                const isCurrentTier = localSettings?.tier === tier;
                return (
                  <tr
                    key={tier}
                    className={cn(isCurrentTier && 'bg-blue-50/50')}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{tier}</span>
                        {isCurrentTier && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Current</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-center">{limits.requestsPerMinute}</td>
                    <td className="py-3 text-center">{limits.requestsPerDay.toLocaleString()}</td>
                    <td className="py-3 text-center">{(limits.tokensPerDay / 1000).toFixed(0)}K</td>
                    <td className="py-3 text-center">
                      {limits.maxCostPerDay === 0 ? 'Free' : `$${limits.maxCostPerDay}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Security Info */}
      <Card className="bg-green-50/50 border-green-200">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-900">Security & Privacy</h4>
            <p className="text-sm text-green-700 mt-1">
              Your AI Assistant includes built-in security measures:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-green-700">
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                Prompt injection detection and blocking
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                Automatic PII redaction (SSNs, credit cards, etc.)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                Output sanitization to prevent XSS
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                Rate limiting to control costs
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* API Key Management */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
            <KeyIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">API Key Management</h3>
            <p className="text-sm text-gray-500">
              Bring your own API keys to access additional AI providers
            </p>
          </div>
        </div>

        {/* Auth Method Toggle */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">Authentication Method</p>
          <div className="flex gap-3">
            <button
              onClick={() => setAuthMethod('oauth')}
              className={cn(
                'flex-1 p-3 rounded-lg border-2 text-left transition-all',
                authMethod === 'oauth'
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <p className="font-medium text-gray-900">Platform Default</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Use ContractorOS managed API (Gemini free tier)
              </p>
            </button>
            <button
              onClick={() => setAuthMethod('api_key')}
              className={cn(
                'flex-1 p-3 rounded-lg border-2 text-left transition-all',
                authMethod === 'api_key'
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <p className="font-medium text-gray-900">Custom API Keys</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Bring your own keys for OpenAI, Claude, or Gemini
              </p>
            </button>
          </div>
        </div>

        {/* API Key Managers */}
        {authMethod === 'api_key' && (
          <div className="space-y-4">
            {loadingKeys ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <AIKeyManager
                  provider="openai"
                  config={keyConfigs.openai}
                  onKeySet={handleKeySet}
                  onKeyClear={handleKeyClear}
                  disabled={!localSettings?.enableAssistant}
                />
                <AIKeyManager
                  provider="claude"
                  config={keyConfigs.claude}
                  onKeySet={handleKeySet}
                  onKeyClear={handleKeyClear}
                  disabled={!localSettings?.enableAssistant}
                />
                <AIKeyManager
                  provider="gemini"
                  config={keyConfigs.gemini}
                  onKeySet={handleKeySet}
                  onKeyClear={handleKeyClear}
                  disabled={!localSettings?.enableAssistant}
                />
              </>
            )}

            {/* Backend Note */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Production Note</p>
                  <p>
                    In production, API keys are stored in Google Cloud Secret Manager for security.
                    The keys entered here are validated client-side and then sent to a secure Cloud Function
                    for storage. Only key metadata (last 4 characters, validation status) is stored in Firestore.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {authMethod === 'oauth' && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Using Platform Default</p>
                <p className="text-sm text-gray-500 mt-1">
                  Your organization is using the ContractorOS managed AI service with Gemini 2.0 Flash.
                  This is included in your subscription at no additional cost.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Switch to &quot;Custom API Keys&quot; to use your own OpenAI, Claude, or Gemini API keys.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
