# Boots2Bytes → Mission Next Migration: Restart Point (2026-09-23)

**Read this file first if you are resuming the Boots2Bytes migration.** It is
a pointer/status document only. It does not restate the discovery content,
does not add a migration matrix, and does not authorize any simulator or
runtime change.

## Status

**Wave 1 gate: ACCEPTED 2026-09-23** by the owner (Alex). Both Epic A
deliverables were reviewed and accepted as-is:

- Story A1 — `docs/BOOTS2BYTES_LAB_INVENTORY.md` (status line: "Corrected
  Story A1 inventory") — accepted.
- Story A2 — `docs/MISSION_NEXT_LAB_ARCHITECTURE.md` (status line: "Story A2
  discovery complete; implementation not started") — accepted.

Acceptance basis: the 8 architecture follow-up findings (§9 of that doc) and
the pre-existing Module 2 CI case-sensitivity mismatch (§7 of that doc) are
logged as open follow-up work, not defects in the discovery itself.

**Epic B has not been authorized.** Accepting the discovery documents does
not, by itself, authorize starting the crosswalk. Do not create
`docs/LAB_MIGRATION_MATRIX.md` and do not touch any Mission Next or
Boots2Bytes source file until the owner gives an explicit, separate
go-ahead to proceed to Epic B.

## Read in this order

1. `docs/LAB_ASSESSMENT_STANDARD.md` — mandatory background; every Prove It /
   assessment decision in this migration must satisfy it.
2. `docs/BOOTS2BYTES_MIGRATION_AGILE_HANDOFF.md` — the actual plan: corrected
   source-of-truth, constraints, Epics A–E, Definition of Ready. This is the
   controlling document for what happens next.
3. `docs/BOOTS2BYTES_LAB_INVENTORY.md` — Story A1: inventory of the real
   Boots2Bytes application, with reuse classification per component.
4. `docs/MISSION_NEXT_LAB_ARCHITECTURE.md` — Story A2: audit of the Mission
   Next side (Module 1/2 trace, persistence/review audit, the pre-existing
   Module 2 CI failure, and the proposed shared adapter seam).
5. `docs/LAB_MIGRATION_MATRIX.md` — Epic B: the full crosswalk mapping every
   inventoried Boots2Bytes component onto the existing 12 modules, with
   priority (P0–P3 / not recommended) and a per-domain grouping meant to
   become Epic D's non-overlapping agent assignments. Drafted, not yet
   owner-reviewed.

## Corrected source-of-truth (do not re-discover this)

```text
SOURCE (read-only)  /home/alex/Downloads/Boots2Bytes SOC Analyst Track
DESTINATION         /home/alex/Mission_Next_Technical_Academy_SOC_Analyst_course
```

`/home/alex/boots2bytes-range` is a different, unrelated small Next.js
project. It is **not** the Boots2Bytes SOC Analyst Track and was ruled out
during this discovery pass — see AGILE_HANDOFF §1 for how the mistake was
caught and corrected.

The real Boots2Bytes source already carries extensive user changes and must
stay read-only during migration discovery: do not reset, clean, checkout,
format, or overwrite it (AGILE_HANDOFF §4).

## Validation already performed (do not repeat blindly — re-verify if stale)

- `npm run check` against the Boots2Bytes source: `Project check passed.`
  Source worktree fingerprint recorded before/after inventory work
  (`git status --porcelain=v1 --untracked-files=all` hash) confirms no source
  file was modified (LAB_INVENTORY §"Validation and source-preservation
  evidence").
- `node bin/portal-check.js 2` and `bash bin/ci-check.sh` were run against
  Mission Next. JS syntax passed; the run stops at a Module 2 portal-render
  failure, `exit 1` (`bin/ci-check.sh` uses `set -e`, so later gates —
  simulator render/navigation, whitespace — did not execute this run).

## Known blocker: pre-existing Module 2 CI failure

Not caused by this migration work; documented for the next session so it
isn't re-diagnosed from scratch (full detail in ARCHITECTURE §7):

- `bin/portal-check.js`'s authored-branch check does an exact,
  case-sensitive match for `Prove It · Assessment Lab`.
- The live Module 2 heading renders as `Prove It · assessment lab`
  (lowercase `assessment lab`) — the section, launch control, workspace,
  case form, submit handler, and review presenter all exist and work.
- Recommended direction (not yet implemented): make the render gate's
  recognition structural (a data marker / target ID) instead of a string
  match, so the contract doesn't ride on capitalization. A one-character
  capitalization fix would make this specific run pass but leaves the same
  brittleness in place — ARCHITECTURE §7 recommends against that shortcut.

## Other open findings carried into the next stories (ARCHITECTURE §9)

These are audit findings, not authorized changes:

1. Module 2's render-gate text sniff should become a structural marker
   (see blocker above).
2. Reconcile Module 1's submitted result with the current
   `simulator_performance.actions` server predicate, or deliberately replace
   it with the current semantic case-action contract.
3. All Prove submissions — including failing/partial ones — must be durable
   and reviewable; "submitted" and "passed" must not be conflated.
4. Human disposition should be required for Module 2 and future Prove
   completions, with an adjustable reviewed/final score model.
5. Move Module 2 drafts to `loadCaseState()` / `saveCaseState()` if
   cross-device resume becomes a product requirement.
6. Normalize competency/evidence/action payloads and add the assessment
   tests `docs/LAB_ASSESSMENT_STANDARD.md` requires.
7. Make returned Module 2 work editable/resubmittable via the existing
   latest-attempt redo signal.
8. Reconcile the platform's generic Assessment Lab `in_progress` submission
   state with the completed-only grading queue.

## Definition of Ready for implementation (AGILE_HANDOFF §9 — unchanged, still open)

- [x] Corrected Boots2Bytes inventory replaces the superseded file.
- [x] Mission Next architecture audit is complete.
- [x] Both discovery documents reviewed and accepted by the owner (Wave 1 gate) — accepted 2026-09-23.
- [x] Migration matrix (`docs/LAB_MIGRATION_MATRIX.md`) drafted 2026-09-23 (Epic B) — **not yet owner-reviewed.**
- [ ] Actual migration domains and file ownership approved.
- [ ] Module 2 CI baseline defect understood — **done**, see blocker above;
      fix itself is not yet implemented.
- [ ] Shared adapter contract documented (candidate seam proposed in
      ARCHITECTURE §8; not yet written up as a standalone contract doc).
- [ ] No agents have overlapping write scopes.

## Explicit stop condition

Discovery acceptance (above) is done, and Epic B (`docs/LAB_MIGRATION_MATRIX.md`)
has been drafted. **Epic C and Epic D are still not authorized.** Do not
create shared-adapter code, start a domain migration agent, or change any
file under Boots2Bytes source, `portal/`, `ui/`, or `supabase/` until the
owner has reviewed `docs/LAB_MIGRATION_MATRIX.md` and separately says to
proceed.

If resuming without the owner present, the only safe next action is to
present `docs/LAB_MIGRATION_MATRIX.md` for review and ask whether to
proceed to Epic C/D — not to start implementation on your own initiative.
