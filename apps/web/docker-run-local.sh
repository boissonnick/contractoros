#!/bin/bash
# Local Docker run script for ContractorOS
# Stops any existing container and starts a fresh one
# Loads runtime environment variables from .env.local
#
# Usage: ./docker-run-local.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.local"
CONTAINER_NAME="contractoros-web"

# Load environment variables if .env.local exists
if [ -f "$ENV_FILE" ]; then
    echo "Loading environment variables from .env.local..."
    set -a
    source "$ENV_FILE"
    set +a
fi

echo "Stopping existing container (if any)..."
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

echo "Starting new container..."
docker run -d \
    -p 3000:8080 \
    -e GEMINI_API_KEY="$GEMINI_API_KEY" \
    -e ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
    -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
    --name "$CONTAINER_NAME" \
    contractoros-web

echo ""
echo "Container started successfully!"
echo "Access the app at: http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  docker logs -f $CONTAINER_NAME    # View logs"
echo "  docker stop $CONTAINER_NAME       # Stop container"
echo "  docker rm $CONTAINER_NAME         # Remove container"
