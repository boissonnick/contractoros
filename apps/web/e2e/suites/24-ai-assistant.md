# AI Assistant E2E Test Suite

## Overview
Tests for the AI Assistant functionality including panel interactions, messaging, voice input, and settings.

---

## TEST: AI Panel Opens with Keyboard Shortcut
**Priority:** P0

### Steps:
1. Navigate to any dashboard page
2. Press Cmd+K (Mac) or Ctrl+K (Windows)
3. Verify AI panel slides open
4. Verify input field is focused

### Expected:
- Panel animates open from the right
- Input field has focus
- Can immediately start typing

---

## TEST: AI Panel Opens with Trigger Button
**Priority:** P0

### Steps:
1. Navigate to any dashboard page
2. Locate floating AI button (bottom right corner)
3. Click the button
4. Verify panel opens
5. Verify welcome message or empty state displays

### Expected:
- Floating button is visible
- Panel opens on click
- Shows appropriate initial state

---

## TEST: Send Chat Message
**Priority:** P0

### Steps:
1. Open AI panel (via button or keyboard)
2. Type "What can you help me with?"
3. Press Enter or click send button
4. Verify loading state appears
5. Wait for response (2-5 seconds)
6. Verify response appears
7. Verify response is formatted as markdown

### Expected:
- Message appears in chat
- Loading indicator shows
- AI response displays
- Markdown formatting works (lists, bold, etc.)

---

## TEST: Voice Input Activates
**Priority:** P1

### Steps:
1. Open AI panel
2. Locate microphone button
3. Click microphone button
4. Verify voice overlay/indicator appears (or permission error)
5. Click cancel/close button
6. Verify overlay closes

### Expected:
- Microphone button is visible
- Voice mode activates or shows browser permission dialog
- Can cancel and return to normal state

---

## TEST: Quick Actions Display
**Priority:** P1

### Steps:
1. Open AI panel
2. Look for quick action buttons/suggestions
3. Verify quick action buttons are visible
4. Click a quick action (e.g., "What should I charge for...")
5. Verify it populates input or sends message

### Expected:
- Quick actions are visible when panel opens
- Clicking populates or sends the action
- Appropriate response follows

---

## TEST: Settings Page Loads
**Priority:** P1

### Steps:
1. Navigate to /dashboard/settings/assistant
2. Verify page loads without error
3. Verify model selector dropdown is present
4. Verify TTS (text-to-speech) toggle is present

### Expected:
- Page renders completely
- Model selector shows options
- TTS toggle is functional
- No console errors

---

## TEST: Model Selection Persists
**Priority:** P2

### Steps:
1. Go to /dashboard/settings/assistant
2. Change model selection to a different option
3. Click Save button
4. Refresh the page
5. Verify selection persisted

### Expected:
- Model selection saves successfully
- After refresh, same model is selected
- No data loss

---

## TEST: Error State Handling
**Priority:** P1

### Steps:
1. Open AI panel
2. Either:
   - Disconnect network (if possible), OR
   - Send very long message (10000+ characters)
3. Verify error message displays gracefully
4. Verify retry option is available

### Expected:
- Error state displays user-friendly message
- No crash or unhandled exception
- Can retry or recover
