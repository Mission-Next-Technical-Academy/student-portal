# Learn It Cards — rollout to all 12 SOC modules

**Status:** Sprints 0–6 implemented and verified locally (2026-10-03); production click-through and deployment remain separate.
**Owner:** Alex · **Repo:** `~/Mission_Next_Technical_Academy_SOC_Analyst_course` (branch `master`, push = deploy)

## Goal

Every SOC module opens with the **same Learn It card**: the Module 02 component as
shipped in `ce1e7a5`, using a header, NEXT button, horizontally scrolling numbered
carousel, one slide on the canvas, decode animation and progress bar. Slide cards
keep a readable fixed width as decks grow; the carousel scrolls and snaps instead
of shrinking every card to fit. Each module gets its own curated deck, with as many
slides as its objectives need. A student who finishes the deck should know what
the module's labs will ask them to do.

Reference markup is the completed M02 state: `.m02e-callout.is-done` → `.m02e-learn-heading`
→ `nav.m02e-learn-cards` (one `button.m02e-learn-card` per slide) → `.m02e-learn-canvas`
(one `.m02e-learn-line`) → `.m02e-learn-scan`.

## Slide rules (apply to every deck)

| Rule | Limit |
|---|---|
| Body (new slides) | **1–2 sentences, ≤ 35 words.** Never a paragraph. These limits apply to newly authored slides; M02's six original cards are grandfathered verbatim. |
| Title (new slides) | ≤ 5 words, plain verb or noun phrase ("Read the process tree"). M02's six original titles remain unchanged. |
| Tone | Same voice across all 12 modules: direct, second person or "the analyst", present tense, no jargon left undefined, no vendor names |
| Purpose | Every slide maps to one module objective (`soc-NN-lesson-NN` key in `portal/data.js`) |
| Lab alignment | Every lab decision (the fields the Guided/Assessment Lab grades) is taught by at least one slide |
| Last slide | Bridges to the Guided Lab: what you will open and what you will decide |
| Deck size | Driven by the objectives, with no fixed cap. Don't pad and don't cram two ideas into one slide. The carousel supports 14 or more slides without narrowing cards. |

When a student recalls an earlier card, NEXT follows the selected sequence through
the already-unlocked ideas before revealing the next locked card.

### Content and visual direction (agreed 2026-10-03)

- Keep M02's six authored slides and their wording intact. The author likes this
  broad SOC-analyst introduction; it does not need replacement or compression.
- Treat those six original M02 cards as grandfathered from the new-slide title
  and body limits. Any new M02 slides follow the limits above.
- Add depth selectively where an objective needs it. The M02 console guide in
  Learn It can bridge detail, so slides should stay targeted and clean instead of
  trying to teach every topic exhaustively.
- M02 may add targeted objective slides after its six-card introduction; finish
  that added sequence with a clear bridge into the Guided Lab. Preserve the
  current six-card deck until useful additions are ready.
- Add a clear graphic when it materially improves understanding: examples include
  a CIA triad or a purpose-built OSI model diagram. Place each visual where it best
  supports the relevant idea, and avoid dense decoration.
- The Learn It card row is a horizontal carousel at desktop and mobile widths.
  Cards retain usable widths, snap into place, remain keyboard-focusable with a
  visible focus indicator, and newly selected cards scroll into view.

Slide data shape (metadata is linted but not rendered):
`{ title, body, objective: 'soc-05-lesson-02', lab: 'guided' | 'assessment' | 'both' }`

## Current state (measured 2026-10-03, rendered headless)

"Section 1" is what a student meets before the knowledge check. "Longest para" is
in words. ">2-sent" counts blocks over the 2-sentence limit.

| Mod | Section 1 today | Words | Longest para | >2-sent | Implemented slides | Notes |
|---|---|---|---|---|---|---|
| 01 | 9 foundation lessons | 3,959 | 169 | 18 | 10 | CIA triad visual plus foundation ideas and a lab bridge. |
| 02 | **Learn It cards** + console guide | 197 | 14 | 0 | 15 | Six original cards verbatim, eight objective ideas, and a Guided Lab bridge. |
| 03 | OSI "opening slides" deck + core concepts | 63 + 280 | 51 | 2 | 6 | Old locked-card deck replaced with log-analysis ideas. |
| 04 | Core concepts lecture | 1,791 | 77 | 11 | 7 | Objective coverage and a lab bridge; detail remains in Deep Dive. |
| 05 | Lecture, 8 topics + practice | 2,875 | 69 | 9 | 12 | Objective coverage and a lab bridge; detail remains in Deep Dive. |
| 06 | Hunting lecture | 935 | 33 | 3 | 8 | Hypothesis-led hunt and a lab bridge. |
| 07 | Field guide | 335 | 24 | 0 | 7 | Email and network evidence sequence. |
| 08 | Lecture + VM lifecycle | 916 | 46 | 3 | 7 | Risk-informed vulnerability decisions. |
| 09 | IR principles | 295 | 33 | 2 | 6 | Response phases and a lab bridge. |
| 10 | Lesson grid only | 225 | 32 | 0 | 7 | Evidence handling and independent-case bridge. |
| 11 | Lesson grid | 429 | 37 | 0 | 8 | Queue, reporting, and handoff decisions. |
| 12 | Capstone prep (above the gate) | — | — | — | 6 | Recap deck appears before the capstone prerequisite gate. |

The focused copy pass shortened targeted review, Theory, and Assessment Lab prose.
Longer M04 and M05 lecture paragraphs remain inside their collapsed Deep Dive sections.

## Decisions and remaining rollout choices

1. **M02 content — resolved.** Keep the six original ideas and wording. Do not
   move them to M01 or replace them with a denser M02 deck. Add targeted slides or
   graphics only where they help, and use the console guide for detail.
2. **Gating — resolved.** Preserve M02's existing console-guide and Guided Lab
   gates. Add no new deck gates in M01 or M03–M12; persist progress only. M12's
   existing capstone prerequisite gate remains unchanged.
3. **Lecture detail — resolved.** Keep replaced lesson detail in collapsed Deep
   Dive sections during the first pass. Keep Learn It decks concise and let M02's
   console guide bridge detailed console decisions.
4. **Copy approval — resolved for this pass.** Alex directed the rollout to proceed
   after the deck review document was prepared. The review document remains the
   source for copy feedback; lab internals stay frozen.

## Sprints

### Sprint 0: Extract the shared component (mechanical)
- Move the M02 card into shared `portal/learn-it-cards.js` + `portal/learn-it-cards.css`
  (same pattern as `console-guide.js`), with generic class names and a prefix
  option.
- API: render (deck, step, viewed slide, done state) + wire (NEXT, card click,
  restart) + an `onStep` hook. M02 uses the hook to switch console tabs.
- Persist step state per module through `LabRuntime`. The viewed slide stays in memory only.
- Migrate M02 onto it with **zero visual or behaviour change**. Keep M02's `walkthroughVersion`
  state compatible.
- Add the deck lint as a node test in `tests/`: sentences ≤ 2, words ≤ 35, title ≤ 5 words,
  `objective` key exists in `data.js`, last slide is a lab bridge.
- Add the standard to `docs/specs/MODULE_STANDARD.md` as **§7.4 Learn It card (locked)**.
- Bump cache keys in `portal/index.html`.

### Sprint 1: Write all 12 decks (judgment, strong model)
- One data file, `portal/learn-it-decks.js`, holds all 12 decks so tone can be
  reviewed side by side. Not in `data.js`, which is shared with other devs.
- Source each deck from the module's `curriculumItems` objectives, the lecture content
  it replaces, and the graded fields of its Guided/Assessment Lab.
- Produce `docs/workstreams/LEARN_IT_DECKS_REVIEW.md` with every slide plus its objective
  and lab mapping for Alex to approve (Decision 4).
- The deck lint passes for every deck.

### Sprint 2: Wire Modules 01–04
- Implemented locally: M01–M04 now use the shared card; M03's old locked OSI opener
  is removed. M02 retains its original six ideas and console navigation targets.
- Card goes at the top of section 1 (Foundations/Lecture), above the lesson cards. The
  §7.1 frame (hero, section card, chevrons) stays untouched.
- M03: remove the old locked "opening slides" OSI deck and fold its point into the new deck.
- Dense lecture prose follows Decision 3.
- Don't touch knowledge-check question ids, scoring or Guided/Assessment lab internals
  (frozen).

### Sprint 3: Wire Modules 05–08
Implemented locally using the same pattern as Sprint 2.

### Sprint 4: Wire Modules 09–12
- Implemented locally using the same pattern as Sprint 2. M10 and M11 received
  targeted additional slides for their graded decisions.
- M12 recap deck sits above the prerequisite gate, so it's visible before Modules 01–11 are done.

### Sprint 5: Density pass below the cards
- Tightened targeted Theory, field-guide, Assessment Lab brief, and Module Review prose.
- Kept M04 and M05 legacy lecture paragraphs in collapsed Deep Dive sections.
- Focused static survey reports no remaining over-limit targeted prose in M07–M12;
  M01–M06 edits passed syntax and whitespace checks.

### Sprint 6: Verify and ship
- Rendered all 12 modules headless at 1400 px and 420 px. Clicked NEXT through every
  deck, recalled the first card, checked NEXT after recall, and confirmed decks over six cards overflow in the
  carousel without shrinking. Card widths remain 140–164 px at desktop and 176 px
  at 420 px in this render.
- M02 restart, keyboard card focus, and reduced-motion behavior passed.
- Clicked all 304 console tabs in M03–M12; no render or console errors were reported.
- Static progress review confirms M02's completed legacy six-card state maps to the
  expanded deck completion state; `remoteVerifiedModuleProgress` paths were not changed.
- Logged-in production click-through and deployment were not run.

## Constraints

- Only SOC module files plus the new shared files change. `portal/app.js`, `ui/`,
  `supabase/`, `.github/` and other tracks' modules stay as they are.
- Other agent sessions share this working tree. Check staged files against HEAD before each commit.
- **31 local commits are ahead of `origin/master`** and touch the same module files.
  Keep this rollout local; review the branch history and choose a deliberate cherry-pick
  or merge path before any release.
- No vendor names in slide copy.
- Delegate per sprint: a cheap model for Sprints 0, 2–4 and 6, a strong model for Sprints 1 and 5.
