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

echo "== M03 normalization lab re-wire =="
node tests/m03-normalization-lab-rewire.test.js
node tests/m03-incident-unlink.test.js

echo '== Prove It below-pass save and submitted latch =='
node tests/below-pass-prove-it.test.js

echo '== M01 UAT fixes =='
node tests/m01-uat-fixes.test.js

echo '== Ticket missing-list live refresh =='
node tests/case-record-live-panel.test.js

echo '== Live refresh =='
node tests/live-refresh.test.js

echo '== Case-state unload recovery =='
node tests/case-state-unload-recovery.test.js

echo '== Sign-out clears local student state =='
node tests/signout-clears-local-state.test.js

echo '== Faculty roster =='
node tests/faculty-roster.test.js

echo '== Grading badge counts only gradable Prove It =='
node tests/grading-badge.test.js

echo '== Approved below pass =='
node tests/approved-below-pass.test.js

echo '== Admin Submission Sheet =='
node tests/admin-submission-sheet.test.js

echo '== Lab evidence files =='
node tests/hdesk-evidence-upload.test.js
node tests/lab-attempt-evidence-panel.test.js

echo '== Simulator route render and navigation =='
node bin/render_all.js

echo '== Diff whitespace =='
git diff --check

echo '== IAM SSH access review =='
node portal/imported-labs/mission-next-labs/scripts/iam-review-check.mjs
