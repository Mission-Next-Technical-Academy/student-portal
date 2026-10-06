// Staging automation (staging-sync.yml, supabase-change-reminder.yml).
// Exercises the bin/ci/ scripts with throwaway git repositories and fake
// connection strings, and checks the workflows' secret boundaries. Never
// touches the network, GitHub, or a real database.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PRODUCTION_REF, STAGING_REF } = require('../bin/lib/supabase-target');

const ROOT = path.resolve(__dirname, '..');
const CI = path.join(ROOT, 'bin', 'ci');
const WORKFLOWS = path.join(ROOT, '.github', 'workflows');
const FAKE_PASSWORD = 'fake-password-must-never-print';

// The scripts' single source of project refs must agree with the JS guard.
const refsFile = fs.readFileSync(path.join(CI, 'supabase-refs.sh'), 'utf8');
assert.match(refsFile, new RegExp(`^readonly SUPABASE_PRODUCTION_REF=${PRODUCTION_REF}$`, 'm'));
assert.match(refsFile, new RegExp(`^readonly SUPABASE_STAGING_REF=${STAGING_REF}$`, 'm'));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'staging-sync-test-'));
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));

function run(cmd, args, { cwd = ROOT, env = {} } = {}) {
  const res = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH,
      HOME: tmp,
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
      GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.invalid',
      ...env,
    },
  });
  return { status: res.status, out: `${res.stdout}${res.stderr}` };
}
function git(cwd, ...args) {
  const res = run('git', args, { cwd });
  assert.equal(res.status, 0, `git ${args.join(' ')} failed:\n${res.out}`);
  return res.out.trim();
}
function commit(cwd, file, content) {
  fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
  fs.writeFileSync(path.join(cwd, file), content);
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', `edit ${file}`);
  return git(cwd, 'rev-parse', 'HEAD');
}
const readOutputs = (file) => Object.fromEntries(
  fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((line) => line.split('=')),
);

// ---------------------------------------------------------------- sync-staging.sh
function syncFixture(name) {
  const remote = path.join(tmp, `${name}.git`);
  const work = path.join(tmp, name);
  git(tmp, 'init', '-q', '--bare', '-b', 'master', remote);
  git(tmp, 'clone', '-q', remote, work);
  git(work, 'checkout', '-q', '-b', 'master');
  return { remote, work };
}
const remoteSha = (remote, branch) => git(remote, 'rev-parse', `refs/heads/${branch}`);
function sync(work, name, target, env = {}) {
  const output = path.join(tmp, `${name}.out`);
  const summary = path.join(tmp, `${name}.summary`);
  fs.writeFileSync(output, '');
  fs.writeFileSync(summary, '');
  const res = run('bash', [path.join(CI, 'sync-staging.sh'), 'origin', target], {
    cwd: work, env: { GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary, ...env },
  });
  return { ...res, outputs: readOutputs(output), summary: fs.readFileSync(summary, 'utf8') };
}

{ // Fast-forward: staging behind master moves to the target; master untouched.
  const { remote, work } = syncFixture('ff');
  const first = commit(work, 'a.txt', '1');
  git(work, 'push', '-q', 'origin', 'master', 'master:staging');
  const second = commit(work, 'a.txt', '2');
  git(work, 'push', '-q', 'origin', 'master');

  const res = sync(work, 'ff', second);
  assert.equal(res.status, 0, res.out);
  assert.equal(remoteSha(remote, 'staging'), second);
  assert.equal(remoteSha(remote, 'master'), second);
  assert.deepEqual(res.outputs, { before: first, sha: second });

  // Already equal: success, nothing changes.
  const again = sync(work, 'ff-again', second);
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /already points at/);
  assert.equal(remoteSha(remote, 'staging'), second);
  assert.equal(remoteSha(remote, 'master'), second);
  assert.deepEqual(again.outputs, { before: second, sha: second });

  // An older run (staging already past its commit) never moves staging back.
  const older = sync(work, 'ff-older', first);
  assert.equal(older.status, 0, older.out);
  assert.match(older.out, /already includes/);
  assert.equal(remoteSha(remote, 'staging'), second);
  assert.deepEqual(older.outputs, { before: second, sha: second });
}

{ // Only the migrated commit is synced, even when master has moved on.
  const { remote, work } = syncFixture('pinned');
  const first = commit(work, 'a.txt', '1');
  git(work, 'push', '-q', 'origin', 'master', 'master:staging');
  const migrated = commit(work, 'a.txt', '2');
  const newer = commit(work, 'a.txt', '3');
  git(work, 'push', '-q', 'origin', 'master');
  const res = sync(work, 'pinned', migrated);
  assert.equal(res.status, 0, res.out);
  assert.equal(remoteSha(remote, 'staging'), migrated);
  assert.equal(remoteSha(remote, 'master'), newer);
  assert.deepEqual(res.outputs, { before: first, sha: migrated });
}

{ // A target that is not on master is refused; nothing changes.
  const { remote, work } = syncFixture('offmaster');
  const base = commit(work, 'a.txt', '1');
  git(work, 'push', '-q', 'origin', 'master', 'master:staging');
  git(work, 'checkout', '-q', '-b', 'feature');
  const feature = commit(work, 'feature.txt', 'x');
  git(work, 'push', '-q', 'origin', 'feature');
  const res = sync(work, 'offmaster', feature);
  assert.equal(res.status, 1, res.out);
  assert.match(res.out, /::error::Commit \w+ is not on master/);
  assert.equal(remoteSha(remote, 'staging'), base);
  assert.equal(remoteSha(remote, 'master'), base);
}

{ // Diverged: staging has its own commit -> fail, nothing changes.
  const { remote, work } = syncFixture('diverged');
  commit(work, 'a.txt', '1');
  git(work, 'push', '-q', 'origin', 'master');
  git(work, 'checkout', '-q', '-b', 'staging');
  const stagingOnly = commit(work, 'staging-only.txt', 'x');
  git(work, 'push', '-q', 'origin', 'staging');
  git(work, 'checkout', '-q', 'master');
  const masterTip = commit(work, 'a.txt', '2');
  git(work, 'push', '-q', 'origin', 'master');

  const res = sync(work, 'diverged', masterTip);
  assert.equal(res.status, 1, res.out);
  assert.match(res.out, /::error::staging has commits that are not on master[\s\S]*Nothing was changed/);
  assert.equal(remoteSha(remote, 'staging'), stagingOnly);
  assert.equal(remoteSha(remote, 'master'), masterTip);
  assert.deepEqual(res.outputs, {});
}

{ // Missing staging branch: created at the target.
  const { remote, work } = syncFixture('missing');
  const tip = commit(work, 'a.txt', '1');
  git(work, 'push', '-q', 'origin', 'master');
  const res = sync(work, 'missing', tip);
  assert.equal(res.status, 0, res.out);
  assert.equal(remoteSha(remote, 'staging'), tip);
  assert.deepEqual(res.outputs, { before: '', sha: tip });
}

{ // Functions gate: Edge Function changes hold staging until confirmed.
  const { remote, work } = syncFixture('functions');
  const before = commit(work, 'supabase/functions/alpha/index.ts', '1');
  git(work, 'push', '-q', 'origin', 'master', 'master:staging');
  const changed = commit(work, 'supabase/functions/alpha/index.ts', '2');
  git(work, 'push', '-q', 'origin', 'master');

  for (const flag of [undefined, '', 'false']) {
    const held = sync(work, `functions-held-${flag}`, changed, flag === undefined ? {} : { FUNCTIONS_DEPLOYED: flag });
    assert.equal(held.status, 1, held.out);
    assert.match(held.out, /::error::These commits change Edge Functions[\s\S]*functions_deployed/);
    assert.match(held.summary, new RegExp(`supabase functions deploy alpha --project-ref ${STAGING_REF}`));
    assert.match(held.summary, /staging was not moved/);
    assert.equal(remoteSha(remote, 'staging'), before, 'staging must not move');
    assert.deepEqual(held.outputs, {});
  }

  const confirmed = sync(work, 'functions-confirmed', changed, { FUNCTIONS_DEPLOYED: 'true', GITHUB_ACTOR: 'tester' });
  assert.equal(confirmed.status, 0, confirmed.out);
  assert.match(confirmed.summary, /confirmed deployed to staging by tester/);
  assert.equal(remoteSha(remote, 'staging'), changed);
  assert.deepEqual(confirmed.outputs, { before, sha: changed });
}

// ----------------------------------------------------------- check-staging-db-url.sh
const stagingUrl = `postgresql://postgres.${STAGING_REF}:${FAKE_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
const productionUrl = `postgresql://postgres.${PRODUCTION_REF}:${FAKE_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
function guard(value) {
  const env = {};
  if (value !== undefined) env.STAGING_DB_URL = value;
  const res = run('bash', [path.join(CI, 'check-staging-db-url.sh')], { env });
  assert.ok(!res.out.includes(FAKE_PASSWORD), `guard printed the secret:\n${res.out}`);
  assert.ok(!res.out.includes('postgresql://'), `guard printed the connection string:\n${res.out}`);
  return res;
}
{
  // Missing: fail clearly, so staging never moves ahead of an unmigrated database.
  for (const value of [undefined, '']) {
    const missing = guard(value);
    assert.equal(missing.status, 1, missing.out);
    assert.match(missing.out, /::error::STAGING_DB_URL is not set[\s\S]*staging was not moved/);
  }

  const staging = guard(stagingUrl);
  assert.equal(staging.status, 0, staging.out);

  for (const [name, value] of [
    ['production', productionUrl],
    ['both', `${stagingUrl}?x=${PRODUCTION_REF}`],
    ['neither', `postgresql://postgres.abcdefghijklmnopqrst:${FAKE_PASSWORD}@db.example.invalid:5432/postgres`],
  ]) {
    const res = guard(value);
    assert.equal(res.status, 1, `${name} should be refused:\n${res.out}`);
    assert.match(res.out, /::error::/);
  }
}

// --------------------------------------------------------------- migrate-staging.sh
// A fake `supabase` CLI records how it was called and prints canned output.
const migrations = fs.readdirSync(path.join(ROOT, 'supabase', 'migrations')).filter((f) => f.endsWith('.sql')).sort();
const pendingMigration = migrations[migrations.length - 1];
const fakeBin = path.join(tmp, 'fake-bin');
fs.mkdirSync(fakeBin);
fs.writeFileSync(path.join(fakeBin, 'supabase'), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$FAKE_SUPABASE_CALLS"
case "$FAKE_SUPABASE_MODE:$*" in
  pending:*--dry-run*) printf 'DRY RUN: migrations will *not* be pushed to the database.\\nWould push these migrations:\\n \\u2022 %s\\n' "$FAKE_PENDING" ;;
  pending:*) printf 'Applying migration %s...\\nFinished supabase db push.\\n' "$FAKE_PENDING" ;;
  none:*) echo 'Remote database is up to date.' ;;
  fail:*) echo "failed to connect to $STAGING_DB_URL (host=aws-0-us-east-1.pooler.supabase.com user=postgres.${STAGING_REF})" >&2; exit 1 ;;
esac
`, { mode: 0o755 });
function migrate(mode, dbUrl = stagingUrl) {
  const calls = path.join(tmp, `calls-${mode}`);
  const summary = path.join(tmp, `summary-${mode}`);
  fs.writeFileSync(calls, '');
  fs.writeFileSync(summary, '');
  const res = run('bash', [path.join(CI, 'migrate-staging.sh')], {
    env: {
      PATH: `${fakeBin}:${process.env.PATH}`,
      STAGING_DB_URL: dbUrl,
      GITHUB_STEP_SUMMARY: summary,
      FAKE_SUPABASE_MODE: mode,
      FAKE_SUPABASE_CALLS: calls,
      FAKE_PENDING: pendingMigration,
    },
  });
  const summaryText = fs.readFileSync(summary, 'utf8');
  for (const text of [res.out, summaryText]) {
    assert.ok(!text.includes(FAKE_PASSWORD), `migrate printed the secret:\n${text}`);
    assert.ok(!text.includes('pooler.supabase.com'), `migrate printed the host:\n${text}`);
  }
  return { ...res, summary: summaryText, calls: fs.readFileSync(calls, 'utf8').trim().split('\n').filter(Boolean) };
}
{
  const pending = migrate('pending');
  assert.equal(pending.status, 0, pending.out);
  assert.equal(pending.calls.length, 2, 'dry run, then one real push');
  assert.match(pending.calls[0], /^db push --db-url \S+ --dry-run$/);
  assert.match(pending.calls[1], /^db push --db-url \S+ --yes$/);
  assert.match(pending.summary, new RegExp(`Applied to staging:[\\s\\S]*${pendingMigration.replace('.', '\\.')}`));

  const none = migrate('none');
  assert.equal(none.status, 0, none.out);
  assert.match(none.summary, /None\. The staging database was already up to date\./);

  const failed = migrate('fail');
  assert.equal(failed.status, 1, failed.out);
  assert.equal(failed.calls.length, 1, 'a failed dry run must stop before the real push');
  assert.match(failed.out, /\[redacted connection string\]/);
  assert.match(failed.summary, /dry run FAILED/);

  const wrongDb = migrate('pending', productionUrl);
  assert.equal(wrongDb.status, 1, wrongDb.out);
  assert.equal(wrongDb.calls.length, 0, 'production must be refused before the CLI runs');
}

// ----------------------------------------------------------- functions-reminder.sh
{
  const repo = path.join(tmp, 'functions-repo');
  git(tmp, 'init', '-q', '-b', 'master', repo);
  commit(repo, 'supabase/functions/alpha/index.ts', '1');
  commit(repo, 'supabase/functions/beta/index.ts', '1');
  commit(repo, 'supabase/functions/_shared/cors.ts', '1');
  const start = commit(repo, 'README.md', 'x');
  const reminder = (from, to) => run('bash', [path.join(CI, 'functions-reminder.sh'), from, to], { cwd: repo });

  const unchanged = reminder(start, start);
  assert.equal(unchanged.status, 0);
  assert.equal(unchanged.out, '', 'no function changes -> no reminder');

  const alphaOnly = commit(repo, 'supabase/functions/alpha/index.ts', '2');
  const one = reminder(start, alphaOnly);
  assert.equal(one.status, 0, one.out);
  assert.match(one.out, new RegExp(`supabase functions deploy alpha --project-ref ${STAGING_REF}`));
  assert.doesNotMatch(one.out, /deploy beta/);
  assert.doesNotMatch(one.out, new RegExp(`deploy \\S+ --project-ref ${PRODUCTION_REF}`));

  const shared = commit(repo, 'supabase/functions/_shared/cors.ts', '2');
  const all = reminder(alphaOnly, shared);
  assert.match(all.out, /deploy alpha/);
  assert.match(all.out, /deploy beta/);
  assert.doesNotMatch(all.out, /deploy _shared/);

  git(repo, 'rm', '-q', '-r', 'supabase/functions/beta');
  git(repo, 'commit', '-q', '-m', 'remove beta');
  const removed = reminder(shared, 'HEAD');
  assert.match(removed.out, /`beta`: `supabase functions delete beta/);
}

// ------------------------------------------- supabase-change-reminder.yml, run locally
// The workflow's inline scripts, run the way Actions runs them (bash -e -o
// pipefail), against a fake `gh` that serves canned API answers.
function runBlock(yaml, after) {
  const lines = yaml.split('\n');
  let i = lines.findIndex((l) => l.includes(after));
  assert.ok(i >= 0, `no step matching ${after}`);
  while (!/^\s+run: \|$/.test(lines[i])) i += 1;
  const indent = lines[i].match(/^\s*/)[0].length + 2;
  const block = [];
  for (i += 1; i < lines.length; i += 1) {
    if (lines[i].trim() && lines[i].match(/^\s*/)[0].length < indent) break;
    block.push(lines[i].slice(indent));
  }
  return block.join('\n');
}
const reminderYaml = fs.readFileSync(path.join(WORKFLOWS, 'supabase-change-reminder.yml'), 'utf8');
const yamlEnv = (name) => new RegExp(`^ +${name}: (\\S+)$`, 'm').exec(reminderYaml)[1];
// The inline refs must match the scripts' single source.
assert.equal(yamlEnv('STAGING_REF'), STAGING_REF);
assert.equal(yamlEnv('PRODUCTION_REF'), PRODUCTION_REF);

const ghBin = path.join(tmp, 'fake-gh');
fs.mkdirSync(ghBin);
fs.writeFileSync(path.join(ghBin, 'gh'), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$FAKE_GH_CALLS"
case "$*" in
  *"-X PATCH"*|*"-X POST"*)
    for arg; do case "$arg" in body=@*) cat "\${arg#body=@}" > "$FAKE_POSTED" ;; esac; done
    exit "\${FAKE_POST_STATUS:-0}" ;;
  *"/pulls/"*"/files"*) [ "\${FAKE_FILES_FAIL:-}" = 1 ] && exit 1; printf '%b' "$FAKE_FILES" ;;
  *"/contents/supabase/functions"*) printf '%b' "$FAKE_DIRS" ;;
  *"/comments"*) [ "\${FAKE_LIST_FAIL:-}" = 1 ] && exit 1; printf '%b' "\${FAKE_EXISTING:-}" ;;
esac
`, { mode: 0o755 });

function actionsRun(name, script, env) {
  const dir = path.join(tmp, `actions-${name}`);
  fs.mkdirSync(dir);
  const file = path.join(dir, 'step.sh');
  fs.writeFileSync(file, script);
  const files = Object.fromEntries(['output', 'summary', 'calls', 'posted'].map((k) => [k, path.join(dir, k)]));
  for (const f of Object.values(files)) fs.writeFileSync(f, '');
  const res = run('bash', ['--noprofile', '--norc', '-eo', 'pipefail', file], {
    env: {
      PATH: `${ghBin}:${process.env.PATH}`,
      RUNNER_TEMP: dir,
      GITHUB_OUTPUT: files.output,
      GITHUB_STEP_SUMMARY: files.summary,
      GITHUB_REPOSITORY: 'example/student-portal',
      GH_TOKEN: 'fake',
      PR_NUMBER: '7',
      FAKE_GH_CALLS: files.calls,
      FAKE_POSTED: files.posted,
      ...env,
    },
  });
  const read = (k) => fs.readFileSync(files[k], 'utf8');
  return { ...res, output: read('output'), summary: read('summary'), calls: read('calls'), posted: read('posted') };
}
{
  const checklistScript = runBlock(reminderYaml, 'id: build');
  const refsEnv = { STAGING_REF: yamlEnv('STAGING_REF'), PRODUCTION_REF: yamlEnv('PRODUCTION_REF'), HEAD_SHA: 'abc123' };
  const files = [
    'added\tsupabase/migrations/20990101000000_example.sql\t',
    'removed\tsupabase/migrations/20000101000000_gone.sql\t',
    'modified\tsupabase/functions/_shared/cors.ts\t',
    'renamed\tsupabase/functions/newname/index.ts\tsupabase/functions/oldname/index.ts',
    'modified\tsupabase/config.toml\t',
  ].join('\\n');

  const res = actionsRun('checklist', checklistScript, {
    ...refsEnv, IS_FORK: 'false', FAKE_FILES: `${files}\\n`, FAKE_DIRS: 'alpha\\nbeta\\nnewname\\n_shared\\n',
  });
  assert.equal(res.status, 0, res.out);
  assert.doesNotMatch(res.calls, /-X (POST|PATCH)/, 'the read-only job must not write');
  const body = /^body<<(EOF_[0-9a-f]{32})\n([\s\S]*)\n\1\n$/.exec(res.output);
  assert.ok(body, `body output missing or malformed:\n${res.output}`);
  const text = body[2];
  assert.match(text, /^<!-- supabase-change-reminder -->\n/);
  assert.match(text, /before\*\* this is merged/);
  assert.match(text, /`20990101000000_example\.sql`/);
  assert.doesNotMatch(text, /20000101000000_gone/, 'removed migrations are not listed');
  for (const name of ['alpha', 'beta', 'newname']) {
    assert.match(text, new RegExp(`supabase functions deploy ${name} --project-ref ${STAGING_REF}`));
  }
  assert.match(text, new RegExp(`\`oldname\`: \`supabase functions delete oldname --project-ref ${STAGING_REF}\``));
  assert.doesNotMatch(text, /deploy _shared/);
  assert.match(text, /Rollback note/);
  assert.match(text, /functions_deployed/);
  assert.equal(res.summary.trim(), text.trim(), 'the job summary carries the same checklist');

  // No migrations or functions: still a checklist, saying so.
  const plain = actionsRun('checklist-plain', checklistScript, {
    ...refsEnv, IS_FORK: 'false', FAKE_FILES: 'modified\tsupabase/config.toml\t\\n', FAKE_DIRS: '',
  });
  assert.equal(plain.status, 0, plain.out);
  assert.match(plain.output, /No new or changed migrations[\s\S]*No Edge Functions changed/);

  // Fork: summary only, no body output, so the comment job is skipped.
  const fork = actionsRun('checklist-fork', checklistScript, {
    ...refsEnv, IS_FORK: 'true', FAKE_FILES: `${files}\\n`, FAKE_DIRS: 'alpha\\n',
  });
  assert.equal(fork.status, 0, fork.out);
  assert.equal(fork.output, '');
  assert.match(fork.summary, /supabase-change-reminder/);
  assert.match(fork.out, /::notice::Pull request from a fork/);

  // API failure: warning, still passes.
  const broken = actionsRun('checklist-broken', checklistScript, { ...refsEnv, IS_FORK: 'false', FAKE_FILES_FAIL: '1' });
  assert.equal(broken.status, 0, broken.out);
  assert.match(broken.out, /::warning::Could not list/);
  assert.equal(broken.output, '');

  const commentScript = runBlock(reminderYaml, 'name: Post or update the pull request comment');
  const fresh = actionsRun('comment-new', commentScript, { BODY: text });
  assert.equal(fresh.status, 0, fresh.out);
  assert.match(fresh.calls, /-X POST repos\/example\/student-portal\/issues\/7\/comments/);
  assert.equal(fresh.posted.trim(), text.trim());

  const update = actionsRun('comment-update', commentScript, { BODY: text, FAKE_EXISTING: '4242\\n' });
  assert.equal(update.status, 0, update.out);
  assert.match(update.calls, /-X PATCH repos\/example\/student-portal\/issues\/comments\/4242/);
  assert.doesNotMatch(update.calls, /-X POST/, 'never a second comment');

  for (const [name, env] of [['post-fails', { FAKE_POST_STATUS: '1' }], ['list-fails', { FAKE_LIST_FAIL: '1', FAKE_POST_STATUS: '1' }]]) {
    const res = actionsRun(`comment-${name}`, commentScript, { BODY: text, ...env });
    assert.equal(res.status, 0, `${name} must not fail the pull request:\n${res.out}`);
    assert.match(res.out, /::warning::Could not post/);
  }
}

// ------------------------------------------------------------ workflow boundaries
{
  const files = fs.readdirSync(WORKFLOWS).filter((f) => /\.ya?ml$/.test(f));
  for (const file of files) {
    const text = fs.readFileSync(path.join(WORKFLOWS, file), 'utf8');
    const code = text.split('\n').filter((line) => !line.trim().startsWith('#')).join('\n');
    assert.doesNotMatch(code, /pull_request_target/, `${file} must never use pull_request_target`);
    if (file !== 'staging-sync.yml') {
      assert.doesNotMatch(code, /staging-sync|STAGING_DB_URL|STAGING_DEPLOY_TOKEN/, `${file} must not use the staging-sync secrets`);
    }
  }

  // Split a workflow into its jobs (two-space-indented keys under jobs:).
  const jobsOf = (text) => {
    const jobs = {};
    let current = null;
    for (const line of text.slice(text.indexOf('\njobs:\n')).split('\n')) {
      const key = /^  ([a-z-]+):$/.exec(line);
      if (key) { current = key[1]; jobs[current] = ''; } else if (current) jobs[current] += `${line}\n`;
    }
    return jobs;
  };

  const sync = fs.readFileSync(path.join(WORKFLOWS, 'staging-sync.yml'), 'utf8');
  const jobs = jobsOf(sync);
  // Migrations first; staging moves only after they succeed; the site last.
  assert.deepEqual(Object.keys(jobs), ['migrate-staging', 'sync-branch', 'deploy-staging-site']);
  assert.doesNotMatch(jobs['migrate-staging'], /needs:/);
  assert.match(jobs['sync-branch'], /^ {4}needs: migrate-staging$/m);
  assert.match(jobs['deploy-staging-site'], /^ {4}needs: \[migrate-staging, sync-branch\]$/m);
  for (const [name, body] of Object.entries(jobs)) {
    assert.doesNotMatch(body, /^ {4}if:/m, `${name} must not override the default "needs succeeded" rule`);
    assert.doesNotMatch(body, /continue-on-error/, `${name} must not continue after a failure`);
    const usesEnv = /^ {4}environment: staging-sync$/m.test(body);
    const usesSecrets = /\$\{\{\s*secrets\./.test(body);
    assert.equal(usesEnv, name !== 'sync-branch', `${name}: environment: staging-sync`);
    assert.equal(usesSecrets, name !== 'sync-branch', `${name}: secrets`);
    assert.match(body, /^ {4}permissions:\n/m, `${name} must declare its own permissions`);
    // Secrets only ever enter through env:, never pasted into a script.
    for (const line of body.split('\n').filter((l) => /secrets\./.test(l))) {
      assert.match(line, /^ {10}[A-Z_]+: \$\{\{ secrets\.[A-Z_]+ \}\}$/, `${name}: secret outside env: -> ${line}`);
    }
  }
  assert.match(jobs['sync-branch'], /^ {6}contents: write$/m);
  assert.doesNotMatch(jobs['migrate-staging'] + jobs['deploy-staging-site'], /contents: write/);
  // The migrated commit and the synced commit are the same: github.sha.
  assert.match(jobs['migrate-staging'], /ref: \$\{\{ github\.sha \}\}/);
  assert.match(jobs['sync-branch'], /TARGET_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(jobs['sync-branch'], /FUNCTIONS_DEPLOYED: \$\{\{ inputs\.functions_deployed \}\}/);
  assert.match(sync, /functions_deployed:\n\s+description: .+\n\s+type: boolean\n\s+default: false/);
  assert.match(sync, /^permissions: \{\}$/m);
  assert.match(sync, /^ {2}group: staging-sync\n {2}cancel-in-progress: false$/m);
  // Nothing may push to master: the workflow pushes nothing itself, and every
  // push in sync-staging.sh targets refs/heads/staging without force.
  assert.doesNotMatch(sync, /git push/, 'staging-sync.yml must leave pushing to sync-staging.sh');
  const pushes = fs.readFileSync(path.join(CI, 'sync-staging.sh'), 'utf8').split('\n').filter((l) => /^\s*git push\b/.test(l));
  assert.ok(pushes.length > 0);
  for (const line of pushes) {
    assert.match(line, /"\$target:refs\/heads\/staging"$/, `unexpected push target: ${line}`);
    assert.doesNotMatch(line, /--force|\s-f\b|\+/, `force push: ${line}`);
  }

  // The reminder runs no repository code and only its comment job can write.
  assert.match(reminderYaml, /^ {2}pull_request:\n/m);
  assert.doesNotMatch(reminderYaml, /\$\{\{\s*secrets\./);
  const reminderCode = reminderYaml.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
  assert.doesNotMatch(reminderCode, /actions\/checkout|uses:|bin\//, 'the reminder must not check out or run repository code');
  const reminderJobs = jobsOf(reminderYaml);
  assert.deepEqual(Object.keys(reminderJobs), ['checklist', 'comment']);
  assert.match(reminderJobs.checklist, /^ {4}permissions:\n {6}pull-requests: read\n {4}outputs:/m);
  assert.match(reminderJobs.comment, /^ {4}permissions:\n {6}pull-requests: write\n {4}steps:/m);
  assert.match(reminderYaml, /^permissions: \{\}$/m);

  // Project refs live only in bin/ci/supabase-refs.sh among the scripts and
  // staging-sync.yml (the reminder's inline copy is checked against it above).
  const refPattern = new RegExp(`${PRODUCTION_REF}|${STAGING_REF}`);
  const scripts = fs.readdirSync(CI).filter((f) => f.endsWith('.sh') && f !== 'supabase-refs.sh');
  for (const file of [...scripts.map((f) => path.join(CI, f)), path.join(WORKFLOWS, 'staging-sync.yml')]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), refPattern, `${path.relative(ROOT, file)} must source supabase-refs.sh, not repeat a project ref`);
  }

  // Nothing echoes a secret variable or traces commands.
  for (const file of scripts.map((f) => path.join(CI, f))) {
    const text = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /^\s*set -[a-z]*x/m, `${file} must not enable tracing`);
    for (const line of text.split('\n').filter((l) => /\b(echo|printf)\b/.test(l))) {
      assert.doesNotMatch(line, /\$\{?(STAGING_DB_URL|STAGING_DEPLOY_TOKEN|GH_TOKEN|db_url)\b/, `${path.basename(file)} prints a secret: ${line}`);
    }
  }
  for (const [name, text] of [['staging-sync.yml', sync], ['supabase-change-reminder.yml', reminderYaml]]) {
    assert.doesNotMatch(text, /set -[a-z]*x/, `${name} must not enable tracing`);
    for (const line of text.split('\n').filter((l) => /\b(echo|printf)\b/.test(l))) {
      assert.doesNotMatch(line, /\$\{?(STAGING_DB_URL|STAGING_DEPLOY_TOKEN|GH_TOKEN|READ_TOKEN)\b/, `${name} prints a secret: ${line}`);
    }
  }
}

console.log('staging sync: sync + functions gate, DB URL guard, migrations, reminders, and workflow boundaries passed');
