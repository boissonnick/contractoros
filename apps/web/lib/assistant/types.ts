/**
 * ContractorOS AI Assistant Types
 *
 * Type definitions for the AI chat assistant including messages,
 * context, voice input, and quick actions.
 */

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Role of a chat message participant
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Status of a message
 */
export type MessageStatus = 'sending' | 'sent' | 'error' | 'streaming';

/**
 * Chat message in the conversation
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  metadata?: MessageMetadata;
}

/**
 * Additional metadata attached to messages
 */
export interface MessageMetadata {
  /** Data sources cited in the response */
  sources?: DataSource[];
  /** Quick actions suggested by the assistant */
  suggestedActions?: QuickAction[];
  /** Whether this message used voice input */
  isVoiceInput?: boolean;
  /** Processing time in ms */
  processingTimeMs?: number;
  /** Token usage */
  tokenUsage?: {
    input: number;
    output: number;
  };
}

/**
 * Data source cited in a response
 */
export interface DataSource {
  type: 'material_price' | 'labor_rate' | 'market_benchmark' | 'project_data' | 'estimate_data';
  label: string;
  timestamp?: Date;
  confidence?: 'high' | 'medium' | 'low';
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Context provided to the assistant for each request
 */
export interface AssistantContext {
  /** User's organization info */
  organization: OrganizationContext;
  /** Current user info */
  user: UserContext;
  /** Active project being viewed (if any) */
  activeProject?: ProjectContext;
  /** Active estimate being edited (if any) */
  activeEstimate?: EstimateContext;
  /** Recent activity for context */
  recentActivity?: ActivityContext;
  /** Current page/route context */
  currentPage?: PageContext;
}

export interface OrganizationContext {
  orgId: string;
  name: string;
  location?: {
    city?: string;
    state?: string;
    zipCode?: string;
  };
  primaryTrades?: string[];
}

export interface UserContext {
  userId: string;
  displayName: string;
  role: string;
  preferences?: {
    preferredUnits?: 'imperial' | 'metric';
    timeZone?: string;
  };
}

export interface ProjectContext {
  projectId: string;
  name: string;
  type: string;
  status: string;
  client?: {
    name: string;
  };
  address?: {
    city?: string;
    state?: string;
  };
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  phases?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

export interface EstimateContext {
  estimateId: string;
  name: string;
  totalAmount: number;
  lineItemCount: number;
  status: string;
  projectType?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface ActivityContext {
  recentProjects: Array<{
    id: string;
    name: string;
    lastAccessed: Date;
  }>;
  recentEstimates: Array<{
    id: string;
    name: string;
    lastModified: Date;
  }>;
  pendingTasks?: number;
  overdueInvoices?: number;
}

export interface PageContext {
  route: string;
  pageName: string;
  params?: Record<string, string>;
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

/**
 * Quick action that can be triggered from the assistant
 */
export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  type: QuickActionType;
  payload?: Record<string, unknown>;
}

export type QuickActionType =
  | 'pricing_query'      // Ask about pricing
  | 'create_estimate'    // Create new estimate
  | 'schedule_event'     // Schedule something
  | 'send_message'       // Send a message
  | 'log_time'           // Log time entry
  | 'take_photo'         // Open camera
  | 'view_report'        // View a report
  | 'navigate'           // Navigate to a page
  | 'custom';            // Custom action

/**
 * Predefined quick actions
 */
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'pricing',
    label: 'Check pricing',
    description: 'What should I charge for...?',
    type: 'pricing_query',
    icon: 'CurrencyDollarIcon',
  },
  {
    id: 'estimate',
    label: 'Create estimate',
    description: 'Help me create an estimate',
    type: 'create_estimate',
    icon: 'DocumentTextIcon',
  },
  {
    id: 'trends',
    label: 'Price trends',
    description: 'Show material price trends',
    type: 'view_report',
    icon: 'ChartBarIcon',
    payload: { reportType: 'material_prices' },
  },
  {
    id: 'schedule',
    label: 'Schedule',
    description: "What's on my schedule?",
    type: 'schedule_event',
    icon: 'CalendarIcon',
  },
];

// ============================================================================
// VOICE TYPES
// ============================================================================

/**
 * Voice input state
 */
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

/**
 * Voice input configuration
 */
export interface VoiceConfig {
  /** Language for speech recognition */
  language: string;
  /** Enable continuous listening */
  continuous: boolean;
  /** Interim results during speech */
  interimResults: boolean;
  /** Enable text-to-speech for responses */
  enableTTS: boolean;
  /** TTS voice name */
  ttsVoice?: string;
}

/**
 * Default voice configuration
 */
export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  language: 'en-US',
  continuous: false,
  interimResults: true,
  enableTTS: true,
};

/**
 * Speech recognition result
 */
export interface SpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

// ============================================================================
// ASSISTANT STATE
// ============================================================================

/**
 * Overall assistant state
 */
export interface AssistantState {
  /** Whether the assistant panel is open */
  isOpen: boolean;
  /** Current conversation messages */
  messages: ChatMessage[];
  /** Whether assistant is processing a request */
  isProcessing: boolean;
  /** Current voice state */
  voiceState: VoiceState;
  /** Error message if any */
  error?: string;
  /** Voice configuration */
  voiceConfig: VoiceConfig;
}

/**
 * Initial assistant state
 */
export const INITIAL_ASSISTANT_STATE: AssistantState = {
  isOpen: false,
  messages: [],
  isProcessing: false,
  voiceState: 'idle',
  voiceConfig: DEFAULT_VOICE_CONFIG,
};

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Request to the assistant API
 */
export interface AssistantRequest {
  message: string;
  context: AssistantContext;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  options?: {
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
  };
}

/**
 * Response from the assistant API
 */
export interface AssistantResponse {
  message: string;
  sources?: DataSource[];
  suggestedActions?: QuickAction[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Streaming chunk from the assistant
 */
export interface StreamingChunk {
  type: 'text' | 'delta' | 'source' | 'action' | 'done' | 'error';
  content?: string;
  text?: string; // For delta chunks
  data?: unknown;
}

// ============================================================================
// SETTINGS
// ============================================================================

/**
 * User's assistant preferences
 */
export interface AssistantSettings {
  /** Enable the assistant */
  enabled: boolean;
  /** Show assistant FAB on all pages */
  showFab: boolean;
  /** Enable voice input */
  enableVoice: boolean;
  /** Enable TTS responses */
  enableTTS: boolean;
  /** Preferred response style */
  responseStyle: 'concise' | 'detailed';
  /** Keyboard shortcut to open assistant */
  shortcut?: string;
}

/**
 * Default assistant settings
 */
export const DEFAULT_ASSISTANT_SETTINGS: AssistantSettings = {
  enabled: true,
  showFab: true,
  enableVoice: true,
  enableTTS: false,
  responseStyle: 'concise',
  shortcut: 'mod+k',
};

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum messages to keep in history
 */
export const MAX_CONVERSATION_HISTORY = 20;

/**
 * Maximum tokens for context
 */
export const MAX_CONTEXT_TOKENS = 4000;

/**
 * Common pricing queries
 */
export const COMMON_PRICING_QUERIES = [
  'bathroom remodel',
  'kitchen remodel',
  'drywall installation',
  'flooring installation',
  'roof replacement',
  'deck construction',
  'electrical work',
  'plumbing',
  'painting',
  'window replacement',
];

/**
 * Assistant greeting messages
 */
export const GREETING_MESSAGES = [
  "Hi! I'm your ContractorOS assistant. How can I help you today?",
  "Hello! I can help with pricing, estimates, and project questions. What do you need?",
  "Hey there! Ask me about material prices, labor rates, or help creating estimates.",
];

// ============================================================================
// DOCUMENT ANALYSIS TYPES
// ============================================================================

/**
 * Supported document types for upload
 */
export type DocumentType = 'pdf' | 'docx' | 'image' | 'spreadsheet';

/**
 * Status of document analysis
 */
export type DocumentAnalysisStatus = 'uploading' | 'analyzing' | 'complete' | 'error';

/**
 * Result of AI document analysis
 */
export interface DocumentAnalysis {
  id: string;
  fileName: string;
  fileType: DocumentType;
  fileSize: number;
  thumbnailUrl?: string;
  status: DocumentAnalysisStatus;
  uploadedAt: Date;
  /** Extracted text summary */
  summary?: string;
  /** Key data points extracted */
  extractedData?: ExtractedDocumentData;
  /** Confidence score 0-1 */
  confidence?: number;
  /** Error message if analysis failed */
  error?: string;
}

/**
 * Data extracted from document analysis
 */
export interface ExtractedDocumentData {
  /** Document type detected (invoice, contract, spec sheet, etc.) */
  documentType?: string;
  /** Key dates found */
  dates?: Array<{
    label: string;
    value: Date | string;
  }>;
  /** Monetary amounts found */
  amounts?: Array<{
    label: string;
    value: number;
    currency?: string;
  }>;
  /** Contact information */
  contacts?: Array<{
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
  }>;
  /** Line items (for invoices/estimates) */
  lineItems?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
  /** Material specifications */
  materials?: Array<{
    name: string;
    specs?: string;
    quantity?: string;
  }>;
  /** General key-value pairs */
  fields?: Record<string, string>;
}

// ============================================================================
// PHOTO ANALYSIS TYPES
// ============================================================================

/**
 * Status of photo analysis
 */
export type PhotoAnalysisStatus = 'uploading' | 'analyzing' | 'complete' | 'error';

/**
 * Result of AI photo analysis
 */
export interface PhotoAnalysis {
  id: string;
  fileName: string;
  fileSize: number;
  thumbnailUrl?: string;
  fullUrl?: string;
  status: PhotoAnalysisStatus;
  uploadedAt: Date;
  /** AI-generated description of the photo */
  description?: string;
  /** Detected tags/categories */
  tags?: PhotoTag[];
  /** Detected issues or concerns */
  issues?: PhotoIssue[];
  /** Suggested project phase this relates to */
  suggestedPhase?: string;
  /** Confidence score 0-1 */
  confidence?: number;
  /** Error message if analysis failed */
  error?: string;
}

/**
 * Tag detected in a photo
 */
export interface PhotoTag {
  id: string;
  label: string;
  category: 'trade' | 'material' | 'phase' | 'issue' | 'location' | 'equipment';
  confidence: number;
}

/**
 * Issue detected in a photo
 */
export interface PhotoIssue {
  id: string;
  type: 'safety' | 'quality' | 'progress' | 'compliance';
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

/**
 * Common construction photo tags
 */
export const CONSTRUCTION_PHOTO_TAGS: PhotoTag[] = [
  { id: 'framing', label: 'Framing', category: 'trade', confidence: 1 },
  { id: 'electrical', label: 'Electrical', category: 'trade', confidence: 1 },
  { id: 'plumbing', label: 'Plumbing', category: 'trade', confidence: 1 },
  { id: 'hvac', label: 'HVAC', category: 'trade', confidence: 1 },
  { id: 'drywall', label: 'Drywall', category: 'trade', confidence: 1 },
  { id: 'flooring', label: 'Flooring', category: 'trade', confidence: 1 },
  { id: 'roofing', label: 'Roofing', category: 'trade', confidence: 1 },
  { id: 'concrete', label: 'Concrete', category: 'material', confidence: 1 },
  { id: 'lumber', label: 'Lumber', category: 'material', confidence: 1 },
  { id: 'insulation', label: 'Insulation', category: 'material', confidence: 1 },
  { id: 'exterior', label: 'Exterior', category: 'location', confidence: 1 },
  { id: 'interior', label: 'Interior', category: 'location', confidence: 1 },
  { id: 'foundation', label: 'Foundation', category: 'phase', confidence: 1 },
  { id: 'rough-in', label: 'Rough-In', category: 'phase', confidence: 1 },
  { id: 'finish', label: 'Finish Work', category: 'phase', confidence: 1 },
];

// ============================================================================
// PROACTIVE SUGGESTIONS TYPES
// ============================================================================

/**
 * Category of proactive suggestion
 */
export type SuggestionCategory = 'budget' | 'schedule' | 'safety' | 'quality' | 'general';

/**
 * Priority level of a suggestion
 */
export type SuggestionPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * A proactive suggestion from the AI
 */
export interface ProactiveSuggestion {
  id: string;
  category: SuggestionCategory;
  priority: SuggestionPriority;
  title: string;
  description: string;
  /** Link to relevant page */
  actionUrl?: string;
  /** Label for the action button */
  actionLabel?: string;
  /** When the suggestion was generated */
  createdAt: Date;
  /** Whether the user has seen this */
  isRead: boolean;
  /** Whether the user has dismissed this */
  isDismissed: boolean;
  /** Related entity */
  relatedEntity?: {
    type: 'project' | 'invoice' | 'task' | 'estimate' | 'client';
    id: string;
    name: string;
  };
}

/**
 * Category icons and colors for suggestions
 */
export const SUGGESTION_CATEGORY_CONFIG: Record<SuggestionCategory, {
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  budget: {
    icon: 'CurrencyDollarIcon',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  schedule: {
    icon: 'CalendarIcon',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  safety: {
    icon: 'ShieldExclamationIcon',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  quality: {
    icon: 'CheckBadgeIcon',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  general: {
    icon: 'LightBulbIcon',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
};

/**
 * Priority badge colors
 */
export const SUGGESTION_PRIORITY_CONFIG: Record<SuggestionPriority, {
  color: string;
  bgColor: string;
  label: string;
}> = {
  low: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Low' },
  medium: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Medium' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'High' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Critical' },
};
