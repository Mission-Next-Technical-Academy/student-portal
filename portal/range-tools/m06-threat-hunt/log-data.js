// Log Explorer — dataset for Module 6 (Hypothesis-led threat hunt).
//
// Log rows and task list ported from the Boots2Bytes SOC Analyst Track's
// "mod-5" Tunnel Log Analysis dataset (`src/data.js`, `LOGS_TUNNEL`), copied
// as part of the Epic B/C migration (docs/LAB_MIGRATION_MATRIX.md — the
// matrix's Module 6 row calls for reusing M3's adapted SIEM engine rather
// than duplicating it, so this is a second dataset for the same ported tool,
// not a second tool). Values are unchanged from the source; only the module
// id/title were kept generic. The task list's `validation` objects are
// visible client-side, same as in the source app and same as M3's carried-
// over limitation — not fixed here (see the matrix row's "REQUIRED
// ADAPTATION" and RISKS columns).
//
// Hunt framing: a sustained GRE tunnel from 10.1.0.33 to a small set of
// external IPs (185.220.101.5 / 185.220.101.9) hides amid a sea of quick,
// legitimate DNS-resolver lookups — a beaconing pattern well suited to
// hypothesis-led hunting rather than simple alert triage.

const M06_LOG_DATASET = {
  id: 'm06-tunnel-log-analysis',
  title: 'Tunnel Log Analysis',
  subtitle: 'GRE Covert Channel Detection',
  description: 'Using Zeek IDS tunnel logs, identify hosts creating persistent GRE tunnels to external IPs. Long-duration, high-volume tunnels may indicate covert C2 channels.',
  fields: ['id', 'ts', 'src_ip', 'dst_ip', 'tunnel_type', 'inner_proto', 'duration', 'bytes'],
  logs: [
    { id: 1, ts: '2024-01-19 11:00:01', src_ip: '10.1.0.5', dst_ip: '8.8.8.8', tunnel_type: 'GRE', inner_proto: 'IPv4', duration: 0.001, bytes: 128 },
    { id: 2, ts: '2024-01-19 11:00:05', src_ip: '10.1.0.5', dst_ip: '8.8.8.8', tunnel_type: 'GRE', inner_proto: 'IPv4', duration: 0.001, bytes: 130 },
    { id: 3, ts: '2024-01-19 11:01:00', src_ip: '10.1.0.33', dst_ip: '185.220.101.5', tunnel_type: 'GRE', inner_proto: 'IPv4', duration: 120.5, bytes: 204800 },
    { id: 4, ts: '2024-01-19 11:01:01', src_ip: '10.1.0.33', dst_ip: '185.220.101.5', tunnel_type: 'GRE', inner_proto: 'IPv4', duration: 118.2, bytes: 198400 },
    { id: 5, ts: '2024-01-19 11:01:02', src_ip: '10.1.0.33', dst_ip: '185.220.101.5', tunnel_type: 'GRE', inner_proto: 'IPv6', duration: 115.8, bytes: 192000 },
    { id: 6, ts: '2024-01-19 11:02:00', src_ip: '10.1.0.10', dst_ip: '1.1.1.1', tunnel_type: 'IPv4', inner_proto: 'IPv4', duration: 0.002, bytes: 64 },
    { id: 7, ts: '2024-01-19 11:03:00', src_ip: '10.1.0.33', dst_ip: '185.220.101.5', tunnel_type: 'GRE', inner_proto: 'IPv4', duration: 122.1, bytes: 210000 },
    { id: 8, ts: '2024-01-19 11:03:01', src_ip: '10.1.0.33', dst_ip: '185.220.101.5', tunnel_type: 'GRE', inner_proto: 'IPv6', duration: 119.7, bytes: 205800 },
    { id: 9, ts: '2024-01-19 11:04:00', src_ip: '10.1.0.22', dst_ip: '9.9.9.9', tunnel_type: 'IPv4', inner_proto: 'IPv4', duration: 0.001, bytes: 80 },
    { id: 10, ts: '2024-01-19 11:05:00', src_ip: '10.1.0.33', dst_ip: '185.220.101.9', tunnel_type: 'GRE', inner_proto: 'IPv4', duration: 125.0, bytes: 215000 },
    { id: 11, ts: '2024-01-19 11:05:01', src_ip: '10.1.0.33', dst_ip: '185.220.101.9', tunnel_type: 'GRE', inner_proto: 'IPv6', duration: 121.3, bytes: 208000 },
    { id: 12, ts: '2024-01-19 11:06:00', src_ip: '10.1.0.5', dst_ip: '8.8.4.4', tunnel_type: 'GRE', inner_proto: 'IPv4', duration: 0.001, bytes: 128 },
    { id: 13, ts: '2024-01-19 11:07:00', src_ip: '10.1.0.33', dst_ip: '185.220.101.5', tunnel_type: 'GRE', inner_proto: 'IPv4', duration: 117.9, bytes: 195200 },
    { id: 14, ts: '2024-01-19 11:08:00', src_ip: '10.1.0.44', dst_ip: '208.67.222.222', tunnel_type: 'IPv4', inner_proto: 'IPv4', duration: 0.002, bytes: 64 },
    { id: 15, ts: '2024-01-19 11:09:00', src_ip: '10.1.0.33', dst_ip: '185.220.101.5', tunnel_type: 'GRE', inner_proto: 'IPv4', duration: 119.4, bytes: 200000 },
    { id: 16, ts: '2024-01-19 11:10:00', src_ip: '10.1.0.33', dst_ip: '185.220.101.5', tunnel_type: 'GRE', inner_proto: 'IPv6', duration: 123.2, bytes: 212000 },
    { id: 17, ts: '2024-01-19 11:11:00', src_ip: '10.1.0.15', dst_ip: '1.0.0.1', tunnel_type: 'IPv4', inner_proto: 'IPv4', duration: 0.001, bytes: 64 },
    { id: 18, ts: '2024-01-19 11:12:00', src_ip: '10.1.0.33', dst_ip: '185.220.101.9', tunnel_type: 'GRE', inner_proto: 'IPv4', duration: 116.5, bytes: 193600 },
    { id: 19, ts: '2024-01-19 11:13:00', src_ip: '10.1.0.33', dst_ip: '185.220.101.9', tunnel_type: 'GRE', inner_proto: 'IPv6', duration: 120.8, bytes: 207000 },
    { id: 20, ts: '2024-01-19 11:14:00', src_ip: '10.1.0.5', dst_ip: '8.8.8.8', tunnel_type: 'GRE', inner_proto: 'IPv4', duration: 0.001, bytes: 128 },
  ],
  tasks: [
    { id: 't1', title: 'Isolate GRE tunnel events', points: 10, description: 'GRE tunnels can be used to encapsulate malicious traffic. Retrieve all tunnel events of type GRE.', hint: 'Try: search tunnel_type=GRE', validation: { type: 'count', field: 'tunnel_type', value: 'GRE', expected: 16 } },
    { id: 't2', title: 'Count GRE tunnels by source', points: 20, description: 'Count GRE tunnel events by source IP to find the host creating the most tunnels.', hint: 'Try: search tunnel_type=GRE | count by src_ip', validation: { type: 'groupby', field: 'src_ip', expected_top: '10.1.0.33' } },
    { id: 't3', title: 'Profile the suspicious tunnel host', points: 30, description: 'Drill into all tunnel events from 10.1.0.33. Look for long durations (>100s) and large byte counts indicating persistent C2.', hint: 'Try: search src_ip=10.1.0.33', validation: { type: 'count_gt', field: 'src_ip', value: '10.1.0.33', threshold: 8 } },
  ],
};

Object.assign(window, { M06_LOG_DATASET });
