// Focused acceptance checks for sa-9 (File Server Integrity Triage): L3a share review and L3b host integrity triage.
// Every learner-visible check runs through the real virtual FS, engine and validator.
import assert from 'node:assert/strict';
import { loadApp, startSession, sha256, PHASES, OBJECTIVE, INSTALL_SETUP, visibleDefinition, answerLiterals, withMutatedFixture } from './lib/night-shift-harness.mjs';

const app = loadApp();
const w = app.window;
const lab = w.MISSION_NEXT_LABS['sa-9'];
const engine = w.MISSION_NEXT_HOST_INTEGRITY;
const steps = w.MISSION_NEXT_GATING.flattenSteps(lab);
const ID = {
  list: 'sa-9.ex0.s1', other: 'sa-9.ex0.s2', fix: 'sa-9.ex0.s3', verify: 'sa-9.ex0.s4', exposed: 'sa-9.ex0.s5',
  dir: 'sa-9.ex1.s4', aide: 'sa-9.ex1.s5', priv: 'sa-9.ex1.s6', preserve: 'sa-9.ex1.s7',
  listener: 'sa-9.ex2.s1', persistence: 'sa-9.ex2.s2', port: 'sa-9.ex2.s3', note: 'sa-9.ex3.s4',
};

// ---- 1. Structure: ids, tags, no setup steps, no answer key ----
assert.equal(lab.id, 'sa-9');
assert.equal(lab.exercises.length, 4);
assert.deepEqual([...steps].map(step => step.id), Object.values(ID), 'sa-9 step ids must stay stable and ordered');
for (const step of steps) {
  assert.ok(PHASES.includes(step.phase), `${step.id} needs an IR phase`);
  assert.ok(engine.phases[step.phase], `${step.id} phase must be defined by the engine`);
  assert.match(step.objective, OBJECTIVE, `${step.id} needs a curriculum objective`);
  assert.equal(step.validation.type, 'nightShiftHost', `${step.id} must use state-derived validation`);
  assert.equal(step.acceptedInputs, undefined, `${step.id} must not gate on a command string`);
  assert.doesNotMatch([step.instruction, step.hint, step.upstream.sourceLine].join(' '), INSTALL_SETUP, `${step.id} looks like an install/setup step`);
}
assert.doesNotMatch(lab.scenario.incident.replace('there is nothing to set up', ''), INSTALL_SETUP, 'scenario must not ask for setup');
for (const seed of ['A', 'B']) {
  const text = visibleDefinition(lab);
  for (const literal of answerLiterals(app, seed)) assert.ok(!text.includes(literal), `Lab definition leaks a fixture answer for seed ${seed}: ${literal}`);
}
assert.equal(lab.environment.shell, 'NightShiftShell');
assert.equal(lab.environment.engine, 'MISSION_NEXT_HOST_INTEGRITY');
assert.equal(w.MISSION_NEXT_LAB_SCHEMA.validateLabShape(lab).length, 0);
const phasesUsed = new Set([...steps].map(step => step.phase));
['preparation', 'detection', 'containment', 'eradication'].forEach(phase => assert.ok(phasesUsed.has(phase), `L3a/L3b must cover ${phase}`));

// ---- independent oracle from the S2 fixture ----
function oracle(seed) {
  const { truth, artifacts } = w.MISSION_NEXT_OPERATION_NIGHT_SHIFT.generate(seed);
  const p = artifacts.linux.persistence;
  return { account: truth.identity.account, port: p.listener.split(':').pop(), unit: p.unitPath, exe: p.executable, process: p.listenerProcess, ticket: `IR-${seed}-204`, dir: `/evidence/IR-${seed}-204`, flagged: [p.unitPath, '/etc/sudoers'] };
}
const noteFor = o => `Flagged paths: ${o.flagged.join(' and ')}. The unauthorized sudoers rule belongs to ${o.account}. Persistence: process ${o.process} (${o.exe}) listens on port ${o.port}. Evidence preserved with hashes in custody.csv. I recommend a rebuild from the approved image and am requesting that response from the IR lead rather than removing anything on-host. Persistence artifact checklist: sudoers rule, service unit, executable, listener.`;

function preserve(session, o, options = {}) {
  const step = session.step(ID.preserve);
  const run = command => session.run(command, step);
  o.flagged.forEach(path => run(`cp -p ${path} ${o.dir}/`));
  o.flagged.forEach(path => {
    const hash = sha256(session.vfs.read(path));
    run(`echo "${path},${hash},${options.time || '2026-09-25T02:30:00Z'},analyst,${options.reason || 'seized before any change'}" >> ${o.dir}/custody.csv`);
  });
}

function solve(session, o, paths = {}) {
  const run = (id, command) => assert.equal(session.complete(id, command).ok, true, `${id} should pass via: ${command}\n${JSON.stringify(session.check(id, command))}`);
  const answer = (id, text) => { const r = session.check(id, text); assert.equal(r.ok, true, `${id}: ${r.reason}`); };
  run(ID.list, paths.list || 'ls -l /srv/share/finance');
  session.run('getfacl /srv/share/finance');
  answer(ID.other, 'other::rwx');
  run(ID.fix, paths.fix || 'sudo chmod -R o-rwx /srv/share/finance');
  session.run('getfacl /srv/share/finance');
  answer(ID.verify, 'other::---');
  session.run('cat /etc/passwd'); session.run('cat /etc/group');
  answer(ID.exposed, o.account);
  run(ID.dir, `mkdir -p ${o.dir}`);
  run(ID.aide, paths.aide || 'sudo aide --check');
  answer(ID.priv, '/etc/sudoers');
  preserve(session, o);
  assert.equal(session.check(ID.preserve, '').ok, true, JSON.stringify(session.check(ID.preserve, '')));
  run(ID.listener, paths.listener || 'ss -tlnp');
  run(ID.persistence, paths.persistence || 'ps -ef --forest');
  answer(ID.port, o.port);
  answer(ID.note, noteFor(o));
}

// ---- 2. Seeds A and B solve end to end and differ ----
const solved = {};
for (const seed of ['A', 'B']) {
  const o = oracle(seed);
  const session = startSession(app, 'sa-9', { seed });
  assert.equal(engine.facts(session.vfs).account, o.account);
  assert.equal(engine.facts(session.vfs).port, o.port);
  solve(session, o);
  solved[seed] = o;
}
assert.notEqual(solved.A.account, solved.B.account);
assert.notEqual(solved.A.port, undefined);
{
  const session = startSession(app, 'sa-9', { seed: 'B' });
  session.run('cat /etc/passwd'); session.run('cat /etc/group');
  assert.equal(session.check(ID.exposed, solved.A.account).ok, false, 'seed A account must not pass seed B');
  assert.equal(session.check(ID.exposed, solved.B.account).ok, true);
}

// ---- 3. Determinism per learner ----
const seeds = new Set();
for (let i = 0; i < 24; i++) {
  const user = `learner${i}`;
  seeds.add(w.MISSION_NEXT_NIGHT_SHIFT_COMMON.pickSeed({ user, labId: 'sa-9' }));
  assert.equal(JSON.stringify(lab.environment.fs({ user, labId: 'sa-9' })), JSON.stringify(lab.environment.fs({ user, labId: 'sa-9' })));
}
assert.deepEqual([...seeds].sort(), ['A', 'B']);

// ---- helpers for alternate paths ----
const A = solved.A;
const prior = {
  [ID.other]: [[ID.list, 'ls -l /srv/share/finance']],
  [ID.aide]: [],
};
function upTo(stepId) {
  const session = startSession(app, 'sa-9', { seed: 'A' });
  const order = Object.values(ID);
  const script = {
    [ID.list]: () => session.complete(ID.list, 'ls -l /srv/share/finance'),
    [ID.other]: () => { session.run('getfacl /srv/share/finance'); },
    [ID.fix]: () => session.complete(ID.fix, 'chmod -R o-rwx /srv/share/finance'),
    [ID.verify]: () => { session.run('getfacl /srv/share/finance'); },
    [ID.exposed]: () => { session.run('cat /etc/passwd'); session.run('cat /etc/group'); },
    [ID.dir]: () => session.complete(ID.dir, `mkdir -p ${A.dir}`),
    [ID.aide]: () => session.complete(ID.aide, 'aide --check'),
    [ID.priv]: () => {},
    [ID.preserve]: () => preserve(session, A),
    [ID.listener]: () => session.complete(ID.listener, 'ss -tlnp'),
    [ID.persistence]: () => session.complete(ID.persistence, 'ps -ef --forest'),
    [ID.port]: () => {},
  };
  for (const id of order) { if (id === stepId) break; script[id](); }
  return session;
}
function accepts(id, commands) {
  commands.forEach(command => {
    const session = upTo(id);
    session.run(command, session.step(id));
    assert.equal(session.check(id, command).ok, true, `${id} should accept: ${command}`);
  });
}
function rejects(id, commands) {
  commands.forEach(command => {
    const session = upTo(id);
    session.run(command, session.step(id));
    assert.equal(session.check(id, command).ok, false, `${id} must reject: ${command}`);
  });
}

// ---- 4. Alternate valid command paths ----
accepts(ID.list, ['ls -l /srv/share/finance', 'ls -ld /srv/share/finance', 'ls -la /srv/share/finance', 'stat /srv/share/finance', 'getfacl /srv/share/finance']);
rejects(ID.list, ['ls -l /srv/share/public', 'ls /srv/share', 'cat /etc/hostname']);
accepts(ID.fix, [
  'chmod -R o-rwx /srv/share/finance', 'sudo chmod -R o-rwx /srv/share/finance', 'chmod -R o= /srv/share/finance', 'chmod -R 770 /srv/share/finance',
  'chmod -R 750 /srv/share/finance', 'sudo setfacl -R -m o::--- /srv/share/finance', 'chmod -R o-rwx /srv/share/finance/',
]);
rejects(ID.fix, [
  'chmod o-rwx /srv/share/finance', // directory only: files still exposed
  'chmod -R 700 /srv/share/finance', // finance group loses access
  'chmod -R 660 /srv/share/finance', // directory loses execute
  'chmod -R o-w /srv/share/finance', 'chmod -R 777 /srv/share/finance', 'ls -l /srv/share/finance',
  'chmod -R o-rwx /srv/share/public',
]);
accepts(ID.aide, ['aide --check', 'sudo aide --check', 'aide -C', 'aide --config /etc/aide/aide.conf --check']);
rejects(ID.aide, ['aide --init', 'cat /etc/aide/aide.conf', 'aide', 'ss -tlnp']);
accepts(ID.listener, ['ss -tlnp', 'ss -lntp', 'sudo ss -tlnp', 'netstat -tlnp', 'sudo netstat -plnt', 'ss -tlnp | grep LISTEN']);
rejects(ID.listener, ['ps -ef --forest', 'ss -tlnp | grep sshd', 'aide --check', 'cat /etc/hostname']);
accepts(ID.persistence, [
  'ps -ef --forest', 'ps aux', 'pstree', `systemctl cat ${A.process}`, `systemctl cat ${A.process}.service`, `systemctl status ${A.process}`, `cat ${A.unit}`,
  `ps -ef --forest | grep ${A.process}`,
]);
rejects(ID.persistence, ['ss -tlnp', 'aide --check', 'systemctl status rsyslog', 'cat /etc/hostname', 'systemctl cat sshd']);

// ---- 5. State-graded evidence preservation, including order and tampering ----
{
  const good = upTo(ID.preserve);
  preserve(good, A);
  assert.equal(good.check(ID.preserve, '').ok, true);
  assert.equal(good.vfs.stat(`${A.dir}/sudoers`).mode, good.vfs.stat('/etc/sudoers').mode, 'cp -p keeps the mode');

  // Alternative valid path: hash first, then copy, then record from the evidence copy's path.
  const alt = upTo(ID.preserve);
  const step = alt.step(ID.preserve);
  alt.run('sha256sum /etc/sudoers /etc/systemd/system/netd.service', step);
  A.flagged.forEach(path => alt.run(`cp -p ${path} ${A.dir}/`, step));
  A.flagged.forEach(path => alt.run(`echo "${A.dir}/${path.split('/').pop()},${sha256(alt.vfs.read(path))},2026-09-25T02:31:00Z,analyst,evidence intake" >> ${A.dir}/custody.csv`, step));
  assert.equal(alt.check(ID.preserve, '').ok, true, JSON.stringify(alt.check(ID.preserve, '')));

  const failing = {
    'nothing preserved': session => {},
    'copy without -p': session => A.flagged.forEach(path => session.run(`cp ${path} ${A.dir}/`, session.step(ID.preserve))),
    'copies but no custody': session => A.flagged.forEach(path => session.run(`cp -p ${path} ${A.dir}/`, session.step(ID.preserve))),
    'only one file preserved': session => { session.run(`cp -p /etc/sudoers ${A.dir}/`, session.step(ID.preserve)); session.run(`echo "/etc/sudoers,${sha256(session.vfs.read('/etc/sudoers'))},t,analyst,r" >> ${A.dir}/custody.csv`, session.step(ID.preserve)); },
    'wrong hash': session => { A.flagged.forEach(path => session.run(`cp -p ${path} ${A.dir}/`, session.step(ID.preserve))); A.flagged.forEach(path => session.run(`echo "${path},${sha256('other')},t,analyst,r" >> ${A.dir}/custody.csv`, session.step(ID.preserve))); },
    'too few custody fields': session => { A.flagged.forEach(path => session.run(`cp -p ${path} ${A.dir}/`, session.step(ID.preserve))); A.flagged.forEach(path => session.run(`echo "${path},${sha256(session.vfs.read(path))}" >> ${A.dir}/custody.csv`, session.step(ID.preserve))); },
    'sha256sum output appended raw': session => { A.flagged.forEach(path => session.run(`cp -p ${path} ${A.dir}/`, session.step(ID.preserve))); A.flagged.forEach(path => session.run(`sha256sum ${path} >> ${A.dir}/custody.csv`, session.step(ID.preserve))); },
    'custody recorded before the copy exists': session => {
      const s = session.step(ID.preserve);
      A.flagged.forEach(path => session.run(`echo "${path},${sha256(session.vfs.read(path))},t,analyst,r" >> ${A.dir}/custody.csv`, s));
      A.flagged.forEach(path => session.run(`cp -p ${path} ${A.dir}/`, s));
    },
  };
  for (const [name, act] of Object.entries(failing)) {
    const session = upTo(ID.preserve);
    act(session);
    assert.equal(session.check(ID.preserve, '').ok, false, `evidence must fail: ${name}`);
  }
  // Hashing after modification fails: the file no longer matches the state AIDE reported.
  const tampered = upTo(ID.preserve);
  tampered.vfs.write('/etc/sudoers', tampered.vfs.read('/etc/sudoers') + '# edited after detection\n', { mode: '0440', owner: 'root', group: 'root' });
  preserve(tampered, A);
  assert.equal(tampered.check(ID.preserve, '').ok, false, 'hashing a file modified after the AIDE run must fail');
}

// ---- 6. Wrong answers and premature answers are rejected ----
{
  const session = upTo(ID.other);
  session.run('getfacl /srv/share/finance');
  for (const text of ['other::---', 'other::r--', 'group::rwx', 'user::rwx', 'rwx rwx rwx', '', '777']) assert.equal(session.check(ID.other, text).ok, false, `other line must reject "${text}"`);
  assert.equal(session.check(ID.other, 'other::rwx').ok, true);
  assert.equal(session.check(ID.other, ' Other::RWX ').ok, true);
  assert.equal(session.check(ID.other, 'rwx').ok, true);
  assert.equal(upTo(ID.list).check(ID.other, 'other::rwx').ok, false, 'answer before running getfacl must fail');
}
{
  const session = upTo(ID.verify);
  session.run('getfacl /srv/share/finance');
  assert.equal(session.check(ID.verify, 'other::---').ok, true);
  for (const text of ['other::rwx', 'other::r--', '']) assert.equal(session.check(ID.verify, text).ok, false, `verify must reject "${text}"`);
  const unfixed = startSession(app, 'sa-9', { seed: 'A' });
  unfixed.run('getfacl /srv/share/finance');
  assert.equal(unfixed.check(ID.verify, 'other::rwx').ok, false, 'verifying an unfixed share must fail');
  const noRecheck = startSession(app, 'sa-9', { seed: 'A' });
  noRecheck.run('getfacl /srv/share/finance');
  noRecheck.run('chmod -R o-rwx /srv/share/finance', noRecheck.step(ID.fix));
  assert.equal(noRecheck.check(ID.verify, 'other::---').ok, false, 'must re-run getfacl after the fix');
}
{
  const session = upTo(ID.exposed);
  session.run('cat /etc/passwd'); session.run('cat /etc/group');
  for (const text of ['j.sanders', 'm.chen', 'helpdesk-admin', 'analyst', 'root', 'svc_backup', '', `${A.account}, j.sanders`]) assert.equal(session.check(ID.exposed, text).ok, false, `exposed must reject "${text}"`);
  assert.equal(session.check(ID.exposed, A.account).ok, true);
  assert.equal(upTo(ID.verify).check(ID.exposed, A.account).ok, false, 'must compare passwd and group first');
  const half = upTo(ID.verify);
  half.run('cat /etc/passwd');
  assert.equal(half.check(ID.exposed, A.account).ok, false, 'passwd alone is not enough');
}
{
  const session = upTo(ID.priv);
  for (const text of [A.unit, '/etc/passwd', 'sudoers', '', '/etc/shadow']) assert.equal(session.check(ID.priv, text).ok, false, `privileged path must reject "${text}"`);
  assert.equal(session.check(ID.priv, '/etc/sudoers').ok, true);
  assert.equal(upTo(ID.aide).check(ID.priv, '/etc/sudoers').ok, false, 'answer before running AIDE must fail');
}
{
  const session = upTo(ID.port);
  for (const text of ['22', '445', '465', `${Number(A.port) + 1}`, '', `22 ${A.port}`]) assert.equal(session.check(ID.port, text).ok, false, `port must reject "${text}"`);
  assert.equal(session.check(ID.port, A.port).ok, true);
  assert.equal(session.check(ID.port, `port ${A.port}`).ok, true);
  assert.equal(upTo(ID.listener).check(ID.port, A.port).ok, false, 'port before listing sockets must fail');
}
{
  const session = upTo(ID.note);
  const note = noteFor(A);
  assert.equal(session.check(ID.note, note).ok, true);
  const cuts = { sudoers: '/etc/sudoers', unit: A.unit, account: A.account, port: A.port, process: A.process, executable: A.exe, rebuild: 'I recommend a rebuild from the approved image', request: 'am requesting that response from the IR lead rather than removing anything on-host', evidence: 'Evidence preserved with hashes in custody.csv.' };
  for (const [name, piece] of Object.entries(cuts)) assert.equal(session.check(ID.note, note.split(piece).join('')).ok, false, `note without ${name} must fail`);
  assert.equal(session.check(ID.note, 'Eradicated everything.').ok, false);
}

// ---- 7. Request-only authority: remediation is refused and leaves the host untouched ----
{
  const session = upTo(ID.listener);
  const snapshot = JSON.stringify(session.vfs.snapshot());
  const attempts = [
    'rm /etc/sudoers', `rm ${A.unit}`, `rm -f ${A.exe}`, `mv ${A.unit} /tmp/`, `systemctl stop ${A.process}`, `systemctl disable ${A.process}`, `systemctl mask ${A.process}`,
    'sudo kill 4211', 'pkill netd', 'killall netd', 'sudo visudo', 'userdel temp', 'usermod -L temp', 'gpasswd -d temp sudo',
    'echo x > /etc/sudoers', `echo x >> ${A.unit}`, 'chmod 000 /etc/sudoers', 'chmod -R o-rwx /etc', `cp /tmp/x ${A.unit}`, 'setfacl -m o::--- /etc/sudoers', 'echo x > /var/lib/sa/ss.txt', 'mkdir /etc/newdir', 'echo x > /home/analyst/../../etc/passwd',
  ];
  for (const command of attempts) {
    const result = session.run(command);
    assert.notEqual(result.exitCode, 0, `${command} must be refused`);
  }
  assert.equal(JSON.stringify(session.vfs.snapshot()), snapshot, 'refused commands must not change the host');
  assert.ok(session.session.denied >= 15);
}
{
  // The permission fix is authorized only for the share, and only at its step.
  const session = startSession(app, 'sa-9', { seed: 'A' });
  const before = session.vfs.stat('/srv/share/finance').mode;
  assert.notEqual(session.run('chmod -R o-rwx /srv/share/finance').exitCode, 0, 'no fix before its step is active');
  assert.equal(session.vfs.stat('/srv/share/finance').mode, before);
  assert.notEqual(session.run('chmod -R o-rwx /srv/share/finance', session.step(ID.other)).exitCode, 0, 'no fix during another step');
  assert.notEqual(session.run('chmod -R o-rwx /etc', session.step(ID.fix)).exitCode, 0, 'no permission changes outside the share');
  assert.equal(session.run('chmod -R o-rwx /srv/share/finance', session.step(ID.fix)).exitCode, 0);
}

// ---- 8. Mutating fixture facts changes what grading accepts ----
{
  const original = oracle('A');
  const mutated = { ...original, account: 'svc.mutant', port: '4444', unit: '/etc/systemd/system/mutant.service', exe: '/usr/local/sbin/mutant', process: 'mutant', flagged: ['/etc/systemd/system/mutant.service', '/etc/sudoers'] };
  withMutatedFixture(app, fixture => {
    const linux = fixture.artifacts.linux;
    fixture.truth.identity.account = mutated.account;
    linux.sudoers = linux.sudoers.replace(original.account, mutated.account);
    linux.persistence = { ...linux.persistence, service: 'mutant.service', unitPath: mutated.unit, executable: mutated.exe, listener: `0.0.0.0:${mutated.port}`, listenerProcess: mutated.process };
  }, () => {
    const session = startSession(app, 'sa-9', { seed: 'A' });
    session.run('cat /etc/passwd'); session.run('cat /etc/group');
    assert.equal(session.check(ID.exposed, mutated.account).ok, true, 'mutated account accepted');
    assert.equal(session.check(ID.exposed, original.account).ok, false, 'original account rejected after mutation');
    session.run('aide --check'); session.run('ss -tlnp');
    assert.equal(session.check(ID.port, mutated.port).ok, true, 'mutated port accepted');
    assert.equal(session.check(ID.port, original.port).ok, false, 'original port rejected after mutation');
    assert.equal(session.check(ID.priv, '/etc/sudoers').ok, true);
    assert.equal(session.check(ID.note, noteFor(mutated)).ok, true, 'mutated note accepted');
    assert.equal(session.check(ID.note, noteFor(original)).ok, false, 'original note rejected after mutation');
    const step = session.step(ID.preserve);
    mutated.flagged.forEach(path => session.run(`cp -p ${path} ${original.dir}/`, step));
    mutated.flagged.forEach(path => session.run(`echo "${path},${sha256(session.vfs.read(path))},t,analyst,r" >> ${original.dir}/custody.csv`, step));
    assert.equal(session.check(ID.preserve, '').ok, false, 'mkdir was never run, so evidence has nowhere to live');
    session.run(`mkdir -p ${original.dir}`);
    mutated.flagged.forEach(path => session.run(`cp -p ${path} ${original.dir}/`, step));
    mutated.flagged.forEach(path => session.run(`echo "${path},${sha256(session.vfs.read(path))},t,analyst,r" >> ${original.dir}/custody.csv`, step));
    assert.equal(session.check(ID.preserve, '').ok, true, JSON.stringify(session.check(ID.preserve, '')));
  });
  // Editing the running host also moves the grader (share ACL and listener).
  const session = startSession(app, 'sa-9', { seed: 'A' });
  session.vfs.chmod('/srv/share/finance', '0775');
  session.run('getfacl /srv/share/finance');
  assert.equal(session.check(ID.other, 'other::r-x').ok, true);
  assert.equal(session.check(ID.other, 'other::rwx').ok, false);
  session.vfs.write('/var/lib/sa/ss.txt', session.vfs.read('/var/lib/sa/ss.txt').replace(`:${original.port}`, ':40404'));
  session.run('ss -tlnp');
  assert.equal(session.check(ID.port, '40404').ok, true);
  assert.equal(session.check(ID.port, original.port).ok, false);
}

// ---- 9. Multiple valid full paths reach the same end state ----
{
  const session = startSession(app, 'sa-9', { seed: 'B' });
  solve(session, oracle('B'), {
    list: 'stat /srv/share/finance', fix: 'sudo setfacl -R -m o::--- /srv/share/finance', aide: 'aide --config /etc/aide/aide.conf --check',
    listener: 'netstat -tlnp', persistence: `systemctl cat ${oracle('B').process}`,
  });
}

console.log('Host integrity check passed.');
