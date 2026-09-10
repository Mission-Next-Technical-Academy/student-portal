# SOC Analyst course standardization — sprint plan & progress ticker

Source spec: `course_SOC_standardized.md` (do not archive until every sprint
below is `done` — house rule in `archive/README.md`).

**Scope assumption (stated, not yet confirmed by the site owner):** this
applies to the **SOC Analyst track only** (`portal/soc-analyst-module-
NN.js`, Modules 1-12) — the source doc's module numbering and Security+
framing match that track, not IT Support or M360. If that's wrong, stop
after the current sprint and say so.

Working model: **open agent, sprint, close agent, repeat.** One
`general-purpose` subagent per sprint, `model: haiku`, run sequentially
(later sprints depend on earlier ones' shared components). Agents never run
git or push. Orchestrator (this session) reviews the diff, runs
verification, commits locally only, updates this file's Sprint log + Next
action, then opens the next agent. No pushes to `origin/master` — this repo
auto-deploys to GitHub Pages on push.

**Progress ticker:** the Sprint log table below is the durable ticker —
updated after every close-agent step. This session will also post a
one-line chat update after each sprint closes (`Sprint N done: <what
changed>. M/17 sprints complete.`).

**Token-budget tracking:** this session has visibility into a running
"tokens left" counter (shown in this session's own system reminders, not
exposed to agents). The orchestrator will report the current remaining
count in each chat update after a sprint closes, so the site owner can see
consumption trend and call a stop before the session runs out mid-sprint.
There's no way to expose this to the *sub*agents themselves — it's
session-level, not visible inside a spawned agent's own context.

**Video lectures — clarified scope:** actual video recording/production is
outside what a coding agent can do. "Video lecture" sprints below produce a
written **script/outline** (8-15 min pacing, matching the source doc's
segment structure) plus a UI **placeholder slot** (a labeled embed point a
human can drop a real video URL into later) — not a rendered video asset.
Flagging this now so it isn't silently reinterpreted as "skip video
entirely" partway through.

---

## Next action

`status: complete` — all 17 standardization sprints are closed. The plan is
ready to move to `archive/completed-feature-notes/`; the independently tracked
Module 01 assessment remains blocked by compliance authority and is not part
of this plan's completion decision.

Historical Sprint 13 brief: this was **Module 01 alignment**, flagged
in this file's own sprint-log row as "Highest-care sprint — most existing
content to preserve": apply the shared progress/nav shell + quiz-bank
engine to Module 01's already hand-built content
(`MODULE_01_ENHANCEMENT_PROGRESS.md` sprints 1-6, already done) without
regressing any of it, and without touching that file's still-open sprint
7-9 scope. Module 01 is also by far the largest module file (~95K chars
vs. 20-40K for the others), so budget more review time than prior
sprints. Sprints 14-16 (Module 12 capstone, three parts) and 17 (final QA)
come after this one, in that order — see their rows below.

**Sprint 12 found the most serious defects yet — a crash on first render,
a dead quiz after the first interaction, and a real duplicate id — none of
which the agent's own verification caught, and two of which are a NEW
class of bug this plan hadn't seen before:**

1. **Crash**: the agent misunderstood `selectQuizQuestions()`'s actual
   return shape. Each entry in `selectedQuestions` is a wrapper
   `{conceptId, conceptTitle, question, shuffledOptions, correctIndex}` —
   the question fields live at `entry.question.id`/`.prompt`, and options
   at `entry.shuffledOptions`, NOT `entry.id`/`.prompt`/`.options` directly
   on the wrapper. The agent's quiz-panel renderer used the wrong (flat)
   shape, so `entry.options.map(...)` threw `Cannot read properties of
   undefined` on every single render — the module didn't render at all.
   `node --check` and a syntax-only smoke test are both blind to this
   (`.options` is valid JS, just undefined at runtime); the orchestrator
   only found it by actually running `node bin/portal-check.js`, which the
   agent's own throwaway verification script apparently didn't equivalently
   exercise. **Every future sprint's brief must show the exact real return
   shape of `selectQuizQuestions()` inline** (not just describe it in
   prose) so an agent can't independently misinfer field names, and the
   orchestrator must always run the actual `bin/portal-check.js` harness
   itself, never trust an agent's own claimed "ran a smoke test, it
   passed" without re-running it independently.
2. **Dead quiz after one interaction, a NEW bug class**: this agent
   rendered the quiz into a wrapping `<section>`/`<div>` rather than
   re-rendering the `<form>` element itself, and captured its
   change/submit listeners on the form once at initial wire time. The
   established safe pattern (Modules 05-09) works specifically because the
   render target for a re-render **is the form element itself** — HTML's
   fragment-parsing rules drop a nested `<form>` tag when the parsing
   context is already a form, so `form.innerHTML = panelHtml()` (where
   `panelHtml()` returns a fresh `<form id="...">`) silently keeps the
   *original* form node (and its listeners) alive while only swapping its
   children. Render into anything OTHER than the form element itself (a
   wrapping div/section) and that protection doesn't apply — the real form
   node gets destroyed on the first re-render, silently killing every
   listener bound to it. **This same bug was independently reproduced by
   auditing Module 10 (already committed, sprint 11) — its
   `moduleTenRenderQuiz()` renders into a `#m10-quiz-panel` wrapper div,
   not the form itself, so Module 10's quiz is provably broken after a
   student answers the first question.** Both fixed this session — Module
   11 in this sprint's diff before commit, Module 10 via a follow-up
   correction commit (see its row below). **Every future sprint's brief
   must state explicitly**: re-render the quiz by setting `.innerHTML` on
   the persistent `<form>` element itself (`document.getElementById('m0X-
   quiz-form')`), never on a wrapping div/section — and if in doubt,
   copy Module 08's `moduleEightRenderQuiz()`/`wireModuleEightQuiz()` verbatim
   shape, not just skim it for structure.
3. **Duplicate id across non-adjacent lines**: `id="m11-knowledge-check"`
   appeared on both the progress-shell's own section wrapper and the quiz
   panel's own inner `<section>` — a real bug, but also **exposed a hole
   in the orchestrator's own verification command**: `grep -no 'id="..."'
   | sort | uniq -c` prefixes each match with its line number before
   sorting, so two identical ids on *different* lines were never flagged
   as a repeat (every previous sprint's real duplicate-id bugs happened to
   land on the same source line, which is why this went undetected until
   now). **Fixed the check itself**: drop `-n` from the grep — `grep -o
   'id="..."' | sort | uniq -c | awk '$1>1'` — and use that corrected form
   in every future sprint's verification, this file's row-comment
   included. Also confirmed the pre-existing `m11-feedback`/`m0X-quiz-
   feedback` ~3-4x repeats across every module are not bugs — they're
   deliberately reused ids across mutually-exclusive conditional render
   branches (only one ever exists in the live DOM at once), the same
   established pattern in every already-shipped module; don't flag those.

Citations were, as usual, mostly broken too (secondary to the above): 5 of
6 draft sources were bad — a withdrawn NIST revision, a NIST doc with the
right-sounding title over the wrong document (SP 800-83, already known
from Module 05 to be about malware handling, not incident metrics), a
generic SANS directory listing (the same anti-pattern caught in Sprint
10), a generic CISA listing page (404), and a bare organization homepage
misrepresented as a specific handbook. Replaced with the established NIST
SP 800-61 Rev. 3, a live CISA IR/vulnerability playbooks page, FIRST.org's
education/training catalog, and NIST's CSF 2.0 landing page, alongside the
existing CompTIA citation — 5 unique, verified sources.

Byte-identity check on all four protected data constants and eleven
protected render/scoring functions confirmed zero corruption from either
the agent's draft or the orchestrator's fixes.

**Sprint 11: structurally clean again (no corruption, no wiring bugs) —
citations were the only real defect, 3 of 7 this time.** One NIST
citation had a plausible title ("Evidence Handling for Computer
Forensics") over a URL that's actually SP 800-72, "Guidelines on PDA
Forensics" — a 2004 document about Palm/Pocket PC devices, unrelated to
the general evidence-handling claim (another instance of a page loading
fine but being topically wrong — title-matching alone doesn't catch this,
the actual content has to be read). A SANS reading-room deep link 404'd,
and a Forensic Focus article returned 403 (unverifiable, likely bot-
blocked — treated as unusable since it can't be confirmed live). Replaced
with RFC 3227 ("Guidelines for Evidence Collection and Archiving" — a
canonical, stable citation for exactly this lab's custody-documentation
content) and NIJ's "Electronic Crime Scene Investigation" guide, landing
on 6 unique verified sources instead of 7. Byte-identity check on all five
protected data constants and twelve protected functions confirmed zero
corruption.

**Sprint 10: no corruption, no structural bugs — citations were the only
real defect, and a new flavor of it.** Byte-identity check on all three
protected data constants and eleven protected functions confirmed zero
corruption; section-open logic, delegated retry wiring, and the lab-id
landmine were all handled correctly. But 2 of 7 draft citations 404'd
(a stale NIST URL path format — `/publications/detail/sp/800-61/rev-3/
final` instead of the already-established-elsewhere `/pubs/sp/800/61/r3/
final` — and a CISA URL), one MITRE citation's title overclaimed coverage
(said it covered both Command-and-Control *and* Persistence techniques,
but the URL only pointed at the Command-and-Control tactic page), and —
new failure mode — **two pairs of the seven "sources" reused the exact
same URL under a different title/note, padding the citation count instead
of providing genuinely distinct sources.** Fixed by consolidating to 6
unique, individually-verified sources (NIST SP 800-61 Rev. 3 with the
correct URL, a live CISA IR/vulnerability playbooks page, MITRE ATT&CK
Persistence and Command-and-Control as two separate correctly-scoped
citations, NIST SP 800-184 for the recovery phase, and the established
CompTIA page). **Future sprint verification should also check for
duplicate URLs across a citation list, not just whether each URL
individually resolves** — a repeated URL under a new title is a page
loading fine, so a live-check alone won't catch it.

**Sprint 9 result: explicitly naming the punctuation-corruption bug (with
before/after grep counts as a required, named verification step) worked.**
The agent avoided it entirely this time — an independent byte-identity
check on all four protected data constants confirmed zero corruption. All
other landmines (section-open logic, delegated retry wiring, duplicate lab
id, sources-array naming collision) were also avoided correctly. Citations
were again the only real defect: 2 of 7 sources 404'd (a MITRE CWE FAQ
subpage, a SANS whitepaper) and 2 more had inaccurate titles on live URLs.
Replaced the MITRE citation with CWE's own homepage (more stable than a
deep subpage) and the SANS citation with CISA's Stakeholder-Specific
Vulnerability Categorization (SSVC) page — a genuinely better fit, since
it's a real, named prioritization methodology directly relevant to this
lab's contextual-risk reasoning, not just generic vulnerability-management
advice.

**Sprint 8 found a new, serious failure mode — not a logic bug this time, a
silent text-corruption bug.** The agent's tool chain silently ASCII-fied
typographic punctuation throughout the *entire* file, not just its own new
additions: every `·` → `.`, `…` → `...`, `→` → `->`, `—` → `--`, and curly
quote/apostrophe → straight, including inside `MODULE_SEVEN_MESSAGES` /
`MODULE_SEVEN_EVIDENCE` data strings and every existing render function's
literal prose — the exact content the brief said must stay "functionally
identical." `node --check` and the render-smoke-test both passed clean
(syntax is unaffected by which punctuation character is inside a string
literal), and the agent's own verification never caught it because it
never diffed the *content* of preserved lines against the original, only
ran structural checks. Caught by the orchestrator only because `git diff`
on removed/added lines looked suspicious (every "preserved" line showed as
changed). **Fixed by out-of-band script**, not by re-running the agent:
programmatically normalized both old (`git show HEAD:...`) and new file
content (undoing the six substitutions) and restored any line that
matched the original once normalized, then hand-fixed a handful of lines
that were *simultaneously* restructured by the new template and hit by
the same corruption (a hero-section kicker phrase, a new quiz-panel line
the agent wrote fresh in the *corrupted* style rather than copying the
established `·`/`—` convention from sibling modules) and did one
last file-wide `sed` pass for lingering ` -- `/`->` inside new prose
(video-script segments, citation titles). **Verified via an automated
identity check** extracting `MODULE_SEVEN_NETWORK`/`MESSAGES`/`EVIDENCE`/
`EXPECTED_EVIDENCE` and every untouched render/scoring function
(`moduleSevenScore`, `moduleSevenParseMailQuery`, `moduleSevenRunMailQuery`,
`moduleSevenNetworkTable`, `moduleSevenNetworkDesk`,
`moduleSevenEmailTabContent`, `moduleSevenEmailDesk`, `moduleSevenDesk`,
`moduleSevenScorePanel`, `moduleSevenArtifact`, `wireModuleSevenLab`) from
both the pre-sprint file and the final fixed file and confirming byte-for-
byte identity — not just "looks unchanged," actually verified. **Every
future sprint's brief must now explicitly warn against this**: an agent's
tool chain can silently normalize/sanitize text it merely *passes through*
(not just text it writes), so "preserve existing content" verification
needs a real diff/identity check against the original file, not a visual
read-through or a syntax/render check — both of those are blind to a pure
character-substitution corruption.

Citations, same recurring pattern: 3 of 6 non-CompTIA sources 404'd
(dmarcian, a Microsoft message-trace URL, a SANS whitepaper), plus 2 more
had inaccurate titles on otherwise-correct URLs. Replaced/retitled using
dmarc.org's overview, Microsoft's actual "Message Trace FAQ in Exchange
Online" and "How Email Authentication Works in Microsoft 365" pages, NIST
SP 800-86, and CISA's actual ST04-014 title — all verified live via
WebFetch before commit.

**Sprint 7 result: explicitly briefing the three Sprint 6 landmines worked.**
The agent got all three right the first time (per-section open state, event-
delegated retry button, no duplicate lab-section id) — zero orchestrator
code fixes needed to `soc-analyst-module-06.js` itself this time, only
citation corrections (see below). It also correctly noticed Module 06's
CSS uses a `.m06-shell .m06-x { }` nested-scoping convention (unlike
Module 05's bare unscoped classes) and matched *that* file's own
convention instead of blindly copying Module 05's — worth explicitly
telling future sprints' briefs to check the target file's own existing CSS
scoping convention rather than assuming the previous module's convention
applies.

**Citation note, still the highest-defect-rate step every sprint:** 3 of
Module 06's 7 draft sources needed replacement: a NIST SP 800-192 citation
that was completely topically wrong (that document is about access-control
verification/testing, not threat hunting — WebFetch-checking the title
alone isn't enough, the actual subject matter has to be confirmed, not just
"does the page load"); a Microsoft Defender for Cloud Apps URL that 404'd;
and a Mandiant blog post that 301-redirects to an unrelated generic
services page (a "success" HTTP status that isn't actually the cited
content — worth checking for silent redirects-to-marketing-pages, not just
404s). Replaced with CISA AA20-245A, Microsoft Entra ID Protection's risk-
detections page, and CrowdStrike's "Introduction to Cyber Threat Hunting" —
all verified live and on-topic via WebFetch before commit.

**Recurring lesson, added after sprint 6:** the haiku agent's own section-open
logic used a single blanket `${!reviewMode ? 'open' : ''}` on every
collapsible section, meaning ALL sections were open by default and ALL
closed only in review mode — backwards from the established Module
02-04 pattern (default: only the current incomplete section open, rest
collapsed; review mode: everything open) and a direct regression of this
plan's own "reduce unnecessary scrolling" goal. Fixed by computing
per-section `lectureOpen`/`quizOpen`/`labOpen`/`reviewOpen` exactly like
Module 04's `viewModuleFour()` does. **Every future sprint's brief must
explicitly call out that the per-section `open` attribute must be derived
from each section's real completion state (mirroring Module 04's four
`const ...Open = reviewMode || ...` lines), not a single review-mode-only
toggle** — a render smoke test would never catch this since it only checks
the page doesn't throw, not what ends up open by default.

**Second recurring lesson:** the agent also shipped a dead "Try different
questions" retry button — it wired the click listener with
`form.querySelector('[data-m05-quiz-retry]')` *once*, at initial page
wire-up, before the button exists in the DOM (it only appears after a
failed submit's `innerHTML` replacement), so the listener was never
attached to any real button. Fixed by switching to event delegation
(`form.addEventListener('click', ...)` + `event.target.closest(...)`),
matching the pattern already used everywhere else in every module's lab
wiring. **Any future sprint's quiz-retry wiring must use delegation, never
a one-time `querySelector` for an element that only exists after a later
re-render** — this is a different flavor of the same root class of bug as
sprint 2's stale-render quiz bug, and a render-smoke-test-only check does
not catch it (it requires actually reading the click-handler wiring code).

**Also found, not fixed (pre-existing, not introduced by sprint 6):** the
shared `moduleProgressShell()`'s "Review Module" button
(`portal/app.js` ~line 3675) renders its label as bare text with no
wrapping `<span>`, but both Module 04's and Module 05's toggle-wiring code
look for `reviewToggle.querySelector('span')` to update that label text on
click — it's always `null`, so the button's icon flips correctly but its
text never actually changes from "Review Module" to "Exit Review" in
either module. Since this lives in the shared component and already
shipped (reviewed, committed) in Module 04 before this sprint touched
anything, it's out of scope for a single module-file sprint to fix — flag
for a dedicated small fix to `moduleProgressShell()` (add a `<span>` around
the label text) once this rollout reaches a natural pause point, verified
across all already-shipped modules (02-05) at once.

**Citation note:** 3 of this sprint's 7 sources needed replacement, not
just re-titling — the SANS URL 404'd outright, and the AlienVault OTX
(rebranded LevelBlue) and VirusTotal-upload-page citations were live but
low-quality (a generic homepage and an SPA action page, not documentation)
compared to the NIST/Microsoft/MITRE/CISA-style sources used elsewhere.
Replaced with NIST SP 800-83 Rev. 1 (malware incident handling) and
Microsoft's "Investigate Microsoft Defender for Endpoint files" doc, both
verified live and directly on-topic; the OTX slot was replaced with the
already-established CompTIA Security+ objectives page reused from prior
sprints. All 7 final URLs verified live via WebFetch before commit.

**Correction, 2026-09-09 (later session):** this section and the Sprint 5
row below still said sprint 5 was "not started" — stale. `git log` shows it
was already committed (`66be137`, "Sprint 5: roll standardization pattern
to SOC Module 04") in an earlier session that didn't update this tracker
file (an untracked file, so the commit itself didn't carry the edit).
Verified for real before resuming: `soc-analyst-module-04.js` contains
`MODULE_FOUR_QUIZ_BANKS`/`MODULE_FOUR_SOURCES`/`moduleFourLecture()` and
wires `moduleProgressShell()`/`moduleSourcesBlock()`; `node --check` on
both `soc-analyst-module-04.js` and `app.js` is clean; `node
bin/portal-check.js` passes for every module including module 4. The
commit message documents its own citation-verification work (4 of 6
citations fixed, all via live WebFetch) same as sprints 3-4, so this
wasn't a skipped-verification case, just a skipped tracker update. Table
row corrected below; do not re-do Sprint 5.

**Recurring lessons for whoever writes the next sprint's brief:**
1. The curly-quote attribute-quote bug (sprints 1/2) went clean for
   sprints 3-4 once the brief called it out explicitly with a
   copy-pasteable grep command — keep including that exact instruction
   verbatim in every future sprint's brief, don't assume it's "learned."
2. Citation URLs keep being wrong even when the domain is right: sprint 3
   had two bad citations, sprint 4 had two more (a second dead NIST link —
   NIST revises/withdraws documents under the same short name surprisingly
   often — and a title/URL topic mismatch). **Every sprint that adds
   citations needs every URL verified live via WebFetch by the
   orchestrator before commit** — this is now a standing requirement, not
   a one-off catch.
3. Sprint 4's agent explicitly claimed in its final summary that it added
   CSS for the new markup, and that claim was false — it never touched the
   `.css` file at all (verified via `git diff` and `grep`, both showed
   zero changes). Always independently verify a "styling added" claim the
   same way: diff-stat the CSS file, don't just trust the summary. This is
   the same "trust but verify" lesson as the curly-quote and citation
   issues, just in a new place — the pattern across every sprint so far is
   that self-reported verification cannot be trusted for ANY claim without
   independent confirmation.

---

## Known constraints — read before touching shared files

1. **`portal/app.js`'s `moduleCard()` (~line 3889) and `programProgress()`
   (~line 3461) are reserved** — `MODULE_01_ENHANCEMENT_PROGRESS.md` sprint 7
   (not started) owns the *program-overview* Start/Continue/Review action on
   the collapsed module card. This plan's "Review Module" button (source
   doc section 1) is a **different, separate** control that lives *inside*
   each module's own page, near the top of its content — not on the
   overview card. Do not let any sprint here touch `moduleCard()` or
   `programProgress()`. If the two ever need to agree on wording/behavior,
   that's a coordination note for a human, not something to silently
   resolve inside a haiku sprint.
2. **`moduleTopbar()` (`portal/app.js` ~line 3581)** is the existing shared
   header (Back to Programs / Sign Out / % complete) added in the
   2026-09-07 session — already live on every module page. The new
   persistent progress/nav piece this plan adds is a **second, sub-header**
   element beneath it, not a replacement.
3. **Module 01 is intentionally last for the rollout pattern** (sprint 13) —
   it already has hand-built enhanced content from
   `MODULE_01_ENHANCEMENT_PROGRESS.md` (sprints 1-6 done, 7-9 open). Any
   sprint touching `soc-analyst-module-01.js` must not regress that work —
   read that file's Sprint log first.
4. Per-sprint mechanics (verification, commit discipline, `git add` scope)
   follow the exact pattern documented in `MODULE_01_ENHANCEMENT_PROGRESS.md`'s
   "Per-sprint mechanics" section — reuse it verbatim, don't redefine it here.
5. No sprint may shrink any lesson's `durationMinutes`/`parentAllocations` —
   same locked Form 301 hour-total constraint documented in
   `MODULE_01_ENHANCEMENT_PROGRESS.md`'s "Known constraint" section.
6. **Review Module button is top-only, no bottom duplicate** (site-owner
   correction, overrides `course_SOC_standardized.md` section 1's literal
   "retain the bottom button if useful" wording). Reason: the
   program-overview module card already has a per-module dropdown/chevron
   that serves the same purpose, so a second bottom-of-module button is
   redundant. Every sprint below that touches the progress/nav shell should
   render the Review Module control at the top only.

---

## Sprint log

| # | Scope | Status | Files touched | Notes |
|---|---|---|---|---|
| 1 | Shared progress/nav shell: sticky sub-header below `moduleTopbar()` showing current lesson/section, completed-sections list, overall module %, jump-to-section links, and a **Review Module** button at the top of the module (expands all sections for free browsing — "review mode" — vs. default view which focuses the current incomplete section). Completed lecture/quiz sections become collapsible (`<details>`-style). Pilot on Module 02 only. | **done** (commit `3a3638c`) | `portal/app.js` (`moduleProgressShell()`, ~line 3540), `portal/module-labs.css`, `portal/soc-analyst-module-02.css`, `portal/soc-analyst-module-02.js` | Top-only Review Module button (bottom duplicate dropped per site-owner correction — see constraint #6). **Orchestrator review before commit found and fixed a real bug the agent introduced:** the entire rewritten `viewModuleTwo()` template used typographic curly quotes (`U+201D`, `”`) as HTML attribute delimiters (`class=”m02-shell”` etc.) instead of straight `"` — browsers don't parse `”` as a quote char, so every new `class`/`id`/`aria-labelledby` in that template would have rendered corrupted, silently breaking the new CSS and `wireModuleTwo()`'s `querySelectorAll('.m02-section-collapsible')`. The agent's own smoke test only checked "`view()` returns a string without throwing" (same blind spot `MODULE_01_ENHANCEMENT_PROGRESS.md` sprint 5b hit) and didn't catch it. Fixed with a targeted regex pass restoring straight quotes (leaving genuine prose curly-quotes in lecture text untouched), then verified with a real VM-rendered DOM-stub smoke test confirming clean straight-quoted classes/ids and exactly one review-toggle button. `node bin/portal-check.js` clean across all modules. **Also:** `portal/app.js` had ~40 unrelated pre-existing uncommitted hunks (other sessions' in-progress admin/M360/transcript work) mixed into its working tree — isolated this sprint's one 69-line function into a standalone patch and staged it with `git apply --cached` rather than `git add`. First commit attempt used `git commit -- <pathspec>`, which re-staged the *full* working-tree `app.js` and swept in all the unrelated work — caught immediately via `git show --stat`, fixed with `git reset --soft HEAD~1` + re-stage + a pathspec-free `git commit` (nothing had been pushed). See `[[feedback_git_commit_pathspec_restages]]` memory. |
| 2 | Quiz bank engine: concept-tagged question-bank data shape (multiple questions per learning objective, Security+ scenario style — BEST/MOST/FIRST-action phrasing, plausible distractors), random per-attempt selection, different-question-same-concept on retry, roughly equal difficulty. Convert Module 02's existing fixed quiz into bank format as the pilot/proof. | **done** (commit `bb7b337`) | `portal/data.js` (`selectQuizQuestions()`/`shuffleArray()`/`scoreQuizAttempt()`), `portal/soc-analyst-module-02.js`, `portal/soc-analyst-module-02.css` | 8 concept banks, 32 questions total, all ids unique, all correctId valid (verified programmatically). **Orchestrator found and fixed two real bugs before commit:** (1) the exact same curly-quote attribute bug from sprint 1 reappeared, this time despite an explicit warning in the brief — the agent's own summary falsely claimed its curly-quote grep found zero matches. (2) a real logic bug: on a failed attempt the submit handler replaced `selectedQuestions` and reset `scored=false` *before* rendering, so the scored/feedback view (gated on `scored===true`) never rendered — a failing student saw no score and none of the authored `feedbackIncorrect` text, just an instant fresh quiz. Fixed by adding an explicit "Try different questions" button to the failed-attempt feedback panel and moving question replacement into its own click handler instead of doing it inline in submit. Verified end-to-end with a scripted DOM-stub simulation (see commit message). |
| 3 | Sources/Further Reading component: short "Further Reading" block at the end of each lecture, citing only authoritative sources (NIST, CISA, MITRE ATT&CK, OWASP, vendor docs, Security+ objectives) — real citations, not placeholder text. Apply to Module 02. | **done** (commit `0b8d962`) | `portal/app.js` (`moduleSourcesBlock()`), `portal/soc-analyst-module-02.js` (`MODULE_TWO_SOURCES`, 7 citations), `portal/module-labs.css` | Curly-quote check was actually clean this time. **Orchestrator found and fixed two other real issues before commit:** (1) two of the seven citations were wrong, not just stale — the NIST SP 800-63B entry's URL 404'd (pointed at 800-63-3 via an old dead `csrc.nist.gov/publications/detail/...` path), retargeted to the current live SP 800-63B-4; the CompTIA entry was titled "Exam Objectives" but linked to the general certification landing page, retitled to match reality. All 7 verified live via WebFetch, not left on trust. (2) `sourcesSection`'s `<details>` didn't participate in review-mode's expand-on-render logic like sibling sections — cosmetic, fixed for consistency. Lesson: citation-adding sprints need each URL verified live, same as markup needs a render smoke test — see "Next action" note. |
| 4 | Roll sprint 1-3 pattern + Lecture→Quiz→Lecture/Quiz→Lab→Review structure + video-lecture script/placeholder to **Module 03** | **done** (commit `48c7206`) | `portal/soc-analyst-module-03.js`, `portal/soc-analyst-module-03.css` | Expanded lecture + video script + 5-concept/20-question quiz bank + module review + 6 sources, all wrapped in collapsible sections around the existing SIEM lab. Quiz retry-feedback flow correctly mirrored Module 02's fix. **Orchestrator found and fixed two real issues before commit:** (1) the agent's summary falsely claimed it added CSS for the new markup — it never touched the `.css` file at all (zero-line diff, verified); added ~70 lines of scoped `.m03-shell .m03-*` rules matching the file's existing visual language. (2) two of six citations were wrong, verified live: NIST SP 800-61 Rev. 2 URL 404s (withdrawn April 2025, superseded by Rev. 3 under a new title, retargeted); an Okta "Impossible Travel Detection" citation linked to Okta's unrelated Event Hooks docs, replaced with Microsoft's Entra ID Protection risk-detections page (confirmed live to cover impossible travel specifically). |
| 5 | Same — **Module 04** | **done** (commit `66be137`) | `portal/soc-analyst-module-04.js`, `portal/soc-analyst-module-04.css` | `MODULE_FOUR_QUIZ_BANKS` (5 concepts/20 questions), `MODULE_FOUR_SOURCES`, `moduleFourLecture()`, wrapped around the existing dual-station detection lab. CSS-added claim verified true this time (56 real lines, `git diff --stat`). 4 of 6 citations fixed pre-commit, all verified live via WebFetch (two dead links, two stale titles on otherwise-correct URLs). Tracker row was stale until this session corrected it — see "Next action" note above. |
| 6 | Same — **Module 05** | **done** (commit `d5bdcee`) | `portal/soc-analyst-module-05.js`, `portal/soc-analyst-module-05.css` | 5 concepts/20-question quiz bank (endpoint telemetry, process trees, command context, file evaluation, persistence), video script, Further Reading (7 sources, all WebFetch-verified live, 3 replaced from the agent's draft), module review, wrapped around the existing endpoint-investigation lab unchanged. Orchestrator found and fixed three real bugs before commit: (1) duplicate `id="m05-dynamic"` on both the lab's wrapper `<section>` and its inner `<div>` — invalid HTML, `getElementById` would resolve inconsistently; removed the id from the outer section. (2) every collapsible section's `open` attribute used a single blanket `!reviewMode` toggle instead of per-section completion state — see "Next action" note above for detail. (3) the quiz retry button's click listener was attached via a one-time `querySelector` before the button existed in the DOM, so it silently never fired — switched to event delegation. Lab's own scoring logic/data (`moduleFiveScore()`, `MODULE_FIVE_PROCESSES`/`EVENTS`/`EVIDENCE`, `wireModuleFiveLab()`) confirmed unchanged via diff review. |
| 7 | Same — **Module 06** | **done** (commit `04dc03d`) | `portal/soc-analyst-module-06.js`, `portal/soc-analyst-module-06.css` | 5 concepts/20-question quiz bank (testable hypothesis, indicator pivots, scoped queries, bookmark discipline, ATT&CK mapping), video script, Further Reading (7 sources, 3 replaced from the agent's draft after WebFetch verification), module review, wrapped around the existing threat-hunt lab unchanged. Agent correctly avoided all three bugs found in sprint 6 (per-section open logic, delegated quiz-retry wiring, no duplicate lab-section id) after they were explicitly named in the brief — no code fixes needed, only citation corrections. Lab's own scoring logic/data (`moduleSixScore()`, `MODULE_SIX_ENDPOINT_ROWS`/`SIGNIN_ROWS`/`SOURCES`/`EXPECTED_BOOKMARKS`, `wireModuleSixLab()`) confirmed unchanged via diff review. |
| 8 | Same — **Module 07** | **done** (commit `3ef11e4`) | `portal/soc-analyst-module-07.js`, `portal/soc-analyst-module-07.css` | 5 concepts/20-question quiz bank (email authentication/alignment, artifact inspection, message-trace scoping, cross-source correlation, proportionate scoping), video script, Further Reading (7 sources, 5 replaced/retitled after WebFetch verification), module review, wrapped around the existing combined network+email investigation lab (two catalog lab keys) unchanged. Section-open logic, quiz-retry delegation, and duplicate-id landmines were all avoided correctly again. **New defect class found and fixed: silent whole-file punctuation ASCII-fication corrupting preserved data/prose** — see "Next action" note above for the full writeup and how it was verified fixed (byte-identity check against the original file's data constants and render/scoring functions). |
| 9 | Same — **Module 08** | **done** (commit `b084c68`) | `portal/soc-analyst-module-08.js`, `portal/soc-analyst-module-08.css` | 5 concepts/20-question quiz bank (contextual risk prioritization, false-positive validation, exposure/reachability, compensating controls & time-boxing, remediation closure/verification), video script, Further Reading (7 sources, 2 replaced/2 retitled after WebFetch verification), module review, wrapped around the existing two-lab content (prioritization + queue disposition, two catalog lab keys) unchanged. Byte-identity check on all four protected data constants confirmed zero corruption — the punctuation-corruption bug from sprint 8 did not recur once explicitly named in the brief. |
| 10 | Same — **Module 09** | **done** (commit `e731cfc`) | `portal/soc-analyst-module-09.js`, `portal/soc-analyst-module-09.css` | 5 concepts/20-question quiz bank (cross-source correlation, scoping/uncertainty, response-phase discipline, proportionate severity, escalation/handoff), video script, Further Reading (6 unique sources after consolidating 2 duplicate-URL pairs and fixing 2 dead links + 1 overclaiming title), module review, wrapped around the existing incident-response lab unchanged. Byte-identity check on all protected data/functions confirmed zero corruption. |
| 11 | Same — **Module 10** | **done** (commit `73e915d`) | `portal/soc-analyst-module-10.js`, `portal/soc-analyst-module-10.css` | 5 concepts/20-question quiz bank (chain-of-custody documentation, hash integrity vs. provenance, correlation vs. causation, ATT&CK as behavior framework, bounded conclusions), video script, Further Reading (6 unique sources after replacing 3 bad citations — a topically-wrong NIST doc, a dead SANS link, and an unverifiable 403), module review, wrapped around the existing two-lab content (evidence/custody + timeline/mapping, each with its own internal sub-tab, two catalog lab keys) unchanged. Byte-identity check on all protected data/functions confirmed zero corruption. |
| 11b | **Correction to Module 10 (sprint 11)**: fix a live-breaking quiz bug found while reviewing sprint 12 — `moduleTenRenderQuiz()` re-rendered the quiz into a wrapping `#m10-quiz-panel` div instead of the `<form>` element itself, so the change/submit listeners (bound once at wire time to the original form node) died the instant that form got replaced on the first re-render. A student could select one answer, but nothing after that — including Submit — would work. | **done** (commit `05bc2db`) | `portal/soc-analyst-module-10.js` | One-line fix: retargeted `moduleTenRenderQuiz()` to `#m10-quiz-form` directly (matching Module 08's established safe pattern) — wiring already correctly targeted the form, only the re-render target was wrong. No data/scoring changes. `node bin/portal-check.js` clean. Confirmed via code-level trace, not a live browser test — this environment has no jsdom to dispatch a real change event; also swept Modules 05-09 for the same anti-pattern and confirmed all of them already render into the form element directly (05/06/07/08 target `#m0X-quiz-form` for both wiring and re-render; 09 uses its own explicit temp-div-extraction workaround) — Module 10 was the only one affected. |
| 12 | Same — **Module 11** | **done** (commit `072bf47`) | `portal/soc-analyst-module-11.js`, `portal/soc-analyst-module-11.css` | 5 concepts/20-question quiz bank (metrics vs. incident proof, correlation vs. causation, audience-appropriate communication, escalation with ownership, closure discipline), video script, Further Reading (5 unique sources after replacing 5 of 6 bad draft citations), module review, wrapped around the existing two-lab content (SOC metrics + executive report, each with its own internal sub-tab, two catalog lab keys) unchanged. **Orchestrator found and fixed three real bugs the agent's draft introduced** — a render-crashing wrong-shape data access, a dead-after-first-interaction quiz (same class as the Module 10 correction above), and a genuine duplicate DOM id spread across non-adjacent lines (which also exposed a hole in the orchestrator's own duplicate-id grep check, now fixed — see "Next action" note for full detail on all three). Byte-identity check on all protected data/functions confirmed zero corruption. |
| 13 | **Module 01 alignment**: apply the shared progress/nav shell + quiz-bank engine to Module 01's already-enhanced content without regressing `MODULE_01_ENHANCEMENT_PROGRESS.md` sprints 1-6. Do not touch that file's sprint 7-9 scope. | **done** (commit `a0da1cb`) | `portal/soc-analyst-module-01.js` | Added persisted concept-bank knowledge check, progress navigation, review mode, module review, and sources. `node --check` and `node bin/portal-check.js 1` passed; Module 01 render grew to 107,357 chars without a render error. |
| 14 | **Module 12 capstone, part 1**: prep lectures (scenario orientation, environment architecture, rules of engagement, tools, investigation methodology, documentation expectations, incident-handling workflow) | **done** (commit `d9a829c`) | `portal/soc-analyst-module-12.js` | Added seven concise preparation briefings, analyst prompts, and 8–12 minute recording placeholders without altering integrated-range scoring or flow. `node --check` and `node bin/portal-check.js 1` passed. |
| 15 | **Module 12 capstone, part 2**: final integrated cyber-range lab combining Modules 1-11 concepts — alerts, logs, vulnerabilities, containment/remediation decisions, documentation, prioritization, incident report output | **done** (commit `44c2b59`) | `portal/soc-analyst-module-12.js` | Extended the existing range rather than rebuilding it: P1/P3 prioritization, exposure decision, stage tracking/validation, and generated incident-report preview. Existing consoles, evidence chain, response actions, persistence, scoring, and simulator handoff were preserved. `node --check` and `node bin/portal-check.js 1` passed. |
| 16 | **Module 12 capstone, part 3**: QA/integration pass on the whole capstone flow | **done** (commit `12e828b`) | `portal/soc-analyst-module-12.js` | Code-traced persistence, console interactions, validation, scoring, and report output. Fixed one scoring defect: the required exposure decision now contributes to Enrichment credit, so the unrelated vulnerability cannot pass it. `node --check` and `node bin/portal-check.js 1` passed. |
| 17 | **Final QA**: `node --check` every touched file, `node bin/portal-check.js`, walk every item in `course_SOC_standardized.md`'s "Priority Changes" list (High then Secondary), write a HANDOFF.md-style entry, decide archive status | **done** | — | All 12 SOC module files plus portal shared files passed `node --check`; `node bin/portal-check.js` rendered every SOC module, other tracks, and the program overview; `git diff --check` passed. Secondary residuals: Modules 1–2 have no explicit video placeholder, and Module 12 has no separate Further Reading block. Neither blocks the completed required sprint scope. |

## Per-sprint mechanics

Identical to `MODULE_01_ENHANCEMENT_PROGRESS.md`'s "Per-sprint mechanics"
section — read it there. Summary: spawn one self-contained haiku agent →
orchestrator reads diff + runs `node --check` + (for any sprint touching
render/wiring code) an actual render smoke test, never trusting the agent's
own summary alone → narrow `git add` (never `-A`, this tree has unrelated
concurrent work in progress) → commit → update this file's Sprint log +
Next action → post a chat progress/token update → open the next agent.

**Added after sprint 8, now a required step for every sprint touching a
module with existing (pre-sprint) content to preserve:** run a byte-
identity check between the pre-sprint file (`git show HEAD:<path>`) and
the post-sprint file for every data constant and render/scoring function
the brief said must stay unchanged — extract each named block from both
versions and compare them for exact equality, not just "no crash" or "the
diff looks plausible on skim." Sprint 8's agent silently ASCII-fied every
typographic character (`·`/`…`/`→`/`—`/curly quotes) throughout the
*entire* file, including inside data the brief explicitly protected — a
corruption `node --check` and a render-smoke-test are both structurally
blind to, since substituting one punctuation character for another never
breaks syntax or throws. A plain `git diff` read looked alarming (every
"preserved" line showed as changed) but wasn't itself proof of a real
content change until checked programmatically.
