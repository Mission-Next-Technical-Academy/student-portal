import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const context = vm.createContext({ window: {}, console });
for (const file of ['src/systems/virtualFs.js', 'src/systems/validator.js', 'src/systems/gating.js', 'src/systems/iam-review.js', 'src/data/labs/security-assessments.labs.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
// The engine precedes JSX in this file. Exercise the actual shared implementation.
const terminal = fs.readFileSync(path.join(root, 'src/shells/LinuxTerminalShell.jsx'), 'utf8');
vm.runInContext(terminal.split('  // ─── React component')[0] + '\n})();', context);
const w = context.window;
const review = w.MISSION_NEXT_IAM_REVIEW;
const lab = w.MISSION_NEXT_LABS['sa-5'];
const steps = w.MISSION_NEXT_GATING.flattenSteps(lab);
const vfs = w.createVirtualFs(lab.environment.fs());
const session = review.createSession();
const env = { vfs, cwd: '/home/analyst', user: 'analyst', host: 'iam-server', history: [] };
const originalLogs = vfs.read('/var/log/auth.log');
const originalGroups = vfs.read('/etc/group');
let latest;
function run(command) { latest = review.runLine(env, command, session); return latest; }
function check(index, submission) {
  return w.validateStep(steps[index], { vfs, observed: latest.observed, commandResult: latest }, submission);
}
function pass(index, command = steps[index].command) {
  run(command);
  assert.equal(check(index, command).ok, true, `Step ${index + 1}: ${JSON.stringify(latest)} / ${JSON.stringify(check(index, command))}`);
}

assert.equal(steps.length, 15);
assert.equal(run('sudo gpasswd -d temp.contractor sudo').exitCode, 1);
assert.equal(vfs.read('/etc/group'), originalGroups);
assert.equal(check(9, 'sudo gpasswd -d temp.contractor sudo').ok, false);
assert.equal(run('ssh root@iam-server').exitCode, 1);
assert.equal(check(0, 'ssh analyst@iam-server').ok, false);
pass(0);
pass(1);
assert.equal(latest.stdout, 'analyst\n');
pass(2);
assert.equal(latest.stdout, 'iam-server\n');
pass(3);
pass(4);
pass(5);
assert.match(latest.stdout, /\(ALL : ALL\) ALL/);
assert.match(latest.stdout, /NOPASSWD: ALL/);
assert.equal(check(7, '198.51.100.42').ok, false, 'An answer before inspecting evidence must not pass');
pass(6);
assert.equal(latest.stdout.split('\n').filter(line => line.includes('Failed password')).length, 7);
assert.equal(check(7, '10.10.24.88').ok, false);
assert.equal(check(7, '198.51.100.42').ok, true);
assert.equal(check(8, '02:14:50').ok, false);
assert.equal(check(8, '02:15:34').ok, true);
assert.equal(run('gpasswd -d temp.contractor sudo').exitCode, 1);
assert.equal(run('sudo gpasswd -d helpdesk-admin sudo').exitCode, 1);
assert.equal(vfs.read('/etc/group'), originalGroups);
pass(9);
assert.equal(review.access(vfs).group, false);
assert.equal(review.access(vfs).direct, true, 'Removing a group must not erase the direct grant');
run('sudo -l -U temp.contractor');
assert.match(latest.stdout, /NOPASSWD: ALL/);
assert.equal(check(13, 'sudo -l -U temp.contractor').ok, false);
run('sudo visudo');
assert.equal(check(10, 'sudo visudo').ok, false, 'Opening the editor alone must not pass');
const policy = vfs.read('/etc/sudoers');
latest = review.savePolicy(vfs, session, '');
assert.equal(latest.exitCode, 1);
assert.equal(vfs.read('/etc/sudoers'), policy);
latest = review.savePolicy(vfs, session, policy.replace('root ALL=(ALL:ALL) ALL', 'root BROKEN'));
assert.equal(latest.exitCode, 1);
latest = review.savePolicy(vfs, session, policy);
assert.equal(check(10, 'sudo visudo').ok, false, 'Saving unchanged grants must not pass');
latest = review.savePolicy(vfs, session, policy.split('\n').filter(line => !line.startsWith('temp.contractor ')).join('\n'));
assert.equal(check(10, 'sudo visudo').ok, true);
assert.equal(review.access(vfs).direct, false);
pass(11);
pass(12);
assert.match(latest.stdout, /engineering/);
assert.doesNotMatch(latest.stdout, /\(sudo\)/);
pass(13);
assert.equal(latest.exitCode, 1, 'sudo -l with no allowed commands returns a nonzero status');
assert.match(latest.stdout, /not allowed/);
assert.equal(check(14, 'Done').ok, false);
const report = 'Reviewed temp.contractor; removed sudo group membership and the direct sudoers NOPASSWD grant. Observed 7 failures from 198.51.100.42 followed by a successful login at 02:15:34 UTC. Verified no sudo access remains. Escalate to the SOC; preserved logs.';
assert.equal(check(14, report).ok, true);
assert.equal(vfs.read('/var/log/auth.log'), originalLogs, 'Evidence must remain unchanged');
run('sudo -l -U helpdesk-admin');
assert.match(latest.stdout, /\(ALL : ALL\) ALL/, 'Authorized administrators must retain access');
const refreshed = w.createVirtualFs(lab.environment.fs());
review.restoreCompleted(refreshed, steps.slice(0, 14).map(step => step.id));
assert.equal(review.access(refreshed).group, false);
assert.equal(review.access(refreshed).direct, false);
assert.equal(refreshed.read('/var/log/auth.log'), originalLogs);
const legacy = new Set(['sa-5.ex1.s1', 'sa-5.ex4.s2']);
assert.equal(w.MISSION_NEXT_GATING.progressPct(lab, legacy), 0, 'Old completion records must not credit replacement steps');
vfs.write('/tmp/literals', 'tempXcontractor\ntemp.contractor\n');
assert.equal(run("grep -F 'temp.contractor' /tmp/literals").stdout, 'temp.contractor\n');
run('exit');
assert.equal(check(14, report).ok, false);
assert.equal(run('sudo visudo').exitCode, 1);
console.log('IAM SSH review: all 15 steps, negative cases, evidence preservation, and resume checks passed.');
