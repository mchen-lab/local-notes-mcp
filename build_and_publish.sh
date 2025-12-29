#!/bin/bash

# Build and publish script for local-notes-mcp Docker image
# Supports multi-platform build for amd64 and arm64

set -e  # Exit on any error

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running or not accessible."
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Image names
GHCR_IMAGE="ghcr.io/mchen-lab/local-notes-mcp"
DOCKERHUB_IMAGE="xychenmsn/local-notes-mcp"
TAG="dev"

echo "Checking for Docker Buildx..."
if ! docker buildx inspect local-notes-builder > /dev/null 2>&1; then
    echo "Creating new buildx builder..."
    docker buildx create --name local-notes-builder --use
    docker buildx inspect --bootstrap
else
    echo "Using existing buildx builder."
    docker buildx use local-notes-builder
fi

echo "Building and pushing multi-platform image..."
echo "Platforms: linux/amd64, linux/arm64"
echo "Tags:"
echo "  - $GHCR_IMAGE:$TAG"
echo "  - $DOCKERHUB_IMAGE:$TAG"

# Generate build metadata (e.g. -dev-20251228)
BUILD_META="-dev-$(date +%Y%m%d)"
echo "Build Metadata: $BUILD_META"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg BASE_IMAGE=ghcr.io/mchen-lab/local-notes-mcp:base \
  --build-arg BUILD_METADATA="$BUILD_META" \
  -t "$GHCR_IMAGE:$TAG" \
  -t "$DOCKERHUB_IMAGE:$TAG" \
  --push \
  .

echo "Build and publish completed successfully!"
