# Concurrent session cap + login geofencing

## UAT finding + fix (2026-09-06, after initial deploy)

Browser UAT of a real login (`8987495051-SOCAN` at `127.0.0.1:8768/#/login`)
found that `recordSiteSessionStart()`'s insert was silently failing on every
real sign-in since this spec's migrations went live: `site_sessions` never
had a self-select RLS policy (only `site_sessions_admin_read`, admin-only),
and Postgres checks an INSERT's `RETURNING` list against the table's SELECT
policies — so the `.select('id').single()` this spec's Decision 3 added
caused every insert to roll back with `42501 new row violates row-level
security policy`. Confirmed live in a rolled-back transaction, with and
without the fix. Practical effect: **login kept working (accidental fail-open,
not the designed one), but the concurrency cap, `checkLoginGeofence()`
(it never received a site_session id to call with), and the Activity
Monitor's site-time/signed-out columns were all silently inert** for every
real sign-in during that window — the trigger, the Edge Function, and their
own isolated SQL logic were each individually correct in testing, but never
actually exercised end-to-end until this UAT pass.

Fixed by `supabase/migrations/20260906130000_site_sessions_self_select.sql`
(adds `site_sessions_self_select`, `user_id = auth.uid()` — the student can
now read back their own rows, same posture as the existing self-update
policy). Verified in a rolled-back transaction: with the policy present, the
insert-then-select round-trip succeeds.

Same session, separate site-owner call: the student cap in Decision 1 below
was raised from 1 to 2 (`20260906140000_student_session_cap_two.sql`) — a
real student legitimately switches between two of their own devices, and a
flat cap of 1 blocked that along with the sharing risk it was meant to
close off. Decision 1's text below already reflects 2, not the original 1.

Both migrations tested together in a rolled-back transaction against the
linked project: self-select lets a student open 2 concurrent sessions, a 3rd
is refused with `MNT_SESSION_LIMIT_REACHED: ... max 2`. **Not yet pushed** —
needs `supabase db push` before either fix is live.

## Why

Site owner (Alex) asked, while reviewing the admin panel's credential-viewing
architecture (see `HANDOFF_ADMIN_CREDENTIALS_VIEW.md` for that unrelated
check): do we cap concurrent sessions per account, and do we block sign-ins
geolocated to a short list of countries. Answer at time of writing: neither
exists. `site_sessions` (`20260901122000_activity_monitor_sessions.sql`) and
its idle-timeout backstop (`20260901150000_...`) only ever *close* a session
after the fact (idle, manual sign-out, admin force). Nothing today counts how
many sessions a user has open, and `record-login-geo`
(`20260901130000_login_event_geo.sql`) captures IP-based geography for
**display only** — its own column comment says "never used to block a
login." This spec changes that, deliberately, for both of the site owner's
asks.

## Decision 1 — concurrent session cap

**Rule:** the cap depends on role, keyed off `site_sessions.track_code`
(already `'ADMIN'` for an admin row, one of `SOCAN`/`HDESK`/`AIENG`/`ELECT`
for a student — see `20260901122000_activity_monitor_sessions.sql:34`):

- **Admin (`track_code = 'ADMIN'`): max 4** open sessions. Site owner: there
  are 4 admin accounts, and they need to be able to check work, code, and
  commit at the same time without tripping the cap — 4 covers "everyone
  signed in at once," not a placeholder headroom number.
- **Student (any other `track_code`, including `null`): max 2** open
  sessions (raised from 1, 2026-09-06, `20260906140000_student_session_cap_
  two.sql`). Site-owner call: a real student legitimately switches between
  two of their own devices (phone + laptop); a flat cap of 1 locked that out
  along with the credential-sharing/concurrent-cheating risk it was meant to
  close off. Two still closes off unbounded sharing cheaply while allowing
  the one real multi-device case.

A sign-in past the cap is refused outright ("lockout"), not silently
evicting an older session — an admin investigating a compromised account
needs old sessions to stay visible/revocable, not auto-closed by a new one
showing up. This also means a student who leaves a tab open elsewhere and
tries to sign in from a second device is locked out until the first is
closed — that is the intended behavior, not a bug to soften.

**Why a DB trigger, not a client-side count-then-insert:** the client
(`portal/app.js`) already holds `INSERT` on `site_sessions` for its own rows
(`site_sessions_self_insert` policy, `20260901122000_...`). A client-side
"count my open rows, then insert if under 3" check is a TOCTOU race and is
trivially bypassable by anyone calling `supabase-js` directly. The cap must
be enforced inside the database, on the same INSERT the client already makes
— a `BEFORE INSERT` trigger, not a new RPC the client has to remember to
call instead of the plain insert.

**What does NOT change:** a student refreshing the page or opening a second
*tab* of an already-signed-in session never calls `signIn()` again — no new
`site_sessions` row, so no cap check fires (matches the existing "one row per
real signIn() call" semantics documented at `portal/app.js:196-203`). The cap
is about distinct sign-in events with sessions still open (devices/browsers),
not tabs within one.

### Implementation — new migration, e.g. `supabase/migrations/20260906120000_site_session_concurrency_cap.sql`

```sql
create or replace function public.enforce_site_session_concurrency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_open_count integer;
  v_max_sessions integer;
begin
  -- Admins get headroom for a few real devices; students are capped at a
  -- single concurrent session (site-owner call — see this migration's own
  -- header comment for why students are deliberately stricter).
  v_max_sessions := case when new.track_code = 'ADMIN' then 4 else 2 end;

  select count(*) into v_open_count
  from public.site_sessions
  where user_id = new.user_id and ended_at is null;

  if v_open_count >= v_max_sessions then
    raise exception 'MNT_SESSION_LIMIT_REACHED: user % already has % open session(s), max %',
      new.user_id, v_open_count, v_max_sessions;
  end if;

  return new;
end;
$$;

create trigger site_sessions_concurrency_cap
  before insert on public.site_sessions
  for each row execute function public.enforce_site_session_concurrency();
```

- `security definer` so the count query is not itself blocked by
  `site_sessions_admin_read`/self-row RLS (a user must be able to see their
  own open-row count even though the self-insert policy only grants INSERT,
  not SELECT, on other people's rows — same reasoning as every other
  `security definer` function in this schema).
- The exception message is prefixed `MNT_SESSION_LIMIT_REACHED:` on purpose
  — that's the literal string the client matches on (see Decision 3) to
  distinguish "you hit the cap" from any other insert failure. Do not reword
  it without updating the client check.
- No RLS/grant changes needed — the trigger fires on the existing
  `site_sessions_self_insert` policy's INSERT path.
- Test in a rolled-back transaction against the linked project before
  pushing (same discipline as `20260901150000_...`'s own testing note), both
  roles: for a throwaway student-track (`SOCAN`, say) `user_id`, insert 2
  open rows, confirm a 3rd raises; for a throwaway `ADMIN`-track `user_id`,
  insert 4 open rows, confirm a 5th raises. For each, confirm closing one
  open row (`ended_at = now()`) lets a new insert through again.

## Decision 2 — login geofencing

**Rule:** block sign-in completion (not the Supabase Auth handshake itself —
see below for why that distinction is unavoidable) when the request's
geolocated country is in a short denylist. Site owner named Russia, China,
Iran as the starting set.

**Why this can only be a post-auth revoke, not a pre-auth block:** the
client calls `mntSupabase.auth.signInWithPassword()` directly against
Supabase's hosted GoTrue service — that request never passes through this
project's own Postgres or Edge Functions, so there is no hook point in this
architecture to inspect the request's IP *before* Supabase Auth issues a
session. This is the same constraint `record-login-geo` already lives with
(its own header comment: enrichment happens "once, fire-and-forget, right
after" the sign-in succeeds). The fix is the same shape already used
elsewhere in this schema for "close it after the fact" cases
(`admin_force_sign_out()`, `close_idle_site_sessions()`): authenticate
first, then immediately geo-check and revoke if blocked. Same accepted
caveat as those two: revoking `auth.sessions` blocks the *next* token
refresh/reload, it does not instantly kill an access token already sitting
in the browser from the last few seconds. Acceptable for this use case —
call this out in the migration/function comments so nobody "fixes" it later
by chasing an unreachable pre-auth block.

**Fail open, never fail closed.** If the geo lookup fails, times out, hits
the free-tier rate limit, or returns an unrecognized/private IP (all things
`record-login-geo`'s own comments document as real, observed failure modes
for this exact provider), the login must proceed normally. A flaky free geo
API must never lock a real student out of the portal — that would be a far
worse outcome than the risk being mitigated. Only an explicit, successful
match against the denylist blocks a login.

**Match on `countryCode` (ISO 3166-1 alpha-2), not the `country` name
string.** ip-api.com returns both; matching `"Russia"`/`"China"`/`"Iran"` as
literal strings is fragile (localization, punctuation, provider changes).
`RU`/`CN`/`IR` is stable.

### Implementation

1. **New Edge Function** `supabase/functions/check-login-geofence/index.ts`,
   structurally mirroring `supabase/functions/record-login-geo/index.ts`
   (same JWT-verification idiom — verify the caller's bearer token via
   `auth.getUser()`, same `extractClientIp()` reading `x-forwarded-for` off
   the request since the client cannot be trusted to self-report an IP, same
   ip-api.com call). It is a **separate** function, not a modification of
   `record-login-geo` — that function's only job stays "enrich, never
   block"; this one's only job is "decide, then revoke if blocked." Keep the
   duplication (a second small `lookupGeo()`); do not refactor
   `record-login-geo` to share code with this pass — it is deployed and
   working, and this task's scope is additive only.

   Request body: `{ site_session_id: string }` (the id of the row
   `recordSiteSessionStart()` just inserted — see Decision 3). Behavior:
   - Verify JWT → `verifiedUserId`, same as `record-login-geo`.
   - Extract client IP; if none available (local dev, no proxy chain),
     return `{ ok: true, blocked: false, skipped: 'no client ip available' }`
     — fail open, exactly like `record-login-geo`'s own "nothing to look
     up" branch.
   - Look up geo via `http://ip-api.com/json/<ip>`; on any failure
     (non-200, `status !== 'success'`, thrown error), log it (never
     silently swallow — this repo already learned that lesson once, see
     `record-login-geo`'s 2026-09-01 correction comment) and return
     `{ ok: true, blocked: false }` — fail open.
   - `const BLOCKED_COUNTRY_CODES = ['RU', 'CN', 'IR'];` If
     `data.countryCode` is in that list:
     - Use a **service-role** client (bypasses RLS, same as
       `record-login-geo` — the WHERE clause below is what actually scopes
       this, per that function's own comment) to:
       - `delete from auth.sessions where user_id = verifiedUserId` — same
         revocation call as `admin_force_sign_out()`
         (`20260901122000_activity_monitor_sessions.sql:112`).
       - `update site_sessions set ended_at = now(), ended_reason =
         'geo_blocked' where id = site_session_id and user_id =
         verifiedUserId` — both conditions required, matching every other
         service-role write in this codebase.
     - Return `{ ok: true, blocked: true, country: data.country,
       country_code: data.countryCode }`.
   - Otherwise return `{ ok: true, blocked: false }`.
   - This is a 200-status response in both the blocked and not-blocked
     case — blocking is a policy decision the function successfully made,
     not a function error. Reserve non-200 for actual failures (bad/missing
     JWT, malformed body), same convention as `record-login-geo`.

2. **New migration** widening `site_sessions.ended_reason`'s CHECK
   constraint to add `'geo_blocked'`, same exact drop/add idiom as
   `20260901140000_site_sessions_idle_timeout.sql`:

   ```sql
   alter table public.site_sessions
     drop constraint site_sessions_ended_reason_check;

   alter table public.site_sessions
     add constraint site_sessions_ended_reason_check
     check (ended_reason in ('user_signed_out', 'idle_timeout', 'admin_forced', 'superseded', 'geo_blocked'));

   comment on column public.site_sessions.ended_reason is
     'user_signed_out: student clicked sign out. idle_timeout: client-side inactivity timer signed them out (portal/app.js wireIdleSignOut()). admin_forced: closed via admin_force_sign_out(). geo_blocked: closed by supabase/functions/check-login-geofence after sign-in completed but the request geolocated to a blocked country. superseded: reserved, not implemented.';
   ```

   This can be the **same migration file** as Decision 1's trigger (both are
   small, both touch `site_sessions`, both ship together) — call it
   `20260906120000_site_session_concurrency_and_geofence.sql` if one agent
   ends up owning both; keep them as two separate `alter`/`create` blocks
   either way so each is independently reviewable.

3. **Admin visibility, free of charge:** a blocked attempt already leaves a
   `site_sessions` row with `ended_reason = 'geo_blocked'` (visible on the
   existing Activity Monitor tab, `admin_site_sessions` view) and the
   matching `login_events` row already gets `geo_country`/`geo_city`
   populated by the existing, unmodified `record-login-geo` call — no new
   table or admin UI needed for this to be auditable.

## Decision 4 — UEBA-lite: habitual-IP arbitration for students

**Why this exists on top of Decision 1:** a flat "student = 1 concurrent
session" cap treats every second-login attempt identically, whether it's an
attacker with stolen credentials or the same student switching from their
phone to their laptop from the same home network. Site owner wants a
cheap, lightweight behavioral signal — not a real ML/UEBA system — layered
on top of the flat cap: **when a student already has an open session and a
new sign-in comes from a different IP, use that student's own IP history to
decide whether the new IP looks like them, looks unknown-but-plausible, or
looks like a location they've never touched before.**

Keep this deliberately small: one table, simple counts, no scoring model,
no ML. The goal is "don't blindly lock out a student switching devices on
their own network" balanced against "don't let a stolen-credential login
from a brand-new location just walk in because a session happens to be
open." Tune conservatively — a false lockout only costs a student one retry
message; a false allow costs an account compromise, so ties go to blocking.

### Amendment (post-implementation, before first push): hash the IP, never store it raw

Site owner, after the first draft of this decision: "I can't have IP
histories in plaintext either... it must be private." Everything below in
this section was written before that call and describes raw `inet` storage
— the code that actually shipped deviates from it in one respect, applied
consistently everywhere `ip_address` appears below:

- `user_ip_history.ip_address inet` → `user_ip_history.ip_hash text`, and
  every other `ip_address inet` column in this decision (`site_sessions.ip_address`
  included) → `ip_hash text`.
- The stored value is `HMAC-SHA256(IP_HASH_PEPPER, real_client_ip)` — hex
  string — computed in the Edge Function, never the raw IP. `IP_HASH_PEPPER`
  is a secret set via `supabase secrets set` (shared identically between
  `check-login-ueba` and `check-login-geofence`, since both must hash the
  same IP to the same value to compare correctly), never stored in the
  database, never client-visible.
- This is a deterministic hash, not encryption: every equality comparison
  in this decision's logic below (`open.ip_address === clientIp`, the
  `user_ip_history` lookups) works exactly the same way on hashes as it did
  on raw IPs — same-IP-in still means same-hash-out, every time. What
  changes is that nobody who can read `user_ip_history` or
  `site_sessions.ip_hash` — including an admin with full table access —
  can invert the hash back to an actual IP without the pepper, and the
  pepper lives only in Edge Function secrets.
- One consequence worth being explicit about: `check-login-ueba` runs
  **before** the new `site_sessions` row exists (Decision 3's ordering), so
  it cannot write `ip_hash` onto a row that doesn't have an id yet. That
  write happens in `check-login-geofence` instead (which does run
  post-insert) — on *every* call, not just the blocked branch, since that's
  the only place in the codebase that ever populates the column. Read
  `ip_address`/`inet` below as `ip_hash`/`text` throughout; the SQL sketch
  was not rewritten line-by-line to avoid drifting further from the code
  that actually shipped (`20260906122000_user_ip_history_ueba.sql`,
  `supabase/functions/check-login-ueba/index.ts`,
  `supabase/functions/check-login-geofence/index.ts` — those files are the
  source of truth for exact syntax; this doc is the record of the decision
  and the reasoning behind it).

### New table — `public.user_ip_history` (superseded by the amendment above — see it for the actual `ip_hash`/`text` shape shipped)

```sql
create table public.user_ip_history (
  user_id      uuid not null references auth.users(id) on delete cascade,
  ip_address   inet not null,
  login_count  integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  primary key (user_id, ip_address)
);

comment on table public.user_ip_history is
  'Lightweight per-user IP familiarity count, written only by supabase/functions/check-login-ueba on a login that was actually allowed through (never on a blocked/flagged attempt — see that function''s header comment for why counting blocked attempts would let an attacker grind their way into looking habitual). Used only to arbitrate a second concurrent student sign-in against an already-open session (Decision 4, SESSION_SECURITY_SPEC.md) — not a general security-analytics table, not exposed to students, admin-read only.';

alter table public.user_ip_history enable row level security;

create policy user_ip_history_admin_read on public.user_ip_history
  for select using (public.is_admin());

revoke all on public.user_ip_history from anon, authenticated;
grant all on public.user_ip_history to service_role;
```

No client-writable path at all — every row is written by the Edge Function
below via its service-role client, same posture as `public.student_credentials`.

### Two small additions to existing tables

- `site_sessions.ip_address inet` (nullable) — the real IP the session was
  opened from, written by `check-login-ueba` (this decision) when it runs,
  and re-confirmed by `check-login-geofence` (Decision 2) once the row
  exists. A pre-this-feature row has `ip_address is null`; treat that as
  "unknown," never as "matches nothing" or "matches everything" — see the
  function logic below.
- `login_events.flagged_suspicious boolean not null default false` and
  `login_events.flag_reason text` — admin-visible-only columns (no new RLS
  needed beyond what `login_events` already restricts to admins/self) so a
  flagged attempt shows up on the existing Activity Monitor without a new
  table or view. Never surfaced to the student themselves, and never named
  in any student-facing error text (Decision 3) — telling an attacker their
  attempt was specifically flagged, versus just "blocked," is free
  intelligence you don't need to hand them.

### New Edge Function — `supabase/functions/check-login-ueba/index.ts`

Same JWT-verification and service-role idioms as `record-login-geo` and
`check-login-geofence`. Called **before** `recordSiteSessionStart()`'s
insert (unlike geofencing, which runs after) — see Decision 3 for why the
ordering matters. Request body: `{ login_event_id }` (so it can patch the
flag columns onto the row `recordLoginEvent()` just inserted). No
`site_session_id` yet — none exists at this point.

1. Verify JWT → `verifiedUserId`. Extract real client IP the same way as
   the other two functions (`x-forwarded-for`, never client-supplied).
2. `select id, ip_address from site_sessions where user_id = verifiedUserId and ended_at is null` —
   is there already an open session for this student? (Skip this whole
   decision for an `ADMIN`-track caller — Decision 1's flat cap of 4 is all
   admins get; this arbitration is student-only. Determine role the same
   way `is_admin()` does, or just check the caller's own `students.track_code`.)
3. **No open session** → nothing to arbitrate. Upsert
   `user_ip_history` for `(verifiedUserId, clientIp)` (insert with
   `login_count = 1`, or on conflict `login_count = login_count + 1,
   last_seen_at = now()`), return `{ ok: true, action: 'allow' }`.
4. **Open session exists, from the same IP** (`open.ip_address = clientIp`,
   both non-null) → not actually a second location, `action: 'allow'`
   (still bump history). This covers a second tab opened on the same
   machine/network that, for whatever reason, still went through a real
   `signIn()` instead of a session restore.
5. **Open session exists, from a different (or unknown) IP:**
   - Look up `login_count` for `(verifiedUserId, clientIp)` in
     `user_ip_history` — call it `new_ip_count` (0 if no row).
   - Look up `login_count` for `(verifiedUserId, open.ip_address)` — call it
     `old_ip_count` (0 if `open.ip_address is null`, i.e. unknown/pre-feature
     row — **never treat unknown as "beat this," always treat it as
     undefeatable**, so an old untracked session can't be trivially
     superseded).
   - **`new_ip_count > old_ip_count` AND `new_ip_count >= 2`** (the new IP
     must have a real track record, not just one lucky prior login) →
     **favor the new IP.** Close the old row:
     `update site_sessions set ended_at = now(), ended_reason = 'superseded' where id = open.id`.
     Upsert history for the new IP. Return `{ ok: true, action: 'favor_new' }`.
   - **`new_ip_count = 0`** (this exact IP has never once been associated
     with this account) → **block and flag.** Do NOT touch `user_ip_history`
     (anti-gaming rule — a blocked attempt earns no familiarity). Patch the
     `login_events` row: `flagged_suspicious = true, flag_reason = 'new_ip_with_active_session'`.
     Return `{ ok: true, action: 'block_suspicious' }`.
   - **Anything else** (new IP has *some* history but didn't clear the bar
     above) → **plain block**, no flag, no history change. Return
     `{ ok: true, action: 'block' }`.
6. Same fail-open discipline as the other two functions for anything that
   isn't the actual decision: a DB error reading history, a missing IP,
   etc. must resolve to `{ ok: true, action: 'allow' }` rather than locking
   a student out over an infrastructure hiccup — the one exception being
   the two deliberate block outcomes above, which are policy decisions, not
   failures.

### Interaction with Decision 1's trigger

`favor_new` closes the old row *before* the client's `site_sessions` insert
happens, so the cap-of-1 trigger sees zero open rows for that student at
insert time and the new row is admitted normally — no trigger change
needed. `block`/`block_suspicious` never reach the insert at all (Decision
3 short-circuits `signIn()` there), so the trigger never even fires for
those cases.

## Decision 3 — client wiring (`portal/app.js`)

Both features gate on the same choke point: `signIn()` (`portal/app.js:133`)
and its caller `wireLogin()` (`portal/app.js:5004`). This piece is NOT
delegated to the backend agents — it is the integration layer that has to
reconcile both features without a merge conflict, so it is written once,
by hand, after both migrations/functions above exist.

Current `signIn()` fires `recordLoginEvent()` and `recordSiteSessionStart()`
fire-and-forget and always returns `user` once
`signInWithPassword()` succeeds (`portal/app.js:133-145`). New shape:

```js
async function signIn(identifier, password) {
  const email = identifier.includes('@')
    ? identifier.trim().toLowerCase()
    : loginIdToEmail(identifier);
  const { data, error } = await mntSupabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) return null;
  _cachedUser = null;
  _cachedUserPromise = null;
  const user = await currentUser();

  const loginEventId = await recordLoginEvent(user); // now awaited (need the id); geo enrichment inside stays fire-and-forget

  if (loginEventId) {
    const ueba = await checkLoginUeba(loginEventId); // student-only inside the function; always 'allow' for admins/failures
    if (ueba === 'block' || ueba === 'block_suspicious') {
      await mntSupabase.auth.signOut();
      return 'session_limit'; // deliberately the SAME sentinel/message as a plain cap hit — never tip off which case fired
    }
  }

  const siteSessionId = await recordSiteSessionStart(user);
  if (siteSessionId === 'session_limit') {
    await mntSupabase.auth.signOut();
    return 'session_limit';
  }
  if (!siteSessionId) return user; // insert failed for some other reason — don't block login over a logging table

  const geoResult = await checkLoginGeofence(siteSessionId);
  if (geoResult === 'geo_blocked') {
    await mntSupabase.auth.signOut();
    return 'geo_blocked';
  }

  return user;
}
```

Ordering is deliberate and not interchangeable: `checkLoginUeba()` must run
**before** `recordSiteSessionStart()`'s insert (it may close an old row so
the insert isn't wrongly rejected by Decision 1's trigger, and it needs to
decide before any new row exists), while `checkLoginGeofence()` must run
**after** it (it patches/revokes based on the row's own id). Do not reorder
these while "simplifying."

- `recordLoginEvent()` (`portal/app.js:154`) changes from fire-and-forget to
  `async`, returning the inserted row's `id` (or `null` on failure) instead
  of nothing — its internal `recordLoginGeo(data.id)` call stays exactly as
  fire-and-forget as it is today, only the outer function now hands its id
  back to the caller.
- New `checkLoginUeba(loginEventId)` function, same
  `auth.getSession()` → bearer token → `fetch(.../functions/v1/check-login-ueba, ...)`
  shape as the other two Edge Function callers, **awaited**, returning the
  response body's `action` field (`'allow' | 'favor_new' | 'block' |
  'block_suspicious'`), or `'allow'` on any network/parse failure (fail
  open, matching the Edge Function's own fail-open discipline).
- `recordSiteSessionStart()` (`portal/app.js:204`) changes from
  fire-and-forget to `async`, returning the new row's `id` on success, the
  literal string `'session_limit'` when the insert error's `.message`
  contains `'MNT_SESSION_LIMIT_REACHED'`, or `null` on any other error (so a
  transient DB hiccup degrades to "not gated by geofence" rather than
  blocking login — matches this file's existing philosophy that a logging
  table's failure must never break the golden path).
- New `checkLoginGeofence(siteSessionId)` function, modeled directly on the
  existing `recordLoginGeo()` (`portal/app.js:176-194`) — same
  `auth.getSession()` → bearer token → `fetch(.../functions/v1/check-login-geofence, ...)`
  shape — but **awaited** and returning `'geo_blocked'` when the JSON body
  says `blocked: true`, otherwise `null`. Any network/parse failure also
  resolves to `null` (fail open, per Decision 2).
- `wireLogin()` (`portal/app.js:5004`) currently does `if (user) { ... }
  else { show #login-error }`. Change the `else` branch to check which
  sentinel came back and show a distinct message for each case — reuse the
  existing `#login-error` element with distinct text contents rather than
  adding new DOM. The session-limit message must not hardcode a number, since
  the cap differs by role and the two roles must not silently drift out of
  sync with two independent hardcoded strings (the exact trap this repo's
  own `MNT_IDLE_TIMEOUT_MS` comment already warns about elsewhere):
  - `result === 'session_limit'` → "Maximum active sessions reached for this account. Sign out on another device or tab, then try again."
  - `result === 'geo_blocked'` → "Sign-in is not available from your current location."
  - anything else falsy → existing generic "invalid credentials" text.

## Acceptance checks

- A student account (any non-`ADMIN` `track_code`) with 2 already-open
  `site_sessions` rows is refused on a 3rd sign-in attempt **from a different,
  non-habitual IP**; `wireLogin()` shows the session-limit message; no new
  `auth.sessions` row survives (the just-issued one was signed back out);
  the account's 2 existing sessions are untouched.
- A student with 1 open session signs in again from the **same** IP (e.g. a
  second tab that, for some reason, calls `signIn()` again instead of
  restoring) — this is allowed, not blocked (Decision 4 step 4), and now sits
  at 2 open sessions under the cap.
- A student's open session was opened from IP A; IP B has more prior
  successful logins than IP A for that student (`user_ip_history.login_count`
  strictly greater, and at least 2). Signing in from IP B is allowed, the
  old session's row ends up with `ended_reason = 'superseded'`, and the new
  session opens normally.
- A student with 2 open sessions tries a sign-in from an IP with **zero**
  prior history on that account: the attempt is refused with the exact same
  message text as a plain cap hit, but the corresponding `login_events` row
  has `flagged_suspicious = true` and `flag_reason = 'new_ip_with_active_session'`
  — confirm the two cases are genuinely indistinguishable to the person
  signing in, only distinguishable in the admin-visible data.
- A blocked or flagged attempt never creates or updates a
  `user_ip_history` row for the attempting IP (anti-gaming check — try the
  same brand-new IP twice in a row; it must still be treated as
  zero-history/flagged the second time, not "seen once now").
- An admin account can hold up to 4 concurrent sessions; a 5th sign-in
  attempt is refused the same way. Verify by opening 4 admin sessions and
  confirming the 5th is blocked, and confirming a 2nd admin session (well
  under the cap) is NOT blocked — the two roles must not share one number.
- Closing one open session (normal sign-out) immediately allows a new
  sign-in for that account, in both roles.
- A sign-in from an ordinary (non-denylisted) IP completes normally with no
  added user-visible delay beyond the existing geo-enrichment round trip.
- Simulating a blocked country (mock the Edge Function's ip-api.com call, or
  temporarily add the tester's own real `countryCode` to
  `BLOCKED_COUNTRY_CODES` in a scratch/local test) results in: sign-in
  refused, `wireLogin()` shows the geo-blocked message, the `site_sessions`
  row for that attempt shows `ended_reason = 'geo_blocked'`, and
  `auth.sessions` has no live row for that user afterward.
- Killing network access to ip-api.com (or the function itself erroring)
  must NOT block sign-in — confirm the fail-open path.
- `node --check portal/app.js` clean after the edits.

## Division of work

- **Agent A (backend — concurrency):** write and locally-verify (rolled-back
  transaction against the linked project) the trigger migration from
  Decision 1 only. Do not touch `portal/app.js` or the geofence function.
- **Agent B (backend — geofencing):** write `check-login-geofence` and the
  `ended_reason` constraint migration from Decision 2 only. Do not touch
  `portal/app.js` or the concurrency trigger. Do not deploy the function
  (`supabase functions deploy`) — flag it ready for deploy in your report,
  matching this repo's existing convention that Edge Function deploys are a
  site-owner/reviewed step, not an unattended one.
- **Agent C (backend — UEBA):** write `user_ip_history`, the
  `site_sessions.ip_address` and `login_events.flagged_suspicious`/
  `flag_reason` column additions, and `check-login-ueba` from Decision 4
  only. Do not touch `portal/app.js`, the concurrency trigger migration, or
  `check-login-geofence` (only read them for context/id conventions). Do
  not deploy or push.
- **Orchestrator (Claude, this session):** Decision 3's `portal/app.js`
  wiring, end-to-end verification, `supabase db push`, function deploy, and
  the `NEXT_SESSION.md` handoff entry.
