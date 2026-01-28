#!/bin/bash
# Local Docker run script for ContractorOS
# Stops any existing container and starts a fresh one
#
# Usage: ./docker-run-local.sh

set -e

CONTAINER_NAME="contractoros-web"

echo "Stopping existing container (if any)..."
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

echo "Starting new container..."
docker run -d \
    -p 3000:8080 \
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
