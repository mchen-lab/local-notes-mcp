#!/bin/bash
set -e

TAG=${1:-v0.1.0}

echo "=== Release Trigger Helper ==="
echo "Target Tag: $TAG"
echo "WARNING: This will delete the tag '$TAG' on remote and recreate it."
echo "Press Ctrl+C to cancel, or Enter to proceed..."
read

echo "Deleting remote tag..."
git push --delete origin $TAG || echo "Tag did not exist on remote (ok)"

echo "Deleting local tag..."
git tag -d $TAG || echo "Tag did not exist locally (ok)"

echo "Creating new tag at HEAD..."
git tag $TAG

echo "Pushing new tag..."
git push origin $TAG

echo "=== Done ==="
echo "Release workflow should be triggered."
