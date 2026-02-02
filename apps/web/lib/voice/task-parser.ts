/**
 * Voice Task Parser
 *
 * Parses voice commands like "Mark drywall task complete" into task actions.
 */

import type { Task, TaskStatus } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type TaskAction = 'complete' | 'start' | 'pause' | 'update' | 'assign';

export interface ParsedTaskCommand {
  taskId?: string;
  taskTitle?: string;
  action: TaskAction;
  updates?: Partial<Task>;
  confidence: number;
  rawTranscript: string;
  warnings?: string[];
}

export interface TaskParseResult {
  success: boolean;
  data?: ParsedTaskCommand;
  error?: string;
  suggestions?: string[];
}

export interface TaskParserContext {
  tasks: Array<Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'assignedTo'>>;
  projectId?: string;
  userId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Action keywords
const ACTION_KEYWORDS: Record<TaskAction, string[]> = {
  complete: [
    'complete', 'completed', 'finish', 'finished', 'done', 'mark done',
    'mark complete', 'mark as complete', 'mark as done', 'close',
  ],
  start: [
    'start', 'started', 'begin', 'began', 'working on', 'start working',
    'in progress', 'mark in progress', 'mark as in progress',
  ],
  pause: [
    'pause', 'paused', 'stop', 'stopped', 'hold', 'on hold', 'put on hold',
  ],
  update: [
    'update', 'change', 'modify', 'edit', 'set',
  ],
  assign: [
    'assign', 'assigned', 'give', 'delegate', 'hand off',
  ],
};

// Status update indicators
const STATUS_INDICATORS: Record<TaskStatus, string[]> = {
  pending: ['pending', 'not started', 'to do', 'todo', 'waiting'],
  assigned: ['assigned', 'hand off', 'delegated', 'given to'],
  in_progress: ['in progress', 'started', 'working', 'ongoing'],
  blocked: ['blocked', 'stuck', 'waiting on', 'dependent on'],
  review: ['review', 'needs review', 'check', 'verify'],
  completed: ['completed', 'complete', 'done', 'finished'],
};

// Priority keywords
const PRIORITY_KEYWORDS = {
  high: ['high', 'urgent', 'critical', 'important', 'asap', 'priority'],
  medium: ['medium', 'normal', 'moderate'],
  low: ['low', 'minor', 'whenever', 'back burner'],
};

// Common task name patterns to extract
const TASK_CLEANUP_WORDS = [
  'task', 'the', 'a', 'an', 'for', 'on', 'at', 'in',
  'mark', 'set', 'update', 'change', 'complete', 'finish',
  'as', 'to', 'please', 'can you', 'could you',
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
 * Calculate word overlap score
 */
function calculateWordOverlap(str1: string, str2: string): number {
  const words1 = normalizeText(str1).split(/\s+/).filter((w) => w.length > 2);
  const words2 = normalizeText(str2).split(/\s+/).filter((w) => w.length > 2);
  const words2Set = new Set(words2);

  if (words1.length === 0 || words2.length === 0) return 0;

  let overlap = 0;
  for (const word of words1) {
    if (words2Set.has(word)) {
      overlap++;
    }
  }

  return overlap / Math.max(words1.length, words2.length);
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Detect the action from the transcript
 */
function detectAction(transcript: string): { action: TaskAction; confidence: number } {
  const normalized = normalizeText(transcript);

  let bestAction: TaskAction = 'complete'; // Default
  let bestScore = 0;

  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        const score = keyword.length / normalized.length + 0.5;
        if (score > bestScore) {
          bestScore = score;
          bestAction = action as TaskAction;
        }
      }
    }
  }

  return {
    action: bestAction,
    confidence: Math.min(bestScore, 0.95),
  };
}

/**
 * Extract task name from transcript
 */
function extractTaskName(transcript: string, action: TaskAction): string {
  let cleaned = normalizeText(transcript);

  // Remove action keywords
  const actionKeywords = ACTION_KEYWORDS[action];
  for (const keyword of actionKeywords) {
    cleaned = cleaned.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '');
  }

  // Remove common words
  for (const word of TASK_CLEANUP_WORDS) {
    cleaned = cleaned.replace(new RegExp(`^${word}\\s+|\\s+${word}\\s+|\\s+${word}$`, 'gi'), ' ');
  }

  // Clean up
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Match task from transcript using fuzzy search
 */
function matchTask(
  transcript: string,
  tasks: TaskParserContext['tasks'],
  action: TaskAction
): { taskId: string; taskTitle: string; confidence: number } | null {
  if (tasks.length === 0) return null;

  const extractedName = extractTaskName(transcript, action);
  const normalized = normalizeText(transcript);

  let bestMatch: { taskId: string; taskTitle: string; confidence: number } | null = null;

  for (const task of tasks) {
    const taskTitleNorm = normalizeText(task.title);

    // Exact match
    if (normalized.includes(taskTitleNorm) || taskTitleNorm.includes(extractedName)) {
      const confidence = 0.95;
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { taskId: task.id, taskTitle: task.title, confidence };
      }
      continue;
    }

    // Fuzzy match on full name
    const similarity = calculateSimilarity(extractedName, taskTitleNorm);
    if (similarity > 0.6) {
      const confidence = similarity * 0.9;
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { taskId: task.id, taskTitle: task.title, confidence };
      }
    }

    // Word overlap match
    const overlap = calculateWordOverlap(extractedName, taskTitleNorm);
    if (overlap > 0.5) {
      const confidence = overlap * 0.85;
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { taskId: task.id, taskTitle: task.title, confidence };
      }
    }

    // Individual keyword match
    const taskWords = taskTitleNorm.split(/\s+/).filter((w) => w.length > 3);
    for (const taskWord of taskWords) {
      if (normalized.includes(taskWord)) {
        const confidence = 0.7;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { taskId: task.id, taskTitle: task.title, confidence };
        }
        break;
      }
    }
  }

  return bestMatch;
}

/**
 * Extract updates from transcript
 */
function extractUpdates(transcript: string): Partial<Task> | undefined {
  const normalized = normalizeText(transcript);
  const updates: Partial<Task> = {};

  // Check for status updates
  for (const [status, keywords] of Object.entries(STATUS_INDICATORS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        updates.status = status as TaskStatus;
        break;
      }
    }
    if (updates.status) break;
  }

  // Check for priority updates
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some((k) => normalized.includes(k))) {
      updates.priority = priority as Task['priority'];
      break;
    }
  }

  return Object.keys(updates).length > 0 ? updates : undefined;
}

// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Parse a voice transcript into a task command
 */
export function parseTaskVoice(
  transcript: string,
  context: TaskParserContext
): TaskParseResult {
  if (!transcript?.trim()) {
    return {
      success: false,
      error: 'No transcript provided',
    };
  }

  const warnings: string[] = [];

  // Detect action
  const { action, confidence: actionConfidence } = detectAction(transcript);

  // Match task
  const taskMatch = matchTask(transcript, context.tasks, action);

  if (!taskMatch) {
    // Try to be helpful with suggestions
    const extractedName = extractTaskName(transcript, action);
    const similarTasks = context.tasks
      .map((t) => ({
        title: t.title,
        similarity: calculateSimilarity(extractedName, t.title),
      }))
      .filter((t) => t.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map((t) => t.title);

    return {
      success: false,
      error: `Could not find a matching task for "${extractedName}"`,
      suggestions: similarTasks.length > 0
        ? [`Did you mean: ${similarTasks.join(', ')}?`]
        : ['Try saying the task name more clearly', 'Make sure the task exists in the current project'],
    };
  }

  // Check if action makes sense for task status
  const task = context.tasks.find((t) => t.id === taskMatch.taskId);
  if (task) {
    if (action === 'complete' && task.status === 'completed') {
      warnings.push('This task is already marked as complete');
    }
    if (action === 'start' && task.status === 'in_progress') {
      warnings.push('This task is already in progress');
    }
  }

  // Extract any updates
  const updates = extractUpdates(transcript);

  // Calculate overall confidence
  const overallConfidence = (actionConfidence * 0.4 + taskMatch.confidence * 0.6);

  return {
    success: true,
    data: {
      taskId: taskMatch.taskId,
      taskTitle: taskMatch.taskTitle,
      action,
      updates: updates || (action === 'complete' ? { status: 'completed' } : undefined),
      confidence: Math.round(overallConfidence * 100) / 100,
      rawTranscript: transcript,
      warnings: warnings.length > 0 ? warnings : undefined,
    },
  };
}

/**
 * Get suggestions for improving task voice commands
 */
export function getTaskCommandSuggestions(): string[] {
  return [
    'Start with the action, like "Mark" or "Complete"',
    'Include the task name or key words from it',
    'Be specific about which task you mean',
  ];
}

/**
 * Example task voice commands
 */
export const EXAMPLE_TASK_COMMANDS = [
  'Mark drywall installation complete',
  'Complete the framing task',
  'Start working on electrical rough-in',
  'Mark kitchen cabinets as done',
  'Finish the painting in master bedroom',
];

export default parseTaskVoice;
