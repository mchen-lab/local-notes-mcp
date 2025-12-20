#!/bin/bash
set -e

# Simulation of GitHub Actions Build
# Target: ghcr.io/mchen-lab/local-notes-mcp:dev

IMAGE_NAME="ghcr.io/mchen-lab/local-notes-mcp:dev"
BUILDER_NAME="github-simulator"

echo "=== Setup: Ensuring Buildx Builder exists ==="
if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
    docker buildx create --name $BUILDER_NAME --driver docker-container --bootstrap
else
    echo "Builder $BUILDER_NAME exists."
fi

docker buildx use $BUILDER_NAME

echo "=== Starting Build (Simulating GitHub Actions) ==="
echo "Target: $IMAGE_NAME"
echo "Platforms: linux/amd64,linux/arm64"

START_TIME=$(date +%s)

# Using --no-cache to simulate a 'cold' runner or ensure we capture full build time
# Remove --no-cache if you want to test incremental builds
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag $IMAGE_NAME \
  --push \
  --progress=plain \
  .

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "=== Build Complete ==="
echo "Total time: ${DURATION}s"
echo "Image pushed to: $IMAGE_NAME"
