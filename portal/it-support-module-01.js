/* Module 01 — IT Help Desk & Career Accelerator ('it-support').
 * Fictional org, tickets, and policy text; no real systems are involved.
 *
 * The page, in order:
 *   - Orientation (Lesson 1.1, ITHD-101.1): how the program runs, the LMS,
 *     technology setup, the Acceptable Use Policy, getting help and the chain
 *     of command, policies, the course calendar. Then the orientation tasks:
 *     acknowledge the policy (saved to the student's account) and the
 *     orientation check (retake any time). Not graded, not a lab, no lab key.
 *   - Learn It (Lesson 1.2): three readings with three diagrams, then the
 *     Learn It and A+ checks (practice only: nothing saved or sent).
 *   - Practice It: Guided Lab 1 (Lab 1.2, the real 'hd-m01' coach in the IT
 *     Service Desk simulator, ui/helpdesk.js + ui/coach.js), then the
 *     unguided tickets HD-2151, HD-2152 and SEC-2153 (not graded).
 *   - Prove It (HD-2125), reviewed by the instructor.
 *
 * Lab 1.1 (LMS & Environment Validation) is no longer on this page. Its lab
 * entry, past attempts and instructor sheet are kept elsewhere; it never
 * gated completion.
 */

const ITS01_SOURCES = [
  { title: 'School Catalog v1.2 (effective 2026-08-25)', org: 'Mission Next Technical Academy', url: '', placeholder: 'Link to the published catalog to be confirmed.', note: 'Policies, grading, attendance, grievances, records, withdrawal and refunds.' },
  { title: 'CompTIA A+ Certification', org: 'CompTIA', url: 'https://www.comptia.org/certifications/a', note: 'A public reference for the certification this course’s content lines up with. No certification exam is required to finish the program.' },
];

/* Lesson text. Block types (its01Blocks): h (sub-heading), p, ul, ol,
 * placeholder (a marked "to be confirmed" box), find (the not-graded "Find
 * it" list), diagram (a key of ITS01_DIAGRAMS), note ({ title, text }).
 * In any text, [[...]] is an inline "to be confirmed" placeholder.
 * bin/its-curriculum-check.js reads each lesson's title and minutes from this
 * file: they must match portal/data.js. */
const ITS01_LESSONS = [
  {
    id: 'its-01-lesson-01', number: '1.1', icon: 'ri-compass-3-line',
    title: 'Program Orientation, LMS Navigation & Professional Conduct', minutes: 90,
    learn: [
      'How this program runs and what you need to finish it',
      'Where to find everything in the LMS',
      'What your computer needs for this course',
      'The Acceptable Use Policy, who to ask for help, and the policies you need to know',
    ],
    blocks: [
      { h: 'Program orientation: how this program runs' },
      { ul: [
        'Mission Next is a clock-hour program licensed by the Florida Commission for Independent Education (CIE). The time you spend in lessons, labs and live sessions is part of your official record.',
        'The course runs for 6 weeks, two modules a week, with live sessions and self-paced work in the LMS.',
        'Every module follows the same rhythm: Learn It (three short readings), Practice It (a coached lab, then practice tickets that aren’t graded) and Prove It (one graded ticket that your instructor reviews).',
        'To finish the program, you complete all required assignments and projects, score at least 70% overall, attend at least 80% of live sessions, and meet your financial obligations.',
        'Your instructor grades self-paced lab work and answers questions within 24 hours, not counting weekends and holidays. If you’re falling behind, tell your instructor early rather than letting it slide.',
        'No certification exam is required to finish the program.',
      ] },
      { h: 'LMS navigation' },
      { ul: ['Modules hold your lessons and labs. Your gradebook shows a score once your instructor has finalized it.'] },
      { find: [
        'The link to Module 2.',
        'The Acceptable Use Policy.',
        'How to contact your instructor.',
        'Where your grades appear.',
        'Where the live session links are.',
        'Where you open the IT Service Desk simulator.',
      ] },
      { h: 'Technology setup' },
      { ul: [
        'You need a Windows or macOS laptop with at least 8 GB of RAM, an updated browser, a webcam, a headset and reliable broadband internet (School Catalog).',
        'Every lab runs in the browser-based IT Service Desk simulator. There is nothing to install and no virtual machine to build.',
        'Before your first live session, check that your webcam and headset work in the meeting tool. Nothing to upload.',
      ] },
      { h: 'Acceptable Use Policy' },
      { p: 'The full policy is in the orientation tasks below. Read it, then acknowledge it in the LMS: the acknowledgement is saved to your account.' },
      { h: 'Getting help and the chain of command' },
      { ul: [
        'Instructional support (course content, labs, tickets, grades): your instructor, through the LMS or a live session. Faculty respond to academic questions and grade self-paced lab work within 24 hours, not counting weekends and holidays.',
        'Technical support (you can’t sign in, a page or the simulator won’t load, something looks broken): [[support channel and hours]]. Tell them what you were doing, what you saw (the exact error) and when it happened, with a screenshot if you can. That’s the same habit you’ll use on tickets.',
        'Administrative support (enrollment documents, tuition and billing, student records, general program information, disability accommodations under the ADA): the Office of Student Services, led by the Director, Administrative & Student Services. Main line (850) 974-5763 · info@mntacademy.com.',
      ] },
      { p: 'Chain of command for a concern or complaint (Student Rights and Grievance Procedure):' },
      { ol: [
        'Put it in writing to your instructor.',
        'If it isn’t resolved, the Program Director reviews it.',
        'If it’s still not resolved, escalate to the On-Site Administrator (Cofounder & President).',
        'If it’s still not resolved, you may file a complaint with the Florida Commission for Independent Education, 325 West Gaines Street, Suite 1414, Tallahassee, FL 32399-0400, toll-free (888) 224-6684.',
      ] },
      { h: 'Policies you need to know' },
      { p: 'From the School Catalog v1.2. The full policies are in the catalog (see Sources & Further Reading).' },
      { ul: [
        'Attendance and identity: attend at least 80% of live sessions, with your video on during live sessions. Your LMS login is how the school verifies it’s you, so it’s yours alone.',
        'Academic integrity: your work must be your own. Plagiarism and cheating are grounds for dismissal under the Student Conduct & Dismissal Policy. [[policy on using AI tools in coursework]]',
        'Grades and progress: A 90–100, B 80–89, C 70–79 (the minimum passing grade), F below 70. Keep a cumulative grade of 70% or more to stay in good standing; below 70% you’re on academic probation for one week, and you may be dismissed if it doesn’t improve. Each Prove It allows 3 attempts; after a second fail, you meet with your instructor before trying again.',
        'Records, privacy, withdrawal and refunds: see the School Catalog’s Student Records & Privacy section and its refund and withdrawal policy.',
        'Career Readiness Core (M360-101): a separate 12-hour course that runs alongside this one, with its own lessons and grades.',
      ] },
      { h: 'Course calendar' },
      { placeholder: 'Cohort start and end dates, live session days and times, and weekly due dates, from your instructor.' },
    ],
  },
  {
    id: 'its-01-lesson-02', number: '1.2', icon: 'ri-route-line',
    title: 'The Help Desk Role: Workflow & the Troubleshooting Mindset', minutes: 90,
    learn: [
      'What a Tier 1 technician does and doesn’t do',
      'The CompTIA troubleshooting method, and how to write down your work',
      'How to find and follow a knowledge-base article',
      'How to verify a caller before you touch their account',
    ],
    blocks: [
      { h: 'Reading 1. What IT support is, and where you fit' },
      { ul: [
        'Companies run on four things you will hear about every day. Endpoints are the devices people use: laptops, desktops, phones, printers. The operating system (OS), such as Windows 11, is the software that runs the device. The network is what connects devices to each other and to the internet. Servers are computers that do one job for everyone, such as storing shared files or checking passwords.',
        'Support is split into tiers. Tier 1 (you) takes every new contact, fixes known problems (password resets, unlocks, printer queues, basic connectivity), and documents everything. Tier 2 goes deeper: hands-on hardware, reimaging, complex software. Tier 3 owns the systems underneath: servers, network design, security engineering. Escalating is not failing. It is how the system is designed to work when a problem needs access or skills Tier 1 doesn’t have.',
      ] },
      { diagram: 'tiers' },
      { h: 'Reading 2. One method for every problem' },
      { p: 'You cannot memorize a fix for every problem. You can follow the same method every time (CompTIA’s troubleshooting methodology, tested on both A+ exams):' },
      { ol: [
        'Identify the problem. Ask what they see, when it started, and what changed. Back up data before changing anything.',
        'Establish a theory of probable cause. Start with the simple and likely. Check the knowledge base (KB).',
        'Test the theory. If it’s confirmed, plan the fix. If not, form a new theory or escalate.',
        'Plan the fix and ask who else it affects.',
        'Implement or escalate.',
        'Verify it works from the user’s side, and prevent a repeat if you can.',
        'Document what you found, did and confirmed.',
      ] },
      { diagram: 'method' },
      { p: 'Example: “I can’t print and I have a deadline in an hour.” Identify: which printer, what error, only this document? Theory: stuck queue. Test: open the queue. Fix: clear the job, verify a test page prints, document. Compare “Our file server won’t boot after last night’s update.” You use the same method, but the plan is to escalate fast. Servers are Tier 3, and poking at one can make it worse.' },
      { note: { title: 'How to write it down', text: 'Every work note has three parts the next technician can use. Reported: what the user said, in their words. Tried: what you checked and did, with evidence. Result: what happened and how you confirmed it. If the ticket stays open or goes to another team, add Next action: who does what next, and by when. These are the same three things CompTIA’s last step asks for: findings, actions and outcomes.' } },
      { h: 'Reading 3. Conduct, identity and the knowledge base' },
      { ul: [
        'Verify before you act. Before any account action (reset, unlock, access change), confirm the caller is who they say they are, using your company’s procedure. At Northstar that is KB-0024: call back on the number in the directory (never a number the caller gives you), and confirm the employee ID. A name and department alone are not verification. Never ask for, type or write down a user’s password.',
        'Confidentiality and tone. Treat lab data as real personal data. Keep one user’s problem private from another. Use plain words: “Your account was locked after too many wrong passwords. I’ve unlocked it,” not “badPwdCount hit threshold.”',
        'The knowledge base (KB) is the help desk’s shared library of approved fixes and policies. Each article has an ID (KB-0024), an audience (Tier 1 or Tier 2) and steps. Search it by symptom words and error codes (“locked out repeated”, “0x80070005”), not vague phrases. If a KB article says “Tier 2 only”, you escalate instead of improvising. Two you’ll use this week: KB-0024 (account unlock and caller verification) and KB-0058 (local administrator rights are never granted to users).',
      ] },
      { p: 'When you can’t verify the caller (KB-0024, last step): make no account change. Log the ticket with Category Security › Suspicious request, set Caller to Unverified, and assign it to Security Operations (SOC) with the caller’s exact words, number and time. That is the whole route; you’ll learn more about social engineering in Module 11.' },
      { diagram: 'verify' },
      { note: { title: 'About priority in Module 1', text: 'The simulator pre-sets each ticket’s Priority, and the coach says why in one line. You’ll learn to set it yourself from Impact × Urgency in Module 2.' } },
      { note: { title: 'Triage in Module 1', text: 'Category and Priority are pre-set and are not scored until Module 2 teaches them. Triage points score who should own the ticket: resolve it at Tier 1, escalate to Tier 2 when the KB says so, or route it to Security Operations (SOC) when the caller can’t be verified (Readings 1 and 3).' } },
    ],
    comingUp: 'Work Sam Rivera’s account-lockout ticket end to end in the IT Service Desk simulator (Guided Lab 1), applying everything from these readings.',
  },
];

/* ------------------------------------------------------------- Diagrams */

/* Three diagrams, with the wording of the Week 1 plan. Each is drawn twice
 * from the same data: a wide layout and a narrow (phone) one, switched by a
 * container query in it-support-module-01.css. Colours come from CSS classes
 * (its01-dg-*) so they follow the page's theme variables. */
const ITS01_DIAGRAMS = {
  tiers: {
    title: 'Escalating hands the ticket to the tier with the right access',
    caption: 'The ticket and its notes move with every escalation, so the next tier starts where you stopped.',
    boxes: [
      { title: 'User', sub: 'reports it' },
      { title: 'Tier 1 (you)', sub: 'Service Desk', lines: ['Takes every new contact', 'Fixes known problems', 'Documents everything'], hl: true },
      { title: 'Tier 2', sub: 'Desktop Support', lines: ['Hands-on hardware', 'Reimaging', 'Complex software'] },
      { title: 'Tier 3', sub: 'Systems teams', lines: ['Servers', 'Network design', 'Security engineering'] },
    ],
    arrows: ['', 'escalates', 'escalates'],
    band: 'The ticket and its notes travel with it, so the user never re-explains',
  },
  method: {
    title: 'One method for every problem: if a theory fails, loop back',
    caption: 'Step 3 is the only place the method loops: a theory that doesn’t hold sends you back to step 2, or up to the next tier.',
    steps: [
      { title: 'Identify the problem', text: 'Ask what they see, when it started and what changed. Back up first.' },
      { title: 'Establish a theory of probable cause', text: 'Start with the simple and likely. Check the knowledge base (KB).' },
      { title: 'Test the theory', text: 'Confirmed: go on to plan the fix. Not confirmed: loop back.' },
      { title: 'Plan the fix', text: 'Ask who else it affects before you change anything.' },
      { title: 'Implement or escalate', text: 'Make the fix, or hand it to the tier that can, with your notes.' },
      { title: 'Verify', text: 'Confirm it works from the user’s side; prevent a repeat if you can.' },
      { title: 'Document', text: 'Write down what you found, did and confirmed.' },
    ],
    loop: 'Not confirmed: form a new theory or escalate',
  },
  verify: {
    title: 'No verification, no account change',
    caption: 'Both branches come from KB-0024, and the callback comes before every account action.',
    ask: { title: 'Caller asks for an account action', lines: ['A reset, an unlock or an access change'] },
    check: { title: 'Verify the caller (KB-0024)', lines: ['Call back on the directory number, never a number the caller gives you', 'Confirm the employee ID', 'A name and department are not enough'], bullets: true },
    decision: 'Verified?',
    yes: { title: 'Verified: follow the KB article', lines: ['Unlock the account, or guide them through the self-service password reset', 'You never ask for or see a password'], bullets: true },
    no: { title: 'Not verified: make no change', lines: ['Category: Security › Suspicious request', 'Caller: Unverified', 'Assign to Security Operations (SOC)', 'Log their exact words, number and time'], bullets: true, hl: true },
  },
};

// Every word a diagram shows, in reading order: the screen-reader description.
function its01DiagramWords(key) {
  const d = ITS01_DIAGRAMS[key];
  const box = (b) => `${b.title}${b.sub ? `, ${b.sub}` : ''}${b.lines && b.lines.length ? `: ${b.lines.join('; ')}` : ''}`;
  if (key === 'tiers') {
    return `${d.boxes.map((b, i) => `${i ? `${d.arrows[i - 1] || 'then'}: ` : ''}${box(b)}`).join('. ')}. ${d.band}.`;
  }
  if (key === 'method') {
    return `${d.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.text}`).join(' ')} A loop from step 3 back to step 2: ${d.loop}.`;
  }
  return `${box(d.ask)}. Then: ${box(d.check)}. ${d.decision} Yes: ${box(d.yes)}. No: ${box(d.no)}.`;
}

// Splits text into lines of at most max characters, at word breaks.
function its01Wrap(text, max) {
  const lines = [];
  let line = '';
  String(text).split(/\s+/).forEach((word) => {
    if (line && (line.length + 1 + word.length) > max) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  });
  if (line) lines.push(line);
  return lines;
}

const ITS01_DG = { pad: 12, title: 15, text: 13, lh: 18, charW: 0.56 };

// One box's wrapped lines: [{ text, cls }], laid out for width w.
function its01BoxLines(box, w) {
  const inner = w - ITS01_DG.pad * 2 - (box.num ? 34 : 0);
  const titleMax = Math.max(8, Math.floor(inner / (ITS01_DG.title * ITS01_DG.charW)));
  const textMax = Math.max(8, Math.floor(inner / (ITS01_DG.text * ITS01_DG.charW)));
  const out = [];
  its01Wrap(box.title, titleMax).forEach((text) => out.push({ text, cls: 'its01-dg-title' }));
  if (box.sub) its01Wrap(box.sub, textMax).forEach((text) => out.push({ text, cls: 'its01-dg-sub' }));
  (box.lines || []).forEach((item) => {
    its01Wrap(box.bullets ? `• ${item}` : item, textMax).forEach((text, i) => out.push({ text: box.bullets && i ? `  ${text}` : text, cls: 'its01-dg-text', gap: i === 0 }));
  });
  if (box.text) its01Wrap(box.text, textMax).forEach((text) => out.push({ text, cls: 'its01-dg-text' }));
  return out;
}
function its01BoxHeight(box, w) {
  return ITS01_DG.pad * 2 + its01BoxLines(box, w).length * ITS01_DG.lh + 4;
}
function its01Box(box, x, y, w, h) {
  const lines = its01BoxLines(box, w);
  const textX = x + ITS01_DG.pad + (box.num ? 34 : 0);
  const num = box.num ? `<circle class="its01-dg-num" cx="${x + ITS01_DG.pad + 13}" cy="${y + ITS01_DG.pad + 12}" r="13"/><text class="its01-dg-num-text" x="${x + ITS01_DG.pad + 13}" y="${y + ITS01_DG.pad + 17}" text-anchor="middle">${box.num}</text>` : '';
  const text = lines.map((line, i) => `<text class="${line.cls}" x="${textX}" y="${y + ITS01_DG.pad + 14 + i * ITS01_DG.lh}">${esc(line.text)}</text>`).join('');
  return `<rect class="its01-dg-box${box.hl ? ' its01-dg-hl' : ''}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>${num}${text}`;
}
function its01Arrow(x1, y1, x2, y2, id, hl) {
  return `<line class="its01-dg-line${hl ? ' its01-dg-line-hl' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${id}${hl ? '-hl' : ''})"/>`;
}
function its01Label(text, x, y, anchor = 'middle', hl = false, max = 40) {
  return its01Wrap(text, max).map((line, i) => `<text class="its01-dg-label${hl ? ' its01-dg-label-hl' : ''}" x="${x}" y="${y + i * 16}" text-anchor="${anchor}">${esc(line)}</text>`).join('');
}
function its01Markers(id) {
  const marker = (suffix, cls) => `<marker id="${id}${suffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="${cls}" d="M0,0 L10,5 L0,10 z"/></marker>`;
  return `<defs>${marker('', 'its01-dg-head')}${marker('-hl', 'its01-dg-head its01-dg-head-hl')}</defs>`;
}
function its01Svg(key, layout, width, height, body) {
  const d = ITS01_DIAGRAMS[key];
  return `<svg class="its01-dg-${layout}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(d.title)}" aria-describedby="its01-dg-${key}-desc" focusable="false">${body}</svg>`;
}

function its01TiersSvg(layout) {
  const d = ITS01_DIAGRAMS.tiers;
  const id = `its01-dg-tiers-${layout}-arrow`;
  if (layout === 'wide') {
    const w = 144, gap = 66, width = 4 * w + 3 * gap;
    const h = Math.max(...d.boxes.map((b) => its01BoxHeight(b, w)));
    const top = 4;
    let body = its01Markers(id);
    d.boxes.forEach((b, i) => {
      const x = i * (w + gap);
      body += its01Box(b, x, top, w, h);
      if (i) {
        body += its01Arrow(x - gap + 4, top + 34, x - 4, top + 34, id);
        if (d.arrows[i - 1]) body += its01Label(d.arrows[i - 1], x - gap / 2, top + 26);
      }
    });
    const bandX = w + gap, bandW = width - bandX, bandY = top + h + 18;
    const band = its01Wrap(d.band, Math.floor((bandW - 24) / (ITS01_DG.text * ITS01_DG.charW)));
    const bandH = 20 + band.length * ITS01_DG.lh;
    body += `<rect class="its01-dg-band" x="${bandX}" y="${bandY}" width="${bandW}" height="${bandH}" rx="8"/>`;
    body += band.map((line, i) => `<text class="its01-dg-text" x="${bandX + bandW / 2}" y="${bandY + 23 + i * ITS01_DG.lh}" text-anchor="middle">${esc(line)}</text>`).join('');
    return its01Svg('tiers', layout, width, bandY + bandH + 4, body);
  }
  const width = 360, x = 20, w = 320, gap = 46;
  let y = 4;
  let body = its01Markers(id);
  d.boxes.forEach((b, i) => {
    if (i) {
      body += its01Arrow(x + w / 2, y + 4, x + w / 2, y + gap - 4, id);
      if (d.arrows[i - 1]) body += its01Label(d.arrows[i - 1], x + w / 2 + 12, y + gap / 2 + 5, 'start');
      y += gap;
    }
    const h = its01BoxHeight(b, w);
    body += its01Box(b, x, y, w, h);
    y += h;
  });
  y += 16;
  const band = its01Wrap(d.band, Math.floor((w - 24) / (ITS01_DG.text * ITS01_DG.charW)));
  const bandH = 20 + band.length * ITS01_DG.lh;
  body += `<rect class="its01-dg-band" x="${x}" y="${y}" width="${w}" height="${bandH}" rx="8"/>`;
  body += band.map((line, i) => `<text class="its01-dg-text" x="${x + w / 2}" y="${y + 23 + i * ITS01_DG.lh}" text-anchor="middle">${esc(line)}</text>`).join('');
  return its01Svg('tiers', layout, width, y + bandH + 4, body);
}

function its01MethodSvg(layout) {
  const d = ITS01_DIAGRAMS.method;
  const id = `its01-dg-method-${layout}-arrow`;
  const wide = layout === 'wide';
  const width = wide ? 700 : 360;
  const w = wide ? 470 : 240;
  const channel = w + (wide ? 50 : 26);
  const gap = 30;
  let y = 4;
  const tops = [];
  const heights = [];
  let body = its01Markers(id);
  d.steps.forEach((step, i) => {
    if (i) {
      body += its01Arrow(w / 2, y + 3, w / 2, y + gap - 3, id);
      y += gap;
    }
    const box = { ...step, num: i + 1 };
    const h = its01BoxHeight(box, w);
    tops.push(y); heights.push(h);
    body += its01Box(box, 0, y, w, h);
    y += h;
  });
  // The loop: from step 3's right edge out, up, and back into step 2.
  const from = tops[2] + heights[2] / 2;
  const to = tops[1] + heights[1] / 2;
  body += `<path class="its01-dg-line its01-dg-line-hl" d="M${w + 3},${from} H${channel} V${to} H${w + 5}" marker-end="url(#${id}-hl)"/>`;
  const labelMax = wide ? 21 : 11;
  const labelLines = its01Wrap(d.loop, labelMax).length;
  body += its01Label(d.loop, channel + 10, (from + to) / 2 - ((labelLines - 1) * 16) / 2 + 4, 'start', true, labelMax);
  return its01Svg('method', layout, width, y + 4, body);
}

function its01VerifySvg(layout) {
  const d = ITS01_DIAGRAMS.verify;
  const id = `its01-dg-verify-${layout}-arrow`;
  const wide = layout === 'wide';
  const width = wide ? 760 : 360;
  const gap = 34;
  let body = its01Markers(id);
  const cw = wide ? 440 : 320;
  const cx = width / 2;
  let y = 4;
  [d.ask, d.check].forEach((box, i) => {
    if (i) { body += its01Arrow(cx, y + 3, cx, y + gap - 3, id); y += gap; }
    const h = its01BoxHeight(box, cw);
    body += its01Box(box, cx - cw / 2, y, cw, h);
    y += h;
  });
  body += its01Arrow(cx, y + 3, cx, y + gap - 3, id);
  y += gap;
  const dw = wide ? 200 : 160, dh = wide ? 84 : 76;
  body += `<polygon class="its01-dg-box" points="${cx},${y} ${cx + dw / 2},${y + dh / 2} ${cx},${y + dh} ${cx - dw / 2},${y + dh / 2}"/>`;
  body += `<text class="its01-dg-title" x="${cx}" y="${y + dh / 2 + 5}" text-anchor="middle">${esc(d.decision)}</text>`;
  const mid = y + dh / 2;
  if (wide) {
    const bw = 360, by = y + dh + 30;
    const hy = Math.max(its01BoxHeight(d.yes, bw), its01BoxHeight(d.no, bw));
    const yesX = 0, noX = width - bw;
    body += `<path class="its01-dg-line" d="M${cx - dw / 2},${mid} H${yesX + bw / 2} V${by - 3}" marker-end="url(#${id})"/>`;
    body += its01Label('Yes', cx - dw / 2 - 14, mid - 8, 'end');
    body += `<path class="its01-dg-line its01-dg-line-hl" d="M${cx + dw / 2},${mid} H${noX + bw / 2} V${by - 3}" marker-end="url(#${id}-hl)"/>`;
    body += its01Label('No', cx + dw / 2 + 14, mid - 8, 'start', true);
    body += its01Box(d.yes, yesX, by, bw, hy);
    body += its01Box(d.no, noX, by, bw, hy);
    return its01Svg('verify', layout, width, by + hy + 4, body);
  }
  const bw = 300, bx = 20;
  let by = y + dh + gap;
  body += its01Arrow(cx, y + dh + 3, cx, by - 3, id);
  body += its01Label('Yes', cx + 10, y + dh + gap / 2 + 5, 'start');
  const yh = its01BoxHeight(d.yes, bw);
  body += its01Box(d.yes, bx, by, bw, yh);
  const noY = by + yh + gap;
  const rail = width - 12;
  body += `<path class="its01-dg-line its01-dg-line-hl" d="M${cx + dw / 2},${mid} H${rail} V${noY + 24} H${bx + bw + 3}" marker-end="url(#${id}-hl)"/>`;
  body += its01Label('No', cx + dw / 2 + 12, mid - 8, 'start', true);
  const nh = its01BoxHeight(d.no, bw);
  body += its01Box(d.no, bx, noY, bw, nh);
  return its01Svg('verify', layout, width, noY + nh + 4, body);
}

const ITS01_DIAGRAM_DRAW = { tiers: its01TiersSvg, method: its01MethodSvg, verify: its01VerifySvg };

function its01Diagram(key) {
  const d = ITS01_DIAGRAMS[key];
  const draw = ITS01_DIAGRAM_DRAW[key];
  return `<figure class="its01-dg" data-its01-diagram="${esc(key)}">
    <p class="its01-dg-heading">${esc(d.title)}</p>
    ${draw('wide')}
    ${draw('narrow')}
    <p class="its01-sr-only" id="its01-dg-${esc(key)}-desc">${esc(its01DiagramWords(key))}</p>
    <figcaption>${esc(d.caption)}</figcaption>
  </figure>`;
}

/* ------------------------------------------------------------- Lessons */

// Escaped text; [[...]] becomes a marked "to be confirmed" placeholder.
function its01Text(text) {
  return esc(text).replace(/\[\[(.+?)\]\]/g, (_, what) => `<span class="its01-placeholder-inline" data-its01-placeholder>To be confirmed: ${what}.</span>`);
}

function its01Blocks(blocks) {
  return blocks.map((block) => {
    if (block.h) return `<h4>${esc(block.h)}</h4>`;
    if (block.p) return `<p>${its01Text(block.p)}</p>`;
    if (block.ul) return `<ul>${block.ul.map((item) => `<li>${its01Text(item)}</li>`).join('')}</ul>`;
    if (block.ol) return `<ol>${block.ol.map((item) => `<li>${its01Text(item)}</li>`).join('')}</ol>`;
    if (block.placeholder) return `<div class="its01-placeholder" data-its01-placeholder><strong>To be confirmed</strong><p>${esc(block.placeholder)}</p></div>`;
    if (block.find) return `<div class="its01-practice"><strong><i class="ri-search-line" aria-hidden="true"></i> Find it (not graded)</strong><ol>${block.find.map((item) => `<li>${esc(item)}</li>`).join('')}</ol></div>`;
    if (block.diagram) return its01Diagram(block.diagram);
    if (block.note) return `<div class="its01-note"><strong>${esc(block.note.title)}</strong><p>${esc(block.note.text)}</p></div>`;
    return '';
  }).join('');
}

function its01LessonCard(lesson) {
  return `<details class="its01-lesson" data-its01-lesson="${esc(lesson.id)}">
    <summary><span class="its01-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(lesson.number)} · ${esc(lesson.title)}</strong><small>${formatInstructionalMinutes(lesson.minutes)}</small></span><i class="ri-arrow-down-s-line its01-chevron" aria-hidden="true"></i></summary>
    <div class="its01-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${lesson.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${its01Blocks(lesson.blocks)}
      ${lesson.comingUp ? `<div class="its01-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(lesson.comingUp)}</span></div>` : ''}
    </div>
  </details>`;
}

/* ------------------------------------------------ Acceptable Use Policy */

/* An orientation task, not a lab: the acknowledgement is saved to the
 * student's account (module_progress.case_state) under the id Lab 1.1 used,
 * so acknowledgements already given are still found. The policy text changed
 * on 2026-11-10, so an acknowledgement of an earlier version (no aupVersion)
 * asks the student to acknowledge again. */
const ITS01_AUP_VERSION = '2026-11-10';
const ITS01_AUP_VERSION_DAY = 'Nov 10, 2026';
const ITS01_AUP_PARAGRAPHS = [
  'Use the simulator and course materials only for coursework. Don’t try to reach any system outside an assigned lab.',
  'Credentials: keep your LMS login to yourself. Don’t share it with anyone, including other students. The simulator never needs a real password, so never type one into it.',
  'Confidentiality: the people, company and data in the labs are fictional. Treat them as real personal data anyway: never share, post or screenshot them outside the course.',
];

// The case-state id Lab 1.1 used; kept so earlier acknowledgements carry over.
const ITS01_STATE_ID = 'its01-lms-validation-v1';
const ITS01_LAB2_KEY = 'lab-its-01-ticket-triage';
const ITS01_PROVE_KEY = 'lab-its-01-prove-it';

const ITS01_LAB_KEYS = [ITS01_LAB2_KEY, ITS01_PROVE_KEY];
const ITS01_LAB2_START = 'Start Lab 1.2 walkthrough';

const ITS01_DEFAULT_STATE = {
  aupReadVersion: null, aupAcknowledged: false, aupVersion: null, aupAcknowledgedAt: null,
  orientationCheckCompleted: false, orientationCheckCompletedAt: null,
  consoleStarted: false, consoleCompleted: false,
};

let its01State = null;
let its01User = null;

function its01Load(user) {
  its01User = user;
  // Saved to the student's account (module_progress.case_state), so the
  // policy acknowledgement and the orientation check come back in any
  // browser after sign-in.
  its01State = LabRuntime.loadCaseState(ITS01_STATE_ID, 'its-01', user, ITS01_DEFAULT_STATE);
  // The simulator's popup message is the only way a walkthrough is recorded;
  // a return by link only shows that it wasn't (see itsNoteCoachReturn).
  itsNoteCoachReturn(user, 'hd-m01', [ITS01_LAB2_KEY]);
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-01');
  return its01State;
}

function its01Save() {
  if (its01User && its01State) LabRuntime.saveCaseState(ITS01_STATE_ID, 'its-01', its01User, its01State);
}

function its01AupCurrent() {
  return Boolean(its01State && its01State.aupAcknowledged === true && its01State.aupVersion === ITS01_AUP_VERSION);
}
function its01AupRead() {
  return Boolean(its01State && its01State.aupReadVersion === ITS01_AUP_VERSION);
}
function its01Day(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

function its01AupAck() {
  if (its01AupCurrent()) {
    const day = its01Day(its01State.aupAcknowledgedAt);
    return `<div class="its01-aup-ack-wrap" data-its01-aup-done>
      <div class="its01-aup-ack">
        <input type="checkbox" id="its01-aup-checkbox" data-its01-aup-checkbox checked disabled />
        <label for="its01-aup-checkbox">I have read and acknowledge the Acceptable Use Policy.</label>
      </div>
      <p class="its01-aup-hint"><i class="ri-check-line" aria-hidden="true"></i> Acknowledged${day ? ` on ${esc(day)}` : ''}. Saved to your account.</p>
    </div>`;
  }
  const earlier = its01State.aupAcknowledged === true;
  const read = its01AupRead();
  return `<div class="its01-aup-ack-wrap">
    ${earlier ? `<p class="its01-aup-changed" role="status">The Acceptable Use Policy changed on ${ITS01_AUP_VERSION_DAY}. Read it again and acknowledge the new version.</p>` : ''}
    <div class="its01-aup-ack">
      <input type="checkbox" id="its01-aup-checkbox" data-its01-aup-checkbox ${read ? '' : 'disabled'} />
      <label for="its01-aup-checkbox">I have read and acknowledge the Acceptable Use Policy.</label>
    </div>
    <p class="its01-aup-hint">${read ? 'Your acknowledgement is saved to your account.' : 'Scroll to the end of the policy text to enable acknowledgment.'}</p>
  </div>`;
}

function its01Aup() {
  return `<div class="its01-aup" id="its01-aup">
    <strong>Acceptable Use Policy</strong>
    <div class="its01-aup-text" data-its01-aup-text tabindex="0" aria-label="Acceptable Use Policy, scroll to read in full">
      ${ITS01_AUP_PARAGRAPHS.map((p) => `<p>${esc(p)}</p>`).join('')}
    </div>
    ${its01AupAck()}
  </div>`;
}

/* ------------------------------------------------------------- Checks */

/* Three checks, answered one question at a time with feedback straight away.
 *   - orientation: an orientation task. It's complete once all six answers
 *     are right; only that (and when) is saved. Retake it any time.
 *   - learn, aplus: practice only. Nothing is saved or sent.
 * No check records a lab attempt, a lab key or a score. */
const ITS01_CHECKS = {
  orientation: {
    title: 'Orientation check',
    intro: 'Six questions on getting help and the Acceptable Use Policy. Not graded: retake it as often as you like. It’s complete once all six answers are right.',
    questions: [
      { q: 'Your simulator won’t load before a lab. Who do you contact first?', choices: ['Your instructor', 'Technical support', 'The Office of Student Services', 'Another student'], answer: 1 },
      { q: 'You’re stuck on a Practice It ticket. Who do you ask?', choices: ['Technical support', 'The Office of Student Services', 'Your instructor', 'The Commission for Independent Education'], answer: 2 },
      { q: 'You need a copy of your enrollment documents. Who handles it?', choices: ['Your instructor', 'Technical support', 'The Office of Student Services', 'The Program Director'], answer: 2 },
      { q: 'You raised a concern in writing with your instructor and it wasn’t resolved. What’s the next step?', choices: ['File with the Commission for Independent Education', 'The Program Director reviews it', 'Post about it in the course chat', 'Stop attending'], answer: 1 },
      { q: 'A classmate asks to borrow your LMS login for one night. What do you do?', choices: ['Share it, it’s only one night', 'Share it but change it after', 'Don’t share it: your login is yours alone (Acceptable Use Policy)', 'Ask your instructor to share theirs instead'], answer: 2 },
      { q: 'You want to show a friend a lab ticket that includes a fictional user’s details. What does the Acceptable Use Policy say?', choices: ['Fine, the data is fake', 'Fine if you blur the name', 'Don’t: treat lab data as real personal data and never share, post or screenshot it outside the course', 'Ask the user in the ticket'], answer: 2 },
    ],
  },
  learn: {
    title: 'Learn It knowledge check',
    intro: 'Eight questions on the three readings. Practice only: nothing is saved or sent to your instructor.',
    questions: [
      { q: 'A user calls with a problem Tier 1 can’t fix because it needs server access. What does escalating mean here?', choices: ['The technician failed', 'The problem goes to the tier with the right access, with the notes attached', 'The user must call back later', 'The ticket is closed'], answer: 1,
        why: 'Escalating isn’t failing: the ticket goes to the tier with the access or skills the problem needs, and your notes travel with it so the user never re-explains (Reading 1).' },
      { q: 'A caller gives their name and department and asks for an unlock. Under KB-0024, is that enough?', choices: ['Yes, if they sound sure', 'Yes, for executives', 'No: call back on the directory number and confirm the employee ID', 'No: ask for their current password'], answer: 2,
        why: 'A name and department alone are not verification. KB-0024: call back on the number in the directory, never one the caller gives you, and confirm the employee ID. Never ask for a password (Reading 3).' },
      { q: 'Which is the best KB search for a user who sees error 0x80070005?', choices: ['“computer broken”', '“0x80070005”', '“help”', '“Windows”'], answer: 1,
        why: 'Search the KB by symptom words and error codes, not vague phrases. The exact error code finds the article that covers it (Reading 3).' },
      { q: 'A KB article says “Tier 2 only.” What should a Tier 1 technician do?', choices: ['Try the steps anyway', 'Escalate to Tier 2', 'Ask the user to try', 'Skip the article'], answer: 1,
        why: '“Tier 2 only” means the steps need access or skills Tier 1 doesn’t have. Escalate with your notes instead of improvising (Reading 3).' },
      { q: 'Which customer message is written correctly?', choices: ['“badPwdCount hit threshold; cleared.”', '“Your account was locked after too many wrong passwords. I’ve unlocked it.”', '“Fixed.”', '“Per KB-0024 step 3, unlocked.”'], answer: 1,
        why: 'Use plain words that tell the user what happened and what you did. Codes, jargon and one-word replies don’t (Reading 3).' },
      { q: 'A caller can’t be verified and refuses a callback, but insists on a reset. What does KB-0024 say to do?', choices: ['Reset it to avoid a complaint', 'Make no change; log it as Security › Suspicious request and assign it to the SOC', 'Hang up and do nothing', 'Email the new password to the account owner'], answer: 1,
        why: 'No verification, no account change. KB-0024’s last step: log it as Security › Suspicious request, set Caller to Unverified, and assign it to Security Operations (SOC) with the caller’s exact words, number and time (Reading 3).' },
      { q: 'Your first theory is confirmed. What comes next in the method?', choices: ['Document', 'Establish a plan of action and identify who else is affected', 'Escalate', 'Close the ticket'], answer: 1,
        why: 'After a confirmed theory comes step 4: plan the fix and ask who else it affects before you change anything (Reading 2).' },
      { q: 'Which part of a work note records what happened and how you confirmed it?', choices: ['Reported', 'Tried', 'Next action', 'Result'], answer: 3,
        why: 'Result is what happened and how you confirmed it. Reported is what the user said, Tried is what you checked and did, and Next action is who does what next (Reading 2).' },
    ],
  },
  aplus: {
    title: 'A+ check',
    intro: 'Four questions in the style of the CompTIA A+ exams. Practice only: nothing is saved or sent to your instructor.',
    questions: [
      { q: 'A user says their laptop won’t connect to Wi-Fi. What should a technician do first?', choices: ['Replace the wireless card', 'Question the user and identify any recent changes', 'Reinstall the driver', 'Escalate to Tier 2'], answer: 1,
        why: 'Step 1 is identify the problem: question the user and find out what changed.' },
      { q: 'A technician’s first theory is not confirmed by testing. What is the next step?', choices: ['Document findings', 'Implement the solution anyway', 'Establish a new theory or escalate', 'Verify full system functionality'], answer: 2,
        why: 'When testing doesn’t confirm the theory, the method loops back: establish a new theory, or escalate. It’s the only place the method loops (step 3).' },
      { q: 'After fixing a problem and confirming the user can work, what remains?', choices: ['Establish a theory', 'Document findings, actions and outcomes', 'Question the obvious', 'Back up data'], answer: 1,
        why: 'Documentation is the final step.' },
      { q: 'Before replacing a user’s hard drive, which step protects the user?', choices: ['Test the theory', 'Perform a backup', 'Implement preventive measures', 'Escalate'], answer: 1,
        why: 'Back up data before making changes (part of identify the problem).' },
    ],
  },
};
const ITS01_LETTERS = ['A', 'B', 'C', 'D'];

// This page's answers, by check: { questionIndex: choiceIndex }. Kept in page
// memory only; a reload starts every check again.
const its01CheckAnswers = { orientation: {}, learn: {}, aplus: {} };

function its01CheckDone(key) {
  const check = ITS01_CHECKS[key];
  return check.questions.every((_, i) => Object.prototype.hasOwnProperty.call(its01CheckAnswers[key], i));
}
function its01CheckAllRight(key) {
  return ITS01_CHECKS[key].questions.every((question, i) => its01CheckAnswers[key][i] === question.answer);
}

function its01CheckQuestion(key, question, index) {
  const chosen = its01CheckAnswers[key][index];
  const answered = chosen !== undefined;
  const right = answered && chosen === question.answer;
  const choices = question.choices.map((choice, c) => {
    const cls = answered && c === question.answer ? ' is-answer' : answered && c === chosen ? ' is-wrong' : '';
    return `<button type="button" class="its01-choice${cls}" data-its01-answer data-check="${key}" data-q="${index}" data-choice="${c}" aria-pressed="${answered && c === chosen}" ${answered ? 'disabled' : ''}><span>${ITS01_LETTERS[c]}</span> ${esc(choice)}</button>`;
  }).join('');
  const correct = `${ITS01_LETTERS[question.answer]}) ${question.choices[question.answer]}`;
  const feedback = !answered ? ''
    : `<p class="its01-check-result ${right ? 'is-right' : 'is-wrong'}"><i class="${right ? 'ri-check-line' : 'ri-close-line'}" aria-hidden="true"></i> <strong>${right ? 'Correct.' : 'Not quite.'}</strong> ${right ? '' : `The answer is ${esc(correct)}.`}</p>${question.why ? `<p class="its01-check-why">${esc(question.why)}</p>` : ''}`;
  return `<li class="its01-check-q">
    <p class="its01-check-prompt" id="its01-${key}-q${index}">${esc(question.q)}</p>
    <div class="its01-choices" role="group" aria-labelledby="its01-${key}-q${index}">${choices}</div>
    <div class="its01-check-feedback" id="its01-${key}-q${index}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

function its01CheckFooter(key) {
  const anyAnswered = Object.keys(its01CheckAnswers[key]).length > 0;
  const reset = anyAnswered ? `<button type="button" class="its01-check-reset" data-its01-check-reset="${key}"><i class="ri-restart-line" aria-hidden="true"></i> Start again</button>` : '';
  let status = '';
  if (key === 'orientation') {
    if (its01CheckDone(key) && !its01CheckAllRight(key)) status = 'Some answers weren’t right. Press Start again to retake the check.';
    else if (its01State && its01State.orientationCheckCompleted === true) {
      const day = its01Day(its01State.orientationCheckCompletedAt);
      status = `<i class="ri-check-line" aria-hidden="true"></i> Orientation check complete${day ? ` (${esc(day)})` : ''}. Saved to your account. You can retake it any time.`;
    }
  } else if (its01CheckDone(key)) status = 'That’s every question. Press Start again to try them again.';
  return `<div class="its01-check-footer"><p class="its01-check-status" role="status">${status}</p>${reset}</div>`;
}

function its01Check(key) {
  const check = ITS01_CHECKS[key];
  return `<div class="its01-check" data-its01-check="${key}" id="its01-check-${key}">
    <h3>${esc(check.title)}</h3>
    <p class="its01-instruction">${esc(check.intro)}</p>
    <ol class="its01-check-list">${check.questions.map((question, i) => its01CheckQuestion(key, question, i)).join('')}</ol>
    ${its01CheckFooter(key)}
  </div>`;
}

/* ----------------------------------------------------------- Sections */

function its01Orientation() {
  return `<section class="its01-section" id="its01-orientation" aria-labelledby="its01-orientation-title">
    <div class="its01-section-heading"><span><i class="ri-compass-3-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Orientation · start here · not graded</p><h2 id="its01-orientation-title">Orientation: start here</h2></div></div>
    <p class="its01-instruction">Do this first, before Learn It. Orientation isn’t graded and isn’t a lab.</p>
    <div class="its01-lesson-grid">${its01LessonCard(ITS01_LESSONS[0])}</div>
    <div class="its01-tasks" id="its01-orientation-tasks">
      <h3>Orientation tasks (not graded)</h3>
      <ul>
        <li>Read the Acceptable Use Policy and acknowledge it. The acknowledgement is saved to your account.</li>
        <li>Take the orientation check below. You can retake it as often as you like.</li>
      </ul>
      ${its01Aup()}
      ${its01Check('orientation')}
    </div>
  </section>`;
}

function its01Learn() {
  return `<section class="its01-section" id="its01-lessons" aria-labelledby="its01-lessons-title">
    <div class="its01-section-heading"><span>L</span><div><p class="its01-kicker">Learn It</p><h2 id="its01-lessons-title">Three readings</h2></div></div>
    <p class="its01-instruction">Open the lesson for the three readings and their diagrams, then try the checks below.</p>
    <div class="its01-lesson-grid">${its01LessonCard(ITS01_LESSONS[1])}</div>
  </section>`;
}

function its01Checks() {
  return `<section class="its01-section" id="its01-checks" aria-labelledby="its01-checks-title">
    <div class="its01-section-heading"><span><i class="ri-question-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Learn It · practice · not graded</p><h2 id="its01-checks-title">Check your understanding</h2></div></div>
    <p class="its01-instruction">Choose an answer to see whether it’s right and why. Nothing here is graded, saved or sent to your instructor.</p>
    ${its01Check('learn')}
    ${its01Check('aplus')}
  </section>`;
}

function its01Lab2Status() {
  return itsLabStatusHtml(its01User, ITS01_LAB2_KEY, { label: 'Lab 1.2', prefix: 'its01', pendingText: 'Complete the guided walkthrough in the simulator to finish this lab.' });
}

function its01Lab2() {
  const button = itsWalkthroughButton(its01User, [ITS01_LAB2_KEY]);
  return `<section class="its01-section its01-lab-section" id="its01-lab-1-2" aria-labelledby="its01-lab-1-2-title">
    <div class="its01-section-heading"><span>1</span><div><p class="its01-kicker">Practice It · Guided Lab 1 (Lab 1.2) · coached</p><h2 id="its01-lab-1-2-title">A Day in the Life of an L1 Technician</h2></div></div>
    <p class="its01-instruction">Work your first ticket end to end in the IT Service Desk simulator: INC0010150, Sam Rivera’s account lockout. Take the ticket, find out what changed, follow KB-0024 to verify Sam and unlock the account, confirm Sam can sign in, tell Sam what to do if it happens again, and write the work note. A coach walks you through every step. No commands needed.</p>
    <a class="itsw-evidence-button" data-its01-console-launch href="${esc(itsCoachLaunchHref('hd-m01', its01User))}" target="_blank" rel="opener">
      <i class="${button.icon}" aria-hidden="true"></i> ${{ redo: 'Redo the walkthrough', review: 'Review the walkthrough', start: ITS01_LAB2_START }[button.mode]}
    </a>
    ${itsWalkthroughNoticeHtml(its01User, 'hd-m01', [ITS01_LAB2_KEY], ITS01_LAB2_START)}
    ${its01Lab2Status()}
    ${itsRedoNoticeHtml(its01User, [{ key: ITS01_LAB2_KEY, action: 'Run the walkthrough again to resubmit this lab.' }])}
  </section>`;
}

// Module 1's unguided tickets (1-A to 1-C), not graded: the simulator opens
// just these tickets in their own saved shift (?practice=its-01,
// ui/helpdesk.js), with feedback but no score, and sends nothing back to
// this page.
function its01PracticeTicketsHref(user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?practice=its-01&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
}
function its01PracticeTickets() {
  return `<section class="its01-section" id="its01-practice-tickets" aria-labelledby="its01-practice-tickets-title">
    <div class="its01-section-heading"><span>2</span><div><p class="its01-kicker">Practice It · on your own · not graded</p><h2 id="its01-practice-tickets-title">Unguided tickets (not graded)</h2></div></div>
    <p class="its01-instruction">Three more tickets to work on your own: Leah Brooks has forgotten her password, Ravi Shah has cracked his laptop screen, and a caller wants an executive’s password reset in a hurry. Use the method, search the knowledge base and verify callers with KB-0024. Press Check my work on a ticket for feedback. Nothing is graded or sent to your instructor.</p>
    <a class="itsw-evidence-button" data-its01-practice-launch href="${esc(its01PracticeTicketsHref(its01User))}" target="_blank" rel="noopener">
      <i class="ri-play-list-line" aria-hidden="true"></i> Open the unguided tickets
    </a>
  </section>`;
}

// Module 1's Prove It: one independent ticket in the simulator, reviewed by the
// instructor. Practice It is recommended first, never required. A submitted
// attempt has nothing left to open. What it shows comes from the server's
// attempt (itsLabStatus); the simulator reports back by message
// (itsProveReceiveMessage).
function its01Prove() {
  const user = its01User;
  const returned = itsLabReturned(user, ITS01_PROVE_KEY);
  return `<section class="its01-section its01-lab-section" id="its01-prove-it" aria-labelledby="its01-prove-it-title">
    <div class="its01-section-heading"><span>3</span><div><p class="its01-kicker">Prove It · Assessment Lab · instructor reviewed</p><h2 id="its01-prove-it-title">${esc(itsLabTitle(ITS01_PROVE_KEY))}</h2></div></div>
    <p class="its01-instruction">Work one new ticket on your own in the IT Service Desk simulator: no coach, no hints and no feedback before you submit. Your instructor reviews your work.</p>
    <p class="its01-instruction">Complete Guided Lab 1 first: it prepares you for this.</p>
    ${itsLabSubmitted(user, ITS01_PROVE_KEY) ? '' : `<a class="itsw-evidence-button" data-its01-prove-launch href="${esc(itsProveLaunchHref('its-01', user))}" target="_blank" rel="opener">
      <i class="${returned ? 'ri-restart-line' : 'ri-terminal-box-line'}" aria-hidden="true"></i> ${returned ? 'Reopen the Prove It' : 'Start the Prove It'}
    </a>`}
    <div class="itss-walkthrough-notice" data-its01-prove-notice role="status" hidden></div>
    ${itsLabStatusHtml(user, ITS01_PROVE_KEY, { label: 'Prove It', prefix: 'its01', pendingText: 'Press Submit in the simulator when you finish the ticket.' })}
    ${itsLabStatus(user, ITS01_PROVE_KEY) === 'passed' && typeof markedLabLinkHtml === 'function' ? `<p>${markedLabLinkHtml(ITS01_PROVE_KEY, 'See your score and feedback')}</p>` : ''}
    ${itsRedoNoticeHtml(user, [{ key: ITS01_PROVE_KEY, action: 'Reopen the Prove It, make your changes, then press Resubmit in the simulator. You can resubmit once for each return.' }])}
  </section>`;
}

// Sources: a source with no link yet shows its placeholder instead.
function its01Sources() {
  return `<div class="msources-block">
    <h3 class="msources-title">Further Reading</h3>
    <ul class="msources-list">
      ${ITS01_SOURCES.map((source) => `<li class="msources-item">
        ${source.url
          ? `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer" class="msources-link"><span class="msources-title-text">${esc(source.title)}</span><span class="msources-org">${esc(source.org)}</span></a>`
          : `<span class="msources-link"><span class="msources-title-text">${esc(source.title)}</span><span class="msources-org">${esc(source.org)}</span></span><p class="its01-placeholder-inline" data-its01-placeholder>To be confirmed: ${esc(source.placeholder)}</p>`}
        ${source.note ? `<p class="msources-note">${esc(source.note)}</p>` : ''}
      </li>`).join('')}
    </ul>
  </div>`;
}

/* The rail. Orientation (the policy acknowledgement) and the orientation
 * check count toward the module's progress; the Learn It and A+ checks, the
 * unguided tickets and Sources don't. */
function its01NavSections(user) {
  return [
    { id: 'orientation', title: 'Orientation', type: 'lecture', phase: 'learn', isComplete: its01AupCurrent(), scrollId: 'its01-orientation' },
    { id: 'orientation-check', title: 'Orientation check', type: 'quiz', phase: 'learn', isComplete: its01State.orientationCheckCompleted === true, scrollId: 'its01-check-orientation' },
    { id: 'lessons', title: 'Readings', type: 'lecture', phase: 'learn', isComplete: true, scrollId: 'its01-lessons' },
    { id: 'checks', title: 'Knowledge checks', type: 'quiz', phase: 'learn', isComplete: null, gated: false, scrollId: 'its01-checks' },
    { id: 'service-desk', title: 'Service desk walkthrough', type: 'lab', ...itsLabRail(user, [ITS01_LAB2_KEY]), scrollId: 'its01-lab-1-2' },
    { id: 'unguided', title: 'Unguided tickets', type: 'read', phase: 'practice', isComplete: null, gated: false, scrollId: 'its01-practice-tickets' },
    // Named so the platform's generic Assessment Lab box isn't added
    // (normalizeModuleStages).
    { id: 'assessment', title: 'Assessment Lab', type: 'review', neverLocked: true, ...itsLabRail(user, [ITS01_PROVE_KEY]), scrollId: 'its01-prove-it' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'its01-sources', gated: false, supplemental: true },
  ];
}
function its01Rail(user) {
  return moduleProgressShell(its01NavSections(user), { moduleKey: 'its01', stageKey: 'its-01' });
}

function viewItsModuleOne(user, program) {
  its01Load(user);
  const module = program.modules['its-01'];
  return `<div class="its01-shell">
    ${moduleTopbar(user, program)}
    ${its01Rail(user)}
    <main class="its01-main">
      <section class="its01-hero" aria-labelledby="its01-title"><div><p class="its01-kicker">Module 01 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 1</p><h1 id="its01-title">${esc(module.title)}</h1><p class="its01-lede">Start with orientation, then learn what a Tier 1 technician does, the troubleshooting method and how to verify a caller, and work your first tickets in the IT Service Desk simulator.</p></div><dl class="its01-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${module.lessons}</dd></div><div><dt>Guided labs</dt><dd>1</dd></div><div><dt>Labs</dt><dd id="its01-status">${itsLabCounterText(user, ITS01_LAB_KEYS)}</dd></div></dl></section>

      ${its01Orientation()}
      ${its01Learn()}
      ${its01Checks()}
      ${its01Lab2()}
      ${its01PracticeTickets()}
      ${its01Prove()}

      <section class="its01-section" id="its01-sources" aria-labelledby="its01-sources-title"><div class="its01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Reference — not a graded step</p><h2 id="its01-sources-title">Sources &amp; Further Reading</h2></div></div>${its01Sources()}</section>
    </main>
  </div>`;
}

/* --------------------------------------------------------- Re-renders */

// Updates the rail's rows and percent in place, so its open groups, drawer
// and listeners stay as they are.
function its01RefreshRail() {
  const rail = document.querySelector('.its01-shell [data-mquick-nav-rail]');
  if (!rail || !its01User) return;
  const holder = document.createElement('div');
  holder.innerHTML = its01Rail(its01User);
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

function its01RenderAup() {
  const ackWrap = document.querySelector('.its01-shell .its01-aup-ack-wrap');
  if (ackWrap) ackWrap.outerHTML = its01AupAck();
  its01RefreshRail();
}

function its01RenderCheck(key, focusIndex) {
  const el = document.querySelector(`.its01-shell [data-its01-check="${key}"]`);
  if (el) el.outerHTML = its01Check(key);
  if (focusIndex !== undefined) {
    const target = document.getElementById(`its01-${key}-q${focusIndex}-feedback`);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }
  if (key === 'orientation') its01RefreshRail();
}

/* ------------------------------------------------------------ Actions */

// The policy text was read to its end (scrolled, or it fits without a
// scrollbar): the checkbox turns on.
function its01MarkAupRead() {
  if (!its01State || its01AupRead()) return;
  its01State.aupReadVersion = ITS01_AUP_VERSION;
  its01Save();
  its01RenderAup();
}

// Ticking the box saves the acknowledgement, its version and its time to the
// account straight away. Once acknowledged, the box stays ticked.
function its01AcknowledgeAup() {
  if (!its01State || !its01AupRead() || its01AupCurrent()) return false;
  its01State.aupAcknowledged = true;
  its01State.aupVersion = ITS01_AUP_VERSION;
  its01State.aupAcknowledgedAt = new Date().toISOString();
  its01Save();
  its01RenderAup();
  return true;
}

// One answer to one question; a question can't be changed once answered
// (Start again clears the check). The orientation check is complete, and
// saved as such, the first time all six answers are right.
function its01Answer(key, index, choice) {
  const check = ITS01_CHECKS[key];
  if (!check || !check.questions[index] || !(choice >= 0 && choice < check.questions[index].choices.length)) return;
  if (its01CheckAnswers[key][index] !== undefined) return;
  its01CheckAnswers[key][index] = choice;
  if (key === 'orientation' && its01State && its01CheckDone(key) && its01CheckAllRight(key) && its01State.orientationCheckCompleted !== true) {
    its01State.orientationCheckCompleted = true;
    its01State.orientationCheckCompletedAt = new Date().toISOString();
    its01Save();
  }
  its01RenderCheck(key, index);
}

function its01ResetCheck(key) {
  if (!its01CheckAnswers[key]) return;
  its01CheckAnswers[key] = {};
  its01RenderCheck(key);
  const first = document.querySelector(`.its01-shell [data-its01-check="${key}"] [data-its01-answer]`);
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
}

// On wide screens the policy text can fit inside its box with no scrollbar,
// so the scroll listener below never fires and the checkbox would stay
// disabled forever. If the whole policy is already visible, treat it as read.
function its01EnableAupIfFits() {
  if (!its01State || its01AupRead()) return;
  const aupText = document.querySelector('.its01-shell [data-its01-aup-text]');
  // clientHeight is 0 while hidden/not laid out; don't count that as "fits".
  if (!aupText || aupText.clientHeight === 0) return;
  if (aupText.scrollHeight <= aupText.clientHeight + 8) its01MarkAupRead();
}

// wire() runs after every render, so the window listener is added only once.
let its01AupResizeWired = false;

function wireItsModuleOneLab() {
  const shell = document.querySelector('.its01-shell');
  if (!shell || !its01State) return;

  its01EnableAupIfFits();
  // Re-check after the browser's next layout pass (fonts/styles can settle late).
  requestAnimationFrame(its01EnableAupIfFits);
  if (!its01AupResizeWired) {
    its01AupResizeWired = true;
    window.addEventListener('resize', its01EnableAupIfFits);
  }

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-its01-aup-checkbox]') && event.target.checked) its01AcknowledgeAup();
  });

  shell.addEventListener('scroll', (event) => {
    const aupText = event.target.closest && event.target.closest('[data-its01-aup-text]');
    if (!aupText) return;
    if (aupText.scrollTop + aupText.clientHeight >= aupText.scrollHeight - 8) its01MarkAupRead();
  }, true);

  shell.addEventListener('click', (event) => {
    const answer = event.target.closest('[data-its01-answer]');
    if (answer) {
      if (!answer.disabled) its01Answer(answer.dataset.check, Number(answer.dataset.q), Number(answer.dataset.choice));
      return;
    }
    const reset = event.target.closest('[data-its01-check-reset]');
    if (reset) {
      its01ResetCheck(reset.dataset.its01CheckReset);
      return;
    }
    const proveLaunch = event.target.closest('[data-its01-prove-launch]');
    if (proveLaunch) {
      // Opened as a popup so the simulator can report back to this page.
      event.preventDefault();
      const notice = shell.querySelector('[data-its01-prove-notice]');
      const opened = window.open(proveLaunch.href, '_blank');
      if (notice) {
        notice.hidden = Boolean(opened);
        notice.textContent = opened ? '' : 'Your browser blocked the Prove It window. Allow pop-ups for this site, then try again.';
      }
      return;
    }
    const launch = event.target.closest('[data-its01-console-launch]');
    if (launch) {
      if (itsLaunchWalkthrough(event, launch, its01User, 'hd-m01')) {
        its01State.consoleStarted = true;
        its01Save();
      }
      itsRefreshWalkthroughNotice(its01User, 'hd-m01', [ITS01_LAB2_KEY], ITS01_LAB2_START);
    }
  });
}

// Lab 1.2's finished work: INC0010150 (HD-2150) resolved, with every outcome
// the simulator recorded for it (ui/helpdesk.js hdConsoleOutcomes): caller
// verified, account unlocked, sign-in confirmed, the "if it happens again"
// comment, a complete note and a resolution code. A critical verification
// choice is shown to the instructor but never blocks the save.
const ITS01_PRACTICE_TICKET = 'HD-2150';
function its01PracticeComplete(work) {
  const ticket = work && Array.isArray(work.tickets) ? work.tickets.find((entry) => entry.id === ITS01_PRACTICE_TICKET) : null;
  const outcomes = ticket && ticket.console && ticket.console.outcomes;
  return Boolean(ticket && ticket.status === 'Resolved' && outcomes && ITS_CONSOLE_OUTCOMES.every((key) => outcomes[key] === true));
}

async function its01ReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== 'hd-m01') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = await currentUser();
  if (!user) { itsConfirmCoachReceipt(event, false); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { itsConfirmCoachReceipt(event, false, wrongStudent); return; }

  // Lab 1.2 saves only finished work: HD-2150 resolved with every outcome
  // met. The coach shows Finish only after the ticket is resolved, but a
  // reopened ticket or an old tab could still send one.
  const work = itsCleanCoachWork(event.data.work);
  const coachKey = `${user.userId}|hd-m01`;
  if (!its01PracticeComplete(work)) {
    itsIncompleteWalkthroughs.add(coachKey);
    itsRefreshWalkthroughNotice(user, 'hd-m01', [ITS01_LAB2_KEY], ITS01_LAB2_START);
    itsConfirmCoachReceipt(event, false, 'incomplete');
    return;
  }
  itsIncompleteWalkthroughs.delete(coachKey);

  // Submit first: Lab 1.2 counts as complete only once the portal has its
  // attempt (saved now, or already waiting or approved).
  const received = await itsSubmitWalkthroughLabs(user, 'its-01', [ITS01_LAB2_KEY], work);
  its01User = user;
  if (received) {
    const saved = LabRuntime.load(ITS01_STATE_ID, user, ITS01_DEFAULT_STATE);
    saved.consoleStarted = true;
    saved.consoleCompleted = true;
    LabRuntime.save(ITS01_STATE_ID, user, saved);
    its01State = saved;
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-01', ITS01_LAB2_KEY);
  }
  itsConfirmCoachReceipt(event, received);

  const mounted = Boolean(document.querySelector('.its01-shell'));
  if (!mounted) return;
  render();
  const section = document.getElementById('its01-lab-1-2');
  if (section) section.scrollIntoView({ block: 'start' });
}

// A Prove It message changed the attempt: show it if this page is open.
function its01ProveChanged() {
  if (document.querySelector('.its01-shell')) render();
}

function its01OnMessage(event) {
  itsProveReceiveMessage(event, { moduleKey: 'its-01', labKey: ITS01_PROVE_KEY, onChange: its01ProveChanged });
  return its01ReceiveCoachCompletion(event);
}

registerModuleLab({
  program: 'it-support', moduleNumber: 1, moduleKey: 'its-01',
  view: viewItsModuleOne, wire: wireItsModuleOneLab, onMessage: its01OnMessage,
});
