#!/bin/bash
#
# Sprint 38 - CLI 4: Critical Bugs & Backend
# This script provides the execution context for CLI 4
# PRIORITY: Run this first to unblock other CLIs
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "Sprint 38 - CLI 4: Critical Bugs & Backend"
echo "=============================================="
echo ""
echo "⚠️  PRIORITY: This CLI should run FIRST"
echo "   Task 1 (Firebase permissions) unblocks all other CLIs"
echo ""

# Navigate to project root
cd "$PROJECT_ROOT"

echo "Working directory: $(pwd)"
echo ""

# Check Firebase CLI
echo "Checking Firebase CLI..."
if command -v firebase &> /dev/null; then
    echo "✅ Firebase CLI found: $(firebase --version)"
else
    echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi
echo ""

# Check current Firestore rules
echo "=============================================="
echo "Current Firestore Rules (collections under organizations):"
echo "=============================================="
echo ""

if [ -f "firestore.rules" ]; then
    echo "Extracting collection rules from firestore.rules..."
    grep -E "match /[a-zA-Z]+/\{" firestore.rules | head -30
    echo ""
    echo "(Showing first 30 matches. Full file at: firestore.rules)"
else
    echo "❌ firestore.rules not found!"
    exit 1
fi
echo ""

# Check for missing collections
echo "=============================================="
echo "Collections that may need rules (from Issue #13):"
echo "=============================================="
echo ""

COLLECTIONS=(
    "changeOrders"
    "subAssignments"
    "bids"
    "solicitations"
    "submittals"
    "scopes"
    "finances"
    "jobCostingData"
    "punchList"
    "scheduleEvents"
    "crewAvailability"
    "timeOffRequests"
    "dailyLogs"
    "clientPreferences"
    "quotes"
    "quoteLineItems"
)

echo "Checking if rules exist for required collections..."
echo ""

for collection in "${COLLECTIONS[@]}"; do
    if grep -q "match /$collection/" firestore.rules 2>/dev/null; then
        echo "  ✅ $collection - rule exists"
    else
        echo "  ❌ $collection - MISSING RULE"
    fi
done

echo ""

# Run TypeScript check
echo "=============================================="
echo "TypeScript Check:"
echo "=============================================="
cd "$PROJECT_ROOT/apps/web"
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ TypeScript errors found."
else
    echo ""
    echo "✅ TypeScript check passed"
fi

echo ""
echo "=============================================="
echo "CLI 4 Ready"
echo "=============================================="
echo ""
echo "CRITICAL TASKS (Do First):"
echo "  1. Task 1: Fix Firebase Permission Errors (Issue #13)"
echo "  2. Task 4: Profit Margin Calculation Bug (Issue #53)"
echo "  3. Task 5: Payroll NaNh Display Bug (Issue #57)"
echo ""
echo "Commands:"
echo "  Deploy rules:  firebase deploy --only firestore:rules --project contractoros-483812"
echo "  Deploy indexes: firebase deploy --only firestore:indexes --project contractoros-483812"
echo ""
echo "Next steps:"
echo "  1. Open coordination file: cat $PROJECT_ROOT/.claude-coordination/sprint-38-cli-4.md"
echo "  2. Add missing collection rules to firestore.rules"
echo "  3. Deploy and test"
echo ""
