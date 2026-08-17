-- MNT Academy — profiles, enrollment, and the single access-control function.
-- PLATFORM_ARCHITECTURE.md §4.2.

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Every new auth user gets a profile row automatically.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------- enrollments

create type public.access_mode as enum ('full', 'partial', 'drip');

create table public.enrollments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  program_id    uuid not null references public.programs(id) on delete cascade,
  status        text not null default 'active'
                  check (status in ('active','paused','completed','expired','revoked')),
  access_mode   public.access_mode not null default 'full',
  drip_interval interval not null default '7 days',
  purchased_at  timestamptz not null default now(),
  starts_at     timestamptz not null default now(),
  expires_at    timestamptz,                  -- null = perpetual
  order_ref     text,                         -- payment processor reference
  created_at    timestamptz not null default now(),
  unique (user_id, program_id)
);

create index enrollments_user_idx on public.enrollments (user_id) where status = 'active';

comment on column public.enrollments.access_mode is
  'full = all modules; partial = only module_entitlements rows; drip = week n unlocks at starts_at + drip_interval*(n-1).';

-- Consulted only when access_mode = 'partial'.
create table public.module_entitlements (
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  module_id     uuid not null references public.modules(id) on delete cascade,
  granted_at    timestamptz not null default now(),
  primary key (enrollment_id, module_id)
);

-- ---------------------------------------------------- the access function
--
-- This is the single source of truth for "may this student use this module".
-- Every gated RLS policy calls it. One definition, no drift. The client-side
-- version in the UI is a rendering convenience only and is never the authority.

create or replace function public.has_module_access(p_module_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.modules m on m.program_id = e.program_id
    where m.id = p_module_id
      and e.user_id = auth.uid()
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
      and case e.access_mode
            when 'full' then true
            when 'partial' then exists (
              select 1 from public.module_entitlements me
              where me.enrollment_id = e.id
                and me.module_id = m.id
            )
            when 'drip' then now() >= e.starts_at + e.drip_interval * (m.week - 1)
          end
  );
$$;

create or replace function public.has_program_access(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.enrollments e
    where e.program_id = p_program_id
      and e.user_id = auth.uid()
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

-- Batch resolver: one round-trip for a whole program instead of one per module.
create or replace function public.my_module_access(p_program_slug text)
returns table (module_id uuid, module_key text, module_number int, has_access boolean)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.module_key, m.number, public.has_module_access(m.id)
  from public.modules m
  join public.programs p on p.id = m.program_id
  where p.slug = p_program_slug
  order by m.sort_order;
$$;

grant execute on function public.has_module_access(uuid)  to authenticated;
grant execute on function public.has_program_access(uuid) to authenticated;
grant execute on function public.my_module_access(text)   to authenticated;
