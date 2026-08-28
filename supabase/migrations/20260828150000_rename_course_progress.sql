-- MNT Academy — reconcile a rename made directly on the live project.
--
-- The site owner renamed lesson_progress -> course_progress via the Supabase
-- dashboard, live, out of band from the migration history. Postgres carried
-- the primary key, FKs, index, trigger, RLS policy, and the
-- admin_student_progress view along automatically (a real ALTER TABLE RENAME
-- preserves all of that) — nothing broke live. This migration exists only so
-- a fresh environment (or anyone re-running migrations from scratch) ends up
-- with the same schema the live project already has. It is safe to run
-- whether or not the rename has already happened.

alter table if exists public.lesson_progress rename to course_progress;
