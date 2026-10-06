#!/usr/bin/env bash
# Fast-forward the `staging` branch to a commit on `master` (staging-sync.yml,
# job sync-branch). That job runs only after migrate-staging applied this
# commit's migrations, so staging never moves ahead of its database. Run from
# a clone with full history.
#
# Rules this script keeps:
#   - the target must already be on master;
#   - fast-forward only: it never passes --force, so git itself refuses any
#     push that would drop a commit from staging;
#   - it never writes to master; master is only read;
#   - if staging has commits master lacks, it changes nothing and fails;
#   - functions gate: if the commits staging would gain change
#     supabase/functions/, it changes nothing and fails, listing the manual
#     deploy commands, unless FUNCTIONS_DEPLOYED=true (a person confirmed
#     they deployed them to staging).
#
# Usage: bin/ci/sync-staging.sh <remote> <target commit>
#
# On success it appends to $GITHUB_OUTPUT (when set):
#   before=<staging commit before the run, empty if staging did not exist>
#   sha=<commit staging points at now>
set -euo pipefail

remote="${1:?usage: sync-staging.sh <remote> <target commit>}"
target_arg="${2:?usage: sync-staging.sh <remote> <target commit>}"
output="${GITHUB_OUTPUT:-/dev/null}"
summary="${GITHUB_STEP_SUMMARY:-/dev/null}"
here="$(dirname "$0")"

remote_head() {
  git ls-remote "$remote" "refs/heads/$1" | cut -f1
}

git fetch --no-tags --quiet "$remote" "+refs/heads/master:refs/remotes/$remote/master"
master_sha="$(git rev-parse --verify "refs/remotes/$remote/master^{commit}")"
target="$(git rev-parse --verify "$target_arg^{commit}")"
if ! git merge-base --is-ancestor "$target" "$master_sha"; then
  echo "::error::Commit ${target:0:12} is not on master. Staging only ever moves to master's commits. Nothing was changed."
  exit 1
fi

staging_sha="$(remote_head staging)"
synced="$target"

if [ -z "$staging_sha" ]; then
  echo "::notice::The staging branch does not exist yet; creating it at ${target:0:12}."
  git push --quiet "$remote" "$target:refs/heads/staging"
elif [ "$staging_sha" = "$target" ]; then
  echo "staging already points at ${target:0:12}; nothing to do."
else
  git fetch --no-tags --quiet "$remote" "+refs/heads/staging:refs/remotes/$remote/staging"
  if git merge-base --is-ancestor "$target" "$staging_sha" \
     && git merge-base --is-ancestor "$staging_sha" "$master_sha"; then
    # A newer run already moved staging past this commit; never move it back.
    echo "::notice::staging (${staging_sha:0:12}) already includes ${target:0:12}; leaving it where it is."
    synced="$staging_sha"
  elif ! git merge-base --is-ancestor "$staging_sha" "$target"; then
    echo "::error::staging has commits that are not on master (staging ${staging_sha:0:12}, master ${master_sha:0:12}). Nothing was changed. Get those commits onto master through a pull request, or have a maintainer reset staging by hand, then rerun this workflow from master."
    exit 1
  else
    functions="$("$here/functions-reminder.sh" "$staging_sha" "$target")"
    if [ -n "$functions" ]; then
      echo "$functions" >> "$summary"
      if [ "${FUNCTIONS_DEPLOYED:-}" != "true" ]; then
        {
          echo
          echo "**staging was not moved.** Deploy the functions above to staging, then run this workflow again from \`master\` with **functions_deployed** ticked."
        } >> "$summary"
        echo "$functions"
        echo "::error::These commits change Edge Functions, which are deployed by hand. staging was not moved and the website was not deployed (migrations already ran). Deploy the functions listed in the run summary to staging, then rerun this workflow from master with functions_deployed ticked."
        exit 1
      fi
      echo "Edge Function changes confirmed deployed to staging by ${GITHUB_ACTOR:-the person who started this run}." | tee -a "$summary"
    fi
    echo "Fast-forwarding staging ${staging_sha:0:12} -> ${target:0:12}"
    git push --quiet "$remote" "$target:refs/heads/staging"
  fi
fi

now="$(remote_head staging)"
if [ "$now" != "$synced" ]; then
  echo "::error::After the run, staging is at ${now:0:12}, expected ${synced:0:12}."
  exit 1
fi
echo "staging points at ${synced:0:12} (master is at ${master_sha:0:12})."

{
  echo "before=$staging_sha"
  echo "sha=$synced"
} >> "$output"
previous="${staging_sha:-none}"
echo "- \`staging\` now points at \`${synced:0:12}\` (was \`${previous:0:12}\`)." >> "$summary"
