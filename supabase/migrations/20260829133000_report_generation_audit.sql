-- Mission Next Technical Academy — report-generation audit metadata.
--
-- This migration is intentionally local-only/unapplied until an authorized
-- operator reviews it and applies it with the rest of the reporting schema.
-- It records report metadata and integrity hashes; it does not store PDF file
-- bytes. Downloaded report retention still belongs to institutional storage
-- and records-retention procedures.

create table if not exists public.report_generation_audit (
  id uuid primary key default gen_random_uuid(),
  report_id text not null unique,
  report_type text not null check (report_type in (
    'cohort_annual_report',
    'individual_academic_transcript',
    'individual_supporting_evidence_record',
    'internal_compliance_gap_report'
  )),
  requesting_admin_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  scope_parameters jsonb not null default '{}'::jsonb,
  source_data_cutoff timestamptz not null,
  generation_status text not null default 'requested'
    check (generation_status in ('requested', 'succeeded', 'failed')),
  failure_reason text,
  file_sha256 text check (file_sha256 is null or file_sha256 ~ '^[0-9a-f]{64}$'),
  storage_reference text,
  report_classification text not null default 'draft'
    check (report_classification in ('draft', 'official')),
  template_version text not null,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (generation_status = 'succeeded' and file_sha256 is not null and failure_reason is null and finalized_at is not null)
    or (generation_status = 'failed' and failure_reason is not null and finalized_at is not null)
    or (generation_status = 'requested' and finalized_at is null)
  )
);

comment on table public.report_generation_audit is
  'Durable metadata audit for report-generation requests. Stores report IDs, scope, requesting admin, status, hashes, and storage references, not student report content.';
comment on column public.report_generation_audit.scope_parameters is
  'Operational scope only. Do not store roster rows, student artifacts, or browser-local state snapshots here.';
comment on column public.report_generation_audit.storage_reference is
  'Reference to institutional storage when available. A browser-download reference is not durable retained storage.';

create index if not exists report_generation_audit_requested_idx
  on public.report_generation_audit (requested_at desc);
create index if not exists report_generation_audit_admin_idx
  on public.report_generation_audit (requesting_admin_id, requested_at desc);
create index if not exists report_generation_audit_type_idx
  on public.report_generation_audit (report_type, generation_status);

alter table public.report_generation_audit enable row level security;

create policy report_generation_audit_admin_read on public.report_generation_audit
  for select using (public.is_admin());
create policy report_generation_audit_admin_insert on public.report_generation_audit
  for insert with check (public.is_admin() and requesting_admin_id = auth.uid());

grant select, insert on public.report_generation_audit to authenticated;

create or replace function public.finalize_report_generation_audit(
  p_audit_id uuid,
  p_generation_status text,
  p_file_sha256 text default null,
  p_storage_reference text default null,
  p_failure_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator role required';
  end if;
  if p_generation_status not in ('succeeded', 'failed') then
    raise exception 'Invalid report generation status';
  end if;
  if p_generation_status = 'succeeded' and p_file_sha256 is null then
    raise exception 'A succeeded report audit row requires a file hash';
  end if;
  if p_generation_status = 'failed' and coalesce(p_failure_reason, '') = '' then
    raise exception 'A failed report audit row requires a failure reason';
  end if;

  update public.report_generation_audit
  set generation_status = p_generation_status,
      file_sha256 = case when p_generation_status = 'succeeded' then p_file_sha256 else null end,
      storage_reference = case when p_generation_status = 'succeeded' then p_storage_reference else null end,
      failure_reason = case when p_generation_status = 'failed' then left(p_failure_reason, 500) else null end,
      finalized_at = now(),
      updated_at = now()
  where id = p_audit_id
    and requesting_admin_id = auth.uid()
    and generation_status = 'requested';

  if not found then
    raise exception 'Report audit row not found or already finalized';
  end if;
end;
$$;

grant execute on function public.finalize_report_generation_audit(uuid, text, text, text, text) to authenticated;
