// supabase/functions/check-login-ueba/index.ts
//
// UEBA-lite habitual-IP arbitration for students (SESSION_SECURITY_
// SPEC.md, Decision 4). Called once, immediately after portal/app.js's
// recordLoginEvent() inserts a new public.login_events row, and BEFORE
// recordSiteSessionStart()'s insert (unlike check-login-geofence, which
// runs after — see Decision 3 for why the ordering matters: this function
// may close an already-open site_sessions row so the concurrency trigger,
// 20260906120000_site_session_concurrency_cap.sql, doesn't wrongly reject
// the new insert, and it needs to decide before any new row exists).
//
// Why this exists on top of Decision 1's flat cap: a flat "student = 1
// concurrent session" rule treats every second-login attempt identically,
// whether it's an attacker with stolen credentials or the same student
// switching from their phone to their laptop on the same home network.
// This function adds a cheap, deliberately non-ML signal — simple per-IP
// login counts in public.user_ip_history — to arbitrate that case instead
// of always refusing outright. Tuned conservatively per the spec: a false
// lockout costs a student one retry message; a false allow costs an
// account compromise, so ties go to blocking.
//
// Why this is a SEPARATE function from check-login-geofence and
// record-login-geo: each of the three has exactly one job (enrich-never-
// block / decide-then-revoke-after-auth / decide-before-the-session-
// insert-even-exists). Same duplication-is-fine posture as check-login-
// geofence's own header comment — do not merge these.
//
// Fail open, never fail closed, for anything that is NOT one of the two
// deliberate block outcomes below: a DB error reading history, a missing
// client IP, an admin caller, no open session, a same-IP re-login, etc.
// must all resolve to action: 'allow'. A DB hiccup must never lock a
// student out — only an explicit, successful arbitration against
// user_ip_history blocks a login.
//
// Deploy (site owner only, not run by this pass):
//   supabase secrets set IP_HASH_PEPPER=<long random value>   (once, shared with check-login-geofence)
//   supabase functions deploy check-login-ueba
// Beyond what Supabase auto-injects (SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY), IP_HASH_PEPPER must be set explicitly — see
// this file's own IP_HASH_PEPPER comment below. No external API call in
// this function otherwise (pure IP-hash comparison against
// user_ip_history, not geolocation — no ip-api.com dependency).
//
// esm.sh import pinned to major version 2, matching every other Edge
// Function in this repo (admin-provision, record-login-geo,
// check-login-geofence) and the v2 client library used in
// portal/supabase-config.js.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Site owner: no raw IP persisted anywhere, even admin-read-only. Every
// value that reaches user_ip_history or site_sessions.ip_hash is
// HMAC-SHA256(IP_HASH_PEPPER, real IP) instead of the IP itself — a
// deterministic hash still lets every comparison in this function work as
// plain equality (same IP -> same hash, every time), but nobody who can
// read those tables, including an admin, can invert it back to an actual
// IP without this pepper, which lives only here and in check-login-
// geofence's identical copy of this function (never in the database, never
// client-visible). Must be set once via
// `supabase secrets set IP_HASH_PEPPER=<long random value>` before this
// function is deployed — deliberately NOT auto-injected like SUPABASE_URL/
// the two Supabase keys, so it never accidentally ships without a real
// secret behind it.
const IP_HASH_PEPPER = Deno.env.get('IP_HASH_PEPPER')!;

async function hashIp(ip: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(IP_HASH_PEPPER),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

type Action = 'allow' | 'favor_new' | 'block' | 'block_suspicious';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// x-forwarded-for can carry a comma-separated chain (client, then each proxy
// hop) — the first entry is the original client IP. Supabase's edge network
// sets this; there is no client-controllable way to spoof what value
// Supabase itself writes into it. Identical to record-login-geo's and
// check-login-geofence's own extractClientIp().
function extractClientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (!forwarded) return null;
  const first = forwarded.split(',')[0].trim();
  return first || null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Same JWT-verification idiom as record-login-geo/check-login-geofence:
    // the only trustworthy identity signal is what the caller's own JWT
    // proves, never a client-supplied field.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '');
    if (!bearerToken) {
      return jsonResponse({ error: 'Missing bearer token' }, 401);
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser(bearerToken);

    if (userError || !user) {
      return jsonResponse({ error: 'Invalid or expired session' }, 401);
    }

    const verifiedUserId = user.id;

    let body: Record<string, unknown> | null;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
    }

    const loginEventId = body && body.login_event_id;
    if (typeof loginEventId !== 'string' || loginEventId.length === 0) {
      return jsonResponse({ error: 'Missing or invalid "login_event_id" field' }, 400);
    }

    // Service-role client for every DB read/write below: user_ip_history has
    // no authenticated grant at all (revoke all on ... from anon,
    // authenticated — 20260906122000_user_ip_history_ueba.sql), and the
    // login_events PATCH below needs to bypass its append-only-to-clients
    // posture the same way record-login-geo's own PATCH does. Every write
    // is scoped by an explicit WHERE (user_id/id match), same "the WHERE
    // clause is the real protection" discipline as record-login-geo and
    // check-login-geofence.
    const serviceClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Atomic insert-or-increment via the public.bump_user_ip_history()
    // helper (20260906122000_user_ip_history_ueba.sql) — a plain
    // supabase-js .upsert() can only set conflicting columns to fixed
    // values, which would reset login_count to 1 on every repeat login
    // instead of growing it, so the increment lives in a security-definer
    // SQL function instead. Best-effort: a failed bump must not change the
    // decision already made for this request.
    async function upsertIpHistory(ipHash: string): Promise<void> {
      const { error } = await serviceClient.rpc('bump_user_ip_history', {
        p_user_id: verifiedUserId,
        p_ip_hash: ipHash,
      });
      if (error) {
        console.error('check-login-ueba: bump_user_ip_history failed', error.message);
      }
    }

    // Fail open if there's no client IP to arbitrate on at all — nothing to
    // compare, and the sign-in itself has already succeeded upstream.
    const clientIp = extractClientIp(req);
    if (!clientIp) {
      return jsonResponse({ ok: true, action: 'allow' as Action, skipped: 'no client ip available' }, 200);
    }

    // Hash immediately — the raw clientIp value is never read again past
    // this line, and never passed to the database or logged.
    const clientIpHash = await hashIp(clientIp);

    // Admin-skip: Decision 1's flat cap of 4 is all admins get; this
    // arbitration is student-only. Determine role via the caller's own
    // students row (RLS's students_self_read policy already lets a caller
    // read their own row, so the anon-keyed callerClient is sufficient here
    // — no need for the service-role client to check this). Fail open to
    // "student path" (the safer, stricter branch) if this lookup itself
    // errors, rather than accidentally admin-skipping a real student.
    const { data: studentRow, error: studentError } = await callerClient
      .from('students')
      .select('track_code')
      .eq('user_id', verifiedUserId)
      .maybeSingle();

    if (studentError) {
      console.error('check-login-ueba: students lookup failed', studentError.message);
    }

    const isAdminCaller = !studentError && studentRow?.track_code === 'ADMIN';

    if (isAdminCaller) {
      // Admins always allow through this decision — upsert history (so an
      // admin's own IP familiarity stays tracked, harmless either way) and
      // return immediately without any open-session arbitration.
      await upsertIpHistory(clientIpHash);
      return jsonResponse({ ok: true, action: 'allow' as Action }, 200);
    }

    // Is there already an open session for this student?
    const { data: openSessions, error: openError } = await serviceClient
      .from('site_sessions')
      .select('id, ip_hash')
      .eq('user_id', verifiedUserId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1);

    if (openError) {
      // Fail open: an infrastructure hiccup reading site_sessions must not
      // block a login. Still bump history so a legitimate login isn't lost
      // from the record.
      console.error('check-login-ueba: open-session lookup failed', openError.message);
      await upsertIpHistory(clientIpHash);
      return jsonResponse({ ok: true, action: 'allow' as Action }, 200);
    }

    const open = openSessions && openSessions.length > 0 ? openSessions[0] : null;

    if (!open) {
      // No open session → nothing to arbitrate.
      await upsertIpHistory(clientIpHash);
      return jsonResponse({ ok: true, action: 'allow' as Action }, 200);
    }

    if (open.ip_hash && open.ip_hash === clientIpHash) {
      // Same IP (by hash) as the already-open session — not actually a
      // second location (e.g. a second tab that, for whatever reason, went
      // through a real signIn() instead of a session restore).
      await upsertIpHistory(clientIpHash);
      return jsonResponse({ ok: true, action: 'allow' as Action }, 200);
    }

    // Different (or unknown) IP than the open session. Look up each side's
    // login_count in user_ip_history by hash — 0 if no row.
    const { data: historyRows, error: historyError } = await serviceClient
      .from('user_ip_history')
      .select('ip_hash, login_count')
      .eq('user_id', verifiedUserId)
      .in(
        'ip_hash',
        open.ip_hash ? [clientIpHash, open.ip_hash] : [clientIpHash],
      );

    if (historyError) {
      // Fail open: can't arbitrate without history, so don't block.
      console.error('check-login-ueba: user_ip_history lookup failed', historyError.message);
      await upsertIpHistory(clientIpHash);
      return jsonResponse({ ok: true, action: 'allow' as Action }, 200);
    }

    const newIpCount =
      historyRows?.find((r) => r.ip_hash === clientIpHash)?.login_count ?? 0;
    // An unknown/null old IP hash (pre-feature row, or never tracked) is
    // treated as undefeatable — never "beat this" — so a stale untracked
    // session can't be trivially superseded. Encoded here as +Infinity
    // rather than 0 so the favor_new comparison below can never satisfy
    // new_ip_count > old_ip_count for an unknown old hash.
    const oldIpCount = open.ip_hash
      ? (historyRows?.find((r) => r.ip_hash === open.ip_hash)?.login_count ?? 0)
      : Number.POSITIVE_INFINITY;

    if (newIpCount > oldIpCount && newIpCount >= 2) {
      // Favor the new IP: it has a real track record (not just one lucky
      // prior login) that beats the currently-open IP's own track record.
      // Close the old row so the concurrency trigger sees zero open rows
      // for this student when the client's own site_sessions insert
      // follows (Decision 1 interaction, see SESSION_SECURITY_SPEC.md).
      const { error: closeError } = await serviceClient
        .from('site_sessions')
        .update({ ended_at: new Date().toISOString(), ended_reason: 'superseded' })
        .eq('id', open.id);
      if (closeError) {
        console.error('check-login-ueba: failed to close superseded session', closeError.message);
      }
      await upsertIpHistory(clientIpHash);
      return jsonResponse({ ok: true, action: 'favor_new' as Action }, 200);
    }

    // Both remaining outcomes are a real block, not just a UI courtesy: the
    // sign-in already succeeded upstream (signInWithPassword() handed the
    // caller a live session before this function ever ran), so "block" must
    // revoke that session server-side the same way check-login-geofence
    // does — otherwise a credential-stuffing attempt with valid stolen
    // credentials keeps a working JWT regardless of what our own site_
    // sessions bookkeeping or the client's own signOut() call do. Same
    // auth.admin.signOut(bearerToken, 'global') call, same accepted "blocks
    // next refresh, not an already-held access token" caveat — see check-
    // login-geofence's own comment for the full "why not a raw DELETE"
    // reasoning; identical here.
    const { error: signOutError } = await serviceClient.auth.admin.signOut(bearerToken, 'global');
    if (signOutError) {
      console.error('check-login-ueba: auth admin signOut failed', signOutError.message);
    }

    if (newIpCount === 0) {
      // This exact IP has never once been associated with this account
      // while another session is open — block and flag. Deliberately does
      // NOT touch user_ip_history (anti-gaming: a blocked attempt earns no
      // familiarity, so trying the same brand-new IP twice in a row must
      // still read as zero-history the second time).
      const { error: flagError } = await serviceClient
        .from('login_events')
        .update({ flagged_suspicious: true, flag_reason: 'new_ip_with_active_session' })
        .eq('id', loginEventId)
        .eq('user_id', verifiedUserId);
      if (flagError) {
        console.error('check-login-ueba: failed to flag login_events row', flagError.message);
      }
      return jsonResponse({ ok: true, action: 'block_suspicious' as Action }, 200);
    }

    // Anything else: the new IP has some history but didn't clear the
    // favor_new bar. Plain block — no flag, no history change.
    return jsonResponse({ ok: true, action: 'block' as Action }, 200);
  } catch (err) {
    // Same catch-all discipline as record-login-geo/check-login-geofence:
    // never let a raw stack trace or an error carrying the service-role key
    // reach the client. Log server-side only. Note this is a genuine 500 —
    // per the spec, only the actual decision paths above return 200; an
    // unexpected exception this far out is treated as an auth/malformed-
    // request-class failure, not a policy decision. The client's own
    // checkLoginUeba() caller (Decision 3) treats any non-2xx/parse failure
    // as 'allow', so this still fails open end-to-end.
    console.error(
      'check-login-ueba unexpected error:',
      err instanceof Error ? err.message : String(err),
    );
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
