# Sprint 16: AI Assistant

> **Status:** COMPLETED ✅
> **Started:** 2026-01-31
> **Completed:** 2026-01-31
> **Purpose:** Build contextual AI chat interface with Claude API, voice commands, and proactive insights

---

## Sprint Goals

Build an AI Assistant that helps contractors with:
1. **Contextual Chat** - Answer questions with awareness of current project, user data, estimates
2. **Voice Commands** - Hands-free operation for field use
3. **Proactive Insights** - Surface relevant information automatically
4. **Construction Intelligence** - Leverage existing price data, labor rates, and benchmarks

---

## Technical Architecture

### Components

```
apps/web/lib/assistant/
├── types.ts                    # Assistant-specific types
├── claude-client.ts            # Claude API wrapper
├── context-builder.ts          # Build context from user/project data
├── voice-service.ts            # Speech-to-text/text-to-speech
└── prompts.ts                  # System prompts and templates

apps/web/components/assistant/
├── AssistantPanel.tsx          # Slide-out chat panel
├── ChatMessage.tsx             # Message display component
├── VoiceInput.tsx              # Voice command UI
├── AssistantTrigger.tsx        # Floating action button
├── QuickActions.tsx            # Common action shortcuts
└── index.ts                    # Exports

apps/web/lib/hooks/
├── useAssistant.ts             # Main assistant hook
└── useVoice.ts                 # Voice input/output hook
```

### Data Flow

```
User Input (text/voice)
    → Context Builder (adds project/user context)
    → Claude API (with system prompt)
    → Response Processing
    → Display in Chat UI
```

---

## Implementation Tasks

### Phase 1: Core Infrastructure

- [x] Create Sprint 16 plan document
- [x] Create `lib/assistant/types.ts` - Assistant types
- [x] Create `lib/assistant/claude-client.ts` - API wrapper
- [x] Create `lib/assistant/context-builder.ts` - Build context
- [x] Create `lib/assistant/prompts.ts` - System prompts

### Phase 2: UI Components

- [x] Create `components/assistant/ChatMessage.tsx` - Message display
- [x] Create `components/assistant/AssistantPanel.tsx` - Slide-out panel
- [x] Create `components/assistant/AssistantTrigger.tsx` - FAB trigger
- [x] Quick actions integrated into AssistantPanel (suggestions + action buttons)

### Phase 3: Voice Integration

- [x] Voice service integrated into useAssistant hook (Web Speech API)
- [x] Create `components/assistant/VoiceInput.tsx` - Voice UI overlay
- [x] Voice hook functionality in useAssistant.ts

### Phase 4: Hooks & Integration

- [x] Create `lib/hooks/useAssistant.ts` - Main assistant hook
- [x] Integrate into dashboard layout
- [x] Add API route for Claude calls (`app/api/assistant/route.ts`)

### Phase 5: Testing & Polish

- [x] TypeScript compilation passing
- [x] Voice input with error handling for unsupported browsers
- [x] Loading states for processing
- [x] Error handling with fallback responses
- [x] Update SPRINT_STATUS.md

---

## API Keys Required

```bash
# Add to .env.local
ANTHROPIC_API_KEY=sk-ant-xxx  # Claude API key
```

**Get API key:** https://console.anthropic.com/settings/keys

---

## Features

### Contextual Chat

The assistant will have awareness of:
- Current user's organization and profile
- Active project being viewed
- Open estimate being edited
- Recent activity and changes
- Material prices and labor rates (from intelligence system)

### Quick Actions

Common tasks available via quick buttons:
- "What should I charge for [item]?"
- "Create an estimate for [project type]"
- "Show me price trends for lumber"
- "What's the average duration for a kitchen remodel?"
- "Help me write a scope of work"

### Voice Commands (Field Use)

Hands-free operation for field workers:
- "Hey ContractorOS, log my hours for today"
- "Take a progress photo with notes"
- "What's the schedule for this week?"
- "Send a message to the client"

---

## System Prompt

```markdown
You are the ContractorOS AI Assistant - a helpful assistant for construction contractors.

You have access to:
- Real-time material prices (lumber, steel, copper, etc.)
- Regional labor rates by trade
- Market benchmarks for project types
- The user's project and estimate data

Your role is to:
1. Answer questions about pricing, estimates, and projects
2. Provide actionable insights based on market data
3. Help draft scopes of work and estimates
4. Explain construction best practices

Be concise - contractors are busy. Use bullet points when helpful.
Always cite data sources when providing prices or rates.
```

---

## Files Modified This Sprint

| File | Changes |
|------|---------|
| `apps/web/app/dashboard/layout.tsx` | Add AssistantTrigger component |
| `apps/web/lib/hooks/useIntelligence.ts` | Export helper functions |
| `docs/SPRINT_STATUS.md` | Update with Sprint 16 progress |

---

## Success Metrics

- Users can chat with assistant and get useful responses
- Voice input works on mobile browsers
- Assistant can answer pricing questions with data
- Context awareness shows correct project/estimate info
- Average response time < 3 seconds
