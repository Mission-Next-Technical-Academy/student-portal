-- Resumable case state belongs on the existing one-row-per-user/module
-- module_progress record. Existing module_progress_own and
-- module_progress_admin_read RLS policies already cover this whole row, so
-- no policy changes are needed.
alter table public.module_progress
  add column if not exists case_state jsonb not null default '{}'::jsonb;

comment on column public.module_progress.case_state is
  'Opaque per-module JSON blob for resumable multi-session lab state: which '
  'tasks are answered, which consequences or complications have already '
  'fired, and which evidence has been reviewed. The first and currently only '
  'consumer will be Module 1''s forthcoming multi-day incident lab (not yet '
  'built). Its shape is intentionally undefined at the database layer because '
  'the case will be authored later.';
