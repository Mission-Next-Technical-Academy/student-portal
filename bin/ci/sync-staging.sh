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
#   - if staging is already past the target (a later master commit), it
#     changes nothing and fails: this run only migrated the target, so it
#     cannot prove staging's own commit has its migrations;
#   - functions gate: if the commits staging would gain change
#     supabase/functions/, it changes nothing and fails, listing the manual
#     deploy commands, unless FUNCTIONS_DEPLOYED=true (a person confirmed
#     they deployed them to staging). When staging does not exist yet, every
#     function in the target counts (no known baseline), so the branch is
#     only created once a person confirms them too.
#
# Usage: bin/ci/sync-staging.sh <remote> <target commit>
#
# On success it appends to $GITHUB_OUTPUT (when set):
#   before=<staging commit before the run, empty if staging did not exist>
#   synced=true   staging now points at exactly the target, and
#   sha=<target>  the full commit to deploy.
set -euo pipefail

remote="${1:?usage: sync-staging.sh <remote> <target commit>}"
target_arg="${2:?usage: sync-staging.sh <remote> <target commit>}"
output="${GITHUB_OUTPUT:-/dev/null}"
summary="${GITHUB_STEP_SUMMARY:-/dev/null}"
here="$(dirname "$0")"

remote_head() {
  git ls-remote "$remote" "refs/heads/$1" | cut -f1
}

# Usage: functions_gate <staging commit, or the empty tree> <what happens>
# Fails (exit 1) when the target adds or changes Edge Functions since
# <from>, unless FUNCTIONS_DEPLOYED=true. A change to _shared alone, with
# no function folders, needs nothing.
functions_gate() {
  local from="$1" outcome="$2" functions
  functions="$("$here/functions-reminder.sh" "$from" "$target")"
  [ -n "$functions" ] || return 0
  echo "$functions" >> "$summary"
  if [ "${FUNCTIONS_DEPLOYED:-}" != "true" ]; then
    {
      echo
      echo "**staging was $outcome.** Deploy the functions above to staging, then run this workflow again from \`master\` with **functions_deployed** ticked."
    } >> "$summary"
    echo "$functions"
    echo "::error::These commits change Edge Functions, which are deployed by hand. staging was $outcome and the website was not deployed (migrations already ran). Deploy the functions listed in the run summary to staging, then rerun this workflow from master with functions_deployed ticked."
    exit 1
  fi
  echo "Edge Function changes confirmed deployed to staging by ${GITHUB_ACTOR:-the person who started this run}." | tee -a "$summary"
}

git fetch --no-tags --quiet "$remote" "+refs/heads/master:refs/remotes/$remote/master"
master_sha="$(git rev-parse --verify "refs/remotes/$remote/master^{commit}")"
target="$(git rev-parse --verify "$target_arg^{commit}")"
if ! git merge-base --is-ancestor "$target" "$master_sha"; then
  echo "::error::Commit ${target:0:12} is not on master. Staging only ever moves to master's commits. Nothing was changed."
  exit 1
fi

staging_sha="$(remote_head staging)"

if [ -z "$staging_sha" ]; then
  # No staging yet, so no known baseline: compare against an empty tree,
  # which makes every function in the target count as changed.
  functions_gate "$(git hash-object -t tree /dev/null)" "not created"
  echo "::notice::The staging branch does not exist yet; creating it at ${target:0:12}."
  git push --quiet "$remote" "$target:refs/heads/staging"
elif [ "$staging_sha" = "$target" ]; then
  echo "staging already points at ${target:0:12}; nothing to do."
else
  git fetch --no-tags --quiet "$remote" "+refs/heads/staging:refs/remotes/$remote/staging"
  if git merge-base --is-ancestor "$target" "$staging_sha" \
     && git merge-base --is-ancestor "$staging_sha" "$master_sha"; then
    # staging is already at a later master commit. Never move it back, and
    # never deploy it: this run only applied the target's migrations.
    message="staging (${staging_sha:0:12}) is ahead of this run's commit (${target:0:12}), so this run can't prove staging's migrations were applied. Fix: run Staging sync from master (Actions → Staging sync → Run workflow → Branch: master). That run migrates through the latest master commit and redeploys."
    echo "::error::$message"
    echo "- $message" >> "$summary"
    exit 1
  elif ! git merge-base --is-ancestor "$staging_sha" "$target"; then
    echo "::error::staging has commits that are not on master (staging ${staging_sha:0:12}, master ${master_sha:0:12}). Nothing was changed. If they are wanted, get them onto master through a pull request and rerun this workflow from master; if not, ask Randy or Alex. Never move staging by hand."
    exit 1
  else
    functions_gate "$staging_sha" "not moved"
    echo "Fast-forwarding staging ${staging_sha:0:12} -> ${target:0:12}"
    git push --quiet "$remote" "$target:refs/heads/staging"
  fi
fi

now="$(remote_head staging)"
if [ "$now" != "$target" ]; then
  echo "::error::After the run, staging is at ${now:0:12}, expected ${target:0:12}."
  exit 1
fi
echo "staging points at ${target:0:12} (master is at ${master_sha:0:12})."

{
  echo "before=$staging_sha"
  echo "synced=true"
  echo "sha=$target"
} >> "$output"
previous="${staging_sha:-none}"
echo "- \`staging\` now points at \`${target:0:12}\` (was \`${previous:0:12}\`)." >> "$summary"
