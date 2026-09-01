// supabase/functions/record-login-geo/index.ts
//
// Admin Student Activity Monitor location enrichment. Called once, fire-
// and-forget, right after portal/app.js's recordLoginEvent() inserts a new
// public.login_events row (20260901130000_login_event_geo.sql). Patches
// that specific row with the caller's real request IP and a coarse
// (city/region/country) geolocation lookup.
//
// Why this exists as a separate Edge Function call instead of columns the
// client just inserts directly: the client cannot see, and must never be
// trusted to report, its own IP — a student could write anything into a
// client-writable ip_address/geo_* field. This function reads the IP off
// the request itself (set by Supabase's edge network, not by anything the
// client sends), so it is not client-spoofable the way a body field would
// be.
//
// Deploy (site owner only, not run by this pass):
//   supabase functions deploy record-login-geo
// No `supabase secrets set` needed beyond what Supabase auto-injects
// (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY — same as
// admin-provision) — the geolocation provider used below (ipapi.co) needs
// no API key at this project's request volume.
//
// esm.sh import pinned to major version 2, same reasoning as admin-
// provision/index.ts: matches the v2 client library used elsewhere in this
// repo (portal/supabase-config.js).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ipapi.co's JSON shape for a successful lookup. Reserved/private ranges
// and rate-limited/errored calls come back with an `error: true` field
// instead (or the fetch itself throws) — handled by the try/catch in
// lookupGeo() below, never by trusting these fields to always be present.
interface IpapiResponse {
  city?: string;
  region?: string;
  country_name?: string;
  error?: boolean;
  reason?: string;
}

// Best-effort only: any failure here (network error, rate limit, reserved/
// private IP, malformed response) must never propagate — the caller only
// loses the location fields, not the login_events row itself. If ipapi.co
// ever becomes unreliable in practice, ip-api.com is the documented
// fallback (free, no key, but HTTP-only on its free tier — a mild
// downgrade for data this low-sensitivity, not a blocker).
async function lookupGeo(ip: string): Promise<{ city: string | null; region: string | null; country: string | null }> {
  const empty = { city: null, region: null, country: null };
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
    if (!res.ok) return empty;
    const data = await res.json() as IpapiResponse;
    if (data.error) return empty;
    return {
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
    };
  } catch (err) {
    console.error('record-login-geo: geolocation lookup failed', err instanceof Error ? err.message : String(err));
    return empty;
  }
}

// x-forwarded-for can carry a comma-separated chain (client, then each
// proxy hop) — the first entry is the original client IP, which is what we
// want geolocated. Supabase's edge network sets this; there is no client-
// controllable way to spoof what value Supabase itself writes into it.
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

    // Same JWT-verification idiom as admin-provision/index.ts Step 1: the
    // only trustworthy identity signal is what the caller's own JWT proves,
    // never a client-supplied field. No admin check here — unlike
    // admin-provision, this function only ever lets a caller enrich a row
    // that already belongs to them (enforced below in the update's WHERE
    // clause), so being an authenticated user is sufficient.
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

    const clientIp = extractClientIp(req);
    if (!clientIp) {
      // Local dev / no proxy chain in front of the function — nothing to
      // look up. Not an error: the login itself already succeeded and was
      // recorded; this call is purely enrichment.
      return jsonResponse({ ok: true, skipped: 'no client ip available' }, 200);
    }

    const geo = await lookupGeo(clientIp);

    // Service-role client: bypasses RLS (login_events has no `update` grant
    // for authenticated at all, by design — see the migration comment), so
    // this WHERE clause is the only thing standing between a caller and
    // patching a row that isn't theirs. Both conditions must hold.
    const serviceClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { error: updateError } = await serviceClient
      .from('login_events')
      .update({
        ip_address: clientIp,
        geo_city: geo.city,
        geo_region: geo.region,
        geo_country: geo.country,
        geo_looked_up_at: new Date().toISOString(),
      })
      .eq('id', loginEventId)
      .eq('user_id', verifiedUserId);

    if (updateError) {
      console.error('record-login-geo: update failed', updateError.message);
      return jsonResponse({ error: 'Failed to record login location' }, 500);
    }

    return jsonResponse({ ok: true, ip_address: clientIp, ...geo }, 200);
  } catch (err) {
    // Same catch-all discipline as admin-provision/index.ts: never let a raw
    // stack trace or an error carrying the service-role key reach the
    // client. Log server-side only.
    console.error(
      'record-login-geo unexpected error:',
      err instanceof Error ? err.message : String(err),
    );
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
