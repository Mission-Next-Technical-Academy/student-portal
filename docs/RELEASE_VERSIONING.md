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
