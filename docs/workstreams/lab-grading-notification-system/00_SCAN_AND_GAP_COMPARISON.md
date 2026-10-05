# Scan & Gap Comparison — Lab Grading & Notification System

**Scope of this scan:** `portal/app.js` (the whole app lives in this one
file plus per-module files), checked directly against every point in
`INITIAL_BRIEF.md`. Read-only recon — nothing built or changed this pass.

## What already exists (don't rebuild these)

| Piece | Evidence | Notes |
|---|---|---|
| Per-attempt auto-scoring | `recordLabAttempt()` (`portal/app.js:3332`) inserts `state`, `score`, `result` (a JSON blob) per `lab_attempts` row | This is the "pregraded" data point #2 in the brief wants to surface — it already exists, just isn't read by any admin UI yet. |
| A 70% pass threshold, already in the data model | `recordLabAttempt()` hardcodes `pass_threshold: 70` on every insert; `persistPortfolioArtifact()` does the same (`portal/app.js:3357`) | The number the brief asks for is already being written per-record. What's missing is anything reading/enforcing it — see gaps below. |
| Rubric/engine versioning | `rubric_version: 'soc-analyst-rubric-v1'`, `scoring_engine_version: 'portal-client-scorer-v1'` on the same inserts | Useful existing scaffolding for the "why it was wrong" data — the `result` JSON is the natural home for per-parameter detail, but its shape isn't standardized yet (see gaps). |
| Admin panel exists, with tabs | `viewAdmin()` (`portal/app.js:4933`), tabs wired via `dataset.adminTab` (~line 6097): progress, activity, cohorts, archived students | No "grading" tab of any kind currently. |
| Course/program card component | `tile()` (`portal/app.js:741`), used for the admin landing tiles (e.g. `#/admin` "All Students" card, line 760) | Single-line flex row, `px-3 py-2.5`, `count` slot already exists as a plain string (e.g. "12 students") — this is the card the brief wants a "N Labs need grading" badge added to. Currently has no badge/alert styling, only a plain count label. |
| Self-reported gaps already known to this project | `portal/app.js:935` `staticallyMissing` list: scoring-engine version not stamped/stored per record *(partially wrong now — it is stamped, see above; this list may be stale)*, no record of grade corrections/overrides, grading scale defined in docs but not stored as report-queryable data | Confirms the project already knew part of this gap existed; nobody had connected it to an admin-facing feature yet. |

## Confirmed gaps (nothing found for any of these)

1. **No per-card notification/badge anywhere.** Grepped `portal/app.js` for
   `grading`, `gradeQueue`, `pendingGrad`, `ungraded`, `instructorNote`,
   `recommendedAction` — the only hit in the entire file is the
   `staticallyMissing` string at line 935. There is no grading queue, no
   per-course pending count, no badge component.
2. **No admin "grading" tab.** The tab set at `viewAdmin()` is progress /
   activity / cohorts / archived students only.
3. **No per-parameter wrong/why data model.** `lab_attempts.result` is a
   free-form JSON blob (`{}` default) with no standardized shape for "which
   field failed + why" — this needs a schema decision before any admin UI
   can render it (brief's open question #2).
4. **No instructor feedback fields, no send-back/redo action anywhere.**
   Nothing resembling "handwrite feedback per wrong item" or a "send back
   to student" button exists in `portal/app.js`, in any
   `soc-analyst-module-*.js`, or in any Supabase migration checked this
   pass.
5. **No enforcement of the 70% threshold.** It's stored on the row but
   nothing reads it to gate `complete` state, block progression, or trigger
   a redo. `moduleCompletion()` (per `docs/handoffs/NEXT_SESSION.md`'s own notes,
   `portal/app.js:2866`) currently only checks `contentOpened &&
   allLabsComplete` — no score comparison against `pass_threshold` was found
   in that path.
6. **Card size confirmed too small as described.** `tile()`'s
   `px-3 py-2.5` single flex row has no secondary line/badge slot — matches
   the brief's own observation exactly; this needs a layout change, not
   just an added `<span>`.

## Net read
The brief's core premise — "the lab is already pregraded, the system
already knows what's wrong" — is correct and closer to reality than it might
sound: `lab_attempts.score`/`result`/`pass_threshold` already exist per
attempt. The entire admin-facing half of this feature (surfacing it,
badging it, letting an instructor annotate and send it back, gating on 70%)
is unbuilt from zero. This is a genuinely new build, not a fix to something
broken.

## What has to be decided before Sprint 1 can start
Same three items as `INITIAL_BRIEF.md`'s "Open questions," now sharpened
against real schema:
1. **Redo granularity** — `lab_attempts` scores a whole attempt today; a
   parameter-level redo needs either a new sub-row per parameter or a
   structured `result.parameters[]` array with independent pass/fail per
   entry. This is the single decision that shapes the rest of the schema
   work — recommend resolving it first.
2. **Feedback storage shape** — one new table (e.g.
   `instructor_lab_feedback`) with a row per flagged parameter (`lab_attempt_id`,
   `parameter_key`, `what_was_wrong`, `why`, `how_to_fix`, `sent_at`) is the
   natural fit given decision #1's likely direction — but wait for #1.
3. **Notification scope** — global-to-all-admins vs. per-cohort/instructor
   assignment. Affects whether the badge count query filters by instructor
   or not.

## Next step
Do not start building until the three decisions above are made — same
posture the root POA&M already takes with its own three open decisions.
Once decided, `01_SPRINT_PLAN.md` in this directory gets written next,
scoped only to this feature (badge → tab → schema → feedback UI → redo →
70% gate), sequenced so each sprint is small enough for a single
haiku-subagent pass, per this project's established workflow
(`~/.claude/playbooks/promptware-killchain-sprints.md`-style one-sprint-per-agent
pattern, same idea used elsewhere in this repo per `docs/handoffs/NEXT_SESSION.md`).
