// Deterministic, fictional cross-lab incident fixtures. No real systems involved.
(function () {
  const VARIANTS = {
    A: {
      date: '2026-09-25', account: 'temp.contractor', sourceIp: '198.51.100.42',
      linuxHost: 'FILESRV-01', windowsHost: 'JUMP-07',
      vm: 'nightshift-vm-a', nsg: 'nightshift-nsg-a', subscription: 'training-sub-a',
      rogueDisk: 'nightshift-osdisk-a', snapshot: 'ir-snapshot-a',
      approvedImage: '/subscriptions/training-sub-a/resourceGroups/images/providers/Microsoft.Compute/galleries/base/images/ubuntu-soc/versions/2.4.0',
      failedStart: '02:14:50', login: '02:15:34', sudo: '02:16:02', auditStop: '02:16:10',
      windowsFail: '02:22:11', windowsLogin: '02:23:08', process: '02:24:19',
      cloudLogin: '02:45:03', vmWrite: '02:49:16', nsgWrite: '02:51:40', roleWrite: '02:53:12',
      snapshotCreated: '03:00:00', snapshotVerified: '03:02:30', rogueVmDeallocated: '03:08:00', rogueVmDeleted: '03:14:00', recoveryVmCreated: '04:00:00',
      failures: 7,
    },
    B: {
      date: '2026-10-04', account: 'temp.vendor', sourceIp: '203.0.113.77',
      linuxHost: 'FILESRV-02', windowsHost: 'JUMP-09',
      vm: 'nightshift-vm-b', nsg: 'nightshift-nsg-b', subscription: 'training-sub-b',
      rogueDisk: 'nightshift-osdisk-b', snapshot: 'ir-snapshot-b',
      approvedImage: '/subscriptions/training-sub-b/resourceGroups/images/providers/Microsoft.Compute/galleries/base/images/ubuntu-soc/versions/2.5.0',
      failedStart: '03:31:20', login: '03:32:04', sudo: '03:33:27', auditStop: '03:33:35',
      windowsFail: '03:40:02', windowsLogin: '03:41:16', process: '03:42:30',
      cloudLogin: '04:05:14', vmWrite: '04:08:55', nsgWrite: '04:10:21', roleWrite: '04:12:43',
      snapshotCreated: '04:25:00', snapshotVerified: '04:32:15', rogueVmDeallocated: '04:38:00', rogueVmDeleted: '04:45:00', recoveryVmCreated: '05:10:00',
      failures: 6,
    },
  };

  function iso(date, time) { return `${date}T${time}Z`; }
  function addSeconds(timestamp, seconds) { return new Date(Date.parse(timestamp) + seconds * 1000).toISOString(); }
  function xmlEscape(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
  function serializeWindowsEvent(event, hostname, index) {
    const fields = [
      ['TargetUserName', event.targetUser], ['IpAddress', event.sourceIp], ['LogonType', event.logonType],
      ['Status', event.status], ['NewProcessName', event.image], ['ParentProcessName', event.parentImage],
      ['CommandLine', event.commandLine], ['ProcessId', event.processId || (event.eventId === 4688 ? '0x1a2c' : undefined)],
    ].filter(([, value]) => value !== undefined).map(([name, value]) => `<Data Name="${name}">${xmlEscape(value)}</Data>`).join('');
    return `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event"><System><Provider Name="Microsoft-Windows-Security-Auditing"/><EventID>${event.eventId}</EventID><Version>0</Version><Level>0</Level><Task>${event.eventId}</Task><Opcode>0</Opcode><TimeCreated SystemTime="${xmlEscape(event.timestamp)}"/><EventRecordID>${61000 + index}</EventRecordID><Channel>Security</Channel><Computer>${xmlEscape(hostname)}</Computer><Execution ProcessID="4" ThreadID="8"/><Keywords>0x8020000000000000</Keywords></System><EventData>${fields}</EventData></Event>`;
  }
  function generate(seed = 'A') {
    const key = String(seed).toUpperCase();
    const facts = VARIANTS[key];
    if (!facts) throw new Error(`Unknown Operation Night Shift seed: ${seed}`);
    const actor = `${facts.account}@nightshift.test`;
    const failTimes = Array.from({ length: facts.failures }, (_, i) => new Date(Date.parse(`${facts.date}T${facts.failedStart}Z`) + i * 5000).toISOString());
    const linuxAuth = [
      ...failTimes.map(time => `${time} ${facts.linuxHost} sshd[2100]: Failed password for ${facts.account} from ${facts.sourceIp} port 38814 ssh2`),
      `${iso(facts.date, facts.login)} ${facts.linuxHost} sshd[2100]: Accepted password for ${facts.account} from ${facts.sourceIp} port 38814 ssh2`,
      `${iso(facts.date, facts.sudo)} ${facts.linuxHost} sudo: ${facts.account} : TTY=pts/3 ; PWD=/home/${facts.account} ; USER=root ; COMMAND=/usr/bin/id`,
      `${iso(facts.date, facts.auditStop)} ${facts.linuxHost} systemd[1]: Stopped auditd.service - Security Auditing Service.`,
    ];
    const windowsEvents = [
      ...Array.from({ length: Math.min(3, failTimes.length) }, (_, index) => ({ eventId: 4625, timestamp: addSeconds(iso(facts.date, facts.windowsFail), index * 5), sequence: index + 1, targetUser: facts.account, sourceIp: facts.sourceIp, logonType: 10, status: '0xC000006D' })),
      { eventId: 4624, timestamp: iso(facts.date, facts.windowsLogin), targetUser: facts.account, sourceIp: facts.sourceIp, logonType: 10, status: 'success' },
      { eventId: 4688, timestamp: iso(facts.date, facts.process), targetUser: facts.account, sourceIp: facts.sourceIp, parentImage: 'C:\\Windows\\System32\\services.exe', image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', commandLine: 'powershell.exe -NoProfile -Command "& { Start-Process C:\\ProgramData\\Cache\\stage.ps1 }"', processId: '0x1a2c' },
    ];
    const heartbeatTime = iso(facts.date, key === 'A' ? '05:30:00' : '06:20:00');
    const recoveryVm = `recovered-${facts.vm}`;
    const truth = {
      identity: { account: facts.account, principal: actor, sourceIp: facts.sourceIp },
      timeline: {
        failedLogins: failTimes, linuxSuccess: iso(facts.date, facts.login), sudoUse: iso(facts.date, facts.sudo), auditStopped: iso(facts.date, facts.auditStop),
        windowsFailures: windowsEvents.filter(event => event.eventId === 4625).map(event => event.timestamp), windowsSuccess: iso(facts.date, facts.windowsLogin), processStart: iso(facts.date, facts.process),
        cloudSignIn: iso(facts.date, facts.cloudLogin), vmCreated: iso(facts.date, facts.vmWrite), nsgChanged: iso(facts.date, facts.nsgWrite), roleChanged: iso(facts.date, facts.roleWrite), heartbeat: heartbeatTime,
        snapshotCreated: iso(facts.date, facts.snapshotCreated), snapshotVerified: iso(facts.date, facts.snapshotVerified), rogueVmDeallocated: iso(facts.date, facts.rogueVmDeallocated), rogueVmDeleted: iso(facts.date, facts.rogueVmDeleted), recoveryVmCreated: iso(facts.date, facts.recoveryVmCreated),
      },
      resources: {
        linuxHost: facts.linuxHost, windowsHost: facts.windowsHost, subscription: facts.subscription, vm: facts.vm, nsg: facts.nsg,
        rogueDisk: facts.rogueDisk, snapshot: facts.snapshot, approvedImage: facts.approvedImage, recoveryVm,
        scheduledTask: `\\${facts.account}\\UpdateTelemetry`, runKey: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\TelemetryHelper',
        beaconIp: '192.0.2.88', approvedRecoveryNsg: `recovery-nsg-${key.toLowerCase()}`, siemWorkspace: `soc-workspace-${key.toLowerCase()}`,
        windowsApprovedImage: `/subscriptions/${facts.subscription}/resourceGroups/images/providers/Microsoft.Compute/galleries/windows/images/soc-jumphost/versions/2026.${key === 'A' ? '09.1' : '09.2'}`,
        recoveryVnet: `ir-recovery-vnet-${key.toLowerCase()}`, recoverySubnet: `ir-management-subnet-${key.toLowerCase()}`,
        managementSubnet: key === 'A' ? '10.40.8.0/24' : '10.41.8.0/24', windowsBaseline: 'SOC-JumpHost-Baseline-v4',
        monitoringExtension: 'AzureMonitorWindowsAgent', incidentId: `IR-NS-20${key === 'A' ? '41' : '42'}`,
      },
    };
    const artifacts = {
      linux: {
        hostname: facts.linuxHost,
        authLog: linuxAuth.join('\n') + '\n',
        auditLog: `${iso(facts.date, facts.auditStop)} type=SERVICE_STOP msg=audit(incident): pid=1 uid=0 auid=1099 acct="${facts.account}" exe="/usr/bin/systemctl" comm="systemctl" key="service-stop"\n`,
        sudoers: `# unauthorized incident change\n${facts.account} ALL=(ALL) NOPASSWD: ALL\n`,
        persistence: { service: 'netd.service', unitPath: '/etc/systemd/system/netd.service', executable: '/usr/local/sbin/netd', listener: '0.0.0.0:31337', listenerProcess: 'netd', bindshellDetected: true },
      },
      windows: {
        hostname: facts.windowsHost,
        securityEvents: windowsEvents,
        eventXml: windowsEvents.map((event, index) => serializeWindowsEvent(event, facts.windowsHost, index)),
        scheduledTask: { path: truth.resources.scheduledTask, action: 'C:\\ProgramData\\Cache\\stage.ps1', runAs: facts.account },
        runKey: { path: truth.resources.runKey, value: 'C:\\ProgramData\\Cache\\telemetry.exe', owner: facts.account },
        droppedFile: { path: 'C:\\ProgramData\\Cache\\telemetry.exe', signerStatus: 'Unverified', prevalence: 'Unknown' },
        beacon: { localHost: facts.windowsHost, remoteAddress: truth.resources.beaconIp, state: 'Established', owner: facts.account },
      },
      cloud: {
        subscription: facts.subscription,
        signIns: [{ timestamp: iso(facts.date, facts.cloudLogin), userPrincipalName: actor, sourceIp: facts.sourceIp, riskState: 'atRisk', result: 'success' }],
        activity: [
          { timestamp: iso(facts.date, facts.vmWrite), caller: actor, operation: 'Microsoft.Compute/virtualMachines/write', resource: facts.vm, subscription: facts.subscription },
          { timestamp: iso(facts.date, facts.nsgWrite), caller: actor, operation: 'Microsoft.Network/networkSecurityGroups/securityRules/write', resource: facts.nsg, source: '0.0.0.0/0', destinationPort: '22', subscription: facts.subscription },
          { timestamp: iso(facts.date, facts.roleWrite), caller: actor, operation: 'Microsoft.Authorization/roleAssignments/write', resource: 'Contributor', subscription: facts.subscription },
          { timestamp: iso(facts.date, facts.snapshotCreated), caller: 'soc-analyst@nightshift.test', operation: 'Microsoft.Compute/snapshots/write', resource: facts.snapshot, sourceDisk: facts.rogueDisk, subscription: facts.subscription },
          { timestamp: iso(facts.date, facts.snapshotVerified), caller: 'soc-analyst@nightshift.test', operation: 'Training.Snapshots/verify/action', resource: facts.snapshot, sourceDisk: facts.rogueDisk, verified: true, subscription: facts.subscription },
          { timestamp: iso(facts.date, facts.rogueVmDeallocated), caller: 'soc-analyst@nightshift.test', operation: 'Microsoft.Compute/virtualMachines/deallocate/action', resource: facts.vm, sourceDisk: facts.rogueDisk, afterSnapshotVerification: facts.snapshot, subscription: facts.subscription },
          { timestamp: iso(facts.date, facts.rogueVmDeleted), caller: 'soc-analyst@nightshift.test', operation: 'Microsoft.Compute/virtualMachines/delete', resource: facts.vm, sourceDisk: facts.rogueDisk, afterSnapshotVerification: facts.snapshot, subscription: facts.subscription },
          { timestamp: iso(facts.date, facts.recoveryVmCreated), caller: 'soc-analyst@nightshift.test', operation: 'Microsoft.Compute/virtualMachines/write', resource: recoveryVm, image: facts.approvedImage, sourceSnapshot: null, subscription: facts.subscription },
          { timestamp: heartbeatTime, caller: 'AzureMonitor', operation: 'Microsoft.Insights/Heartbeat', resource: recoveryVm, workspace: `soc-workspace-${key.toLowerCase()}`, subscription: facts.subscription },
        ],
        vm: { name: facts.vm, osDisk: facts.rogueDisk, image: 'compromised-custom-disk', publicIp: true, nsg: facts.nsg, deallocatedAt: iso(facts.date, facts.rogueVmDeallocated), deletedAt: iso(facts.date, facts.rogueVmDeleted) },
        snapshot: { name: facts.snapshot, sourceDisk: facts.rogueDisk, createdAt: truth.timeline.snapshotCreated, verifiedAt: truth.timeline.snapshotVerified, verified: true },
        responseLifecycle: [
          { action: 'snapshot-created', timestamp: truth.timeline.snapshotCreated, snapshot: facts.snapshot, sourceDisk: facts.rogueDisk },
          { action: 'snapshot-verified', timestamp: truth.timeline.snapshotVerified, snapshot: facts.snapshot, sourceDisk: facts.rogueDisk, verified: true },
          { action: 'rogue-vm-deallocated', timestamp: truth.timeline.rogueVmDeallocated, vm: facts.vm, snapshot: facts.snapshot },
          { action: 'rogue-vm-deleted', timestamp: truth.timeline.rogueVmDeleted, vm: facts.vm, snapshot: facts.snapshot },
          { action: 'recovery-vm-created', timestamp: truth.timeline.recoveryVmCreated, vm: recoveryVm, image: facts.approvedImage },
          { action: 'heartbeat-observed', timestamp: heartbeatTime, vm: recoveryVm, workspace: truth.resources.siemWorkspace },
        ],
        recovery: { vm: recoveryVm, createdAt: truth.timeline.recoveryVmCreated, image: facts.approvedImage, sourceSnapshot: null, publicIp: false, nsg: truth.resources.approvedRecoveryNsg, incidentTag: `IR-${key}-204`, monitoringAgent: 'AzureMonitorLinuxAgent', workspace: truth.resources.siemWorkspace, heartbeat: { timestamp: heartbeatTime, vm: recoveryVm, workspace: truth.resources.siemWorkspace } },
      },
    };
    return { scenarioId: 'operation-night-shift', seed: key, truth, artifacts };
  }

  window.MISSION_NEXT_OPERATION_NIGHT_SHIFT = { generate, seeds: ['A', 'B'] };
})();
