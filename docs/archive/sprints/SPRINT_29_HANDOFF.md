# Sprint 29: Voice Commands - Handoff Notes

**Date:** 2026-02-02
**Session:** Dev Sprint
**Status:** Complete

---

## Deliverables

### 1. Voice Time Entry Parser
**File:** `apps/web/lib/voice/time-entry-parser.ts`

Parses voice commands like "Log 4 hours framing at Smith house" into structured data.

**Features:**
- Parses hours from voice (supports digits, words, fractions)
- Matches projects by name using fuzzy search
- Detects activity types (framing, drywall, electrical, etc.)
- Returns confidence scores for each match
- Handles common speech recognition errors

**Usage:**
```typescript
import { parseTimeEntryVoice } from '@/lib/voice';

const result = parseTimeEntryVoice(transcript, {
  projects: [{ id: '1', name: 'Smith House', status: 'active' }],
});

if (result.success) {
  const { hours, description, projectId, activityType } = result.data;
}
```

---

### 2. Voice Daily Log Parser
**File:** `apps/web/lib/voice/daily-log-parser.ts`

Parses dictated end-of-day summaries into structured daily log data.

**Features:**
- Extracts weather conditions (sunny, cloudy, rainy, etc.)
- Parses crew count and member names
- Identifies work performed
- Detects issues with severity levels
- Auto-categorizes log type (progress, issue, safety, etc.)

**Usage:**
```typescript
import { parseDailyLogVoice } from '@/lib/voice';

const result = parseDailyLogVoice(transcript, {
  projectId: 'proj123',
  projectName: 'Smith House',
});

if (result.success) {
  const { category, title, weather, crewCount, workPerformed, issues } = result.data;
}
```

---

### 3. Voice Task Parser
**File:** `apps/web/lib/voice/task-parser.ts`

Parses task-related voice commands like "Mark drywall task complete".

**Features:**
- Detects actions: complete, start, pause, update, assign
- Uses fuzzy search to match task names
- Suggests similar tasks when no exact match found
- Returns appropriate status updates

**Usage:**
```typescript
import { parseTaskVoice } from '@/lib/voice';

const result = parseTaskVoice(transcript, {
  tasks: [{ id: '1', title: 'Install drywall', status: 'in_progress', priority: 'high', assignedTo: [] }],
  projectId: 'proj123',
});

if (result.success) {
  const { taskId, action, updates } = result.data;
}
```

---

### 4. Voice Commands Hook
**File:** `apps/web/lib/voice/useVoiceCommands.ts`

React hook that combines speech recognition with the parsers.

**Features:**
- Uses Web Speech API (SpeechRecognition)
- Auto-detects command type (time entry, daily log, or task)
- Provides interim transcripts during listening
- Handles errors gracefully
- Supports haptic feedback on mobile

**States:** `idle` | `listening` | `processing` | `success` | `error`

**Usage:**
```typescript
import { useVoiceCommands } from '@/lib/voice';

const {
  state,
  isSupported,
  transcript,
  result,
  startListening,
  stopListening,
  reset,
} = useVoiceCommands(context, {
  commandType: 'auto',
  onResult: (result) => console.log(result),
});
```

---

### 5. Voice Activation FAB
**File:** `apps/web/components/voice/VoiceActivationFAB.tsx`

Floating action button for voice commands on field pages.

**Features:**
- Positioned bottom-right, above mobile nav
- Visual states: idle, listening, processing, success, error
- Shows transcript preview while listening
- Confirmation UI before executing commands
- Animated feedback for all states

**Usage:**
```tsx
import { VoiceActivationFAB } from '@/components/voice';

<VoiceActivationFAB
  context={{
    timeEntry: { projects },
    dailyLog: { projectId, projectName },
    task: { tasks, projectId },
  }}
  bottomOffset={80}
  requireConfirmation={true}
  onConfirm={(result) => {
    if (result.type === 'time_entry') {
      createTimeEntry(result.data);
    }
  }}
/>
```

---

## Integration Notes

### To integrate with Field Portal:

1. **Time Page (`apps/web/app/field/time/page.tsx`):**
   - Import `VoiceActivationFAB`
   - Pass time entry context with projects list
   - Handle `onConfirm` to create time entry

2. **Daily Log Page (`apps/web/app/field/daily-log/page.tsx`):**
   - Import `VoiceActivationFAB` with `commandType="daily_log"`
   - Pass daily log context with projectId/projectName
   - Handle `onConfirm` to create daily log

3. **Tasks Page (`apps/web/app/field/tasks/page.tsx`):**
   - Import `VoiceActivationFAB` with `commandType="task"`
   - Pass task context with tasks list
   - Handle `onConfirm` to update task status

### Browser Support:
- Chrome, Edge: Full support via Web Speech API
- Safari: Uses webkit prefix (webkitSpeechRecognition)
- Firefox: Not supported (component gracefully hides)

---

## Files Created

```
apps/web/lib/voice/
├── index.ts                 # Main exports
├── time-entry-parser.ts     # Time entry voice parsing
├── daily-log-parser.ts      # Daily log voice parsing
├── task-parser.ts           # Task command voice parsing
└── useVoiceCommands.ts      # React hook for voice

apps/web/components/voice/
├── index.ts                 # Component exports
└── VoiceActivationFAB.tsx   # Floating action button
```

---

## Next Steps

1. **Integration Testing:** Test with real speech recognition on mobile devices
2. **Polish:** Add voice photo notes (P1) and voice navigation (P2)
3. **Analytics:** Track voice command usage and success rates
4. **Improvements:** Train on common construction terminology

---

## Dependencies

No new npm packages required. Uses:
- Web Speech API (browser native)
- Existing Heroicons
- Existing Tailwind CSS classes
