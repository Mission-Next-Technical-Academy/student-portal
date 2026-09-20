# Final Curriculum Scenario QA — 2026-09-10

Scope: `CURRICULUM_SCENARIO_ARCHITECTURE.md` Sprint 14 (final QA). This is a
local QA record; curriculum, compliance, and faculty approval remain pending.

## Results

- **Locked hour ledger: PASS for the SOC program data.** Evaluated
  `portal/data.js`: 12 SOC modules total 4,200 minutes (1,800 theory + 2,400
  lab = 70 technical hours); M360 totals 720 minutes (12 hours); combined
  total is 4,920 minutes / 82 hours. The declared compliance ledger remains
  70 technical + 12 M360 = 82 total, with 42 theory / 40 lab including the
  separately accounted M360 companion.
- **Security+ boundary: PASS after minimal wording cleanup.** Security+
  reference notes in Modules 01–11 now identify the §2 mapping as a
  supplementary developer draft pending curriculum/compliance/faculty review
  and disclaim approval, affiliation, endorsement, and pass guarantees.
  Module 12 has no Security+ reference block; its capstone copy remains
  general SOC training and does not make a certification claim.
- **Portal module end-to-end harness: PASS.** `node bin/portal-check.js`
  rendered all SOC modules 01–12 and the companion program overview; no module
  view failure was reported.
- **Simulator route/render sweep: PASS.** `node bin/render_all.js` reported
  `views: 129/129 render clean; dead NAV routes: 0`.
- **State isolation: PASS.** `node bin/lab-state-check.js` passed all six
  reset/isolation checks.
- **Syntax and whitespace: PASS.** `node --check` passed for all portal module
  files, `portal/data.js`, and `portal/app.js`; `git diff --check` passed.
- **Local HTTP health: PASS.** Ports 8768 (portal) and 8767 (simulator) each
  returned HTTP 200.

## Curriculum checker limitation

`node bin/curriculum-check.js` was run and returned 69 failures. These are
repository-wide baseline/schema mismatches rather than a failure of the locked
SOC ledger: the checker still requires the older 16-positive-minute-lab shape,
does not accept the Sprint 5/7/8 zero-minute independent lab catalogue rows,
and includes legacy IT Support catalogue records whose module/parent files are
not present. It consequently also reports aggregate totals of 3,780 lab
minutes and a stale `CURRICULUM_MAP.md`. The direct `PROGRAMS`/`LABS` ledger
calculation above is the authoritative Sprint 14 check; no broad checker or
legacy catalogue rewrite was made.

## Commands

```text
node bin/curriculum-check.js                 # FAIL: 69 known baseline mismatches (see above)
node bin/portal-check.js                     # PASS: SOC 01–12, companion modules, overview
node bin/render_all.js                       # PASS: 129/129, dead NAV routes 0
node bin/lab-state-check.js                  # PASS
node --check portal/soc-analyst-module-{01..12}.js
node --check portal/data.js portal/app.js    # PASS
git diff --check                             # PASS
curl http://127.0.0.1:8768/                 # HTTP 200
curl http://127.0.0.1:8767/                 # HTTP 200
```

No real network, authentication, or destructive response action was used.
The architecture document is intentionally not archived by this QA pass; the
coordinator owns archival after accepting this checkpoint.
