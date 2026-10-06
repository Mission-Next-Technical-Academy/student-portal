#!/usr/bin/env bash
# Fast-forward the `staging` branch to `master` (staging-sync.yml, job
# sync-branch). Run from a clone with full history.
#
# Rules this script keeps:
#   - fast-forward only: it never passes --force, so git itself refuses any
#     push that would drop a commit from staging;
#   - it never writes to master; master is only read;
#   - if staging has commits master lacks, it changes nothing and fails.
#
# Usage: bin/ci/sync-staging.sh [remote]     (default remote: origin)
#
# On success it appends to $GITHUB_OUTPUT (when set):
#   before=<staging commit before the run, empty if staging did not exist>
#   sha=<commit staging points at now>
set -euo pipefail

remote="${1:-origin}"
output="${GITHUB_OUTPUT:-/dev/null}"
summary="${GITHUB_STEP_SUMMARY:-/dev/null}"

remote_head() {
  git ls-remote "$remote" "refs/heads/$1" | cut -f1
}

git fetch --no-tags --quiet "$remote" "+refs/heads/master:refs/remotes/$remote/master"
master_sha="$(git rev-parse --verify "refs/remotes/$remote/master^{commit}")"
staging_sha="$(remote_head staging)"

if [ -z "$staging_sha" ]; then
  echo "::notice::The staging branch does not exist yet; creating it at master ${master_sha:0:12}."
  git push --quiet "$remote" "$master_sha:refs/heads/staging"
elif [ "$staging_sha" = "$master_sha" ]; then
  echo "staging already matches master (${master_sha:0:12}); nothing to do."
else
  git fetch --no-tags --quiet "$remote" "+refs/heads/staging:refs/remotes/$remote/staging"
  if ! git merge-base --is-ancestor "$staging_sha" "$master_sha"; then
    echo "::error::staging has commits that are not on master (staging ${staging_sha:0:12}, master ${master_sha:0:12}). Nothing was changed. Get those commits onto master through a pull request, or have a maintainer reset staging by hand, then rerun this workflow from master."
    exit 1
  fi
  echo "Fast-forwarding staging ${staging_sha:0:12} -> ${master_sha:0:12}"
  git push --quiet "$remote" "$master_sha:refs/heads/staging"
fi

synced_sha="$(remote_head staging)"
if [ "$synced_sha" != "$master_sha" ]; then
  echo "::error::After the push, staging is at ${synced_sha:0:12} but master is at ${master_sha:0:12}."
  exit 1
fi
echo "staging and master both point at ${master_sha:0:12}."

{
  echo "before=$staging_sha"
  echo "sha=$master_sha"
} >> "$output"
previous="${staging_sha:-none}"
echo "- \`staging\` now points at \`${master_sha:0:12}\` (was \`${previous:0:12}\`)." >> "$summary"
