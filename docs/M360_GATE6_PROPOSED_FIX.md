# M360 gate failure: causes, fixes, and prevention

Updated 2026-09-24. Delivered through PR #34.

## What failed and why

| Cause | Correction | Why it prevents recurrence |
| --- | --- | --- |
| Gate 6 required `coachReturn === 'm01'` in `m360-entry.js`, although the shared login flow in `app.js` owns it. Four other required tokens describe retired overlay code and survive only in comments. | Remove the obsolete overlay assertions and check the current `viewPortalWithDiscovery` entry and active-enrollment helper. Preserve script ordering, eligible tracks, separate M360 link, and forbidden progress-call checks. | The gate follows the current entry contract instead of requiring retired login implementation details. This static check does not claim to exercise login behavior. |
| A change to shared `portal/index.html` triggered Gate 6, whose boundary check rejected technical LMS files even when no M360 product file changed. | Apply both technical-runtime and migration restrictions only when the diff includes M360 product changes. | SOC-only and workflow-only PRs no longer inherit M360-specific restrictions, including the old migration allowlist. |
| Browser tests default to the local portal server at `localhost:8768`, while CI serves the repository root at `127.0.0.1:4173`. | Both browser workflows explicitly set `M360_TEST_BASE_URL=http://127.0.0.1:4173/portal`. | The tests use the same origin and document root as the server that CI starts. The local default still works with `bin/serve.py`. |
| An unterminated comment in `portal/app.js` swallowed `missionNextAdditionalLabsSection`'s declaration. | Close the comment before the function declaration. | The portal parses and renders again; deterministic application checks cover rendering. |

The first round of corrections was already present when this follow-up began.
Run [35997426549](https://github.com/Mission-Next-Technical-Academy/student-portal/actions/runs/35997426549)
records the boundary false alarm. Commit `6e41aa8` then passed all five PR checks.
This follow-up completes migration scoping, removes the remaining retired-token
assertions, and makes the boundary policy independently testable.

## Permanent regression coverage

`bin/m360-gate-boundary.py` receives NUL-delimited paths from the PR's merge-base
diff. M360 product scope includes `portal/m360/`, `portal/m360-entry.js`,
`portal/m360-preview.*`, and SQL migrations with `m360` in the filename.

Seven tests in `tests/test_m360_gate_boundary.py` cover unrelated changes,
shared-shell changes, each protected technical track, each M360 entry point,
the eight approved migrations, rejection of unapproved migrations in M360 PRs,
and the command's actual success/failure exit status. Gate 6 runs these tests,
and changes to the checker or tests trigger Gate 6 themselves.

The existing M360 restrictions remain enforced for M360 product changes.
New M360 migrations still require an intentional allowlist update and review.
The existing privacy, attendance, academic-control, and portfolio checks remain
part of Gate 6. Future legitimate contract changes can require corresponding
test updates; these fixes address the observed failures, not every possible
future CI failure.

## Validation and delivery

Local validation passed:

- All seven boundary regression tests.
- Every non-event-specific Gate 6 shell step.
- `bash bin/ci-check.sh`: JavaScript syntax, 48 module renders, program overview,
  and 129/129 simulator views with zero dead navigation routes.

GitHub checks on the final PR commit provide the browser and release results.
PR #34 also contains existing SOC/imported-lab work; consult its complete diff
before merging. Updating this PR does not deploy GitHub Pages. The workflow
fix becomes the default after the PR is merged into `master`.
