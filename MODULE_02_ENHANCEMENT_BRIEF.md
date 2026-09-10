# Module 02 enhancement brief — Network, Identity & Security Foundations

Sprint target: Sprint 3 only  
Source: `CURRICULUM_SCENARIO_ARCHITECTURE.md` §§2–4 and the Sprint 2 audit  
Status: draft brief; do not begin until Sprint 2 reviewer gates are resolved

## Scope

Bring Module 02 up to the Module 01 learning loop while preserving the locked
660-minute / 11-hour allocation in `portal/data.js`:

1. Convert each of the eight existing lessons to scenario → theory →
   knowledge check with per-answer feedback → applied task.
2. Retain the current 180-minute trust-path lab and add one independent lab
   with a different decision path: MFA push-bombing against a Mission Next Labs
   admin account followed by conditional-access review.
3. Review the existing module-level quiz bank for scenario-based BEST/MOST/FIRST
   reasoning and plausible distractors.
4. Rewrite the module's Security+ summary only after the §2 crosswalk receives
   curriculum/compliance/faculty approval. Until then, leave tags and claims
   unchanged.
5. Review/add sources in the Module 01 pattern without copying proprietary or
   exam-proprietary text.

## Continuity and fixture rules

- Use Mission Next Labs and new lowercase `acct-###` / `ws-###` identifiers in
  new learner-facing content.
- Assign a unique `INC-####` reference only after the shared incident register
  is confirmed; Sprint 2 intentionally did not reserve one.
- Keep all addresses, domains, hashes, and people fictional. Use documentation
  ranges and the repository's synthetic hash conventions.
- Do not merge Module 02's identity case into Module 09–11's future shared
  ransomware evidence set.

## Minute and authority guardrails

Do not add minutes, change `durationMinutes`, change `creditMinutes`, or alter
`parentAllocations` without explicit compliance approval. The module's current
lesson allocations are eight × 60 minutes, and its existing lab is 180 minutes;
the brief is an instructional reshaping constraint, not permission to inflate
the advertised total.

## Verification expected for Sprint 3

- `node --check portal/soc-analyst-module-02.js`
- `node bin/portal-check.js 2`
- Structural check that all eight lessons have the four-part activity shape,
  the existing lab remains available, and the new lab has an independent
  decision path.
- `git diff --check` and a rendered route smoke test; syntax alone is not
  sufficient for shared rendering/wiring changes.
