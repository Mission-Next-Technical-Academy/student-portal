#!/usr/bin/env bash
# Guard for staging-sync.yml, job migrate-staging. Reads STAGING_DB_URL from
# the environment (never from an argument) and never prints it or any part of
# it (user, password, host): student-portal is public, so every workflow log
# is public. Errors name only the rule that failed.
#
# Passes (exit 0) only for the staging project's Supabase Session pooler
# connection string, exactly this shape:
#   postgresql://postgres.<staging ref>:<percent-encoded password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres
# (postgres:// is accepted too). Anything else fails closed, including a
# missing value: staging must not move ahead of a database nobody migrated.
set -euo pipefail
set +x

# shellcheck source=bin/ci/supabase-refs.sh
source "$(dirname "$0")/supabase-refs.sh"

db_url="${STAGING_DB_URL:-}"

fail() {
  echo "::error::STAGING_DB_URL rejected: $1. Nothing ran against any database; staging was not moved and the website was not deployed. Use the staging Session pooler connection string (docs/operations/STAGING_AUTOMATION.md, Secret 1)."
  exit 1
}

if [ -z "$db_url" ]; then
  echo "::error::STAGING_DB_URL is not set in the staging-sync environment, so staging migrations cannot run. staging was not moved and the website was not deployed. See docs/operations/STAGING_AUTOMATION.md to add it."
  exit 1
fi

case "$db_url" in
  *"$SUPABASE_PRODUCTION_REF"*) fail "it names the PRODUCTION Supabase project" ;;
esac

case "$db_url" in
  postgresql://* | postgres://*) ;;
  *) fail "scheme is not postgresql:// or postgres://" ;;
esac

# A percent-encoded password never contains a raw @, so there is exactly one.
at_signs="${db_url//[!@]/}"
if [ "${#at_signs}" -ne 1 ]; then
  fail "it must contain exactly one @ (percent-encode @ in the password as %40)"
fi

# scheme://user:password@host:port/database, with no query string, fragment
# or whitespace. The password is matched as opaque text (it may contain %),
# never decoded and never printed.
shape='^(postgresql|postgres)://([^:/@?#[:space:]]+):([^/@?#[:space:]]+)@([^:/@?#[:space:]]+):([0-9]+)(/[^/@?#[:space:]]*)$'
if ! [[ "$db_url" =~ $shape ]]; then
  fail "it is not in the form postgresql://USER:PASSWORD@HOST:5432/postgres (check for a missing port or password, an unencoded / ? or #, extra parameters, or spaces)"
fi
user="${BASH_REMATCH[2]}"
host="${BASH_REMATCH[4]}"
port="${BASH_REMATCH[5]}"
database="${BASH_REMATCH[6]}"

if [ "$user" != "postgres.$SUPABASE_STAGING_REF" ]; then
  fail "username is not postgres.$SUPABASE_STAGING_REF (the staging Session pooler user)"
fi
if ! [[ "$host" =~ ^aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com$ ]]; then
  fail "host is not a Supabase session pooler (aws-N-REGION.pooler.supabase.com)"
fi
if [ "$port" != "5432" ]; then
  fail "port is not 5432 (the Session pooler port; 6543 is the Transaction pooler)"
fi
if [ "$database" != "/postgres" ]; then
  fail "database name is not postgres"
fi

echo "STAGING_DB_URL is the staging project's Session pooler ($SUPABASE_STAGING_REF)."
