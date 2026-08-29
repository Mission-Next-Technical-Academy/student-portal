-- MNT Academy — Agent 7: durable assessment evidence and optional capstone review.
--
-- This migration is deliberately additive.  It is NOT applied by this task;
-- review it and deploy through the institution's normal Supabase change
-- process.  Portfolio rows are append-only evidence snapshots: a re-submit
-- creates a new row rather than replacing the learner's earlier work.

alter table public.lab_attempts
  add column if not exists rubric_version text,
  add column if not exists scoring_engine_version text,
  add column if not exists pass_threshold numeric(5,2);

alter table public.capstone_submissions
  add column if not exists critical_error_count integer not null default 0 check (critical_error_count >= 0),
  add column if not exists passed_critical_error_gate boolean,
  add column if not exists rubric_version text,
  add column if not exists scoring_engine_version text,
  add column if not exists pass_threshold numeric(5,2);

alter table public.portfolio_artifacts
  add column if not exists module_key text,
  add column if not exists lab_key text,
  add column if not exists submitted_by uuid references auth.users(id) on delete set null,
  add column if not exists submitted_at timestamptz not null default now(),
  add column if not exists artifact_version integer not null default 1 check (artifact_version > 0),
  add column if not exists supersedes_artifact_id uuid references public.portfolio_artifacts(id) on delete set null,
  add column if not exists content_sha256 text,
  add column if not exists rubric_version text,
  add column if not exists scoring_engine_version text,
  add column if not exists pass_threshold numeric(5,2);

-- The digest is calculated in the database so a browser cannot claim a hash
-- for different content. storage_path remains available for a later managed
-- object-store upload; current structured capstone evidence is held in jsonb.
create extension if not exists pgcrypto;
create or replace function public.portfolio_artifact_digest()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if new.content is not null then
    new.content_sha256 := encode(digest(new.content::text, 'sha256'), 'hex');
  end if;
  new.submitted_by := coalesce(new.submitted_by, new.user_id);
  new.submitted_at := coalesce(new.submitted_at, now());
  return new;
end;
$$;

drop trigger if exists portfolio_artifact_digest_before_insert on public.portfolio_artifacts;
create trigger portfolio_artifact_digest_before_insert
  before insert on public.portfolio_artifacts
  for each row execute function public.portfolio_artifact_digest();

create table if not exists public.capstone_reviews (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null unique references public.portfolio_artifacts(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_code text not null check (track_code in ('SOCAN', 'HDESK', 'AIENG', 'ELECT', 'ADMIN')),
  review_status text not null default 'not_requested'
    check (review_status in ('not_requested', 'pending', 'approved', 'changes_requested')),
  official_outcome text
    check (official_outcome is null or official_outcome in ('approved', 'approved_with_notes', 'changes_requested')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewer_notes text,
  supervision_method text not null default 'optional faculty review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (review_status in ('not_requested', 'pending') and reviewed_by is null and reviewed_at is null and official_outcome is null)
    or (review_status in ('approved', 'changes_requested') and reviewed_by is not null and reviewed_at is not null and official_outcome is not null)
  )
);

create index if not exists capstone_reviews_user_idx on public.capstone_reviews (user_id, created_at desc);
create trigger capstone_reviews_touch before update on public.capstone_reviews
  for each row execute function public.touch_updated_at();

alter table public.capstone_reviews enable row level security;
create policy capstone_reviews_student_read on public.capstone_reviews
  for select using (user_id = auth.uid());
create policy capstone_reviews_admin_read on public.capstone_reviews
  for select using (public.is_admin());
create policy capstone_reviews_admin_insert on public.capstone_reviews
  for insert with check (public.is_admin());
create policy capstone_reviews_admin_update on public.capstone_reviews
  for update using (public.is_admin()) with check (public.is_admin());

create policy portfolio_artifacts_admin_read on public.portfolio_artifacts
  for select using (public.is_admin());

grant select, insert on public.portfolio_artifacts to authenticated;
grant select, insert, update on public.capstone_reviews to authenticated;

comment on table public.capstone_reviews is
  'Optional instructor review for capstone evidence. Automated score completion is distinct from faculty review; neither silently overwrites the submitted artifact.';
