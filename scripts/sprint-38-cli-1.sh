#!/bin/bash
#
# Sprint 38 - CLI 1: Demo Data Seeding
# Run this script to execute all seed scripts
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "Sprint 38 - CLI 1: Demo Data Seeding"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    echo "Error: Must be run from contractoros project"
    exit 1
fi

# Navigate to seed-demo directory
cd "$SCRIPT_DIR/seed-demo"

echo "Working directory: $(pwd)"
echo ""

# Parse arguments
SKIP_EXISTING=false
ONLY=""
DRY_RUN=false

for arg in "$@"; do
    case $arg in
        --skip-existing)
            SKIP_EXISTING=true
            shift
            ;;
        --only=*)
            ONLY="${arg#*=}"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            echo "Usage: ./sprint-38-cli-1.sh [options]"
            echo ""
            echo "Options:"
            echo "  --skip-existing    Skip scripts that have already been run"
            echo "  --only=a,b,c       Only run specific scripts"
            echo "  --dry-run          Show what would run"
            echo "  --help             Show this help"
            exit 0
            ;;
    esac
done

# Build command
CMD="npx ts-node run-all-seeds.ts"

if [ "$SKIP_EXISTING" = true ]; then
    CMD="$CMD --skip-existing"
fi

if [ -n "$ONLY" ]; then
    CMD="$CMD --only=$ONLY"
fi

if [ "$DRY_RUN" = true ]; then
    CMD="$CMD --dry-run"
fi

echo "Running: $CMD"
echo ""

# Execute
eval $CMD

echo ""
echo "=============================================="
echo "CLI 1 seed scripts complete!"
echo "=============================================="
