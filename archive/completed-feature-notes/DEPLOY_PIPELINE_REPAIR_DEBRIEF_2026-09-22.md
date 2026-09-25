# Deploy pipeline repair debrief — 2026-09-22

## Outcome

GitHub Pages deployment was repaired and successfully published from commit
`fe80fe3` (`Repair Pages deploy and Assessment Lab rail`). The deployment run
completed successfully:

- Run: https://github.com/Mission-Next-Technical-Academy/student-portal/actions/runs/35715290805
- Build: success
- GitHub Pages deploy: success
- Live-site check: success

The public site was fetched after deployment and confirmed to serve the
updated `app.js` logic and current `m360-entry.js` cache-busted script tag.

## Root causes repaired

### 1. Pages verification had a stale cache-buster value

The Pages workflow required this exact obsolete script tag value:

```sh
grep -q 'm360-entry.js?v=20260904' _site/index.html
```

The portal correctly used a newer cache-busted version, causing every Pages
deployment to fail at the assembled-site verification step. The workflow now
checks only that the versioned `m360-entry.js` source exists:

```sh
grep -q 'src="m360-entry.js?v=' _site/index.html
```

### 2. Assessment Lab fallback was suppressed by unrelated review sections

`normalizeModuleStages()` treated any `review`-phase section as a replacement
for the required Assessment Lab. That caused modules with legacy sections such
as `Module Review` or `Integrated scenario` to lose their generic Assessment
Lab rail row and rendered assessment surface.

The fallback is now omitted only if the module has actually authored a section
titled `Assessment Lab`. Module 01 retains its authored case-console
assessment; modules with a distinct Module Review retain both their review and
their required Assessment Lab.

## Regression protection added

`bin/portal-check.js` now validates the navigation rail itself rather than
accepting matching text anywhere on the page. For each rendered module rail it
requires:

- Learn It, Practice It, Prove It, and Assessment Lab labels;
- exactly one `Assessment Lab` rail row;
- the generic assessment DOM surface when the generic fallback is used, or
  Module 01's authored `Prove It · Assessment Lab` surface otherwise;
- Guided Lab in the Practice It navigation.

This catches both a missing Assessment Lab and a duplicate one before Pages
can publish it.

## Validation performed

- `node --check portal/app.js`
- `node --check bin/portal-check.js`
- `node bin/portal-check.js` — all catalogue modules passed
- `./bin/ci-check.sh` — passed, including 129/129 simulator routes with no
  dead navigation routes
- Local Pages assembly and assembled-site verification — passed
- GitHub Actions Pages build and deployment — passed
- Public live-site content verification after deployment — passed

## Scope and repository state

Only these files were committed and pushed in `fe80fe3`:

- `.github/workflows/pages.yml`
- `portal/app.js`
- `bin/portal-check.js`

The pre-existing modified `bin/launch.sh` and the earlier untracked findings
note were deliberately not included in the commit.
