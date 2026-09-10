/* Shared SOC Analyst evidence-recall activity.
 *
 * Module 01 already has the fuller, sequential timeline version of this
 * exercise. Modules 02–12 use this compact companion practice so students
 * encounter the same evidence-first, fill-in-the-blank habit throughout the
 * course. It is browser-local formative practice: it neither adds minutes nor
 * changes a module's lab, quiz, or capstone completion contract.
 */

const SOC_EVIDENCE_RECALL = {
  2: { title: 'Confirm the identity context', lead: 'Record the two details that make the sign-in worth a scoped review.', prompt: 'The account was {{acct-317}} and the successful session used an {{unmanaged}} browser.', blanks: [{ answer: 'acct-317', hint: 'account label' }, { answer: 'unmanaged', hint: 'device context' }], takeaway: 'A successful sign-in is not proof of authorization; compare identity, device, route, and policy context.' },
  3: { title: 'Link the observations', lead: 'Capture the shared pivot before you decide whether a low-and-slow pattern is meaningful.', prompt: 'The identity, mailbox, and cloud records all point to {{acct-428}} through the same {{session}} family.', blanks: [{ answer: 'acct-428', hint: 'account label' }, { answer: 'session', hint: 'correlation pivot' }], takeaway: 'Correlation strengthens a finding when independent sources agree without losing their original context.' },
  4: { title: 'Tune from evidence', lead: 'Write down the control decision before changing a noisy detection.', prompt: 'The test case is {{INC-4404}}; automate only the {{bounded}} action that the evidence and authority support.', blanks: [{ answer: 'inc-4404', hint: 'case identifier' }, { answer: 'bounded', hint: 'scope principle' }], takeaway: 'Tune for signal quality and automate only reversible, authorized actions with clear guardrails.' },
  5: { title: 'Preserve the execution chain', lead: 'Complete the endpoint fact before choosing a containment recommendation.', prompt: 'The delivery chain led to {{PowerShell}} execution and a {{persistence}} mechanism that needs preservation.', blanks: [{ answer: 'powershell', hint: 'execution tool' }, { answer: 'persistence', hint: 'investigation concern' }], takeaway: 'Process ancestry and persistence evidence describe observed behavior; they do not justify guessing at unobserved impact.' },
  6: { title: 'State the hunt pivot', lead: 'Make the dormant-backdoor hypothesis reproducible for the next analyst.', prompt: 'The suspicious task runs on {{ws-318}} and launches from a {{user-writable}} folder.', blanks: [{ answer: 'ws-318', hint: 'device label' }, { answer: 'user-writable', hint: 'path risk' }], takeaway: 'A useful hunt names behavior, entities, time window, and evidence that could weaken the hypothesis.' },
  7: { title: 'Connect the email and DNS clues', lead: 'Capture the message and network pivots without treating either as a verdict alone.', prompt: 'The QR-phishing case used {{invoice-qr.example}} and was correlated to {{WS-517}}.', blanks: [{ answer: 'invoice-qr.example', hint: 'fictional domain' }, { answer: 'ws-517', hint: 'device label' }], takeaway: 'Message authentication, recipient action, DNS, and endpoint context together support a bounded conclusion.' },
  8: { title: 'Prioritize the exposed path', lead: 'Record the context that changes urgency beyond a base severity score.', prompt: 'The finding is {{internet-facing}} and has {{known-exploited}} context, so it needs prompt owner validation.', blanks: [{ answer: 'internet-facing', hint: 'reachability' }, { answer: 'known-exploited', hint: 'exploit context' }], takeaway: 'Prioritization weighs reachability, exploitability, impact, controls, and ownership—not CVSS alone.' },
  9: { title: 'Bound the active response', lead: 'Write the confirmed scope before requesting containment actions.', prompt: 'Operation Cedar Lock is {{INC-4937}}; encryption is observed on {{ws-173}}.', blanks: [{ answer: 'inc-4937', hint: 'incident ID' }, { answer: 'ws-173', hint: 'affected device' }], takeaway: 'Contain active harm with authorized, proportionate actions while preserving the evidence needed for recovery and learning.' },
  10: { title: 'Protect the custody record', lead: 'Record the shared-case evidence identifier before reconstructing the timeline.', prompt: 'The custody intake begins with {{M09-E01}} and keeps all timestamps in {{UTC}}.', blanks: [{ answer: 'm09-e01', hint: 'evidence ID' }, { answer: 'utc', hint: 'time standard' }], takeaway: 'Custody records preserve provenance, integrity, transfers, and the distinction between observed facts and inference.' },
  11: { title: 'Brief the bounded case', lead: 'Keep the executive report connected to the evidence slice it can support.', prompt: 'The report covers {{INC-4937}} and names {{fs-02}} as the bounded service-disruption context.', blanks: [{ answer: 'inc-4937', hint: 'incident ID' }, { answer: 'fs-02', hint: 'service asset' }], takeaway: 'A useful report distinguishes facts, impact, uncertainty, owner, and the next verification point for its audience.' },
  12: { title: 'Anchor the capstone record', lead: 'Capture the core case facts before you synthesize the full investigation.', prompt: 'Operation Amber Finch is {{INC-4821}} and the affected workstation is {{WS-204}}.', blanks: [{ answer: 'inc-4821', hint: 'incident ID' }, { answer: 'ws-204', hint: 'device label' }], takeaway: 'The capstone asks you to connect evidence across sources, contain supported scope, and communicate a defensible outcome.' },
};

function socRecallEscape(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function socRecallState(moduleNumber, user) {
  return LabRuntime.load(`soc-${String(moduleNumber).padStart(2, '0')}-evidence-recall-v1`, user, { answers: {}, checked: false, complete: false, feedback: '' });
}

function socRecallRender(moduleNumber, user) {
  const activity = SOC_EVIDENCE_RECALL[moduleNumber];
  const state = socRecallState(moduleNumber, user);
  let blankIndex = 0;
  const sentence = activity.prompt.replace(/\{\{[^}]+\}\}/g, () => {
    const index = blankIndex++;
    const blank = activity.blanks[index];
    return `<label class="soc-recall__blank"><span class="sr-only">${socRecallEscape(blank.hint)}</span><input data-soc-recall-input="${index}" value="${socRecallEscape(state.answers[index] || '')}" maxlength="48" autocomplete="off" spellcheck="false" aria-label="Fill in: ${socRecallEscape(blank.hint)}"><small>${socRecallEscape(blank.hint)}</small></label>`;
  });
  const status = state.feedback ? `<p class="soc-recall__status ${state.complete ? 'is-complete' : 'is-retry'}" role="status">${socRecallEscape(state.feedback)}</p>` : '';
  return `<section class="soc-recall ${state.complete ? 'is-complete' : ''}" data-soc-recall="${moduleNumber}" aria-labelledby="soc-recall-title-${moduleNumber}">
    <div class="soc-recall__heading"><div><p class="soc-recall__eyebrow">Evidence recall · formative practice</p><h3 id="soc-recall-title-${moduleNumber}">${socRecallEscape(activity.title)}</h3></div><span>${state.complete ? 'Recorded' : '2 facts'}</span></div>
    <p>${socRecallEscape(activity.lead)}</p><p class="soc-recall__sentence">${sentence}</p>
    <div class="soc-recall__actions"><button type="button" data-soc-recall-check="${moduleNumber}">${state.complete ? 'Review facts' : 'Check facts'}</button><p>${socRecallEscape(activity.takeaway)}</p></div>${status}
  </section>`;
}

function mountSocEvidenceRecall(user, moduleNumber, app) {
  const activity = SOC_EVIDENCE_RECALL[Number(moduleNumber)];
  if (!activity || !app || app.querySelector('[data-soc-recall]')) return;
  const host = app.querySelector(`[class*="m${String(moduleNumber).padStart(2, '0')}-shell"]`) || app.firstElementChild;
  if (!host) return;
  const mount = document.createElement('div');
  mount.innerHTML = socRecallRender(Number(moduleNumber), user);
  const section = mount.firstElementChild;
  const footer = host.querySelector('footer');
  host.insertBefore(section, footer || null);
  wireSocEvidenceRecall(section, user, Number(moduleNumber), app);
}

function wireSocEvidenceRecall(section, user, moduleNumber, app) {
  const activity = SOC_EVIDENCE_RECALL[moduleNumber];
  if (!section || !activity) return;
  section.addEventListener('input', (event) => {
    const input = event.target.closest('[data-soc-recall-input]');
    if (!input) return;
    const state = socRecallState(moduleNumber, user);
    state.answers[input.dataset.socRecallInput] = input.value;
    state.checked = false;
    LabRuntime.save(`soc-${String(moduleNumber).padStart(2, '0')}-evidence-recall-v1`, user, state);
  });
  section.addEventListener('click', (event) => {
    const button = event.target.closest('[data-soc-recall-check]');
    if (!button) return;
    const state = socRecallState(moduleNumber, user);
    const correct = activity.blanks.every((blank, index) => String(state.answers[index] || '').trim().toLowerCase() === blank.answer.toLowerCase());
    state.checked = true;
    state.complete = correct;
    state.feedback = correct ? 'Correct — facts recorded. Keep this evidence-first habit in the next activity.' : 'Not quite. Re-read the case facts and retry; capitalization does not matter.';
    LabRuntime.save(`soc-${String(moduleNumber).padStart(2, '0')}-evidence-recall-v1`, user, state);
    const replacement = document.createElement('div');
    replacement.innerHTML = socRecallRender(moduleNumber, user);
    const nextSection = replacement.firstElementChild;
    section.replaceWith(nextSection);
    wireSocEvidenceRecall(nextSection, user, moduleNumber, app);
  });
}
