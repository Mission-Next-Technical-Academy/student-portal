// supabase/functions/_shared/cors.ts
//
// Standard CORS idiom from Supabase's own Edge Function quickstart docs
// (https://supabase.com/docs/guides/functions/cors). admin-provision is
// called directly from the browser — the admin panel in portal/app.js,
// served from GitHub Pages, not from a server — so every response,
// including the OPTIONS preflight and every error response, needs these
// headers attached or the browser's fetch() will reject the response
// before the caller ever sees the body.
//
// '_shared' (leading underscore) is the Supabase CLI's own convention for
// a functions subdirectory that is not itself a deployable function —
// `supabase functions deploy` skips it. Kept separate from
// admin-provision/ (rather than inlined) so a second Edge Function added
// later can reuse it without duplicating the header list.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
