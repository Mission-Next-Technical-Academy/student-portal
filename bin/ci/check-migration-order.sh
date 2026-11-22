#!/usr/bin/env bash
# Fails when a branch adds a migration whose 14-digit timestamp is not after
# the newest one on master. `supabase db push` refuses such a file, so it
# would break Staging sync after the merge. Read-only: it only reads git
# objects, never fetches, and runs no code from the branch.
#
# Usage: bin/ci/check-migration-order.sh [<base> <head>]
#   No arguments: compares HEAD with origin/master. When HEAD is already on
#   origin/master (a push to master, a deploy of a master commit), it compares
#   HEAD with its first parent instead.
#   Two commits: compares exactly those (check-branch-for-staging.sh).
#
# Exit 0: nothing added, or every added file is newer. Exit 1: one is not, or
# the commits can't be read (a missing base must never look like a pass).
set -euo pipefail
export LC_ALL=C

cannot_check() {
  echo "Migration order could not be checked: $1" >&2
  exit 1
}

base="${1:-origin/master}"
head="${2:-HEAD}"

head_sha="$(git rev-parse --verify --quiet "$head^{commit}")" \
  || cannot_check "$head is not a commit here."
base_sha="$(git rev-parse --verify --quiet "$base^{commit}")" \
  || cannot_check "$base is not a commit here. Run: git fetch origin master (in a workflow: checkout with fetch-depth: 0)."

if [ "$#" -eq 0 ] && git merge-base --is-ancestor "$head_sha" "$base_sha"; then
  base="the first parent of $head"
  base_sha="$(git rev-parse --verify --quiet "$head_sha^1^{commit}")" \
    || cannot_check "$base is not in this checkout. In a workflow: checkout with fetch-depth: 0."
fi

# Direct children only: the Supabase CLI ignores subfolders. The three dots
# diff from where the branch started, so a file that master renamed after that
# is not mistaken for one the branch adds.
added="$(git diff --no-renames --diff-filter=A --name-only "$base_sha...$head_sha" -- ':(glob)supabase/migrations/*.sql')" \
  || cannot_check "no common history between $base and $head. In a workflow: checkout with fetch-depth: 0."
on_base="$(git ls-tree --name-only "$base_sha" supabase/migrations/)"
newest="$(printf '%s\n' "$on_base" | sed 's#.*/##' | grep -E '^[0-9]{14}_.*\.sql$' | sort | tail -n 1 || true)"
newest_ts="${newest:0:14}"

count=0
failed=0
while IFS= read -r file; do
  [ -n "$file" ] || continue
  # Added on both sides (for example, the branch already merged): not new.
  if grep -Fxq -- "$file" <<< "$on_base"; then continue; fi
  count=$((count + 1))
  name="${file##*/}"
  ts="${name:0:14}"
  if ! [[ "$name" =~ ^[0-9]{14}_ ]]; then
    echo "Adds $file, which does not start with a 14-digit timestamp and an underscore, so its order can't be checked."
    failed=1
  elif [ -n "$newest" ] && [[ "$ts" < "$newest_ts" ]]; then
    echo "Adds $file, which sorts before master's newest migration $newest (timestamp $ts; master's newest is $newest_ts)."
    failed=1
  elif [ -n "$newest" ] && [ "$ts" = "$newest_ts" ]; then
    echo "Adds $file, which has the same timestamp as master's newest migration $newest (timestamp $ts; master's newest is $newest_ts)."
    failed=1
  fi
done <<< "$added"

if [ "$failed" -ne 0 ]; then
  echo "Migration order check failed, compared with $base (${base_sha:0:12}). Create each file above again with a newer timestamp (supabase migration new), unless it already reached staging or production: then ask first."
  exit 1
fi
echo "Migration order OK: $count new migration(s) compared with $base (${base_sha:0:12}); newest there: ${newest:-none}."
