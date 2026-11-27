#!/usr/bin/env bash
# Deterministic, read-only gate for pull requests and deployments.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo '== JavaScript syntax =='
find portal ui -type f -name '*.js' -print0 | xargs -0 -n1 node --check

echo '== Portal module render =='
node bin/portal-check.js

echo '== Test-account progress reset (admin RPC calls, browser-state clearing) =='
node tests/test-account-reset.test.js

echo '== Module card states =='
node tests/module-card-state.test.js

echo '== SOC Instructor Guide tab (no guide content shipped; SOC staff only) =='
node tests/soc-instructor-guide.test.js

echo '== Help Desk module order (display numbers and weeks) =='
node tests/hdesk-module-order.test.js

echo '== Help Desk returned-lab resubmit =='
node tests/hdesk-returned-lab-resubmit.test.js
node tests/hdesk-module-page-states.test.js
node tests/hdesk-capstone-review.test.js

echo '== Generic Assessment Lab box saves honestly and locks while waiting =='
node tests/module-assessment-submit.test.js

echo '== Coach labs survive reload and relaunch (Help Desk + SOC Module 1) =='
node tests/coach-reload-resume.test.js
node tests/coach-step-advance-race.test.js

echo '== Help Desk coach panel keeps Windows wording; SOC stays neutral =='
node tests/neutral-terminology-coach-panel.test.js

echo '== Help Desk HD-2101 scenario (regression test; kept for Module 8) =='
node tests/hdesk-m01-practice.test.js

echo '== Help Desk console features: off by default, each one on per ticket =='
node tests/hdesk-console-features.test.js
node tests/hdesk-m02-console-features.test.js
node tests/hdesk-m03-console-features.test.js
node tests/hdesk-m04-console-features.test.js
node tests/hdesk-m05-console-a.test.js
node tests/hdesk-m05-console-b.test.js
node tests/hdesk-m06-console-a.test.js
node tests/hdesk-m06-console-b.test.js
node tests/hdesk-m06-guided-lab.test.js
node tests/hdesk-m06-practice-tickets.test.js
node tests/hdesk-m06-page.test.js
node tests/hdesk-m06-prove.test.js
node tests/hdesk-m07-console-a.test.js
node tests/hdesk-m07-console-b.test.js
node tests/hdesk-m08-console-a.test.js
node tests/hdesk-m09-console-a.test.js
node tests/hdesk-m09-console-b.test.js
node tests/hdesk-m09-guided-lab.test.js
node tests/hdesk-m09-practice-tickets.test.js
node tests/hdesk-m08-console-b.test.js
node tests/hdesk-m08-guided-lab.test.js
node tests/hdesk-m08-practice-tickets.test.js
node tests/hdesk-m08-page.test.js
node tests/hdesk-m09-page.test.js
node tests/hdesk-m07-guided-lab.test.js
node tests/hdesk-m07-practice-tickets.test.js
node tests/hdesk-m07-page.test.js
node tests/hdesk-m07-prove.test.js
node tests/hdesk-m08-prove.test.js
node tests/hdesk-m09-prove.test.js
node tests/hdesk-m10-console-a.test.js
node tests/hdesk-m10-console-b.test.js
node tests/hdesk-m10-guided-lab.test.js
node tests/hdesk-m10-practice-tickets.test.js
node tests/hdesk-m05-guided-lab.test.js
node tests/hdesk-m05-practice-tickets.test.js
node tests/hdesk-m05-page.test.js
node tests/hdesk-m05-prove.test.js
node tests/hdesk-m04-vm-screen.test.js
node tests/hdesk-m04-guided-labs.test.js
node tests/hdesk-m04-practice-tickets.test.js
node tests/hdesk-m04-page.test.js
node tests/hdesk-m04-prove.test.js
node tests/hdesk-m03-guided-lab.test.js
node tests/hdesk-m03-practice-tickets.test.js
node tests/hdesk-m03-page.test.js
node tests/hdesk-m02-guided-lab.test.js
node tests/hdesk-m02-practice-tickets.test.js
node tests/hdesk-m02-page.test.js
node tests/hdesk-m02-prove.test.js
node tests/hdesk-m03-prove.test.js
node tests/hdesk-m01-guided-lab.test.js
node tests/hdesk-m01-practice-tickets.test.js
node tests/hdesk-m01-ticket-1d.test.js
node tests/hdesk-m01-orientation.test.js
node tests/hdesk-m01-checks.test.js
node tests/hdesk-m01-practice-lab.test.js
node tests/case-state-save-result.test.js

echo '== Help Desk Prove It mode: no coach, no answers, machine state =='
node tests/hdesk-prove-mode.test.js

echo '== Help Desk Prove It Submit: honest save, faculty review, no score =='
node tests/hdesk-prove-submit.test.js
node tests/hdesk-prove-resubmit-fresh-log.test.js
node tests/hdesk-faculty-grading.test.js
node tests/hdesk-prove-auto-score-sheet.test.js

echo '== SOC Prove It: server recommendation on the Submission Sheet =='
node tests/soc-prove-server-recommendation.test.js
node tests/signout-prove-caches.test.js

echo '== Help Desk curriculum minutes =='
node bin/its-curriculum-check.js

echo "== M03 normalization lab re-wire =="
node tests/m03-normalization-lab-rewire.test.js
node tests/m03-incident-unlink.test.js

echo '== Prove It below-pass save and submitted latch =='
node tests/below-pass-prove-it.test.js

echo '== M01 UAT fixes =='
node tests/m01-uat-fixes.test.js

echo '== Ticket missing-list live refresh =='
node tests/case-record-live-panel.test.js


echo '== M02 Prove It title =='
node tests/m02-prove-it-title.test.js

echo '== Reviewed below-pass Prove It =='
node tests/below-pass-review-state.test.js


echo '== M02 Prove It title =='
node tests/m02-prove-it-title.test.js

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
node tests/soc-m12-capstone-risks.test.js

echo '== Simulator route render and navigation =='
node bin/render_all.js

echo '== SOC entity identity lint (strict, read-only) =='
node scripts/soc-entity-identity-lint.js --strict --no-write

echo "== New migrations are dated after master's newest =="
bash bin/ci/check-migration-order.sh

echo '== Staging automation scripts and workflow boundaries (offline, throwaway git repos) =='
node tests/staging-sync-scripts.test.js

echo '== Diff whitespace =='
git diff --check

echo '== IAM SSH access review =='
node portal/imported-labs/mission-next-labs/scripts/iam-review-check.mjs
