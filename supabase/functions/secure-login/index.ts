// Credential exchange and security checks run before an Auth session is
// returned to the browser. A direct password-grant token remains harmless for
// course writes because the database requires its session_id to be registered
// by this function in public.site_sessions.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EMAIL_DOMAIN = '@missionnext.example';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function ipHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const name of ['x-forwarded-for', 'cf-connecting-ip', 'x-real-ip']) {
    const value = req.headers.get(name);
    if (value) headers[name] = value;
  }
  return headers;
}

async function invokeCheck(name: string, token: string, body: unknown, req: Request): Promise<Response | null> {
  try {
    return await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...ipHeaders(req),
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error(`secure-login: ${name} request failed`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

function sessionIdFromJwt(token: string): string | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const claims = JSON.parse(decoded);
    return typeof claims.session_id === 'string' ? claims.session_id : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid credentials' }, 401);
  }
  const identifier = typeof body.identifier === 'string' ? body.identifier.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!identifier || !password || identifier.length > 254 || password.length > 1024) {
    return json({ error: 'Invalid credentials' }, 401);
  }
  const email = identifier.includes('@') ? identifier : `${identifier}${EMAIL_DOMAIN}`;

  // Use the official Auth password grant, but keep its newly issued tokens
  // inside this function until every policy check has completed.
  let authResponse: Response;
  try {
    authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    console.error('secure-login: Auth request failed', error instanceof Error ? error.message : String(error));
    return json({ error: 'Sign-in is temporarily unavailable' }, 503);
  }
  if (!authResponse.ok) return json({ error: 'Invalid credentials' }, 401);

  const auth = await authResponse.json();
  const token = auth?.access_token;
  const user = auth?.user;
  const authSessionId = typeof token === 'string' ? sessionIdFromJwt(token) : null;
  if (!token || !auth?.refresh_token || !user?.id || !authSessionId) {
    return json({ error: 'Sign-in is temporarily unavailable' }, 503);
  }

  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: student, error: studentError } = await service
    .from('students').select('student_id, track_code').eq('user_id', user.id).maybeSingle();
  if (studentError || !student) {
    await service.auth.admin.signOut(token, 'local');
    return json({ error: 'This account is not provisioned for the academy' }, 403);
  }

  // The UEBA check must precede insertion: favor_new may close an older
  // session so that the concurrency-cap trigger can admit this one.
  const { data: event, error: eventError } = await service.from('login_events').insert({
    user_id: user.id,
    student_id: student.student_id,
    track_code: student.track_code,
  }).select('id').single();
  if (eventError || !event) {
    console.error('secure-login: login event insert failed', eventError?.message);
    await service.auth.admin.signOut(token, 'local');
    return json({ error: 'Sign-in is temporarily unavailable' }, 503);
  }

  const uebaResponse = await invokeCheck('check-login-ueba', token, { login_event_id: event.id }, req);
  if (uebaResponse?.ok) {
    const decision = await uebaResponse.json();
    if (decision?.action === 'block' || decision?.action === 'block_suspicious') {
      await service.auth.admin.signOut(token, 'local');
      return json({ action: 'session_limit' }, 429);
    }
  }

  const { data: siteSession, error: sessionError } = await service.from('site_sessions').insert({
    user_id: user.id,
    student_id: student.student_id,
    track_code: student.track_code,
    auth_session_id: authSessionId,
  }).select('id').single();
  if (sessionError || !siteSession) {
    await service.auth.admin.signOut(token, 'local');
    if (sessionError?.message.includes('MNT_SESSION_LIMIT_REACHED')) {
      return json({ action: 'session_limit' }, 429);
    }
    console.error('secure-login: site session insert failed', sessionError?.message);
    return json({ error: 'Sign-in is temporarily unavailable' }, 503);
  }

  // Geofence runs after a trusted row exists so it can annotate and close
  // precisely this session. Existing policy intentionally fails open on
  // provider/network errors; only an explicit deny blocks login.
  const geoResponse = await invokeCheck('check-login-geofence', token, { site_session_id: siteSession.id }, req);
  if (geoResponse?.ok) {
    const geo = await geoResponse.json();
    if (geo?.blocked) return json({ action: 'geo_blocked' }, 403);
  }

  return json({
    access_token: token,
    refresh_token: auth.refresh_token,
    expires_in: auth.expires_in,
    token_type: auth.token_type,
    user,
    login_event_id: event.id,
  });
});
