// Static File Analysis — fixture data for Module 5 (Endpoint & malware investigation).
//
// Header, section, import, resource, and hex-row values are ported from the
// Boots2Bytes SOC Analyst Track's `malware-analysis-shells.jsx` fixtures
// (PEVIEW_DATA, DEPWALK_DATA, RESOURCE_DATA, HXD_DATA) as part of the
// Epic B/C migration (see docs/LAB_MIGRATION_MATRIX.md, "Malware analysis
// tool suite" row). Values are unchanged from the source; only the task
// list and narrative framing were adapted to tie the sample to this
// module's existing WS-LAB-27 / update-check.exe scenario. This dataset
// intentionally covers only the static-analysis slice of the source lab
// (`ma-1`) — the dynamic-analysis, sandbox, and packet-capture tools in the
// same source file are out of scope for this pass.

const M05_STATIC_SAMPLE = {
  id: 'm05-static-file-review',
  title: 'update-check.exe',
  subtitle: 'Static File Analysis',
  description: 'A suspicious executable was pulled from an isolated training workstation (case EDR-205, WS-LAB-27). Inspect static clues without executing the sample and identify the networking and persistence indicators hidden in the file.',
  headers: [
    { id: 'IMAGE_DOS_HEADER', title: 'IMAGE_DOS_HEADER', detail: 'e_magic=MZ, e_lfanew=0x00000180' },
    { id: 'IMAGE_NT_HEADERS', title: 'IMAGE_NT_HEADERS', detail: 'Machine=0x14c, TimeDateStamp=2026-04-22 14:05:33 UTC, EntryPoint=0x00001370' },
    { id: 'IAT', title: 'Import Address Table', detail: 'Imports resolve through .rdata and WS2_32 networking calls.' },
  ],
  sections: [
    { id: '.text', title: '.text', detail: 'VirtualSize=0x1800, Entry stub and process launcher logic.' },
    { id: '.data', title: '.data', detail: 'VirtualSize=0x0600, runtime configuration and registry strings.' },
    { id: '.rdata', title: '.rdata', detail: 'VirtualSize=0x0a00, imports and embedded URLs.' },
  ],
  imports: [
    { dll: 'KERNEL32.DLL', funcs: ['CreateFileW', 'WriteFile', 'CreateProcessW'] },
    { dll: 'ADVAPI32.DLL', funcs: ['RegCreateKeyExW', 'RegSetValueExW'] },
    { dll: 'WS2_32.DLL', funcs: ['WSAStartup', 'socket', 'connect', 'send'] },
  ],
  resources: [
    { group: 'Icon', items: ['MAINICON'] },
    { group: 'Dialog', items: ['ABOUTBOX'] },
    { group: 'String Table', items: ['1033: "System Update"', '1033: "Applying critical patches"'] },
    { group: 'Version Info', items: ['CompanyName: MissionNext Systems', 'FileDescription: Update helper'] },
  ],
  hexRows: [
    { offset: '00000000', hex: '4D 5A 90 00 03 00 00 00 04 00 00 00 FF FF 00 00', ascii: 'MZ..............' },
    { offset: '00000180', hex: '50 45 00 00 4C 01 05 00 AD 92 8F 66 00 00 00 00', ascii: 'PE..L......f....' },
    { offset: '00000C40', hex: '58 4F 52 5F 53 45 4E 54 49 4E 45 4C 3D 35 41 00', ascii: 'XOR_SENTINEL=5A.' },
    { offset: '00001020', hex: '68 78 78 70 3A 2F 2F 75 70 64 61 74 65 2D 73 79', ascii: 'hxxp://update-sy' },
  ],
  tasks: [
    { id: 't1', title: 'Inspect the PE header timestamp', points: 10, description: 'Open IMAGE_NT_HEADERS to review the entry point and compile timestamp metadata.', hint: 'Select IMAGE_NT_HEADERS in the Header Inspector list.' },
    { id: 't2', title: 'Trace the networking import', points: 10, description: 'Find the WS2_32.DLL import table and select the connect function to confirm the sample opens outbound sockets.', hint: 'Open WS2_32.DLL in the Import Table tab, then click connect.' },
    { id: 't3', title: 'Find the disguised resource string', points: 10, description: 'Locate the embedded string table entry that presents this sample as a routine system update.', hint: 'Look under String Table in the Embedded Resources tab for "System Update".' },
    { id: 't4', title: 'Locate the encoding marker', points: 10, description: 'Search the hex view for the XOR_SENTINEL marker that indicates a simple encoding scheme in the payload.', hint: 'Jump to offset 00000C40 in the Hex View tab.' },
  ],
};

Object.assign(window, { M05_STATIC_SAMPLE });
