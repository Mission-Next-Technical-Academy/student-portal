# Student Activity Monitor — live debugging record

Date: 2026-09-10

## Observed behaviour

The admin Activity Monitor initially loaded for an extended time. After the
first resilience changes, it rendered `0 sign-ins total` even though activity
history exists in the linked Supabase database.

## Confirmed database facts

Read-only checks against the linked database found:

| Table | Total rows | Oldest | Newest |
| --- | ---: | --- | --- |
| `login_events` | 164 | 2026-09-01 09:44 UTC | 2026-09-10 12:20 UTC |
| `site_sessions` | 126 | 2026-09-01 17:32 UTC | 2026-09-10 12:20 UTC |
| `module_progress` | 41 | 2026-08-29 09:50 UTC | 2026-09-03 18:43 UTC |

There are 93 `login_events` within the most recent 72-hour window. A
transactional RLS simulation using the one database admin account returned
`is_admin() = true`, 93 visible login events, and 59 visible site sessions.
The data therefore exists and is visible through the intended database
policy when the correct authenticated admin identity is present.

## Changes published

Commits published to `master`:

- `68fe979` — bounded Activity Monitor reads, timeout/error state, index
  migration, and eliminated the duplicate roster fetch after the lazy tab
  load.
- `d995d11` — changed the portal JavaScript cache key.
- `5e964e7` — removed the browser-generated date cutoff, which could hide
  valid events if a browser clock is skewed; the monitor now requests the
  latest 250 records directly.

The monitor is bounded to 250 recent rows and displays an error after 12
seconds rather than waiting indefinitely. The current screen still showed
zero rows after the above deployment, so the remaining issue is not missing
database history.

## Database migration status

`supabase/migrations/20260910140000_activity_monitor_read_performance.sql`
adds indexes for global recent-session ordering and completed-module ordering.
It is committed but not applied. The normal `supabase db push` path would
also apply the unrelated pending `20260909100000_query_performance_telemetry`
migration, so it was not used for this focused remediation.

## Next diagnostic step

Capture the browser Network response for the Activity Monitor's `login_events`
request while signed in as the admin. It should establish whether the browser
is sending the expected authenticated session to the same Supabase project,
or whether the REST response is empty despite the successful database-side
admin-policy simulation. Do not change the database until that response is
captured.

## Resolved (2026-09-10, later same day) — root cause found and fixed live

Captured that diagnostic step in Chrome (signed in as `7355312413-ADMIN`,
`127.0.0.1:8768/#/admin`): the `login_events`, `admin_site_sessions`,
`module_progress`, and `admin_student_activity` requests all returned
**HTTP 200 with real rows** (166 `login_events` rows) — so the network layer,
auth, and RLS were never the problem, ruling out the concern this doc opened
with. Confirmed `adminLazyTabData.activity.loginEvents` held all 166 rows in
the page's own JS state, yet the DOM kept showing "0 sign-ins total." That
split (state populated, DOM frozen) pointed at the render path, not the data
fetch.

Calling `render({ reuseAdminRoster: true })` directly from the console
reproduced a thrown, uncaught exception: `cheatingFlagsByUserId.has is not a
function`, inside `viewAdmin()`. Root cause in `portal/app.js`:
`loadAdminLazyTab('activity')` (line ~6014) returned a key named
`cheatingFlagsByUserId: completed.data` — a plain array, and a stray
duplicate of the same object's own `completedRows` field. `applyAdminLazyData()`
merges that return value into the `extra` object with `Object.assign`,
which clobbered the real `Map` that `render()` had just built via
`buildCheatingReviewFlags()` a few lines earlier. `viewAdmin()` then called
`.has()` on that array and threw — before `app.innerHTML` was ever
reassigned, so the tab's *previous* render (from before the Activity data
existed, when the panel legitimately showed 0 rows) stayed on screen
indefinitely, with no visible error and no console message the admin would
notice.

This wasn't scoped to the Activity Monitor tab alone: once
`adminLazyTabData.activity` was populated, *every* subsequent `render()` call
for `#/admin` hit the same clobbered value and threw — confirmed live by
opening Cohorts right after Activity Monitor and getting a real, populated
table with no console errors only after the fix. Before the fix this same
click would have been silently broken too.

**Fix:** removed the bogus `cheatingFlagsByUserId` key from
`loadAdminLazyTab`'s activity-tab return object (`portal/app.js`) — nothing
else read it; `completedRows` already carries the same array under its
correct name. Bumped `app.js`'s cache-busting query string in
`portal/index.html`. Verified live in Chrome: Activity Monitor renders "166
sign-ins total" with real rows (student ID, track, location, signed
in/out, site time), and Cohorts still renders correctly afterward. Console
clean on both. **Not yet committed.**
