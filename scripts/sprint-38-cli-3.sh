#!/bin/bash
#
# Sprint 38 - CLI 3: Feature Development
# This script provides the execution context for CLI 3
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "Sprint 38 - CLI 3: Feature Development"
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

# Check current sidebar structure
echo "=============================================="
echo "Current Sidebar Structure:"
echo "=============================================="
echo ""
ls -la components/dashboard/Sidebar* 2>/dev/null || echo "Sidebar files not found in expected location"
echo ""

# Check existing subcontractor files
echo "=============================================="
echo "Existing Subcontractor Files:"
echo "=============================================="
echo ""
find . -name "*subcontractor*" -o -name "*Subcontractor*" 2>/dev/null | grep -v node_modules || echo "None found"
echo ""

# Check schedule files
echo "=============================================="
echo "Existing Schedule Files:"
echo "=============================================="
echo ""
find . -path ./node_modules -prune -o -name "*schedule*" -print -o -name "*Schedule*" -print 2>/dev/null | grep -v node_modules || echo "None found"
echo ""

echo "=============================================="
echo "CLI 3 Ready"
echo "=============================================="
echo ""
echo "Prerequisites:"
echo "  - CLI 4 must fix Firebase permissions first"
echo "  - CLI 1 should seed demo data for testing"
echo ""
echo "Next steps:"
echo "1. Open coordination file: cat $PROJECT_ROOT/.claude-coordination/sprint-38-cli-3.md"
echo "2. Start with Phase 1: Navigation & Architecture"
echo "3. Run 'npm run dev' to test changes"
echo ""
