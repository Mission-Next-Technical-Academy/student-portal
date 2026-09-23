# Lab Authoring Guide

How to build a high-fidelity lab on the Mission Next platform. Distilled from the lap-1 (Apache) reference implementation.

Prerequisites:
- Read `BUILD_PLAN.md` end-to-end (canonical spec, especially §1.3 schema, §1.6 validation, §1.9 11-point checklist).
- Skim `src/data/labs/log-analysis.labs.js` (lap-1 is the worked reference).
- Skim `src/systems/labPlayer.jsx` (the renderer your lab feeds).

---

## 0. Mental Model

A lab is a **data object** — not a component. You write a `LabModule` per the schema in `BUILD_PLAN.md` §1.7 and register it on the global `window.MISSION_NEXT_LABS` registry. The platform handles rendering, gating, validation, progress, and the Check-on-Learning drawer for you. Your job is:

1. Faithfully transcribe the upstream GitHub workflow into discrete steps.
2. Produce realistic synthetic data that backs those steps.
3. Write Check-on-Learning questions that test understanding of what the student just observed.

---

## 1. Browser-Babel Constraint (read first)

This project does not use a bundler. **Do not use `import`/`export`.**

Every file ends with `Object.assign(window, { ... });` (or namespaced like `window.MISSION_NEXT_LABS`).

Lab files are vanilla JS (no JSX). Shell files are JSX. Wrap everything in an IIFE to keep helpers private:

```js
(function () {
  // private helpers, constants
  const LAP_1_LAB = { /* ... */ };
  Object.assign(window.MISSION_NEXT_LABS = window.MISSION_NEXT_LABS || {}, { 'lap-1': LAP_1_LAB });
})();
```

Add new files to `index.html` as `<script>` tags — vanilla JS files first, JSX files (`type="text/babel"`) after.

---

## 2. The Six-Step Authoring Recipe

### Step 1 — Snapshot the upstream `.md`

Already done in Phase 0 for all 32 labs. Snapshots live in `src/data/sources/<lab-id>.source.md`. Hash recorded in `src/data/sources/.manifest.json`.

To verify your snapshot is the one Phase 0 froze:

```bash
sha256sum src/data/sources/lap-1.source.md
# compare with .manifest.json["snapshots"]["lap-1"]["sha256"]
```

Your `LabModule.source.sha256` must match this value. `scripts/check.mjs` enforces it.

If you ever need to re-fetch a source (e.g., the upstream was corrected upstream), update both the snapshot file AND the `sha256` in `.manifest.json` AND in your lab module. CI will fail otherwise.

### Step 2 — Design the synthetic dataset

The dataset must support the upstream workflow. For lap-1 the upstream exercises are:

- Exercise 1: cd into the log directory, list files
- Exercise 2: less the access log, observe entry format
- Exercise 3: grep for an IP, grep for ' 404 ', combine
- Exercise 4: less the error log, identify error types and frequency
- Exercise 5: awk + sort + uniq aggregations

This dictates:
- An access.log with realistic Apache combined-log-format lines
- An error.log with realistic AH00xxx-style entries
- A few peripheral files (`access.log.1.gz`, `other_vhosts_access.log`) for the `ls` step to look real

The dataset must **produce specific numbers** that the lab claims. lap-1 commits to:
- `grep '192.168.1.100'` → 47 matches
- `grep ' 404 '` → 12 matches
- Combined → 5 matches
- `awk '{print $1}' | sort | uniq -c | sort -nr` top → 192.168.1.100 with 47
- `awk '{print $7}' ...` top → /index.html

In `log-analysis.labs.js`, lap-1 generates the access log via `buildApacheAccessLog()` — a deterministic generator. **Use deterministic generators** (no `Math.random()`). The log content must be byte-stable so tests don't flake and `sha256` hashes hold.

`scripts/check.mjs` asserts these counts. Add similar assertions for your lab.

### Step 3 — Build the virtual filesystem

Your lab provides a `LabEnvironment.fs` factory function that returns a tree object the platform passes to `createVirtualFs(tree)`. The tree shape:

```js
{
  'home': {
    'student': {
      '.bashrc': '# auto-generated\nalias ll="ls -la"\n',
      'somedir': { 'foo.txt': 'file content' },
    },
  },
  'var': {
    'log': {
      'apache2': {
        'access.log': buildApacheAccessLog(),
        'error.log': buildApacheErrorLog(),
        // explicit metadata via __file marker:
        'access.log.1.gz': { __file: true, content: '...', mode: '0640', owner: 'root', group: 'adm' },
      },
    },
  },
  'tmp': {},
}
```

Plain string values become files. Nested objects become directories. Array values are joined with `\n`. `__file: true` lets you control mode/owner/mtime.

The factory is called once per lab open. Your generator can be expensive — runs in-browser, in memory.

### Step 4 — Map upstream steps to schema rows

For every numbered step in the upstream `.md`, create one entry in `exercises[].steps[]`. The `kind` field tells the platform what kind of validation to run:

- `command` — the user must type a specific command into the shell. Validate with `commandExecuted` + `acceptedInputs` regex.
- `ui` — the user clicks a tool path (Win+R → eventvwr.msc → Enter). Validate with `uiPath` predicate.
- `observe` — the user opens or pages through something (e.g., `less access.log`). Same validation as command.
- `analyze` — the user reads the output and submits a derived value (e.g., the most common HTTP method). Validate with `valueExtracted`.

Keep `acceptedInputs` regex permissive but specific enough to identify which step is being completed. Examples from lap-1:

```js
// strict path match
acceptedInputs: [{ type: 'regex', value: /^cd\s+\/var\/log\/apache2\/?\s*$/ }]

// permissive grep — accepts ' or " or no quotes around the IP
acceptedInputs: [{ type: 'regex', value: /^grep\s+['"]?192\.168\.1\.100['"]?\s+access\.log\s*$/ }]

// pipeline — allows any whitespace between segments
acceptedInputs: [{ type: 'regex', value: /awk\s+['"]?\{\s*print\s+\$1\s*\}['"]?\s+access\.log\s*\|\s*sort\s*\|\s*uniq\s+-c\s*\|\s*sort\s+-n?r\w*/i }]
```

For `analyze` steps with manual answer input, use `valueExtracted`:

```js
{
  id: 'lap-1.ex2.s2',
  kind: 'analyze',
  instruction: 'Pick out the request method that appears in every line of access.log. Submit the method below.',
  validation: { type: 'valueExtracted', expected: ['GET'] },  // accepts any from the array
  hint: 'It is a single uppercase word...',
  points: 10,
}
```

The `expected` field can be a string, an array of strings (any matches), or a RegExp.

### Step 5 — Write Check-on-Learning questions

Coverage requirements (BUILD_PLAN.md §1.5.3):
- ≥ 1 question per upstream Exercise heading
- ≥ 1 question per Bloom level: `recall` / `comprehension` / `application` / `analysis`
- ≥ 1 question must reference a value the user actually observed in the lab

Question types:
- `multi-select` — multiple correct, default `passThreshold: 'all-correct'`
- `single-select` — exactly one correct
- `short-answer` — `acceptedAnswer` can be string, array, or RegExp

Trigger format:
```js
triggerOn: { stepId: 'lap-1.ex3.s3' },
reinforces: 'lap-1.ex3.s3',
```

Trigger fires when the named step transitions from incomplete to complete. The drawer pops automatically. Students can dismiss / skip; skip is recorded in the instructor view.

### Step 6 — Register and verify

```js
Object.assign(window.MISSION_NEXT_LABS = window.MISSION_NEXT_LABS || {}, { 'lap-1': LAP_1_LAB });
```

Add the file to `index.html` if it's new (lap-1 is in `log-analysis.labs.js` which is already wired). Add assertions to `scripts/check.mjs`:

```js
const lap1 = sandbox.window.MISSION_NEXT_LABS['lap-1'];
assert(Array.isArray(lap1.exercises) && lap1.exercises.length === 5, '...');
assert(lap1.checkOnLearning.length >= 5, '...');
const errs = sandbox.window.MISSION_NEXT_LAB_SCHEMA.validateLabShape(lap1);
assert(errs.length === 0, 'lap-1 schema errors: ' + errs.join('; '));
```

Then run:

```bash
npm run check
```

If green, spin up the dev server and click through the lab manually:

```bash
npm run dev
# open http://127.0.0.1:5173/#/track/log-analysis/project/lap-1/lab
```

Verify:
- Scenario panel renders
- Terminal accepts the upstream commands
- Each correct command marks its step done
- Steps are gated forward-only (try to complete step 3 before step 1 — should be locked)
- CoL drawer pops at the right moments
- Hints reveal after 3 failed attempts; full answer after 5

---

## 3. Patterns to Reuse

### Pattern: command + observe + analyze chain

Every upstream Exercise typically follows this rhythm:

1. **command** — run a command
2. **observe** — see the output (sometimes folded into the command step)
3. **analyze** — extract a value from the output and submit it

lap-1 Exercise 2 demonstrates this exactly: `less access.log` (command), then two analyze steps that ask for the request method and a status code.

### Pattern: forward-only progression

Steps default to requiring the previous step in the same exercise. If you need explicit dependencies (e.g., a step in exercise 3 requires a step in exercise 1), declare:

```js
{ id: 'lap-1.ex3.s1', requires: ['lap-1.ex1.s2'], ... }
```

Don't over-use this. Linear progression is the default and rarely needs overrides.

### Pattern: hint vs answer reveal

The platform auto-reveals the `hint` after 3 failed attempts and the upstream `sourceLine` (as the answer) after 5. You don't write the reveal logic; just supply a good `hint`.

### Pattern: small, focused datasets

Don't generate 10,000 log lines. Generate the minimum that makes counts meaningful and the narrative believable. lap-1 uses 154 access lines — enough to look real, small enough to scan visually.

---

## 4. Common Mistakes

| Mistake | Fix |
|---|---|
| Using `import`/`export` | Vanilla JS + IIFE + `Object.assign(window, ...)` |
| Random data | Deterministic generator. `sha256` must hold. |
| Skipping an upstream step | Each numbered step in the `.md` is one step in `exercises[].steps[]`. None omitted. |
| Inventing extra steps | Same — nothing not in upstream. |
| Generic 12-row fixtures | Forbidden (BUILD_PLAN.md §1.11). The `buildProjectLabFixtures` generator in `data.js` is legacy — never reuse it. |
| `Find High-Severity Evidence` style task names | Forbidden — these are the legacy-fixture sentinel names. Use specific instruction text. |
| Sharing one shell across tools | Each real tool gets its own shell component (BUILD_PLAN.md §1.4, §1.10). |
| Missing CoL question per Exercise | The schema validator in `_schema.js` will fail your build. |
| Missing Bloom level coverage | Your `check.mjs` assertion will fail (see lap-1's). |
| Non-RFC 5737 IPs in synthetic data | Use `198.51.100.0/24`, `203.0.113.0/24`, `192.0.2.0/24` for "external" addresses. RFC 1918 (`10.0.0.0/8`, `192.168.0.0/16`) for internal. |
| Real malicious domains | Never. Use `*.example`, `*.example-bad.com`, reserved/test TLDs. |
| Forgetting to update `check.mjs` | Every new lab needs its own assertions in the existing check.mjs structure. |

---

## 5. Pre-Merge Checklist (the 11-point gate)

Before you open a PR, all eleven of these must hold (BUILD_PLAN.md §1.9):

- [ ] **C1** UI matches the real tool (chrome / panes / fonts / colors / icons close to authentic).
- [ ] **C2** Inputs accepted by the shell are valid in the real tool. Foreign syntax rejected.
- [ ] **C3** Dataset uses real field names from product documentation.
- [ ] **C4** Output renders the way the real tool would render it.
- [ ] **C5** Realistic IOCs (RFC 5737 IPs, real CVE/KB/SHA256 formats, plausible hostnames).
- [ ] **C6** Narrative dataset (baseline → anomaly → impact arc with plausible noise). NOT generic fixtures.
- [ ] **C7** Each lab task corresponds to a numbered step in the upstream `.md`.
- [ ] **C8** ≥ 2 of 3+ steps use `valueExtracted` (not just commandExecuted with no value check).
- [ ] **C9** Every numbered upstream step has a matching `exercises[].steps[]` entry. CI diff-checks this.
- [ ] **C10** Forward gating works. Manual test: try step N+1 before step N — must reject.
- [ ] **C11** ≥ 1 CoL question per Exercise. ≥ 1 question per Bloom level.

`npm run check` enforces a subset of these via lap-1-style assertions. The rest are manual review.

---

## 6. File Layout for Phase 1 Agents

```
src/data/labs/<your-track>.labs.js   # ALL labs in your track in one file
src/data/sources/<your-lab>.source.md  # already snapshotted
src/shells/<your-track>-shells.jsx   # any new shells specific to your track
```

Add the lab file to `index.html` (vanilla JS section, after `log-analysis.labs.js`).
Add any new JSX shells to `index.html` (after the shared shells).

Keep your edits scoped to your track's files. The only shared file you should touch is:
- `index.html` — to register your new files
- `scripts/check.mjs` — to add assertions for your lab(s)
- `src/module-page.jsx` — only if you need to add `id`-specific routing (most agents won't)

Do NOT modify:
- Other agents' track files
- The shared shells (`src/shells/Linux*`, `Power*`, `Cmd*`, `Browser*`, `Notepad*`)
- The systems (`src/systems/*`)
- The lap-1 reference (`log-analysis.labs.js` lap-1 entry — extend with lap-2 / lap-4 separately)

---

## 7. Worked Example: Reading lap-1

To internalize the recipe, open these in order:

1. `src/data/sources/lap-1.source.md` — the upstream canon
2. `src/data/labs/log-analysis.labs.js` — see how the upstream maps to the schema
3. `scripts/check.mjs` — search for `lap-1` to see what assertions look like
4. Run `npm run check` — confirm the assertions pass
5. Run `npm run dev` and play through the lab end-to-end

Then write yours.

---

## 8. Where to Ask

If you hit a real block, the spec lives in `BUILD_PLAN.md`. The schema runtime helper is at `src/data/labs/_schema.js`. The validator predicates are documented at the top of `src/systems/validator.js`. The bash subset implemented by `LinuxTerminalShell` is in the comment block at the top of `src/shells/LinuxTerminalShell.jsx`.

When in doubt: lap-1 is the worked example. Mimic it.
