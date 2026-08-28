/* Module 10 — independent incident-evidence handling and case-reconstruction labs.
 * All cases, identifiers, people, systems, and artifacts are synthetic and local.
 */

const MODULE_TEN_CUSTODY_LAB_ID = 'm10-evidence-custody-v1';
const MODULE_TEN_MAPPING_LAB_ID = 'm10-forensic-mapping-v1';
const MODULE_TEN_CUSTODY_KEY = 'lab-evidence-collection';
const MODULE_TEN_MAPPING_KEY = 'lab-attack-mapping';
const MODULE_TEN_PASSING_SCORE = 70;
const MODULE_TEN_CUSTODY_MINUTES = LABS.find((item) => item.key === MODULE_TEN_CUSTODY_KEY).instructionalMinutes;
const MODULE_TEN_MAPPING_MINUTES = LABS.find((item) => item.key === MODULE_TEN_MAPPING_KEY).instructionalMinutes;

const MODULE_TEN_ARTIFACTS = [
  { id: 'E10-01', type: 'Memory capture', source: 'WKS-27 · live response', acquired: '2026-08-19 10:42:18Z', size: '16.0 GB', hash: '8f01…a921', handling: 'Captured to clean encrypted media; source and tool version recorded.', detail: 'Volatile capture created before power-down. The acquisition log names collector analyst-14, source WKS-27, tool build 4.2, UTC time, destination media MED-104, and SHA-256 verification.', admissible: true },
  { id: 'E10-02', type: 'Forensic disk image', source: 'NVMe SN-X4-271', acquired: '2026-08-19 11:18:44Z', size: '512 GB', hash: 'demo-b4d9…c906', handling: 'Bit-stream image through validated read-only blocker; source and image hashes match.', detail: 'Image IMG-10-27 was acquired from NVMe SN-X4-271 with blocker WB-22. The source was placed in tamper seal S-104. A deliberately shortened synthetic SHA-256 display value was calculated twice and matched.', admissible: true },
  { id: 'E10-03', type: 'Identity audit export', source: 'Scoped acct-27 export', acquired: '2026-08-19 11:26:09Z', size: '2.4 MB', hash: '2e77…0c14', handling: 'Native JSON export; UTC query window and export hash recorded.', detail: 'The export contains only acct-27 events from 10:00Z–11:00Z. Query, time basis, operator, output path, and SHA-256 are present in the collection record.', admissible: true },
  { id: 'E10-04', type: 'Phone photograph', source: 'Analyst phone screen', acquired: '2026-08-19 11:31 local', size: '1 image', hash: 'Not recorded', handling: 'Personal device; no source identifier, time basis, or transfer record.', detail: 'A photograph shows one alert row but omits surrounding context. It was sent through personal messaging and has no documented provenance.', admissible: false },
  { id: 'E10-05', type: 'Repacked archive', source: 'Unknown desktop folder', acquired: 'Unknown', size: '2.1 MB', hash: '73ab…1109', handling: 'Created after export; original file list and transformation are undocumented.', detail: 'The archive has its own hash, but there is no record of who created it, which originals it contains, or whether files were changed during repackaging.', admissible: false },
  { id: 'E10-06', type: 'Loose USB copy', source: 'Unlabelled removable media', acquired: '2026-08-19 12:08 local', size: '512 GB', hash: 'b4d9…c906', handling: 'No media ID, seal, custodian signature, or receipt time.', detail: 'A matching short hash appears on a sticky note, but the media itself is unlabelled and never appears in the transfer ledger.', admissible: false },
];

const MODULE_TEN_CUSTODY_EVENTS = [
  { id: 'CC-101', time: '11:18:44Z', title: 'Acquire IMG-10-27', actor: 'analyst-14', receiver: 'analyst-14', control: 'WB-22 · source read-only', detail: 'Bit-stream acquisition begins after source and blocker identifiers are recorded.' },
  { id: 'CC-102', time: '11:32:10Z', title: 'Verify and seal', actor: 'analyst-14', receiver: 'analyst-14', control: 'SHA-256 match · seal S-104', detail: 'Source and image hashes match; the source is sealed and the image is set read-only.' },
  { id: 'CC-103', time: '12:05:27Z', title: 'Transfer sealed source', actor: 'analyst-14', receiver: 'courier-06', control: 'Both signatures · case FE-10-27', detail: 'Release and receipt timestamps, purpose, seal condition, and both custodians are recorded.' },
  { id: 'CC-104', time: '12:44:03Z', title: 'Vault receipt', actor: 'courier-06', receiver: 'custodian-03', control: 'Seal intact · locker L-18', detail: 'The evidence custodian signs receipt and records the controlled storage location.' },
];

const MODULE_TEN_TIMELINE = [
  { id: 'TL-201', time: '10:02:11Z', source: 'Change log', entity: 'WKS-44', title: 'Approved browser update completed', detail: 'Signed deployment job CHG-204 completed on another workstation.', causal: false },
  { id: 'TL-202', time: '10:14:03Z', source: 'Mail trace', entity: 'acct-61', title: 'Benefits_Update.html delivered', detail: 'An external message delivered an HTML attachment to acct-61; authentication alignment failed.', causal: true },
  { id: 'TL-203', time: '10:16:42Z', source: 'File audit', entity: 'WKS-61', title: 'Quarterly-plan.xlsx opened', detail: 'A signed spreadsheet application opened a known internal file without child activity.', causal: false },
  { id: 'TL-204', time: '10:17:08Z', source: 'Browser history', entity: 'WKS-61', title: 'Benefits_Update.html opened', detail: 'acct-61 opened the delivered attachment from the downloads folder.', causal: true },
  { id: 'TL-205', time: '10:18:19Z', source: 'Process telemetry', entity: 'WKS-61', title: 'HTML viewer spawned powershell.exe', detail: 'The encoded command ran beneath the attachment viewer from a user-writable path.', causal: true },
  { id: 'TL-206', time: '10:19:02Z', source: 'Network telemetry', entity: '203.0.113.210', title: 'Script contacted unusual destination', detail: 'The PowerShell process opened TLS to the documentation-range address; connection alone does not prove a download.', causal: true },
  { id: 'TL-207', time: '10:22:31Z', source: 'Task audit', entity: 'Benefits Sync', title: 'New sign-in task created', detail: 'powershell.exe registered a task that launches profile-cache.bin at user sign-in.', causal: true },
  { id: 'TL-208', time: '10:24:50Z', source: 'Admin log', entity: 'SRV-12', title: 'Backup retention task updated', detail: 'Approved automation changed a server task under ticket CHG-199.', causal: false },
  { id: 'TL-209', time: '10:28:14Z', source: 'Identity audit', entity: 'acct-61', title: 'Unfamiliar token refresh', detail: 'An unmanaged client refreshed acct-61 from 203.0.113.210; the account owner denied this session.', causal: true },
];

const MODULE_TEN_LINKS = [
  { id: 'L1', from: 'acct-61 mailbox', to: 'Benefits_Update.html', verb: 'delivered', supported: true },
  { id: 'L2', from: 'Benefits_Update.html', to: 'powershell.exe', verb: 'launched', supported: true },
  { id: 'L3', from: 'powershell.exe', to: '203.0.113.210', verb: 'connected', supported: true },
  { id: 'L4', from: 'powershell.exe', to: 'Benefits Sync task', verb: 'created', supported: true },
  { id: 'L5', from: '203.0.113.210', to: 'acct-61 token', verb: 'shared source', supported: true },
  { id: 'L6', from: 'Quarterly-plan.xlsx', to: 'Benefits Sync task', verb: 'created', supported: false },
  { id: 'L7', from: 'WKS-44 update', to: 'acct-61 token', verb: 'authorized', supported: false },
];

const MODULE_TEN_TECHNIQUES = [
  { id: 'T1566.001', label: 'T1566.001 · Spearphishing Attachment', help: 'Requires evidence that an attachment delivered the initial lure.' },
  { id: 'T1059.001', label: 'T1059.001 · PowerShell', help: 'Requires observed PowerShell execution.' },
  { id: 'T1053.005', label: 'T1053.005 · Scheduled Task/Job: Scheduled Task', help: 'Requires creation or use of a scheduled task.' },
  { id: 'T1078', label: 'T1078 · Valid Accounts', help: 'Requires observed use of an active account or session.' },
  { id: 'T1105', label: 'T1105 · Ingress Tool Transfer', help: 'A connection does not, by itself, establish a transferred tool.' },
  { id: 'T1486', label: 'T1486 · Data Encrypted for Impact', help: 'No encryption-impact evidence appears in this case slice.' },
];

let moduleTenCustodyState = null;
let moduleTenMappingState = null;
let moduleTenUser = null;
let moduleTenActiveLab = 'custody';

function moduleTenCustodyFreshDefaults() {
  return {
    inspectedArtifacts: [], selectedEvidence: [], activeArtifact: '', sourceChoice: '', methodChoice: '',
    timeChoice: '', hashChoice: '', verificationChoice: '', custodySequence: ['', '', '', ''],
    custodyRisk: '', preservationDecision: '', notes: '', hintsOpened: [], breakdown: null,
    feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleTenMappingFreshDefaults() {
  return {
    selectedTimeline: [], activeEvent: '', selectedLinks: [], rootCause: '', confidence: '',
    techniques: [], frameworkBoundary: '', notes: '', hintsOpened: [], breakdown: null,
    feedback: [], validationError: '', lastSubmittedAt: '',
  };
}

function moduleTenNormalize(state, defaults, arrays) {
  arrays.forEach((key) => { if (!Array.isArray(state[key])) state[key] = [...defaults[key]]; });
  if (!Array.isArray(state.flags)) state.flags = [];
  return state;
}

function moduleTenLoad(user) {
  moduleTenUser = user;
  const custodyDefaults = moduleTenCustodyFreshDefaults();
  const mappingDefaults = moduleTenMappingFreshDefaults();
  moduleTenCustodyState = moduleTenNormalize(
    LabRuntime.load(MODULE_TEN_CUSTODY_LAB_ID, user, custodyDefaults), custodyDefaults,
    ['inspectedArtifacts', 'selectedEvidence', 'custodySequence', 'hintsOpened', 'feedback', 'flags'],
  );
  moduleTenMappingState = moduleTenNormalize(
    LabRuntime.load(MODULE_TEN_MAPPING_LAB_ID, user, mappingDefaults), mappingDefaults,
    ['selectedTimeline', 'selectedLinks', 'techniques', 'hintsOpened', 'feedback', 'flags'],
  );
  while (moduleTenCustodyState.custodySequence.length < 4) moduleTenCustodyState.custodySequence.push('');
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'soc-analyst', 'soc-10');
}

function moduleTenSaveCustody() { if (moduleTenUser && moduleTenCustodyState) LabRuntime.save(MODULE_TEN_CUSTODY_LAB_ID, moduleTenUser, moduleTenCustodyState); }
function moduleTenSaveMapping() { if (moduleTenUser && moduleTenMappingState) LabRuntime.save(MODULE_TEN_MAPPING_LAB_ID, moduleTenUser, moduleTenMappingState); }
function moduleTenStatus(state) { return state.completed ? 'Complete' : state.attempts ? 'In progress' : 'Not started'; }
function moduleTenExact(selected, expected, points) {
  const correct = expected.filter((value) => selected.includes(value)).length;
  const extras = selected.filter((value) => !expected.includes(value)).length;
  return Math.max(0, Math.round((correct / expected.length) * points) - extras * Math.ceil(points / expected.length));
}
function moduleTenNoteScore(note, checks) {
  const text = String(note || '').trim().toLowerCase();
  return checks.reduce((sum, check) => sum + (check.pattern.test(text) ? check.points : 0), 0);
}

function moduleTenModuleNav() {
  return `<div class="m10-lab-tabs" role="tablist" aria-label="Module 10 independent labs">
    <button type="button" role="tab" id="m10-tab-custody" aria-selected="${moduleTenActiveLab === 'custody'}" tabindex="${moduleTenActiveLab === 'custody' ? '0' : '-1'}" data-m10-lab="custody"><i class="ri-archive-stack-line" aria-hidden="true"></i><span>Evidence &amp; custody<small>${moduleTenStatus(moduleTenCustodyState)}</small></span></button>
    <button type="button" role="tab" id="m10-tab-mapping" aria-selected="${moduleTenActiveLab === 'mapping'}" tabindex="${moduleTenActiveLab === 'mapping' ? '0' : '-1'}" data-m10-lab="mapping"><i class="ri-node-tree" aria-hidden="true"></i><span>Incident reconstruction<small>${moduleTenStatus(moduleTenMappingState)}</small></span></button>
  </div>`;
}

function moduleTenReference() {
  return `<details class="m10-reference" data-m10-hint="${moduleTenActiveLab}-reference" ${(
    moduleTenActiveLab === 'custody' ? moduleTenCustodyState : moduleTenMappingState
  ).hintsOpened.includes(`${moduleTenActiveLab}-reference`) ? 'open' : ''}><summary>Optional field reference</summary>${moduleTenActiveLab === 'custody'
    ? '<p>Preserve provenance, use validated acquisition controls, record UTC and identifiers, verify with a cryptographic hash, and document every transfer with release/receipt signatures and seal condition.</p>'
    : '<p>Build chronology from timestamps, distinguish correlation from causation, connect only evidenced entities, identify the earliest supported causal action, and map ATT&amp;CK only to observed behavior.</p>'}</details>`;
}

function moduleTenArtifactTable() {
  const active = MODULE_TEN_ARTIFACTS.find((item) => item.id === moduleTenCustodyState.activeArtifact);
  return `<div class="m10-table-wrap"><table class="m10-data-table"><caption class="m10-visually-hidden">Synthetic evidence package inventory for case FE-10-27</caption><thead><tr><th scope="col">Preserve</th><th scope="col">Artifact</th><th scope="col">Source</th><th scope="col">Acquired</th><th scope="col">Size</th><th scope="col">SHA-256</th><th scope="col">Handling</th></tr></thead><tbody>${MODULE_TEN_ARTIFACTS.map((item) => {
    const selected = moduleTenCustodyState.selectedEvidence.includes(item.id);
    return `<tr class="${selected ? 'is-selected' : ''}"><td data-label="Preserve"><label class="m10-evidence-check"><input type="checkbox" name="custodyEvidence" value="${esc(item.id)}" ${selected ? 'checked' : ''} /><span>${esc(item.id)}</span></label></td><td data-label="Artifact"><strong>${esc(item.type)}</strong></td><td data-label="Source">${esc(item.source)}</td><td data-label="Acquired"><time>${esc(item.acquired)}</time></td><td data-label="Size">${esc(item.size)}</td><td data-label="SHA-256"><code>${esc(item.hash)}</code></td><td data-label="Handling"><button type="button" class="m10-inspect" data-m10-artifact="${esc(item.id)}" aria-expanded="${active?.id === item.id}">${active?.id === item.id ? 'Hide context' : 'Inspect context'}</button></td></tr>`;
  }).join('')}</tbody></table></div>${active ? `<aside class="m10-detail" id="m10-artifact-detail" tabindex="-1"><div><p class="m10-kicker">${esc(active.id)} · provenance detail</p><h4>${esc(active.type)}</h4><p>${esc(active.detail)}</p></div><button type="button" data-m10-close-artifact aria-label="Close artifact detail"><i class="ri-close-line" aria-hidden="true"></i></button></aside>` : ''}`;
}

function moduleTenRadio(name, selected, options) {
  return `<div class="m10-option-list">${options.map((item) => `<label><input type="radio" name="${esc(name)}" value="${esc(item.id)}" ${selected === item.id ? 'checked' : ''} /><span><strong>${esc(item.label)}</strong><small>${esc(item.help)}</small></span></label>`).join('')}</div>`;
}

function moduleTenCheck(name, selected, options) {
  return `<div class="m10-check-grid">${options.map((item) => `<label><input type="checkbox" name="${esc(name)}" value="${esc(item.id)}" ${selected.includes(item.id) ? 'checked' : ''} /><span><strong>${esc(item.label)}</strong><small>${esc(item.help || '')}</small></span></label>`).join('')}</div>`;
}

function moduleTenCustodyScorePanel() {
  const state = moduleTenCustodyState;
  if (state.validationError) return `<div class="m10-validation" id="m10-custody-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Evidence record incomplete</strong><p>${esc(state.validationError)}</p></div></div>`;
  if (!state.attempts || !state.breakdown) return `<div class="m10-score-empty" id="m10-custody-feedback" role="status">Scoring: observation 25 · analysis 25 · decision 25 · communication 25. Pass: ${MODULE_TEN_PASSING_SCORE}/100.</div>`;
  const b = state.breakdown;
  const passed = state.score >= MODULE_TEN_PASSING_SCORE;
  return `<section class="m10-score ${passed ? 'is-pass' : 'is-remediate'}" id="m10-custody-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m10-custody-score-title"><div class="m10-score-heading"><div><p class="m10-kicker">Attempt ${state.attempts} · best ${state.bestScore}/100</p><h3 id="m10-custody-score-title">${state.score}/100 — ${passed ? 'Evidence package accepted' : 'Repair the preservation record'}</h3></div><span>${state.score}</span></div>${moduleTenScoreGrid(b)}<ul class="m10-feedback-list">${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><div class="m10-remediation"><strong>Reference finding</strong><p>Preserve the memory capture, bit-stream disk image, and native identity export. IMG-10-27 must trace to NVMe SN-X4-271 through blocker WB-22 at 11:18:44Z, retain its matching recorded SHA-256 fingerprint, and move acquire → verify/seal → signed transfer → vault receipt. Quarantine the loose USB copy because its matching shortened display value does not repair missing custody.</p></div></section>`;
}

function moduleTenScoreGrid(b) {
  return `<div class="m10-score-grid" aria-label="Explainable score breakdown"><div><strong>${b.observation}/25</strong><span>Observation</span></div><div><strong>${b.analysis}/25</strong><span>Analysis</span></div><div><strong>${b.decision}/25</strong><span>Decision</span></div><div><strong>${b.communication}/25</strong><span>Communication</span></div></div>`;
}

function moduleTenCustodyLab() {
  const custodyOptions = MODULE_TEN_CUSTODY_EVENTS.map((event) => `<option value="${esc(event.id)}">${esc(event.id)} · ${esc(event.title)}</option>`).join('');
  return `<section class="m10-lab" role="tabpanel" aria-labelledby="m10-tab-custody"><div class="m10-lab-heading"><div><p class="m10-kicker">Independent lab · ${formatInstructionalMinutes(MODULE_TEN_CUSTODY_MINUTES)}</p><h2>Evidence Collection &amp; Chain of Custody</h2></div><span>${moduleTenStatus(moduleTenCustodyState)}</span></div>
    <div class="m10-objective"><i class="ri-focus-3-line" aria-hidden="true"></i><div><strong>Objective</strong><p>Produce a defensible evidence package for case FE-10-27 by selecting preserved originals, validating one acquisition record, resolving custody integrity, and communicating the disposition with at least ${MODULE_TEN_PASSING_SCORE}/100.</p></div></div>
    <div class="m10-case-brief"><div><p class="m10-kicker">Case FE-10-27 · assigned evidence slice</p><h3>Post-containment evidence intake</h3><p>A responder collected volatile, disk, and identity artifacts from a single workstation case. Determine which package elements retain defensible provenance and whether IMG-10-27 can enter controlled analysis.</p></div><dl><div><dt>Scope</dt><dd>1 device · 1 identity</dd></div><div><dt>Time basis</dt><dd>UTC unless labelled local</dd></div><div><dt>Authority</dt><dd>Evidence intake decision</dd></div></dl></div>
    ${moduleTenReference()}
    <section class="m10-workbench" aria-labelledby="m10-inventory-title"><div class="m10-panel-heading"><div><p class="m10-kicker">Dataset</p><h3 id="m10-inventory-title">Acquisition package inventory</h3></div><span>${moduleTenCustodyState.inspectedArtifacts.length}/6 inspected · ${moduleTenCustodyState.selectedEvidence.length} selected</span></div>${moduleTenArtifactTable()}
      <div class="m10-ledger"><div class="m10-panel-heading"><div><p class="m10-kicker">Custody dataset</p><h3>IMG-10-27 transfer ledger</h3></div><span>4 recorded events</span></div><div class="m10-ledger-grid">${MODULE_TEN_CUSTODY_EVENTS.map((event) => `<article><time>${esc(event.time)}</time><h4>${esc(event.title)}</h4><p>${esc(event.actor)} → ${esc(event.receiver)}</p><small>${esc(event.control)}</small><span>${esc(event.detail)}</span></article>`).join('')}</div><aside class="m10-ledger-alert"><i class="ri-error-warning-line" aria-hidden="true"></i><p><strong>Supplemental audit note:</strong> at 13:02 local, an unlabelled USB copy was opened on a review workstation. No custodian, receipt time, or media identifier appears in the ledger.</p></aside></div>
    </section>
    <form class="m10-artifact" id="m10-custody-form" novalidate><div class="m10-panel-heading"><div><p class="m10-kicker">Scored artifact</p><h3>Evidence intake record</h3></div><span>Retry allowed</span></div>
      <fieldset><legend>Preserved package</legend><p class="m10-help">Use the inventory checkboxes to identify the artifacts whose provenance and acquisition records support preservation.</p><div class="m10-selection-summary">${moduleTenCustodyState.selectedEvidence.length ? moduleTenCustodyState.selectedEvidence.map((id) => `<code>${esc(id)}</code>`).join('') : '<span>No artifacts selected</span>'}</div></fieldset>
      <div class="m10-form-grid"><fieldset><legend>Image source</legend>${moduleTenRadio('sourceChoice', moduleTenCustodyState.sourceChoice, [
        { id: 'nvme-271', label: 'NVMe SN-X4-271', help: 'Named in the IMG-10-27 acquisition record.' },
        { id: 'wks44', label: 'WKS-44 system disk', help: 'Appears only in another activity record.' },
        { id: 'unknown-usb', label: 'Unlabelled USB device', help: 'A later copy without provenance.' },
      ])}</fieldset><fieldset><legend>Acquisition control</legend>${moduleTenRadio('methodChoice', moduleTenCustodyState.methodChoice, [
        { id: 'bitstream-blocker', label: 'Bit-stream image through validated read-only blocker WB-22', help: 'Preserves the source and records the acquisition control.' },
        { id: 'drag-copy', label: 'Drag files into a desktop folder', help: 'Can alter metadata and omits unallocated content.' },
        { id: 'phone-photo', label: 'Photograph the source screen', help: 'Does not acquire the underlying evidence.' },
      ])}</fieldset><fieldset><legend>Acquisition time</legend>${moduleTenRadio('timeChoice', moduleTenCustodyState.timeChoice, [
        { id: '111844z', label: '2026-08-19 11:18:44Z', help: 'UTC time in the IMG-10-27 record.' },
        { id: '1131local', label: '2026-08-19 11:31 local', help: 'Belongs to the undocumented photograph.' },
        { id: 'unknown', label: 'Unknown', help: 'Would leave the image chronology unsupported.' },
      ])}</fieldset><fieldset><legend>Recorded SHA-256</legend>${moduleTenRadio('hashChoice', moduleTenCustodyState.hashChoice, [
        { id: 'full-b4', label: 'demo-b4d9…c906', help: 'Deliberately abbreviated synthetic fingerprint recorded for IMG-10-27.' },
        { id: 'short-b4', label: 'b4d9…c906', help: 'A display abbreviation is not the complete verification record.' },
        { id: 'none', label: 'No digest required', help: 'Removes the integrity check.' },
      ])}</fieldset></div>
      <fieldset><legend>Hash interpretation</legend>${moduleTenRadio('verificationChoice', moduleTenCustodyState.verificationChoice, [
        { id: 'match-integrity', label: 'Matching source and image SHA-256 values support integrity at acquisition', help: 'The hash verifies sameness at the recorded points; it does not establish every later custody event.' },
        { id: 'proves-custody', label: 'A matching hash proves an unlogged copy had uninterrupted custody', help: 'Integrity and provenance are related but distinct.' },
        { id: 'different-better', label: 'Different source and image hashes are preferred', help: 'A mismatch requires investigation.' },
      ])}</fieldset>
      <fieldset><legend>Custody chronology</legend><p class="m10-help">Assign one ledger event to each chronological position. Each event should appear once.</p><div class="m10-sequence-grid">${[0, 1, 2, 3].map((index) => `<label><span>Position ${index + 1}</span><select name="custodySequence" data-m10-sequence="${index}"><option value="">Choose event</option>${custodyOptions.replace(`value="${moduleTenCustodyState.custodySequence[index]}"`, `value="${moduleTenCustodyState.custodySequence[index]}" selected`)}</select></label>`).join('')}</div></fieldset>
      <div class="m10-form-grid"><fieldset><legend>Custody integrity finding</legend>${moduleTenRadio('custodyRisk', moduleTenCustodyState.custodyRisk, [
        { id: 'usb-gap', label: 'The unlabelled USB copy has a custody and provenance gap', help: 'No media identity, custodian, transfer, or receipt supports it.' },
        { id: 'vault-gap', label: 'The sealed vault source lacks custody', help: 'The ledger records release, receipt, seal, and locker.' },
        { id: 'no-gap', label: 'No gap exists because a short hash matches', help: 'A hash cannot replace missing custody records.' },
      ])}</fieldset><fieldset><legend>Intake decision</legend>${moduleTenRadio('preservationDecision', moduleTenCustodyState.preservationDecision, [
        { id: 'accept-quarantine', label: 'Accept the logged originals; quarantine the USB copy pending provenance review', help: 'Preserves defensible evidence and prevents the unsupported copy from entering analysis.' },
        { id: 'accept-all', label: 'Accept every item because more evidence is always better', help: 'Uncontrolled copies can contaminate a review.' },
        { id: 'destroy-usb', label: 'Destroy the USB immediately', help: 'Destruction exceeds intake authority and removes a potentially reviewable item.' },
      ])}</fieldset></div>
      <label class="m10-note-label" for="m10-custody-notes">Evidence disposition note</label><p class="m10-help" id="m10-custody-help">Write at least 130 characters. Identify the accepted originals, image source/control, UTC time and matching-hash result, custody gap, and disposition.</p><textarea id="m10-custody-notes" name="custodyNotes" rows="6" maxlength="1000" aria-describedby="m10-custody-help m10-custody-count" placeholder="Accepted evidence: … Acquisition: … Integrity: … Custody exception: … Disposition: …">${esc(moduleTenCustodyState.notes)}</textarea><p class="m10-note-count" id="m10-custody-count">${moduleTenCustodyState.notes.length}/1000</p>
      <div class="m10-actions"><button type="submit" class="m10-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score intake record</button><button type="button" class="m10-reset" data-m10-reset="custody"><i class="ri-restart-line" aria-hidden="true"></i> Reset this lab only</button></div>${moduleTenCustodyScorePanel()}
    </form></section>`;
}

function moduleTenTimelineTable() {
  const active = MODULE_TEN_TIMELINE.find((item) => item.id === moduleTenMappingState.activeEvent);
  return `<div class="m10-table-wrap"><table class="m10-data-table"><caption class="m10-visually-hidden">Synthetic forensic event dataset for case FR-10-61</caption><thead><tr><th scope="col">Timeline</th><th scope="col">UTC</th><th scope="col">Source</th><th scope="col">Entity</th><th scope="col">Observation</th><th scope="col">Context</th></tr></thead><tbody>${MODULE_TEN_TIMELINE.map((item) => {
    const selected = moduleTenMappingState.selectedTimeline.includes(item.id);
    return `<tr class="${selected ? 'is-selected' : ''}"><td data-label="Timeline"><label class="m10-evidence-check"><input type="checkbox" name="timelineEvent" value="${esc(item.id)}" ${selected ? 'checked' : ''} /><span>${esc(item.id)}</span></label></td><td data-label="UTC"><time>${esc(item.time)}</time></td><td data-label="Source">${esc(item.source)}</td><td data-label="Entity"><code>${esc(item.entity)}</code></td><td data-label="Observation"><strong>${esc(item.title)}</strong></td><td data-label="Context"><button type="button" class="m10-inspect" data-m10-event="${esc(item.id)}" aria-expanded="${active?.id === item.id}">${active?.id === item.id ? 'Hide context' : 'Inspect context'}</button></td></tr>`;
  }).join('')}</tbody></table></div>${active ? `<aside class="m10-detail" id="m10-event-detail" tabindex="-1"><div><p class="m10-kicker">${esc(active.id)} · ${esc(active.source)}</p><h4>${esc(active.title)}</h4><p>${esc(active.detail)}</p></div><button type="button" data-m10-close-event aria-label="Close event detail"><i class="ri-close-line" aria-hidden="true"></i></button></aside>` : ''}`;
}

function moduleTenTimelineStrip() {
  const rows = moduleTenMappingState.selectedTimeline.map((id) => MODULE_TEN_TIMELINE.find((item) => item.id === id)).filter(Boolean).sort((a, b) => a.time.localeCompare(b.time));
  return `<aside class="m10-timeline-strip" aria-labelledby="m10-timeline-title"><div><p class="m10-kicker">Constructed chronology</p><h4 id="m10-timeline-title">${rows.length} selected events</h4></div>${rows.length ? `<ol>${rows.map((row) => `<li><time>${esc(row.time)}</time><span><code>${esc(row.id)}</code>${esc(row.title)}</span><button type="button" data-m10-remove-event="${esc(row.id)}" aria-label="Remove ${esc(row.id)} from timeline"><i class="ri-close-line" aria-hidden="true"></i></button></li>`).join('')}</ol>` : '<p>Select the records that form the supported causal sequence. The strip orders selected records by UTC.</p>'}</aside>`;
}

function moduleTenGraph() {
  return `<section class="m10-graph" aria-labelledby="m10-graph-title"><div class="m10-panel-heading"><div><p class="m10-kicker">Relationship workspace</p><h3 id="m10-graph-title">Supported entity graph</h3></div><span>${moduleTenMappingState.selectedLinks.length}/7 links selected</span></div><div class="m10-node-map" aria-label="Entity relationship overview"><span class="is-account"><i class="ri-user-line" aria-hidden="true"></i>acct-61</span><span class="is-file"><i class="ri-file-code-line" aria-hidden="true"></i>HTML attachment</span><span class="is-process"><i class="ri-terminal-box-line" aria-hidden="true"></i>PowerShell</span><span class="is-network"><i class="ri-global-line" aria-hidden="true"></i>203.0.113.210</span><span class="is-task"><i class="ri-calendar-event-line" aria-hidden="true"></i>Benefits Sync</span></div>${moduleTenCheck('relationshipLink', moduleTenMappingState.selectedLinks, MODULE_TEN_LINKS.map((link) => ({ id: link.id, label: `${link.from} —${link.verb}→ ${link.to}`, help: 'Select only if a case record directly supports this edge.' })) )}</section>`;
}

function moduleTenMappingScorePanel() {
  const state = moduleTenMappingState;
  if (state.validationError) return `<div class="m10-validation" id="m10-mapping-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Incident conclusion incomplete</strong><p>${esc(state.validationError)}</p></div></div>`;
  if (!state.attempts || !state.breakdown) return `<div class="m10-score-empty" id="m10-mapping-feedback" role="status">Scoring: observation 25 · analysis 30 · decision 25 · communication 20. Pass: ${MODULE_TEN_PASSING_SCORE}/100.</div>`;
  const b = state.breakdown;
  const passed = state.score >= MODULE_TEN_PASSING_SCORE;
  return `<section class="m10-score ${passed ? 'is-pass' : 'is-remediate'}" id="m10-mapping-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m10-mapping-score-title"><div class="m10-score-heading"><div><p class="m10-kicker">Attempt ${state.attempts} · best ${state.bestScore}/100</p><h3 id="m10-mapping-score-title">${state.score}/100 — ${passed ? 'Reconstruction supported' : 'Separate evidence from inference'}</h3></div><span>${state.score}</span></div><div class="m10-score-grid" aria-label="Explainable score breakdown"><div><strong>${b.observation}/25</strong><span>Observation</span></div><div><strong>${b.analysis}/30</strong><span>Analysis</span></div><div><strong>${b.decision}/25</strong><span>Decision</span></div><div><strong>${b.communication}/20</strong><span>Communication</span></div></div><ul class="m10-feedback-list">${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><div class="m10-remediation"><strong>Reference finding</strong><p>The supported chain begins with delivery and opening of Benefits_Update.html, followed by PowerShell execution, a correlated connection, task persistence, and acct-61 token use from the same address. Map only attachment delivery, PowerShell, scheduled task, and valid-account behavior. The records do not prove a tool download, ransomware impact, or broader scope.</p></div></section>`;
}

function moduleTenMappingLab() {
  return `<section class="m10-lab" role="tabpanel" aria-labelledby="m10-tab-mapping"><div class="m10-lab-heading"><div><p class="m10-kicker">Independent lab · ${formatInstructionalMinutes(MODULE_TEN_MAPPING_MINUTES)}</p><h2>Incident Timeline, Cause &amp; Behavior Mapping</h2></div><span>${moduleTenStatus(moduleTenMappingState)}</span></div>
    <div class="m10-objective"><i class="ri-focus-3-line" aria-hidden="true"></i><div><strong>Objective</strong><p>Reconstruct case FR-10-61 from nine mixed records, identify the supported causal chain, build a defensible entity graph, and use ATT&amp;CK only as a framework for demonstrated behavior, scoring at least ${MODULE_TEN_PASSING_SCORE}/100.</p></div></div>
    <div class="m10-case-brief"><div><p class="m10-kicker">Case FR-10-61 · assigned incident slice</p><h3>Attachment-to-persistence reconstruction</h3><p>Several events occurred within 27 minutes across mail, browser, endpoint, network, task, and identity sources. Determine what belongs in the incident chronology and what the dataset proves.</p></div><dl><div><dt>Records</dt><dd>9 mixed events</dd></div><div><dt>Time basis</dt><dd>UTC</dd></div><div><dt>Question</dt><dd>Cause and behavior</dd></div></dl></div>
    ${moduleTenReference()}
    <section class="m10-workbench" aria-labelledby="m10-events-title"><div class="m10-panel-heading"><div><p class="m10-kicker">Dataset</p><h3 id="m10-events-title">Cross-source event records</h3></div><span>${moduleTenMappingState.selectedTimeline.length} timeline events selected</span></div>${moduleTenTimelineTable()}${moduleTenTimelineStrip()}</section>
    ${moduleTenGraph()}
    <form class="m10-artifact" id="m10-mapping-form" novalidate><div class="m10-panel-heading"><div><p class="m10-kicker">Scored artifact</p><h3>Evidence-based incident conclusion</h3></div><span>Retry allowed</span></div>
      <div class="m10-form-grid"><fieldset><legend>Supported root cause</legend>${moduleTenRadio('rootCause', moduleTenMappingState.rootCause, [
        { id: 'attachment-open', label: 'The delivered HTML attachment was opened and launched encoded PowerShell', help: 'This is the earliest supported action leading into execution and persistence.' },
        { id: 'browser-update', label: 'The approved browser update on WKS-44 caused the case', help: 'Different host and approved change.' },
        { id: 'spreadsheet', label: 'Quarterly-plan.xlsx created the scheduled task', help: 'No child activity connects the workbook to the task.' },
      ])}</fieldset><fieldset><legend>Conclusion confidence</legend>${moduleTenRadio('confidence', moduleTenMappingState.confidence, [
        { id: 'high-bounded', label: 'High for this causal chain; broader activity remains unknown', help: 'Multiple independent sources agree without extending beyond the assigned slice.' },
        { id: 'absolute', label: 'Absolute certainty about every attacker action', help: 'The records do not show intent, payload transfer, or wider activity.' },
        { id: 'none', label: 'No conclusion is possible from mixed sources', help: 'Timestamped cross-source correlation supports a bounded conclusion.' },
      ])}</fieldset></div>
      <fieldset><legend>ATT&amp;CK techniques demonstrated</legend><p class="m10-help">Select techniques supported by direct observations. Avoid mapping outcomes or transfers that do not appear.</p>${moduleTenCheck('technique', moduleTenMappingState.techniques, MODULE_TEN_TECHNIQUES)}</fieldset>
      <fieldset><legend>Incident-framework boundary</legend>${moduleTenRadio('frameworkBoundary', moduleTenMappingState.frameworkBoundary, [
        { id: 'facts-inference-unknowns', label: 'Report observed facts, supported causal inference, and explicit unknowns separately', help: 'Keeps the analysis reviewable across preparation, analysis, containment, and lessons learned.' },
        { id: 'attack-is-timeline', label: 'Treat ATT&amp;CK technique order as a complete incident-response timeline', help: 'ATT&amp;CK describes adversary behavior; it does not replace evidence chronology or an IR lifecycle.' },
        { id: 'fill-gaps', label: 'Fill missing stages with typical attacker behavior', help: 'A framework should organize evidence, not manufacture it.' },
      ])}</fieldset>
      <label class="m10-note-label" for="m10-mapping-notes">Analyst conclusion</label><p class="m10-help" id="m10-mapping-help">Write at least 140 characters. State the root cause and causal sequence, key entities, supported techniques, and at least one evidence limitation.</p><textarea id="m10-mapping-notes" name="mappingNotes" rows="7" maxlength="1100" aria-describedby="m10-mapping-help m10-mapping-count" placeholder="Root cause: … Sequence: … Entities: … ATT&CK: … Limitation: …">${esc(moduleTenMappingState.notes)}</textarea><p class="m10-note-count" id="m10-mapping-count">${moduleTenMappingState.notes.length}/1100</p>
      <div class="m10-actions"><button type="submit" class="m10-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score incident conclusion</button><button type="button" class="m10-reset" data-m10-reset="mapping"><i class="ri-restart-line" aria-hidden="true"></i> Reset this lab only</button></div>${moduleTenMappingScorePanel()}
    </form></section>`;
}

function moduleTenDynamic() {
  return `${moduleTenModuleNav()}${moduleTenActiveLab === 'custody' ? moduleTenCustodyLab() : moduleTenMappingLab()}`;
}

function viewModuleTen(user, program) {
  moduleTenLoad(user);
  const module = program.modules['soc-10'];
  return `<div class="m10-shell"><header class="m10-topbar"><a class="m10-brand" href="#/program/${esc(program.slug)}" aria-label="Back to SOC Analyst program"><img src="assets/logo.png" alt="Mission Next Technical Academy" /></a><div class="m10-top-actions"><span class="m10-simulation"><i class="ri-flask-line" aria-hidden="true"></i> Independent practice · fictional data</span><a class="m10-exit" href="#/program/${esc(program.slug)}"><i class="ri-arrow-left-line" aria-hidden="true"></i> Course overview</a></div></header><main class="m10-main">
    <section class="m10-hero" aria-labelledby="m10-title"><div><p class="m10-kicker">Module 10 · ${formatInstructionalMinutes(module.durationMinutes)} · independent</p><h1 id="m10-title">${esc(module.title)}</h1><p>Preserve incident evidence, document custody, and reconstruct a separate case from chronology and demonstrated behavior. ATT&amp;CK remains subordinate to the evidence as a behavior framework; it does not replace the case record.</p></div><dl aria-label="Module lab progress"><div><dt>Independent labs</dt><dd>${module.labs}</dd></div><div><dt>Passing score</dt><dd>${MODULE_TEN_PASSING_SCORE}</dd></div><div><dt>Completed</dt><dd id="m10-completed">${[moduleTenCustodyState, moduleTenMappingState].filter((state) => state.completed).length}/${module.labs}</dd></div></dl></section>
    <section class="m10-boundary"><i class="ri-lock-2-line" aria-hidden="true"></i><p><strong>Bounded practice:</strong> this is incident evidence handling and case documentation, not a full digital-forensics program. Acquisition and specialist examination remain with authorized specialists; each exercise contains only its assigned synthetic case dataset.</p></section>
    <div id="m10-dynamic">${moduleTenDynamic()}</div>
  </main></div>`;
}

function moduleTenScoreCustody() {
  const state = moduleTenCustodyState;
  const reviewed = Math.min(5, state.inspectedArtifacts.length);
  const evidence = moduleTenExact(state.selectedEvidence, ['E10-01', 'E10-02', 'E10-03'], 15);
  const riskObserved = state.custodyRisk === 'usb-gap' ? 5 : 0;
  const observation = reviewed + evidence + riskObserved;
  const acquisition = [state.sourceChoice === 'nvme-271', state.methodChoice === 'bitstream-blocker', state.timeChoice === '111844z'].filter(Boolean).length * 5;
  const integrity = (state.hashChoice === 'full-b4' ? 5 : 0) + (state.verificationChoice === 'match-integrity' ? 5 : 0);
  const analysis = acquisition + integrity;
  const sequence = state.custodySequence.join('|') === 'CC-101|CC-102|CC-103|CC-104' ? 15 : moduleTenExact(state.custodySequence.filter(Boolean), ['CC-101', 'CC-102', 'CC-103', 'CC-104'], 8);
  const disposition = state.preservationDecision === 'accept-quarantine' ? 10 : 0;
  const decision = Math.min(25, sequence + disposition);
  const communication = moduleTenNoteScore(state.notes, [
    { pattern: /e10-01|memory/, points: 3 }, { pattern: /e10-02|img-10-27|disk image/, points: 3 }, { pattern: /e10-03|identity.*export|audit export/, points: 3 },
    { pattern: /sn-x4-271|wb-22|write.?block|read.?only/, points: 4 }, { pattern: /11:18:44z|utc/, points: 3 }, { pattern: /sha-?256|hash.*match|matching.*hash/, points: 3 },
    { pattern: /usb|custody gap|provenance gap/, points: 3 }, { pattern: /quarant|accept.*original|controlled analysis/, points: 3 },
  ]);
  const score = observation + analysis + decision + communication;
  return { score, breakdown: { observation, analysis, decision, communication }, feedback: [
    evidence === 15 && reviewed === 5 ? 'Observation: the three provenance-supported originals were selected after sufficient context review.' : `Observation: ${observation}/25. Inspect the inventory and preserve only E10-01, E10-02, and E10-03; identify the USB custody gap.`,
    analysis === 25 ? 'Analysis: IMG-10-27 is tied to the named NVMe, blocker, UTC acquisition time, recorded fingerprint, and a matching-hash interpretation.' : `Analysis: ${analysis}/25. Reconcile IMG-10-27 against its source, control, exact UTC record, recorded SHA-256 fingerprint, and integrity meaning.`,
    decision === 25 ? 'Decision: custody is chronological and the unsupported USB copy is quarantined without destroying it.' : `Decision: ${decision}/25. Order acquire, verify/seal, transfer, receipt; accept logged originals and quarantine the unsupported copy.`,
    communication === 25 ? 'Communication: the disposition is complete, specific, and reviewable.' : `Communication: ${communication}/25. Name all accepted originals, acquisition controls, time/hash result, custody exception, and disposition.`,
  ] };
}

function moduleTenScoreMapping() {
  const state = moduleTenMappingState;
  const timeline = moduleTenExact(state.selectedTimeline, ['TL-202', 'TL-204', 'TL-205', 'TL-206', 'TL-207', 'TL-209'], 18);
  const chronology = state.selectedTimeline.filter((id) => ['TL-202', 'TL-204', 'TL-205', 'TL-206', 'TL-207', 'TL-209'].includes(id)).length === 6 ? 7 : 0;
  const observation = timeline + chronology;
  const rootCause = state.rootCause === 'attachment-open' ? 12 : 0;
  const links = moduleTenExact(state.selectedLinks, ['L1', 'L2', 'L3', 'L4', 'L5'], 12);
  const confidence = state.confidence === 'high-bounded' ? 6 : 0;
  const analysis = rootCause + links + confidence;
  const attack = moduleTenExact(state.techniques, ['T1566.001', 'T1059.001', 'T1053.005', 'T1078'], 16);
  const framework = state.frameworkBoundary === 'facts-inference-unknowns' ? 9 : 0;
  const decision = attack + framework;
  const communication = moduleTenNoteScore(state.notes, [
    { pattern: /attachment|benefits_update|html/, points: 3 }, { pattern: /powershell|encoded/, points: 3 }, { pattern: /203\.0\.113\.210|destination/, points: 2 },
    { pattern: /task|persistence|benefits sync/, points: 3 }, { pattern: /acct-61|token|valid account/, points: 3 }, { pattern: /t1566|t1059|t1053|t1078|attack/, points: 3 },
    { pattern: /unknown|does not prove|not establish|limited|no evidence/, points: 3 },
  ]);
  const score = observation + analysis + decision + communication;
  return { score, breakdown: { observation, analysis, decision, communication }, feedback: [
    observation === 25 ? 'Observation: the six-event chronology excludes both plausible benign distractors and unrelated approved activity.' : `Observation: ${observation}/25. Retain delivery, open, PowerShell, connection, task, and token events only.`,
    analysis === 30 ? 'Analysis: the attachment-led root cause, five supported relationships, and bounded confidence align across sources.' : `Analysis: ${analysis}/30. Anchor the cause at the opened attachment and connect only edges directly supported by records.`,
    decision === 25 ? 'Framework mapping: four observed techniques are mapped while unknown transfer and impact behavior remain unmapped.' : `Framework mapping: ${decision}/25. Map attachment, PowerShell, scheduled task, and valid-account behavior; separate facts, inference, and unknowns.`,
    communication === 20 ? 'Communication: the causal sequence, entities, behavior, and limitation are explicit.' : `Communication: ${communication}/20. Include the causal sequence, account/address/task entities, supported ATT&CK behavior, and an evidence limitation.`,
  ] };
}

function moduleTenRender(focusId) {
  const root = document.getElementById('m10-dynamic');
  if (!root) return;
  root.innerHTML = moduleTenDynamic();
  const completed = document.getElementById('m10-completed');
  if (completed) completed.textContent = `${[moduleTenCustodyState, moduleTenMappingState].filter((state) => state.completed).length}/2`;
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function moduleTenSetArrayValue(state, key, value, checked) {
  state[key] = checked ? [...new Set([...state[key], value])] : state[key].filter((item) => item !== value);
  state.validationError = '';
}

function moduleTenSubmitCustody(form) {
  moduleTenCustodyState.notes = form.elements.custodyNotes.value;
  const missing = [];
  if (!moduleTenCustodyState.selectedEvidence.length) missing.push('preserved package');
  if (!moduleTenCustodyState.sourceChoice || !moduleTenCustodyState.methodChoice || !moduleTenCustodyState.timeChoice || !moduleTenCustodyState.hashChoice || !moduleTenCustodyState.verificationChoice) missing.push('acquisition validation');
  if (moduleTenCustodyState.custodySequence.some((item) => !item)) missing.push('four custody positions');
  if (!moduleTenCustodyState.custodyRisk || !moduleTenCustodyState.preservationDecision) missing.push('integrity finding and intake decision');
  if (moduleTenCustodyState.notes.trim().length < 130) missing.push('130-character disposition note');
  if (missing.length) { moduleTenCustodyState.validationError = `Add: ${missing.join(', ')}. Existing work remains saved.`; moduleTenSaveCustody(); moduleTenRender('m10-custody-feedback'); return; }
  const result = moduleTenScoreCustody();
  moduleTenCustodyState.attempts += 1;
  moduleTenCustodyState.score = result.score;
  moduleTenCustodyState.bestScore = Math.max(moduleTenCustodyState.bestScore || 0, result.score);
  moduleTenCustodyState.breakdown = result.breakdown;
  moduleTenCustodyState.feedback = result.feedback;
  moduleTenCustodyState.validationError = '';
  moduleTenCustodyState.lastSubmittedAt = new Date().toISOString();
  const custodyPassed = result.score >= MODULE_TEN_PASSING_SCORE;
  if (typeof recordLabAttempt === 'function') {
    recordLabAttempt(moduleTenUser, MODULE_TEN_CUSTODY_KEY, {
      state: custodyPassed ? 'complete' : 'in_progress',
      score: result.score,
      result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleTenCustodyState.attempts },
    });
  }
  if (custodyPassed) {
    moduleTenCustodyState.completed = true;
    if (!moduleTenCustodyState.flags.includes('M10-EVIDENCE-CUSTODY-COMPLETE')) moduleTenCustodyState.flags.push('M10-EVIDENCE-CUSTODY-COMPLETE');
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTenUser, 'soc-analyst', 'soc-10', MODULE_TEN_CUSTODY_KEY);
  }
  moduleTenSaveCustody(); moduleTenRender('m10-custody-feedback');
}

function moduleTenSubmitMapping(form) {
  moduleTenMappingState.notes = form.elements.mappingNotes.value;
  const missing = [];
  if (!moduleTenMappingState.selectedTimeline.length) missing.push('timeline evidence');
  if (!moduleTenMappingState.selectedLinks.length) missing.push('relationship graph');
  if (!moduleTenMappingState.rootCause || !moduleTenMappingState.confidence) missing.push('root-cause conclusion');
  if (!moduleTenMappingState.techniques.length || !moduleTenMappingState.frameworkBoundary) missing.push('framework mapping');
  if (moduleTenMappingState.notes.trim().length < 140) missing.push('140-character analyst conclusion');
  if (missing.length) { moduleTenMappingState.validationError = `Add: ${missing.join(', ')}. Existing work remains saved.`; moduleTenSaveMapping(); moduleTenRender('m10-mapping-feedback'); return; }
  const result = moduleTenScoreMapping();
  moduleTenMappingState.attempts += 1;
  moduleTenMappingState.score = result.score;
  moduleTenMappingState.bestScore = Math.max(moduleTenMappingState.bestScore || 0, result.score);
  moduleTenMappingState.breakdown = result.breakdown;
  moduleTenMappingState.feedback = result.feedback;
  moduleTenMappingState.validationError = '';
  moduleTenMappingState.lastSubmittedAt = new Date().toISOString();
  const mappingPassed = result.score >= MODULE_TEN_PASSING_SCORE;
  if (typeof recordLabAttempt === 'function') {
    recordLabAttempt(moduleTenUser, MODULE_TEN_MAPPING_KEY, {
      state: mappingPassed ? 'complete' : 'in_progress',
      score: result.score,
      result: { breakdown: result.breakdown, feedback: result.feedback, attempts: moduleTenMappingState.attempts },
    });
  }
  if (mappingPassed) {
    moduleTenMappingState.completed = true;
    if (!moduleTenMappingState.flags.includes('M10-FORENSIC-MAPPING-COMPLETE')) moduleTenMappingState.flags.push('M10-FORENSIC-MAPPING-COMPLETE');
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTenUser, 'soc-analyst', 'soc-10', MODULE_TEN_MAPPING_KEY);
  }
  moduleTenSaveMapping(); moduleTenRender('m10-mapping-feedback');
}

function wireModuleTenLab() {
  const root = document.getElementById('m10-dynamic');
  if (!root || !moduleTenCustodyState || !moduleTenMappingState) return;
  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-m10-lab]');
    if (tab) { moduleTenActiveLab = tab.dataset.m10Lab; moduleTenRender(`m10-tab-${moduleTenActiveLab}`); return; }
    const artifact = event.target.closest('[data-m10-artifact]');
    if (artifact) { const id = artifact.dataset.m10Artifact; moduleTenCustodyState.activeArtifact = moduleTenCustodyState.activeArtifact === id ? '' : id; if (!moduleTenCustodyState.inspectedArtifacts.includes(id)) moduleTenCustodyState.inspectedArtifacts.push(id); moduleTenSaveCustody(); moduleTenRender(moduleTenCustodyState.activeArtifact ? 'm10-artifact-detail' : 'm10-inventory-title'); return; }
    if (event.target.closest('[data-m10-close-artifact]')) { moduleTenCustodyState.activeArtifact = ''; moduleTenSaveCustody(); moduleTenRender('m10-inventory-title'); return; }
    const evidenceEvent = event.target.closest('[data-m10-event]');
    if (evidenceEvent) { const id = evidenceEvent.dataset.m10Event; moduleTenMappingState.activeEvent = moduleTenMappingState.activeEvent === id ? '' : id; moduleTenSaveMapping(); moduleTenRender(moduleTenMappingState.activeEvent ? 'm10-event-detail' : 'm10-events-title'); return; }
    if (event.target.closest('[data-m10-close-event]')) { moduleTenMappingState.activeEvent = ''; moduleTenSaveMapping(); moduleTenRender('m10-events-title'); return; }
    const removeEvent = event.target.closest('[data-m10-remove-event]');
    if (removeEvent) { moduleTenSetArrayValue(moduleTenMappingState, 'selectedTimeline', removeEvent.dataset.m10RemoveEvent, false); moduleTenSaveMapping(); moduleTenRender('m10-timeline-title'); return; }
    const reset = event.target.closest('[data-m10-reset]');
    if (reset) {
      const lab = reset.dataset.m10Reset;
      if (typeof window.confirm === 'function' && !window.confirm(`Reset only the ${lab === 'custody' ? 'evidence and custody' : 'incident reconstruction'} lab?`)) return;
      if (lab === 'custody') { moduleTenCustodyState = LabRuntime.reset(MODULE_TEN_CUSTODY_LAB_ID, moduleTenUser, moduleTenCustodyFreshDefaults()); if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTenUser, 'soc-analyst', 'soc-10', MODULE_TEN_CUSTODY_KEY, false); }
      else { moduleTenMappingState = LabRuntime.reset(MODULE_TEN_MAPPING_LAB_ID, moduleTenUser, moduleTenMappingFreshDefaults()); if (typeof markModuleLabComplete === 'function') markModuleLabComplete(moduleTenUser, 'soc-analyst', 'soc-10', MODULE_TEN_MAPPING_KEY, false); }
      moduleTenRender(`m10-tab-${lab}`); return;
    }
  });
  root.addEventListener('keydown', (event) => {
    const tab = event.target.closest('[data-m10-lab]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    moduleTenActiveLab = event.key === 'ArrowLeft' || event.key === 'Home' ? 'custody' : 'mapping';
    moduleTenRender(`m10-tab-${moduleTenActiveLab}`);
  });
  root.addEventListener('toggle', (event) => {
    const hint = event.target.closest('[data-m10-hint]');
    if (!hint || !hint.open) return;
    const state = moduleTenActiveLab === 'custody' ? moduleTenCustodyState : moduleTenMappingState;
    if (!state.hintsOpened.includes(hint.dataset.m10Hint)) state.hintsOpened.push(hint.dataset.m10Hint);
    moduleTenActiveLab === 'custody' ? moduleTenSaveCustody() : moduleTenSaveMapping();
  }, true);
  root.addEventListener('input', (event) => {
    if (event.target.name === 'custodyNotes') { moduleTenCustodyState.notes = event.target.value; moduleTenSaveCustody(); const count = root.querySelector('#m10-custody-count'); if (count) count.textContent = `${event.target.value.length}/1000`; }
    if (event.target.name === 'mappingNotes') { moduleTenMappingState.notes = event.target.value; moduleTenSaveMapping(); const count = root.querySelector('#m10-mapping-count'); if (count) count.textContent = `${event.target.value.length}/1100`; }
  });
  root.addEventListener('change', (event) => {
    const input = event.target;
    if (input.name === 'custodyEvidence') { moduleTenSetArrayValue(moduleTenCustodyState, 'selectedEvidence', input.value, input.checked); moduleTenSaveCustody(); moduleTenRender('m10-inventory-title'); return; }
    if (input.name === 'timelineEvent') { moduleTenSetArrayValue(moduleTenMappingState, 'selectedTimeline', input.value, input.checked); moduleTenSaveMapping(); moduleTenRender('m10-events-title'); return; }
    if (input.name === 'relationshipLink') { moduleTenSetArrayValue(moduleTenMappingState, 'selectedLinks', input.value, input.checked); moduleTenSaveMapping(); return; }
    if (input.name === 'technique') { moduleTenSetArrayValue(moduleTenMappingState, 'techniques', input.value, input.checked); moduleTenSaveMapping(); return; }
    if (input.name === 'custodySequence') { moduleTenCustodyState.custodySequence[Number(input.dataset.m10Sequence)] = input.value; moduleTenCustodyState.validationError = ''; moduleTenSaveCustody(); return; }
    if (['sourceChoice', 'methodChoice', 'timeChoice', 'hashChoice', 'verificationChoice', 'custodyRisk', 'preservationDecision'].includes(input.name)) { moduleTenCustodyState[input.name] = input.value; moduleTenCustodyState.validationError = ''; moduleTenSaveCustody(); return; }
    if (['rootCause', 'confidence', 'frameworkBoundary'].includes(input.name)) { moduleTenMappingState[input.name] = input.value; moduleTenMappingState.validationError = ''; moduleTenSaveMapping(); }
  });
  root.addEventListener('submit', (event) => {
    event.preventDefault();
    if (event.target.id === 'm10-custody-form') moduleTenSubmitCustody(event.target);
    if (event.target.id === 'm10-mapping-form') moduleTenSubmitMapping(event.target);
  });
}

registerModuleLab({ program: 'soc-analyst', moduleNumber: 10, moduleKey: 'soc-10', view: viewModuleTen, wire: wireModuleTenLab });
