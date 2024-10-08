#!/usr/bin/env bash

# modified from: https://reemus.dev/tldr/git-tag-versioning-script

# exit on errors and print commands
set -euo pipefail

# verify if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  printf "\nError: repository has uncommitted changes\n\n"
  exit 1
fi

# get latest tag
GIT_TAG_LATEST=$(git describe --abbrev=0 | sed 's/^v//')
# default to v0.0.0
if [ -z "$GIT_TAG_LATEST" ]; then
  GIT_TAG_LATEST="0.0.0"
fi

echo -n "Using last tag: $GIT_TAG_LATEST"

# increment version number

# get version type from first argument passed to script
VERSION_TYPE="${1-}"
VERSION_NEXT=""

if [ "$VERSION_TYPE" = "patch" ]; then
  # increment patch version
  VERSION_NEXT="$(echo "$GIT_TAG_LATEST" | awk -F. '{$NF++; print $1"."$2"."$NF}')"
elif [ "$VERSION_TYPE" = "minor" ]; then
  # increment minor version
  VERSION_NEXT="$(echo "$GIT_TAG_LATEST" | awk -F. '{$2++; $3=0; print $1"."$2"."$3}')"
elif [ "$VERSION_TYPE" = "major" ]; then
  # increment major version
  VERSION_NEXT="$(echo "$GIT_TAG_LATEST" | awk -F. '{$1++; $2=0; $3=0; print $1"."$2"."$3}')"
else
  printf "\nError: invalid VERSION_TYPE arg passed, must be 'patch', 'minor' or 'major'\n\n"
  exit 1
fi

echo -n "Bumping version to: $VERSION_NEXT"

# update files

echo -n "Writing to CHANGELOG.md"
sed -i "s/^# CHANGELOG for.*/# CHANGELOG for v$VERSION_NEXT/" CHANGELOG.md
echo -n "Writing to app/manifest.json"
sed -i "s/^  \"version\": .*/  \"version\": \"$VERSION_NEXT\",/" app/manifest.json
echo -n "Writing to app/ts/constants.ts"
sed -i "s/^export const VERSION: string = \".*/export const VERSION: string = \"$VERSION_NEXT\";/" app/ts/constants.ts
echo -n "Writing to app/js/constants.js"
sed -i "s/^export const VERSION = \".*/export const VERSION = \"$VERSION_NEXT\";/" app/js/constants.js

echo -n "Committing changes"
git add .
git commit -m "bump to v$VERSION_NEXT"

echo -n "Tagging commit"
git tag -a "v$VERSION_NEXT" -m "v$VERSION_NEXT"

echo -n "DONE :)"

git push origin --follow-tags
