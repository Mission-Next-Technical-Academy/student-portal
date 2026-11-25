/* Module 6 (key its-07) — IT Help Desk & Career Accelerator ('it-support').
 * Fictional org, tickets, and policy text; no real systems are involved.
 *
 * This file holds the Learn It content and the code that draws it:
 *   - Lesson 6.1: Reading 1, installing, updating and removing software the
 *     approved way (the three routes, winget, the lightest fix for one app),
 *     with a diagram.
 *   - Lesson 6.2 and Lesson 6.3: filed as one entry (its-07-lesson-02, 60
 *     minutes) and shown as two cards. Reading 2 (admin rights, UAC and least
 *     privilege, with a diagram) and Reading 3 (endpoint hygiene, unwanted app
 *     or malware, and OneDrive sync, with a diagram).
 *   - The knowledge check: five questions, one in the style of the A+ Core 1
 *     exam (objective 4.2, file synchronization) and four program checks, with
 *     a "why" line for a right answer and an "if wrong" line for each wrong
 *     one. The choices are shuffled per student.
 *
 * Block types (its07Blocks): h (sub-heading), h5 (a smaller heading under
 * it), p, ul, ol, note ({ title, text }), table ({ caption, head, rows }) and
 * diagram (a key of ITS07_DIAGRAMS). In p, ul, ol and table text, **...** is
 * emphasized and `...` is inline code. bin/its-curriculum-check.js reads each
 * filed lesson's title and minutes from this file: they must match
 * portal/data.js, so a lesson entry keeps its title and minutes on one line
 * and nothing else here may put a minutes value right after a title.
 */

const ITS07_LESSONS = [
  {
    id: 'its-07-lesson-01', number: '6.1', icon: 'ri-install-line',
    title: 'Installing, Updating & Removing Software', minutes: 60,
    learn: [
      'Install, update and remove software the approved way',
      'Name the three routes software takes onto a Northstar PC, and say which one a request needs',
      'Choose the lightest fix for one misbehaving app',
    ],
    blocks: [
      { h: 'Reading 1 · Installing, updating and removing software, the approved way' },
      { p: 'Northstar users install approved software themselves from Company Portal (some companies use Software Center). Company Portal lists the apps in the **Software Catalog**: every app Northstar has approved. Technicians can also use `winget`, Windows’ package manager.' },
      { diagram: 'routes' },
      { table: {
        caption: 'How software gets onto a Northstar PC',
        head: ['Route', 'Who does it', 'Admin password?', 'Use it for'],
        rows: [
          ['Company Portal', 'The user', 'No', 'Any app in the Software Catalog'],
          ['Technician install', 'The Service Desk, with `winget` or Company Portal', 'Never typed into a user’s prompt', 'A Software Catalog app the user can’t install themselves'],
          ['Software request (a Request item, RITM)', 'The user asks; the software is reviewed', 'No', 'Anything that isn’t in the Software Catalog'],
        ],
      } },
      { p: 'The Software Catalog is the list of approved apps. The **Service Catalog** in ServiceNow is something else: the list of request forms, such as “Software request”. A user asks for an app that isn’t in the Software Catalog with the Software request item in the Service Catalog.' },
      { table: {
        caption: 'winget quick reference',
        head: ['Command', 'What it does'],
        rows: [
          ['`winget search <name>`', 'Finds the app and shows its exact ID'],
          ['`winget install --id <ID> -e`', 'Installs exactly that app (`-e` means the ID must match exactly)'],
          ['`winget upgrade`', 'Lists the apps that have a newer version'],
          ['`winget upgrade --id <ID> -e`', 'Updates one app'],
          ['`winget uninstall --id <ID> -e`', 'Removes the app cleanly'],
        ],
      } },
      { p: 'Remove software through Settings › Apps › Installed apps (or `winget`), never by deleting its folder, because the uninstaller also cleans up its settings. Before removing anything, ask whether another process or team depends on it.' },
      { h5: 'When one app misbehaves' },
      { p: 'When one app crashes, won’t open or freezes while everything else works, suspect the app first, but check its update state and whether the problem follows the user. Many apps offer Modify › Repair or Reset in Installed apps, which fixes the app without losing data. Windows Update keeps Windows current; apps update separately (their own updater, the Store, `winget` or company tools), so a fully updated Windows can still run an outdated app.' },
      { p: 'If a type of file opens in the wrong app, for example PDFs open in the browser, set its app again in Settings › Apps › Default apps.' },
      { p: 'Office apps have a safe mode of their own. If Outlook, Word or Excel crashes or freezes as it opens, start it in safe mode: hold Ctrl while you open it, or run `outlook.exe /safe`. If it works there, an add-in is the likely cause. Go to File › Options › Add-ins › COM Add-ins › Go, untick one add-in at a time, and restart the app after each.' },
      // This table is about the repair paragraphs above, so it sits here in
      // Reading 1, not with Reading 2's diagram.
      { table: {
        caption: 'One app misbehaves: lightest fix first',
        head: ['Step', 'Where', 'What it keeps'],
        rows: [
          ['1. Update it', 'Its own updater, the Store, `winget upgrade` or Company Portal', 'Everything'],
          ['2. Repair it', 'Settings › Apps › Installed apps › the app › Modify or Advanced options › Repair', 'Its data and settings'],
          ['3. Reset it', 'The same place › Reset', 'The app; its settings are cleared'],
          ['4. Uninstall and reinstall it', 'Installed apps or `winget`, then Company Portal', 'Only what is saved elsewhere'],
        ],
      } },
    ],
    comingUp: 'Install, update and remove apps with winget, and repair Teams, in the guided lab (Lab 6.1).',
  },
  {
    id: 'its-07-lesson-02', number: '6.2', icon: 'ri-shield-check-line',
    title: 'Diagnosing Application Problems & Endpoint Security Hygiene', minutes: 60,
    parts: [
      {
        number: '6.2', heading: 'Admin rights, UAC and least privilege', icon: 'ri-shield-keyhole-line',
        learn: [
          'Say what UAC is, and why standard users can’t approve it',
          'Say why admin rights are never given to users',
          'Say where a request for software that isn’t in the Software Catalog goes',
        ],
        blocks: [
          { h: 'Reading 2 · Admin rights, UAC and least privilege' },
          { p: 'UAC (User Account Control) asks for admin approval before a system change. Northstar users are standard users, and local admin rights are never given to users (KB-0058), not even “just for today.” A user with admin rights can be tricked into installing malware that then controls the whole machine.' },
          { p: 'Instead, the technician installs the app if it is in the Software Catalog, or the user installs it from Company Portal. Software that isn’t in the Software Catalog goes through a software request (RITM) for review.' },
          { diagram: 'uac' },
          { p: 'Least privilege means people get only what their job needs. That’s why requests for admin rights, new software and access always go through approval, and why you never use an admin account to install something that isn’t approved “to be nice.”' },
        ],
        comingUp: 'In the guided lab (Lab 6.1) a user asks you for the admin password. Choose your response.',
      },
      {
        number: '6.3', heading: 'Endpoint hygiene and cloud file sync', icon: 'ri-cloud-line',
        learn: [
          'Run a Tier 1 endpoint check: protection, updates and extensions',
          'Tell an unwanted app from malware, and say who handles each',
          'Read OneDrive’s icons and fix the cause of a red X',
        ],
        blocks: [
          { h: 'Reading 3 · Endpoint hygiene and cloud file sync' },
          { h5: 'Endpoint hygiene' },
          { p: 'Endpoint hygiene is part of Tier 1: check that Microsoft Defender is on and current, flag machines that have fallen behind on updates, and look for unwanted browser extensions or toolbars (a common cause of “my browser is slow and full of ads”). Never turn security tools off to “fix” an app. Malware signs (unexpected pop-ups, redirects, ransom notes, disabled security tools) mean you stop and escalate to the SOC.' },
          { p: 'Unwanted app or malware? Defender labels toolbars, search add-ons and bundled “helper” apps as potentially unwanted apps (PUA). They slow a PC and change the browser, but they aren’t an attack, so Tier 1 handles them: remove the extension from the browser’s Extensions page, undo any “Allowed” choice in Windows Security so Defender removes the app, run a quick scan, and tell the user how it got there (KB-0080). If Defender names malware instead, stop and escalate.' },
          { table: {
            caption: 'Unwanted app or malware?',
            head: ['', 'Potentially unwanted app (PUA)', 'Malware'],
            rows: [
              ['What it is', 'A toolbar, search add-on or bundled “helper” app the user didn’t mean to keep', 'Software built to steal, spy, lock files or take control'],
              ['What you see', 'A slow or changed browser, ads, an extension that isn’t approved (KB-0080), “PUA” in Defender’s protection history', 'A trojan, ransomware or script named by Defender, ransom notes, renamed files, security tools switched off'],
              ['Who handles it', 'Tier 1: remove it the approved way (KB-0080)', 'The SOC: stop and escalate. Don’t clean it up'],
            ],
          } },
          { diagram: 'pua' },
          { h5: 'File synchronization (A+ 4.2)' },
          { p: 'OneDrive keeps files the same across devices and in the cloud. Its icons tell the story.' },
          { table: {
            caption: 'OneDrive status icons',
            head: ['Icon', 'Meaning', 'What to do'],
            rows: [
              ['Cloud', 'The file is online only', 'Nothing. It downloads when opened'],
              ['Green tick', 'The file is on this device and in the cloud', 'Nothing'],
              ['Circling arrows', 'Syncing now', 'Wait'],
              ['Red X', 'A file can’t sync', 'Click the OneDrive icon › View sync problems, and fix the cause it names'],
            ],
          } },
          { p: 'OneDrive won’t sync a file whose name contains any of `" * : < > ? / \\ |`, or whose full path is longer than 400 characters. It also stops when the storage quota is reached or the user is signed out. A name with a character it doesn’t allow: rename the file. A path that is too long: shorten a folder name or move the file up a level. Fix the cause; don’t unlink or reset OneDrive first, which can create duplicate files.' },
        ],
        comingUp: 'Check protection, remove an extension that isn’t approved and fix a red X in the guided lab (Lab 6.1), then work the three practice tickets (Lab 6.2).',
      },
    ],
  },
];

// The page shows one card per reading: Lesson 6.1, then Lessons 6.2 and 6.3
// (the two parts of the second filed lesson). Parts carry the filed lesson's
// id, and say they share its minutes.
function its07Cards() {
  return ITS07_LESSONS.flatMap((lesson) => {
    if (!lesson.parts) return [{ id: lesson.id, number: lesson.number, icon: lesson.icon, heading: lesson.title, minutesText: formatInstructionalMinutes(lesson.minutes), learn: lesson.learn, blocks: lesson.blocks, comingUp: lesson.comingUp, part: '' }];
    const together = `Lessons ${lesson.parts.map((part) => part.number).join(' and ')} together: ${formatInstructionalMinutes(lesson.minutes)}`;
    return lesson.parts.map((part) => ({ id: lesson.id, number: part.number, icon: part.icon, heading: part.heading, minutesText: together, learn: part.learn, blocks: part.blocks, comingUp: part.comingUp, part: part.number }));
  });
}

/* ------------------------------------------------------------ Diagrams */

/* Each diagram is drawn as inline SVG from the data below: a wide layout and
 * a narrow (phone) one, switched by a container query in the stylesheet. The
 * look comes from the its01-dg-* classes and follows the page's theme
 * variables. */
const ITS07_DIAGRAMS = {
  routes: {
    title: 'Three approved ways to get software, and one that is never used',
    caption: 'Every app reaches a Northstar PC one of three approved ways.',
    boxes: [
      { title: 'Company Portal', lines: ['The user installs it', 'Software Catalog apps · no admin password'] },
      { title: 'Technician install', lines: ['The Service Desk installs it', 'Software Catalog apps · winget or Company Portal'] },
      { title: 'Software request', lines: ['The user asks; the software is reviewed', 'Anything not in the Software Catalog'] },
    ],
    strip: 'Never: type an admin password into a user’s installer, or give local admin rights “just for today” (KB-0058)',
  },
  uac: {
    title: 'A user asks you to type the admin password',
    caption: 'Check the Software Catalog, then take the branch it gives you.',
    top: 'The installer shows a UAC prompt and the user asks for your password',
    note: 'UAC is Windows asking for admin approval before a system change. Standard users can’t give it, and that is the protection',
    decision: 'Is the app in the Software Catalog?',
    yes: { label: 'Yes', steps: ['Install it from Company Portal (or with winget)', 'Check it opens'] },
    no: { label: 'No', steps: ['Decline politely', 'Open a software request for review'] },
  },
  pua: {
    title: 'Unwanted app or malware? Who handles it',
    caption: 'Tier 1 removes an unwanted app. Malware goes to the SOC.',
    lanes: [
      { heading: 'Unwanted app (PUA)', steps: ['A toolbar, search add-on or “helper” app', 'Remove the extension · undo “Allowed” · quick scan', 'Tier 1 resolves it and tells the user how it got there'] },
      { heading: 'Malware', steps: ['A trojan, ransomware, a script that ran, or security tools switched off', 'Stop. Don’t clean up, don’t turn anything off', 'Escalate to the SOC'] },
    ],
    strip: 'Never turn off real-time protection or add an exclusion to make a problem go away',
  },
};

// Every word a diagram shows, in reading order: the screen-reader description.
function its07DiagramWords(key) {
  const d = ITS07_DIAGRAMS[key];
  if (key === 'routes') {
    const boxes = d.boxes.map((b) => `${b.title}: ${b.lines.join('; ')}`).join('. ');
    return `Three boxes side by side. ${boxes}. Under them, in a red outline: ${d.strip}.`;
  }
  if (key === 'uac') {
    return `At the top: ${d.top}. Joined to it by a line, a note: ${d.note}. An arrow down to the question: ${d.decision}. Two branches. ${d.yes.label}: ${d.yes.steps.join(', then ')}. ${d.no.label}: ${d.no.steps.join(', then ')}.`;
  }
  const lanes = d.lanes.map((lane) => `${lane.heading}: ${lane.steps.join(', then ')}`).join('. ');
  return `Two lanes, each with three boxes and arrows between them. ${lanes}. The last malware box has a red outline. Under both lanes, in a red outline: ${d.strip}.`;
}

// Splits text into lines of at most max characters, at word breaks.
function its07Wrap(text, max) {
  const lines = [];
  let line = '';
  String(text).split(/\s+/).forEach((word) => {
    if (line && (line.length + 1 + word.length) > max) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  });
  if (line) lines.push(line);
  return lines;
}

const ITS07_DG = { pad: 12, title: 15, text: 13, lh: 18, charW: 0.56, gap: 5, indent: 9 };

// One box's wrapped lines: [{ text, cls, dx, dy }], laid out for width w.
// With box.bullets, each item in box.lines starts with a bullet and gets a
// little space above it.
function its07BoxLines(box, w) {
  const inner = w - ITS07_DG.pad * 2;
  const titleMax = Math.max(8, Math.floor(inner / (ITS07_DG.title * ITS07_DG.charW)));
  const textMax = Math.max(8, Math.floor(inner / (ITS07_DG.text * ITS07_DG.charW)));
  const out = [];
  let dy = 0;
  const push = (text, cls, dx = 0) => { out.push({ text, cls, dx, dy }); dy += ITS07_DG.lh; };
  its07Wrap(box.title || '', titleMax).forEach((text) => push(text, 'its01-dg-title'));
  if (box.sub) its07Wrap(box.sub, textMax).forEach((text) => push(text, 'its01-dg-sub'));
  (box.lines || []).forEach((item, i) => {
    if (box.bullets) {
      if (i || out.length) dy += ITS07_DG.gap;
      its07Wrap(item, textMax - 3).forEach((text, j) => push(j ? text : `• ${text}`, 'its01-dg-text', j ? ITS07_DG.indent : 0));
    } else {
      its07Wrap(item, textMax).forEach((text) => push(text, 'its01-dg-text'));
    }
  });
  if (box.text) its07Wrap(box.text, textMax).forEach((text) => push(text, 'its01-dg-text'));
  return out;
}
function its07BoxHeight(box, w) {
  const lines = its07BoxLines(box, w);
  const used = lines.length ? lines[lines.length - 1].dy + ITS07_DG.lh : 0;
  return ITS07_DG.pad * 2 + used + 4;
}
function its07Box(box, x, y, w, h) {
  // warn = the red outline; hl = the highlighted decision box.
  const cls = box.warn ? ' its07-dg-warn' : (box.hl ? ' its01-dg-hl' : '');
  const text = its07BoxLines(box, w).map((line) => `<text class="${line.cls}" x="${x + ITS07_DG.pad + line.dx}" y="${y + ITS07_DG.pad + 14 + line.dy}">${esc(line.text)}</text>`).join('');
  return `<rect class="its01-dg-box${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>${text}`;
}
function its07Arrow(x1, y1, x2, y2, id, hl, both) {
  const ref = `url(#${id}${hl ? '-hl' : ''})`;
  return `<line class="its01-dg-line${hl ? ' its01-dg-line-hl' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="${ref}"${both ? ` marker-start="${ref}"` : ''}/>`;
}
// A plain line, no arrow head: it only joins two boxes.
function its07Line(x1, y1, x2, y2) {
  return `<line class="its01-dg-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
}
function its07Markers(id) {
  const marker = (suffix, cls) => `<marker id="${id}${suffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="${cls}" d="M0,0 L10,5 L0,10 z"/></marker>`;
  return `<defs>${marker('', 'its01-dg-head')}${marker('-hl', 'its01-dg-head its01-dg-head-hl')}</defs>`;
}
function its07Svg(key, layout, width, height, body) {
  const d = ITS07_DIAGRAMS[key];
  return `<svg class="its01-dg-${layout}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(d.title)}" aria-describedby="its07-dg-${key}-desc" focusable="false">${body}</svg>`;
}
// A small label (Yes, No): anchor 'middle' centres it on x.
function its07Label(text, x, y, anchor) {
  return `<text class="its07-dg-label" x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(text)}</text>`;
}
// A lane heading, in the title style.
function its07Heading(text, x, y) {
  return `<text class="its01-dg-title" x="${x}" y="${y}">${esc(text)}</text>`;
}
// The strip under a diagram: one full-width highlighted box (warn: red outline).
function its07Strip(text, y, width, warn) {
  const box = warn ? { text, warn: true } : { text, hl: true };
  const h = its07BoxHeight(box, width);
  return { svg: its07Box(box, 0, y, width, h), h };
}

function its07RoutesSvg(layout) {
  const d = ITS07_DIAGRAMS.routes;
  let body = '';

  if (layout === 'wide') {
    const gap = 24, width = 768, w = (width - 2 * gap) / 3;
    const top = 4;
    const h = Math.max(...d.boxes.map((b) => its07BoxHeight(b, w)));
    d.boxes.forEach((b, i) => { body += its07Box(b, i * (w + gap), top, w, h); });
    const strip = its07Strip(d.strip, top + h + 18, width, true);
    body += strip.svg;
    return its07Svg('routes', layout, width, top + h + 18 + strip.h + 4, body);
  }

  const width = 320, x = 10, w = 300;
  let y = 4;
  d.boxes.forEach((b) => {
    const h = its07BoxHeight(b, w);
    body += its07Box(b, x, y, w, h);
    y += h + 14;
  });
  y += 4;
  const strip = its07Strip(d.strip, y, w, true);
  body += `<g transform="translate(${x} 0)">${strip.svg}</g>`;
  return its07Svg('routes', layout, width, y + strip.h + 4, body);
}

function its07UacSvg(layout) {
  const d = ITS07_DIAGRAMS.uac;
  const id = `its07-dg-uac-${layout}-arrow`;
  const top = { text: d.top };
  const note = { text: d.note };
  const decision = { title: d.decision, hl: true };
  let body = its07Markers(id);

  if (layout === 'wide') {
    const width = 768, bw = 360, noteX = width - bw;
    let y = 4;
    const topH = Math.max(its07BoxHeight(top, bw), its07BoxHeight(note, bw));
    body += its07Box(top, 0, y, bw, topH) + its07Box(note, noteX, y, bw, topH);
    body += its07Line(bw, y + topH / 2, noteX, y + topH / 2);
    y += topH;
    const decY = y + 32;
    body += its07Arrow(bw / 2, y + 2, bw / 2, decY - 2, id);
    const decH = its07BoxHeight(decision, bw);
    body += its07Box(decision, 0, decY, bw, decH);
    // Branches: Yes straight down from the decision, No across to the right
    // column and then down.
    const yesX = 0, noX = noteX;
    const branchTop = decY + decH + 44;
    const midY = decY + decH / 2;
    body += its07Arrow(bw / 2, decY + decH + 2, bw / 2, branchTop - 2, id);
    body += its07Label(d.yes.label, bw / 2 + 22, decY + decH + 26, 'middle');
    body += its07Line(bw, midY, noX + bw / 2, midY);
    body += its07Arrow(noX + bw / 2, midY, noX + bw / 2, branchTop - 2, id);
    body += its07Label(d.no.label, (bw + noX + bw / 2) / 2, midY - 7, 'middle');
    const rowH = [0, 1].map((r) => Math.max(its07BoxHeight({ text: d.yes.steps[r] }, bw), its07BoxHeight({ text: d.no.steps[r] }, bw)));
    let ry = branchTop;
    [0, 1].forEach((r) => {
      if (r) {
        body += its07Arrow(yesX + bw / 2, ry - 24 + 2, yesX + bw / 2, ry - 2, id);
        body += its07Arrow(noX + bw / 2, ry - 24 + 2, noX + bw / 2, ry - 2, id);
      }
      body += its07Box({ text: d.yes.steps[r] }, yesX, ry, bw, rowH[r]);
      body += its07Box({ text: d.no.steps[r] }, noX, ry, bw, rowH[r]);
      ry += rowH[r] + 24;
    });
    return its07Svg('uac', layout, width, ry - 24 + 4, body);
  }

  const width = 320, x = 10, w = 300, cx = x + w / 2;
  let y = 4;
  const topH = its07BoxHeight(top, w);
  body += its07Box(top, x, y, w, topH);
  y += topH;
  body += its07Line(cx, y, cx, y + 14);
  y += 14;
  const noteH = its07BoxHeight(note, w);
  body += its07Box(note, x, y, w, noteH);
  y += noteH;
  body += its07Arrow(cx, y + 2, cx, y + 28 - 2, id);
  y += 28;
  const decH = its07BoxHeight(decision, w);
  body += its07Box(decision, x, y, w, decH);
  y += decH;
  // The two branches side by side, Yes on the left and No on the right, each
  // with its own arrow from the question, as in the wide layout.
  const cw = 145, cols = [x, x + w - cw];
  const branchTop = y + 40;
  [d.yes, d.no].forEach((branch, b) => {
    const bx = cols[b] + cw / 2;
    body += its07Arrow(bx, y + 2, bx, branchTop - 2, id);
    body += its07Label(branch.label, bx + (b ? -16 : 16), y + 24, 'middle');
  });
  const rowH = [0, 1].map((r) => Math.max(its07BoxHeight({ text: d.yes.steps[r] }, cw), its07BoxHeight({ text: d.no.steps[r] }, cw)));
  let ry = branchTop;
  [0, 1].forEach((r) => {
    [d.yes, d.no].forEach((branch, b) => {
      if (r) body += its07Arrow(cols[b] + cw / 2, ry - 22 + 2, cols[b] + cw / 2, ry - 2, id);
      body += its07Box({ text: branch.steps[r] }, cols[b], ry, cw, rowH[r]);
    });
    ry += rowH[r] + 22;
  });
  return its07Svg('uac', layout, width, ry - 22 + 4, body);
}

function its07PuaSvg(layout) {
  const d = ITS07_DIAGRAMS.pua;
  const id = `its07-dg-pua-${layout}-arrow`;
  // The malware lane's last box is outlined in red.
  const lanes = d.lanes.map((lane, l) => ({ ...lane, boxes: lane.steps.map((text, i) => ({ text, warn: l === 1 && i === lane.steps.length - 1 })) }));
  let body = its07Markers(id);

  if (layout === 'wide') {
    const gap = 24, width = 768, lw = (width - gap) / 2, arrow = 24;
    const boxTop = 26;
    const rowH = [0, 1, 2].map((r) => Math.max(...lanes.map((lane) => its07BoxHeight(lane.boxes[r], lw))));
    lanes.forEach((lane, l) => {
      const x = l * (lw + gap);
      body += its07Heading(lane.heading, x, 14);
      let y = boxTop;
      lane.boxes.forEach((box, r) => {
        if (r) { body += its07Arrow(x + lw / 2, y + 2, x + lw / 2, y + arrow - 2, id); y += arrow; }
        body += its07Box(box, x, y, lw, rowH[r]);
        y += rowH[r];
      });
    });
    const lanesBottom = boxTop + rowH[0] + rowH[1] + rowH[2] + 2 * arrow;
    const strip = its07Strip(d.strip, lanesBottom + 18, width, true);
    body += strip.svg;
    return its07Svg('pua', layout, width, lanesBottom + 18 + strip.h + 4, body);
  }

  const width = 320, x = 10, w = 300, cx = x + w / 2;
  let y = 4;
  lanes.forEach((lane, l) => {
    if (l) y += 18;
    body += its07Heading(lane.heading, x + ITS07_DG.pad, y + 14);
    y += 22;
    lane.boxes.forEach((box, r) => {
      if (r) { body += its07Arrow(cx, y + 2, cx, y + 22 - 2, id); y += 22; }
      const h = its07BoxHeight(box, w);
      body += its07Box(box, x, y, w, h);
      y += h;
    });
  });
  y += 18;
  const strip = its07Strip(d.strip, y, w, true);
  body += `<g transform="translate(${x} 0)">${strip.svg}</g>`;
  return its07Svg('pua', layout, width, y + strip.h + 4, body);
}

const ITS07_DIAGRAM_DRAW = { routes: its07RoutesSvg, uac: its07UacSvg, pua: its07PuaSvg };

function its07Diagram(key) {
  const d = ITS07_DIAGRAMS[key];
  const draw = ITS07_DIAGRAM_DRAW[key];
  if (!d || !draw) return '';
  return `<figure class="its01-dg" data-its07-diagram="${esc(key)}">
    <p class="its01-dg-heading">${esc(d.title)}</p>
    ${draw('wide')}
    ${draw('narrow')}
    <p class="its01-sr-only" id="its07-dg-${esc(key)}-desc">${esc(its07DiagramWords(key))}</p>
    <figcaption>${esc(d.caption)}</figcaption>
  </figure>`;
}

/* ------------------------------------------------------------- Lessons */

// Escaped text; **...** becomes emphasized text and `...` inline code. Both
// run on the escaped text, so no markup gets in.
function its07Text(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code class="its07-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// An empty header cell (the row-label column) gets a hidden label, so a
// screen reader doesn't meet an empty header.
function its07Table(table) {
  const caption = esc(table.caption);
  const head = table.head.map((cell) => `<th scope="col">${cell ? esc(cell) : '<span class="its01-sr-only">Item</span>'}</th>`).join('');
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${its07Text(cell)}</td>`).join('')}</tr>`).join('');
  return `<div class="its10-table-wrap" tabindex="0" role="region" aria-label="${caption}"><table class="its10-table"><caption>${caption}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function its07Blocks(blocks) {
  return blocks.map((block) => {
    if (block.h) return `<h4>${esc(block.h)}</h4>`;
    if (block.h5) return `<h5>${esc(block.h5)}</h5>`;
    if (block.p) return `<p>${its07Text(block.p)}</p>`;
    if (block.ul) return `<ul>${block.ul.map((item) => `<li>${its07Text(item)}</li>`).join('')}</ul>`;
    if (block.ol) return `<ol>${block.ol.map((item) => `<li>${its07Text(item)}</li>`).join('')}</ol>`;
    if (block.table) return its07Table(block.table);
    if (block.diagram) return its07Diagram(block.diagram);
    if (block.note) return `<div class="its01-note"><strong>${esc(block.note.title)}</strong><p>${esc(block.note.text)}</p></div>`;
    return '';
  }).join('');
}

function its07LessonCard(card) {
  return `<details class="its01-lesson" data-its07-lesson="${esc(card.id)}"${card.part ? ` data-its07-part="${esc(card.part)}"` : ''}>
    <summary><span class="its01-lesson-icon"><i class="${esc(card.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(card.number)} · ${esc(card.heading)}</strong><small>${esc(card.minutesText)}</small></span><i class="ri-arrow-down-s-line its01-chevron" aria-hidden="true"></i></summary>
    <div class="its01-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${card.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${its07Blocks(card.blocks)}
      ${card.comingUp ? `<div class="its01-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(card.comingUp)}</span></div>` : ''}
    </div>
  </details>`;
}

/* ------------------------------------------------------ Knowledge check */

/* Five questions: the first is in the style of the A+ Core 1 exam (objective
 * 4.2, file synchronization); the other four are program checks. Same shape as
 * one entry of Module 1's checks: a right pick shows its why line, a wrong pick
 * shows its ifWrong line (never the right answer). ifWrong is keyed by the
 * choice's place in the data and has null on the right answer. The choices are
 * shuffled per student (its07ChoiceOrder), so an ifWrong line never starts
 * with a letter. */
const ITS07_CHECK = {
  title: 'Knowledge check',
  intro: 'Five questions on this module’s readings. The first is in the style of the A+ Core 1 exam (objective 4.2, file synchronization); the other four are program checks. It’s complete when 4 or more of your first answers are right. Retake it as often as you like.',
  questions: [
    { q: 'A user edits a file on their laptop and wants the same version on their phone and in the cloud automatically. Which cloud feature provides this?',
      choices: ['Rapid elasticity', 'File synchronization', 'Metered utilization', 'High availability'], answer: 1,
      why: 'File synchronization keeps one file the same on every device and in the cloud, which is what OneDrive does (Reading 3).',
      ifWrong: ['Rapid elasticity is a cloud service growing or shrinking its capacity quickly.', null, 'Metered utilization means paying for what you use.', 'High availability means the service stays up.'] },
    { q: 'A user asks you to type an admin password so they can install a free tool. What do you do?',
      choices: ['Type it', 'Grant temporary admin rights', 'Decline, and deliver it the approved way', 'Tell them to use a personal laptop'], answer: 2,
      why: 'Local admin rights and admin passwords are never given to users (KB-0058). You decline, then deliver it the approved way: Company Portal if it’s in the Software Catalog, a software request if it isn’t (Reading 2).',
      ifWrong: ['Typing it lets an installer you haven’t checked change the whole machine.', '“Temporary” admin rights are still admin rights, and KB-0058 allows none.', null, 'Work on a personal laptop puts company data on a device nobody manages.'] },
    { q: 'One app crashes on launch after an update; everything else works. What’s the best first fix?',
      choices: ['Reimage the PC', 'Repair the app from Installed apps', 'Delete its folder', 'Turn off Defender'], answer: 1,
      why: 'Repair fixes the app’s files and keeps its data, so it is the lightest fix that can work (Reading 1).',
      ifWrong: ['Reimaging wipes the whole PC for a one-app problem.', null, 'Deleting the folder leaves broken settings behind and skips the uninstaller.', 'Security tools are never turned off to fix an app.'] },
    { q: 'OneDrive shows a red X on one file named Plan: v2?.docx. What’s the cause?',
      choices: ['No license', 'Invalid characters in the file name', 'The PC is offline', 'The disk is full'], answer: 1,
      why: 'OneDrive won’t sync a name that contains : or ?, and this one has both (Reading 3).',
      ifWrong: ['A license problem would stop every file, not one.', null, 'Offline shows as paused or not connected, not a red X on one file.', 'A full disk or a full quota gives a storage warning for every new file.'] },
    { q: 'Which of these do you stop and escalate to the SOC instead of fixing yourself?',
      choices: ['7-Zip is two versions behind', 'A browser search add-on that Defender lists as a potentially unwanted app', 'Files renamed overnight, with a ransom note on the desktop', 'A OneDrive file with a red X'], answer: 2,
      why: 'Renamed files and a ransom note are malware signs, so you stop and escalate (Reading 3).',
      ifWrong: ['An outdated app is a routine update.', 'An unwanted app isn’t an attack, and Tier 1 removes it the approved way (KB-0080).', null, 'A red X is a sync problem with a cause you can fix.'] },
  ],
};

/* ------------------------------------------------------- Objective, sources */

// The weekly objective, shown in the hero.
const ITS07_OBJECTIVE = 'By Friday you can install, update, repair and remove software the approved way, and handle requests for admin rights without granting them. You can check that a machine’s protection and updates are current, fix common OneDrive sync problems, and spot an app problem that is really a security problem. A+ Core 1: 4.2 (file synchronization) where marked; the other checks are program knowledge checks. Competencies: 3 Ticketing discipline · 8 Security hygiene & escalation · 9 Triage & escalation judgment.';

const ITS07_SOURCES = [
  { title: 'Windows Package Manager (winget)', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows/package-manager/winget/', note: 'Official reference for installing, updating and removing software with winget.' },
  { title: 'Virus and threat protection in the Windows Security app', org: 'Microsoft Support', url: 'https://support.microsoft.com/en-us/windows/virus-and-threat-protection-in-the-windows-security-app-1362f4cd-d71a-b52a-0b66-c2820032b65e', note: 'How to read protection status, run a quick scan and see protection history.' },
  { title: 'Restrictions and limitations in OneDrive and SharePoint', org: 'Microsoft Support', url: 'https://support.microsoft.com/en-us/office/restrictions-and-limitations-in-onedrive-and-sharepoint-64883a5d-228e-48f5-b3d2-eb39e07630fa', note: 'The characters and path lengths OneDrive won’t sync.' },
];

/* ----------------------------------------------------------- Page state */

// Saved to the student's account (module_progress.case_state): the
// knowledge check's "complete" and its time, and whether the walkthrough was
// started. Never answers or a score.
const ITS07_STATE_ID = 'its07-page-v1';
// Lab 6.1 is Module 6's gating lab (course_module_labs) until the Prove It
// opens, so an instructor still reviews it.
const ITS07_LAB1_KEY = 'lab-its-07-app-cert';
const ITS07_PRACTICE_KEY = 'lab-its-07-practice-tickets';
const ITS07_PROVE_KEY = 'lab-its-07-prove-it';
const ITS07_LAB_KEYS = [ITS07_LAB1_KEY, ITS07_PRACTICE_KEY, ITS07_PROVE_KEY];
const ITS07_COACH_ID = 'hd-m07';
const ITS07_LAB1_START = 'Start Lab 6.1 walkthrough';

const ITS07_DEFAULT_STATE = {
  checkCompleted: false, checkCompletedAt: null,
  consoleStarted: false, consoleCompleted: false,
};

let its07State = null;
let its07User = null;

function its07Load(user) {
  // Check answers live in page memory: a different student signing in
  // without a reload starts the check fresh.
  const userId = user && user.userId;
  if (userId !== its07CheckAnswersUser) {
    its07CheckAnswersUser = userId;
    its07CheckAnswers = {};
    its07CheckPicks = {};
    its07CheckSaveFailed = false;
  }
  its07User = user;
  its07State = LabRuntime.loadCaseState(ITS07_STATE_ID, 'its-07', user, ITS07_DEFAULT_STATE);
  // The simulator's popup message is the only way a walkthrough is recorded;
  // a return by link only shows that it wasn't (see itsNoteCoachReturn).
  itsNoteCoachReturn(user, ITS07_COACH_ID, [ITS07_LAB1_KEY]);
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-07');
  return its07State;
}

function its07Save(onResult) {
  if (its07User && its07State) LabRuntime.saveCaseState(ITS07_STATE_ID, 'its-07', its07User, its07State, onResult ? { onResult } : {});
}

function its07Day(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

/* ------------------------------------------------------- Knowledge check */

/* One check, answered one question at a time, as on Modules 1 and 2. A wrong
 * pick shows why that choice is wrong, never the right answer, and the student
 * picks again. A right pick shows the Why. Only the first pick on each question
 * counts. The check is complete when 70% or more of the first picks are right
 * (4 of 5). Once complete it stays complete; Start again is a retake. No lab
 * attempt, no lab key, gates nothing. */
const ITS07_LETTERS = ['A', 'B', 'C', 'D'];
const ITS07_CHECK_PASS_TENTHS = 7;

// This page's picks, kept in page memory only (a reload starts again), by the
// choice's place in ITS07_CHECK (the data index, not the place shown):
//   its07CheckAnswers: { questionIndex: the first pick }, the one that counts.
//   its07CheckPicks: { questionIndex: [every pick, in order] }.
let its07CheckAnswers = {};
let its07CheckPicks = {};
let its07CheckSaveFailed = false;
let its07CheckAnswersUser = null;

// The order a student sees a question's choices in: shuffled from their
// anonymous id and the question, so it differs between students and stays the
// same for one student on every redraw and reload.
function its07ChoiceOrder(index) {
  const question = ITS07_CHECK.questions[index];
  const seed = `${its07User ? LabRuntime.anonymousStudentId(its07User) : ''}|its-07|check|${index}`;
  let n = 2166136261;
  for (const ch of seed) n = Math.imul(n ^ ch.charCodeAt(0), 16777619) >>> 0;
  const order = question.choices.map((_, c) => c);
  for (let i = order.length - 1; i > 0; i -= 1) {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((n / 4294967296) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function its07CheckDone() {
  return ITS07_CHECK.questions.every((_, i) => Object.prototype.hasOwnProperty.call(its07CheckAnswers, i));
}
// Whole numbers only, so 3.5 of 5 can never round up to a pass.
function its07CheckPassed() {
  const total = ITS07_CHECK.questions.length;
  const right = ITS07_CHECK.questions.filter((question, i) => its07CheckAnswers[i] === question.answer).length;
  return right * 10 >= total * ITS07_CHECK_PASS_TENTHS;
}
function its07CheckCompleted() {
  return Boolean(its07State && its07State.checkCompleted === true);
}

function its07CheckQuestion(question, index) {
  const picks = its07CheckPicks[index] || [];
  const last = picks.length ? picks[picks.length - 1] : undefined;
  const settled = picks.includes(question.answer);
  // Only the student's own picks are marked: a wrong pick never marks or
  // names the right answer. data-choice stays the data index; the letter
  // comes from the place the choice is shown in.
  const choices = its07ChoiceOrder(index).map((c, place) => {
    const picked = picks.includes(c);
    const cls = picked ? (c === question.answer ? ' is-answer' : ' is-wrong') : '';
    return `<button type="button" class="its01-choice${cls}" data-its07-answer data-q="${index}" data-choice="${c}" aria-pressed="${picked}" ${settled || picked ? 'disabled' : ''}><span>${ITS07_LETTERS[place]}</span> ${esc(question.choices[c])}</button>`;
  }).join('');
  const why = settled && question.why ? `<p class="its01-check-why">${esc(question.why)}</p>` : '';
  const wrongLine = !settled && last !== undefined && question.ifWrong && question.ifWrong[last] ? `<p class="its01-check-why">${esc(question.ifWrong[last])}</p>` : '';
  const feedback = last === undefined ? ''
    : settled
      ? `<p class="its01-check-result is-right"><i class="ri-check-line" aria-hidden="true"></i> <strong>Correct.</strong></p>${why}`
      : `<p class="its01-check-result is-wrong"><i class="ri-close-line" aria-hidden="true"></i> <strong>Not quite.</strong> Try another answer.</p>${wrongLine}`;
  return `<li class="its01-check-q">
    <p class="its01-check-prompt" id="its07-check-q${index}">${esc(question.q)}</p>
    <div class="its01-choices" role="group" aria-labelledby="its07-check-q${index}">${choices}</div>
    <div class="its01-check-feedback" id="its07-check-q${index}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

// The status line: a completion the account didn't save asks to try the save
// again; a failed full pass asks for a retake (no score shown); otherwise a
// saved completion shows with its date.
function its07CheckFooter() {
  const anyAnswered = Object.keys(its07CheckAnswers).length > 0;
  const reset = anyAnswered ? '<button type="button" class="its01-check-reset" data-its07-check-reset><i class="ri-restart-line" aria-hidden="true"></i> Start again</button>' : '';
  const saveFailed = its07CheckSaveFailed && its07CheckDone() && its07CheckPassed();
  const retry = saveFailed ? '<button type="button" class="its01-check-reset" data-its07-check-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try again</button>' : '';
  let status = '';
  if (saveFailed) {
    status = '<i class="ri-error-warning-line" aria-hidden="true"></i> Your result didn’t save. Try again.';
  } else if (its07CheckDone() && !its07CheckPassed()) {
    status = 'Retake: you need 4 of 5. Press Start again to retake the check.';
  } else if (its07CheckCompleted()) {
    const day = its07Day(its07State.checkCompletedAt);
    status = `<i class="ri-check-line" aria-hidden="true"></i> ${esc(ITS07_CHECK.title)} complete${day ? ` (${esc(day)})` : ''}. You can retake it any time.`;
  }
  return `<div class="its01-check-footer" data-its07-check-footer><p class="its01-check-status" role="status" tabindex="-1">${status}</p><span class="its01-check-actions">${retry}${reset}</span></div>`;
}

function its07Check() {
  return `<div class="its01-check" data-its07-check id="its07-check">
    <h3>${esc(ITS07_CHECK.title)}</h3>
    <p class="its01-instruction">${esc(ITS07_CHECK.intro)}</p>
    <ol class="its01-check-list">${ITS07_CHECK.questions.map((question, i) => its07CheckQuestion(question, i)).join('')}</ol>
    ${its07CheckFooter()}
  </div>`;
}

/* ------------------------------------------------------------- Sections */

function its07Learn() {
  return `<section class="its01-section" id="its07-lessons" aria-labelledby="its07-lessons-title">
    <div class="its01-section-heading"><span>L</span><div><p class="its01-kicker">Learn It</p><h2 id="its07-lessons-title">Lessons 6.1 to 6.3</h2></div></div>
    <p class="its01-instruction">Three lessons, one reading each. Open each lesson for its reading, the tables and the diagrams, then try the knowledge check below.</p>
    <div class="its01-lesson-grid">${its07Cards().map(its07LessonCard).join('')}</div>
  </section>`;
}

function its07Checks() {
  return `<section class="its01-section" id="its07-checks" aria-labelledby="its07-checks-title">
    <div class="its01-section-heading"><span><i class="ri-question-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Learn It · not graded</p><h2 id="its07-checks-title">Check your understanding</h2></div></div>
    <p class="its01-instruction">Choose an answer. A wrong answer tells you why it’s wrong, and you try again; a right one tells you why it’s right. Your first answer to each question is the one that counts. Not graded: your answers aren’t sent to your instructor, and only that you completed the check is saved to your account.</p>
    ${its07Check()}
  </section>`;
}

// Lab 6.1: the hd-m07 coach on Leah Brooks's PC (HD-2176) in the IT Service
// Desk simulator (ui/helpdesk-coaches.js). Feedback only: no score.
function its07Lab1() {
  const button = itsWalkthroughButton(its07User, [ITS07_LAB1_KEY]);
  return `<section class="its01-section its01-lab-section" id="its07-lab-6-1" aria-labelledby="its07-lab-6-1-title">
    <div class="its01-section-heading"><span>1</span><div><p class="its01-kicker">Practice It · coached</p><h2 id="its07-lab-6-1-title">${esc(itsLabTitle(ITS07_LAB1_KEY))}</h2></div></div>
    <p class="its01-instruction">Leah Brooks has three things for you on her PC: she needs Notepad++ today, Teams keeps freezing, and one of her OneDrive files has a red X. In the IT Service Desk simulator you set the ticket’s fields, then install, update and remove apps with winget, repair Teams, check Windows Security and run a quick scan, remove a browser extension that isn’t approved, answer her request for the admin password, fix the OneDrive file and write the note. A coach guides each of the eleven steps.</p>
    <p class="its01-instruction">The coach names the goal of each typed step; open Show me the command if you need it. Feedback only, no score. Your instructor reviews your finished lab.</p>
    <a class="itsw-evidence-button" data-its07-console-launch href="${esc(itsCoachLaunchHref(ITS07_COACH_ID, its07User))}" target="_blank" rel="opener">
      <i class="${button.icon}" aria-hidden="true"></i> ${{ redo: 'Redo the walkthrough', review: 'Review the walkthrough', start: ITS07_LAB1_START }[button.mode]}
    </a>
    ${itsWalkthroughNoticeHtml(its07User, ITS07_COACH_ID, [ITS07_LAB1_KEY], ITS07_LAB1_START)}
    ${itsLabStatusHtml(its07User, ITS07_LAB1_KEY, { label: 'Lab 6.1', prefix: 'its01', pendingText: 'Complete the guided walkthrough in the simulator to finish this lab.' })}
    ${itsRedoNoticeHtml(its07User, [{ key: ITS07_LAB1_KEY, action: 'Run the walkthrough again to resubmit this lab.' }])}
  </section>`;
}

// Lab 6.2, Module 6's three unguided tickets, not graded: the simulator opens
// just these tickets in their own saved shift (?practice=its-07,
// ui/helpdesk.js), with feedback but no score. Opened with an opener, so once
// all three are done the simulator can report it (its07ReceivePracticeCompletion).
function its07PracticeTicketsHref(user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?practice=its-07&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
}
function its07PracticeTickets() {
  return `<section class="its01-section its01-lab-section" id="its07-practice-tickets" aria-labelledby="its07-practice-tickets-title">
    <div class="its01-section-heading"><span>2</span><div><p class="its01-kicker">Practice It · on your own</p><h2 id="its07-practice-tickets-title">${esc(itsLabTitle(ITS07_PRACTICE_KEY))}</h2></div></div>
    <p class="its01-instruction">Three tickets to work on your own, each a different problem: Leo Brandt’s OneDrive shows a red X and he is afraid he will lose his forecast (6-A), Tom Becker needs Zoom for a customer call in 20 minutes and the installer wants an admin password (6-B), and Hannah Cole’s PDFs open in the wrong program and Acrobat crashes (6-C). On each one, set the Category, CI, Impact and Urgency yourself, use the tool screens and the knowledge base, and press Check my work for feedback.</p>
    <p class="its01-instruction">Practice: not graded. Your answers aren’t sent. Finish all three tickets: resolve each one you can fix, or convert it to the request it needs and finish that work, and write the note. Check my work shows what is still missing. The simulator then tells this page, and your account records that you completed Lab 6.2.</p>
    <a class="itsw-evidence-button" data-its07-practice-launch href="${esc(its07PracticeTicketsHref(its07User))}" target="_blank" rel="opener">
      <i class="ri-play-list-line" aria-hidden="true"></i> Open the practice tickets
    </a>
    ${itsLabStatusHtml(its07User, ITS07_PRACTICE_KEY, { label: 'Lab 6.2', prefix: 'its01', pendingText: 'Finish all three tickets: resolve each one, or convert it to its request and finish that work.' })}
  </section>`;
}

// The Prove It opens nothing yet: its simulator shift isn't built.
function its07Prove() {
  return `<section class="its01-section its01-lab-section" id="its07-prove-it" aria-labelledby="its07-prove-it-title">
    <div class="its01-section-heading"><span>3</span><div><p class="its01-kicker">Prove It · Assessment Lab · instructor reviewed</p><h2 id="its07-prove-it-title">${esc(itsLabTitle(ITS07_PROVE_KEY))}</h2></div></div>
    <p class="its01-instruction">Work a new ticket on your own in the IT Service Desk simulator: no coach, no hints and no feedback before you submit. Your instructor reviews your work.</p>
    <p class="its01-lab-status its01-status-pending" data-its07-prove-soon role="status"><i class="ri-time-line" aria-hidden="true"></i> Opens soon. Nothing to do here yet: work Labs 6.1 and 6.2 first.</p>
  </section>`;
}

function its07Sources() {
  return `<div class="msources-block">
    <h3 class="msources-title">Further Reading</h3>
    <ul class="msources-list">
      ${ITS07_SOURCES.map((source) => `<li class="msources-item">
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
 * neverLocked keeps it open while Lab 6.1 isn't done. */
function its07NavSections(user) {
  return [
    { id: 'lessons', title: 'Readings', type: 'lecture', phase: 'learn', isComplete: true, scrollId: 'its07-lessons' },
    { id: 'guided-lab', title: 'Guided endpoint-check walkthrough', navTitle: 'Lab 6.1 · Guided Lab', type: 'lab', ...itsLabRail(user, [ITS07_LAB1_KEY]), scrollId: 'its07-lab-6-1' },
    // Counts toward the percent, but never locked: the practice tickets can
    // be opened at any time.
    { id: 'unguided', title: 'Lab 6.2 · Practice tickets', navTitle: 'Lab 6.2 · Practice tickets', type: 'lab', phase: 'practice', neverLocked: true, ...itsLabRail(user, [ITS07_PRACTICE_KEY]), scrollId: 'its07-practice-tickets' },
    // Named so the platform's generic Assessment Lab box isn't added
    // (normalizeModuleStages).
    { id: 'assessment', title: 'Assessment Lab', type: 'review', neverLocked: true, ...itsLabRail(user, [ITS07_PROVE_KEY]), scrollId: 'its07-prove-it' },
    { id: 'learn-check', title: ITS07_CHECK.title, type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its07CheckCompleted(), scrollId: 'its07-check' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'its07-sources', gated: false, supplemental: true },
  ];
}
function its07Rail(user) {
  return moduleProgressShell(its07NavSections(user), { moduleKey: 'its07', stageKey: 'its-07' });
}

function viewItsModuleSixPage(user, program) {
  its07Load(user);
  const module = program.modules['its-07'];
  return `<div class="its07-shell">
    ${moduleTopbar(user, program)}
    ${its07Rail(user)}
    <main class="its01-main">
      <section class="its01-hero" aria-labelledby="its07-title"><div><p class="its01-kicker">Module ${String(module.number).padStart(2, '0')} · ${formatInstructionalMinutes(module.durationMinutes)} · Week ${esc(String(module.week))}</p><h1 id="its07-title">${esc(module.title)}</h1><p class="its01-lede">${esc(ITS07_OBJECTIVE)}</p></div><dl class="its01-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${its07Cards().length}</dd></div><div><dt>Guided labs</dt><dd>1</dd></div><div><dt>Labs</dt><dd id="its07-status">${itsLabCounterText(user, ITS07_LAB_KEYS)}</dd></div></dl></section>

      ${its07Learn()}
      ${its07Checks()}
      ${its07Lab1()}
      ${its07PracticeTickets()}
      ${its07Prove()}

      <section class="its01-section" id="its07-sources" aria-labelledby="its07-sources-title"><div class="its01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Reference — not a graded step</p><h2 id="its07-sources-title">Sources &amp; Further Reading</h2></div></div>${its07Sources()}</section>
    </main>
  </div>`;
}

/* ----------------------------------------------------------- Re-renders */

// Updates the rail's rows and percent in place, so its open groups, drawer
// and listeners stay as they are.
function its07RefreshRail() {
  const rail = document.querySelector('.its07-shell [data-mquick-nav-rail]');
  if (!rail || !its07User) return;
  const holder = document.createElement('div');
  holder.innerHTML = its07Rail(its07User);
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

function its07RenderCheck(focusIndex) {
  const el = document.querySelector('.its07-shell [data-its07-check]');
  if (el) el.outerHTML = its07Check();
  if (focusIndex !== undefined) {
    const target = document.getElementById(`its07-check-q${focusIndex}-feedback`);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }
  its07RefreshRail();
}

/* -------------------------------------------------------------- Actions */

// One pick on one question, as on Module 1. The check is complete, and saved
// as such (complete and its time only), the first time a full pass of first
// picks passes.
function its07Answer(index, choice) {
  const question = ITS07_CHECK.questions[index];
  if (!question || !(choice >= 0 && choice < question.choices.length)) return;
  const picks = its07CheckPicks[index] || [];
  if (picks.includes(question.answer) || picks.includes(choice)) return;
  its07CheckPicks[index] = picks.concat(choice);
  if (its07CheckAnswers[index] === undefined) its07CheckAnswers[index] = choice;
  if (its07State && its07CheckDone() && its07CheckPassed() && its07State.checkCompleted !== true) its07SaveCheckDone();
  its07RenderCheck(index);
}

// Ticks the check and saves it, as Module 1's checks do. Only an explicit
// false from the save takes the tick off again (an unknown result leaves it),
// and only if the same student still has the same completion (a render
// reloads its07State, so it's matched by its time, not by object). The untick
// is saved the same way, so this page, this browser's copy and the session's
// copy of the row agree.
function its07SaveCheckDone() {
  const userId = its07User && its07User.userId;
  const at = new Date().toISOString();
  its07State.checkCompleted = true;
  its07State.checkCompletedAt = at;
  its07CheckSaveFailed = false;
  its07Save((ok) => {
    const state = its07State;
    if (ok !== false || !state || !its07User || its07User.userId !== userId || state.checkCompletedAt !== at) return;
    state.checkCompleted = false;
    state.checkCompletedAt = null;
    its07CheckSaveFailed = true;
    its07Save();
    // Keep focus where it was, unless it was on a button this render removes.
    const active = document.activeElement;
    const footer = document.querySelector('.its07-shell [data-its07-check-footer]');
    const focusInFooter = Boolean(footer && active && footer.contains && footer.contains(active));
    its07RenderCheck();
    if (focusInFooter) its07FocusCheckStatus();
  });
}

function its07FocusCheckStatus() {
  const status = document.querySelector('.its07-shell [data-its07-check-footer] .its01-check-status');
  if (status && typeof status.focus === 'function') status.focus({ preventScroll: true });
}

// Try again: the answers are still in page memory, so save the pass again.
function its07RetryCheckSave() {
  if (!its07CheckSaveFailed || !its07State || !its07CheckDone() || !its07CheckPassed()) return;
  its07SaveCheckDone();
  its07RenderCheck();
  its07FocusCheckStatus();
}

function its07ResetCheck() {
  its07CheckAnswers = {};
  its07CheckPicks = {};
  its07CheckSaveFailed = false;
  its07RenderCheck();
  const first = document.querySelector('.its07-shell [data-its07-check] [data-its07-answer]');
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
}

function wireItsModuleSixPage() {
  const shell = document.querySelector('.its07-shell');
  if (!shell || !its07State) return;
  shell.addEventListener('click', (event) => {
    const answer = event.target.closest('[data-its07-answer]');
    if (answer) {
      if (!answer.disabled) its07Answer(Number(answer.dataset.q), Number(answer.dataset.choice));
      return;
    }
    if (event.target.closest('[data-its07-check-reset]')) {
      its07ResetCheck();
      return;
    }
    if (event.target.closest('[data-its07-check-retry]')) {
      its07RetryCheckSave();
      return;
    }
    const launch = event.target.closest('[data-its07-console-launch]');
    if (launch) {
      if (itsLaunchWalkthrough(event, launch, its07User, ITS07_COACH_ID)) {
        its07State.consoleStarted = true;
        its07Save();
      }
      itsRefreshWalkthroughNotice(its07User, ITS07_COACH_ID, [ITS07_LAB1_KEY], ITS07_LAB1_START);
    }
  });
}

/* ------------------------------------------- Lab 6.1 and Lab 6.2 saves */

// Lab 6.1's finished work, read from the cleaned snapshot (itsCleanCoachWork):
// HD-2176 resolved. The coach checks all eleven steps in order before it
// shows Finish; the saved work keeps no step list, so the page checks the end,
// as Module 4's Lab 4.3 does. An old tab could still send an early message.
const ITS07_LAB1_TICKET = 'HD-2176';
function its07Lab1Complete(work) {
  const ticket = work && Array.isArray(work.tickets) ? work.tickets.find((entry) => entry.id === ITS07_LAB1_TICKET) : null;
  return Boolean(ticket) && ticket.status === 'Resolved';
}

async function its07ReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== ITS07_COACH_ID) return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = await currentUser();
  if (!user) { itsConfirmCoachReceipt(event, false); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { itsConfirmCoachReceipt(event, false, wrongStudent); return; }

  const work = itsCleanCoachWork(event.data.work);
  const coachKey = `${user.userId}|${ITS07_COACH_ID}`;
  if (!its07Lab1Complete(work)) {
    itsIncompleteWalkthroughs.add(coachKey);
    itsRefreshWalkthroughNotice(user, ITS07_COACH_ID, [ITS07_LAB1_KEY], ITS07_LAB1_START);
    itsConfirmCoachReceipt(event, false, 'incomplete');
    return;
  }
  itsIncompleteWalkthroughs.delete(coachKey);

  // Submit first: Lab 6.1 counts as complete only once the portal has its
  // attempt (saved now, or already waiting or approved).
  const received = await itsSubmitWalkthroughLabs(user, 'its-07', [ITS07_LAB1_KEY], work);
  its07User = user;
  if (received) {
    const saved = LabRuntime.load(ITS07_STATE_ID, user, ITS07_DEFAULT_STATE);
    saved.consoleStarted = true;
    saved.consoleCompleted = true;
    LabRuntime.save(ITS07_STATE_ID, user, saved);
    its07State = saved;
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-07', ITS07_LAB1_KEY);
  }
  itsConfirmCoachReceipt(event, received);

  if (!document.querySelector('.its07-shell')) return;
  render();
  const section = document.getElementById('its07-lab-6-1');
  if (section) section.scrollIntoView({ block: 'start' });
}

// Lab 6.2's completion: the simulator's practice set says its three tickets
// are done (ui/helpdesk.js hdPracticeReport; the set's `complete` and `done`
// rules in ui/helpdesk-data.js). Saved once, as a lab attempt with no score
// and no answers: completion, its time and the ticket ids. Every message gets
// an answer, so the simulator can say whether it was saved.
const ITS07_PRACTICE_TICKETS = ['HD-2177', 'HD-2178', 'HD-2179'];
const ITS07_PRACTICE_LOCK_MS = 15000;
function its07StorageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
function its07StorageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* storage blocked: no lock */ } }
function its07StorageRemove(key) { try { localStorage.removeItem(key); } catch (_) { /* storage blocked */ } }

async function its07ReceivePracticeCompletion(event) {
  const data = event.data;
  if (!data || data.type !== 'mnt-practice-complete' || data.id !== 'its-07') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const reply = (saved, reason) => {
    if (!event.source || typeof event.source.postMessage !== 'function') return;
    event.source.postMessage({ type: 'mnt-practice-received', id: 'its-07', nonce: data.nonce, saved: saved === true, ...(reason ? { reason } : {}) }, event.origin);
  };
  const user = await currentUser();
  if (!user) { reply(false, 'signed-out'); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { reply(false, wrongStudent); return; }
  const tickets = Array.isArray(data.tickets) ? data.tickets : [];
  if (tickets.length !== ITS07_PRACTICE_TICKETS.length || !ITS07_PRACTICE_TICKETS.every((id) => tickets.includes(id))) { reply(false, 'incomplete'); return; }
  // Already recorded (as loaded at sign-in, or saved on this page).
  if (itsLabSubmitted(user, ITS07_PRACTICE_KEY)) { reply(true); return; }
  if (itsLabSubmitting(user, ITS07_PRACTICE_KEY)) { reply(false, 'busy'); return; }
  // lab_attempts allows many rows per lab and this lab has no
  // course_module_labs row, so the database won't refuse a second record.
  // Another course page tab in this browser may be saving right now (the
  // lock), or may already have saved (the database read): either way, no
  // second record.
  const lock = `mnt.practice-save.${user.userId}.${ITS07_PRACTICE_KEY}`;
  const held = Number(its07StorageGet(lock)) || 0;
  if (Date.now() - held < ITS07_PRACTICE_LOCK_MS) { reply(false, 'busy'); return; }
  its07StorageSet(lock, String(Date.now()));
  let saved = false;
  try {
    const existing = await its07SavedPracticeAttempt(user);
    if (existing === null) { reply(false, 'save-failed'); return; }
    if (existing) {
      user.latestLabAttemptByKey = { ...(user.latestLabAttemptByKey || {}), [ITS07_PRACTICE_KEY]: existing };
      saved = true;
    } else {
      saved = await itsSubmitLabAttempt(user, 'its-07', ITS07_PRACTICE_KEY, {
        state: 'complete', result: { source: 'mnt-practice-complete', practiceSet: 'its-07', tickets: ITS07_PRACTICE_TICKETS.slice() },
      });
    }
  } finally {
    its07StorageRemove(lock);
  }
  if (saved && typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-07', ITS07_PRACTICE_KEY);
  reply(saved, saved ? '' : 'save-failed');
  its07User = user;
  if (document.querySelector('.its07-shell')) render();
}

// The student's saved Lab 6.2 record, read from the database: the attempt
// (in the shape latestLabAttemptByKey holds), false when there is none, or
// null when the read failed. A superseded or returned record doesn't count.
async function its07SavedPracticeAttempt(user) {
  if (typeof mntSupabase === 'undefined') return null;
  try {
    const { data, error } = await mntSupabase.from('lab_attempts')
      .select('completed_at, reviewed_at, redo_requested, superseded_at')
      .eq('user_id', user.userId).eq('lab_key', ITS07_PRACTICE_KEY)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });
    if (error) { console.error('Lab 6.2 completion read failed', error); return null; }
    const row = Array.isArray(data) ? data.find((entry) => entry && !entry.superseded_at && entry.redo_requested !== true) : null;
    return row ? { completedAt: row.completed_at, reviewedAt: row.reviewed_at || null, redoRequested: row.redo_requested === true, supersededAt: row.superseded_at || null } : false;
  } catch (error) {
    console.error('Lab 6.2 completion read threw', error);
    return null;
  }
}

function its07OnMessage(event) {
  return Promise.all([its07ReceivePracticeCompletion(event), its07ReceiveCoachCompletion(event)]);
}

registerModuleLab({
  program: 'it-support', moduleNumber: 6, moduleKey: 'its-07',
  view: viewItsModuleSixPage, wire: wireItsModuleSixPage, onMessage: its07OnMessage,
});
