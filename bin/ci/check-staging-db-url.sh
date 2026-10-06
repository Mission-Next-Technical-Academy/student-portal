#!/usr/bin/env bash
# Guard for staging-sync.yml, job migrate-staging. Reads STAGING_DB_URL from
# the environment (never from an argument) and never prints it or any part of
# it: student-portal is public, so every workflow log is public.
#
# Passes (exit 0) only when the value names the staging project and not the
# production project. A missing value fails too: staging must not move ahead
# of a database nobody migrated.
set -euo pipefail
set +x

# shellcheck source=bin/ci/supabase-refs.sh
source "$(dirname "$0")/supabase-refs.sh"

db_url="${STAGING_DB_URL:-}"

if [ -z "$db_url" ]; then
  echo "::error::STAGING_DB_URL is not set in the staging-sync environment, so staging migrations cannot run. staging was not moved and the website was not deployed. See docs/operations/STAGING_AUTOMATION.md to add it."
  exit 1
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
