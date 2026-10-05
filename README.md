# Mission Next Technical Academy — Hands-On Training Platform for Cybersecurity, IT Operations, AI/ML & Electrical Engineering

This is the official repository for the production site of **Mission Next
Technical Academy**: a full hands-on training platform for Helpdesk
technicians, Security Operations Center (SOC) analysts, AI and Machine
Learning engineering, and Electrical Engineering. The platform includes
cybersecurity and IT operations training across alert triage, incident
investigation, threat hunting, detection engineering, identity and endpoint
response, vulnerability management, and reporting.

**Live site:** <https://mission-next-technical-academy.github.io/student-portal/>

Everything is plain HTML, CSS, and JavaScript with no build step. Student
accounts and progress are backed by a Supabase project (Postgres + Auth +
Row Level Security); there is no separate application server.

## Architecture

Two static apps that reference each other and deploy as a single origin:

| Half | Directory | Local port | What it is |
|---|---|---|---|
| Portal | `portal/` | 8768 | Sign-in, catalogue, curriculum, per-module lab pages |
| Simulator | `ui/` | 8767 | The SOC lab environment — alerts, incidents, device timelines, hunting queries |

The Pages workflow mounts `portal/` at `/` and `ui/` at `/sim/`. Locally they
run as two servers so either half can be reloaded independently; `portal/app.js`
detects which environment it's in and resolves the simulator's location
accordingly — the only place either half hardcodes the other's address. CI
fails the build if an unguarded `127.0.0.1:8767` reaches the deployed artifact.

Student sign-in goes through Supabase Auth (`supabase.auth.signInWithPassword`),
not a client-side mock. `students` plus the SQL/RLS policies in
`supabase/migrations/` are the real access-control boundary — the portal UI
must never be treated as the authority.

## Local development

```bash
bin/dev.sh               # start both halves in the background, on STAGING
bin/dev.sh status        # one line per server, with the Supabase target
bin/dev.sh stop          # shut both down
bin/staging-local.sh     # or: run in this window; Ctrl-C stops everything
```

Then open <http://127.0.0.1:8768/#/login>.

**Local development uses the staging Supabase project by default**
(`xbblgtrfwgeiyttdlbue`, synthetic data only), never production. The repo's
`portal/supabase-config.js` names the production project because that is
what the deployed site uses; locally, `bin/dev.sh` serves every file live from
the repo except that one, which it swaps for a generated copy (kept in a temp
folder outside the repo) that names staging. Edits to `portal/` and `ui/` show
on reload with no restart.

An orange **STAGING (LOCAL) · synthetic data only** badge in the lower-left
corner of every portal page confirms the target, and `bin/dev.sh status`
prints it:

```
  portal     UP    (8768)  target=STAGING
  simulator  UP    (8767)  target=none (no Supabase)
```

To work against the live production project instead (real student data),
opt in explicitly: `bin/dev.sh stop`, then `bin/dev.sh --production` (or
`bin/staging-local.sh --production`). It prints a warning and shows a red
**PRODUCTION (LOCAL) · real student data** badge. `bin/dev.sh` refuses to
start if a portal is already running with a different target.

Don't serve `portal/` any other way (for example `python3 -m http.server`):
that skips the swap and connects to production.

**Test accounts:** sign in locally with a synthetic staging account from your
password manager. Accounts and passwords are never listed in documentation or
source. They are issued through the admin panel or `bin/provision-students.js`
(run against staging with
`SUPABASE_URL=https://xbblgtrfwgeiyttdlbue.supabase.co`), and the generated
rosters live only in the gitignored `bin/.roster-output/` until they are moved
to a password manager. The `user1`-`user4` accounts in `supabase/seed.sql`
belong to a local Supabase-CLI stack this repo does not run, and do not work.

Requirements: bash, Python 3 (`python3`, or `python` on Windows Git Bash) and
`curl`, on macOS or Linux.

### Where things live

```
portal/
  data.js         Catalogue: 4 programs x 12 modules, the LABS array
  app.js          Hash router, Supabase-authenticated sessions, entitlement gating, all portal views
  lab-runtime.js  Per-lab localStorage isolation — one lab's reset cannot wipe another's
  soc-analyst-module-01.js  Module 1's self-contained miniature lab. Filenames are
                    program-prefixed (soc-analyst-, it-support-, ai-ml-,
                    electrical-) so no two tracks' modules ever share a name;
                    only soc-analyst has real content, the other three tracks
                    have a blank module-01 stub claiming their registry slot.
  module-labs.css Lab styling
ui/               The simulator (inherited SC-200 lab, rebranded)
supabase/         Postgres schema, RLS policies, and Auth-backed accounts
local-tasks/      Fixture authoring pipeline that compiles into ui/data.js
bin/              dev.sh, staging-local.sh, launch.sh, qa-sweep.sh, render_all.js
```

### Lab state isolation

Module lab state is namespaced per lab and per student. `lab-runtime.js` keys
on `mnt-portal.lab-state.v1.<labId>.<anonymousStudentId>`, so resetting one
exercise cannot erase course progress or another module's work. New module
labs should go through `LabRuntime`, not raw `localStorage`.

## Curriculum status

The SOC Analyst track is the built one: 12 modules across 6 weeks, module 12 is
the capstone. Modules 1–11 are isolated miniature labs that deliberately expose
only task-relevant controls; **module 12 alone** exposes the complete integrated
range. Do not leak future evidence, full navigation, or the capstone storyline
into an earlier module.

All 12 module routes are implemented. The shared lab contract is in
`docs/specs/MODULE_STANDARD.md`. Start active work from `ROADMAP.md`; it defines the
single delivery order, Module 1 direction, and CI/CD path. `docs/handoffs/HANDOFF.md`
retains concise evidence for the active work item.

> **Important — lab and assessment development:** Before changing Learn It,
> Practice It, Prove It, simulators, assessment scoring, or instructor/admin
> review, read `docs/LAB_ASSESSMENT_STANDARD.md`. Module 1 is the UX reference.
> Prove It requires instructor review, readable student-written responses,
> competency-based partial credit, and support for multiple valid investigative
> paths.

## Deployment

Pushing to `master` triggers `.github/workflows/pages.yml`, which assembles the
single-origin site and publishes it to GitHub Pages. No manual deploy step.

## Documentation map

| File | What it covers |
|---|---|
| `docs/specs/MODULE_STANDARD.md` | The shape every module object must carry |
| `docs/MNT_DESIGN_TOKENS.md` | Colors, type, and components taken from the live site |
| `archive/session-logs/LATEST_PROGRESS.md` | Current status and project direction |
| `ROADMAP.md` | Canonical delivery order, Module 1 direction, and CI/CD workflow |
| `docs/handoffs/HANDOFF.md` | Evidence for the active roadmap item; historical logs are in `archive/session-logs/` |
| `docs/handoffs/NEXT_SESSION.md` | Compatibility pointer to the roadmap, not a second task queue |
| `docs/operations/PROJECT_GUIDE_FOR_AI.md` | Orientation for AI agents working in this repo |
| `docs/operations/OPERATIONS.md` | Live data control plane, test-account cleanup, and cohort retention |
| `docs/LAB_ASSESSMENT_STANDARD.md` | Required architecture and review standard for labs and Prove It assessments |

Legacy SC-200 files (`SC200_LAB.md`, `ExamObjectives.md`, `COVERAGE_SWEEP.md`,
`GAP_BRIDGE.md`) are retained as implementation history. This course teaches
general SOC analyst work; those documents no longer define its scope.

## Legal

Mission Next Technical Academy Labs is an independent training publication and
is not affiliated with, authorized, sponsored, or approved by any software
vendor. All lab UI code and lab data are original and fictional. Curriculum
includes concepts aligned with cybersecurity analyst certification objectives;
completion does not guarantee certification or exam passage.
