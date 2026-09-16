-- Module 1's guided-lab completion (quiz passed, console completed, lab 2
-- completed, all lessons checked+submitted) has only ever lived in
-- browser-local storage (LabRuntime) — never synced server-side. That was
-- harmless while it only drove a cosmetic complete/in-progress badge, but
-- once module access became sequentially gated on real completion
-- (portal/app.js hasModuleAccess -> moduleCompletion), a student who
-- genuinely finished Module 1 on one device/browser would show as
-- incomplete on any other, and be locked out of the entire rest of the
-- course despite having earned it.
--
-- This is a single nullable JSONB "beacon" column, written only at the
-- four moments that flip a boolean moduleCompletion() already checks
-- (quiz passed, console completed, lab 2 completed, lessons complete) —
-- not on every keystroke. No new table: module_progress already has one
-- row per (user_id, module_key), so this is the natural home for it.
-- Existing row-level RLS (module_progress_own / module_progress_admin_read)
-- already covers the whole row, so no policy change is needed.

alter table public.module_progress
  add column if not exists detail jsonb not null default '{}'::jsonb;

comment on column public.module_progress.detail is
  'Optional per-module granular progress beacon, currently used only by '
  'Module 1 (soc-01) to make its detailed local-only completion checks '
  '(quiz passed, console completed, lab 2 completed, lessons complete) '
  'portable across browsers/devices. Shape: '
  '{quizPassed, consoleCompleted, lab2Completed, lessonsComplete: boolean}. '
  'Empty object for every other module.';
