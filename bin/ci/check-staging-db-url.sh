#!/usr/bin/env bash
# Guard for staging-sync.yml, job migrate-staging. Reads STAGING_DB_URL from
# the environment (never from an argument) and never prints it or any part of
# it: student-portal is public, so every workflow log is public.
#
# Outcomes:
#   not set                      -> ::notice::, configured=false, exit 0 (skip)
#   names production, or does
#   not name staging             -> ::error::, exit 1
#   names staging only           -> configured=true, exit 0
#
# configured=... is appended to $GITHUB_OUTPUT when that is set.
set -euo pipefail
set +x

# shellcheck source=bin/ci/supabase-refs.sh
source "$(dirname "$0")/supabase-refs.sh"

output="${GITHUB_OUTPUT:-/dev/null}"
db_url="${STAGING_DB_URL:-}"

if [ -z "$db_url" ]; then
  echo "::notice::STAGING_DB_URL is not set in the staging-sync environment, so staging migrations were skipped. See docs/operations/STAGING_AUTOMATION.md to add it."
  echo "configured=false" >> "$output"
  exit 0
fi

case "$db_url" in
  *"$SUPABASE_PRODUCTION_REF"*)
    echo "::error::STAGING_DB_URL names the PRODUCTION Supabase project. Refusing to run. Replace the secret with the staging Session pooler connection string."
    exit 1
    ;;
esac

case "$db_url" in
  *"$SUPABASE_STAGING_REF"*) ;;
  *)
    echo "::error::STAGING_DB_URL does not name the staging Supabase project ($SUPABASE_STAGING_REF). Refusing to run."
    exit 1
    ;;
esac

echo "STAGING_DB_URL names the staging project ($SUPABASE_STAGING_REF)."
echo "configured=true" >> "$output"
