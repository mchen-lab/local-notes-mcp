#!/bin/bash
set -e

# Simulation of GitHub Actions Build
# Target: ghcr.io/mchen-lab/local-notes-mcp:dev

IMAGE_NAME="ghcr.io/mchen-lab/local-notes-mcp:dev"
BUILDER_NAME="github-simulator"

# Default to caching
CACHE_FLAG=""

# Check for arguments
for arg in "$@"; do
  if [[ "$arg" == "--no-cache" ]]; then
    CACHE_FLAG="--no-cache"
    echo "!!! RUNNING WITH NO CACHE - THIS WILL TAKE LONGER !!!"
  fi
done

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
if [ -z "$CACHE_FLAG" ]; then
  echo "Mode: Cached (Fast). Use --no-cache to simulate cold build."
else
  echo "Mode: No Cache (Slow/Realistic cold build)."
fi

START_TIME=$(date +%s)

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag $IMAGE_NAME \
  --push \
  --progress=plain \
  $CACHE_FLAG \
  .

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "=== Build Complete ==="
echo "Total time: ${DURATION}s"
if [ "$DURATION" -lt 10 ] && [ -z "$CACHE_FLAG" ]; then
    echo "NOTE: Build was extremely fast (<10s). This strongly indicates a 100% cache hit."
    echo "To see realistic cold-build performance, run: ./simulate_github_build_and_publish.sh --no-cache"
fi
echo "Image pushed to: $IMAGE_NAME"

