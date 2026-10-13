# Status note — capstone and backlog, 2026-10-09

Plain-language status of the Mission Next SOC course backlog, written after the
2026-10-09 cleanup session. The full detail lives in the docs linked below.

## Ground rules now in force

- **No front-end, UX or UI architecture changes** (owner, 2026-10-09). Guided
  Labs and Assessment Labs stay as they are and where they are. Fixing a
  function inside them is allowed.
- **Repo rules** (`docs/operations/AI_AGENT_RULES.md`, added 2026-10-07 in #46):
  every change goes feature branch → PR → owner approval → squash merge. No
  direct pushes to `master`. Agents test on staging only, never production.

## Done today (PRs open, waiting for the owner to merge)

All checks pass on each PR. Together on master they give 104/104 tests and CI
green. The auto-mode classifier blocked the agent from merging, so the owner
merges:

```
gh pr merge 47 --squash --delete-branch
gh pr merge 48 --squash --delete-branch
gh pr merge 49 --squash --delete-branch
```

| PR | What it does |
|---|---|
| #47 | CI runs the telemetry entity lint with `--strict`. Null-Host rule aligned with the contract (AlertQueue and ShiftLog exempt). M01 is excluded via `STRICT_EXEMPT_MODULES` until its identity fix lands in the shared `portal/data.js`. |
| #48 | Fixes the 4 tests that kept failing (M04 rubric and scorer, M05 console, console guide). All were stale tests, not code bugs. Only `tests/` changed. |
| #49 | M12 capstone logic fixes. Retires the unused `alert-disposition` type. `load()` no longer re-saves on every load after a jsonb key reorder. An approved, in-scope action with a partial or failed result no longer trips the 69 cap. |

Small leftover: harmless dead `alert-disposition` references remain in
`soc-analyst-module-12.js:274` and the M12 rubric evidence lookups.

## Capstone work from last week: three parts

### 1. M12 rebuild (form wall → integrated console + ticket) — DONE

Plan: `docs/workstreams/M12_INTEGRATED_CAPSTONE_PLAN.md`. Sprints S0–S5 are
complete. **Only remaining:** account UAT (§6 of that plan): submit M12 with a
designated learner account, check the faculty review view, sign out and back in
to confirm the attempt stays locked, and confirm historical attempts keep their
score. This needs the controlled test accounts on **staging**.

### 2. "The capstone asks for things earlier modules never taught" — PARTLY DONE

Plan: `docs/workstreams/CAPSTONE_SKILL_BACKFILL.md`. Map and guard test:
`portal/soc-capstone-traceability.js`, `tests/capstone-traceability.test.js`
(`KNOWN_GAPS`).

**Done (Sprints 1–4, pushed 2026-10-07):**
- M04: judging whether an indicator is malicious, benign or unknown, with a rationale
- M09: response workflow designer, and unsafe attempts are recorded
- M03 and M11: the "needs investigation" disposition
- the traceability map that ties every capstone mechanic to where it is taught and tested

**Not done: 11 capstone mechanics still have no Practice It (Guided Lab) home:**

| Mechanic | Would be taught in |
|---|---|
| `rule-saved`, `rule-scheduled` (save and schedule a detection rule) | M04 Guided Lab |
| `attack-mapping`, `attack-unsupported-deduction` | M06 Guided Lab |
| `evidence-preserved-before-eradication` | M09 Guided Lab |
| `recovery-persistence-removed`, `recovery-restored`, `recovery-validated` | M09 Guided Lab |
| `report-lessons` (lessons learned) | M11 Guided Lab |
| `alert-incident-link`, `alert-incident-link-unrelated-deduction` | M08 (no Practice or Prove home at all) |

⚠️ **Decision needed.** Closing these gaps means adding guided steps, which
conflicts with the no-UI-change rule. The planned Sprints 5–9 were put on hold
on 2026-10-09. Owner options:
- **(a)** Make an exception and build them: 5 small sprints.
- **(b)** Drop them and accept that students meet these 11 tasks for the first
  time in the capstone.

### 3. Bugs from last week's full course test run

Source: `docs/workstreams/LIVE_COURSE_UAT_AND_GRADING_UX.md` (bug table).

**Capstone and grading (important):**

| # | Problem | Kind |
|---|---|---|
| 72 | Typing the executive summary in the M12 ticket silently replaces the Reporting-tab executive report, including its attached evidence. | Real bug; fixable without UI changes |
| 71 | The M12 executive-report rule requires naming evidence IDs or entities, but the v1 rule bans IPs, technique IDs and hashes in it. | Owner content decision |
| 73 | The instructor dashboard shows the test student at 11/12 while verified progress is 12/12 (soc-05 `module_progress` row still `in_progress`). | Data or view bug; may need a migration (staging first, owner approves) |
| 74 | Every student shows "Coursework 0 / 18", including a 12/12 completion. | Bug; investigate `work_items_completed` |

**Minor or owner decisions (other modules):** #31, #32, #33, #34, #40, #44, #45,
#46, #55, #58, #60, #61, #62, #64, #65. Several are copy changes, styling, or
realism decisions, and some fall under the no-UI rule.

"Where to start" issue: nothing is written down under that name. The closest is
the M12 mission cue pointing at Log Search while those queries didn't count;
that was fixed on 2026-10-07 (`0ecb59d`). Ask the owner if it was something else.

## Other open items

- **Faculty-gate live UAT** (ROADMAP #2): unblocked once the test accounts are
  confirmed to exist on **staging**. Credentials come from the owner each
  session; they are never stored in the repo.
- **Record IDs Phase B**: M03 and M09–M12 still use old IDs (e.g. `INC-4937`).
  Renaming needs load-time alias normalizers.
- **M01 entity identity** in the shared `portal/data.js`: needs coordination
  with the other developers. After it lands, remove M01 from
  `STRICT_EXEMPT_MODULES`.
- **Owner decisions still owed:** weight rebalances for M04, M09 and M11, and
  M04 `excludeEventIds`.
- **Module completion integrity** for M02–M12 (ROADMAP #4): waits on the
  faculty-gate UAT.
- **Housekeeping:** stale agent worktrees under `.claude/worktrees/` and the
  temporary branch `integ-check-20261009` can be removed.

## Open questions for the owner

1. Merge #47–#49 (commands above).
2. Missing capstone skills: (a) build them as an exception, or (b) drop them?
3. Send agents at #72, #73 and #74?
4. Do the two test accounts exist on staging?
