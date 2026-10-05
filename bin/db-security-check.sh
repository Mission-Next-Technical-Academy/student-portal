#!/usr/bin/env bash
# Runs the SQL security regression tests in supabase/tests/ against the local
# Supabase stack (`supabase start`). Each test rolls itself back. Runs as
# supabase_admin (local superuser) so tests can SET SESSION AUTHORIZATION to
# the real PostgREST login role.
set -euo pipefail
cd "$(dirname "$0")/.."
container=$(docker ps --format '{{.Names}}' | grep -m1 '^supabase_db_' || true)
if [ -z "$container" ]; then
  echo "Local Supabase is not running. Start it with: supabase start" >&2
  exit 1
fi
for test in supabase/tests/*.sql; do
  echo "== $test"
  docker exec -i "$container" psql -U supabase_admin -d postgres -q -v ON_ERROR_STOP=1 < "$test"
done
