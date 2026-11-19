/* Module 2 (key its-10) — IT Help Desk & Career Accelerator ('it-support').
 * Fictional org, tickets, and policy text; no real systems are involved.
 *
 * This file holds the Learn It content and the code that draws it:
 *   - Lesson 2.1: Reading 1, a ticket's fields and states, with the fields
 *     table, the states line and a diagram of the states.
 *   - Lesson 2.2: Reading 2 (Impact, Urgency, Priority and SLAs, with the
 *     matrix table, the SLA table and a diagram) and Reading 3 (writing for
 *     two audiences, assignment groups, the knowledge base, with a diagram).
 *   - The knowledge check: five questions with a "why" line for a right
 *     answer and an "if wrong" line for each wrong one. A program check, not
 *     an A+ objective; it is not graded.
 *
 * Block types (its10Blocks): h (sub-heading), h5 (a smaller heading under
 * it), p, ul, ol, note ({ title, text }), table ({ caption, head, rows }) and
 * diagram (a key of ITS10_DIAGRAMS). In p, ul and ol text, **...** is
 * emphasized. bin/its-curriculum-check.js reads each lesson's title and
 * minutes from this file: they must match portal/data.js.
 */

const ITS10_LESSONS = [
  {
    id: 'its-10-lesson-01', number: '2.1', icon: 'ri-file-list-2-line',
    title: 'Anatomy of a Ticket: Fields, Categories & Status', minutes: 90,
    learn: [
      'Fill in every field of an incident ticket and say what each field is for',
      'Tell an incident (something broken) from a request (something new)',
      'Name each ticket state, say whose move it is, and say when the SLA clock pauses',
    ],
    blocks: [
      { h: 'Reading 1 · A ticket’s life in ServiceNow' },
      { p: 'A ticket is the official record of one problem or request. If it isn’t in the ticket, it didn’t happen.' },
      { p: 'A broken thing is an **Incident** (an INC number). A request for something new is a **Requested Item** (RITM) from the Service Catalog, and it often needs an approval. Logging a request as an incident skips the approval and skews reports, so convert it.' },
      { h5: 'The fields you fill in' },
      { p: 'Every ticket you work has these fields. Fill in each one.' },
      { table: {
        caption: 'Incident form fields you fill in on every ticket',
        head: ['Field', 'What it means', 'Rule in this course'],
        rows: [
          ['Number', 'Auto-generated ID, e.g. INC0010231', 'Quote it in every customer message'],
          ['Caller', 'The person reporting the issue', 'Confirm it matches the person you verified'],
          ['Category / Subcategory', 'What kind of problem it is (Hardware > Monitor)', 'Pick the symptom’s category, then correct it once you know the cause'],
          ['Configuration item (CI)', 'The device or service affected (NS-LT-0122, Outlook)', 'Always set it; it links the ticket to the asset'],
          ['Contact type', 'Phone, Email, Self-service, Walk-in, Chat', 'Match how the user reached you'],
          ['Impact', 'How much of the business is affected: 1 High, 2 Medium, 3 Low', 'See the matrix below'],
          ['Urgency', 'How fast it hurts: 1 High, 2 Medium, 3 Low', 'See the matrix below'],
          ['Priority', 'Calculated from Impact × Urgency (you don’t type it)', 'Re-check it whenever the facts change'],
          ['Assignment group / Assigned to', 'The team and person who own it now', 'Never leave an open ticket unowned'],
          ['Short description', 'One line a stranger can scan', 'Symptom + who/what + where: “Outlook can’t send – 1 user – Sales”'],
          ['Work notes', 'Internal only. Seen by IT staff, never by the caller', 'Technical detail, evidence, commands run, handoff notes'],
          ['Additional comments', 'Customer-visible. Emailed to the caller', 'Plain language, no jargon, no internal names or passwords'],
          ['Resolution code / Resolution notes', 'Why and how it was closed', 'Required before the state can be set to Resolved'],
        ],
      } },
      { h5: 'States: whose move is it?' },
      { p: 'Every ticket moves through states, and each state says whose move it is. A ticket also has an SLA clock, a time limit for the ticket that Reading 2 explains.' },
      { p: 'Incident states: New → In Progress → On Hold (reason: Awaiting Caller, Awaiting Change, Awaiting Problem or Awaiting Vendor) → Resolved → Closed. Canceled is for duplicates or tickets opened by mistake. In this course, Resolved means the fix is done and confirmed. The ticket auto-closes after 3 business days unless the caller reopens it.' },
      { ul: [
        'On Hold – Awaiting Caller means you’re waiting on the user, and the SLA clock pauses.',
        'In Progress with no update for two days means someone dropped it.',
        'An open ticket always has an owner (Assigned to).',
        'If the caller replies “still broken” to a Resolved ticket, it goes back to In Progress (reopened). You don’t open a new ticket.',
      ] },
      { note: { title: 'Escalated in the simulator', text: 'The simulator shows Escalated for a ticket you hand to another group. In real ServiceNow the ticket stays In Progress under the new assignment group.' } },
      { diagram: 'states' },
    ],
    comingUp: 'Set the category, the configuration item and the contact type, and move tickets through their states in the guided queue shift (Lab 2.1).',
  },
  {
    id: 'its-10-lesson-02', number: '2.2', icon: 'ri-alarm-warning-line',
    title: 'Impact, Urgency, Priority & SLAs', minutes: 120,
    learn: [
      'Find a ticket’s priority from the Impact × Urgency matrix, and read its SLA targets',
      'Write a work note (Reported · Tried · Result) and a customer comment for the right audience',
      'Choose the right assignment group, tell an incident from a request, and attach or draft a KB article',
    ],
    blocks: [
      { h: 'Reading 2 · Impact, urgency, priority and SLAs' },
      { p: '**Impact** is how much of the business is hurt: one person, a team, a site. **Urgency** is how fast the hurt grows: a deadline in an hour, or next week. ServiceNow works out **Priority** from the two, using the matrix below. Priority never comes from how loud the caller is.' },
      { p: 'Watch for two traps:' },
      { ul: [
        '**Understated urgency.** “Whenever you get a minute: none of the tills in the store can take card payments.” The words are calm. The business is still hurt.',
        '**Overstated urgency.** “EMERGENCY!!! My desktop wallpaper changed by itself.” The words are loud. Loud words don’t raise the impact.',
      ] },
      { p: 'In both cases, ask how many people are hurt and how soon, then use the matrix.' },
      { table: {
        caption: 'Priority matrix (ServiceNow’s default Impact × Urgency lookup)',
        head: ['Impact ↓ / Urgency →', '1 – High', '2 – Medium', '3 – Low'],
        rows: [
          ['1 – High (a site, a department, or a critical service)', 'P1 Critical', 'P2 High', 'P3 Moderate'],
          ['2 – Medium (a team, or one VIP or critical role)', 'P2 High', 'P3 Moderate', 'P4 Low'],
          ['3 – Low (one person, workaround exists)', 'P3 Moderate', 'P4 Low', 'P5 Planning'],
        ],
      } },
      { p: 'An **SLA** (Service Level Agreement) sets how fast the desk must respond and resolve each priority. These are Northstar’s targets, used in every simulation.' },
      { table: {
        caption: 'Northstar SLA targets',
        head: ['Priority', 'Respond within', 'Resolve within', 'Who must be told'],
        rows: [
          ['P1 Critical', '15 minutes', '4 hours', 'Service Desk lead immediately; Major Incident process'],
          ['P2 High', '30 minutes', '8 hours', 'Team lead if 50% of SLA used with no plan'],
          ['P3 Moderate', '4 business hours', '2 business days', '—'],
          ['P4 Low', '1 business day', '5 business days', '—'],
          ['P5 Planning', '2 business days', 'By agreement', '—'],
        ],
      } },
      { p: 'SLA timers pause while a ticket is On Hold – Awaiting Caller and keep running in every other open state.' },
      { p: 'Work the queue by priority, then by SLA time left, not by arrival order. When an SLA is at risk, tell your lead before it breaches.' },
      { p: 'If a caller doesn’t answer while the ticket is On Hold, Northstar policy is three contact attempts over three business days. Then resolve the ticket with the code **No response from caller** and tell them they can reopen it.' },
      { h5: 'SLA rules for the simulator' },
      { ul: [
        'Before you triage, Priority and SLA due show “Not set”. Once you set Impact and Urgency, the SLA is timed from the ticket’s Created time.',
        'The respond target is met when the desk takes the next move on the ticket: Assign to me, assignment to another group, Convert to Request, or linking it to a parent ticket. After that the bar counts to the resolve target. A linked ticket keeps a resolve clock of its own.',
        'Time spent in Resolved doesn’t count. A reopened ticket carries on from where its resolve clock stopped.',
        'A request (RITM) shows no SLA bar in this module. The Northstar table covers incidents.',
        'The clock in the guided lab and in the practice tickets is fixed. It moves only with “Next day”.',
        'In the practice tickets, “Next day” unlocks once the second contact attempt is logged on the caller who never answers, and the other two tickets are converted, resolved or escalated. Until then the control says what is still open today.',
      ] },
      { note: { title: 'Real ServiceNow', text: 'The matrix, SLA targets, pause rules and resolution codes are all set by each company, and the labels you see on the job may differ. Some of the simulator rules above are course simplifications.' } },
      { diagram: 'matrix' },
      { h: 'Reading 3 · Writing for two audiences, and using the knowledge base' },
      { p: '**Work notes** are internal: evidence, commands, findings and handoff detail for the next technician. **Additional comments** are emailed to the user: plain words, what happened, what they need to do, and when you’ll update next. Never put internal server names, other users’ details or anything security-sensitive in a comment.' },
      { h5: 'The Northstar ticket note standard' },
      { p: 'Every work note has three parts: **Reported** (what the user said, in their words), **Tried** (what you checked and did, with evidence) and **Result** (what happened and how you confirmed it). When the ticket stays open or goes to another team, add **Next action** (who does what next, and by when). “Fixed it” is not a note.' },
      { p: 'Every customer comment does four things:' },
      { ol: [
        'It acknowledges the person.',
        'It says what happened, in plain words.',
        'It says what they need to do, if anything.',
        'It says what happens next.',
      ] },
      { h5: 'Who owns what: assignment groups' },
      { p: 'The Assignment group field sends the ticket to the team that owns that kind of work.' },
      { table: {
        caption: 'Assignment groups at Northstar',
        head: ['Group', 'Owns'],
        rows: [
          ['Service Desk (Tier 1)', 'Intake, triage, password/unlock, known fixes, user communication'],
          ['Desktop Support (Tier 2)', 'Hands-on hardware, imaging, complex endpoint issues'],
          ['Network Operations', 'Switches, Wi-Fi infrastructure, firewalls, VPN concentrators, ISP circuits'],
          ['Server & Identity', 'Servers, AD design, Group Policy, DNS/DHCP servers'],
          ['Messaging & Collaboration', 'Exchange Online, Teams, SharePoint, M365 licensing policy'],
          ['Security Operations (SOC)', 'Phishing, malware, suspicious sign-ins, any suspected compromise'],
          ['Facilities', 'Power, HVAC, building access'],
        ],
      } },
      { h5: 'Incident or request?' },
      { p: 'An incident is something that used to work and now doesn’t (Outlook won’t send). A request asks for something new (a new monitor, access to a shared mailbox). In real ServiceNow, requests come through the Service Catalog as REQ → RITM → SCTASK records, not as INC records. In the simulator, a request is opened as a Request item (RITM) with a Requested-for user and an Approval field.' },
      { h5: 'Using the knowledge base' },
      { ul: [
        'Search the KB before you solve, using symptom words and exact error codes.',
        'When an article helps, use Attach knowledge on the incident.',
        'When you fix something new, submit a KB draft (symptom, cause, steps, verification, audience) for review.',
        'Link related tickets, so a pattern is visible to everyone.',
      ] },
      { diagram: 'audiences' },
    ],
    comingUp: 'Work a practice queue in the IT Service Desk simulator (Lab 2.1, the guided queue shift): set Impact and Urgency, convert a request, write for both audiences, and attach and draft KB articles.',
  },
];

/* ------------------------------------------------------------ Diagrams */

/* Each diagram is drawn as inline SVG from the data below: a wide layout and
 * a narrow (phone) one, switched by a container query in the stylesheet. The
 * shared look comes from the its01-dg-* classes; the priority colours of the
 * matrix come from the its10-dg-* classes. Colours follow the page's theme
 * variables. */
const ITS10_DIAGRAMS = {
  states: {
    title: 'A ticket’s states: each one says whose move it is',
    caption: 'Read the state to see whose move it is. The SLA clock pauses only in On Hold – Awaiting Caller.',
    boxes: [
      { title: 'New', text: 'Nobody owns it yet' },
      { title: 'In Progress', text: 'You own it and you’re working it' },
      { title: 'Resolved', text: 'Fixed and confirmed with the user' },
      { title: 'Closed', text: 'Closes by itself after 3 business days with no reply' },
    ],
    hold: {
      title: 'On Hold',
      text: 'Waiting on someone else. Always pick a reason',
      reasons: ['Awaiting Caller', 'Awaiting Change', 'Awaiting Problem', 'Awaiting Vendor'],
      pause: 'The SLA clock pauses only here',
    },
    reopen: 'Caller replies “still broken”: reopen it, don’t open a new ticket',
  },
  matrix: {
    title: 'Priority comes from Impact × Urgency, never from how loud the caller is',
    caption: 'Find the row for Impact and the column for Urgency. The cell is the priority.',
    corner: 'Impact ↓ / Urgency →',
    legend: 'Urgency: 1 High · 2 Medium · 3 Low',
    cols: ['Urgency 1 · High', 'Urgency 2 · Medium', 'Urgency 3 · Low'],
    rows: [
      { title: 'Impact 1 · High', text: 'a site, a department or a critical service', cells: ['P1 Critical', 'P2 High', 'P3 Moderate'] },
      { title: 'Impact 2 · Medium', text: 'a team, or one VIP or critical role', cells: ['P2 High', 'P3 Moderate', 'P4 Low'] },
      { title: 'Impact 3 · Low', text: 'one person, a workaround exists', cells: ['P3 Moderate', 'P4 Low', 'P5 Planning'] },
    ],
    strip: [
      'P1 · respond 15 min · resolve 4 h',
      'P2 · 30 min · 8 h',
      'P3 · 4 business hours · 2 business days',
      'P4 · 1 business day · 5 business days',
      'P5 · 2 business days · by agreement',
    ],
  },
  audiences: {
    title: 'One ticket, two audiences',
    caption: 'The work note is for the next technician. The comment is for the user. Both belong on the same ticket.',
    cards: [
      { title: 'Work notes', sub: 'Internal: IT staff only', lines: ['Reported · Tried · Result (+ Next action)', 'Evidence, exact errors, device names, what you ruled out'] },
      { title: 'Additional comments', sub: 'Emailed to the user', lines: ['Plain words: what happened, what they need to do, when you’ll update', 'No internal server names, other users’ details or security detail'] },
    ],
    steps: [
      { title: 'Search the KB first' },
      { title: 'Attach knowledge when an article helps' },
      { title: 'Fixed something new? Create a KB draft for review' },
    ],
  },
};

// Every word a diagram shows, in reading order: the screen-reader description.
function its10DiagramWords(key) {
  const d = ITS10_DIAGRAMS[key];
  if (key === 'states') {
    const [a, b, c, e] = d.boxes.map((x) => `${x.title}: ${x.text}`);
    return `${a}. Then ${b}. Then ${c}. Then ${e}. Under In Progress, joined by a two-way arrow: ${d.hold.title}: ${d.hold.text}. ${d.hold.reasons.join(' · ')}. Awaiting Caller is highlighted: ${d.hold.pause}. A curved arrow from Resolved back to In Progress: ${d.reopen}.`;
  }
  if (key === 'matrix') {
    const rows = d.rows.map((r) => `${r.title} (${r.text}): ${r.cells.map((cell, i) => `${d.cols[i]} gives ${cell}`).join('; ')}`).join('. ');
    return `${d.corner}. ${rows}. Targets under the grid: ${d.strip.join('; ')}. ${d.caption}`;
  }
  const cards = d.cards.map((c) => `${c.title}, ${c.sub}: ${c.lines.join('; ')}`).join('. ');
  return `${cards}. Under both: ${d.steps.map((s) => s.title).join(', then ')}.`;
}

// Splits text into lines of at most max characters, at word breaks.
function its10Wrap(text, max) {
  const lines = [];
  let line = '';
  String(text).split(/\s+/).forEach((word) => {
    if (line && (line.length + 1 + word.length) > max) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  });
  if (line) lines.push(line);
  return lines;
}

const ITS10_DG = { pad: 12, title: 15, text: 13, lh: 18, charW: 0.56 };

// One box's wrapped lines: [{ text, cls }], laid out for width w.
function its10BoxLines(box, w) {
  const inner = w - ITS10_DG.pad * 2;
  const titleMax = Math.max(8, Math.floor(inner / (ITS10_DG.title * ITS10_DG.charW)));
  const textMax = Math.max(8, Math.floor(inner / (ITS10_DG.text * ITS10_DG.charW)));
  const out = [];
  its10Wrap(box.title, titleMax).forEach((text) => out.push({ text, cls: 'its01-dg-title' }));
  if (box.sub) its10Wrap(box.sub, textMax).forEach((text) => out.push({ text, cls: 'its01-dg-sub' }));
  (box.lines || []).forEach((item) => {
    its10Wrap(item, textMax).forEach((text) => out.push({ text, cls: 'its01-dg-text' }));
  });
  if (box.text) its10Wrap(box.text, textMax).forEach((text) => out.push({ text, cls: 'its01-dg-text' }));
  return out;
}
function its10BoxHeight(box, w) {
  return ITS10_DG.pad * 2 + its10BoxLines(box, w).length * ITS10_DG.lh + 4;
}
function its10Box(box, x, y, w, h) {
  const text = its10BoxLines(box, w).map((line, i) => `<text class="${line.cls}" x="${x + ITS10_DG.pad}" y="${y + ITS10_DG.pad + 14 + i * ITS10_DG.lh}">${esc(line.text)}</text>`).join('');
  return `<rect class="its01-dg-box${box.hl ? ' its01-dg-hl' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>${text}`;
}
function its10Arrow(x1, y1, x2, y2, id, hl, both) {
  const ref = `url(#${id}${hl ? '-hl' : ''})`;
  return `<line class="its01-dg-line${hl ? ' its01-dg-line-hl' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="${ref}"${both ? ` marker-start="${ref}"` : ''}/>`;
}
function its10Label(text, x, y, anchor = 'middle', hl = false, max = 40) {
  return its10Wrap(text, max).map((line, i) => `<text class="its01-dg-label${hl ? ' its01-dg-label-hl' : ''}" x="${x}" y="${y + i * 16}" text-anchor="${anchor}">${esc(line)}</text>`).join('');
}
function its10Markers(id) {
  const marker = (suffix, cls) => `<marker id="${id}${suffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="${cls}" d="M0,0 L10,5 L0,10 z"/></marker>`;
  return `<defs>${marker('', 'its01-dg-head')}${marker('-hl', 'its01-dg-head its01-dg-head-hl')}</defs>`;
}
function its10Svg(key, layout, width, height, body) {
  const d = ITS10_DIAGRAMS[key];
  return `<svg class="its01-dg-${layout}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(d.title)}" aria-describedby="its10-dg-${key}-desc" focusable="false">${body}</svg>`;
}

function its10StatesSvg(layout) {
  const d = ITS10_DIAGRAMS.states;
  const hold = d.hold;
  const id = `its10-dg-states-${layout}-arrow`;
  let body = its10Markers(id);

  if (layout === 'wide') {
    const w = 160, gap = 40, width = 4 * w + 3 * gap;
    const h = Math.max(...d.boxes.map((b) => its10BoxHeight(b, w)));
    const labelMax = 44;
    const labelLines = its10Wrap(d.reopen, labelMax).length;
    const top = 12 + labelLines * 16 + 8 + 42;
    const c = (i) => i * (w + gap) + w / 2;
    d.boxes.forEach((b, i) => {
      const x = i * (w + gap);
      body += its10Box(b, x, top, w, h);
      if (i) body += its10Arrow(x - gap + 4, top + h / 2, x - 4, top + h / 2, id);
    });
    // The reopen loop: from Resolved's top, over, and down into In Progress.
    body += `<path class="its01-dg-line its01-dg-line-hl" d="M${c(2)},${top - 3} C${c(2)},${top - 56} ${c(1)},${top - 56} ${c(1)},${top - 5}" marker-end="url(#${id}-hl)"/>`;
    body += its10Label(d.reopen, (c(1) + c(2)) / 2, 12, 'middle', true, labelMax);
    // On Hold, under In Progress, joined by a two-way arrow.
    const hy = top + h + 46;
    body += its10Arrow(c(1), top + h + 3, c(1), hy - 3, id, false, true);
    const bw = 576;
    const textLines = its10Wrap(hold.text, 75);
    const chipTop = hy + 46 + (textLines.length - 1) * 18 + 14;
    const labelY = chipTop + 30 + 18;
    const bh = labelY + 12 - hy;
    body += `<rect class="its01-dg-box" x="0" y="${hy}" width="${bw}" height="${bh}" rx="10"/>`;
    body += `<text class="its01-dg-title" x="${ITS10_DG.pad}" y="${hy + 26}">${esc(hold.title)}</text>`;
    body += textLines.map((line, i) => `<text class="its01-dg-text" x="${ITS10_DG.pad}" y="${hy + 46 + i * 18}">${esc(line)}</text>`).join('');
    hold.reasons.forEach((reason, i) => {
      const cx = 12 + i * 140;
      body += `<rect class="its01-dg-box${i === 0 ? ' its01-dg-hl' : ''}" x="${cx}" y="${chipTop}" width="132" height="30" rx="8"/>`;
      body += `<text class="${i === 0 ? 'its01-dg-sub' : 'its01-dg-text'}" x="${cx + 66}" y="${chipTop + 20}" text-anchor="middle">${esc(reason)}</text>`;
    });
    body += its10Label(hold.pause, 12, labelY, 'start', true, 60);
    return its10Svg('states', layout, width, hy + bh + 4, body);
  }

  // Narrow: one column. The reopen loop runs down the left edge, and the
  // In Progress to Resolved arrow down the right edge, past the On Hold box.
  const width = 320, x = 24, w = 272, gap = 30;
  const cx = x + w / 2;
  let y = 4;
  const tops = [], heights = [];
  [0, 1].forEach((i) => {
    if (i) { body += its10Arrow(cx, y + 3, cx, y + gap - 3, id); y += gap; }
    const h = its10BoxHeight(d.boxes[i], w);
    tops[i] = y; heights[i] = h;
    body += its10Box(d.boxes[i], x, y, w, h);
    y += h;
  });
  body += its10Arrow(cx, y + 3, cx, y + gap - 3, id, false, true);
  y += gap;
  const textLines = its10Wrap(hold.text, 34);
  const chipTop = y + 46 + (textLines.length - 1) * 18 + 14;
  const chipH = 26;
  const labelY = chipTop + chipH + 16;
  const restTop = labelY + 10;
  const bottom = restTop + 3 * (chipH + 6) - 6 + 12;
  body += `<rect class="its01-dg-box" x="${x}" y="${y}" width="${w}" height="${bottom - y}" rx="10"/>`;
  body += `<text class="its01-dg-title" x="${x + ITS10_DG.pad}" y="${y + 26}">${esc(hold.title)}</text>`;
  body += textLines.map((line, i) => `<text class="its01-dg-text" x="${x + ITS10_DG.pad}" y="${y + 46 + i * 18}">${esc(line)}</text>`).join('');
  hold.reasons.forEach((reason, i) => {
    const chipY = i === 0 ? chipTop : restTop + (i - 1) * (chipH + 6);
    body += `<rect class="its01-dg-box${i === 0 ? ' its01-dg-hl' : ''}" x="${x + 12}" y="${chipY}" width="${w - 24}" height="${chipH}" rx="8"/>`;
    body += `<text class="${i === 0 ? 'its01-dg-sub' : 'its01-dg-text'}" x="${cx}" y="${chipY + 18}" text-anchor="middle">${esc(reason)}</text>`;
  });
  body += its10Label(hold.pause, cx, labelY, 'middle', true, 40);
  y = bottom;
  // Room between On Hold and Resolved for the reopen label.
  const reopenLines = its10Wrap(d.reopen, 30);
  body += its10Label(d.reopen, 160, y + 24, 'middle', true, 30);
  y += 24 + reopenLines.length * 16 + 6;
  const resolvedH = its10BoxHeight(d.boxes[2], w);
  tops[2] = y; heights[2] = resolvedH;
  body += its10Box(d.boxes[2], x, y, w, resolvedH);
  y += resolvedH;
  body += its10Arrow(cx, y + 3, cx, y + gap - 3, id);
  y += gap;
  const closedH = its10BoxHeight(d.boxes[3], w);
  body += its10Box(d.boxes[3], x, y, w, closedH);
  y += closedH;
  const ipMid = tops[1] + heights[1] / 2;
  const resMid = tops[2] + heights[2] / 2;
  body += `<path class="its01-dg-line" d="M${x + w},${ipMid} H310 V${resMid} H${x + w + 4}" marker-end="url(#${id})"/>`;
  body += `<path class="its01-dg-line its01-dg-line-hl" d="M${x},${resMid} H10 V${ipMid} H${x - 4}" marker-end="url(#${id}-hl)"/>`;
  return its10Svg('states', layout, width, y + 4, body);
}

// 'P3 Moderate' -> 'p3'. Priority colours: its10-dg-p1 (darkest) to its10-dg-p5.
function its10PClass(cell) {
  const match = /P(\d)/.exec(cell);
  return match ? `p${match[1]}` : 'p5';
}
function its10Cell(cell, x, y, w, h, textLines) {
  const cls = its10PClass(cell);
  const light = cls === 'p1' || cls === 'p2';
  const textCls = light ? 'its10-dg-cell-text-light' : 'its10-dg-cell-text';
  const lines = textLines || [cell];
  const first = y + h / 2 + 5 - ((lines.length - 1) * 9);
  return `<rect class="its10-dg-${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>`
    + lines.map((line, i) => `<text class="${textCls}" x="${x + w / 2}" y="${first + i * 18}" text-anchor="middle">${esc(line)}</text>`).join('');
}

function its10MatrixSvg(layout) {
  const d = ITS10_DIAGRAMS.matrix;
  let body = '';

  if (layout === 'wide') {
    const rowW = 200, cw = 168, gap = 4, headH = 36;
    const x0 = rowW + gap;
    const width = x0 + 3 * cw + 2 * gap;
    body += its10Label(d.corner, 0, headH - 12, 'start');
    d.cols.forEach((col, i) => {
      body += `<text class="its01-dg-title" x="${x0 + i * (cw + gap) + cw / 2}" y="${headH - 12}" text-anchor="middle">${esc(col)}</text>`;
    });
    const h = Math.max(...d.rows.map((r) => its10BoxHeight({ title: r.title, text: r.text }, rowW)));
    d.rows.forEach((r, ri) => {
      const y = headH + ri * (h + gap);
      body += its10Box({ title: r.title, text: r.text }, 0, y, rowW, h);
      r.cells.forEach((cell, ci) => { body += its10Cell(cell, x0 + ci * (cw + gap), y, cw, h); });
    });
    // The strip of targets under the grid: one cell per priority.
    const stripY = headH + 3 * (h + gap) + 14;
    const sw = (width - 4 * 6) / 5;
    const parts = d.strip.map((s) => s.split(' · '));
    const boxes = parts.map((p) => ({ title: p[0], lines: p.slice(1) }));
    const sh = Math.max(...boxes.map((b) => its10BoxHeight(b, sw)));
    boxes.forEach((b, i) => { body += its10Box(b, i * (sw + 6), stripY, sw, sh); });
    return its10Svg('matrix', layout, width, stripY + sh + 4, body);
  }

  // Narrow: the urgency names once at the top, then one block per impact row.
  const width = 320, cw = 98, gap = 3;
  let y = 14;
  body += its10Label(d.legend, width / 2, y, 'middle');
  y += 14;
  d.rows.forEach((r) => {
    const textLines = its10Wrap(r.text, 40);
    body += `<text class="its01-dg-title" x="10" y="${y + 14}">${esc(r.title)}</text>`;
    body += textLines.map((line, i) => `<text class="its01-dg-text" x="10" y="${y + 14 + (i + 1) * 18}">${esc(line)}</text>`).join('');
    const cellsTop = y + 14 + textLines.length * 18 + 10;
    r.cells.forEach((cell, ci) => {
      body += its10Cell(cell, 10 + ci * (cw + gap), cellsTop, cw, 46, [`Urgency ${ci + 1}`, cell]);
    });
    y = cellsTop + 46 + 16;
  });
  const sw = 300;
  d.strip.forEach((s) => {
    const p = s.split(' · ');
    const box = { title: p[0], text: p.slice(1).join(' · ') };
    const sh = its10BoxHeight(box, sw);
    body += its10Box(box, 10, y, sw, sh);
    y += sh + 6;
  });
  return its10Svg('matrix', layout, width, y, body);
}

function its10AudiencesSvg(layout) {
  const d = ITS10_DIAGRAMS.audiences;
  const id = `its10-dg-audiences-${layout}-arrow`;
  let body = its10Markers(id);

  if (layout === 'wide') {
    const cw = 345, gap = 30, width = 2 * cw + gap;
    const ch = Math.max(...d.cards.map((c) => its10BoxHeight(c, cw)));
    d.cards.forEach((c, i) => { body += its10Box(c, i * (cw + gap), 4, cw, ch); });
    const sw = 200, sgap = 60;
    const sy = 4 + ch + 30;
    const sh = Math.max(...d.steps.map((s) => its10BoxHeight(s, sw)));
    d.steps.forEach((s, i) => {
      const x = i * (sw + sgap);
      body += its10Box(s, x, sy, sw, sh);
      if (i) body += its10Arrow(x - sgap + 4, sy + sh / 2, x - 4, sy + sh / 2, id);
    });
    return its10Svg('audiences', layout, width, sy + sh + 4, body);
  }

  const width = 320, x = 10, w = 300, gap = 30;
  let y = 4;
  d.cards.forEach((c) => {
    const h = its10BoxHeight(c, w);
    body += its10Box(c, x, y, w, h);
    y += h + 14;
  });
  y += 8;
  d.steps.forEach((s, i) => {
    if (i) { body += its10Arrow(x + w / 2, y + 3, x + w / 2, y + gap - 3, id); y += gap; }
    const h = its10BoxHeight(s, w);
    body += its10Box(s, x, y, w, h);
    y += h;
  });
  return its10Svg('audiences', layout, width, y + 4, body);
}

const ITS10_DIAGRAM_DRAW = { states: its10StatesSvg, matrix: its10MatrixSvg, audiences: its10AudiencesSvg };

function its10Diagram(key) {
  const d = ITS10_DIAGRAMS[key];
  const draw = ITS10_DIAGRAM_DRAW[key];
  if (!d || !draw) return '';
  return `<figure class="its01-dg" data-its10-diagram="${esc(key)}">
    <p class="its01-dg-heading">${esc(d.title)}</p>
    ${draw('wide')}
    ${draw('narrow')}
    <p class="its01-sr-only" id="its10-dg-${esc(key)}-desc">${esc(its10DiagramWords(key))}</p>
    <figcaption>${esc(d.caption)}</figcaption>
  </figure>`;
}

/* ------------------------------------------------------------- Lessons */

// Escaped text; **...** becomes emphasized text. It runs on the escaped
// text, so no markup gets in.
function its10Text(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function its10Table(table) {
  const caption = esc(table.caption);
  const head = table.head.map((cell) => `<th scope="col">${esc(cell)}</th>`).join('');
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('');
  return `<div class="its10-table-wrap" tabindex="0" role="region" aria-label="${caption}"><table class="its10-table"><caption>${caption}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function its10Blocks(blocks) {
  return blocks.map((block) => {
    if (block.h) return `<h4>${esc(block.h)}</h4>`;
    if (block.h5) return `<h5>${esc(block.h5)}</h5>`;
    if (block.p) return `<p>${its10Text(block.p)}</p>`;
    if (block.ul) return `<ul>${block.ul.map((item) => `<li>${its10Text(item)}</li>`).join('')}</ul>`;
    if (block.ol) return `<ol>${block.ol.map((item) => `<li>${its10Text(item)}</li>`).join('')}</ol>`;
    if (block.table) return its10Table(block.table);
    if (block.diagram) return its10Diagram(block.diagram);
    if (block.note) return `<div class="its01-note"><strong>${esc(block.note.title)}</strong><p>${esc(block.note.text)}</p></div>`;
    return '';
  }).join('');
}

function its10LessonCard(lesson) {
  return `<details class="its01-lesson" data-its10-lesson="${esc(lesson.id)}">
    <summary><span class="its01-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(lesson.number)} · ${esc(lesson.title)}</strong><small>${formatInstructionalMinutes(lesson.minutes)}</small></span><i class="ri-arrow-down-s-line its01-chevron" aria-hidden="true"></i></summary>
    <div class="its01-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${lesson.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${its10Blocks(lesson.blocks)}
      ${lesson.comingUp ? `<div class="its01-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(lesson.comingUp)}</span></div>` : ''}
    </div>
  </details>`;
}

/* ------------------------------------------------------ Knowledge check */

/* A program check, not an A+ objective and not graded. Same shape as one
 * entry of Module 1's checks: a right pick shows its why line, a wrong pick
 * shows its ifWrong line (never the right answer). ifWrong has null on the
 * right answer. */
const ITS10_CHECK = {
  title: 'Knowledge check',
  intro: 'Five questions on the two lessons. It’s complete at 70% or more of your first answers. Retake it as often as you like.',
  questions: [
    { q: 'A technician closes a ticket with the note “fixed.” What is missing?',
      choices: ['An asset tag', 'What was reported, what was tried and the result', 'A change approval', 'The caller’s manager'], answer: 1,
      why: 'Every work note covers Reported, Tried and Result, so the next technician never starts from zero. “Fixed” tells them nothing (Reading 3).',
      ifWrong: ['An asset tag says which device it is; it belongs in the Configuration item field and doesn’t say what was done.', null, 'Most tickets need no change approval; the gap here is in the note itself.', 'A manager only appears in a note when an approval was needed.'] },
    { q: 'Which field routes work to the right team?',
      choices: ['Short description', 'Assignment group', 'Contact type', 'Resolution code'], answer: 1,
      why: 'Assignment group is the team that owns the ticket now; Assigned to is the person in that team (fields table, Reading 1).',
      ifWrong: ['The short description tells a reader what the ticket is about; it doesn’t send it anywhere.', null, 'Contact type records how the user reached you: phone, email, chat.', 'The resolution code is chosen at the end, to say how the ticket was closed.'] },
    { q: 'A user asks for new software. How should it be logged?',
      choices: ['Incident', 'Problem', 'Requested item from the catalog', 'Change failure'], answer: 2,
      why: 'Asking for something new is a request, logged as a Requested Item (RITM) from the Service Catalog, so it gets its approval and tracking (Reading 1).',
      ifWrong: ['An incident is something that used to work and now doesn’t; nothing is broken here.', 'A problem record is for finding the cause behind repeated incidents; you’ll meet it in Module 12.', null, 'Nothing was changed and nothing failed.'] },
    { q: 'A ticket is waiting on the user’s reply. Which state pauses the SLA?',
      choices: ['In Progress', 'On Hold – Awaiting Caller', 'On Hold – Awaiting Vendor', 'Resolved'], answer: 1,
      why: 'The clock pauses only while you’re waiting on the user, in On Hold – Awaiting Caller. Every other open state keeps it running (Reading 1 and the SLA table).',
      ifWrong: ['In Progress means it’s your move, so the clock runs.', null, 'Waiting on a vendor doesn’t pause Northstar’s clock; only waiting on the caller does.', 'Resolved isn’t a waiting state: the work is done and confirmed.'] },
    { q: 'One user has a deadline in an hour, and a workaround is available. Which priority does the matrix give for Impact 3 × Urgency 1?',
      choices: ['P1', 'P2', 'P3', 'P4'], answer: 2,
      why: 'Find the row for Impact 3 (one person, a workaround exists) and the column for Urgency 1 (high): P3 Moderate. A deadline can’t make one person’s ticket a P1 (Reading 2).',
      ifWrong: ['P1 and P2 need wider impact: a site, a department, a team or a critical role.', 'P1 and P2 need wider impact: a site, a department, a team or a critical role.', null, 'P4 is what Urgency 2 would give; a deadline in an hour is Urgency 1.'] },
  ],
};

/* ------------------------------------------------------- Objective, sources */

// The weekly objective, shown in the hero.
const ITS10_OBJECTIVE = 'By the end of this module you can log, categorize and prioritize any ticket with Impact × Urgency, keep it inside its SLA, and tell an incident from a request. You can move a ticket through its states correctly, write work notes and customer comments to the Northstar standard, and find, attach and draft knowledge base articles.';

const ITS10_SOURCES = [
  { title: 'CompTIA A+ Certification', org: 'CompTIA', url: 'https://www.comptia.org/certifications/a', note: 'A public reference for the certification this course’s content lines up with. This module’s check is a program check, not an A+ objective. No certification exam is required to finish the program.' },
];

/* ----------------------------------------------------------- Page state */

// Saved to the student's account (module_progress.case_state): the
// knowledge check's "complete" and its time, and whether the walkthrough was
// started. Never answers or a score.
const ITS10_STATE_ID = 'its10-page-v1';
// Students see the guided lab as Lab 2.1; its key is older than that
// numbering. Lab 2.1 still gates Module 2 until the Prove It does.
const ITS10_LAB1_KEY = 'lab-its-10-priority-queue';
const ITS10_PRACTICE_KEY = 'lab-its-10-practice-tickets';
const ITS10_PROVE_KEY = 'lab-its-10-prove-it';
const ITS10_LAB_KEYS = [ITS10_LAB1_KEY, ITS10_PRACTICE_KEY, ITS10_PROVE_KEY];
const ITS10_COACH_ID = 'hd-m10';
const ITS10_LAB1_START = 'Start Lab 2.1 walkthrough';

const ITS10_DEFAULT_STATE = {
  checkCompleted: false, checkCompletedAt: null,
  consoleStarted: false, consoleCompleted: false,
};

let its10State = null;
let its10User = null;

function its10Load(user) {
  // Check answers live in page memory: a different student signing in
  // without a reload starts the check fresh.
  const userId = user && user.userId;
  if (userId !== its10CheckAnswersUser) {
    its10CheckAnswersUser = userId;
    its10CheckAnswers = {};
    its10CheckPicks = {};
  }
  its10User = user;
  its10State = LabRuntime.loadCaseState(ITS10_STATE_ID, 'its-10', user, ITS10_DEFAULT_STATE);
  // The simulator's popup message is the only way a walkthrough is recorded;
  // a return by link only shows that it wasn't (see itsNoteCoachReturn).
  itsNoteCoachReturn(user, ITS10_COACH_ID, [ITS10_LAB1_KEY]);
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-10');
  return its10State;
}

// The same debounced case-state write as Module 1's check: it only logs a
// failure, so the tick can show before the save is confirmed.
function its10Save() {
  if (its10User && its10State) LabRuntime.saveCaseState(ITS10_STATE_ID, 'its-10', its10User, its10State);
}

function its10Day(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

/* ------------------------------------------------------- Knowledge check */

/* One check, answered one question at a time, as on Module 1. A wrong pick
 * shows why that choice is wrong (its ifWrong line), never the right answer,
 * and the student picks again. A right pick shows the Why. Only the first
 * pick on each question counts. The check is complete when 70% or more of the
 * first picks are right (4 of 5). Once complete it stays complete; Start
 * again is a retake. Not graded: no lab attempt, no lab key, gates nothing. */
const ITS10_LETTERS = ['A', 'B', 'C', 'D'];
const ITS10_CHECK_PASS_TENTHS = 7;

// This page's picks, kept in page memory only (a reload starts again):
//   its10CheckAnswers: { questionIndex: the first pick }, the one that counts.
//   its10CheckPicks: { questionIndex: [every pick, in order] }.
let its10CheckAnswers = {};
let its10CheckPicks = {};
let its10CheckAnswersUser = null;

function its10CheckDone() {
  return ITS10_CHECK.questions.every((_, i) => Object.prototype.hasOwnProperty.call(its10CheckAnswers, i));
}
// Whole numbers only, so 3.5 of 5 can never round to a pass.
function its10CheckPassed() {
  const total = ITS10_CHECK.questions.length;
  const right = ITS10_CHECK.questions.filter((question, i) => its10CheckAnswers[i] === question.answer).length;
  return right * 10 >= total * ITS10_CHECK_PASS_TENTHS;
}
function its10CheckCompleted() {
  return Boolean(its10State && its10State.checkCompleted === true);
}

function its10CheckQuestion(question, index) {
  const picks = its10CheckPicks[index] || [];
  const last = picks.length ? picks[picks.length - 1] : undefined;
  const settled = picks.includes(question.answer);
  // Only the student's own picks are marked: a wrong pick never marks or
  // names the right answer.
  const choices = question.choices.map((choice, c) => {
    const picked = picks.includes(c);
    const cls = picked ? (c === question.answer ? ' is-answer' : ' is-wrong') : '';
    return `<button type="button" class="its01-choice${cls}" data-its10-answer data-q="${index}" data-choice="${c}" aria-pressed="${picked}" ${settled || picked ? 'disabled' : ''}><span>${ITS10_LETTERS[c]}</span> ${esc(choice)}</button>`;
  }).join('');
  const why = settled && question.why ? `<p class="its01-check-why">${esc(question.why)}</p>` : '';
  const wrongLine = !settled && last !== undefined && question.ifWrong && question.ifWrong[last] ? `<p class="its01-check-why">${esc(question.ifWrong[last])}</p>` : '';
  const feedback = last === undefined ? ''
    : settled
      ? `<p class="its01-check-result is-right"><i class="ri-check-line" aria-hidden="true"></i> <strong>Correct.</strong></p>${why}`
      : `<p class="its01-check-result is-wrong"><i class="ri-close-line" aria-hidden="true"></i> <strong>Not quite.</strong> Try another answer.</p>${wrongLine}`;
  return `<li class="its01-check-q">
    <p class="its01-check-prompt" id="its10-check-q${index}">${esc(question.q)}</p>
    <div class="its01-choices" role="group" aria-labelledby="its10-check-q${index}">${choices}</div>
    <div class="its01-check-feedback" id="its10-check-q${index}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

// The status line: a failed full pass asks for a retake (no score shown);
// otherwise a saved completion shows with its date.
function its10CheckFooter() {
  const anyAnswered = Object.keys(its10CheckAnswers).length > 0;
  const reset = anyAnswered ? '<button type="button" class="its01-check-reset" data-its10-check-reset><i class="ri-restart-line" aria-hidden="true"></i> Start again</button>' : '';
  let status = '';
  if (its10CheckDone() && !its10CheckPassed()) {
    status = 'Retake: you need 70%. Press Start again to retake the check.';
  } else if (its10CheckCompleted()) {
    const day = its10Day(its10State.checkCompletedAt);
    status = `<i class="ri-check-line" aria-hidden="true"></i> ${esc(ITS10_CHECK.title)} complete${day ? ` (${esc(day)})` : ''}. You can retake it any time.`;
  }
  return `<div class="its01-check-footer"><p class="its01-check-status" role="status">${status}</p>${reset}</div>`;
}

function its10Check() {
  return `<div class="its01-check" data-its10-check id="its10-check">
    <h3>${esc(ITS10_CHECK.title)}</h3>
    ${ITS10_CHECK.intro ? `<p class="its01-instruction">${esc(ITS10_CHECK.intro)}</p>` : ''}
    <ol class="its01-check-list">${ITS10_CHECK.questions.map((question, i) => its10CheckQuestion(question, i)).join('')}</ol>
    ${its10CheckFooter()}
  </div>`;
}

/* ------------------------------------------------------------- Sections */

function its10Learn() {
  return `<section class="its01-section" id="its10-lessons" aria-labelledby="its10-lessons-title">
    <div class="its01-section-heading"><span>L</span><div><p class="its01-kicker">Learn It</p><h2 id="its10-lessons-title">Three readings</h2></div></div>
    <p class="its01-instruction">Open each lesson for the readings, the reference tables and the diagrams, then try the knowledge check below.</p>
    <div class="its01-lesson-grid">${ITS10_LESSONS.map(its10LessonCard).join('')}</div>
  </section>`;
}

function its10Checks() {
  return `<section class="its01-section" id="its10-checks" aria-labelledby="its10-checks-title">
    <div class="its01-section-heading"><span><i class="ri-question-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Learn It · not graded</p><h2 id="its10-checks-title">Check your understanding</h2></div></div>
    <p class="its01-instruction">Choose an answer. A wrong answer tells you why it’s wrong, and you try again; a right one tells you why it’s right. Your first answer to each question is the one that counts. Not graded: your answers aren’t sent to your instructor.</p>
    ${its10Check()}
  </section>`;
}

// Lab 2.1: the hd-m10 coach on the practice queue in the IT Service Desk
// simulator (ui/helpdesk-coaches.js). Until Module 2's Prove It gates
// completion, the instructor still reviews this lab, so the page doesn't call
// it "not graded"; there is no score.
function its10Lab1() {
  const button = itsWalkthroughButton(its10User, [ITS10_LAB1_KEY]);
  return `<section class="its01-section its01-lab-section" id="its10-lab-2-1" aria-labelledby="its10-lab-2-1-title">
    <div class="its01-section-heading"><span>1</span><div><p class="its01-kicker">Practice It · coached</p><h2 id="its10-lab-2-1-title">${esc(itsLabTitle(ITS10_LAB1_KEY))}</h2></div></div>
    <p class="its01-instruction">Work a six-ticket morning queue in the IT Service Desk simulator. Add the queue columns, set Impact and Urgency on every ticket, convert a request, link two tickets about one outage, put the queue in order, send a security ticket to the SOC, pause a ticket while you wait on the caller, attach a knowledge article, write a work note and a customer comment, and resolve a ticket with a knowledge draft. A coach walks you through every step. Feedback only, no score.</p>
    <a class="itsw-evidence-button" data-its10-console-launch href="${esc(itsCoachLaunchHref(ITS10_COACH_ID, its10User))}" target="_blank" rel="opener">
      <i class="${button.icon}" aria-hidden="true"></i> ${{ redo: 'Redo the walkthrough', review: 'Review the walkthrough', start: ITS10_LAB1_START }[button.mode]}
    </a>
    ${itsWalkthroughNoticeHtml(its10User, ITS10_COACH_ID, [ITS10_LAB1_KEY], ITS10_LAB1_START)}
    ${itsLabStatusHtml(its10User, ITS10_LAB1_KEY, { label: 'Lab 2.1', prefix: 'its10', pendingText: 'Complete the guided walkthrough in the simulator to finish this lab.' })}
    ${itsRedoNoticeHtml(its10User, [{ key: ITS10_LAB1_KEY, action: 'Run the walkthrough again to resubmit this lab.' }])}
  </section>`;
}

// Lab 2.2, Module 2's unguided tickets (2-A to 2-C), not graded: the
// simulator opens just these tickets in their own saved shift
// (?practice=its-10, ui/helpdesk.js), with feedback but no score. Opened
// with an opener, so once all three are closed the simulator can report it
// (its10ReceivePracticeCompletion).
function its10PracticeTicketsHref(user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?practice=its-10&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
}
function its10PracticeTickets() {
  return `<section class="its01-section its01-lab-section" id="its10-practice-tickets" aria-labelledby="its10-practice-tickets-title">
    <div class="its01-section-heading"><span>2</span><div><p class="its01-kicker">Practice It · on your own</p><h2 id="its10-practice-tickets-title">${esc(itsLabTitle(ITS10_PRACTICE_KEY))}</h2></div></div>
    <p class="its01-instruction">Three tickets to work on your own: Omar Haddad says his new assistant can’t use his calendar, Ines Calder writes back that the badge printer is still broken, and Marcus Lee hasn’t answered since Monday. Decide what each ticket really is, follow the knowledge base and Northstar policy, and keep each SLA honest. Press Check my work on a ticket for feedback.</p>
    <p class="its01-instruction">Practice: not graded. Your answers aren’t sent. Finish all three tickets: resolve or escalate each one. The simulator then tells this page, and your account records that you completed Lab 2.2.</p>
    <a class="itsw-evidence-button" data-its10-practice-launch href="${esc(its10PracticeTicketsHref(its10User))}" target="_blank" rel="opener">
      <i class="ri-play-list-line" aria-hidden="true"></i> Open the practice tickets
    </a>
    ${itsLabStatusHtml(its10User, ITS10_PRACTICE_KEY, { label: 'Lab 2.2', prefix: 'its10', pendingText: 'Finish all three tickets: resolve or escalate each one.' })}
  </section>`;
}

// Module 2's Prove It isn't built yet: the card says so and opens nothing.
// No launch link and no message handler until its shift and scoring exist.
function its10Prove() {
  return `<section class="its01-section its01-lab-section" id="its10-prove-it" aria-labelledby="its10-prove-it-title">
    <div class="its01-section-heading"><span>3</span><div><p class="its01-kicker">Prove It · Assessment Lab · instructor reviewed</p><h2 id="its10-prove-it-title">${esc(itsLabTitle(ITS10_PROVE_KEY))}</h2></div></div>
    <p class="its01-instruction">Work a new ticket queue on your own in the IT Service Desk simulator: no coach, no hints and no feedback before you submit. Your instructor reviews your work.</p>
    <p class="its01-lab-status" data-its10-prove-soon role="status"><i class="ri-time-line" aria-hidden="true"></i> Opens soon. Nothing to do here yet: work Labs 2.1 and 2.2 first.</p>
  </section>`;
}

function its10Sources() {
  return `<div class="msources-block">
    <h3 class="msources-title">Further Reading</h3>
    <ul class="msources-list">
      ${ITS10_SOURCES.map((source) => `<li class="msources-item">
        <a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer" class="msources-link"><span class="msources-title-text">${esc(source.title)}</span><span class="msources-org">${esc(source.org)}</span></a>
        ${source.note ? `<p class="msources-note">${esc(source.note)}</p>` : ''}
      </li>`).join('')}
    </ul>
  </div>`;
}

/* The rail. The readings, the three labs and the knowledge check count
 * toward the module's percent (shown only; it saves nothing); Sources
 * doesn't. The check comes last in the list, so it never locks a lab
 * (moduleNavStatuses locks only rows after an unfinished one), and
 * neverLocked keeps it open while Lab 2.1 isn't done. */
function its10NavSections(user) {
  return [
    { id: 'lessons', title: 'Readings', type: 'lecture', phase: 'learn', isComplete: true, scrollId: 'its10-lessons' },
    { id: 'queue-shift', title: 'Queue shift walkthrough', navTitle: 'Lab 2.1 · Guided Lab', type: 'lab', ...itsLabRail(user, [ITS10_LAB1_KEY]), scrollId: 'its10-lab-2-1' },
    // Counts toward the percent, but never locked: the practice tickets can
    // be opened at any time.
    { id: 'unguided', title: 'Lab 2.2 · Practice tickets', navTitle: 'Lab 2.2 · Practice tickets', type: 'lab', phase: 'practice', neverLocked: true, ...itsLabRail(user, [ITS10_PRACTICE_KEY]), scrollId: 'its10-practice-tickets' },
    // Named so the platform's generic Assessment Lab box isn't added
    // (normalizeModuleStages).
    { id: 'assessment', title: 'Assessment Lab', type: 'review', neverLocked: true, ...itsLabRail(user, [ITS10_PROVE_KEY]), scrollId: 'its10-prove-it' },
    { id: 'learn-check', title: 'Knowledge check', type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its10CheckCompleted(), scrollId: 'its10-check' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'its10-sources', gated: false, supplemental: true },
  ];
}
function its10Rail(user) {
  return moduleProgressShell(its10NavSections(user), { moduleKey: 'its10', stageKey: 'its-10' });
}

function viewItsModuleTen(user, program) {
  its10Load(user);
  const module = program.modules['its-10'];
  return `<div class="its10-shell">
    ${moduleTopbar(user, program)}
    ${its10Rail(user)}
    <main class="its01-main">
      <section class="its01-hero" aria-labelledby="its10-title"><div><p class="its01-kicker">Module 02 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 1</p><h1 id="its10-title">${esc(module.title)}</h1><p class="its01-lede">${esc(ITS10_OBJECTIVE)}</p></div><dl class="its01-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${module.lessons}</dd></div><div><dt>Guided labs</dt><dd>1</dd></div><div><dt>Labs</dt><dd id="its10-status">${itsLabCounterText(user, ITS10_LAB_KEYS)}</dd></div></dl></section>

      ${its10Learn()}
      ${its10Checks()}
      ${its10Lab1()}
      ${its10PracticeTickets()}
      ${its10Prove()}

      <section class="its01-section" id="its10-sources" aria-labelledby="its10-sources-title"><div class="its01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Reference — not a graded step</p><h2 id="its10-sources-title">Sources &amp; Further Reading</h2></div></div>${its10Sources()}</section>
    </main>
  </div>`;
}

/* ----------------------------------------------------------- Re-renders */

// Updates the rail's rows and percent in place, so its open groups, drawer
// and listeners stay as they are.
function its10RefreshRail() {
  const rail = document.querySelector('.its10-shell [data-mquick-nav-rail]');
  if (!rail || !its10User) return;
  const holder = document.createElement('div');
  holder.innerHTML = its10Rail(its10User);
  const fresh = holder.querySelector('[data-mquick-nav-rail]');
  if (!fresh) return;
  const percent = rail.querySelector('.munified-percent');
  const freshPercent = fresh.querySelector('.munified-percent');
  if (percent && freshPercent) percent.textContent = freshPercent.textContent;
  fresh.querySelectorAll('a.munified-row').forEach((row) => {
    const old = rail.querySelector(`a.munified-row[href="${row.getAttribute('href')}"]`);
    if (!old) return;
    old.className = row.className;
    ['aria-disabled', 'data-mnav-locked-reason', 'data-mnav-locked-target'].forEach((name) => {
      if (row.hasAttribute(name)) old.setAttribute(name, row.getAttribute(name)); else old.removeAttribute(name);
    });
    old.innerHTML = row.innerHTML;
  });
}

function its10RenderCheck(focusIndex) {
  const el = document.querySelector('.its10-shell [data-its10-check]');
  if (el) el.outerHTML = its10Check();
  if (focusIndex !== undefined) {
    const target = document.getElementById(`its10-check-q${focusIndex}-feedback`);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }
  its10RefreshRail();
}

/* -------------------------------------------------------------- Actions */

// One pick on one question, as on Module 1. The check is complete, and saved
// as such (complete and its time only), the first time a full pass of first
// picks passes.
function its10Answer(index, choice) {
  const question = ITS10_CHECK.questions[index];
  if (!question || !(choice >= 0 && choice < question.choices.length)) return;
  const picks = its10CheckPicks[index] || [];
  if (picks.includes(question.answer) || picks.includes(choice)) return;
  its10CheckPicks[index] = picks.concat(choice);
  if (its10CheckAnswers[index] === undefined) its10CheckAnswers[index] = choice;
  if (its10State && its10CheckDone() && its10CheckPassed() && its10State.checkCompleted !== true) {
    its10State.checkCompleted = true;
    its10State.checkCompletedAt = new Date().toISOString();
    its10Save();
  }
  its10RenderCheck(index);
}

function its10ResetCheck() {
  its10CheckAnswers = {};
  its10CheckPicks = {};
  its10RenderCheck();
  const first = document.querySelector('.its10-shell [data-its10-check] [data-its10-answer]');
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
}

function wireItsModuleTenLab() {
  const shell = document.querySelector('.its10-shell');
  if (!shell || !its10State) return;
  shell.addEventListener('click', (event) => {
    const answer = event.target.closest('[data-its10-answer]');
    if (answer) {
      if (!answer.disabled) its10Answer(Number(answer.dataset.q), Number(answer.dataset.choice));
      return;
    }
    if (event.target.closest('[data-its10-check-reset]')) {
      its10ResetCheck();
      return;
    }
    const launch = event.target.closest('[data-its10-console-launch]');
    if (launch) {
      if (itsLaunchWalkthrough(event, launch, its10User, ITS10_COACH_ID)) {
        its10State.consoleStarted = true;
        its10Save();
      }
      itsRefreshWalkthroughNotice(its10User, ITS10_COACH_ID, [ITS10_LAB1_KEY], ITS10_LAB1_START);
    }
  });
}

/* ------------------------------------------- Lab 2.1 and Lab 2.2 saves */

// Lab 2.1's finished work: the coach's last work step, read from the cleaned
// snapshot (itsCleanCoachWork): the mouse ticket HD-2162 resolved, with its
// knowledge draft in Review. The coach shows Finish only after that step, but
// a reopened ticket or an old tab could still send a message.
const ITS10_LAB1_LAST_TICKET = 'HD-2162';
function its10Lab1Complete(work) {
  const ticket = work && Array.isArray(work.tickets) ? work.tickets.find((entry) => entry.id === ITS10_LAB1_LAST_TICKET) : null;
  const done = ticket && (ticket.status === 'Resolved' || ticket.status === 'Closed');
  return Boolean(done && ticket.console && ticket.console.kbDraft === 'Review');
}

async function its10ReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== ITS10_COACH_ID) return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = await currentUser();
  if (!user) { itsConfirmCoachReceipt(event, false); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { itsConfirmCoachReceipt(event, false, wrongStudent); return; }

  const work = itsCleanCoachWork(event.data.work);
  const coachKey = `${user.userId}|${ITS10_COACH_ID}`;
  if (!its10Lab1Complete(work)) {
    itsIncompleteWalkthroughs.add(coachKey);
    itsRefreshWalkthroughNotice(user, ITS10_COACH_ID, [ITS10_LAB1_KEY], ITS10_LAB1_START);
    itsConfirmCoachReceipt(event, false, 'incomplete');
    return;
  }
  itsIncompleteWalkthroughs.delete(coachKey);

  // Submit first: Lab 2.1 counts as complete only once the portal has its
  // attempt (saved now, or already waiting or approved).
  const received = await itsSubmitWalkthroughLabs(user, 'its-10', [ITS10_LAB1_KEY], work);
  its10User = user;
  if (received) {
    const saved = LabRuntime.load(ITS10_STATE_ID, user, ITS10_DEFAULT_STATE);
    saved.consoleStarted = true;
    saved.consoleCompleted = true;
    LabRuntime.save(ITS10_STATE_ID, user, saved);
    its10State = saved;
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-10', ITS10_LAB1_KEY);
  }
  itsConfirmCoachReceipt(event, received);

  if (!document.querySelector('.its10-shell')) return;
  render();
  const section = document.getElementById('its10-lab-2-1');
  if (section) section.scrollIntoView({ block: 'start' });
}

// Lab 2.2's completion: the simulator's practice set says its three tickets
// are closed (ui/helpdesk.js hdPracticeReport; the set's `complete` list in
// ui/helpdesk-data.js). Saved once, as a lab attempt with no score and no
// answers: completion, its time and the ticket ids. Every message gets an
// answer, so the simulator can say whether it was saved.
const ITS10_PRACTICE_TICKETS = ['HD-2155', 'HD-2156', 'HD-2157'];
const ITS10_PRACTICE_LOCK_MS = 15000;
function its10StorageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
function its10StorageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* storage blocked: no lock */ } }
function its10StorageRemove(key) { try { localStorage.removeItem(key); } catch (_) { /* storage blocked */ } }

async function its10ReceivePracticeCompletion(event) {
  const data = event.data;
  if (!data || data.type !== 'mnt-practice-complete' || data.id !== 'its-10') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const reply = (saved, reason) => {
    if (!event.source || typeof event.source.postMessage !== 'function') return;
    event.source.postMessage({ type: 'mnt-practice-received', id: 'its-10', nonce: data.nonce, saved: saved === true, ...(reason ? { reason } : {}) }, event.origin);
  };
  const user = await currentUser();
  if (!user) { reply(false, 'signed-out'); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { reply(false, wrongStudent); return; }
  const tickets = Array.isArray(data.tickets) ? data.tickets : [];
  if (tickets.length !== ITS10_PRACTICE_TICKETS.length || !ITS10_PRACTICE_TICKETS.every((id) => tickets.includes(id))) { reply(false, 'incomplete'); return; }
  // Already recorded (as loaded at sign-in, or saved on this page).
  if (itsLabSubmitted(user, ITS10_PRACTICE_KEY)) { reply(true); return; }
  if (itsLabSubmitting(user, ITS10_PRACTICE_KEY)) { reply(false, 'busy'); return; }
  // lab_attempts allows many rows per lab and this lab has no
  // course_module_labs row, so the database won't refuse a second record.
  // Another course page tab in this browser may be saving right now (the
  // lock), or may already have saved (the database read): either way, no
  // second record.
  const lock = `mnt.practice-save.${user.userId}.${ITS10_PRACTICE_KEY}`;
  const held = Number(its10StorageGet(lock)) || 0;
  if (Date.now() - held < ITS10_PRACTICE_LOCK_MS) { reply(false, 'busy'); return; }
  its10StorageSet(lock, String(Date.now()));
  let saved = false;
  try {
    const existing = await its10SavedPracticeAttempt(user);
    if (existing === null) { reply(false, 'save-failed'); return; }
    if (existing) {
      user.latestLabAttemptByKey = { ...(user.latestLabAttemptByKey || {}), [ITS10_PRACTICE_KEY]: existing };
      saved = true;
    } else {
      saved = await itsSubmitLabAttempt(user, 'its-10', ITS10_PRACTICE_KEY, {
        state: 'complete', result: { source: 'mnt-practice-complete', practiceSet: 'its-10', tickets: ITS10_PRACTICE_TICKETS.slice() },
      });
    }
  } finally {
    its10StorageRemove(lock);
  }
  if (saved && typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-10', ITS10_PRACTICE_KEY);
  reply(saved, saved ? '' : 'save-failed');
  its10User = user;
  if (document.querySelector('.its10-shell')) render();
}

// The student's saved Lab 2.2 record, read from the database: the attempt
// (in the shape latestLabAttemptByKey holds), false when there is none, or
// null when the read failed. A superseded or returned record doesn't count.
async function its10SavedPracticeAttempt(user) {
  if (typeof mntSupabase === 'undefined') return null;
  try {
    const { data, error } = await mntSupabase.from('lab_attempts')
      .select('completed_at, reviewed_at, redo_requested, superseded_at')
      .eq('user_id', user.userId).eq('lab_key', ITS10_PRACTICE_KEY)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });
    if (error) { console.error('Lab 2.2 completion read failed', error); return null; }
    const row = Array.isArray(data) ? data.find((entry) => entry && !entry.superseded_at && entry.redo_requested !== true) : null;
    return row ? { completedAt: row.completed_at, reviewedAt: row.reviewed_at || null, redoRequested: row.redo_requested === true, supersededAt: row.superseded_at || null } : false;
  } catch (error) {
    console.error('Lab 2.2 completion read threw', error);
    return null;
  }
}

function its10OnMessage(event) {
  return Promise.all([its10ReceivePracticeCompletion(event), its10ReceiveCoachCompletion(event)]);
}

registerModuleLab({
  program: 'it-support', moduleNumber: 2, moduleKey: 'its-10',
  view: viewItsModuleTen, wire: wireItsModuleTenLab, onMessage: its10OnMessage,
});
