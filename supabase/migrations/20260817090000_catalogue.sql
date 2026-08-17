-- MNT Academy — catalogue tables.
--
-- Content (topic lists, lesson bodies, capstone stage text) lives in the site
-- repo as versioned TypeScript. These tables hold only stable keys and the
-- structural facts the database needs to reason about entitlement and progress.
-- See PLATFORM_ARCHITECTURE.md §4.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- programs

create table public.programs (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  title          text not null,
  card_title     text not null,
  tagline        text,
  description    text not null,
  badge          text,
  icon           text not null,               -- ri-* class
  duration_weeks int  not null,
  module_count   int  not null,
  sort_order     int  not null default 0,
  is_published   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.programs is
  'One row per track. Four tracks: it-support, soc-analyst, ai-ml, electrical.';
comment on column public.programs.is_published is
  'Gates each track independently so one can ship while the others are stubs.';

-- ----------------------------------------------------------------- modules

create table public.modules (
  id           uuid primary key default gen_random_uuid(),
  program_id   uuid not null references public.programs(id) on delete cascade,
  module_key   text not null,                 -- 'soc-01'; joins to repo content
  number       int  not null,
  week         int  not null,
  title        text not null,
  summary      text,
  est_hours_min int,
  est_hours_max int,
  lesson_count int not null default 0,
  lab_count    int not null default 0,
  is_capstone  boolean not null default false,
  sort_order   int  not null,
  created_at   timestamptz not null default now(),
  unique (program_id, module_key),
  unique (program_id, number)
);

create index modules_program_idx on public.modules (program_id, sort_order);

comment on column public.modules.module_key is
  'Stable join key to src/content/programs/<slug>.ts. Never renumber it.';

-- -------------------------------------------------------------------- labs

create table public.labs (
  id           uuid primary key default gen_random_uuid(),
  module_id    uuid not null references public.modules(id) on delete cascade,
  lab_key      text not null unique,
  title        text not null,
  description  text,
  difficulty   text not null
                 check (difficulty in ('Foundational','Intermediate','Advanced')),
  duration_min int  not null,
  is_capstone  boolean not null default false,
  sim_entry    text,                          -- simulator route, e.g. '#/defender/incidents'
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index labs_module_idx on public.labs (module_id, sort_order);

comment on column public.labs.sim_entry is
  'The ONLY place the LMS knows a simulator route. See PLATFORM_ARCHITECTURE.md §7.3.';

-- ------------------------------------------------------------- updated_at

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger programs_touch before update on public.programs
  for each row execute function public.touch_updated_at();
