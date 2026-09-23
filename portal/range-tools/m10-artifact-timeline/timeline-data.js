// Artifact Timeline — dataset for Module 10 (Evidence handling & case
// reconstruction).
//
// Structurally ported from the Boots2Bytes SOC Analyst Track's
// `TimelineExplorerLabShell` / wf-3 lab
// (`src/shells/windows-forensics-shells.jsx`,
// `src/data/labs/windows-forensics.labs.js`) — same three-artifact-type
// shape (filesystem timeline, Prefetch, Shellbags) and the same insider
// staging-then-USB-transfer narrative arc, per docs/LAB_MIGRATION_MATRIX.md's
// "Windows forensics suite -> M10" row. The specific case identifiers,
// filenames, and row counts are original to this port, not copied from the
// source fixture, and the tool is renamed away from any real-product
// implication (no "FTK Imager" / "Timeline Explorer" branding).
//
// Task validation is visible client-side, same known limitation carried over
// from the M3 pilot (`portal/range-tools/m03-log-explorer/log-data.js`) —
// not fixed in this pass. Not wired to recordLabAttempt() or instructor
// review; see docs/LAB_MIGRATION_MATRIX.md's Epic C row.

function m10BuildTimelineRows() {
  const rows = [];
  let n = 0;

  // Baseline: ordinary quarterly report edits (benign distractor volume).
  for (let i = 1; i <= 12; i += 1) {
    n += 1;
    rows.push({
      id: `mft-${n}`,
      source: 'MFT',
      path: `C:\\Users\\mwren\\Documents\\Quarterly\\report-${String(i).padStart(3, '0')}.docx`,
      created: `2026-09-08 0${7 + (i % 3)}:1${i % 6}:0${i % 9 || 1}`,
      modified: `2026-09-08 0${7 + (i % 3)}:2${i % 6}:1${i % 9 || 1}`,
      entryNumber: String(1000 + n),
      size: `${18 + (i % 6)} KB`,
      zone: '0',
    });
  }

  // Staging: the export directory the case turns on.
  for (let i = 1; i <= 8; i += 1) {
    n += 1;
    rows.push({
      id: `mft-${n}`,
      source: 'MFT',
      path: `C:\\Users\\mwren\\AppData\\Local\\Temp\\export\\acct-${String(i).padStart(3, '0')}.csv`,
      created: `2026-09-08 13:4${i}:0${i}`,
      modified: `2026-09-08 13:4${i}:3${i % 6 || 1}`,
      entryNumber: String(1000 + n),
      size: `${26 + i} KB`,
      zone: '0',
    });
  }

  // Removable-media writes: only the first five staged files were copied.
  for (let i = 1; i <= 5; i += 1) {
    n += 1;
    rows.push({
      id: `mft-${n}`,
      source: 'MFT',
      path: `F:\\staging\\acct-${String(i).padStart(3, '0')}.csv`,
      created: `2026-09-08 14:0${i}:1${i}`,
      modified: `2026-09-08 14:0${i}:4${i}`,
      entryNumber: String(1000 + n),
      size: `${26 + i} KB`,
      zone: '3',
    });
  }

  // Archive bundles built from the staged export.
  for (let i = 1; i <= 2; i += 1) {
    n += 1;
    rows.push({
      id: `mft-${n}`,
      source: 'MFT',
      path: `C:\\Users\\mwren\\AppData\\Local\\Temp\\export\\finance-bundle-${i}.zip`,
      created: `2026-09-08 13:5${i}:0${i}`,
      modified: `2026-09-08 13:5${i}:3${i}`,
      entryNumber: String(1000 + n),
      size: `${3 + i} MB`,
      zone: '0',
    });
  }

  return rows;
}

const M10_ARTIFACT_TIMELINE_DATASET = {
  id: 'm10-artifact-timeline',
  caseId: 'INC-5188',
  title: 'Post-termination finance export review',
  subtitle: 'Endpoint ws-241 · account mwren',
  description: 'A departing employee\u2019s workstation shows quarterly finance reports edited normally, then a burst of copies into a temp export folder, then writes to a removable drive, then two archive bundles. Reconstruct the sequence from the raw artifact timeline and identify the supporting Prefetch and Shellbags evidence.',
  timelineColumns: ['path', 'created', 'modified', 'entryNumber', 'size', 'zone'],
  timeline: m10BuildTimelineRows(),
  prefetch: [
    { id: 'pf-archive', executable: 'ARCHIVE-UTIL.EXE', lastRun: '2026-09-08 13:58:41', runCount: '4', path: 'C:\\Program Files\\ArchiveUtil\\archive-util.exe' },
    { id: 'pf-robocopy', executable: 'ROBOCOPY.EXE', lastRun: '2026-09-08 13:44:02', runCount: '2', path: 'C:\\Windows\\System32\\robocopy.exe' },
    { id: 'pf-explorer', executable: 'EXPLORER.EXE', lastRun: '2026-09-08 14:09:15', runCount: '211', path: 'C:\\Windows\\explorer.exe' },
  ],
  shellbags: [
    { id: 'sb-f-staging', path: 'F:\\staging', lastAccessed: '2026-09-08 14:09:22', user: 'mwren' },
    { id: 'sb-temp-export', path: 'C:\\Users\\mwren\\AppData\\Local\\Temp\\export', lastAccessed: '2026-09-08 13:47:50', user: 'mwren' },
    { id: 'sb-f-archives', path: 'F:\\staging\\archives', lastAccessed: '2026-09-08 14:11:03', user: 'mwren' },
  ],
  tasks: [
    {
      id: 't1',
      title: 'Isolate the staging directory',
      points: 10,
      description: 'Search the timeline for the temporary folder where the finance files were staged before transfer. All matching rows should come from that one folder.',
      hint: 'Try searching for "export" — it should return the 8 staged CSVs and the 2 archive bundles, and nothing from the Quarterly or F:\\staging folders.',
      validate: (state) => {
        const term = state.searchTerm.trim().toLowerCase();
        if (!term) return false;
        const rows = state.timeline.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(term)));
        return rows.length === 10 && rows.every((row) => row.path.includes('Temp\\export'));
      },
    },
    {
      id: 't2',
      title: 'Confirm the packaging tool',
      points: 20,
      description: 'Open the Prefetch view and select the executable that packaged the staged files into an archive, immediately before the removable-media writes.',
      hint: 'Compare LastRun times: the packaging tool ran before the F:\\staging writes at 14:01, and robocopy ran earlier still.',
      validate: (state) => state.selectedPrefetch === 'pf-archive',
    },
    {
      id: 't3',
      title: 'Verify removable-media access',
      points: 20,
      description: 'Open the Shellbags view and select the record proving the user browsed the removable-drive staging folder itself (not the archives subfolder).',
      hint: 'The path you want begins with the same drive letter as the F:\\staging MFT rows, and is the shorter of the two F:\\ shellbag paths.',
      validate: (state) => state.selectedShellbag === 'sb-f-staging',
    },
    {
      id: 't4',
      title: 'Document chain of custody',
      points: 20,
      description: 'Write at least 150 characters stating what this evidence proves, which artifact sources you relied on (timeline, Prefetch, Shellbags), the case ID, and one limitation of what you can conclude from it.',
      hint: `Name ${'INC-5188'}, the staging path, the packaging tool, and the removable-media evidence — then state plainly what you cannot prove from artifacts alone (e.g., file contents, destination beyond the drive, intent).`,
      validate: (state) => state.custodyNote.trim().length >= 150,
    },
  ],
};

Object.assign(window, { M10_ARTIFACT_TIMELINE_DATASET });
