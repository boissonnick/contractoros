# Claude CLI Coordination

This directory enables automated status reporting between CLI sessions.

## How it works

1. Each CLI writes a status file when completing a task
2. Controller polls this directory for updates
3. Files are cleared after processing

## Status file format

Filename: `cli-{number}-{timestamp}.status`

Content:
```
CLI: 2
STATUS: complete|error|blocked
TASK: Brief description
COMMIT: abc1234 (if applicable)
MESSAGE: Any notes
```

## Commands for Controller

Check for updates:
```bash
ls -la .claude-coordination/*.status 2>/dev/null
cat .claude-coordination/*.status 2>/dev/null
```

Clear processed:
```bash
rm .claude-coordination/*.status
```
