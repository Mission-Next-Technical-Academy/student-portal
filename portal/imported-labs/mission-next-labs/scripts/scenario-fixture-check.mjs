import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'src/data/fixtures/operation-night-shift.js'), 'utf8'), context);
const generate = context.window.MISSION_NEXT_OPERATION_NIGHT_SHIFT.generate;
const docIp = ip => /^(?:192\.0\.2|198\.51\.100|203\.0\.113)\.(?:\d{1,3})$/.test(ip);
const noAliasedObjects = value => {
  const seen = new Set();
  function visit(item) {
    if (!item || typeof item !== 'object') return;
    assert(!seen.has(item), 'Fixture must not reuse mutable objects across its graph');
    seen.add(item);
    Object.values(item).forEach(visit);
  }
  visit(value);
};
const decodeXml = value => value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

for (const seed of ['A', 'B']) {
  const first = generate(seed);
  const replay = generate(seed);
  assert.equal(JSON.stringify(first), JSON.stringify(replay), `${seed} must be deterministic`);
  assert.notEqual(first, replay);
  assert.notEqual(first.artifacts.windows.securityEvents, replay.artifacts.windows.securityEvents);
  noAliasedObjects(first);

  const { truth, artifacts } = first;
  const { account, principal, sourceIp } = truth.identity;
  const { linux, windows, cloud } = artifacts;
  assert(docIp(sourceIp), 'External source IP must use an RFC 5737 documentation range');
  assert.equal(principal, `${account}@nightshift.test`);
  assert.equal(truth.resources.linuxHost, linux.hostname);
  assert.equal(truth.resources.windowsHost, windows.hostname);
  assert(linux.authLog.includes(`Failed password for ${account} from ${sourceIp}`));
  assert(linux.authLog.includes(`Accepted password for ${account} from ${sourceIp}`));
  assert.equal((linux.authLog.match(/Failed password/g) || []).length, truth.timeline.failedLogins.length);
  assert(truth.timeline.failedLogins.every(time => linux.authLog.includes(time)));
  assert(linux.authLog.includes(truth.timeline.linuxSuccess));
  assert(linux.authLog.includes(truth.timeline.sudoUse));
  assert(linux.auditLog.includes(account) && linux.auditLog.includes(truth.timeline.auditStopped));
  assert(linux.sudoers.includes(account));
  assert.equal(linux.persistence.service, 'netd.service');
  assert.equal(linux.persistence.bindshellDetected, true);

  assert(windows.securityEvents.some(event => event.eventId === 4625));
  assert(windows.securityEvents.some(event => event.eventId === 4624 && event.logonType === 10));
  assert(windows.securityEvents.some(event => event.eventId === 4688 && event.parentImage && event.image));
  assert(windows.securityEvents.every(event => event.targetUser === account && event.sourceIp === sourceIp));
  assert.deepEqual(windows.securityEvents.filter(event => event.eventId === 4625).map(event => event.timestamp), truth.timeline.windowsFailures);
  assert.equal(windows.securityEvents.find(event => event.eventId === 4624).timestamp, truth.timeline.windowsSuccess);
  assert.equal(windows.securityEvents.find(event => event.eventId === 4688).timestamp, truth.timeline.processStart);
  assert.equal(windows.eventXml.length, windows.securityEvents.length, 'Each Windows event needs serialized XML');
  windows.eventXml.forEach((xml, index) => {
    const event = windows.securityEvents[index];
    const eventId = Number(xml.match(/<EventID>(\d+)<\/EventID>/)?.[1]);
    const timestamp = xml.match(/<TimeCreated SystemTime="([^"]+)"\/>/)?.[1];
    const computer = decodeXml(xml.match(/<Computer>([\s\S]*?)<\/Computer>/)?.[1] || '');
    const fields = Object.fromEntries([...xml.matchAll(/<Data Name="([^"]+)">([\s\S]*?)<\/Data>/g)].map(match => [match[1], decodeXml(match[2])]));
    assert.equal(eventId, event.eventId);
    assert.equal(timestamp, event.timestamp);
    assert.equal(computer, windows.hostname);
    assert.equal(fields.TargetUserName, account);
    assert.equal(fields.IpAddress, sourceIp);
    if (event.logonType !== undefined) assert.equal(fields.LogonType, String(event.logonType));
    if (event.eventId === 4688) {
      assert.equal(fields.ParentProcessName, event.parentImage);
      assert.equal(fields.NewProcessName, event.image);
      assert.equal(fields.CommandLine, event.commandLine);
      assert(xml.includes('&amp;'), 'XML serializer must escape event data');
    }
  });
  assert(windows.scheduledTask.path.includes(account));
  assert(windows.runKey.path.includes('CurrentVersion\\Run'));
  assert.equal(windows.beacon.remoteAddress, '192.0.2.88');
  assert(docIp(windows.beacon.remoteAddress));

  assert.equal(cloud.subscription, truth.resources.subscription);
  assert.equal(cloud.signIns[0].userPrincipalName, principal);
  assert.equal(cloud.signIns[0].sourceIp, sourceIp);
  assert.equal(cloud.signIns[0].timestamp, truth.timeline.cloudSignIn);
  assert(cloud.signIns[0].riskState);
  assert(cloud.activity.some(event => event.operation === 'Microsoft.Compute/virtualMachines/write' && event.resource === truth.resources.vm));
  assert(cloud.activity.some(event => event.operation === 'Microsoft.Network/networkSecurityGroups/securityRules/write' && event.source === '0.0.0.0/0'));
  assert(cloud.activity.some(event => event.operation === 'Microsoft.Authorization/roleAssignments/write'));
  assert.equal(cloud.activity.find(event => event.operation === 'Microsoft.Compute/virtualMachines/write').timestamp, truth.timeline.vmCreated);
  assert.equal(cloud.activity.find(event => event.operation === 'Microsoft.Network/networkSecurityGroups/securityRules/write').timestamp, truth.timeline.nsgChanged);
  assert.equal(cloud.activity.find(event => event.operation === 'Microsoft.Authorization/roleAssignments/write').timestamp, truth.timeline.roleChanged);
  assert.equal(cloud.vm.osDisk, truth.resources.rogueDisk);
  assert.equal(cloud.snapshot.sourceDisk, truth.resources.rogueDisk);
  assert.equal(cloud.snapshot.createdAt, truth.timeline.snapshotCreated);
  assert.equal(cloud.snapshot.verifiedAt, truth.timeline.snapshotVerified);
  assert.equal(cloud.snapshot.verified, true);
  assert.equal(cloud.recovery.image, truth.resources.approvedImage);
  assert.equal(cloud.recovery.createdAt, truth.timeline.recoveryVmCreated);
  assert.notEqual(cloud.recovery.image, cloud.vm.image);
  assert.equal(cloud.recovery.heartbeat.workspace, truth.resources.siemWorkspace);
  assert.equal(cloud.recovery.heartbeat.vm, cloud.recovery.vm);
  assert.equal(cloud.recovery.heartbeat.timestamp, truth.timeline.heartbeat);
  const lifecycle = cloud.responseLifecycle;
  const lifecycleTimes = lifecycle.map(item => Date.parse(item.timestamp));
  assert(lifecycleTimes.every((time, index) => index === 0 || time > lifecycleTimes[index - 1]), 'Response lifecycle must be strictly chronological');
  assert.equal(lifecycle.map(item => item.action).join(','), 'snapshot-created,snapshot-verified,rogue-vm-deallocated,rogue-vm-deleted,recovery-vm-created,heartbeat-observed');
  assert.equal(lifecycle[0].sourceDisk, truth.resources.rogueDisk);
  assert.equal(lifecycle[1].snapshot, truth.resources.snapshot);
  assert.equal(lifecycle[1].verified, true);
  assert(lifecycle.slice(2, 4).every(item => item.snapshot === truth.resources.snapshot && item.vm === truth.resources.vm));
  assert.equal(Date.parse(lifecycle[1].timestamp) < Date.parse(lifecycle[2].timestamp), true, 'Rogue VM containment follows verified snapshot');
  assert.equal(lifecycle[4].image, truth.resources.approvedImage);
  assert.equal(Date.parse(lifecycle[4].timestamp) < Date.parse(lifecycle[5].timestamp), true, 'Heartbeat must follow recovery build');
  assert.equal(lifecycle[5].vm, cloud.recovery.vm);
  const operations = cloud.activity;
  assert(operations.some(item => item.operation === 'Microsoft.Compute/snapshots/write' && item.resource === truth.resources.snapshot && item.sourceDisk === truth.resources.rogueDisk));
  assert(operations.some(item => item.operation === 'Training.Snapshots/verify/action' && item.resource === truth.resources.snapshot && item.verified === true));
  assert(operations.some(item => item.operation === 'Microsoft.Compute/virtualMachines/delete' && item.resource === truth.resources.vm && item.afterSnapshotVerification === truth.resources.snapshot));
  assert(operations.some(item => item.operation === 'Microsoft.Compute/virtualMachines/write' && item.resource === cloud.recovery.vm && item.image === truth.resources.approvedImage));
  assert(operations.some(item => item.operation === 'Microsoft.Insights/Heartbeat' && item.resource === cloud.recovery.vm && item.timestamp === truth.timeline.heartbeat));
  assert(/\.test$/.test(principal.split('@')[1]), 'Fixture domains must remain in .test');

  first.artifacts.windows.securityEvents[0].eventId = -1;
  assert.equal(replay.artifacts.windows.securityEvents[0].eventId, 4625, 'Mutating one generated fixture must not affect another');
}

const a = generate('A');
const b = generate('B');
for (const field of ['account', 'sourceIp']) assert.notEqual(a.truth.identity[field], b.truth.identity[field]);
for (const field of ['linuxSuccess', 'windowsSuccess', 'cloudSignIn']) assert.notEqual(a.truth.timeline[field], b.truth.timeline[field]);
for (const field of ['linuxHost', 'windowsHost', 'subscription', 'vm', 'nsg']) assert.notEqual(a.truth.resources[field], b.truth.resources[field]);
assert.throws(() => generate('C'), /Unknown Operation Night Shift seed/);
console.log('Operation Night Shift A/B fixtures: deterministic, consistent, reserved, and isolated.');
