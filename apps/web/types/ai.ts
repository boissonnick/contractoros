// ============================================
// AI Types
// AI Assistant, Voice Logs, AI Settings
// Extracted from types/index.ts
// ============================================

// ============================================
// AI Model Types
// ============================================

/**
 * AI Model provider options
 */
export type AIModelProvider = 'gemini' | 'claude' | 'openai';

/**
 * Subscription tier that determines available AI features
 */
export type AIModelTier = 'free' | 'pro' | 'enterprise';
export type AIResponseStyle = 'concise' | 'detailed' | 'technical';

/**
 * Content filter strictness level
 */
export type AIContentFilterLevel = 'strict' | 'balanced' | 'permissive';

/**
 * Supported AI provider types
 */
export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'ollama';

/**
 * OAuth connection status
 */
export type AIProviderConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error';

// ============================================
// Organization AI Settings
// ============================================

/**
 * Organization-level AI settings stored in Firestore
 * Path: organizations/{orgId}/settings/ai
 */
export interface OrganizationAISettings {
  orgId: string;

  // Model selection
  selectedModel: string;           // Model key (e.g., 'gemini-2.0-flash')
  allowedModels: string[];         // Models this org can use based on tier

  // API Key status (keys stored in GCP Secret Manager, not Firestore)
  hasCustomGeminiKey: boolean;
  hasCustomClaudeKey: boolean;
  hasCustomOpenAIKey: boolean;

  // Usage limits
  tier: AIModelTier;
  dailyRequestLimit: number;
  dailyTokenLimit: number;
  dailyCostLimit: number;          // Max cost per day in USD

  // Feature flags
  enableAssistant: boolean;        // Master toggle for AI assistant
  enableVoiceInput: boolean;       // Allow voice input
  enableStreaming: boolean;        // Stream responses
  enableIntelligence: boolean;     // AI-powered insights (pricing, etc.)

  // Response style
  responseStyle: AIResponseStyle;  // concise, detailed, or technical

  // Text-to-speech settings
  enableTTS: boolean;              // Enable text-to-speech for responses
  ttsVoiceURI: string;             // Selected voice URI
  ttsRate: number;                 // Speech rate (0.5 - 2.0)
  ttsAutoSpeak: boolean;           // Automatically speak AI responses

  // Safety settings
  contentFilterLevel: AIContentFilterLevel;
  logPrompts: boolean;             // Log prompts for debugging/audit
  blockExternalUrls: boolean;      // Block responses containing external URLs

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default AI settings for new organizations
 */
export const DEFAULT_AI_SETTINGS: Omit<OrganizationAISettings, 'orgId' | 'createdAt' | 'updatedAt'> = {
  selectedModel: 'gemini-2.0-flash',
  allowedModels: ['gemini-2.0-flash'],
  hasCustomGeminiKey: false,
  hasCustomClaudeKey: false,
  hasCustomOpenAIKey: false,
  tier: 'free',
  dailyRequestLimit: 200,
  dailyTokenLimit: 100000,
  dailyCostLimit: 0,
  enableAssistant: true,
  enableVoiceInput: true,
  enableStreaming: true,
  enableIntelligence: true,
  responseStyle: 'detailed',
  enableTTS: false,
  ttsVoiceURI: '',
  ttsRate: 1.0,
  ttsAutoSpeak: false,
  contentFilterLevel: 'balanced',
  logPrompts: false,
  blockExternalUrls: true,
};

// ============================================
// AI Provider Configuration
// ============================================

/**
 * Individual AI provider configuration
 * Path: organizations/{orgId}/aiProviders/{provider}
 */
export interface AIProviderConfig {
  id: string;
  orgId: string;
  provider: AIProviderType;
  connected: boolean;
  connectionStatus: AIProviderConnectionStatus;
  connectionDate?: Date;
  lastUsedAt?: Date;

  // For cloud providers (OpenAI, Anthropic, Google)
  // API keys stored encrypted or reference to secret manager
  hasApiKey: boolean;
  apiKeyLastFour?: string;  // Last 4 characters for display

  // For local providers (Ollama)
  localUrl?: string;        // e.g., 'http://localhost:11434'
  isLocalProvider: boolean;

  // Model selection
  defaultModelId?: string;
  availableModels?: string[];

  // Usage tracking
  totalRequests?: number;
  totalTokens?: number;
  lastError?: string;
  lastErrorAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/**
 * OAuth state for tracking authorization flow
 */
export interface AIProviderOAuthState {
  provider: AIProviderType;
  state: string;           // CSRF protection token
  codeVerifier?: string;   // PKCE code verifier
  redirectUri: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Display configuration for provider cards
 */
export interface AIProviderDisplayInfo {
  provider: AIProviderType;
  name: string;
  description: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  website: string;
  documentationUrl: string;
  supportsOAuth: boolean;
  features: string[];
}

/**
 * Provider validation result
 */
export interface AIProviderValidationResult {
  valid: boolean;
  provider: AIProviderType;
  message: string;
  models?: string[];
  error?: string;
}

// ============================================
// Voice Log Types
// ============================================

/**
 * Voice log processing status
 */
export type VoiceLogStatus =
  | 'queued'           // In local IndexedDB, waiting for upload
  | 'uploading'        // Currently uploading to server
  | 'uploaded'         // Audio uploaded, waiting for processing
  | 'processing'       // AI processing in progress
  | 'completed'        // Successfully processed
  | 'failed'           // Processing failed (retryable)
  | 'error';           // Permanent error (not retryable)

/**
 * Work event types that can be extracted from voice logs
 */
export type WorkEventType =
  | 'arrival'          // Arrived at site
  | 'departure'        // Left site
  | 'break_start'      // Started break
  | 'break_end'        // Ended break
  | 'task_start'       // Started a task
  | 'task_complete'    // Completed a task
  | 'task_progress'    // Made progress on task
  | 'issue_found'      // Found a problem/issue
  | 'issue_resolved'   // Fixed a problem
  | 'material_used'    // Used materials
  | 'material_needed'  // Need materials
  | 'weather_delay'    // Weather-related delay
  | 'equipment_issue'  // Equipment problem
  | 'safety_concern'   // Safety issue noted
  | 'coordination'     // Coordinated with others
  | 'inspection'       // Inspection performed
  | 'photo_taken'      // Photo was taken
  | 'other';           // Other event

/**
 * Confidence level for AI-extracted data
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * A single segment of the transcript with timing
 */
export interface TranscriptSegment {
  text: string;
  startTime: number;    // Seconds from start
  endTime: number;
  confidence: number;   // 0-1
  speaker?: string;     // If speaker diarization is available
}

/**
 * Full transcript data from audio processing
 */
export interface TranscriptData {
  fullText: string;
  segments: TranscriptSegment[];
  language: string;           // Detected language code
  durationSeconds: number;
  wordCount: number;
}

/**
 * A work event extracted from the voice log
 */
export interface WorkEvent {
  id: string;
  type: WorkEventType;
  description: string;
  timestamp?: Date;           // When this happened (if mentioned)
  duration?: number;          // Duration in minutes (if applicable)
  confidence: ConfidenceLevel;
  sourceText: string;         // The original text this was extracted from
  metadata?: {
    taskId?: string;
    projectId?: string;
    phaseId?: string;
    materials?: string[];
    quantities?: Record<string, number>;
    personnelMentioned?: string[];
    equipmentMentioned?: string[];
  };
}

/**
 * A match between extracted work and a scheduled task
 */
export interface TaskMatch {
  eventId: string;            // ID of the WorkEvent this matches
  taskId: string;
  taskName: string;
  projectId: string;
  projectName: string;
  phaseId?: string;
  phaseName?: string;
  matchConfidence: ConfidenceLevel;
  matchReason: string;        // Why this was matched
  suggestedTimeEntry?: {
    hours: number;
    notes: string;
  };
}

/**
 * Summary generated from voice log
 */
export interface VoiceLogSummary {
  bullets: string[];          // 2-6 bullet points
  blockers: string[];         // Any blockers mentioned
  nextSteps: string[];        // Planned next steps
  mood?: 'positive' | 'neutral' | 'frustrated' | 'concerned';
  weatherMentioned?: string;
  hoursWorked?: number;       // Total hours if mentioned
}

/**
 * AI processing metadata
 */
export interface VoiceLogProcessingMeta {
  provider: string;           // 'gemini', 'openai', 'whisper', etc.
  model: string;              // Model version used
  processingTimeMs: number;
  tokensUsed?: number;
  costEstimate?: number;      // Estimated cost in USD
  retryCount: number;
  lastError?: string;
}

/**
 * Main VoiceLog document stored in Firestore
 */
export interface VoiceLog {
  id: string;
  orgId: string;
  userId: string;
  userName: string;

  // Recording metadata
  recordedAt: Date;
  durationSeconds: number;
  fileSizeBytes: number;
  mimeType: string;           // 'audio/webm', 'audio/mp4', etc.
  audioUrl?: string;          // Signed URL to audio file (expires)

  // Optional typed summary from user
  userSummary?: string;

  // Processing status
  status: VoiceLogStatus;
  statusMessage?: string;
  uploadedAt?: Date;
  processedAt?: Date;

  // Processing results (populated when status = 'completed')
  transcript?: TranscriptData;
  events?: WorkEvent[];
  taskMatches?: TaskMatch[];
  summary?: VoiceLogSummary;

  // Context at time of recording
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
    address?: string;
  };
  projectContext?: {
    projectId: string;
    projectName: string;
    phaseId?: string;
    phaseName?: string;
  };

  // Processing metadata
  processingMeta?: VoiceLogProcessingMeta;

  // Idempotency
  contentHash: string;        // SHA256 of audio + userId + timestamp

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * VoiceLog create payload (for API)
 */
export type VoiceLogCreate = Omit<VoiceLog,
  | 'id'
  | 'audioUrl'
  | 'uploadedAt'
  | 'processedAt'
  | 'transcript'
  | 'events'
  | 'taskMatches'
  | 'summary'
  | 'processingMeta'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Item stored in IndexedDB for offline queue
 */
export interface VoiceLogQueueItem {
  id: string;                 // Local UUID
  audioBlob: Blob;            // The actual audio data
  metadata: VoiceLogCreate;
  queuedAt: Date;
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'uploading' | 'failed';
}

/**
 * Voice log provider configuration (stored in org settings)
 */
export interface VoiceLogProviderConfig {
  provider: 'gemini' | 'openai' | 'whisper' | 'azure';
  model?: string;             // Model version (defaults to provider default)
  apiKey?: string;            // Encrypted API key for BYO credentials
  useVertexAI?: boolean;      // Use Vertex AI (GCP-managed) vs direct API
  maxDurationMinutes: number; // Max recording duration (default 10)
  dailyLimitPerUser: number;  // Max logs per user per day
  dailyLimitPerOrg: number;   // Max logs per org per day
  retentionDays: number;      // How long to keep audio files
}

// ============================================
// Voice Command Types
// ============================================

export type VoiceCommandCategory =
  | 'navigation'
  | 'time_tracking'
  | 'task_management'
  | 'reporting'
  | 'search'
  | 'settings'
  | 'communication';

export type VoiceCommandConfidence = 'high' | 'medium' | 'low';

export interface VoiceCommand {
  id: string;
  category: VoiceCommandCategory;
  pattern: string;            // Regex pattern or keyword
  action: string;             // Action to execute
  description: string;        // Human-readable description
  examples: string[];         // Example phrases
  requiresConfirmation: boolean;
  isEnabled: boolean;
}

export interface VoiceCommandResult {
  success: boolean;
  command: string;
  action?: string;
  confidence: VoiceCommandConfidence;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
}

// ============================================
// AI Provider Display Info Constants
// ============================================

export const AI_PROVIDER_INFO: Record<AIProviderType, AIProviderDisplayInfo> = {
  openai: {
    provider: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o and GPT-4o Mini for advanced language understanding and generation.',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    website: 'https://openai.com',
    documentationUrl: 'https://platform.openai.com/docs',
    supportsOAuth: false,
    features: ['GPT-4o', 'GPT-4o Mini', 'Vision', 'Function calling'],
  },
  anthropic: {
    provider: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude Sonnet for thoughtful, nuanced responses with strong reasoning.',
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    website: 'https://anthropic.com',
    documentationUrl: 'https://docs.anthropic.com',
    supportsOAuth: false,
    features: ['Claude Sonnet', 'Long context', 'Vision', 'Safe outputs'],
  },
  google: {
    provider: 'google',
    name: 'Google Gemini',
    description: 'Gemini 2.0 Flash for fast, multimodal AI with 1M token context.',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    website: 'https://ai.google.dev',
    documentationUrl: 'https://ai.google.dev/docs',
    supportsOAuth: false,
    features: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro', '1M context', 'Vision'],
  },
  ollama: {
    provider: 'ollama',
    name: 'Ollama (Local)',
    description: 'Run open-source models locally for complete data privacy.',
    iconColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    website: 'https://ollama.ai',
    documentationUrl: 'https://github.com/ollama/ollama',
    supportsOAuth: false,
    features: ['Local execution', 'Privacy', 'No API costs', 'Custom models'],
  },
};

// ============================================
// Voice Log Status Labels
// ============================================

export const VOICE_LOG_STATUS_LABELS: Record<VoiceLogStatus, string> = {
  queued: 'Queued',
  uploading: 'Uploading',
  uploaded: 'Processing',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  error: 'Error',
};

export const WORK_EVENT_TYPE_LABELS: Record<WorkEventType, string> = {
  arrival: 'Arrived',
  departure: 'Departed',
  break_start: 'Break Started',
  break_end: 'Break Ended',
  task_start: 'Task Started',
  task_complete: 'Task Completed',
  task_progress: 'Task Progress',
  issue_found: 'Issue Found',
  issue_resolved: 'Issue Resolved',
  material_used: 'Material Used',
  material_needed: 'Material Needed',
  weather_delay: 'Weather Delay',
  equipment_issue: 'Equipment Issue',
  safety_concern: 'Safety Concern',
  coordination: 'Coordination',
  inspection: 'Inspection',
  photo_taken: 'Photo Taken',
  other: 'Other',
};
