# Deploy pipeline failure — findings (2026-09-22)

**Status: diagnostic only. No code changed, no commits made, nothing pushed.**
Repo working tree was clean (`git status --short` empty) at every point during
this investigation. Nothing described below is a revert of prior work — both
bugs are new, real regressions found by reproducing CI locally and reading
the actual diffs.

## Summary

The live site (`mission-next-technical-academy.github.io/student-portal/`)
has looked frozen/stale because **every GitHub Pages deploy has failed since
2026-09-21T12:04:19Z** (`gh run list --workflow=pages.yml`). 10+ real commits
— including the Module 1 Prove It case console, the Sources & Further
Reading panel detachment, and today's nav-dedup fix — are safely on `master`
but have never actually shipped. Two independent bugs are responsible.

## Bug A — stale hardcoded version string blocks every deploy

**File:** `.github/workflows/pages.yml`, line 67 (`Verify the assembled site` step)

```
grep -q 'm360-entry.js?v=20260904' _site/index.html
```

A legitimate cache-busting rename in `portal/index.html` (commit that
produced `Refine Module 1 case console workflow`, ~2026-09-21T12:04) changed
the script tag to:

```
<script src="m360-entry.js?v=20260921-login-loader-fix"></script>
```

The CI grep was never updated to match. Reproduced locally by assembling
`_site/` exactly as the workflow does (`cp -R portal/. _site/`, etc.) — every
other file-existence check in that step passes; only this one hardcoded
grep fails. This is the root cause of the **entire deploy freeze** — it has
nothing to do with content correctness and has been failing on every commit
since 2026-09-21T12:04, including commits that are otherwise perfectly fine.

**Proposed fix (not applied):** make the check version-agnostic so a future
cache-bust rename can't repeat this:

```
grep -q 'src="m360-entry.js?v=' _site/index.html
```

## Bug B — today's nav-dedup commit over-suppresses the Assessment Lab fallback

**Commit:** `976f8ec` — "Fix duplicate Assessment Lab nav row and content block" (2026-09-22T09:38)

**Intent (legitimate):** Module 01 authored its own real "Assessment Lab"
section (the Prove It case console, case `NST-2407`). Before this commit,
`normalizeModuleStages()` in `portal/app.js` *always* pushed a second,
generic "Assessment Lab" nav row + content block regardless, so Module 01
was showing a literal duplicate. The commit's goal — suppress the generic
fallback when a module already has its own real Assessment Lab — is
correct.

**The bug:** the suppression condition is too broad:

```js
// portal/app.js, normalizeModuleStages(), ~line 4199
if (!normalized.some((section) => section.phase === 'prove')) {
  normalized.push({ id: 'standard-assessment-module', title: 'Assessment Lab', ... });
}
```

`phase: 'prove'` is inferred (`phaseFor()`) from *any* section with
`type === 'review'` — not specifically from a section titled "Assessment
Lab". Grepping the module files confirms two very different things share
`type: 'review'`:

```
portal/soc-analyst-module-01.js:1086:
  { id: 'review', title: 'Assessment Lab', type: 'review', ... }   ← real, complete surface

portal/soc-analyst-module-03.js:510:
  { id: 'review', title: 'Module Review', type: 'review', ... }    ← old placeholder, NOT an Assessment Lab
```

`portal/it-support-module-12.js:200` has the same problem with a section
titled "Integrated scenario".

Result: SOC modules 1, 3–11 and IT Support module 12 *all* got the generic
fallback suppressed, but only Module 01 actually has real replacement
content. Modules 3–11 and IT Support 12 lost their "Assessment Lab" nav
label and content block entirely, with nothing authored to replace it —
confirmed via `node bin/portal-check.js`:

```
module 1   FAIL  missing rendered Assessment Lab surface
module 3   FAIL  missing required module stage: Assessment Lab
module 4   FAIL  missing required module stage: Assessment Lab
... (5–11 same)
its-12     FAIL  missing required module stage: Assessment Lab
```

Separately, Module 01's own real surface (verified present and complete —
`portal/soc-analyst-module-01.js:1011,1230-1232`: `id="m01-review"`,
`id="m01-review-section"`, heading "Prove It · Assessment Lab") uses its own
IDs (`m01-review*`), not the generic fallback's
`id="standard-soc-01-assessment-module"`. `bin/portal-check.js`'s check
hardcodes that generic ID for every module, so it fails Module 01 even
though Module 01's Assessment Lab is genuinely present and working (this is
also exactly what's visible live in-browser right now, from earlier in this
session — the "Open Mission Next SIEM" NST-2407 launch card).

**Proposed fix (not applied), two parts:**

1. `portal/app.js` — narrow the suppression condition from "any review-phase
   section" to "a section literally titled `'Assessment Lab'`":
   ```js
   if (!normalized.some((section) => section.title === 'Assessment Lab')) {
   ```
   This restores the generic fallback for modules 3–11 and IT Support 12
   (whose sections are titled "Module Review" / "Integrated scenario", not
   "Assessment Lab"), while still correctly suppressing it for Module 01
   (the only module whose section is actually titled "Assessment Lab").

2. `bin/portal-check.js` — the assessment-ID check needs to accept a
   module's own authored surface, not just the generic fallback ID. Gate it
   on `data-standard-assessment` (already emitted by `moduleUnifiedNav()`
   in the same commit) the same way the fallback-append logic in
   `portal/module-registry.js` does:
   ```js
   const usesGenericAssessment = /data-standard-assessment="true"/.test(html);
   const assessmentId = `standard-${target.key}-assessment-module`;
   if (usesGenericAssessment) {
     if (!html.includes(`id="${assessmentId}"`)) throw new Error('missing rendered Assessment Lab surface');
   } else if (!html.includes('Prove It · Assessment Lab')) {
     throw new Error('missing authored Assessment Lab surface');
   }
   ```

## What "looks normal again" requires

Both bugs must be fixed together. Bug A alone would ship the current
(Bug-B-broken) `master` as-is, publishing the modules-3–11/its-12 regression
live. Bug B alone doesn't matter until Bug A is fixed, since nothing ships
either way right now.

## Not yet investigated

- Whether `bin/render_all.js` (the simulator-route check, third step in
  `bin/ci-check.sh`) passes cleanly once the above is fixed — not run this
  session.
- Whether any Supabase-side state assumes the generic
  `standard-*-assessment-module` DOM id (e.g. click handlers bound
  elsewhere) — worth a grep before changing `portal/app.js` for real.
