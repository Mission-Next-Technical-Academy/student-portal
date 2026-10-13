# Portal release versioning

The portal uses Semantic Versioning and exposes the active release in its
footer. The authoritative source is the repository-root `VERSION` file; the
matching browser constant lives in `portal/release.js` because this project
intentionally has no build step.

- Patch (`1.0.x`): behavior-preserving fixes and maintenance.
- Minor (`1.x.0`): backward-compatible user-facing capability.
- Major (`x.0.0`): a deliberately breaking compatibility change.

For every deployment release:

1. Update both `VERSION` and `portal/release.js` in the release commit.
2. Commit with `release: v<version>`.
3. Tag that exact commit as `v<version>` and push the commit and tag together.
4. Record the deployed commit SHA in the deployment debrief.

The displayed version is deliberately not derived from a live Git command:
GitHub Pages serves static files, and the portal must remain functional when
opened locally or offline.

## Production build counter (auto)

Deployed builds are versioned automatically as `1.<59000 + N - 590>`, where
`N` is the commit count on `master` (`git rev-list --count HEAD`). The counter
is anchored so the old `1.590` (commit #590) became `1.59000`; each commit adds
1 (`1.59001`, `1.59002`, ...). The fixed five-digit width keeps versions
sortable through `1.99999`, i.e. commit #41589 — 40,999 commits after the
anchor. Past that the counter becomes six digits and should move to `2.x`. `.github/workflows/pages.yml`
generates `release.js` into the assembled site on every push to `master`, so the
footer counter increments with each push and no version-bump commit is needed.
The deploy never edits source. `VERSION` and `portal/release.js` are kept equal
to the deployed number by `bin/stamp-version.sh` (run it before a commit, or any
time, to sync them to the version the next commit will deploy as). The manual
`release:` tag procedure above is superseded by this counter.
