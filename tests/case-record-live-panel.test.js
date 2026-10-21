// UAT 2026-10-21 B16: typing in the ticket notes refreshes the "Not ready to submit yet" list.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadPortal } = require('./portal-vm');

const ctx = loadPortal();
const panelHtml = (missing) => vm.runInContext('caseRecordPanel', ctx)({ panelId: 'p1', missing, showMissing: true });

// Minimal DOM: one live panel, template parsing of .m01-score-empty[id].
const live = { id: 'p1', outerHTML: panelHtml(['Write an analyst work note']), replaced: null, replaceWith(n) { this.replaced = n; this.outerHTML = n.outerHTML; } };
const fakeDoc = {
  createElement: () => ({ set innerHTML(h) { this.content = { querySelectorAll: () => (h.includes('id="p1"') ? [{ id: 'p1', outerHTML: h.trim() }] : []) }; } }),
  getElementById: (id) => (id === 'p1' ? live : null),
};
ctx.document = fakeDoc;
const refresh = vm.runInContext('caseRecordRefreshPanel', ctx);

refresh(panelHtml([]));
assert.ok(live.replaced, 'panel replaced when markup changed');
assert.ok(!live.outerHTML.includes('Write an analyst work note'), 'stale missing item gone');
const before = live.replaced; live.replaced = null;
refresh(panelHtml([]));
assert.equal(live.replaced, null, 'unchanged panel is left alone');
refresh('');
refresh('<div id="other"></div>');

// Every SOC Prove It notes handler refreshes the panel.
const need = { '02-environment': 'practiceTicketPane', '03-environment': 'm03eCaseRecordView', '04': 'moduleFourArtifact', '05': 'moduleFiveCaseTicket', '06': 'moduleSixCaseTicket', '07': 'moduleSevenCaseTicket', '08': 'moduleEightCaseTicket', '09': 'moduleNineArtifact', '10': 'moduleTenCaseTicket', '12': 'moduleTwelveTicketView', '01': 'moduleOneProveItSubmissionPanel' };
for (const [mod, fn] of Object.entries(need)) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'portal', `soc-analyst-module-${mod}.js`), 'utf8');
  assert.ok(src.includes(`caseRecordRefreshPanel(`) && src.includes(fn), `M${mod} refreshes the panel`);
  assert.match(src, new RegExp(`caseRecordRefreshPanel\\([^\\n]*${fn}\\(`), `M${mod} passes ${fn}()`);
}
console.log('case-record live panel tests passed');
