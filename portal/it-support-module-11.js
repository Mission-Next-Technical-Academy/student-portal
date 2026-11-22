/* Module 3 (key its-11) — IT Help Desk & Career Accelerator ('it-support').
 * Fictional org, tickets, and policy text; no real systems are involved.
 *
 * This file holds the Learn It content and the code that draws it:
 *   - Lesson 3.1: Reading 1, calm people and plain words (the CALM method),
 *     with a diagram of the four moves and the plain-words table.
 *   - Lesson 3.2: Reading 2 (phone, chat and email etiquette, with a diagram)
 *     and Reading 3 (escalating well and keeping users informed, with the
 *     handoff note table, a diagram and the assignment groups table).
 *   - The knowledge check: four questions with a "why" line for a right
 *     answer and an "if wrong" line for each wrong one. A program check, not
 *     an A+ objective.
 *
 * Block types (its11Blocks): h (sub-heading), h5 (a smaller heading under
 * it), p, ul, ol, note ({ title, text }), table ({ caption, head, rows }) and
 * diagram (a key of ITS11_DIAGRAMS). In p, ul and ol text, **...** is
 * emphasized. bin/its-curriculum-check.js reads each lesson's title and
 * minutes from this file: they must match portal/data.js.
 */

const ITS11_LESSONS = [
  {
    id: 'its-11-lesson-01', number: '3.1', icon: 'ri-quill-pen-line',
    title: 'Writing Notes the Next Technician Can Actually Use', minutes: 90,
    learn: [
      'Use the four CALM moves to settle a stressed caller',
      'Rewrite technical jargon as what the user needs to hear',
      'Choose words that never argue, blame anyone or promise a fix time you don’t control',
    ],
    blocks: [
      { h: 'Reading 1 · Calm people, plain words (the CALM method)' },
      { p: 'People call the help desk when work has stopped, so many callers are stressed. That’s about the situation, not about you.' },
      { p: 'CALM gives you four moves, in this order:' },
      { ol: [
        '**C**alm your own voice and let them finish.',
        '**A**cknowledge the impact (“You’ve got a client waiting; that’s stressful”).',
        '**L**ay out what you’ll do next in plain words.',
        '**M**ake a time commitment you can keep, then keep it.',
      ] },
      { p: 'Don’t argue. Don’t blame anyone: the user, another team or “IT”. Don’t promise a fix time you don’t control.' },
      { diagram: 'calm' },
      { h5: 'Translate jargon' },
      { p: 'The user hears the effect, not the cause:' },
      { table: {
        caption: 'What the technician says, and what the user hears',
        head: ['Technician says', 'User hears'],
        rows: [
          ['“Your DHCP lease failed and you got an APIPA address.”', '“Your computer didn’t get its network address, so it couldn’t reach anything. I’ve fixed that.”'],
          ['“The print spooler hung.”', '“The part of Windows that sends jobs to the printer got stuck. I’ve restarted it.”'],
          ['“Your account hit the lockout threshold.”', '“Too many wrong passwords locked your account for safety. It’s unlocked now.”'],
          ['“I’m escalating to Tier 2.”', '“I’m bringing in our specialist team, who can do the next step.”'],
        ],
      } },
      { p: 'You don’t need to know what DHCP or a spooler is yet. The point is that the user never needs to.' },
    ],
    comingUp: 'Answer a frustrated caller with CALM and plain words in the guided call (Lab 3.1).',
  },
  {
    id: 'its-11-lesson-02', number: '3.2', icon: 'ri-chat-check-line',
    title: 'Escalation Triggers, User Updates & Expectation Setting', minutes: 120,
    learn: [
      'Run a phone, chat or email conversation to the desk’s standard',
      'Name the triggers that mean a ticket should be escalated',
      'Write a handoff note a stranger can act on, and tell the user what happens next',
    ],
    blocks: [
      { h: 'Reading 2 · Phone, chat and email etiquette' },
      { h5: 'Phone' },
      { ul: [
        'Greet with your name and the desk (“Northstar Service Desk, this is Riley”).',
        'Get the caller’s name and callback number first.',
        'Ask before putting them on hold (“May I put you on a short hold while I check?”). Come back within a minute or two.',
        'Summarize before you hang up: what was done, what happens next, and the ticket number.',
      ] },
      { h5: 'Chat' },
      { ul: [
        'Reply quickly, even if only “Checking now”.',
        'Ask one question per message.',
        'Don’t paste long technical output.',
      ] },
      { h5: 'Email' },
      { ul: [
        'Write a clear subject with the ticket number.',
        'Start with a greeting, then use short paragraphs.',
        'Give the next step and when you’ll update.',
      ] },
      { h5: 'VIP users' },
      { p: 'VIP users (executives and people in critical roles) often get a faster response under company policy, but the same process. Verification, consent and approvals still apply. A VIP flag never means skipping security steps, as you practiced in Lab 1.2 with the caller from the CFO’s office.' },
      { diagram: 'channels' },
      { h: 'Reading 3 · Escalating well and keeping users informed' },
      { h5: 'When to escalate' },
      { p: 'Escalate when:' },
      { ul: [
        'The fix needs access or authority you don’t have.',
        'The approved troubleshooting path is exhausted.',
        'The issue touches security or a high-risk system.',
        'The impact has grown (more users, or a critical service).',
        'The SLA is at real risk and someone else can meet it.',
      ] },
      { p: 'Escalating isn’t failing. Holding a ticket you can’t move **is**.' },
      { h5: 'A good handoff' },
      { p: 'A good handoff is a work note a stranger can act on. It holds:' },
      { ul: [
        'The symptom, in the user’s words.',
        'What you checked and found, with evidence.',
        'What you changed.',
        'What you ruled out.',
        'The impact.',
        'The exact ask.',
      ] },
      { p: 'It’s the same Northstar note you already write, with its four labels. In a handoff, each label holds this:' },
      { table: {
        caption: 'The handoff note',
        head: ['Label', 'In a handoff, it holds'],
        rows: [
          ['Reported', 'The symptom in the user’s words, and the impact: who is affected and any deadline'],
          ['Tried', 'What you checked and found, with evidence. What you changed. What you ruled out'],
          ['Result', 'Where it stands now, and why it can’t be finished at Tier 1'],
          ['Next action', 'The exact ask: which team, what you need them to do, and by when. When the user was told they’ll hear next'],
        ],
      } },
      { p: 'A warm handoff (a call or chat to the next team, plus the note) is used for urgent and security tickets. A plain reassignment is for routine ones.' },
      { h5: 'Keep the user informed' },
      { p: 'Update the user when you escalate: who has it, what happens next, and when they’ll hear again. An honest “still working on it; next update by 3:00” builds more trust than silence.' },
      { p: 'Every customer comment does four things:' },
      { ol: [
        'It acknowledges the person.',
        'It says what happened, in plain words.',
        'It says what they need to do, if anything.',
        'It says what happens next.',
      ] },
      { diagram: 'escalate' },
      { h5: 'Who owns what: assignment groups' },
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
      { p: 'Need the priority matrix or the SLA table? They’re in Module 2, Lesson 2.2.' },
    ],
    comingUp: 'Escalate with a handoff note and tell the caller what happens next in the guided call (Lab 3.1), then work the practice tickets (Lab 3.2).',
  },
];

/* ------------------------------------------------------------ Diagrams */

/* Each diagram is drawn as inline SVG from the data below: a wide layout and
 * a narrow (phone) one, switched by a container query in the stylesheet. The
 * look comes from the its01-dg-* classes and follows the page's theme
 * variables. */
const ITS11_DIAGRAMS = {
  calm: {
    title: 'CALM: four moves when a caller is stressed',
    caption: 'Work through the four moves in order, and never argue, blame or promise a time you don’t control.',
    steps: [
      { letter: 'C', title: 'Calm your own voice', text: 'Let them finish' },
      { letter: 'A', title: 'Acknowledge the impact', text: '‘You’ve got a client waiting; that’s stressful’' },
      { letter: 'L', title: 'Lay out what you’ll do next', text: 'Plain words, no jargon' },
      { letter: 'M', title: 'Make a time commitment you can keep', text: 'Then keep it' },
    ],
    strip: 'Never: argue · blame the user, another team or ‘IT’ · promise a fix time you don’t control',
  },
  channels: {
    title: 'Three ways users reach you, one standard',
    caption: 'Phone, chat and email each have their own habits, and all three end with the next step and when you’ll update.',
    cards: [
      { title: 'Phone', lines: ['Greet with your name and the desk', 'Name and callback number first', 'Ask before a hold; back in a minute or two', 'Summarize, then give the ticket number'] },
      { title: 'Chat', lines: ['Reply fast, even ‘Checking now’', 'One question per message', 'No long technical output'] },
      { title: 'Email', lines: ['Subject with the ticket number', 'Greeting and short paragraphs', 'The next step and when you’ll update'] },
    ],
    strip: 'VIP: a faster response, the same process. Verification, consent and approvals still apply.',
  },
  escalate: {
    title: 'Escalating well: decide, hand off, tell the user',
    caption: 'Decide that it should escalate, write the handoff, hand it over the right way, then tell the user.',
    columns: [
      { title: 'Escalate when', lines: ['The fix needs access or authority you don’t have', 'The approved path is exhausted', 'It touches security or a high-risk system', 'The impact has grown', 'The SLA is at real risk and someone else can meet it'] },
      { title: 'Write the handoff', lines: ['Reported · Tried · Result · Next action', 'A stranger can act on it without calling the user'] },
      { title: 'Hand it over', branches: ['Urgent or security: warm handoff (call or chat the team, plus the note)', 'Routine: reassign with the note'] },
    ],
    strip: 'Tell the user: who has it · what happens next · when they’ll hear again',
  },
};

// Every word a diagram shows, in reading order: the screen-reader description.
function its11DiagramWords(key) {
  const d = ITS11_DIAGRAMS[key];
  if (key === 'calm') {
    const steps = d.steps.map((s) => `${s.letter}: ${s.title}. ${s.text}`).join('. Then ');
    return `Four boxes with arrows between them. ${steps}. Under all four: ${d.strip}.`;
  }
  if (key === 'channels') {
    const cards = d.cards.map((c) => `${c.title}: ${c.lines.join('; ')}`).join('. ');
    return `Three cards side by side. ${cards}. Under all three: ${d.strip}`;
  }
  const [a, b, c] = d.columns;
  return `Three columns with arrows between them. ${a.title}: ${a.lines.join('; ')}. Then ${b.title}: ${b.lines.join('; ')}. Then ${c.title}, in two branches: ${c.branches.join('; ')}. Under all three: ${d.strip}`;
}

// Splits text into lines of at most max characters, at word breaks.
function its11Wrap(text, max) {
  const lines = [];
  let line = '';
  String(text).split(/\s+/).forEach((word) => {
    if (line && (line.length + 1 + word.length) > max) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  });
  if (line) lines.push(line);
  return lines;
}

const ITS11_DG = { pad: 12, title: 15, text: 13, lh: 18, charW: 0.56, gap: 5, indent: 9 };

// One box's wrapped lines: [{ text, cls, dx, dy }], laid out for width w.
// With box.bullets, each item in box.lines starts with a bullet and gets a
// little space above it.
function its11BoxLines(box, w) {
  const inner = w - ITS11_DG.pad * 2;
  const titleMax = Math.max(8, Math.floor(inner / (ITS11_DG.title * ITS11_DG.charW)));
  const textMax = Math.max(8, Math.floor(inner / (ITS11_DG.text * ITS11_DG.charW)));
  const out = [];
  let dy = 0;
  const push = (text, cls, dx = 0) => { out.push({ text, cls, dx, dy }); dy += ITS11_DG.lh; };
  its11Wrap(box.title || '', titleMax).forEach((text) => push(text, 'its01-dg-title'));
  if (box.sub) its11Wrap(box.sub, textMax).forEach((text) => push(text, 'its01-dg-sub'));
  (box.lines || []).forEach((item, i) => {
    if (box.bullets) {
      if (i || out.length) dy += ITS11_DG.gap;
      its11Wrap(item, textMax - 3).forEach((text, j) => push(j ? text : `• ${text}`, 'its01-dg-text', j ? ITS11_DG.indent : 0));
    } else {
      its11Wrap(item, textMax).forEach((text) => push(text, 'its01-dg-text'));
    }
  });
  if (box.text) its11Wrap(box.text, textMax).forEach((text) => push(text, 'its01-dg-text'));
  return out;
}
function its11BoxHeight(box, w) {
  const lines = its11BoxLines(box, w);
  const used = lines.length ? lines[lines.length - 1].dy + ITS11_DG.lh : 0;
  return ITS11_DG.pad * 2 + used + 4;
}
function its11Box(box, x, y, w, h) {
  const text = its11BoxLines(box, w).map((line) => `<text class="${line.cls}" x="${x + ITS11_DG.pad + line.dx}" y="${y + ITS11_DG.pad + 14 + line.dy}">${esc(line.text)}</text>`).join('');
  return `<rect class="its01-dg-box${box.hl ? ' its01-dg-hl' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>${text}`;
}
function its11Arrow(x1, y1, x2, y2, id, hl, both) {
  const ref = `url(#${id}${hl ? '-hl' : ''})`;
  return `<line class="its01-dg-line${hl ? ' its01-dg-line-hl' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="${ref}"${both ? ` marker-start="${ref}"` : ''}/>`;
}
function its11Markers(id) {
  const marker = (suffix, cls) => `<marker id="${id}${suffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="${cls}" d="M0,0 L10,5 L0,10 z"/></marker>`;
  return `<defs>${marker('', 'its01-dg-head')}${marker('-hl', 'its01-dg-head its01-dg-head-hl')}</defs>`;
}
function its11Svg(key, layout, width, height, body) {
  const d = ITS11_DIAGRAMS[key];
  return `<svg class="its01-dg-${layout}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(d.title)}" aria-describedby="its11-dg-${key}-desc" focusable="false">${body}</svg>`;
}
// A numbered circle (the CALM letters), centred on cx, cy.
function its11Badge(letter, cx, cy) {
  return `<circle class="its01-dg-num" cx="${cx}" cy="${cy}" r="14"/><text class="its01-dg-num-text" x="${cx}" y="${cy + 5}" text-anchor="middle">${esc(letter)}</text>`;
}
// The strip under a diagram: one full-width highlighted box.
function its11Strip(text, y, width) {
  const box = { text, hl: true };
  const h = its11BoxHeight(box, width);
  return { svg: its11Box(box, 0, y, width, h), h };
}

function its11CalmSvg(layout) {
  const d = ITS11_DIAGRAMS.calm;
  const id = `its11-dg-calm-${layout}-arrow`;
  let body = its11Markers(id);

  if (layout === 'wide') {
    const w = 168, gap = 32, width = 4 * w + 3 * gap;
    const top = 34;
    const h = Math.max(...d.steps.map((s) => its11BoxHeight(s, w)));
    d.steps.forEach((s, i) => {
      const x = i * (w + gap);
      body += its11Badge(s.letter, x + w / 2, 15);
      body += its11Box(s, x, top, w, h);
      if (i) body += its11Arrow(x - gap + 4, top + h / 2, x - 4, top + h / 2, id);
    });
    const strip = its11Strip(d.strip, top + h + 18, width);
    body += strip.svg;
    return its11Svg('calm', layout, width, top + h + 18 + strip.h + 4, body);
  }

  const width = 320, x = 10, w = 300, gap = 28;
  let y = 4;
  d.steps.forEach((s, i) => {
    if (i) { body += its11Arrow(x + w / 2, y + 3, x + w / 2, y + gap - 3, id); y += gap; }
    body += its11Badge(s.letter, x + w / 2, y + 15);
    y += 34;
    const h = its11BoxHeight(s, w);
    body += its11Box(s, x, y, w, h);
    y += h;
  });
  y += 18;
  const strip = its11Strip(d.strip, y, w);
  body += `<g transform="translate(${x} 0)">${strip.svg}</g>`;
  return its11Svg('calm', layout, width, y + strip.h + 4, body);
}

function its11ChannelsSvg(layout) {
  const d = ITS11_DIAGRAMS.channels;
  let body = '';
  const cards = d.cards.map((c) => ({ ...c, bullets: true }));

  if (layout === 'wide') {
    const cw = 240, gap = 24, width = 3 * cw + 2 * gap;
    const h = Math.max(...cards.map((c) => its11BoxHeight(c, cw)));
    cards.forEach((c, i) => { body += its11Box(c, i * (cw + gap), 4, cw, h); });
    const strip = its11Strip(d.strip, 4 + h + 18, width);
    body += strip.svg;
    return its11Svg('channels', layout, width, 4 + h + 18 + strip.h + 4, body);
  }

  const width = 320, x = 10, w = 300;
  let y = 4;
  cards.forEach((c) => {
    const h = its11BoxHeight(c, w);
    body += its11Box(c, x, y, w, h);
    y += h + 14;
  });
  y += 4;
  const strip = its11Strip(d.strip, y, w);
  body += `<g transform="translate(${x} 0)">${strip.svg}</g>`;
  return its11Svg('channels', layout, width, y + strip.h + 4, body);
}

function its11EscalateSvg(layout) {
  const d = ITS11_DIAGRAMS.escalate;
  const id = `its11-dg-escalate-${layout}-arrow`;
  const [c1, c2, c3] = d.columns;
  const box1 = { lines: c1.lines, bullets: true };
  const box2 = { lines: c2.lines, bullets: true };
  const branches = c3.branches.map((text) => ({ text }));
  let body = its11Markers(id);

  if (layout === 'wide') {
    const ws = [250, 220, 250], gap = 24, width = 768;
    const xs = [0, ws[0] + gap, ws[0] + ws[1] + 2 * gap];
    const headY = 18, top = 30, bgap = 10;
    const hA = its11BoxHeight(branches[0], ws[2]);
    const hB = its11BoxHeight(branches[1], ws[2]);
    const h = Math.max(its11BoxHeight(box1, ws[0]), its11BoxHeight(box2, ws[1]), hA + hB + bgap);
    const extra = (h - (hA + hB + bgap)) / 2;
    d.columns.forEach((c, i) => { body += `<text class="its01-dg-title" x="${xs[i] + ITS11_DG.pad}" y="${headY}">${esc(c.title)}</text>`; });
    body += its11Box(box1, xs[0], top, ws[0], h);
    body += its11Box(box2, xs[1], top, ws[1], h);
    body += its11Box(branches[0], xs[2], top, ws[2], hA + extra);
    body += its11Box(branches[1], xs[2], top + hA + extra + bgap, ws[2], hB + extra);
    body += its11Arrow(ws[0] + 4, top + h / 2, xs[1] - 4, top + h / 2, id);
    body += its11Arrow(xs[1] + ws[1] + 4, top + h / 2, xs[2] - 4, top + h / 2, id);
    const strip = its11Strip(d.strip, top + h + 18, width);
    body += strip.svg;
    return its11Svg('escalate', layout, width, top + h + 18 + strip.h + 4, body);
  }

  const width = 320, x = 10, w = 300;
  let y = 4;
  const heading = (text) => {
    body += `<text class="its01-dg-title" x="${x + ITS11_DG.pad}" y="${y + 16}">${esc(text)}</text>`;
    y += 26;
  };
  const arrow = () => {
    body += its11Arrow(x + w / 2, y + 3, x + w / 2, y + 22, id);
    y += 28;
  };
  heading(c1.title);
  const h1 = its11BoxHeight(box1, w);
  body += its11Box(box1, x, y, w, h1);
  y += h1;
  arrow();
  heading(c2.title);
  const h2 = its11BoxHeight(box2, w);
  body += its11Box(box2, x, y, w, h2);
  y += h2;
  arrow();
  heading(c3.title);
  branches.forEach((b) => {
    const h = its11BoxHeight(b, w);
    body += its11Box(b, x, y, w, h);
    y += h + 10;
  });
  y += 8;
  const strip = its11Strip(d.strip, y, w);
  body += `<g transform="translate(${x} 0)">${strip.svg}</g>`;
  return its11Svg('escalate', layout, width, y + strip.h + 4, body);
}

const ITS11_DIAGRAM_DRAW = { calm: its11CalmSvg, channels: its11ChannelsSvg, escalate: its11EscalateSvg };

function its11Diagram(key) {
  const d = ITS11_DIAGRAMS[key];
  const draw = ITS11_DIAGRAM_DRAW[key];
  if (!d || !draw) return '';
  return `<figure class="its01-dg" data-its11-diagram="${esc(key)}">
    <p class="its01-dg-heading">${esc(d.title)}</p>
    ${draw('wide')}
    ${draw('narrow')}
    <p class="its01-sr-only" id="its11-dg-${esc(key)}-desc">${esc(its11DiagramWords(key))}</p>
    <figcaption>${esc(d.caption)}</figcaption>
  </figure>`;
}

/* ------------------------------------------------------------- Lessons */

// Escaped text; **...** becomes emphasized text. It runs on the escaped
// text, so no markup gets in.
function its11Text(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function its11Table(table) {
  const caption = esc(table.caption);
  const head = table.head.map((cell) => `<th scope="col">${esc(cell)}</th>`).join('');
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('');
  return `<div class="its10-table-wrap" tabindex="0" role="region" aria-label="${caption}"><table class="its10-table"><caption>${caption}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function its11Blocks(blocks) {
  return blocks.map((block) => {
    if (block.h) return `<h4>${esc(block.h)}</h4>`;
    if (block.h5) return `<h5>${esc(block.h5)}</h5>`;
    if (block.p) return `<p>${its11Text(block.p)}</p>`;
    if (block.ul) return `<ul>${block.ul.map((item) => `<li>${its11Text(item)}</li>`).join('')}</ul>`;
    if (block.ol) return `<ol>${block.ol.map((item) => `<li>${its11Text(item)}</li>`).join('')}</ol>`;
    if (block.table) return its11Table(block.table);
    if (block.diagram) return its11Diagram(block.diagram);
    if (block.note) return `<div class="its01-note"><strong>${esc(block.note.title)}</strong><p>${esc(block.note.text)}</p></div>`;
    return '';
  }).join('');
}

function its11LessonCard(lesson) {
  return `<details class="its01-lesson" data-its11-lesson="${esc(lesson.id)}">
    <summary><span class="its01-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(lesson.number)} · ${esc(lesson.title)}</strong><small>${formatInstructionalMinutes(lesson.minutes)}</small></span><i class="ri-arrow-down-s-line its01-chevron" aria-hidden="true"></i></summary>
    <div class="its01-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${lesson.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${its11Blocks(lesson.blocks)}
      ${lesson.comingUp ? `<div class="its01-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(lesson.comingUp)}</span></div>` : ''}
    </div>
  </details>`;
}

/* ------------------------------------------------------ Knowledge check */

/* A program check, not an A+ objective. Same shape as one entry of Module 1's
 * checks: a right pick shows its why line, a wrong pick shows its ifWrong
 * line (never the right answer). ifWrong has null on the right answer. The
 * page shuffles the choices for each student. */
const ITS11_CHECK = {
  title: 'Knowledge check',
  intro: 'Four questions on the two lessons. It’s complete when 3 or more of your first answers are right. Retake it as often as you like.',
  questions: [
    { q: 'A caller is shouting about a missed deadline. What should you do first?',
      choices: ['Tell them to calm down', 'Let them finish, then acknowledge the impact', 'Put them on hold', 'Transfer to a supervisor'], answer: 1,
      why: 'CALM starts with your own calm and letting them finish, then naming the impact. People settle once they know they’ve been heard (Reading 1).',
      ifWrong: ['Telling a stressed person to calm down says their reaction is the problem, and it makes things worse.', null, 'A hold before they’ve finished feels like being cut off, and you always ask before a hold.', 'A stressed caller isn’t a reason to escalate. This call is yours to handle.'] },
    { q: 'Which is the best plain-language version of “Your DHCP lease expired”?',
      choices: ['“The DHCP server is down”', '“Your computer lost its network address for a moment; I’ve fixed it”', '“It’s a layer-3 issue”', '“It’s your router.”'], answer: 1,
      why: 'The user needs the effect and to hear that it’s fixed, in words they already use (Reading 1’s table).',
      ifWrong: ['This keeps the jargon and changes the facts.', null, 'This is more jargon, not less.', 'This is plain, but it blames their equipment and isn’t what happened.'] },
    { q: 'When is a warm handoff expected?',
      choices: ['Every ticket', 'Urgent and security tickets', 'Only requests', 'Never'], answer: 1,
      why: 'A call or chat to the next team, plus the note, makes sure an urgent or security ticket is picked up now and not when someone next checks the queue (Reading 3).',
      ifWrong: ['Routine tickets go by plain reassignment with a good note, and calling for each one slows both teams.', null, 'The kind of record doesn’t decide it. Urgency and security do.', 'For urgent and security tickets, a warm handoff is expected.'] },
    { q: 'A ticket you escalated has had no update for two days and the user is chasing. What do you do?',
      choices: ['Open a new ticket', 'Tell the user the other team is slow', 'Chase the owning team, then give the user a specific update and follow up yourself', 'Close the ticket'], answer: 2,
      why: 'You still own the user’s experience after you escalate. Chase the team that has it, give the user a specific update, and check that it happened (Reading 3).',
      ifWrong: ['A new ticket splits the history and restarts the clock, and the first ticket is still open.', 'This blames colleagues and gives the user nothing to act on.', null, 'Closing the ticket is wrong because the problem isn’t fixed.'] },
  ],
};

/* ------------------------------------------------------- Objective, sources */

// The weekly objective, shown in the hero.
const ITS11_OBJECTIVE = 'By the end of this module you can calm a frustrated or panicked user, explain a technical problem without jargon, and run a phone, chat or email conversation professionally. You can recognize when to escalate, hand a ticket off so nobody repeats work, and update users honestly without overpromising.';

const ITS11_SOURCES = [
  { title: 'CompTIA A+ Certification', org: 'CompTIA', url: 'https://www.comptia.org/certifications/a', note: 'A public reference for the certification this course’s content lines up with. This module’s check is a program check, not an A+ objective. No certification exam is required to finish the program.' },
];

/* ----------------------------------------------------------- Page state */

// Saved to the student's account (module_progress.case_state): the
// knowledge check's "complete" and its time, and whether the walkthrough was
// started. Never answers or a score.
const ITS11_STATE_ID = 'its11-page-v1';
// Students see the guided lab as Lab 3.1; its key is older than that
// numbering. Lab 3.1 is Module 3's gating lab (course_module_labs) until the
// Prove It opens, so an instructor still reviews it.
const ITS11_LAB1_KEY = 'lab-its-11-handoff-documentation';
const ITS11_PRACTICE_KEY = 'lab-its-11-practice-tickets';
const ITS11_PROVE_KEY = 'lab-its-11-prove-it';
const ITS11_LAB_KEYS = [ITS11_LAB1_KEY, ITS11_PRACTICE_KEY, ITS11_PROVE_KEY];
const ITS11_COACH_ID = 'hd-m11';
const ITS11_LAB1_START = 'Start Lab 3.1 walkthrough';
// Lab 3.1's ticket stays open with the next team, so this page doesn't use
// the shared "resolve it" wording.
const ITS11_LAB1_INCOMPLETE = 'Your walkthrough wasn’t saved: the call isn’t finished yet. Your work is still in the simulator. Finish every step there, including the update at the follow-up time, then press Finish again.';

const ITS11_DEFAULT_STATE = {
  checkCompleted: false, checkCompletedAt: null,
  consoleStarted: false, consoleCompleted: false,
};

let its11State = null;
let its11User = null;

function its11Load(user) {
  // Check answers live in page memory: a different student signing in
  // without a reload starts the check fresh.
  const userId = user && user.userId;
  if (userId !== its11CheckAnswersUser) {
    its11CheckAnswersUser = userId;
    its11CheckAnswers = {};
    its11CheckPicks = {};
    its11CheckSaveFailed = false;
  }
  its11User = user;
  its11State = LabRuntime.loadCaseState(ITS11_STATE_ID, 'its-11', user, ITS11_DEFAULT_STATE);
  // The simulator's popup message is the only way a walkthrough is recorded;
  // a return by link only shows that it wasn't (see itsNoteCoachReturn).
  itsNoteCoachReturn(user, ITS11_COACH_ID, [ITS11_LAB1_KEY]);
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-11');
  return its11State;
}

function its11Save(onResult) {
  if (its11User && its11State) LabRuntime.saveCaseState(ITS11_STATE_ID, 'its-11', its11User, its11State, onResult ? { onResult } : {});
}

function its11Day(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

/* ------------------------------------------------------- Knowledge check */

/* One check, answered one question at a time, as on Modules 1 and 2. A wrong
 * pick shows why that choice is wrong, never the right answer, and the student
 * picks again. A right pick shows the Why. Only the first pick on each question
 * counts. The check is complete when 70% or more of the first picks are right
 * (3 of 4). Once complete it stays complete; Start again is a retake. No lab
 * attempt, no lab key, gates nothing. */
const ITS11_LETTERS = ['A', 'B', 'C', 'D'];
const ITS11_CHECK_PASS_TENTHS = 7;

// This page's picks, kept in page memory only (a reload starts again), by the
// choice's place in ITS11_CHECK, never its place on screen:
//   its11CheckAnswers: { questionIndex: the first pick }, the one that counts.
//   its11CheckPicks: { questionIndex: [every pick, in order] }.
let its11CheckAnswers = {};
let its11CheckPicks = {};
let its11CheckSaveFailed = false;
let its11CheckAnswersUser = null;

// The order a student sees a question's choices in: shuffled from their
// anonymous id and the question, so it differs between students and stays the
// same for one student on every redraw and reload.
function its11ChoiceOrder(index) {
  const question = ITS11_CHECK.questions[index];
  const key = `${its11User ? LabRuntime.anonymousStudentId(its11User) : ''}|its-11|${index}`;
  let n = 2166136261;
  for (const ch of key) n = Math.imul(n ^ ch.charCodeAt(0), 16777619) >>> 0;
  const order = question.choices.map((_, c) => c);
  for (let i = order.length - 1; i > 0; i -= 1) {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((n / 4294967296) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function its11CheckDone() {
  return ITS11_CHECK.questions.every((_, i) => Object.prototype.hasOwnProperty.call(its11CheckAnswers, i));
}
// Whole numbers only, so 2.8 of 4 can never round down to a pass.
function its11CheckPassed() {
  const total = ITS11_CHECK.questions.length;
  const right = ITS11_CHECK.questions.filter((question, i) => its11CheckAnswers[i] === question.answer).length;
  return right * 10 >= total * ITS11_CHECK_PASS_TENTHS;
}
function its11CheckCompleted() {
  return Boolean(its11State && its11State.checkCompleted === true);
}

function its11CheckQuestion(question, index) {
  const picks = its11CheckPicks[index] || [];
  const last = picks.length ? picks[picks.length - 1] : undefined;
  const settled = picks.includes(question.answer);
  // Only the student's own picks are marked: a wrong pick never marks or
  // names the right answer.
  const choices = its11ChoiceOrder(index).map((c, place) => {
    const picked = picks.includes(c);
    const cls = picked ? (c === question.answer ? ' is-answer' : ' is-wrong') : '';
    return `<button type="button" class="its01-choice${cls}" data-its11-answer data-q="${index}" data-choice="${c}" aria-pressed="${picked}" ${settled || picked ? 'disabled' : ''}><span>${ITS11_LETTERS[place]}</span> ${esc(question.choices[c])}</button>`;
  }).join('');
  const why = settled && question.why ? `<p class="its01-check-why">${esc(question.why)}</p>` : '';
  const wrongLine = !settled && last !== undefined && question.ifWrong && question.ifWrong[last] ? `<p class="its01-check-why">${esc(question.ifWrong[last])}</p>` : '';
  const feedback = last === undefined ? ''
    : settled
      ? `<p class="its01-check-result is-right"><i class="ri-check-line" aria-hidden="true"></i> <strong>Correct.</strong></p>${why}`
      : `<p class="its01-check-result is-wrong"><i class="ri-close-line" aria-hidden="true"></i> <strong>Not quite.</strong> Try another answer.</p>${wrongLine}`;
  return `<li class="its01-check-q">
    <p class="its01-check-prompt" id="its11-check-q${index}">${esc(question.q)}</p>
    <div class="its01-choices" role="group" aria-labelledby="its11-check-q${index}">${choices}</div>
    <div class="its01-check-feedback" id="its11-check-q${index}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

// The status line: a completion the account didn't save asks to try the save
// again; a failed full pass asks for a retake (no score shown); otherwise a
// saved completion shows with its date.
function its11CheckFooter() {
  const anyAnswered = Object.keys(its11CheckAnswers).length > 0;
  const reset = anyAnswered ? '<button type="button" class="its01-check-reset" data-its11-check-reset><i class="ri-restart-line" aria-hidden="true"></i> Start again</button>' : '';
  const saveFailed = its11CheckSaveFailed && its11CheckDone() && its11CheckPassed();
  const retry = saveFailed ? '<button type="button" class="its01-check-reset" data-its11-check-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try again</button>' : '';
  let status = '';
  if (saveFailed) {
    status = '<i class="ri-error-warning-line" aria-hidden="true"></i> Your result didn’t save. Try again.';
  } else if (its11CheckDone() && !its11CheckPassed()) {
    status = 'Retake: you need 3 of 4. Press Start again to retake the check.';
  } else if (its11CheckCompleted()) {
    const day = its11Day(its11State.checkCompletedAt);
    status = `<i class="ri-check-line" aria-hidden="true"></i> ${esc(ITS11_CHECK.title)} complete${day ? ` (${esc(day)})` : ''}. You can retake it any time.`;
  }
  return `<div class="its01-check-footer" data-its11-check-footer><p class="its01-check-status" role="status" tabindex="-1">${status}</p><span class="its01-check-actions">${retry}${reset}</span></div>`;
}

function its11Check() {
  return `<div class="its01-check" data-its11-check id="its11-check">
    <h3>${esc(ITS11_CHECK.title)}</h3>
    <p class="its01-instruction">${esc(ITS11_CHECK.intro)}</p>
    <ol class="its01-check-list">${ITS11_CHECK.questions.map((question, i) => its11CheckQuestion(question, i)).join('')}</ol>
    ${its11CheckFooter()}
  </div>`;
}

/* ------------------------------------------------------------- Sections */

function its11Learn() {
  return `<section class="its01-section" id="its11-lessons" aria-labelledby="its11-lessons-title">
    <div class="its01-section-heading"><span>L</span><div><p class="its01-kicker">Learn It</p><h2 id="its11-lessons-title">Three readings</h2></div></div>
    <p class="its01-instruction">Two lessons hold the three readings: Reading 1 in Lesson 3.1, Readings 2 and 3 in Lesson 3.2. Open each lesson for the readings, the reference tables and the diagrams, then try the knowledge check below.</p>
    <div class="its01-lesson-grid">${ITS11_LESSONS.map(its11LessonCard).join('')}</div>
  </section>`;
}

function its11Checks() {
  return `<section class="its01-section" id="its11-checks" aria-labelledby="its11-checks-title">
    <div class="its01-section-heading"><span><i class="ri-question-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Learn It · not graded</p><h2 id="its11-checks-title">Check your understanding</h2></div></div>
    <p class="its01-instruction">Choose an answer. A wrong answer tells you why it’s wrong, and you try again; a right one tells you why it’s right. Your first answer to each question is the one that counts. Not graded: your answers aren’t sent to your instructor.</p>
    ${its11Check()}
  </section>`;
}

// Lab 3.1: the hd-m11 coach on one phone call in the IT Service Desk
// simulator (ui/helpdesk-coaches.js). Feedback only: no score.
function its11Lab1() {
  const button = itsWalkthroughButton(its11User, [ITS11_LAB1_KEY]);
  return `<section class="its01-section its01-lab-section" id="its11-lab-3-1" aria-labelledby="its11-lab-3-1-title">
    <div class="its01-section-heading"><span>1</span><div><p class="its01-kicker">Practice It · coached</p><h2 id="its11-lab-3-1-title">${esc(itsLabTitle(ITS11_LAB1_KEY))}</h2></div></div>
    <p class="its01-instruction">Take a call from Wes Turner, whose laptop has been slow for days and who has a deadline today. In the IT Service Desk simulator you greet him, let him finish, ask your questions, put him on a short hold, explain the next step in plain words, hand the ticket to the desktop team with a note they can act on, and keep the update time you promised. A coach guides each step.</p>
    <p class="its01-instruction">A mood meter shows how he feels. Feedback only, no score. Your instructor reviews your finished call.</p>
    <a class="itsw-evidence-button" data-its11-console-launch href="${esc(itsCoachLaunchHref(ITS11_COACH_ID, its11User))}" target="_blank" rel="opener">
      <i class="${button.icon}" aria-hidden="true"></i> ${{ redo: 'Redo the walkthrough', review: 'Review the walkthrough', start: ITS11_LAB1_START }[button.mode]}
    </a>
    ${itsWalkthroughNoticeHtml(its11User, ITS11_COACH_ID, [ITS11_LAB1_KEY], ITS11_LAB1_START, ITS11_LAB1_INCOMPLETE)}
    ${itsLabStatusHtml(its11User, ITS11_LAB1_KEY, { label: 'Lab 3.1', prefix: 'its01', pendingText: 'Complete the guided walkthrough in the simulator to finish this lab.' })}
    ${itsRedoNoticeHtml(its11User, [{ key: ITS11_LAB1_KEY, action: 'Run the walkthrough again to resubmit this lab.' }])}
  </section>`;
}

// Lab 3.2, Module 3's three unguided tickets, not graded: the simulator opens
// just these tickets in their own saved shift (?practice=its-11,
// ui/helpdesk.js), with feedback but no score. Opened with an opener, so once
// all three are done the simulator can report it
// (its11ReceivePracticeCompletion).
function its11PracticeTicketsHref(user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?practice=its-11&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
}
function its11PracticeTickets() {
  return `<section class="its01-section its01-lab-section" id="its11-practice-tickets" aria-labelledby="its11-practice-tickets-title">
    <div class="its01-section-heading"><span>2</span><div><p class="its01-kicker">Practice It · on your own</p><h2 id="its11-practice-tickets-title">${esc(itsLabTitle(ITS11_PRACTICE_KEY))}</h2></div></div>
    <p class="its01-instruction">Three tickets to work on your own: Priya Nair’s email won’t send and her client is waiting, Karen Holt wants a new laptop for the CFO by tomorrow morning, and Sofia Martin says nobody has called her back. Use CALM, search the knowledge base, and only promise a time your team or the owning team has given you. Press Check my work on a ticket for feedback.</p>
    <p class="its01-instruction">If a ticket has a Message another team card, you’ll find it just above Work notes; use it when another team owns the next step and you need their answer or a time.</p>
    <p class="its01-instruction">Practice: not graded. Your answers aren’t sent. Finish all three tickets: resolve the ones you can fix. For the others, make sure the right team has the ticket, tell the user when they’ll hear next, and set a Follow-up. The simulator then tells this page, and your account records that you completed Lab 3.2.</p>
    <a class="itsw-evidence-button" data-its11-practice-launch href="${esc(its11PracticeTicketsHref(its11User))}" target="_blank" rel="opener">
      <i class="ri-play-list-line" aria-hidden="true"></i> Open the practice tickets
    </a>
    ${itsLabStatusHtml(its11User, ITS11_PRACTICE_KEY, { label: 'Lab 3.2', prefix: 'its01', pendingText: 'Finish all three tickets: resolve each one, or hand it on and set a Follow-up.' })}
  </section>`;
}

// The Prove It opens nothing yet: its simulator shift isn't built.
function its11Prove() {
  return `<section class="its01-section its01-lab-section" id="its11-prove-it" aria-labelledby="its11-prove-it-title">
    <div class="its01-section-heading"><span>3</span><div><p class="its01-kicker">Prove It · Assessment Lab · instructor reviewed</p><h2 id="its11-prove-it-title">${esc(itsLabTitle(ITS11_PROVE_KEY))}</h2></div></div>
    <p class="its01-instruction">Work a new ticket on your own in the IT Service Desk simulator: no coach, no hints and no feedback before you submit. Your instructor reviews your work.</p>
    <p class="its01-lab-status its01-status-pending" data-its11-prove-soon role="status"><i class="ri-time-line" aria-hidden="true"></i> Opens soon. Nothing to do here yet: work Labs 3.1 and 3.2 first.</p>
  </section>`;
}

function its11Sources() {
  return `<div class="msources-block">
    <h3 class="msources-title">Further Reading</h3>
    <ul class="msources-list">
      ${ITS11_SOURCES.map((source) => `<li class="msources-item">
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
 * neverLocked keeps it open while Lab 3.1 isn't done. */
function its11NavSections(user) {
  return [
    { id: 'lessons', title: 'Readings', type: 'lecture', phase: 'learn', isComplete: true, scrollId: 'its11-lessons' },
    { id: 'guided-call', title: 'Guided call walkthrough', navTitle: 'Lab 3.1 · Guided Lab', type: 'lab', ...itsLabRail(user, [ITS11_LAB1_KEY]), scrollId: 'its11-lab-3-1' },
    // Counts toward the percent, but never locked: the practice tickets can
    // be opened at any time.
    { id: 'unguided', title: 'Lab 3.2 · Practice tickets', navTitle: 'Lab 3.2 · Practice tickets', type: 'lab', phase: 'practice', neverLocked: true, ...itsLabRail(user, [ITS11_PRACTICE_KEY]), scrollId: 'its11-practice-tickets' },
    // Named so the platform's generic Assessment Lab box isn't added
    // (normalizeModuleStages).
    { id: 'assessment', title: 'Assessment Lab', type: 'review', neverLocked: true, ...itsLabRail(user, [ITS11_PROVE_KEY]), scrollId: 'its11-prove-it' },
    { id: 'learn-check', title: 'Knowledge check', type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its11CheckCompleted(), scrollId: 'its11-check' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'its11-sources', gated: false, supplemental: true },
  ];
}
function its11Rail(user) {
  return moduleProgressShell(its11NavSections(user), { moduleKey: 'its11', stageKey: 'its-11' });
}

function viewItsModuleThreePage(user, program) {
  its11Load(user);
  const module = program.modules['its-11'];
  return `<div class="its11-shell">
    ${moduleTopbar(user, program)}
    ${its11Rail(user)}
    <main class="its01-main">
      <section class="its01-hero" aria-labelledby="its11-title"><div><p class="its01-kicker">Module 03 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 2</p><h1 id="its11-title">${esc(module.title)}</h1><p class="its01-lede">${esc(ITS11_OBJECTIVE)}</p></div><dl class="its01-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${module.lessons}</dd></div><div><dt>Guided labs</dt><dd>1</dd></div><div><dt>Labs</dt><dd id="its11-status">${itsLabCounterText(user, ITS11_LAB_KEYS)}</dd></div></dl></section>

      ${its11Learn()}
      ${its11Checks()}
      ${its11Lab1()}
      ${its11PracticeTickets()}
      ${its11Prove()}

      <section class="its01-section" id="its11-sources" aria-labelledby="its11-sources-title"><div class="its01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Reference — not a graded step</p><h2 id="its11-sources-title">Sources &amp; Further Reading</h2></div></div>${its11Sources()}</section>
    </main>
  </div>`;
}

/* ----------------------------------------------------------- Re-renders */

// Updates the rail's rows and percent in place, so its open groups, drawer
// and listeners stay as they are.
function its11RefreshRail() {
  const rail = document.querySelector('.its11-shell [data-mquick-nav-rail]');
  if (!rail || !its11User) return;
  const holder = document.createElement('div');
  holder.innerHTML = its11Rail(its11User);
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

function its11RenderCheck(focusIndex) {
  const el = document.querySelector('.its11-shell [data-its11-check]');
  if (el) el.outerHTML = its11Check();
  if (focusIndex !== undefined) {
    const target = document.getElementById(`its11-check-q${focusIndex}-feedback`);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }
  its11RefreshRail();
}

/* -------------------------------------------------------------- Actions */

// One pick on one question, as on Module 1. The check is complete, and saved
// as such (complete and its time only), the first time a full pass of first
// picks passes.
function its11Answer(index, choice) {
  const question = ITS11_CHECK.questions[index];
  if (!question || !(choice >= 0 && choice < question.choices.length)) return;
  const picks = its11CheckPicks[index] || [];
  if (picks.includes(question.answer) || picks.includes(choice)) return;
  its11CheckPicks[index] = picks.concat(choice);
  if (its11CheckAnswers[index] === undefined) its11CheckAnswers[index] = choice;
  if (its11State && its11CheckDone() && its11CheckPassed() && its11State.checkCompleted !== true) its11SaveCheckDone();
  its11RenderCheck(index);
}

// Ticks the check and saves it, as Module 1's checks do. Only an explicit
// false from the save takes the tick off again (an unknown result leaves it),
// and only if the same student still has the same completion (a render
// reloads its11State, so it's matched by its time, not by object). The untick
// is saved the same way, so this page, this browser's copy and the session's
// copy of the row agree.
function its11SaveCheckDone() {
  const userId = its11User && its11User.userId;
  const at = new Date().toISOString();
  its11State.checkCompleted = true;
  its11State.checkCompletedAt = at;
  its11CheckSaveFailed = false;
  its11Save((ok) => {
    const state = its11State;
    if (ok !== false || !state || !its11User || its11User.userId !== userId || state.checkCompletedAt !== at) return;
    state.checkCompleted = false;
    state.checkCompletedAt = null;
    its11CheckSaveFailed = true;
    its11Save();
    // Keep focus where it was, unless it was on a button this render removes.
    const active = document.activeElement;
    const footer = document.querySelector('.its11-shell [data-its11-check-footer]');
    const focusInFooter = Boolean(footer && active && footer.contains && footer.contains(active));
    its11RenderCheck();
    if (focusInFooter) its11FocusCheckStatus();
  });
}

function its11FocusCheckStatus() {
  const status = document.querySelector('.its11-shell [data-its11-check-footer] .its01-check-status');
  if (status && typeof status.focus === 'function') status.focus({ preventScroll: true });
}

// Try again: the answers are still in page memory, so save the pass again.
function its11RetryCheckSave() {
  if (!its11CheckSaveFailed || !its11State || !its11CheckDone() || !its11CheckPassed()) return;
  its11SaveCheckDone();
  its11RenderCheck();
  its11FocusCheckStatus();
}

function its11ResetCheck() {
  its11CheckAnswers = {};
  its11CheckPicks = {};
  its11CheckSaveFailed = false;
  its11RenderCheck();
  const first = document.querySelector('.its11-shell [data-its11-check] [data-its11-answer]');
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
}

function wireItsModuleThreePage() {
  const shell = document.querySelector('.its11-shell');
  if (!shell || !its11State) return;
  shell.addEventListener('click', (event) => {
    const answer = event.target.closest('[data-its11-answer]');
    if (answer) {
      if (!answer.disabled) its11Answer(Number(answer.dataset.q), Number(answer.dataset.choice));
      return;
    }
    if (event.target.closest('[data-its11-check-reset]')) {
      its11ResetCheck();
      return;
    }
    if (event.target.closest('[data-its11-check-retry]')) {
      its11RetryCheckSave();
      return;
    }
    const launch = event.target.closest('[data-its11-console-launch]');
    if (launch) {
      if (itsLaunchWalkthrough(event, launch, its11User, ITS11_COACH_ID)) {
        its11State.consoleStarted = true;
        its11Save();
      }
      itsRefreshWalkthroughNotice(its11User, ITS11_COACH_ID, [ITS11_LAB1_KEY], ITS11_LAB1_START, ITS11_LAB1_INCOMPLETE);
    }
  });
}

/* ------------------------------------------- Lab 3.1 and Lab 3.2 saves */

// Lab 3.1's finished work: the coach's last work step, read from the cleaned
// snapshot (itsCleanCoachWork): the call ticket HD-2164 with its update posted
// at the follow-up time (updated, or kept when a second follow-up was set
// afterwards). The ticket stays open with the next team. The coach shows
// Finish only after that step, but an old tab could still send a message.
const ITS11_LAB1_TICKET = 'HD-2164';
function its11Lab1Complete(work) {
  const ticket = work && Array.isArray(work.tickets) ? work.tickets.find((entry) => entry.id === ITS11_LAB1_TICKET) : null;
  const follow = ticket && ticket.console && ticket.console.followUp;
  return Boolean(follow && (follow.updated === true || follow.kept === true));
}

async function its11ReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== ITS11_COACH_ID) return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = await currentUser();
  if (!user) { itsConfirmCoachReceipt(event, false); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { itsConfirmCoachReceipt(event, false, wrongStudent); return; }

  const work = itsCleanCoachWork(event.data.work);
  const coachKey = `${user.userId}|${ITS11_COACH_ID}`;
  if (!its11Lab1Complete(work)) {
    itsIncompleteWalkthroughs.add(coachKey);
    itsRefreshWalkthroughNotice(user, ITS11_COACH_ID, [ITS11_LAB1_KEY], ITS11_LAB1_START, ITS11_LAB1_INCOMPLETE);
    itsConfirmCoachReceipt(event, false, 'incomplete');
    return;
  }
  itsIncompleteWalkthroughs.delete(coachKey);

  // Submit first: Lab 3.1 counts as complete only once the portal has its
  // attempt (saved now, or already waiting or approved).
  const received = await itsSubmitWalkthroughLabs(user, 'its-11', [ITS11_LAB1_KEY], work);
  its11User = user;
  if (received) {
    const saved = LabRuntime.load(ITS11_STATE_ID, user, ITS11_DEFAULT_STATE);
    saved.consoleStarted = true;
    saved.consoleCompleted = true;
    LabRuntime.save(ITS11_STATE_ID, user, saved);
    its11State = saved;
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-11', ITS11_LAB1_KEY);
  }
  itsConfirmCoachReceipt(event, received);

  if (!document.querySelector('.its11-shell')) return;
  render();
  const section = document.getElementById('its11-lab-3-1');
  if (section) section.scrollIntoView({ block: 'start' });
}

// Lab 3.2's completion: the simulator's practice set says its three tickets
// are done (ui/helpdesk.js hdPracticeReport; the set's `complete` and `done`
// rules in ui/helpdesk-data.js). Saved once, as a lab attempt with no score
// and no answers: completion, its time and the ticket ids. Every message gets
// an answer, so the simulator can say whether it was saved.
const ITS11_PRACTICE_TICKETS = ['HD-2165', 'HD-2166', 'HD-2167'];
const ITS11_PRACTICE_LOCK_MS = 15000;
function its11StorageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
function its11StorageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* storage blocked: no lock */ } }
function its11StorageRemove(key) { try { localStorage.removeItem(key); } catch (_) { /* storage blocked */ } }

async function its11ReceivePracticeCompletion(event) {
  const data = event.data;
  if (!data || data.type !== 'mnt-practice-complete' || data.id !== 'its-11') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const reply = (saved, reason) => {
    if (!event.source || typeof event.source.postMessage !== 'function') return;
    event.source.postMessage({ type: 'mnt-practice-received', id: 'its-11', nonce: data.nonce, saved: saved === true, ...(reason ? { reason } : {}) }, event.origin);
  };
  const user = await currentUser();
  if (!user) { reply(false, 'signed-out'); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { reply(false, wrongStudent); return; }
  const tickets = Array.isArray(data.tickets) ? data.tickets : [];
  if (tickets.length !== ITS11_PRACTICE_TICKETS.length || !ITS11_PRACTICE_TICKETS.every((id) => tickets.includes(id))) { reply(false, 'incomplete'); return; }
  // Already recorded (as loaded at sign-in, or saved on this page).
  if (itsLabSubmitted(user, ITS11_PRACTICE_KEY)) { reply(true); return; }
  if (itsLabSubmitting(user, ITS11_PRACTICE_KEY)) { reply(false, 'busy'); return; }
  // lab_attempts allows many rows per lab and this lab has no
  // course_module_labs row, so the database won't refuse a second record.
  // Another course page tab in this browser may be saving right now (the
  // lock), or may already have saved (the database read): either way, no
  // second record.
  const lock = `mnt.practice-save.${user.userId}.${ITS11_PRACTICE_KEY}`;
  const held = Number(its11StorageGet(lock)) || 0;
  if (Date.now() - held < ITS11_PRACTICE_LOCK_MS) { reply(false, 'busy'); return; }
  its11StorageSet(lock, String(Date.now()));
  let saved = false;
  try {
    const existing = await its11SavedPracticeAttempt(user);
    if (existing === null) { reply(false, 'save-failed'); return; }
    if (existing) {
      user.latestLabAttemptByKey = { ...(user.latestLabAttemptByKey || {}), [ITS11_PRACTICE_KEY]: existing };
      saved = true;
    } else {
      saved = await itsSubmitLabAttempt(user, 'its-11', ITS11_PRACTICE_KEY, {
        state: 'complete', result: { source: 'mnt-practice-complete', practiceSet: 'its-11', tickets: ITS11_PRACTICE_TICKETS.slice() },
      });
    }
  } finally {
    its11StorageRemove(lock);
  }
  if (saved && typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-11', ITS11_PRACTICE_KEY);
  reply(saved, saved ? '' : 'save-failed');
  its11User = user;
  if (document.querySelector('.its11-shell')) render();
}

// The student's saved Lab 3.2 record, read from the database: the attempt
// (in the shape latestLabAttemptByKey holds), false when there is none, or
// null when the read failed. A superseded or returned record doesn't count.
async function its11SavedPracticeAttempt(user) {
  if (typeof mntSupabase === 'undefined') return null;
  try {
    const { data, error } = await mntSupabase.from('lab_attempts')
      .select('completed_at, reviewed_at, redo_requested, superseded_at')
      .eq('user_id', user.userId).eq('lab_key', ITS11_PRACTICE_KEY)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });
    if (error) { console.error('Lab 3.2 completion read failed', error); return null; }
    const row = Array.isArray(data) ? data.find((entry) => entry && !entry.superseded_at && entry.redo_requested !== true) : null;
    return row ? { completedAt: row.completed_at, reviewedAt: row.reviewed_at || null, redoRequested: row.redo_requested === true, supersededAt: row.superseded_at || null } : false;
  } catch (error) {
    console.error('Lab 3.2 completion read threw', error);
    return null;
  }
}

function its11OnMessage(event) {
  return Promise.all([its11ReceivePracticeCompletion(event), its11ReceiveCoachCompletion(event)]);
}

registerModuleLab({
  program: 'it-support', moduleNumber: 3, moduleKey: 'its-11',
  view: viewItsModuleThreePage, wire: wireItsModuleThreePage, onMessage: its11OnMessage,
});
