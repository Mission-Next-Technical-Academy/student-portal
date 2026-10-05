import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const sandbox={console,window:{}}; vm.createContext(sandbox);
for(const file of ['src/data/fixtures/operation-night-shift.js','src/systems/night-shift-common.js','src/systems/powershell-rebuild.js','src/systems/validator.js','src/data/labs/security-assessments.labs.js']) vm.runInContext(fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8'),sandbox,{filename:file});
const lab=sandbox.window.MISSION_NEXT_LABS['sa-7'];
assert.equal(lab.title,'Contain, Collect, Rebuild');
assert(lab.exercises.flatMap(e=>e.steps).every(s=>s.phase&&s.objective));
assert.equal(lab.exercises.flatMap(e=>e.steps).length,8);
assert(!JSON.stringify(lab).includes('/subscriptions/training-sub-'));

const rebuildScript=`$vmName = 'NS-Jump-Rebuilt'
$tags = @{ IncidentId = $env:INCIDENT_ID }
$existing = Get-AzVM -Name $vmName
if ($null -eq $existing) {
  New-AzVM -Name $vmName -Image $env:APPROVED_IMAGE -VirtualNetworkName $env:RECOVERY_VNET -SubnetName $env:RECOVERY_SUBNET -SecurityGroupName $env:RECOVERY_NSG -PublicIpAddressName $null -Tag $tags
}
Start-DscConfiguration -Path 'C:\\IR\\Baseline' -Wait
Set-AzVMExtension -VMName $vmName -Name $env:MONITORING_EXTENSION
Set-AzDiagnosticSetting -VMName $vmName -WorkspaceId $env:WORKSPACE
$vm = Get-AzVM -Name $vmName
Get-AzOperationalInsightsSearchResult -WorkspaceId $env:WORKSPACE -Computer $vmName -Query 'Heartbeat'
foreach ($port in @(22,3389)) {
  Write-Output $port
}
for ($n = 0; $n -lt 1; $n++) {
  Write-Output $n
}
Write-Output 'Rebuild verified'`;

function prepareForRecovery(engine) {
  const account=engine.fixture.truth.identity.account, subnet=engine.envVars.MANAGEMENT_SUBNET;
  for(const line of ['Get-IRTicket',`Disable-ADAccount -Identity ${account}`,`Revoke-MgUserSignInSession -UserId ${account}`,`New-NetFirewallRule -Direction Inbound -Action Allow -RemoteAddress ${subnet} -LocalPort 22`,`New-NetFirewallRule -Direction Inbound -Action Allow -RemoteAddress ${subnet} -LocalPort 3389`,'wevtutil epl Security C:\\IR\\Security.evtx','Get-FileHash -LiteralPath C:\\IR\\Security.evtx | Export-Csv -Path C:\\IR\\custody.csv -NoTypeInformation','Unregister-ScheduledTask -TaskName UpdateTelemetry -Confirm:$false','Remove-ItemProperty -Path HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run -Name TelemetryHelper','Get-ScheduledTask','Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run']) {
    const result=engine.runCommand(line); assert.equal(result.exitCode,0,`${line}: ${result.stderr}`);
  }
}

for(const seed of ['A','B']) {
  const engine=sandbox.window.MISSION_NEXT_POWERSHELL_REBUILD.create({seed,user:'student',labId:'sa-7'});
  const command=line=>{const result=engine.runCommand(line);assert.equal(result.exitCode,0,`${line}\n${result.stderr}`);return result;};
  assert.equal(engine.check('ticket').ok,false);
  command('Get-IRTicket'); assert.equal(engine.check('ticket').ok,true);
  command(`Disable-ADAccount -Identity ${engine.fixture.truth.identity.account}`);
  assert.equal(engine.check('containment').ok,false);
  command(`Revoke-MgUserSignInSession -UserId ${engine.fixture.truth.identity.account}`);
  assert.equal(engine.check('containment').ok,true);
  assert.equal(engine.runCommand('New-NetFirewallRule -Direction Inbound -Action Allow -RemoteAddress 0.0.0.0/0 -LocalPort 22').exitCode,1,'overbroad firewall rule must be rejected');
  command(`New-NetFirewallRule -Direction Inbound -Action Allow -RemoteAddress ${engine.envVars.MANAGEMENT_SUBNET} -LocalPort 22`);
  command(`New-NetFirewallRule -Direction Inbound -Action Allow -RemoteAddress ${engine.envVars.MANAGEMENT_SUBNET} -LocalPort 3389`);
  assert.equal(engine.check('isolation').ok,true);
  assert.equal(command('wevtutil epl Security C:\\IR\\Security.evtx').exitCode,0);
  assert.equal(engine.runCommand('Get-FileHash -Path C:\\IR\\Security.evtx').exitCode,0);
  assert.equal(engine.runCommand('Get-FileHash C:\\IR\\Security.evtx | Export-Csv -Path C:\\IR\\custody.csv -NoTypeInformation').exitCode,0);
  assert.equal(engine.check('collection').ok,true);
  assert.equal(engine.runCommand('Unregister-ScheduledTask -TaskName unrelated -Confirm:$false').exitCode,1,'out-of-scope task removal must be refused');
  command('Unregister-ScheduledTask -TaskName UpdateTelemetry -Confirm:$false');
  command('Remove-ItemProperty -Path HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run -Name TelemetryHelper');
  assert.equal(engine.check('eradication').ok,false,'removal without verification is incomplete');
  command('Get-ScheduledTask'); command('Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run');
  assert.equal(engine.check('eradication').ok,true);

  const insecure=engine.runScript("$password = 'ClearText-123!'\nWrite-Output 'done'");
  assert.equal(insecure.exitCode,1); assert.equal(engine.check('secretFree').ok,false);
  assert.equal(engine.runScript("$credential = Get-Credential\nWrite-Output 'credential prompt used'").exitCode,0,'credential prompting is allowed');
  assert.equal(engine.check('secretFree').ok,false,'credential prompt alone is not a rebuild');
  assert.equal(engine.runScript('$secret = Get-AzKeyVaultSecret -Name IRCredential\nWrite-Output \'vault reference used\'').exitCode,0,'Key Vault references are allowed');
  assert.equal(sandbox.window.MISSION_NEXT_POWERSHELL_REBUILD.hasLiteralPassword('$password = Get-Credential'),false);
  assert.equal(sandbox.window.MISSION_NEXT_POWERSHELL_REBUILD.hasLiteralPassword("$pwd = 'literal'"),true);
  assert.equal(sandbox.window.MISSION_NEXT_POWERSHELL_REBUILD.hasLiteralPassword("$pass = 'literal'"),true);
  assert.equal(sandbox.window.MISSION_NEXT_POWERSHELL_REBUILD.hasLiteralPassword("Set-ADAccountPassword -AccountPassword 'literal'"),true);
  assert.equal(sandbox.window.MISSION_NEXT_POWERSHELL_REBUILD.hasLiteralPassword("New-Item -Password 'ClearText'"),true);
  const badSyntax=engine.runScript("Invoke-Expression 'anything'"); assert.equal(badSyntax.exitCode,1,'unsupported syntax must fail explicitly');
  const falseSuccess=engine.runScript("Write-Output 'Rebuild verified'"); assert.equal(falseSuccess.exitCode,0); assert.equal(engine.check('rebuild').ok,false,'success text alone cannot pass state grading');
  const badImage=engine.runScript(rebuildScript.replace('$env:APPROVED_IMAGE',"'compromised-disk'")); assert.equal(badImage.exitCode,1); assert.equal(engine.check('rebuild').ok,false,'compromised image must not pass');
  const rebuilt=engine.runScript(rebuildScript); assert.equal(rebuilt.exitCode,0,rebuilt.stderr); assert.equal(engine.check('secretFree').ok,true); assert.equal(engine.check('rebuild').ok,true);
  assert.equal(engine.state.vmCreateCount,1);
  const second=engine.runScript(rebuildScript); assert.equal(second.exitCode,0,second.stderr); assert.equal(engine.state.vmCreateCount,1,'rerunning the script must not create a duplicate VM');
  assert.equal(engine.check('rebuild').ok,true);
  assert.equal(engine.check('postIncident','The credential was compromised, persistence was removed, containment completed, and detection should alert on task creation.').ok,true);
  assert.equal(engine.runScript('Set-Content C:\\real.txt x').exitCode,1,'unsupported file commands must fail');
}
const alternate=sandbox.window.MISSION_NEXT_POWERSHELL_REBUILD.create({seed:'B',user:'student',labId:'sa-7'});
prepareForRecovery(alternate);
const alternateScript=`$name = 'Rebuilt-Node-B'
$incidentTags = @{ IncidentId = $env:INCIDENT_ID }
New-AzVM -Tag $incidentTags -PublicIpAddressName $null -SecurityGroupName $env:RECOVERY_NSG -SubnetName $env:RECOVERY_SUBNET -VirtualNetworkName $env:RECOVERY_VNET -Image $env:APPROVED_IMAGE -Name $name
Start-DscConfiguration -Wait -Path 'C:\\IR\\baseline'
Set-AzVMExtension -Name $env:MONITORING_EXTENSION -VMName $name
Set-AzDiagnosticSetting -WorkspaceId $env:WORKSPACE -VMName $name
Get-AzVM -Name $name
Get-AzOperationalInsightsSearchResult -Computer $name -WorkspaceId $env:WORKSPACE -Query 'Heartbeat'`;
assert.equal(alternate.runScript(alternateScript).exitCode,0);
assert.equal(alternate.check('rebuild').ok,true,'alternate variable names and parameter order should pass');
const unsafe=sandbox.window.MISSION_NEXT_POWERSHELL_REBUILD.create({seed:'A',user:'bad-network',labId:'sa-7'});
prepareForRecovery(unsafe);
const publicScript=rebuildScript.replace('-PublicIpAddressName $null','-PublicIpAddressName public-address');
assert.equal(unsafe.runScript(publicScript).exitCode,0);
assert.equal(unsafe.check('rebuild').ok,false,'publicly exposed rebuild must not pass');
const badHeartbeat=sandbox.window.MISSION_NEXT_POWERSHELL_REBUILD.create({seed:'A',user:'bad-heartbeat',labId:'sa-7'});
prepareForRecovery(badHeartbeat);
assert.equal(badHeartbeat.runScript(rebuildScript.replace("-Query 'Heartbeat'","-Query 'AzureActivity'")).exitCode,0);
assert.equal(badHeartbeat.check('rebuild').ok,false,'an unrelated query must not synthesize Heartbeat');
const wrongAgent=sandbox.window.MISSION_NEXT_POWERSHELL_REBUILD.create({seed:'A',user:'wrong-agent',labId:'sa-7'});
prepareForRecovery(wrongAgent);
assert.equal(wrongAgent.runScript(rebuildScript.replace('$env:MONITORING_EXTENSION',"'monitor-placeholder'")).exitCode,0);
assert.equal(wrongAgent.check('rebuild').ok,false,'a non-approved extension must not pass monitoring');
console.log('PowerShell rebuild check passed (A/B, containment, custody ordering, scoped eradication, secret rejection, interpreter, verified idempotent rebuild).');
