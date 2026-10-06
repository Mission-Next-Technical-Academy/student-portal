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
function sync(work, name) {
  const output = path.join(tmp, `${name}.out`);
  fs.writeFileSync(output, '');
  const res = run('bash', [path.join(CI, 'sync-staging.sh'), 'origin'], {
    cwd: work, env: { GITHUB_OUTPUT: output },
  });
  return { ...res, outputs: readOutputs(output) };
}

{ // Fast-forward: staging behind master moves to master; master untouched.
  const { remote, work } = syncFixture('ff');
  const first = commit(work, 'a.txt', '1');
  git(work, 'push', '-q', 'origin', 'master', 'master:staging');
  const second = commit(work, 'a.txt', '2');
  git(work, 'push', '-q', 'origin', 'master');

  const res = sync(work, 'ff');
  assert.equal(res.status, 0, res.out);
  assert.equal(remoteSha(remote, 'staging'), second);
  assert.equal(remoteSha(remote, 'master'), second);
  assert.deepEqual(res.outputs, { before: first, sha: second });
  assert.match(res.out, /both point at/);

  // Already equal: success, nothing changes.
  const again = sync(work, 'ff-again');
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /already matches master/);
  assert.equal(remoteSha(remote, 'staging'), second);
  assert.equal(remoteSha(remote, 'master'), second);
  assert.deepEqual(again.outputs, { before: second, sha: second });
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

  const res = sync(work, 'diverged');
  assert.equal(res.status, 1, res.out);
  assert.match(res.out, /::error::staging has commits that are not on master[\s\S]*Nothing was changed/);
  assert.equal(remoteSha(remote, 'staging'), stagingOnly);
  assert.equal(remoteSha(remote, 'master'), masterTip);
  assert.deepEqual(res.outputs, {});
}

{ // Missing staging branch: created at master.
  const { remote, work } = syncFixture('missing');
  const tip = commit(work, 'a.txt', '1');
  git(work, 'push', '-q', 'origin', 'master');
  const res = sync(work, 'missing');
  assert.equal(res.status, 0, res.out);
  assert.equal(remoteSha(remote, 'staging'), tip);
  assert.deepEqual(res.outputs, { before: '', sha: tip });
}

// ----------------------------------------------------------- check-staging-db-url.sh
const stagingUrl = `postgresql://postgres.${STAGING_REF}:${FAKE_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
const productionUrl = `postgresql://postgres.${PRODUCTION_REF}:${FAKE_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
function guard(value, name) {
  const output = path.join(tmp, `guard-${name}.out`);
  fs.writeFileSync(output, '');
  const env = { GITHUB_OUTPUT: output };
  if (value !== undefined) env.STAGING_DB_URL = value;
  const res = run('bash', [path.join(CI, 'check-staging-db-url.sh')], { env });
  assert.ok(!res.out.includes(FAKE_PASSWORD), `guard printed the secret:\n${res.out}`);
  assert.ok(!res.out.includes('postgresql://'), `guard printed the connection string:\n${res.out}`);
  return { ...res, outputs: readOutputs(output) };
}
{
  const missing = guard(undefined, 'missing');
  assert.equal(missing.status, 0);
  assert.match(missing.out, /::notice::STAGING_DB_URL is not set/);
  assert.deepEqual(missing.outputs, { configured: 'false' });
  assert.deepEqual(guard('', 'empty').outputs, { configured: 'false' });

  const staging = guard(stagingUrl, 'staging');
  assert.equal(staging.status, 0, staging.out);
  assert.deepEqual(staging.outputs, { configured: 'true' });

  for (const [name, value] of [
    ['production', productionUrl],
    ['both', `${stagingUrl}?x=${PRODUCTION_REF}`],
    ['neither', `postgresql://postgres.abcdefghijklmnopqrst:${FAKE_PASSWORD}@db.example.invalid:5432/postgres`],
  ]) {
    const res = guard(value, name);
    assert.equal(res.status, 1, `${name} should be refused:\n${res.out}`);
    assert.match(res.out, /::error::/);
    assert.deepEqual(res.outputs, {}, `${name} must not report configured`);
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

// ------------------------------------------------- functions-reminder.sh / PR checklist
{
  const repo = path.join(tmp, 'functions');
  git(tmp, 'init', '-q', '-b', 'master', repo);
  const base = commit(repo, 'supabase/functions/alpha/index.ts', '1');
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
  assert.doesNotMatch(one.out, new RegExp(`--project-ref ${PRODUCTION_REF}\\n`));

  const shared = commit(repo, 'supabase/functions/_shared/cors.ts', '2');
  const all = reminder(alphaOnly, shared);
  assert.match(all.out, /deploy alpha/);
  assert.match(all.out, /deploy beta/);
  assert.doesNotMatch(all.out, /deploy _shared/);

  git(repo, 'rm', '-q', '-r', 'supabase/functions/beta');
  git(repo, 'commit', '-q', '-m', 'remove beta');
  const removed = reminder(shared, 'HEAD');
  assert.match(removed.out, /`beta`: `supabase functions delete beta/);

  // Pull request checklist: marker, staging-first wording, changed migration.
  const migration = commit(repo, 'supabase/migrations/20990101000000_example.sql', 'select 1;');
  const checklist = run('bash', [path.join(CI, 'supabase-change-reminder.sh'), base, migration], { cwd: repo });
  assert.equal(checklist.status, 0, checklist.out);
  assert.match(checklist.out, /^<!-- supabase-change-reminder -->\n/);
  assert.match(checklist.out, /before\*\* this is merged/);
  assert.match(checklist.out, /20990101000000_example\.sql/);
  assert.match(checklist.out, /Rollback note/);
  assert.match(checklist.out, new RegExp(`supabase functions deploy alpha --project-ref ${STAGING_REF}`));
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

  // Split staging-sync.yml into its jobs (two-space-indented keys under jobs:).
  const sync = fs.readFileSync(path.join(WORKFLOWS, 'staging-sync.yml'), 'utf8');
  const jobsText = sync.slice(sync.indexOf('\njobs:\n'));
  const jobs = {};
  let current = null;
  for (const line of jobsText.split('\n')) {
    const key = /^  ([a-z-]+):$/.exec(line);
    if (key) { current = key[1]; jobs[current] = ''; } else if (current) jobs[current] += `${line}\n`;
  }
  assert.deepEqual(Object.keys(jobs), ['sync-branch', 'migrate-staging', 'deploy-staging-site']);
  for (const [name, body] of Object.entries(jobs)) {
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
  assert.match(sync, /^permissions: \{\}$/m);
  assert.match(sync, /^ {2}group: staging-sync\n {2}cancel-in-progress: false$/m);
  assert.match(jobs['migrate-staging'], /needs: sync-branch/);
  assert.match(jobs['deploy-staging-site'], /needs: \[sync-branch, migrate-staging\]/);
  assert.doesNotMatch(jobs['deploy-staging-site'], /if:\s*always\(\)/, 'the site must not deploy after a failed migration');
  // Nothing may push to master: the workflow pushes nothing itself, and every
  // push in sync-staging.sh targets refs/heads/staging without force.
  assert.doesNotMatch(sync, /git push/, 'staging-sync.yml must leave pushing to sync-staging.sh');
  const pushes = fs.readFileSync(path.join(CI, 'sync-staging.sh'), 'utf8').split('\n').filter((l) => /^\s*git push\b/.test(l));
  assert.ok(pushes.length > 0);
  for (const line of pushes) {
    assert.match(line, /"\$master_sha:refs\/heads\/staging"$/, `unexpected push target: ${line}`);
    assert.doesNotMatch(line, /--force|\s-f\b|\+/, `force push: ${line}`);
  }

  const reminder = fs.readFileSync(path.join(WORKFLOWS, 'supabase-change-reminder.yml'), 'utf8');
  assert.match(reminder, /^ {2}pull_request:\n/m);
  assert.doesNotMatch(reminder, /\$\{\{\s*secrets\./);
  assert.match(reminder, /^ {6}pull-requests: write$/m);

  // Project refs live only in bin/ci/supabase-refs.sh among these files.
  const refPattern = new RegExp(`${PRODUCTION_REF}|${STAGING_REF}`);
  const scripts = fs.readdirSync(CI).filter((f) => f.endsWith('.sh') && f !== 'supabase-refs.sh');
  for (const file of [...scripts.map((f) => path.join(CI, f)), path.join(WORKFLOWS, 'staging-sync.yml'), path.join(WORKFLOWS, 'supabase-change-reminder.yml')]) {
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
  for (const line of sync.split('\n').filter((l) => /\b(echo|printf)\b/.test(l))) {
    assert.doesNotMatch(line, /\$\{?(STAGING_DB_URL|STAGING_DEPLOY_TOKEN|GH_TOKEN|READ_TOKEN)\b/, `staging-sync.yml prints a secret: ${line}`);
  }
}

console.log('staging sync scripts: sync, DB URL guard, migrations, function reminders, and workflow boundaries passed');
