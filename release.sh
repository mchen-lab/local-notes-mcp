#!/bin/bash
set -e

# Help / Usage
if [ -z "$1" ]; then
    echo "Usage: ./release.sh [patch|minor|major|<version>]"
    echo ""
    echo "Examples:"
    echo "  ./release.sh patch   # 0.1.0 -> 0.1.1"
    echo "  ./release.sh minor   # 0.1.0 -> 0.2.0"
    echo "  ./release.sh major   # 0.1.0 -> 1.0.0"
    echo "  ./release.sh 1.5.0   #       -> 1.5.0"
    exit 1
fi

BUMP_TYPE=$1

# 1. Ensure git is clean
if [[ -n $(git status -s) ]]; then
    echo "❌ Error: Git working directory is not clean. Please commit or stash changes first."
    exit 1
fi

echo "=== 🚀 Starting Release: $BUMP_TYPE ==="

# 2. Bump version in root package.json (no-git-tag-version prevents double tagging for now)
#    We will handle the git commit/tag manually after syncing workspaces
NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version)
# Remove 'v' prefix if npm added it, for cleaner usage
VERSION_NUM=${NEW_VERSION#v}

echo "📝 Bumped root version to $VERSION_NUM"

# 3. Sync version to workspaces manually (using npm version in workspaces)
echo "🔄 Syncing version to workspaces..."
npm version $VERSION_NUM --workspace=backend --no-git-tag-version --allow-same-version > /dev/null
npm version $VERSION_NUM --workspace=frontend --no-git-tag-version --allow-same-version > /dev/null

# 4. Git Commit and Tag
echo "📦 Committing and Tagging..."
git add package.json backend/package.json frontend/package.json
git commit -m "chore: release v$VERSION_NUM"
git tag -a "v$VERSION_NUM" -m "Release v$VERSION_NUM"

echo "✅ Created local tag: v$VERSION_NUM"

# 5. Push to Remote
echo "⬆️  Pushing to origin..."
git push origin main --follow-tags

echo ""
echo "🎉 Release v$VERSION_NUM completed successfully!"
echo "   - package.json files updated"
echo "   - Git tag pushed"
echo "   - GitHub Action should now trigger automatically"
