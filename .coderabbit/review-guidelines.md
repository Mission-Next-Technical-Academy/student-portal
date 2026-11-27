# CodeRabbit review guidelines (added 2026-11-27)

Read by CodeRabbit only, through `knowledge_base.code_guidelines` in
`.coderabbit.yaml`. Rules for how the code is built stay in `CLAUDE.md` and
`.claude/rules/`. Date every change to this file.

1. When you suggest an evidence check, accept at least the required amount.
   Never require an exact count.
2. Student-facing content (KB articles, tickets, messages) never mentions the
   simulator, practice or the course. Fix the check, not the story.
3. In Practice It, never suggest a gate that a normal step done early can't
   undo. Accept equal evidence from other valid paths.
4. The shared save code in `portal/app.js` and `portal/lab-runtime.js` belongs
   to the LMS owner. Flag problems there; don't suggest module-level
   workarounds.
5. Never suggest editing a migration that is already applied. Suggest a new
   migration.
6. Readings teach Tier 1 depth. Flag a statement only if it is wrong at that
   level; don't ask for caveats beyond what the module teaches.
