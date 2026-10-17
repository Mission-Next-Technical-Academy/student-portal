# Admin Submission Sheet — SOC Analyst Prove It grading

## Next AI — start here (2026-10-17, S1 shipped — framework + M01 + wiring)

**S1 is done** (uncommitted on `feat/admin-submission-sheet`; the lead
commits). S2–S4 agents start cold from this block and run **in parallel**:
each owns **only** `portal/admin-sheets/soc-mNN.js`,
`tests/admin-sheets/soc-mNN.cases.js`, its own module's submit payload (if a
parity gap needs an additive key) and its own `### MNN` heading under
"Parity tables" below. Do not edit the framework, `app.js`, `index.html`,
or the shared test file — if the framework needs something, write it down
under "Current state → Open questions" instead. S6 owns
`portal/vendor/` + `portal/admin-sheet-spelling.js` (+ one script tag).

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
   - **Recommend PASS** (green banner, green sheet border) when every
     *required* section passes the sweep **and** score ≥ pass threshold.
   - **Recommend RETURN — N sections need work** (red) otherwise.
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
- **Recommend PASS** = score ≥ pass threshold **and** no required section is
  ✗ red. ◐ amber sections do **not** block a pass — they still prefill a
  teacher-note item (worded as "To strengthen next time: …") so the
  instructor can approve *with* feedback.
- **Recommend RETURN** = score below threshold, or any required section ✗.

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
- [ ] **S2 — M02–M05 definitions + parity tables** (parallel).
- [ ] **S3 — M06–M09 definitions + parity tables** (parallel).
- [ ] **S4 — M10–M12 definitions + parity tables** (parallel; M12 covers
  CASE-124821 and child INC-4821/4822/4823 resolutions).
- [ ] **S5 — Verification.** `bin/ci-check.sh`, node tests, headless
  Chrome render of all 12 sheets (pass + fail rows) against the local
  portal with `*.supabase.co` aborted; screenshot review for readability;
  update this doc.
- [ ] **S6 — Spelling on every narrative field.** Typo.js + vendored
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
- **Verdict** (owner rule): PASS = score ≥ pass mark and no required ✗;
  RETURN = score below the mark or any required ✗; grey "Instructor
  judgment needed" only when the attempt has no system score. The banner
  also lists ◐ sections ("does not block a pass"), advisory ✗ sections
  and grey sections to read.
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
→ 16 checks (6 M01 cases); `node bin/portal-check.js` exit 0; `node
--check` on all portal/ui JS; `git diff --check` clean; full `tests/*.test.js`
sweep — only `guided-lab-console-guide`, `soc-m04-assessment-rubric`,
`soc-m04-assessment-scorer`, `soc-m05-assessment-console` fail, and they
fail identically on a clean HEAD (pre-existing). Headless-Chrome screenshot
of the M01 pass / return / partial / older / read-only sheets reviewed.
Not yet done: live click-through against staging (S5).

Module progress: M01 ✓ · M02–M12 stubs (S2–S4).

### Open questions

- Case & status (M01) is checked as advisory (In Progress / Pending, not
  Resolved) although the scorer does not score status — Practice It's
  answer key uses In Progress. Owner may want it required or dropped.
- Evidence reviewed (M01) is advisory: the submit gate already forces all
  four evidence items, so it only matters for old attempts.
- Spelling notes from S6 cannot prefill teacher-note items yet (analyzers
  run after the notes are built). Decide whether S6 should append a
  feedback item to the card itself.

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

### M02
_(S2)_

### M03
_(S2)_

### M04
_(S2)_

### M05
_(S2)_

### M06
_(S3)_

### M07
_(S3)_

### M08
_(S3)_

### M09
_(S3)_

### M10
_(S4)_

### M11
_(S4)_

### M12
_(S4)_
