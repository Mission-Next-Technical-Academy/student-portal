// supabase/functions/admin-provision/index.ts
//
// Admin-only Edge Function backing the admin panel's "Generate New User"
// and "Generate New Cohort" actions (Sprint 4, portal/app.js). Ports
// bin/provision-students.js's account-creation logic into a callable HTTPS
// endpoint the admin panel can invoke live, instead of the site owner
// running the script by hand from a local terminal.
//
// COHORT_USER_LIFECYCLE_SPRINT_PLAN.md — Sprint 3.
//
// Deploy (site owner only, not run by this pass):
//   supabase functions deploy admin-provision
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
//
// Import note: no existing file in this repo imports @supabase/supabase-js
// for a Deno runtime (portal/vendor/supabase.js is a browser-bundled
// build, not a Deno-compatible import specifier). This uses the standard
// esm.sh import shown in Supabase's own Edge Function quickstart docs,
// pinned to major version 2 to match the client library version already
// used elsewhere in this repo (portal/supabase-config.js's
// supabase.createClient() is the v2 API shape).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import {
  provisionOneAccount,
  TRACK_CODES,
  type ProvisionedAccount,
} from './provisioning.ts';

// Auto-injected by the Supabase platform on every deployed Edge Function
// (and by `supabase functions serve` locally) — SUPABASE_URL and
// SUPABASE_ANON_KEY do not need `supabase secrets set`. The one secret
// that DOES need an explicit `supabase secrets set` is
// SUPABASE_SERVICE_ROLE_KEY: it is sensitive enough that Supabase does not
// auto-inject it the same way, and the deployment checklist in
// COHORT_USER_LIFECYCLE_SPRINT_PLAN.md has the site owner set it by hand.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Cohort batches never include ADMIN — "cohorts are for students," per the
// sprint plan. Kept separate from provisioning.ts's TRACK_CODES (which
// includes ADMIN, valid for the single-account create_user action).
const COHORT_TRACK_CODES = ['SOCAN', 'HDESK', 'AIENG', 'ELECT'] as const;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  // CORS preflight — must be handled before anything else, with no auth
  // requirement (the browser sends this without an Authorization header).
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // =================================================================
    // STEP 1 — AUTHORIZATION. Security-critical: read carefully.
    //
    // We NEVER trust a user_id/is_admin field the caller might include in
    // the JSON request body — any client can put anything there. The only
    // trustworthy signal of who is calling is what their JWT itself
    // proves, verified server-side. So:
    //
    //   1. Take the caller's JWT from the Authorization header.
    //   2. Build a Supabase client that acts AS THE CALLER (anon key +
    //      that same Authorization header) — not the service role. This
    //      header is what makes any later `.from()` call on this client
    //      run as the caller for RLS purposes.
    //   3. Call .auth.getUser(token) on that client, passing the extracted
    //      bearer token EXPLICITLY. This is deliberate, not redundant with
    //      step 2's global header: GoTrueClient.getUser() with no argument
    //      reads from its own internal session storage (empty here, since
    //      persistSession is off and no setSession() call was made) — it
    //      does NOT fall back to the client's `global.headers` override,
    //      which only affects Postgrest/Storage-style requests made via
    //      `.from()`. Passing the token directly sends it straight to
    //      Supabase Auth's /auth/v1/user endpoint, which validates the JWT
    //      signature/expiry server-side and hands back the user it
    //      decodes to. We only ever trust that returned user_id, never
    //      one taken from the request body.
    //   4. Using ONLY that verified user_id, check public.students for
    //      is_admin = true, via the same caller-scoped client — so
    //      students_self_read's RLS policy (user_id = auth.uid()) is what
    //      makes the lookup of the caller's OWN row succeed. There is no
    //      way for this query to return, or be tricked into returning,
    //      another user's row: auth.uid() inside RLS is derived from the
    //      same validated JWT, not from any parameter this code passes.
    //
    // Only once both checks pass does anything below touch the
    // service-role client.
    // =================================================================
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

    // The ONLY user_id used anywhere below — proven by the JWT, not by
    // anything the request body claims.
    const verifiedUserId = user.id;

    const { data: studentRow, error: studentError } = await callerClient
      .from('students')
      .select('is_admin')
      .eq('user_id', verifiedUserId)
      .maybeSingle();

    if (studentError) {
      return jsonResponse({ error: 'Admin check failed' }, 500);
    }
    if (!studentRow || studentRow.is_admin !== true) {
      // Covers both "no students row for this user" and "row exists but
      // is_admin is false" — same 403 either way, no information leak
      // about which.
      return jsonResponse({ error: 'Admin privileges required' }, 403);
    }

    // =================================================================
    // STEP 2 — PRIVILEGED WORK. Only reachable after Step 1 passed.
    //
    // Separate client, built from the service-role key. This client is
    // NOT RLS-constrained — it can create auth users and write any
    // students/cohorts row regardless of policy. That is exactly why the
    // manual admin check above has to happen first, and has to be
    // trustworthy: everything past this point assumes the caller is a
    // verified admin.
    // =================================================================
    const serviceClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    let body: Record<string, unknown> | null;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
    }

    if (!body || typeof body.action !== 'string') {
      return jsonResponse(
        { error: 'Missing or invalid "action" field' },
        400,
      );
    }

    if (body.action === 'create_user') {
      return await handleCreateUser(serviceClient, body);
    }

    if (body.action === 'create_cohort') {
      return await handleCreateCohort(serviceClient, body, verifiedUserId);
    }

    return jsonResponse({ error: `Unknown action "${body.action}"` }, 400);
  } catch (err) {
    // Catch-all: never let an unexpected exception surface a raw Deno
    // stack trace, hang the response, or (via err.message on something
    // unexpected) leak the service-role key. Log server-side only, return
    // a clean generic message.
    console.error(
      'admin-provision unexpected error:',
      err instanceof Error ? err.message : String(err),
    );
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});

// ------------------------------------------------------------- create_user
//
// Body: { action: "create_user", track_code: "SOCAN"|"HDESK"|"AIENG"|"ELECT"|"ADMIN", cohort_id?: string | null }
// One account. Ad hoc / not part of a batch, so is_enrolled starts false —
// matching the sprint plan's design: an unassigned/not-yet-activated
// generated account is exactly what later gets swept up as "unused" if it
// is never enrolled.

// deno-lint-ignore no-explicit-any
async function handleCreateUser(
  serviceClient: any,
  body: Record<string, unknown>,
): Promise<Response> {
  const trackCode = body.track_code;
  if (typeof trackCode !== 'string' || !TRACK_CODES.includes(trackCode)) {
    return jsonResponse(
      { error: `Invalid track_code. Use one of: ${TRACK_CODES.join(', ')}` },
      400,
    );
  }

  const cohortId =
    typeof body.cohort_id === 'string' && body.cohort_id.length > 0
      ? body.cohort_id
      : null;

  try {
    const account = await provisionOneAccount(serviceClient, {
      trackCode,
      cohortId,
      isEnrolled: false,
    });
    return jsonResponse(account, 200);
  } catch (err) {
    return jsonResponse(
      {
        error: err instanceof Error
          ? err.message
          : 'Account creation failed',
      },
      500,
    );
  }
}

// ----------------------------------------------------------- create_cohort
//
// Body: { action: "create_cohort", name: string, start_date: string,
//          end_date: string, counts: { SOCAN?, HDESK?, AIENG?, ELECT? } }
// Creates one cohort row, then batch-generates accounts per track, each
// with cohort_id set to the new cohort and is_enrolled true (see the
// design note in provisioning.ts). Per-account failures are collected, not
// fatal to the whole request — mirrors provisionAccounts()'s
// created/failed tolerance in bin/provision-students.js.

// deno-lint-ignore no-explicit-any
async function handleCreateCohort(
  serviceClient: any,
  body: Record<string, unknown>,
  adminUserId: string,
): Promise<Response> {
  const name = body.name;
  const startDate = body.start_date;
  const endDate = body.end_date;
  const counts = body.counts;

  if (typeof name !== 'string' || name.trim().length === 0) {
    return jsonResponse({ error: '"name" is required' }, 400);
  }
  if (typeof startDate !== 'string' || typeof endDate !== 'string') {
    return jsonResponse(
      { error: '"start_date" and "end_date" are required' },
      400,
    );
  }

  // Mirrors the DB check constraint `check (end_date >= start_date)` on
  // public.cohorts (20260901120000_cohort_lifecycle_schema.sql) so the
  // caller gets a clear 400 instead of a raw Postgres constraint error.
  const startMs = Date.parse(startDate);
  const endMs = Date.parse(endDate);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return jsonResponse(
      { error: '"start_date"/"end_date" must be valid dates' },
      400,
    );
  }
  if (endMs < startMs) {
    return jsonResponse(
      { error: 'end_date must be on or after start_date' },
      400,
    );
  }

  const requestedCounts =
    counts && typeof counts === 'object' ? counts as Record<string, unknown> : {};

  // Math.floor guards against a fractional count (e.g. 2.5) making the
  // per-track creation loop below run an uneven number of times — the
  // loop compares `i < count` directly, so a non-integer count needs to be
  // normalized here, not left for the loop to interpret.
  const trackEntries: Array<[string, number]> = COHORT_TRACK_CODES
    .map((track) => [track, Math.max(0, Math.floor(Number(requestedCounts[track]) || 0))] as [string, number])
    .filter(([, n]) => n > 0);

  if (trackEntries.length === 0) {
    return jsonResponse(
      { error: 'counts must include at least one positive value for SOCAN, HDESK, AIENG, or ELECT' },
      400,
    );
  }

  const { data: cohort, error: cohortError } = await serviceClient
    .from('cohorts')
    .insert({
      name,
      start_date: startDate,
      end_date: endDate,
      created_by: adminUserId, // the JWT-verified admin, never client-supplied
    })
    .select('id, name')
    .single();

  if (cohortError || !cohort) {
    return jsonResponse(
      { error: `Cohort creation failed: ${cohortError?.message ?? 'unknown error'}` },
      500,
    );
  }

  const roster: ProvisionedAccount[] = [];
  const failures: Array<{ track_code: string; error: string }> = [];

  for (const [trackCode, count] of trackEntries) {
    for (let i = 0; i < count; i++) {
      try {
        const account = await provisionOneAccount(serviceClient, {
          trackCode,
          cohortId: cohort.id,
          isEnrolled: true,
        });
        roster.push(account);
      } catch (err) {
        failures.push({
          track_code: trackCode,
          error: err instanceof Error ? err.message : 'Account creation failed',
        });
      }
    }
  }

  return jsonResponse(
    {
      cohort_id: cohort.id,
      cohort_name: cohort.name,
      roster,
      failures,
    },
    200,
  );
}
