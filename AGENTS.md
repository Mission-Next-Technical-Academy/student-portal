# Instructions for AI agents (Codex and others)

Read `CLAUDE.md` in this directory first and follow its rules. It is the
single set of project instructions for every agent, not only Claude Code.

In particular, run the app locally only with `bin/dev.sh`, which connects to
the **staging** Supabase project. Confirm `bin/dev.sh status` shows
`target=STAGING` before signing in, never use `--production` unless a person
explicitly asks in this session, and never serve `portal/` any other way.
