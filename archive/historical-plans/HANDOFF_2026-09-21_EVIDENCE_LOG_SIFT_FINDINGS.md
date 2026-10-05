# Findings — evidence log-sift mechanic (2026-09-21)

**Status:** Investigation only. No code changed this session. This is
pre-work input for `ROADMAP.md` item 3 ("Module 1 SIEM performance
assessment"), which is not yet unblocked (depends on items 1 and 2). Do not
start heavy implementation from this doc alone — confirm scope with the
owner first, per the roadmap's agent protocol.

## How this session started

Owner asked why "Submit Case" was greyed out on the Prove It case (NST-2407,
Module 1). Root cause, confirmed live in the browser via `localStorage`
inspection: every other requirement was met (evidence reviewed, user/device
set, severity/disposition/escalation set) except the analyst work note,
which was 40 characters against an 80-character minimum
(`portal/soc-analyst-module-01.js:502`). **Not a bug** — working as
designed. No code change needed for that specific question.

## Owner's follow-on vision (verbal, this session)

While looking at that panel, the owner independently arrived at several
realism ideas for the SOC simulator:

1. **ServiceNow-style feedback loop** — student submits a case, it comes
   back with instructor notes on what was wrong, student revises and
   resubmits. This is already the intended design of roadmap item 2
   (Faculty-gate live UAT: "student submit → faculty return → resubmit →
   approve → Module 2 unlock"), currently blocked on controlled credentials.
   No new design needed — this is confirmation the existing plan is right,
   not a new ask.
2. **Free text over dropdowns** — clicking a pre-built option list doesn't
   feel like a real investigation. Owner's instinct: typed answers are more
   realistic than `<select>` menus. Not scoped or actioned this session —
   see "Open questions" below.
3. **Practice It should coach students to dense raw logs, not hand them an
   answer.** For the guided/coached lab specifically, a coach should tell
   the student *where* to look, then the student sifts a dense, realistic
   log page to find the answer themselves — not click a pre-summarized
   evidence card. Owner was emphatic logs must be dense in general, but
   accepted roughly one page of log rows per evidence item is enough for
   this particular module.
4. **Per-evidence "go to logs" button** — on the left pane of the
   ServiceNow-style case console, each evidence item should have its own
   button that jumps to the relevant raw log view, where the student picks
   out (or types) the correct entry to satisfy that evidence item.
5. **"Standard logs language"** — plain, realistic log-table format (the
   kind of column layout a real SIEM/log viewer uses), not narrative prose
   cards.

## Key discovery: most of #3/#4/#5 is already built, but disconnected

Went looking for the closest existing thing before designing anything new.
Found a substantially complete version of exactly this mechanic, authored
but **never wired up**:

- `ui/data.js:6849` — `SIGNIN_LOG_EVENTS`: a real ~20-row Entra-style
  sign-in log table for the simulator route `#/entra/sign-in-logs`. Already
  dense and deliberately unsorted with benign/decoy rows mixed in (own code
  comment: "the failure burst is findable, but only by filtering"). This
  already matches the "standard log language, dense, ~one page" ask, for
  ALT-1001 / j.santos.
- `portal/data.js:1822-1859` — the ALT-1001 evidence items already carry
  `prompt` / `template` / `blanks` (with per-blank `answer`, `accept`
  variants, and a `hint`) designed for exactly a "read the real log, then
  record what it showed" exercise. Own code comment: "Facts 1-3 are
  recorded, not revealed: the student read them in the console walkthrough
  and now writes them down from the log."
- `portal/soc-analyst-module-01.js:678` — `moduleOneBlankForm(fact)`
  renders this: masked character-by-character input boxes (not free text,
  not a dropdown — a middle ground), progressive hints after failed
  attempts, forgiving matching (`moduleOneBlankCorrect` /
  `moduleOneNormalize`, case/punctuation-insensitive), and a **"Reopen the
  log" link that deep-links into the real simulator**
  (`${SIM_ORIGIN}?coach=m01&restart=1#/entra/sign-in-logs`).
- **But `moduleOneBlankForm` is never called anywhere in the render path.**
  Confirmed by grep — only the function definition exists, no invocation.
  The live Practice It evidence buttons
  (`moduleOneEvidenceList`, click-wired at
  `portal/soc-analyst-module-01.js:1321`) just push the clicked evidence id
  straight into `reviewedEvidence` — no log lookup, no typing, no masked
  form. It's an orphaned prior attempt at this exact feature, not dead
  weight to remove — it's most of the reusable answer to the owner's ask.
- Confirmed live in the browser: inspecting
  `localStorage['mnt-portal.lab-state.v1.m01-first-soc-alert-v2.student-51252ac0']`
  shows `practice.actionHistory` recording all three remaining ALT-1001
  evidence items as "reviewed" within under one second of each other —
  consistent with simple click-through, not real log research.
- NST-2407 (Prove It / independent case,
  `portal/data.js:1897-1909`) has **no** `template`/`blanks`/log-sift data
  at all — its evidence array is plain label/detail text only. The
  mechanic exists only for ALT-1001 (Practice It) and isn't built for Prove
  It's multi-source case (identity + endpoint process chain + proxy +
  phone callback) at all — only a sign-in log dataset exists; there's no
  equivalent raw endpoint/EDR or proxy/network log dataset yet.

## Next session — concrete options, needs an owner decision first

1. **Smallest coherent step**: revive `moduleOneBlankForm` and wire it into
   the ALT-1001 Practice It evidence-review flow so evidence items open the
   masked recall form (pointing at the already-dense `SIGNIN_LOG_EVENTS`
   log) instead of instant-toggling reviewed. This uses only already-authored
   content — no new log data needed for ALT-1001's 3 sign-in-log-backed
   facts (the 4th, the phone callback, is intentionally handed over, not
   quizzed).
2. **Bigger step, needs new content**: extend the same pattern to NST-2407
   (Prove It). Needs new raw-log datasets in "standard log language" for
   endpoint/EDR process execution and proxy/network telemetry — those don't
   exist yet, only the sign-in log does. Per the module's own existing
   design comment (`soc-analyst-module-01.js:745-748`), Practice It is
   "coached... hints and highlighted option help are fine"; Prove It is the
   graded artifact and should probably drop the progressive-hint scaffolding
   even if it reuses the masked-recall UI — check this against
   `INSTRUCTIONAL_ARCHITECTURE.md`'s guidance-reduction curve before
   building.
3. **Per-evidence "go to logs" button** (owner's ask #4): not designed yet.
   The current "Reopen the log" link is single and static, always routing to
   `#/entra/sign-in-logs` regardless of which evidence item is open. For a
   multi-source case like NST-2407 this would need to route to a different
   simulator view per evidence item (sign-in logs vs. endpoint/EDR vs.
   proxy/network vs. none for the phone callback).
4. **Free text vs. dropdown** (owner's ask #2): not scoped. Worth weighing
   against instructor-gradeable consistency — the masked-input format
   already is a middle ground (typed, not clicked, but format-constrained
   enough to auto-grade). Bring this to the owner before touching the
   ticket `<select>` fields (severity/disposition/escalation/etc.).
5. **ServiceNow return-with-notes loop** (owner's ask #1): no action needed
   — already the target shape of roadmap item 2, just blocked on controlled
   credentials for live UAT.

None of this is unblocked yet per `ROADMAP.md`'s dependency order (item 3
depends on items 1 and 2). Read `ROADMAP.md` first next session; treat this
doc as scoping input for item 3, not an approved subtask on its own.
