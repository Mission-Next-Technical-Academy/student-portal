#!/usr/bin/env bash
# Apply pending migrations to the STAGING database (staging-sync.yml, job
# migrate-staging; staging-test-branch.yml, job migrate, with
# EXPECTED_MIGRATIONS set). Needs STAGING_DB_URL in the environment and the
# Supabase CLI on PATH.
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

# Staging test branch (staging-test-branch.yml): EXPECTED_MIGRATIONS lists
# the branch's new migration files, space-separated. Stop before the real
# push if the dry run names any other file. Fewer is fine: those files were
# applied by an earlier run of the same branch. Set but empty means "expect
# none". Unset (Staging sync) changes nothing.
if [ -n "${EXPECTED_MIGRATIONS+set}" ]; then
  unexpected=""
  while IFS= read -r name; do
    [ -n "$name" ] || continue
    case " $EXPECTED_MIGRATIONS " in
      *" $name "*) ;;
      *) unexpected="$unexpected $name" ;;
    esac
  done <<< "$pending"
  if [ -n "$unexpected" ]; then
    {
      echo "### Staging database migrations: STOPPED after the dry run"
      echo "Nothing was applied. The dry run would also apply migrations that are not this branch's new files:"
      echo
      for name in $unexpected; do
        echo "- \`$name\`"
      done
      echo
      echo "Usually master has migrations staging has not applied yet: run Staging sync from master first, then run this workflow again."
      details "Dry-run output" "$dry_log"
    } >> "$summary"
    echo "::error::The dry run names migrations that are not this branch's new files:$unexpected. Nothing was applied and the website was not deployed. Run Staging sync from master first, then try again."
    exit 1
  fi
  echo "Every pending migration is one of this branch's new files."

  # Never run the real push on a dry run that named no file: if the CLI's
  # wording ever changed so that file names were missing, the push could
  # apply migrations nobody checked. Nothing pending means nothing to do.
  if [ -z "$pending" ]; then
    {
      echo "### Staging database migrations"
      echo "None applied: the dry run named none of this branch's new files, so they are already on staging (an earlier run of this branch). The real push was not run."
      echo
      echo "A migration's content is never re-applied: if you changed the SQL inside a file already on staging, that change is not on staging. See docs/operations/STAGING_AUTOMATION.md."
      details "Dry-run output" "$dry_log"
    } >> "$summary"
    exit 0
  fi
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
