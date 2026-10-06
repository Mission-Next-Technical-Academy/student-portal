#!/usr/bin/env bash
# Print the staging-first checklist that supabase-change-reminder.yml posts on
# pull requests touching supabase/. Read-only: it only runs git diff.
#
# Usage: bin/ci/supabase-change-reminder.sh <base commit> <head commit>
set -euo pipefail

# shellcheck source=bin/ci/supabase-refs.sh
source "$(dirname "$0")/supabase-refs.sh"

base="${1:?usage: supabase-change-reminder.sh <base commit> <head commit>}"
head="${2:?usage: supabase-change-reminder.sh <base commit> <head commit>}"
here="$(dirname "$0")"

# Three-dot: only what this pull request changes, not what master gained since.
merge_base="$(git merge-base "$base" "$head")"
migrations="$(git diff --name-only --diff-filter=d "$merge_base" "$head" -- supabase/migrations/ | grep '\.sql$' || true)"

# The marker lets the workflow find and update this comment instead of adding
# a second one.
echo "<!-- supabase-change-reminder -->"
echo "### Supabase change: test on staging before merging"
echo
echo "This pull request changes files under \`supabase/\`. Staging-first rule: everything below happens on **staging** (\`$SUPABASE_STAGING_REF\`) and is tested there **before** this is merged. Never use the production project (\`$SUPABASE_PRODUCTION_REF\`) for this."
echo
if [ -n "$migrations" ]; then
  echo "- [ ] Apply these migrations to staging and test the affected pages there:"
  while IFS= read -r file; do
    echo "  - \`$(basename "$file")\`"
  done <<< "$migrations"
  echo "  Preview first with \`supabase db push --project-ref $SUPABASE_STAGING_REF --dry-run\`, then run it without \`--dry-run\`."
else
  echo "- [ ] No new or changed migrations. If this changes the database some other way, test that on staging."
fi

functions="$("$here/functions-reminder.sh" "$merge_base" "$head")"
if [ -n "$functions" ]; then
  echo "- [ ] Deploy the changed Edge Functions to staging and test them (commands below)."
else
  echo "- [ ] No Edge Functions changed."
fi
echo "- [ ] Rollback note in the pull request description: how to undo this on staging and production. Migrations only go forward, so a rollback is a new migration that reverses this one; a function rollback is redeploying the previous version of its folder."
echo
echo "After merge, the **Staging sync** workflow fast-forwards \`staging\`, applies any migration still pending on staging, and redeploys the staging website. It never deploys Edge Functions, and it never touches production."
if [ -n "$functions" ]; then
  echo
  echo "$functions"
fi
