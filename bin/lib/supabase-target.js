'use strict';
/**
 * Shared target guard for admin/ops scripts (Code Issues Log ISSUE-019).
 *
 * Every script that talks to Supabase calls requireSupabaseTarget() before
 * doing anything else. It:
 *   1. Exits with an error if SUPABASE_URL is not set (there is no default).
 *   2. Checks that SUPABASE_URL looks like https://<project-ref>.supabase.co.
 *   3. Prints which project the script is about to touch.
 *   4. Refuses the production project unless --production is passed.
 *   5. Removes --production from process.argv so each script's own argument
 *      parsing (some of it positional) is unchanged.
 *
 * It never contacts the network and never reads keys.
 */

const PRODUCTION_REF = 'eokvngifirjgfozzbieu';
const STAGING_REF = 'xbblgtrfwgeiyttdlbue';
const PRODUCTION_FLAG = '--production';
const STAGING_URL_EXAMPLE = `https://${STAGING_REF}.supabase.co`;

class TargetError extends Error {}

/**
 * Pure version of the guard, for tests. Returns the resolved target and the
 * argument list with --production removed, or throws TargetError.
 */
function resolveSupabaseTarget({ env = {}, argv = [] } = {}) {
  const raw = (env.SUPABASE_URL || '').trim();
  if (!raw) {
    throw new TargetError(
      'SUPABASE_URL is not set. This script has no default target.\n' +
      `For staging, run it like this:\n  SUPABASE_URL=${STAGING_URL_EXAMPLE} node <script> ...`
    );
  }

  const url = raw.replace(/\/+$/, '');
  const match = /^https:\/\/([a-z0-9]{20})\.supabase\.co$/.exec(url);
  if (!match) {
    throw new TargetError(
      `SUPABASE_URL "${raw}" is not a Supabase project URL. ` +
      'Expected https://<project-ref>.supabase.co'
    );
  }

  const ref = match[1];
  const environment = ref === PRODUCTION_REF ? 'PRODUCTION'
    : ref === STAGING_REF ? 'STAGING'
    : 'UNKNOWN';
  const productionAllowed = argv.includes(PRODUCTION_FLAG);
  const remainingArgv = argv.filter((arg) => arg !== PRODUCTION_FLAG);

  if (environment === 'PRODUCTION' && !productionAllowed) {
    throw new TargetError(
      `SUPABASE_URL points at PRODUCTION (${ref}). Refusing to run.\n` +
      `If you really mean production, add the ${PRODUCTION_FLAG} flag.`
    );
  }

  return { url, ref, environment, productionAllowed, argv: remainingArgv };
}

/**
 * The guard scripts call. Prints the target, or prints the error and exits.
 * Mutates process.argv to remove --production.
 */
function requireSupabaseTarget({ env = process.env, log = console.log, error = console.error, exit = process.exit } = {}) {
  let target;
  try {
    target = resolveSupabaseTarget({ env, argv: process.argv.slice(2) });
  } catch (err) {
    if (!(err instanceof TargetError)) throw err;
    error(`Error: ${err.message}`);
    exit(1);
    return null;
  }

  process.argv.splice(2, process.argv.length - 2, ...target.argv);

  log(`Target: ${target.environment} (${target.ref})`);
  if (target.environment === 'PRODUCTION') {
    log('!!! WARNING: --production was passed. This run changes the LIVE production project. !!!');
  } else if (target.environment === 'UNKNOWN') {
    log('Note: this project ref is neither the known staging nor production project.');
  }
  return target;
}

module.exports = {
  PRODUCTION_REF,
  STAGING_REF,
  PRODUCTION_FLAG,
  TargetError,
  resolveSupabaseTarget,
  requireSupabaseTarget,
};
