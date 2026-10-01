// Focused acceptance checks for sa-4, "Linux Log Triage: The Audit Gap".
// Every learner-visible check runs through the real virtual FS, engine and validator.
import assert from 'node:assert/strict';
import { loadApp, startSession, PHASES, OBJECTIVE, INSTALL_SETUP, hms, visibleDefinition, answerLiterals, withMutatedFixture } from './lib/night-shift-harness.mjs';

const app = loadApp();
const w = app.window;
const lab = w.MISSION_NEXT_LABS['sa-4'];
const engine = w.MISSION_NEXT_LINUX_LOG_TRIAGE;
const steps = w.MISSION_NEXT_GATING.flattenSteps(lab);
const ID = { ticket: 'sa-4.ex1.s4', rule: 'sa-4.ex1.s2', gap: 'sa-4.ex1.s5', burst: 'sa-4.ex2.s3', login: 'sa-4.ex2.s4', sudo: 'sa-4.ex2.s5', stop: 'sa-4.ex3.s3', timeline: 'sa-4.ex3.s4', ip: 'sa-4.ex4.s4', account: 'sa-4.ex4.s2', unit: 'sa-4.ex4.s3', note: 'sa-4.ex5.s7' };

// ---- 1. Structure: ids, tags, no setup steps, no answer key ----
assert.equal(lab.id, 'sa-4');
assert.equal(lab.exercises.length, 5);
assert.deepEqual([...steps].map(step => step.id), Object.values(ID), 'sa-4 step ids must stay stable and ordered');
// Progress ids that shipped before the rewrite. Surviving steps keep their id and meaning; the
// retired install/setup ids must not be reused, or old completions would tick off new steps.
const SHIPPED = ['sa-4.ex1.s1', 'sa-4.ex1.s2', 'sa-4.ex1.s3', 'sa-4.ex2.s1', 'sa-4.ex2.s2', 'sa-4.ex3.s1', 'sa-4.ex3.s2', 'sa-4.ex4.s1', 'sa-4.ex4.s2', 'sa-4.ex4.s3', 'sa-4.ex5.s1', 'sa-4.ex5.s2', 'sa-4.ex5.s3', 'sa-4.ex5.s4', 'sa-4.ex5.s5', 'sa-4.ex5.s6'];
const SAME_MEANING = ['sa-4.ex1.s2', 'sa-4.ex4.s2', 'sa-4.ex4.s3'];
for (const id of SAME_MEANING) assert.ok(steps.some(step => step.id === id), `${id} keeps its meaning and must remain`);
for (const id of [...steps].map(step => step.id)) assert.ok(!SHIPPED.includes(id) || SAME_MEANING.includes(id), `${id} reuses a retired install-step id`);
assert.equal(steps.find(step => step.id === 'sa-4.ex4.s2').validation.check, 'account');
assert.equal(steps.find(step => step.id === 'sa-4.ex4.s3').validation.check, 'unit');
for (const step of steps) {
  assert.ok(PHASES.includes(step.phase), `${step.id} needs an IR phase (got ${step.phase})`);
  assert.ok(engine.phases[step.phase], `${step.id} phase must be defined by the engine`);
  assert.match(step.objective, OBJECTIVE, `${step.id} needs a curriculum objective`);
  assert.equal(step.validation.type, 'nightShiftTriage', `${step.id} must use state-derived validation`);
  assert.equal(step.acceptedInputs, undefined, `${step.id} must not gate on a command string`);
  assert.doesNotMatch([step.instruction, step.hint, step.upstream.sourceLine].join(' '), INSTALL_SETUP, `${step.id} looks like an install/setup step`);
}
for (const seed of ['A', 'B']) {
  const text = visibleDefinition(lab);
  for (const literal of answerLiterals(app, seed)) assert.ok(!text.includes(literal), `Lab definition leaks a fixture answer for seed ${seed}: ${literal}`);
}
assert.equal(lab.environment.shell, 'NightShiftShell');
assert.equal(lab.environment.engine, 'MISSION_NEXT_LINUX_LOG_TRIAGE');
assert.equal(w.MISSION_NEXT_LAB_SCHEMA.validateLabShape(lab).length, 0);

// ---- helpers: an independent oracle taken from the S2 fixture ----
function oracle(seed) {
  const { truth, artifacts } = w.MISSION_NEXT_OPERATION_NIGHT_SHIFT.generate(seed);
  const t = truth.timeline;
  return {
    account: truth.identity.account, ip: truth.identity.sourceIp, failures: t.failedLogins.length, unit: 'auditd',
    first: hms(t.failedLogins[0]), login: hms(t.linuxSuccess), sudo: hms(t.sudoUse), stop: hms(t.auditStopped), gap: hms(t.auditStopped),
    date: t.linuxSuccess.slice(0, 10), log: artifacts.linux.authLog,
  };
}
const timelineFor = o => `${o.first} first failed password\n${o.login} successful login\n${o.sudo} sudo command\n${o.stop} audit service stopped\n${o.gap} last audit record delivered`;
const noteFor = o => `Account ${o.account} from ${o.ip} made ${o.failures} failed password attempts, logged in at ${o.login} UTC, then used sudo and stopped auditd at ${o.stop} UTC. Nothing alerted: this is a detection gap. I propose a new rule to alert when a security service such as auditd is stopped, for the M4 backlog. Escalating to the IR lead.`;

function solve(session, o, paths = {}) {
  const run = (id, command) => assert.equal(session.complete(id, command).ok, true, `${id} should pass via: ${command}\n${JSON.stringify(session.latest)}\n${JSON.stringify(session.check(id, command))}`);
  const answer = (id, text) => { const r = session.check(id, text); assert.equal(r.ok, true, `${id}: ${r.reason}`); };
  run(ID.ticket, 'cat /home/analyst/ir-ticket.txt');
  run(ID.rule, 'cat /etc/rsyslog.d/50-forward.conf');
  session.run('systemctl status rsyslog');
  answer(ID.gap, o.gap);
  run(ID.burst, paths.burst || 'grep "Failed password" /var/log/auth.log');
  run(ID.login, paths.login || 'grep Accepted /var/log/auth.log');
  run(ID.sudo, paths.sudo || 'grep sudo /var/log/auth.log');
  run(ID.stop, paths.stop || 'journalctl -u auditd');
  answer(ID.timeline, timelineFor(o));
  answer(ID.ip, o.ip);
  answer(ID.account, o.account);
  answer(ID.unit, o.unit);
  answer(ID.note, noteFor(o));
}

// ---- 2. Seeds A and B both solve end to end, and differ ----
const solved = {};
for (const seed of ['A', 'B']) {
  const o = oracle(seed);
  const session = startSession(app, 'sa-4', { seed });
  assert.equal(engine.facts(session.vfs).account, o.account);
  solve(session, o);
  solved[seed] = o;
}
assert.notEqual(solved.A.account, solved.B.account);
assert.notEqual(solved.A.ip, solved.B.ip);
assert.notEqual(solved.A.stop, solved.B.stop);
assert.notEqual(solved.A.failures, solved.B.failures);
// Seed A answers must not pass seed B, so a shared Practice answer cannot be replayed.
{
  const session = startSession(app, 'sa-4', { seed: 'B' });
  session.complete(ID.ticket, 'cat /home/analyst/ir-ticket.txt');
  session.run('systemctl status rsyslog');
  assert.equal(session.check(ID.gap, solved.A.gap).ok, false);
  session.run('grep "Failed password" /var/log/auth.log');
  assert.equal(session.check(ID.ip, solved.A.ip).ok, false);
  assert.equal(session.check(ID.ip, solved.B.ip).ok, true);
}

// ---- 3. Determinism per learner, and both variants get used ----
const seeds = new Set();
for (let i = 0; i < 24; i++) {
  const user = `learner${i}`;
  const first = w.MISSION_NEXT_NIGHT_SHIFT_COMMON.pickSeed({ user, labId: 'sa-4' });
  assert.equal(first, w.MISSION_NEXT_NIGHT_SHIFT_COMMON.pickSeed({ user, labId: 'sa-4' }), 'seed must be stable per learner');
  seeds.add(first);
  const treeA = JSON.stringify(lab.environment.fs({ user, labId: 'sa-4' }));
  assert.equal(treeA, JSON.stringify(lab.environment.fs({ user, labId: 'sa-4' })));
}
assert.deepEqual([...seeds].sort(), ['A', 'B'], 'both variants must be reachable');
assert.notEqual(lab.environment.fs({ seed: 'A' }), lab.environment.fs({ seed: 'A' }), 'every build returns an isolated tree');

// ---- 4. Alternate valid command paths, each exercised ----
const A = solved.A;
function fresh(prior = []) {
  const session = startSession(app, 'sa-4', { seed: 'A' });
  prior.forEach(([id, command]) => session.complete(id, command));
  return session;
}
const accepts = (id, commands, prior) => commands.forEach(command => {
  const session = fresh(prior);
  session.run(command, session.step(id));
  assert.equal(session.check(id, command).ok, true, `${id} should accept: ${command}`);
});
const rejects = (id, commands, prior) => commands.forEach(command => {
  const session = fresh(prior);
  session.run(command, session.step(id));
  assert.equal(session.check(id, command).ok, false, `${id} must reject: ${command}`);
});
const prepared = [[ID.ticket, 'cat ir-ticket.txt'], [ID.rule, 'cat /etc/rsyslog.d/50-forward.conf']];
accepts(ID.ticket, ['cat /home/analyst/ir-ticket.txt', 'cat ir-ticket.txt', 'head -n 5 ir-ticket.txt']);
accepts(ID.rule, ['cat /etc/rsyslog.d/50-forward.conf', 'grep -v "^#" /etc/rsyslog.d/50-forward.conf', 'head -n 5 /etc/rsyslog.d/50-forward.conf']);
accepts(ID.burst, [
  'grep "Failed password" /var/log/auth.log',
  'grep -F "Failed password" /var/log/auth.log',
  "awk '/Failed password/ {print $1, $7, $9}' /var/log/auth.log",
  "awk '/Failed password/' /var/log/auth.log",
  'grep "Failed password" /var/log/auth.log | awk \'{print $9}\' | sort | uniq -c',
  'grep "Failed password" /var/log/auth.log | cut -d " " -f 9 | sort | uniq -c',
  `grep -c "Failed password for ${A.account}" /var/log/auth.log`,
  `grep "Failed password" /var/log/auth.log | grep ${A.ip} | wc -l`,
  `awk '$9=="${A.ip}" {print $1}' /var/log/auth.log`,
  'cat /var/log/auth.log',
], prepared);
accepts(ID.login, ['grep Accepted /var/log/auth.log', `grep "Accepted password for ${A.account}" /var/log/auth.log`, "awk '/Accepted/ {print $1, $7}' /var/log/auth.log", `grep -F ${A.account} /var/log/auth.log`]);
accepts(ID.sudo, ['grep sudo /var/log/auth.log', 'grep COMMAND= /var/log/auth.log', "awk '/sudo/' /var/log/auth.log", `grep "${A.account} :" /var/log/auth.log`]);
accepts(ID.stop, [
  'journalctl -u auditd', 'journalctl -u auditd.service --no-pager', `journalctl -u auditd --since "${A.date} 02:00"`, `journalctl -u auditd --since ${A.date}`,
  'systemctl status auditd', 'systemctl status auditd.service', 'ausearch -m SERVICE_STOP', 'ausearch -k service-stop -i',
  'grep SERVICE_STOP /var/log/audit/audit.log', 'grep "Stopped auditd" /var/log/syslog', 'journalctl --since 02:00 -g Stopped',
]);
// The forwarder time may be learned from either source before answering.
for (const command of ['tail -n 4 /var/log/siem-forwarder.log', 'systemctl status rsyslog', 'grep "stream=audit" /var/log/siem-forwarder.log', 'cat /var/log/siem-forwarder.log']) {
  const session = fresh(prepared);
  session.run(command);
  assert.equal(session.check(ID.gap, A.gap).ok, true, `gap time should be reachable via: ${command}`);
}
// Answer formats: bare time, ISO stamp, with UTC suffix.
{
  const session = fresh(prepared);
  session.run('systemctl status rsyslog');
  for (const text of [A.gap, `${A.date}T${A.gap}Z`, `${A.gap} UTC`]) assert.equal(session.check(ID.gap, text).ok, true, text);
}

// ---- 5. Wrong or premature commands and answers are rejected ----
rejects(ID.burst, ['grep "Failed password" /var/log/auth.log | head -n 2', 'grep -c "Failed password" /var/log/auth.log', 'grep "Failed password" /var/log/auth.log | wc -l', 'grep Accepted /var/log/auth.log', 'cat /etc/rsyslog.d/50-forward.conf', 'grep -c Accepted /var/log/auth.log', 'grep "Failed password" /var/log/syslog', 'ls /var/log'], prepared);
rejects(ID.login, ['grep "Failed password" /var/log/auth.log', 'grep helpdesk /var/log/auth.log', 'grep j.sanders /var/log/auth.log | head -n 1'], prepared);
rejects(ID.sudo, ['grep Accepted /var/log/auth.log', 'grep -c sudo /var/log/auth.log'], prepared);
rejects(ID.stop, ['grep sudo /var/log/auth.log', 'journalctl -u rsyslog', 'systemctl status rsyslog', 'journalctl -u auditd --since 23:00 --until 23:59', 'ausearch -m USER_LOGIN', 'cat /var/log/siem-forwarder.log']);
rejects(ID.ticket, ['cat /etc/hostname', 'ls'], []);
{
  const session = fresh(prepared);
  const wrong = ['02:16:09', '02:14:50', '00:00:00', '', 'about 02:16', `${A.gap} and ${A.login}`];
  session.run('systemctl status rsyslog');
  wrong.forEach(text => assert.equal(session.check(ID.gap, text).ok, false, `gap time must reject "${text}"`));
  const early = fresh(prepared);
  assert.equal(early.check(ID.gap, A.gap).ok, false, 'a time submitted before reading forwarder evidence must fail');
}
{
  const session = fresh(prepared);
  assert.equal(session.check(ID.ip, A.ip).ok, false, 'IP before reading logs must fail');
  session.run('grep "Failed password" /var/log/auth.log');
  for (const text of ['192.0.2.25', '192.0.2.10', `${A.ip} 192.0.2.25`, 'attacker', '', '198.51.100.4']) assert.equal(session.check(ID.ip, text).ok, false, `IP must reject "${text}"`);
  assert.equal(session.check(ID.account, A.account).ok, false, 'account before finding the login must fail');
  session.run('grep Accepted /var/log/auth.log');
  for (const text of ['j.sanders', 'helpdesk-admin', 'root', '', `${A.account}x`]) assert.equal(session.check(ID.account, text).ok, false, `account must reject "${text}"`);
  assert.equal(session.check(ID.account, A.account.toUpperCase()).ok, true);
  assert.equal(session.check(ID.unit, 'auditd').ok, false, 'unit before confirming the stop must fail');
  session.run('journalctl -u auditd');
  for (const text of ['rsyslog', 'rsyslog.service', 'sshd', 'ssh', '']) assert.equal(session.check(ID.unit, text).ok, false, `unit must reject "${text}"`);
  for (const text of ['auditd', 'auditd.service', 'Auditd']) assert.equal(session.check(ID.unit, text).ok, true, text);
}
{
  const session = fresh(prepared);
  ['grep "Failed password" /var/log/auth.log', 'grep Accepted /var/log/auth.log', 'grep sudo /var/log/auth.log', 'journalctl -u auditd', 'systemctl status rsyslog'].forEach(command => session.run(command));
  const good = timelineFor(A);
  assert.equal(session.check(ID.timeline, good).ok, true);
  // Concurrent events (audit stop and last delivered record) may swap.
  const swapped = good.split('\n'); [swapped[3], swapped[4]] = [swapped[4], swapped[3]];
  assert.equal(session.check(ID.timeline, swapped.join('\n')).ok, true, 'concurrent events may be listed in either order');
  assert.equal(session.check(ID.timeline, `${A.date}T${A.first}Z first\n${A.date}T${A.login}Z login\n${A.sudo} sudo\n${A.stop} stop\n${A.gap} gap`).ok, true, 'ISO timestamps are accepted');
  const lines = good.split('\n');
  assert.equal(session.check(ID.timeline, [lines[1], lines[0], ...lines.slice(2)].join('\n')).ok, false, 'events out of order must fail');
  assert.equal(session.check(ID.timeline, lines.slice(0, 4).join('\n')).ok, false, 'four events must fail');
  assert.equal(session.check(ID.timeline, [...lines, lines[4]].join('\n')).ok, false, 'six events must fail');
  assert.equal(session.check(ID.timeline, lines.map((line, index) => (index === 2 ? line.replace(A.sudo, '02:16:03') : line)).join('\n')).ok, false, 'a wrong timestamp must fail');
  assert.equal(session.check(ID.timeline, ['2026-01-01T' + lines[0], ...lines.slice(1)].join('\n')).ok, false, 'a wrong date must fail');
  const early = fresh(prepared);
  assert.equal(early.check(ID.timeline, good).ok, false, 'timeline before gathering evidence must fail');
  // Note quality: each missing element is rejected on its own.
  const note = noteFor(A);
  assert.equal(session.check(ID.note, note).ok, true);
  const cuts = { account: A.account, ip: A.ip, count: `${A.failures} failed`, stop: A.stop, unit: 'auditd', gap: 'Nothing alerted: this is a detection gap.', rule: 'I propose a new rule to alert when a security service such as auditd is stopped, for the M4 backlog.', escalation: 'Escalating to the IR lead.' };
  for (const [name, piece] of Object.entries(cuts)) assert.equal(session.check(ID.note, note.split(piece).join('')).ok, false, `case note without ${name} must fail`);
  assert.equal(session.check(ID.note, 'The auditd service was stopped.').ok, false);
}

// ---- 6. Read-only authority: remediation and evidence tampering are refused ----
{
  const session = fresh(prepared);
  const before = session.vfs.read('/var/log/auth.log');
  for (const command of ['systemctl restart auditd', 'systemctl start auditd', 'systemctl stop rsyslog', 'systemctl disable auditd', 'rm /var/log/auth.log', 'mv /var/log/auth.log /tmp/x', 'chmod 000 /var/log/auth.log', 'kill 1', 'usermod -L x', 'echo x > /var/log/auth.log', 'echo x >> /var/log/audit/audit.log', 'sudo systemctl restart auditd']) {
    const result = session.run(command);
    assert.notEqual(result.exitCode, 0, `${command} must be refused`);
    assert.equal(session.vfs.read('/var/log/auth.log'), before, `${command} must not alter evidence`);
  }
  assert.ok(session.session.denied >= 8);
  assert.equal(session.vfs.read('/var/log/audit/audit.log'), w.MISSION_NEXT_OPERATION_NIGHT_SHIFT.generate('A').artifacts.linux.auditLog);
  assert.equal(session.run('echo note > /home/analyst/notes.txt').exitCode, 0, 'notes in the analyst home are allowed');
  assert.equal(session.run('cat /home/analyst/notes.txt').stdout, 'note\n');
}

// ---- 7. Mutating fixture facts changes what grading accepts ----
{
  const original = oracle('A');
  const mutated = { ...original, account: 'svc.mutant', ip: '203.0.113.9', failures: original.failures - 1, first: '02:14:55', login: '03:42:19', sudo: '03:43:01', stop: '03:43:20', gap: '03:43:20' };
  withMutatedFixture(app, fixture => {
    const linux = fixture.artifacts.linux;
    let skipped = false;
    linux.authLog = linux.authLog.split('\n').filter(line => {
      if (!skipped && line.includes('Failed password')) { skipped = true; return false; }
      return true;
    }).join('\n')
      .replaceAll(original.account, mutated.account).replaceAll(original.ip, mutated.ip)
      .replace(hms(fixture.truth.timeline.linuxSuccess), mutated.login).replace(hms(fixture.truth.timeline.sudoUse), mutated.sudo).replace(hms(fixture.truth.timeline.auditStopped), mutated.stop);
    linux.auditLog = linux.auditLog.replaceAll(original.account, mutated.account).replace(original.stop, mutated.stop);
    fixture.truth.timeline.auditStopped = fixture.truth.timeline.auditStopped.replace(original.stop, mutated.stop);
  }, () => {
    const session = startSession(app, 'sa-4', { seed: 'A' });
    session.complete(ID.ticket, 'cat /home/analyst/ir-ticket.txt');
    session.run('systemctl status rsyslog');
    session.run('grep "Failed password" /var/log/auth.log');
    session.run('grep Accepted /var/log/auth.log');
    assert.equal(session.check(ID.gap, mutated.gap).ok, true, 'mutated gap time accepted');
    assert.equal(session.check(ID.gap, original.gap).ok, false, 'original gap time rejected after mutation');
    assert.equal(session.check(ID.ip, mutated.ip).ok, true, 'mutated IP accepted');
    assert.equal(session.check(ID.ip, original.ip).ok, false, 'original IP rejected after mutation');
    assert.equal(session.check(ID.account, mutated.account).ok, true);
    assert.equal(session.check(ID.account, original.account).ok, false);
    session.run('journalctl -u auditd');
    ['grep sudo /var/log/auth.log', 'grep "Failed password" /var/log/auth.log', 'grep Accepted /var/log/auth.log', 'systemctl status rsyslog'].forEach(command => session.run(command));
    assert.equal(session.check(ID.timeline, timelineFor(mutated)).ok, true, 'mutated timeline accepted');
    assert.equal(session.check(ID.timeline, timelineFor(original)).ok, false, 'original timeline rejected after mutation');
    // The failure count in the note follows the mutated log.
    assert.equal(session.check(ID.note, noteFor(mutated)).ok, true, 'mutated case note accepted');
    assert.equal(session.check(ID.note, noteFor({ ...mutated, failures: original.failures })).ok, false, 'stale failure count rejected');
  });
  // Runtime evidence edits (not only fixture edits) also move the grader.
  const session = startSession(app, 'sa-4', { seed: 'A' });
  session.run('grep "Failed password" /var/log/auth.log');
  const changed = session.vfs.read('/var/log/auth.log').replaceAll(original.ip, '203.0.113.99');
  session.vfs.write('/var/log/auth.log', changed);
  assert.equal(session.check(ID.ip, '203.0.113.99').ok, true);
  assert.equal(session.check(ID.ip, original.ip).ok, false);
}

// ---- 8. Multiple valid full paths reach the same end state ----
{
  const session = startSession(app, 'sa-4', { seed: 'B' });
  solve(session, oracle('B'), {
    burst: "grep 'Failed password' /var/log/auth.log | awk '{print $9}' | sort | uniq -c",
    login: "awk '/Accepted/ {print $1, $7, $9}' /var/log/auth.log",
    sudo: 'grep "COMMAND=" /var/log/auth.log',
    stop: 'ausearch -m SERVICE_STOP',
  });
}

console.log('Linux log triage check passed.');
