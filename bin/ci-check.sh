#!/usr/bin/env bash
# Deterministic, read-only gate for pull requests and deployments.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo '== JavaScript syntax =='
find portal ui -type f -name '*.js' -print0 | xargs -0 -n1 node --check

echo '== Portal module render =='
node bin/portal-check.js

echo '== Simulator route render and navigation =='
node bin/render_all.js

echo '== Diff whitespace =='
git diff --check

echo '== IAM SSH access review =='
node portal/imported-labs/mission-next-labs/scripts/iam-review-check.mjs
