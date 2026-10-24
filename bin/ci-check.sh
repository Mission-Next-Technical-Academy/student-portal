#!/usr/bin/env bash
# Deterministic, read-only gate for pull requests and deployments.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo '== JavaScript syntax =='
find portal ui -type f -name '*.js' -print0 | xargs -0 -n1 node --check

echo '== Portal module render =='
node bin/portal-check.js

echo '== Module card states =='
node tests/module-card-state.test.js

echo '== Help Desk returned-lab resubmit =='
node tests/hdesk-returned-lab-resubmit.test.js
node tests/hdesk-module-page-states.test.js
node tests/hdesk-capstone-review.test.js

echo '== Help Desk curriculum minutes =='
node bin/its-curriculum-check.js

echo "== M03 normalization lab re-wire =="
node tests/m03-normalization-lab-rewire.test.js
node tests/m03-incident-unlink.test.js

echo '== Live refresh =='
node tests/live-refresh.test.js

echo '== Lab evidence files =='
node tests/hdesk-evidence-upload.test.js
node tests/lab-attempt-evidence-panel.test.js

echo '== Simulator route render and navigation =='
node bin/render_all.js

echo '== SOC entity identity lint (strict, read-only) =='
node scripts/soc-entity-identity-lint.js --strict --no-write

echo '== Diff whitespace =='
git diff --check

echo '== IAM SSH access review =='
node portal/imported-labs/mission-next-labs/scripts/iam-review-check.mjs
