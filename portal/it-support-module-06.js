/* Module 8 (key its-06) — IT Help Desk & Career Accelerator ('it-support').
 * Fictional org, tickets, and policy text; no real systems are involved.
 *
 * This file holds the Learn It content and the code that draws it:
 *   - Three filed lessons (8.1 to 8.3) shown as four reading cards. Lesson 8.1
 *     is Reading 1, Lesson 8.2 is Reading 2, and Lesson 8.3 is Readings 3 and
 *     4 (one filed entry, its-06-lesson-03, so the two cards share its
 *     minutes). Each reading has its tables and a diagram.
 *   - The account-status card sort, inside Reading 1: four account snapshots,
 *     each put in a box. A wrong box says why and the student tries again. No
 *     score.
 *   - Two knowledge checks, both after Reading 4: the Learn It check (six
 *     program questions) and the A+ check (eight questions). Each has a "why"
 *     line for a right answer and an "if wrong" line for each wrong one. The
 *     choices are shuffled per student and per attempt.
 *
 * Block types (its06Blocks): h (sub-heading), h5 (a smaller heading under
 * it), p, ul, ol, note ({ title, text }), table ({ caption, head, rows }),
 * diagram (a key of ITS06_DIAGRAMS) and cardsort (the card sort). In p, ul,
 * ol, table and check text, **...** is emphasized and `...` is inline code.
 * bin/its-curriculum-check.js reads each filed lesson's title and minutes from
 * this file: the title must match portal/data.js, and the minutes are the
 * filed lesson minutes plus that lesson's share of the lab (the checker's
 * mapping). A lesson entry keeps its title and its minutes on one line, and
 * nothing else here may put a minutes value right after a title.
 */

const ITS06_LESSONS = [
  {
    id: 'its-06-lesson-01', number: '8.1',
    title: 'Password Resets, Account Unlocks & Reading Account Status Correctly', minutes: 120,
    readings: [
      {
        number: 1, icon: 'ri-lock-unlock-line', heading: 'Read the account status before you touch it',
        learn: [
          'Name the four account states from what the user sees and what the account shows',
          'Choose the right action for each state, and say who approves it',
          'Pick how strong a check each action needs (Table 2)',
        ],
        blocks: [
          { h: 'Reading 1 · Read the account status before you touch it' },
          { p: 'Most identity tickets start with “I can’t sign in.” Before you click anything, read the account. Four states look alike to the user, and each needs a different fix (Table 1).' },
          { table: {
            caption: 'Table 1 · Read the account status before you touch it',
            head: ['Status', 'What the user sees', 'What it means', 'The right action', 'Who approves'],
            rows: [
              ['**Locked out**', '“The referenced account is currently locked out”', 'Too many wrong passwords (Northstar: 5 in 15 minutes)', 'Verify; if it keeps coming back, find the source first (KB-0103); then unlock once', 'Nobody beyond verification'],
              ['**Disabled**', '“Your account has been disabled”', 'Turned off on purpose (a leaver, leave of absence, an investigation)', 'Read the history. Enable only against the HR or manager record that says so', 'HR or the manager'],
              ['**Account expired**', '“Your account has expired”', 'Its end date passed (contractors, temporary staff)', 'Don’t extend it yourself. Send it to the sponsor named on the account', 'The sponsor'],
              ['**Password expired**', '“Your password has expired and must be changed”', 'The password is older than the policy (Northstar: 90 days)', 'The user changes it at sign-in. If they can’t, self-service; if that isn’t set up, KB-0104', 'Nobody beyond verification'],
            ],
          } },
          { p: 'A **domain account** lives in Active Directory and works on every Northstar PC. A **local account** exists on one machine only.' },
          { p: '**Locked out.** Northstar locks an account after 5 wrong passwords in 15 minutes. One lockout is usually a mistyped password: verify the person and unlock once (KB-0024). If it comes back, something is still trying an old password, such as a phone’s mail app, a saved drive password on another PC, or a scheduled task. Active Directory’s **Lockout details** shows which computer sent the wrong passwords (the domain controller records it as event 4740). If it’s a PC the user signs in to and a saved password, you fix it with them (KB-0103). If it’s a server, a service or a scheduled task, it’s Tier 2’s: escalate with what you found. Unlock only after the source is fixed, or it locks again within minutes.' },
          { p: '**Disabled.** Someone turned it off on purpose. Read the account’s history first. “Leave of absence” with HR’s return-to-work record means you can enable it. “Leaver” means you never do: send the caller to their manager or HR.' },
          { p: '**Account expired.** Contractors and temporary staff have an end date on their account. When it passes, the account stops working even though it is still enabled and not locked. The account names a **sponsor**, the employee responsible for the contractor. Only the sponsor can approve more time. You never extend it on the user’s word, or on anyone else’s.' },
          { p: '**Password expired.** Northstar passwords last 90 days. The user changes it at the sign-in prompt, which asks for the old one first. If they don’t know it, they use **self-service password reset (SSPR)**, the link on the sign-in screen (KB-0024). If they never set SSPR up, KB-0104 lets you reset it: verify them, reset it in Active Directory with **User must change password at next logon** ticked, and read the one-time password to them on the call. Never type it anywhere. Then help them register for SSPR.' },
          { p: 'Read all the fields at once on the account’s pane, or with `Get-ADUser <name> -Properties LockedOut, Enabled, AccountExpirationDate, PasswordExpired, PasswordLastSet`. And the same habit every time: **verify** the person, as strongly as the action needs (Table 2); confirm the request is **approved**; do only what was asked; check it worked; write it down.' },
          { table: {
            caption: 'Table 2 · How strong the check must be',
            head: ['Action', 'Check (KB-0024, KB-0065)'],
            rows: [
              ['Unlock, password reset', 'Callback to the directory number and the employee ID'],
              ['Enable a disabled account', 'The HR or manager record that approves it, plus the callback'],
              ['MFA re-registration', 'In person with a photo badge that matches the directory photo, **or** callback + employee ID + the manager’s confirmation'],
              ['Anything asked from a personal email or a number not in the directory', 'Nothing until the person is verified through the directory; reply only to the work address'],
            ],
          } },
          { diagram: 'status' },
          { cardsort: true },
        ],
        comingUp: 'Read Noah’s locked account, find where the wrong passwords come from, and unlock it once, in the guided lab (Lab 8.1, Part A).',
      },
    ],
  },
  {
    id: 'its-06-lesson-02', number: '8.2',
    title: 'Group Membership & Access Troubleshooting', minutes: 120,
    readings: [
      {
        number: 2, icon: 'ri-team-line', heading: 'Groups grant access; least privilege keeps it tight',
        learn: [
          'Read a user’s Member Of list and say which access it explains',
          'Change a mover’s groups the least-privilege way: add the new role’s, remove the old role’s',
          'Say why a mover keeps the licence group, and why the user signs out and back in',
        ],
        blocks: [
          { h: 'Reading 2 · Groups grant access; least privilege keeps it tight' },
          { p: 'People get folders, apps, mailboxes and their Microsoft 365 licence through **groups**, not through settings on their own account. “I can’t open X” usually means they aren’t in X’s group. Check the account’s **Member Of** list (or `Get-ADPrincipalGroupMembership`). A group change needs the **resource owner’s** approval, not just the user’s word.' },
          { p: 'Windows reads a user’s groups when they sign in. After a group change, the user must **sign out and back in**. `whoami /groups` on their PC shows the groups their sign-in has right now.' },
          { p: '**Least privilege** means only the access the job needs. A **joiner** gets the role’s groups. A **mover** gets the new role’s groups **and loses the old role’s**. A **leaver** loses everything (Table 3). Old access left behind is exactly what attackers look for. Never grant local admin to fix an access problem (KB-0058).' },
          { table: {
            caption: 'Table 3 · Joiners, movers and leavers',
            head: ['Event', 'What changes', 'Who approves', 'Don’t forget'],
            rows: [
              ['**Joiner**', 'Account, role groups, licence group, distribution lists', 'The hiring manager', 'Least privilege: the role’s groups only'],
              ['**Mover**', 'New role’s groups **added**, old role’s groups **removed**, licence group kept', 'The HR record and each resource owner', 'Remove the old access; keep the licence group (it isn’t a department group)'],
              ['**Leaver**', 'Account disabled, groups removed, mailbox handled', 'HR', 'Disabled is a decision: never re-enable without HR'],
            ],
          } },
          { diagram: 'jml' },
          { p: '**Group-based licensing.** Northstar gives every employee Microsoft 365 E3 through the group **GG-M365-E3-License**. Take someone out of it and their Outlook and Teams stop within about 15 minutes. It isn’t a department group, so a mover keeps it (KB-0106).' },
          { p: '**Distribution lists** (such as DL-Finance-Team) copy email to their members. They grant no access to files. A mover changes lists too.' },
        ],
        comingUp: 'Move Nina from Sales to Finance, and put back the licence group that was taken by mistake, in practice ticket 8-C (Lab 8.2).',
      },
    ],
  },
  {
    id: 'its-06-lesson-03', number: '8.3',
    title: 'Introductory Entra ID & M365 Identity Scenarios', minutes: 120,
    readings: [
      {
        number: 3, icon: 'ri-cloud-line', heading: 'Microsoft 365 and Entra ID for Tier 1',
        learn: [
          'Say what Entra Connect does, and how long a password change takes to reach the cloud',
          'Pick the right console for a task: the Microsoft 365 admin center or the Entra admin center',
          'Tell a shared mailbox, a distribution list, a Microsoft 365 group and a security group apart, and say what Send as does',
        ],
        blocks: [
          { h: 'Reading 3 · Microsoft 365 and Entra ID for Tier 1' },
          { p: 'Northstar is **hybrid**. Users are created in on-site Active Directory and copied to **Microsoft Entra ID**, Microsoft’s cloud identity service (formerly Azure AD), by **Entra Connect**, about every 30 minutes. A password change reaches the cloud in about 2 minutes. **Microsoft 365** is software as a service (SaaS): Microsoft hosts and updates it, and Northstar pays per user per month.' },
          { diagram: 'hybrid' },
          { p: 'You’ll use two consoles. The **Microsoft 365 admin center** has users and their licences, shared mailboxes, distribution lists, and **Service health**. The **Entra admin center** has each user’s sign-in methods (MFA), their self-service password reset registration, **sign-in logs** and audit logs.' },
          { p: 'A **licence** (Microsoft 365 E3) turns on Outlook, Teams and the Office apps. No licence means “you don’t have a license” or Teams won’t load. Before fixing anything locally, check **Service health**: if Microsoft has an advisory for that service, tell the user and leave their account alone.' },
          { p: '**MFA** (multifactor authentication) adds a second check to a sign-in, usually an approval in the Microsoft Authenticator app. When a user’s phone has been replaced, after strong verification (KB-0065, Table 2) you **require re-registration**: Entra admin center › Users › the user › Authentication methods › Require re-register multifactor authentication. They set up Authenticator on the new phone at their next sign-in. An MFA reset is how attackers take over accounts, so you never act on a request from a personal email address or a number that isn’t in the directory. And you don’t reset what still works: a sign-in log that says “user did not respond to notification” means the prompts are reaching the app but not being seen.' },
          { p: 'A **sign-in log** row shows when, which app, where from, and whether it worked or why it didn’t.' },
          { p: 'Four Microsoft 365 objects sound alike (Table 4). A **shared mailbox** such as support@ is one inbox several people use; it needs no licence of its own. **Read and manage (Full Access)** lets someone open it; **Send as** lets their replies come from it. A **distribution list** is one address that copies to many inboxes. A **Microsoft 365 group** is a shared inbox, calendar, files and team together. Mailbox and list changes need the owner’s approval and can take up to an hour to show in Outlook (KB-0107).' },
          { table: {
            caption: 'Table 4 · Four Microsoft 365 objects that sound alike',
            head: ['Object', 'What it is', 'Example', 'Needs a licence?', 'How people get it'],
            rows: [
              ['**Shared mailbox**', 'One inbox several people open', 'support@', 'No', '**Read and manage (Full Access)** opens it; **Send as** sends from it'],
              ['**Distribution list**', 'One address that copies to many inboxes', 'DL-Finance-Team', 'No', 'Membership'],
              ['**Microsoft 365 group**', 'Shared inbox, calendar, files and a team together', 'The Finance team’s Teams team', 'Members need their own licence', 'Membership'],
              ['**Security group**', 'Grants access to folders, apps and licences', 'GG-Finance-Users, GG-M365-E3-License', '—', 'Membership, read at sign-in'],
            ],
          } },
        ],
        comingUp: 'Re-register Sam’s MFA in the Entra admin center and give him Send as on support@ in the guided lab (Lab 8.1, Part B). Then decide whether a reset is needed at all in practice ticket 8-B (Lab 8.2).',
      },
      {
        number: 4, icon: 'ri-smartphone-line', heading: 'Phones at work',
        learn: [
          'Pair a Bluetooth device in order: on, pairing mode, find it, PIN, test',
          'Tell a company phone from a personal phone, and say what a wipe removes from each',
          'Work out why work mail stopped on a phone, in order: Service health, compliance, sign-in log, the app’s account',
        ],
        blocks: [
          { h: 'Reading 4 · Phones at work' },
          { p: 'Phones connect in several ways, and each can be switched on or off: **cellular data** (4G or 5G), **Wi-Fi**, and **airplane mode**, which turns them all off. A **hotspot** shares the phone’s cellular data with a laptop. The **SIM** (a small card) or **eSIM** (built in) ties the phone to its carrier plan; on a new phone, the carrier moves the eSIM. **Bluetooth** pairs headsets and car kits: turn it on, put the device in pairing mode, find it on the phone, enter or confirm the PIN, then test. **Location services** use **GPS** (satellites: precise outdoors) and **cellular location** (nearby towers: rougher, but works indoors); apps ask permission first (Table 6).' },
          { table: {
            caption: 'Table 6 · Phone connections at Tier 1',
            head: ['Item', 'What Tier 1 checks'],
            rows: [
              ['Cellular data (4G/5G) and Wi-Fi', 'Is each on? Airplane mode off? On Wi-Fi, does the work mail still need cellular?'],
              ['Hotspot', 'Shares the phone’s cellular data with a laptop; counts against the data cap'],
              ['SIM / eSIM', 'The physical or built-in card that ties the phone to its carrier plan; a new phone needs the eSIM moved by the carrier'],
              ['Bluetooth', 'On → put the device in pairing mode → find it → enter or confirm the PIN → test'],
              ['Location services', 'GPS (satellites, precise outdoors) and cellular location (towers, rougher); apps ask for permission'],
              ['Sync', 'Mail, calendar, contacts and cloud storage per app; large uploads can be set to Wi-Fi only because of the data cap'],
            ],
          } },
          { p: 'Companies manage phones in two ways (Table 5). A **company phone** is enrolled in **mobile device management (MDM)**, which at Northstar is **Intune**: it enforces a PIN, encryption and a minimum OS version, installs the corporate apps and Wi-Fi settings, and can wipe the phone. A **personal phone** (bring your own device, **BYOD**) isn’t enrolled; **app protection** (MAM) manages only the work apps, such as a PIN on Outlook and no copying work data into personal apps, and can wipe only their data.' },
          { table: {
            caption: 'Table 5 · Company phone or personal phone',
            head: ['', 'Company phone (corporate)', 'Personal phone (BYOD)'],
            rows: [
              ['Managed by', 'MDM (Intune) enrols the whole device', 'App protection (MAM) manages only the work apps'],
              ['What the company can enforce', 'PIN, encryption, OS version, Wi-Fi profiles, corporate apps', 'A PIN on the work apps, no copying work data into personal apps'],
              ['What a wipe removes', 'The whole phone', 'Only the work apps’ data'],
              ['Shows in Intune’s device list', 'Yes', 'No'],
              ['Work mail blocked when', 'The phone is not compliant (Conditional Access)', 'The work app’s protection isn’t met'],
            ],
          } },
          { diagram: 'phones' },
          { p: 'Intune checks every company phone against Northstar’s rules. A phone that falls behind gets a short grace period, then becomes **not compliant**, and **Conditional Access** blocks work mail and Teams on it until it’s fixed. The fix is on the phone: install what’s missing, then open **Company Portal › Check status** (KB-0105). Never take a user out of the policy to get them working.' },
          { p: '**Sync** keeps business apps the same everywhere: Outlook syncs mail, calendar and contacts; OneDrive syncs files. A **data cap** limits how much cellular data a plan allows each month, so big uploads are set to Wi-Fi only.' },
          { p: 'When work mail stops on a phone but works on the laptop, check in this order: Service health, the phone’s compliance in Intune, the sign-in log, then the app’s account on the phone.' },
        ],
        comingUp: 'Enrol Sam’s new phone, set up Outlook, set OneDrive to Wi-Fi only and pair his headset in the guided lab (Lab 8.1, Part B). Then find out why a company phone gets no work mail in practice ticket 8-D (Lab 8.2).',
      },
    ],
  },
];

// The page shows one card per reading: four cards for the three filed
// lessons. Readings 3 and 4 belong to one filed lesson (its-06-lesson-03), so
// both cards carry its id and say they share its minutes.
function its06Cards() {
  return ITS06_LESSONS.flatMap((lesson) => lesson.readings.map((reading) => ({
    id: lesson.id, number: lesson.number, reading: reading.number, icon: reading.icon, heading: reading.heading,
    minutesText: lesson.readings.length > 1
      ? `Readings ${lesson.readings.map((r) => r.number).join(' and ')} share Lesson ${lesson.number}’s ${formatInstructionalMinutes(lesson.minutes)}`
      : formatInstructionalMinutes(lesson.minutes),
    learn: reading.learn, blocks: reading.blocks, comingUp: reading.comingUp,
  })));
}

/* ------------------------------------------------------------ Diagrams */

/* Each diagram is drawn as inline SVG from the data below: a wide layout and
 * a narrow (phone) one, switched by a container query in the stylesheet. The
 * look comes from the its01-dg-* classes and follows the page's theme
 * variables. */
const ITS06_DIAGRAMS = {
  status: {
    title: 'Read, then act',
    steps: [
      { title: 'Verify the person', sub: 'KB-0024' },
      { title: 'Read the status', sub: 'Locked · Disabled · Account expired · Password expired' },
    ],
    branches: [
      { label: 'Locked', approval: 'Approval: verification', text: 'Find the source, then unlock once.' },
      { label: 'Disabled', approval: 'Approval: HR', text: 'Enable only with the HR record.' },
      { label: 'Account expired', approval: 'Approval: the sponsor', text: 'Send it to the sponsor.' },
      { label: 'Password expired', approval: 'Approval: verification', text: 'The user changes it; else self-service; else KB-0104.' },
    ],
    strip: 'Do only what was asked, check it worked, write it down.',
  },
  jml: {
    title: 'Joiner, mover, leaver',
    // kind: added, removed or stays; it picks the marker's look.
    columns: [
      { label: 'Joiner', items: [
        { text: 'GG-Finance-Users', mark: 'added', kind: 'added' },
        { text: 'GG-M365-E3-License', mark: 'added', kind: 'added' },
        { text: 'DL-Finance-Team', mark: 'added', kind: 'added' },
      ] },
      { label: 'Mover', items: [
        { text: 'GG-Sales-Users', mark: 'removed', kind: 'removed' },
        { text: 'GG-Finance-Users', mark: 'added', kind: 'added' },
        { text: 'GG-M365-E3-License', mark: 'stays', kind: 'stays', lock: true, note: 'It’s the licence, not the department.' },
      ] },
      { label: 'Leaver', items: [
        { text: 'Account', mark: 'disabled', kind: 'removed' },
        { text: 'Every group', mark: 'removed', kind: 'removed' },
      ] },
    ],
  },
  hybrid: {
    title: 'One identity, two places',
    left: { title: 'Active Directory', sub: 'on site', lines: ['Users, groups, passwords'] },
    arrow: 'Entra Connect, about every 30 minutes; password changes in about 2',
    right: { title: 'Entra ID', sub: 'cloud' },
    apps: ['Outlook', 'Teams', 'OneDrive'],
    consolesLabel: 'Where you work',
    consoles: [
      { title: 'Microsoft 365 admin center', text: 'Licences, shared mailboxes, lists, Service health' },
      { title: 'Entra admin center', text: 'Sign-in methods, MFA, sign-in logs' },
    ],
  },
  phones: {
    title: 'Two kinds of phone',
    company: { label: 'Company phone', zone: 'Intune (MDM): the whole device' },
    personal: { label: 'Personal phone (BYOD)', zone: 'App protection (MAM): work apps only', apps: ['Outlook', 'Teams'] },
    gate: 'Conditional Access: compliant?',
    mail: 'Work mail',
  },
};

// Every word a diagram shows, in reading order: the screen-reader description.
function its06DiagramWords(key) {
  const d = ITS06_DIAGRAMS[key];
  if (key === 'status') {
    const branches = d.branches.map((b) => `${b.label}, ${b.approval}: ${b.text}`).join('. ');
    return `A flow from left to right. Step one: ${d.steps[0].title}, ${d.steps[0].sub}. An arrow to step two: ${d.steps[1].title}, ${d.steps[1].sub}. Then four branches, one for each status. ${branches}. Under them: ${d.strip}`;
  }
  if (key === 'jml') {
    const columns = d.columns.map((c) => `${c.label}, a person icon over a list of groups: ${c.items.map((i) => `${i.text}, ${i.mark}${i.note ? `, with a small lock: ${i.note}` : ''}`).join('; ')}`).join('. ');
    return `Three columns. ${columns}.`;
  }
  if (key === 'hybrid') {
    return `From left to right. A box: ${d.left.title}, ${d.left.sub}: ${d.left.lines.join('; ')}. An arrow labelled ${d.arrow}, into a box: ${d.right.title}, ${d.right.sub}. From it, arrows to three app tiles: ${d.apps.join(', ')}. Under them, ${d.consolesLabel}: ${d.consoles.map((c) => `${c.title}: ${c.text}`).join('. ')}.`;
  }
  return `Two phones side by side. ${d.company.label}: the whole phone sits inside a shaded box labelled ${d.company.zone}. ${d.personal.label}: only two app icons, ${d.personal.apps.join(' and ')}, sit inside a small shaded box labelled ${d.personal.zone}. An arrow from each phone goes through a gate labelled ${d.gate} to a tile: ${d.mail}.`;
}

// Splits text into lines of at most max characters, at word breaks.
function its06Wrap(text, max) {
  const lines = [];
  let line = '';
  String(text).split(/\s+/).forEach((word) => {
    if (line && (line.length + 1 + word.length) > max) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  });
  if (line) lines.push(line);
  return lines;
}

const ITS06_DG = { pad: 12, title: 15, text: 13, lh: 18, charW: 0.56, gap: 5, indent: 9 };

// How many characters of a font size fit in a width.
function its06Max(width, size) {
  return Math.max(6, Math.floor(width / (size * ITS06_DG.charW)));
}

// One box's wrapped lines: [{ text, cls, dx, dy }], laid out for width w.
// box.mark ({ text, kind }) is a small marker line under the title.
function its06BoxLines(box, w) {
  const inner = w - ITS06_DG.pad * 2;
  const titleMax = Math.max(8, Math.floor(inner / (ITS06_DG.title * ITS06_DG.charW)));
  const textMax = Math.max(8, Math.floor(inner / (ITS06_DG.text * ITS06_DG.charW)));
  const out = [];
  let dy = 0;
  const push = (text, cls) => { out.push({ text, cls, dx: 0, dy }); dy += ITS06_DG.lh; };
  its06Wrap(box.title || '', titleMax).forEach((text) => push(text, 'its01-dg-title'));
  if (box.mark) push(box.mark.text, `its06-dg-tag its06-dg-tag-${box.mark.kind}`);
  if (box.sub) its06Wrap(box.sub, textMax).forEach((text) => push(text, 'its01-dg-sub'));
  (box.lines || []).forEach((item) => its06Wrap(item, textMax).forEach((text) => push(text, 'its01-dg-text')));
  if (box.text) its06Wrap(box.text, textMax).forEach((text) => push(text, 'its01-dg-text'));
  return out;
}
function its06BoxHeight(box, w) {
  const lines = its06BoxLines(box, w);
  const used = lines.length ? lines[lines.length - 1].dy + ITS06_DG.lh : 0;
  return ITS06_DG.pad * 2 + used + 4;
}
// A small padlock drawn from shapes: a body and a shackle.
function its06Lock(x, y) {
  return `<path class="its06-dg-lock-arc" d="M${x + 3} ${y + 8} v-3 a4 4 0 0 1 8 0 v3"/><rect class="its06-dg-lock" x="${x}" y="${y + 8}" width="14" height="10" rx="2"/>`;
}
function its06Box(box, x, y, w, h) {
  // gone = a dashed outline (access taken away); hl = the highlighted box.
  const cls = box.gone ? ' its06-dg-gone' : (box.hl ? ' its01-dg-hl' : '');
  const text = its06BoxLines(box, w).map((line) => `<text class="${line.cls}" x="${x + ITS06_DG.pad + line.dx}" y="${y + ITS06_DG.pad + 14 + line.dy}">${esc(line.text)}</text>`).join('');
  const lock = box.lock ? its06Lock(x + w - ITS06_DG.pad - 14, y + ITS06_DG.pad - 2) : '';
  return `<rect class="its01-dg-box${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>${text}${lock}`;
}
function its06Arrow(x1, y1, x2, y2, id) {
  return `<line class="its01-dg-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${id})"/>`;
}
// A plain line, no arrow head: it only joins two boxes.
function its06Line(x1, y1, x2, y2) {
  return `<line class="its01-dg-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
}
function its06Markers(id) {
  return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="its01-dg-head" d="M0,0 L10,5 L0,10 z"/></marker></defs>`;
}
function its06Svg(key, layout, width, height, body) {
  const d = ITS06_DIAGRAMS[key];
  return `<svg class="its01-dg-${layout}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(d.title)}" aria-describedby="its06-dg-${key}-desc" focusable="false">${body}</svg>`;
}
// A small label: anchor 'middle' centres it on x.
function its06Label(text, x, y, anchor) {
  return `<text class="its06-dg-label" x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(text)}</text>`;
}
// Plain text lines, one per wrapped line, starting at y.
function its06TextLines(text, max, x, y, anchor, cls) {
  return its06Wrap(text, max).map((line, i) => `<text class="${cls || 'its01-dg-text'}" x="${x}" y="${y + i * ITS06_DG.lh}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(line)}</text>`).join('');
}
// A heading in the title style.
function its06Heading(text, x, y) {
  return `<text class="its01-dg-title" x="${x}" y="${y}">${esc(text)}</text>`;
}
// The strip under a diagram: one full-width highlighted box.
function its06Strip(text, y, width) {
  const box = { text, hl: true };
  const h = its06BoxHeight(box, width);
  return { svg: its06Box(box, 0, y, width, h), h };
}
// A simple person: a head and shoulders, drawn at centre x, top y.
function its06UserIcon(cx, top) {
  return `<circle class="its06-dg-icon" cx="${cx}" cy="${top + 9}" r="9"/><path class="its06-dg-icon" d="M${cx - 16} ${top + 40} Q${cx - 16} ${top + 22} ${cx} ${top + 22} Q${cx + 16} ${top + 22} ${cx + 16} ${top + 40} Z"/>`;
}

function its06StatusSvg(layout) {
  const d = ITS06_DIAGRAMS.status;
  const id = `its06-dg-status-${layout}-arrow`;
  const [s1, s2] = d.steps;
  const branches = d.branches.map((b) => ({ title: b.label, sub: b.approval, lines: [b.text] }));
  let body = its06Markers(id);

  if (layout === 'wide') {
    const width = 768, top = 4, w1 = 230, x2 = 300, w2 = width - x2;
    const sh = Math.max(its06BoxHeight(s1, w1), its06BoxHeight(s2, w2));
    body += its06Box(s1, 0, top, w1, sh) + its06Box(s2, x2, top, w2, sh);
    body += its06Arrow(w1 + 2, top + sh / 2, x2 - 2, top + sh / 2, id);
    const gap = 12, cw = (width - 3 * gap) / 4, busY = top + sh + 30, boxTop = busY + 24;
    const cxs = branches.map((_, i) => i * (cw + gap) + cw / 2);
    body += its06Line(x2 + w2 / 2, top + sh, x2 + w2 / 2, busY);
    body += its06Line(cxs[0], busY, cxs[cxs.length - 1], busY);
    cxs.forEach((cx) => { body += its06Arrow(cx, busY, cx, boxTop - 2, id); });
    const h = Math.max(...branches.map((b) => its06BoxHeight(b, cw)));
    branches.forEach((b, i) => { body += its06Box(b, i * (cw + gap), boxTop, cw, h); });
    const strip = its06Strip(d.strip, boxTop + h + 18, width);
    body += strip.svg;
    return its06Svg('status', layout, width, boxTop + h + 18 + strip.h + 4, body);
  }

  const width = 320, x = 10, w = 300, cx = 160, trunkX = 16, bx = 30, bw = 280;
  let y = 4;
  const h1 = its06BoxHeight(s1, w);
  body += its06Box(s1, x, y, w, h1);
  y += h1;
  body += its06Arrow(cx, y + 2, cx, y + 22, id);
  y += 24;
  const h2 = its06BoxHeight(s2, w);
  body += its06Box(s2, x, y, w, h2);
  y += h2;
  const trunkTop = y;
  y += 16;
  const spots = branches.map((b) => {
    const h = its06BoxHeight(b, bw);
    const spot = { b, y, h };
    y += h + 12;
    return spot;
  });
  // The joining lines first, so the boxes sit on top of them.
  const lastMid = spots[spots.length - 1].y + spots[spots.length - 1].h / 2;
  body += its06Line(trunkX, trunkTop, trunkX, lastMid);
  spots.forEach((s) => { body += its06Arrow(trunkX, s.y + s.h / 2, bx - 2, s.y + s.h / 2, id); });
  spots.forEach((s) => { body += its06Box(s.b, bx, s.y, bw, s.h); });
  y += 6;
  const strip = its06Strip(d.strip, y, w);
  body += `<g transform="translate(${x} 0)">${strip.svg}</g>`;
  return its06Svg('status', layout, width, y + strip.h + 4, body);
}

// One column of the joiner, mover, leaver diagram: a person and a label, then
// one box per group. Returns the drawing and its height.
function its06JmlColumn(column, x, y, w) {
  let svg = its06UserIcon(x + 22, y) + its06Heading(column.label, x + 52, y + 27);
  let cy = y + 54;
  column.items.forEach((item) => {
    const box = {
      title: item.text, mark: { text: item.mark, kind: item.kind }, lines: item.note ? [item.note] : [],
      lock: item.lock === true, gone: item.kind === 'removed', hl: item.kind === 'stays',
    };
    const h = its06BoxHeight(box, w);
    svg += its06Box(box, x, cy, w, h);
    cy += h + 10;
  });
  return { svg, h: cy - 10 - y };
}

function its06JmlSvg(layout) {
  const d = ITS06_DIAGRAMS.jml;
  if (layout === 'wide') {
    const width = 768, colW = 240, step = 264, top = 4;
    let body = '';
    let tallest = 0;
    d.columns.forEach((column, i) => {
      const col = its06JmlColumn(column, i * step, top, colW);
      body += col.svg;
      tallest = Math.max(tallest, col.h);
    });
    return its06Svg('jml', layout, width, top + tallest + 4, body);
  }
  const width = 320, x = 10, w = 300;
  let body = '';
  let y = 4;
  d.columns.forEach((column) => {
    const col = its06JmlColumn(column, x, y, w);
    body += col.svg;
    y += col.h + 22;
  });
  return its06Svg('jml', layout, width, y - 22 + 4, body);
}

function its06HybridSvg(layout) {
  const d = ITS06_DIAGRAMS.hybrid;
  const id = `its06-dg-hybrid-${layout}-arrow`;
  let body = its06Markers(id);

  if (layout === 'wide') {
    const width = 768, top = 4, lw = 190, rx = 410, rw = 190, tileX = 648, tileW = 120, trunkX = 624, tileGap = 10;
    const tiles = d.apps.map((title) => ({ title }));
    const tileH = its06BoxHeight(tiles[0], tileW);
    const tilesH = tiles.length * tileH + (tiles.length - 1) * tileGap;
    const boxH = Math.max(its06BoxHeight(d.left, lw), its06BoxHeight(d.right, rw));
    const blockH = Math.max(tilesH, boxH);
    const midY = top + blockH / 2;
    body += its06Box(d.left, 0, midY - boxH / 2, lw, boxH) + its06Box(d.right, rx, midY - boxH / 2, rw, boxH);
    body += its06Arrow(lw + 8, midY, rx - 8, midY, id);
    its06Wrap(d.arrow, 24).forEach((line, i) => { body += its06Label(line, (lw + rx) / 2, midY + 20 + i * 15, 'middle'); });
    const tileTop = midY - tilesH / 2;
    const mids = tiles.map((_, i) => tileTop + i * (tileH + tileGap) + tileH / 2);
    body += its06Line(rx + rw, midY, trunkX, midY) + its06Line(trunkX, mids[0], trunkX, mids[mids.length - 1]);
    mids.forEach((m) => { body += its06Arrow(trunkX, m, tileX - 2, m, id); });
    tiles.forEach((tile, i) => { body += its06Box(tile, tileX, tileTop + i * (tileH + tileGap), tileW, tileH); });
    const y0 = Math.max(top + blockH, midY + 20 + its06Wrap(d.arrow, 24).length * 15);
    let y = y0 + 24;
    body += its06Heading(d.consolesLabel, 0, y + 14);
    y += 26;
    const gap = 24, cw = (width - gap) / 2;
    const ch = Math.max(...d.consoles.map((c) => its06BoxHeight(c, cw)));
    d.consoles.forEach((c, i) => { body += its06Box(c, i * (cw + gap), y, cw, ch); });
    return its06Svg('hybrid', layout, width, y + ch + 4, body);
  }

  const width = 320, x = 10, w = 300, cx = 160, tileW = 96, tileGap = 6;
  let y = 4;
  const lh = its06BoxHeight(d.left, w);
  body += its06Box(d.left, x, y, w, lh);
  y += lh;
  const arrowLines = its06Wrap(d.arrow, 22);
  const arrowLen = Math.max(54, arrowLines.length * 15 + 14);
  body += its06Arrow(cx, y + 2, cx, y + arrowLen - 2, id);
  arrowLines.forEach((line, i) => { body += its06Label(line, cx + 14, y + 22 + i * 15); });
  y += arrowLen;
  const rh = its06BoxHeight(d.right, w);
  body += its06Box(d.right, x, y, w, rh);
  y += rh;
  const busY = y + 20;
  const tileTop = busY + 22;
  const tiles = d.apps.map((title) => ({ title }));
  const tileH = its06BoxHeight(tiles[0], tileW);
  const cxs = tiles.map((_, i) => x + i * (tileW + tileGap) + tileW / 2);
  body += its06Line(cx, y, cx, busY) + its06Line(cxs[0], busY, cxs[cxs.length - 1], busY);
  cxs.forEach((c) => { body += its06Arrow(c, busY, c, tileTop - 2, id); });
  tiles.forEach((tile, i) => { body += its06Box(tile, x + i * (tileW + tileGap), tileTop, tileW, tileH); });
  y = tileTop + tileH + 24;
  body += its06Heading(d.consolesLabel, x, y + 14);
  y += 26;
  d.consoles.forEach((c) => {
    const h = its06BoxHeight(c, w);
    body += its06Box(c, x, y, w, h);
    y += h + 12;
  });
  return its06Svg('hybrid', layout, width, y - 12 + 4, body);
}

function its06PhonesSvg(layout) {
  const d = ITS06_DIAGRAMS.phones;
  const id = `its06-dg-phones-${layout}-arrow`;
  const wide = layout === 'wide';
  const width = wide ? 768 : 320;
  const wz = wide ? 230 : 146;
  const gapX = wide ? 48 : 8;
  const startX = (width - (2 * wz + gapX)) / 2;
  const pw = wz - 20;
  const zw = pw - 16;
  const top = 4;
  const lh = ITS06_DG.lh;
  const titleMax = its06Max(pw - 16, ITS06_DG.title);
  const companyTitle = its06Wrap(d.company.label, titleMax);
  const personalTitle = its06Wrap(d.personal.label, titleMax);
  const titleN = Math.max(companyTitle.length, personalTitle.length);
  const zoneLabel = its06Wrap(d.personal.zone, its06Max(zw - 16, ITS06_DG.text));
  const apps = d.personal.apps.length;
  const zoneH = 10 + zoneLabel.length * lh + (apps - 1) * 32 + 26 + 8;
  const phoneH = 12 + titleN * lh + 8 + zoneH + 12;
  const companyLabel = its06Wrap(d.company.zone, its06Max(wz - 20, ITS06_DG.text));
  const zoneBoxH = 10 + phoneH + 8 + companyLabel.length * lh + 8;
  let body = its06Markers(id);

  // Company phone: the whole phone sits inside the shaded box.
  const cx1 = startX + wz / 2;
  const px1 = startX + 10;
  const py = top + 10;
  // Personal phone: only a small shaded box with two apps is inside it.
  const px2 = startX + wz + gapX + 10;
  const cx2 = startX + wz + gapX + wz / 2;
  const companyBottom = top + zoneBoxH;
  const personalBottom = py + phoneH;
  const busY = companyBottom + 26;
  const gate = { title: d.gate, hl: true };
  const gateW = 300, gateX = (width - gateW) / 2, gateTop = busY + 28;
  const gateH = its06BoxHeight(gate, gateW);
  const mail = { title: d.mail };
  const mailW = 200, mailX = (width - mailW) / 2, mailTop = gateTop + gateH + 28;
  const mailH = its06BoxHeight(mail, mailW);
  const mid = (cx1 + cx2) / 2;

  // The joining lines first, so the shapes sit on top of them.
  body += its06Line(cx1, companyBottom, cx1, busY) + its06Line(cx2, personalBottom, cx2, busY) + its06Line(cx1, busY, cx2, busY);
  body += its06Arrow(mid, busY, mid, gateTop - 2, id);
  body += its06Arrow(width / 2, gateTop + gateH, width / 2, mailTop - 2, id);

  body += `<rect class="its06-dg-zone" x="${startX}" y="${top}" width="${wz}" height="${zoneBoxH}" rx="14"/>`;
  body += `<rect class="its06-dg-phone" x="${px1}" y="${py}" width="${pw}" height="${phoneH}" rx="14"/>`;
  companyTitle.forEach((line, i) => { body += `<text class="its01-dg-title" x="${cx1}" y="${py + 12 + 14 + i * lh}" text-anchor="middle">${esc(line)}</text>`; });
  companyLabel.forEach((line, i) => { body += `<text class="its01-dg-sub" x="${cx1}" y="${py + phoneH + 8 + 14 + i * lh}" text-anchor="middle">${esc(line)}</text>`; });

  body += `<rect class="its06-dg-phone" x="${px2}" y="${py}" width="${pw}" height="${phoneH}" rx="14"/>`;
  personalTitle.forEach((line, i) => { body += `<text class="its01-dg-title" x="${cx2}" y="${py + 12 + 14 + i * lh}" text-anchor="middle">${esc(line)}</text>`; });
  const zx = px2 + 8, zy = py + 12 + titleN * lh + 8;
  body += `<rect class="its06-dg-zone" x="${zx}" y="${zy}" width="${zw}" height="${zoneH}" rx="10"/>`;
  zoneLabel.forEach((line, i) => { body += `<text class="its01-dg-sub" x="${zx + zw / 2}" y="${zy + 4 + 14 + i * lh}" text-anchor="middle">${esc(line)}</text>`; });
  d.personal.apps.forEach((app, i) => {
    const ty = zy + 10 + zoneLabel.length * lh + i * 32;
    body += `<rect class="its06-dg-app" x="${zx + 8}" y="${ty}" width="${zw - 16}" height="26" rx="6"/><text class="its01-dg-text" x="${zx + zw / 2}" y="${ty + 18}" text-anchor="middle">${esc(app)}</text>`;
  });

  body += its06Box(gate, gateX, gateTop, gateW, gateH) + its06Box(mail, mailX, mailTop, mailW, mailH);
  return its06Svg('phones', layout, width, mailTop + mailH + 4, body);
}

const ITS06_DIAGRAM_DRAW = { status: its06StatusSvg, jml: its06JmlSvg, hybrid: its06HybridSvg, phones: its06PhonesSvg };

function its06Diagram(key) {
  const d = ITS06_DIAGRAMS[key];
  const draw = ITS06_DIAGRAM_DRAW[key];
  if (!d || !draw) return '';
  return `<figure class="its01-dg" data-its06-diagram="${esc(key)}">
    <p class="its01-dg-heading">${esc(d.title)}</p>
    ${draw('wide')}
    ${draw('narrow')}
    <p class="its01-sr-only" id="its06-dg-${esc(key)}-desc">${esc(its06DiagramWords(key))}</p>
    ${d.caption ? `<figcaption>${esc(d.caption)}</figcaption>` : ''}
  </figure>`;
}

/* ------------------------------------------------------------- Lessons */

// Escaped text; **...** becomes emphasized text and `...` inline code. Both
// run on the escaped text, so no markup gets in.
function its06Text(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code class="its06-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// An empty header cell (the row-label column) gets a hidden label, so a
// screen reader doesn't meet an empty header.
function its06Table(table) {
  const caption = esc(table.caption);
  const head = table.head.map((cell) => `<th scope="col">${cell ? esc(cell) : '<span class="its01-sr-only">Item</span>'}</th>`).join('');
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${its06Text(cell)}</td>`).join('')}</tr>`).join('');
  return `<div class="its10-table-wrap" tabindex="0" role="region" aria-label="${caption}"><table class="its10-table"><caption>${caption}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function its06Blocks(blocks) {
  return blocks.map((block) => {
    if (block.h) return `<h4>${esc(block.h)}</h4>`;
    if (block.h5) return `<h5>${esc(block.h5)}</h5>`;
    if (block.p) return `<p>${its06Text(block.p)}</p>`;
    if (block.ul) return `<ul>${block.ul.map((item) => `<li>${its06Text(item)}</li>`).join('')}</ul>`;
    if (block.ol) return `<ol>${block.ol.map((item) => `<li>${its06Text(item)}</li>`).join('')}</ol>`;
    if (block.table) return its06Table(block.table);
    if (block.diagram) return its06Diagram(block.diagram);
    if (block.cardsort) return its06CardSort();
    if (block.note) return `<div class="its01-note"><strong>${esc(block.note.title)}</strong><p>${esc(block.note.text)}</p></div>`;
    return '';
  }).join('');
}

function its06LessonCard(card) {
  return `<details class="its01-lesson" data-its06-lesson="${esc(card.id)}" data-its06-reading="${esc(String(card.reading))}">
    <summary><span class="its01-lesson-icon"><i class="${esc(card.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(card.number)} · Reading ${esc(String(card.reading))} · ${esc(card.heading)}</strong><small>${esc(card.minutesText)}</small></span><i class="ri-arrow-down-s-line its01-chevron" aria-hidden="true"></i></summary>
    <div class="its01-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${card.learn.map((item) => `<li>${its06Text(item)}</li>`).join('')}</ul>
      ${its06Blocks(card.blocks)}
      ${card.comingUp ? `<div class="its01-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(card.comingUp)}</span></div>` : ''}
    </div>
  </details>`;
}

/* ------------------------------------------------------ Account-status card sort */

/* Four account snapshots, each put in a box by a button under the card. A
 * wrong box says why (its line is keyed by the box, and never names the right
 * one) and the student picks again; the right box shows that card's line. No
 * score. It is complete once every card is in its right box. Dates are
 * relative, never a calendar date. */
const ITS06_CARD_SORT = {
  title: 'Account-status card sort',
  intro: 'Read each account’s fields, then put it in the box that matches what you see: pick a box under each card. Not graded: a wrong box tells you why, and you try again.',
  buckets: ['Locked', 'Disabled', 'Password expired', 'Active'],
  whyNot: {
    Locked: 'Look at the Locked out field. This box needs a Yes there, and this card doesn’t show one.',
    Disabled: 'Look at the Enabled field and the history. This box is for an account someone turned off, and this card isn’t one.',
    'Password expired': 'Look for Password expired: Yes. This box is for a password past its 90 days, and this card doesn’t show one.',
    Active: 'This account has something to read again. Check each field and its history before you call it fine.',
  },
  cards: [
    { id: 'wes', name: 'Wes Turner', answer: 'Locked',
      fields: [['Locked out', 'Yes'], ['Enabled', 'Yes'], ['Account expires', 'Never'], ['Password expired', 'No'], ['Last bad password attempt', '08:42']],
      why: 'Five wrong passwords locked it. Verify him, then unlock once. If it locks again, find the source first.' },
    { id: 'kofi', name: 'Kofi Mensah', answer: 'Disabled',
      fields: [['Locked out', 'No'], ['Enabled', 'No'], ['History', 'Disabled by HR — leaver, last week']],
      why: 'A leaver stays disabled. Only HR can change that.' },
    { id: 'ruth', name: 'Ruth Adeyemi', answer: 'Password expired',
      fields: [['Locked out', 'No'], ['Enabled', 'Yes'], ['Password expired', 'Yes'], ['Password last set', '91 days ago']],
      why: 'She changes it at sign-in; if she can’t, self-service, then KB-0104.' },
    { id: 'dev', name: 'Dev Raman', role: 'Contractor', answer: 'Active',
      fields: [['Locked out', 'No'], ['Enabled', 'Yes'], ['Account expires', 'in 9 days'], ['Sponsor', 'Leah Brooks'], ['Password expired', 'No']],
      why: 'Nothing to fix today. His end date and his sponsor are on the account: when it ends, only Leah can approve more time.' },
  ],
};

/* ------------------------------------------------------- Knowledge checks */

/* Two checks, each answered one question at a time. A right pick shows its why
 * line, a wrong pick shows its ifWrong line (never the right answer). ifWrong
 * is keyed by the choice's place in the data and has null on the right answer.
 * The choices are shuffled per student, per question and per attempt
 * (its06ChoiceOrder), so no line refers to a choice by its letter.
 *   - learn: six program questions, after Reading 4. Complete at 5 of 6.
 *   - aplus: eight questions on A+ Core 1 objectives 1.3 (six) and 4.2 (two),
 *     after Reading 4. Complete at 6 of 8. */
const ITS06_CHECKS = {
  learn: {
    title: 'Learn It knowledge check',
    intro: 'Six questions on this module’s first three readings: account states and lockouts, groups and movers, MFA requests and shared mailboxes. They are program checks, not A+ questions. It’s complete when 5 of your first answers are right. Retake it as often as you like.',
    questions: [
      { q: 'You unlocked a user’s account ten minutes ago, and it is locked again. What do you do next?',
        choices: ['Unlock it again', 'Read Lockout details for the source before you unlock it', 'Reset the password', 'Disable the account'], answer: 1,
        why: 'Something is still trying an old password; unlock only after the source is fixed (Reading 1, KB-0103).',
        ifWrong: ['It will lock again within minutes.', null, 'A new password doesn’t stop a device trying the old one.', 'Disabling stops the user working and fixes nothing.'] },
      { q: 'An account is disabled, and its history says “Leaver — HR”. The caller’s former manager asks you to re-enable it for one week. What do you do?',
        choices: ['Enable it for a week', 'Leave it disabled; re-enabling a leaver is HR’s decision, so send the manager to HR', 'Reset the password', 'Unlock it'], answer: 1,
        why: 'Disabled is a decision, not a fault; only the HR record that approves it allows an enable (Table 1).',
        ifWrong: ['A manager’s word doesn’t override HR’s offboarding.', null, 'This doesn’t apply: the account isn’t locked, and its password isn’t the problem.', 'This doesn’t apply: the account isn’t locked, and its password isn’t the problem.'] },
      { q: 'A user moved from Sales to Finance. Which change follows least privilege?',
        choices: ['Add the Finance groups and keep the Sales groups in case they’re needed', 'Add the Finance groups and remove the Sales groups', 'Add them to Domain Admins until it settles', 'Make them a local administrator'], answer: 1,
        why: 'A mover gains the new role’s access and loses the old role’s (Reading 2, Table 3).',
        ifWrong: ['Old access left behind is what attackers look for.', null, 'This gives far more than the job needs (KB-0058).', 'This gives far more than the job needs (KB-0058).'] },
      { q: 'You added a user to the group for a folder. They still can’t open it. What is the most likely reason?',
        choices: ['The file server is down', 'They haven’t signed out and back in', 'Their licence was removed', 'Their password expired'], answer: 1,
        why: 'Windows reads groups at sign-in; `whoami /groups` shows what their sign-in has (Reading 2).',
        ifWrong: ['Everyone else would be affected.', null, 'A licence controls Microsoft 365 apps, not a file share.', 'They’d be asked to change it at sign-in.'] },
      { q: 'An email from a personal address says “It’s Priya from Sales, please reset my MFA ASAP.” What do you do first?',
        choices: ['Reset it; she sounds rushed', 'Reply to the personal address to ask for her employee ID', 'Verify Priya through the directory and open the ticket under her real account; don’t act on the email', 'Forward the email to her manager'], answer: 2,
        why: 'An MFA reset is how accounts are taken over, so it needs strong verification through the directory (KB-0065, Table 2).',
        ifWrong: ['Anyone can type a name into an email.', 'Replying to the personal address talks to whoever sent it.', null, 'Her manager can confirm, but only after you’ve reached Priya through the directory.'] },
      { q: 'A user opens the support@ mailbox but her replies go out from her own address. What is missing?',
        choices: ['Read and manage (Full Access)', 'Send as', 'Distribution list membership', 'A licence for the mailbox'], answer: 1,
        why: 'Full Access opens the mailbox; Send as sends from it (Table 4, KB-0107).',
        ifWrong: ['She has it: she can open the mailbox.', null, 'A list copies mail; it doesn’t send as anyone.', 'A shared mailbox needs no licence.'] },
    ],
  },
  aplus: {
    title: 'A+ check (Core 1: 1.3, 4.2)',
    intro: 'Eight questions in the style of the A+ Core 1 exam: six on mobile device connectivity and application support (objective 1.3) and two on cloud models and SaaS (objective 4.2). It’s complete when 6 of your first answers are right. Retake it as often as you like.',
    questions: [
      { q: 'A company wants to enforce a PIN on its company phones and be able to wipe one that is lost. What should it use?',
        choices: ['A VPN', 'Mobile device management (MDM)', 'NFC', 'A hotspot'], answer: 1,
        why: 'MDM (Northstar uses Intune) enrols the whole company phone, enforces settings such as the PIN, and can wipe it (Reading 4, Table 5).',
        ifWrong: ['A VPN protects network traffic; it doesn’t manage the phone.', null, 'NFC is a short-range tap connection, such as paying with a phone.', 'A hotspot shares the phone’s cellular data with another device.'] },
      { q: 'On employees’ personal phones, a company wants to protect only its work apps and their data, not the whole phone. Which approach fits?',
        choices: ['A full-device wipe policy', 'App protection for the work apps (MAM)', 'Turning off the camera', 'Removing the app store'], answer: 1,
        why: 'On a personal phone (BYOD), app protection manages only the work apps; a wipe removes only their data (Table 5).',
        ifWrong: ['Wiping a personal phone would erase the employee’s own photos and apps.', null, 'This controls the whole phone, which a company doesn’t do on a personal one.', 'This controls the whole phone, which a company doesn’t do on a personal one.'] },
      { q: 'A user is pairing a new Bluetooth headset with their phone. The phone finds the headset and asks for a code. What should the user do?',
        choices: ['Enter the PIN from the headset’s guide (often 0000), then test with a call', 'Turn Wi-Fi off', 'Reset the phone’s network settings', 'Turn on location services'], answer: 0,
        why: 'Pairing is: on, pairing mode, find it, PIN, test (Reading 4, Table 6).',
        ifWrong: [null, 'This doesn’t affect Bluetooth pairing.', 'Resetting network settings removes every saved Wi-Fi and Bluetooth device; it’s a last resort, not a pairing step.', 'This doesn’t affect Bluetooth pairing.'] },
      { q: 'A user’s company phone stopped getting work mail this morning. Their laptop is fine. Intune shows the phone is **not compliant: OS version below minimum**. What fixes it?',
        choices: ['Remove the user from the compliance policy', 'Install the update on the phone, then tap Check status in Company Portal', 'Reset the user’s password', 'Have the user add their work mail to a personal mail app'], answer: 1,
        why: 'Conditional Access lets only compliant company phones get work mail; the fix is on the phone (Reading 4, KB-0105).',
        ifWrong: ['Taking someone out of a security policy to get them working is never Tier 1’s call.', null, 'The password isn’t the problem; the laptop proves it works.', 'That moves company mail outside company protection.'] },
      { q: 'A user has a 5 GB monthly data plan, and OneDrive uploads their work photos all day. Which setting helps most?',
        choices: ['Turn on the hotspot', 'Set OneDrive to upload on Wi-Fi only', 'Turn on location services', 'Pair a Bluetooth device'], answer: 1,
        why: 'A data cap limits cellular data each month; large uploads belong on Wi-Fi (Table 6).',
        ifWrong: ['A hotspot uses more cellular data, not less.', null, 'This doesn’t change how much data uploads use.', 'This doesn’t change how much data uploads use.'] },
      { q: 'A maps app shows a user’s position to within a few metres outdoors, but only roughly inside a large building. What explains it?',
        choices: ['GPS is precise outdoors; indoors the phone falls back to cellular location', 'The SIM card is failing', 'Bluetooth is off', 'The data cap has been reached'], answer: 0,
        why: 'GPS uses satellites and needs a view of the sky; cellular location uses nearby towers and is rougher (Table 6).',
        ifWrong: [null, 'A failing SIM drops calls and data; it doesn’t change accuracy.', 'Bluetooth isn’t used for outdoor position.', 'A reached cap slows data; GPS still works.'] },
      { q: 'Northstar pays per user per month for Microsoft 365 apps that Microsoft hosts and updates. Which cloud model is this?',
        choices: ['IaaS', 'PaaS', 'SaaS', 'A private cloud'], answer: 2,
        why: 'A finished app you just use, with the provider running everything behind it, is software as a service (Reading 3).',
        ifWrong: ['With IaaS you rent servers and manage the operating system.', 'PaaS is a platform for code you write.', null, 'A private cloud is run for one organisation; Microsoft 365 is shared by many.'] },
      { q: 'Northstar keeps user accounts in its own Active Directory and syncs them to Entra ID for Microsoft 365. Which cloud deployment is this?',
        choices: ['Public', 'Private', 'Hybrid', 'Community'], answer: 2,
        why: 'On-site systems and a public cloud service used together are a hybrid cloud (Reading 3, One identity, two places).',
        ifWrong: ['Public alone would mean no on-site directory.', 'Private means a cloud run for Northstar alone.', null, 'A community cloud is shared by organisations with the same needs.'] },
    ],
  },
};

/* ------------------------------------------------------- Objective, sources */

// The weekly objective, shown in the hero.
const ITS06_OBJECTIVE = 'By the end of this module you can tell a locked account, a disabled account and an account with an expired password apart, and read an account’s end date and its sponsor. When a lockout keeps coming back, you can find its source and fix it, or hand it on with what you found when it is Tier 2’s. You can reset a password only when self-service can’t be used, enable an account only against the HR record, and change a person’s groups the least-privilege way. You can re-register a user’s MFA after strong verification, give Send as on a shared mailbox, and set up a company phone. A+ Core 1: **1.3** mobile device network connectivity and application support · **4.2** cloud models and SaaS (reinforced). Competencies: **1** AD/Entra basics · **4** M365/Entra admin center · **8** Security hygiene; practised: **3** Ticketing discipline · **7** Communication under pressure · **9** Triage and escalation judgment.';

const ITS06_SOURCES = [
  { title: 'Digital Identity Guidelines: Authentication and Lifecycle Management (SP 800-63B)', org: 'NIST', url: 'https://pages.nist.gov/800-63-3/sp800-63b.html', note: 'Federal guidance on verifying people, passwords and multifactor sign-in.' },
  { title: 'How it works: Microsoft Entra multifactor authentication', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/entra/identity/authentication/concept-mfa-howitworks', note: 'The sign-in methods and prompts you read and re-register in the Entra admin center.' },
  { title: 'Device compliance policies in Microsoft Intune', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/mem/intune/protect/device-compliance-get-started', note: 'How Intune marks a phone compliant or not, and what Conditional Access does with the result.' },
  { title: 'About shared mailboxes', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/microsoft-365/admin/email/about-shared-mailboxes', note: 'Full Access and Send as, and why a shared mailbox needs no licence of its own.' },
  { title: 'Group-based licensing in Microsoft Entra ID', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/entra/identity/users/licensing-groups-assign', note: 'Why taking someone out of a licence group takes their licence away.' },
];

/* ----------------------------------------------------------- Page state */

// Saved to the student's account (module_progress.case_state): each check's
// and the card sort's "complete" and its time, and whether the walkthrough was
// started. Never answers or a score.
const ITS06_STATE_ID = 'its06-page-v1';
// Until the Prove It opens, Lab 8.1 is the module's gating lab
// (course_module_labs) and is instructor reviewed. The practice tickets lab
// has its own lab key, and so has the Prove It.
const ITS06_LAB1_KEY = 'lab-its-06-identity-access';
const ITS06_PRACTICE_KEY = 'lab-its-06-practice-tickets';
const ITS06_PROVE_KEY = 'lab-its-06-prove-it';
const ITS06_LAB_KEYS = [ITS06_LAB1_KEY, ITS06_PRACTICE_KEY, ITS06_PROVE_KEY];
const ITS06_COACH_ID = 'hd-m06';
const ITS06_LAB1_START = 'Start Lab 8.1 walkthrough';

const ITS06_DEFAULT_STATE = {
  consoleStarted: false, consoleCompleted: false,
  cardSortCompleted: false, cardSortCompletedAt: null,
  learnCheckCompleted: false, learnCheckCompletedAt: null,
  aplusCheckCompleted: false, aplusCheckCompletedAt: null,
};

let its06State = null;
let its06User = null;

function its06Load(user) {
  // Check answers and card sort picks live in page memory: a different
  // student signing in without a reload starts every one fresh.
  const userId = user && user.userId;
  if (userId !== its06CheckAnswersUser) {
    its06CheckAnswersUser = userId;
    Object.keys(its06CheckAnswers).forEach((key) => {
      its06CheckAnswers[key] = {};
      its06CheckPicks[key] = {};
      its06CheckAttempt[key] = 0;
    });
    Object.keys(its06CheckSaveFailed).forEach((key) => { its06CheckSaveFailed[key] = false; });
    its06SortPicks = {};
  }
  its06User = user;
  its06State = LabRuntime.loadCaseState(ITS06_STATE_ID, 'its-06', user, ITS06_DEFAULT_STATE);
  // The simulator's popup message is the only way a walkthrough is recorded;
  // a return by link only shows that it wasn't (see itsNoteCoachReturn).
  itsNoteCoachReturn(user, ITS06_COACH_ID, [ITS06_LAB1_KEY]);
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-06');
  return its06State;
}

function its06Save(onResult) {
  if (its06User && its06State) LabRuntime.saveCaseState(ITS06_STATE_ID, 'its-06', its06User, its06State, onResult ? { onResult } : {});
}

function its06Day(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

// A lab's minutes, from the course data (LABS in portal/data.js).
function its06LabMinutes(labKey) {
  const lab = typeof LABS !== 'undefined' ? LABS.find((item) => item.key === labKey) : null;
  return lab && lab.instructionalMinutes ? lab.instructionalMinutes : 0;
}

/* ------------------------------------------------------- Knowledge checks */

/* One question at a time, as on Module 1. A wrong pick shows why that choice is
 * wrong, never the right answer, and the student picks again. A right pick
 * shows the Why. Only the first pick on each question counts. A check is
 * complete the first time a full pass of first picks is 70% or more (whole
 * numbers only: correct x 10 >= total x 7), so 5 of 6 on the Learn It check
 * and 6 of 8 on the A+ check. Once complete it stays complete; Start again is
 * a retake. No lab attempt, no lab key, gates nothing. */
const ITS06_LETTERS = ['A', 'B', 'C', 'D'];
const ITS06_CHECK_PASS_TENTHS = 7;
// The saved completion fields for each check, and for the card sort.
const ITS06_CHECK_SAVED = {
  learn: ['learnCheckCompleted', 'learnCheckCompletedAt'],
  aplus: ['aplusCheckCompleted', 'aplusCheckCompletedAt'],
  sort: ['cardSortCompleted', 'cardSortCompletedAt'],
};

// This page's picks, by check, kept in page memory only (a reload starts
// every check again), by the choice's place in the data (not the place shown):
//   its06CheckAnswers: { questionIndex: the first pick }, the one that counts.
//   its06CheckPicks: { questionIndex: [every pick, in order] }.
//   its06CheckAttempt: how many times the check was started again; it is part
//   of the shuffle, so a retake shows the choices in a new order.
//   its06SortPicks: { cardId: [every box picked, in order] } for the card sort.
const its06CheckAnswers = { learn: {}, aplus: {} };
const its06CheckPicks = { learn: {}, aplus: {} };
// Activities whose completion the account reported it didn't save (page memory).
const its06CheckSaveFailed = { learn: false, aplus: false, sort: false };
const its06CheckAttempt = { learn: 0, aplus: 0 };
let its06SortPicks = {};
let its06CheckAnswersUser = null;

// The order a student sees a question's choices in: shuffled from their
// anonymous id, the check, the question and the attempt, so it differs between
// students and between retakes, and stays the same for one student on every
// redraw and reload of the same attempt.
function its06ChoiceOrder(checkId, index) {
  const question = ITS06_CHECKS[checkId].questions[index];
  const seed = `${its06User ? LabRuntime.anonymousStudentId(its06User) : ''}|its-06|${checkId}|${index}|${its06CheckAttempt[checkId]}`;
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

// Every question has a first pick: a full pass, ready to count.
function its06CheckDone(checkId) {
  return ITS06_CHECKS[checkId].questions.every((_, i) => Object.prototype.hasOwnProperty.call(its06CheckAnswers[checkId], i));
}
function its06CheckRightCount(checkId) {
  return ITS06_CHECKS[checkId].questions.filter((question, i) => its06CheckAnswers[checkId][i] === question.answer).length;
}
// Whole numbers only, so 5 of 8 (62.5%) or 4 of 6 (66.7%) can never round
// up to a pass.
function its06CheckPassed(checkId) {
  const total = ITS06_CHECKS[checkId].questions.length;
  return its06CheckRightCount(checkId) * 10 >= total * ITS06_CHECK_PASS_TENTHS;
}
// How many first picks a full pass needs.
function its06CheckNeeded(checkId) {
  return Math.ceil((ITS06_CHECKS[checkId].questions.length * ITS06_CHECK_PASS_TENTHS) / 10);
}
// A check or the card sort is saved as complete.
function its06CheckCompleted(checkId) {
  return Boolean(its06State && its06State[ITS06_CHECK_SAVED[checkId][0]] === true);
}
// The card sort is done once every card is in its right box.
function its06SortDone() {
  return ITS06_CARD_SORT.cards.every((card) => (its06SortPicks[card.id] || []).includes(card.answer));
}
// An activity ready to save: a full passing check, or a finished card sort.
function its06Ready(checkId) {
  return checkId === 'sort' ? its06SortDone() : its06CheckDone(checkId) && its06CheckPassed(checkId);
}

function its06CheckQuestion(checkId, question, index) {
  const picks = its06CheckPicks[checkId][index] || [];
  const last = picks.length ? picks[picks.length - 1] : undefined;
  const settled = picks.includes(question.answer);
  // Only the student's own picks are marked: a wrong pick never marks or
  // names the right answer. data-choice stays the data index; the letter
  // comes from the place the choice is shown in.
  const choices = its06ChoiceOrder(checkId, index).map((c, place) => {
    const picked = picks.includes(c);
    const cls = picked ? (c === question.answer ? ' is-answer' : ' is-wrong') : '';
    return `<button type="button" class="its01-choice${cls}" data-its06-answer data-check="${checkId}" data-q="${index}" data-choice="${c}" aria-pressed="${picked}" ${settled || picked ? 'disabled' : ''}><span>${ITS06_LETTERS[place]}</span> ${its06Text(question.choices[c])}</button>`;
  }).join('');
  const why = settled && question.why ? `<p class="its01-check-why">${its06Text(question.why)}</p>` : '';
  const wrongLine = !settled && last !== undefined && question.ifWrong && question.ifWrong[last] ? `<p class="its01-check-why">${its06Text(question.ifWrong[last])}</p>` : '';
  const feedback = last === undefined ? ''
    : settled
      ? `<p class="its01-check-result is-right"><i class="ri-check-line" aria-hidden="true"></i> <strong>Correct.</strong></p>${why}`
      : `<p class="its01-check-result is-wrong"><i class="ri-close-line" aria-hidden="true"></i> <strong>Not quite.</strong> Try another answer.</p>${wrongLine}`;
  return `<li class="its01-check-q">
    <p class="its01-check-prompt" id="its06-${checkId}-q${index}">${its06Text(question.q)}</p>
    <div class="its01-choices" role="group" aria-labelledby="its06-${checkId}-q${index}">${choices}</div>
    <div class="its01-check-feedback" id="its06-${checkId}-q${index}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

// The status line: a completion the account didn't save asks to try the save
// again; a failed full pass asks for a retake (no score shown); otherwise a
// saved completion shows with its date.
function its06CheckFooter(checkId) {
  const anyAnswered = Object.keys(its06CheckAnswers[checkId]).length > 0;
  const reset = anyAnswered ? `<button type="button" class="its01-check-reset" data-its06-check-reset="${checkId}"><i class="ri-restart-line" aria-hidden="true"></i> Start again</button>` : '';
  const saveFailed = its06CheckSaveFailed[checkId] && its06CheckDone(checkId) && its06CheckPassed(checkId);
  const retry = saveFailed ? `<button type="button" class="its01-check-reset" data-its06-check-retry="${checkId}"><i class="ri-refresh-line" aria-hidden="true"></i> Try again</button>` : '';
  let status = '';
  if (saveFailed) {
    status = '<i class="ri-error-warning-line" aria-hidden="true"></i> Your result didn’t save. Try again.';
  } else if (its06CheckDone(checkId) && !its06CheckPassed(checkId)) {
    status = `Retake: you need ${its06CheckNeeded(checkId)} of ${ITS06_CHECKS[checkId].questions.length}. Press Start again to retake the check.`;
  } else if (its06CheckCompleted(checkId)) {
    const day = its06Day(its06State[ITS06_CHECK_SAVED[checkId][1]]);
    status = `<i class="ri-check-line" aria-hidden="true"></i> ${esc(ITS06_CHECKS[checkId].title)} complete${day ? ` (${esc(day)})` : ''}. You can retake it any time.`;
  }
  return `<div class="its01-check-footer" data-its06-check-footer="${checkId}"><p class="its01-check-status" role="status" tabindex="-1">${status}</p><span class="its01-check-actions">${retry}${reset}</span></div>`;
}

function its06Check(checkId) {
  const check = ITS06_CHECKS[checkId];
  return `<div class="its01-check" data-its06-check="${checkId}" id="its06-check-${checkId}">
    <h3>${esc(check.title)}</h3>
    <p class="its01-instruction">${esc(check.intro)}</p>
    <p class="its01-instruction">Choose an answer. A wrong answer tells you why it’s wrong, and you try again; a right one tells you why it’s right. Your first answer to each question is the one that counts. Not graded: your answers aren’t sent to your instructor, and only that you completed the check is saved to your account.</p>
    <ol class="its01-check-list">${check.questions.map((question, i) => its06CheckQuestion(checkId, question, i)).join('')}</ol>
    ${its06CheckFooter(checkId)}
  </div>`;
}

// One card of the card sort: the person and their account fields, then one
// row of box buttons. A wrong box says why and the student picks again; the
// right box shows the card's line and settles it. Feedback only, no score.
function its06SortCard(card) {
  const picks = its06SortPicks[card.id] || [];
  const last = picks.length ? picks[picks.length - 1] : undefined;
  const settled = picks.includes(card.answer);
  const lid = `its06-sort-${card.id}`;
  const buttons = ITS06_CARD_SORT.buckets.map((bucket) => {
    const picked = picks.includes(bucket);
    const cls = picked ? (bucket === card.answer ? ' is-answer' : ' is-wrong') : '';
    return `<button type="button" class="its01-choice its02-sort-box${cls}" data-its06-sort="${esc(card.id)}" data-bucket="${esc(bucket)}" aria-pressed="${picked}" ${settled || picked ? 'disabled' : ''}>${esc(bucket)}</button>`;
  }).join('');
  const fields = card.fields.map(([name, value]) => `<div><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>`).join('');
  const feedback = last === undefined ? ''
    : settled
      ? `<p class="its01-check-result is-right"><i class="ri-check-line" aria-hidden="true"></i> <strong>Right box: ${esc(card.answer)}.</strong></p><p class="its01-check-why">${esc(card.why)}</p>`
      : `<p class="its01-check-result is-wrong"><i class="ri-close-line" aria-hidden="true"></i> <strong>Not this box.</strong> Try another.</p><p class="its01-check-why">${esc(ITS06_CARD_SORT.whyNot[last] || '')}</p>`;
  return `<li class="its02-sort-card">
    <p class="its01-check-prompt" id="${lid}">${esc(card.name)}${card.role ? ` <small>(${esc(card.role)})</small>` : ''}</p>
    <dl class="its06-sort-fields" aria-labelledby="${lid}">${fields}</dl>
    <div class="its02-sort-boxes" role="group" aria-labelledby="${lid}">${buttons}</div>
    <div class="its01-check-feedback" id="${lid}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

// The card sort's status line: the same kinds as a check's, with no score.
function its06SortFooter() {
  const anyAnswered = Object.keys(its06SortPicks).length > 0;
  const reset = anyAnswered ? '<button type="button" class="its01-check-reset" data-its06-sort-reset><i class="ri-restart-line" aria-hidden="true"></i> Start again</button>' : '';
  const saveFailed = its06CheckSaveFailed.sort && its06SortDone();
  const retry = saveFailed ? '<button type="button" class="its01-check-reset" data-its06-check-retry="sort"><i class="ri-refresh-line" aria-hidden="true"></i> Try again</button>' : '';
  let status = '';
  if (saveFailed) {
    status = '<i class="ri-error-warning-line" aria-hidden="true"></i> Your result didn’t save. Try again.';
  } else if (its06CheckCompleted('sort')) {
    const day = its06Day(its06State[ITS06_CHECK_SAVED.sort[1]]);
    status = `<i class="ri-check-line" aria-hidden="true"></i> ${esc(ITS06_CARD_SORT.title)} complete${day ? ` (${esc(day)})` : ''}. You can do it again any time.`;
  }
  return `<div class="its01-check-footer" data-its06-check-footer="sort"><p class="its01-check-status" role="status" tabindex="-1">${status}</p><span class="its01-check-actions">${retry}${reset}</span></div>`;
}

function its06CardSort() {
  return `<div class="its01-check its02-sort" data-its06-cardsort id="its06-cardsort">
    <h3>${esc(ITS06_CARD_SORT.title)}</h3>
    <p class="its01-instruction">${esc(ITS06_CARD_SORT.intro)}</p>
    <ul class="its02-sort-list">${ITS06_CARD_SORT.cards.map(its06SortCard).join('')}</ul>
    ${its06SortFooter()}
  </div>`;
}

/* ------------------------------------------------------------- Sections */

// Each check sits right after the reading card it follows (as on Module 1's
// page), outside the card, so a rail link to it never lands inside a closed
// card. Both come after Reading 4: the Learn It questions draw on Readings 1
// to 3, and the A+ check on Readings 3 and 4.
const ITS06_CHECK_AFTER_READING = { 4: ['learn', 'aplus'] };

function its06Learn() {
  return `<section class="its01-section" id="its06-lessons" aria-labelledby="its06-lessons-title">
    <div class="its01-section-heading"><span>L</span><div><p class="its01-kicker">Learn It</p><h2 id="its06-lessons-title">Lessons 8.1 to 8.3</h2></div></div>
    <p class="its01-instruction">Three lessons and four readings. Lesson 8.3 has two readings that share its time. Open each reading for its text, tables and diagram. The account-status card sort is in Reading 1. The Learn It check and the A+ check come after Reading 4.</p>
    ${its06Cards().map((card) => `<div class="its01-lesson-grid">${its06LessonCard(card)}</div>${(ITS06_CHECK_AFTER_READING[card.reading] || []).map(its06Check).join('')}`).join('')}
  </section>`;
}

// Lab 8.1: the hd-m06 coach on two tickets (HD-2196 and HD-2197, with its
// request SR-2207) in the IT Service Desk simulator (ui/helpdesk-coaches.js).
// Feedback only: no score. Its optional extension opens a second coach
// (hd-m06-ext) by a plain link: it has no lab key, no rail row, no message
// handling and no saved state.
function its06Lab1() {
  const button = itsWalkthroughButton(its06User, [ITS06_LAB1_KEY]);
  return `<section class="its01-section its01-lab-section" id="its06-lab-8-1" aria-labelledby="its06-lab-8-1-title">
    <div class="its01-section-heading"><span>1</span><div><p class="its01-kicker">Guided Lab · coached · instructor reviewed</p><h2 id="its06-lab-8-1-title">${esc(itsLabTitle(ITS06_LAB1_KEY))}</h2></div></div>
    <p class="its01-instruction">It is early afternoon at the Service Desk, and two people need you. In the IT Service Desk simulator you work two tickets. Part A is HD-2196: Noah Williams in Sales is locked out again. You read his account, find the source of the wrong passwords on NS-WS-0277, remove the saved password with him, unlock the account once, and check that it stays unlocked. Part B is HD-2197 and its request SR-2207 (RITM0010162): Sam Rivera walks up with a new work phone. You verify him in person, re-register his MFA, enrol the phone, set up Outlook, set OneDrive to upload on Wi-Fi only, pair his headset, and add Send as on support@. A coach guides you through each step.</p>
    <p class="its01-instruction">The coach names the goal of each typed step; open Show me the command if you need it. Feedback only, no score. Your instructor reviews your finished lab.</p>
    <p class="its01-instruction" data-its06-lab-minutes>Time: ${formatInstructionalMinutes(its06LabMinutes(ITS06_LAB1_KEY))}</p>
    <a class="itsw-evidence-button" data-its06-console-launch href="${esc(itsCoachLaunchHref(ITS06_COACH_ID, its06User))}" target="_blank" rel="opener">
      <i class="${button.icon}" aria-hidden="true"></i> ${{ redo: 'Redo the walkthrough', review: 'Review the walkthrough', start: ITS06_LAB1_START }[button.mode]}
    </a>
    ${itsWalkthroughNoticeHtml(its06User, ITS06_COACH_ID, [ITS06_LAB1_KEY], ITS06_LAB1_START)}
    ${itsLabStatusHtml(its06User, ITS06_LAB1_KEY, { label: 'Lab 8.1', prefix: 'its01', pendingText: 'Complete the guided walkthrough in the simulator to finish this lab.' })}
    ${itsRedoNoticeHtml(its06User, [{ key: ITS06_LAB1_KEY, action: 'Run the walkthrough again to resubmit this lab.' }])}
    <div class="its06-extension">
      <p class="its01-instruction"><strong>Optional extension (not part of your lab record)</strong></p>
      <p class="its01-instruction">HD-2101: Jordan Bell in Finance is unlocked and locked again. Find the source, and see why it is Tier 2’s work.</p>
      <a class="itsw-evidence-button" data-its06-extension-launch href="${esc(itsCoachLaunchHref('hd-m06-ext', its06User))}" target="_blank" rel="noopener">
        <i class="ri-play-circle-line" aria-hidden="true"></i> Open the extension
      </a>
    </div>
  </section>`;
}

// Lab 8.2, the module's four unguided tickets, not graded: the simulator opens
// just these tickets in their own saved shift (?practice=its-06,
// ui/helpdesk.js), with feedback but no score. Opened with an opener, so once
// all four are done the simulator can report it (its06ReceivePracticeCompletion).
function its06PracticeTicketsHref(user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?practice=its-06&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
}
function its06PracticeTickets() {
  return `<section class="its01-section its01-lab-section" id="its06-lab-8-2" aria-labelledby="its06-lab-8-2-title">
    <div class="its01-section-heading"><span>2</span><div><p class="its01-kicker">Practice It · on your own</p><h2 id="its06-lab-8-2-title">${esc(itsLabTitle(ITS06_PRACTICE_KEY))}</h2></div></div>
    <p class="its01-instruction">Four tickets to work on your own, each a different issue: someone back from leave who can’t sign in (8-A), an MFA reset asked for from a personal email address (8-B), a mover between departments missing a folder and Teams (8-C), and no work mail on a company phone (8-D). On each one, set the Category, CI, Impact and Urgency yourself, use the tool screens and the knowledge base, and press Check my work for feedback.</p>
    <p class="its01-instruction">Practice: not graded. Your answers aren’t sent. Finish all four tickets: each one ends resolved, assigned to the team that owns it, or converted to its request, and each one gets your work note. Check my work shows what is still missing. The simulator then tells this page, and your account records that you completed Lab 8.2.</p>
    <p class="its01-instruction" data-its06-lab-minutes>Time: ${formatInstructionalMinutes(its06LabMinutes(ITS06_PRACTICE_KEY))}</p>
    <a class="itsw-evidence-button" data-its06-practice-launch href="${esc(its06PracticeTicketsHref(its06User))}" target="_blank" rel="opener">
      <i class="ri-play-list-line" aria-hidden="true"></i> Open the practice tickets
    </a>
    ${itsLabStatusHtml(its06User, ITS06_PRACTICE_KEY, { label: 'Lab 8.2', prefix: 'its01', pendingText: 'Finish all four tickets: resolve each one, assign it to the team that owns it, or convert it to its request.' })}
  </section>`;
}

// The Prove It opens nothing yet: its simulator shift isn't built.
function its06Prove() {
  return `<section class="its01-section its01-lab-section" id="its06-prove-it" aria-labelledby="its06-prove-it-title">
    <div class="its01-section-heading"><span>3</span><div><p class="its01-kicker">Prove It · Assessment Lab · instructor reviewed</p><h2 id="its06-prove-it-title">${esc(itsLabTitle(ITS06_PROVE_KEY))}</h2></div></div>
    <p class="its01-instruction">Work a new ticket on your own in the IT Service Desk simulator: no coach, no hints and no feedback before you submit. Your instructor reviews your work.</p>
    <p class="its01-instruction" data-its06-lab-minutes>Time: ${formatInstructionalMinutes(its06LabMinutes(ITS06_PROVE_KEY))}</p>
    <p class="its01-lab-status its01-status-pending" data-its06-prove-soon role="status"><i class="ri-time-line" aria-hidden="true"></i> Opens soon. Nothing to do here yet: work Labs 8.1 and 8.2 first.</p>
  </section>`;
}

function its06Sources() {
  return `<div class="msources-block">
    <h3 class="msources-title">Further Reading</h3>
    <ul class="msources-list">
      ${ITS06_SOURCES.map((source) => `<li class="msources-item">
        <a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer" class="msources-link"><span class="msources-title-text">${esc(source.title)}</span><span class="msources-org">${esc(source.org)}</span></a>
        ${source.note ? `<p class="msources-note">${esc(source.note)}</p>` : ''}
      </li>`).join('')}
    </ul>
  </div>`;
}

/* The rail. The readings, the three labs and both checks count toward the
 * module's percent (shown only; it saves nothing); Sources doesn't. The checks
 * come last in the list, so they never lock a lab (moduleNavStatuses locks
 * only rows after an unfinished one), and neverLocked keeps them open while
 * Lab 8.1 isn't done. The card sort sits inside Reading 1's card and shows its
 * own saved status there, as Module 4's does: a rail link would land inside a
 * closed card. */
function its06NavSections(user) {
  return [
    { id: 'lessons', title: 'Readings', type: 'lecture', phase: 'learn', isComplete: true, scrollId: 'its06-lessons' },
    { id: 'guided-lab', title: 'Guided identity morning walkthrough', navTitle: 'Lab 8.1 · Guided Lab', type: 'lab', ...itsLabRail(user, [ITS06_LAB1_KEY]), scrollId: 'its06-lab-8-1' },
    // Counts toward the percent, but never locked: the practice tickets can
    // be opened at any time.
    { id: 'unguided', title: 'Lab 8.2 · Practice tickets', navTitle: 'Lab 8.2 · Practice tickets', type: 'lab', phase: 'practice', neverLocked: true, ...itsLabRail(user, [ITS06_PRACTICE_KEY]), scrollId: 'its06-lab-8-2' },
    // Named so the platform's generic Assessment Lab box isn't added
    // (normalizeModuleStages).
    { id: 'assessment', title: 'Assessment Lab', type: 'review', neverLocked: true, ...itsLabRail(user, [ITS06_PROVE_KEY]), scrollId: 'its06-prove-it' },
    { id: 'learn-check', title: ITS06_CHECKS.learn.title, type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its06CheckCompleted('learn'), doneLabel: 'Complete', scrollId: 'its06-check-learn' },
    { id: 'aplus-check', title: ITS06_CHECKS.aplus.title, type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its06CheckCompleted('aplus'), doneLabel: 'Complete', scrollId: 'its06-check-aplus' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'its06-sources', gated: false, supplemental: true },
  ];
}
function its06Rail(user) {
  return moduleProgressShell(its06NavSections(user), { moduleKey: 'its06', stageKey: 'its-06' });
}

function viewItsModuleEightPage(user, program) {
  its06Load(user);
  const module = program.modules['its-06'];
  return `<div class="its06-shell">
    ${moduleTopbar(user, program)}
    ${its06Rail(user)}
    <main class="its01-main">
      <section class="its01-hero" aria-labelledby="its06-title"><div><p class="its01-kicker">Module ${String(module.number).padStart(2, '0')} · ${formatInstructionalMinutes(module.durationMinutes)} · Week ${esc(String(module.week))}</p><h1 id="its06-title">${esc(module.title)}</h1><p class="its01-lede">${its06Text(ITS06_OBJECTIVE)}</p></div><dl class="its01-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${ITS06_LESSONS.length}</dd></div><div><dt>Guided labs</dt><dd>1</dd></div><div><dt>Labs</dt><dd id="its06-status">${itsLabCounterText(user, ITS06_LAB_KEYS)}</dd></div></dl></section>

      ${its06Learn()}
      ${its06Lab1()}
      ${its06PracticeTickets()}
      ${its06Prove()}

      <section class="its01-section" id="its06-sources" aria-labelledby="its06-sources-title"><div class="its01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Reference — not a graded step</p><h2 id="its06-sources-title">Sources &amp; Further Reading</h2></div></div>${its06Sources()}</section>
    </main>
  </div>`;
}

/* ----------------------------------------------------------- Re-renders */

// Updates the rail's rows and percent in place, so its open groups, drawer
// and listeners stay as they are.
function its06RefreshRail() {
  const rail = document.querySelector('.its06-shell [data-mquick-nav-rail]');
  if (!rail || !its06User) return;
  const holder = document.createElement('div');
  holder.innerHTML = its06Rail(its06User);
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

// Redraws one activity ('learn', 'aplus' or 'sort') in place. focusId: the
// feedback element to move focus to.
function its06RenderCheck(checkId, focusId) {
  const selector = checkId === 'sort' ? '[data-its06-cardsort]' : `[data-its06-check="${checkId}"]`;
  const el = document.querySelector(`.its06-shell ${selector}`);
  if (el) el.outerHTML = checkId === 'sort' ? its06CardSort() : its06Check(checkId);
  if (focusId) {
    const target = document.getElementById(focusId);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }
  its06RefreshRail();
}

/* -------------------------------------------------------------- Actions */

// One pick on one question, as on Module 1. A check is complete, and saved as
// such (complete and its time only), the first time a full pass of first picks
// passes.
function its06Answer(checkId, index, choice) {
  const check = ITS06_CHECKS[checkId];
  const question = check && check.questions[index];
  if (!question || !(choice >= 0 && choice < question.choices.length)) return;
  const picks = its06CheckPicks[checkId][index] || [];
  if (picks.includes(question.answer) || picks.includes(choice)) return;
  its06CheckPicks[checkId][index] = picks.concat(choice);
  if (its06CheckAnswers[checkId][index] === undefined) its06CheckAnswers[checkId][index] = choice;
  const [done] = ITS06_CHECK_SAVED[checkId];
  if (its06State && its06Ready(checkId) && its06State[done] !== true) its06SaveCheckDone(checkId);
  its06RenderCheck(checkId, `its06-${checkId}-q${index}-feedback`);
}

// One box picked for one card in the card sort. It is complete, and saved as
// such (complete and its time only), once every card is in its right box.
function its06Sort(cardId, bucket) {
  const card = ITS06_CARD_SORT.cards.find((c) => c.id === cardId);
  if (!card || !ITS06_CARD_SORT.buckets.includes(bucket)) return;
  const picks = its06SortPicks[cardId] || [];
  if (picks.includes(card.answer) || picks.includes(bucket)) return;
  its06SortPicks[cardId] = picks.concat(bucket);
  if (its06State && its06SortDone() && !its06CheckCompleted('sort')) its06SaveCheckDone('sort');
  its06RenderCheck('sort', `its06-sort-${cardId}-feedback`);
}

// Ticks an activity and saves it, as Module 1's checks do. Only an explicit
// false from the save takes the tick off again (an unknown result leaves it),
// and only if the same student still has the same completion (a render reloads
// its06State, so it's matched by its time, not by object). The untick is saved
// the same way, so this page, this browser's copy and the session's copy of
// the row agree.
function its06SaveCheckDone(checkId) {
  const [done, doneAt] = ITS06_CHECK_SAVED[checkId];
  const userId = its06User && its06User.userId;
  const at = new Date().toISOString();
  its06State[done] = true;
  its06State[doneAt] = at;
  its06CheckSaveFailed[checkId] = false;
  its06Save((ok) => {
    const state = its06State;
    if (ok !== false || !state || !its06User || its06User.userId !== userId || state[doneAt] !== at) return;
    state[done] = false;
    state[doneAt] = null;
    its06CheckSaveFailed[checkId] = true;
    its06Save();
    // Keep focus where it was, unless it was on a button this render removes.
    const active = document.activeElement;
    const footer = document.querySelector(`.its06-shell [data-its06-check-footer="${checkId}"]`);
    const focusInFooter = Boolean(footer && active && footer.contains && footer.contains(active));
    its06RenderCheck(checkId);
    if (focusInFooter) its06FocusCheckStatus(checkId);
  });
}

function its06FocusCheckStatus(checkId) {
  const status = document.querySelector(`.its06-shell [data-its06-check-footer="${checkId}"] .its01-check-status`);
  if (status && typeof status.focus === 'function') status.focus({ preventScroll: true });
}

// Try again: the answers are still in page memory, so save the pass again.
function its06RetryCheckSave(checkId) {
  if (!ITS06_CHECK_SAVED[checkId] || !its06CheckSaveFailed[checkId] || !its06State || !its06Ready(checkId)) return;
  its06SaveCheckDone(checkId);
  its06RenderCheck(checkId);
  its06FocusCheckStatus(checkId);
}

// Start again: a new attempt, so the choices come back in a new order.
function its06ResetCheck(checkId) {
  if (!ITS06_CHECKS[checkId]) return;
  its06CheckAnswers[checkId] = {};
  its06CheckPicks[checkId] = {};
  its06CheckSaveFailed[checkId] = false;
  its06CheckAttempt[checkId] += 1;
  its06RenderCheck(checkId);
  const first = document.querySelector(`.its06-shell [data-its06-check="${checkId}"] [data-its06-answer]`);
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
}

// Start again on the card sort: every card goes back to no box.
function its06ResetSort() {
  its06SortPicks = {};
  its06CheckSaveFailed.sort = false;
  its06RenderCheck('sort');
  const first = document.querySelector('.its06-shell [data-its06-cardsort] [data-its06-sort]');
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
}

function wireItsModuleEightPage() {
  const shell = document.querySelector('.its06-shell');
  if (!shell || !its06State) return;
  shell.addEventListener('click', (event) => {
    const answer = event.target.closest('[data-its06-answer]');
    if (answer) {
      if (!answer.disabled) its06Answer(answer.dataset.check, Number(answer.dataset.q), Number(answer.dataset.choice));
      return;
    }
    const sort = event.target.closest('[data-its06-sort]');
    if (sort) {
      if (!sort.disabled) its06Sort(sort.dataset.its06Sort, sort.dataset.bucket);
      return;
    }
    if (event.target.closest('[data-its06-sort-reset]')) {
      its06ResetSort();
      return;
    }
    const reset = event.target.closest('[data-its06-check-reset]');
    if (reset) {
      its06ResetCheck(reset.dataset.its06CheckReset);
      return;
    }
    const retry = event.target.closest('[data-its06-check-retry]');
    if (retry) {
      its06RetryCheckSave(retry.dataset.its06CheckRetry);
      return;
    }
    const launch = event.target.closest('[data-its06-console-launch]');
    if (launch) {
      if (itsLaunchWalkthrough(event, launch, its06User, ITS06_COACH_ID)) {
        its06State.consoleStarted = true;
        its06Save();
      }
      itsRefreshWalkthroughNotice(its06User, ITS06_COACH_ID, [ITS06_LAB1_KEY], ITS06_LAB1_START);
    }
  });
}

/* ------------------------------------------- Lab 8.1 and Lab 8.2 saves */

// Lab 8.1's finished work, read from the cleaned snapshot (itsCleanCoachWork):
// HD-2196 and HD-2197 resolved, and an entry for SR-2207. SR-2207 is the
// request record whose number is RITM0010162. The cleaned work doesn't keep
// the request's own state, and the coach closes the request in the same step
// as it resolves HD-2197, so the entry being there with HD-2197 resolved is
// the page's check on the request. The coach checks every step in order
// before it shows Finish; the saved work keeps no step list, so the page
// checks the end. An old tab could still send an early message.
const ITS06_LAB1_TICKETS = ['HD-2196', 'HD-2197'];
const ITS06_LAB1_REQUEST = 'SR-2207';
function its06Lab1Complete(work) {
  const tickets = work && Array.isArray(work.tickets) ? work.tickets : [];
  const resolved = (id) => tickets.some((entry) => entry.id === id && entry.status === 'Resolved');
  return ITS06_LAB1_TICKETS.every(resolved) && tickets.some((entry) => entry.id === ITS06_LAB1_REQUEST);
}

async function its06ReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== ITS06_COACH_ID) return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = await currentUser();
  if (!user) { itsConfirmCoachReceipt(event, false); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { itsConfirmCoachReceipt(event, false, wrongStudent); return; }

  const work = itsCleanCoachWork(event.data.work);
  const coachKey = `${user.userId}|${ITS06_COACH_ID}`;
  if (!its06Lab1Complete(work)) {
    itsIncompleteWalkthroughs.add(coachKey);
    itsRefreshWalkthroughNotice(user, ITS06_COACH_ID, [ITS06_LAB1_KEY], ITS06_LAB1_START);
    itsConfirmCoachReceipt(event, false, 'incomplete');
    return;
  }
  itsIncompleteWalkthroughs.delete(coachKey);

  // Submit first: Lab 8.1 counts as complete only once the portal has its
  // attempt (saved now, or already waiting or approved).
  const received = await itsSubmitWalkthroughLabs(user, 'its-06', [ITS06_LAB1_KEY], work);
  its06User = user;
  if (received) {
    const saved = LabRuntime.load(ITS06_STATE_ID, user, ITS06_DEFAULT_STATE);
    saved.consoleStarted = true;
    saved.consoleCompleted = true;
    LabRuntime.save(ITS06_STATE_ID, user, saved);
    its06State = saved;
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-06', ITS06_LAB1_KEY);
  }
  itsConfirmCoachReceipt(event, received);

  if (!document.querySelector('.its06-shell')) return;
  render();
  const section = document.getElementById('its06-lab-8-1');
  if (section) section.scrollIntoView({ block: 'start' });
}

// Lab 8.2's completion: the simulator's practice set says its four tickets
// are done (ui/helpdesk.js hdPracticeReport; the set's `complete` and `done`
// rules in ui/helpdesk-data.js). Saved once, as a lab attempt with no score
// and no answers: completion, its time and the ticket ids. Every message gets
// an answer, so the simulator can say whether it was saved.
const ITS06_PRACTICE_TICKETS = ['HD-2198', 'HD-2199', 'HD-2200', 'HD-2201'];
const ITS06_PRACTICE_LOCK_MS = 15000;
function its06StorageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
function its06StorageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* storage blocked: no lock */ } }
function its06StorageRemove(key) { try { localStorage.removeItem(key); } catch (_) { /* storage blocked */ } }

async function its06ReceivePracticeCompletion(event) {
  const data = event.data;
  if (!data || data.type !== 'mnt-practice-complete' || data.id !== 'its-06') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const reply = (saved, reason) => {
    if (!event.source || typeof event.source.postMessage !== 'function') return;
    event.source.postMessage({ type: 'mnt-practice-received', id: 'its-06', nonce: data.nonce, saved: saved === true, ...(reason ? { reason } : {}) }, event.origin);
  };
  const user = await currentUser();
  if (!user) { reply(false, 'signed-out'); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { reply(false, wrongStudent); return; }
  const tickets = Array.isArray(data.tickets) ? data.tickets : [];
  if (tickets.length !== ITS06_PRACTICE_TICKETS.length || !ITS06_PRACTICE_TICKETS.every((id) => tickets.includes(id))) { reply(false, 'incomplete'); return; }
  // Already recorded (as loaded at sign-in, or saved on this page).
  if (itsLabSubmitted(user, ITS06_PRACTICE_KEY)) { reply(true); return; }
  if (itsLabSubmitting(user, ITS06_PRACTICE_KEY)) { reply(false, 'busy'); return; }
  // lab_attempts allows many rows per lab and this lab has no
  // course_module_labs row, so the database won't refuse a second record.
  // Another course page tab in this browser may be saving right now (the
  // lock), or may already have saved (the database read): either way, no
  // second record.
  const lock = `mnt.practice-save.${user.userId}.${ITS06_PRACTICE_KEY}`;
  const held = Number(its06StorageGet(lock)) || 0;
  if (Date.now() - held < ITS06_PRACTICE_LOCK_MS) { reply(false, 'busy'); return; }
  its06StorageSet(lock, String(Date.now()));
  let saved = false;
  try {
    const existing = await its06SavedPracticeAttempt(user);
    if (existing === null) { reply(false, 'save-failed'); return; }
    if (existing) {
      user.latestLabAttemptByKey = { ...(user.latestLabAttemptByKey || {}), [ITS06_PRACTICE_KEY]: existing };
      saved = true;
    } else {
      saved = await itsSubmitLabAttempt(user, 'its-06', ITS06_PRACTICE_KEY, {
        state: 'complete', result: { source: 'mnt-practice-complete', practiceSet: 'its-06', tickets: ITS06_PRACTICE_TICKETS.slice() },
      });
    }
  } finally {
    its06StorageRemove(lock);
  }
  if (saved && typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-06', ITS06_PRACTICE_KEY);
  reply(saved, saved ? '' : 'save-failed');
  its06User = user;
  if (document.querySelector('.its06-shell')) render();
}

// The student's saved Lab 8.2 record, read from the database: the attempt
// (in the shape latestLabAttemptByKey holds), false when there is none, or
// null when the read failed. A superseded or returned record doesn't count.
async function its06SavedPracticeAttempt(user) {
  if (typeof mntSupabase === 'undefined') return null;
  try {
    const { data, error } = await mntSupabase.from('lab_attempts')
      .select('completed_at, reviewed_at, redo_requested, superseded_at')
      .eq('user_id', user.userId).eq('lab_key', ITS06_PRACTICE_KEY)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });
    if (error) { console.error('Lab 8.2 completion read failed', error); return null; }
    const row = Array.isArray(data) ? data.find((entry) => entry && !entry.superseded_at && entry.redo_requested !== true) : null;
    return row ? { completedAt: row.completed_at, reviewedAt: row.reviewed_at || null, redoRequested: row.redo_requested === true, supersededAt: row.superseded_at || null } : false;
  } catch (error) {
    console.error('Lab 8.2 completion read threw', error);
    return null;
  }
}

function its06OnMessage(event) {
  return Promise.all([its06ReceivePracticeCompletion(event), its06ReceiveCoachCompletion(event)]);
}

registerModuleLab({
  program: 'it-support', moduleNumber: 8, moduleKey: 'its-06',
  view: viewItsModuleEightPage, wire: wireItsModuleEightPage, onMessage: its06OnMessage,
});
