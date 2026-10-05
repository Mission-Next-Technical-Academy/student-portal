import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sandbox = { console, window:{} };
vm.createContext(sandbox);
for (const file of ['src/data/fixtures/operation-night-shift.js','src/systems/night-shift-common.js','src/systems/powershell-triage.js','src/systems/validator.js','src/data/labs/security-assessments.labs.js']) {
  vm.runInContext(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), sandbox, { filename:file });
}
const lab = sandbox.window.MISSION_NEXT_LABS['sa-6'];
assert.equal(lab.title, 'Windows Jump Host Triage');
assert.equal(lab.environment.shell, 'PowerShellShell');
assert(lab.exercises.flatMap(ex => ex.steps).every(step => step.phase && step.objective));
const allSteps = lab.exercises.flatMap(ex => ex.steps);
assert.equal(allSteps.length, 10);

for (const seed of ['A','B']) {
  const engine = sandbox.window.MISSION_NEXT_POWERSHELL_TRIAGE.create({ seed, user:'test', labId:'sa-6' });
  const attempt = (line, key) => {
    const result = engine.run(line);
    assert.equal(result.exitCode, 0, `${line}\n${result.stderr}`);
    assert(result.stdout.length > 0, `Expected object output for ${line}`);
    assert.equal(engine.check(key).ok, true, `${key} not satisfied by ${line}`);
  };
  [
    "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625,4624} | Where-Object {$_.Id -eq 4624} | Select-Object TimeCreated,TargetUserName,IpAddress,LogonType",
    "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624} | Where-Object Id -eq 4624 | Sort-Object TimeCreated | Format-Table",
    "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624} | Where-Object {$_.LogonType -eq 10} | Select-Object TargetUserName,IpAddress",
  ].forEach(line => attempt(line, 'logon'));
  [
    "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} | Where-Object {$_.Id -eq 4688} | Select-Object ParentImage,Image,CommandLine",
    "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} | Sort-Object TimeCreated | Format-Table",
    "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} | Select-Object Image,ParentImage | Where-Object Image -like '*powershell*'",
  ].forEach(line => attempt(line, 'process'));
  [
    "Get-ScheduledTask | Where-Object {$_.TaskPath -notlike '\\Microsoft\\*'} | Select-Object TaskPath,Actions",
    "Get-ScheduledTask | Where-Object TaskPath -like '*UpdateTelemetry' | Format-Table",
    "Get-ScheduledTask | Sort-Object TaskPath | Select-Object TaskPath,User",
  ].forEach(line => attempt(line, 'persistence'));
  [
    "Get-ItemProperty 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' | Select-Object Path,Value",
    "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run | Sort-Object Owner | Format-Table",
    "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run | Where-Object Owner -ne SYSTEM",
  ].forEach(line => attempt(line, 'run'));
  [
    'Get-CimInstance Win32_Process | Where-Object Name -eq powershell.exe | Select-Object ProcessId,ParentProcessId,Name',
    'Get-CimInstance Win32_Process | Sort-Object ProcessId | Format-Table',
    'Get-CimInstance Win32_Process | Where-Object {$_.ParentProcessId -eq 0x1a2c} | Select-Object *',
  ].forEach(line => attempt(line, 'processTree'));
  [
    'Get-FileHash C:\\ProgramData\\Cache\\telemetry.exe',
    'Get-FileHash -Algorithm SHA256 C:\\ProgramData\\Cache\\telemetry.exe | Format-Table',
    'Get-FileHash C:\\ProgramData\\Cache\\telemetry.exe | Select-Object Path,Hash,Algorithm',
  ].forEach(line => attempt(line, 'hash'));
  const signature = engine.run('Get-AuthenticodeSignature C:\\ProgramData\\Cache\\telemetry.exe | Select-Object Path,Status,SignerCertificate');
  assert.equal(signature.exitCode, 0);
  assert.match(signature.stdout, /NotSigned/);
  [
    'Get-NetTCPConnection -State Established | Where-Object RemotePort -eq 443 | Select-Object RemoteAddress,RemotePort,State',
    'Get-NetTCPConnection -State Established | Sort-Object RemoteAddress | Format-Table',
    'Get-NetTCPConnection | Where-Object {$_.State -eq Established} | Select-Object *',
  ].forEach(line => attempt(line, 'beacon'));
  assert.equal(engine.check('logonDetails', `${engine.fixture.truth.identity.account} ${engine.fixture.truth.identity.sourceIp}`).ok, true);
  assert.equal(engine.check('hashAssessment','Signer unknown; prevalence unknown; the hash alone is not proof.').ok, true);
  assert.equal(engine.check('handoff',`Evidence preserved. Request containment for ${engine.fixture.truth.identity.account} from ${engine.fixture.truth.identity.sourceIp}; scope is read-only triage.`).ok, true);
  const exported = engine.run("Get-NetTCPConnection -State Established | Export-Csv -Path beacon.csv");
  assert.equal(exported.exitCode, 0);
  assert(engine.state.exports['beacon.csv']);
  assert.equal(engine.run('Invoke-Expression "bad"').exitCode, 1, 'unsupported commands must fail explicitly');
}
console.log('PowerShell triage check passed (A/B fixtures, state checks, alternate pipeline paths, export and unsupported syntax).');
