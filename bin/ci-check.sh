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

echo '== Generic Assessment Lab box saves honestly and locks while waiting =='
node tests/module-assessment-submit.test.js

echo '== Coach labs survive reload and relaunch (Help Desk + SOC Module 1) =='
node tests/coach-reload-resume.test.js

echo '== Help Desk Prove It mode: no coach, no answers, machine state =='
node tests/hdesk-prove-mode.test.js

echo '== Help Desk Prove It Submit: honest save, faculty review, no score =='
node tests/hdesk-prove-submit.test.js

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

echo '== Diff whitespace =='
git diff --check

echo '== IAM SSH access review =='
node portal/imported-labs/mission-next-labs/scripts/iam-review-check.mjs
