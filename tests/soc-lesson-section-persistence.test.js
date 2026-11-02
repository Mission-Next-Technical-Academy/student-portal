#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const portal = path.join(__dirname, '..', 'portal');
const read = (file) => fs.readFileSync(path.join(portal, file), 'utf8');
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

// U15: Check and Save replace only their M05 lesson. Keep that lesson open,
// including when the Save action marks it complete.
const m05Source = read('soc-analyst-module-05.js');
const m05Markup = m05Source.slice(m05Source.indexOf('function moduleFiveLessonLoop('), m05Source.indexOf('\nfunction moduleFiveLessonGrid('));
const m05Wire = m05Source.slice(m05Source.indexOf('function wireModuleFiveLessons('), m05Source.indexOf('\nfunction wireModuleFiveGuidedLab('));
const lesson = { id: 'lesson-2', title: 'Second lesson', questions: [{ options: [{ correct: true, text: 'Right' }] }] };
const m05State = { lessonWork: { 'lesson-2': { answers: { 0: 0 }, task: 'A sufficiently detailed analyst response.', checked: false, taskComplete: false, feedback: [] } } };
const m05Handlers = {};
const m05Root = { addEventListener: (type, handler) => { m05Handlers[type] = handler; } };
const m05Context = vm.createContext({
  esc, moduleFiveState: m05State, MODULE_FIVE_LESSON_LOOPS: [lesson], moduleFiveSave() {},
  document: { getElementById: () => m05Root },
});
vm.runInContext(`${m05Markup}\n${m05Wire}`, m05Context);
vm.runInContext('wireModuleFiveLessons()', m05Context);
let replacedMarkup = '';
const openLessonDetails = { open: true, set outerHTML(value) { replacedMarkup = value; } };
const checkButton = { dataset: { m05LessonCheck: 'lesson-2' }, closest: () => openLessonDetails };
m05Handlers.click({ target: { closest: (selector) => selector === '[data-m05-lesson-check]' ? checkButton : null } });
assert.match(replacedMarkup, /^<details[^>]*\bopen\b/, 'M05 Check keeps the lesson containing the button open');

m05State.lessonWork['lesson-2'].checked = true;
const saveButton = { dataset: { m05LessonTaskSubmit: 'lesson-2' }, closest: () => openLessonDetails };
m05Handlers.click({ target: { closest: (selector) => selector === '[data-m05-lesson-task-submit]' ? saveButton : null } });
assert.match(replacedMarkup, /^<details[^>]*\bopen\b/, 'M05 Save keeps the lesson open after it becomes complete');

// U21: M06 re-renders the lesson list after answers and task completion. The
// list renderer now opens the lesson whose control triggered that refresh.
const m06Source = read('soc-analyst-module-06.js');
const loopStart = m06Source.indexOf('function moduleSixLessonLoops(');
const loopEnd = m06Source.indexOf('\nfunction moduleSixQuizQuestion(', loopStart);
const m06Markup = m06Source.slice(loopStart, loopEnd);
const m06Wire = m06Source.slice(m06Source.indexOf('function wireModuleSix(user, program)'), m06Source.indexOf('\nregisterModuleLab({ program: \'soc-analyst\', moduleNumber: 6', m06Source.indexOf('function wireModuleSix(user, program)')));
const m06Context = vm.createContext({
  esc,
  MODULE_SIX_LESSONS: [
    { number: 1, title: 'First', questions: [], task: 'Task one', scenario: 'Scenario', theory: 'Theory' },
    { number: 2, title: 'Second', questions: [], task: 'Task two', scenario: 'Scenario', theory: 'Theory' },
  ],
  moduleSixLessonWork: () => ({}), moduleSixLessonComplete: () => false,
});
vm.runInContext(m06Markup, m06Context);
const m06Html = vm.runInContext('moduleSixLessonLoops(2)', m06Context);
assert.match(m06Html, /<details[^>]*open[^>]*data-m06-lesson="2"/, 'M06 opens the active lesson after its answer is saved');
vm.runInContext('globalThis.m06Replaced = ""; moduleSixReplaceLessonLoops({ set outerHTML(value) { globalThis.m06Replaced = value; } }, 2)', m06Context);
assert.match(m06Context.m06Replaced, /<details[^>]*open[^>]*data-m06-lesson="2"/,
  'M06 replaces the lesson list while preserving the active section');
assert.match(m06Source, /moduleSixReplaceLessonLoops\(shell\.querySelector\('#m06-lessons'\), number\)/,
  'M06 answer and completion handlers render the lesson that received the action');
assert.equal((m06Source.match(/moduleSixReplaceLessonLoops\(shell\.querySelector\('#m06-lessons'\), number\)/g) || []).length, 2,
  'both M06 answer and task completion preserve their active lesson');

// U26: the M07 email pack re-renders after evidence/review actions. Open raw
// header and artifact sections are restored on their corresponding message.
const { loadPortal } = require('./portal-vm');
const app = loadPortal();
const integration = vm.runInContext(`({ fixture: SocM07AssessmentData, stateApi: SocM07AssessmentState,
  actions: SocM07AssessmentActions, pack: SocConsoleTools.PACKS.m07 })`, app);
let emailArticle = { dataset: { m07MessageId: 'M07-MSG-001' }, sections: [{ open: false }, { open: true }],
  querySelectorAll(selector) { return selector === 'details' ? this.sections : []; } };
const root = {
  handlers: {},
  addEventListener(type, handler) { this.handlers[type] = handler; },
  querySelectorAll(selector) { return selector === '[data-m07-message-id]' ? [emailArticle] : []; },
};
let state = integration.stateApi.normalize({}, integration.fixture);
integration.pack.wire(root, {
  fixture: integration.fixture,
  box: { get state() { return state; }, set state(value) { state = value; } },
  ui: {}, store() {},
  rerender() {
    emailArticle = { dataset: { m07MessageId: 'M07-MSG-001' }, sections: [{ open: false }, { open: false }],
      querySelectorAll(selector) { return selector === 'details' ? this.sections : []; } };
  },
});
const evidenceButton = { getAttribute: () => 'M07-REDIRECT-001' };
root.handlers.click({ target: { closest: (selector) => selector === '[data-m07-evidence-toggle]' ? evidenceButton : null } });
assert.equal(emailArticle.sections[0].open, false, 'unopened raw headers remain closed');
assert.equal(emailArticle.sections[1].open, true, 'the open URL and attachment section stays open after recording evidence');

console.log('M05, M06 and M07 active sections remain open through their action-driven rerenders.');
