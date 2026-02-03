#!/bin/bash
#
# Sprint 38 - CLI 2: UI/UX & Layout Fixes
# This script provides the execution context for CLI 2
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "Sprint 38 - CLI 2: UI/UX & Layout Fixes"
echo "=============================================="
echo ""

# Navigate to web app
cd "$PROJECT_ROOT/apps/web"

echo "Working directory: $(pwd)"
echo ""

# Run TypeScript check first
echo "Running TypeScript check..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ TypeScript errors found. Fix before proceeding."
    exit 1
fi

echo ""
echo "✅ TypeScript check passed"
echo ""

# Search for animations to remove
echo "=============================================="
echo "Animation Audit - Files with bounce/pulse:"
echo "=============================================="
echo ""

echo "Files with animate-bounce:"
grep -r "animate-bounce" --include="*.tsx" --include="*.ts" . || echo "  None found"
echo ""

echo "Files with animate-pulse (review - may be loading states):"
grep -r "animate-pulse" --include="*.tsx" --include="*.ts" . || echo "  None found"
echo ""

echo "=============================================="
echo "CLI 2 Ready"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Review the animation audit above"
echo "2. Open coordination file: cat $PROJECT_ROOT/.claude-coordination/sprint-38-cli-2.md"
echo "3. Start with Task 8-10 (animation removal)"
echo "4. Run 'npm run dev' to test changes"
echo ""
