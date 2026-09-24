# M360 gate repair

The full diagnosis, changes, regression coverage, and delivery status are in
[the M360 gate repair report](docs/M360_GATE6_PROPOSED_FIX.md).

The fixes cover obsolete entry assertions, an overbroad LMS boundary check,
CI browser server paths, and a portal JavaScript comment error. The follow-up
adds seven automated boundary-policy tests and scopes migration restrictions
to PRs that actually change M360 product files.

Local browser tests use `http://localhost:8768` with `portal/` as document root.
GitHub Actions serves the repository root and explicitly sets
`M360_TEST_BASE_URL=http://127.0.0.1:4173/portal` in both browser workflows.
