# Admin Submission Sheet — SOC Analyst Prove It grading

## Next AI — start here (updated 2026-10-17, end of day)

**Status:** S1–S6 merged to `master` (PRs #65, #66, #67); the Help Desk
extension is PR #68. Read `docs/handoffs/CLAUDE_ADMIN_SUBMISSION_SHEET_HANDOFF.md`
first: it holds overall status, open owner decisions and next steps. Remaining
work is a staging click-through with owner-provided synthetic accounts. Do not
change module scores. The active verdict rule is recorded below.

How to write a module definition (copy `portal/admin-sheets/soc-m01.js`):

1. Replace the stub's comment body with
   `AdminSubmissionSheet.register(['<lab key(s)>'], { title, fixture, caseId, freeText, rubric, sections })`
   wrapped in `(() => { 'use strict'; if (typeof AdminSubmissionSheet === 'undefined') return; … })();`.
   The stub's header lists the lab key(s), submit code and result keys.
2. `fixture: () => SocMNNAssessmentData` (or the module's `const`), read
   lazily with `typeof X !== 'undefined'` guards. Read every expected value
   from it; constants that live only inline in a scorer are defined once in
   the sheet file with a comment naming the scorer function.
3. Sections in the order the student filled them in. Ticket fields first
   (use `ctx.display('Severity')` for the label the student saw, falling
   back to the option text for attempts without `case_display`).
4. Checks: `test` returns `true | false | 'partial' | null` (null = not
   recorded → grey "Not recorded in this attempt"). Mirror the scorer:
   whatever the scorer gives partial credit for returns `'partial'`.
   `fix` / `fixPartial` are ≤ 2 second-person sentences to the student.
   `when` skips a check (e.g. routing when escalation is not required).
   `required: false` = advisory section (never blocks a pass).
5. Narrative answers: `response: (result, ctx) => [{ label, text }]` (full
   text, never truncated; `text: null` = not recorded). Add
   `checks: [AdminSubmissionSheet.minLengthCheck({ min, text })]` and
   `evidence: { label, text, pieces: [{ name, short, terms }], fix }` —
   one ✓/✗ line per piece, all = pass, some = ◐, none = ✗; matching is
   tolerant (see API below). The writing-mechanics line is added
   automatically under every section with `response`.
6. `rubric: { labels, max, criticalLabels }` for an object `breakdown`
   (M01–M05 style); criterion-list breakdowns (M06+) render with no config.
7. M07/M08: one submit writes 3/2 rows; register all keys, render from
   `ctx.row` (= `item.lead`) and read siblings from `ctx.rows`.
8. Tests: create `tests/admin-sheets/soc-mNN.cases.js` exporting
   `({ run, clone, AdminSubmissionSheet }) => [{ name, row, expect }]`
   (format in the header of `tests/admin-submission-sheet.test.js`; M01's
   file is the example). It is auto-discovered; shared invariants (no JSON
   above the fold, escaping, prefilled feedback = ✗/◐ sections, ◐ worded
   "To strengthen next time:", read-only has no inputs) run on every case.
   Include at least: a perfect attempt (PASS), a wrong attempt (RETURN), a
   partial-credit attempt, and an older attempt missing keys. Run
   `node tests/admin-submission-sheet.test.js` and `node bin/portal-check.js`.
9. Fill your parity table and tick your module in "Current state".

(Original Sprint 0 brief follows.)

Owner request (Alex, 2026-10-17): the instructor review card for a SOC
Analyst Prove It submission must read like **a printed assignment the
teacher marked up in red pen** — not raw JSON, not a stack of debug panels.
Anyone sitting in the instructor seat, with no SOC background, must be able
to review an attempt correctly in a few minutes.

Status: Sprint 0 (spec) and S1 done. S2–S6 below; tick them as they land and
update "Current state".

## The problem today

`adminAttemptReviewCard()` in `portal/app.js` (~line 857) stacks up to nine
blocks per attempt: case ticket panel, capstone panel, response design
panel, M02 access panel, simulator competencies, raw points breakdown,
action history, M04 intel verdicts, system rubric, and a "Full raw result"
JSON dump. `adminCapstoneReviewPanel()` still prints `JSON.stringify` of
determinations/actions. Nothing tells the instructor *which answer was
right*, so they cannot tell whether "Affected device: ws-204" is correct
without opening the module source. There is no single pass/return verdict
and no per-section suggested feedback.

## What the instructor must see (target)

One **Submission Sheet** per Prove It attempt, top to bottom:

1. **Header** — student ID, module + Prove It title, case / incident ID,
   attempt N of M, submitted date/time, system score vs. pass mark.
2. **Verdict banner** —
   - **Recommend PASS** (green banner) when score ≥ pass threshold and the
     module scorer has not flagged a critical failure. Sections that need
     work still show red-pen recommendations and prefilled feedback.
   - **Recommend RETURN** (red) when score is below threshold or the scorer
     flagged a critical failure.
   - Always followed by "This is a recommendation. Your decision below is
     final." Grey "Instructor judgment needed" if a section has no
     automatic check and the rest pass.
3. **How to read this sheet** (one line legend, collapsible after first
   view): ✓ green = matches the answer key · ✗ red = does not match, red-pen
   note says what to fix · ● grey = read it and use your judgment.
4. **Sections, in the same order the student filled them in** (the ITSM
   ticket order from `portal/case-record.js`, then module-specific work):
   Case & status → Severity → Affected user → Affected device →
   Disposition → Escalation & route → module findings → Analyst work notes
   → module work (verdicts, workflow design, evidence, actions, reports…).
   Each section shows:
   - the **student's answer exactly as the student saw it** (display text,
     not option ids),
   - the **sweep**: one line per check — *What we looked for* (plain
     words, the expected value, e.g. "Source IP 203.0.113.45 named in the
     notes") and *Result* (✓ found / ✗ not found / what was given
     instead),
   - a **section status chip** (Pass / Needs work / Judgment),
   - when it fails, the **red-pen note**: a recommendation written to the
     student in plain second-person language ("Name the attacking IP
     (203.0.113.45) in your work notes and say where you saw it.").
     Rendered as red ink in the right margin / under the section.
5. **System rubric** (folded summary of the module scorer's criteria with
   points and misses) — reference only, at the bottom of the sheet.
6. **Teacher notes to send back** — the existing feedback-items block,
   **prefilled with one item per failed section**: label = section title,
   comment = that section's red-pen note(s). The instructor edits, deletes,
   or adds items. Passing sections add no item. Approve / Send back
   buttons unchanged (`submitGradingDecision` writes `lab_attempt_feedback`
   per item — no schema change).
7. **Technical record (debugging)** — the raw JSON, collapsed, last.

The same sheet renders **read-only** for already-decided attempts in the
Lab Attempts record view (`recordRow` inside `adminLabAttemptsPanel`), with
the feedback that was actually sent shown in place of the editable notes.

### Verdict rule (owner, 2026-10-17)

- **Percentages stay.** The header shows the system score % vs. the pass
  mark; the System rubric keeps points per criterion.
- **Recommend PASS** = score ≥ pass threshold and no critical failure was
  flagged by that module's scorer. A red ✗ section does not override a passing
  score; it remains visible and pre-fills a correction for the instructor to
  send with approval. Amber ◐ also does not block a pass and is worded "To
  strengthen next time: …".
- **Recommend RETURN** = score below threshold or a scorer-flagged critical
  failure (such as an unsafe action or the module's safety cap). The
  instructor's decision remains final.

### Narrative sections = key-evidence match (owner, 2026-10-17)

Written answers (work notes, handoff, reports, rationale) are swept for the
**key pieces of evidence** the module expects (IPs, hostnames, accounts,
hashes, alert/evidence IDs, ATT&CK IDs, the conclusion). Each piece is its
own ✓/✗ line. All required pieces found → ✓ pass; some found → ◐ partly
there; none → ✗. Matching is case-insensitive and tolerant (`ws-204` /
`WS204`, defanged IPs `203.0.113[.]45`). Minimum length (case-record
`notesMin`) is a separate check.

### Writing mechanics — low-compute, advisory only (owner, 2026-10-17)

A **"Writing mechanics"** line under every narrative section, computed in
the instructor's browser with plain JS (no dependency, no network, student
text never leaves the page). Advisory: ◐ amber at worst, **never ✗, never
blocks a pass**. Heuristics, each reported as a count with the first
example quoted:

- sentence does not start with a capital letter;
- missing end punctuation on the last sentence;
- lowercase standalone "i";
- repeated word ("the the");
- run-on sentence (> 40 words);
- text-speak (`u`, `ur`, `idk`, `lol`, `pls`, `bc`, `w/`);
- shouting (≥ 3 consecutive ALL-CAPS words that are not acronyms).

Tokens containing digits, dots, dashes, colons, or underscores (IPs,
hosts, IDs, hashes, KQL) are skipped. The red-pen note, if any, is one
line: "Proofread: 3 sentences start lowercase (e.g. 'checked the logs…')."

**Spelling (S6, in scope — owner 2026-10-17: "anywhere there is narrative
work")**: vendor Typo.js + an en_US Hunspell dictionary (~600 KB, MIT/LGPL —
record licence) under `portal/vendor/`, lazy-loaded only when an admin
sheet renders, plus a SOC-terms allowlist (hostnames, product names, KQL
keywords, ATT&CK names, module case vocabulary). It runs on **every**
narrative field the framework marks as narrative — work notes, handoff,
reports, rationale, resolution notes, verdict reasoning — and adds a
"Spelling" line under the writing-mechanics line: count + up to 5 flagged
words, each with its first suggestion, and the words underlined in red in
the student's text. Advisory only (◐ amber at worst). Never sent to an
external grammar/spelling API — student data stays in the browser.

### Plain-language rules (owner: "ANYONE could be an effective instructor")

- No option ids, camelCase keys, or JSON on screen above the debug fold.
- Every check label is a full sentence a non-specialist understands; put
  the jargon term in parentheses after the plain words when needed
  ("Marked as confirmed malicious activity (true positive)").
- Red-pen notes are recommendations to the student: what to change and why,
  ≤ 2 sentences, never just "wrong".
- Expected values are shown to the instructor (never to the student).

### Must stay compliant with `docs/LAB_ASSESSMENT_STANDARD.md`

- The **Student Analyst Response** (work notes, handoff, every written
  answer) is shown in full at readable width, paragraphs preserved, never
  truncated or folded by default.
- **Multiple valid paths:** a check accepts every answer the module's
  scorer accepts (e.g. any of several valid evidence IDs, either spelling
  of a host). If the scorer gives partial credit, the check shows ◐
  "Partly there" (amber) with the red-pen note — it does not hard-fail.
- Competency breakdown, score explanation, and review status stay visible
  (the System rubric section), and the auto-score is labelled a
  recommendation.

## Parity rule — the sheet must show what the student submitted

Owner question: "are all the correct pieces of data there? Does the
submission reflect the same information displayed on the student and
teacher side?" Every module sprint must produce a **parity table** in this
doc: each field/control on the student's Prove It submission (ticket
fields, findings, notes, module-specific records) → the `lab_attempts.result`
key it is saved under → the sheet section that shows it.

- A student-side field that is **not saved** in `result`: add it to that
  module's submit payload (additive only — never change scoring or remove
  keys), and note it. Older attempts without it show "Not recorded in this
  attempt (submitted before 2026-10-17)" — never a blank or a crash.
- A saved key the sheet does **not** show: show it or justify why not in
  the table.
- Labels on the sheet use the same words the student saw (reuse
  `result.case_display` and the module's option `text`).

## Architecture

- `portal/admin-submission-sheet.js` — framework, global
  `AdminSubmissionSheet` with `register(labKeys, definition)`,
  `has(row)`, `render(row, { item, readOnly, sentFeedback })`, and
  `suggestedFeedback(row)` → `[{ item_label, comment }]`.
- `portal/admin-sheets/soc-m01.js` … `soc-m12.js` — one definition per
  module, registered for that module's Prove It lab key(s)
  (`ADMIN_PROVE_IT_LAB_KEYS` in app.js; M07 writes 3 rows and M08 2 rows
  per submit — the definition renders from `item.lead` and may read the
  sibling rows).
- `portal/admin-submission-sheet.css` — sheet styles (paper look, red-pen
  ink, green/red verdict). Tailwind-compatible, no external fonts; red
  pen uses `font-family: "Segoe Print","Bradley Hand","Comic Neue",cursive`
  in `#b91c1c`.
- `portal/index.html` loads the CSS and all 13 scripts **after** the
  module scorers/data files and **before** `app.js`.

Definition shape:

```js
AdminSubmissionSheet.register(['lab-endpoint-investigation'], {
  title: 'Module 05 · PROVE IT — Endpoint & Malware',
  caseId: (result) => 'CASE-…',
  sections: [
    {
      id: 'affected-device',
      title: 'Affected device',
      required: true,
      answer: (result, ctx) => [['Affected device', '…as the student saw it…']],
      checks: [
        {
          label: 'Names the compromised workstation (ws-204)',
          expected: 'ws-204',
          test: (result, ctx) => /* boolean | null (null = not recorded) */,
          given: (result, ctx) => '…what the student put…',
          fix: 'Put ws-204 in Affected device — the EDR alert and process tree both show it.',
        },
      ],
    },
    // a section with no checks renders as "Judgment" (grey)
  ],
});
```

`ctx` = `{ rows, fixture, scorerResult, text }` where `text(result)` is
notes + handoff + all free-text concatenated, lower-cased, for "does X
appear" checks (IPs, hashes, hostnames, account names, ATT&CK IDs).

Answer keys come from the module's own fixture / data files
(`SocM05AssessmentData`, scorer `CRITERIA`, module case spec) — **do not
re-type expected values that a fixture already defines**; read them so the
sheet and the scorer can never disagree. Where no fixture holds the value,
define it once in the sheet file with a comment pointing to the source line.

Wiring in `app.js` (keep small; app.js is shared with other devs):
`adminAttemptReviewCard` → if `AdminSubmissionSheet.has(row)`, render the
sheet in place of the legacy panels (case ticket, capstone, response
design, M02 access, competency, breakdown, student work, intel verdicts,
rubric) and prefill feedback items from `suggestedFeedback(row)`; else
render exactly as today. Same for the read-only record row. HDESK/AIENG
and Learn It / Practice It rows are untouched.

## Out of scope

Learn It / Practice It (autograded), Help Desk and AI/ML tracks, M360,
any Supabase schema/RLS/function change, any change to scores.

## Sprint plan

- [x] **S1 — Framework + M01 reference + wiring** (done 2026-10-17) (strong model). Build
  `admin-submission-sheet.js/.css`, 12 stub definition files, index.html
  tags, app.js wiring (review card + read-only record + prefilled
  feedback), and the full M01 definition with parity table. Add
  `tests/admin-submission-sheet.test.js` (node, no browser): renders a
  passing and a failing synthetic M01 row, asserts verdict, section
  chips, prefilled feedback, no `{"` JSON above the debug fold, and that
  an attempt missing a key renders "Not recorded". Replace the
  `JSON.stringify` in `adminCapstoneReviewPanel` with readable lists.
- [x] **S2 — M02–M05 definitions + parity tables** (implemented).
- [x] **S3 — M06–M09 definitions + parity tables** (definitions and payload
  saves implemented; parity table entries below).
- [x] **S4 — M10–M12 definitions + parity tables** (implemented; M12 covers
  CASE-124821 and child INC-4821/4822/4823 resolutions).
- [ ] **S5 — Verification.** CI, module/spelling tests, portal checks, and
  headless Chrome rendering of 24 synthetic sheets (pass + return for all
  12 modules) are complete. No horizontal overflow; M12 return screenshot
  reviewed. A local authenticated portal click-through remains pending.
- [x] **S6 — Spelling on every narrative field.** Typo.js + vendored
  en_US dictionary, lazy-loaded, SOC allowlist, red underline in the
  student's text, advisory only. Runs after S1, in parallel with S2–S4
  (owns `portal/vendor/` + `portal/admin-sheet-spelling.js` only).

Module sprint checklist (S2–S4), per module:
1. Read the module's Prove It submit code (search `case_display` /
   `review_payload` in `portal/soc-analyst-module-NN*.js`) and its
   assessment data/scorer files.
2. Build the parity table (student field → result key → sheet section).
3. Fill gaps in the submit payload (additive).
4. Write the definition: sections in student order, checks with
   fixture-derived expected values, plain-language labels, red-pen fixes.
5. Add pass + fail synthetic rows for the module to the test file; run it.
6. Record the parity table + caveats under "Current state".

## Current state

**S1 shipped 2026-10-17** (not committed). Sheet renders for M01 only;
M02–M12 keep the legacy review card until their definitions land.

Files:
- `portal/admin-submission-sheet.js` — framework (global `AdminSubmissionSheet`).
- `portal/admin-submission-sheet.css` — paper sheet, verdict border,
  red-pen margin, night-theme overrides.
- `portal/admin-sheets/soc-m01.js` — full M01 definition;
  `soc-m02.js` … `soc-m12.js` — commented stubs (register nothing; each
  names its lab key(s), submit code and result keys).
- `portal/index.html` — CSS link + 13 script tags after every module
  data/scorer file, before `app.js` (`?v=20261017-submission-sheet`).
- `portal/app.js` — `adminHasSubmissionSheet`, `adminFeedbackItemHtml`,
  `adminGradingControlsHtml`, `adminSubmissionSheetReviewCard` (new);
  `adminAttemptReviewCard` returns the sheet card when a definition exists
  (inline guard so its isolated node tests still run); `recordRow` renders
  the sheet read-only; graded rows that render a sheet also load their
  sent `lab_attempt_feedback` (read-only select, existing RLS, chunks of
  100) as `row.sent_feedback`; `runTextAnalyzers(document)` is called
  after admin wiring; `adminCapstoneReviewPanel` shows determinations and
  actions as readable lists (`adminReadableValueHtml`) instead of
  `JSON.stringify`.
- `portal/soc-analyst-module-01.js` — submit payload now also saves
  `result.case_display` (additive; scoring untouched).
- `bin/portal-check.js` — keeps subdirectory script paths (was
  `basename`, which could not load `admin-sheets/…`).
- `tests/admin-submission-sheet.test.js` + `tests/admin-sheets/soc-m01.cases.js`.

### Framework API as built

```js
AdminSubmissionSheet.register(labKeys, definition)
AdminSubmissionSheet.has(row)              // SOCAN rows with a registered lab key only
AdminSubmissionSheet.render(row, { item, readOnly, sentFeedback, notesHtml })  // '' when no definition
AdminSubmissionSheet.evaluate(row, opts)   // structured sheet: sections[], verdict{kind,…}
AdminSubmissionSheet.suggestedFeedback(row, opts) // [{ item_label, comment }]
AdminSubmissionSheet.minLengthCheck({ min, text, label, fix, fixPartial })
AdminSubmissionSheet.matchesText(haystack, term) / matchesAny(haystack, terms)
AdminSubmissionSheet.writingMechanics(text) // { words, issues: [{ id, count, example, text }] }
AdminSubmissionSheet.narrativeFields(row, opts) // [{ key, sectionId, sectionTitle, label, text }]
AdminSubmissionSheet.addTextAnalyzer(async (field) => …)
AdminSubmissionSheet.runTextAnalyzers(rootElement)   // app.js calls it after render
AdminSubmissionSheet.readableHtml(value)   // escaped nested lists (no JSON)
```

Definition keys: `title`, `caseId(result, ctx)`, `fixture()`,
`scorer(result, ctx)` (optional → `ctx.scorerResult`),
`freeText(result, ctx)` (strings searched by `ctx.mentions`; default =
`case_record.notes` + handoff), `rubric` (`{ labels, max, criticalLabels }`
or a function returning rows), `sections[]`. Section keys: `id`, `title`,
`required` (default true), `answer` → `[[label, value]]` (value string,
string[], or null = not recorded), `response` → `[{ label, text }]`,
`checks[]`, `evidence` (group or array of groups), `mechanics` (false to
suppress), `narrative` (true to mark a section narrative without
`response`), `collapsed`, `recordedSince` (adds "(submitted before …)" to
not-recorded text). Check keys: `label`, `expected`, `when`, `test`,
`given`, `fix`, `fixPartial`, `found` (word results Found / Not found).
`ctx` = `{ row, item, rows, result, fixture, scorerResult, display(label),
text(), mentions(term), mentionsAny(terms) }`.

Behaviour:
- **Section status** = worst of its checks: ✗ fail > ◐ partial > grey
  not-recorded > ✓ pass; no graded checks = grey Judgment ("For reference"
  when `required: false`). Evidence pieces count only through their group;
  the mechanics line is ◐ at worst.
- **Verdict** (owner rule): PASS = score ≥ pass mark with no scorer-flagged
  critical failure; RETURN = score below the mark or a critical failure. A
  red ✗ section does not override a passing score, but remains visible and
  prefills correction feedback. Grey "Instructor judgment needed" appears
  only when there is no system score. The banner lists partial, failed,
  advisory and judgment sections for review.
- **Prefilled teacher notes**: one item per ✗ or ◐ section (advisory ones
  included); ◐ items start "To strengthen next time: ". Approve / Return
  buttons and `submitGradingDecision` unchanged.
- **Tolerant matching**: case-insensitive; defanged `[.]`, `(.)`, `[dot]`,
  `[@]`, `hxxp` read as live; identifiers (anything with a digit or
  separator) match as whole tokens with or without separators
  (ws-204 = WS204 = ws_204 = "ws 204", not "news 204" / LAP-4421); plain
  words are substrings ("deni" finds denied).
- **Writing mechanics** (advisory, under every `response` section):
  lowercase sentence start, missing final punctuation, lowercase "i",
  repeated word, run-on (> 40 words), text-speak (u, ur, idk, lol, pls,
  bc, w/), ≥ 3 consecutive all-caps non-acronym words. Tokens with digits,
  dots, dashes, colons or underscores are skipped. Red-pen line:
  "Proofread: 3 sentences start lowercase (e.g. 'checked the logs…')."
- **Narrative fields for S6**: every `response` entry renders as
  `[data-sheet-narrative="<sectionId>:<index>"]` (with
  `data-sheet-narrative-label`) and the exact student text sits in its
  `[data-sheet-narrative-text]` element; `narrativeFields(row)` returns
  the same list without the DOM. `addTextAnalyzer(fn)` registers an async
  analyzer; `runTextAnalyzers(root)` (called by app.js after each admin
  render) awaits each analyzer once per narrative field with
  `{ key, sectionId, label, text, node, textNode, appendLine({ label,
  outcome: 'pass'|'partial', given }), underline(words, title) }`.
  `appendLine` adds an advisory row to that section's sweep table;
  `underline` wraps whole-word matches in `<mark class="ass-underline">`
  (red wavy underline). Both build DOM nodes (no innerHTML). Fields are
  marked `data-sheet-analyzed` so re-runs skip them. S6 only needs to load
  its script (after `admin-submission-sheet.js`) and call
  `addTextAnalyzer`; lazy-load the dictionary inside the analyzer.
  S6's analyzer output does not change `suggestedFeedback` (the notes are
  prefilled before analyzers run) — if spelling should prefill a note,
  that needs a framework change (see Open questions).

Verification run (2026-10-17): `node tests/admin-submission-sheet.test.js`
→ 82 checks (72 synthetic cases across all 12 modules); spelling tests → 18
passed; `node bin/portal-check.js` exit 0; `bash bin/ci-check.sh` exit 0;
`git diff --check` clean. Browser-level sheet renders and staging click-through
remain open. Staging must use `bin/dev.sh`, target STAGING, and an owner-provided
synthetic account.

Module progress: M01–M12 ✓ · spelling ✓ · parity tables filled.

### Open questions

- Case & status (M01) is checked as advisory (In Progress / Pending, not
  Resolved) although the scorer does not score status — Practice It's
  answer key uses In Progress. Owner may want it required or dropped.
- Evidence reviewed (M01) is advisory: the submit gate already forces all
  four evidence items, so it only matters for old attempts.
- Spelling note behavior is implemented and covered by the S6 tests; the
  analyzer adds one editable feedback item after flagging three or more
  misspellings, and leaves edited notes alone.

## Parity tables

### M01 — `lab-soc-escalation` (CASE-012407 / INC-012716)

Student side: `moduleOneProveItCaseConsolePane()`; submit:
`moduleOneFinalizeProveIt()` in `portal/soc-analyst-module-01.js`.
`case_record` is the whole `moduleOneState.lab2` object.

| Student field / control | `lab_attempts.result` key | Sheet section |
|---|---|---|
| Case id + linked incident (ticket header) | `case_display` "Case" / "Linked incidents" (new); fixture `scenario.caseId/incidentId` | 1 Case & status |
| Status select | `case_record.status`; `case_display` "Status" | 1 Case & status (advisory check: not Resolved) |
| Severity select | `case_record.priority` (+ `.severity`); `case_display` "Severity" | 2 Severity |
| Affected User select (8-entry roster) | `case_record.affectedUser`; `case_display` | 3 Affected user (principal ✓ / pivot ◐ / noise ✗) |
| Affected Device select | `case_record.affectedDevice`; `case_display` | 4 Affected device (same tiers) |
| Disposition select | `case_record.verdict` (+ `.disposition`); `case_display` | 5 Disposition |
| Escalation required | `case_record.escalation`; `case_display` | 6 Escalation & route |
| Route to Department (6 options, fit-scored) | `case_record.escalateTo`; `case_display` "Route to department" | 6 Escalation & route (fit 100 ✓ / ≥ 40 ◐ / < 40 ✗) |
| Analyst Work Notes | `case_record.notes` | 7 Analyst work notes (full text, min length, 9 key-evidence pieces, mechanics) |
| Legacy handoff fields (not shown in today's UI; old attempts) | `case_record.handoff.*` | 7 (shown only when non-empty) |
| Log rows opened (middle pane) | `case_record.viewedLogIds` | 8 Evidence reviewed (key rows listed, background rows counted) |
| Evidence items credited (submit gate) | `case_record.reviewedEvidence` | 8 Evidence reviewed (advisory check) |
| Action history | `case_record.actionHistory` | 9 Action timeline (folded, reference) |
| — (scorer) | `breakdown`, `feedback`, `critical_errors` | System rubric (points/max, scorer explanation, critical errors) |

Gap fixed (additive, scoring untouched): **`result.case_display`** — the
ticket rows with the labels the student saw (department names and
disposition wording were otherwise only option ids). Attempts before
2026-10-17 lack it; the sheet rebuilds labels from `case_record` ids +
fixture/option text.

Saved keys deliberately not shown above the debug fold:
`case_record.intake` / `.containment` (legacy pre-ticket multiple-choice
fields, no longer on the student UI), `.expandedLogId` / `.logPage` (UI
state), `.validationError`, `.completed` / `.submitted` / `.attempts`,
`.score` / `.breakdown` (duplicates of the row score and rubric),
`.submittedAt` (header shows `completed_at`). All remain in the technical
record.

### M02 — `lab-identity-investigation` (CASE-025502 / INC-025811)

Student side: `practiceTicketPane()`; submit `submitProve()` in `portal/soc-analyst-module-02-environment.js`. Definition: `portal/admin-sheets/soc-m02.js` (answer key copied from the module IIFE with file:line cites; the cases file fails if the key drifts).

| Student field / control | `lab_attempts.result` key | Sheet section |
|---|---|---|
| Case id, linked incident | `case_display` "Case" / "Linked incidents" | 1 Case & status |
| Status | `case_record.status` | 1 Case & status (advisory: not Resolved) |
| Severity | `case_record.severity` / `.priority` | 2 Severity (High) |
| Affected User (5) | `case_record.affectedUser` (id) | 3 Affected user (John ✓, Cora ◐) |
| Affected Device (5) | `case_record.affectedDevice` | 4 Affected device (wkstn-23 ✓, wkstn-09 ◐) |
| Disposition | `case_record.disposition` / `.verdict` | 5 Disposition |
| Escalation, Route | `case_record.escalation`, `.escalateTo` | 6 Escalation & route (fit 100 ✓, ≥ 40 ◐, else ✗) |
| Access control finding | `case_record.findings['access-finding']` | 7 Access control finding |
| Analyst Work Notes | `case_record.notes` | 8 Analyst work notes (80 chars, 8 key-evidence pieces, mechanics) |
| Action history | `case_record.actionHistory` | 9 Action timeline (folded) |
| (scorer) | `breakdown`, `feedback`, `critical_errors` | System rubric |

Payload: no change needed. Not shown: `case_summary`, `access_review` (duplicates). Not saved: console records opened (exploration).

### M03 — `lab-siem-triage` (CASE-MN-517 / INC-MN-517)

Student side: `m03eCaseRecordView()`, `m03eFindingsHtml()`, `m03eResolutionPanel('prove')`; submit `m03eSubmitAssessment()`. The sheet re-runs `moduleThreeScoreAssessment()` on the saved attempt and reads each rubric item's hit/miss, so checks cannot disagree with the points.

| Student field / control | `lab_attempts.result` key | Sheet section |
|---|---|---|
| Case, Status | `case_display`, `case_record.status` | 1 Case & status (advisory) |
| Severity | `case_record.severity` | 2 Severity (High/Critical ✓, Medium ◐) |
| Affected User / Device | `case_record.affectedUser` / `.affectedDevice` | 3, 4 (advisory: unscored) |
| Disposition | `case_record.verdict` / `.disposition` | 5 Disposition (critical rule) |
| Escalation required | `case_record.escalation` | 6 Escalation required (3 pts) |
| Route to Department | `case_record.escalateTo` | 7 Route (advisory: unscored) |
| 7 account-scope selects | `case_record.accountStatus{}`, `.findings`; `case_display` | 8 Account scope; 9 Other accounts (advisory) |
| Indicators checklist | `case_record.indicators[]` | 10 Indicators to hand off |
| Recommended response checklist | `case_record.actions[]` | 11 Recommended response |
| 4-part handoff, Work Notes | `case_record.handoff{}`, `.notes` | 12 Handoff & work notes |
| Alert-to-incident links | `case_record.alertIncidentLinks[]` | 13 Alert-to-incident links |
| Child incident resolutions | `case_record.incidentResolutions` | 14 Child incident resolutions |
| Pinned evidence | `assessment.selected_evidence[]`, `.pinned_evidence[]` | 15 Evidence pinned |
| Searches | `assessment.query_log` (last 40), `assessment.query_summary` (new) | 16 Search technique (advisory) |
| Action history | `case_record.actionHistory` | 17 Timeline |
| (scorer) | `breakdown`, `feedback`, `simulator_performance` | System rubric |

Payload change (additive): `portal/soc-analyst-module-03-environment.js:1580` adds `assessment.query_summary { total, sources_queried[], cross_source_pivot }` (the scorer reads the full query log; `query_log` keeps 40). Not shown: `case_summary`, `simulator_performance` (duplicates).

### M04 — `lab-detection-rule` (CASE-044424 / INC-044733)

Student side: `m04-assessment` ticket + console; submit `[data-m04-submit-case]` in `portal/soc-analyst-module-04.js`. Console-work sections read each criterion from the saved `breakdown` (full ✓, partial ◐, none ✗; red-pen = scorer's first two miss sentences).

| Student field / control | `lab_attempts.result` key | Sheet section |
|---|---|---|
| Case, incident, Status | `case_display`, `case_record.status` | 1 Case & status (advisory) |
| Severity | `case_record.severity` | 2 Severity (advisory) |
| Affected User / Device (source IP) | `case_record.affectedUser` / `.affectedDevice` | 3, 4 (advisory) |
| Disposition | `case_record.disposition` | 5 Disposition |
| Escalation, Route | `case_record.escalation`, `.escalateTo` | 6 (advisory) |
| Intelligence interpretation, Rule decision | `case_record.findings.*` | 7 Findings (advisory) |
| Indicator verdicts + reasons | `review_payload.intelligenceVerdicts[]` | 8 Indicator verdicts (contradicted ✗) |
| Work Notes (min 100) | `case_record.notes` | 9 Analyst work notes |
| IOC records | `work_summary.iocs[]` (new) | 10 Threat intelligence; 11 Indicator record (advisory) |
| Rules, query, grouping, threshold, window, exclusion, suppression | `work_summary.rules[]` (new) | 12 Detection query and rule |
| Schedule, runs | `work_summary.rules[].schedule`, `.executions[]` (new) | 13 Rule scheduled (advisory) |
| Alerts | `work_summary.alerts[]` (new) | 14 Alerts raised |
| Automation, approvals | `work_summary.automation` (new) | 15 Automation kept safe |
| Action history | `case_record.actionHistory` | 16 Timeline |
| (scorer) | `breakdown`, `review_payload.criteria`, `feedback`, `critical_errors` | System rubric (raw ids rewritten to student wording) |

Payload change (additive): `portal/soc-analyst-module-04.js:1865` adds `result.work_summary: moduleFourWorkSummary(moduleFourState.assessment)` (helper above `let moduleFourState`). Not shown: `case_summary`; scorer `case-documentation` has no own section (covered by disposition/escalation/notes; listed in the rubric).

### M05 — `lab-endpoint-investigation` (CASE-055127 / INC-055436)

Student side: `m05-assessment` ticket + console; submit `[data-m05-submit-case]` in `portal/soc-analyst-module-05.js`. The scorer ignores the ticket, so ticket sections are advisory; console sections read `review_payload.criteria`.

| Student field / control | `lab_attempts.result` key | Sheet section |
|---|---|---|
| Case, Status | `case_display`, `case_record.status` | 1 Case & status (advisory) |
| Severity, User, Device, Disposition, Escalation, Route | `case_record.*` | 2–6 (advisory) |
| Work Notes | `case_record.notes`, `result.notes` | 7 Ticket work notes (advisory; 8 key-evidence pieces) |
| Console analysis notes, corrections, reviews | `work_summary.analysisNotes/analysisUpdates/deviceReviews/eventReviews` (new) | 8 Analysis notes from the console |
| Ancestry, malicious vs updater, persistence, detection vs prevention | `review_payload.criteria` | 9–12 (12 advisory) |
| Selected devices, handoff/request scope | `work_summary.selectedDeviceIds`, `.edrHandoffs`, `.approvalRequests` (new) | 13 Incident scope |
| Evidence package | `work_summary.evidencePackage` (new) | 14 Evidence preserved (advisory) |
| EDR handoffs | `work_summary.edrHandoffs` (new) | 15 EDR handoff (text in full) |
| Isolation/quarantine requests | `work_summary.approvalRequests` (new) | 16 Safe response boundary |
| Action history | `case_record.actionHistory` | 17 Timeline |
| (scorer) | `review_payload.{score,criteria,criticalMisses}` | System rubric |

Payload change (additive): `portal/soc-analyst-module-05.js:1582` adds `result.work_summary: moduleFiveWorkSummary(assessmentState)`. Not shown: `case_summary`, `review_payload.entityIdentity` (answer key).

**M02–M05 caveats / open questions.** (1) Ticket fields the scorer ignores are advisory (M03 user/device/route; M04 and M05 severity/user/device/route/findings; M05 notes). M04 `case-documentation` accepts any escalation value, including "Not required"; M05 ticket notes are unscored. Owner to decide whether any should be required. (2) Low-weight criteria are advisory so a single 0 cannot return a ≥ 70 attempt: M04 IOC record and schedule, M05 detection-vs-prevention and evidence package, M03 secondary accounts and search technique. (3) M02's answer key lives in a module IIFE, so it is copied into the sheet (file:line cites + drift test). (4) M03 attempts saved before `query_summary` may differ slightly on technique if > 40 queries were run. (5) Cases files load module data/scorers into the shared test VM and tolerate "already declared" errors; other agents' files loading the same shared console files need the same guard. (6) Framework gaps worked around: no per-check advisory flag (split into advisory sections) and no native scored-item list (scorer hits fed through the evidence group).

### M06 — `lab-threat-hunt-independent` (CASE-066318)

Student side: independent hunt console; submit `moduleSixFinalizeAssessment()`. Ticket fields are checked against the case key; the investigation's system score comes from `SocM06AssessmentScorer` and rubric. Payload now adds `assessment_work` so the sheet can show the actual investigation.

| Student field / work | `lab_attempts.result` key | Sheet section |
|---|---|---|
| Case, status, severity, user/device, disposition, escalation/route | `case_record`, `case_display` | 1–5 ticket sections (ticket score is advisory) |
| Findings and analyst work notes | `case_record.findings`, `.notes` | Ticket findings; Analyst work notes (evidence and mechanics) |
| Hypothesis and rationale | `assessment_work.hypotheses[]` | Hunt hypothesis |
| Host/account searches, saved queries, runs, pivots | `assessment_work.queryHistory`, `.savedQueries`, `.savedQueryRuns`, `.pivots` | Hunt scope & comparison; Saved query & pivots |
| Bookmarks and evidence collection | `assessment_work.bookmarks`, `.collections` | Evidence collection |
| ATT&CK mappings and rationale | `assessment_work.mappings[]` | ATT&CK mapping |
| Handoff target, evidence, rationale and recommendation | `assessment_work.handoffs[]` | Detection / incident handoff |
| Conclusion, disposition and evidence links | `assessment_work.conclusions[]` | Conclusion & limits |
| — (scorer) | `breakdown`, `review_payload`, `critical_errors` | System rubric and safety check |

Payload change (additive): submit now saves the completed hunt state as
`assessment_work`. Unsupported certainty is a scorer critical miss and score
cap, so it forces RETURN at the 70% threshold.

### M07 — `lab-email-triage`, `lab-network-investigation`, `lab-network-email-independent`

One submit writes the same `result` to all three attempt rows; the sheet renders once from `item.lead` and uses its sibling rows. Answer keys and scoring come from `SocM07AssessmentData`, `SocM07AssessmentRubric`, and `SocM07AssessmentScorer`.

| Student field / work | `lab_attempts.result` key | Sheet section |
|---|---|---|
| Case, status, severity, user/device, disposition, escalation/route | `case_record`, `case_display` | Ticket sections (some scenario-mismatched fields advisory) |
| Analyst work notes | `case_record.notes` | Analyst work notes (evidence and mechanics) |
| Analyst review notes | `assessment_work.reviewNotes[]` | Review notes |
| Email, artifact, and network reviews | `assessment_work.messageReviews[]`, `.artifactReviews[]`, `.networkReviews[]` | Delivery scope; Confirmed chain; Noise rejection |
| Pivots, evidence selection, scope and recipient search | `assessment_work.pivots[]`, `.evidenceChanges[]`, `.scope`, `.recipientSearch` | Confirmed chain; Incident record; Unknowns & limits |
| Incident links | `assessment_work.incidentLinks[]` | Incident record |
| — (scorer) | `breakdown`, `review_payload`, `critical_errors` | System rubric and safety check |

Payload change (additive): submit now saves `assessment_work` with review notes,
pivots, evidence actions, scope, and incident record. Unsupported certainty is
a scorer critical miss and score cap.

### M08 — `lab-vuln-prioritization`, `lab-vuln-queue`

One submit writes the same `result` to both rows; the sheet renders from `item.lead`. Findings and scoring use `SocM08AssessmentData` and the module scorer/rubric.

| Student field / work | `lab_attempts.result` key | Sheet section |
|---|---|---|
| Case, status, severity, user/device, disposition, escalation/route | `case_record`, `case_display` | Ticket sections |
| Work notes | `case_record.notes` | Analyst work notes |
| Review of the current, stale and not-applicable findings | `assessment_work.findingReviews[]` | Finding review |
| Asset context and compensating controls | fixture evidence + `assessment_work.findingReviews[]` | Asset context |
| Incident link and rationale | `assessment_work.incidentLinks[]` | Incident link |
| Finding-specific risk acceptance | `assessment_work.riskAcceptances[]` | Risk acceptance |
| Escalation route, evidence, owner and due date | `assessment_work.escalations[]` | Escalation & route |
| Priority, remediation decision and state transitions | `assessment_work.remediationDecisions[]`, `.remediationTransitions[]` | Remediation |
| — (scorer) | `breakdown`, `review_payload`, `critical_errors` | System rubric |

Payload change (additive): submit now saves `assessment_work` with finding
reviews, incident link, risk acceptance, escalation, remediation and
transitions. No separate critical-failure cap is defined by this scorer.

### M09 — `lab-active-incident` (INC-4937, Operation Cedar Lock)

Student side: independent active ransomware response; the sheet reads the action and response record, and scores sections from the submitted rubric points. Answer keys use `SocM09AssessmentData` and `SocM09AssessmentRubric`.

| Student field / work | `lab_attempts.result` key | Sheet section |
|---|---|---|
| Case, status, severity, user/device, disposition, escalation/route, classification/scope | `case_record`, `case_display` | Ticket and findings sections |
| Analyst work notes | `case_record.notes` | Analyst work notes |
| Priority and ownership | `assessment_work.workflow.severity`, `.assigneeId` | Triage |
| Evidence reviewed and supported scope | `assessment_work.reviewedEvidenceIds[]` + fixture | Evidence & scope |
| Designed response workflow and order | `review_payload.responseReview.workflowDesigns` | Workflow design |
| Evidence preservation before eradication | `assessment_work.actions[]` + fixture | Evidence first |
| Containment, identity/persistence response, approvals and outcomes | `assessment_work.actions[]`, `.workflowEvents[]` | Containment and safe conduct |
| Recovery, monitoring and reopen conditions | `assessment_work.actions[]`, `.workflow.tasks[]` | Recovery |
| Residual risk and escalation text | `assessment_work.workflow.escalationReason`, `.actions[]` | Residual risk & escalation |
| — (scorer) | `breakdown`, `review_payload`, `critical_errors` | System rubric |

Payload change (additive): submit now saves `assessment_work` with triage,
evidence, actions, approval state, workflow events and escalation text. Unsafe
attempts reduce the safe-conduct competency; this scorer defines no whole-score
critical cap.

### M10 — `lab-attack-mapping` (CASE-105510 / INC-5510)

Student side: `moduleTenAssessmentLabPanel()` (console plus ITSM ticket). Submit: `moduleTenFinalizeCase()` in `portal/soc-analyst-module-10.js`. Each work section takes its status from the stored scorer points (`result.breakdown`, 10 per criterion); expected values are read from `SocM10AssessmentData`.

| Student field / control | `lab_attempts.result` key | Sheet section |
|---|---|---|
| Case id, linked incident | `case_display` "Case" / "Linked incidents" | 1 Incident ticket (advisory) |
| Status, Severity, Affected User, Affected Device, Disposition, Escalation, Route | `case_record.*`, `case_display` | 1 Incident ticket (advisory: the M10 scorer scores no ticket field) |
| Analyst Work Notes | `case_record.notes` | 2 Analyst work notes (advisory; min length, 9 key-evidence pieces, mechanics) |
| Evidence placed in the locker | **`evidence_record.locker` (new)** | 3 Evidence collected (`evidence-selection`) |
| Source, method, acquired-by | `evidence_record.locker[*]` | 4 Source and acquisition details (`acquisition-metadata`) |
| Hash verify / re-acquire | `evidence_record.locker[*].integrity`, `.actionHistory` | 5 Hash checks (`hash-integrity`) |
| Custody transfers | `evidence_record.transfers` | 6 Custody transfer (`custody`) |
| Legal hold, exported package | `evidence_record.legalHold`, `.exports` | 7 Legal hold and evidence package (`preservation`) |
| Timeline order | `evidence_record.timeline` | 8 Timeline (`timeline`) |
| Fact / analysis statements | `evidence_record.statements` | 9 Facts versus analysis (`fact-analysis` + no confirmed-exfiltration check) |
| Root-cause statement | `evidence_record.statements[kind=root_cause]` | 10 Root cause (`root-cause`) |
| ATT&CK mappings | **`attack_mappings` (new)**, fallback `case_record.tools.m06.mappings` | 11 ATT&CK mapping (`attack-linkage`) |
| Unknowns, specialist escalation | `evidence_record.unknowns`, `.escalation` | 12 Unknowns and specialist escalation (`unknowns-escalation`) |
| Locker action log | `evidence_record.actionHistory` | 13 Action timeline (folded) |
| — (scorer) | `breakdown`, `feedback`, `review_payload`, `critical_errors` | System rubric |

Not shown above the fold: per-artifact analyst `notes`, `case_record.labProgress`, `.tools.*` (stay in the technical record).

**Payload change (additive, scoring untouched):** `portal/soc-analyst-module-10.js` ~1404-1407 and ~1445-1446 in `moduleTenFinalizeCase`. The locker/reconstruction lives in a separate LabRuntime case state and was never in `case_record`, so the result now also saves `evidence_record` (copy of that state) and `attack_mappings` (normalized list the scorer used). Older attempts lack both: work-section statuses still come from the stored breakdown, answer rows read "Not recorded in this attempt (submitted before 2026-10-17)".

**Caveats:** M10 ticket and notes are not scored, so they are advisory (owner may want them required). ATT&CK fallback for old rows reads the raw workspace copy, which may differ slightly from the normalized one.

### M11 — `lab-exec-report` (OPS-5511, incident INC-4937)

Student side: console tabs (Operations, Reporting, Alerts). Submit: `moduleElevenFinalizeCase()`. No case ticket; the sheet replays `result.action_history` with `SocM11AssessmentState.normalize`. Statuses come from stored `result.criteria` points. No payload change needed.

| Student field / control | `lab_attempts.result` key | Sheet section |
|---|---|---|
| Queue priority order | `action_history[priority]` | 1 Queue priority |
| Per-alert disposition + reason | `action_history[disposition]` | 2 Alert dispositions (recorded vs supported call per alert; reasoning in full; v1 attempts "Not recorded") |
| Assign, Escalate | `action_history[assign/escalate]` | 3 Assignments and escalation (SLA awareness, assignment/escalation) |
| Metrics interpretation | `action_history[metric_interpretation]` | 4 Reading the metrics |
| Flag noisy rule | `action_history[noisy_rule]` | 5 Noisy detection rule |
| Shift handoff | `action_history[handoff]` | 6 Shift handoff |
| Technical report | `action_history[report/technical]` | 7 Technical report (+5 key-evidence pieces) |
| Executive summary | `action_history[report/executive]` | 8 Executive summary |
| Escalation notice | `action_history[report/escalation]` | 9 Escalation notice (advisory, not scored) |
| Closure report | `action_history[report/closure]` (technical if absent) | 10 Closure report and residual risk (+2 open-item pieces) |
| Follow-up / lesson / detection actions | `action_history[improvement_action]` | 11 Follow-up actions and lessons |
| Closure decision | `action_history[closure_decision]` | 12 Closure decision |
| Full log | `action_history` | 13 Action log (folded) |
| — (scorer) | `criteria`, `review`, `rubricVersion`, `criticalMisses` | System rubric |

**Caveat:** a "needs investigation" call on an alert the evidence decides earns no credit and no penalty; it is counted inside the overall criterion, not as a separate ✗.

### M12 — `lab-capstone` (CASE-124821; INC-4821, INC-4822, INC-4823; rubric v3)

Student side: ITSM ticket plus capstone console tabs. Submit: `moduleTwelveFinalize()`. The sheet reads `case_record.assessmentState` first and falls back to `reviewPayload.reviewArtifact`. Competency sections take status from stored points; the CASE ticket, the three INC resolutions, intel verdicts and alert decisions are also checked line by line against `expectedTruth`. v1/v2 attempts render the INC sections as "Not recorded". No payload change needed.

| Student field / control | `lab_attempts.result` key | Sheet section |
|---|---|---|
| Parent CASE, title, child incidents + status | `case_display`; `assessmentState.incidents` | 1 Parent CASE and ticket |
| Severity, Affected user/device, priority rationale | `case_record.*`; `ticketCore` in investigation actions | 1 (scored via ticketCore) |
| Disposition, Escalation, Route | `case_record.*`, `case_display` | 2 Ticket routing (advisory) |
| INC-4821/4822/4823 status, disposition, note, evidence, linked alerts | `assessmentState.incidents`, `.incidentLinks`; fallback `studentDeterminations.incidents` | 3-5 one section per INC |
| Intel verdicts TI-601..605 + rationale | `assessmentState.intelligence` | 6 Threat intelligence verdicts |
| Alert verdicts + reasons | `assessmentState.dispositions`, `.alertReviews` | 7 Alert decisions |
| Queries, rule, schedule | `queryRuns`, `rules`, `schedules` | 8 Queries, detection rule and schedule |
| Domain findings | `investigations` | 9 Cross-domain investigation |
| Pinned evidence, timeline, scope, ATT&CK | `selectedEvidence`, `investigations`, `attackMappings` | 10 Timeline, scope, evidence and ATT&CK |
| Workflow, approvals, executions | `workflows`, `approvals`, `executions`, `reviewPayload.unsafeExecution` | 11 Tuning and containment (+ no-unsafe-action check) |
| Recovery | `recovery` | 12 Eradication and recovery |
| Notes, priority/scope/exec/closure text, technical, executive, lessons, handoff | `case_record.notes`, `.findings.*`, `reports`, `handoffs` | 13 Reports, handoff and lessons (+7 key-evidence pieces) |
| Closure decision | `closure` | 14 Closure decision (advisory) |
| Competency table, explanation, cap, actions | `reviewPayload.reviewArtifact.*`, `breakdown` | 15 Competency results (folded) + System rubric |

**Caveats:** (1) `sections[]` is static, so M12 names the three child incidents once in `soc-m12.js` (cited to `soc-m12-assessment-data.js` 15-19); a function-valued `sections` in the framework would remove this. (2) One unresolved child incident or a wrong ticket severity can lose 1–3 of 12 points while still allowing a passing score; the sheet recommends PASS and prefills a correction note, as requested. (3) Scorer quirk, unchanged: a technical report mentioning a benign record such as BEN-101 loses its report credit.
