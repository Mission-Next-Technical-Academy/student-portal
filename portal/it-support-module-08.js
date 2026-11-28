/* Module 10 (key its-08) — IT Help Desk & Career Accelerator ('it-support').
 * Fictional org, tickets, and policy text; no real systems are involved.
 *
 * Its own course page, on Module 9's page pattern. This file holds the Learn
 * It content and the code that draws it:
 *   - Two filed lessons shown as three reading cards (Lessons 10.1 to 10.3).
 *     Lesson 10.1 is Reading 1 (its-08-lesson-01). Lessons 10.2 and 10.3 are
 *     Readings 2 and 3 and share one filed entry (its-08-lesson-02), so the two
 *     cards share its minutes. Each reading has its tables and its diagrams.
 *   - Two knowledge checks: the Learn It check (six program questions, after
 *     Reading 2) and the A+ check (eight questions, after Reading 3). Each has
 *     a "why" line for a right answer and an "if wrong" line for each wrong
 *     one. The choices are shuffled per student and per attempt.
 *   - Three lab cards: Lab 10.1 (the guided lab, coach hd-m08), Lab 10.2 (the
 *     practice tickets) and the Prove It.
 *
 * Block types (its08Blocks): h (sub-heading), h5 (a smaller heading under
 * it), p, ul, ol, note ({ title, text }), table ({ caption, head, rows }) and
 * diagram (a key of ITS08_DIAGRAMS). In p, ul, ol, table and check text,
 * **...** is emphasized and `...` is inline code.
 * bin/its-curriculum-check.js reads each filed lesson's title and minutes from
 * this file: the title must match portal/data.js, and the minutes are the
 * filed lesson minutes plus that lesson's share of the lab (the checker's
 * mapping). A lesson entry keeps its title and its minutes on one line, and
 * nothing else here may put a minutes value right after a title.
 */

const ITS08_LESSONS = [
  {
    id: 'its-08-lesson-01', number: '10.1',
    title: 'Remote Support Etiquette & Tools', minutes: 60,
    readings: [
      {
        number: 1, icon: 'ri-remote-control-2-line', heading: 'Remote support: the right tool, and four habits', time: 'about 10 minutes',
        learn: [
          'Choose the right remote tool: Quick Assist, Remote Support, or none (diagram 2)',
          'Name RDP (3389), SSH (22) and Telnet (23), and say who uses each (Table 1)',
          'Say what a virtual desktop is, and how it differs from remote support (Table 1)',
          'Run the four habits in every remote session (Table 2)',
        ],
        blocks: [
          { h: 'Reading 1 · Remote support: the right tool, and four habits' },
          { p: 'Most of your fixes will happen on a computer you can’t touch. Remote support lets you see the user’s screen and work on it while they watch, and it’s a privilege: you’re a guest on someone’s computer, often with their email and files a click away.' },
          { diagram: 'session' },
          { p: '**The tools.** **Quick Assist** is built into Windows. The user presses **Win + Ctrl + Q**, types the short code you read them (it expires in 10 minutes), and chooses **Allow**. They see everything you do, and they can stop the session at any time. It only works when the user is signed in to Windows. **Remote Support** is Northstar’s company tool, like ConnectWise ScreenConnect at other companies. Its agent runs on every company PC before anyone signs in, so it can reach a PC that is stuck at the sign-in screen. On a person’s computer it always sends a **request** they allow. It can also connect without asking (unattended access), which is only for servers, kiosks and room PCs, with the owner’s approval. Remote Support keeps a **session log** (who connected, to what, when, and who allowed it) and has a **command console** that runs PowerShell on the remote PC. You’ll also hear about **Remote Desktop (RDP, TCP 3389)**, which signs an admin in to a computer as a session of its own, mainly for servers, and should never be open to the internet; **SSH (TCP 22)**, the encrypted text console Network Operations uses on switches and routers; and **Telnet (TCP 23)**, its old unencrypted cousin, which sends passwords in plain text and shouldn’t be used. A **virtual desktop** (Module 4) is different again: the whole desktop runs in the data center, and nothing is on the user’s own device (Table 1).' },
          { table: {
            caption: 'Table 1 · The remote tools you’ll meet',
            head: ['Tool', 'What it does', 'When Northstar uses it', 'Port or need'],
            rows: [
              ['**Quick Assist**', 'Built into Windows. The user shares their screen with you and can give you control. They see everything you do', 'A user who is **signed in** and on the phone or chat with you', 'The user presses Win + Ctrl + Q and types your 6-character code (it expires in 10 minutes)'],
              ['**Remote Support** (Northstar’s company tool, like ConnectWise ScreenConnect)', 'An agent on every company PC. Reaches the PC even at the **sign-in screen**; keeps a session log; has a command console', 'Any company PC whose agent is online. A person’s PC always gets a request they **Allow**', 'Company network or VPN; the agent shows “Online”'],
              ['**Remote Desktop (RDP)**', 'Signs in to a computer as a session of its own, as if you sat at it. The user doesn’t see it', 'Admins on servers. **Never open to the internet**', 'TCP **3389**'],
              ['**SSH**', 'An encrypted text console for network devices and Linux servers', 'Network Operations on switches and routers', 'TCP **22**'],
              ['**Telnet**', 'The old, **unencrypted** text console: passwords cross the network in plain text', 'Never. If you see it, say so', 'TCP 23'],
              ['**A virtual desktop (VDI)**', 'A whole Windows desktop that runs in the data center; the user opens it from any device and nothing is stored locally (Module 4)', 'Claims staff and contractors', 'The virtual desktop client'],
              ['**Teams screen sharing**', 'The user shows you their screen in a call; you can’t take control unless they give it', 'Quick looks, when no session is needed', 'A Teams call'],
            ],
          } },
          { p: '**Which tool?** Is the user signed in? Quick Assist. Stuck at the sign-in screen? Remote Support, with a request they allow. Is the PC off, or not starting Windows at all? No remote tool can reach it: ask questions on the phone, then send someone to the desk (diagram 2).' },
          { diagram: 'tool' },
          { p: '**The four habits, every session** (Table 2). **1) Verify, then ask.** Verify the caller first (KB-0024), then ask: “May I connect to your computer to look at this? You’ll see everything I do.” A ticket is not consent. **2) Respect privacy.** Ask them to close anything personal, such as email, banking or chats, and open only what the problem needs. **3) Narrate.** “I’m opening your sound settings now to see where Windows is sending the audio.” It builds trust, and people often add the clue you need when they hear what you’re checking. **4) Close cleanly.** Confirm the fix with them, say you’re disconnecting, choose End session, and write the start and end times in your work note. Never ask anyone for a password during a session; if a sign-in is needed, the user types it.' },
          { table: {
            caption: 'Table 2 · The four habits, every session',
            head: ['Habit', 'Say or do', 'Why'],
            rows: [
              ['1 Verify, then ask', 'Verify the caller (KB-0024). “May I connect to your computer to look at this? You’ll see everything I do.”', 'A ticket is not consent. A session nobody asked for is a security incident (Module 11)'],
              ['2 Respect privacy', '“Before I connect, please close anything personal: email, banking, chats.” Open only what the problem needs', 'You’re a guest on someone’s screen'],
              ['3 Narrate', '“I’m opening the sound settings now to check where Windows sends the audio.”', 'It builds trust, and users often add a clue when they hear what you’re checking'],
              ['4 Close cleanly', 'Confirm the fix with them, say you’re disconnecting, **End session**, and write the start and end times in the work note', 'The session log and your note are the record of what you did on their PC'],
            ],
          } },
          { p: 'A session the user didn’t ask for, or a connection request they weren’t expecting, is a security incident (Module 11). If anyone ever says “someone from IT is on my screen and I didn’t call”, stop and report it.' },
        ],
        comingUp: 'You’ll run a Quick Assist session and a Remote Support session in the guided lab (Lab 10.1).',
      },
    ],
  },
  {
    id: 'its-08-lesson-02', number: '10.2',
    title: 'Structured Troubleshooting & Stop-and-Escalate Judgment', minutes: 60,
    readings: [
      {
        number: 2, lessonNumber: '10.2', icon: 'ri-flow-chart', heading: 'The method on a problem you’ve never seen', time: 'about 10 minutes',
        learn: [
          'Work a problem you’ve never seen: evidence first, one hypothesis at a time (diagram 3)',
          'Say when to stop and escalate, and what to hand off (Table 3)',
          'Tell what a “something about the domain” message points at (Table 4, diagram 4)',
          'Read the three new commands: `w32tm /query /status`, `w32tm /resync` and `Test-ComputerSecureChannel` (Table 7)',
        ],
        blocks: [
          { h: 'Reading 2 · The method on a problem you’ve never seen' },
          { p: 'You can’t memorise a fix for everything, but the method from Module 1 works on anything: identify the problem, form a theory, test it, plan, fix or escalate, verify, and document. On a problem that’s new to you, two habits matter most.' },
          { p: '**Evidence before action.** Write down the exact words of the error, and ask three questions: when did it start, what changed just before, and does it happen to anyone else? Then gather what the tools show: the Event log, Reliability Monitor, the KB searched with the exact error text. Copying the exact words matters because two errors that sound alike can mean very different things.' },
          { p: '**One hypothesis at a time.** Pick the most likely theory, test it with one check or one change, and write the result down before you move on. If you change three things and it works, nobody knows which one mattered, and the other two may cause the next problem. Your work note’s **Tried** line is that list: each check and what it showed, in the order you did them (diagram 3).' },
          { diagram: 'loop' },
          { table: {
            caption: 'Table 3 · When to stop and escalate',
            head: ['Stop when…', 'Example', 'Hand off with'],
            rows: [
              ['The approved path is used up', 'The KB’s steps are done and it still fails', 'What you tried, in order, with each result'],
              ['The fix needs rights you don’t have', 'Repairing a domain trust, opening a PC’s case', 'The evidence, and what you didn’t try and why'],
              ['It touches security or a high-risk system', 'A session nobody asked for; a payroll server', 'The facts, untouched (Module 11)'],
              ['Carrying on risks data or a longer outage', 'Rebuilding an index the night before a deadline', 'The workaround you gave, and the deadline'],
              ['The KB says it isn’t Tier 1’s', 'The article’s **Audience** field says Desktop Support', 'The KB number and the evidence it asks for'],
            ],
          } },
          { p: '**Where does the clue point?** Some messages sound alike but point at different things (Table 4, diagram 4). “The trust relationship between this workstation and the primary domain failed” means the computer’s own account no longer matches the domain, often after it was restored from an old image; `Test-ComputerSecureChannel` returns False, and Desktop Support repairs it. A message about a **time and/or date difference**, or every website suddenly warning that its certificate’s date is wrong, points at the PC’s **clock**: Kerberos, the system that checks domain sign-ins, refuses a computer whose clock is more than **5 minutes** away from the domain’s, and websites check dates too. Look at the clock and `w32tm /query /status`, and `w32tm /resync` puts it right. A clock that is wrong after a PC was unplugged for a long time or worked on inside points at the small battery on the motherboard that keeps the clock (the CMOS battery), and if it goes wrong again, that’s a hardware ticket. A locked, disabled or expired account (Module 08) and a PC that can’t reach the network (Module 09) give their own messages. Read the words, then rule each one in or out.' },
          { table: {
            caption: 'Table 4 · “Something about the domain”: where the clue points',
            head: ['The clue', 'Points at', 'Tier 1 checks', 'Tier 1 does'],
            rows: [
              ['“The trust relationship between this workstation and the primary domain failed”', 'The PC’s machine account no longer matches the domain (often after a PC is restored from an old image or snapshot)', '`Test-ComputerSecureChannel` (False); Event log: NETLOGON 3210; Active Directory › Computers: is the object there and enabled?', 'Escalate to Desktop Support with the evidence (KB-0095). Never remove and rejoin'],
              ['“There is a time and/or date difference between the client and server”, and every HTTPS site warns that the date is wrong', 'The PC’s **clock**. Kerberos, the domain’s sign-in system, refuses a PC whose clock is more than **5 minutes** from the domain’s; websites’ certificates look expired or not yet valid', 'The clock (the session’s System info, or `Get-Date`); `w32tm /query /status`', '`w32tm /resync`, then try again. A clock that is wrong after the PC was unplugged for a long time or worked on inside points at the small battery that keeps the clock (the CMOS battery): if it goes wrong again, a hardware ticket to Desktop Support'],
              ['“Your account has been locked out”, “disabled” or “Your password has expired”', 'The **account** (Module 08)', '`Get-ADUser <user> -Properties LockedOut, Enabled, PasswordExpired`', 'Module 08’s steps, behind verification'],
              ['“There are currently no logon servers available”, and the PC can’t reach anything', 'The **network** or **DNS** (Module 09)', '`ping` the domain controller; `nslookup northstar.example`', 'Module 09’s checklist'],
            ],
          } },
          { diagram: 'domain' },
          { p: '**Stop and escalate when** the approved path is used up, the fix needs rights or access you don’t have, it touches security or a high-risk system, carrying on risks data or a longer outage, or the KB’s **Audience** says another team (Table 3). Good technicians aren’t the ones who never escalate; they’re the ones who recognise the moment, and hand off with the evidence, including what they didn’t try and why (Module 3).' },
          { table: {
            caption: 'Table 7 · Commands in Module 10',
            head: ['Typed (taught here)', 'What it tells you'],
            rows: [
              ['`w32tm /query /status`', 'Where the PC gets its time and when it last synced. “Source: Local CMOS Clock” means it isn’t syncing'],
              ['`w32tm /resync`', 'Asks the time source for the time now'],
              ['`Test-ComputerSecureChannel`', 'True: the PC’s trust with the domain is fine. False: it’s broken (a Desktop Support repair)'],
              ['Back from earlier modules', '`ping` and `nslookup` (Module 09) · `Test-NetConnection <host> -Port <n>` (Modules 4, 07, 09) · `Get-ADUser <user> -Properties …` (Module 08)'],
              ['On a screen (the command is optional and earns the same credit)', '`Get-Date` (System info) · `Get-WinEvent -LogName System -MaxEvents 20` (Event log) · `Get-Service WSearch`, `Start-Service WSearch` (Services) · Sound and Display settings'],
              ['**Never at Tier 1**', '`Remove-Computer`, `Add-Computer` to rejoin, `Test-ComputerSecureChannel -Repair`, `Reset-ComputerMachinePassword`: Desktop Support’s (KB-0095)'],
            ],
          } },
        ],
        comingUp: 'You’ll rule out one cause at a time on a laptop that won’t sign in, and hand it to Desktop Support, in the guided lab (Lab 10.1, Part B).',
      },
      {
        number: 3, lessonNumber: '10.3', icon: 'ri-computer-line', heading: 'Power, heat and displays at Tier 1', time: 'about 10 minutes',
        learn: [
          'Make the safe Tier 1 checks for power, heat and board symptoms, and say what Tier 1 never does (Table 5)',
          'Say what to do about a burning smell, smoke or sparks',
          'Make the Tier 1 checks for display and projector symptoms (Table 6, diagram 5)',
          'Tell which problems go to Desktop Support and which to the AV team',
        ],
        blocks: [
          { h: 'Reading 3 · Power, heat and displays at Tier 1' },
          { p: 'Hardware faults reach the Service Desk as symptoms. Your job is to recognise the symptom, make the safe checks a user can do, and get the right team there with good evidence. **Tier 1 never opens a computer’s case.**' },
          { p: '**Power and the board** (Table 5). **No power at all:** the outlet, the power strip’s switch, a known-good cable. **Beeps at power-on and a black screen:** before Windows starts, the PC runs a hardware self-test (POST); beeps mean it found a fault, and the pattern says which part. Write the pattern down exactly (“one long, two short”), check the maker’s page, and check the monitor first, because “black screen” is sometimes just the display. A maker’s own crash or diagnostic screen gets photographed for Desktop Support. **Slowness** and **overheating** you met in Module 5: shutdowns under load, a loud fan and Event ID 41 point at heat. A **grinding noise** is usually a failing fan or an old spinning drive. **Swollen capacitors** on the board are something only Desktop Support sees, inside the case. **A burning smell, smoke or sparks: switch off, unplug, keep people away, then escalate.** And an **inaccurate date and time** means the clock lost its time, which is the CMOS battery’s job (Reading 2).' },
          { table: {
            caption: 'Table 5 · Power, heat and the board: Tier 1 checks (A+ Core 1 5.1)',
            head: ['Symptom', 'Most likely', 'Tier 1 checks and does', 'Owner of the fix'],
            rows: [
              ['**No power** (no lights, no fans)', 'The outlet, the power strip, the cable, the power supply', 'Is the strip on and lit? Try another outlet and a known-good cable', 'Desktop Support if still dead (power supply)'],
              ['**POST beeps** (beeps at power-on, before Windows)', 'The PC’s self-test found a hardware fault; the pattern says which', 'Write down the pattern (for example 1 long, 2 short); check the maker’s page; check the monitor first', 'Desktop Support. **Tier 1 never opens the case**'],
              ['**Black screen** with fans running', 'No picture (monitor, cable, input) or a failed self-test', 'Monitor power and input (Module 4); then the beeps', 'Desktop Support if it isn’t the display'],
              ['**Proprietary crash screens** (a maker’s diagnostic screen, or a blue screen)', 'A hardware or driver fault', 'Photograph the code; the maker’s diagnostics; Module 5’s blue-screen steps', 'Desktop Support for hardware'],
              ['**Sluggish performance**', 'Disk, memory, startup apps, heat', 'Module 5’s slow-PC order', 'Tier 1 first'],
              ['**Overheating**, **intermittent shutdown** under load', 'Blocked vents, dust, a failing fan or power supply', 'Event ID 41 (Kernel-Power), where the PC sits, the fan’s noise (Module 5)', 'Desktop Support cleans and checks the fan'],
              ['**Burning smell**, smoke or sparks', 'A failing power supply or board', '**Switch off, unplug, keep people away**, report it', 'Desktop Support; Facilities if there’s smoke'],
              ['**Grinding noise**', 'A failing fan or an old spinning drive', 'Where it comes from; back up first if it’s the drive (Module 3)', 'Desktop Support'],
              ['**Capacitor swelling** (bulging tops on the board)', 'A failing board', 'Only Desktop Support sees this: inside the case', 'Desktop Support replaces the board'],
              ['**Application crashes** across several apps', 'Memory, heat or the OS', 'Reliability Monitor (Module 5)', 'Depends on the evidence'],
              ['**Inaccurate date and time**', 'The clock lost its time: a flat or newly replaced **CMOS battery**, or no time sync', 'The clock and `w32tm /query /status`; `w32tm /resync`', 'Tier 1 resyncs; Desktop Support replaces a battery that keeps failing'],
            ],
          } },
          { p: '**Displays and projectors** (Table 6, diagram 5). **No signal** usually means the wrong input: the Source button, then Win + P (Module 4). **Physical cabling:** reseat both ends and try the spare; not every USB-C port carries video. A **fuzzy picture with the edges cut off** means the laptop is sending a resolution the display doesn’t use: choose the display’s **(Recommended)** resolution; most room projectors are 1920 × 1080. **No sound** in a room or a headset means Windows is sending audio somewhere else: Settings › System › Sound › Output. **Wrong colours** or **flicker** usually mean a loose or damaged cable, or a refresh rate the display doesn’t like. A **dim image** can be eco mode or an old lamp; a **burned-out bulb** gives no picture at all; a projector that **switches itself off** mid-meeting is usually overheating, with a filter warning. **Dead pixels** and **burn-in** are the panel itself: test with another display, then escalate. Projector lamps, filters and vents are the AV team’s (KB-0111).' },
          { diagram: 'screen' },
          { table: {
            caption: 'Table 6 · Displays and projectors: Tier 1 checks (A+ Core 1 5.3)',
            head: ['Symptom', 'Most likely', 'Tier 1 checks and does'],
            rows: [
              ['**No signal** (incorrect data source)', 'The display is looking at another input', 'The Input or Source button; Win + P (Module 4)'],
              ['**Physical cabling issues**', 'A loose cable, the wrong port (not every USB-C port carries video), a bent pin', 'Reseat both ends; the spare cable; another port'],
              ['**Fuzzy image**, edges cut off', 'The laptop sends a resolution the display doesn’t use natively', 'Settings › Display › resolution: choose the display’s **(Recommended)** one (a projector is usually 1920 × 1080)'],
              ['**Incorrect color display**', 'A loose or damaged cable, or a colour setting', 'Reseat or swap the cable; then the display’s own colour reset'],
              ['**Audio issues** (no sound from the room or the headset)', 'Windows sends sound to another output', 'Settings › System › Sound › Output'],
              ['**Flashing screen** (flicker)', 'A loose cable, a refresh rate the display doesn’t like, or failing hardware', 'The cable; the refresh rate in Advanced display; an external display test'],
              ['**Dim image**', 'Brightness or eco mode; on a projector, an old lamp', 'Brightness and eco mode; the projector’s lamp hours'],
              ['**Burned-out bulb**', 'A projector lamp at the end of its life', 'Lamp hours and the lamp warning light; move the meeting; the AV team replaces it'],
              ['**Intermittent projector shutdown**', 'The projector is overheating: a blocked vent or a dirty filter', 'The filter warning and the vents; the AV team cleans it'],
              ['**Dead pixels**, **display burn-in**', 'The panel itself', 'An external display test, then escalate: hardware'],
            ],
          } },
        ],
        comingUp: 'You’ll work a fuzzy projector picture and a PC that beeps and stays black in the practice tickets (Lab 10.2).',
      },
    ],
  },
];

// The page shows one card per reading: three cards for the two filed lessons.
// Readings 2 and 3 belong to one filed lesson (its-08-lesson-02), so both cards
// carry its id and say they share its minutes. A reading shows its own lesson
// number when it has one (Lesson 10.2 and Lesson 10.3).
function its08Cards() {
  return ITS08_LESSONS.flatMap((lesson) => lesson.readings.map((reading) => {
    const numbers = lesson.readings.map((r) => r.lessonNumber || lesson.number);
    return {
      id: lesson.id, number: reading.lessonNumber || lesson.number, reading: reading.number, icon: reading.icon, heading: reading.heading,
      minutesText: `Reading time: ${reading.time} · ${lesson.readings.length > 1
        ? `Lessons ${numbers.join(' and ')} together: ${formatInstructionalMinutes(lesson.minutes)}`
        : formatInstructionalMinutes(lesson.minutes)}`,
      learn: reading.learn, blocks: reading.blocks, comingUp: reading.comingUp,
    };
  }));
}

/* ------------------------------------------------------------ Diagrams */

/* Each diagram is drawn as inline SVG from the data below: a wide layout and
 * a narrow (phone) one, switched by a container query in the stylesheet. The
 * look comes from the its01-dg-* classes and follows the page's theme
 * variables. */
const ITS08_DIAGRAMS = {
  session: {
    title: 'A remote session, start to finish',
    steps: [
      { title: 'Verify', text: 'callback, KB-0024' },
      { title: 'Ask', text: 'May I connect? You’ll see everything' },
      { title: 'Privacy', text: 'close anything personal' },
      { title: 'Narrate', text: 'say what you open and why' },
      { title: 'Check with them', text: 'does it work for you?' },
      { title: 'End and log', text: 'End session; start and end times in the note' },
    ],
    note: 'No Allow, no session.',
  },
  tool: {
    title: 'Which tool?',
    signedIn: 'Is the user signed in to Windows?',
    quick: { title: 'Quick Assist', text: '(their code, their Allow)' },
    agent: 'Is the PC’s Remote Support agent online?',
    remote: { title: 'Remote Support', text: 'request; they Allow at the sign-in screen' },
    none: { title: 'Remote won’t help', text: 'the PC is off or Windows isn’t starting. Phone questions, then desk-side.', gone: true },
    side: { text: 'RDP 3389 and SSH 22: admins and Network Operations, not user PCs.', grey: true },
  },
  loop: {
    title: 'One hypothesis at a time',
    steps: [
      { title: 'Gather', text: 'what, when, what changed, who else' },
      { title: 'Pick', text: 'the most likely theory' },
      { title: 'Test it', text: 'one change' },
      { title: 'Write the result in Tried' },
    ],
    fixed: { title: 'Fixed?', text: 'Verify, document', hl: true },
    out: { title: 'Out of road?', text: 'Stop and escalate (Table 3)', gone: true },
  },
  domain: {
    title: 'Something about the domain',
    root: { title: 'Can’t sign in', text: '“something about the domain”', hl: true },
    branches: [
      { title: 'Trust', text: 'Test-ComputerSecureChannel' },
      { title: 'Clock', text: 'w32tm /query /status' },
      { title: 'Account', text: 'Get-ADUser … -Properties' },
      { title: 'Network', text: 'ping and nslookup the DC' },
    ],
    caption: 'Read the exact words first. Then rule each one in or out.',
  },
  screen: {
    title: 'No picture on the big screen? Start at the screen',
    steps: [
      { title: 'Input / Source' },
      { title: 'Cable and port' },
      { title: 'Win + P' },
      { title: 'Resolution', text: 'the (Recommended) one' },
      { title: 'Sound output' },
    ],
    side: { text: 'Dim, flickering, shuts itself off, burned-out lamp: the AV team.', grey: true },
  },
};

// Every word a diagram shows, in reading order: the screen-reader description.
function its08DiagramWords(key) {
  const d = ITS08_DIAGRAMS[key];
  if (key === 'session') {
    const steps = d.steps.map((s) => `${s.title} (${s.text})`).join(', then an arrow to ');
    return `From left to right. Six boxes, each with an arrow to the next: ${steps}. Under the first box, a red note: ${d.note}`;
  }
  if (key === 'tool') {
    return `A small decision tree. It starts with a question: ${d.signedIn} Yes: ${d.quick.title} ${d.quick.text}. No: a second question, ${d.agent} Yes: ${d.remote.title}: ${d.remote.text}. No: ${d.none.title}: ${d.none.text} A grey box at the side: ${d.side.text}`;
  }
  if (key === 'loop') {
    const steps = d.steps.map((s) => (s.text ? `${s.title} (${s.text})` : s.title)).join(', then an arrow to ');
    return `A loop of four boxes: ${steps}. From the last box an arrow goes back to the second box, Pick. Two branches leave the loop: ${d.fixed.title} ${d.fixed.text}, and ${d.out.title} ${d.out.text}.`;
  }
  if (key === 'domain') {
    return `One box on the left: ${d.root.title}: ${d.root.text}. Four arrows lead from it to four boxes: ${d.branches.map((b) => `${b.title} → ${b.text}`).join('; ')}. ${d.caption}`;
  }
  const steps = d.steps.map((s) => (s.text ? `${s.title}: ${s.text}` : s.title)).join(', then an arrow to ');
  return `From left to right. Five boxes, each with an arrow to the next: ${steps}. A grey box at the side: ${d.side.text}`;
}

// Splits text into lines of at most max characters, at word breaks.
function its08Wrap(text, max) {
  const lines = [];
  let line = '';
  String(text).split(/\s+/).forEach((word) => {
    if (line && (line.length + 1 + word.length) > max) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  });
  if (line) lines.push(line);
  return lines;
}

const ITS08_DG = { pad: 12, title: 15, text: 13, lh: 18, charW: 0.56 };

// One box's wrapped lines: [{ text, cls, dx, dy }], laid out for width w.
function its08BoxLines(box, w) {
  const inner = w - ITS08_DG.pad * 2;
  const titleMax = Math.max(8, Math.floor(inner / (ITS08_DG.title * ITS08_DG.charW)));
  const textMax = Math.max(8, Math.floor(inner / (ITS08_DG.text * ITS08_DG.charW)));
  const out = [];
  let dy = 0;
  const push = (text, cls) => { out.push({ text, cls, dx: 0, dy }); dy += ITS08_DG.lh; };
  its08Wrap(box.title || '', titleMax).forEach((text) => { if (text) push(text, 'its01-dg-title'); });
  if (box.sub) its08Wrap(box.sub, textMax).forEach((text) => push(text, 'its01-dg-sub'));
  (box.lines || []).forEach((item) => its08Wrap(item, textMax).forEach((text) => push(text, 'its01-dg-text')));
  if (box.text) its08Wrap(box.text, textMax).forEach((text) => push(text, 'its01-dg-text'));
  return out;
}
function its08BoxHeight(box, w) {
  const lines = its08BoxLines(box, w);
  const used = lines.length ? lines[lines.length - 1].dy + ITS08_DG.lh : 0;
  return ITS08_DG.pad * 2 + used + 4;
}
function its08Box(box, x, y, w, h) {
  // gone = a red dashed outline (a stop branch); hl = the highlighted box;
  // grey = a side note.
  const cls = box.gone ? ' its08-dg-gone' : (box.hl ? ' its01-dg-hl' : (box.grey ? ' its08-dg-grey' : ''));
  const text = its08BoxLines(box, w).map((line) => `<text class="${line.cls}" x="${x + ITS08_DG.pad + line.dx}" y="${y + ITS08_DG.pad + 14 + line.dy}">${esc(line.text)}</text>`).join('');
  return `<rect class="its01-dg-box${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>${text}`;
}
function its08Arrow(x1, y1, x2, y2, id) {
  return `<line class="its01-dg-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${id})"/>`;
}
// A plain line, no arrow head: it only joins two boxes.
function its08Line(x1, y1, x2, y2) {
  return `<line class="its01-dg-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
}
function its08Markers(id) {
  return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="its01-dg-head" d="M0,0 L10,5 L0,10 z"/></marker></defs>`;
}
function its08Svg(key, layout, width, height, body) {
  const d = ITS08_DIAGRAMS[key];
  return `<svg class="its01-dg-${layout}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(d.title)}" aria-describedby="its08-dg-${key}-desc" focusable="false">${body}</svg>`;
}
// A small label: anchor 'middle' centres it on x.
function its08Label(text, x, y, anchor) {
  return `<text class="its08-dg-label" x="${x}" y="${y}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(text)}</text>`;
}
// Plain text lines, one per wrapped line, starting at y.
function its08TextLines(text, max, x, y, anchor, cls) {
  return its08Wrap(text, max).map((line, i) => `<text class="${cls || 'its01-dg-text'}" x="${x}" y="${y + i * ITS08_DG.lh}"${anchor ? ` text-anchor="${anchor}"` : ''}>${esc(line)}</text>`).join('');
}

/* Diagram 1: a remote session, start to finish. */
function its08SessionSvg(layout) {
  const d = ITS08_DIAGRAMS.session;
  const id = `its08-dg-session-${layout}-arrow`;
  let body = its08Markers(id);

  if (layout === 'wide') {
    const width = 768, top = 4, w = 112, step = 131;
    const h = Math.max(...d.steps.map((b) => its08BoxHeight(b, w)));
    const mid = top + h / 2;
    for (let i = 0; i < d.steps.length - 1; i += 1) body += its08Arrow(i * step + w + 2, mid, (i + 1) * step - 2, mid, id);
    d.steps.forEach((b, i) => { body += its08Box(b, i * step, top, w, h); });
    const noteY = top + h + 20;
    body += its08TextLines(d.note, 14, 2, noteY, null, 'its08-dg-redtext');
    return its08Svg('session', layout, width, noteY + its08Wrap(d.note, 14).length * ITS08_DG.lh, body);
  }

  const width = 320, x = 10, w = 300, cx = 160;
  let y = 4;
  d.steps.forEach((b, i) => {
    const h = its08BoxHeight(b, w);
    body += its08Box(b, x, y, w, h);
    y += h;
    if (i === 0) {
      body += its08TextLines(d.note, 40, x + 2, y + 18, null, 'its08-dg-redtext');
      y += its08Wrap(d.note, 40).length * ITS08_DG.lh + 6;
    }
    if (i < d.steps.length - 1) {
      body += its08Arrow(cx, y + 2, cx, y + 22, id);
      y += 24;
    }
  });
  return its08Svg('session', layout, width, y + 4, body);
}

/* Diagram 2: which tool? */
function its08ToolSvg(layout) {
  const d = ITS08_DIAGRAMS.tool;
  const id = `its08-dg-tool-${layout}-arrow`;
  let body = its08Markers(id);
  const q1 = { title: d.signedIn }, q2 = { title: d.agent };

  if (layout === 'wide') {
    const width = 768, qW = 230, rX = 300, rW = 230, sideX = 570, sideW = 198, fW = 300;
    const y1 = 4;
    const h1 = Math.max(its08BoxHeight(q1, qW), its08BoxHeight(d.quick, rW));
    const y2 = y1 + h1 + 44;
    const h2 = Math.max(its08BoxHeight(q2, qW), its08BoxHeight(d.remote, rW));
    const y3 = y2 + h2 + 44;
    const h3 = its08BoxHeight(d.none, fW);
    const hSide = its08BoxHeight(d.side, sideW);
    body += its08Box(q1, 0, y1, qW, h1) + its08Box(d.quick, rX, y1, rW, h1);
    body += its08Arrow(qW + 2, y1 + h1 / 2, rX - 2, y1 + h1 / 2, id) + its08Label('Yes', (qW + rX) / 2, y1 + h1 / 2 - 8, 'middle');
    body += its08Arrow(qW / 2, y1 + h1 + 2, qW / 2, y2 - 2, id) + its08Label('No', qW / 2 + 10, (y1 + h1 + y2) / 2 + 4);
    body += its08Box(q2, 0, y2, qW, h2) + its08Box(d.remote, rX, y2, rW, h2);
    body += its08Arrow(qW + 2, y2 + h2 / 2, rX - 2, y2 + h2 / 2, id) + its08Label('Yes', (qW + rX) / 2, y2 + h2 / 2 - 8, 'middle');
    body += its08Arrow(qW / 2, y2 + h2 + 2, qW / 2, y3 - 2, id) + its08Label('No', qW / 2 + 10, (y2 + h2 + y3) / 2 + 4);
    body += its08Box(d.none, 0, y3, fW, h3);
    body += its08Box(d.side, sideX, y1, sideW, hSide);
    return its08Svg('tool', layout, width, Math.max(y3 + h3, y1 + hSide) + 4, body);
  }

  const width = 320, x = 10;
  let y = 4;
  const hQ1 = its08BoxHeight(q1, 300);
  body += its08Box(q1, x, y, 300, hQ1);
  const q1Bottom = y + hQ1;
  y = q1Bottom + 24;
  // First level: a trunk at x 34 with a Yes branch and a No branch.
  const aX = 34, aBoxX = 64, aW = 246;
  const hQuick = its08BoxHeight(d.quick, aW);
  const quickMid = y + hQuick / 2;
  body += its08Box(d.quick, aBoxX, y, aW, hQuick);
  y += hQuick + 20;
  const hQ2 = its08BoxHeight(q2, aW);
  const q2Mid = y + hQ2 / 2;
  body += its08Box(q2, aBoxX, y, aW, hQ2);
  body += its08Line(aX, q1Bottom, aX, q2Mid);
  body += its08Arrow(aX, quickMid, aBoxX - 2, quickMid, id) + its08Label('Yes', aX + 2, quickMid - 6);
  body += its08Arrow(aX, q2Mid, aBoxX - 2, q2Mid, id) + its08Label('No', aX + 2, q2Mid - 6);
  const q2Bottom = y + hQ2;
  y = q2Bottom + 24;
  // Second level: a trunk at x 94 under the second question.
  const bX = 94, bBoxX = 124, bW = 186;
  const hRemote = its08BoxHeight(d.remote, bW);
  const remoteMid = y + hRemote / 2;
  body += its08Box(d.remote, bBoxX, y, bW, hRemote);
  y += hRemote + 20;
  const hNone = its08BoxHeight(d.none, bW);
  const noneMid = y + hNone / 2;
  body += its08Box(d.none, bBoxX, y, bW, hNone);
  body += its08Line(bX, q2Bottom, bX, noneMid);
  body += its08Arrow(bX, remoteMid, bBoxX - 2, remoteMid, id) + its08Label('Yes', bX + 2, remoteMid - 6);
  body += its08Arrow(bX, noneMid, bBoxX - 2, noneMid, id) + its08Label('No', bX + 2, noneMid - 6);
  y += hNone + 24;
  const hSide = its08BoxHeight(d.side, 300);
  body += its08Box(d.side, x, y, 300, hSide);
  return its08Svg('tool', layout, width, y + hSide + 4, body);
}

/* Diagram 3: one hypothesis at a time. */
function its08LoopSvg(layout) {
  const d = ITS08_DIAGRAMS.loop;
  const id = `its08-dg-loop-${layout}-arrow`;
  let body = its08Markers(id);

  if (layout === 'wide') {
    const width = 768, top = 4, w = 168, step = 200;
    const h = Math.max(...d.steps.map((b) => its08BoxHeight(b, w)));
    const mid = top + h / 2;
    for (let i = 0; i < 3; i += 1) body += its08Arrow(i * step + w + 2, mid, (i + 1) * step - 2, mid, id);
    d.steps.forEach((b, i) => { body += its08Box(b, i * step, top, w, h); });
    const pickX = step + w / 2, writeX = 3 * step + w / 2;
    const loopY = top + h + 28;
    // Back from the last box to Pick, with the two branches leaving the loop.
    body += `<path class="its01-dg-line" d="M${writeX} ${top + h} V${loopY} H${pickX} V${top + h + 2}" fill="none" marker-end="url(#${id})"/>`;
    const boxY = loopY + 34;
    const fW = 210, fX = 290, oW = 248, oX = 520;
    const bH = Math.max(its08BoxHeight(d.fixed, fW), its08BoxHeight(d.out, oW));
    body += its08Arrow(fX + fW / 2, loopY, fX + fW / 2, boxY - 2, id) + its08Arrow(oX + oW / 2, loopY, oX + oW / 2, boxY - 2, id);
    body += its08Box(d.fixed, fX, boxY, fW, bH) + its08Box(d.out, oX, boxY, oW, bH);
    return its08Svg('loop', layout, width, boxY + bH + 4, body);
  }

  const width = 320, x = 10, w = 270, cx = 145;
  let y = 4;
  const tops = [], bottoms = [];
  d.steps.forEach((b, i) => {
    const h = its08BoxHeight(b, w);
    body += its08Box(b, x, y, w, h);
    tops.push(y); bottoms.push(y + h);
    y += h;
    if (i < d.steps.length - 1) {
      body += its08Arrow(cx, y + 2, cx, y + 22, id);
      y += 24;
    }
  });
  // The loop back to Pick runs down the right edge.
  const pickMid = (tops[1] + bottoms[1]) / 2, writeMid = (tops[3] + bottoms[3]) / 2;
  body += `<path class="its01-dg-line" d="M${x + w} ${writeMid} H304 V${pickMid} H${x + w + 2}" fill="none" marker-end="url(#${id})"/>`;
  const lastBottom = y;
  const boxY = lastBottom + 40;
  const bW = 135;
  const bH = Math.max(its08BoxHeight(d.fixed, bW), its08BoxHeight(d.out, bW));
  body += its08Arrow(x + bW / 2, lastBottom + 2, x + bW / 2, boxY - 2, id) + its08Arrow(x + bW + 10 + bW / 2, lastBottom + 2, x + bW + 10 + bW / 2, boxY - 2, id);
  body += its08Box(d.fixed, x, boxY, bW, bH) + its08Box(d.out, x + bW + 10, boxY, bW, bH);
  return its08Svg('loop', layout, width, boxY + bH + 4, body);
}

/* Diagram 4: something about the domain. */
function its08DomainSvg(layout) {
  const d = ITS08_DIAGRAMS.domain;
  const id = `its08-dg-domain-${layout}-arrow`;
  let body = its08Markers(id);

  if (layout === 'wide') {
    const width = 768, rootW = 250, bX = 330, bW = 438, gap = 14, top = 4;
    const heights = d.branches.map((b) => its08BoxHeight(b, bW));
    const total = heights.reduce((a, b) => a + b, 0) + gap * (d.branches.length - 1);
    const rootH = its08BoxHeight(d.root, rootW);
    const rootY = top + (total - rootH) / 2;
    body += its08Box(d.root, 0, rootY, rootW, rootH);
    let y = top;
    d.branches.forEach((b, i) => {
      body += its08Arrow(rootW + 2, rootY + rootH / 2, bX - 2, y + heights[i] / 2, id);
      body += its08Box(b, bX, y, bW, heights[i]);
      y += heights[i] + gap;
    });
    return its08Svg('domain', layout, width, top + total + 4, body);
  }

  const width = 320, x = 10, w = 300, bx = 40, bw = 270, trunkX = 16;
  let y = 4;
  const rootH = its08BoxHeight(d.root, w);
  body += its08Box(d.root, x, y, w, rootH);
  const rootBottom = y + rootH;
  y = rootBottom + 20;
  let lastMid = y;
  d.branches.forEach((b) => {
    const h = its08BoxHeight(b, bw);
    const mid = y + h / 2;
    body += its08Arrow(trunkX, mid, bx - 2, mid, id) + its08Box(b, bx, y, bw, h);
    lastMid = mid;
    y += h + 12;
  });
  body += its08Line(trunkX, rootBottom, trunkX, lastMid);
  return its08Svg('domain', layout, width, y - 8 + 4, body);
}

/* Diagram 5: no picture on the big screen? */
function its08ScreenSvg(layout) {
  const d = ITS08_DIAGRAMS.screen;
  const id = `its08-dg-screen-${layout}-arrow`;
  let body = its08Markers(id);

  if (layout === 'wide') {
    const width = 768, top = 4, w = 136, step = 158;
    const h = Math.max(...d.steps.map((b) => its08BoxHeight(b, w)));
    const mid = top + h / 2;
    for (let i = 0; i < d.steps.length - 1; i += 1) body += its08Arrow(i * step + w + 2, mid, (i + 1) * step - 2, mid, id);
    d.steps.forEach((b, i) => { body += its08Box(b, i * step, top, w, h); });
    const sideY = top + h + 24;
    const sideH = its08BoxHeight(d.side, width);
    body += its08Box(d.side, 0, sideY, width, sideH);
    return its08Svg('screen', layout, width, sideY + sideH + 4, body);
  }

  const width = 320, x = 10, w = 300, cx = 160;
  let y = 4;
  d.steps.forEach((b, i) => {
    const h = its08BoxHeight(b, w);
    body += its08Box(b, x, y, w, h);
    y += h;
    if (i < d.steps.length - 1) {
      body += its08Arrow(cx, y + 2, cx, y + 22, id);
      y += 24;
    }
  });
  y += 24;
  const sideH = its08BoxHeight(d.side, w);
  body += its08Box(d.side, x, y, w, sideH);
  return its08Svg('screen', layout, width, y + sideH + 4, body);
}

const ITS08_DIAGRAM_DRAW = { session: its08SessionSvg, tool: its08ToolSvg, loop: its08LoopSvg, domain: its08DomainSvg, screen: its08ScreenSvg };

// The readings point at their diagrams by number ("diagram 3"), so each
// figure's visible heading carries its number.
const ITS08_DIAGRAM_NUMBER = { session: 1, tool: 2, loop: 3, domain: 4, screen: 5 };

function its08Diagram(key) {
  const d = ITS08_DIAGRAMS[key];
  const draw = ITS08_DIAGRAM_DRAW[key];
  if (!d || !draw) return '';
  return `<figure class="its01-dg" data-its08-diagram="${esc(key)}">
    <p class="its01-dg-heading">Diagram ${ITS08_DIAGRAM_NUMBER[key]} · ${esc(d.title)}</p>
    ${draw('wide')}
    ${draw('narrow')}
    <p class="its01-sr-only" id="its08-dg-${esc(key)}-desc">${esc(its08DiagramWords(key))}</p>
    ${d.caption ? `<figcaption>${esc(d.caption)}</figcaption>` : ''}
  </figure>`;
}

/* ------------------------------------------------------------- Lessons */

// Escaped text; **...** becomes emphasized text and `...` inline code. Both
// run on the escaped text, so no markup gets in.
function its08Text(text) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code class="its08-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// An empty header cell (the row-label column) gets a hidden label, so a
// screen reader doesn't meet an empty header.
function its08Table(table) {
  const caption = esc(table.caption);
  const head = table.head.map((cell) => `<th scope="col">${cell ? esc(cell) : '<span class="its01-sr-only">Item</span>'}</th>`).join('');
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => `<td>${its08Text(cell)}</td>`).join('')}</tr>`).join('');
  return `<div class="its10-table-wrap" tabindex="0" role="region" aria-label="${caption}"><table class="its10-table"><caption>${caption}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function its08Blocks(blocks) {
  return blocks.map((block) => {
    if (block.h) return `<h4>${esc(block.h)}</h4>`;
    if (block.h5) return `<h5>${esc(block.h5)}</h5>`;
    if (block.p) return `<p>${its08Text(block.p)}</p>`;
    if (block.ul) return `<ul>${block.ul.map((item) => `<li>${its08Text(item)}</li>`).join('')}</ul>`;
    if (block.ol) return `<ol>${block.ol.map((item) => `<li>${its08Text(item)}</li>`).join('')}</ol>`;
    if (block.table) return its08Table(block.table);
    if (block.diagram) return its08Diagram(block.diagram);
    if (block.note) return `<div class="its01-note"><strong>${esc(block.note.title)}</strong><p>${its08Text(block.note.text)}</p></div>`;
    return '';
  }).join('');
}

function its08LessonCard(card) {
  return `<details class="its01-lesson" data-its08-lesson="${esc(card.id)}" data-its08-reading="${esc(String(card.reading))}">
    <summary><span class="its01-lesson-icon"><i class="${esc(card.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(card.number)} · Reading ${esc(String(card.reading))} · ${esc(card.heading)}</strong><small>${esc(card.minutesText)}</small></span><i class="ri-arrow-down-s-line its01-chevron" aria-hidden="true"></i></summary>
    <div class="its01-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${card.learn.map((item) => `<li>${its08Text(item)}</li>`).join('')}</ul>
      ${its08Blocks(card.blocks)}
      ${card.comingUp ? `<div class="its01-preview"><i class="ri-arrow-right-circle-line" aria-hidden="true"></i><span><strong>Coming up in your lab:</strong> ${esc(card.comingUp)}</span></div>` : ''}
    </div>
  </details>`;
}

/* ------------------------------------------------------- Knowledge checks */

/* Two checks, each answered one question at a time. A right pick shows its why
 * line, a wrong pick shows its ifWrong line (never the right answer). ifWrong
 * is keyed by the choice's place in the data and has null on the right answer.
 * The choices are shuffled per student, per question and per attempt
 * (its08ChoiceOrder), so no line refers to a choice by its letter.
 *   - learn: six program questions, after Reading 2. Complete at 5 of 6.
 *   - aplus: eight questions on A+ Core 1 objectives 2.1 (two), 4.1 (one),
 *     5.3 (two) and 5.1 (three), after Reading 3. Complete at 6 of 8. */
const ITS08_CHECKS = {
  learn: {
    title: 'Learn It knowledge check',
    intro: 'Six questions on this module’s first two readings: the habits of a remote session, the method on a problem you’ve never seen, and when to stop and escalate. They are program checks, not A+ questions. It’s complete when 5 of your first answers are right. Retake it as often as you like.',
    questions: [
      { q: 'A ticket says, “Please remote in and fix my Outlook.” What do you do before connecting?',
        choices: ['Connect: the ticket is permission', 'Verify the caller, then ask them now whether you may connect, and wait for them to allow it', 'Connect without asking, to save them time', 'Email them a link and connect when they’re away'], answer: 1,
        why: 'A ticket is a request for help, not consent to see their screen. You verify who you’re talking to, ask, and connect only when they choose Allow (Reading 1, Table 2).',
        ifWrong: ['This starts a session nobody agreed to, which is a security incident.', null, 'This starts a session nobody agreed to, which is a security incident.', 'A session while they’re away is unattended access, which is never used on a person’s PC.'] },
      { q: 'You’re connected to a user’s laptop to fix their sound. Their personal email is open in a browser tab. What do you do?',
        choices: ['Read it quickly; it might be a clue', 'Ask them to close anything personal before you look around, and open only what the problem needs', 'Close it yourself without saying anything', 'Ignore it and carry on'], answer: 1,
        why: 'You’re a guest on someone’s screen. Asking them to close personal things protects them and you (Table 2, habit 2).',
        ifWrong: ['This is a privacy breach.', null, 'This touches their things without asking.', 'This leaves their private information in front of you for the whole session.'] },
      { q: 'A user reads you an error you’ve never seen. What do you do first?',
        choices: ['Search the web for a registry fix', 'Write down the exact words, ask when it started, what changed and whether anyone else has it, then search the KB with the exact text', 'Restart the PC twice', 'Escalate straight away because it’s new to you'], answer: 1,
        why: 'Evidence before action. The exact words, the timing, what changed and the scope point you at the right theory (Reading 2).',
        ifWrong: ['Fixes from the web aren’t approved and can make it worse.', null, 'A restart is a change, made before you know anything.', 'New to you isn’t a reason to escalate; the method works on anything.'] },
      { q: 'Why change only one thing at a time?',
        choices: ['It’s faster', 'So you know which change fixed it, and can undo the ones that didn’t', 'Because Tier 1 may only make one change per ticket', 'It doesn’t matter'], answer: 1,
        why: 'If you change three things and it works, nobody knows which one mattered, and the other two may cause the next problem (Reading 2, diagram 3).',
        ifWrong: ['Several changes at once often take longer to untangle.', null, 'There’s no such limit.', 'It matters to the next technician who reads your note.'] },
      { q: 'A KB article for your problem says **Audience: Desktop Support** and the repair needs an account you don’t have. What do you do?',
        choices: ['Ask the user for an admin password', 'Gather the evidence the article asks for, hand off to Desktop Support and tell the user what happens next', 'Try the repair anyway', 'Close the ticket'], answer: 1,
        why: '“The fix needs rights you don’t have” is a stop point. A good handoff with evidence is the right finish (Table 3).',
        ifWrong: ['Never ask anyone for a password.', null, 'A repair outside your role can make it worse and isn’t allowed.', 'The user still can’t work.'] },
      { q: 'A user can’t sign in to Windows at all, so nobody is signed in on their PC. Which tool reaches their screen?',
        choices: ['Quick Assist', 'Remote Support, with a request they allow on the sign-in screen', 'Remote Desktop (RDP) to their laptop', 'Teams screen sharing'], answer: 1,
        why: 'Quick Assist and Teams need a signed-in user. Northstar’s Remote Support agent runs before anyone signs in, and the person still chooses Allow (Table 1, diagram 2).',
        ifWrong: ['This needs the user’s desktop.', null, 'RDP is for admins on servers, and it would sign you in as a session of your own, not show you their screen.', 'This needs the user’s desktop.'] },
    ],
  },
  aplus: {
    title: 'A+ check (Core 1: 2.1, 4.1, 5.1, 5.3)',
    intro: 'Eight questions in the style of the A+ Core 1 exam: ports and protocols (2.1, two questions), remote and virtual desktops (4.1), display and projector symptoms (5.3, two questions) and power, heat and board symptoms (5.1, three questions). It’s complete when 6 of your first answers are right. Retake it as often as you like.',
    questions: [
      { q: 'A technician must connect to a Windows server’s desktop remotely. Which port must be allowed?',
        choices: ['22', '23', '3389', '445'], answer: 2,
        why: 'Remote Desktop (RDP) uses TCP 3389 (Table 1).',
        ifWrong: ['22 is SSH.', '23 is Telnet.', null, '445 is file sharing (SMB, Module 09).'] },
      { q: 'Which protocol should replace Telnet for managing a switch from the command line?',
        choices: ['HTTP', 'SSH', 'SNMP', 'FTP'], answer: 1,
        why: 'SSH (TCP 22) is the encrypted replacement for Telnet, which sends passwords in plain text (Table 1).',
        ifWrong: ['HTTP is for web pages.', null, 'SNMP monitors devices; it isn’t a console.', 'FTP moves files and isn’t encrypted either.'] },
      { q: 'A company gives contractors a full Windows desktop that runs in the data center. They open it from any device, and nothing is stored on their own laptop. What is this?',
        choices: ['Quick Assist', 'A virtual desktop (VDI)', 'SSH', 'Remote assistance'], answer: 1,
        why: 'A virtual desktop runs on servers in the data center and is shown on whatever device the user has (Table 1; Module 4).',
        ifWrong: ['This lets a technician see a user’s own PC.', null, 'SSH is a text console for network devices.', 'This lets a technician see a user’s own PC.'] },
      { q: 'A projector shows the laptop’s slides, but the picture is fuzzy and the edges are cut off. The laptop is set to Duplicate. What should be checked first?',
        choices: ['The projector lamp', 'The display resolution: set the projector’s recommended one', 'Replace the HDMI cable', 'Update the BIOS'], answer: 1,
        why: 'A picture that’s there but fuzzy and cropped means the projector is resizing a resolution it doesn’t use natively (Table 6).',
        ifWrong: ['A failing lamp makes the picture dim, not cut off.', null, 'A bad cable gives no picture, flicker or wrong colours.', 'The BIOS has nothing to do with it.'] },
      { q: 'A projector turns itself off about 20 minutes into every meeting, and a filter warning light is on. What is the most likely cause?',
        choices: ['A burned-out lamp', 'It is overheating because the filter or vents are blocked', 'The laptop’s resolution', 'The wrong input'], answer: 1,
        why: 'Intermittent projector shutdown with a filter warning is overheating; the AV team cleans the filter (Table 6).',
        ifWrong: ['A burned-out lamp gives no picture at all.', null, 'This would affect the picture, not switch the projector off.', 'This would affect the picture, not switch the projector off.'] },
      { q: 'A desktop’s fans spin when it’s switched on, it beeps one long and two short, and the screen stays black. What does this mean?',
        choices: ['Windows is updating', 'The PC’s power-on self-test found a hardware fault; record the pattern and escalate', 'The user’s password has expired', 'The network cable is unplugged'], answer: 1,
        why: 'Beeps before Windows starts come from the PC’s own hardware check (POST). The pattern points at a part; Tier 1 records it and Desktop Support opens the case (Table 5).',
        ifWrong: ['An update shows a screen with progress.', null, 'This can’t stop a PC from starting.', 'This can’t stop a PC from starting.'] },
      { q: 'A user says their computer smells like it’s burning. What should they do first?',
        choices: ['Keep working and log a ticket', 'Switch it off, unplug it and keep people away, then you escalate', 'Open the case to look', 'Restart it'], answer: 1,
        why: 'A burning smell is a safety issue first: power off and unplug (Table 5).',
        ifWrong: ['This keeps power on a failing part.', null, 'Tier 1 and users never open a case.', 'This keeps power on a failing part.'] },
      { q: 'A desktop makes a grinding noise, and the user notices the case fan isn’t spinning. What is the most likely cause?',
        choices: ['A failing fan', 'A DNS failure', 'A full disk', 'A bad print driver'], answer: 0,
        why: 'Grinding with a stopped fan is the fan failing; without it the PC will overheat. Desktop Support replaces it (Table 5).',
        ifWrong: [null, 'This is a software problem and makes no noise.', 'This is a software problem and makes no noise.', 'This is a software problem and makes no noise.'] },
    ],
  },
};

/* ------------------------------------------------------- Objective, sources */

// The page objective, shown in the hero.
const ITS08_OBJECTIVE = 'By the end of this module you can run a remote session that is safe, consented and narrated, and close it cleanly, with the right tool for the situation. You can use the troubleshooting method on a problem you’ve never seen, one hypothesis at a time, and recognise the moment to stop and escalate. You can work power, heat, display and projector tickets at Tier 1. A+ Core 1: 2.1 (RDP 3389, SSH 22) · 4.1 (remote and virtual desktops) · 5.1 (motherboard, power and heat symptoms) · 5.3 (display and projector symptoms). Competencies: 5 Remote support · 3 Ticketing · 7 Communication · 9 Triage and escalation.';

const ITS08_SOURCES = [
  { title: 'Use Quick Assist to help users', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows/client-management/client-tools/quick-assist', note: 'How Quick Assist works from both sides: the helper’s code, the user’s Allow, and what each person can see.' },
  { title: 'Windows Time service tools and settings', org: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows-server/networking/windows-time-service/windows-time-service-tools-and-settings', note: 'How Windows keeps a PC’s clock in step with its time source, and what the w32tm tool shows.' },
  { title: 'CompTIA A+ certification', org: 'CompTIA', url: 'https://www.comptia.org/certifications/a', note: 'The exam’s own page, with the list of objectives that the A+ check’s questions are written in the style of.' },
];

/* ----------------------------------------------------------- Page state */

// Saved to the student's account (module_progress.case_state): each check's
// "complete" and its time, and whether the walkthrough was started. Never
// answers or a score.
const ITS08_STATE_ID = 'its08-page-v1';
// Lab 10.1 is Practice It and keeps its course_module_labs row, so its
// walkthrough record saves. The practice tickets lab has its own lab key, and
// so has the Prove It.
const ITS08_LAB1_KEY = 'lab-its-08-unfamiliar-problems';
const ITS08_PRACTICE_KEY = 'lab-its-08-practice-tickets';
const ITS08_PROVE_KEY = 'lab-its-08-prove-it';
const ITS08_LAB_KEYS = [ITS08_LAB1_KEY, ITS08_PRACTICE_KEY, ITS08_PROVE_KEY];
const ITS08_COACH_ID = 'hd-m08';
const ITS08_LAB1_START = 'Start Lab 10.1 walkthrough';
// The Prove It part is built later. Until it is, its card says it opens soon
// and has no launch button; the message wiring below is already in place.
const ITS08_PROVE_OPEN = false;

const ITS08_DEFAULT_STATE = {
  consoleStarted: false, consoleCompleted: false,
  learnCheckCompleted: false, learnCheckCompletedAt: null,
  aplusCheckCompleted: false, aplusCheckCompletedAt: null,
};

let its08State = null;
let its08User = null;

function its08Load(user) {
  // Check answers live in page memory: a different student signing in
  // without a reload starts every check fresh.
  const userId = user && user.userId;
  if (userId !== its08CheckAnswersUser) {
    its08CheckAnswersUser = userId;
    Object.keys(its08CheckAnswers).forEach((key) => {
      its08CheckAnswers[key] = {};
      its08CheckPicks[key] = {};
      its08CheckAttempt[key] = 0;
    });
    Object.keys(its08CheckSaveFailed).forEach((key) => { its08CheckSaveFailed[key] = false; });
  }
  its08User = user;
  its08State = LabRuntime.loadCaseState(ITS08_STATE_ID, 'its-08', user, ITS08_DEFAULT_STATE);
  // The simulator's popup message is the only way a walkthrough is recorded;
  // a return by link only shows that it wasn't (see itsNoteCoachReturn).
  itsNoteCoachReturn(user, ITS08_COACH_ID, [ITS08_LAB1_KEY]);
  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'it-support', 'its-08');
  return its08State;
}

function its08Save(onResult) {
  if (its08User && its08State) LabRuntime.saveCaseState(ITS08_STATE_ID, 'its-08', its08User, its08State, onResult ? { onResult } : {});
}

function its08Day(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

// A lab's minutes, from the course data (LABS in portal/data.js).
function its08LabMinutes(labKey) {
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
const ITS08_LETTERS = ['A', 'B', 'C', 'D'];
const ITS08_CHECK_PASS_TENTHS = 7;
// The saved completion fields for each check.
const ITS08_CHECK_SAVED = {
  learn: ['learnCheckCompleted', 'learnCheckCompletedAt'],
  aplus: ['aplusCheckCompleted', 'aplusCheckCompletedAt'],
};

// This page's picks, by check, kept in page memory only (a reload starts
// every check again), by the choice's place in the data (not the place shown):
//   its08CheckAnswers: { questionIndex: the first pick }, the one that counts.
//   its08CheckPicks: { questionIndex: [every pick, in order] }.
//   its08CheckAttempt: how many times the check was started again; it is part
//   of the shuffle, so a retake shows the choices in a new order.
const its08CheckAnswers = { learn: {}, aplus: {} };
const its08CheckPicks = { learn: {}, aplus: {} };
// Checks whose completion the account reported it didn't save (page memory).
const its08CheckSaveFailed = { learn: false, aplus: false };
const its08CheckAttempt = { learn: 0, aplus: 0 };
let its08CheckAnswersUser = null;

// The order a student sees a question's choices in: shuffled from their
// anonymous id, the check, the question and the attempt, so it differs between
// students and between retakes, and stays the same for one student on every
// redraw and reload of the same attempt.
function its08ChoiceOrder(checkId, index) {
  const question = ITS08_CHECKS[checkId].questions[index];
  const seed = `${its08User ? LabRuntime.anonymousStudentId(its08User) : ''}|its-08|${checkId}|${index}|${its08CheckAttempt[checkId]}`;
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
function its08CheckDone(checkId) {
  return ITS08_CHECKS[checkId].questions.every((_, i) => Object.prototype.hasOwnProperty.call(its08CheckAnswers[checkId], i));
}
function its08CheckRightCount(checkId) {
  return ITS08_CHECKS[checkId].questions.filter((question, i) => its08CheckAnswers[checkId][i] === question.answer).length;
}
// Whole numbers only, so 5 of 8 (62.5%) or 4 of 6 (66.7%) can never round
// up to a pass.
function its08CheckPassed(checkId) {
  const total = ITS08_CHECKS[checkId].questions.length;
  return its08CheckRightCount(checkId) * 10 >= total * ITS08_CHECK_PASS_TENTHS;
}
// How many first picks a full pass needs.
function its08CheckNeeded(checkId) {
  return Math.ceil((ITS08_CHECKS[checkId].questions.length * ITS08_CHECK_PASS_TENTHS) / 10);
}
// A check is saved as complete.
function its08CheckCompleted(checkId) {
  return Boolean(its08State && its08State[ITS08_CHECK_SAVED[checkId][0]] === true);
}
// A check ready to save: a full passing pass.
function its08Ready(checkId) {
  return its08CheckDone(checkId) && its08CheckPassed(checkId);
}

function its08CheckQuestion(checkId, question, index) {
  const picks = its08CheckPicks[checkId][index] || [];
  const last = picks.length ? picks[picks.length - 1] : undefined;
  const settled = picks.includes(question.answer);
  // Only the student's own picks are marked: a wrong pick never marks or
  // names the right answer. data-choice stays the data index; the letter
  // comes from the place the choice is shown in.
  const choices = its08ChoiceOrder(checkId, index).map((c, place) => {
    const picked = picks.includes(c);
    const cls = picked ? (c === question.answer ? ' is-answer' : ' is-wrong') : '';
    return `<button type="button" class="its01-choice${cls}" data-its08-answer data-check="${checkId}" data-q="${index}" data-choice="${c}" aria-pressed="${picked}" ${settled || picked ? 'disabled' : ''}><span>${ITS08_LETTERS[place]}</span> ${its08Text(question.choices[c])}</button>`;
  }).join('');
  const why = settled && question.why ? `<p class="its01-check-why">${its08Text(question.why)}</p>` : '';
  const wrongLine = !settled && last !== undefined && question.ifWrong && question.ifWrong[last] ? `<p class="its01-check-why">${its08Text(question.ifWrong[last])}</p>` : '';
  const feedback = last === undefined ? ''
    : settled
      ? `<p class="its01-check-result is-right"><i class="ri-check-line" aria-hidden="true"></i> <strong>Correct.</strong></p>${why}`
      : `<p class="its01-check-result is-wrong"><i class="ri-close-line" aria-hidden="true"></i> <strong>Not quite.</strong> Try another answer.</p>${wrongLine}`;
  return `<li class="its01-check-q">
    <p class="its01-check-prompt" id="its08-${checkId}-q${index}">${its08Text(question.q)}</p>
    <div class="its01-choices" role="group" aria-labelledby="its08-${checkId}-q${index}">${choices}</div>
    <div class="its01-check-feedback" id="its08-${checkId}-q${index}-feedback" tabindex="-1" aria-live="polite">${feedback}</div>
  </li>`;
}

// The status line: a completion the account didn't save asks to try the save
// again; a failed full pass asks for a retake (no score shown); otherwise a
// saved completion shows with its date.
function its08CheckFooter(checkId) {
  const anyAnswered = Object.keys(its08CheckAnswers[checkId]).length > 0;
  const reset = anyAnswered ? `<button type="button" class="its01-check-reset" data-its08-check-reset="${checkId}"><i class="ri-restart-line" aria-hidden="true"></i> Start again</button>` : '';
  const saveFailed = its08CheckSaveFailed[checkId] && its08CheckDone(checkId) && its08CheckPassed(checkId);
  const retry = saveFailed ? `<button type="button" class="its01-check-reset" data-its08-check-retry="${checkId}"><i class="ri-refresh-line" aria-hidden="true"></i> Try again</button>` : '';
  let status = '';
  if (saveFailed) {
    status = '<i class="ri-error-warning-line" aria-hidden="true"></i> Your result didn’t save. Try again.';
  } else if (its08CheckDone(checkId) && !its08CheckPassed(checkId)) {
    status = `Retake: you need ${its08CheckNeeded(checkId)} of ${ITS08_CHECKS[checkId].questions.length}. Press Start again to retake the check.`;
  } else if (its08CheckCompleted(checkId)) {
    const day = its08Day(its08State[ITS08_CHECK_SAVED[checkId][1]]);
    status = `<i class="ri-check-line" aria-hidden="true"></i> ${esc(ITS08_CHECKS[checkId].title)} complete${day ? ` (${esc(day)})` : ''}. You can retake it any time.`;
  }
  return `<div class="its01-check-footer" data-its08-check-footer="${checkId}"><p class="its01-check-status" role="status" tabindex="-1">${status}</p><span class="its01-check-actions">${retry}${reset}</span></div>`;
}

function its08Check(checkId) {
  const check = ITS08_CHECKS[checkId];
  return `<div class="its01-check" data-its08-check="${checkId}" id="its08-check-${checkId}">
    <h3>${esc(check.title)}</h3>
    <p class="its01-instruction">${esc(check.intro)}</p>
    <p class="its01-instruction">Choose an answer. A wrong answer tells you why it’s wrong, and you try again; a right one tells you why it’s right. Your first answer to each question is the one that counts. Not graded: your answers aren’t sent to your instructor, and only that you completed the check is saved to your account.</p>
    <ol class="its01-check-list">${check.questions.map((question, i) => its08CheckQuestion(checkId, question, i)).join('')}</ol>
    ${its08CheckFooter(checkId)}
  </div>`;
}

/* ------------------------------------------------------------- Sections */

// Each check sits right after the reading card it follows (as on Module 1's
// page), outside the card, so a rail link to it never lands inside a closed
// card. The Learn It check comes after Reading 2 and the A+ check after
// Reading 3.
const ITS08_CHECK_AFTER_READING = { 2: ['learn'], 3: ['aplus'] };

function its08Learn() {
  return `<section class="its01-section" id="its08-lessons" aria-labelledby="its08-lessons-title">
    <div class="its01-section-heading"><span>L</span><div><p class="its01-kicker">Learn It</p><h2 id="its08-lessons-title">Lessons 10.1 to 10.3</h2></div></div>
    <p class="its01-instruction">Three lessons, one reading each. Lessons 10.2 and 10.3 share one filed lesson’s time. Open each reading for its text, tables and diagrams. The Learn It check comes after Reading 2, and the A+ check after Reading 3.</p>
    ${its08Cards().map((card) => `<div class="its01-lesson-grid">${its08LessonCard(card)}</div>${(ITS08_CHECK_AFTER_READING[card.reading] || []).map(its08Check).join('')}`).join('')}
  </section>`;
}

// Lab 10.1: the hd-m08 coach on two tickets (HD-2255 and HD-2110) in the IT
// Service Desk simulator (ui/helpdesk-coaches.js). Feedback only: no score.
function its08Lab1() {
  const button = itsWalkthroughButton(its08User, [ITS08_LAB1_KEY]);
  return `<section class="its01-section its01-lab-section" id="its08-lab-10-1" aria-labelledby="its08-lab-10-1-title">
    <div class="its01-section-heading"><span>1</span><div><p class="its01-kicker">Practice It · coached</p><h2 id="its08-lab-10-1-title">${esc(itsLabTitle(ITS08_LAB1_KEY))}</h2></div></div>
    <p class="its01-instruction">${its08Text('In the IT Service Desk simulator you run two remote sessions. Part A is HD-2255: a user’s headset plays nothing since she docked this morning. You run the whole session with Quick Assist: verify her, ask, take her consent, protect her privacy, narrate, fix where Windows sends the sound, test it with her, then end the session and log it. Part B is HD-2110: a laptop is stuck at the sign-in screen after Desktop Support restored it from an older image. You reach it with Remote Support, rule out the network, the clock and the account one at a time, read what is left, and escalate to Desktop Support with a handoff. The last step checks which remote ports a server allows. A coach guides you through each step.')}</p>
    <p class="its01-instruction">The coach names the goal of each typed step; open Show me the command if you need it. Practice: not graded. Feedback only, no score.</p>
    <p class="its01-instruction" data-its08-lab-minutes>Time: ${formatInstructionalMinutes(its08LabMinutes(ITS08_LAB1_KEY))}</p>
    <a class="itsw-evidence-button" data-its08-console-launch href="${esc(itsCoachLaunchHref(ITS08_COACH_ID, its08User))}" target="_blank" rel="opener">
      <i class="${button.icon}" aria-hidden="true"></i> ${{ redo: 'Redo the walkthrough', review: 'Review the walkthrough', start: ITS08_LAB1_START }[button.mode]}
    </a>
    ${itsWalkthroughNoticeHtml(its08User, ITS08_COACH_ID, [ITS08_LAB1_KEY], ITS08_LAB1_START)}
    ${itsLabStatusHtml(its08User, ITS08_LAB1_KEY, { label: 'Lab 10.1', prefix: 'its01', pendingText: 'Complete the guided walkthrough in the simulator to finish this lab.' })}
    ${itsRedoNoticeHtml(its08User, [{ key: ITS08_LAB1_KEY, action: 'Run the walkthrough again to resubmit this lab.' }])}
  </section>`;
}

// Lab 10.2, the module's three unguided tickets, not graded: the simulator
// opens just these tickets in their own saved shift (?practice=its-08,
// ui/helpdesk.js), with feedback but no score. Opened with an opener, so once
// all three are done the simulator can report it (its08ReceivePracticeCompletion).
function its08PracticeTicketsHref(user) {
  const student = typeof LabRuntime !== 'undefined' ? LabRuntime.anonymousStudentId(user) : '';
  return `${SIM_ORIGIN}?practice=its-08&student=${encodeURIComponent(student)}#/helpdesk/tickets`;
}
function its08PracticeTickets() {
  return `<section class="its01-section its01-lab-section" id="its08-lab-10-2" aria-labelledby="its08-lab-10-2-title">
    <div class="its01-section-heading"><span>2</span><div><p class="its01-kicker">Practice It · on your own</p><h2 id="its08-lab-10-2-title">${esc(itsLabTitle(ITS08_PRACTICE_KEY))}</h2></div></div>
    <p class="its01-instruction">Three tickets on your own in the IT Service Desk simulator, in the same queue: 10-A, Outlook search finds nothing for a VIP before a meeting; 10-B, a fuzzy, cropped projector picture in a meeting room; 10-C, a PC that beeps and stays black. Work each to Resolved (or handed to the right team), with “Check my work” feedback and no score.</p>
    <p class="its01-instruction">Practice: not graded. Your answers aren’t sent. Finish all three tickets: work each one to Resolved, or hand it to the right team, and give it your work note. Check my work shows what is still missing. The simulator then tells this page, and your account records that you completed Lab 10.2.</p>
    <p class="its01-instruction" data-its08-lab-minutes>Time: ${formatInstructionalMinutes(its08LabMinutes(ITS08_PRACTICE_KEY))}</p>
    <a class="itsw-evidence-button" data-its08-practice-launch href="${esc(its08PracticeTicketsHref(its08User))}" target="_blank" rel="opener">
      <i class="ri-play-list-line" aria-hidden="true"></i> Open the practice tickets
    </a>
    ${itsLabStatusHtml(its08User, ITS08_PRACTICE_KEY, { label: 'Lab 10.2', prefix: 'its01', pendingText: 'Finish all three tickets: work each to Resolved, or hand it to the right team, and give it your work note.' })}
  </section>`;
}

// Module 10's Prove It, on Module 9's pattern: a new ticket in the simulator
// (the its-08 Prove shift, itsProveLaunchHref), reviewed by the instructor.
// Practice It is recommended first, never required. A submitted attempt has
// nothing left to open. What it shows comes from the server's attempt
// (itsLabStatus); the simulator reports back by message (itsProveReceiveMessage).
// While ITS08_PROVE_OPEN is false the card has no launch button.
function its08Prove() {
  const user = its08User;
  const returned = itsLabReturned(user, ITS08_PROVE_KEY);
  const launch = !ITS08_PROVE_OPEN
    ? '<p class="its01-instruction">The Prove It opens soon.</p>'
    : (itsLabSubmitted(user, ITS08_PROVE_KEY) ? '' : `<a class="itsw-evidence-button" data-its08-prove-launch href="${esc(itsProveLaunchHref('its-08', user))}" target="_blank" rel="opener">
      <i class="${returned ? 'ri-restart-line' : 'ri-terminal-box-line'}" aria-hidden="true"></i> ${returned ? 'Reopen the Prove It' : 'Start the Prove It'}
    </a>`);
  return `<section class="its01-section its01-lab-section" id="its08-prove-it" aria-labelledby="its08-prove-it-title">
    <div class="its01-section-heading"><span>3</span><div><p class="its01-kicker">Prove It · Assessment Lab · instructor reviewed</p><h2 id="its08-prove-it-title">${esc(itsLabTitle(ITS08_PROVE_KEY))}</h2></div></div>
    <p class="its01-instruction">Work one new ticket on your own in the IT Service Desk simulator: no coach, no hints and no feedback before you submit. Set the ticket fields, talk to the user, reach the PC with the right remote tool, rule causes in or out one at a time, fix what is yours to fix, and write a key finding, a work note and a reply. Type your checks in PowerShell: the commands you type are part of your evidence. Plan on about 25 minutes. Your instructor reviews your work.</p>
    <p class="its01-instruction" data-its08-lab-minutes>Time: ${formatInstructionalMinutes(its08LabMinutes(ITS08_PROVE_KEY))}</p>
    ${itsLabRail(user, [ITS08_LAB1_KEY]).isComplete ? '' : '<p class="its01-instruction">Work Lab 10.1, the guided lab, first: it prepares you for this.</p>'}
    ${launch}
    ${itsLabStatusHtml(user, ITS08_PROVE_KEY, { label: 'Prove It', prefix: 'its01', pendingText: 'Press Submit in the simulator when you finish the ticket.' })}
    ${itsLabStatus(user, ITS08_PROVE_KEY) === 'passed' && typeof markedLabLinkHtml === 'function' ? `<p>${markedLabLinkHtml(ITS08_PROVE_KEY, 'See your score and feedback')}</p>` : ''}
    ${itsRedoNoticeHtml(user, [{ key: ITS08_PROVE_KEY, action: 'Reopen the Prove It, make your changes, then press Resubmit in the simulator. You can resubmit once for each return.' }])}
  </section>`;
}
// A Prove It message changed the attempt: show it if this page is open.
function its08ProveChanged() {
  if (document.querySelector('.its08-shell')) render();
}

function its08Sources() {
  return `<div class="msources-block">
    <h3 class="msources-title">Further Reading</h3>
    <ul class="msources-list">
      ${ITS08_SOURCES.map((source) => `<li class="msources-item">
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
 * Lab 10.1 isn't done. */
function its08NavSections(user) {
  return [
    { id: 'lessons', title: 'Readings', type: 'lecture', phase: 'learn', isComplete: true, scrollId: 'its08-lessons' },
    { id: 'guided-lab', title: 'Guided remote support walkthrough', navTitle: 'Lab 10.1 · Guided Lab', type: 'lab', ...itsLabRail(user, [ITS08_LAB1_KEY]), scrollId: 'its08-lab-10-1' },
    // Counts toward the percent, but never locked: the practice tickets can
    // be opened at any time.
    { id: 'unguided', title: 'Lab 10.2 · Practice tickets', navTitle: 'Lab 10.2 · Practice tickets', type: 'lab', phase: 'practice', neverLocked: true, ...itsLabRail(user, [ITS08_PRACTICE_KEY]), scrollId: 'its08-lab-10-2' },
    // Named so the platform's generic Assessment Lab box isn't added
    // (normalizeModuleStages).
    { id: 'assessment', title: 'Assessment Lab', type: 'review', neverLocked: true, ...itsLabRail(user, [ITS08_PROVE_KEY]), scrollId: 'its08-prove-it' },
    { id: 'learn-check', title: ITS08_CHECKS.learn.title, type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its08CheckCompleted('learn'), doneLabel: 'Complete', scrollId: 'its08-check-learn' },
    { id: 'aplus-check', title: ITS08_CHECKS.aplus.title, type: 'quiz', phase: 'learn', neverLocked: true, isComplete: its08CheckCompleted('aplus'), doneLabel: 'Complete', scrollId: 'its08-check-aplus' },
    { id: 'sources', title: 'Sources & Further Reading', type: 'read', isComplete: null, scrollId: 'its08-sources', gated: false, supplemental: true },
  ];
}
function its08Rail(user) {
  return moduleProgressShell(its08NavSections(user), { moduleKey: 'its08', stageKey: 'its-08' });
}

function viewItsModuleTenPage(user, program) {
  its08Load(user);
  const module = program.modules['its-08'];
  return `<div class="its08-shell">
    ${moduleTopbar(user, program)}
    ${its08Rail(user)}
    <main class="its01-main">
      <section class="its01-hero" aria-labelledby="its08-title"><div><p class="its01-kicker">Module ${String(module.number).padStart(2, '0')} · ${formatInstructionalMinutes(module.durationMinutes)} · Week ${esc(String(module.week))}</p><h1 id="its08-title">${esc(module.title)}</h1><p class="its01-lede">${its08Text(ITS08_OBJECTIVE)}</p></div><dl class="its01-progress" aria-label="Saved module progress"><div><dt>Lessons</dt><dd>${ITS08_LESSONS.length}</dd></div><div><dt>Guided labs</dt><dd>1</dd></div><div><dt>Labs</dt><dd id="its08-status">${itsLabCounterText(user, ITS08_LAB_KEYS)}</dd></div></dl></section>

      ${its08Learn()}
      ${its08Lab1()}
      ${its08PracticeTickets()}
      ${its08Prove()}

      <section class="its01-section" id="its08-sources" aria-labelledby="its08-sources-title"><div class="its01-section-heading"><span><i class="ri-book-open-line" aria-hidden="true"></i></span><div><p class="its01-kicker">Reference — not a graded step</p><h2 id="its08-sources-title">Sources &amp; Further Reading</h2></div></div>${its08Sources()}</section>
    </main>
  </div>`;
}

/* ----------------------------------------------------------- Re-renders */

// Updates the rail's rows and percent in place, so its open groups, drawer
// and listeners stay as they are.
function its08RefreshRail() {
  const rail = document.querySelector('.its08-shell [data-mquick-nav-rail]');
  if (!rail || !its08User) return;
  const holder = document.createElement('div');
  holder.innerHTML = its08Rail(its08User);
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

// Redraws one check ('learn' or 'aplus') in place. focusId: the feedback
// element to move focus to.
function its08RenderCheck(checkId, focusId) {
  const el = document.querySelector(`.its08-shell [data-its08-check="${checkId}"]`);
  if (el) el.outerHTML = its08Check(checkId);
  if (focusId) {
    const target = document.getElementById(focusId);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }
  its08RefreshRail();
}

/* -------------------------------------------------------------- Actions */

// One pick on one question, as on Module 1. A check is complete, and saved as
// such (complete and its time only), the first time a full pass of first picks
// passes.
function its08Answer(checkId, index, choice) {
  const check = ITS08_CHECKS[checkId];
  const question = check && check.questions[index];
  if (!question || !(choice >= 0 && choice < question.choices.length)) return;
  const picks = its08CheckPicks[checkId][index] || [];
  if (picks.includes(question.answer) || picks.includes(choice)) return;
  its08CheckPicks[checkId][index] = picks.concat(choice);
  if (its08CheckAnswers[checkId][index] === undefined) its08CheckAnswers[checkId][index] = choice;
  const [done] = ITS08_CHECK_SAVED[checkId];
  if (its08State && its08Ready(checkId) && its08State[done] !== true) its08SaveCheckDone(checkId);
  its08RenderCheck(checkId, `its08-${checkId}-q${index}-feedback`);
}

// Ticks a check and saves it, as Module 1's checks do. Only an explicit false
// from the save takes the tick off again (an unknown result leaves it), and
// only if the same student still has the same completion (a render reloads
// its08State, so it's matched by its time, not by object). The untick is saved
// the same way, so this page, this browser's copy and the session's copy of
// the row agree.
function its08SaveCheckDone(checkId) {
  const [done, doneAt] = ITS08_CHECK_SAVED[checkId];
  const userId = its08User && its08User.userId;
  const at = new Date().toISOString();
  its08State[done] = true;
  its08State[doneAt] = at;
  its08CheckSaveFailed[checkId] = false;
  its08Save((ok) => {
    const state = its08State;
    if (ok !== false || !state || !its08User || its08User.userId !== userId || state[doneAt] !== at) return;
    state[done] = false;
    state[doneAt] = null;
    its08CheckSaveFailed[checkId] = true;
    its08Save();
    // Keep focus where it was, unless it was on a button this render removes.
    const active = document.activeElement;
    const footer = document.querySelector(`.its08-shell [data-its08-check-footer="${checkId}"]`);
    const focusInFooter = Boolean(footer && active && footer.contains && footer.contains(active));
    its08RenderCheck(checkId);
    if (focusInFooter) its08FocusCheckStatus(checkId);
  });
}

function its08FocusCheckStatus(checkId) {
  const status = document.querySelector(`.its08-shell [data-its08-check-footer="${checkId}"] .its01-check-status`);
  if (status && typeof status.focus === 'function') status.focus({ preventScroll: true });
}

// Try again: the answers are still in page memory, so save the pass again.
function its08RetryCheckSave(checkId) {
  if (!ITS08_CHECK_SAVED[checkId] || !its08CheckSaveFailed[checkId] || !its08State || !its08Ready(checkId)) return;
  its08SaveCheckDone(checkId);
  its08RenderCheck(checkId);
  its08FocusCheckStatus(checkId);
}

// Start again: a new attempt, so the choices come back in a new order.
function its08ResetCheck(checkId) {
  if (!ITS08_CHECKS[checkId]) return;
  its08CheckAnswers[checkId] = {};
  its08CheckPicks[checkId] = {};
  its08CheckSaveFailed[checkId] = false;
  its08CheckAttempt[checkId] += 1;
  its08RenderCheck(checkId);
  const first = document.querySelector(`.its08-shell [data-its08-check="${checkId}"] [data-its08-answer]`);
  if (first && typeof first.focus === 'function') first.focus({ preventScroll: true });
}

function wireItsModuleTenPage() {
  const shell = document.querySelector('.its08-shell');
  if (!shell || !its08State) return;
  shell.addEventListener('click', (event) => {
    const answer = event.target.closest('[data-its08-answer]');
    if (answer) {
      if (!answer.disabled) its08Answer(answer.dataset.check, Number(answer.dataset.q), Number(answer.dataset.choice));
      return;
    }
    const reset = event.target.closest('[data-its08-check-reset]');
    if (reset) {
      its08ResetCheck(reset.dataset.its08CheckReset);
      return;
    }
    const retry = event.target.closest('[data-its08-check-retry]');
    if (retry) {
      its08RetryCheckSave(retry.dataset.its08CheckRetry);
      return;
    }
    const launch = event.target.closest('[data-its08-console-launch]');
    if (launch) {
      if (itsLaunchWalkthrough(event, launch, its08User, ITS08_COACH_ID)) {
        its08State.consoleStarted = true;
        its08Save();
      }
      itsRefreshWalkthroughNotice(its08User, ITS08_COACH_ID, [ITS08_LAB1_KEY], ITS08_LAB1_START);
    }
  });
}

/* ------------------------------------------- Lab 10.1 and Lab 10.2 saves */

// Lab 10.1's finished work, read from the cleaned snapshot (itsCleanCoachWork):
// HD-2255 resolved, and HD-2110 in the snapshot and not resolved, because
// Part B ends with the ticket handed to Desktop Support. The coach checks
// every step in order before it shows Finish; the saved work keeps no step
// list, so the page checks the end. An old tab could still send an early
// message.
const ITS08_LAB1_TICKETS = ['HD-2255', 'HD-2110'];
function its08Lab1Complete(work) {
  const tickets = work && Array.isArray(work.tickets) ? work.tickets : [];
  const [partA, partB] = ITS08_LAB1_TICKETS.map((id) => tickets.find((entry) => entry.id === id));
  // Part B ends with a work note and the ticket handed to Desktop Support, so
  // it is not Resolved; a ticket nobody wrote on is not finished.
  return Boolean(partA) && partA.status === 'Resolved'
    && Boolean(partB) && partB.status !== 'Resolved' && Array.isArray(partB.notes) && partB.notes.length > 0;
}

async function its08ReceiveCoachCompletion(event) {
  if (!event.data || event.data.type !== 'mnt-coach-complete' || event.data.id !== ITS08_COACH_ID) return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const user = await currentUser();
  if (!user) { itsConfirmCoachReceipt(event, false); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { itsConfirmCoachReceipt(event, false, wrongStudent); return; }

  const work = itsCleanCoachWork(event.data.work);
  const coachKey = `${user.userId}|${ITS08_COACH_ID}`;
  if (!its08Lab1Complete(work)) {
    itsIncompleteWalkthroughs.add(coachKey);
    itsRefreshWalkthroughNotice(user, ITS08_COACH_ID, [ITS08_LAB1_KEY], ITS08_LAB1_START);
    itsConfirmCoachReceipt(event, false, 'incomplete');
    return;
  }
  itsIncompleteWalkthroughs.delete(coachKey);

  // Submit first: Lab 10.1 counts as complete only once the portal has its
  // attempt (saved now, or already waiting or approved).
  const received = await itsSubmitWalkthroughLabs(user, 'its-08', [ITS08_LAB1_KEY], work);
  its08User = user;
  if (received) {
    const saved = LabRuntime.load(ITS08_STATE_ID, user, ITS08_DEFAULT_STATE);
    saved.consoleStarted = true;
    saved.consoleCompleted = true;
    LabRuntime.save(ITS08_STATE_ID, user, saved);
    its08State = saved;
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-08', ITS08_LAB1_KEY);
  }
  itsConfirmCoachReceipt(event, received);

  if (!document.querySelector('.its08-shell')) return;
  render();
  const section = document.getElementById('its08-lab-10-1');
  if (section) section.scrollIntoView({ block: 'start' });
}

// Lab 10.2's completion: the simulator's practice set says its three tickets
// are done (ui/helpdesk.js hdPracticeReport; the set's `complete` and `done`
// rules in ui/helpdesk-data.js). Saved once, as a lab attempt with no score
// and no answers: completion, its time and the ticket ids. Every message gets
// an answer, so the simulator can say whether it was saved.
const ITS08_PRACTICE_TICKETS = ['HD-2223', 'HD-2224', 'HD-2225'];
const ITS08_PRACTICE_LOCK_MS = 15000;
function its08StorageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
function its08StorageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* storage blocked: no lock */ } }
function its08StorageRemove(key) { try { localStorage.removeItem(key); } catch (_) { /* storage blocked */ } }

async function its08ReceivePracticeCompletion(event) {
  const data = event.data;
  if (!data || data.type !== 'mnt-practice-complete' || data.id !== 'its-08') return;
  if (event.origin !== new URL(SIM_ORIGIN).origin) return;
  const reply = (saved, reason) => {
    if (!event.source || typeof event.source.postMessage !== 'function') return;
    event.source.postMessage({ type: 'mnt-practice-received', id: 'its-08', nonce: data.nonce, saved: saved === true, ...(reason ? { reason } : {}) }, event.origin);
  };
  const user = await currentUser();
  if (!user) { reply(false, 'signed-out'); return; }
  const wrongStudent = itsCoachStudentMismatch(event, user);
  if (wrongStudent) { reply(false, wrongStudent); return; }
  const tickets = Array.isArray(data.tickets) ? data.tickets : [];
  if (tickets.length !== ITS08_PRACTICE_TICKETS.length || !ITS08_PRACTICE_TICKETS.every((id) => tickets.includes(id))) { reply(false, 'incomplete'); return; }
  // Already recorded (as loaded at sign-in, or saved on this page).
  if (itsLabSubmitted(user, ITS08_PRACTICE_KEY)) { reply(true); return; }
  if (itsLabSubmitting(user, ITS08_PRACTICE_KEY)) { reply(false, 'busy'); return; }
  // lab_attempts allows many rows per lab and this lab has no
  // course_module_labs row, so the database won't refuse a second record.
  // Another course page tab in this browser may be saving right now (the
  // lock), or may already have saved (the database read): either way, no
  // second record.
  const lock = `mnt.practice-save.${user.userId}.${ITS08_PRACTICE_KEY}`;
  const held = Number(its08StorageGet(lock)) || 0;
  if (Date.now() - held < ITS08_PRACTICE_LOCK_MS) { reply(false, 'busy'); return; }
  its08StorageSet(lock, String(Date.now()));
  let saved = false;
  try {
    const existing = await its08SavedPracticeAttempt(user);
    if (existing === null) { reply(false, 'save-failed'); return; }
    if (existing) {
      user.latestLabAttemptByKey = { ...(user.latestLabAttemptByKey || {}), [ITS08_PRACTICE_KEY]: existing };
      saved = true;
    } else {
      saved = await itsSubmitLabAttempt(user, 'its-08', ITS08_PRACTICE_KEY, {
        state: 'complete', result: { source: 'mnt-practice-complete', practiceSet: 'its-08', tickets: ITS08_PRACTICE_TICKETS.slice() },
      });
    }
  } finally {
    its08StorageRemove(lock);
  }
  if (saved && typeof markModuleLabComplete === 'function') markModuleLabComplete(user, 'it-support', 'its-08', ITS08_PRACTICE_KEY);
  reply(saved, saved ? '' : 'save-failed');
  its08User = user;
  if (document.querySelector('.its08-shell')) render();
}

// The student's saved Lab 10.2 record, read from the database: the attempt
// (in the shape latestLabAttemptByKey holds), false when there is none, or
// null when the read failed. A superseded or returned record doesn't count.
async function its08SavedPracticeAttempt(user) {
  if (typeof mntSupabase === 'undefined') return null;
  try {
    const { data, error } = await mntSupabase.from('lab_attempts')
      .select('completed_at, reviewed_at, redo_requested, superseded_at')
      .eq('user_id', user.userId).eq('lab_key', ITS08_PRACTICE_KEY)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });
    if (error) { console.error('Lab 10.2 completion read failed', error); return null; }
    const row = Array.isArray(data) ? data.find((entry) => entry && !entry.superseded_at && entry.redo_requested !== true) : null;
    return row ? { completedAt: row.completed_at, reviewedAt: row.reviewed_at || null, redoRequested: row.redo_requested === true, supersededAt: row.superseded_at || null } : false;
  } catch (error) {
    console.error('Lab 10.2 completion read threw', error);
    return null;
  }
}

function its08OnMessage(event) {
  itsProveReceiveMessage(event, { moduleKey: 'its-08', labKey: ITS08_PROVE_KEY, onChange: its08ProveChanged });
  return Promise.all([its08ReceivePracticeCompletion(event), its08ReceiveCoachCompletion(event)]);
}

registerModuleLab({
  program: 'it-support', moduleNumber: 10, moduleKey: 'its-08',
  view: viewItsModuleTenPage, wire: wireItsModuleTenPage, onMessage: its08OnMessage,
});
