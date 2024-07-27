#!/usr/bin/env bash

# modified from: https://reemus.dev/tldr/git-tag-versioning-script

# Exit script if command fails or uninitialized variables used
set -euo pipefail

# Verify repo is clean
# List uncommitted changes and
# check if the output is not empty
if [ -n "$(git status --porcelain)" ]; then
  printf "\nError: repository has uncommitted changes\n\n"
  exit 1
fi

# Get latest version from git tags and strip "v"
GIT_TAG_LATEST=$(git describe --abbrev=0 | sed 's/^v//')

# If no tag found, default to v0.0.0
if [ -z "$GIT_TAG_LATEST" ]; then
  GIT_TAG_LATEST="0.0.0"
fi

echo $GIT_TAG_LATEST

exit 0

# ==================================
# Increment version number
# ==================================

# Get version type from first argument passed to script
VERSION_TYPE="${1-}"
VERSION_NEXT=""

if [ "$VERSION_TYPE" = "patch" ]; then
  # Increment patch version
  VERSION_NEXT="$(echo "$GIT_TAG_LATEST" | awk -F. '{$NF++; print $1"."$2"."$NF}')"
elif [ "$VERSION_TYPE" = "minor" ]; then
  # Increment minor version
  VERSION_NEXT="$(echo "$GIT_TAG_LATEST" | awk -F. '{$2++; $3=0; print $1"."$2"."$3}')"
elif [ "$VERSION_TYPE" = "major" ]; then
  # Increment major version
  VERSION_NEXT="$(echo "$GIT_TAG_LATEST" | awk -F. '{$1++; $2=0; $3=0; print $1"."$2"."$3}')"
else
  # Print error for unknown versioning type
  printf "\nError: invalid VERSION_TYPE arg passed, must be 'patch', 'minor' or 'major'\n\n"
  # Exit with error code
  exit 1
fi

# ==================================
# Update manifest file (optional)
# assuming Rust project with Cargo.toml
# modify this as needed for your project
# ==================================

# Update version in Cargo.toml
sed -i "s/^version = .*/version = \"$VERSION_NEXT\"/" Cargo.toml

# Update Cargo.lock as this changes when
# updating the version in your manifest
cargo generate-lockfile

# Commit the changes
git add .
git commit -m "build: bump Cargo.toml version - v$VERSION_NEXT"

# ==================================
# Create git tag for new version
# ==================================

# Create an annotated tag
git tag -a "v$VERSION_NEXT" -m "Release: v$VERSION_NEXT"

# Optional: push commits and tag to remote 'main' branch
git push origin main --follow-tags
