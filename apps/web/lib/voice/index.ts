/**
 * Voice Module
 *
 * Voice command parsing and speech recognition utilities.
 */

// Parsers
export {
  parseTimeEntryVoice,
  getTimeEntrySuggestions,
  EXAMPLE_COMMANDS as EXAMPLE_TIME_ENTRY_COMMANDS,
} from './time-entry-parser';
export type {
  ParsedTimeEntry,
  TimeEntryParseResult,
  TimeEntryParserContext,
} from './time-entry-parser';

export {
  parseDailyLogVoice,
  getDailyLogSuggestions,
  EXAMPLE_DAILY_LOG_COMMANDS,
} from './daily-log-parser';
export type {
  ParsedDailyLog,
  DailyLogParseResult,
  DailyLogParserContext,
} from './daily-log-parser';

export {
  parseTaskVoice,
  getTaskCommandSuggestions,
  EXAMPLE_TASK_COMMANDS,
} from './task-parser';
export type {
  ParsedTaskCommand,
  TaskParseResult,
  TaskParserContext,
  TaskAction,
} from './task-parser';

// Hook
export {
  useVoiceCommands,
} from './useVoiceCommands';
export type {
  VoiceCommandState,
  VoiceCommandType,
  VoiceCommandResult,
  VoiceCommandsContext,
  UseVoiceCommandsOptions,
  UseVoiceCommandsReturn,
} from './useVoiceCommands';
