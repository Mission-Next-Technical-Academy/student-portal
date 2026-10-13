# Instructions for AI agents (Codex and others)

> **Student data before 2027-11-02 is synthetic (owner, 2026-10-13).** Every
> student account, enrollment, submission and grade dated before **2 November
> 2027** belongs to a fake test student, not a real learner. This does not relax
> any production, database or deploy rule in `docs/operations/AI_AGENT_RULES.md`.

Read `CLAUDE.md` in this directory first and follow its rules. It is the
single set of project instructions for every agent, not only Claude Code.

In particular, run the app locally only with `bin/dev.sh`, which connects to
the **staging** Supabase project. Confirm `bin/dev.sh status` shows
`target=STAGING` before signing in, never use `--production` unless a person
explicitly asks in this session, and never serve `portal/` any other way.

Before database, staging, deploy or merge work, read docs/operations/AI_AGENT_RULES.md.
