#!/usr/bin/env node
'use strict';

/* Help Desk (IT Help Desk & Career Accelerator) curriculum check. Reads only
 * the it-support program and its labs from portal/data.js, plus the Help
 * Desk module pages, and fails CI when:
 *   (a) technical theory + lab minutes across ITHD-101.1 .. 101.9 are not 3,600;
 *   (b) an ITHD parent's theory + lab minutes are not its hours x 60;
 *   (c) the minutes the modules allocate to a parent don't add up to it;
 *   (d) a module page shows a lesson duration other than the approved
 *       hour mapping's lesson total (lesson + its lab share);
 *   (e) a Help Desk file names "Windows Server" with a year;
 *   (f) a Prove It ticket, computer or KB article (HD_PROVE_SHIFTS in
 *       ui/helpdesk-data.js) appears in Practice: the Practice shift's
 *       fixtures, a coach lab or the capstone;
 *   (g) a Prove It shift's committed fixtures carry answer fields (the
 *       repository is public; the answer key lives outside it). */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'portal', 'data.js');
const PREFIX = 'Help Desk curriculum check:';

const EXPECTED_TECHNICAL_MINUTES = 3600;

// The approved ITHD-101 parent hours, from the same mapping.
const EXPECTED_PARENTS = [
  ['ITHD-101.1', 'Program Orientation, LMS Navigation, Technology Setup, IT Support Role Overview', 3, 120, 60],
  ['ITHD-101.2', 'IT Ticket Lifecycle, Help Desk Workflow, Documentation, Escalation Procedures', 7, 270, 150],
  ['ITHD-101.3', 'Virtualization Fundamentals & Lab Setup (Oracle VirtualBox)', 8, 300, 180],
  ['ITHD-101.4', 'Windows Client OS Support & Endpoint Troubleshooting', 8, 330, 150],
  ['ITHD-101.5', 'Windows Server Administration Fundamentals', 8, 315, 165],
  ['ITHD-101.6', 'Active Directory Users, Groups, Permissions, Identity Management', 10, 375, 225],
  ['ITHD-101.7', 'Networking Fundamentals, DNS, DHCP, Connectivity Testing, Domain Joining', 8, 300, 180],
  ['ITHD-101.8', 'Remote Support Tools, Security Awareness, Troubleshooting Methodology', 4, 180, 60],
  ['ITHD-101.9', 'Capstone: Simulated Help Desk Support Scenario & KB Documentation', 4, 30, 210],
];

const EXPECTED_COMPLIANCE = {
  credential: 'Diploma',
  technicalHours: 60,
  careerHours: 12,
  totalHours: 72,
  theoryHours: 37,
  technicalTheoryHours: 37,
  labHours: 23,
};

// Each lesson's total from MNT_HelpDesk_Parent_Course_Hour_Mapping_ALL_12_MODULES.docx:
// the lesson's theory minutes plus its share of the module's lab minutes.
const EXPECTED_LESSON_MINUTES = {
  'its-01': [90, 90],
  'its-02': [240, 240, 90, 90],
  'its-03': [90, 90],
  'its-04': [120, 120, 120, 120],
  'its-05': [180, 180, 120, 240],
  'its-06': [120, 120, 120],
  'its-07': [60, 60],
  'its-08': [60, 60],
  'its-09': [60, 60],
  'its-10': [90, 120],
  'its-11': [90, 120],
  'its-12': [240],
};

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(`${PREFIX} ${message}`);
}

function sum(rows, selector) {
  return rows.reduce((total, row) => total + selector(row), 0);
}

function loadHelpDesk() {
  const source = fs.readFileSync(DATA_FILE, 'utf8');
  const context = vm.createContext({ console });
  const { PROGRAMS, LABS } = vm.runInContext(`${source}\n;({ PROGRAMS, LABS });`, context, { filename: DATA_FILE });
  const program = PROGRAMS.find((entry) => entry.slug === 'it-support');
  const moduleKeys = program ? Object.keys(EXPECTED_LESSON_MINUTES) : [];
  return { program, labs: LABS.filter((lab) => moduleKeys.includes(lab.module)) };
}

// Lessons on a module page are `title: '...', minutes: N` entries, in order.
function moduleFileLessons(fileName) {
  const source = fs.readFileSync(path.join(ROOT, 'portal', fileName), 'utf8');
  const pattern = /title:\s*'((?:[^'\\]|\\.)*)',\s*minutes:\s*(\d+)/g;
  const lessons = [];
  let match;
  while ((match = pattern.exec(source))) {
    lessons.push({ title: match[1].replace(/\\'/g, "'"), minutes: Number(match[2]) });
  }
  return lessons;
}

function helpDeskFiles() {
  const portal = fs.readdirSync(path.join(ROOT, 'portal'))
    .filter((name) => /^it-support-.*\.(js|css)$/.test(name))
    .map((name) => path.join('portal', name));
  const ui = fs.readdirSync(path.join(ROOT, 'ui'))
    .filter((name) => /^helpdesk.*\.js$/.test(name))
    .map((name) => path.join('ui', name));
  return [...portal, path.join('portal', 'admin-sheets', 'hdesk.js'), ...ui];
}

const SERVER_YEAR = /Windows Server\s+(?:19|20)\d{2}/i;

function loadSimulatorData() {
  const file = path.join(ROOT, 'ui', 'helpdesk-data.js');
  const context = vm.createContext({ console });
  return vm.runInContext(`${fs.readFileSync(file, 'utf8')}\n;({ HD_TICKET_TEMPLATES, HD_COMPUTERS, HD_KB_ARTICLES, HD_PROVE_SHIFTS: typeof HD_PROVE_SHIFTS === 'undefined' ? {} : HD_PROVE_SHIFTS });`, context, { filename: file });
}

// Field names that would hold an answer.
const ANSWER_FIELD = /expected|correct|hidden|critical|credit|flag|answer|model|rootcause|escalationcriteria|plausible/i;
function answerFields(value, trail = []) {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...(Array.isArray(value) || !ANSWER_FIELD.test(key) ? [] : [[...trail, key].join('.')]),
    ...answerFields(child, [...trail, key]),
  ]);
}

let helpDesk;
try {
  helpDesk = loadHelpDesk();
} catch (error) {
  console.error(`${PREFIX} could not evaluate portal/data.js\n${error.stack || error.message}`);
  process.exit(1);
}

const { program, labs } = helpDesk;
assert(Boolean(program), 'missing the it-support program in portal/data.js');

if (program) {
  const compliance = program.compliance || {};
  Object.entries(EXPECTED_COMPLIANCE).forEach(([key, value]) => {
    assert(compliance[key] === value, `compliance.${key} is ${JSON.stringify(compliance[key])}, expected ${JSON.stringify(value)}`);
  });

  const parents = program.parents || [];
  const parentCodes = new Set(parents.map((parent) => parent.code));
  assert(parents.length === EXPECTED_PARENTS.length, `expected ${EXPECTED_PARENTS.length} ITHD parents, found ${parents.length}`);
  EXPECTED_PARENTS.forEach(([code, title, hours, theory, lab], index) => {
    const parent = parents[index] || {};
    assert(parent.code === code, `parent ${index + 1} is ${parent.code}, expected ${code}`);
    assert(parent.title === title, `${code} title is "${parent.title}", expected "${title}"`);
    assert(parent.hours === hours, `${code} hours is ${parent.hours}, expected ${hours}`);
    assert(parent.theoryMinutes === theory, `${code} theoryMinutes is ${parent.theoryMinutes}, expected ${theory}`);
    assert(parent.labMinutes === lab, `${code} labMinutes is ${parent.labMinutes}, expected ${lab}`);
  });

  // (b) each parent's own theory + lab equals its hours.
  parents.forEach((parent) => {
    assert(parent.theoryMinutes + parent.labMinutes === parent.hours * 60,
      `${parent.code} theory ${parent.theoryMinutes} + lab ${parent.labMinutes} = ${parent.theoryMinutes + parent.labMinutes}, expected ${parent.hours} hours (${parent.hours * 60} minutes)`);
  });

  // (c) what the modules allocate to each parent.
  const rollup = {};
  let theoryMinutes = 0;
  let labMinutes = 0;
  function allocate(record, classification, minutes, label) {
    const allocations = record.parentAllocations || [];
    assert(allocations.length > 0, `${label} has no parentAllocations`);
    const allocated = sum(allocations, (entry) => Number(entry.minutes) || 0);
    assert(allocated === minutes, `${label} allocates ${allocated} minutes, expected its ${minutes}`);
    allocations.forEach((entry) => {
      assert(parentCodes.has(entry.code), `${label} allocates to unknown parent ${entry.code}`);
      if (!rollup[entry.code]) rollup[entry.code] = { theory: 0, lab: 0 };
      rollup[entry.code][classification] += Number(entry.minutes) || 0;
    });
  }

  Object.keys(EXPECTED_LESSON_MINUTES).forEach((moduleKey) => {
    const module = program.modules && program.modules[moduleKey];
    assert(Boolean(module), `missing module ${moduleKey}`);
    if (!module) return;
    const items = module.curriculumItems || [];
    const moduleLabs = labs.filter((lab) => lab.module === moduleKey);
    items.forEach((item) => allocate(item, 'theory', item.durationMinutes, `lesson ${item.key}`));
    moduleLabs.forEach((lab) => allocate(lab, 'lab', lab.instructionalMinutes, `lab ${lab.key}`));
    const moduleTheory = sum(items, (item) => item.durationMinutes);
    const moduleLab = sum(moduleLabs, (lab) => lab.instructionalMinutes);
    theoryMinutes += moduleTheory;
    labMinutes += moduleLab;
    assert(module.durationMinutes === moduleTheory + moduleLab,
      `${moduleKey} durationMinutes is ${module.durationMinutes}, but its lessons (${moduleTheory}) + labs (${moduleLab}) = ${moduleTheory + moduleLab}`);
  });

  parents.forEach((parent) => {
    const mapped = rollup[parent.code] || { theory: 0, lab: 0 };
    assert(mapped.theory === parent.theoryMinutes, `${parent.code} modules allocate ${mapped.theory} theory minutes, expected ${parent.theoryMinutes}`);
    assert(mapped.lab === parent.labMinutes, `${parent.code} modules allocate ${mapped.lab} lab minutes, expected ${parent.labMinutes}`);
  });

  // (a) the technical total.
  const parentTotal = sum(parents, (parent) => parent.theoryMinutes + parent.labMinutes);
  assert(parentTotal === EXPECTED_TECHNICAL_MINUTES, `ITHD parents total ${parentTotal} minutes, expected ${EXPECTED_TECHNICAL_MINUTES}`);
  assert(theoryMinutes + labMinutes === EXPECTED_TECHNICAL_MINUTES,
    `modules total ${theoryMinutes} theory + ${labMinutes} lab = ${theoryMinutes + labMinutes} minutes, expected ${EXPECTED_TECHNICAL_MINUTES}`);
  assert(theoryMinutes === compliance.theoryHours * 60, `technical theory is ${theoryMinutes} minutes, but compliance.theoryHours says ${compliance.theoryHours} hours`);
  assert(labMinutes === compliance.labHours * 60, `lab is ${labMinutes} minutes, but compliance.labHours says ${compliance.labHours} hours`);

  // (d) module pages show the mapping's lesson totals.
  Object.entries(EXPECTED_LESSON_MINUTES).forEach(([moduleKey, expected]) => {
    const module = program.modules[moduleKey];
    if (!module) return;
    assert(sum(expected, (minutes) => minutes) === module.durationMinutes,
      `${moduleKey} mapping lesson totals add up to ${sum(expected, (minutes) => minutes)}, expected the module's ${module.durationMinutes}`);
    const items = module.curriculumItems || [];
    assert(items.length === expected.length, `${moduleKey} has ${items.length} lessons in portal/data.js, expected ${expected.length}`);
    const fileName = `it-support-module-${moduleKey.slice(-2)}.js`;
    const pageLessons = moduleFileLessons(fileName);
    assert(pageLessons.length === expected.length, `portal/${fileName} has ${pageLessons.length} lessons, expected ${expected.length}`);
    expected.forEach((minutes, index) => {
      const page = pageLessons[index];
      const item = items[index];
      if (!page) return;
      assert(!item || page.title === item.title, `portal/${fileName} lesson ${index + 1} is "${page.title}", but portal/data.js lesson ${index + 1} is "${item && item.title}"`);
      assert(page.minutes === minutes, `portal/${fileName} lesson ${index + 1} ("${page.title}") shows ${page.minutes} minutes, expected ${minutes}`);
    });
  });

  // (e) "Windows Server" with no year, in Help Desk files and Help Desk data.
  helpDeskFiles().forEach((relative) => {
    const lines = fs.readFileSync(path.join(ROOT, relative), 'utf8').split('\n');
    lines.forEach((line, index) => {
      assert(!SERVER_YEAR.test(line), `${relative}:${index + 1} names Windows Server with a year; use "Windows Server"`);
    });
  });
  const dataText = JSON.stringify({ program, labs });
  const dataMatch = dataText.match(SERVER_YEAR);
  assert(!dataMatch, `portal/data.js Help Desk entries name "${dataMatch && dataMatch[0]}"; use "Windows Server"`);

  // (f) Prove It material never appears in Practice, and (g) carries no answers.
  let sim = null;
  try {
    sim = loadSimulatorData();
  } catch (error) {
    assert(false, `could not evaluate ui/helpdesk-data.js: ${error.message}`);
  }
  if (sim) {
    const practiceIds = new Set(sim.HD_TICKET_TEMPLATES.map((ticket) => ticket.id));
    const practiceComputers = new Set(sim.HD_COMPUTERS.map((computer) => computer.name));
    const practiceKb = new Set(sim.HD_KB_ARTICLES.map((article) => article.id));
    const practiceFiles = ['ui/helpdesk-coaches.js', 'portal/it-support-module-12.js']
      .map((relative) => [relative, fs.readFileSync(path.join(ROOT, relative), 'utf8')]);
    Object.entries(sim.HD_PROVE_SHIFTS).forEach(([moduleKey, shift]) => {
      (shift.tickets || []).forEach((ticket) => {
        assert(!practiceIds.has(ticket.id), `${ticket.id} (the ${moduleKey} Prove It) is also a Practice ticket in HD_TICKET_TEMPLATES`);
        practiceFiles.forEach(([relative, source]) => {
          assert(!source.includes(ticket.id), `${ticket.id} (the ${moduleKey} Prove It) appears in ${relative}`);
        });
      });
      (shift.computers || []).forEach((computer) => {
        assert(!practiceComputers.has(computer.name), `${computer.name} (the ${moduleKey} Prove shift) is also in the Practice HD_COMPUTERS`);
      });
      (shift.kbArticles || []).forEach((article) => {
        assert(!practiceKb.has(article.id), `${article.id} (the ${moduleKey} Prove shift) is also in the Practice HD_KB_ARTICLES`);
      });
      answerFields(shift).forEach((field) => {
        assert(false, `HD_PROVE_SHIFTS['${moduleKey}'].${field} looks like an answer field; keep the answer key out of the repository`);
      });
    });
  }

  if (errors.length === 0) {
    console.log(`PASS ${PREFIX} ${theoryMinutes} theory + ${labMinutes} lab = ${theoryMinutes + labMinutes} technical minutes`);
    console.log(`parents: ${parents.map((parent) => `${parent.code}=${parent.hours}h`).join(', ')}`);
    console.log('module pages: every lesson matches the hour mapping totals');
    console.log(`Prove It shifts: ${Object.keys(sim ? sim.HD_PROVE_SHIFTS : {}).join(', ') || 'none'} kept out of Practice, no answer fields`);
    console.log('SKIPPED program page Curriculum Blocks: they show theory-only minutes until the program page can show lesson totals');
  }
}

if (errors.length > 0) {
  console.error(`FAIL ${PREFIX} ${errors.length} error${errors.length === 1 ? '' : 's'}`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
