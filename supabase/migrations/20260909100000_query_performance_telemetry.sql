-- Mission Next Technical Academy — query performance telemetry.
--
-- Written-only design migration. Do not apply until the telemetry contract,
-- retention job, and representative plans have been reviewed. This schema is
-- intentionally aggregate-first: it never stores SQL, JWTs, request
-- parameters, request bodies, student work, or IP addresses.

-- The catalog is the only source of accepted feature identifiers. Ingestion
-- uses a foreign key and an explicit allow-list check; callers cannot invent
-- arbitrary feature names or use a SQL statement as a metric key.
create table if not exists public.query_feature_catalog (
  feature_key text primary key
    check (feature_key ~ '^[a-z][a-z0-9]*(\.[a-z0-9]+){1,3}$'),
  operation_class text not null check (operation_class in ('interactive_read', 'write', 'report', 'background')),
  source_location text not null check (length(source_location) between 1 and 160),
  warning_threshold_ms integer not null check (warning_threshold_ms between 1 and 600000),
  alert_threshold_ms integer not null check (alert_threshold_ms >= warning_threshold_ms and alert_threshold_ms <= 600000),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.query_feature_catalog
  (feature_key, operation_class, source_location, warning_threshold_ms, alert_threshold_ms)
values
  ('portal.session.bootstrap', 'interactive_read', 'portal/app.js:session bootstrap', 250, 1000),
  ('portal.student.progress', 'interactive_read', 'portal/app.js:student progress', 250, 1000),
  ('portal.student.transcript', 'interactive_read', 'portal/app.js:transcript', 250, 1000),
  ('admin.roster.load', 'interactive_read', 'portal/app.js:admin roster', 250, 1000),
  ('admin.activity.load', 'interactive_read', 'portal/app.js:activity monitor', 250, 1000),
  ('admin.cohorts.load', 'interactive_read', 'portal/app.js:cohorts', 250, 1000),
  ('admin.archive.load', 'interactive_read', 'portal/app.js:archived students', 250, 1000),
  ('admin.report.generate', 'report', 'portal/app.js:report generation', 500, 2000),
  ('edge.login.geofence', 'background', 'supabase/functions/check-login-geofence', 250, 1000),
  ('edge.login.ueba', 'background', 'supabase/functions/check-login-ueba', 250, 1000)
on conflict (feature_key) do update
set operation_class = excluded.operation_class,
    source_location = excluded.source_location,
    warning_threshold_ms = excluded.warning_threshold_ms,
    alert_threshold_ms = excluded.alert_threshold_ms;

comment on table public.query_feature_catalog is
  'Private allow-list for telemetry feature keys. It is configuration, not a store for SQL or request data.';

-- One row per feature/source/hour. Resource counters are optional because the
-- browser boundary cannot observe database buffers; database-statistics
-- adapters may populate them later through a separate trusted path.
create table if not exists public.query_feature_metrics_hourly (
  bucket_start timestamptz not null,
  feature_key text not null references public.query_feature_catalog(feature_key),
  source text not null check (source in ('portal', 'edge_function', 'rpc', 'scheduled_job', 'database')),
  call_count bigint not null default 0 check (call_count >= 0),
  error_count bigint not null default 0 check (error_count >= 0 and error_count <= call_count),
  total_duration_ms numeric(18,3) not null default 0 check (total_duration_ms >= 0),
  max_duration_ms numeric(18,3) not null default 0 check (max_duration_ms >= 0),
  rows_returned bigint not null default 0 check (rows_returned >= 0),
  threshold_breach_count bigint not null default 0 check (threshold_breach_count >= 0 and threshold_breach_count <= call_count),
  last_seen_at timestamptz not null default now(),
  primary key (bucket_start, feature_key, source)
);

create index if not exists query_feature_metrics_hourly_recent_idx
  on public.query_feature_metrics_hourly (bucket_start desc, feature_key, source);

-- Bounded samples support p95/outlier review without retaining a full request
-- log. Rows are anonymous by design; caller_class is derived by the RPC and
-- is deliberately only a coarse role class.
create table if not exists public.query_feature_metric_samples (
  id bigint generated always as identity primary key,
  observed_at timestamptz not null default now(),
  feature_key text not null references public.query_feature_catalog(feature_key),
  source text not null check (source in ('portal', 'edge_function', 'rpc', 'scheduled_job', 'database')),
  duration_ms numeric(18,3) not null check (duration_ms >= 0),
  rows_returned bigint not null default 0 check (rows_returned >= 0),
  result_category text not null check (result_category in ('success', 'empty', 'error', 'timeout')),
  caller_class text not null check (caller_class in ('authenticated', 'admin', 'service'))
);

create index if not exists query_feature_metric_samples_lookup_idx
  on public.query_feature_metric_samples (feature_key, source, observed_at desc);
create index if not exists query_feature_metric_samples_retention_idx
  on public.query_feature_metric_samples (observed_at);

alter table public.query_feature_catalog enable row level security;
alter table public.query_feature_metrics_hourly enable row level security;
alter table public.query_feature_metric_samples enable row level security;

-- No table grants: all writes and reads pass through the functions below.

-- Server-side ingestion boundary for portal measurements. The source is fixed
-- to portal so an authenticated browser cannot claim to be a database job.
-- The actor is derived from auth.uid()/is_admin(); no JWT or user id is stored.
create or replace function public.record_query_feature_metric(
  p_feature_key text,
  p_duration_ms numeric,
  p_rows_returned bigint default 0,
  p_result_category text default 'success',
  p_sample boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_class text;
  v_bucket timestamptz := date_trunc('hour', now());
  v_is_error boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_feature_key is null or not exists (
    select 1 from public.query_feature_catalog
    where feature_key = p_feature_key and enabled = true
  ) then
    raise exception 'Feature key is not allow-listed';
  end if;
  if p_duration_ms is null or p_duration_ms < 0 or p_duration_ms > 600000 then
    raise exception 'Duration is outside the permitted range';
  end if;
  if p_rows_returned is null or p_rows_returned < 0 or p_rows_returned > 1000000000 then
    raise exception 'Row count is outside the permitted range';
  end if;
  if p_result_category not in ('success', 'empty', 'error', 'timeout') then
    raise exception 'Invalid result category';
  end if;
  if p_sample and random() > 0.10 then
    p_sample := false;
  end if;

  v_caller_class := case when public.is_admin() then 'admin' else 'authenticated' end;
  v_is_error := p_result_category in ('error', 'timeout');

  insert into public.query_feature_metrics_hourly
    (bucket_start, feature_key, source, call_count, error_count,
     total_duration_ms, max_duration_ms, rows_returned,
     threshold_breach_count, last_seen_at)
  select v_bucket, c.feature_key, 'portal', 1, case when v_is_error then 1 else 0 end,
         p_duration_ms, p_duration_ms, p_rows_returned,
         case when p_duration_ms >= c.warning_threshold_ms then 1 else 0 end,
         now()
  from public.query_feature_catalog c
  where c.feature_key = p_feature_key
  on conflict (bucket_start, feature_key, source) do update
  set call_count = query_feature_metrics_hourly.call_count + 1,
      error_count = query_feature_metrics_hourly.error_count + excluded.error_count,
      total_duration_ms = query_feature_metrics_hourly.total_duration_ms + excluded.total_duration_ms,
      max_duration_ms = greatest(query_feature_metrics_hourly.max_duration_ms, excluded.max_duration_ms),
      rows_returned = query_feature_metrics_hourly.rows_returned + excluded.rows_returned,
      threshold_breach_count = query_feature_metrics_hourly.threshold_breach_count + excluded.threshold_breach_count,
      last_seen_at = excluded.last_seen_at;

  if p_sample then
    insert into public.query_feature_metric_samples
      (feature_key, source, duration_ms, rows_returned, result_category, caller_class)
    values (p_feature_key, 'portal', p_duration_ms, p_rows_returned, p_result_category, v_caller_class);
  end if;
end;
$$;

revoke all on function public.record_query_feature_metric(text, numeric, bigint, text, boolean) from public;
grant execute on function public.record_query_feature_metric(text, numeric, bigint, text, boolean) to authenticated;

-- Admin-only read model. It exposes aggregates and p95 from anonymous samples,
-- never sample rows, caller classes, SQL text, parameters, or identities.
create or replace function public.get_query_feature_metrics(
  p_since timestamptz default now() - interval '24 hours',
  p_until timestamptz default now(),
  p_feature_key text default null
)
returns table (
  bucket_start timestamptz,
  feature_key text,
  source text,
  call_count bigint,
  error_count bigint,
  mean_duration_ms numeric,
  p95_duration_ms numeric,
  max_duration_ms numeric,
  rows_returned bigint,
  threshold_breach_count bigint,
  last_seen_at timestamptz,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator role required';
  end if;
  if p_since is null or p_until is null or p_since > p_until or p_until - p_since > interval '13 months' then
    raise exception 'Invalid telemetry time window';
  end if;
  if p_feature_key is not null and not exists (
    select 1 from public.query_feature_catalog where feature_key = p_feature_key
  ) then
    raise exception 'Feature key is not allow-listed';
  end if;

  return query
  select h.bucket_start, h.feature_key, h.source, h.call_count, h.error_count,
         round(h.total_duration_ms / nullif(h.call_count, 0), 3),
         round(percentile_cont(0.95) within group (order by s.duration_ms)::numeric, 3),
         h.max_duration_ms, h.rows_returned, h.threshold_breach_count, h.last_seen_at,
         case when h.max_duration_ms >= c.alert_threshold_ms then 'regression'
              when h.max_duration_ms >= c.warning_threshold_ms then 'investigate'
              else 'healthy' end
  from public.query_feature_metrics_hourly h
  join public.query_feature_catalog c using (feature_key)
  left join public.query_feature_metric_samples s
    on s.feature_key = h.feature_key and s.source = h.source
   and s.observed_at >= greatest(h.bucket_start, p_since)
   and s.observed_at < least(h.bucket_start + interval '1 hour', p_until)
  where h.bucket_start >= date_trunc('hour', p_since)
    and h.bucket_start < p_until
    and (p_feature_key is null or h.feature_key = p_feature_key)
  group by h.bucket_start, h.feature_key, h.source, h.call_count, h.error_count,
           h.total_duration_ms, h.max_duration_ms, h.rows_returned,
           h.threshold_breach_count, h.last_seen_at, c.warning_threshold_ms,
           c.alert_threshold_ms
  order by h.bucket_start desc, h.feature_key, h.source;
end;
$$;

revoke all on function public.get_query_feature_metrics(timestamptz, timestamptz, text) from public;
grant execute on function public.get_query_feature_metrics(timestamptz, timestamptz, text) to authenticated;

-- Retention hook for pg_cron or an approved operator. The function can run as
-- an admin or the database scheduler; it never deletes student records.
create or replace function public.purge_query_feature_metrics()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted bigint;
begin
  if not (public.is_admin() or current_user = 'postgres') then
    raise exception 'Administrator or scheduler role required';
  end if;
  delete from public.query_feature_metric_samples where observed_at < now() - interval '30 days';
  get diagnostics v_deleted = row_count;
  delete from public.query_feature_metrics_hourly where bucket_start < now() - interval '13 months';
  return v_deleted;
end;
$$;

revoke all on function public.purge_query_feature_metrics() from public;
grant execute on function public.purge_query_feature_metrics() to authenticated;

comment on table public.query_feature_metric_samples is
  'Anonymous, bounded telemetry samples retained for 30 days for p95/outlier calculation; never stores SQL, JWTs, parameters, payloads, IPs, or user IDs.';
comment on function public.get_query_feature_metrics(timestamptz, timestamptz, text) is
  'Admin-only aggregate read model. Returns hourly metrics and p95 samples without exposing raw statements or sample rows.';
comment on function public.purge_query_feature_metrics() is
  'Retention hook: removes samples older than 30 days and hourly aggregates older than 13 months. Schedule separately after review.';
