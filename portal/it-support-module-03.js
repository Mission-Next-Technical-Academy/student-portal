/* Module 5 (key its-03) — IT Help Desk & Career Accelerator ('it-support').
 * Fictional org, tickets, and policy text; no real systems are involved.
 *
 * This file holds the Learn It content and the code that draws it:
 *   - Lesson 5.1: Reading 1, your Windows toolbox (the tools table, account
 *     versus profile, the Mac equivalents), with a diagram.
 *   - Lesson 5.2: Reading 2 (slow machines, blue screens and the repair
 *     ladder, with a diagram) and Reading 3 (storage, updates and BitLocker
 *     recovery, with a diagram).
 *   - The A+ check: four questions in the style of the A+ Core 1 exam
 *     (objectives 5.1 and 5.2), with a "why" line for a right answer and an
 *     "if wrong" line for each wrong one.
 *
 * Block types (its03Blocks): h (sub-heading), h5 (a smaller heading under
 * it), p, ul, ol, note ({ title, text }), table ({ caption, head, rows }) and
 * diagram (a key of ITS03_DIAGRAMS). In p, ul, ol and table text, **...** is
 * emphasized and `...` is inline code. bin/its-curriculum-check.js reads each
 * lesson's title and minutes from this file: they must match portal/data.js.
 */

const ITS03_LESSONS = [
  {
    id: 'its-03-lesson-01', number: '5.1', icon: 'ri-tools-line',
    title: 'Navigation, User Profiles, Local Accounts & Support Utilities', minutes: 90,
    learn: [
      'Open the Windows support tools you need for a ticket, and say what each one is for',
      'Tell an account problem from a profile problem',
      'Name the Mac tool that does the same job as Task Manager, Event Viewer and Disk Management',
    ],
    blocks: [
      { h: 'Reading 1 · Your Windows toolbox' },
      { p: 'Most Windows tickets start in the same few places. Learn where they are and how to open each one fast.' },
      { table: {
        caption: 'The Windows support tools',
        head: ['Tool (how to open)', 'Use it for'],
        rows: [
          ['Settings (Win + I) / Control Panel (`control`)', 'Everyday settings; some older items (advanced network, mail profiles) live only in Control Panel'],
          ['Task Manager (Ctrl + Shift + Esc)', 'Processes sorted by CPU, Memory or Disk; Performance; Startup apps (the usual fix for slow sign-in)'],
          ['Event Viewer (`eventvwr.msc`)', 'Windows Logs › System / Application: each event has a level (Error, Warning), a source and an Event ID you can search'],
          ['Reliability Monitor (`perfmon /rel`)', 'A day-by-day timeline of crashes and installs, for “it started last week”'],
          ['Device Manager (`devmgmt.msc`)', 'Hardware and drivers (Module 4)'],
          ['Disk Management (`diskmgmt.msc`)', 'Drives, partitions and drive letters'],
          ['Services (`services.msc`)', 'Start or stop background services'],
          ['System Information (`msinfo32`)', 'A full hardware and software summary for the ticket'],
          ['Command Prompt / PowerShell (right-click › Run as administrator)', '`cd` changes folder, `dir` (or `Get-ChildItem`) lists it; elevated = admin rights, needed for repairs'],
        ],
      } },
      { h5: 'Account or profile?' },
      { p: 'The **account** is the sign-in: your username and password. The **profile** (`C:\\Users\\name`) holds the desktop, documents and settings.' },
      { p: '“I can sign in, but my desktop is empty and my settings were reset” is a profile problem, not an account problem. If you also see the message “You’ve been signed in with a temporary profile,” you can be sure of it.' },
      { diagram: 'profile' },
      { h5: 'On a Mac' },
      { p: 'Many users bring a Mac to the desk. The tools have other names:' },
      { ul: [
        'Activity Monitor ≈ Task Manager.',
        'Console ≈ Event Viewer.',
        'Disk Utility ≈ Disk Management.',
      ] },
    ],
    comingUp: 'Work a slow desk PC through its tool screens in the guided lab (Lab 5.1).',
  },
  {
    id: 'its-03-lesson-02', number: '5.2', icon: 'ri-hard-drive-2-line',
    title: 'Boot & Performance Troubleshooting, Command-Line Tools & Cross-Platform Awareness', minutes: 90,
    learn: [
      'Check a slow computer in the right order',
      'Name the repair ladder from lightest fix to heaviest, and the three commands on it',
      'Say what a blue screen, “No boot device found” and random shutdowns point to',
      'List the four steps for releasing a BitLocker recovery key, and what you never do',
    ],
    blocks: [
      { h: 'Reading 2 · Slow machines, blue screens and the repair ladder' },
      { h5: '“Everything is slow”: check in this order' },
      { ol: [
        'Task Manager: what’s using CPU, memory or disk right now?',
        'Startup apps.',
        'Free disk space (under about 10% free slows Windows).',
        'Pending updates and restarts.',
        'A malware scan.',
        'Hardware signs: S.M.A.R.T. warnings, overheating, a nearly full HDD.',
      ] },
      { p: 'One slow app points at that app; everything slow points at the system.' },
      { p: 'To measure a slow start, read Event ID 100 in Event Viewer’s Diagnostics-Performance log: it records how long the last boot took. KB-0084 has the full checklist, including what to do with a startup app that isn’t approved.' },
      { p: 'Check every startup app against the Software Catalog, the list of apps the company has approved. An app that isn’t in the catalog isn’t approved: disable its startup entry, then remove it in Settings › Apps › Installed apps › Uninstall, never by deleting its files, and offer the user the approved app that does the same job.' },
      { h5: 'The repair ladder, lightest first' },
      { ol: [
        'Restart.',
        'Safe Mode (minimal drivers). It tells you whether a third-party driver or app is the cause.',
        'DISM, then SFC. `DISM /Online /Cleanup-Image /RestoreHealth` repairs the Windows component store. Then `sfc /scannow` repairs system files.',
        'chkdsk. `chkdsk C: /scan` is an online check of the file system.',
        'System Restore. It rolls back system files, drivers and settings, not personal files.',
        'Startup Repair.',
        'Reset this PC (keep my files). This is a Tier 2 decision.',
      ] },
      { diagram: 'ladder' },
      { h5: 'Blue screens, boot errors and overheating' },
      { p: 'A blue screen (BSOD) shows a stop code, such as `DRIVER_IRQL_NOT_LESS_OR_EQUAL`, that names a `.sys` file (a driver). Search the code and ask what changed.' },
      { p: '“No boot device found” means the drive isn’t detected or the boot order is wrong. After a PC has been moved, check that the drive’s cables are seated and that the BIOS/UEFI boot order lists the drive first.' },
      { p: 'A drive that clicks, or S.M.A.R.T. warnings (the drive’s own health checks), mean the drive is failing. Back up the user’s data first; the drive can be replaced, the data can’t.' },
      { p: 'Random shutdowns under load suggest overheating (check vents and Event ID 41). Ask where the laptop sits: a soft surface, or anything against the vents, traps heat. Tier 1 moves it to a hard, flat surface and tests again. Tier 1 never asks a user to open the case.' },
      { h: 'Reading 3 · Storage, updates and BitLocker recovery' },
      { h5: 'Free up space safely' },
      { p: 'Settings › System › Storage shows what’s using space. Storage Sense and Disk Cleanup remove temporary files. Large personal files can move to OneDrive (Files On-Demand keeps them in the cloud). Never delete a user’s files without their consent.' },
      { h5: 'Updates and restarts' },
      { p: 'Settings › Windows Update shows pending updates and “Restart required”. A machine that hasn’t restarted in weeks is often slow and unprotected.' },
      { h5: 'BitLocker recovery' },
      { p: 'BitLocker encrypts the drive. After some firmware, hardware or boot changes it asks for a 48-digit recovery key.' },
      { p: 'Tier 1 may give the key only after verifying the caller (KB-0024), and only after matching the Key ID shown on the user’s screen to the key stored in AD or Entra (KB-0083). To find a stored key, open Active Directory › Computers, find the computer by its name and open its BitLocker Recovery tab. You’ll do this once in the lab before you need it on a ticket.' },
      { p: 'Read the key aloud in groups. Never send it by email or chat. Note in the ticket that it was released so it can be rotated.' },
      { diagram: 'bitlocker' },
    ],
    comingUp: 'Repair the slow desk PC in the guided lab (Lab 5.1), then work the four practice tickets (Lab 5.2).',
  },
];

/* ------------------------------------------------------------ Diagrams */

/* Each diagram is drawn as inline SVG from the data below: a wide layout and
 * a narrow (phone) one, switched by a container query in the stylesheet. The
 * look comes from the its01-dg-* classes and follows the page's theme
 * variables. */
const ITS03_DIAGRAMS = {
  profile: {
    title: 'Account or profile? One is the sign-in, the other is your stuff',
    caption: 'An account problem stops the sign-in. A profile problem lets you in, but your desktop and settings are gone.',
    cards: [
      { title: 'Account', lines: ['The sign-in: username and password', 'Kept by the company directory', 'Problem looks like: can’t sign in, locked out, wrong password'] },
      { title: 'Profile', lines: ['C:\\Users\\name: desktop, documents, settings', 'Kept on the computer', 'Problem looks like: signs in fine, but the desktop is empty and settings are reset'] },
    ],
    strip: 'The message “You’ve been signed in with a temporary profile” = a profile problem. The files are usually still there.',
  },
  ladder: {
    title: 'The repair ladder: start on the lowest rung',
    caption: 'Try the lightest fix that fits the evidence. Never jump to the top.',
    steps: [
      { title: 'Restart' },
      { title: 'Safe Mode', text: 'minimal drivers: is a driver or app the cause?' },
      { title: 'DISM, then SFC', text: 'repair Windows’ own files' },
      { title: 'chkdsk', text: 'check the file system' },
      { title: 'System Restore', text: 'rolls back system files, drivers and settings, not personal files' },
      { title: 'Startup Repair' },
      { title: 'Reset this PC (keep my files)' },
    ],
    tier2: 'Tier 2 decides',
    checksTitle: '“Everything is slow”: check in this order',
    checks: [
      '1 Task Manager: what’s busy now?',
      '2 Startup apps',
      '3 Free disk space (under about 10% is a cause)',
      '4 Updates and pending restarts',
      '5 Malware scan',
      '6 Hardware signs',
    ],
  },
  bitlocker: {
    title: 'Releasing a BitLocker recovery key: four steps, every time',
    caption: 'Verify first, match the Key ID, read the key aloud, and note the release.',
    steps: [
      { num: '1', title: 'Verify the caller (KB-0024)' },
      { num: '2', title: 'Match the Key ID on their screen to the stored key' },
      { num: '3', title: 'Read the 48-digit key aloud, in groups' },
      { num: '4', title: 'Note the release so the key is rotated' },
    ],
    strip: 'Never by email or chat · Never before verifying · Never a key whose ID doesn’t match',
  },
};

// Every word a diagram shows, in reading order: the screen-reader description.
function its03DiagramWords(key) {
  const d = ITS03_DIAGRAMS[key];
  if (key === 'profile') {
    const cards = d.cards.map((c) => `${c.title}: ${c.lines.join('; ')}`).join('. ');
    return `Two cards side by side. ${cards}. Under both: ${d.strip}`;
  }
  if (key === 'ladder') {
    const steps = d.steps.map((s, i) => `${i + 1}, ${s.title}${s.text ? ` (${s.text})` : ''}${i === d.steps.length - 1 ? `, marked ${d.tier2}` : ''}`).join('. Then ');
    return `Seven steps rising from left to right, with arrows between them. ${steps}. Under the ladder, six checks. ${d.checksTitle}: ${d.checks.join('; ')}.`;
  }
  const steps = d.steps.map((s) => `${s.num}: ${s.title}`).join('. Then ');
  return `Four boxes with arrows between them. ${steps}. Under all four, in a red outline: ${d.strip}.`;
}

// Splits text into lines of at most max characters, at word breaks.
function its03Wrap(text, max) {
  const lines = [];
  let line = '';
  String(text).split(/\s+/).forEach((word) => {
    if (line && (line.length + 1 + word.length) > max) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  });
  if (line) lines.push(line);
  return lines;
}

const ITS03_DG = { pad: 12, title: 15, text: 13, lh: 18, charW: 0.56, gap: 5, indent: 9 };

// One box's wrapped lines: [{ text, cls, dx, dy }], laid out for width w.
// With box.bullets, each item in box.lines starts with a bullet and gets a
// little space above it.
function its03BoxLines(box, w) {
  const inner = w - ITS03_DG.pad * 2;
  const titleMax = Math.max(8, Math.floor(inner / (ITS03_DG.title * ITS03_DG.charW)));
  const textMax = Math.max(8, Math.floor(inner / (ITS03_DG.text * ITS03_DG.charW)));
  const out = [];
  let dy = 0;
  const push = (text, cls, dx = 0) => { out.push({ text, cls, dx, dy }); dy += ITS03_DG.lh; };
  its03Wrap(box.title || '', titleMax).forEach((text) => push(text, 'its01-dg-title'));
  if (box.sub) its03Wrap(box.sub, textMax).forEach((text) => push(text, 'its01-dg-sub'));
  (box.lines || []).forEach((item, i) => {
    if (box.bullets) {
      if (i || out.length) dy += ITS03_DG.gap;
      its03Wrap(item, textMax - 3).forEach((text, j) => push(j ? text : `• ${text}`, 'its01-dg-text', j ? ITS03_DG.indent : 0));
    } else {
      its03Wrap(item, textMax).forEach((text) => push(text, 'its01-dg-text'));
    }
  });
  if (box.text) its03Wrap(box.text, textMax).forEach((text) => push(text, 'its01-dg-text'));
  return out;
}
function its03BoxHeight(box, w) {
  const lines = its03BoxLines(box, w);
  const used = lines.length ? lines[lines.length - 1].dy + ITS03_DG.lh : 0;
  return ITS03_DG.pad * 2 + used + 4;
}
function its03Box(box, x, y, w, h) {
  // warn = the red outline; tier2 = the different colour for the top rung.
  const cls = box.warn ? ' its03-dg-warn' : (box.tier2 ? ' its03-dg-tier2' : (box.hl ? ' its01-dg-hl' : ''));
  const text = its03BoxLines(box, w).map((line) => `<text class="${line.cls}" x="${x + ITS03_DG.pad + line.dx}" y="${y + ITS03_DG.pad + 14 + line.dy}">${esc(line.text)}</text>`).join('');
  return `<rect class="its01-dg-box${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>${text}`;
}
function its03Arrow(x1, y1, x2, y2, id, hl, both) {
  const ref = `url(#${id}${hl ? '-hl' : ''})`;
  return `<line class="its01-dg-line${hl ? ' its01-dg-line-hl' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="${ref}"${both ? ` marker-start="${ref}"` : ''}/>`;
}
function its03Markers(id) {
  const marker = (suffix, cls) => `<marker id="${id}${suffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="${cls}" d="M0,0 L10,5 L0,10 z"/></marker>`;
  return `<defs>${marker('', 'its01-dg-head')}${marker('-hl', 'its01-dg-head its01-dg-head-hl')}</defs>`;
}
function its03Svg(key, layout, width, height, body) {
  const d = ITS03_DIAGRAMS[key];
  return `<svg class="its01-dg-${layout}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(d.title)}" aria-describedby="its03-dg-${key}-desc" focusable="false">${body}</svg>`;
}
// A numbered circle, centred on cx, cy.
function its03Badge(letter, cx, cy) {
  return `<circle class="its01-dg-num" cx="${cx}" cy="${cy}" r="14"/><text class="its01-dg-num-text" x="${cx}" y="${cy + 5}" text-anchor="middle">${esc(letter)}</text>`;
}
// The strip under a diagram: one full-width highlighted box (warn: red outline).
function its03Strip(text, y, width, warn) {
  const box = warn ? { text, warn: true } : { text, hl: true };
  const h = its03BoxHeight(box, width);
  return { svg: its03Box(box, 0, y, width, h), h };
}

function its03BitlockerSvg(layout) {
  const d = ITS03_DIAGRAMS.bitlocker;
  const id = `its03-dg-bitlocker-${layout}-arrow`;
  let body = its03Markers(id);

  if (layout === 'wide') {
    const w = 168, gap = 32, width = 4 * w + 3 * gap;
    const top = 34;
    const h = Math.max(...d.steps.map((s) => its03BoxHeight(s, w)));
    d.steps.forEach((s, i) => {
      const x = i * (w + gap);
      body += its03Badge(s.num, x + w / 2, 15);
      body += its03Box(s, x, top, w, h);
      if (i) body += its03Arrow(x - gap + 4, top + h / 2, x - 4, top + h / 2, id);
    });
    const strip = its03Strip(d.strip, top + h + 18, width, true);
    body += strip.svg;
    return its03Svg('bitlocker', layout, width, top + h + 18 + strip.h + 4, body);
  }

  const width = 320, x = 10, w = 300, gap = 28;
  let y = 4;
  d.steps.forEach((s, i) => {
    if (i) { body += its03Arrow(x + w / 2, y + 3, x + w / 2, y + gap - 3, id); y += gap; }
    body += its03Badge(s.num, x + w / 2, y + 15);
    y += 34;
    const h = its03BoxHeight(s, w);
    body += its03Box(s, x, y, w, h);
    y += h;
  });
  y += 18;
  const strip = its03Strip(d.strip, y, w, true);
  body += `<g transform="translate(${x} 0)">${strip.svg}</g>`;
  return its03Svg('bitlocker', layout, width, y + strip.h + 4, body);
}

function its03ProfileSvg(layout) {
  const d = ITS03_DIAGRAMS.profile;
  let body = '';
  const cards = d.cards.map((c) => ({ ...c, bullets: true }));

  if (layout === 'wide') {
    const cw = 372, gap = 24, width = 2 * cw + gap;
    const h = Math.max(...cards.map((c) => its03BoxHeight(c, cw)));
    cards.forEach((c, i) => { body += its03Box(c, i * (cw + gap), 4, cw, h); });
    const strip = its03Strip(d.strip, 4 + h + 18, width);
    body += strip.svg;
    return its03Svg('profile', layout, width, 4 + h + 18 + strip.h + 4, body);
  }

  const width = 320, x = 10, w = 300;
  let y = 4;
  cards.forEach((c) => {
    const h = its03BoxHeight(c, w);
    body += its03Box(c, x, y, w, h);
    y += h + 14;
  });
  y += 4;
  const strip = its03Strip(d.strip, y, w);
  body += `<g transform="translate(${x} 0)">${strip.svg}</g>`;
  return its03Svg('profile', layout, width, y + strip.h + 4, body);
}

function its03LadderSvg(layout) {
  const d = ITS03_DIAGRAMS.ladder;
  const id = `its03-dg-ladder-${layout}-arrow`;
  const last = d.steps.length - 1;
  const steps = d.steps.map((s, i) => ({ ...s, tier2: i === last }));
  const checks = d.checks.map((text) => ({ text }));
  const heading = (text, x, y) => `<text class="its01-dg-title" x="${x}" y="${y}">${esc(text)}</text>`;
  let body = its03Markers(id);

  if (layout === 'wide') {
    const w = 111, gap = 20, rise = 26, width = 7 * w + 6 * gap;
    const top = 26;
    const h = Math.max(...steps.map((s) => its03BoxHeight(s, w)));
    steps.forEach((s, i) => {
      const x = i * (w + gap);
      const y = top + (last - i) * rise;
      body += its03Box(s, x, y, w, h);
      if (i) body += its03Arrow(x - gap + 2, y + rise + h / 2, x - 2, y + h / 2, id);
    });
    body += `<text class="its03-dg-tier2-label" x="${last * (w + gap) + w / 2}" y="${top - 9}" text-anchor="middle">${esc(d.tier2)}</text>`;
    const gridTop = top + last * rise + h + 28;
    body += heading(d.checksTitle, 0, gridTop);
    const cgap = 14, cw = (width - 2 * cgap) / 3;
    const rowH = [0, 1].map((r) => Math.max(...checks.slice(r * 3, r * 3 + 3).map((c) => its03BoxHeight(c, cw))));
    checks.forEach((c, i) => {
      const r = Math.floor(i / 3);
      const y = gridTop + 12 + (r ? rowH[0] + cgap : 0);
      body += its03Box(c, (i % 3) * (cw + cgap), y, cw, rowH[r]);
    });
    return its03Svg('ladder', layout, width, gridTop + 12 + rowH[0] + cgap + rowH[1] + 4, body);
  }

  const width = 320, x = 10, w = 300, gap = 26;
  let y = 4;
  steps.forEach((s, i) => {
    if (i) { body += its03Arrow(x + w / 2, y + 3, x + w / 2, y + gap - 3, id); y += gap; }
    if (i === last) { body += `<text class="its03-dg-tier2-label" x="${x + ITS03_DG.pad}" y="${y + 14}">${esc(d.tier2)}</text>`; y += 22; }
    const h = its03BoxHeight(s, w);
    body += its03Box(s, x, y, w, h);
    y += h;
  });
  y += 24;
  its03Wrap(d.checksTitle, 34).forEach((line, i) => { body += heading(line, x + ITS03_DG.pad, y + i * ITS03_DG.lh); });
  y += (its03Wrap(d.checksTitle, 34).length - 1) * ITS03_DG.lh + 12;
  checks.forEach((c) => {
    const h = its03BoxHeight(c, w);
    body += its03Box(c, x, y, w, h);
    y += h + 10;
  });
  return its03Svg('ladder', layout, width, y, body);
}

const ITS03_DIAGRAM_DRAW = { profile: its03ProfileSvg, ladder: its03LadderSvg, bitlocker: its03BitlockerSvg };

function its03Diagram(key) {
  const d = ITS03_DIAGRAMS[key];
  const draw = ITS03_DIAGRAM_DRAW[key];
  if (!d || !draw) return '';
  return `<figure class="its01-dg" data-its03-diagram="${esc(key)}">
    <p class="its01-dg-heading">${esc(d.title)}</p>
    ${draw('wide')}
    ${draw('narrow')}
    <p class="its01-sr-only" id="its03-dg-${esc(key)}-desc">${esc(its03DiagramWords(key))}</p>
    <figcaption>${esc(d.caption)}</figcaption>
  </figure>`;
}

/* ------------------------------------------------------------- Lessons */

// Escaped text; **...** becomes emphasized text and `...` inline code. Both
// run on the escaped text, so no markup gets in.
function its03Text(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code class="its03-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function its03Table(table) {
  const caption = esc(table.caption);
  const head = table.head.map((cell) => `<th scope="col">${esc(cell)}</th>`).join('');
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${its03Text(cell)}</td>`).join('')}</tr>`).join('');
  return `<div class="its10-table-wrap" tabindex="0" role="region" aria-label="${caption}"><table class="its10-table"><caption>${caption}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function its03Blocks(blocks) {
  return blocks.map((block) => {
    if (block.h) return `<h4>${esc(block.h)}</h4>`;
    if (block.h5) return `<h5>${esc(block.h5)}</h5>`;
    if (block.p) return `<p>${its03Text(block.p)}</p>`;
    if (block.ul) return `<ul>${block.ul.map((item) => `<li>${its03Text(item)}</li>`).join('')}</ul>`;
    if (block.ol) return `<ol>${block.ol.map((item) => `<li>${its03Text(item)}</li>`).join('')}</ol>`;
    if (block.table) return its03Table(block.table);
    if (block.diagram) return its03Diagram(block.diagram);
    if (block.note) return `<div class="its01-note"><strong>${esc(block.note.title)}</strong><p>${esc(block.note.text)}</p></div>`;
    return '';
  }).join('');
}

function its03LessonCard(lesson) {
  return `<details class="its01-lesson" data-its03-lesson="${esc(lesson.id)}">
    <summary><span class="its01-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(lesson.number)} · ${esc(lesson.title)}</strong><small>${formatInstructionalMinutes(lesson.minutes)}</small></span><i class="ri-arrow-down-s-line its01-chevron" aria-hidden="true"></i></summary>
    <div class="its01-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${lesson.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${its03Blocks(lesson.blocks)}
      ${lesson.comingUp ? `<div class="its01-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(lesson.comingUp)}</span></div>` : ''}
    </div>
  </details>`;
}

/* ------------------------------------------------------ Knowledge check */

/* An A+ Core 1 check (objectives 5.1 and 5.2). Same shape as one entry of
 * Module 1's checks: a right pick shows its why line, a wrong pick shows its
 * ifWrong line (never the right answer). ifWrong has null on the right answer.
 * The choices are shown in data order, not shuffled. */
const ITS03_CHECK = {
  title: 'A+ check',
  intro: 'Four questions in the style of the A+ Core 1 exam (objectives 5.1 and 5.2), on blue screens, start-up and drive problems, and overheating (Reading 2). It’s complete when 3 or more of your first answers are right. Retake it as often as you like.',
  questions: [
    { q: 'A PC shows a blue screen whose stop code names a .sys file right after a new device was installed. What should the technician do first?',
      choices: ['Replace the RAM', 'Roll back or update that device’s driver', 'Reinstall Windows', 'Replace the motherboard'], answer: 1,
      why: 'The stop code names a driver file, and the crashes began right after that device was installed, so the newest change is the first suspect. Ask what changed (Reading 2).',
      ifWrong: ['Bad memory can cause blue screens, but nothing here points at memory, and the stop code names a driver.', null, 'Reinstalling Windows is the top of the repair ladder, not the first rung.', 'Hardware is replaced only after software causes are ruled out.'] },
    { q: 'A desktop displays “No boot device found” after it was moved. What should be checked first?',
      choices: ['The monitor cable', 'Windows Update', 'The drive’s cables and the BIOS/UEFI boot order', 'The RAM speed'], answer: 2,
      why: 'The message means the PC can’t find a drive to start from. A move can loosen a drive cable, and the boot order may point at the wrong device (Reading 2).',
      ifWrong: ['The monitor is showing you the message, so it works.', 'Windows hasn’t started, so Windows Update can’t be reached yet.', null, 'Memory speed doesn’t stop a drive from being found.'] },
    { q: 'A user hears clicking from their laptop’s hard drive and gets S.M.A.R.T. warnings. What should be done first?',
      choices: ['Back up the data immediately', 'Defragment the drive', 'Reinstall the OS', 'Increase virtual memory'], answer: 0,
      why: 'Clicking and S.M.A.R.T. warnings mean the drive is failing, and the data is what can’t be replaced. Save it first, then deal with the drive (Reading 2).',
      ifWrong: [null, 'Defragmenting makes a failing drive work harder.', 'Reinstalling writes to a failing drive and saves nothing.', 'Virtual memory is about running out of RAM, not drive health.'] },
    { q: 'A PC restarts at random under heavy load, and its fans are very loud. What is the most likely cause?',
      choices: ['A corrupt user profile', 'A wrong printer driver', 'A DNS failure', 'Overheating from dust or failed cooling'], answer: 3,
      why: 'Restarts under load with the fans at full speed point at heat. Check the vents and look for Event ID 41 (Reading 2).',
      ifWrong: ['A corrupt profile changes the desktop and settings after sign-in; it doesn’t restart the PC.', 'A printer driver affects printing only.', 'A DNS failure stops names from resolving; the PC stays on.', null] },
  ],
};

/* ------------------------------------------------------- Objective, sources */

// The weekly objective, shown in the hero.
// Spec section 7's weekly objective, with the A+ Core 1 objective numbers
// from the 220-1201 exam (5.1 and 5.2).
const ITS03_OBJECTIVE = 'By Friday you can find your way around Windows’ support tools, both on screen and in PowerShell. You can work a “slow computer” ticket in the right order, recognize a temporary or corrupted profile, repair system files, handle a blue screen, and help a user through a BitLocker recovery screen safely. A+ Core 1: 5.1 Troubleshoot (blue screens, performance, overheating) · 5.2 Drives (boot device, S.M.A.R.T.).';

const ITS03_SOURCES = [
  { title: 'Windows client troubleshooting', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/troubleshoot/windows-client/welcome-windows-client', note: 'Official reference for the Windows tools, repairs and start-up problems in this module.' },
  { title: 'BitLocker recovery overview', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/recovery-overview', note: 'Official reference for BitLocker recovery keys and why a device asks for one.' },
  { title: 'CompTIA A+ Certification', org: 'CompTIA', url: 'https://www.comptia.org/certifications/a', note: 'A public reference for the certification this course’s content lines up with. No certification exam is required to finish the program.' },
];

/* ----------------------------------------------------------- Page state */

// Saved to the student's account (module_progress.case_state): the
// knowledge check's "complete" and its time, and whether the walkthrough was
// started. Never answers or a score.
const ITS03_STATE_ID = 'its03-page-v1';
// Students see the guided lab as Lab 5.1; its key is older than that
// numbering. Lab 5.1 is Module 5's gating lab (course_module_labs) until the
// Prove It opens, so an instructor still reviews it.
const ITS03_LAB1_KEY = 'lab-its-03-blank-desktop';
const ITS03_PRACTICE_KEY = 'lab-its-03-practice-tickets';
const ITS03_PROVE_KEY = 'lab-its-03-prove-it';
const ITS03_LAB_KEYS = [ITS03_LAB1_KEY, ITS03_PRACTICE_KEY, ITS03_PROVE_KEY];
const ITS03_COACH_ID = 'hd-m03';
const ITS03_LAB1_START = 'Start Lab 5.1 walkthrough';

const ITS03_DEFAULT_STATE = {
  checkCompleted: false, checkCompletedAt: null,
  consoleStarted: false, consoleCompleted: false,
};

let its03State = null;
let its03User = null;

function its03Load(user) {
  // Check answers live in page memory: a different student signing in
  // without a reload starts the check fresh.
  const userId = user && user.userId;
  if (userId !== its03CheckAnswersUser) {
    its03CheckAnswersUser = userId;
    its03CheckAnswers = {};
    its03CheckPicks = {};
    its03CheckSaveFailed = false;
  }
  its03User = user;
  its03State = LabRuntime.loadCaseState(ITS03_STATE_ID, 'its-03', user, ITS03_DEFAULT_STATE);
  // The simulator's popup message is the only way a walkthrough is recorded;
  // a return by link only shows that it wasn't (see itsNoteCoachReturn).
  itsNoteCoachReturn(user, ITS03_COACH_ID, [ITS03_LAB1_KEY]);
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-03');
  return its03State;
}

function its03Save(onResult) {
  if (its03User && its03State) LabRuntime.saveCaseState(ITS03_STATE_ID, 'its-03', its03User, its03State, onResult ? { onResult } : {});
}

function its03Day(iso) {
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
const ITS03_LETTERS = ['A', 'B', 'C', 'D'];
const ITS03_CHECK_PASS_TENTHS = 7;

// This page's picks, kept in page memory only (a reload starts again), by the
// choice's place in ITS03_CHECK:
//   its03CheckAnswers: { questionIndex: the first pick }, the one that counts.
//   its03CheckPicks: { questionIndex: [every pick, in order] }.
let its03CheckAnswers = {};
let its03CheckPicks = {};
let its03CheckSaveFailed = false;
let its03CheckAnswersUser = null;

function its03CheckDone() {
  return ITS03_CHECK.questions.every((_, i) => Object.prototype.hasOwnProperty.call(its03CheckAnswers, i));
}
// Whole numbers only, so 2.8 of 4 can never round down to a pass.
function its03CheckPassed() {
  const total = ITS03_CHECK.questions.length;
  const right = ITS03_CHECK.questions.filter((question, i) => its03CheckAnswers[i] === question.answer).length;
  return right * 10 >= total * ITS03_CHECK_PASS_TENTHS;
}
function its03CheckCompleted() {
  return Boolean(its03State && its03State.checkCompleted === true);
}

function its03CheckQuestion(question, index) {
  const picks = its03CheckPicks[index] || [];
  const last = picks.length ? picks[picks.length - 1] : undefined;
  const settled = picks.includes(question.answer);
  // Only the student's own picks are marked: a wrong pick never marks or
  // names the right answer.
  // In data order, as on Module 1: spec section 8.1 already moved the right
  // answers (B, C, A, D).
  const choices = question.choices.map((text, c) => {
    const picked = picks.includes(c);
    const cls = picked ? (c === question.answer ? ' is-answer' : ' is-wrong') : '';
    return `<button type="button" class="its01-choice${cls}" data-its03-answer data-q="${index}" data-choice="${c}" aria-pressed="${picked}" ${settled || picked ? 'disabled' : ''}><span>${ITS03_LETTERS[c]}</span> ${esc(text)}</button>`;
  }).join('');
  const why = settled && question.why ? `<p class="its01-check-why">${esc(question.why)}</p>` : '';
  const wrongLine = !settled && last !== undefined && question.ifWrong && question.ifWrong[last] ? `<p class="its01-check-why">${esc(question.ifWrong[last])}</p>` : '';
  const feedback = last === undefined ? ''
    : settled
      ? `<p class="its01-check-result is-right"><i class="ri-check-line" aria-hidden="true"></i> <strong>Correct.</strong></p>${why}`
      : `<p class="its01-check-result is-wrong"><i class="ri-close-line" aria-hidden="true"></i> <strong>Not quite.</strong> Try another answer.</p>${wrongLine}`;
  return `<li class="its01-check-q">
    <p class="its01-check-prompt" id="its03-check-q${index}">${esc(question.q)}</p>
    <div class="its01-choices" role="group" aria-labelledby="its03-check-q${index}">${choices}</div>
    <div class="its01-check-feedback" id="its03-check-q${index}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

// The status line: a completion the account didn't save asks to try the save
// again; a failed full pass asks for a retake (no score shown); otherwise a
// saved completion shows with its date.
function its03CheckFooter() {
  const anyAnswered = Object.keys(its03CheckAnswers).length > 0;
  const reset = anyAnswered ? '<button type="button" class="its01-check-reset" data-its03-check-reset><i class="ri-restart-line" aria-hidden="true"></i> Start again</button>' : '';
  const saveFailed = its03CheckSaveFailed && its03CheckDone() && its03CheckPassed();
  const retry = saveFailed ? '<button type="button" class="its01-check-reset" data-its03-check-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try again</button>' : '';
  let status = '';
  if (saveFailed) {
    status = '<i class="ri-error-warning-line" aria-hidden="true"></i> Your result didn’t save. Try again.';
  } else if (its03CheckDone() && !its03CheckPassed()) {
    status = 'Retake: you need 3 of 4. Press Start again to retake the check.';
  } else if (its03CheckCompleted()) {
    const day = its03Day(its03State.checkCompletedAt);
    status = `<i class="ri-check-line" aria-hidden="true"></i> ${esc(ITS03_CHECK.title)} complete${day ? ` (${esc(day)})` : ''}. You can retake it any time.`;
  }
  return `<div class="its01-check-footer" data-its03-check-footer><p class="its01-check-status" role="status" tabindex="-1">${status}</p><span class="its01-check-actions">${retry}${reset}</span></div>`;
}

function its03Check() {
  return `<div class="its01-check" data-its03-check id="its03-check">
    <h3>${esc(ITS03_CHECK.title)}</h3>
    <p class="its01-instruction">${esc(ITS03_CHECK.intro)}</p>
    <ol class="its01-check-list">${ITS03_CHECK.questions.map((question, i) => its03CheckQuestion(question, i)).join('')}</ol>
    ${its03CheckFooter()}
  </div>`;
}

/* ------------------------------------------------------------- Sections */

function its03Learn() {
  return `<section class="its01-section" id="its03-lessons" aria-labelledby="its03-lessons-title">
    <div class="its01-section-heading"><span>L</span><div><p class="its01-kicker">Learn It</p><h2 id="its03-lessons-title">Three readings</h2></div></div>
    <p class="its01-instruction">Two lessons hold the three readings: Reading 1 in Lesson 5.1, Readings 2 and 3 in Lesson 5.2. Open each lesson for the readings, the toolbox table and the diagrams, then try the A+ check below.</p>
    <div class="its01-lesson-grid">${ITS03_LESSONS.map(its03LessonCard).join('')}</div>
  </section>`;
}

function its03Checks() {
  return `<section class="its01-section" id="its03-checks" aria-labelledby="its03-checks-title">
    <div class="its01-section-heading"><span><i class="ri-question-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Learn It · not graded</p><h2 id="its03-checks-title">Check your understanding</h2></div></div>
    <p class="its01-instruction">Choose an answer. A wrong answer tells you why it’s wrong, and you try again; a right one tells you why it’s right. Your first answer to each question is the one that counts. Not graded: your answers aren’t sent to your instructor, and only that you completed the check is saved to your account.</p>
    ${its03Check()}
  </section>`;
}

// Lab 5.1: the hd-m03 coach on Noah Williams's slow desk PC (HD-2180) in the
// IT Service Desk simulator (ui/helpdesk-coaches.js). Feedback only: no score.
function its03Lab1() {
  const button = itsWalkthroughButton(its03User, [ITS03_LAB1_KEY]);
  return `<section class="its01-section its01-lab-section" id="its03-lab-5-1" aria-labelledby="its03-lab-5-1-title">
    <div class="its01-section-heading"><span>1</span><div><p class="its01-kicker">Practice It · coached</p><h2 id="its03-lab-5-1-title">${esc(itsLabTitle(ITS03_LAB1_KEY))}</h2></div></div>
    <p class="its01-instruction">Noah Williams says his desk PC has been crawling since Monday. In the IT Service Desk simulator you set the ticket’s fields, then work Reading 2’s order on his PC: Task Manager, Startup apps and the Software Catalog, Storage, Windows Update, Event Viewer and Reliability Monitor. You free space the safe way, type the repair commands, restart to finish the update, walk the Safe Mode route, look up where the PC’s BitLocker recovery key is stored, then prove the fix and write the note. A coach guides each of the sixteen steps.</p>
    <p class="its01-instruction">The coach names the goal of each typed step; open Show me the command if you need it. Feedback only, no score. Your instructor reviews your finished lab.</p>
    <a class="itsw-evidence-button" data-its03-console-launch href="${esc(itsCoachLaunchHref(ITS03_COACH_ID, its03User))}" target="_blank" rel="opener">
      <i class="${button.icon}" aria-hidden="true"></i> ${{ redo: 'Redo the walkthrough', review: 'Review the walkthrough', start: ITS03_LAB1_START }[button.mode]}
    </a>
    ${itsWalkthroughNoticeHtml(its03User, ITS03_COACH_ID, [ITS03_LAB1_KEY], ITS03_LAB1_START)}
    ${itsLabStatusHtml(its03User, ITS03_LAB1_KEY, { label: 'Lab 5.1', prefix: 'its01', pendingText: 'Complete the guided walkthrough in the simulator to finish this lab.' })}
    ${itsRedoNoticeHtml(its03User, [{ key: ITS03_LAB1_KEY, action: 'Run the walkthrough again to resubmit this lab.' }])}
  </section>`;
}

// Lab 5.2, Module 5's four unguided tickets, not graded: the simulator opens
// just these tickets (and the two related dock tickets 5-B links) in their
// own saved shift (?practice=its-03, ui/helpdesk.js), with feedback but no
// score. Opened with an opener, so once all four are done the simulator can
// report it (its03ReceivePracticeCompletion).
function its03PracticeTicketsHref(user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?practice=its-03&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
}
function its03PracticeTickets() {
  return `<section class="its01-section its01-lab-section" id="its03-practice-tickets" aria-labelledby="its03-practice-tickets-title">
    <div class="its01-section-heading"><span>2</span><div><p class="its01-kicker">Practice It · on your own</p><h2 id="its03-practice-tickets-title">${esc(itsLabTitle(ITS03_PRACTICE_KEY))}</h2></div></div>
    <p class="its01-instruction">Four tickets to work on your own, each a different problem: Noah Williams says all his files are gone (5-A), Lisa Park’s laptop shows a blue screen every time she docks it (5-B), Dina Foster is at the airport with a BitLocker recovery screen (5-C), and Evan Parker’s laptop keeps shutting off during the payroll export (5-D). On each one, set the Category, CI, Impact and Urgency yourself, use the tool screens and the knowledge base, and press Check my work for feedback.</p>
    <p class="its01-instruction">Practice: not graded. Your answers aren’t sent. Finish all four tickets: resolve each one you can fix at Tier 1, or escalate it to the right team with a note they can act on. Check my work shows what is still missing. The simulator then tells this page, and your account records that you completed Lab 5.2.</p>
    <a class="itsw-evidence-button" data-its03-practice-launch href="${esc(its03PracticeTicketsHref(its03User))}" target="_blank" rel="opener">
      <i class="ri-play-list-line" aria-hidden="true"></i> Open the practice tickets
    </a>
    ${itsLabStatusHtml(its03User, ITS03_PRACTICE_KEY, { label: 'Lab 5.2', prefix: 'its01', pendingText: 'Finish all four tickets: resolve each one, or escalate it with a note.' })}
  </section>`;
}

// The Prove It opens nothing yet: its simulator shift isn't built.
function its03Prove() {
  return `<section class="its01-section its01-lab-section" id="its03-prove-it" aria-labelledby="its03-prove-it-title">
    <div class="its01-section-heading"><span>3</span><div><p class="its01-kicker">Prove It · Assessment Lab · instructor reviewed</p><h2 id="its03-prove-it-title">${esc(itsLabTitle(ITS03_PROVE_KEY))}</h2></div></div>
    <p class="its01-instruction">Work a new ticket on your own in the IT Service Desk simulator: no coach, no hints and no feedback before you submit. Your instructor reviews your work.</p>
    <p class="its01-lab-status its01-status-pending" data-its03-prove-soon role="status"><i class="ri-time-line" aria-hidden="true"></i> Opens soon. Nothing to do here yet: work Labs 5.1 and 5.2 first.</p>
  </section>`;
}

function its03Sources() {
  return `<div class="msources-block">
    <h3 class="msources-title">Further Reading</h3>
    <ul class="msources-list">
      ${ITS03_SOURCES.map((source) => `<li class="msources-item">
        <a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer" class="msources-link"><span class="msources-title-text">${esc(source.title)}</span><span class="msources-org">${esc(source.org)}</span></a>
        ${source.note ? `<p class="msources-note">${esc(source.note)}</p>` : ''}
      </li>`).join('')}
    </ul>
  </div>`;
}

/* The rail. The readings, the three labs and the A+ check count
 * toward the module's percent (shown only; it saves nothing); Sources
 * doesn't. The check comes last in the list, so it never locks a lab
 * (moduleNavStatuses locks only rows after an unfinished one), and
 * neverLocked keeps it open while Lab 5.1 isn't done. */
function its03NavSections(user) {
  return [
    { id: 'lessons', title: 'Readings', type: 'lecture', phase: 'learn', isComplete: true, scrollId: 'its03-lessons' },
    { id: 'guided-lab', title: 'Guided slow-computer walkthrough', navTitle: 'Lab 5.1 · Guided Lab', type: 'lab', ...itsLabRail(user, [ITS03_LAB1_KEY]), scrollId: 'its03-lab-5-1' },
    // Counts toward the percent, but never locked: the practice tickets can
    // be opened at any time.
    { id: 'unguided', title: 'Lab 5.2 · Practice tickets', navTitle: 'Lab 5.2 · Practice tickets', type: 'lab', phase: 'practice', neverLocked: true, ...itsLabRail(user, [ITS03_PRACTICE_KEY]), scrollId: 'its03-practice-tickets' },
    // Named so the platform's generic Assessment Lab box isn't added
    // (normalizeModuleStages).
    { id: 'assessment', title: 'Assessment Lab', type: 'review', neverLocked: true, ...itsLabRail(user, [ITS03_PROVE_KEY]), scrollId: 'its03-prove-it' },
    { id: 'learn-check', title: 'A+ check', type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its03CheckCompleted(), scrollId: 'its03-check' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'its03-sources', gated: false, supplemental: true },
  ];
}
function its03Rail(user) {
  return moduleProgressShell(its03NavSections(user), { moduleKey: 'its03', stageKey: 'its-03' });
}

function viewItsModuleFivePage(user, program) {
  its03Load(user);
  const module = program.modules['its-03'];
  return `<div class="its03-shell">
    ${moduleTopbar(user, program)}
    ${its03Rail(user)}
    <main class="its01-main">
      <section class="its01-hero" aria-labelledby="its03-title"><div><p class="its01-kicker">Module ${String(module.number).padStart(2, '0')} · ${formatInstructionalMinutes(module.durationMinutes)} · Week ${esc(String(module.week))}</p><h1 id="its03-title">${esc(module.title)}</h1><p class="its01-lede">${esc(ITS03_OBJECTIVE)}</p></div><dl class="its01-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${module.lessons}</dd></div><div><dt>Guided labs</dt><dd>1</dd></div><div><dt>Labs</dt><dd id="its03-status">${itsLabCounterText(user, ITS03_LAB_KEYS)}</dd></div></dl></section>

      ${its03Learn()}
      ${its03Checks()}
      ${its03Lab1()}
      ${its03PracticeTickets()}
      ${its03Prove()}

      <section class="its01-section" id="its03-sources" aria-labelledby="its03-sources-title"><div class="its01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Reference — not a graded step</p><h2 id="its03-sources-title">Sources &amp; Further Reading</h2></div></div>${its03Sources()}</section>
    </main>
  </div>`;
}

/* ----------------------------------------------------------- Re-renders */

// Updates the rail's rows and percent in place, so its open groups, drawer
// and listeners stay as they are.
function its03RefreshRail() {
  const rail = document.querySelector('.its03-shell [data-mquick-nav-rail]');
  if (!rail || !its03User) return;
  const holder = document.createElement('div');
  holder.innerHTML = its03Rail(its03User);
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

function its03RenderCheck(focusIndex) {
  const el = document.querySelector('.its03-shell [data-its03-check]');
  if (el) el.outerHTML = its03Check();
  if (focusIndex !== undefined) {
    const target = document.getElementById(`its03-check-q${focusIndex}-feedback`);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }
  its03RefreshRail();
}

/* -------------------------------------------------------------- Actions */

// One pick on one question, as on Module 1. The check is complete, and saved
// as such (complete and its time only), the first time a full pass of first
// picks passes.
function its03Answer(index, choice) {
  const question = ITS03_CHECK.questions[index];
  if (!question || !(choice >= 0 && choice < question.choices.length)) return;
  const picks = its03CheckPicks[index] || [];
  if (picks.includes(question.answer) || picks.includes(choice)) return;
  its03CheckPicks[index] = picks.concat(choice);
  if (its03CheckAnswers[index] === undefined) its03CheckAnswers[index] = choice;
  if (its03State && its03CheckDone() && its03CheckPassed() && its03State.checkCompleted !== true) its03SaveCheckDone();
  its03RenderCheck(index);
}

// Ticks the check and saves it, as Module 1's checks do. Only an explicit
// false from the save takes the tick off again (an unknown result leaves it),
// and only if the same student still has the same completion (a render
// reloads its03State, so it's matched by its time, not by object). The untick
// is saved the same way, so this page, this browser's copy and the session's
// copy of the row agree.
function its03SaveCheckDone() {
  const userId = its03User && its03User.userId;
  const at = new Date().toISOString();
  its03State.checkCompleted = true;
  its03State.checkCompletedAt = at;
  its03CheckSaveFailed = false;
  its03Save((ok) => {
    const state = its03State;
    if (ok !== false || !state || !its03User || its03User.userId !== userId || state.checkCompletedAt !== at) return;
    state.checkCompleted = false;
    state.checkCompletedAt = null;
    its03CheckSaveFailed = true;
    its03Save();
    // Keep focus where it was, unless it was on a button this render removes.
    const active = document.activeElement;
    const footer = document.querySelector('.its03-shell [data-its03-check-footer]');
    const focusInFooter = Boolean(footer && active && footer.contains && footer.contains(active));
    its03RenderCheck();
    if (focusInFooter) its03FocusCheckStatus();
  });
}

function its03FocusCheckStatus() {
  const status = document.querySelector('.its03-shell [data-its03-check-footer] .its01-check-status');
  if (status && typeof status.focus === 'function') status.focus({ preventScroll: true });
}

// Try again: the answers are still in page memory, so save the pass again.
function its03RetryCheckSave() {
  if (!its03CheckSaveFailed || !its03State || !its03CheckDone() || !its03CheckPassed()) return;
  its03SaveCheckDone();
  its03RenderCheck();
  its03FocusCheckStatus();
}

function its03ResetCheck() {
  its03CheckAnswers = {};
  its03CheckPicks = {};
  its03CheckSaveFailed = false;
  its03RenderCheck();
  const first = document.querySelector('.its03-shell [data-its03-check] [data-its03-answer]');
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
}

function wireItsModuleFivePage() {
  const shell = document.querySelector('.its03-shell');
  if (!shell || !its03State) return;
  shell.addEventListener('click', (event) => {
    const answer = event.target.closest('[data-its03-answer]');
    if (answer) {
      if (!answer.disabled) its03Answer(Number(answer.dataset.q), Number(answer.dataset.choice));
      return;
    }
    if (event.target.closest('[data-its03-check-reset]')) {
      its03ResetCheck();
      return;
    }
    if (event.target.closest('[data-its03-check-retry]')) {
      its03RetryCheckSave();
      return;
    }
    const launch = event.target.closest('[data-its03-console-launch]');
    if (launch) {
      if (itsLaunchWalkthrough(event, launch, its03User, ITS03_COACH_ID)) {
        its03State.consoleStarted = true;
        its03Save();
      }
      itsRefreshWalkthroughNotice(its03User, ITS03_COACH_ID, [ITS03_LAB1_KEY], ITS03_LAB1_START);
    }
  });
}

/* ------------------------------------------- Lab 5.1 and Lab 5.2 saves */

// Lab 5.1's finished work, read from the cleaned snapshot (itsCleanCoachWork):
// HD-2180 resolved. The coach checks all sixteen steps in order before it
// shows Finish; the saved work keeps no step list, so the page checks the end,
// as Module 4's Lab 4.3 does. An old tab could still send an early message.
const ITS03_LAB1_TICKET = 'HD-2180';
function its03Lab1Complete(work) {
  const ticket = work && Array.isArray(work.tickets) ? work.tickets.find((entry) => entry.id === ITS03_LAB1_TICKET) : null;
  return Boolean(ticket) && ticket.status === 'Resolved';
}

async function its03ReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== ITS03_COACH_ID) return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = await currentUser();
  if (!user) { itsConfirmCoachReceipt(event, false); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { itsConfirmCoachReceipt(event, false, wrongStudent); return; }

  const work = itsCleanCoachWork(event.data.work);
  const coachKey = `${user.userId}|${ITS03_COACH_ID}`;
  if (!its03Lab1Complete(work)) {
    itsIncompleteWalkthroughs.add(coachKey);
    itsRefreshWalkthroughNotice(user, ITS03_COACH_ID, [ITS03_LAB1_KEY], ITS03_LAB1_START);
    itsConfirmCoachReceipt(event, false, 'incomplete');
    return;
  }
  itsIncompleteWalkthroughs.delete(coachKey);

  // Submit first: Lab 5.1 counts as complete only once the portal has its
  // attempt (saved now, or already waiting or approved).
  const received = await itsSubmitWalkthroughLabs(user, 'its-03', [ITS03_LAB1_KEY], work);
  its03User = user;
  if (received) {
    const saved = LabRuntime.load(ITS03_STATE_ID, user, ITS03_DEFAULT_STATE);
    saved.consoleStarted = true;
    saved.consoleCompleted = true;
    LabRuntime.save(ITS03_STATE_ID, user, saved);
    its03State = saved;
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-03', ITS03_LAB1_KEY);
  }
  itsConfirmCoachReceipt(event, received);

  if (!document.querySelector('.its03-shell')) return;
  render();
  const section = document.getElementById('its03-lab-5-1');
  if (section) section.scrollIntoView({ block: 'start' });
}

// Lab 5.2's completion: the simulator's practice set says its four tickets
// are done (ui/helpdesk.js hdPracticeReport; the set's `complete` and `done`
// rules in ui/helpdesk-data.js). Saved once, as a lab attempt with no score
// and no answers: completion, its time and the ticket ids. Every message gets
// an answer, so the simulator can say whether it was saved.
const ITS03_PRACTICE_TICKETS = ['HD-2181', 'HD-2182', 'HD-2183', 'HD-2186'];
const ITS03_PRACTICE_LOCK_MS = 15000;
function its03StorageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
function its03StorageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* storage blocked: no lock */ } }
function its03StorageRemove(key) { try { localStorage.removeItem(key); } catch (_) { /* storage blocked */ } }

async function its03ReceivePracticeCompletion(event) {
  const data = event.data;
  if (!data || data.type !== 'mnt-practice-complete' || data.id !== 'its-03') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const reply = (saved, reason) => {
    if (!event.source || typeof event.source.postMessage !== 'function') return;
    event.source.postMessage({ type: 'mnt-practice-received', id: 'its-03', nonce: data.nonce, saved: saved === true, ...(reason ? { reason } : {}) }, event.origin);
  };
  const user = await currentUser();
  if (!user) { reply(false, 'signed-out'); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { reply(false, wrongStudent); return; }
  const tickets = Array.isArray(data.tickets) ? data.tickets : [];
  if (tickets.length !== ITS03_PRACTICE_TICKETS.length || !ITS03_PRACTICE_TICKETS.every((id) => tickets.includes(id))) { reply(false, 'incomplete'); return; }
  // Already recorded (as loaded at sign-in, or saved on this page).
  if (itsLabSubmitted(user, ITS03_PRACTICE_KEY)) { reply(true); return; }
  if (itsLabSubmitting(user, ITS03_PRACTICE_KEY)) { reply(false, 'busy'); return; }
  // lab_attempts allows many rows per lab and this lab has no
  // course_module_labs row, so the database won't refuse a second record.
  // Another course page tab in this browser may be saving right now (the
  // lock), or may already have saved (the database read): either way, no
  // second record.
  const lock = `mnt.practice-save.${user.userId}.${ITS03_PRACTICE_KEY}`;
  const held = Number(its03StorageGet(lock)) || 0;
  if (Date.now() - held < ITS03_PRACTICE_LOCK_MS) { reply(false, 'busy'); return; }
  its03StorageSet(lock, String(Date.now()));
  let saved = false;
  try {
    const existing = await its03SavedPracticeAttempt(user);
    if (existing === null) { reply(false, 'save-failed'); return; }
    if (existing) {
      user.latestLabAttemptByKey = { ...(user.latestLabAttemptByKey || {}), [ITS03_PRACTICE_KEY]: existing };
      saved = true;
    } else {
      saved = await itsSubmitLabAttempt(user, 'its-03', ITS03_PRACTICE_KEY, {
        state: 'complete', result: { source: 'mnt-practice-complete', practiceSet: 'its-03', tickets: ITS03_PRACTICE_TICKETS.slice() },
      });
    }
  } finally {
    its03StorageRemove(lock);
  }
  if (saved && typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-03', ITS03_PRACTICE_KEY);
  reply(saved, saved ? '' : 'save-failed');
  its03User = user;
  if (document.querySelector('.its03-shell')) render();
}

// The student's saved Lab 5.2 record, read from the database: the attempt
// (in the shape latestLabAttemptByKey holds), false when there is none, or
// null when the read failed. A superseded or returned record doesn't count.
async function its03SavedPracticeAttempt(user) {
  if (typeof mntSupabase === 'undefined') return null;
  try {
    const { data, error } = await mntSupabase.from('lab_attempts')
      .select('completed_at, reviewed_at, redo_requested, superseded_at')
      .eq('user_id', user.userId).eq('lab_key', ITS03_PRACTICE_KEY)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });
    if (error) { console.error('Lab 5.2 completion read failed', error); return null; }
    const row = Array.isArray(data) ? data.find((entry) => entry && !entry.superseded_at && entry.redo_requested !== true) : null;
    return row ? { completedAt: row.completed_at, reviewedAt: row.reviewed_at || null, redoRequested: row.redo_requested === true, supersededAt: row.superseded_at || null } : false;
  } catch (error) {
    console.error('Lab 5.2 completion read threw', error);
    return null;
  }
}

function its03OnMessage(event) {
  return Promise.all([its03ReceivePracticeCompletion(event), its03ReceiveCoachCompletion(event)]);
}

registerModuleLab({
  program: 'it-support', moduleNumber: 5, moduleKey: 'its-03',
  view: viewItsModuleFivePage, wire: wireItsModuleFivePage, onMessage: its03OnMessage,
});
