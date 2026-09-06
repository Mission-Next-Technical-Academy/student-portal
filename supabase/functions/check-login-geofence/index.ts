// supabase/functions/check-login-geofence/index.ts
//
// Login geofencing (SESSION_SECURITY_SPEC.md, Decision 2). Called once,
// immediately after portal/app.js's recordSiteSessionStart() inserts a new
// public.site_sessions row for a sign-in that just succeeded. Decides
// whether the request's geolocated country is on a short denylist, and if
// so revokes the session that was just issued.
//
// Why this is a POST-AUTH revoke, not a pre-auth block: the client calls
// mntSupabase.auth.signInWithPassword() directly against Supabase's hosted
// GoTrue service — that request never passes through this project's own
// Postgres or Edge Functions, so there is no hook point in this
// architecture to inspect the request's IP before Supabase Auth issues a
// session. Same constraint record-login-geo already lives with (see that
// function's own header comment). The fix is the same shape already used
// elsewhere in this schema for "close it after the fact" cases
// (admin_force_sign_out(), close_idle_site_sessions()): authenticate first,
// then immediately geo-check and revoke if blocked. Accepted caveat, same
// as those two: revoking auth.sessions blocks the *next* token
// refresh/reload, it does not instantly kill an access token already
// sitting in the browser from the last few seconds. That is acceptable for
// this use case — do not "fix" it later by chasing an unreachable pre-auth
// block; there isn't one in this architecture.
//
// Why this is a SEPARATE function from record-login-geo, not a modification
// of it: record-login-geo's only job stays "enrich, never block" — it is
// deployed and working. This function's only job is "decide, then revoke if
// blocked." The duplication of a second small lookupGeo() is intentional;
// do not refactor record-login-geo to share code with this pass.
//
// Fail open, never fail closed: if the client IP is unavailable, the geo
// lookup fails/times out/rate-limits, or the response is unrecognized, the
// login must proceed normally. A flaky free geo API must never lock a real
// student out of the portal. Only an explicit, successful match against
// BLOCKED_COUNTRY_CODES blocks a login.
//
// Deploy (site owner only, not run by this pass):
//   supabase secrets set IP_HASH_PEPPER=<long random value>   (once, shared with check-login-ueba)
//   supabase functions deploy check-login-geofence
// Beyond what Supabase auto-injects (SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY), IP_HASH_PEPPER must be set explicitly — see
// this file's own IP_HASH_PEPPER comment below for why. ip-api.com itself
// needs no API key at this project's request volume, same provider as
// record-login-geo.
//
// esm.sh import pinned to major version 2, matching every other Edge
// Function in this repo (admin-provision, record-login-geo) and the v2
// client library used in portal/supabase-config.js.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Same pepper/hash scheme as check-login-ueba (identical copy, not a shared
// import — same "duplication is fine, each function owns its copy" posture
// as this file's own header comment about lookupGeo()). Both functions
// must use the exact same pepper value or their hashes of the same IP
// would silently stop matching each other. Site owner: no raw IP persisted
// anywhere, even admin-read-only — see 20260906122000_user_ip_history_
// ueba.sql and check-login-ueba's own header comment for the full
// reasoning. Must be set via
// `supabase secrets set IP_HASH_PEPPER=<long random value>` before deploy.
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

// Site-owner-named starting set (SESSION_SECURITY_SPEC.md Decision 2):
// Russia, China, Iran. Matched on ISO 3166-1 alpha-2 countryCode, not the
// `country` name string — ip-api.com returns both, but matching
// "Russia"/"China"/"Iran" as literal strings is fragile (localization,
// punctuation, provider changes). RU/CN/IR is stable.
const BLOCKED_COUNTRY_CODES = ['RU', 'CN', 'IR'];

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ip-api.com's JSON shape for a successful lookup (`status: "success"`). A
// failed lookup (reserved/private IP, invalid IP, or the free tier's own
// rate limit — 45 requests/minute, per-source-IP) comes back HTTP 200 with
// `status: "fail"` and a `message` instead of ever using an HTTP error
// status, so status is what must be checked — never res.ok alone. Same
// documented failure modes as record-login-geo's own IpApiComResponse.
interface IpApiComResponse {
  status?: string;
  message?: string;
  country?: string;
  countryCode?: string;
}

// Best-effort only: any failure here (network error, rate limit, reserved/
// private IP, malformed response) must never propagate — the caller must
// fail open (see file header). Every failure branch logs first — this repo
// already learned, the hard way, in record-login-geo's 2026-09-01
// correction, that a silently-swallowed geolocation failure is invisible
// until traced by hand; that lesson applies here too.
async function lookupGeo(ip: string): Promise<{ country: string | null; countryCode: string | null }> {
  const empty = { country: null, countryCode: null };
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}`);
    if (!res.ok) {
      console.error('check-login-geofence: ip-api.com HTTP error', res.status);
      return empty;
    }
    const data = await res.json() as IpApiComResponse;
    if (data.status !== 'success') {
      console.error('check-login-geofence: ip-api.com lookup failed', data.message || data.status || 'unknown reason');
      return empty;
    }
    return {
      country: data.country || null,
      countryCode: data.countryCode || null,
    };
  } catch (err) {
    console.error('check-login-geofence: geolocation lookup threw', err instanceof Error ? err.message : String(err));
    return empty;
  }
}

// x-forwarded-for can carry a comma-separated chain (client, then each proxy
// hop) — the first entry is the original client IP, which is what we want
// geolocated. Supabase's edge network sets this; there is no client-
// controllable way to spoof what value Supabase itself writes into it.
// Identical to record-login-geo's own extractClientIp().
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

    // Same JWT-verification idiom as record-login-geo/admin-provision: the
    // only trustworthy identity signal is what the caller's own JWT proves,
    // never a client-supplied field. No admin check here — this function
    // only ever acts on a session/site_sessions row that already belongs to
    // the caller (enforced below in the service-role WHERE clause).
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

    const siteSessionId = body && body.site_session_id;
    if (typeof siteSessionId !== 'string' || siteSessionId.length === 0) {
      return jsonResponse({ error: 'Missing or invalid "site_session_id" field' }, 400);
    }

    const clientIp = extractClientIp(req);
    if (!clientIp) {
      // Local dev / no proxy chain in front of the function — nothing to
      // look up. Fail open: the sign-in already succeeded, and this call
      // has no evidence to act on.
      return jsonResponse({ ok: true, blocked: false, skipped: 'no client ip available' }, 200);
    }

    // Hashed once, up front — the raw clientIp value below is used ONLY for
    // the ip-api.com lookup (which needs the real IP to geolocate) and is
    // never itself written to the database; site_sessions.ip_hash (below)
    // gets this hash, never the raw IP. Every request that reaches this
    // point writes ip_hash on its own site_sessions row, whether blocked or
    // not — this is also the only place in the codebase that populates that
    // column at all (check-login-ueba runs before the row exists and so
    // cannot write it; see SESSION_SECURITY_SPEC.md Decision 3), which is
    // what lets a later login's check-login-ueba call compare against it.
    const clientIpHash = await hashIp(clientIp);

    // Service-role client: bypasses RLS, same as record-login-geo — the
    // WHERE clauses below are what actually scope these writes, per that
    // function's own comment. Needed in both the blocked and not-blocked
    // paths now (not just the blocked one), since ip_hash gets written
    // either way.
    const serviceClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const geo = await lookupGeo(clientIp);

    if (geo.countryCode && BLOCKED_COUNTRY_CODES.includes(geo.countryCode)) {
      // Same revocation intent as admin_force_sign_out()'s
      // `delete from auth.sessions where user_id = target_user_id`
      // (20260901122000_activity_monitor_sessions.sql), but that call is a
      // plpgsql function running with direct SQL access to the `auth`
      // schema from inside Postgres itself. An Edge Function only has
      // supabase-js/PostgREST access, and this project's config.toml
      // ([api] schemas = ["public", "graphql_public"]) does not expose the
      // `auth` schema over PostgREST, so `.schema('auth').from('sessions')`
      // is not reachable from here — it would 404/error every time, not
      // silently no-op, but it would never actually revoke anything. The
      // correct service-role-safe equivalent from an Edge Function is
      // GoTrue's own admin API, which supabase-js exposes as
      // `auth.admin.signOut()`. `bearerToken` here is the verified caller's
      // own current access token, and `scope: 'global'` revokes every
      // refresh session for that user, not just this one — functionally the
      // same outcome as the raw DELETE. Same accepted caveat as
      // admin_force_sign_out(): blocks the *next* token refresh/reload,
      // does not instantly kill an access token already held in the
      // browser from the last few seconds.
      const { error: signOutError } = await serviceClient.auth.admin.signOut(bearerToken, 'global');
      if (signOutError) {
        console.error('check-login-geofence: auth admin signOut failed', signOutError.message);
      }

      const { error: updateError } = await serviceClient
        .from('site_sessions')
        .update({ ip_hash: clientIpHash, ended_at: new Date().toISOString(), ended_reason: 'geo_blocked' })
        .eq('id', siteSessionId)
        .eq('user_id', verifiedUserId);
      if (updateError) {
        console.error('check-login-geofence: site_sessions update failed', updateError.message);
      }

      return jsonResponse(
        { ok: true, blocked: true, country: geo.country, country_code: geo.countryCode },
        200,
      );
    }

    // Not blocked: still record ip_hash on the row so a future sign-in's
    // check-login-ueba call has something to compare against (see the
    // header comment above this function's clientIpHash line).
    const { error: ipHashUpdateError } = await serviceClient
      .from('site_sessions')
      .update({ ip_hash: clientIpHash })
      .eq('id', siteSessionId)
      .eq('user_id', verifiedUserId);
    if (ipHashUpdateError) {
      console.error('check-login-geofence: site_sessions ip_hash update failed', ipHashUpdateError.message);
    }

    return jsonResponse({ ok: true, blocked: false }, 200);
  } catch (err) {
    // Same catch-all discipline as record-login-geo/admin-provision: never
    // let a raw stack trace or an error carrying the service-role key reach
    // the client. Log server-side only.
    console.error(
      'check-login-geofence unexpected error:',
      err instanceof Error ? err.message : String(err),
    );
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
