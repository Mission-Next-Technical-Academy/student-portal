#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'portal', 'data.js');
const MAP_FILE = path.join(ROOT, 'CURRICULUM_MAP.md');
const WRITE_MAP = process.argv.includes('--write-map');

const EXPECTED_PARENTS = [
  ['SOC-101.1', 'Program Orientation, LMS Navigation, SOC Role Overview, and Security Operations Workflow', 3, 180, 0],
  ['SOC-101.2', 'Network Operations Fundamentals, Protocols, Traffic Flow, and Security Architecture', 10, 600, 0],
  ['SOC-101.3', 'Network Attack Methods, Common Threat Vectors, and Adversary Techniques', 10, 165, 435],
  ['SOC-101.4', 'Detection Mechanisms, Alert Triage, Indicators of Compromise, and Event Review', 12, 375, 345],
  ['SOC-101.5', 'Packet Capture, Log Review, IDS/IPS Concepts, and SIEM Scenario Analysis', 14, 150, 690],
  ['SOC-101.6', 'Incident Response Fundamentals, Escalation, Documentation, and Case Handling', 9, 150, 390],
  ['SOC-101.7', 'Automated Detection Tools, Security Monitoring Methodologies, and Analyst Workflow', 8, 180, 300],
  ['SOC-101.8', 'Capstone: SOC Case Study, Threat Detection Scenario, and Analyst Report', 4, 0, 240],
];

const EXPECTED_MODULES = [
  ['soc-01', 'SOC Operations Foundations', 480],
  ['soc-02', 'Network, Identity & Security Foundations', 660],
  ['soc-03', 'SIEM & Log Analysis', 465],
  ['soc-04', 'Detection Rules, Threat Intelligence & Automated Monitoring', 300],
  ['soc-05', 'Endpoint & Malware Investigation', 270],
  ['soc-06', 'Threat Hunting & Investigation', 165],
  ['soc-07', 'Network & Email Analysis', 600],
  ['soc-08', 'Vulnerability Findings & SOC Prioritization', 405],
  ['soc-09', 'Incident Response', 150],
  ['soc-10', 'Incident Evidence Handling, Chain of Custody & Case Documentation', 270],
  ['soc-11', 'SOC Operations, Metrics, Reporting & Communication', 195],
  ['soc-12', 'SOC Analyst Capstone', 240],
];

const EXPECTED_LABS = [
  ['lab-soc-environment', 'soc-01'],
  ['lab-soc-escalation', 'soc-01'],
  ['lab-identity-investigation', 'soc-02'],
  ['lab-siem-triage', 'soc-03'],
  ['lab-detection-rule', 'soc-04'],
  ['lab-endpoint-investigation', 'soc-05'],
  ['lab-threat-hunt', 'soc-06'],
  ['lab-email-triage', 'soc-07'],
  ['lab-network-investigation', 'soc-07'],
  ['lab-vuln-prioritization', 'soc-08'],
  ['lab-vuln-queue', 'soc-08'],
  ['lab-active-incident', 'soc-09'],
  ['lab-evidence-collection', 'soc-10'],
  ['lab-attack-mapping', 'soc-10'],
  ['lab-exec-report', 'soc-11'],
  ['lab-soc-metrics', 'soc-11'],
  ['lab-capstone', 'soc-12'],
];

const EXPECTED_RUNTIME_IDS = {
  'module-01.js': ['m01-first-soc-alert-v2'],
  'module-02.js': ['m02-trust-path-review-v1'],
  'module-03.js': ['m03-siem-signal-room-v1'],
  'module-04.js': ['m04-detection-enrichment-v1'],
  'module-05.js': ['m05-endpoint-chain-v1'],
  'module-06.js': ['m06-hypothesis-hunt-v1'],
  'module-07.js': ['m07-network-email-investigation-v1'],
  'module-08.js': ['m08-exposure-prioritization-v1', 'm08-vulnerability-queue-v1'],
  'module-09.js': ['m09-proportional-response-v1'],
  'module-10.js': ['m10-evidence-custody-v1', 'm10-forensic-mapping-v1'],
  'module-11.js': ['m11-soc-metrics-v1', 'm11-executive-report-v1'],
  'module-12.js': ['m12-integrated-capstone-v1'],
};

const errors = [];

function fail(message) {
  errors.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function sum(rows, selector) {
  return rows.reduce((total, row) => total + selector(row), 0);
}

function loadCatalogue() {
  const source = fs.readFileSync(DATA_FILE, 'utf8');
  const context = vm.createContext({ console });
  return vm.runInContext(`${source}\n;({ PROGRAMS, LABS });`, context, { filename: DATA_FILE });
}

function validateRequiredFields(record, fields, label) {
  fields.forEach((field) => {
    const value = record[field];
    const present = typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null;
    assert(present, `${label} is missing ${field}`);
  });
}

function validateAllocations(record, duration, knownCodes, label) {
  assert(Array.isArray(record.parentAllocations) && record.parentAllocations.length > 0, `${label} must have parentAllocations`);
  if (!Array.isArray(record.parentAllocations)) return;
  let allocated = 0;
  record.parentAllocations.forEach((entry, index) => {
    assert(entry && typeof entry.code === 'string' && entry.code.trim(), `${label} allocation ${index + 1} is missing code`);
    assert(Number.isInteger(entry && entry.minutes) && entry.minutes > 0, `${label} allocation ${index + 1} must have positive integer minutes`);
    assert(knownCodes.has(entry && entry.code), `${label} allocation ${index + 1} references unknown parent ${entry && entry.code}`);
    allocated += Number(entry && entry.minutes) || 0;
  });
  assert(allocated === duration, `${label} allocations total ${allocated}, expected ${duration}`);
}

function addParentMinutes(rollup, record) {
  record.parentAllocations.forEach((entry) => {
    if (!rollup[entry.code]) rollup[entry.code] = { theory: 0, lab: 0 };
    rollup[entry.code][record.classification] += entry.minutes;
  });
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function escapeCell(value) {
  return String(value === undefined ? '' : value)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function allocationsCell(record) {
  return record.parentAllocations.map((entry) => `${entry.code}: ${entry.minutes}`).join('; ');
}

function generateMap(program, labs) {
  const modules = program.modules;
  const items = Object.values(modules).flatMap((module) => module.curriculumItems.map((item) => ({ ...item, module: module.key })));
  const labByModule = Object.fromEntries(Object.keys(modules).map((key) => [key, labs.filter((lab) => lab.module === key)]));
  const lines = [
    '# Mission Next SOC Curriculum Map',
    '',
    `Revision: ${program.compliance.revision}`,
    '',
    '> Status: developer-mapped and pending curriculum/compliance review. This report does not claim Form 301, catalogue, curriculum, faculty, or compliance approval. The controlling Form 301 and current catalogue are not present in this repository.',
    '',
    'Embedded assessment time is included in each item or lab duration and is not added again.',
    '',
    '## Locked program baseline',
    '',
    '| Property | Value |',
    '|---|---|',
    `| Program | ${escapeCell(program.compliance.programName)} |`,
    `| Credential | ${escapeCell(program.compliance.credential)} |`,
    `| Delivery | ${escapeCell(program.compliance.delivery)} |`,
    `| Duration | ${program.compliance.weeks} weeks |`,
    `| Technical SOC | ${program.compliance.technicalHours} hours |`,
    `| M360 companion | ${program.compliance.careerHours} hours, separately accounted |`,
    `| Total | ${program.compliance.totalHours} hours |`,
    `| Theory / lab | ${program.compliance.theoryHours} / ${program.compliance.labHours} hours |`,
    `| Passing / attendance | ${program.compliance.passingPercent}% / ${program.compliance.attendancePercent}% |`,
    '',
    '## Approved technical parent roll-up',
    '',
    '| Code | Parent | Theory | Lab | Total | Review status |',
    '|---|---|---:|---:|---:|---|',
    ...program.parents.map((parent) => `| ${parent.code} | ${escapeCell(parent.title)} | ${parent.theoryMinutes} | ${parent.labMinutes} | ${parent.theoryMinutes + parent.labMinutes} | ${parent.reviewStatus} |`),
    '',
    'All minute values in this report are instructional minutes.',
    '',
    '## Learner module roll-up',
    '',
    '| Module | Learner-facing label | Theory | Lab | Total | Curriculum items | Labs |',
    '|---|---|---:|---:|---:|---:|---:|',
    ...Object.values(modules).map((module) => {
      const theory = sum(module.curriculumItems, (item) => item.durationMinutes);
      const lab = sum(labByModule[module.key], (item) => item.instructionalMinutes);
      return `| ${module.key} | ${escapeCell(module.title)} | ${theory} | ${lab} | ${theory + lab} | ${module.curriculumItems.length} | ${labByModule[module.key].length} |`;
    }),
    '',
    '## Technical curriculum items',
    '',
    '| Key | Module | Item | Parent allocation | Minutes | Classification | Objective | Evidence | Assessment | Faculty evaluation | Revision |',
    '|---|---|---|---|---:|---|---|---|---|---|---|',
    ...items.map((item) => `| ${item.key} | ${item.module} | ${escapeCell(item.title)} | ${allocationsCell(item)} | ${item.durationMinutes} | ${item.classification} | ${escapeCell(item.objective)} | ${escapeCell(item.evidence)} | ${escapeCell(item.assessmentMethod)} | ${escapeCell(item.facultyEvaluation)} | ${item.revision} |`),
    '',
    '## Performance lab catalogue',
    '',
    '| Key | Module | Lab | Parent allocation | Minutes | Classification | Objective | Evidence | Assessment | Faculty evaluation | Revision |',
    '|---|---|---|---|---:|---|---|---|---|---|---|',
    ...labs.map((lab) => `| ${lab.key} | ${lab.module} | ${escapeCell(lab.title)} | ${allocationsCell(lab)} | ${lab.instructionalMinutes} | ${lab.classification} | ${escapeCell(lab.objective)} | ${escapeCell(lab.evidence)} | ${escapeCell(lab.assessmentMethod)} | ${escapeCell(lab.facultyEvaluation)} | ${lab.revision} |`),
    '',
    `Non-capstone labs: ${labs.filter((lab) => !lab.isCapstone).length}, ${formatMinutes(sum(labs.filter((lab) => !lab.isCapstone), (lab) => lab.instructionalMinutes))}. Capstone: ${formatMinutes(labs.find((lab) => lab.isCapstone).instructionalMinutes)}. Lab total: ${formatMinutes(sum(labs, (lab) => lab.instructionalMinutes))}.`,
    '',
    '## Separate M360-101 companion boundary',
    '',
    `**${escapeCell(program.careerReadiness.title)} — ${program.careerReadiness.hours} hours.**`,
    '',
    `${escapeCell(program.careerReadiness.boundary)} Status: ${program.careerReadiness.status}; curriculum/compliance review: ${program.careerReadiness.curriculumComplianceReview}.`,
    '',
    '| Key | Item | Parent allocation | Minutes | Classification | Objective | Evidence | Assessment | Faculty evaluation | Revision |',
    '|---|---|---|---:|---|---|---|---|---|---|',
    ...program.careerReadiness.items.map((item) => `| ${item.key} | ${escapeCell(item.title)} | ${allocationsCell(item)} | ${item.durationMinutes} | ${item.classification} | ${escapeCell(item.objective)} | ${escapeCell(item.evidence)} | ${escapeCell(item.assessmentMethod)} | ${escapeCell(item.facultyEvaluation)} | ${item.revision} |`),
    '',
    '## Review boundary',
    '',
    '- The technical theory/lab and parent allocations are developer mappings, not approved Form 301 wording or allocations.',
    '- Security+ tags remain empty until a curriculum reviewer supplies a secondary crosswalk.',
    '- Curriculum, compliance, and qualified-faculty review are required before student release.',
    '- Real authenticated persistence, attendance/time evidence, artifacts, feedback, history, and exports remain outside this map and require separate verification.',
    '',
  ];
  return `${lines.join('\n')}\n`;
}

let catalogue;
try {
  catalogue = loadCatalogue();
} catch (error) {
  console.error(`FAIL curriculum-check: could not evaluate portal/data.js\n${error.stack || error.message}`);
  process.exit(1);
}

const { PROGRAMS, LABS } = catalogue;
const program = PROGRAMS.find((entry) => entry.slug === 'soc-analyst');
assert(Boolean(program), 'missing soc-analyst program');

if (program) {
  const compliance = program.compliance || {};
  const exactCompliance = {
    programName: 'Mission Next: Security Operation Center (SOC) Analyst',
    credential: 'Diploma',
    delivery: 'Online / approved distance education',
    weeks: 6,
    technicalHours: 70,
    careerHours: 12,
    totalHours: 82,
    theoryHours: 42,
    labHours: 40,
    passingPercent: 70,
    attendancePercent: 80,
  };
  Object.entries(exactCompliance).forEach(([key, value]) => assert(compliance[key] === value, `compliance.${key} must equal ${value}`));
  assert(compliance.status === 'developer-mapped', 'compliance.status must remain developer-mapped until external approval');
  assert(Array.isArray(compliance.sourceNotes) && compliance.sourceNotes.some((note) => /not present/i.test(note)), 'compliance sourceNotes must disclose missing controlling documents');

  assert(Array.isArray(program.parents) && program.parents.length === 8, 'exactly eight technical parents are required');
  const parentCodes = new Set((program.parents || []).map((parent) => parent.code));
  EXPECTED_PARENTS.forEach(([code, title, hours, theoryMinutes, labMinutes], index) => {
    const parent = program.parents && program.parents[index];
    assert(parent && parent.code === code, `parent ${index + 1} must be ${code}`);
    assert(parent && parent.title === title, `${code} title does not match the locked title`);
    assert(parent && parent.hours === hours, `${code} must declare ${hours} hours`);
    assert(parent && parent.theoryMinutes === theoryMinutes, `${code} theoryMinutes must equal ${theoryMinutes}`);
    assert(parent && parent.labMinutes === labMinutes, `${code} labMinutes must equal ${labMinutes}`);
    assert(parent && parent.reviewStatus === 'developer-mapped', `${code} reviewStatus must remain developer-mapped`);
  });
  assert(sum(program.parents || [], (parent) => parent.hours) === 70, 'technical parent hours must total 70');

  const moduleEntries = Object.entries(program.modules || {});
  assert(program.moduleCount === 12 && moduleEntries.length === 12, 'SOC program must retain 12 modules');
  assert(new Set(moduleEntries.map(([key]) => key)).size === 12, 'module keys must be unique');
  const itemKeys = new Set();
  const labKeys = new Set();
  const parentRollup = {};
  let technicalTheoryMinutes = 0;

  EXPECTED_MODULES.forEach(([key, title, durationMinutes], index) => {
    const module = program.modules && program.modules[key];
    assert(Boolean(module), `missing module ${key}`);
    if (!module) return;
    assert(module.key === key, `${key} stable key changed`);
    assert(module.number === index + 1, `${key} number must remain ${index + 1}`);
    assert(module.title === title, `${key} title must be ${title}`);
    assert(module.durationMinutes === durationMinutes, `${key} durationMinutes must be ${durationMinutes}`);
    assert(!/[–-]\s*\d+\s*Hours/i.test(module.hours), `${key} hours must be exact, not a range`);
    assert(Array.isArray(module.curriculumItems), `${key} must define curriculumItems`);
    const items = Array.isArray(module.curriculumItems) ? module.curriculumItems : [];
    assert(module.lessons === items.length, `${key} lessons count must match curriculumItems (${items.length})`);
    items.forEach((item) => {
      const label = `item ${item.key || '(missing key)'}`;
      validateRequiredFields(item, ['key', 'kind', 'title', 'durationMinutes', 'classification', 'objective', 'learn', 'practice', 'prove', 'evidence', 'assessmentMethod', 'facultyEvaluation', 'revision'], label);
      assert(!itemKeys.has(item.key), `${label} key is duplicated`);
      itemKeys.add(item.key);
      assert(item.classification === 'theory', `${label} must be classified theory`);
      assert(item.kind === 'lesson', `${label} kind must be lesson`);
      assert(Number.isInteger(item.durationMinutes) && item.durationMinutes > 0, `${label} durationMinutes must be a positive integer`);
      assert(Array.isArray(item.securityPlusTags) && item.securityPlusTags.length === 0, `${label} Security+ tags must remain empty pending review`);
      validateAllocations(item, item.durationMinutes, parentCodes, label);
      technicalTheoryMinutes += Number(item.durationMinutes) || 0;
      if (Array.isArray(item.parentAllocations)) addParentMinutes(parentRollup, item);
    });
  });

  assert(Array.isArray(LABS) && LABS.length === 17, 'lab catalogue must contain 16 non-capstone labs plus one capstone');
  EXPECTED_LABS.forEach(([key, moduleKey]) => {
    const lab = LABS.find((entry) => entry.key === key);
    assert(Boolean(lab), `missing stable lab key ${key}`);
    assert(lab && lab.module === moduleKey, `${key} must remain assigned to ${moduleKey}`);
  });

  let technicalLabMinutes = 0;
  (LABS || []).forEach((lab) => {
    const label = `lab ${lab.key || '(missing key)'}`;
    validateRequiredFields(lab, ['key', 'kind', 'module', 'title', 'instructionalMinutes', 'classification', 'objective', 'startingState', 'task', 'successCondition', 'escalationCondition', 'evidence', 'assessmentMethod', 'facultyEvaluation', 'revision'], label);
    assert(!labKeys.has(lab.key), `${label} key is duplicated`);
    labKeys.add(lab.key);
    assert(program.modules[lab.module], `${label} references unknown module ${lab.module}`);
    assert(lab.classification === 'lab', `${label} must be classified lab`);
    assert(Number.isInteger(lab.instructionalMinutes) && lab.instructionalMinutes > 0, `${label} instructionalMinutes must be a positive integer`);
    assert(lab.minutes === lab.instructionalMinutes, `${label} legacy minutes must equal instructionalMinutes`);
    assert(Array.isArray(lab.securityPlusTags) && lab.securityPlusTags.length === 0, `${label} Security+ tags must remain empty pending review`);
    validateAllocations(lab, lab.instructionalMinutes, parentCodes, label);
    technicalLabMinutes += Number(lab.instructionalMinutes) || 0;
    if (Array.isArray(lab.parentAllocations)) addParentMinutes(parentRollup, lab);

    const moduleNumber = String(program.modules[lab.module] && program.modules[lab.module].number).padStart(2, '0');
    const moduleFile = path.join(ROOT, 'portal', `module-${moduleNumber}.js`);
    assert(fs.existsSync(moduleFile), `${label} module file is missing`);
    if (fs.existsSync(moduleFile)) {
      const moduleSource = fs.readFileSync(moduleFile, 'utf8');
      assert(moduleSource.includes(`'${lab.key}'`), `${label} is not reconciled to its module completion source`);
      assert(moduleSource.includes('recordLabAttempt'), `${label} module has no attempt write`);
      assert(moduleSource.includes('markModuleLabComplete'), `${label} module has no completion write`);
    }
  });

  Object.entries(program.modules || {}).forEach(([moduleKey, module]) => {
    const moduleLabs = LABS.filter((lab) => lab.module === moduleKey);
    const theoryMinutes = sum(module.curriculumItems || [], (item) => item.durationMinutes);
    const labMinutes = sum(moduleLabs, (lab) => lab.instructionalMinutes);
    assert(module.labs === moduleLabs.length, `${moduleKey} labs count must match catalogue (${moduleLabs.length})`);
    assert(module.durationMinutes === theoryMinutes + labMinutes, `${moduleKey} duration ${module.durationMinutes} does not reconcile to ${theoryMinutes} theory + ${labMinutes} lab`);
  });

  Object.entries(EXPECTED_RUNTIME_IDS).forEach(([fileName, ids]) => {
    const source = fs.readFileSync(path.join(ROOT, 'portal', fileName), 'utf8');
    ids.forEach((id) => assert(source.includes(`'${id}'`), `stable runtime ID ${id} is missing from ${fileName}`));
  });

  EXPECTED_PARENTS.forEach(([code, , hours, theoryMinutes, labMinutes]) => {
    const actual = parentRollup[code] || { theory: 0, lab: 0 };
    assert(actual.theory === theoryMinutes, `${code} mapped theory is ${actual.theory}, expected ${theoryMinutes}`);
    assert(actual.lab === labMinutes, `${code} mapped lab is ${actual.lab}, expected ${labMinutes}`);
    assert(actual.theory + actual.lab === hours * 60, `${code} mapped total must equal ${hours * 60} minutes`);
  });

  const nonCapstoneLabs = LABS.filter((lab) => !lab.isCapstone);
  const capstones = LABS.filter((lab) => lab.isCapstone);
  assert(nonCapstoneLabs.length === 16, 'exactly 16 non-capstone labs are required');
  assert(capstones.length === 1, 'exactly one capstone lab is required');
  const capstone = capstones[0];
  assert(capstone && capstone.key === 'lab-capstone', 'capstone stable lab key must be lab-capstone');
  assert(capstone && capstone.kind === 'capstone', 'capstone kind must be capstone');
  assert(capstone && capstone.instructionalMinutes === 240, 'capstone must be exactly 240 minutes');
  assert(capstone && capstone.parentAllocations.length === 1 && capstone.parentAllocations[0].code === 'SOC-101.8' && capstone.parentAllocations[0].minutes === 240, 'capstone must allocate exactly 240 minutes to SOC-101.8');
  assert(sum(nonCapstoneLabs, (lab) => lab.instructionalMinutes) === 2160, '16 non-capstone labs must total 2,160 minutes');
  assert(technicalTheoryMinutes === 1800, `technical theory must total 1,800 minutes, found ${technicalTheoryMinutes}`);
  assert(technicalLabMinutes === 2400, `technical labs must total 2,400 minutes, found ${technicalLabMinutes}`);
  assert(technicalTheoryMinutes + technicalLabMinutes === 4200, 'technical curriculum must total 70 hours');

  const m360 = program.careerReadiness || {};
  assert(m360.code === 'M360-101', 'M360 companion code must be M360-101');
  assert(m360.durationMinutes === 720 && m360.hours === 12, 'M360 companion must total 720 minutes / 12 hours');
  assert(m360.classification === 'theory', 'M360 must be classified theory for the overall 42-hour theory roll-up');
  assert(m360.status === 'developer-mapped' && m360.curriculumComplianceReview === 'pending', 'M360 must remain developer-mapped and pending review');
  assert(typeof m360.boundary === 'string' && /separate companion/i.test(m360.boundary), 'M360 must state its separate companion boundary');
  assert(typeof m360.progressNamespace === 'string' && m360.progressNamespace && !/soc/i.test(m360.progressNamespace), 'M360 must have a separate progress namespace');
  assert(Array.isArray(m360.items) && m360.items.length === 8, 'M360 must contain the eight source-named curriculum areas');
  const careerKeys = new Set();
  let careerMinutes = 0;
  (m360.items || []).forEach((item) => {
    const label = `M360 item ${item.key || '(missing key)'}`;
    validateRequiredFields(item, ['key', 'kind', 'title', 'durationMinutes', 'classification', 'objective', 'learn', 'practice', 'prove', 'evidence', 'assessmentMethod', 'facultyEvaluation', 'revision'], label);
    assert(!itemKeys.has(item.key) && !careerKeys.has(item.key), `${label} key is duplicated`);
    careerKeys.add(item.key);
    assert(item.kind === 'career-readiness' && item.classification === 'theory', `${label} must remain separate career-readiness theory`);
    assert(Array.isArray(item.securityPlusTags) && item.securityPlusTags.length === 0, `${label} Security+ tags must remain empty pending review`);
    validateAllocations(item, item.durationMinutes, new Set(['M360-101']), label);
    careerMinutes += Number(item.durationMinutes) || 0;
  });
  assert(careerMinutes === 720, `M360 items must total 720 minutes, found ${careerMinutes}`);
  assert(technicalTheoryMinutes + careerMinutes === 2520, 'overall theory must total 42 hours');
  assert(technicalLabMinutes === 2400, 'overall lab must total 40 hours');
  assert(technicalTheoryMinutes + technicalLabMinutes + careerMinutes === 4920, '70 technical + 12 M360 must equal 82 hours');

  const markdown = generateMap(program, LABS);
  if (WRITE_MAP && errors.length === 0) {
    fs.writeFileSync(MAP_FILE, markdown, 'utf8');
  } else if (!WRITE_MAP) {
    assert(fs.existsSync(MAP_FILE), 'CURRICULUM_MAP.md is missing; run node bin/curriculum-check.js --write-map');
    if (fs.existsSync(MAP_FILE)) assert(fs.readFileSync(MAP_FILE, 'utf8') === markdown, 'CURRICULUM_MAP.md is stale; regenerate with --write-map');
  }

  if (errors.length === 0) {
    console.log('PASS curriculum-check');
    console.log(`technical: ${technicalTheoryMinutes / 60} theory + ${technicalLabMinutes / 60} lab = ${(technicalTheoryMinutes + technicalLabMinutes) / 60} hours`);
    console.log(`M360: ${careerMinutes / 60} theory hours (separate companion)`);
    console.log(`program: ${(technicalTheoryMinutes + careerMinutes) / 60} theory + ${technicalLabMinutes / 60} lab = ${(technicalTheoryMinutes + technicalLabMinutes + careerMinutes) / 60} hours`);
    console.log(`parents: ${program.parents.map((parent) => `${parent.code}=${parent.hours}h`).join(', ')}`);
    console.log(`labs: ${nonCapstoneLabs.length} non-capstone + ${capstones.length} capstone (${capstone.instructionalMinutes} min) = ${technicalLabMinutes / 60} hours`);
    console.log(`map: ${WRITE_MAP ? 'generated' : 'current'} ${path.relative(ROOT, MAP_FILE)}`);
  }
}

if (errors.length > 0) {
  console.error(`FAIL curriculum-check (${errors.length} error${errors.length === 1 ? '' : 's'})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
