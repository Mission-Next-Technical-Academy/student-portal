/* MNT Academy — Supabase client config.
 *
 * The anon key is public by design (Row Level Security is the entire
 * security model — see supabase/migrations/20260817090300_rls.sql). It is
 * safe to ship in this static bundle. The service-role key must NEVER
 * appear here or anywhere under portal/ — it lives only in the local
 * provisioning script's environment (bin/provision-students.js).
 */

const MNT_SUPABASE_URL = 'https://eokvngifirjgfozzbieu.supabase.co';

// Publishable key (Supabase's newer anon-key format) — safe to ship client-side.
const MNT_SUPABASE_ANON_KEY = 'sb_publishable_wTS7tUFTA6Jo9Du4OVHbqA_mg4jODzz';

const mntSupabase = supabase.createClient(MNT_SUPABASE_URL, MNT_SUPABASE_ANON_KEY);
