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

const MODULE_TEN_QUIZ_BANKS = [
  {
    conceptId: 'chain-of-custody-framework',
    conceptTitle: 'Chain-of-custody documentation and defensible acquisition',
    questions: [
      {
        id: 'm10-q-coc-1',
        prompt: `Which of these elements is MOST critical to establish a defensible chain of custody?`,
        options: [
          { id: 'a', text: 'Matching SHA-256 hashes between source and image.' },
          { id: 'b', text: 'A complete transfer ledger naming release/receipt custodians, times, seal condition, and signature from each party.' },
          { id: 'c', text: 'A photograph of the evidence on a personal device.' },
          { id: 'd', text: 'An abbreviated hash value noted on a sticky note.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Chain of custody requires documented handoffs with both parties' signatures, timestamps, seal status, and clear purpose—not just a final hash.`,
        feedbackIncorrect: `A matching hash verifies integrity at that moment, but it cannot replace missing custody records. Each transfer must be signed and dated by both custodians.`,
      },
      {
        id: 'm10-q-coc-2',
        prompt: `A read-only blocker (write-protect) device is used during acquisition. What does it establish?`,
        options: [
          { id: 'a', text: 'That the source media cannot be modified during imaging.' },
          { id: 'b', text: 'That the image is guaranteed to be identical to the source at all future times.' },
          { id: 'c', text: 'That custody gaps do not exist elsewhere in the evidence chain.' },
          { id: 'd', text: 'That the image requires no hash verification.' },
        ],
        correctId: 'a',
        feedbackCorrect: `Correct. A blocker prevents write access during acquisition, protecting the source from accidental modification. Hash verification still required; custody chain still required.`,
        feedbackIncorrect: `A blocker controls acquisition risk, but it does not guarantee all later custody events or eliminate the need for documented transfer records.`,
      },
      {
        id: 'm10-q-coc-3',
        prompt: `UTC timestamps are recorded for all evidence handling. Why is a consistent time basis critical?`,
        options: [
          { id: 'a', text: 'So all parties use the same clock reference and timezone conversions do not create ambiguity in the chronology.' },
          { id: 'b', text: 'Because local time is always inaccurate.' },
          { id: 'c', text: 'So evidence can be destroyed after 24 hours.' },
          { id: 'd', text: 'Time basis is optional if hashes match.' },
        ],
        correctId: 'a',
        feedbackCorrect: `Correct. UTC eliminates timezone ambiguity and ensures the documented sequence is reviewable and defensible across geographic locations.`,
        feedbackIncorrect: `Local time can be used, but it must be clearly labeled and converted to a consistent basis for the custody ledger.`,
      },
      {
        id: 'm10-q-coc-4',
        prompt: `An evidence copy is found on unlabelled removable media with no custodian, receipt time, or media identifier. What should an intake officer do?`,
        options: [
          { id: 'a', text: 'Accept it because a matching hash proves it is identical to the original.' },
          { id: 'b', text: 'Destroy it immediately to prevent contamination.' },
          { id: 'c', text: 'Quarantine it pending provenance review; accept only the logged originals with complete custody.' },
          { id: 'd', text: 'Merge it with the original evidence package.' },
        ],
        correctId: 'c',
        feedbackCorrect: `Correct. Hash integrity does not repair missing custody records. Quarantine uncontrolled copies to prevent analysis contamination.`,
        feedbackIncorrect: `A matching hash proves sameness at one point, not provenance or that the copy was never mishandled. Intake authority does not permit destroying potentially reviewable material.`,
      },
    ],
  },
  {
    conceptId: 'hash-integrity-vs-provenance',
    conceptTitle: 'Distinguishing hash-integrity verification from proof of custody',
    questions: [
      {
        id: 'm10-q-hash-1',
        prompt: `A source disk hash and image hash match. What does this prove?`,
        options: [
          { id: 'a', text: 'That the image is byte-identical to the source at the recorded moment.' },
          { id: 'b', text: 'That the image was never mishandled and its custody chain is complete.' },
          { id: 'c', text: 'That the image can be stored indefinitely without further verification.' },
          { id: 'd', text: 'That no other copy of the data exists.' },
        ],
        correctId: 'a',
        feedbackCorrect: `Correct. Hash matching confirms integrity at acquisition time. It does not prove later custody, integrity of copies, or absence of other versions.`,
        feedbackIncorrect: `Hashes are point-in-time integrity checks. They are necessary but not sufficient for chain of custody.`,
      },
      {
        id: 'm10-q-hash-2',
        prompt: `Two images of the same source have different hashes. What is the FIRST action?`,
        options: [
          { id: 'a', text: 'Discard both images and start over.' },
          { id: 'b', text: 'Investigate which image is corrupted and re-verify acquisition controls and custody records.' },
          { id: 'c', text: 'Accept both as equally valid.' },
          { id: 'd', text: 'Use the older timestamp as the authoritative version.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Hash mismatch signals integrity loss or acquisition error. Investigation determines which acquisition was sound and how to proceed.`,
        feedbackIncorrect: `Different hashes mean at least one image is not byte-identical to the source. The acquisition records and controls reveal why.`,
      },
      {
        id: 'm10-q-hash-3',
        prompt: `A copy of forensic evidence has a matching hash but no receipt signature in the ledger. Is it admissible in a review?`,
        options: [
          { id: 'a', text: 'Yes, because the hash matches.' },
          { id: 'b', text: 'No, because the matching hash provides absolute proof of custody.' },
          { id: 'c', text: 'Only if the missing receipt is later supplied.' },
          { id: 'd', text: 'Only after investigating the missing receipt and determining whether the copy is controlled evidence.' },
        ],
        correctId: 'd',
        feedbackCorrect: `Correct. Hash alone does not establish chain of custody. A missing receipt requires investigation before accepting the copy as controlled evidence.`,
        feedbackIncorrect: `Integrity and provenance are separate concerns. Hash matching is necessary but does not substitute for documented custody records.`,
      },
      {
        id: 'm10-q-hash-4',
        prompt: `Why should cryptographic hashing be performed on BOTH the original source and the acquired image?`,
        options: [
          { id: 'a', text: 'To double the assurance of integrity.' },
          { id: 'b', text: 'To prove that no data was lost or corrupted during acquisition if the hashes match.' },
          { id: 'c', text: 'To prevent unauthorized duplication of the evidence.' },
          { id: 'd', text: 'Because hashing the source alone is insufficient.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Hashing both establishes a baseline of what the source contained and verifies the image captured all of it without modification.`,
        feedbackIncorrect: `Hashing both provides comparison. A match proves the image is a complete, unmodified copy at that moment.`,
      },
    ],
  },
  {
    conceptId: 'correlation-vs-causation-timeline',
    conceptTitle: 'Correlation vs. causation when reconstructing an incident timeline',
    questions: [
      {
        id: 'm10-q-corr-1',
        prompt: `An email attachment arrives at 10:14Z. PowerShell execution occurs at 10:18Z on the same workstation. What is accurate to conclude?`,
        options: [
          { id: 'a', text: 'The attachment caused the execution because they are only 4 minutes apart.' },
          { id: 'b', text: 'The events are correlated in time and entity, but causation requires evidence connecting the attachment to the process.' },
          { id: 'c', text: 'The execution is unrelated because timestamps alone prove nothing.' },
          { id: 'd', text: 'The user intentionally opened the attachment at 10:18Z.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Time + entity proximity = correlation material. Causation requires a direct evidentiary link (e.g., file open event, process ancestry).`,
        feedbackIncorrect: `Proximity in time and entity are necessary but not sufficient for causation. You must connect them through observed behavior.`,
      },
      {
        id: 'm10-q-corr-2',
        prompt: `Three events have matching identifiers but occur at widely separated times. Can you assume they are part of one causal sequence?`,
        options: [
          { id: 'a', text: 'Yes, because the identifier proves continuity.' },
          { id: 'b', text: 'No. Matching identifiers are correlation material; you must validate time continuity and behavior sequence before assuming causation.' },
          { id: 'c', text: 'Only if a human operator says they are related.' },
          { id: 'd', text: 'Causation requires only one matching identifier.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. A shared identifier (account, endpoint, process ID) is a correlation signal. Causation requires unbroken behavioral continuity.`,
        feedbackIncorrect: `Shared identity is useful correlation material, but time gaps or behavioral discontinuity may mean separate incidents or coincidence.`,
      },
      {
        id: 'm10-q-corr-3',
        prompt: `A timeline shows Event A at 10:00Z and Event B at 10:15Z on the same host. An analyst assumes A caused B. What is missing?`,
        options: [
          { id: 'a', text: 'The analyst has sufficient evidence; timing and location are enough.' },
          { id: 'b', text: 'Evidence of direct causal connection: does A have a child process that leads to B, or do files/network activity link them?' },
          { id: 'c', text: 'A mathematical proof of causality.' },
          { id: 'd', text: 'Nothing. Causation is obvious from temporal proximity.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Temporal + spatial proximity = correlation. Causation requires demonstration that A's activity directly led to B—not just that A came first.`,
        feedbackIncorrect: `Correlation is time + entity. Causation requires evidence of direct behavioral connection.`,
      },
      {
        id: 'm10-q-corr-4',
        prompt: `Two events belong to separate approved maintenance tasks but occur during an incident window. Should you separate them from the causal timeline?`,
        options: [
          { id: 'a', text: 'No. Any activity during the incident window is automatically suspicious.' },
          { id: 'b', text: 'Yes. Approved change control and timing within expected windows support excluding them from incident causality unless they intersect with hostile behavior.' },
          { id: 'c', text: 'Only if management approves removal.' },
          { id: 'd', text: 'No. All events must be included regardless of change control status.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Approved baseline activity with matching change tickets can be excluded from the causal sequence. Correlation requires distinguishing signal from noise.`,
        feedbackIncorrect: `Timeline reconstruction separates incident activity from approved baseline. Chronology is more useful and defensible when distractors are clearly marked.`,
      },
    ],
  },
  {
    conceptId: 'attack-as-behavior-framework',
    conceptTitle: 'Using ATT&CK as a behavior-mapping framework subordinate to evidence',
    questions: [
      {
        id: 'm10-q-attack-1',
        prompt: `The M09 slice shows encryption activity followed by a recovery-service stop. Should those demonstrated behaviors be mapped to ATT&CK?`,
        options: [
          { id: 'a', text: 'No. ATT&CK is only for pre-incident planning.' },
          { id: 'b', text: 'Yes. Map T1486 (Data Encrypted for Impact) and T1489 (Service Stop) because the assigned records show both behaviors.' },
          { id: 'c', text: 'Yes, and also map initial access and operator identity because ransomware usually has those elements.' },
          { id: 'd', text: 'Only if management requests ATT&CK mapping.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Map only demonstrated techniques. ATT&CK is a framework for organizing observed behavior, not a list of probable next steps.`,
        feedbackIncorrect: `Do not map techniques you cannot prove. ATT&CK should not fill gaps in the evidence timeline.`,
      },
      {
        id: 'm10-q-attack-2',
        prompt: `The timeline does not show whether a tool was transferred to the target. How should you handle this in ATT&CK mapping?`,
        options: [
          { id: 'a', text: 'Map T1105 (Ingress Tool Transfer) because a connection was observed.' },
          { id: 'b', text: 'Do not map T1105 because evidence of file transfer is absent. Note the unknown as a limitation.' },
          { id: 'c', text: 'Assume tool transfer occurred and map it provisionally.' },
          { id: 'd', text: 'Decline to use ATT&CK framework because the timeline is incomplete.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Connection ≠ transfer. Map only demonstrated techniques; note unknowns explicitly.`,
        feedbackIncorrect: `ATT&CK should organize evidence, not manufacture conclusions. Unproven behavior remains unknown.`,
      },
      {
        id: 'm10-q-attack-3',
        prompt: `An ATT&CK tactic page shows several techniques relevant to the incident. Should you map all of them?`,
        options: [
          { id: 'a', text: 'Yes. Using the full tactic ensures complete coverage.' },
          { id: 'b', text: 'No. Map only the techniques with direct evidence in the incident timeline. Other techniques remain unmapped and noted as unknowns.' },
          { id: 'c', text: 'Map the tactic name but skip individual techniques to save time.' },
          { id: 'd', text: 'Yes, but label unmapped techniques as "possible."' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Selective mapping to evidence is more valuable than comprehensive mapping. Unknowns must be explicit.`,
        feedbackIncorrect: `Mapping every technique in a tactic adds noise. Focus mapping on what the evidence supports.`,
      },
      {
        id: 'm10-q-attack-4',
        prompt: `The incident response timeline is complete and covers all observables. The ATT&CK mapping is now the full incident record. Is this accurate?`,
        options: [
          { id: 'a', text: 'Yes. ATT&CK mapping summarizes the entire incident.' },
          { id: 'b', text: 'No. ATT&CK is a framework for categorizing behavior. The incident record must include the original timeline, entities, impact, custody, and uncertainty separately.' },
          { id: 'c', text: 'Yes, if the ATT&CK mapping uses technical language.' },
          { id: 'd', text: 'No. ATT&CK is not relevant to incident response.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. ATT&CK organizes behavior; it does not replace chronology, scope, impact, or custody documentation.`,
        feedbackIncorrect: `ATT&CK is a tactical reference, not a replacement for incident-response documentation.`,
      },
    ],
  },
  {
    conceptId: 'bounded-conclusions-confidence',
    conceptTitle: 'Bounding conclusions and confidence appropriately',
    questions: [
      {
        id: 'm10-q-bound-1',
        prompt: `You investigated one endpoint and found it compromised. A search across the network found no matches. What should you communicate?`,
        options: [
          { id: 'a', text: 'The endpoint is compromised and the entire organization is definitely clean.' },
          { id: 'b', text: 'The endpoint is confirmed compromised. The scoped search found no matches; continue monitoring unobserved segments for indicators.' },
          { id: 'c', text: 'The endpoint may be compromised and perhaps others are too.' },
          { id: 'd', text: 'The search was inconclusive and no findings should be reported.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. State confirmed scope, search results, and explicitly note what remains unknown or unmonitored.`,
        feedbackIncorrect: `Avoid both overclaiming certainty and refusing to conclude. State what the evidence shows and what it does not show.`,
      },
      {
        id: 'm10-q-bound-2',
        prompt: `The incident timeline explains the initial compromise but does not show exfiltration or wider lateral movement. How should you frame your confidence?`,
        options: [
          { id: 'a', text: 'High confidence in the initial sequence; lateral movement and impact remain unproven by this dataset.' },
          { id: 'b', text: 'Low confidence because exfiltration was not observed.' },
          { id: 'c', text: 'Absolute certainty that no exfiltration occurred.' },
          { id: 'd', text: 'No conclusion is possible without complete data.' },
        ],
        correctId: 'a',
        feedbackCorrect: `Correct. Segment confidence: high for proven facts, high-bounded for scoped inference, explicit for unknowns.`,
        feedbackIncorrect: `You can draw bounded conclusions from partial data. Transparency about evidence gaps enables informed decisions.`,
      },
      {
        id: 'm10-q-bound-3',
        prompt: `What is the difference between "This host was compromised" and "This host may have been compromised"?`,
        options: [
          { id: 'a', text: 'No difference. Both express uncertainty.' },
          { id: 'b', text: 'The first is supported by evidence; the second is speculation. Use the first only when the evidence base is solid.' },
          { id: 'c', text: 'The second is more professional.' },
          { id: 'd', text: 'They are identical in meaning and impact.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Precision in language reflects precision in evidence. "Was compromised" = proven. "May have been" = suspicious but unproven.`,
        feedbackIncorrect: `Language precision matters. Unjustified hedging hides evidence; unjustified certainty overstates it.`,
      },
      {
        id: 'm10-q-bound-4',
        prompt: `You find evidence of initial compromise and containment. The attacker's original objective remains unknown. Should you report this unknown?`,
        options: [
          { id: 'a', text: 'No. Reporting unknowns makes the response look incomplete.' },
          { id: 'b', text: 'Yes. Unknown attacker objective is an honest limitation. It bounds your confidence in impact assessment.' },
          { id: 'c', text: 'Only if management asks.' },
          { id: 'd', text: 'Assume a likely objective and report it as probable.' },
        ],
        correctId: 'b',
        feedbackCorrect: `Correct. Explicit unknowns build trust and shape appropriate response. Do not omit limitations to appear complete.`,
        feedbackIncorrect: `Acknowledging unknowns is a strength, not a weakness. It shows analytical rigor and bounds the scope of claims.`,
      },
    ],
  },
];

const MODULE_TEN_SOURCES_LIST = [
  {
    title: `Guide to Integrating Forensic Techniques into Incident Response (SP 800-86)`,
    org: `NIST`,
    url: `https://csrc.nist.gov/pubs/sp/800/86/final`,
    note: `Authoritative guidance on forensic acquisition, chain of custody, and evidence preservation techniques—directly applicable to both labs in this module.`,
  },
  {
    title: `Guidelines for Evidence Collection and Archiving (RFC 3227)`,
    org: `IETF`,
    url: `https://www.rfc-editor.org/rfc/rfc3227`,
    note: `Foundational, widely-cited guidance on evidence collection order, documentation, and chain-of-custody tracking during a security incident.`,
  },
  {
    title: `ATT&CK Matrix — Initial Access`,
    org: `MITRE`,
    url: `https://attack.mitre.org/tactics/TA0001/`,
    note: `Framework reference used for disciplined behavior mapping; this module's shared M09 slice does not establish initial access.`,
  },
  {
    title: `ATT&CK Matrix — Execution`,
    org: `MITRE`,
    url: `https://attack.mitre.org/tactics/TA0002/`,
    note: `Framework reference for behavior mapping; no command-interpreter behavior is claimed unless the assigned evidence supports it.`,
  },
  {
    title: `Electronic Crime Scene Investigation: A Guide for First Responders, Second Edition`,
    org: `National Institute of Justice`,
    url: `https://nij.ojp.gov/library/publications/electronic-crime-scene-investigation-guide-first-responders-second-edition`,
    note: `Practical guidance on recognizing, collecting, packaging, and transporting digital evidence — the physical-handling half of this module's custody lab.`,
  },
  {
    title: `Security+ (SY0-701) Certification Overview & Objectives Summary`,
    org: `CompTIA`,
    url: `https://www.comptia.org/certifications/security`,
    note: `Supplementary public reference only. The §2 crosswalk is a developer draft pending curriculum, compliance, and faculty review; this study aid is not an approval, affiliation, endorsement, or pass guarantee.`,
  },
];

let moduleTenQuizState = null;
let moduleTenReviewMode = false;

// M09 is the single source of truth for this case. Module 10 consumes only
// its declared slice; it does not create a second incident or duplicate data.
const MODULE_TEN_SHARED_CASE = (typeof window !== 'undefined' && window.MISSION_NEXT_M09_EVIDENCE_CONTRACT)
  || { incidentId: 'INC-4937', title: 'Operation Cedar Lock', entities: { endpoint: 'ws-173', account: 'acct-173', fileServer: 'fs-02' }, consumerSlices: { module10: ['M09-E01', 'M09-E02', 'M09-E03', 'M09-E04', 'M09-E05'] } };

const MODULE_TEN_ARTIFACTS = [
  { id: 'M09-E01', type: 'Endpoint impact telemetry', source: 'ws-173 · endpoint sensor', acquired: '2026-09-10 10:02Z', size: 'Synthetic record', hash: 'recorded fixture fingerprint', handling: 'Exported from the M09 assigned slice; source, UTC basis, and export context retained.', detail: 'Rapid file-encryption behavior is observed on ws-173. This is synthetic training evidence, not a malware sample or live IOC.', admissible: true },
  { id: 'M09-E02', type: 'Service-control telemetry', source: 'ws-173 · endpoint sensor', acquired: '2026-09-10 10:04Z', size: 'Synthetic record', hash: 'recorded fixture fingerprint', handling: 'Collected with the same bounded incident export and UTC time basis.', detail: 'A recovery-service stop request follows the encryption activity. It supports impact behavior but does not prove every recovery point was deleted.', admissible: true },
  { id: 'M09-E03', type: 'Containment action record', source: 'ws-173 · response log', acquired: '2026-09-10 10:06Z', size: 'Synthetic record', hash: 'recorded fixture fingerprint', handling: 'Playbook completion record linked to the assigned incident slice.', detail: 'Network isolation succeeded while a local process remained active. Isolation limits spread; it does not prove the host is clean.', admissible: true },
  { id: 'M09-E04', type: 'Known-good baseline', source: 'ws-173 · managed backup agent', acquired: '2026-09-10 09:58Z', size: 'Synthetic record', hash: 'recorded fixture fingerprint', handling: 'Approved baseline record retained as a distractor, not incident proof.', detail: 'A signed backup process ran in its approved window. It should remain context rather than be promoted into the causal evidence set.', admissible: false },
  { id: 'M09-E05', type: 'Identity baseline', source: 'acct-173 · managed workstation', acquired: '2026-09-10 09:58Z', size: 'Synthetic record', hash: 'recorded fixture fingerprint', handling: 'Native identity record with UTC time and registered endpoint context.', detail: 'The account authenticated from its registered workstation before impact. This is baseline context and does not identify an operator.', admissible: false },
];

const MODULE_TEN_CUSTODY_EVENTS = [
  { id: 'CC-101', time: '10:02:00Z', title: 'Acquire M09 impact export', actor: 'analyst-14', receiver: 'analyst-14', control: 'Source ID recorded · read-only destination', detail: 'The assigned M09 impact record is copied into a controlled evidence package.' },
  { id: 'CC-102', time: '10:08:00Z', title: 'Verify and seal', actor: 'analyst-14', receiver: 'analyst-14', control: 'Synthetic fingerprint match · seal M09-1', detail: 'The recorded fixture fingerprint is verified; the evidence package is sealed and retained read-only.' },
  { id: 'CC-103', time: '10:15:00Z', title: 'Transfer sealed package', actor: 'analyst-14', receiver: 'case-lead-02', control: 'Both signatures · case INC-4937', detail: 'Release and receipt timestamps, purpose, seal condition, and both custodians are recorded.' },
  { id: 'CC-104', time: '10:28:00Z', title: 'Controlled storage receipt', actor: 'case-lead-02', receiver: 'custodian-03', control: 'Seal intact · synthetic vault V-04', detail: 'The evidence custodian signs receipt and records the controlled storage location.' },
];

const MODULE_TEN_TIMELINE = [
  { id: 'TL-301', time: '10:02Z', source: 'Endpoint sensor', entity: 'ws-173', title: 'Encryption activity detected', detail: 'M09-E01 reports rapid file-encryption behavior; this is the primary impact observation.', causal: true },
  { id: 'TL-302', time: '10:04Z', source: 'Endpoint sensor', entity: 'ws-173', title: 'Recovery service stop request', detail: 'M09-E02 follows the encryption activity. It supports impact behavior but not deletion of every recovery point.', causal: true },
  { id: 'TL-303', time: '10:06Z', source: 'Response log', entity: 'ws-173', title: 'Endpoint isolation succeeded', detail: 'M09-E03 records network isolation while local activity remained possible.', causal: true },
  { id: 'TL-304', time: '09:58Z', source: 'Identity baseline', entity: 'acct-173', title: 'Managed sign-in before impact', detail: 'M09-E05 is baseline context and does not identify an operator or establish causation.', causal: false },
  { id: 'TL-305', time: '09:58Z', source: 'Backup baseline', entity: 'ws-173', title: 'Approved backup agent activity', detail: 'M09-E04 is a known-good comparison record, not incident proof.', causal: false },
];

const MODULE_TEN_LINKS = [
  { id: 'L1', from: 'ws-173 encryption', to: 'recovery service', verb: 'preceded stop request', supported: true },
  { id: 'L2', from: 'ws-173 encryption', to: 'ws-173 isolation', verb: 'triggered response', supported: true },
  { id: 'L3', from: 'acct-173 managed sign-in', to: 'ws-173 encryption', verb: 'shares entity context', supported: false },
  { id: 'L4', from: 'backup baseline', to: 'ws-173 encryption', verb: 'coincides only', supported: false },
  { id: 'L5', from: 'ws-173 isolation', to: 'local process', verb: 'does not stop', supported: true },
];

const MODULE_TEN_TECHNIQUES = [
  { id: 'T1486', label: 'T1486 · Data Encrypted for Impact', help: 'M09-E01 directly records encryption behavior on ws-173.' },
  { id: 'T1489', label: 'T1489 · Service Stop', help: 'M09-E02 records a recovery-service stop request.' },
  { id: 'T1078', label: 'T1078 · Valid Accounts', help: 'Do not select: baseline sign-in alone does not establish hostile use.' },
  { id: 'T1566.001', label: 'T1566.001 · Spearphishing Attachment', help: 'Do not select: no delivery evidence is in the M09 Module 10 slice.' },
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

  // Initialize quiz state
  if (!moduleTenQuizState) {
    const previousQuestionIds = moduleTenCustodyState.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(MODULE_TEN_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    moduleTenQuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {},
      scored: false,
      attempts: 0,
      score: 0,
      bestScore: 0,
      feedback: [],
      passed: false,
    };
  }

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
  return `<section class="m10-score ${passed ? 'is-pass' : 'is-remediate'}" id="m10-custody-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m10-custody-score-title"><div class="m10-score-heading"><div><p class="m10-kicker">Attempt ${state.attempts} · best ${state.bestScore}/100</p><h3 id="m10-custody-score-title">${state.score}/100 — ${passed ? 'Evidence package accepted' : 'Repair the preservation record'}</h3></div><span>${state.score}</span></div>${moduleTenScoreGrid(b)}<ul class="m10-feedback-list">${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><div class="m10-remediation"><strong>Shared-case reference finding</strong><p>${esc(MODULE_TEN_SHARED_CASE.incidentId)} uses the M09 slice ${esc((MODULE_TEN_SHARED_CASE.consumerSlices.module10 || []).join(', '))}. Preserve the impact, service-control, and containment records; retain UTC context and integrity notes; keep the baseline records as context only. This lab documents intake and custody—it does not authorize specialist forensic examination.</p></div></section>`;
}

function moduleTenScoreGrid(b) {
  return `<div class="m10-score-grid" aria-label="Explainable score breakdown"><div><strong>${b.observation}/25</strong><span>Observation</span></div><div><strong>${b.analysis}/25</strong><span>Analysis</span></div><div><strong>${b.decision}/25</strong><span>Decision</span></div><div><strong>${b.communication}/25</strong><span>Communication</span></div></div>`;
}

function moduleTenCustodyLab() {
  const custodyOptions = MODULE_TEN_CUSTODY_EVENTS.map((event) => `<option value="${esc(event.id)}">${esc(event.id)} · ${esc(event.title)}</option>`).join('');
  return `<section class="m10-lab" role="tabpanel" aria-labelledby="m10-tab-custody"><div class="m10-lab-heading"><div><p class="m10-kicker">Independent lab · ${formatInstructionalMinutes(MODULE_TEN_CUSTODY_MINUTES)}</p><h2>Evidence Collection &amp; Chain of Custody</h2></div><span>${moduleTenStatus(moduleTenCustodyState)}</span></div>
    <div class="m10-objective"><i class="ri-focus-3-line" aria-hidden="true"></i><div><strong>Objective</strong><p>Produce a defensible evidence package for case FE-10-27 by selecting preserved originals, validating one acquisition record, resolving custody integrity, and communicating the disposition with at least ${MODULE_TEN_PASSING_SCORE}/100.</p></div></div>
    <div class="m10-case-brief"><div><p class="m10-kicker">${esc(MODULE_TEN_SHARED_CASE.incidentId)} · M09 consumer slice</p><h3>Post-containment evidence intake</h3><p>Consume the bounded ransomware evidence established in Module 09. Determine which records support controlled preservation, what integrity context is available, and which baseline records must remain separate.</p></div><dl><div><dt>Scope</dt><dd>ws-173 · acct-173 · fs-02</dd></div><div><dt>Time basis</dt><dd>Synthetic UTC</dd></div><div><dt>Authority</dt><dd>Evidence intake decision</dd></div></dl></div>
    ${moduleTenReference()}
    <section class="m10-workbench" aria-labelledby="m10-inventory-title"><div class="m10-panel-heading"><div><p class="m10-kicker">Dataset</p><h3 id="m10-inventory-title">Acquisition package inventory</h3></div><span>${moduleTenCustodyState.inspectedArtifacts.length}/6 inspected · ${moduleTenCustodyState.selectedEvidence.length} selected</span></div>${moduleTenArtifactTable()}
      <div class="m10-ledger"><div class="m10-panel-heading"><div><p class="m10-kicker">Custody dataset</p><h3>${esc(MODULE_TEN_SHARED_CASE.incidentId)} evidence transfer ledger</h3></div><span>4 recorded events</span></div><div class="m10-ledger-grid">${MODULE_TEN_CUSTODY_EVENTS.map((event) => `<article><time>${esc(event.time)}</time><h4>${esc(event.title)}</h4><p>${esc(event.actor)} → ${esc(event.receiver)}</p><small>${esc(event.control)}</small><span>${esc(event.detail)}</span></article>`).join('')}</div><aside class="m10-ledger-alert"><i class="ri-error-warning-line" aria-hidden="true"></i><p><strong>Evidence boundary:</strong> the M09 consumer slice contains no unlogged copy or specialist image. Do not invent one; document only the supplied synthetic records and any custody gap that the scenario actually exposes.</p></aside></div>
    </section>
    <form class="m10-artifact" id="m10-custody-form" novalidate><div class="m10-panel-heading"><div><p class="m10-kicker">Scored artifact</p><h3>Evidence intake record</h3></div><span>Retry allowed</span></div>
      <fieldset><legend>Preserved package</legend><p class="m10-help">Use the inventory checkboxes to identify the artifacts whose provenance and acquisition records support preservation.</p><div class="m10-selection-summary">${moduleTenCustodyState.selectedEvidence.length ? moduleTenCustodyState.selectedEvidence.map((id) => `<code>${esc(id)}</code>`).join('') : '<span>No artifacts selected</span>'}</div></fieldset>
      <div class="m10-form-grid"><fieldset><legend>Image source</legend>${moduleTenRadio('sourceChoice', moduleTenCustodyState.sourceChoice, [
        { id: 'ws-173', label: 'ws-173 endpoint export', help: 'Named in M09-E01 through M09-E03.' },
        { id: 'wks44', label: 'WKS-44 system disk', help: 'Appears only in another activity record.' },
        { id: 'unknown-usb', label: 'Unlabelled USB device', help: 'A later copy without provenance.' },
      ])}</fieldset><fieldset><legend>Acquisition control</legend>${moduleTenRadio('methodChoice', moduleTenCustodyState.methodChoice, [
        { id: 'bitstream-blocker', label: 'Bit-stream image through validated read-only blocker WB-22', help: 'Preserves the source and records the acquisition control.' },
        { id: 'drag-copy', label: 'Drag files into a desktop folder', help: 'Can alter metadata and omits unallocated content.' },
        { id: 'phone-photo', label: 'Photograph the source screen', help: 'Does not acquire the underlying evidence.' },
      ])}</fieldset><fieldset><legend>Acquisition time</legend>${moduleTenRadio('timeChoice', moduleTenCustodyState.timeChoice, [
        { id: '1002z', label: '2026-09-10 10:02Z', help: 'UTC time in the M09 impact record.' },
        { id: '1131local', label: '2026-08-19 11:31 local', help: 'Belongs to the undocumented photograph.' },
        { id: 'unknown', label: 'Unknown', help: 'Would leave the image chronology unsupported.' },
      ])}</fieldset><fieldset><legend>Recorded SHA-256</legend>${moduleTenRadio('hashChoice', moduleTenCustodyState.hashChoice, [
        { id: 'full-b4', label: 'M09 fixture fingerprint', help: 'Use the recorded synthetic fingerprint; do not invent a live hash.' },
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
        { id: 'baseline-separate', label: 'M09-E04 and M09-E05 are baseline context, not causal evidence', help: 'Keep known-good records separate while the assigned impact records follow the ledger.' },
        { id: 'ledger-gap', label: 'The supplied ledger has a missing handoff', help: 'The synthetic ledger is complete; do not invent a gap.' },
        { id: 'no-gap', label: 'The assigned evidence has a complete recorded custody path', help: 'The four supplied events document acquisition, verification/seal, transfer, and receipt.' },
      ])}</fieldset><fieldset><legend>Intake decision</legend>${moduleTenRadio('preservationDecision', moduleTenCustodyState.preservationDecision, [
        { id: 'accept-quarantine', label: 'Accept M09-E01–E03 as logged evidence; retain M09-E04–E05 as baseline context', help: 'Preserves the bounded shared-case slice without promoting distractor records.' },
        { id: 'accept-all', label: 'Accept every item because more evidence is always better', help: 'Uncontrolled copies can contaminate a review.' },
        { id: 'destroy-usb', label: 'Destroy the USB immediately', help: 'Destruction exceeds intake authority and removes a potentially reviewable item.' },
      ])}</fieldset></div>
      <label class="m10-note-label" for="m10-custody-notes">Evidence disposition note</label><p class="m10-help" id="m10-custody-help">Write at least 130 characters. Identify the accepted originals, image source/control, UTC time and matching-hash result, custody gap, and disposition.</p><textarea id="m10-custody-notes" name="custodyNotes" rows="6" maxlength="1000" aria-describedby="m10-custody-help m10-custody-count" placeholder="Accepted evidence: … Acquisition: … Integrity: … Custody exception: … Disposition: …">${esc(moduleTenCustodyState.notes)}</textarea><p class="m10-note-count" id="m10-custody-count">${moduleTenCustodyState.notes.length}/1000</p>
      <div class="m10-actions"><button type="submit" class="m10-submit"><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Score intake record</button><button type="button" class="m10-reset" data-m10-reset="custody"><i class="ri-restart-line" aria-hidden="true"></i> Reset this lab only</button></div>${moduleTenCustodyScorePanel()}
    </form></section>`;
}

function moduleTenTimelineTable() {
  const active = MODULE_TEN_TIMELINE.find((item) => item.id === moduleTenMappingState.activeEvent);
  return `<div class="m10-table-wrap"><table class="m10-data-table"><caption class="m10-visually-hidden">Synthetic event dataset for ${esc(MODULE_TEN_SHARED_CASE.incidentId)}</caption><thead><tr><th scope="col">Timeline</th><th scope="col">UTC</th><th scope="col">Source</th><th scope="col">Entity</th><th scope="col">Observation</th><th scope="col">Context</th></tr></thead><tbody>${MODULE_TEN_TIMELINE.map((item) => {
    const selected = moduleTenMappingState.selectedTimeline.includes(item.id);
    return `<tr class="${selected ? 'is-selected' : ''}"><td data-label="Timeline"><label class="m10-evidence-check"><input type="checkbox" name="timelineEvent" value="${esc(item.id)}" ${selected ? 'checked' : ''} /><span>${esc(item.id)}</span></label></td><td data-label="UTC"><time>${esc(item.time)}</time></td><td data-label="Source">${esc(item.source)}</td><td data-label="Entity"><code>${esc(item.entity)}</code></td><td data-label="Observation"><strong>${esc(item.title)}</strong></td><td data-label="Context"><button type="button" class="m10-inspect" data-m10-event="${esc(item.id)}" aria-expanded="${active?.id === item.id}">${active?.id === item.id ? 'Hide context' : 'Inspect context'}</button></td></tr>`;
  }).join('')}</tbody></table></div>${active ? `<aside class="m10-detail" id="m10-event-detail" tabindex="-1"><div><p class="m10-kicker">${esc(active.id)} · ${esc(active.source)}</p><h4>${esc(active.title)}</h4><p>${esc(active.detail)}</p></div><button type="button" data-m10-close-event aria-label="Close event detail"><i class="ri-close-line" aria-hidden="true"></i></button></aside>` : ''}`;
}

function moduleTenTimelineStrip() {
  const rows = moduleTenMappingState.selectedTimeline.map((id) => MODULE_TEN_TIMELINE.find((item) => item.id === id)).filter(Boolean).sort((a, b) => a.time.localeCompare(b.time));
  return `<aside class="m10-timeline-strip" aria-labelledby="m10-timeline-title"><div><p class="m10-kicker">Constructed chronology</p><h4 id="m10-timeline-title">${rows.length} selected events</h4></div>${rows.length ? `<ol>${rows.map((row) => `<li><time>${esc(row.time)}</time><span><code>${esc(row.id)}</code>${esc(row.title)}</span><button type="button" data-m10-remove-event="${esc(row.id)}" aria-label="Remove ${esc(row.id)} from timeline"><i class="ri-close-line" aria-hidden="true"></i></button></li>`).join('')}</ol>` : '<p>Select the records that form the supported causal sequence. The strip orders selected records by UTC.</p>'}</aside>`;
}

function moduleTenGraph() {
  return `<section class="m10-graph" aria-labelledby="m10-graph-title"><div class="m10-panel-heading"><div><p class="m10-kicker">Relationship workspace</p><h3 id="m10-graph-title">Supported entity graph</h3></div><span>${moduleTenMappingState.selectedLinks.length}/5 links selected</span></div><div class="m10-node-map" aria-label="Entity relationship overview"><span class="is-account"><i class="ri-user-line" aria-hidden="true"></i>acct-173</span><span class="is-file"><i class="ri-file-warning-line" aria-hidden="true"></i>encrypted files</span><span class="is-process"><i class="ri-terminal-box-line" aria-hidden="true"></i>impact activity</span><span class="is-network"><i class="ri-global-line" aria-hidden="true"></i>ws-173</span><span class="is-task"><i class="ri-server-line" aria-hidden="true"></i>fs-02</span></div>${moduleTenCheck('relationshipLink', moduleTenMappingState.selectedLinks, MODULE_TEN_LINKS.map((link) => ({ id: link.id, label: `${link.from} —${link.verb}→ ${link.to}`, help: 'Select only if a case record directly supports this edge.' })) )}</section>`;
}

function moduleTenScenarioLoops() {
  return `<div class="m10-loop-grid" aria-label="Module 10 four-part learning loops">
    <article><p class="m10-kicker">Lesson 1 · Scenario</p><h4>Receive the bounded M09 slice</h4><p>INC-4937 is contained in the lab slice; ws-173 impact and the two baseline records are available for intake.</p></article>
    <article><p class="m10-kicker">Lesson 1 · Theory</p><h4>Integrity, provenance, custody</h4><p>Hash meaning, UTC basis, acquisition controls, and documented handoffs answer different review questions.</p></article>
    <article><p class="m10-kicker">Lesson 1 · Knowledge check</p><h4>Choose what can be preserved</h4><p>Explain why M09-E01–E03 are assigned evidence while M09-E04–E05 remain context.</p></article>
    <article><p class="m10-kicker">Lesson 1 · Applied task</p><h4>Complete the intake record</h4><p>Build a custody sequence and disposition note without adding an unobserved copy or live indicator.</p></article>
    <article><p class="m10-kicker">Lesson 2 · Scenario</p><h4>Reconstruct the impact sequence</h4><p>Compare endpoint, service-control, isolation, and baseline records from the same synthetic incident.</p></article>
    <article><p class="m10-kicker">Lesson 2 · Theory</p><h4>Map behavior only when demonstrated</h4><p>ATT&amp;CK organizes observed behavior; it does not supply missing access, operator, or lateral-movement facts.</p></article>
    <article><p class="m10-kicker">Lesson 2 · Knowledge check</p><h4>Separate fact from inference</h4><p>Use source review to test whether a relationship or technique is supported, not merely plausible.</p></article>
    <article><p class="m10-kicker">Lesson 2 · Applied task</p><h4>Write the reconstruction</h4><p>Document the bounded chain, selected techniques, scope, and explicit unknowns for specialist review.</p></article>
  </div>`;
}

function moduleTenMappingScorePanel() {
  const state = moduleTenMappingState;
  if (state.validationError) return `<div class="m10-validation" id="m10-mapping-feedback" role="alert" tabindex="-1"><i class="ri-information-line" aria-hidden="true"></i><div><strong>Incident conclusion incomplete</strong><p>${esc(state.validationError)}</p></div></div>`;
  if (!state.attempts || !state.breakdown) return `<div class="m10-score-empty" id="m10-mapping-feedback" role="status">Scoring: observation 25 · analysis 30 · decision 25 · communication 20. Pass: ${MODULE_TEN_PASSING_SCORE}/100.</div>`;
  const b = state.breakdown;
  const passed = state.score >= MODULE_TEN_PASSING_SCORE;
  return `<section class="m10-score ${passed ? 'is-pass' : 'is-remediate'}" id="m10-mapping-feedback" tabindex="-1" aria-live="polite" aria-labelledby="m10-mapping-score-title"><div class="m10-score-heading"><div><p class="m10-kicker">Attempt ${state.attempts} · best ${state.bestScore}/100</p><h3 id="m10-mapping-score-title">${state.score}/100 — ${passed ? 'Reconstruction supported' : 'Separate evidence from inference'}</h3></div><span>${state.score}</span></div><div class="m10-score-grid" aria-label="Explainable score breakdown"><div><strong>${b.observation}/25</strong><span>Observation</span></div><div><strong>${b.analysis}/30</strong><span>Analysis</span></div><div><strong>${b.decision}/25</strong><span>Decision</span></div><div><strong>${b.communication}/20</strong><span>Communication</span></div></div><ul class="m10-feedback-list">${state.feedback.map((item) => `<li>${esc(item)}</li>`).join('')}</ul><div class="m10-remediation"><strong>Shared-case reference finding</strong><p>The supported chain is the bounded M09 sequence of encryption activity, recovery-service stop request, and endpoint isolation on ws-173. Map only demonstrated behavior; the records do not establish initial access, operator identity, exfiltration, or broader scope.</p></div></section>`;
}

function moduleTenMappingLab() {
  return `<section class="m10-lab" role="tabpanel" aria-labelledby="m10-tab-mapping"><div class="m10-lab-heading"><div><p class="m10-kicker">Independent lab · ${formatInstructionalMinutes(MODULE_TEN_MAPPING_MINUTES)}</p><h2>Incident Timeline, Cause &amp; Behavior Mapping</h2></div><span>${moduleTenStatus(moduleTenMappingState)}</span></div>
    <div class="m10-objective"><i class="ri-focus-3-line" aria-hidden="true"></i><div><strong>Objective</strong><p>Reconstruct ${esc(MODULE_TEN_SHARED_CASE.incidentId)} from the five declared M09 consumer records, identify the supported impact sequence, build a defensible entity graph, and use ATT&amp;CK only as a framework for demonstrated behavior, scoring at least ${MODULE_TEN_PASSING_SCORE}/100.</p></div></div>
    <div class="m10-case-brief"><div><p class="m10-kicker">${esc(MODULE_TEN_SHARED_CASE.incidentId)} · assigned incident slice</p><h3>Post-containment impact reconstruction</h3><p>Endpoint, response, and baseline records cover the same synthetic ransomware case. Determine what belongs in the supported chronology and what remains unknown.</p></div><dl><div><dt>Records</dt><dd>5 declared M09 records</dd></div><div><dt>Time basis</dt><dd>UTC</dd></div><div><dt>Question</dt><dd>Impact and behavior</dd></div></dl></div>
    ${moduleTenReference()}
    <section class="m10-workbench" aria-labelledby="m10-events-title"><div class="m10-panel-heading"><div><p class="m10-kicker">Dataset</p><h3 id="m10-events-title">Cross-source event records</h3></div><span>${moduleTenMappingState.selectedTimeline.length} timeline events selected</span></div>${moduleTenTimelineTable()}${moduleTenTimelineStrip()}</section>
    ${moduleTenGraph()}
    <form class="m10-artifact" id="m10-mapping-form" novalidate><div class="m10-panel-heading"><div><p class="m10-kicker">Scored artifact</p><h3>Evidence-based incident conclusion</h3></div><span>Retry allowed</span></div>
      <div class="m10-form-grid"><fieldset><legend>Supported root cause</legend>${moduleTenRadio('rootCause', moduleTenMappingState.rootCause, [
        { id: 'impact-chain', label: 'Encryption on ws-173 preceded a recovery-service stop and containment action', help: 'This is the supported sequence in M09-E01 through M09-E03.' },
        { id: 'baseline-cause', label: 'The managed sign-in or backup baseline caused the case', help: 'M09-E04 and M09-E05 are context, not causal evidence.' },
        { id: 'operator-claim', label: 'A named operator caused the case', help: 'The shared contract explicitly does not establish operator identity.' },
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

function moduleTenGetSections() {
  return [
    { id: 'lecture', title: 'Lecture', type: 'lecture', isComplete: true, scrollId: 'm10-lecture' },
    { id: 'knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: moduleTenQuizState?.passed, scrollId: 'm10-knowledge-check' },
    { id: 'evidence-labs', title: 'Evidence & Incident Labs', type: 'lab', isComplete: moduleTenCustodyState.completed && moduleTenMappingState.completed, scrollId: 'm10-lab' },
    { id: 'review', title: 'Module Review', type: 'review', isComplete: true, scrollId: 'm10-review' },
  ];
}

function moduleTenQuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = moduleTenQuizState?.answers?.[question.id];
  const answered = userAnswerId !== undefined;
  return `<fieldset class="m10-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="m10-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-m10-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function moduleTenQuizPanel() {
  if (!moduleTenQuizState?.selectedQuestions || moduleTenQuizState.selectedQuestions.length === 0) {
    return `<div class="m10-quiz-empty" id="m10-quiz-feedback" role="status">Loading quiz…</div>`;
  }

  const selected = moduleTenQuizState.selectedQuestions;
  const answered = Object.keys(moduleTenQuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (moduleTenQuizState.scored) {
    const passed = moduleTenQuizState.score >= 70;
    feedbackHtml = `<section class="m10-quiz-score ${passed ? 'm10-quiz-pass' : 'm10-quiz-remediate'}" id="m10-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="m10-quiz-score-heading">
        <div>
          <p class="m10-kicker">Attempt ${moduleTenQuizState.attempts} · best ${moduleTenQuizState.bestScore}/100</p>
          <h3>${moduleTenQuizState.score}/100 — ${passed ? 'Knowledge verified' : 'Use feedback and retry'}</h3>
        </div>
        <span>${moduleTenQuizState.score}</span>
      </div>
      <ul class="m10-quiz-feedback-list">
        ${(moduleTenQuizState.feedback || []).map((fb) => `<li class="${fb.correct ? 'm10-quiz-feedback-correct' : 'm10-quiz-feedback-incorrect'}">
          <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
          <div>
            <strong>${fb.questionId}</strong>
            <p>${esc(fb.message)}</p>
          </div>
        </li>`).join('')}
      </ul>
      ${!passed ? `<div class="m10-quiz-actions"><button type="button" class="m10-quiz-retry" data-m10-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="m10-quiz-ready" id="m10-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="m10-quiz-empty" id="m10-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="m10-quiz-form" id="m10-quiz-form" novalidate>
    <div class="m10-panel-heading"><div><p class="m10-kicker">Knowledge check</p><h3 id="m10-quiz-title" tabindex="-1">Test your understanding of evidence handling and timeline reconstruction</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => moduleTenQuizQuestion(sel, idx)).join('')}
    <div class="m10-quiz-actions">
      <button class="m10-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}>
        <i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers
      </button>
    </div>
    ${feedbackHtml}
  </form>`;
}

function moduleTenVideoScript() {
  return `<details class="m10-video-script">
    <summary><strong>Video script (recording pending)</strong></summary>
    <div class="m10-script-body">
      <p><strong>Introduction:</strong> Welcome to evidence handling and incident reconstruction. This module teaches you how to acquire and preserve forensic evidence defensibly, distinguish between integrity verification and provenance documentation, build a causal incident timeline from mixed sources, map observed behavior to ATT&CK appropriately, and write bounded conclusions that match your evidence.</p>

      <p><strong>Segment 1 — Chain of custody and defensible acquisition.</strong> Evidence must be collected using validated controls: read-only blockers, UTC timestamps, cryptographic hashing of both source and image, and a complete transfer ledger. Each handoff requires both parties' signatures, seal condition, and clear purpose. A matching hash proves the image is byte-identical to the source at that moment—it does not prove every later custody event was sound or that an unlogged copy was never mishandled. When you find evidence without custody records, quarantine it pending provenance review instead of accepting it into a controlled analysis. Your intake authority is to accept logged originals and segregate uncontrolled copies.</p>

      <p><strong>Segment 2 — Hash integrity versus proof of custody.</strong> Hashing both the source and image establishes a baseline: if they match, the image captured all source content without modification. But integrity at acquisition time is distinct from provenance across later transfer, storage, and review. A matching hash does not repair missing custodian signatures, receipt times, or seal records. If two images of the same source have different hashes, investigate which acquisition was sound. If an unlogged copy has a matching hash, that integrity proves sameness—not custody—and the copy must be quarantined, not merged.</p>

      <p><strong>Segment 3 — Correlation, causation, and timeline construction.</strong> A timeline is not a list of events in order; it is a sequence of correlated observations supporting one incident. Events are correlated when they share entity (endpoint, account, IP) and timing. Causation adds a direct behavioral connection: does the parent event's activity directly lead to the child event? A connection 4 minutes after a file arrives at the same endpoint is correlation material; causation requires evidence that the file was opened and started the process. Three events with matching identifiers across wide time gaps require continuous behavioral chain to prove they belong together. Use approved change-control records to separate baseline maintenance from incident activity.</p>

      <p><strong>Segment 4 — ATT&CK as a framework, not a timeline or completion checklist.</strong> Once your timeline of supported events is complete, you can map the behaviors you observe to ATT&CK techniques for easier communication and analysis. But ATT&CK is subordinate to evidence, not the other way around. Map only techniques you can point to in your timeline. Do not map probable next steps, assumed attacker objectives, or techniques the framework covers that your data does not. If a connection is observed but file transfer is not, map the connection behavior and note that tool transfer remains unknown. A complete ATT&CK mapping does not replace incident documentation; the original timeline, scope, entities, and custody records remain the primary record.</p>

      <p><strong>Segment 5 — Bounded conclusions and honest uncertainty.</strong> You can draw high-confidence conclusions from evidence within a scoped dataset. You can make high-bounded conclusions about events you observed in detail while explicitly noting unknowns. Do not claim certainty beyond what the evidence supports, and do not refuse to conclude because the dataset is incomplete. Instead, say: "This host was confirmed compromised. Lateral movement is not observed in the assigned slice. Wider environment status unknown—continue monitoring." This precision builds trust and shapes appropriate response.</p>

      <p><strong>Closing:</strong> Evidence handling is a discipline of acquisition controls, integrity checks, and custody documentation. Timeline construction separates correlation from causation through behavioral connection. ATT&CK organizes your observed behaviors without filling gaps. Your conclusion should state what you know, what you do not know, and what scope your findings cover. Your team depends on that honesty.</p>
    </div>
  </details>`;
}

function moduleTenReview() {
  return `<section class="m10-review-section">
    <h3>Module concepts at a glance</h3>
    <ul>
      <li><strong>Chain-of-custody documentation:</strong> Preserved evidence requires validated acquisition controls, UTC timestamps, matching cryptographic hashes on source and image, and a complete transfer ledger with release/receipt signatures and seal condition from each custodian.</li>
      <li><strong>Hash integrity vs. provenance:</strong> Matching source and image hashes prove byte-identical sameness at acquisition. They do not establish later custody events or repair missing transfer records. Integrity and provenance are related but distinct concerns.</li>
      <li><strong>Correlation and causation:</strong> Events sharing entity and timing are correlated. Causation requires direct behavioral connection: does the source event's activity lead to the target event? Connect only evidenced relationships; separate approved baseline activity.</li>
      <li><strong>ATT&CK as a framework:</strong> Map only demonstrated techniques from your timeline. ATT&CK organizes observed behavior; it does not complete incident documentation or fill evidentiary gaps. It remains subordinate to evidence, not authoritative.</li>
      <li><strong>Bounded conclusions:</strong> State confirmed scope, observations, and unknowns explicitly. High confidence in proven facts within your dataset; high-bounded confidence for inferences; clear notes on unobserved or unmeasured segments.</li>
      <li><strong>Evidence intake authority:</strong> Accept logged originals with complete custody. Quarantine uncontrolled copies pending provenance review. Do not merge evidence without documented handoffs or destroy material beyond your authority.</li>
    </ul>
    <h3>Before you continue</h3>
    <p>You should now be able to collect evidence using validated controls and document complete custody; distinguish hash integrity from provenance; construct a supported incident timeline separating correlation from causation; map observed behavior to ATT&CK as a framework rather than a completion checklist; and write conclusions that state what is confirmed, what remains bounded, and what is unknown. In later modules and on-the-job, you will apply these skills in triage, escalation, and forensic investigation scenarios.</p>
  </section>`;
}

function viewModuleTen(user, program) {
  moduleTenLoad(user);
  const module = program.modules['soc-10'];
  const sections = moduleTenGetSections();
  const lectureOpen = moduleTenReviewMode || !sections[0].isComplete;
  const quizOpen = moduleTenReviewMode || (moduleTenQuizState && !moduleTenQuizState.passed);
  const labOpen = moduleTenReviewMode || !sections[2].isComplete;
  const reviewOpen = moduleTenReviewMode;

  return `<div class="m10-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(sections, { reviewMode: moduleTenReviewMode })}
    <main class="m10-main">
      <section class="m10-hero" aria-labelledby="m10-title"><div><p class="m10-kicker">Module 10 · ${formatInstructionalMinutes(module.durationMinutes)} · independent</p><h1 id="m10-title">${esc(module.title)}</h1><p>Preserve incident evidence, document custody, and reconstruct a separate case from chronology and demonstrated behavior. ATT&CK remains subordinate to the evidence as a behavior framework; it does not replace the case record.</p></div><dl aria-label="Module lab progress"><div><dt>Independent labs</dt><dd>${module.labs}</dd></div><div><dt>Passing score</dt><dd>${MODULE_TEN_PASSING_SCORE}</dd></div><div><dt>Completed</dt><dd id="m10-completed">${[moduleTenCustodyState, moduleTenMappingState].filter((state) => state.completed).length}/${module.labs}</dd></div></dl></section>

      <details class="m10-section-collapsible" ${lectureOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading"><span class="m10-section-badge">1</span><div><p class="m10-kicker">Lecture</p><h2 id="m10-lecture">Evidence acquisition, custody, timeline reconstruction, and bounded conclusions</h2></div></div></summary>
        <div class="m10-section-body">
          <section class="m10-boundary"><i class="ri-lock-2-line" aria-hidden="true"></i><p><strong>Bounded practice:</strong> this is incident evidence handling and case documentation, not a full digital-forensics program. Acquisition and specialist examination remain with authorized specialists; each exercise contains only its assigned synthetic case dataset.</p></section>
          ${moduleTenScenarioLoops()}
          ${moduleTenVideoScript()}
        </div>
      </details>

      <details class="m10-section-collapsible" ${quizOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading"><span class="m10-section-badge">2</span><div><p class="m10-kicker">Knowledge Check</p><h2 id="m10-knowledge-check">Test your understanding of evidence handling and timeline reconstruction</h2></div></div></summary>
        <div class="m10-section-body">
          <div id="m10-quiz-panel">${moduleTenQuizPanel()}</div>
        </div>
      </details>

      <details class="m10-section-collapsible" ${labOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading"><span class="m10-section-badge">3</span><div><p class="m10-kicker">Evidence & Incident Labs</p><h2 id="m10-lab">Evidence custody and timeline reconstruction practice</h2></div></div></summary>
        <div class="m10-section-body">
          <div id="m10-dynamic">${moduleTenDynamic()}</div>
        </div>
      </details>

      <details class="m10-section-collapsible" ${reviewOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading"><span class="m10-section-badge">4</span><div><p class="m10-kicker">Review</p><h2 id="m10-review">Module Review</h2></div></div></summary>
        <div class="m10-section-body">
          ${moduleTenReview()}
        </div>
      </details>

      <details class="m10-section-collapsible" ${reviewOpen ? 'open' : ''}>
        <summary class="m10-section"><div class="m10-section-heading"><span class="m10-section-badge">5</span><div><p class="m10-kicker">Sources</p><h2 id="m10-sources">Further Reading & Citation</h2></div></div></summary>
        <div class="m10-section-body">
          ${moduleSourcesBlock(MODULE_TEN_SOURCES_LIST)}
        </div>
      </details>
    </main>
  </div>`;
}

function moduleTenScoreCustody() {
  const state = moduleTenCustodyState;
  const reviewed = Math.min(5, state.inspectedArtifacts.length);
  const evidence = moduleTenExact(state.selectedEvidence, ['M09-E01', 'M09-E02', 'M09-E03'], 15);
  const riskObserved = state.custodyRisk === 'baseline-separate' ? 5 : 0;
  const observation = reviewed + evidence + riskObserved;
  const acquisition = [state.sourceChoice === 'ws-173', state.methodChoice === 'bitstream-blocker', state.timeChoice === '1002z'].filter(Boolean).length * 5;
  const integrity = (state.hashChoice === 'full-b4' ? 5 : 0) + (state.verificationChoice === 'match-integrity' ? 5 : 0);
  const analysis = acquisition + integrity;
  const sequence = state.custodySequence.join('|') === 'CC-101|CC-102|CC-103|CC-104' ? 15 : moduleTenExact(state.custodySequence.filter(Boolean), ['CC-101', 'CC-102', 'CC-103', 'CC-104'], 8);
  const disposition = state.preservationDecision === 'accept-quarantine' ? 10 : 0;
  const decision = Math.min(25, sequence + disposition);
  const communication = moduleTenNoteScore(state.notes, [
    { pattern: /m09-e01|encryption|impact/, points: 3 }, { pattern: /m09-e02|service stop/, points: 3 }, { pattern: /m09-e03|isolation|containment/, points: 3 },
    { pattern: /ws-173|endpoint sensor|read.?only/, points: 4 }, { pattern: /10:02z|utc/, points: 3 }, { pattern: /sha-?256|hash|fingerprint|integrity/, points: 3 },
    { pattern: /baseline|m09-e04|m09-e05|context/, points: 3 }, { pattern: /accept|separate|preserv|controlled/, points: 3 },
  ]);
  const score = observation + analysis + decision + communication;
  return { score, breakdown: { observation, analysis, decision, communication }, feedback: [
    evidence === 15 && reviewed === 5 ? 'Observation: the three M09 impact/containment records were selected after reviewing all five declared records.' : `Observation: ${observation}/25. Preserve M09-E01, M09-E02, and M09-E03; keep M09-E04 and M09-E05 as baseline context.`,
    analysis === 25 ? 'Analysis: the ws-173 endpoint source, read-only control, UTC acquisition record, synthetic fingerprint, and integrity meaning are documented.' : `Analysis: ${analysis}/25. Reconcile the M09 endpoint source, acquisition control, UTC record, recorded fingerprint, and integrity meaning.`,
    decision === 25 ? 'Decision: custody is chronological and baseline records remain separate from the supported impact evidence.' : `Decision: ${decision}/25. Order acquire, verify/seal, transfer, receipt; preserve the bounded M09 evidence without inventing a custody exception.`,
    communication === 25 ? 'Communication: the disposition is complete, specific, and reviewable.' : `Communication: ${communication}/25. Name M09 evidence IDs, acquisition controls, time/hash result, baseline boundary, and disposition.`,
  ] };
}

function moduleTenScoreMapping() {
  const state = moduleTenMappingState;
  const timeline = moduleTenExact(state.selectedTimeline, ['TL-301', 'TL-302', 'TL-303'], 18);
  const chronology = state.selectedTimeline.filter((id) => ['TL-301', 'TL-302', 'TL-303'].includes(id)).length === 3 ? 7 : 0;
  const observation = timeline + chronology;
  const rootCause = state.rootCause === 'impact-chain' ? 12 : 0;
  const links = moduleTenExact(state.selectedLinks, ['L1', 'L2', 'L5'], 12);
  const confidence = state.confidence === 'high-bounded' ? 6 : 0;
  const analysis = rootCause + links + confidence;
  const attack = moduleTenExact(state.techniques, ['T1486', 'T1489'], 16);
  const framework = state.frameworkBoundary === 'facts-inference-unknowns' ? 9 : 0;
  const decision = attack + framework;
  const communication = moduleTenNoteScore(state.notes, [
    { pattern: /m09-e01|encryption/, points: 3 }, { pattern: /m09-e02|service stop/, points: 3 }, { pattern: /m09-e03|isolation|containment/, points: 2 },
    { pattern: /ws-173|acct-173|fs-02/, points: 3 }, { pattern: /t1486|t1489|attack/, points: 3 }, { pattern: /unknown|does not prove|not establish|limited|no evidence|bounded/, points: 3 },
  ]);
  const score = observation + analysis + decision + communication;
  return { score, breakdown: { observation, analysis, decision, communication }, feedback: [
    observation === 25 ? 'Observation: the three-event impact chronology excludes both baseline distractors.' : `Observation: ${observation}/25. Retain M09-E01, M09-E02, and M09-E03; keep M09-E04 and M09-E05 as context.`,
    analysis === 30 ? 'Analysis: the encryption → service stop → isolation sequence and supported graph edges align across the M09 slice.' : `Analysis: ${analysis}/30. Anchor the conclusion in ws-173 impact and connect only directly supported edges.`,
    decision === 25 ? 'Framework mapping: demonstrated impact/service behavior is mapped while operator identity and broader actions remain unknown.' : `Framework mapping: ${decision}/25. Map T1486 and T1489 only; separate facts, inference, and unknowns.`,
    communication === 20 ? 'Communication: the impact sequence, entities, behavior, and limitation are explicit.' : `Communication: ${communication}/20. Include M09 IDs, ws-173/acct-173/fs-02 context, supported ATT&CK behavior, and an evidence limitation.`,
  ] };
}

function moduleTenRenderQuiz() {
  const root = document.getElementById('m10-quiz-form');
  if (!root) return;
  root.innerHTML = moduleTenQuizPanel();
}

function moduleTenScoreQuiz() {
  if (!moduleTenQuizState?.selectedQuestions) return;
  const answers = moduleTenQuizState.answers || {};
  const result = scoreQuizAttempt(moduleTenQuizState.selectedQuestions, moduleTenQuizState.questionsByAnswer, answers);
  moduleTenQuizState.attempts = (moduleTenQuizState.attempts || 0) + 1;
  moduleTenQuizState.score = result.score;
  moduleTenQuizState.bestScore = Math.max(moduleTenQuizState.bestScore || 0, result.score);
  moduleTenQuizState.feedback = result.feedback;
  moduleTenQuizState.scored = true;
  moduleTenQuizState.passed = result.score >= MODULE_TEN_PASSING_SCORE;
  moduleTenCustodyState.lastQuizQuestionIds = moduleTenQuizState.selectedQuestions.map((q) => q.question.id);
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

function wireModuleTen() {
  // Review mode toggle wiring
  const reviewToggle = document.querySelector('[data-mnav-review-toggle]');
  if (reviewToggle) {
    reviewToggle.addEventListener('click', () => {
      moduleTenReviewMode = !moduleTenReviewMode;
      const sections = moduleTenGetSections();
      const lectureOpen = moduleTenReviewMode || !sections[0].isComplete;
      const quizOpen = moduleTenReviewMode || (moduleTenQuizState && !moduleTenQuizState.passed);
      const labOpen = moduleTenReviewMode || !sections[2].isComplete;
      const reviewOpen = moduleTenReviewMode;
      document.querySelectorAll('.m10-section-collapsible').forEach((details, idx) => {
        const shouldOpen = idx === 0 ? lectureOpen : idx === 1 ? quizOpen : idx === 2 ? labOpen : reviewOpen;
        details.open = shouldOpen;
      });
      reviewToggle.setAttribute('aria-pressed', moduleTenReviewMode ? 'true' : 'false');
      reviewToggle.querySelector('i').className = moduleTenReviewMode ? 'ri-eye-off-line' : 'ri-eye-line';
    });
  }

  wireModuleTenQuiz();
  wireModuleTenLab();
}

function wireModuleTenQuiz() {
  const form = document.getElementById('m10-quiz-form');
  if (!form) return;

  form.addEventListener('change', (event) => {
    if (event.target.dataset.m10QuizAnswer) {
      const questionId = event.target.name.replace('q-', '');
      moduleTenQuizState.answers[questionId] = event.target.value;
      moduleTenRenderQuiz();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    moduleTenScoreQuiz();
    moduleTenRenderQuiz();
  });

  form.addEventListener('click', (event) => {
    if (!event.target.closest('[data-m10-quiz-retry]')) return;
    moduleTenQuizState = {
      selectedQuestions: moduleTenQuizState.selectedQuestions.map((sq) => ({ ...sq })),
      questionsByAnswer: { ...moduleTenQuizState.questionsByAnswer },
      answers: {},
      scored: false,
      attempts: moduleTenQuizState.attempts,
      score: 0,
      bestScore: moduleTenQuizState.bestScore,
      feedback: [],
      passed: false,
    };
    moduleTenRenderQuiz();
  });
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

registerModuleLab({ program: 'soc-analyst', moduleNumber: 10, moduleKey: 'soc-10', view: viewModuleTen, wire: wireModuleTen });
