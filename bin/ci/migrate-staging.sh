#!/usr/bin/env bash
# Apply pending migrations to the STAGING database (staging-sync.yml, job
# migrate-staging). Needs STAGING_DB_URL in the environment and the Supabase
# CLI on PATH.
#
# The connection string reaches the CLI only as an expanded argument inside
# this script (the workflow log shows the step's script text, not expanded
# values) and is never printed. The CLI's own output
# is captured and run through redact() before it reaches the public log or the
# job summary, because a connection error can quote the user and host.
set -euo pipefail
set +x

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

summary="${GITHUB_STEP_SUMMARY:-/dev/null}"

# Re-check the target here too, so this script cannot be pointed at the wrong
# database even when run on its own.
bin/ci/check-staging-db-url.sh

redact() {
  sed -E \
    -e 's#postgres(ql)?://[^[:space:]]+#[redacted connection string]#g' \
    -e 's#(password|user|host|dbname)=[^[:space:]]+#\1=[redacted]#g' \
    -e 's#[A-Za-z0-9.-]+\.supabase\.(co|com)#[redacted host]#g'
}

# Print the migration files in supabase/migrations whose names appear in the
# CLI output in $1. Matching on our own file names avoids depending on the
# exact wording of the CLI's output.
migrations_named_in() {
  local file name
  for file in supabase/migrations/*.sql; do
    name="$(basename "$file" .sql)"
    if grep -qF "$name" "$1"; then
      echo "$name.sql"
    fi
  done
}

push_log="$(mktemp)"
# Usage: run_push <log file> [extra flags...]; returns the CLI's exit status.
run_push() {
  local log="$1"
  shift
  local status=0
  supabase db push --db-url "$STAGING_DB_URL" "$@" >"$log" 2>&1 || status=$?
  redact <"$log"
  return "$status"
}

details() {
  echo
  echo "<details><summary>$1 (connection details redacted)</summary>"
  echo
  echo '```'
  redact <"$2"
  echo '```'
  echo "</details>"
}

echo "== Dry run: migrations that would be applied to staging =="
dry_log="$(mktemp)"
if ! run_push "$dry_log" --dry-run; then
  {
    echo "### Staging database migrations: dry run FAILED"
    echo "Nothing was applied."
    details "Dry-run output" "$dry_log"
  } >> "$summary"
  echo "::error::supabase db push --dry-run failed against staging. Nothing was applied, staging was not moved, and the website was not deployed."
  exit 1
fi
pending="$(migrations_named_in "$dry_log")"

if [ -z "$pending" ]; then
  echo "No pending migrations; the staging database is up to date."
fi

echo "== Applying migrations to staging =="
if ! run_push "$push_log" --yes; then
  {
    echo "### Staging database migrations: push FAILED"
    echo "Some migrations may have been applied before the failure. staging was not moved and the website was not deployed. Check the output below, fix the migration on master, and rerun this workflow from master."
    details "Push output" "$push_log"
  } >> "$summary"
  echo "::error::supabase db push failed against staging. staging was not moved and the website was not deployed."
  exit 1
fi
applied="$(migrations_named_in "$push_log")"
# The push succeeded; if its output did not name the files, the dry run did.
applied="${applied:-$pending}"

{
  echo "### Staging database migrations"
  if [ -z "$applied" ]; then
    echo "None. The staging database was already up to date."
  else
    echo "Applied to staging:"
    echo
    while IFS= read -r name; do
      echo "- \`$name\`"
    done <<< "$applied"
  fi
  details "CLI output" "$push_log"
} >> "$summary"
