#!/usr/bin/env bash
# Print a Markdown reminder listing the Supabase Edge Functions that changed
# between two commits, with the exact manual commands to deploy them to
# staging. It deploys nothing. Used by staging-sync.yml (job summary) and
# supabase-change-reminder.yml (pull request comment).
#
# Usage: bin/ci/functions-reminder.sh <old commit> <new commit>
# Prints nothing when no function changed.
set -euo pipefail

# shellcheck source=bin/ci/supabase-refs.sh
source "$(dirname "$0")/supabase-refs.sh"

old="${1:?usage: functions-reminder.sh <old commit> <new commit>}"
new="${2:?usage: functions-reminder.sh <old commit> <new commit>}"

changed="$(git diff --name-only "$old" "$new" -- supabase/functions/ \
  | cut -d/ -f3 | sort -u)"
[ -n "$changed" ] || exit 0

# A change to _shared affects every function that imports it, so list them
# all; listing one too many is cheaper than a stale function on staging.
if grep -qx '_shared' <<< "$changed"; then
  changed="$(git ls-tree -d --name-only "$new" supabase/functions/ | cut -d/ -f3; echo "$changed")"
fi

deploy=()
removed=()
while IFS= read -r name; do
  [ -n "$name" ] && [ "$name" != "_shared" ] || continue
  # Only directories are functions; skip loose files such as deno.json.
  if [ "$(git cat-file -t "$new:supabase/functions/$name" 2>/dev/null)" = tree ]; then
    deploy+=("$name")
  elif [ "$(git cat-file -t "$old:supabase/functions/$name" 2>/dev/null)" = tree ]; then
    removed+=("$name")
  fi
done < <(sort -u <<< "$changed")

[ "${#deploy[@]}" -gt 0 ] || [ "${#removed[@]}" -gt 0 ] || exit 0

echo "### Supabase Edge Functions changed: deploy them to staging by hand"
echo
echo "Functions are never deployed automatically. From a checkout that contains this change, run each command below, then test on staging:"
echo
if [ "${#deploy[@]}" -gt 0 ]; then
  echo '```'
  for name in "${deploy[@]}"; do
    echo "supabase functions deploy $name --project-ref $SUPABASE_STAGING_REF"
  done
  echo '```'
fi
if [ "${#removed[@]}" -gt 0 ]; then
  echo
  echo "Removed from the repository (not deleted from staging automatically):"
  for name in "${removed[@]}"; do
    echo "- \`$name\`: \`supabase functions delete $name --project-ref $SUPABASE_STAGING_REF\`"
  done
fi
echo
echo "Never use \`--project-ref $SUPABASE_PRODUCTION_REF\` (production) for this."
