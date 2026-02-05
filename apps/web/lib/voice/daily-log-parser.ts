/**
 * Voice Daily Log Parser
 *
 * Parses dictated end-of-day summaries into structured daily log data.
 * Example: "Today was sunny and 75 degrees. We had 5 crew members. Completed framing
 * on the second floor. Had an issue with material delivery being late."
 */

import type { DailyLogCategory, DailyLogEntry, WeatherCondition } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedDailyLog {
  date: string;
  category: DailyLogCategory;
  title: string;
  description: string;
  weather?: {
    condition: WeatherCondition;
    temperatureHigh?: number;
    temperatureLow?: number;
    notes?: string;
  };
  crewCount?: number;
  crewMembers?: string[];
  hoursWorked?: number;
  workPerformed?: string[];
  issues?: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high';
    resolved: boolean;
  }>;
  materials?: Array<{
    name: string;
    quantity?: number;
    notes?: string;
  }>;
  safetyNotes?: string;
  clientNotes?: string;
  confidence: number;
  rawTranscript: string;
  warnings?: string[];
}

export interface DailyLogParseResult {
  success: boolean;
  data?: ParsedDailyLog;
  error?: string;
  suggestions?: string[];
}

export interface DailyLogParserContext {
  projectId: string;
  projectName: string;
  date?: string;
  previousLogs?: Array<Pick<DailyLogEntry, 'crewCount' | 'weather'>>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Weather condition mappings (matches WeatherCondition type)
const WEATHER_KEYWORDS: Record<WeatherCondition, string[]> = {
  clear: ['sunny', 'sun', 'clear', 'bright', 'beautiful', 'nice'],
  partly_cloudy: ['partly cloudy', 'partly sunny', 'some clouds', 'scattered clouds'],
  cloudy: ['cloudy', 'overcast', 'gray', 'grey', 'clouds', 'foggy', 'fog', 'misty', 'hazy'],
  rain: ['rainy', 'rain', 'raining', 'wet', 'drizzle', 'drizzling', 'showers', 'light rain'],
  heavy_rain: ['heavy rain', 'downpour', 'pouring', 'flooding'],
  snow: ['snowy', 'snow', 'snowing', 'flurries', 'blizzard'],
  storm: ['stormy', 'storm', 'thunder', 'thunderstorm', 'lightning', 'severe weather'],
  wind: ['windy', 'wind', 'breezy', 'gusty', 'gusts', 'high winds'],
  extreme_heat: ['hot', 'scorching', 'heat wave', 'sweltering', 'extreme heat'],
  extreme_cold: ['cold', 'freezing', 'frigid', 'chilly', 'extreme cold', 'bitter cold'],
};

// Category detection keywords
const CATEGORY_KEYWORDS: Record<DailyLogCategory, string[]> = {
  general: ['general', 'normal', 'standard', 'regular', 'typical'],
  progress: ['progress', 'completed', 'finished', 'done', 'accomplished', 'worked on', 'installed', 'built'],
  issue: ['issue', 'problem', 'trouble', 'difficulty', 'challenge', 'delayed', 'broken', 'failed'],
  safety: ['safety', 'injury', 'accident', 'hazard', 'dangerous', 'incident', 'near miss', 'safety meeting'],
  weather: ['weather', 'rain', 'storm', 'snow', 'heat', 'cold', 'wind', 'delay due to weather'],
  delivery: ['delivery', 'delivered', 'received', 'arrived', 'shipment', 'materials arrived', 'supplies'],
  inspection: ['inspection', 'inspector', 'inspected', 'passed', 'failed inspection', 'code', 'permit'],
  client_interaction: ['client', 'owner', 'homeowner', 'met with', 'walkthrough', 'discussed', 'customer'],
  subcontractor: ['subcontractor', 'sub', 'electrician', 'plumber', 'hvac', 'roofer', 'painter'],
  equipment: ['equipment', 'machine', 'tool', 'rental', 'crane', 'excavator', 'forklift', 'scaffolding'],
};

// Number words
const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  // Common misheard
  to: 2, too: 2, for: 4, won: 1,
};

// Issue severity keywords
const SEVERITY_KEYWORDS = {
  high: ['critical', 'serious', 'major', 'severe', 'urgent', 'emergency', 'stopped work', 'safety hazard'],
  medium: ['moderate', 'significant', 'delayed', 'problem', 'issue'],
  low: ['minor', 'small', 'slight', 'little', 'trivial'],
};

// Work activity keywords for parsing work performed
const WORK_ACTIVITIES = [
  'framing', 'drywall', 'electrical', 'plumbing', 'hvac', 'roofing',
  'flooring', 'painting', 'demolition', 'concrete', 'carpentry',
  'insulation', 'siding', 'landscaping', 'cleaning', 'trim',
  'cabinets', 'fixtures', 'windows', 'doors', 'foundation',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract numbers from text (both digits and words)
 */
function _extractNumber(text: string): number | null {
  const normalized = normalizeText(text);

  // Try digit pattern first
  const digitMatch = normalized.match(/\b(\d+)\b/);
  if (digitMatch) {
    return parseInt(digitMatch[1], 10);
  }

  // Try number words
  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (normalized.includes(word)) {
      return value;
    }
  }

  return null;
}

/**
 * Extract temperature from text
 */
function extractTemperature(text: string): number | null {
  const normalized = normalizeText(text);

  // Pattern: "75 degrees", "75°", "temperature of 75"
  const tempPatterns = [
    /(\d+)\s*(?:degrees?|°|deg)/i,
    /(?:temp(?:erature)?|it(?:'s| is| was)?)\s*(?:about|around)?\s*(\d+)/i,
    /(?:high|low)\s*(?:of|was|is)?\s*(\d+)/i,
  ];

  for (const pattern of tempPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const temp = parseInt(match[1] || match[2], 10);
      // Sanity check for reasonable temperatures
      if (temp >= -50 && temp <= 130) {
        return temp;
      }
    }
  }

  return null;
}

/**
 * Split text into sentences
 */
function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parse weather information from transcript
 */
function parseWeather(transcript: string): ParsedDailyLog['weather'] | undefined {
  const normalized = normalizeText(transcript);

  // Find weather condition
  let condition: WeatherCondition | undefined;
  let bestMatchLength = 0;

  for (const [weatherType, keywords] of Object.entries(WEATHER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword) && keyword.length > bestMatchLength) {
        condition = weatherType as WeatherCondition;
        bestMatchLength = keyword.length;
      }
    }
  }

  if (!condition) return undefined;

  // Extract temperature
  const temperature = extractTemperature(transcript);

  return {
    condition,
    temperatureHigh: temperature || undefined,
  };
}

/**
 * Parse crew information from transcript
 */
function parseCrewInfo(transcript: string): { crewCount?: number; crewMembers?: string[] } {
  const normalized = normalizeText(transcript);
  const result: { crewCount?: number; crewMembers?: string[] } = {};

  // Pattern: "5 crew members", "had 5 guys", "5 people on site"
  const crewPatterns = [
    /(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen)\s*(?:crew\s*members?|guys?|people|workers?|men|team\s*members?)/i,
    /(?:crew|team)\s*(?:of|was|is|had)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i,
    /(?:had|with|we had|there (?:were|was))\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:on site|working|today)?/i,
  ];

  for (const pattern of crewPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const numStr = match[1].toLowerCase();
      result.crewCount = NUMBER_WORDS[numStr] ?? parseInt(numStr, 10);
      break;
    }
  }

  // Try to extract names if mentioned
  const namePatterns = [
    /(?:including|with|were)\s+([A-Z][a-z]+(?:\s*(?:,|and)\s*[A-Z][a-z]+)*)/,
    /([A-Z][a-z]+(?:\s*(?:,|and)\s*[A-Z][a-z]+)+)\s+(?:were|worked)/,
  ];

  for (const pattern of namePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      const nameStr = match[1];
      result.crewMembers = nameStr
        .split(/,|and/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      break;
    }
  }

  return result;
}

/**
 * Parse work performed from transcript
 */
function parseWorkPerformed(transcript: string): string[] {
  const normalized = normalizeText(transcript);
  const sentences = splitSentences(transcript);
  const workItems: string[] = [];

  // Look for sentences containing work keywords
  const workIndicators = [
    'completed', 'finished', 'installed', 'worked on', 'started',
    'continued', 'done', 'built', 'framed', 'painted', 'hung',
  ];

  for (const sentence of sentences) {
    const sentenceNorm = normalizeText(sentence);
    const hasWorkIndicator = workIndicators.some((w) => sentenceNorm.includes(w));
    const hasActivity = WORK_ACTIVITIES.some((a) => sentenceNorm.includes(a));

    if (hasWorkIndicator || hasActivity) {
      // Clean up the sentence for the work item
      let workItem = sentence
        .replace(/^(?:we|they|team|crew)\s+/i, '')
        .replace(/^(?:today|this morning|this afternoon)\s*,?\s*/i, '')
        .trim();

      if (workItem.length > 0) {
        workItems.push(workItem);
      }
    }
  }

  // If no work items found, check for activity keywords mentioned
  if (workItems.length === 0) {
    for (const activity of WORK_ACTIVITIES) {
      if (normalized.includes(activity)) {
        workItems.push(`Worked on ${activity}`);
      }
    }
  }

  return workItems;
}

/**
 * Parse issues from transcript
 */
function parseIssues(transcript: string): ParsedDailyLog['issues'] {
  const sentences = splitSentences(transcript);
  const issues: ParsedDailyLog['issues'] = [];

  const issueIndicators = [
    'issue', 'problem', 'trouble', 'delay', 'challenge', 'difficulty',
    'broken', 'failed', 'late', 'missing', 'wrong', 'damaged',
  ];

  for (const sentence of sentences) {
    const sentenceNorm = normalizeText(sentence);
    const hasIssueIndicator = issueIndicators.some((i) => sentenceNorm.includes(i));

    if (hasIssueIndicator) {
      // Determine severity
      let severity: 'low' | 'medium' | 'high' = 'medium';

      for (const [sev, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
        if (keywords.some((k) => sentenceNorm.includes(k))) {
          severity = sev as 'low' | 'medium' | 'high';
          break;
        }
      }

      // Check if resolved
      const resolvedKeywords = ['resolved', 'fixed', 'solved', 'handled', 'taken care of'];
      const resolved = resolvedKeywords.some((r) => sentenceNorm.includes(r));

      issues.push({
        description: sentence.trim(),
        severity,
        resolved,
      });
    }
  }

  return issues.length > 0 ? issues : undefined;
}

/**
 * Determine the primary category of the log
 */
function determineCategory(
  transcript: string,
  issues?: ParsedDailyLog['issues'],
  weather?: ParsedDailyLog['weather']
): DailyLogCategory {
  const normalized = normalizeText(transcript);

  // Score each category
  const scores: Record<DailyLogCategory, number> = {
    general: 0,
    progress: 0,
    issue: 0,
    safety: 0,
    weather: 0,
    delivery: 0,
    inspection: 0,
    client_interaction: 0,
    subcontractor: 0,
    equipment: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        scores[category as DailyLogCategory] += keyword.length;
      }
    }
  }

  // Boost scores based on parsed content
  if (issues && issues.length > 0) {
    const hasSafetyIssue = issues.some((i) =>
      normalizeText(i.description).match(/safety|injury|accident|hazard/)
    );
    if (hasSafetyIssue) {
      scores.safety += 20;
    } else {
      scores.issue += 10;
    }
  }

  if (weather && scores.weather < 10) {
    scores.weather += 5;
  }

  // Find highest scoring category
  let maxScore = 0;
  let bestCategory: DailyLogCategory = 'progress'; // Default

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category as DailyLogCategory;
    }
  }

  // If no clear category, default to progress for work-related content
  if (maxScore < 3) {
    const hasWorkContent = WORK_ACTIVITIES.some((a) => normalized.includes(a));
    return hasWorkContent ? 'progress' : 'general';
  }

  return bestCategory;
}

/**
 * Generate title from transcript
 */
function generateTitle(
  transcript: string,
  category: DailyLogCategory,
  workPerformed?: string[]
): string {
  const sentences = splitSentences(transcript);

  // Try to use first sentence if it's short enough
  if (sentences[0] && sentences[0].length <= 80) {
    return sentences[0];
  }

  // Generate title based on category and work
  const categoryLabels: Record<DailyLogCategory, string> = {
    general: 'Daily Update',
    progress: 'Progress Update',
    issue: 'Issue Report',
    safety: 'Safety Report',
    weather: 'Weather Update',
    delivery: 'Delivery Log',
    inspection: 'Inspection Report',
    client_interaction: 'Client Meeting',
    subcontractor: 'Subcontractor Update',
    equipment: 'Equipment Log',
  };

  if (workPerformed && workPerformed.length > 0) {
    // Extract key activity
    const firstWork = workPerformed[0];
    for (const activity of WORK_ACTIVITIES) {
      if (normalizeText(firstWork).includes(activity)) {
        return `${activity.charAt(0).toUpperCase() + activity.slice(1)} ${categoryLabels[category]}`;
      }
    }
  }

  return categoryLabels[category];
}

// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Parse a voice transcript into daily log data
 */
export function parseDailyLogVoice(
  transcript: string,
  context: DailyLogParserContext
): DailyLogParseResult {
  if (!transcript?.trim()) {
    return {
      success: false,
      error: 'No transcript provided',
    };
  }

  const warnings: string[] = [];

  // Parse weather
  const weather = parseWeather(transcript);

  // Parse crew info
  const crewInfo = parseCrewInfo(transcript);

  // Parse work performed
  const workPerformed = parseWorkPerformed(transcript);

  // Parse issues
  const issues = parseIssues(transcript);

  // Determine category
  const category = determineCategory(transcript, issues, weather);

  // Generate title
  const title = generateTitle(transcript, category, workPerformed);

  // Calculate confidence
  let confidence = 0.5; // Base confidence
  if (weather) confidence += 0.1;
  if (crewInfo.crewCount) confidence += 0.1;
  if (workPerformed.length > 0) confidence += 0.15;
  if (issues && issues.length > 0) confidence += 0.1;
  confidence = Math.min(confidence, 0.95);

  // Add warnings
  if (!weather) {
    warnings.push('No weather information detected. Consider adding weather conditions.');
  }
  if (!crewInfo.crewCount) {
    warnings.push('No crew count detected. You may want to add crew information.');
  }
  if (workPerformed.length === 0) {
    warnings.push('No specific work activities detected.');
  }

  return {
    success: true,
    data: {
      date: context.date || new Date().toISOString().split('T')[0],
      category,
      title,
      description: transcript.trim(),
      weather,
      crewCount: crewInfo.crewCount,
      crewMembers: crewInfo.crewMembers,
      workPerformed: workPerformed.length > 0 ? workPerformed : undefined,
      issues,
      confidence: Math.round(confidence * 100) / 100,
      rawTranscript: transcript,
      warnings: warnings.length > 0 ? warnings : undefined,
    },
  };
}

/**
 * Get suggestions for improving voice commands
 */
export function getDailyLogSuggestions(): string[] {
  return [
    'Mention the weather conditions (sunny, rainy, etc.)',
    'Include crew count, like "we had 5 crew members"',
    'Describe work completed, like "finished framing on the second floor"',
    'Note any issues or delays encountered',
    'Include material deliveries if applicable',
  ];
}

/**
 * Example daily log voice commands
 */
export const EXAMPLE_DAILY_LOG_COMMANDS = [
  'Today was sunny and 75 degrees. We had 5 crew members on site. Completed framing on the second floor and started rough electrical.',
  'Weather was rainy so we focused on interior work. 3 guys on site. Finished drywall in the master bedroom. Material delivery was delayed until tomorrow.',
  'Clear skies, 68 degrees. Team of 4 worked on exterior siding. Had an issue with some damaged materials that needed replacement.',
  'Inspection day. Inspector passed the electrical rough-in. Crew of 6 continued with plumbing installation.',
];

export default parseDailyLogVoice;
