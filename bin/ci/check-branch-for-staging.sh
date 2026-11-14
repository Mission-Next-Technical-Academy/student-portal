#!/usr/bin/env bash
# Preflight for staging-test-branch.yml (job preflight). Uses no secrets and
# runs no code from the branch: it only reads the branch's git objects.
#
# Passes (exit 0) only when the feature branch is safe to put on staging:
#   - the name matches ^(hdesk|shared)/[a-z0-9._-]+$ and is a valid git
#     branch name;
#   - the branch exists on <remote>;
#   - it contains the remote master tip (so it carries every master
#     migration and the dry run can only add the branch's own files);
#   - against master, every change under supabase/migrations/ is an Added
#     file (no edits, deletes or renames: renames count as delete + add),
#     a plain file (no symlinks, no subfolders), named
#     <14 digits>_<lowercase words>.sql, and sorting after master's newest
#     migration.
# Changes under supabase/functions/ do not fail the check; they are listed
# in the job summary as "deploy by hand".
#
# Usage: bin/ci/check-branch-for-staging.sh <remote> <branch>
#
# On success it appends to $GITHUB_OUTPUT (when set):
#   sha=<the branch's full commit SHA, the one migrated and deployed>
#   migrations=<the added migration file names, space-separated; may be empty>
#   has_migrations=true|false
set -euo pipefail

remote="${1:?usage: check-branch-for-staging.sh <remote> <branch>}"
branch="${2:?usage: check-branch-for-staging.sh <remote> <branch>}"
output="${GITHUB_OUTPUT:-/dev/null}"
summary="${GITHUB_STEP_SUMMARY:-/dev/null}"
here="$(dirname "$0")"
export LC_ALL=C

fail() {
  echo "::error::$1 Nothing was changed: no migration ran and the website was not deployed."
  {
    echo "### Staging test branch: preflight FAILED"
    echo "$1"
  } >> "$summary"
  exit 1
}

# The name is checked before git ever sees it.
if ! [[ "$branch" =~ ^(hdesk|shared)/[a-z0-9._-]+$ ]] \
   || ! git check-ref-format "refs/heads/$branch"; then
  fail "The branch name must look like hdesk/<words> or shared/<words> (lowercase letters, digits, . _ -). Put just the branch name in the ref box."
fi

sha="$(git ls-remote "$remote" "refs/heads/$branch" | cut -f1)"
if [ -z "$sha" ]; then
  fail "Branch $branch does not exist on GitHub. Push it first."
fi
if ! [[ "$sha" =~ ^[0-9a-f]{40}$ ]]; then
  fail "Could not read a full commit SHA for $branch."
fi

git fetch --no-tags --quiet "$remote" \
  "+refs/heads/master:refs/remotes/$remote/master" \
  "+refs/heads/$branch:refs/remotes/$remote/staging-test-branch"
master_sha="$(git rev-parse --verify "refs/remotes/$remote/master^{commit}")"
fetched="$(git rev-parse --verify "refs/remotes/$remote/staging-test-branch^{commit}")"
if [ "$fetched" != "$sha" ]; then
  fail "Branch $branch moved while it was being checked (${sha:0:12} -> ${fetched:0:12}). Run this workflow again."
fi

if ! git merge-base --is-ancestor "$master_sha" "$sha"; then
  fail "Branch $branch does not contain the latest master (${master_sha:0:12}). Update it from master, push, and run this workflow again."
fi

newest="$(git ls-tree --name-only "$master_sha" supabase/migrations/ \
  | sed 's#.*/##' | grep '\.sql$' | sort | tail -n 1 || true)"

migrations=()
while IFS=$'\t' read -r status file; do
  [ -n "$status" ] || continue
  name="${file#supabase/migrations/}"
  if [ "$status" != "A" ]; then
    fail "Branch $branch changes $file (git status $status). Only new migration files may go to staging this way; a migration already on master is never edited, deleted or renamed."
  fi
  if ! [[ "$name" =~ ^[0-9]{14}_[a-z0-9_]+\.sql$ ]]; then
    fail "Branch $branch adds $file. A migration must sit directly in supabase/migrations/ and be named <14-digit timestamp>_<lowercase_words>.sql."
  fi
  mode="$(git ls-tree "$sha" -- "$file" | cut -d' ' -f1)"
  if [ "$mode" != "100644" ]; then
    fail "Branch $branch adds $file as something other than a plain file (git mode $mode). Symlinks and executable files are refused."
  fi
  if [ -n "$newest" ] && ! [[ "$name" > "$newest" ]]; then
    fail "Branch $branch adds $name, which sorts before master's newest migration $newest. Create it again with a newer timestamp (supabase migration new) before testing on staging."
  fi
  migrations+=("$name")
done < <(git diff --no-renames --name-status "$master_sha" "$sha" -- supabase/migrations/)

has_migrations=false
[ "${#migrations[@]}" -eq 0 ] || has_migrations=true
list=""
[ "$has_migrations" = false ] || list="${migrations[*]}"

{
  echo "### Staging test branch: \`$branch\`"
  echo "- Commit: \`$sha\` (contains master \`${master_sha:0:12}\`)"
  if [ "$has_migrations" = true ]; then
    echo "- New migrations to apply to the staging database:"
    for name in "${migrations[@]}"; do
      echo "  - \`$name\`"
    done
  else
    echo "- No new migrations: the staging database is not touched."
  fi
} >> "$summary"

functions="$("$here/functions-reminder.sh" "$master_sha" "$sha")"
if [ -n "$functions" ]; then
  {
    echo
    echo "$functions"
    echo
    echo "This run does **not** deploy Edge Functions: deploy them by hand, from a checkout of this branch, before testing."
  } >> "$summary"
  echo "::warning::Branch $branch changes Edge Functions. They are not deployed by this run: deploy them by hand (commands in the run summary)."
fi

echo "Preflight passed for $branch at ${sha:0:12}: ${list:-no new migrations}."
{
  echo "sha=$sha"
  echo "migrations=$list"
  echo "has_migrations=$has_migrations"
} >> "$output"
