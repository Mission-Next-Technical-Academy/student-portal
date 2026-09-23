// ============================================================
//  Module Page — SIEM Query Interface
// ============================================================

const ELK_SAMPLE_ROWS = [
  { severity: 'HIGH', asset: 'elk-02', status: 'OPEN' },
  { severity: 'LOW', asset: 'elk-01', status: 'CLOSED' },
];

const ELK_LOG_ROWS = ELK_SAMPLE_ROWS.map((row, index) => ({
  ...row,
  ts: index === 0 ? '2026-04-23 09:14:02' : '2026-04-23 09:15:37',
  index: 'logstash-security-000001',
  message: index === 0
    ? 'Open security incident on elk-02'
    : 'Closed maintenance ticket on elk-01',
}));

const ELK_CLUSTER_JSON = {
  cluster_name: 'missionnext-elk',
  status: 'green',
  timed_out: false,
  number_of_nodes: 1,
  active_primary_shards: 2,
  active_shards: 2,
  sample_documents: ELK_SAMPLE_ROWS,
};

const ELK_PIPELINE_LINES = [
  'input {',
  '  beats { port => 5044 }',
  '}',
  '',
  'filter {',
  '  if [severity] == "HIGH" {',
  '    mutate { add_tag => ["priority"] }',
  '  }',
  '}',
  '',
  'output {',
  '  elasticsearch { hosts => ["http://localhost:9200"] index => "logstash-*" }',
  '}',
];

const ELK_FIELDS = {
  severity: ['HIGH', 'LOW'],
  asset: ['elk-02', 'elk-01'],
  status: ['OPEN', 'CLOSED'],
};

const ELK_STEPS = [
  'Elasticsearch Status',
  'Logstash Pipeline',
  'Data Ingestion',
  'Index Pattern Setup',
  'Discover Page',
];

const ELK_BOOT_GUIDE_STEPS = [
  {
    id: 'what-is-elk',
    title: 'What is ELK?',
    body: 'ELK is a toolset analysts use to search logs. Think of it like a log workbench.',
  },
  {
    id: 'what-is-logstash',
    title: 'What is Logstash doing here?',
    body: 'Logstash takes logs, cleans them, and sends them forward. It is the sorting belt.',
  },
  {
    id: 'what-you-do',
    title: 'What are you about to do?',
    body: 'You will follow logs from intake to search. Each step shows one simple part.',
  },
];

const ELK_TOUR = ELK_BOOT_GUIDE_STEPS;
const ELK_TOUR_SLIDES = ELK_BOOT_GUIDE_STEPS;

const ELK_SCREEN_META = [
  {
    title: 'Elasticsearch Status',
    layer: 'You are in: Elasticsearch (Storage Layer)',
    brief: 'This shows if log storage is ready.',
  },
  {
    title: 'Logstash Pipeline',
    layer: 'You are in: Logstash (Data Processing Layer)',
    brief: 'This shows how logs are cleaned and sent on.',
  },
  {
    title: 'Data Ingestion',
    layer: 'You are in: Logstash (Data Processing Layer)',
    brief: 'This shows logs entering the pipeline.',
  },
  {
    title: 'Index Pattern Setup',
    layer: 'You are in: Kibana (Setup Layer)',
    brief: 'This tells Kibana where to look.',
  },
  {
    title: 'Discover Page',
    layer: 'You are in: Kibana (Search Layer)',
    brief: 'This is where you search the logs.',
  },
];

const ELK_GUIDE_COPY = {
  topbar: 'This bar keeps search tools in one place.',
  navigation: 'This menu moves you through each learning step.',
  current: 'This card tells you where you are now.',
  cluster: 'This shows if log storage is healthy.',
  pipeline: 'This script tells Logstash how to handle logs.',
  pipelineStages: 'These three boxes show the path logs take.',
  ingest: 'These are the logs before they are stored.',
  indices: 'These buckets are where the logs end up.',
  pattern: 'This tells Kibana where to find logs.',
  patternFields: 'These fields become search options later.',
  fields: 'These buttons let you narrow the log list.',
  quickadd: 'These are shortcut filters for common checks.',
  searchbar: 'This box shows the filters you have built.',
  histogram: 'This chart gives you a quick count view.',
  table: 'This table shows the logs you matched.',
  footerNav: 'These buttons move to the next screen.',
};

const SYSLOG_LAB_BACKGROUND = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#05070b"/>
        <stop offset="55%" stop-color="#0a1117"/>
        <stop offset="100%" stop-color="#040608"/>
      </linearGradient>
      <linearGradient id="rack" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#132129"/>
        <stop offset="100%" stop-color="#070b10"/>
      </linearGradient>
      <filter id="blur" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>
    <rect width="1600" height="1000" fill="url(#bg)"/>
    <g opacity="0.42" filter="url(#blur)">
      <circle cx="220" cy="180" r="180" fill="#16a34a"/>
      <circle cx="1270" cy="180" r="210" fill="#0ea5e9"/>
      <circle cx="1160" cy="720" r="200" fill="#22c55e"/>
    </g>
    <g opacity="0.85">
      <rect x="120" y="120" width="300" height="720" rx="22" fill="url(#rack)" stroke="#1f2937" stroke-width="3"/>
      <rect x="460" y="150" width="320" height="680" rx="22" fill="url(#rack)" stroke="#1f2937" stroke-width="3"/>
      <rect x="1110" y="130" width="330" height="700" rx="22" fill="url(#rack)" stroke="#1f2937" stroke-width="3"/>
      <rect x="820" y="280" width="220" height="400" rx="18" fill="#081018" stroke="#1e293b" stroke-width="3"/>
      <rect x="845" y="315" width="170" height="46" rx="8" fill="#07131b" stroke="#0f172a"/>
      <rect x="845" y="385" width="170" height="28" rx="5" fill="#22c55e" opacity="0.24"/>
      <rect x="845" y="430" width="132" height="18" rx="4" fill="#22c55e" opacity="0.4"/>
      <rect x="845" y="462" width="150" height="18" rx="4" fill="#38bdf8" opacity="0.34"/>
      <rect x="845" y="494" width="120" height="18" rx="4" fill="#22c55e" opacity="0.28"/>
      <rect x="845" y="560" width="170" height="80" rx="10" fill="#020617" stroke="#0f172a"/>
      <g fill="#16a34a" opacity="0.6">
        <rect x="160" y="185" width="220" height="14" rx="4"/>
        <rect x="160" y="235" width="180" height="12" rx="4"/>
        <rect x="160" y="280" width="240" height="12" rx="4"/>
        <rect x="500" y="210" width="220" height="14" rx="4"/>
        <rect x="500" y="260" width="170" height="12" rx="4"/>
        <rect x="1150" y="215" width="220" height="14" rx="4"/>
        <rect x="1150" y="265" width="190" height="12" rx="4"/>
      </g>
      <g fill="#0ea5e9" opacity="0.4">
        <rect x="160" y="520" width="180" height="12" rx="4"/>
        <rect x="500" y="520" width="210" height="12" rx="4"/>
        <rect x="1150" y="520" width="210" height="12" rx="4"/>
        <rect x="1150" y="570" width="180" height="12" rx="4"/>
      </g>
    </g>
  </svg>
`);

const SYSLOG_LAB_GROUPS = [
  {
    id: 1,
    title: 'Open Rsyslog Configuration',
    instruction: 'Open the rsyslog configuration file to confirm where Linux system logs are being handled.',
    explanation: 'This introduces the central syslog service configuration used on many Linux systems.',
    commands: [
      {
        value: 'sudo nano /etc/rsyslog.conf',
        output: '[Simulated rsyslog config file opened]\n\nmodule(load="imuxsock")\nmodule(load="imklog")\n*.*;auth,authpriv.none          -/var/log/syslog\nauth,authpriv.*                 /var/log/auth.log\ncron.*                          -/var/log/cron.log',
      },
    ],
  },
  {
    id: 2,
    title: 'Navigate Linux Logs',
    instruction: 'Move into `/var/log`, list the available files, and inspect the main syslog file.',
    explanation: 'Analysts usually begin by locating the active log files before narrowing the investigation.',
    commands: [
      {
        value: 'cd /var/log/',
        output: '[Simulated directory change]\nYou are now reviewing Linux log files in /var/log.',
      },
      {
        value: 'ls -l',
        output: '-rw-r----- 1 syslog adm 12034 Jun 12 10:22 syslog\n-rw-r----- 1 syslog adm 9342 Jun 12 10:22 auth.log\n-rw-r----- 1 root adm 2048 Jun 12 10:22 kern.log\n-rw-r----- 1 root adm 1780 Jun 12 10:22 dpkg.log',
      },
      {
        value: 'less syslog',
        output: '[Simulated syslog view]\nJun 12 10:12:44 server systemd[1]: Started Session 24 of user analyst.\nJun 12 10:14:02 server CRON[2210]: pam_unix(cron:session): session opened for user root\nJun 12 10:15:01 server sshd[1234]: Accepted password for user from 192.168.1.10 port 54422 ssh2\nJun 12 10:16:22 server sshd[1235]: Failed password for root from 10.0.0.5 port 60112 ssh2\nJun 12 10:17:09 server sudo: analyst : TTY=pts/0 ; PWD=/home/analyst ; USER=root ; COMMAND=/usr/bin/systemctl status ssh',
      },
    ],
  },
  {
    id: 3,
    title: 'Filter Syslog Activity',
    instruction: 'Search `syslog` for the relevant date, then isolate SSH daemon activity and combine both filters.',
    explanation: 'Simple `grep` pipelines are often enough to isolate suspicious log slices quickly.',
    commands: [
      {
        value: "grep 'Jun 12' syslog",
        output: 'Jun 12 10:12:44 server systemd[1]: Started Session 24 of user analyst.\nJun 12 10:14:02 server CRON[2210]: pam_unix(cron:session): session opened for user root\nJun 12 10:15:01 server sshd[1234]: Accepted password for user from 192.168.1.10 port 54422 ssh2\nJun 12 10:16:22 server sshd[1235]: Failed password for root from 10.0.0.5 port 60112 ssh2\nJun 12 10:18:11 server kernel: [2331.442991] audit: type=1400 apparmor="DENIED"',
      },
      {
        value: "grep 'sshd' syslog",
        output: 'Jun 12 10:15:01 server sshd[1234]: Accepted password for user from 192.168.1.10 port 54422 ssh2\nJun 12 10:16:22 server sshd[1235]: Failed password for root from 10.0.0.5 port 60112 ssh2\nJun 12 10:18:01 server sshd[1241]: Failed password for admin from 203.0.113.77 port 60214 ssh2\nJun 12 10:19:44 server sshd[1247]: Failed password for root from 10.0.0.5 port 60298 ssh2',
      },
      {
        value: "grep 'Jun 12' syslog | grep 'sshd'",
        output: 'Jun 12 10:15:01 server sshd[1234]: Accepted password for user from 192.168.1.10 port 54422 ssh2\nJun 12 10:16:22 server sshd[1235]: Failed password for root from 10.0.0.5 port 60112 ssh2\nJun 12 10:18:01 server sshd[1241]: Failed password for admin from 203.0.113.77 port 60214 ssh2\nJun 12 10:19:44 server sshd[1247]: Failed password for root from 10.0.0.5 port 60298 ssh2',
      },
    ],
  },
  {
    id: 4,
    title: 'Inspect Authentication Logs',
    instruction: 'Open `auth.log` to review authentication-specific entries in more detail.',
    explanation: 'Authentication events are commonly split into `auth.log`, making failed and successful logons easier to investigate.',
    commands: [
      {
        value: 'less auth.log',
        output: '[Simulated auth.log view]\nJun 12 10:15:01 server sshd[1234]: Accepted password for user from 192.168.1.10 port 54422 ssh2\nJun 12 10:16:22 server sshd[1235]: Failed password for root from 10.0.0.5 port 60112 ssh2\nJun 12 10:18:01 server sshd[1241]: Failed password for admin from 203.0.113.77 port 60214 ssh2\nJun 12 10:19:44 server sshd[1247]: Failed password for root from 10.0.0.5 port 60298 ssh2\nJun 12 10:21:03 server sudo: analyst : TTY=pts/0 ; PWD=/home/analyst ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow',
      },
    ],
  },
  {
    id: 5,
    title: 'Summarize Key Indicators',
    instruction: 'Use `awk`, `sort`, and `uniq` to summarize failed-password IPs, successful logon usernames, and dominant services.',
    explanation: 'Aggregation turns noisy text logs into triage-ready indicators you can act on quickly.',
    commands: [
      {
        value: "awk '/sshd/ && /Failed password/ {print $11}' auth.log | sort | uniq -c | sort -nr",
        output: '      4 10.0.0.5\n      3 203.0.113.77\n      1 198.51.100.44',
      },
      {
        value: "awk '/sshd/ && /Accepted password/ {print $9}' auth.log | sort | uniq -c | sort -nr",
        output: '      3 analyst\n      2 user\n      1 backup',
      },
      {
        value: "awk '{print $6}' syslog | sort | uniq -c | sort -nr",
        output: '      9 sshd[1247]:\n      6 CRON[2210]:\n      4 sudo:\n      3 systemd[1]:\n      2 kernel:',
      },
    ],
  },
];

const POWERSHELL_LAB_BACKGROUND = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#05121f"/>
        <stop offset="50%" stop-color="#081421"/>
        <stop offset="100%" stop-color="#03070c"/>
      </linearGradient>
      <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0f2235"/>
        <stop offset="100%" stop-color="#07101a"/>
      </linearGradient>
      <filter id="blur" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="26"/>
      </filter>
    </defs>
    <rect width="1600" height="1000" fill="url(#bg)"/>
    <g filter="url(#blur)" opacity="0.52">
      <circle cx="260" cy="190" r="190" fill="#38bdf8"/>
      <circle cx="1320" cy="180" r="220" fill="#0ea5e9"/>
      <circle cx="1180" cy="760" r="240" fill="#2563eb"/>
    </g>
    <g opacity="0.88">
      <rect x="120" y="120" width="1360" height="760" rx="30" fill="url(#win)" stroke="#1e293b" stroke-width="3"/>
      <rect x="170" y="190" width="620" height="560" rx="20" fill="#09131f" stroke="#1f2937" stroke-width="2"/>
      <rect x="845" y="190" width="470" height="280" rx="18" fill="#08111b" stroke="#1f2937" stroke-width="2"/>
      <rect x="845" y="500" width="470" height="250" rx="18" fill="#08111b" stroke="#1f2937" stroke-width="2"/>
      <rect x="1345" y="190" width="85" height="560" rx="16" fill="#0a1725" stroke="#1f2937" stroke-width="2"/>
      <rect x="210" y="235" width="510" height="24" rx="6" fill="#38bdf8" opacity="0.18"/>
      <rect x="210" y="283" width="390" height="18" rx="5" fill="#93c5fd" opacity="0.15"/>
      <rect x="210" y="322" width="470" height="18" rx="5" fill="#38bdf8" opacity="0.14"/>
      <rect x="880" y="232" width="210" height="22" rx="6" fill="#38bdf8" opacity="0.2"/>
      <rect x="880" y="274" width="320" height="16" rx="5" fill="#bfdbfe" opacity="0.14"/>
      <rect x="880" y="314" width="280" height="16" rx="5" fill="#38bdf8" opacity="0.14"/>
      <rect x="880" y="540" width="240" height="20" rx="6" fill="#38bdf8" opacity="0.18"/>
      <rect x="880" y="582" width="340" height="16" rx="5" fill="#bfdbfe" opacity="0.14"/>
      <rect x="880" y="620" width="280" height="16" rx="5" fill="#38bdf8" opacity="0.14"/>
      <g fill="#60a5fa" opacity="0.22">
        <circle cx="1390" cy="250" r="18"/>
        <circle cx="1390" cy="310" r="18"/>
        <circle cx="1390" cy="370" r="18"/>
        <circle cx="1390" cy="430" r="18"/>
        <circle cx="1390" cy="490" r="18"/>
      </g>
    </g>
  </svg>
`);

const POWERSHELL_LAB_GROUPS = [
  {
    id: 1,
    title: 'Profile the Security Log',
    instruction: 'Start by confirming the Security log exists and checking how many records are available for review.',
    explanation: 'This mirrors an analyst verifying that the target Windows log is present before querying specific event IDs.',
    commands: [
      {
        value: 'Get-WinEvent -ListLog Security',
        output: 'LogMode   MaximumSizeInBytes RecordCount LogName\n-------   ------------------ ----------- -------\nCircular           20971520          24 Security',
      },
    ],
  },
  {
    id: 2,
    title: 'Isolate Failed Logons',
    instruction: 'Pull the failed logon activity from the Security log and review the repeated authentication failures.',
    explanation: 'Event ID 4625 is the standard failed logon event and usually the first place to check for brute force behavior.',
    commands: [
      {
        value: "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625}",
        output: 'TimeCreated           Id LevelDisplayName Message\n-----------           -- ---------------- -------\n04/23/2026 09:07:18 4625 Information      An account failed to log on. TargetUserName=j.sanders IpAddress=10.10.24.19\n04/23/2026 09:08:03 4625 Information      An account failed to log on. TargetUserName=j.sanders IpAddress=10.10.24.19\n04/23/2026 09:09:27 4625 Information      An account failed to log on. TargetUserName=j.sanders IpAddress=10.10.24.19\n04/23/2026 09:10:42 4625 Information      An account failed to log on. TargetUserName=j.sanders IpAddress=10.10.24.19\n04/23/2026 09:11:58 4625 Information      An account failed to log on. TargetUserName=j.sanders IpAddress=10.10.24.19',
      },
      {
        value: "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} | Group-Object {$_.Properties[19].Value} | Sort-Object Count -Descending",
        output: 'Count Name                      Group\n----- ----                      -----\n    5 10.10.24.19               {4625, 4625, 4625, 4625, 4625}',
      },
    ],
  },
  {
    id: 3,
    title: 'Find the Successful Logon',
    instruction: 'Check whether the repeated failures were eventually followed by a successful authentication for the same user.',
    explanation: 'Correlating failed and successful logons gives you the pivot point for the rest of the investigation.',
    commands: [
      {
        value: "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624} | Where-Object {$_.Properties[5].Value -eq 'j.sanders'}",
        output: 'TimeCreated           Id LevelDisplayName Message\n-----------           -- ---------------- -------\n04/23/2026 09:13:22 4624 Information      An account was successfully logged on. TargetUserName=j.sanders IpAddress=10.10.24.19 LogonType=3',
      },
    ],
  },
  {
    id: 4,
    title: 'Inspect PowerShell Process Creation',
    instruction: 'Pivot from the successful logon to the suspicious PowerShell process creation event that follows it.',
    explanation: 'Event ID 4688 captures new process creation and is ideal for spotting follow-on execution after authentication.',
    commands: [
      {
        value: "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} | Where-Object {$_.Properties[5].Value -like '*powershell.exe*'}",
        output: 'TimeCreated           Id LevelDisplayName Message\n-----------           -- ---------------- -------\n04/23/2026 09:13:40 4688 Information      A new process has been created. NewProcessName=C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe ProcessId=0x1f40 ParentProcessName=C:\\Windows\\explorer.exe',
      },
      {
        value: "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} | Where-Object {$_.Properties[5].Value -like '*powershell.exe*'} | Select-Object TimeCreated, Id, @{Name='ProcessId';Expression={$_.Properties[7].Value}}, @{Name='CommandLine';Expression={$_.Properties[8].Value}}",
        output: 'TimeCreated           Id ProcessId CommandLine\n-----------           -- --------- -----------\n04/23/2026 09:13:40 4688 0x1f40   powershell.exe -ExecutionPolicy Bypass -NoProfile',
      },
    ],
  },
  {
    id: 5,
    title: 'Trace the Child Process',
    instruction: 'Confirm what the PowerShell process launched next so the investigation captures follow-on execution.',
    explanation: 'Analysts often trace parent and child processes to understand what the initial shell actually did.',
    commands: [
      {
        value: "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} | Where-Object {$_.Properties[6].Value -like '*powershell.exe*'}",
        output: 'TimeCreated           Id LevelDisplayName Message\n-----------           -- ---------------- -------\n04/23/2026 09:13:58 4688 Information      A new process has been created. NewProcessName=C:\\Windows\\System32\\cmd.exe ProcessId=0x2014 ParentProcessName=C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe CommandLine=cmd.exe /c whoami /all',
      },
    ],
  },
];

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function formatKql(filters) {
  if (!filters.length) return '*';
  return filters.map(({ field, value }) => `${field}: "${value}"`).join(' and ');
}

function toggleFilter(filters, field, value) {
  const exists = filters.some(filter => filter.field === field && filter.value === value);
  if (exists) {
    return filters.filter(filter => !(filter.field === field && filter.value === value));
  }
  return [...filters, { field, value }];
}

function filterRows(rows, filters) {
  if (!filters.length) return rows;
  return rows.filter(row => filters.every(filter => row[filter.field] === filter.value));
}

function countBy(rows, field, values) {
  return values.map(value => ({
    value,
    count: rows.filter(row => row[field] === value).length,
  }));
}

function Panel({ title, eyebrow, subtitle, children, className = '', actions }) {
  return (
    <section className={cx('rounded-2xl border border-slate-800 bg-slate-950/70 shadow-2xl shadow-slate-950/30', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{eyebrow}</div>
          <h2 className="mt-1 text-lg font-semibold text-slate-100">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function NavButton({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        'rounded-full border px-3 py-2 text-left text-sm transition',
        active
          ? 'border-cyan-400/30 bg-cyan-400/15 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]'
          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/90 hover:text-slate-100'
      )}
    >
      {children}
    </button>
  );
}

function SyslogLinuxLab({ onBack }) {
  const [history, setHistory] = React.useState(() => ([
    { type: 'system', text: 'Linux Syslog Analysis Lab initialized.' },
    { type: 'system', text: 'This is a sandboxed terminal simulation. Commands are validated locally and never executed.' },
    { type: 'system', text: `Prompt: student@lab:~$` },
  ]));
  const [input, setInput] = React.useState('');
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [submittedCommands, setSubmittedCommands] = React.useState([]);
  const [completedGroups, setCompletedGroups] = React.useState([]);
  const [groupIndex, setGroupIndex] = React.useState(0);
  const [commandIndex, setCommandIndex] = React.useState(0);
  const [wrongPulse, setWrongPulse] = React.useState(false);
  const [successPulse, setSuccessPulse] = React.useState(false);
  const terminalScrollRef = React.useRef(null);
  const terminalInputRef = React.useRef(null);
  const stepRefs = React.useRef([]);

  const activeGroup = SYSLOG_LAB_GROUPS[groupIndex] || null;
  const activeCommand = activeGroup?.commands[commandIndex] || null;
  const totalGroups = SYSLOG_LAB_GROUPS.length;
  const progress = Math.round((completedGroups.length / totalGroups) * 100);

  React.useEffect(() => {
    terminalInputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const node = terminalScrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [history, groupIndex, commandIndex]);

  React.useEffect(() => {
    const node = stepRefs.current[groupIndex];
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [groupIndex]);

  function normalizeCommand(value) {
    return value.trim().replace(/\s+/g, ' ');
  }

  function resetLab() {
    setHistory([
      { type: 'system', text: 'Linux Syslog Analysis Lab reset.' },
      { type: 'system', text: 'This is a sandboxed terminal simulation. Commands are validated locally and never executed.' },
      { type: 'system', text: `Prompt: student@lab:~$` },
    ]);
    setInput('');
    setHistoryIndex(-1);
    setSubmittedCommands([]);
    setCompletedGroups([]);
    setGroupIndex(0);
    setCommandIndex(0);
    setWrongPulse(false);
    setSuccessPulse(false);
    window.requestAnimationFrame(() => terminalInputRef.current?.focus());
  }

  function acceptCommand(commandText, outputText) {
    const nextHistory = [
      ...history,
      { type: 'command', text: commandText },
      { type: 'output', text: outputText },
    ];
    const nextSubmitted = [commandText, ...submittedCommands.filter(item => item !== commandText)].slice(0, 30);
    const finishingGroup = activeGroup && commandIndex === activeGroup.commands.length - 1;

    if (finishingGroup) {
      nextHistory.push({ type: 'success', text: `Step ${activeGroup.id} complete.` });
    }

    setHistory(nextHistory);
    setSubmittedCommands(nextSubmitted);
    setHistoryIndex(-1);
    setInput('');
    setSuccessPulse(true);
    window.setTimeout(() => setSuccessPulse(false), 420);

    if (finishingGroup) {
      const nextCompleted = [...completedGroups, activeGroup.id];
      setCompletedGroups(nextCompleted);
      if (groupIndex < SYSLOG_LAB_GROUPS.length - 1) {
        setGroupIndex(groupIndex + 1);
        setCommandIndex(0);
      } else {
        nextHistory.push({ type: 'success', text: 'Lab complete. All simulated syslog analysis steps finished.' });
        setHistory([...nextHistory]);
      }
      return;
    }

    setCommandIndex(commandIndex + 1);
  }

  function rejectCommand(commandText) {
    setHistory([
      ...history,
      { type: 'command', text: commandText },
      { type: 'error', text: 'incorrect command for this sandboxed lab' },
    ]);
    setSubmittedCommands([commandText, ...submittedCommands.filter(item => item !== commandText)].slice(0, 30));
    setHistoryIndex(-1);
    setInput('');
    setWrongPulse(true);
    window.setTimeout(() => setWrongPulse(false), 420);
  }

  function submitCurrentCommand() {
    const raw = input.trim();
    if (!raw) return;
    const normalized = normalizeCommand(raw);
    const expected = normalizeCommand(activeCommand?.value || '');
    if (normalized === expected) {
      acceptCommand(raw, activeCommand.output);
    } else {
      rejectCommand(raw);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitCurrentCommand();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!submittedCommands.length) return;
      const nextIndex = Math.min(historyIndex + 1, submittedCommands.length - 1);
      setHistoryIndex(nextIndex);
      setInput(submittedCommands[nextIndex] || '');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!submittedCommands.length) return;
      const nextIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(nextIndex);
      setInput(nextIndex === -1 ? '' : (submittedCommands[nextIndex] || ''));
    }
  }

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(2,6,23,0.88), rgba(2,6,23,0.72)), url("data:image/svg+xml;charset=UTF-8,${SYSLOG_LAB_BACKGROUND}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={() => terminalInputRef.current?.focus()}
    >
      <style>{`
        @keyframes syslog-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(4px); }
        }
        @keyframes syslog-glow {
          0%, 100% { box-shadow: 0 0 0 rgba(34,197,94,0); }
          50% { box-shadow: 0 0 36px rgba(34,197,94,0.2); }
        }
        @keyframes syslog-cursor {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
        <section className="flex min-h-[68vh] flex-1 flex-col lg:basis-[70%]">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/15 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-emerald-400">Linux Syslog Analysis</div>
              <div className="mt-1 text-sm text-slate-400">Controlled CLI simulator. No commands are executed on the host.</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={resetLab} className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-slate-300 transition hover:border-slate-500 hover:text-white">
                Reset Lab
              </button>
              <button type="button" onClick={onBack} className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-emerald-300 transition hover:border-emerald-400 hover:text-emerald-100">
                Back
              </button>
            </div>
          </div>

          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-xs text-slate-400">student@lab: syslog-sandbox</span>
              </div>
              <div className="font-mono text-xs text-slate-500">{completedGroups.length}/{totalGroups} steps complete</div>
            </div>

            <div className="h-2 w-full bg-slate-900">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-lime-400 to-cyan-400 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            <div
              ref={terminalScrollRef}
              className={[
                'h-[58vh] overflow-y-auto px-4 py-4 font-mono text-[13px] leading-7 text-slate-200 transition',
                wrongPulse ? 'animate-[syslog-shake_0.34s_ease-in-out]' : '',
                successPulse ? 'animate-[syslog-glow_0.42s_ease-in-out]' : '',
              ].join(' ')}
            >
              {history.map((entry, index) => (
                <div key={`${entry.type}-${index}`} className="whitespace-pre-wrap break-words">
                  {entry.type === 'command' ? (
                    <div className="text-slate-100">
                      <span className="text-emerald-400">student@lab:~$ </span>
                      <span>{entry.text}</span>
                    </div>
                  ) : (
                    <div className={{
                      system: 'text-cyan-200/90',
                      output: 'text-slate-300',
                      success: 'text-emerald-300',
                      error: 'text-rose-300',
                    }[entry.type] || 'text-slate-300'}>
                      {entry.text}
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-2 flex items-center gap-2 text-slate-100">
                <span className="shrink-0 text-emerald-400">student@lab:~$</span>
                <div className="relative flex-1">
                  <input
                    ref={terminalInputRef}
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    className="w-full bg-transparent pr-4 text-slate-100 outline-none placeholder:text-slate-600"
                    placeholder={activeCommand ? `expected next: ${activeCommand.value}` : 'lab complete'}
                    disabled={!activeCommand}
                  />
                  {!input && activeCommand ? (
                    <span className="pointer-events-none absolute left-0 top-0 text-emerald-400/70 animate-[syslog-cursor_1s_step-end_infinite]">▋</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="flex lg:basis-[30%] lg:pl-5">
          <div className="flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/76 backdrop-blur-xl">
            <div className="border-b border-slate-800 px-5 py-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300">Task Panel</div>
              <h1 className="mt-2 text-xl font-semibold text-white">Syslog Investigation Workflow</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">Enter the commands in order. Only the expected command for the current sub-step is accepted.</p>
            </div>

            <div className="overflow-y-auto px-4 py-4">
              {SYSLOG_LAB_GROUPS.map((group, index) => {
                const isComplete = completedGroups.includes(group.id);
                const isCurrent = index === groupIndex;
                const commandCursor = isCurrent ? commandIndex : -1;

                return (
                  <article
                    key={group.id}
                    ref={node => { stepRefs.current[index] = node; }}
                    className={[
                      'mb-3 rounded-2xl border p-4 transition',
                      isComplete
                        ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_28px_rgba(34,197,94,0.10)]'
                        : isCurrent
                          ? 'border-cyan-400/35 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.10)]'
                          : 'border-slate-800 bg-slate-900/60',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div className={[
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs',
                        isComplete
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                          : isCurrent
                            ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100'
                            : 'border-slate-700 bg-slate-950 text-slate-400',
                      ].join(' ')}>
                        {isComplete ? '✓' : group.id}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-white">{group.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{group.instruction}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{group.explanation}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {group.commands.map((command, commandIdx) => {
                        const isDone = isComplete || (isCurrent && commandIdx < commandCursor);
                        const isActive = isCurrent && commandIdx === commandCursor;
                        return (
                          <div
                            key={command.value}
                            className={[
                              'rounded-xl border px-3 py-2 font-mono text-[12px] leading-5 transition',
                              isDone
                                ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100'
                                : isActive
                                  ? 'border-cyan-400/35 bg-cyan-400/10 text-cyan-100'
                                  : 'border-slate-800 bg-slate-950/70 text-slate-500',
                            ].join(' ')}
                          >
                            {command.value}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function WindowsPowerShellLab({ onBack }) {
  const [history, setHistory] = React.useState(() => ([
    { type: 'system', text: 'Windows PowerShell forensic lab initialized.' },
    { type: 'system', text: 'This is a frontend-only PowerShell simulator. Commands are validated locally and never executed.' },
    { type: 'system', text: 'Prompt: PS C:\\Cases\\Mission Next>' },
  ]));
  const [input, setInput] = React.useState('');
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [submittedCommands, setSubmittedCommands] = React.useState([]);
  const [completedGroups, setCompletedGroups] = React.useState([]);
  const [groupIndex, setGroupIndex] = React.useState(0);
  const [commandIndex, setCommandIndex] = React.useState(0);
  const [wrongPulse, setWrongPulse] = React.useState(false);
  const [successPulse, setSuccessPulse] = React.useState(false);
  const terminalScrollRef = React.useRef(null);
  const terminalInputRef = React.useRef(null);
  const stepRefs = React.useRef([]);

  const activeGroup = POWERSHELL_LAB_GROUPS[groupIndex] || null;
  const activeCommand = activeGroup?.commands[commandIndex] || null;
  const totalGroups = POWERSHELL_LAB_GROUPS.length;
  const progress = Math.round((completedGroups.length / totalGroups) * 100);

  React.useEffect(() => {
    terminalInputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const node = terminalScrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [history, groupIndex, commandIndex]);

  React.useEffect(() => {
    const node = stepRefs.current[groupIndex];
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [groupIndex]);

  function normalizeCommand(value) {
    return value.trim().replace(/\s+/g, ' ');
  }

  function resetLab() {
    setHistory([
      { type: 'system', text: 'Windows PowerShell forensic lab reset.' },
      { type: 'system', text: 'This is a frontend-only PowerShell simulator. Commands are validated locally and never executed.' },
      { type: 'system', text: 'Prompt: PS C:\\Cases\\Mission Next>' },
    ]);
    setInput('');
    setHistoryIndex(-1);
    setSubmittedCommands([]);
    setCompletedGroups([]);
    setGroupIndex(0);
    setCommandIndex(0);
    setWrongPulse(false);
    setSuccessPulse(false);
    window.requestAnimationFrame(() => terminalInputRef.current?.focus());
  }

  function acceptCommand(commandText, outputText) {
    const nextHistory = [
      ...history,
      { type: 'command', text: commandText },
      { type: 'output', text: outputText },
    ];
    const nextSubmitted = [commandText, ...submittedCommands.filter(item => item !== commandText)].slice(0, 30);
    const finishingGroup = activeGroup && commandIndex === activeGroup.commands.length - 1;

    if (finishingGroup) {
      nextHistory.push({ type: 'success', text: `Step ${activeGroup.id} complete.` });
    }

    setHistory(nextHistory);
    setSubmittedCommands(nextSubmitted);
    setHistoryIndex(-1);
    setInput('');
    setSuccessPulse(true);
    window.setTimeout(() => setSuccessPulse(false), 420);

    if (finishingGroup) {
      const nextCompleted = [...completedGroups, activeGroup.id];
      setCompletedGroups(nextCompleted);
      if (groupIndex < POWERSHELL_LAB_GROUPS.length - 1) {
        setGroupIndex(groupIndex + 1);
        setCommandIndex(0);
      } else {
        nextHistory.push({ type: 'success', text: 'Lab complete. PowerShell event triage workflow finished.' });
        setHistory([...nextHistory]);
      }
      return;
    }

    setCommandIndex(commandIndex + 1);
  }

  function rejectCommand(commandText) {
    setHistory([
      ...history,
      { type: 'command', text: commandText },
      { type: 'error', text: 'incorrect command for this sandboxed lab' },
    ]);
    setSubmittedCommands([commandText, ...submittedCommands.filter(item => item !== commandText)].slice(0, 30));
    setHistoryIndex(-1);
    setInput('');
    setWrongPulse(true);
    window.setTimeout(() => setWrongPulse(false), 420);
  }

  function submitCurrentCommand() {
    const raw = input.trim();
    if (!raw) return;
    const normalized = normalizeCommand(raw);
    const expected = normalizeCommand(activeCommand?.value || '');
    if (normalized === expected) {
      acceptCommand(raw, activeCommand.output);
    } else {
      rejectCommand(raw);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitCurrentCommand();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!submittedCommands.length) return;
      const nextIndex = Math.min(historyIndex + 1, submittedCommands.length - 1);
      setHistoryIndex(nextIndex);
      setInput(submittedCommands[nextIndex] || '');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!submittedCommands.length) return;
      const nextIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(nextIndex);
      setInput(nextIndex === -1 ? '' : (submittedCommands[nextIndex] || ''));
    }
  }

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(1,8,18,0.88), rgba(2,6,23,0.82)), url("data:image/svg+xml;charset=UTF-8,${POWERSHELL_LAB_BACKGROUND}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={() => terminalInputRef.current?.focus()}
    >
      <style>{`
        @keyframes powershell-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(4px); }
        }
        @keyframes powershell-glow {
          0%, 100% { box-shadow: 0 0 0 rgba(56,189,248,0); }
          50% { box-shadow: 0 0 40px rgba(56,189,248,0.22); }
        }
        @keyframes powershell-cursor {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
        <section className="flex min-h-[68vh] flex-1 flex-col lg:basis-[70%]">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-sky-400/15 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-sky-300">Windows PowerShell IR Lab</div>
              <div className="mt-1 text-sm text-slate-400">Controlled command-line simulation for Security event triage.</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={resetLab} className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-slate-300 transition hover:border-slate-500 hover:text-white">
                Reset Lab
              </button>
              <button type="button" onClick={onBack} className="rounded-full border border-sky-400/35 bg-sky-400/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.24em] text-sky-200 transition hover:border-sky-300 hover:text-white">
                Back
              </button>
            </div>
          </div>

          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-sky-400/80" />
                <span className="ml-3 font-mono text-xs text-slate-400">PS C:\Cases\Mission Next\IR\WF-1</span>
              </div>
              <div className="font-mono text-xs text-slate-500">{completedGroups.length}/{totalGroups} steps complete</div>
            </div>

            <div className="h-2 w-full bg-slate-900">
              <div className="h-full bg-gradient-to-r from-sky-500 via-blue-400 to-cyan-300 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            <div
              ref={terminalScrollRef}
              className={[
                'h-[58vh] overflow-y-auto px-4 py-4 font-mono text-[13px] leading-7 text-slate-200 transition',
                wrongPulse ? 'animate-[powershell-shake_0.34s_ease-in-out]' : '',
                successPulse ? 'animate-[powershell-glow_0.42s_ease-in-out]' : '',
              ].join(' ')}
            >
              {history.map((entry, index) => (
                <div key={`${entry.type}-${index}`} className="whitespace-pre-wrap break-words">
                  {entry.type === 'command' ? (
                    <div className="text-slate-100">
                      <span className="text-sky-300">PS C:\Cases\Mission Next&gt; </span>
                      <span>{entry.text}</span>
                    </div>
                  ) : (
                    <div className={{
                      system: 'text-cyan-200/90',
                      output: 'text-slate-300',
                      success: 'text-sky-200',
                      error: 'text-rose-300',
                    }[entry.type] || 'text-slate-300'}>
                      {entry.text}
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-2 flex items-center gap-2 text-slate-100">
                <span className="shrink-0 text-sky-300">PS C:\Cases\Mission Next&gt;</span>
                <div className="relative flex-1">
                  <input
                    ref={terminalInputRef}
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    className="w-full bg-transparent pr-4 text-slate-100 outline-none placeholder:text-slate-600"
                    placeholder={activeCommand ? `expected next: ${activeCommand.value}` : 'lab complete'}
                    disabled={!activeCommand}
                  />
                  {!input && activeCommand ? (
                    <span className="pointer-events-none absolute left-0 top-0 text-sky-300/75 animate-[powershell-cursor_1s_step-end_infinite]">▋</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="flex lg:basis-[30%] lg:pl-5">
          <div className="flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/76 backdrop-blur-xl">
            <div className="border-b border-slate-800 px-5 py-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-sky-300">Task Panel</div>
              <h1 className="mt-2 text-xl font-semibold text-white">PowerShell Event Investigation</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">Enter the exact PowerShell commands in order. Only the current command is accepted in this sandboxed lab.</p>
            </div>

            <div className="overflow-y-auto px-4 py-4">
              {POWERSHELL_LAB_GROUPS.map((group, index) => {
                const isComplete = completedGroups.includes(group.id);
                const isCurrent = index === groupIndex;
                const commandCursor = isCurrent ? commandIndex : -1;

                return (
                  <article
                    key={group.id}
                    ref={node => { stepRefs.current[index] = node; }}
                    className={[
                      'mb-3 rounded-2xl border p-4 transition',
                      isComplete
                        ? 'border-sky-400/40 bg-sky-400/10 shadow-[0_0_28px_rgba(56,189,248,0.10)]'
                        : isCurrent
                          ? 'border-cyan-300/35 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.10)]'
                          : 'border-slate-800 bg-slate-900/60',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div className={[
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-xs',
                        isComplete
                          ? 'border-sky-300 bg-sky-400/20 text-sky-100'
                          : isCurrent
                            ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100'
                            : 'border-slate-700 bg-slate-950 text-slate-400',
                      ].join(' ')}>
                        {isComplete ? '✓' : group.id}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-white">{group.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{group.instruction}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{group.explanation}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {group.commands.map((command, commandIdx) => {
                        const isDone = isComplete || (isCurrent && commandIdx < commandCursor);
                        const isActive = isCurrent && commandIdx === commandCursor;
                        return (
                          <div
                            key={command.value}
                            className={[
                              'rounded-xl border px-3 py-2 font-mono text-[12px] leading-5 transition',
                              isDone
                                ? 'border-sky-400/35 bg-sky-400/10 text-sky-50'
                                : isActive
                                  ? 'border-cyan-300/35 bg-cyan-400/10 text-cyan-100'
                                  : 'border-slate-800 bg-slate-950/70 text-slate-500',
                            ].join(' ')}
                          >
                            {command.value}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FilterPill({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={cx(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-100'
          : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-600 hover:text-slate-100'
      )}
    >
      {children}
    </button>
  );
}

function MetricCard({ label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-100">{value}</div>
      {note ? <div className="mt-2 text-sm text-slate-400">{note}</div> : null}
    </div>
  );
}

function ElkLogo({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <span className="h-4 w-4 rounded-full bg-[#FEC514] shadow-[0_0_16px_rgba(254,197,20,0.35)]" />
        <span className="h-4 w-4 rounded-full bg-[#00BFB3] shadow-[0_0_16px_rgba(0,191,179,0.35)]" />
        <span className="h-4 w-4 rounded-full bg-[#F04E98] shadow-[0_0_16px_rgba(240,78,152,0.35)]" />
      </div>
      {!compact ? (
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-400">ELK Stack</div>
          <div className="text-sm font-medium text-slate-100">Elasticsearch · Logstash · Kibana</div>
        </div>
      ) : null}
    </div>
  );
}

function BootGuidePanel({ step, stepIndex, stepTotal, open, onNext, onBack, onSkip }) {
  return (
    <div
      className={cx(
        'pointer-events-auto fixed left-4 top-6 z-40 w-[min(92vw,22rem)] transform transition duration-500 ease-out motion-reduce:transition-none',
        open ? 'translate-x-0 opacity-100' : '-translate-x-[115%] opacity-0'
      )}
      aria-hidden={!open}
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-sky-300/20 bg-slate-950/94 p-5 shadow-[0_0_40px_rgba(56,189,248,0.12)] backdrop-blur-xl">
        <div className="absolute -bottom-8 -left-4 h-20 w-24 rounded-[2rem] border border-sky-300/15 bg-slate-950/88" />
        <div className="absolute -right-10 top-8 h-28 w-28 rounded-full bg-sky-400/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <ElkLogo compact />
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
              Step {stepIndex + 1}/{stepTotal}
            </div>
          </div>
          <div className="mt-5 text-[11px] uppercase tracking-[0.3em] text-sky-300">Boot Guide</div>
          <h2 className="mt-2 text-xl font-semibold text-white">{step.title}</h2>
          <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 text-sm leading-6 text-slate-200">
            {step.body}
          </p>
          <div className="mt-4 text-xs leading-5 text-slate-400">
            Use Next to move through the short intro.
          </div>
          <div className="mt-5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white motion-reduce:transition-none"
            >
              Back
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white motion-reduce:transition-none"
              >
                Skip Tour
              </button>
              <button
                type="button"
                onClick={onNext}
                className="rounded-full border border-sky-300/40 bg-sky-400/15 px-4 py-2 text-sm font-medium text-sky-100 transition hover:shadow-[0_0_18px_rgba(56,189,248,0.22)] motion-reduce:transition-none"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingBootGuide({ activeText, onInspect }) {
  const bootSize = 86;
  const homePositionRef = React.useRef({ x: 24, y: 24 });
  const returnTimerRef = React.useRef(null);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });
  const [position, setPosition] = React.useState({ x: 24, y: 24 });
  const [dragging, setDragging] = React.useState(false);
  const [docked, setDocked] = React.useState(true);

  React.useEffect(() => {
    function updateHomePosition() {
      const next = {
        x: 24,
        y: Math.max(24, window.innerHeight - 146),
      };
      homePositionRef.current = next;
      if (docked) setPosition(next);
    }

    updateHomePosition();
    window.addEventListener('resize', updateHomePosition);
    return () => window.removeEventListener('resize', updateHomePosition);
  }, [docked]);

  React.useEffect(() => (
    () => {
      if (returnTimerRef.current) window.clearTimeout(returnTimerRef.current);
    }
  ), []);

  function scheduleReturnHome() {
    if (returnTimerRef.current) window.clearTimeout(returnTimerRef.current);
    returnTimerRef.current = window.setTimeout(() => {
      setDocked(true);
      setPosition(homePositionRef.current);
    }, 10000);
  }

  React.useEffect(() => {
    if (!dragging) return undefined;

    function handleMove(event) {
      setDocked(false);
      setPosition({
        x: Math.min(Math.max(8, event.clientX - dragOffsetRef.current.x), Math.max(8, window.innerWidth - bootSize - 8)),
        y: Math.min(Math.max(8, event.clientY - dragOffsetRef.current.y), Math.max(8, window.innerHeight - bootSize - 8)),
      });
    }

    function handleUp(event) {
      setDragging(false);
      const probeX = Math.min(window.innerWidth - 1, Math.max(0, event.clientX));
      const probeY = Math.min(window.innerHeight - 1, Math.max(0, event.clientY));
      const target = document.elementFromPoint(probeX, probeY)?.closest('[data-elk-guide]');
      if (target) {
        const key = target.getAttribute('data-elk-guide');
        if (key) onInspect(ELK_GUIDE_COPY[key] || 'This part helps you read the lab.');
      } else {
        onInspect('Drag me over a panel to learn what it does.');
      }
      scheduleReturnHome();
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragging, onInspect]);

  function handlePointerDown(event) {
    if (returnTimerRef.current) window.clearTimeout(returnTimerRef.current);
    setDragging(true);
    dragOffsetRef.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
  }

  return (
    <div
      className="pointer-events-none fixed z-50"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-end gap-3">
        <div
          className={cx(
            'max-w-[17rem] rounded-[1.5rem] border border-sky-300/20 bg-slate-950/78 px-4 py-3 text-sm leading-6 text-slate-100 shadow-[0_0_28px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all duration-500 motion-reduce:transition-none',
            activeText ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'
          )}
        >
          {activeText || 'Drag the boot over something to learn it.'}
        </div>
        <button
          type="button"
          aria-label="Drag boot guide"
          onPointerDown={handlePointerDown}
          className={cx(
            'pointer-events-auto flex h-[86px] w-[86px] items-center justify-center rounded-[2.25rem_2.25rem_1.25rem_2.5rem] border border-sky-300/25 bg-slate-950/88 text-3xl shadow-[0_0_32px_rgba(56,189,248,0.14)] backdrop-blur-xl transition duration-500 hover:shadow-[0_0_36px_rgba(56,189,248,0.22)] motion-reduce:transition-none',
            dragging ? 'scale-105 cursor-grabbing' : 'cursor-grab'
          )}
        >
          <span className="pointer-events-none select-none">🥾</span>
        </button>
      </div>
    </div>
  );
}

// ─── ELK Installation Lab ─────────────────────────────────────────────────

const ELK_LOGSTASH_CONFIG_TEXT = `input {
  file {
    path => "/path/to/your/logfile.log"
    start_position => "beginning"
  }
}
output {
  elasticsearch {
    hosts => ["localhost:9200"]
  }
  stdout { codec => rubydebug }
}`;

const ELK_ES_CLUSTER_JSON = {
  name: 'missionnext-node-1',
  cluster_name: 'missionnext-elk',
  cluster_uuid: 'a5n_6-lIS-2dJNsOHlBRug',
  version: {
    number: '7.12.1',
    build_flavor: 'default',
    build_type: 'deb',
    build_hash: '3186837139b9c6b6d23c3200870651f10d3343b7',
    build_date: '2021-04-20T20:56:39.040728659Z',
    build_snapshot: false,
    lucene_version: '8.8.0',
    minimum_wire_compatibility_version: '6.8.0',
    minimum_index_compatibility_version: '6.0.0-beta1',
  },
  tagline: 'You Know, for Search',
};

const ELK_FAKE_LOG_ROWS = [
  { ts: '2024-01-15 09:00:01', index: 'logstash-2024.01.15', severity: 'HIGH', asset: 'elk-02', status: 'OPEN',   message: 'Open security incident on elk-02'    },
  { ts: '2024-01-15 09:15:37', index: 'logstash-2024.01.15', severity: 'LOW',  asset: 'elk-01', status: 'CLOSED', message: 'Closed maintenance ticket on elk-01' },
];

const ELK_LAB_GROUPS = [
  {
    id: 1, title: 'Install Elasticsearch', exerciseNum: 1,
    commands: [
      { value: 'wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.12.1-amd64.deb',
        output: '--2024-01-15 09:00:01--  https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.12.1-amd64.deb\nResolving artifacts.elastic.co... 34.120.185.118\nConnecting to artifacts.elastic.co|34.120.185.118|:443... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 340893696 (325M) [application/x-deb]\nSaving to: \'elasticsearch-7.12.1-amd64.deb\'\n\nelasticsearch-7.12. 100%[===================>] 325.14M  18.2MB/s    in 17.9s\n\n2024-01-15 09:00:19 (18.2 MB/s) - \'elasticsearch-7.12.1-amd64.deb\' saved [340893696/340893696]' },
      { value: 'sudo dpkg -i elasticsearch-7.12.1-amd64.deb',
        output: 'Selecting previously unselected package elasticsearch.\n(Reading database ... 180423 files and directories currently installed.)\nPreparing to unpack elasticsearch-7.12.1-amd64.deb ...\nUnpacking elasticsearch (7.12.1) ...\nSetting up elasticsearch (7.12.1) ...\nCreating elasticsearch group... OK\nCreating elasticsearch user... OK' },
      { value: 'sudo systemctl start elasticsearch', output: '', trigger: 'es-started' },
      { value: 'sudo systemctl enable elasticsearch',
        output: 'Created symlink /etc/systemd/system/multi-user.target.wants/elasticsearch.service → /lib/systemd/system/elasticsearch.service.' },
    ],
  },
  {
    id: 2, title: 'Configure Logstash', exerciseNum: 2,
    commands: [
      { value: 'wget https://artifacts.elastic.co/downloads/logstash/logstash-7.12.1.deb',
        output: '--2024-01-15 09:05:00--  https://artifacts.elastic.co/downloads/logstash/logstash-7.12.1.deb\nResolving artifacts.elastic.co... 34.120.185.118\nConnecting to artifacts.elastic.co|34.120.185.118|:443... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 203448392 (194M) [application/x-deb]\nSaving to: \'logstash-7.12.1.deb\'\n\nlogstash-7.12.1.deb 100%[===================>] 194.02M  16.8MB/s    in 11.5s\n\n2024-01-15 09:05:12 (16.8 MB/s) - \'logstash-7.12.1.deb\' saved [203448392/203448392]' },
      { value: 'sudo dpkg -i logstash-7.12.1.deb',
        output: 'Selecting previously unselected package logstash.\n(Reading database ... 180564 files and directories currently installed.)\nPreparing to unpack logstash-7.12.1.deb ...\nUnpacking logstash (1:7.12.1-1) ...\nSetting up logstash (1:7.12.1-1) ...\nSuccessfully created system startup script for Logstash' },
      { value: 'sudo nano /etc/logstash/conf.d/logstash-simple.conf', pasteStep: true,
        output: '[File saved: /etc/logstash/conf.d/logstash-simple.conf]' },
      { value: 'sudo systemctl start logstash', output: '' },
      { value: 'sudo systemctl enable logstash',
        output: 'Created symlink /etc/systemd/system/multi-user.target.wants/logstash.service → /lib/systemd/system/logstash.service.' },
    ],
  },
  {
    id: 3, title: 'Install Kibana', exerciseNum: 3,
    commands: [
      { value: 'wget https://artifacts.elastic.co/downloads/kibana/kibana-7.12.1-amd64.deb',
        output: '--2024-01-15 09:15:00--  https://artifacts.elastic.co/downloads/kibana/kibana-7.12.1-amd64.deb\nResolving artifacts.elastic.co... 34.120.185.118\nConnecting to artifacts.elastic.co|34.120.185.118|:443... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: 281018712 (268M) [application/x-deb]\nSaving to: \'kibana-7.12.1-amd64.deb\'\n\nkibana-7.12.1-amd64 100%[===================>] 268.02M  17.4MB/s    in 15.4s\n\n2024-01-15 09:15:16 (17.4 MB/s) - \'kibana-7.12.1-amd64.deb\' saved [281018712/281018712]' },
      { value: 'sudo dpkg -i kibana-7.12.1-amd64.deb',
        output: 'Selecting previously unselected package kibana.\n(Reading database ... 180711 files and directories currently installed.)\nPreparing to unpack kibana-7.12.1-amd64.deb ...\nUnpacking kibana (7.12.1) ...\nSetting up kibana (7.12.1) ...' },
      { value: 'sudo systemctl start kibana', output: '', trigger: 'kibana-started' },
      { value: 'sudo systemctl enable kibana',
        output: 'Created symlink /etc/systemd/system/multi-user.target.wants/kibana.service → /lib/systemd/system/kibana.service.' },
    ],
  },
  {
    id: 4, title: 'Ingest Log Data', exerciseNum: 4,
    commands: [
      { value: 'sudo tail -f /var/log/logstash/logstash-plain.log',
        output: '[2024-01-15T09:20:01,112][INFO ][logstash.runner          ] Starting Logstash {"logstash.version"=>"7.12.1"}\n[2024-01-15T09:20:02,445][INFO ][logstash.outputs.elasticsearch] Elasticsearch pool URLs updated {:changes=>{:removed=>[], :added=>[http://localhost:9200/]}}\n[2024-01-15T09:20:03,891][INFO ][logstash.pipeline.pipeline] Pipeline started {"pipeline.id"=>"main"}\n[2024-01-15T09:20:04,881][INFO ][logstash.outputs.elasticsearch] Bulk indexing completed {:count=>2, :index=>"logstash-2024.01.15"}\n^C\n[2024-01-15T09:20:10,001][INFO ][logstash.agent           ] Stopping Logstash' },
      { value: 'curl -X GET "localhost:9200/_cat/indices?v"',
        output: 'health status index               uuid                   pri rep docs.count docs.deleted store.size pri.store.size\ngreen  open   logstash-2024.01.15 XkNbO3L8RKqEzuqbAtgsPw   1   0          2            0      8.4kb          8.4kb' },
    ],
  },
];

// ─── Fake browser chrome wrapper ──────────────────────────────────────────

function ElkBrowserChrome({ url, children }) {
  return (
    <div style={{ border: '1px solid #343741', borderRadius: 8, overflow: 'hidden', background: '#1a1d23', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#111216', borderBottom: '1px solid #343741', padding: '8px 12px', userSelect: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#69707d', fontSize: 14, cursor: 'default' }}>‹</span>
          <span style={{ color: '#69707d', fontSize: 14, cursor: 'default' }}>›</span>
          <span style={{ color: '#69707d', fontSize: 13, cursor: 'default' }}>↻</span>
          <div style={{ flex: 1, background: '#1a1d23', border: '1px solid #343741', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#dfe5ef', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#69707d', fontSize: 10 }}>🔒</span>
            <span>{url}</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </div>
  );
}

// ─── Elasticsearch JSON browser ──────────────────────────────────────────

function FakeElasticSearchBrowser() {
  const lines = JSON.stringify(ELK_ES_CLUSTER_JSON, null, 2).split('\n');
  return (
    <div style={{ background: '#1e1e1e', padding: '16px', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.8, color: '#d4d4d4', minHeight: 260 }}>
      {lines.map((line, i) => {
        const colored = line
          .replace(/("[\w@_-]+")\s*:/g, '<span style="color:#9cdcfe">$1</span>:')
          .replace(/:\s*(".*?")/g, ': <span style="color:#ce9178">$1</span>')
          .replace(/:\s*(true|false|null)/g, ': <span style="color:#569cd6">$1</span>')
          .replace(/:\s*(-?\d[\d.]*)/g, ': <span style="color:#b5cea8">$1</span>');
        return <div key={i} dangerouslySetInnerHTML={{ __html: colored || ' ' }} />;
      })}
    </div>
  );
}

// ─── Kibana sidebar ──────────────────────────────────────────────────────

const KIBANA_NAV = [
  { id: 'home',       icon: '⌂',  label: 'Home' },
  { id: 'discover',   icon: '◎',  label: 'Discover' },
  { id: 'visualize',  icon: '▣',  label: 'Visualize Library' },
  { id: 'dashboard',  icon: '▦',  label: 'Dashboard' },
  null,
  { id: 'management', icon: '⚙',  label: 'Stack Management' },
];

function KibanaSidebar({ active, onNav }) {
  return (
    <div style={{ width: 48, minWidth: 48, background: '#141519', borderRight: '1px solid #343741', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }}>
      <div onClick={() => onNav('home')} title="Kibana"
        style={{ width: 28, height: 28, borderRadius: 6, background: '#F04E98', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, cursor: 'pointer', flexShrink: 0 }}>
        <span style={{ color: 'white', fontSize: 14, fontWeight: 'bold', fontFamily: 'serif', fontStyle: 'italic' }}>e</span>
      </div>
      <div style={{ width: 28, height: 1, background: '#343741', marginBottom: 6 }} />
      {KIBANA_NAV.map((item, i) => {
        if (!item) return <div key={i} style={{ width: 28, height: 1, background: '#343741', margin: '6px 0' }} />;
        const isActive = active === item.id;
        return (
          <button key={item.id} onClick={() => onNav(item.id)} title={item.label}
            style={{ width: 36, height: 36, borderRadius: 6, border: 'none', background: isActive ? 'rgba(0,107,180,0.18)' : 'transparent',
              color: isActive ? '#006bb4' : '#69707d', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16, boxShadow: isActive ? 'inset 2px 0 0 #006bb4' : 'none',
              marginBottom: 2, transition: 'all 0.12s' }}>
            {item.icon}
          </button>
        );
      })}
    </div>
  );
}

function KibanaTopBar({ breadcrumbs }) {
  return (
    <div style={{ height: 48, minHeight: 48, background: '#1a1d23', borderBottom: '1px solid #343741', display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, flexWrap: 'wrap' }}>
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: '#343741' }}> › </span>}
            <span style={{ color: i === breadcrumbs.length - 1 ? '#dfe5ef' : '#69707d' }}>{crumb}</span>
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ border: '1px solid #343741', borderRadius: 4, padding: '4px 10px', fontSize: 11, color: '#98a2b3', display: 'flex', alignItems: 'center', gap: 5, cursor: 'default', whiteSpace: 'nowrap' }}>
          ⏱ Last 15 minutes ▾
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#006bb4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', cursor: 'default', flexShrink: 0 }}>A</div>
      </div>
    </div>
  );
}

// ─── Kibana views ────────────────────────────────────────────────────────

function KibanaHomeView({ onNav }) {
  const cards = [
    { id: 'discover',   icon: '◎', label: 'Discover',   desc: 'Explore and search your log data',  color: '#006bb4' },
    { id: 'visualize',  icon: '▣', label: 'Visualize',  desc: 'Build charts and metrics',           color: '#017d73' },
    { id: 'dashboard',  icon: '▦', label: 'Dashboard',  desc: 'Combine visualizations into views',  color: '#F04E98' },
    { id: 'management', icon: '⚙', label: 'Manage',     desc: 'Configure index patterns & more',    color: '#FEC514' },
  ];
  return (
    <div style={{ padding: '32px 28px', color: '#dfe5ef' }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, marginBottom: 6 }}>Welcome to Kibana</h1>
      <p style={{ color: '#69707d', marginBottom: 28, fontSize: 14 }}>Your window into the Elastic Stack</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
        {cards.map(c => (
          <button key={c.id} onClick={() => onNav(c.id)}
            style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 8, padding: '18px 14px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.12s' }}
            onMouseOver={e => e.currentTarget.style.borderColor = c.color}
            onMouseOut={e => e.currentTarget.style.borderColor = '#343741'}>
            <div style={{ fontSize: 22, color: c.color, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#dfe5ef', marginBottom: 3 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: '#69707d', lineHeight: 1.5 }}>{c.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 8, padding: '16px 20px' }}>
        <div style={{ fontSize: 11, color: '#69707d', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Stack Status</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[['Elasticsearch','7.12.1'],['Kibana','7.12.1'],['Logstash','7.12.1']].map(([name, ver]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#017d73' }} />
              <span style={{ fontSize: 13, color: '#dfe5ef' }}>{name}</span>
              <span style={{ fontSize: 11, color: '#69707d' }}>{ver}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KibanaDiscoverView({ indexPatternCreated, filters, setFilters, onVisit }) {
  React.useEffect(() => { if (indexPatternCreated) onVisit(); }, [indexPatternCreated]);
  const filteredRows = indexPatternCreated
    ? (filters.length ? ELK_FAKE_LOG_ROWS.filter(r => filters.every(f => r[f.field] === f.value)) : ELK_FAKE_LOG_ROWS)
    : [];
  const kql = filters.map(f => `${f.field}: "${f.value}"`).join(' AND ');

  if (!indexPatternCreated) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#69707d' }}>
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.25 }}>◎</div>
        <div style={{ fontSize: 15, color: '#dfe5ef', marginBottom: 6 }}>No index pattern</div>
        <div style={{ fontSize: 12 }}>Go to Stack Management → Index Patterns to create one.</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #343741', background: '#111216', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, background: '#1a1d23', border: '1px solid #343741', borderRadius: 4, padding: '7px 12px', fontFamily: 'monospace', fontSize: 12, color: kql ? '#dfe5ef' : '#69707d', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#98a2b3', fontSize: 10 }}>KQL</span>
            <span>{kql || 'Search (e.g. severity: "HIGH")'}</span>
          </div>
          {filters.length > 0 && (
            <button onClick={() => setFilters([])} style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 4, padding: '7px 10px', color: '#dfe5ef', fontSize: 11, cursor: 'pointer' }}>Clear</button>
          )}
        </div>
        {filters.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {filters.map(f => (
              <button key={`${f.field}-${f.value}`}
                onClick={() => setFilters(p => p.filter(x => !(x.field === f.field && x.value === f.value)))}
                style={{ background: '#006bb4', border: 'none', borderRadius: 20, padding: '2px 10px', color: 'white', fontSize: 11, cursor: 'pointer' }}>
                {f.field}: "{f.value}" ×
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width: 180, minWidth: 180, borderRight: '1px solid #343741', padding: 12, overflowY: 'auto', background: '#111216', flexShrink: 0 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#69707d', marginBottom: 10 }}>Available Fields</div>
          {['severity','asset','status','message','@timestamp','_index'].map(f => (
            <div key={f} style={{ padding: '5px 0', borderBottom: '1px solid #1a1d23', fontSize: 11, color: '#dfe5ef', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
              <span>{f}</span><span style={{ color: '#69707d' }}>t</span>
            </div>
          ))}
          <div style={{ marginTop: 14, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#69707d', marginBottom: 8 }}>Quick Filters</div>
          {[{field:'severity',value:'HIGH'},{field:'severity',value:'LOW'},{field:'status',value:'OPEN'},{field:'status',value:'CLOSED'}].map(f => {
            const active = filters.some(x => x.field === f.field && x.value === f.value);
            return (
              <button key={`${f.field}-${f.value}`}
                onClick={() => setFilters(p => active ? p.filter(x => !(x.field === f.field && x.value === f.value)) : [...p, f])}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: active ? 'rgba(0,107,180,0.15)' : 'transparent', border: `1px solid ${active ? '#006bb4' : '#343741'}`, borderRadius: 4, padding: '4px 7px', marginBottom: 3, color: active ? '#006bb4' : '#98a2b3', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' }}>
                {f.field}: {f.value}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 6, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#69707d', marginBottom: 10 }}>
              <span>Count</span><span>{filteredRows.length} hits</span>
            </div>
            <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              {Array.from({ length: 24 }, (_, i) => {
                const hasDoc = (i === 9 && filteredRows.some(r => r.severity === 'HIGH')) || (i === 15 && filteredRows.some(r => r.severity === 'LOW'));
                return <div key={i} style={{ flex: 1, background: hasDoc ? '#006bb4' : '#343741', borderRadius: '1px 1px 0 0', height: hasDoc ? (i === 9 ? '90%' : '60%') : '8%' }} />;
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#69707d' }}>
              <span>09:00:00</span><span>09:15:00</span>
            </div>
          </div>
          <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#1a1d23', borderBottom: '1px solid #343741' }}>
                  <th style={{ padding: '7px 10px', textAlign: 'left', color: '#69707d', fontWeight: 400, textTransform: 'uppercase', letterSpacing: 1, width: 130 }}>@timestamp</th>
                  <th style={{ padding: '7px 10px', textAlign: 'left', color: '#69707d', fontWeight: 400, textTransform: 'uppercase', letterSpacing: 1 }}>_source</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length > 0 ? filteredRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1a1d23' }}>
                    <td style={{ padding: '8px 10px', color: '#69707d', fontFamily: 'monospace', fontSize: 10, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{row.ts}</td>
                    <td style={{ padding: '8px 10px', color: '#dfe5ef', verticalAlign: 'top', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7 }}>
                      <span style={{ color: '#69707d' }}>severity: </span>
                      <span style={{ color: row.severity === 'HIGH' ? '#f66' : '#7ec8e3' }}>{row.severity}</span>
                      <span style={{ color: '#69707d' }}> asset: </span><span>{row.asset}</span>
                      <span style={{ color: '#69707d' }}> status: </span>
                      <span style={{ color: row.status === 'OPEN' ? '#017d73' : '#69707d' }}>{row.status}</span>
                      <span style={{ color: '#69707d' }}> </span><span style={{ color: '#98a2b3' }}>{row.message}</span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={2} style={{ padding: 20, textAlign: 'center', color: '#69707d' }}>No results match your search criteria.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function KibanaManagementView({ indexPatternCreated, setIndexPatternCreated, indexPatternStep, setIndexPatternStep, onNav }) {
  const [patternInput, setPatternInput] = React.useState('logstash-*');
  const s = { color: '#dfe5ef' };

  if (indexPatternCreated) {
    return (
      <div style={{ padding: '22px 26px', ...s }}>
        <div style={{ fontSize: 11, color: '#69707d', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Stack Management › Kibana › Index Patterns</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 400 }}>Index Patterns</h1>
          <button style={{ background: '#006bb4', border: 'none', borderRadius: 4, padding: '7px 14px', color: 'white', fontSize: 13, cursor: 'pointer' }}>Create index pattern</button>
        </div>
        <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #343741', display: 'grid', gridTemplateColumns: '1fr auto' }}>
            <span style={{ fontSize: 11, color: '#69707d', textTransform: 'uppercase', letterSpacing: 1 }}>Pattern</span>
            <span style={{ fontSize: 11, color: '#69707d', textTransform: 'uppercase', letterSpacing: 1 }}>Last updated</span>
          </div>
          <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, color: '#006bb4', fontFamily: 'monospace', marginBottom: 3 }}>logstash-*</div>
              <div style={{ fontSize: 11, color: '#69707d' }}>Time field: @timestamp · 6 fields · 2 documents</div>
            </div>
            <span style={{ fontSize: 11, color: '#69707d' }}>Just now</span>
          </div>
        </div>
        <button onClick={() => onNav('discover')} style={{ marginTop: 16, background: '#006bb4', border: 'none', borderRadius: 4, padding: '8px 16px', color: 'white', fontSize: 13, cursor: 'pointer' }}>
          Explore in Discover →
        </button>
      </div>
    );
  }

  if (indexPatternStep === 0) {
    return (
      <div style={{ padding: '22px 26px', ...s }}>
        <div style={{ fontSize: 11, color: '#69707d', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Stack Management › Kibana › Index Patterns</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 400 }}>Index Patterns</h1>
          <button onClick={() => setIndexPatternStep(1)} style={{ background: '#006bb4', border: 'none', borderRadius: 4, padding: '7px 14px', color: 'white', fontSize: 13, cursor: 'pointer' }}>Create index pattern</button>
        </div>
        <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, opacity: 0.2, marginBottom: 10 }}>◎</div>
          <div style={{ fontSize: 14, color: '#dfe5ef', marginBottom: 6 }}>No index patterns</div>
          <div style={{ fontSize: 12, color: '#69707d' }}>Create an index pattern to start searching your data.</div>
        </div>
      </div>
    );
  }

  if (indexPatternStep === 1) {
    const matchesWildcard = patternInput.includes('*');
    const hasLogstash = patternInput.toLowerCase().includes('logstash');
    return (
      <div style={{ padding: '22px 26px', ...s }}>
        <div style={{ fontSize: 11, color: '#69707d', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Stack Management › Kibana › Index Patterns › Create</div>
        <h1 style={{ fontSize: 20, fontWeight: 400, marginBottom: 6 }}>Create index pattern</h1>
        <p style={{ fontSize: 12, color: '#69707d', marginBottom: 20 }}>An index pattern can match a single source, or include a wildcard (*) to match multiple data sources.</p>
        <div style={{ display: 'flex', marginBottom: 24 }}>
          {['Step 1: Define an index pattern', 'Step 2: Configure settings'].map((label, i) => (
            <div key={i} style={{ flex: 1, padding: '9px 14px', background: i === 0 ? '#006bb4' : '#25272e', color: i === 0 ? 'white' : '#69707d', fontSize: 11, borderBottom: i === 0 ? '3px solid #006bb4' : '3px solid #343741', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: i === 0 ? 'rgba(255,255,255,0.2)' : '#343741', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>{i + 1}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#dfe5ef', marginBottom: 6 }}>
            Index pattern name <span style={{ color: '#bd271e' }}>*</span>
          </label>
          <input value={patternInput} onChange={e => setPatternInput(e.target.value)}
            style={{ width: '100%', background: '#1a1d23', border: '1px solid #343741', borderRadius: 4, padding: '9px 12px', fontSize: 13, color: '#dfe5ef', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
            placeholder="logstash-*" />
          <div style={{ marginTop: 10, fontSize: 11 }}>
            {matchesWildcard && hasLogstash
              ? <span style={{ color: '#017d73' }}>✓ Your index pattern matches 1 source.</span>
              : <span style={{ color: '#69707d' }}>Use a wildcard (*) to match multiple indices, e.g. logstash-*</span>}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => { if (matchesWildcard) setIndexPatternStep(2); }}
            style={{ background: matchesWildcard ? '#006bb4' : '#25272e', border: 'none', borderRadius: 4, padding: '8px 18px', color: matchesWildcard ? 'white' : '#69707d', fontSize: 13, cursor: matchesWildcard ? 'pointer' : 'not-allowed' }}>
            Next step →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '22px 26px', ...s }}>
      <div style={{ fontSize: 11, color: '#69707d', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Stack Management › Kibana › Index Patterns › Create</div>
      <h1 style={{ fontSize: 20, fontWeight: 400, marginBottom: 20 }}>Create index pattern</h1>
      <div style={{ display: 'flex', marginBottom: 24 }}>
        {['Step 1: Define an index pattern', 'Step 2: Configure settings'].map((label, i) => (
          <div key={i} style={{ flex: 1, padding: '9px 14px', background: i === 1 ? '#006bb4' : '#25272e', color: i === 1 ? 'white' : '#69707d', fontSize: 11, borderBottom: i === 1 ? '3px solid #006bb4' : '3px solid #343741', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: i === 1 ? 'rgba(255,255,255,0.2)' : '#343741', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>{i + 1}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#dfe5ef', marginBottom: 4 }}>Index pattern: <span style={{ fontFamily: 'monospace', color: '#006bb4' }}>logstash-*</span></div>
        <div style={{ fontSize: 11, color: '#69707d', marginBottom: 18 }}>1 source matches your index pattern.</div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#dfe5ef', marginBottom: 6 }}>Time field</label>
        <select style={{ width: '100%', background: '#1a1d23', border: '1px solid #343741', borderRadius: 4, padding: '9px 12px', fontSize: 13, color: '#dfe5ef', cursor: 'pointer', outline: 'none' }}>
          <option value="@timestamp">@timestamp</option>
        </select>
        <div style={{ fontSize: 11, color: '#69707d', marginTop: 8 }}>Select the time field for this index pattern.</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => setIndexPatternStep(1)} style={{ background: 'transparent', border: '1px solid #343741', borderRadius: 4, padding: '8px 14px', color: '#dfe5ef', fontSize: 13, cursor: 'pointer' }}>← Previous step</button>
        <button onClick={() => { setIndexPatternCreated(true); }}
          style={{ background: '#006bb4', border: 'none', borderRadius: 4, padding: '8px 18px', color: 'white', fontSize: 13, cursor: 'pointer' }}>
          Create index pattern
        </button>
      </div>
    </div>
  );
}

function KibanaVisualizeView({ savedViz, setSavedViz, indexPatternCreated }) {
  const [creating, setCreating] = React.useState(false);
  const [vizStep, setVizStep] = React.useState(0);

  if (!indexPatternCreated) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#69707d' }}>
        <div style={{ fontSize: 36, opacity: 0.2, marginBottom: 10 }}>▣</div>
        <div style={{ fontSize: 14, color: '#dfe5ef', marginBottom: 5 }}>No index pattern</div>
        <div style={{ fontSize: 12 }}>Create an index pattern in Stack Management first.</div>
      </div>
    );
  }

  if (savedViz && !creating) {
    return (
      <div style={{ padding: '22px 26px', color: '#dfe5ef' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 400 }}>Visualize Library</h1>
          <button onClick={() => { setCreating(true); setVizStep(0); }} style={{ background: '#006bb4', border: 'none', borderRadius: 4, padding: '7px 14px', color: 'white', fontSize: 13, cursor: 'pointer' }}>Create visualization</button>
        </div>
        <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, background: '#1a1d23', border: '1px solid #343741', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📊</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{savedViz.name}</div>
            <div style={{ fontSize: 11, color: '#69707d' }}>Bar chart · logstash-* · Created just now</div>
          </div>
        </div>
      </div>
    );
  }

  if (!creating) {
    return (
      <div style={{ padding: '22px 26px', color: '#dfe5ef' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 400 }}>Visualize Library</h1>
          <button onClick={() => setCreating(true)} style={{ background: '#006bb4', border: 'none', borderRadius: 4, padding: '7px 14px', color: 'white', fontSize: 13, cursor: 'pointer' }}>Create visualization</button>
        </div>
        <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 8, padding: '36px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, opacity: 0.2, marginBottom: 10 }}>▣</div>
          <div style={{ fontSize: 14, color: '#dfe5ef', marginBottom: 5 }}>No visualizations yet</div>
          <div style={{ fontSize: 12, color: '#69707d' }}>Create a visualization to start analyzing your data.</div>
        </div>
      </div>
    );
  }

  if (vizStep === 0) {
    const types = [
      { id: 'bar', icon: '📊', label: 'Bar', desc: 'Compare values across categories' },
      { id: 'line', icon: '📈', label: 'Line', desc: 'Track changes over time' },
      { id: 'pie', icon: '🥧', label: 'Pie', desc: 'Parts of a whole' },
      { id: 'metric', icon: '🔢', label: 'Metric', desc: 'Single number display' },
      { id: 'table', icon: '📋', label: 'Data Table', desc: 'Tabular data view' },
      { id: 'heatmap', icon: '🌡', label: 'Heat map', desc: 'Matrix of values' },
    ];
    return (
      <div style={{ padding: '22px 26px', color: '#dfe5ef' }}>
        <h1 style={{ fontSize: 20, fontWeight: 400, marginBottom: 6 }}>New visualization</h1>
        <p style={{ fontSize: 12, color: '#69707d', marginBottom: 20 }}>Select a visualization type to get started.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {types.map(t => (
            <button key={t.id} onClick={() => setVizStep(1)}
              style={{ background: '#25272e', border: '2px solid #343741', borderRadius: 8, padding: '14px 12px', textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.12s' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#006bb4'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#343741'}>
              <div style={{ fontSize: 20, marginBottom: 7 }}>{t.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#dfe5ef', marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: '#69707d' }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '22px 26px', color: '#dfe5ef' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => setVizStep(0)} style={{ background: 'transparent', border: '1px solid #343741', borderRadius: 4, padding: '5px 10px', color: '#dfe5ef', fontSize: 12, cursor: 'pointer' }}>← Back</button>
        <h1 style={{ fontSize: 20, fontWeight: 400 }}>Configure Bar chart</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 14 }}>
        <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#69707d', marginBottom: 14 }}>Data</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#dfe5ef', marginBottom: 6 }}>Metrics · Y-axis</div>
            <div style={{ background: '#1a1d23', border: '1px solid #343741', borderRadius: 4, padding: '7px 10px', fontSize: 11, color: '#006bb4', fontFamily: 'monospace' }}>Count</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#dfe5ef', marginBottom: 6 }}>Buckets · X-axis</div>
            <div style={{ background: '#1a1d23', border: '1px solid #343741', borderRadius: 4, padding: '7px 10px', fontSize: 11, color: '#006bb4', fontFamily: 'monospace' }}>Terms · severity</div>
            <div style={{ marginTop: 6, fontSize: 11, color: '#69707d' }}>Order: Descending · Size: 5</div>
          </div>
        </div>
        <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#69707d', marginBottom: 14 }}>Preview</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, height: 140, padding: '0 20px' }}>
            {[['HIGH', 110], ['LOW', 70]].map(([label, h]) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ background: '#006bb4', width: '55%', height: h, borderRadius: '4px 4px 0 0' }} />
                <div style={{ fontSize: 11, color: '#dfe5ef' }}>{label}</div>
                <div style={{ fontSize: 10, color: '#69707d' }}>1</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={() => { setSavedViz({ name: 'Severity Distribution', type: 'bar' }); setCreating(false); }}
              style={{ background: '#006bb4', border: 'none', borderRadius: 4, padding: '8px 16px', color: 'white', fontSize: 13, cursor: 'pointer' }}>
              Save visualization
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KibanaDashboardView({ savedViz, savedDashboard, setSavedDashboard, indexPatternCreated }) {
  const [creating, setCreating] = React.useState(false);

  if (!indexPatternCreated) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#69707d' }}>
        <div style={{ fontSize: 36, opacity: 0.2, marginBottom: 10 }}>▦</div>
        <div style={{ fontSize: 14, color: '#dfe5ef', marginBottom: 5 }}>No index pattern</div>
        <div style={{ fontSize: 12 }}>Create an index pattern in Stack Management first.</div>
      </div>
    );
  }

  if (savedDashboard) {
    return (
      <div style={{ padding: '22px 26px', color: '#dfe5ef' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 400 }}>Dashboards</h1>
          <button style={{ background: '#006bb4', border: 'none', borderRadius: 4, padding: '7px 14px', color: 'white', fontSize: 13, cursor: 'pointer' }}>Create dashboard</button>
        </div>
        <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, background: '#1a1d23', border: '1px solid #343741', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▦</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{savedDashboard.name}</div>
            <div style={{ fontSize: 11, color: '#69707d' }}>1 panel · logstash-* · Created just now</div>
          </div>
        </div>
        <div style={{ background: '#1a1d23', border: '1px solid #343741', borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 12, color: '#69707d' }}>
            <span>{savedDashboard.name}</span><span>Last 15 minutes</span>
          </div>
          <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 6, padding: 14 }}>
            <div style={{ fontSize: 11, color: '#69707d', marginBottom: 10 }}>Severity Distribution</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 80 }}>
              {[['HIGH',60],['LOW',40]].map(([l,h]) => (
                <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ background: '#006bb4', width: '50%', height: h, borderRadius: '3px 3px 0 0' }} />
                  <div style={{ fontSize: 10, color: '#dfe5ef' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (creating) {
    return (
      <div style={{ padding: '22px 26px', color: '#dfe5ef' }}>
        <h1 style={{ fontSize: 20, fontWeight: 400, marginBottom: 6 }}>Create dashboard</h1>
        <p style={{ fontSize: 12, color: '#69707d', marginBottom: 20 }}>Add panels to build your dashboard.</p>
        <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 8, padding: 20, minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          {savedViz ? (
            <div style={{ width: '100%', background: '#1a1d23', border: '1px solid #006bb4', borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#69707d', marginBottom: 10 }}>{savedViz.name}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 60 }}>
                {[['HIGH',50],['LOW',30]].map(([l,h]) => (
                  <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ background: '#006bb4', width: '45%', height: h, borderRadius: '2px 2px 0 0' }} />
                    <div style={{ fontSize: 9, color: '#dfe5ef' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#69707d', fontSize: 12 }}>
              <div style={{ marginBottom: 6 }}>No panels yet.</div>
              <div>Create a visualization in the Visualize Library first.</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setCreating(false)} style={{ background: 'transparent', border: '1px solid #343741', borderRadius: 4, padding: '8px 14px', color: '#dfe5ef', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          {savedViz && (
            <button onClick={() => { setSavedDashboard({ name: 'Security Overview' }); setCreating(false); }}
              style={{ background: '#006bb4', border: 'none', borderRadius: 4, padding: '8px 16px', color: 'white', fontSize: 13, cursor: 'pointer' }}>
              Save dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '22px 26px', color: '#dfe5ef' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 400 }}>Dashboards</h1>
        <button onClick={() => setCreating(true)} style={{ background: '#006bb4', border: 'none', borderRadius: 4, padding: '7px 14px', color: 'white', fontSize: 13, cursor: 'pointer' }}>Create dashboard</button>
      </div>
      <div style={{ background: '#25272e', border: '1px solid #343741', borderRadius: 8, padding: '36px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, opacity: 0.2, marginBottom: 10 }}>▦</div>
        <div style={{ fontSize: 14, color: '#dfe5ef', marginBottom: 5 }}>No dashboards yet</div>
        <div style={{ fontSize: 12, color: '#69707d' }}>Combine your visualizations into a dashboard.</div>
      </div>
    </div>
  );
}

function FakeKibanaUI({ kibanaNav, setKibanaNav, indexPatternCreated, setIndexPatternCreated, indexPatternStep, setIndexPatternStep, kibanaFilters, setKibanaFilters, savedViz, setSavedViz, savedDashboard, setSavedDashboard, onDiscoverVisit }) {
  const breadcrumbMap = {
    home: ['Kibana'],
    discover: ['Kibana', 'Discover'],
    visualize: ['Kibana', 'Visualize Library'],
    dashboard: ['Kibana', 'Dashboard'],
    management: ['Stack Management', 'Index Patterns'],
  };
  const renderView = () => {
    switch (kibanaNav) {
      case 'home':       return <KibanaHomeView onNav={setKibanaNav} />;
      case 'discover':   return <KibanaDiscoverView indexPatternCreated={indexPatternCreated} filters={kibanaFilters} setFilters={setKibanaFilters} onVisit={onDiscoverVisit} />;
      case 'visualize':  return <KibanaVisualizeView savedViz={savedViz} setSavedViz={setSavedViz} indexPatternCreated={indexPatternCreated} />;
      case 'dashboard':  return <KibanaDashboardView savedViz={savedViz} savedDashboard={savedDashboard} setSavedDashboard={setSavedDashboard} indexPatternCreated={indexPatternCreated} />;
      case 'management': return <KibanaManagementView indexPatternCreated={indexPatternCreated} setIndexPatternCreated={setIndexPatternCreated} indexPatternStep={indexPatternStep} setIndexPatternStep={setIndexPatternStep} onNav={setKibanaNav} />;
      default:           return null;
    }
  };
  return (
    <div style={{ display: 'flex', height: '100%', background: '#1a1d23', minHeight: 0 }}>
      <KibanaSidebar active={kibanaNav} onNav={setKibanaNav} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <KibanaTopBar breadcrumbs={breadcrumbMap[kibanaNav] || ['Kibana']} />
        <div style={{ flex: 1, overflow: 'auto' }}>{renderView()}</div>
      </div>
    </div>
  );
}

// ─── Main ELK lab component ───────────────────────────────────────────────

function ElkTrainingLab({ onBack }) {
  const [history, setHistory] = React.useState(() => [
    { type: 'system', text: 'ELK Stack Lab — Ubuntu 20.04 LTS (simulated)' },
    { type: 'system', text: 'Type the exact commands shown in the hint panel below. Press ↑/↓ for history.' },
    { type: 'system', text: '' },
  ]);
  const [input, setInput] = React.useState('');
  const [submittedCommands, setSubmittedCommands] = React.useState([]);
  const [historyIdx, setHistoryIdx] = React.useState(-1);
  const [groupIdx, setGroupIdx] = React.useState(0);
  const [cmdIdx, setCmdIdx] = React.useState(0);
  const [completedGroups, setCompletedGroups] = React.useState([]);
  const [wrongPulse, setWrongPulse] = React.useState(false);
  const [successPulse, setSuccessPulse] = React.useState(false);

  const [nanoMode, setNanoMode] = React.useState(false);
  const [nanoPasted, setNanoPasted] = React.useState(false);

  const [esRunning, setEsRunning] = React.useState(false);
  const [kibanaRunning, setKibanaRunning] = React.useState(false);
  const [activeBrowser, setActiveBrowser] = React.useState(null);

  const [kibanaNav, setKibanaNav] = React.useState('home');
  const [indexPatternCreated, setIndexPatternCreated] = React.useState(false);
  const [indexPatternStep, setIndexPatternStep] = React.useState(0);
  const [kibanaFilters, setKibanaFilters] = React.useState([]);
  const [savedViz, setSavedViz] = React.useState(null);
  const [savedDashboard, setSavedDashboard] = React.useState(null);
  const [discoverVisited, setDiscoverVisited] = React.useState(false);

  const termScrollRef = React.useRef(null);
  const termInputRef = React.useRef(null);

  const activeGroup = ELK_LAB_GROUPS[groupIdx] || null;
  const activeCmd = activeGroup?.commands[cmdIdx] || null;
  const allTermDone = completedGroups.length === ELK_LAB_GROUPS.length;
  const ex5Steps = [indexPatternCreated, discoverVisited, !!savedViz, !!savedDashboard];
  const ex5Done = ex5Steps.every(Boolean);

  React.useEffect(() => { termInputRef.current?.focus(); }, []);
  React.useEffect(() => {
    const node = termScrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [history, nanoMode]);

  function norm(v) { return v.trim().replace(/\s+/g, ' '); }

  function applyTrigger(trigger) {
    if (trigger === 'es-started')      { setEsRunning(true);     setActiveBrowser('es'); }
    if (trigger === 'kibana-started')  { setKibanaRunning(true); setActiveBrowser('kibana'); }
  }

  function finishGroup(nextHistory, cmd) {
    const nextCompleted = [...completedGroups, activeGroup.id];
    nextHistory.push({ type: 'success', text: `✓ Exercise ${activeGroup.exerciseNum} complete.` });
    setCompletedGroups(nextCompleted);
    if (groupIdx < ELK_LAB_GROUPS.length - 1) {
      setGroupIdx(groupIdx + 1);
      setCmdIdx(0);
    } else {
      nextHistory.push({ type: 'success', text: '✓ Terminal exercises done. Use the Kibana browser on the right to complete Exercise 5.' });
    }
  }

  function acceptCmd(raw, cmd) {
    const nextHistory = [...history, { type: 'command', text: raw }];
    if (cmd.output) nextHistory.push({ type: 'output', text: cmd.output });
    if (cmd.trigger) applyTrigger(cmd.trigger);
    const finishing = cmdIdx === activeGroup.commands.length - 1;
    setHistory(finishing ? (() => { finishGroup(nextHistory, cmd); return nextHistory; })() : [...nextHistory]);
    if (!finishing) {
      setHistory([...nextHistory]);
      setCmdIdx(cmdIdx + 1);
    }
    setSubmittedCommands(p => [raw, ...p.filter(x => x !== raw)].slice(0, 30));
    setHistoryIdx(-1); setInput('');
    setSuccessPulse(true); window.setTimeout(() => setSuccessPulse(false), 420);
  }

  function rejectCmd(raw) {
    setHistory(p => [...p, { type: 'command', text: raw }, { type: 'error', text: 'Incorrect command. Check the hint and try again.' }]);
    setSubmittedCommands(p => [raw, ...p.filter(x => x !== raw)].slice(0, 30));
    setHistoryIdx(-1); setInput('');
    setWrongPulse(true); window.setTimeout(() => setWrongPulse(false), 420);
  }

  function submitCmd() {
    const raw = input.trim();
    if (!raw || !activeCmd) return;
    if (activeCmd.pasteStep) {
      if (norm(raw) === norm(activeCmd.value)) {
        setHistory(p => [...p, { type: 'command', text: raw }]);
        setSubmittedCommands(p => [raw, ...p.filter(x => x !== raw)].slice(0, 30));
        setHistoryIdx(-1); setInput('');
        setNanoMode(true); setNanoPasted(false);
        setSuccessPulse(true); window.setTimeout(() => setSuccessPulse(false), 420);
      } else { rejectCmd(raw); }
      return;
    }
    if (norm(raw) === norm(activeCmd.value)) { acceptCmd(raw, activeCmd); }
    else { rejectCmd(raw); }
  }

  function completePasteStep() {
    const cmd = activeCmd;
    const nextHistory = [...history, { type: 'output', text: cmd.output }];
    const finishing = cmdIdx === activeGroup.commands.length - 1;
    setNanoMode(false); setNanoPasted(false);
    if (finishing) { finishGroup(nextHistory, cmd); setHistory([...nextHistory]); }
    else { setHistory([...nextHistory]); setCmdIdx(cmdIdx + 1); }
    setSuccessPulse(true); window.setTimeout(() => setSuccessPulse(false), 420);
    window.setTimeout(() => termInputRef.current?.focus(), 80);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); submitCmd(); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(historyIdx + 1, submittedCommands.length - 1);
      setHistoryIdx(next); setInput(submittedCommands[next] || ''); return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(historyIdx - 1, -1);
      setHistoryIdx(next); setInput(next === -1 ? '' : (submittedCommands[next] || ''));
    }
  }

  function resetLab() {
    setHistory([{ type: 'system', text: 'Lab reset.' }, { type: 'system', text: '' }]);
    setInput(''); setSubmittedCommands([]); setHistoryIdx(-1);
    setGroupIdx(0); setCmdIdx(0); setCompletedGroups([]);
    setNanoMode(false); setNanoPasted(false);
    setEsRunning(false); setKibanaRunning(false); setActiveBrowser(null);
    setKibanaNav('home'); setIndexPatternCreated(false); setIndexPatternStep(0);
    setKibanaFilters([]); setSavedViz(null); setSavedDashboard(null); setDiscoverVisited(false);
    window.setTimeout(() => termInputRef.current?.focus(), 80);
  }

  const exercises = [
    { num: 1, title: 'Install Elasticsearch', done: completedGroups.includes(1), active: groupIdx === 0 && !completedGroups.includes(1) },
    { num: 2, title: 'Configure Logstash',    done: completedGroups.includes(2), active: groupIdx === 1 && !completedGroups.includes(2) },
    { num: 3, title: 'Install Kibana',        done: completedGroups.includes(3), active: groupIdx === 2 && !completedGroups.includes(3) },
    { num: 4, title: 'Ingest Log Data',       done: completedGroups.includes(4), active: groupIdx === 3 && !completedGroups.includes(4) },
    { num: 5, title: 'Create Visualizations', done: ex5Done,                     active: allTermDone && !ex5Done },
  ];

  const ex5SubSteps = [
    { label: 'Create index pattern logstash-*', done: indexPatternCreated },
    { label: 'Explore Discover',                done: discoverVisited },
    { label: 'Create a visualization',          done: !!savedViz },
    { label: 'Create a dashboard',              done: !!savedDashboard },
  ];

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{ backgroundImage: `linear-gradient(135deg, rgba(5,10,18,0.94), rgba(2,6,23,0.85)), url("data:image/svg+xml;charset=UTF-8,${SYSLOG_LAB_BACKGROUND}")`, backgroundSize: 'cover' }}
      onClick={() => { if (!nanoMode) termInputRef.current?.focus(); }}
    >
      <style>{`
        @keyframes elk-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(4px)} }
        @keyframes elk-glow  { 0%,100%{box-shadow:0 0 0 rgba(254,197,20,0)} 50%{box-shadow:0 0 32px rgba(254,197,20,0.18)} }
        @keyframes elk-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
      `}</style>

      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 px-4 py-4 lg:flex-row lg:px-6 lg:py-6">

        {/* ─── LEFT: Terminal ─────────────────────────────────── */}
        <section className="flex flex-col lg:basis-[48%]">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#FEC514]/15 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2">
                <ElkLogo compact />
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#FEC514]">ELK Stack Installation Lab</span>
              </div>
              <div className="mt-1 text-sm text-slate-400">Sandboxed terminal — no commands execute on the host.</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={resetLab} className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-300 transition hover:border-slate-500 hover:text-white">Reset</button>
              <button type="button" onClick={onBack} className="rounded-full border border-[#FEC514]/35 bg-[#FEC514]/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-yellow-200 transition hover:border-yellow-400">Back</button>
            </div>
          </div>

          {/* Terminal window */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-xs text-slate-400">student@ubuntu:~</span>
              </div>
              <div className="font-mono text-xs text-slate-500">{completedGroups.length}/{ELK_LAB_GROUPS.length} exercises</div>
            </div>
            <div className="h-1.5 w-full bg-slate-900">
              <div className="h-full bg-gradient-to-r from-[#FEC514] via-[#00BFB3] to-[#F04E98] transition-all duration-500"
                style={{ width: `${(completedGroups.length / ELK_LAB_GROUPS.length) * 100}%` }} />
            </div>

            {/* Terminal scroll area */}
            <div
              ref={termScrollRef}
              className={['flex-1 overflow-y-auto px-4 py-4 font-mono text-[13px] leading-7 text-slate-200',
                wrongPulse   ? 'animate-[elk-shake_0.34s_ease-in-out]' : '',
                successPulse ? 'animate-[elk-glow_0.42s_ease-in-out]'  : ''].filter(Boolean).join(' ')}
              style={{ minHeight: '42vh', maxHeight: '52vh' }}
            >
              {history.map((entry, i) => (
                <div key={i} className="whitespace-pre-wrap break-words">
                  {entry.type === 'command' ? (
                    <div><span className="text-[#FEC514]">student@ubuntu:~$ </span><span>{entry.text}</span></div>
                  ) : (
                    <div className={{ system:'text-cyan-300/80', output:'text-slate-300', success:'text-emerald-300', error:'text-rose-300' }[entry.type] || 'text-slate-300'}>
                      {entry.text}
                    </div>
                  )}
                </div>
              ))}

              {/* Nano editor overlay */}
              {nanoMode && (
                <div className="mt-3 overflow-hidden rounded-xl border border-[#00BFB3]/30 bg-[#011627]" onClick={e => e.stopPropagation()}>
                  <div className="border-b border-[#00BFB3]/20 bg-[#001122] px-4 py-1.5 text-center font-mono text-[11px] text-slate-400">
                    GNU nano 4.8 &nbsp;&nbsp;&nbsp;<span className="text-white">File: /etc/logstash/conf.d/logstash-simple.conf</span>&nbsp;&nbsp;&nbsp;Modified
                  </div>
                  <div className="min-h-[120px] p-4 font-mono text-xs text-slate-200">
                    {nanoPasted
                      ? <pre className="text-[#00BFB3] leading-6">{ELK_LOGSTASH_CONFIG_TEXT}</pre>
                      : <div className="flex h-16 items-center justify-center text-slate-500 text-sm">Empty file — click Paste Config below.</div>}
                  </div>
                  <div className="border-t border-[#00BFB3]/20 bg-[#001122] px-4 py-3">
                    <div className="mb-2 grid grid-cols-4 gap-1 font-mono text-[10px] text-slate-500">
                      {['^G Help','^X Exit','^O Write','^W Search','^C Cancel','^J Justify','^R Read','^\\ Replace'].map(k => <span key={k}>{k}</span>)}
                    </div>
                    <div className="flex gap-2">
                      {!nanoPasted ? (
                        <button onClick={() => setNanoPasted(true)}
                          className="flex-1 rounded-lg border border-[#00BFB3]/40 bg-[#00BFB3]/10 py-2 font-mono text-[11px] uppercase tracking-widest text-[#00BFB3] transition hover:bg-[#00BFB3]/20">
                          📋 Paste Config
                        </button>
                      ) : (
                        <button onClick={completePasteStep}
                          className="flex-1 rounded-lg border border-emerald-400/40 bg-emerald-400/10 py-2 font-mono text-[11px] uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-400/20">
                          💾 Save &amp; Exit &nbsp;(Ctrl+X, Y, Enter)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Input line */}
              {!nanoMode && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="shrink-0 text-[#FEC514]">student@ubuntu:~$</span>
                  <div className="relative flex-1">
                    <input
                      ref={termInputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      spellCheck={false}
                      disabled={allTermDone}
                      className="w-full bg-transparent font-mono text-slate-100 outline-none caret-transparent"
                    />
                    {!input && !allTermDone && (
                      <span className="pointer-events-none absolute left-0 top-0 text-[#FEC514]/75 animate-[elk-blink_1s_step-end_infinite]">▋</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hint bar */}
            {!allTermDone && activeCmd && !nanoMode && (
              <div className="border-t border-slate-800/60 px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500 mb-1">
                  Exercise {activeGroup?.exerciseNum} · {activeGroup?.title} · step {cmdIdx + 1}/{activeGroup?.commands.length}
                </div>
                <div className="font-mono text-sm text-[#FEC514]/85 break-all">{activeCmd.value}</div>
              </div>
            )}
            {nanoMode && (
              <div className="border-t border-slate-800/60 px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500 mb-1">nano editor open</div>
                <div className="text-sm text-[#00BFB3]/80">Click <strong>Paste Config</strong> to insert the Logstash configuration, then click <strong>Save &amp; Exit</strong>.</div>
              </div>
            )}
          </div>
        </section>

        {/* ─── RIGHT: Progress + Browser ─────────────────────── */}
        <section className="flex flex-col gap-4 lg:basis-[52%]">
          {/* Exercise checklist */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 backdrop-blur-xl">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-slate-500">Lab Exercises</div>
            <div className="space-y-2">
              {exercises.map(ex => (
                <div key={ex.num} className={['rounded-xl border px-4 py-2.5 transition',
                  ex.done   ? 'border-emerald-400/25 bg-emerald-400/8'
                  : ex.active ? 'border-[#FEC514]/25 bg-[#FEC514]/8'
                  : 'border-slate-800 bg-slate-950/50'].join(' ')}>
                  <div className="flex items-center gap-3">
                    <span className={['flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      ex.done ? 'bg-emerald-400 text-slate-950' : ex.active ? 'bg-[#FEC514] text-slate-950' : 'bg-slate-800 text-slate-400'].join(' ')}>
                      {ex.done ? '✓' : ex.num}
                    </span>
                    <span className={['text-sm', ex.done ? 'text-emerald-200' : ex.active ? 'text-[#FEC514]' : 'text-slate-500'].join(' ')}>{ex.title}</span>
                    {ex.active && !ex.done && <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-[#FEC514]/60">active</span>}
                  </div>
                  {ex.num === 5 && ex.active && (
                    <div className="mt-2 space-y-1 pl-8">
                      {ex5SubSteps.map(sub => (
                        <div key={sub.label} className="flex items-center gap-2 text-xs">
                          <span className={sub.done ? 'text-emerald-400' : 'text-slate-600'}>{sub.done ? '✓' : '○'}</span>
                          <span className={sub.done ? 'text-emerald-200' : 'text-slate-500'}>{sub.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Browser panel */}
          {!esRunning && !kibanaRunning ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/50 py-10 text-center">
              <div>
                <ElkLogo />
                <div className="mt-4 text-sm text-slate-500">Browser windows appear here when services start.</div>
                <div className="mt-1 font-mono text-[11px] text-slate-700">localhost:9200 · localhost:5601</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-0">
              {/* Browser tabs */}
              <div className="flex gap-1 px-1">
                {esRunning && (
                  <button onClick={() => setActiveBrowser('es')}
                    className={['rounded-t-lg border border-b-0 px-4 py-2 font-mono text-[11px] transition',
                      activeBrowser === 'es' ? 'border-[#FEC514]/30 bg-[#25272e] text-[#FEC514]' : 'border-slate-700 bg-slate-950 text-slate-500 hover:text-slate-300'].join(' ')}>
                    ● localhost:9200
                  </button>
                )}
                {kibanaRunning && (
                  <button onClick={() => setActiveBrowser('kibana')}
                    className={['rounded-t-lg border border-b-0 px-4 py-2 font-mono text-[11px] transition',
                      activeBrowser === 'kibana' ? 'border-[#F04E98]/30 bg-[#25272e] text-[#F04E98]' : 'border-slate-700 bg-slate-950 text-slate-500 hover:text-slate-300'].join(' ')}>
                    ● localhost:5601
                  </button>
                )}
              </div>

              {activeBrowser === 'es' && (
                <ElkBrowserChrome url="http://localhost:9200">
                  <FakeElasticSearchBrowser />
                </ElkBrowserChrome>
              )}

              {activeBrowser === 'kibana' && (
                <ElkBrowserChrome url="http://localhost:5601/app/kibana">
                  <div style={{ height: '58vh', minHeight: 460 }}>
                    <FakeKibanaUI
                      kibanaNav={kibanaNav}
                      setKibanaNav={setKibanaNav}
                      indexPatternCreated={indexPatternCreated}
                      setIndexPatternCreated={setIndexPatternCreated}
                      indexPatternStep={indexPatternStep}
                      setIndexPatternStep={setIndexPatternStep}
                      kibanaFilters={kibanaFilters}
                      setKibanaFilters={setKibanaFilters}
                      savedViz={savedViz}
                      setSavedViz={setSavedViz}
                      savedDashboard={savedDashboard}
                      setSavedDashboard={setSavedDashboard}
                      onDiscoverVisit={() => setDiscoverVisited(true)}
                    />
                  </div>
                </ElkBrowserChrome>
              )}
            </div>
          )}
        </section>
      </div>

      <LabShells.LabCheckpointQuiz
        questions={ELK_QUIZ_QUESTIONS}
        storageKey="b2b-quiz-lap-4"
        title="ELK Stack comprehension quiz"
        onPass={() => { try { window.localStorage.setItem('b2b-quiz-lap-4-passed', '1'); } catch {} }}
      />
    </div>
  );
}

const ELK_QUIZ_QUESTIONS = [
  {
    id:'elk-q1',
    prompt:'Which component of the ELK stack is responsible for storing and indexing logs?',
    options:['Logstash', 'Elasticsearch', 'Kibana', 'Beats'],
    correct:'Elasticsearch',
  },
  {
    id:'elk-q2',
    prompt:'Which component parses and transforms raw log data before it is stored?',
    options:['Kibana', 'Elasticsearch', 'Logstash', 'Filebeat'],
    correct:'Logstash',
  },
  {
    id:'elk-q3',
    prompt:'In Kibana, what does an index pattern define?',
    options:[
      'The visual theme applied to dashboards',
      'Which Elasticsearch indices to search and how fields are mapped',
      'The retention period for logs',
      'Which users can access the cluster',
    ],
    correct:'Which Elasticsearch indices to search and how fields are mapped',
  },
  {
    id:'elk-q4',
    prompt:'Which Kibana feature is used to interactively search and filter ingested logs?',
    options:['Canvas', 'Dev Tools', 'Discover', 'Maps'],
    correct:'Discover',
  },
  {
    id:'elk-q5',
    prompt:'In this lab the severity field shows HIGH and LOW values. Which action best helps you narrow to urgent events?',
    options:[
      'Delete the index pattern and rebuild it',
      'Stop the Logstash pipeline',
      'Apply a filter where severity is HIGH',
      'Increase the cluster replica count',
    ],
    correct:'Apply a filter where severity is HIGH',
  },
];

function ModulePage({ user, mod, onBack, track }) {
  // New-shape labs (BUILD_PLAN.md §1.7) carry an exercises[] array and are rendered via LabPlayer.
  if (mod && Array.isArray(mod.exercises) && window.LabPlayer) {
    return <window.LabPlayer lab={mod} user={user} onBack={onBack} track={track} />;
  }

  if (track === 'windows-forensics' && mod?.id === 'lab-wf-1') {
    return <WindowsPowerShellLab onBack={onBack} />;
  }

  if (track === 'log-analysis' && mod?.id === 'lab-lap-2') {
    return <SyslogLinuxLab onBack={onBack} />;
  }

  if (track === 'log-analysis' && mod?.id === 'lab-lap-4') {
    return <ElkTrainingLab onBack={onBack} />;
  }

  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState(null);
  const [activeTask, setActiveTask] = React.useState(0);
  const [taskStatus, setTaskStatus] = React.useState({});
  const [feedback, setFeedback] = React.useState(null);
  const [queryHistory, setQueryHistory] = React.useState([]);
  const [histIdx, setHistIdx] = React.useState(-1);
  const [running, setRunning] = React.useState(false);
  const [lastRunQuery, setLastRunQuery] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [hintOpen, setHintOpen] = React.useState(false);
  const [selectedEnterpriseItem, setSelectedEnterpriseItem] = React.useState(null);
  const [enterpriseModal, setEnterpriseModal] = React.useState(null);
  const [enterpriseContext, setEnterpriseContext] = React.useState(null);
  const inputRef = React.useRef();

  const missingData = !mod || !Array.isArray(mod?.logs) || !Array.isArray(mod?.tasks) || !Array.isArray(mod?.fields);
  const moduleId = mod?.id || 'missing-module';
  const logs = Array.isArray(mod?.logs) ? mod.logs : [];
  const tasks = Array.isArray(mod?.tasks) ? mod.tasks : [];
  const fields = Array.isArray(mod?.fields) && mod.fields.length
    ? mod.fields
    : Object.keys(logs[0] || {});
  const safeMod = {
    ...(mod || {}),
    id: moduleId,
    title: mod?.title || 'Unavailable lab',
    subtitle: mod?.subtitle || 'Missing lab data',
    description: mod?.description || 'This lab is missing required data and cannot be rendered.',
    difficulty: mod?.difficulty || 'Unavailable',
    estimatedTime: mod?.estimatedTime || 'Unknown time',
    tags: Array.isArray(mod?.tags) ? mod.tags : [],
    icon: mod?.icon || '!',
    logs,
    tasks,
    fields,
  };

  const rawProgress = getProgress()[user?.username]?.[moduleId] || {};
  const progress = {
    completedTasks: Array.isArray(rawProgress.completedTasks) ? rawProgress.completedTasks : [],
    score: rawProgress.score || 0,
    started: !!rawProgress.started,
  };

  React.useEffect(() => {
    const ts = {};
    progress.completedTasks.forEach(id => { ts[id] = 'correct'; });
    setTaskStatus(ts);
    // Show all logs on mount
    setResults({ rows: logs, type: 'raw', error: null, count: logs.length });
    setLastRunQuery('');
  }, [moduleId]);

  React.useEffect(() => {
    setFeedback(null);
    setAnswer('');
    setHintOpen(false);
  }, [activeTask, moduleId]);

  React.useEffect(() => {
    if (query.trim()) return;
    setRunning(false);
    setResults({ rows: logs, type: 'raw', error: null, count: logs.length });
    setLastRunQuery('');
    setHistIdx(-1);
  }, [query, logs, moduleId]);

  function runQuery() {
    if (!query.trim()) {
      setRunning(false);
      setResults({ rows: logs, type: 'raw', error: null, count: logs.length });
      setLastRunQuery('');
      setHistIdx(-1);
      setFeedback(null);
      return;
    }
    setRunning(true);
    setFeedback(null);
    setTimeout(() => {
      const result = executeQuery(query, logs);
      setResults(result);
      setLastRunQuery(query.trim());
      setQueryHistory(h => [query, ...h.filter(q => q !== query)].slice(0, 20));
      setHistIdx(-1);
      setRunning(false);
    }, 350);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runQuery(); }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, queryHistory.length - 1);
      setHistIdx(next);
      if (queryHistory[next]) setQuery(queryHistory[next]);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setQuery(next === -1 ? '' : queryHistory[next]);
    }
  }

  function applyShellQuery(nextQuery) {
    const trimmed = String(nextQuery || '').trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setFeedback(null);
    const result = executeQuery(trimmed, logs);
    setResults(result);
    setLastRunQuery(trimmed);
  }

  function submitAnswer() {
    const task = tasks[activeTask];
    if (!task || !results) {
      setFeedback({ type: 'error', msg: 'This lab is missing task or result data.' });
      return;
    }
    if (!lastRunQuery) {
      setFeedback({ type: 'error', msg: 'Run a query before submitting an answer.' });
      return;
    }
    if (query.trim() !== lastRunQuery) {
      setFeedback({ type: 'error', msg: 'Run the current query before submitting.' });
      return;
    }
    if (!answer.trim()) {
      setFeedback({ type: 'error', msg: 'Type your answer before submitting.' });
      return;
    }

    const queryCorrect = validateTask(task, results, lastRunQuery);
    const answerCorrect = validateTypedAnswer(task, answer, results);
    const correct = queryCorrect && answerCorrect;
    if (correct) {
      markTaskComplete(user?.username || 'unknown-user', moduleId, task.id, task.points);
      setTaskStatus(s => ({ ...s, [task.id]: 'correct' }));
      setFeedback({ type: 'success', msg: `✓ Correct! +${task.points} points earned.` });
      if (activeTask < tasks.length - 1) {
        setTimeout(() => setActiveTask(activeTask + 1), 1200);
      }
    } else {
      setFeedback({ type: 'error', msg: 'Not quite. Check your query results and typed answer.' });
    }
  }

  function completeTasksFromShell(taskIds, options = {}) {
    const ids = Array.isArray(taskIds) ? taskIds : [];
    if (!ids.length) return;
    const awarded = [];
    ids.forEach(taskId => {
      const taskDef = tasks.find(item => item.id === taskId);
      if (!taskDef) return;
      markTaskComplete(user?.username || 'unknown-user', moduleId, taskDef.id, taskDef.points || 0);
      awarded.push(taskDef.id);
    });
    if (!awarded.length) return;
    setTaskStatus(current => {
      const next = { ...current };
      awarded.forEach(id => { next[id] = 'correct'; });
      return next;
    });
    if (options.feedback) {
      setFeedback({ type:'success', msg:options.feedback });
    }
    if (options.nextTaskId) {
      const nextIndex = tasks.findIndex(item => item.id === options.nextTaskId);
      if (nextIndex >= 0) setActiveTask(nextIndex);
    }
  }

  const resultRows = Array.isArray(results?.rows) ? results.rows : null;
  const columns = resultRows && resultRows.length > 0 ? Object.keys(resultRows[0]) : fields;
  const displayRows = resultRows || logs;
  const task = tasks[activeTask];
  const totalPoints = tasks.reduce((s, t) => s + (t.points || 0), 0);
  const earnedPoints = tasks.filter(t => taskStatus[t.id] === 'correct').reduce((s, t) => s + (t.points || 0), 0);

  // Mini timeline: count events per timestamp hour
  const timeline = React.useMemo(() => {
    const rows = Array.isArray(results?.rows) ? results.rows : logs;
    const counts = {};
    rows.forEach(r => {
      const t = r.ts || r.timestamp || '';
      const key = t.slice(11, 16) || t.slice(0, 10);
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort(([a],[b]) => a.localeCompare(b));
  }, [results, moduleId]);
  const maxCount = Math.max(...timeline.map(([,c]) => c), 1);
  const labType = getEnterpriseLabType(safeMod, track);
  const LabShell = getEnterpriseLabShell(labType);
  const sharedLabProps = {
    user, mod:safeMod, onBack, query, setQuery, results, displayRows, columns, running, runQuery, handleKeyDown,
    activeTask, setActiveTask, taskStatus, feedback, answer, setAnswer, hintOpen, setHintOpen, submitAnswer,
    task, totalPoints, earnedPoints, timeline, maxCount, inputRef, lastRunQuery,
    selectedEnterpriseItem, setSelectedEnterpriseItem, enterpriseModal, setEnterpriseModal, enterpriseContext, setEnterpriseContext,
    completeTasksFromShell, applyShellQuery,
  };

  if (missingData) {
    return <ModuleDataFallback mod={mod} onBack={onBack} />;
  }

  if (labType) {
    if (LabShell) {
      return <LabShell {...sharedLabProps} />;
    }
    return <LabUnavailable mod={safeMod} onBack={onBack} labType={labType} />;
  }

  return (
    <div style={mpStyles.root}>
      {/* Nav */}
      <nav style={mpStyles.nav}>
        <div style={mpStyles.navLeft}>
          <button onClick={onBack} style={mpStyles.backBtn}>‹ BACK</button>
          <span style={mpStyles.navSep}>›</span>
          <span style={mpStyles.navMod}>{safeMod.icon} {safeMod.title}</span>
          <span style={{...mpStyles.diffPill, color: {Beginner:'#22c55e',Intermediate:'#f59e0b',Advanced:'#f87171'}[safeMod.difficulty] || '#94a3b8'}}>
            {safeMod.difficulty}
          </span>
        </div>
        <div style={mpStyles.navRight}>
          <span style={mpStyles.scoreDisplay}>{earnedPoints}/{totalPoints} pts</span>
          <div style={mpStyles.navUser}>
            <span data-status="online" style={mpStyles.dot} />
            <span style={{color:'#94a3b8',fontSize:11,fontFamily:"'Space Mono',monospace"}}>{user.displayName}</span>
          </div>
        </div>
      </nav>

      <div data-module-layout style={mpStyles.layout}>
        {/* LEFT — Query + Results */}
        <div style={mpStyles.main}>

          {/* Query Bar */}
          <div data-reveal style={mpStyles.queryPanel}>
            <div style={mpStyles.queryLabel}>
              <span style={{color:'#22c55e'}}>›</span> QUERY EDITOR
              <span style={{marginLeft:'auto',color:'#1e3a2e',fontSize:9}}>↑↓ history · Enter to run</span>
            </div>
            <div style={mpStyles.queryBar}>
              <span style={mpStyles.qPrompt}>SPL›</span>
              <input
                ref={inputRef}
                style={mpStyles.qInput}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`search ${fields[1] || fields[0] || 'field'}=value | count by ${fields[2] || fields[0] || 'field'}`}
                spellCheck={false}
              />
              <button
                onClick={runQuery}
                disabled={running}
                style={{...mpStyles.runBtn, opacity: running ? 0.6 : 1}}
              >
                {running ? '...' : '▶ RUN'}
              </button>
            </div>

            {/* Quick chips */}
            <div data-reveal style={mpStyles.chips}>
              {[`search ${fields[1] || fields[0] || 'field'}=`, `count by ${fields[2] || fields[0] || 'field'}`, `sort by ${fields[fields.length-1] || 'id'} desc`, 'head 10'].map(c => (
                <button key={c} onClick={() => { setQuery(c); inputRef.current?.focus(); }} style={mpStyles.chip}>{c}</button>
              ))}
            </div>
          </div>

          {/* Timeline mini chart */}
          {timeline.length > 0 && (
            <div data-reveal data-card style={mpStyles.timelinePanel}>
              <div style={mpStyles.tlLabel}>EVENTS OVER TIME <span style={{color:'#1e3a2e'}}>({displayRows.length} events)</span></div>
              <div style={mpStyles.tlBars}>
                {timeline.map(([t, c]) => (
                  <div key={t} style={mpStyles.tlBar}>
                    <div style={{...mpStyles.tlBarFill, height: `${Math.round((c/maxCount)*36)}px`, minHeight:2}} title={`${t}: ${c}`} />
                    <div style={mpStyles.tlBarLabel}>{t.slice(-5)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Table */}
          <div data-reveal data-card style={mpStyles.tablePanel}>
            <div style={mpStyles.tableHeader}>
              <span style={mpStyles.tlLabel}>
                RESULTS
                {results?.error && <span style={{color:'#f87171',marginLeft:12}}>{results.error}</span>}
              </span>
              <span style={{color:'#334155',fontSize:10,fontFamily:"'Space Mono',monospace"}}>
                {displayRows.length} row{displayRows.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={mpStyles.tableScroll}>
              {running && (
                <div style={mpStyles.skeletonRows}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonBlock key={i} style={{ height: i === 0 ? 18 : 14, opacity: 1 - i * 0.08 }} />
                  ))}
                </div>
              )}
              <table style={{...mpStyles.table, opacity: running ? 0.35 : 1}}>
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col} style={mpStyles.th}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.slice(0, 50).map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      {columns.map(col => {
                        const val = row[col];
                        const cellColor = getCellColor(col, val);
                        return (
                          <td key={col} style={{...mpStyles.td, color: cellColor}}>
                            {formatCell(col, val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayRows.length === 0 && (
                <div style={mpStyles.emptyState}>No results match your query</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Task Panel */}
        <div data-reveal style={mpStyles.sidebar}>
          {/* Module info */}
          <div data-card style={mpStyles.modInfo}>
            <div style={mpStyles.modInfoTitle}>{safeMod.description}</div>
            <div style={mpStyles.modInfoMeta}>
              <span>⏱ {safeMod.estimatedTime}</span>
              <span>{logs.length} log entries</span>
            </div>
            {safeMod.sourceUrl && (
              <a href={safeMod.sourceUrl} target="_blank" rel="noreferrer" style={mpStyles.sourceLink}>
                SOURCE BRIEF
              </a>
            )}
          </div>

          {/* Task list */}
          <div style={mpStyles.taskListLabel}>TASKS</div>
          {tasks.map((t, i) => {
            const done = taskStatus[t.id] === 'correct';
            const active = i === activeTask;
            return (
              <div
                key={t.id}
                onClick={() => setActiveTask(i)}
                data-card
                style={{
                  ...mpStyles.taskItem,
                  borderColor: done ? '#1e3a2e' : active ? '#1e2d45' : '#0f1e2e',
                  background: active ? 'rgba(15,21,32,0.95)' : 'rgba(10,15,22,0.6)',
                  cursor:'pointer',
                }}
              >
                <div style={mpStyles.taskItemTop}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{
                      ...mpStyles.taskNum,
                      background: done ? '#22c55e' : active ? '#1e3a2e' : '#0f1e2e',
                      color: done ? '#000' : active ? '#22c55e' : '#334155',
                    }}>{done ? '✓' : i + 1}</div>
                    <span style={{...mpStyles.taskTitle, color: done ? '#22c55e' : active ? '#e2e8f0' : '#475569'}}>{t.title}</span>
                  </div>
                  <span style={{...mpStyles.pts, color: done ? '#22c55e' : '#334155'}}>{t.points}pt</span>
                </div>
              </div>
            );
          })}

          {/* Active task detail */}
          {task && (
            <div data-card style={mpStyles.taskDetail}>
              <div style={mpStyles.tdHeader}>
                TASK {activeTask + 1} OF {tasks.length}
              </div>
              <div style={mpStyles.tdTitle}>{task.title}</div>
              <div style={mpStyles.tdDesc}>{task.description}</div>

              <button onClick={() => setHintOpen(open => !open)} style={mpStyles.hintToggle}>
                {hintOpen ? 'HIDE HINT' : 'SHOW HINT'}
              </button>
              {hintOpen && (
                <div style={mpStyles.hintBox}>
                  <div style={{fontSize:9,color:'#475569',letterSpacing:1,marginBottom:6}}>HINT</div>
                  <div style={{fontSize:11,color:'#22c55e',fontFamily:"'Space Mono',monospace"}}>{task.hint}</div>
                </div>
              )}

              {taskStatus[task.id] !== 'correct' && (
                <div style={mpStyles.answerGroup}>
                  <label style={mpStyles.answerLabel}>ANSWER</label>
                  <input
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    style={mpStyles.answerInput}
                    placeholder="Type the value you found"
                    spellCheck={false}
                  />
                </div>
              )}

              {feedback && (
                <div style={{
                  ...mpStyles.feedback,
                  background: feedback.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  borderColor: feedback.type === 'success' ? '#1e3a2e' : 'rgba(239,68,68,0.3)',
                  color: feedback.type === 'success' ? '#22c55e' : '#f87171',
                }}>
                  {feedback.msg}
                </div>
              )}

              {taskStatus[task.id] !== 'correct' && (
                <button onClick={submitAnswer} style={mpStyles.submitBtn}>
                  SUBMIT ANSWER
                </button>
              )}
              {taskStatus[task.id] === 'correct' && activeTask < tasks.length - 1 && (
                <button onClick={() => setActiveTask(activeTask + 1)} style={mpStyles.nextBtn}>
                  NEXT TASK →
                </button>
              )}
            </div>
          )}

          {/* Dataset fields reference */}
          <div data-card style={mpStyles.fieldsRef}>
            <div style={{fontSize:9,color:'#475569',letterSpacing:2,marginBottom:8}}>AVAILABLE FIELDS</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {fields.map(f => (
                <span key={f} style={mpStyles.fieldChip}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCellColor(col, val) {
  if (col === 'status' || col === 'rcode') {
    const s = String(val).toLowerCase();
    if (['failed','error','nxdomain','blocked'].includes(s)) return '#f87171';
    if (['success','noerror','delivered'].includes(s)) return '#22c55e';
  }
  if (col === 'count') return '#38bdf8';
  if (col === 'spam_score' && val > 7) return '#f87171';
  if (col === 'lease_time' && val <= 300) return '#f59e0b';
  if (col === 'ttl' && val <= 10) return '#f59e0b';
  if (['src_ip','source_ip'].includes(col)) return '#94a3b8';
  if (['ts','timestamp'].includes(col)) return '#475569';
  return '#e2e8f0';
}

function formatCell(col, val) {
  if (val === undefined || val === null) return '—';
  if (col === 'bytes' || col === 'size') {
    if (val >= 1048576) return (val/1048576).toFixed(1) + ' MB';
    if (val >= 1024) return (val/1024).toFixed(1) + ' KB';
    return val + ' B';
  }
  return String(val);
}

function ModuleDataFallback({ mod, onBack }) {
  const missingParts = [
    !Array.isArray(mod?.logs) ? 'logs' : null,
    !Array.isArray(mod?.tasks) ? 'tasks' : null,
    !Array.isArray(mod?.fields) ? 'fields' : null,
  ].filter(Boolean);

  return (
    <div style={mpStyles.root}>
      <nav style={mpStyles.nav}>
        <div style={mpStyles.navLeft}>
          <button onClick={onBack} style={mpStyles.backBtn}>‹ BACK</button>
          <span style={mpStyles.navSep}>›</span>
          <span style={mpStyles.navMod}>{mod?.icon || '!'} {mod?.title || 'Lab unavailable'}</span>
        </div>
      </nav>
      <main style={mpStyles.fallbackRoot}>
        <section data-card style={mpStyles.fallbackPanel}>
          <div style={mpStyles.fallbackKicker}>LAB DATA UNAVAILABLE</div>
          <h1 style={mpStyles.fallbackTitle}>This lab cannot be rendered safely.</h1>
          <p style={mpStyles.fallbackCopy}>
            Required lab data is missing or malformed. Return to the track catalog and select the lab again.
          </p>
          {missingParts.length > 0 && (
            <div style={mpStyles.fallbackMeta}>Missing: {missingParts.join(', ')}</div>
          )}
          <button onClick={onBack} style={mpStyles.submitBtn}>RETURN</button>
        </section>
      </main>
    </div>
  );
}

function LabUnavailable({ mod, onBack, labType }) {
  const label = {
    'active-directory': 'Active Directory',
    splunk: 'Splunk',
    servicenow: 'ServiceNow',
    azure: 'Azure',
    'event-viewer': 'Event Viewer',
    'sysmon-viewer': 'Sysmon Viewer',
    'registry-editor': 'Registry Editor',
    'malware-analysis': 'Malware Analysis',
  }[labType] || 'Lab';

  return (
    <div style={mpStyles.root}>
      <nav style={mpStyles.nav}>
        <div style={mpStyles.navLeft}>
          <button onClick={onBack} style={mpStyles.backBtn}>‹ BACK</button>
          <span style={mpStyles.navSep}>›</span>
          <span style={mpStyles.navMod}>{mod?.icon || '!'} {mod?.title || 'Lab unavailable'}</span>
        </div>
      </nav>
      <main style={mpStyles.fallbackRoot}>
        <section data-card style={mpStyles.fallbackPanel}>
          <div style={mpStyles.fallbackKicker}>{label.toUpperCase()} SHELL UNAVAILABLE</div>
          <h1 style={mpStyles.fallbackTitle}>Lab unavailable</h1>
          <p style={mpStyles.fallbackCopy}>
            The interactive lab shell for this module is not loaded. Check that `src/lab-shells.jsx`
            is present and exports the required shell components.
          </p>
          <button onClick={onBack} style={mpStyles.submitBtn}>RETURN</button>
        </section>
      </main>
    </div>
  );
}

function validateTypedAnswer(task, answer, queryResult) {
  const v = task?.validation;
  const rows = Array.isArray(queryResult?.rows) ? queryResult.rows : [];
  if (!v) return false;
  const normalized = normalizeAnswer(answer);

  if (v.type === 'count') {
    return normalized === String(v.expected);
  }
  if (v.type === 'groupby') {
    return normalized === normalizeAnswer(v.expected_top) ||
      (v.expected_top_count !== undefined && normalized === String(v.expected_top_count));
  }
  if (v.type === 'count_gt') {
    if (v.value !== undefined && normalized === normalizeAnswer(v.value)) return true;
    return normalized === String(rows.length) && rows.length > v.threshold;
  }
  if (v.type === 'equals') {
    return normalized === normalizeAnswer(v.expected);
  }
  return false;
}

function normalizeAnswer(value) {
  return String(value).trim().toLowerCase();
}

function getEnterpriseLabType(mod, track) {
  // Legacy catalog records use `lab-<id>` while registered labs use the bare
  // project id. Normalize both shapes before selecting a shell.
  const id = String(mod?.id || '').replace(/^lab-/, '');
  if (track === 'splunk' || id.startsWith('mod-')) return 'splunk';
  if (id === 'lap-3') return 'event-viewer';
  if (id === 'lap-5') return 'sysmon-viewer';
  if (id === 'wf-2') return 'registry-editor';
  if (id.startsWith('ma-')) return 'malware-analysis';
  if (id.startsWith('ad-')) return 'active-directory';
  if (id === 'sa-3') return 'burp-proxy';
  if (id === 'sa-5') return 'iam-matrix';
  if (id.startsWith('sa-')) return 'linux-terminal';
  if (id === 'vm-1') return 'openvas';
  if (id === 'vm-2') return 'nessus';
  if (id === 'vm-3') return 'qualys';
  if (id === 'vm-4') return 'zap';
  if (id === 'vm-5') return 'wsus';
  return null;
}

function getEnterpriseLabShell(labType) {
  const shells = window.LabShells || {};
  const shellByType = {
    'active-directory': shells.ActiveDirectoryLabShell,
    splunk: shells.SplunkLabShell,
    servicenow: shells.ServiceNowLabShell,
    azure: shells.AzureLabShell,
    'event-viewer': shells.EventViewerLabShell,
    'sysmon-viewer': shells.SysmonLabShell,
    'registry-editor': shells.RegistryLabShell,
    'linux-terminal': window.LinuxTerminalShell,
    'burp-proxy': window.BurpProxyLabShell,
    'iam-matrix': window.IamMatrixLabShell,
    'malware-analysis': null,
    openvas: shells.OpenVASLabShell || window.OpenVASLabShell,
    nessus: shells.NessusLabShell || window.NessusLabShell,
    qualys: shells.QualysLabShell || window.QualysLabShell,
    zap: shells.ZAPLabShell || window.ZAPLabShell,
    wsus: shells.WSUSLabShell || window.WSUSLabShell,
  };
  const shell = shellByType[labType];
  return typeof shell === 'function' ? shell : null;
}

const mpStyles = {
  root: { minHeight:'100vh', background:'transparent', color:'#e2e8f0', fontFamily:"'Inter',sans-serif", display:'flex', flexDirection:'column' },
  nav: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'0 clamp(0.75rem, 2.5vw, 1.25rem)', height:48, background:'rgba(10,15,22,0.78)',
    borderBottom:'1px solid rgba(56,189,248,0.12)', flexShrink:0, position:'sticky', top:0, zIndex:50,
    backdropFilter:'blur(18px)',
  },
  navLeft: { display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', minWidth:0 },
  backBtn: {
    background:'transparent', border:'1px solid #1e3a2e', color:'#22c55e',
    fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, padding:'5px 10px', cursor:'pointer',
  },
  navSep: { color:'#1e3a2e' },
  navMod: { fontSize:12, fontWeight:600, color:'#e2e8f0' },
  diffPill: { fontSize:9, border:'1px solid currentColor', padding:'2px 8px', letterSpacing:1, fontFamily:"'Space Mono',monospace", opacity:0.8 },
  navRight: { display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' },
  scoreDisplay: { fontFamily:"'Space Mono',monospace", fontSize:11, color:'#22c55e' },
  navUser: { display:'flex', alignItems:'center', gap:6 },
  dot: { width:5, height:5, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 5px #22c55e' },
  layout: { display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(min(100%, 20rem), 24rem)', gap:0, flex:1, minHeight:0 },
  main: { minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid rgba(56,189,248,0.10)' },

  // Query
  queryPanel: { padding:'clamp(0.75rem, 2vw, 0.9rem) clamp(0.9rem, 2.4vw, 1.25rem)', borderBottom:'1px solid rgba(56,189,248,0.10)', background:'rgba(10,15,22,0.62)', flexShrink:0 },
  queryLabel: { display:'flex', alignItems:'center', gap:8, fontSize:9, color:'#475569', letterSpacing:2, marginBottom:10, fontFamily:"'Space Mono',monospace" },
  queryBar: { display:'flex', alignItems:'center', gap:0, background:'rgba(0,0,0,0.4)', border:'1px solid #1e3a2e', borderRadius:6, minWidth:0 },
  qPrompt: { padding:'0 12px', color:'#22c55e', fontFamily:"'Space Mono',monospace", fontSize:11, borderRight:'1px solid #1e3a2e', whiteSpace:'nowrap' },
  qInput: {
    flex:'1 1 12rem', minWidth:0, background:'transparent', border:'none', outline:'none',
    color:'#e2e8f0', fontFamily:"'Space Mono',monospace", fontSize:12,
    padding:'10px 14px', letterSpacing:0.5,
  },
  runBtn: {
    background:'#22c55e', border:'none', color:'#000', fontFamily:"'Space Mono',monospace",
    fontSize:10, letterSpacing:2, padding:'10px 18px', cursor:'pointer', fontWeight:'bold', flexShrink:0,
  },
  chips: { display:'flex', gap:6, marginTop:8, flexWrap:'wrap' },
  chip: {
    background:'transparent', border:'1px solid #1a2535', color:'#334155',
    fontFamily:"'Space Mono',monospace", fontSize:9, padding:'3px 8px', cursor:'pointer',
    letterSpacing:0.5,
  },

  // Timeline
  timelinePanel: { padding:'clamp(0.75rem, 2vw, 0.9rem) clamp(0.9rem, 2.4vw, 1.25rem)', borderBottom:'1px solid rgba(56,189,248,0.10)', background:'rgba(8,13,20,0.72)', flexShrink:0 },
  tlLabel: { fontSize:9, color:'#475569', letterSpacing:2, marginBottom:8, fontFamily:"'Space Mono',monospace" },
  tlBars: { display:'flex', alignItems:'flex-end', gap:3, height:44 },
  tlBar: { display:'flex', flexDirection:'column', alignItems:'center', gap:2, flex:'1 1 0', minWidth:0 },
  tlBarFill: { width:'100%', background:'rgba(34,197,94,0.5)', borderTop:'1px solid #22c55e', transition:'height 0.3s' },
  tlBarLabel: { fontSize:8, color:'#1e3a2e', fontFamily:"'Space Mono',monospace", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%', textAlign:'center' },

  // Table
  tablePanel: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:'clamp(22rem, 58vh, 42rem)', background:'rgba(8,13,20,0.55)' },
  tableHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 20px', borderBottom:'1px solid #0f1e2e', flexShrink:0 },
  tableScroll: { flex:1, overflow:'auto', position:'relative' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:11, fontFamily:"'Space Mono',monospace" },
  th: {
    textAlign:'left', padding:'8px 14px', fontSize:9, color:'#475569', letterSpacing:2,
    borderBottom:'1px solid #0f1e2e', background:'rgba(10,15,22,0.95)',
    position:'sticky', top:0, whiteSpace:'nowrap',
  },
  td: { padding:'7px 14px', borderBottom:'1px solid rgba(15,30,46,0.5)', whiteSpace:'nowrap', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis' },
  emptyState: { padding:40, textAlign:'center', color:'#1e3a2e', fontFamily:"'Space Mono',monospace", fontSize:12 },
  skeletonRows: { position:'absolute', inset:'3.25rem 1rem auto 1rem', display:'grid', gap:10, zIndex:2, pointerEvents:'none' },

  // Sidebar
  sidebar: { minWidth:0, overflow:'auto', background:'rgba(10,15,22,0.68)', padding:'clamp(0.85rem, 2vw, 1rem)' },
  modInfo: { marginBottom:20, padding:14, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(56,189,248,0.12)' },
  modInfoTitle: { fontSize:11, color:'#64748b', lineHeight:1.6, marginBottom:10 },
  modInfoMeta: { display:'flex', gap:16, fontSize:9, color:'#334155', fontFamily:"'Space Mono',monospace" },
  sourceLink: { display:'inline-block', marginTop:12, color:'#38bdf8', border:'1px solid rgba(56,189,248,0.28)', padding:'6px 8px', fontSize:9, letterSpacing:1.5, fontFamily:"'Space Mono',monospace", textDecoration:'none' },
  taskListLabel: { fontSize:9, color:'#475569', letterSpacing:2, marginBottom:10, fontFamily:"'Space Mono',monospace" },
  taskItem: { border:'1px solid', padding:'10px 12px', marginBottom:6, transition:'all 0.15s', borderRadius:6 },
  taskItemTop: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  taskNum: { width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontFamily:"'Space Mono',monospace", borderRadius:0 },
  taskTitle: { fontSize:11, fontWeight:500, transition:'color 0.15s' },
  pts: { fontSize:9, fontFamily:"'Space Mono',monospace" },
  taskDetail: { marginTop:16, padding:14, background:'rgba(0,0,0,0.4)', border:'1px solid #1e3a2e' },
  tdHeader: { fontSize:9, color:'#475569', letterSpacing:2, marginBottom:8, fontFamily:"'Space Mono',monospace" },
  tdTitle: { fontSize:13, fontWeight:600, color:'#22c55e', marginBottom:8 },
  tdDesc: { fontSize:11, color:'#64748b', lineHeight:1.7, marginBottom:12 },
  hintToggle: {
    width:'100%', background:'transparent', border:'1px solid #1a2535', color:'#64748b',
    fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:2, padding:'8px', cursor:'pointer',
    marginBottom:10,
  },
  hintBox: { background:'rgba(34,197,94,0.05)', border:'1px solid #1e3a2e', padding:'10px 12px', marginBottom:12 },
  answerGroup: { display:'flex', flexDirection:'column', gap:6, marginBottom:12 },
  answerLabel: { fontSize:9, color:'#475569', letterSpacing:2, fontFamily:"'Space Mono',monospace" },
  answerInput: {
    width:'100%', background:'rgba(0,0,0,0.35)', border:'1px solid #1e3a2e',
    color:'#e2e8f0', fontFamily:"'Space Mono',monospace", fontSize:12,
    padding:'10px 12px', outline:'none',
  },
  feedback: { fontSize:11, padding:'10px 12px', border:'1px solid', marginBottom:12, fontFamily:"'Space Mono',monospace" },
  submitBtn: {
    width:'100%', background:'transparent', border:'1px solid #22c55e', color:'#22c55e',
    fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, padding:'10px', cursor:'pointer',
  },
  nextBtn: {
    width:'100%', background:'#22c55e', border:'none', color:'#000',
    fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:2, padding:'10px', cursor:'pointer', fontWeight:'bold',
  },
  fieldsRef: { marginTop:16, padding:12, background:'rgba(0,0,0,0.2)', border:'1px solid #0f1e2e' },
  fieldChip: { fontSize:9, color:'#334155', border:'1px solid #1a2535', padding:'2px 6px', fontFamily:"'Space Mono',monospace" },
  fallbackRoot: { flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'clamp(1rem, 4vw, 2rem)' },
  fallbackPanel: { width:'min(100%, 34rem)', background:'rgba(15,21,32,0.88)', border:'1px solid rgba(248,113,113,0.32)', padding:'clamp(1.25rem, 3vw, 1.75rem)' },
  fallbackKicker: { color:'#f87171', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:3, marginBottom:10 },
  fallbackTitle: { fontSize:22, lineHeight:1.2, margin:'0 0 10px', letterSpacing:0 },
  fallbackCopy: { color:'#94a3b8', fontSize:13, lineHeight:1.6, marginBottom:14 },
  fallbackMeta: { color:'#f59e0b', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.26)', padding:'9px 10px', fontSize:11, fontFamily:"'Space Mono',monospace", marginBottom:14 },
};

Object.assign(window, { ModulePage });
