/**
 * Voice Time Entry Parser
 *
 * Parses voice commands like "Log 4 hours framing at Smith house"
 * into structured time entry data.
 */

import type { Project } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedTimeEntry {
  hours: number;
  description: string;
  projectId?: string;
  projectName?: string;
  activityType?: string;
  confidence: number;
  rawTranscript: string;
  warnings?: string[];
}

export interface TimeEntryParseResult {
  success: boolean;
  data?: ParsedTimeEntry;
  error?: string;
  suggestions?: string[];
}

export interface TimeEntryParserContext {
  projects: Array<Pick<Project, 'id' | 'name' | 'status'>>;
  userId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Number word mappings
const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  // Common misheard
  to: 2,
  too: 2,
  for: 4,
  ate: 8,
  won: 1,
  tree: 3,
};

// Fraction words
const FRACTION_WORDS: Record<string, number> = {
  half: 0.5,
  'a half': 0.5,
  quarter: 0.25,
  'a quarter': 0.25,
  third: 0.333,
  'a third': 0.333,
};

// Activity type keywords
const ACTIVITY_KEYWORDS: Record<string, string[]> = {
  framing: ['framing', 'frame', 'framed', 'frames', 'studs', 'walls'],
  drywall: ['drywall', 'dry wall', 'sheetrock', 'gypsum', 'plaster'],
  electrical: ['electrical', 'electric', 'wiring', 'wire', 'outlets', 'switches', 'panel'],
  plumbing: ['plumbing', 'plumb', 'pipes', 'piping', 'fixtures', 'faucet', 'toilet'],
  hvac: ['hvac', 'heating', 'cooling', 'air conditioning', 'ac', 'ductwork', 'vents'],
  roofing: ['roofing', 'roof', 'shingles', 'tiles', 'gutters'],
  flooring: ['flooring', 'floor', 'floors', 'tile', 'hardwood', 'carpet', 'laminate', 'vinyl'],
  painting: ['painting', 'paint', 'painted', 'primer', 'primed'],
  demolition: ['demolition', 'demo', 'tear out', 'tear down', 'removal'],
  concrete: ['concrete', 'cement', 'foundation', 'slab', 'pour', 'poured'],
  carpentry: ['carpentry', 'carpenter', 'trim', 'molding', 'cabinets', 'woodwork'],
  insulation: ['insulation', 'insulate', 'insulated', 'batt', 'spray foam'],
  siding: ['siding', 'exterior', 'cladding', 'vinyl siding'],
  landscaping: ['landscaping', 'landscape', 'lawn', 'plants', 'grading', 'dirt'],
  cleaning: ['cleaning', 'clean', 'cleanup', 'sweep', 'trash'],
  inspection: ['inspection', 'inspect', 'inspected', 'walkthrough'],
  meeting: ['meeting', 'met', 'client meeting', 'coordination'],
  general: ['general', 'labor', 'work', 'miscellaneous', 'misc'],
};

// Prepositions and keywords for project matching
const PROJECT_INDICATORS = [
  'at',
  'on',
  'for',
  'the',
  'project',
  'job',
  'site',
  'house',
  'property',
  'location',
  'building',
];

// Time unit patterns
const TIME_PATTERNS = {
  hours: /\b(?:hours?|hrs?|h)\b/i,
  minutes: /\b(?:minutes?|mins?|m)\b/i,
  and: /\band\b/i,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize text for matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }

  // Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(s1.length, s2.length);
  return 1 - matrix[s1.length][s2.length] / maxLen;
}

/**
 * Check if words match (allowing for common speech recognition errors)
 */
function _wordsMatch(word1: string, word2: string): boolean {
  const w1 = normalizeText(word1);
  const w2 = normalizeText(word2);

  if (w1 === w2) return true;

  // Check similarity threshold
  if (calculateSimilarity(w1, w2) > 0.8) return true;

  return false;
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parse hours from transcript
 */
function parseHours(transcript: string): { hours: number; confidence: number; remaining: string } {
  const normalized = normalizeText(transcript);
  let hours = 0;
  let confidence = 0;
  let remaining = normalized;

  // Pattern 1: Digit + unit (e.g., "4 hours", "30 minutes")
  const digitPattern = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)?\b/gi;
  let match = digitPattern.exec(normalized);

  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase() || 'hours';

    if (unit.startsWith('m')) {
      hours += value / 60;
    } else {
      hours += value;
    }
    confidence = 0.95;
    remaining = normalized.slice(0, match.index) + normalized.slice(match.index + match[0].length);
  }

  // Pattern 2: Word numbers (e.g., "four hours", "thirty minutes")
  const words = normalized.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check for number word
    if (NUMBER_WORDS[word] !== undefined) {
      const value = NUMBER_WORDS[word];

      // Check next word for unit
      const nextWord = words[i + 1] || '';
      const isMinutes = TIME_PATTERNS.minutes.test(nextWord);

      if (isMinutes) {
        hours += value / 60;
      } else if (TIME_PATTERNS.hours.test(nextWord) || i === words.length - 1) {
        hours += value;
      } else {
        // Assume hours if no unit specified
        hours += value;
      }

      confidence = Math.max(confidence, 0.85);
      remaining = remaining.replace(new RegExp(`\\b${word}\\b`, 'i'), '').trim();
    }

    // Check for fractions
    if (FRACTION_WORDS[word] !== undefined) {
      hours += FRACTION_WORDS[word];
      confidence = Math.max(confidence, 0.85);
      remaining = remaining.replace(new RegExp(`\\b${word}\\b`, 'i'), '').trim();
    }
  }

  // Pattern 3: "X and a half hours" / "X point 5 hours"
  const andHalfPattern = /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+and\s+(?:a\s+)?half\s*(hours?|hrs?)?/i;
  const andHalfMatch = andHalfPattern.exec(normalized);
  if (andHalfMatch) {
    const baseValue = NUMBER_WORDS[andHalfMatch[1].toLowerCase()] ?? parseFloat(andHalfMatch[1]);
    hours = baseValue + 0.5;
    confidence = 0.9;
    remaining = normalized.replace(andHalfMatch[0], '').trim();
  }

  // Pattern 4: "hour and a half" without number (assume 1.5)
  const hourAndHalfPattern = /(?:an?\s+)?hour\s+and\s+(?:a\s+)?half/i;
  if (hourAndHalfPattern.test(normalized) && hours === 0) {
    hours = 1.5;
    confidence = 0.85;
    remaining = normalized.replace(hourAndHalfPattern, '').trim();
  }

  // Clean up remaining text
  remaining = remaining
    .replace(TIME_PATTERNS.hours, '')
    .replace(TIME_PATTERNS.minutes, '')
    .replace(TIME_PATTERNS.and, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { hours, confidence, remaining };
}

/**
 * Match activity type from transcript
 */
function matchActivity(transcript: string): { activityType: string; confidence: number } | null {
  const normalized = normalizeText(transcript);
  const words = normalized.split(/\s+/);

  let bestMatch: { activityType: string; confidence: number } | null = null;

  for (const [activity, keywords] of Object.entries(ACTIVITY_KEYWORDS)) {
    for (const keyword of keywords) {
      // Exact match
      if (normalized.includes(keyword)) {
        const confidence = keyword.length > 4 ? 0.95 : 0.85;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { activityType: activity, confidence };
        }
        break;
      }

      // Fuzzy match for each word
      for (const word of words) {
        const similarity = calculateSimilarity(word, keyword);
        if (similarity > 0.8) {
          const confidence = similarity * 0.9;
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { activityType: activity, confidence };
          }
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Match project from transcript
 */
function matchProject(
  transcript: string,
  projects: Array<Pick<Project, 'id' | 'name' | 'status'>>
): { projectId: string; projectName: string; confidence: number } | null {
  const normalized = normalizeText(transcript);

  // Filter to active projects first
  const activeProjects = projects.filter(
    (p) => p.status === 'active' || p.status === 'planning' || p.status === 'bidding'
  );
  const projectsToSearch = activeProjects.length > 0 ? activeProjects : projects;

  let bestMatch: { projectId: string; projectName: string; confidence: number } | null = null;

  for (const project of projectsToSearch) {
    const projectNameNormalized = normalizeText(project.name);

    // Direct inclusion check
    if (normalized.includes(projectNameNormalized)) {
      const confidence = 0.95;
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { projectId: project.id, projectName: project.name, confidence };
      }
      continue;
    }

    // Check if project name is included
    if (projectNameNormalized.includes(normalized.split(/\s+/).pop() || '')) {
      const confidence = 0.8;
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { projectId: project.id, projectName: project.name, confidence };
      }
    }

    // Fuzzy match on project name words
    const projectWords = projectNameNormalized.split(/\s+/);
    const transcriptWords = normalized.split(/\s+/);

    // Try to match after project indicators
    for (const indicator of PROJECT_INDICATORS) {
      const indicatorIndex = transcriptWords.indexOf(indicator);
      if (indicatorIndex >= 0 && indicatorIndex < transcriptWords.length - 1) {
        const afterIndicator = transcriptWords.slice(indicatorIndex + 1).join(' ');

        // Check similarity with full project name
        const similarity = calculateSimilarity(afterIndicator, projectNameNormalized);
        if (similarity > 0.6) {
          const confidence = similarity * 0.95;
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { projectId: project.id, projectName: project.name, confidence };
          }
        }

        // Check word-by-word matching
        for (const pWord of projectWords) {
          if (pWord.length < 3) continue; // Skip short words

          for (const tWord of transcriptWords.slice(indicatorIndex + 1)) {
            const wordSimilarity = calculateSimilarity(pWord, tWord);
            if (wordSimilarity > 0.85) {
              const confidence = wordSimilarity * 0.85;
              if (!bestMatch || confidence > bestMatch.confidence) {
                bestMatch = { projectId: project.id, projectName: project.name, confidence };
              }
            }
          }
        }
      }
    }

    // General word matching across entire transcript
    for (const pWord of projectWords) {
      if (pWord.length < 4) continue; // Skip short words

      for (const tWord of transcriptWords) {
        const similarity = calculateSimilarity(pWord, tWord);
        if (similarity > 0.9) {
          const confidence = similarity * 0.75;
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { projectId: project.id, projectName: project.name, confidence };
          }
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Extract description from transcript after parsing other elements
 */
function extractDescription(
  transcript: string,
  parsedHours: { remaining: string },
  activityMatch: { activityType: string } | null,
  projectMatch: { projectName: string } | null
): string {
  let description = parsedHours.remaining;

  // Remove common command prefixes
  description = description
    .replace(/^(?:log|record|add|enter|put|submit)\s+/i, '')
    .replace(/^(?:time|hours?)\s+(?:for|on|at)?\s*/i, '');

  // Remove project indicators and project name
  if (projectMatch) {
    const projectNamePattern = new RegExp(
      `(?:at|on|for|the)?\\s*${projectMatch.projectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:project|job|site|house)?`,
      'gi'
    );
    description = description.replace(projectNamePattern, '');
  }

  // Remove standalone project indicators
  for (const indicator of PROJECT_INDICATORS) {
    description = description.replace(new RegExp(`\\b${indicator}\\b\\s*$`, 'gi'), '');
  }

  // Clean up
  description = description
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();

  // If we have an activity type and description is short, use activity as description
  if (activityMatch && description.length < 10) {
    const activityLabel =
      activityMatch.activityType.charAt(0).toUpperCase() + activityMatch.activityType.slice(1);
    description = description ? `${activityLabel} - ${description}` : activityLabel;
  }

  return description || (activityMatch?.activityType || 'Time entry');
}

// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Parse a voice transcript into a time entry
 */
export function parseTimeEntryVoice(
  transcript: string,
  context: TimeEntryParserContext
): TimeEntryParseResult {
  if (!transcript?.trim()) {
    return {
      success: false,
      error: 'No transcript provided',
    };
  }

  const warnings: string[] = [];

  // Parse hours
  const hoursParsed = parseHours(transcript);
  if (hoursParsed.hours <= 0) {
    return {
      success: false,
      error: 'Could not understand the time duration',
      suggestions: [
        'Try saying the number of hours, like "4 hours" or "30 minutes"',
        'You can say "two and a half hours" for partial hours',
      ],
    };
  }

  // Validate reasonable hours
  if (hoursParsed.hours > 24) {
    return {
      success: false,
      error: `${hoursParsed.hours} hours seems too high. Did you mean something else?`,
      suggestions: ['Maximum time entry is 24 hours per entry'],
    };
  }

  if (hoursParsed.hours > 12) {
    warnings.push('This is a long time entry. Please verify the hours are correct.');
  }

  // Match activity type
  const activityMatch = matchActivity(transcript);

  // Match project
  const projectMatch = matchProject(transcript, context.projects);

  if (!projectMatch && context.projects.length > 0) {
    warnings.push('Could not match a project. You may need to select one manually.');
  }

  // Extract description
  const description = extractDescription(transcript, hoursParsed, activityMatch, projectMatch);

  // Calculate overall confidence
  let overallConfidence = hoursParsed.confidence * 0.5;
  if (activityMatch) {
    overallConfidence += activityMatch.confidence * 0.25;
  }
  if (projectMatch) {
    overallConfidence += projectMatch.confidence * 0.25;
  }

  return {
    success: true,
    data: {
      hours: Math.round(hoursParsed.hours * 100) / 100, // Round to 2 decimal places
      description,
      projectId: projectMatch?.projectId,
      projectName: projectMatch?.projectName,
      activityType: activityMatch?.activityType,
      confidence: Math.round(overallConfidence * 100) / 100,
      rawTranscript: transcript,
      warnings: warnings.length > 0 ? warnings : undefined,
    },
  };
}

/**
 * Get suggestions for improving voice commands
 */
export function getTimeEntrySuggestions(transcript: string): string[] {
  const suggestions: string[] = [];

  if (!transcript.match(/\d|one|two|three|four|five|six|seven|eight|nine|ten/i)) {
    suggestions.push('Include the number of hours, like "4 hours"');
  }

  if (!PROJECT_INDICATORS.some((p) => transcript.toLowerCase().includes(p))) {
    suggestions.push('Specify the project, like "at Smith house" or "for Johnson renovation"');
  }

  const hasActivity = Object.values(ACTIVITY_KEYWORDS).some((keywords) =>
    keywords.some((k) => transcript.toLowerCase().includes(k))
  );
  if (!hasActivity) {
    suggestions.push('Include what you worked on, like "framing" or "drywall"');
  }

  return suggestions;
}

/**
 * Example voice commands for training
 */
export const EXAMPLE_COMMANDS = [
  'Log 4 hours framing at Smith house',
  'Add 2 and a half hours drywall for Johnson project',
  'Record thirty minutes meeting at Oak Street renovation',
  'Put 8 hours electrical work on the Thompson job',
  'Enter 1.5 hours painting at Maple Avenue house',
];

export default parseTimeEntryVoice;
