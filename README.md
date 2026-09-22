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
bin/dev.sh          # start both halves, print URLs and demo sign-ins
bin/dev.sh status   # what is listening
bin/dev.sh stop     # shut both down
```

Then open <http://127.0.0.1:8768/#/login>. `portal/supabase-config.js`
hardcodes the live production Supabase project — local dev is not backed by
a local or seeded Supabase instance, it talks to the same database
production does. `supabase/seed.sql` describes four fixed test accounts
(`user1`-`user4`, password equal to username) for a local Supabase-CLI
stack that this repo's `bin/dev.sh` does not actually run; those accounts
were never reachable this way (their email domain in the seed file doesn't
even match the app's real `@missionnext.example` construction in
`portal/app.js`) and **do not work**, against production or otherwise. Sign
in locally with a real provisioned account instead — see below.

Real, provisioned student accounts are never listed in documentation or
source — they're issued per-student through the admin panel/`bin/
provision-students.js` and live only in the gitignored
`bin/.roster-output/*.csv` files (or your password vault, if you've moved
them there already) and in Supabase directly.

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
bin/              dev.sh, launch.sh, qa-sweep.sh, render_all.js
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
`MODULE_STANDARD.md`. Start active work from `ROADMAP.md`; it defines the
single delivery order, Module 1 direction, and CI/CD path. `HANDOFF.md`
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
| `MODULE_STANDARD.md` | The shape every module object must carry |
| `MNT_DESIGN_TOKENS.md` | Colors, type, and components taken from the live site |
| `LATEST_PROGRESS.md` | Current status and project direction |
| `ROADMAP.md` | Canonical delivery order, Module 1 direction, and CI/CD workflow |
| `HANDOFF.md` | Evidence for the active roadmap item; historical logs are in `archive/session-logs/` |
| `NEXT_SESSION.md` | Compatibility pointer to the roadmap, not a second task queue |
| `PROJECT_GUIDE_FOR_AI.md` | Orientation for AI agents working in this repo |
| `OPERATIONS.md` | Live data control plane, test-account cleanup, and cohort retention |
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
