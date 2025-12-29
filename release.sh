#!/bin/bash
set -e

# Help / Usage
# (Optional)
if [ "$1" == "--help" ]; then
    echo "Usage: ./release.sh [patch|minor|major|<version>]"
    echo "       ./release.sh           # Re-release current version"
    exit 0
fi

BUMP_TYPE=$1

# 1. Ensure git is clean
if [[ -n $(git status -s) ]]; then
    echo "❌ Error: Git working directory is not clean. Please commit or stash changes first."
    exit 1
fi

if [ -z "$BUMP_TYPE" ]; then
    echo "=== 🚀 Re-Releasing Current Version ==="
    # Read version from package.json
    VERSION_NUM=$(node -p "require('./package.json').version")
    echo "ℹ️  Current version: $VERSION_NUM"
else
    echo "=== 🚀 Starting Release: $BUMP_TYPE ==="
    
    # 2. Bump root version (only if arg provided)
    NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version)
    VERSION_NUM=${NEW_VERSION#v}
    echo "📝 Bumped root version to $VERSION_NUM"
fi

# 3. Sync version to workspaces manually
echo "🔄 Syncing version to workspaces..."
npm version $VERSION_NUM --workspace=backend --no-git-tag-version --allow-same-version > /dev/null
npm version $VERSION_NUM --workspace=frontend --no-git-tag-version --allow-same-version > /dev/null

# 4. Git Commit and Tag
echo "📦 Committing and Tagging..."
git add package.json backend/package.json frontend/package.json

# Only commit if there are changes
if ! git diff-index --quiet HEAD; then
    git commit -m "chore: release v$VERSION_NUM"
else
    echo "ℹ️  No changes to commit (version unchanged)."
fi

# Force tag to move it if it exists (for re-release) or create if missing
git tag -f -a "v$VERSION_NUM" -m "Release v$VERSION_NUM"

echo "✅ Created local tag: v$VERSION_NUM"

# 5. Push to Remote
echo "⬆️  Pushing to origin..."
git push origin main --follow-tags

echo ""
echo "🎉 Release v$VERSION_NUM completed successfully!"
echo "   - package.json files updated"
echo "   - Git tag pushed"
echo "   - GitHub Action should now trigger automatically"
