/**
 * Text-to-Speech Service
 * Uses the Web Speech API for browser-native TTS functionality
 */

export interface TTSOptions {
  voiceURI?: string;
  rate?: number;        // 0.5 - 2.0
  pitch?: number;       // 0 - 2
  volume?: number;      // 0 - 1
}

export interface TTSVoice {
  voiceURI: string;
  name: string;
  lang: string;
  default: boolean;
}

// Default TTS settings
const DEFAULT_OPTIONS: Required<TTSOptions> = {
  voiceURI: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

// Speech queue for managing long responses
let speechQueue: string[] = [];
let isProcessingQueue = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Check if TTS is supported in the current browser
 */
export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Get available voices from the browser
 * Note: Voices may not be immediately available, so this should be called after voiceschanged event
 */
export function getAvailableVoices(): TTSVoice[] {
  if (!isTTSSupported()) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices();
  return voices.map((voice) => ({
    voiceURI: voice.voiceURI,
    name: voice.name,
    lang: voice.lang,
    default: voice.default,
  }));
}

/**
 * Get English voices (filtered for better UX)
 */
export function getEnglishVoices(): TTSVoice[] {
  return getAvailableVoices().filter(
    (voice) => voice.lang.startsWith('en')
  );
}

/**
 * Initialize voices and return them via a Promise
 * Handles the async nature of voice loading in some browsers
 */
export function loadVoices(): Promise<TTSVoice[]> {
  return new Promise((resolve) => {
    if (!isTTSSupported()) {
      resolve([]);
      return;
    }

    const voices = getAvailableVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Voices not loaded yet, wait for the event
    const handleVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(getAvailableVoices());
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // Timeout fallback in case voiceschanged never fires
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(getAvailableVoices());
    }, 1000);
  });
}

/**
 * Find a voice by URI or return the default voice
 */
function findVoice(voiceURI?: string): SpeechSynthesisVoice | null {
  if (!isTTSSupported()) return null;

  const voices = window.speechSynthesis.getVoices();

  if (voiceURI) {
    const voice = voices.find((v) => v.voiceURI === voiceURI);
    if (voice) return voice;
  }

  // Try to find a good default English voice
  const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
  const defaultVoice = englishVoices.find((v) => v.default);
  if (defaultVoice) return defaultVoice;

  // Prefer voices with "natural" or "enhanced" in the name
  const enhancedVoice = englishVoices.find(
    (v) => v.name.toLowerCase().includes('natural') ||
           v.name.toLowerCase().includes('enhanced') ||
           v.name.toLowerCase().includes('premium')
  );
  if (enhancedVoice) return enhancedVoice;

  return englishVoices[0] || voices[0] || null;
}

/**
 * Split text into smaller chunks for better handling
 * This helps with long responses that might exceed browser limits
 */
function chunkText(text: string, maxLength: number = 200): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // If a single sentence is too long, split it further
      if (sentence.length > maxLength) {
        const words = sentence.split(' ');
        currentChunk = '';
        for (const word of words) {
          if (currentChunk.length + word.length + 1 <= maxLength) {
            currentChunk += (currentChunk ? ' ' : '') + word;
          } else {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = word;
          }
        }
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Process the speech queue
 */
function processQueue(options: TTSOptions): void {
  if (!isTTSSupported() || isProcessingQueue || speechQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  const text = speechQueue.shift()!;

  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const voice = findVoice(mergedOptions.voiceURI);

  if (voice) {
    utterance.voice = voice;
  }

  utterance.rate = Math.max(0.5, Math.min(2.0, mergedOptions.rate));
  utterance.pitch = Math.max(0, Math.min(2, mergedOptions.pitch));
  utterance.volume = Math.max(0, Math.min(1, mergedOptions.volume));

  utterance.onend = () => {
    isProcessingQueue = false;
    currentUtterance = null;
    processQueue(options);
  };

  utterance.onerror = (event) => {
    console.error('[TTS] Speech error:', event.error);
    isProcessingQueue = false;
    currentUtterance = null;
    // Continue with next chunk on error
    processQueue(options);
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Speak the given text
 * Handles long text by chunking and queuing
 */
export function speak(text: string, options: TTSOptions = {}): void {
  if (!isTTSSupported()) {
    console.warn('[TTS] Speech synthesis not supported in this browser');
    return;
  }

  // Cancel any ongoing speech
  stop();

  // Clean up the text (remove markdown, etc.)
  const cleanText = text
    .replace(/\*\*/g, '')           // Remove bold
    .replace(/\*/g, '')             // Remove italic
    .replace(/`[^`]+`/g, '')        // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/#{1,6}\s/g, '')       // Remove headers
    .replace(/[-*+]\s/g, '')        // Remove list markers
    .replace(/\n+/g, ' ')           // Replace newlines with spaces
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .trim();

  if (!cleanText) {
    return;
  }

  // Chunk the text for better handling
  const chunks = chunkText(cleanText);
  speechQueue = [...chunks];

  // Start processing the queue
  processQueue(options);
}

/**
 * Stop all speech and clear the queue
 */
export function stop(): void {
  if (!isTTSSupported()) return;

  speechQueue = [];
  isProcessingQueue = false;
  currentUtterance = null;
  window.speechSynthesis.cancel();
}

/**
 * Pause speech
 */
export function pause(): void {
  if (!isTTSSupported()) return;
  window.speechSynthesis.pause();
}

/**
 * Resume speech
 */
export function resume(): void {
  if (!isTTSSupported()) return;
  window.speechSynthesis.resume();
}

/**
 * Check if speech is currently active
 */
export function isSpeaking(): boolean {
  if (!isTTSSupported()) return false;
  return window.speechSynthesis.speaking;
}

/**
 * Check if speech is paused
 */
export function isPaused(): boolean {
  if (!isTTSSupported()) return false;
  return window.speechSynthesis.paused;
}

/**
 * Check if there are items in the queue
 */
export function hasQueuedSpeech(): boolean {
  return speechQueue.length > 0 || isProcessingQueue;
}

// TTS Service singleton for use with React hooks
export const ttsService = {
  isTTSSupported,
  getAvailableVoices,
  getEnglishVoices,
  loadVoices,
  speak,
  stop,
  pause,
  resume,
  isSpeaking,
  isPaused,
  hasQueuedSpeech,
};

export default ttsService;
