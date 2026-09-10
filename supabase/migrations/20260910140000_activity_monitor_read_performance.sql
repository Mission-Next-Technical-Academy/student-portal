-- Mission Next Technical Academy — Activity Monitor bounded-read support.
--
-- Written-only migration. Apply through the normal reviewed Supabase
-- migration process; this repository change does not modify a live database.
-- The monitor requests recent sessions globally by started_at, so the older
-- (user_id, started_at) index cannot support its filter/order efficiently.

create index if not exists site_sessions_started_at_desc_idx
  on public.site_sessions (started_at desc);

-- The Activity Monitor's completion-review snapshot filters by state and
-- completed_at. A partial index avoids indexing incomplete module rows.
create index if not exists module_progress_complete_completed_at_desc_idx
  on public.module_progress (completed_at desc)
  where state = 'complete';
