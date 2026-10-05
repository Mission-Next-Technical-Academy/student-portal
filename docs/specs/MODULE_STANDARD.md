# MNT Academy — Standard Module Layout

Status: canonical. Applies to **all four tracks**.
Historical companion to `archive/legacy-sc200-simulator/PLATFORM_ARCHITECTURE.md` §5A
and `archive/historical-plans/SPRINT_PLAN_2026-08-17.md` Agent 31.

Every module in every program has the same shape. Not similar — identical. That
is what lets one set of components render four tracks, lets four authors work in
parallel without coordinating, and lets a student who finishes one program
recognize the structure of the next one.

---

## 1. The program frame

Fixed across all four tracks, because the site advertises all four the same way:

| Property | Value |
|---|---|
| Duration | 6 weeks |
| Modules | 12 |
| Modules per week | 2 |
| Module 12 | Always the capstone |
| Module 11 | Always professional practice — communication, documentation, workflow |
| Estimated training | 80–100 hours |
| Delivery | Online, self-paced + guided |

### The six-week arc

Every track follows the same pedagogical progression. The phase names are
domain-specific; the progression is not.

| Week | Phase | Purpose |
|---|---|---|
| 1 | **Foundations** | Vocabulary, mental model, the environment the work happens in |
| 2 | **Core Systems** | The primary tools and systems of the discipline |
| 3 | **Applied Practice** | First real work — guided, with a safety net |
| 4 | **Analysis & Specialization** | The deep technical middle; the hardest modules live here |
| 5 | **Operations & Response** | Doing the job under real conditions — troubleshooting, incidents, failure |
| 6 | **Professional Practice & Capstone** | Communicating the work, then proving it end to end |

Week 4 is deliberately the heaviest in every track. Module 08 is the largest
single module in the program — for SOC Analyst it is Vulnerability Management at
9–12 hours. Track authors should expect the same weighting.

---

## 2. The module contract

Every module object carries **all** of these keys. A field with no content yet is
present and empty — never absent. Missing keys are what break shared components.

```ts
interface Module {
  key:           string;      // '<track>-01' … '<track>-12'. Stable forever.
  number:        number;      // 1–12
  week:          number;      // 1–6
  title:         string;
  summary:       string;      // one or two sentences, what and why
  hours:         string;      // '6–8 Hours' — a range, never a point estimate
  lessons:       number;
  labs:          number;
  objectives:    string[];    // 3–6, measurable, start with a verb
  topics:        TopicGroup[];// flat list = one unnamed group
  handsOn:       HandsOn[];   // exercises, with numbered steps where procedural
  skills:        string[];    // 4–6 chips, résumé-grade nouns
  assessment:    Assessment;
  prerequisites: string[];    // module keys that should come first
  isCapstone:    boolean;
  status:        'draft' | 'authored' | 'published';
}

interface TopicGroup { label?: string; items: string[] }
interface HandsOn    { title: string; steps?: string[]; note?: string }
interface Assessment { knowledgeCheck: boolean; practicalLab: boolean; capstoneGate: boolean }
```

### Field rules

**`key`** — `<track>-NN`, zero-padded. This is the join key to Postgres and it
never changes, even if the module is renamed or reordered. Renumbering keys
orphans every student's progress row.

**`summary`** — what the student will be able to do, not what the module
"covers". Compare: *"Investigate suspicious activity occurring on endpoints"*
against *"This module covers endpoint security topics."*

**`hours`** — always a range. Accelerated programs attract career changers with
jobs; a single number reads as a promise.

**`objectives`** — 3 to 6, each beginning with a measurable verb: *investigate,
configure, analyze, prioritize, document, isolate, validate.* Avoid *understand,
learn about, be familiar with* — they cannot be assessed, and an objective that
cannot be assessed cannot anchor a lab.

**`topics`** — use one unnamed group for most modules. Use named groups only
when the module is large enough to need internal navigation. SOC Module 08 uses
six named groups (Asset Discovery, Vulnerability Assessment, Environments,
Analysis & Prioritization, Remediation, Application Security). Everything else
in the SOC track is flat.

**`handsOn`** — every module has at least one. This is the product claim: *this
is a technical training program, not a collection of videos.* A module with an
empty `handsOn` array is not finished.

**`skills`** — the words a graduate puts on a résumé and an employer searches
for. `SIEM`, `CVSS`, `Active Directory`, `PyTorch`, `Ohm's Law`. Not
`communication skills`.

**`prerequisites`** — module keys, used for optional drip/sequencing. Empty is
normal; the default enrollment opens everything at once.

**`status`** — the authoring lifecycle, not the student's progress:

| Status | Meaning |
|---|---|
| `draft` | Skeleton exists — title, week, position. Body is empty. |
| `authored` | Content written, pending review. |
| `published` | Reviewed and live. |

A program flips `isPublished` only when all 12 modules reach `published`.

---

## 3. Module 11 and 12 are the same everywhere

**Module 11 — Professional Practice.** Every discipline needs its practitioners
to write up findings, hand off work, and talk to non-specialists. Named per
track, but always: workflow, documentation, metrics, communication to technical
and non-technical audiences.

**Module 12 — Capstone.** Never a quiz. A single realistic multi-stage scenario
requiring most of the program's skills, ending in a written deliverable the
student can put in a portfolio. The SOC capstone runs 12 stages; other tracks
should land in the same 8–12 stage range at 8–12 hours.

---

## 4. Standard skeletons

All four tracks are seeded with industry-aligned 12-module skeletons. Titles and
positions are set; bodies are empty and `status: 'draft'`.

### IT Help Desk & Career Accelerator
Aligned to CompTIA A+ domains and ITIL 4 service management practice.

| # | Wk | Module |
|---|---|---|
| 01 | 1 | IT Support Fundamentals & Service Desk Operations |
| 02 | 1 | Hardware, Devices & Peripherals |
| 03 | 2 | Operating Systems: Windows, macOS & Linux |
| 04 | 2 | Networking Fundamentals for Support |
| 05 | 3 | Windows Server & Active Directory Administration |
| 06 | 3 | Identity, Accounts & Access Management |
| 07 | 4 | Software, Applications & Endpoint Management |
| 08 | 4 | Troubleshooting Methodology & Diagnostics |
| 09 | 5 | Security Fundamentals for IT Support |
| 10 | 5 | Ticketing, ITIL Service Management & SLAs |
| 11 | 6 | Customer Service, Documentation & Escalation |
| 12 | 6 | IT Support Capstone |

### Security Operation Center (SOC) Analyst
Aligned to cybersecurity analyst objectives (CySA+ domains) and NIST SP 800-61
incident handling. **Authored** — the reference implementation.

| # | Wk | Module |
|---|---|---|
| 01 | 1 | SOC & Security Architecture |
| 02 | 1 | Network, Identity & Security Foundations |
| 03 | 2 | SIEM & Log Analysis |
| 04 | 2 | Detection Engineering, Threat Intelligence & Automation |
| 05 | 3 | Endpoint & Malware Investigation |
| 06 | 3 | Threat Hunting & Investigation |
| 07 | 4 | Network & Email Analysis |
| 08 | 4 | Vulnerability Management & Exposure Analysis |
| 09 | 5 | Incident Response |
| 10 | 5 | Digital Evidence, Forensics & Incident Frameworks |
| 11 | 6 | SOC Operations, Metrics, Reporting & Communication |
| 12 | 6 | SOC Analyst Capstone |

### Foundations of AI & Machine Learning
Aligned to the CRISP-DM lifecycle and current MLOps practice.

| # | Wk | Module |
|---|---|---|
| 01 | 1 | Python Programming Foundations |
| 02 | 1 | Data Fundamentals, Mathematics & Statistics |
| 03 | 2 | Data Acquisition, Cleaning & Preparation |
| 04 | 2 | Exploratory Data Analysis & Visualization |
| 05 | 3 | Supervised Learning: Regression & Classification |
| 06 | 3 | Unsupervised Learning & Feature Engineering |
| 07 | 4 | Model Evaluation, Validation & Tuning |
| 08 | 4 | Neural Networks & Deep Learning Foundations |
| 09 | 5 | Applied AI: Language, Vision & Generative Models |
| 10 | 5 | MLOps: Deployment, Pipelines & Monitoring |
| 11 | 6 | Responsible AI, Ethics & Communicating Results |
| 12 | 6 | AI & Machine Learning Capstone |

### Electrical Engineering Essentials
Aligned to NCEES FE Electrical fundamentals and NFPA 70E / NEC safety practice.

| # | Wk | Module |
|---|---|---|
| 01 | 1 | Electrical Fundamentals & Safety |
| 02 | 1 | DC Circuit Analysis & Ohm's Law |
| 03 | 2 | AC Fundamentals & Waveforms |
| 04 | 2 | Series, Parallel & Complex Circuits |
| 05 | 3 | Components: Resistors, Capacitors & Inductors |
| 06 | 3 | Semiconductors & Power Electronics |
| 07 | 4 | Digital Logic & Boolean Algebra |
| 08 | 4 | Motors, Generators & Transformers |
| 09 | 5 | Test Equipment & Measurement |
| 10 | 5 | Electrical Troubleshooting & Fault Isolation |
| 11 | 6 | Codes, Standards, Schematics & Documentation |
| 12 | 6 | Electrical Engineering Capstone |

---

## 5. What a track author does

1. Open your one file: `src/content/programs/<your-track>.ts`.
2. Fill in each module's `objectives`, `topics`, `handsOn`, `skills`,
   `assessment`, `hours`, `lessons`, `labs`.
3. Move `status` to `authored` as you finish each one.
4. Run `npm run validate:content`.
5. When all 12 are `published`, flip the program's `isPublished` to `true`.

Do not rename `key`. Do not reorder modules. Do not edit a component. If the
standard cannot express what your track needs, that is a platform ticket — the
schema changes for all four tracks or not at all.

---

## 6. Non-negotiables

- 12 modules, 6 weeks, 2 per week — no track deviates.
- Module 12 is a capstone with a portfolio-grade deliverable.
- Every module has at least one hands-on exercise.
- `hours` is a range.
- Objectives use measurable verbs.
- No certification endorsement, partnership, or pass-guarantee language in any
  track. Alignment may be stated; affiliation may not.

## 7. Student interface standard

Module 01 is the visual and interaction reference for every student module.
Every module uses the shared `moduleTopbar` and unified left navigation rail as
the only Learn It → Practice It → Prove It navigator. Domain labs may provide
local controls for their own data views, but must not add a second phase rail,
set of phase tabs, or duplicate stage labels. Use the shared module layout and
progress wiring rather than replacing or visually competing with it.

Before changing an interactive lab or assessment, read
`docs/LAB_ASSESSMENT_STANDARD.md`. It is the required standard for the
Learn It → Practice It → Prove It progression, instructor-reviewable Prove It
submissions, readable student responses, competency scoring, partial credit,
and multiple valid investigative paths.

### 7.1 Module front-of-page card standard (locked 2026-09-25)

The front of every module — everything a student sees before entering a lab
console — must look and behave exactly like Module 01. Labs/consoles may vary
by domain; the frame around them may not. Canonical source: the `.m01-*`
rules in `portal/module-labs.css` and the markup in
`portal/soc-analyst-module-01.js`. When a module differs, change the module,
not the reference.

| Element | Standard (Module 01) |
|---|---|
| Hero | dark navy gradient card (`#081627 → #1e3a5f → #183b63`), orange kicker, large title, stat tiles on the right (lessons / guided lab / status) |
| Section card | white, `1px #e2e8f0` border, `20px` radius, `0 8px 24px rgba(30,58,95,.05)` shadow, `24px` top gap |
| Section heading | `40×40` navy numbered badge (`11px` radius), orange uppercase kicker, `23px` navy title |
| Section toggle | round `36×36` button, `#f9fafb` fill, `#e5e7eb` border, **`ri-arrow-down-s-line`** chevron, rotates 180° when open; right-aligned in the heading |
| Lesson card | `<details>`, `#fbfdff` fill, `#dbe3ed` border, `14px` radius; summary = number · `38×38` icon tile · title/summary · green check when done · `ri-arrow-down-s-line` chevron (rotates 180° on open); open state gets `#93b4d4` border + white fill + soft shadow |
| Knowledge-check card | same panel heading (`kicker` + `h3` + `N/M answered`), pass = `#f0fdf4`/`#bbf7d0`, remediate = `#fff7ed`/`#fed7aa` |
| Already-complete quiz | when the account shows the quiz passed but this browser holds no answers, render the **"Already verified complete"** pass card with a **Retake** button — never a blank `0/N answered` form, never fabricated answers |

Rules:
- One chevron icon family everywhere: `ri-arrow-down-s-line`, rotated on open.
  No `ri-arrow-right-line`, `ri-arrow-down-line`, `+/-`, or native
  `<details>` markers for collapsible cards.
- No per-module recolouring of these elements. Module accent colour is not a thing.
- Shared look lives in shared CSS; a module stylesheet may lay out its own
  lab/console internals but must not restyle the frame elements above.
- A submit button on a graded lab is clickable until the work is
  submitted; if items are missing, clicking it lists them. It only greys out
  (with a label) when the work is **Under review** or **Graded**. Instructor
  redo notes must appear inside the module and the lab console, not only on
  the program card.

### 7.2 ITSM Incident Ticket — the one graded submission (locked 2026-09-25)

Every graded Prove It submission in the SOC course is written on the same
incident ticket. Module 01's NST-2407 case console is the reference; the
renderer is `portal/case-record.js` and its styles are the `.m01-ticket-*` /
`.m01-score-empty` / `.m01-requirements-list` rules in `portal/module-labs.css`.
When anyone says **"use the ITSM ticket"** or **"incident ticket"**, it means this.

Ticket anatomy, in this order:

| Part | Standard |
|---|---|
| Pane title | `ITSM Incident Ticket` |
| Header row | `ITSM Incident Ticket` + ticket/case id + **Status** (In Progress / Pending / Resolved) |
| Grid | **Severity** (Critical/High/Medium/Low) · **Affected User** · **Affected Device** · **Disposition** · **Escalation required** (Required / Not required) · **Route to Department** (only when Required) |
| Module findings | optional extra selects in the same grid (`spec.findings`) or a block under it (`spec.findingsHtml`) for the module's domain decisions — rule threshold, hunt hypothesis, ATT&CK mapping, etc. |
| Notes | **Analyst Work Notes** textarea, ≥ 80 characters |
| Actions | `Update Ticket` (secondary) + `Submit Lab` (orange); after submit a single grey `Lab Under Review` / `Lab Graded` button |
| Requirements panel | `ITSM ticket` card listing every missing item; turns orange "Not ready to submit yet" when Submit is pressed early; shows instructor redo notes |

Rules:
- Use `caseRecordPane()` / `caseRecordFields()` + `caseRecordMissing()` +
  `caseRecordActions()` + `caseRecordPanel()`; store values with
  `caseRecordApply()`; send `caseRecordSummary()` as the readable record in the
  `recordLabAttempt()` payload.
- Module-specific graded decisions go **inside** the ticket as findings, never
  as a separate form beside it. One module, one ITSM ticket, one Submit Lab.
- Each module supplies its own case id, user/device roster (confirmed entity +
  plausible pivots + noise, as in Module 01's `entityRoster`) and department
  list. Answer keys stay in module data; Prove It shows no live right/wrong.
- Submit follows §7.1: clickable until submitted, lists missing items when
  pressed early, greys out only for Under review / Graded.

#### 7.2.1 Record IDs — ALR / INC / CASE (locked 2026-10-03)

There is no industry ID standard (NIST 800-61, ISO 27035 and ITIL prescribe
none); every SOC tool invents its own. The course uses one model everywhere:

| Record | Format | What it is | Lives in |
|---|---|---|---|
| Alert | `ALR-NNxxxx` | one detection that fired | log/console rows, incident's alert list |
| Incident | `INC-NNxxxx` | correlated alerts (SIEM/XDR grouping) | linked under the case |
| Case | `CASE-NNxxxx` | the investigation + ITSM record the student submits | ticket header, brief |

- `NN` = two-digit module number; `xxxx` = four digits. Six digits after the
  hyphen, always zero-padded. A case and its incident never share digits.
- A case links **one or more** incidents; an incident lists **one or more**
  alerts. A hunt case may link zero incidents until it finds something.
- Practice It and Prove It use different numbers. No `-PRACTICE`, `-MN-` or
  other internal labels in an ID.
- Domain lives in `ticketType` / queue (Endpoint, Detection Engineering,
  Vulnerability Response…), never in the prefix. `DET`, `EDR`, `HNT`, `BKD`,
  `NEC`, `VLN`, `EVD`, `OPS`, `IR`, `NST`, `ALT`, `AL`, `ALERT` are retired.
- Ticket header shows the **CASE** id with `Linked incident: INC-…` under it
  (pass `incidentIds` to `caseRecordPane`; `ticketId` is retired). Brief label
  is `CASE-044424 · INC-044733 · <TAG> · ASSIGNED TO YOU` — build it with
  `caseRecordBriefLabel(spec, tag)`; a hunt with no incident yet just omits
  the INC part.
- Cross-module storylines keep the original module's ID (M10/M11 link M09's
  `INC-09xxxx`).
- Other ITSM records (`CHG-`, `REQ-`, `SR-`, `SEC-`) and log-row ids (`EVT-`,
  `EV-`) are unaffected.

Rename plan + full old→new map: `docs/workstreams/RECORD_ID_NOMENCLATURE_PLAN.md`.

### 7.3 Console Guide — the in-console teaching card (locked 2026-09-25)

The step-by-step card that floats over a lab console is Module 02's Learn It
console guide. Renderer: `portal/console-guide.js`; styles: the
`.m02e-learn-tip` / `.m02e-tip-*` / `.m02e-guide-*` block in
`portal/module-labs.css`. When anyone says **"use the console guide"**, it
means this card — same shape, colours and format; only the words change.

Anatomy: navy gradient card with orange left border and pointer arrow ·
orange label `CONSOLE GUIDE · STEP n OF m` (`· COMPLETE` when finished) ·
round collapse chevron (`ri-arrow-down-s-line`, rotates; collapsed card
docks into the console header) · title · body · `Look for:` box · `Lab
connection:` box · `Next explanation` → `Finish guide` → `Restart console
guide` button. Entry point: pulsing orange `Start console guide` button.

Rules:
- Author steps as `{ title, body, lookFor, lab }` (plus module keys such as
  `tab`/`target` to move the console to what the step explains).
- Guided Labs render the shared card through `guidedLabGuide(scope, steps,
  { step, docked, prefix, submitted, debriefHtml, item })`; position with
  `consoleGuidePosition()`. The Learn It card may continue to call
  `consoleGuideCard()` directly.
- After each step changes the console view, position the card beside its
  selected evidence and outline that evidence. If a module has no explicit
  target, `consoleGuidePosition()` follows the selected item in the active
  view, then its heading. The card's collapse control returns it to the
  console header/banner; opening it restores the floating guide.
- No per-module recolouring or alternate tooltip/coachmark styles.
- The guide is advisory. **Next is always enabled**; a live check may show
  `Found` / `Not yet`, but it never blocks movement, submission, or leaving the
  lab. Submitting the ITSM ticket is the only new Guided Lab completion trigger.
- Guided Labs normally include an ITSM ticket in a console tab. Their final
  guide step points to that tab and explains that submitting the ticket
  completes practice. Module 02 is the documented exception: its Learn It
  console walkthrough is the Guided Lab, completed by finishing the console
  guide; the HR authorization case's ITSM tab is the Assessment Lab.
- After ticket submission, the Guide card shows `CONSOLE GUIDE · COMPLETE` and
  automatically collapses into the console header/banner (as in M02). Expanding
  it reveals `guidedLabDebrief({ story, fields, handoff })`: what the evidence supports,
  per-field `captured` / `contributing` / `missed` notes without points, and
  what a strong handoff includes. The ticket is locked as `Practice submitted`
  and offers a restart path.
- Assessment Labs show only `Submitted for faculty review` / `Lab graded` (or
  the standard returned-for-remediation state). They do not show a debrief,
  score, points, or right/wrong feedback to the student.
- Labs stay inline in their Practice It / Prove It section cards. Do not use
  new-tab launch buttons. Preserve prior guided-lab completion when migrating
  stored progress.


### 7.4 Learn It card (locked)

Every SOC module opens with the shared Learn It card rendered by
`portal/learn-it-cards.js` and styled by `portal/learn-it-cards.css`. The card
uses the same heading, numbered slide strip, single-slide canvas, decode
animation, progress bar, NEXT control, slide recall, and restart behavior in
every module. Decks supply the slide copy and module-specific `onStep` hooks;
classes stay generic and the data prefix is configurable.

Persist the current step through the module's existing `LabRuntime` state.
Keep the viewed slide in memory only. Completing or restarting Learn It must
not reset unrelated module progress. Each slide is `{ title, body, objective,
lab }` and maps to a `curriculumItems` key in `portal/data.js`; `lab` is
`guided`, `assessment`, or `both`. Titles use at most five words. New body copy
is at most two sentences and 35 words. M02's six original authored slides are
retained verbatim as a legacy introduction without claiming individual lesson
objectives. M12 has no curriculum lesson objectives; its recap slides identify
a real carry-forward objective and the relevant capstone rubric criterion.
The numbered cards form a horizontal carousel with fixed widths, snap scrolling,
keyboard focus, and reduced-motion support. The final slide bridges directly to
the module's Guided Lab (M12's integrated Assessment Lab). Do not introduce a
hard gate unless the module standard already defines one.
When a learner recalls an earlier card, NEXT moves to the following recalled
idea before it reveals the next locked card.

### 7.5 Deep Dive panel

Every SOC module (M01–M12) places one collapsed Deep Dive panel directly under
its Learn It card. It holds the longer reference material that does not fit
the two-sentence slides: lecture notes, field guides, models, lesson loops, and
optional practice checks. Render it as
`<details class="mNN-deep-dive mf-deep-dive"><summary>Deep Dive · <scope></summary>…</details>`;
the shared look lives in `.mf-deep-dive` in `portal/learn-it-cards.css`, so do
not add per-module panel styles. The panel is never a gated or scored step.
