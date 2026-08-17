-- MNT Academy — progress, lab attempts, simulator state, capstone, portfolio.
-- PLATFORM_ARCHITECTURE.md §4.3–§4.5.

create type public.progress_state as enum ('not_started', 'in_progress', 'complete');

-- NOTE: there is deliberately no 'locked' value. Locked is derived at render
-- time from has_module_access(). Storing it would create a second source of
-- truth that drifts the moment an entitlement changes.

-- ------------------------------------------------------------ module/lesson

create table public.module_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  module_id    uuid not null references public.modules(id) on delete cascade,
  state        public.progress_state not null default 'not_started',
  percent      int not null default 0 check (percent between 0 and 100),
  started_at   timestamptz,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, module_id)
);

create table public.lesson_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  module_id    uuid not null references public.modules(id) on delete cascade,
  lesson_key   text not null,
  state        public.progress_state not null default 'not_started',
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, lesson_key)
);

create index lesson_progress_module_idx on public.lesson_progress (user_id, module_id);

create table public.lab_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  lab_id       uuid not null references public.labs(id) on delete cascade,
  state        public.progress_state not null default 'in_progress',
  score        numeric(5,2),
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  result       jsonb not null default '{}'::jsonb
);

create index lab_attempts_user_idx on public.lab_attempts (user_id, lab_id);

-- ------------------------------------------------------ simulator state
--
-- One row per user per namespace, NOT one row per key. The simulator has ~97
-- distinct storage keys across 232 raw localStorage/sessionStorage call sites
-- with no central wrapper; a key-per-row table would mean hundreds of
-- round-trips per session. See PLATFORM_ARCHITECTURE.md §4.4 and §7.2.
--
-- namespace:
--   'global'          persistent tenant config that follows the student
--   'lab:<lab_key>'   scenario state for one lab, resettable on relaunch
--   'capstone'        the 12-stage capstone, never reset by a lab relaunch
--
-- payload shape:
--   { "local": { "<key>": "<string>" }, "session": { "<key>": "<string>" } }

create table public.sim_state (
  user_id        uuid not null references auth.users(id) on delete cascade,
  namespace      text not null,
  payload        jsonb not null default '{}'::jsonb,
  schema_version int not null default 1,
  updated_at     timestamptz not null default now(),
  primary key (user_id, namespace)
);

create index sim_state_payload_idx on public.sim_state using gin (payload jsonb_path_ops);

-- --------------------------------------------------------------- capstone

create table public.capstone_submissions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  program_id   uuid not null references public.programs(id) on delete cascade,
  stage        int not null check (stage between 1 and 12),
  answers      jsonb not null default '{}'::jsonb,
  score        numeric(5,2),
  submitted_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (user_id, program_id, stage)
);

-- The completion screen's six score dimensions are a VIEW over stage scores,
-- so the rubric can be re-weighted without a migration.
create or replace view public.capstone_scorecard
with (security_invoker = true) as
select
  s.user_id,
  s.program_id,
  round(avg(s.score), 1)                                              as overall_score,
  round(avg(s.score) filter (where s.stage in (1, 2, 3, 4, 5)),  1)   as investigation_accuracy,
  round(avg(s.score) filter (where s.stage in (1, 6)),           1)   as detection_score,
  round(avg(s.score) filter (where s.stage = 7),                 1)   as threat_hunting_score,
  round(avg(s.score) filter (where s.stage in (9, 10)),          1)   as incident_response_score,
  round(avg(s.score) filter (where s.stage = 8),                 1)   as vulnerability_score,
  round(avg(s.score) filter (where s.stage in (11, 12)),         1)   as reporting_score,
  count(*) filter (where s.submitted_at is not null)                  as stages_submitted
from public.capstone_submissions s
group by s.user_id, s.program_id;

-- -------------------------------------------------------------- portfolio

create table public.portfolio_artifacts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  program_id   uuid references public.programs(id) on delete set null,
  kind         text not null check (kind in (
                 'incident_report','vuln_assessment','hunt_report',
                 'exec_summary','incident_timeline','capstone_report')),
  title        text not null,
  storage_path text,
  content      jsonb,
  created_at   timestamptz not null default now()
);

create index portfolio_user_idx on public.portfolio_artifacts (user_id, created_at desc);

-- ------------------------------------------------------------ updated_at

create trigger module_progress_touch before update on public.module_progress
  for each row execute function public.touch_updated_at();
create trigger lesson_progress_touch before update on public.lesson_progress
  for each row execute function public.touch_updated_at();
create trigger sim_state_touch before update on public.sim_state
  for each row execute function public.touch_updated_at();
create trigger capstone_touch before update on public.capstone_submissions
  for each row execute function public.touch_updated_at();
