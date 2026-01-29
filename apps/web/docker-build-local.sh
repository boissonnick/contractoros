#!/bin/bash
# Local Docker build script for ContractorOS
# Reads environment variables from .env.local and passes them as build args
#
# Usage: ./docker-build-local.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env.local file not found at $ENV_FILE"
    echo "Please create .env.local with your Firebase configuration"
    exit 1
fi

echo "Loading environment variables from .env.local..."

# Source the env file to get variables
set -a
source "$ENV_FILE"
set +a

# Generate build version from git commit hash and build time
BUILD_VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Building Docker image..."
echo "  Version: $BUILD_VERSION"
echo "  Time: $BUILD_TIME"

docker build \
    --no-cache \
    --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="$NEXT_PUBLIC_FIREBASE_API_KEY" \
    --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" \
    --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="$NEXT_PUBLIC_FIREBASE_PROJECT_ID" \
    --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" \
    --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" \
    --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="$NEXT_PUBLIC_FIREBASE_APP_ID" \
    --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" \
    --build-arg NEXT_PUBLIC_BUILD_VERSION="$BUILD_VERSION" \
    --build-arg NEXT_PUBLIC_BUILD_TIME="$BUILD_TIME" \
    -t contractoros-web \
    -f "$SCRIPT_DIR/Dockerfile" \
    "$SCRIPT_DIR"

echo ""
echo "Build complete! Run the container with:"
echo "  docker run -d -p 3000:8080 --name contractoros-web contractoros-web"
echo ""
echo "Or use docker-run-local.sh for convenience"
