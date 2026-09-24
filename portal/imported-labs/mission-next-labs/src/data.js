// ============================================================
//  Mission Next — SOC Analyst Track  |  Data Layer
// ============================================================

const USERS = [
  { id:1,  username:'student_01', role:'student',    displayName:'Student 01' },
  { id:2,  username:'student_02', role:'student',    displayName:'Student 02' },
  { id:3,  username:'student_03', role:'student',    displayName:'Student 03' },
  { id:4,  username:'student_04', role:'student',    displayName:'Student 04' },
  { id:5,  username:'student_05', role:'student',    displayName:'Student 05' },
  { id:6,  username:'student_06', role:'student',    displayName:'Student 06' },
  { id:7,  username:'student_07', role:'student',    displayName:'Student 07' },
  { id:8,  username:'student_08', role:'student',    displayName:'Student 08' },
  { id:9,  username:'student_09', role:'student',    displayName:'Student 09' },
  { id:10, username:'student_10', role:'student',    displayName:'Student 10' },
  { id:11, username:'instructor', role:'instructor', displayName:'Instructor' },
];

// ─────────────────────────────────────────────────────────────
//  MODULE 1 — DNS Log Analysis
// ─────────────────────────────────────────────────────────────
const LOGS_DNS = [
  {id:1,  ts:'2024-01-15 08:00:01', src_ip:'10.0.1.14', query:'google.com',              qtype:'A',   rcode:'NOERROR',  ttl:300,  bytes:48},
  {id:2,  ts:'2024-01-15 08:00:04', src_ip:'10.0.1.14', query:'github.com',              qtype:'A',   rcode:'NOERROR',  ttl:60,   bytes:48},
  {id:3,  ts:'2024-01-15 08:01:10', src_ip:'10.0.1.88', query:'a1b2c3d4e5f6.xyz',        qtype:'A',   rcode:'NOERROR',  ttl:5,    bytes:112},
  {id:4,  ts:'2024-01-15 08:01:11', src_ip:'10.0.1.88', query:'a1b2c3d4e5f7.xyz',        qtype:'TXT', rcode:'NOERROR',  ttl:5,    bytes:204},
  {id:5,  ts:'2024-01-15 08:01:12', src_ip:'10.0.1.88', query:'a1b2c3d4e5f8.xyz',        qtype:'TXT', rcode:'NOERROR',  ttl:5,    bytes:198},
  {id:6,  ts:'2024-01-15 08:01:13', src_ip:'10.0.1.88', query:'b9c3f2a7e1d5.xyz',        qtype:'TXT', rcode:'NOERROR',  ttl:5,    bytes:211},
  {id:7,  ts:'2024-01-15 08:02:00', src_ip:'10.0.1.22', query:'microsoft.com',           qtype:'A',   rcode:'NOERROR',  ttl:3600, bytes:48},
  {id:8,  ts:'2024-01-15 08:02:30', src_ip:'10.0.1.55', query:'amazonaws.com',           qtype:'A',   rcode:'NOERROR',  ttl:60,   bytes:48},
  {id:9,  ts:'2024-01-15 08:03:00', src_ip:'10.0.1.88', query:'d5e9f3a8b2c6.evil.top',   qtype:'TXT', rcode:'NOERROR',  ttl:5,    bytes:220},
  {id:10, ts:'2024-01-15 08:03:01', src_ip:'10.0.1.88', query:'e6f0a4b8c2d7.evil.top',   qtype:'TXT', rcode:'NOERROR',  ttl:5,    bytes:218},
  {id:11, ts:'2024-01-15 08:03:02', src_ip:'10.0.1.88', query:'f7a1b5c9d3e8.evil.top',   qtype:'TXT', rcode:'NOERROR',  ttl:5,    bytes:209},
  {id:12, ts:'2024-01-15 08:04:00', src_ip:'10.0.1.33', query:'cloudflare.com',          qtype:'A',   rcode:'NOERROR',  ttl:300,  bytes:48},
  {id:13, ts:'2024-01-15 08:04:30', src_ip:'10.0.1.14', query:'slack.com',               qtype:'A',   rcode:'NOERROR',  ttl:120,  bytes:48},
  {id:14, ts:'2024-01-15 08:05:00', src_ip:'10.0.1.88', query:'g8b2c6d0e4f9.beacon.io',  qtype:'TXT', rcode:'NOERROR',  ttl:5,    bytes:215},
  {id:15, ts:'2024-01-15 08:05:01', src_ip:'10.0.1.88', query:'h9c3d7e1f5a0.beacon.io',  qtype:'TXT', rcode:'NOERROR',  ttl:5,    bytes:207},
  {id:16, ts:'2024-01-15 08:05:02', src_ip:'10.0.1.88', query:'i0d4e8f2b6a1.beacon.io',  qtype:'TXT', rcode:'NOERROR',  ttl:5,    bytes:213},
  {id:17, ts:'2024-01-15 08:06:00', src_ip:'10.0.1.77', query:'yahoo.com',               qtype:'A',   rcode:'NOERROR',  ttl:900,  bytes:48},
  {id:18, ts:'2024-01-15 08:07:00', src_ip:'10.0.1.88', query:'j1e5f9a3b7c2.beacon.io',  qtype:'TXT', rcode:'NXDOMAIN', ttl:5,    bytes:80},
  {id:19, ts:'2024-01-15 08:08:00', src_ip:'10.0.1.99', query:'zoom.us',                 qtype:'A',   rcode:'NOERROR',  ttl:60,   bytes:48},
  {id:20, ts:'2024-01-15 08:09:00', src_ip:'10.0.1.88', query:'k2f6a0b4c8d3.beacon.io',  qtype:'TXT', rcode:'NOERROR',  ttl:5,    bytes:219},
];

// ─────────────────────────────────────────────────────────────
//  MODULE 2 — FTP Log Analysis
// ─────────────────────────────────────────────────────────────
const LOGS_FTP = [
  {id:1,  ts:'2024-01-16 09:00:01', src_ip:'192.168.1.10', user:'analyst1',  action:'LOGIN',    file:'',                   size:0,      status:'success'},
  {id:2,  ts:'2024-01-16 09:00:05', src_ip:'192.168.1.10', user:'analyst1',  action:'DOWNLOAD', file:'report_q1.pdf',       size:204800, status:'success'},
  {id:3,  ts:'2024-01-16 09:01:00', src_ip:'10.4.5.200',   user:'anonymous', action:'LOGIN',    file:'',                   size:0,      status:'success'},
  {id:4,  ts:'2024-01-16 09:01:10', src_ip:'10.4.5.200',   user:'anonymous', action:'DOWNLOAD', file:'passwd.bak',          size:1024,   status:'success'},
  {id:5,  ts:'2024-01-16 09:01:11', src_ip:'10.4.5.200',   user:'anonymous', action:'DOWNLOAD', file:'shadow.bak',          size:512,    status:'success'},
  {id:6,  ts:'2024-01-16 09:01:12', src_ip:'10.4.5.200',   user:'anonymous', action:'DOWNLOAD', file:'config.xml',          size:8192,   status:'success'},
  {id:7,  ts:'2024-01-16 09:01:13', src_ip:'10.4.5.200',   user:'anonymous', action:'DOWNLOAD', file:'database_backup.sql', size:5242880,status:'success'},
  {id:8,  ts:'2024-01-16 09:02:00', src_ip:'192.168.1.55', user:'ftpadmin',  action:'LOGIN',    file:'',                   size:0,      status:'success'},
  {id:9,  ts:'2024-01-16 09:02:10', src_ip:'192.168.1.55', user:'ftpadmin',  action:'UPLOAD',   file:'patch.sh',            size:2048,   status:'success'},
  {id:10, ts:'2024-01-16 09:03:00', src_ip:'10.4.5.200',   user:'anonymous', action:'DOWNLOAD', file:'keys.tar.gz',         size:16384,  status:'success'},
  {id:11, ts:'2024-01-16 09:03:10', src_ip:'10.4.5.200',   user:'anonymous', action:'DOWNLOAD', file:'certs.tar.gz',        size:12288,  status:'success'},
  {id:12, ts:'2024-01-16 09:04:00', src_ip:'172.16.0.5',   user:'backup',    action:'LOGIN',    file:'',                   size:0,      status:'success'},
  {id:13, ts:'2024-01-16 09:04:05', src_ip:'172.16.0.5',   user:'backup',    action:'UPLOAD',   file:'daily_backup.tar',    size:104857600,status:'success'},
  {id:14, ts:'2024-01-16 09:05:00', src_ip:'10.4.5.200',   user:'anonymous', action:'DOWNLOAD', file:'web.config',          size:4096,   status:'success'},
  {id:15, ts:'2024-01-16 09:05:30', src_ip:'203.0.113.5',  user:'hacker',    action:'LOGIN',    file:'',                   size:0,      status:'failed'},
  {id:16, ts:'2024-01-16 09:05:31', src_ip:'203.0.113.5',  user:'hacker',    action:'LOGIN',    file:'',                   size:0,      status:'failed'},
  {id:17, ts:'2024-01-16 09:05:32', src_ip:'203.0.113.5',  user:'admin',     action:'LOGIN',    file:'',                   size:0,      status:'failed'},
  {id:18, ts:'2024-01-16 09:06:00', src_ip:'192.168.1.10', user:'analyst1',  action:'LOGOUT',   file:'',                   size:0,      status:'success'},
  {id:19, ts:'2024-01-16 09:07:00', src_ip:'10.4.5.200',   user:'anonymous', action:'LOGOUT',   file:'',                   size:0,      status:'success'},
  {id:20, ts:'2024-01-16 09:08:00', src_ip:'192.168.1.55', user:'ftpadmin',  action:'LOGOUT',   file:'',                   size:0,      status:'success'},
];

// ─────────────────────────────────────────────────────────────
//  MODULE 3 — HTTP Log Analysis
// ─────────────────────────────────────────────────────────────
const LOGS_HTTP = [
  {id:1,  ts:'2024-01-17 10:00:01', src_ip:'192.168.2.10', method:'GET',  uri:'/index.html',                    status:200, bytes:1024,  user_agent:'Mozilla/5.0'},
  {id:2,  ts:'2024-01-17 10:00:03', src_ip:'192.168.2.10', method:'GET',  uri:'/about.html',                    status:200, bytes:512,   user_agent:'Mozilla/5.0'},
  {id:3,  ts:'2024-01-17 10:01:00', src_ip:'45.33.32.156', method:'GET',  uri:'/admin/login.php',               status:200, bytes:4096,  user_agent:'sqlmap/1.7'},
  {id:4,  ts:'2024-01-17 10:01:01', src_ip:'45.33.32.156', method:'POST', uri:'/admin/login.php',               status:200, bytes:256,   user_agent:'sqlmap/1.7'},
  {id:5,  ts:'2024-01-17 10:01:02', src_ip:'45.33.32.156', method:'GET',  uri:"/admin/login.php?id=1'",         status:500, bytes:128,   user_agent:'sqlmap/1.7'},
  {id:6,  ts:'2024-01-17 10:01:03', src_ip:'45.33.32.156', method:'GET',  uri:"/admin/login.php?id=1 OR 1=1",   status:200, bytes:8192,  user_agent:'sqlmap/1.7'},
  {id:7,  ts:'2024-01-17 10:01:04', src_ip:'45.33.32.156', method:'GET',  uri:'/admin/users.php',               status:200, bytes:16384, user_agent:'sqlmap/1.7'},
  {id:8,  ts:'2024-01-17 10:02:00', src_ip:'192.168.2.22', method:'GET',  uri:'/products.html',                 status:200, bytes:2048,  user_agent:'Mozilla/5.0'},
  {id:9,  ts:'2024-01-17 10:02:30', src_ip:'45.33.32.156', method:'GET',  uri:'/admin/config.php',              status:403, bytes:64,    user_agent:'sqlmap/1.7'},
  {id:10, ts:'2024-01-17 10:03:00', src_ip:'45.33.32.156', method:'GET',  uri:'/etc/passwd',                    status:404, bytes:64,    user_agent:'Nikto/2.1.6'},
  {id:11, ts:'2024-01-17 10:03:01', src_ip:'45.33.32.156', method:'GET',  uri:'/../../../etc/shadow',           status:404, bytes:64,    user_agent:'Nikto/2.1.6'},
  {id:12, ts:'2024-01-17 10:03:02', src_ip:'45.33.32.156', method:'GET',  uri:'/phpmyadmin/',                   status:404, bytes:64,    user_agent:'Nikto/2.1.6'},
  {id:13, ts:'2024-01-17 10:04:00', src_ip:'192.168.2.5',  method:'GET',  uri:'/contact.html',                  status:200, bytes:768,   user_agent:'Mozilla/5.0'},
  {id:14, ts:'2024-01-17 10:05:00', src_ip:'45.33.32.156', method:'POST', uri:'/admin/upload.php',              status:200, bytes:512,   user_agent:'curl/7.81.0'},
  {id:15, ts:'2024-01-17 10:05:01', src_ip:'45.33.32.156', method:'GET',  uri:'/uploads/shell.php',             status:200, bytes:4096,  user_agent:'curl/7.81.0'},
  {id:16, ts:'2024-01-17 10:06:00', src_ip:'192.168.2.10', method:'GET',  uri:'/services.html',                 status:200, bytes:1536,  user_agent:'Mozilla/5.0'},
  {id:17, ts:'2024-01-17 10:07:00', src_ip:'10.0.0.5',     method:'GET',  uri:'/api/v1/users',                  status:401, bytes:128,   user_agent:'python-requests/2.28'},
  {id:18, ts:'2024-01-17 10:07:01', src_ip:'10.0.0.5',     method:'GET',  uri:'/api/v1/users',                  status:401, bytes:128,   user_agent:'python-requests/2.28'},
  {id:19, ts:'2024-01-17 10:08:00', src_ip:'192.168.2.30', method:'GET',  uri:'/blog/',                         status:200, bytes:3072,  user_agent:'Mozilla/5.0'},
  {id:20, ts:'2024-01-17 10:09:00', src_ip:'45.33.32.156', method:'GET',  uri:'/wp-login.php',                  status:404, bytes:64,    user_agent:'Nikto/2.1.6'},
];

// ─────────────────────────────────────────────────────────────
//  MODULE 4 — SSH Log Analysis
// ─────────────────────────────────────────────────────────────
const LOGS_SSH = [
  {id:1,  ts:'2024-01-18 07:00:01', src_ip:'192.168.1.105', user:'admin',    status:'failed',  method:'password', port:22},
  {id:2,  ts:'2024-01-18 07:00:03', src_ip:'192.168.1.105', user:'admin',    status:'failed',  method:'password', port:22},
  {id:3,  ts:'2024-01-18 07:00:05', src_ip:'192.168.1.105', user:'admin',    status:'failed',  method:'password', port:22},
  {id:4,  ts:'2024-01-18 07:00:07', src_ip:'192.168.1.105', user:'admin',    status:'failed',  method:'password', port:22},
  {id:5,  ts:'2024-01-18 07:00:09', src_ip:'192.168.1.105', user:'admin',    status:'failed',  method:'password', port:22},
  {id:6,  ts:'2024-01-18 07:00:11', src_ip:'192.168.1.105', user:'root',     status:'failed',  method:'password', port:22},
  {id:7,  ts:'2024-01-18 07:00:13', src_ip:'192.168.1.105', user:'root',     status:'failed',  method:'password', port:22},
  {id:8,  ts:'2024-01-18 07:01:00', src_ip:'10.0.0.22',     user:'jdoe',     status:'success', method:'publickey',port:22},
  {id:9,  ts:'2024-01-18 07:01:30', src_ip:'172.16.0.5',    user:'sysadmin', status:'success', method:'publickey',port:22},
  {id:10, ts:'2024-01-18 07:02:00', src_ip:'203.0.113.42',  user:'root',     status:'failed',  method:'password', port:22},
  {id:11, ts:'2024-01-18 07:02:01', src_ip:'203.0.113.42',  user:'root',     status:'failed',  method:'password', port:22},
  {id:12, ts:'2024-01-18 07:02:02', src_ip:'203.0.113.42',  user:'admin',    status:'failed',  method:'password', port:22},
  {id:13, ts:'2024-01-18 07:02:03', src_ip:'203.0.113.42',  user:'deploy',   status:'failed',  method:'password', port:22},
  {id:14, ts:'2024-01-18 07:03:00', src_ip:'192.168.1.200', user:'deploy',   status:'success', method:'publickey',port:22},
  {id:15, ts:'2024-01-18 07:04:00', src_ip:'192.168.1.105', user:'postgres', status:'failed',  method:'password', port:22},
  {id:16, ts:'2024-01-18 07:04:02', src_ip:'192.168.1.105', user:'postgres', status:'failed',  method:'password', port:22},
  {id:17, ts:'2024-01-18 07:04:04', src_ip:'192.168.1.105', user:'oracle',   status:'failed',  method:'password', port:22},
  {id:18, ts:'2024-01-18 07:05:00', src_ip:'10.0.0.8',      user:'analyst',  status:'success', method:'publickey',port:22},
  {id:19, ts:'2024-01-18 07:06:00', src_ip:'192.168.1.105', user:'admin',    status:'success', method:'password', port:22},
  {id:20, ts:'2024-01-18 07:07:00', src_ip:'198.51.100.10', user:'backup',   status:'failed',  method:'password', port:22},
];

// ─────────────────────────────────────────────────────────────
//  MODULE 5 — Tunnel Log Analysis (Zeek IDS)
// ─────────────────────────────────────────────────────────────
const LOGS_TUNNEL = [
  {id:1,  ts:'2024-01-19 11:00:01', src_ip:'10.1.0.5',   dst_ip:'8.8.8.8',       tunnel_type:'GRE',  inner_proto:'IPv4', duration:0.001, bytes:128},
  {id:2,  ts:'2024-01-19 11:00:05', src_ip:'10.1.0.5',   dst_ip:'8.8.8.8',       tunnel_type:'GRE',  inner_proto:'IPv4', duration:0.001, bytes:130},
  {id:3,  ts:'2024-01-19 11:01:00', src_ip:'10.1.0.33',  dst_ip:'185.220.101.5', tunnel_type:'GRE',  inner_proto:'IPv4', duration:120.5, bytes:204800},
  {id:4,  ts:'2024-01-19 11:01:01', src_ip:'10.1.0.33',  dst_ip:'185.220.101.5', tunnel_type:'GRE',  inner_proto:'IPv4', duration:118.2, bytes:198400},
  {id:5,  ts:'2024-01-19 11:01:02', src_ip:'10.1.0.33',  dst_ip:'185.220.101.5', tunnel_type:'GRE',  inner_proto:'IPv6', duration:115.8, bytes:192000},
  {id:6,  ts:'2024-01-19 11:02:00', src_ip:'10.1.0.10',  dst_ip:'1.1.1.1',       tunnel_type:'IPv4', inner_proto:'IPv4', duration:0.002, bytes:64},
  {id:7,  ts:'2024-01-19 11:03:00', src_ip:'10.1.0.33',  dst_ip:'185.220.101.5', tunnel_type:'GRE',  inner_proto:'IPv4', duration:122.1, bytes:210000},
  {id:8,  ts:'2024-01-19 11:03:01', src_ip:'10.1.0.33',  dst_ip:'185.220.101.5', tunnel_type:'GRE',  inner_proto:'IPv6', duration:119.7, bytes:205800},
  {id:9,  ts:'2024-01-19 11:04:00', src_ip:'10.1.0.22',  dst_ip:'9.9.9.9',       tunnel_type:'IPv4', inner_proto:'IPv4', duration:0.001, bytes:80},
  {id:10, ts:'2024-01-19 11:05:00', src_ip:'10.1.0.33',  dst_ip:'185.220.101.9', tunnel_type:'GRE',  inner_proto:'IPv4', duration:125.0, bytes:215000},
  {id:11, ts:'2024-01-19 11:05:01', src_ip:'10.1.0.33',  dst_ip:'185.220.101.9', tunnel_type:'GRE',  inner_proto:'IPv6', duration:121.3, bytes:208000},
  {id:12, ts:'2024-01-19 11:06:00', src_ip:'10.1.0.5',   dst_ip:'8.8.4.4',       tunnel_type:'GRE',  inner_proto:'IPv4', duration:0.001, bytes:128},
  {id:13, ts:'2024-01-19 11:07:00', src_ip:'10.1.0.33',  dst_ip:'185.220.101.5', tunnel_type:'GRE',  inner_proto:'IPv4', duration:117.9, bytes:195200},
  {id:14, ts:'2024-01-19 11:08:00', src_ip:'10.1.0.44',  dst_ip:'208.67.222.222',tunnel_type:'IPv4', inner_proto:'IPv4', duration:0.002, bytes:64},
  {id:15, ts:'2024-01-19 11:09:00', src_ip:'10.1.0.33',  dst_ip:'185.220.101.5', tunnel_type:'GRE',  inner_proto:'IPv4', duration:119.4, bytes:200000},
  {id:16, ts:'2024-01-19 11:10:00', src_ip:'10.1.0.33',  dst_ip:'185.220.101.5', tunnel_type:'GRE',  inner_proto:'IPv6', duration:123.2, bytes:212000},
  {id:17, ts:'2024-01-19 11:11:00', src_ip:'10.1.0.15',  dst_ip:'1.0.0.1',       tunnel_type:'IPv4', inner_proto:'IPv4', duration:0.001, bytes:64},
  {id:18, ts:'2024-01-19 11:12:00', src_ip:'10.1.0.33',  dst_ip:'185.220.101.9', tunnel_type:'GRE',  inner_proto:'IPv4', duration:116.5, bytes:193600},
  {id:19, ts:'2024-01-19 11:13:00', src_ip:'10.1.0.33',  dst_ip:'185.220.101.9', tunnel_type:'GRE',  inner_proto:'IPv6', duration:120.8, bytes:207000},
  {id:20, ts:'2024-01-19 11:14:00', src_ip:'10.1.0.5',   dst_ip:'8.8.8.8',       tunnel_type:'GRE',  inner_proto:'IPv4', duration:0.001, bytes:128},
];

// ─────────────────────────────────────────────────────────────
//  MODULE 6 — SMTP Log Analysis
// ─────────────────────────────────────────────────────────────
const LOGS_SMTP = [
  {id:1,  ts:'2024-01-20 08:00:01', src_ip:'192.168.3.10', from:'alice@corp.com',     to:'bob@corp.com',       subject:'Meeting Notes',              size:4096,   status:'delivered', spam_score:0.1},
  {id:2,  ts:'2024-01-20 08:01:00', src_ip:'198.51.100.5', from:'noreply@phish.xyz',  to:'ceo@corp.com',       subject:'Urgent: Verify your account', size:2048,   status:'delivered', spam_score:8.7},
  {id:3,  ts:'2024-01-20 08:01:01', src_ip:'198.51.100.5', from:'noreply@phish.xyz',  to:'cfo@corp.com',       subject:'Urgent: Verify your account', size:2048,   status:'delivered', spam_score:8.7},
  {id:4,  ts:'2024-01-20 08:01:02', src_ip:'198.51.100.5', from:'noreply@phish.xyz',  to:'hr@corp.com',        subject:'Urgent: Verify your account', size:2048,   status:'delivered', spam_score:8.7},
  {id:5,  ts:'2024-01-20 08:01:03', src_ip:'198.51.100.5', from:'noreply@phish.xyz',  to:'it@corp.com',        subject:'Urgent: Verify your account', size:2048,   status:'delivered', spam_score:8.7},
  {id:6,  ts:'2024-01-20 08:01:04', src_ip:'198.51.100.5', from:'noreply@phish.xyz',  to:'finance@corp.com',   subject:'Urgent: Verify your account', size:2048,   status:'delivered', spam_score:8.7},
  {id:7,  ts:'2024-01-20 08:02:00', src_ip:'192.168.3.10', from:'bob@corp.com',       to:'alice@corp.com',     subject:'Re: Meeting Notes',           size:2048,   status:'delivered', spam_score:0.0},
  {id:8,  ts:'2024-01-20 08:03:00', src_ip:'198.51.100.5', from:'noreply@phish.xyz',  to:'sysadmin@corp.com',  subject:'Urgent: Verify your account', size:2048,   status:'blocked',   spam_score:8.7},
  {id:9,  ts:'2024-01-20 08:04:00', src_ip:'203.0.113.77', from:'attacker@darkweb.ru',to:'admin@corp.com',     subject:'Invoice #4421',               size:102400, status:'delivered', spam_score:9.2},
  {id:10, ts:'2024-01-20 08:05:00', src_ip:'192.168.3.20', from:'carol@corp.com',     to:'team@corp.com',      subject:'Q4 Report',                   size:512000, status:'delivered', spam_score:0.2},
  {id:11, ts:'2024-01-20 08:06:00', src_ip:'203.0.113.77', from:'attacker@darkweb.ru',to:'ceo@corp.com',       subject:'Wire Transfer Request',        size:4096,   status:'delivered', spam_score:9.5},
  {id:12, ts:'2024-01-20 08:06:01', src_ip:'203.0.113.77', from:'attacker@darkweb.ru',to:'cfo@corp.com',       subject:'Wire Transfer Request',        size:4096,   status:'delivered', spam_score:9.5},
  {id:13, ts:'2024-01-20 08:07:00', src_ip:'192.168.3.30', from:'dave@corp.com',      to:'external@client.com',subject:'Project Proposal',             size:204800, status:'delivered', spam_score:0.1},
  {id:14, ts:'2024-01-20 08:08:00', src_ip:'198.51.100.5', from:'noreply@phish.xyz',  to:'backup@corp.com',    subject:'Urgent: Verify your account', size:2048,   status:'blocked',   spam_score:8.7},
  {id:15, ts:'2024-01-20 08:09:00', src_ip:'192.168.3.10', from:'alice@corp.com',     to:'all@corp.com',       subject:'Office Party Friday',          size:1024,   status:'delivered', spam_score:0.0},
  {id:16, ts:'2024-01-20 08:10:00', src_ip:'203.0.113.77', from:'attacker@darkweb.ru',to:'hr@corp.com',        subject:'Job Application - Resume',     size:1048576,status:'delivered', spam_score:7.8},
  {id:17, ts:'2024-01-20 08:11:00', src_ip:'192.168.3.40', from:'eve@corp.com',       to:'bob@corp.com',       subject:'Lunch?',                       size:512,    status:'delivered', spam_score:0.0},
  {id:18, ts:'2024-01-20 08:12:00', src_ip:'198.51.100.5', from:'noreply@phish.xyz',  to:'dev@corp.com',       subject:'Urgent: Password Reset',       size:2048,   status:'blocked',   spam_score:9.1},
  {id:19, ts:'2024-01-20 08:13:00', src_ip:'192.168.3.10', from:'alice@corp.com',     to:'carol@corp.com',     subject:'Project Update',               size:8192,   status:'delivered', spam_score:0.1},
  {id:20, ts:'2024-01-20 08:14:00', src_ip:'203.0.113.77', from:'attacker@darkweb.ru',to:'finance@corp.com',   subject:'Overdue Invoice',              size:4096,   status:'delivered', spam_score:9.3},
];

// ─────────────────────────────────────────────────────────────
//  MODULE 7 — DHCP Log Analysis
// ─────────────────────────────────────────────────────────────
const LOGS_DHCP = [
  {id:1,  ts:'2024-01-21 06:00:01', src_mac:'aa:bb:cc:dd:ee:01', assigned_ip:'10.20.0.101', hostname:'LAPTOP-ALICE',  lease_time:86400, action:'DHCPACK',     server:'10.20.0.1'},
  {id:2,  ts:'2024-01-21 06:00:05', src_mac:'aa:bb:cc:dd:ee:02', assigned_ip:'10.20.0.102', hostname:'DESKTOP-BOB',   lease_time:86400, action:'DHCPACK',     server:'10.20.0.1'},
  {id:3,  ts:'2024-01-21 06:01:00', src_mac:'de:ad:be:ef:00:01', assigned_ip:'10.20.0.150', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPACK',     server:'10.20.0.1'},
  {id:4,  ts:'2024-01-21 06:01:01', src_mac:'de:ad:be:ef:00:02', assigned_ip:'10.20.0.151', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPACK',     server:'10.20.0.1'},
  {id:5,  ts:'2024-01-21 06:01:02', src_mac:'de:ad:be:ef:00:03', assigned_ip:'10.20.0.152', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPACK',     server:'10.20.0.1'},
  {id:6,  ts:'2024-01-21 06:01:03', src_mac:'de:ad:be:ef:00:04', assigned_ip:'10.20.0.153', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPACK',     server:'10.20.0.1'},
  {id:7,  ts:'2024-01-21 06:01:04', src_mac:'de:ad:be:ef:00:05', assigned_ip:'10.20.0.154', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPACK',     server:'10.20.0.1'},
  {id:8,  ts:'2024-01-21 06:01:05', src_mac:'de:ad:be:ef:00:06', assigned_ip:'10.20.0.155', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPACK',     server:'10.20.0.1'},
  {id:9,  ts:'2024-01-21 06:01:10', src_mac:'de:ad:be:ef:00:01', assigned_ip:'10.20.0.156', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPREQUEST', server:'10.20.0.99'},
  {id:10, ts:'2024-01-21 06:01:11', src_mac:'de:ad:be:ef:00:02', assigned_ip:'10.20.0.157', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPOFFER',   server:'10.20.0.99'},
  {id:11, ts:'2024-01-21 06:02:00', src_mac:'aa:bb:cc:dd:ee:03', assigned_ip:'10.20.0.103', hostname:'LAPTOP-CAROL',  lease_time:86400, action:'DHCPACK',     server:'10.20.0.1'},
  {id:12, ts:'2024-01-21 06:03:00', src_mac:'aa:bb:cc:dd:ee:04', assigned_ip:'10.20.0.104', hostname:'WORKST-DAVE',   lease_time:86400, action:'DHCPACK',     server:'10.20.0.1'},
  {id:13, ts:'2024-01-21 06:04:00', src_mac:'de:ad:be:ef:00:07', assigned_ip:'10.20.0.158', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPACK',     server:'10.20.0.1'},
  {id:14, ts:'2024-01-21 06:04:01', src_mac:'de:ad:be:ef:00:08', assigned_ip:'10.20.0.159', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPACK',     server:'10.20.0.1'},
  {id:15, ts:'2024-01-21 06:05:00', src_mac:'aa:bb:cc:dd:ee:05', assigned_ip:'10.20.0.105', hostname:'LAPTOP-EVE',    lease_time:86400, action:'DHCPACK',     server:'10.20.0.1'},
  {id:16, ts:'2024-01-21 06:05:30', src_mac:'de:ad:be:ef:00:09', assigned_ip:'10.20.0.160', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPACK',     server:'10.20.0.99'},
  {id:17, ts:'2024-01-21 06:06:00', src_mac:'de:ad:be:ef:00:0a', assigned_ip:'10.20.0.161', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPOFFER',   server:'10.20.0.99'},
  {id:18, ts:'2024-01-21 06:07:00', src_mac:'aa:bb:cc:dd:ee:06', assigned_ip:'10.20.0.106', hostname:'DESKTOP-FRANK', lease_time:86400, action:'DHCPACK',     server:'10.20.0.1'},
  {id:19, ts:'2024-01-21 06:08:00', src_mac:'de:ad:be:ef:00:0b', assigned_ip:'10.20.0.162', hostname:'UNKNOWN-HOST',  lease_time:300,   action:'DHCPACK',     server:'10.20.0.99'},
  {id:20, ts:'2024-01-21 06:09:00', src_mac:'aa:bb:cc:dd:ee:07', assigned_ip:'10.20.0.107', hostname:'LAPTOP-GRACE',  lease_time:86400, action:'DHCPACK',     server:'10.20.0.1'},
];

// ─────────────────────────────────────────────────────────────
//  MODULE DEFINITIONS
// ─────────────────────────────────────────────────────────────
const MODULES = [
  {
    id:'mod-1', routeSlug:'dns-log-analysis', title:'DNS Log Analysis', subtitle:'C2 Beaconing & Tunneling',
    description:'Analyze DNS query logs for signs of command-and-control (C2) beaconing and DNS tunneling. Identify hosts making high-frequency TXT lookups to randomized subdomains — a classic exfiltration pattern.',
    difficulty:'Beginner', estimatedTime:'20 min', tags:['DNS','C2','Beaconing'],
    icon:'🌐', logs:LOGS_DNS,
    fields:['id','ts','src_ip','query','qtype','rcode','ttl','bytes'],
    tasks:[
      {id:'t1',title:'Isolate TXT Record Queries',points:10,
       description:'DNS TXT records are commonly abused for data exfiltration. Retrieve all DNS queries using the TXT record type.',
       hint:'Try: search qtype=TXT',
       validation:{type:'count',field:'qtype',value:'TXT',expected:11}},
      {id:'t2',title:'Count Queries per Source IP',points:20,
       description:'Aggregate all DNS queries by source IP to find the host generating abnormal query volume.',
       hint:'Try: count by src_ip',
       validation:{type:'groupby',field:'src_ip',expected_top:'10.0.1.88',expected_top_count:12}},
      {id:'t3',title:'Profile the Suspicious Host',points:30,
       description:'Drill into all DNS activity from 10.0.1.88. Look for randomized subdomains — a C2 beaconing indicator.',
       hint:'Try: search src_ip=10.0.1.88',
       validation:{type:'count_gt',field:'src_ip',value:'10.0.1.88',threshold:8}},
    ],
  },
  {
    id:'mod-2', routeSlug:'ftp-log-analysis', title:'FTP Log Analysis', subtitle:'Anonymous Access & Data Exfiltration',
    description:'Investigate FTP server logs to detect anonymous user abuse, unauthorized downloads of sensitive files, and potential data exfiltration activities.',
    difficulty:'Beginner', estimatedTime:'25 min', tags:['FTP','Exfiltration','Anonymous'],
    icon:'📁', logs:LOGS_FTP,
    fields:['id','ts','src_ip','user','action','file','size','status'],
    tasks:[
      {id:'t1',title:'Find Anonymous Logins',points:10,
       description:'Anonymous FTP access is a major security risk. Identify all sessions where the user field is "anonymous".',
       hint:'Try: search user=anonymous',
       validation:{type:'count',field:'user',value:'anonymous',expected:9}},
      {id:'t2',title:'Audit Downloaded Files',points:20,
       description:'List all files downloaded via FTP. Identify any sensitive filenames like passwd, shadow, or database files.',
       hint:'Try: search action=DOWNLOAD',
       validation:{type:'count',field:'action',value:'DOWNLOAD',expected:8}},
      {id:'t3',title:'Measure Data Exfil Volume',points:30,
       description:'Count download events by source IP to identify the host responsible for the most data transfer.',
       hint:'Try: search action=DOWNLOAD | count by src_ip',
       validation:{type:'groupby',field:'src_ip',expected_top:'10.4.5.200',expected_top_count:7}},
    ],
  },
  {
    id:'mod-3', routeSlug:'http-log-analysis', title:'HTTP Log Analysis', subtitle:'Web Attack Detection',
    description:'Analyze web server access logs to detect SQL injection attempts, directory traversal, web shells, and automated scanning tools like sqlmap and Nikto.',
    difficulty:'Intermediate', estimatedTime:'30 min', tags:['HTTP','SQLi','Web Shell','Scanner'],
    icon:'🕸️', logs:LOGS_HTTP,
    fields:['id','ts','src_ip','method','uri','status','bytes','user_agent'],
    tasks:[
      {id:'t1',title:'Identify Automated Scanners',points:10,
       description:'Attackers often use automated tools. Find all requests where the user_agent contains "sqlmap" or "Nikto".',
       hint:'Try: search sqlmap OR Nikto',
       validation:{type:'count',expected:10}},
      {id:'t2',title:'Find HTTP 500 Error Responses',points:20,
       description:'Server errors (500) during scanning may indicate successful injection probing. Isolate all 500 responses.',
       hint:'Try: search status=500',
       validation:{type:'count',field:'status',value:500,expected:1}},
      {id:'t3',title:'Detect Web Shell Access',points:30,
       description:'A web shell was uploaded. Find the request to the uploaded shell at `/uploads/shell.php`, which indicates the attacker achieved code execution. Submit the number of matching requests.',
       hint:'Try: search uri=/uploads/shell.php',
       validation:{type:'count',field:'uri',value:'/uploads/shell.php',expected:1}},
    ],
  },
  {
    id:'mod-4', routeSlug:'ssh-log-analysis', title:'SSH Log Analysis', subtitle:'Brute Force & Credential Stuffing',
    description:'Analyze SSH authentication logs to detect brute force attacks, credential stuffing campaigns, and unauthorized access. Correlate source IPs with attack patterns.',
    difficulty:'Beginner', estimatedTime:'25 min', tags:['SSH','Brute Force','Authentication'],
    icon:'🔐', logs:LOGS_SSH,
    fields:['id','ts','src_ip','user','status','method','port'],
    tasks:[
      {id:'t1',title:'Retrieve All Failed Logins',points:10,
       description:'Retrieve all SSH authentication events where the attempt failed. This is the first step in brute-force detection.',
       hint:'Try: search status=failed',
       validation:{type:'count',field:'status',value:'failed',expected:15}},
      {id:'t2',title:'Count Failures by Source IP',points:20,
       description:'Aggregate failed attempts by source IP to identify top offenders. IPs with >5 failures are considered brute force sources.',
       hint:'Try: search status=failed | count by src_ip',
       validation:{type:'groupby',field:'src_ip',expected_top:'192.168.1.105',expected_top_count:10}},
      {id:'t3',title:'Confirm Successful Auth from Attack IP',points:30,
       description:'Check whether the top offending IP (192.168.1.105) eventually succeeded — which would confirm a compromised credential.',
       hint:'Try: search src_ip=192.168.1.105 | filter status=success',
       validation:{type:'count_gt',field:'src_ip',value:'192.168.1.105',threshold:0}},
    ],
  },
  {
    id:'mod-5', routeSlug:'gre-tunnel-log-analysis', title:'Tunnel Log Analysis', subtitle:'GRE Covert Channel Detection',
    description:'Using Zeek IDS tunnel logs, identify hosts creating persistent GRE tunnels to external IPs. Long-duration, high-volume tunnels may indicate covert C2 channels.',
    difficulty:'Intermediate', estimatedTime:'35 min', tags:['GRE','Tunneling','Zeek','C2'],
    icon:'🚇', logs:LOGS_TUNNEL,
    fields:['id','ts','src_ip','dst_ip','tunnel_type','inner_proto','duration','bytes'],
    tasks:[
      {id:'t1',title:'Isolate GRE Tunnel Events',points:10,
       description:'GRE tunnels can be used to encapsulate malicious traffic. Retrieve all tunnel events of type GRE.',
       hint:'Try: search tunnel_type=GRE',
       validation:{type:'count',field:'tunnel_type',value:'GRE',expected:16}},
      {id:'t2',title:'Count GRE Tunnels by Source',points:20,
       description:'Count GRE tunnel events by source IP to find the host creating the most tunnels.',
       hint:'Try: search tunnel_type=GRE | count by src_ip',
       validation:{type:'groupby',field:'src_ip',expected_top:'10.1.0.33',expected_top_count:12}},
      {id:'t3',title:'Profile the Suspicious Tunnel Host',points:30,
       description:'Drill into all tunnel events from 10.1.0.33. Look for long durations (>100s) and large byte counts indicating persistent C2.',
       hint:'Try: search src_ip=10.1.0.33',
       validation:{type:'count_gt',field:'src_ip',value:'10.1.0.33',threshold:8}},
    ],
  },
  {
    id:'mod-6', routeSlug:'smtp-log-analysis', title:'SMTP Log Analysis', subtitle:'Phishing Campaign Detection',
    description:'Investigate email server logs to detect phishing campaigns, business email compromise (BEC), and spam originating from external threat actors.',
    difficulty:'Intermediate', estimatedTime:'30 min', tags:['SMTP','Phishing','BEC','Spam'],
    icon:'📧', logs:LOGS_SMTP,
    fields:['id','ts','src_ip','from','to','subject','size','status','spam_score'],
    tasks:[
      {id:'t1',title:'Find High Spam-Score Emails',points:10,
       description:'Emails with `spam_score > 7` are likely malicious. Filter for those messages and count how many appear in the dataset.',
       hint:'Try: search spam_score>7',
       validation:{type:'count',field:'spam_score',expected:13}},
      {id:'t2',title:'Count Emails per Sender IP',points:20,
       description:'Aggregate email volume by source IP. Phishing campaigns often send many emails from a single IP.',
       hint:'Try: count by src_ip',
       validation:{type:'groupby',field:'src_ip',expected_top:'198.51.100.5',expected_top_count:8}},
      {id:'t3',title:'Identify BEC Attack Source',points:30,
       description:'A second attacker IP (203.0.113.77) is sending targeted BEC emails. Profile all messages from this IP.',
       hint:'Try: search src_ip=203.0.113.77',
       validation:{type:'count_gt',field:'src_ip',value:'203.0.113.77',threshold:3}},
    ],
  },
  {
    id:'mod-7', routeSlug:'dhcp-log-analysis', title:'DHCP Log Analysis', subtitle:'Rogue DHCP Server Detection',
    description:'Analyze DHCP server logs to detect rogue DHCP servers, unauthorized device floods, and IP exhaustion attacks — classic indicators of network infiltration.',
    difficulty:'Beginner', estimatedTime:'25 min', tags:['DHCP','Rogue Server','IP Exhaustion'],
    icon:'🔌', logs:LOGS_DHCP,
    fields:['id','ts','src_mac','assigned_ip','hostname','lease_time','action','server'],
    tasks:[
      {id:'t1',title:'Count Short-Lease DHCP Events',points:10,
       description:'Start by filtering for `lease_time=300`. These 5-minute leases are suspicious because normal leases in this dataset are 86400 seconds. After you run the filter, count how many matching DHCP events appear. Submit the number only.',
       hint:'Step 1: run `search lease_time=300`. Step 2: look at the number of matching rows. Step 3: submit that count only.',
       validation:{type:'count',field:'lease_time',value:300,expected:13}},
      {id:'t2',title:'Count Events From the Rogue Server',points:20,
       description:'Now isolate the suspected rogue DHCP server by filtering for `server=10.20.0.99`. Review the results and count how many events came from that server. Submit the event count, not the IP address.',
       hint:'Step 1: run `search server=10.20.0.99`. Step 2: count the matching rows. Step 3: submit the count only.',
       validation:{type:'count',field:'server',value:'10.20.0.99',expected:5}},
      {id:'t3',title:'Count DHCP Events From Unknown Hosts',points:30,
       description:'Finally, look for unapproved devices by filtering for `hostname=UNKNOWN-HOST`. Count every DHCP event tied to those hosts and submit the total number of matching events. This shows how much activity is coming from unmanaged systems.',
       hint:'Step 1: run `search hostname=UNKNOWN-HOST`. Step 2: count all returned rows. Step 3: submit that number only.',
       validation:{type:'count',field:'hostname',value:'UNKNOWN-HOST',expected:13}},
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  WINDOWS FORENSICS PROJECT TRACK
//  Source: https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners
// ─────────────────────────────────────────────────────────────
const WINDOWS_FORENSICS_PROJECTS = [
  {
    id:'wf-1',
    title:'Investigating Windows Event Logs for Security Incidents',
    focus:'Event Logs',
    difficulty:'Beginner',
    estimatedTime:'45 min',
    summary:'Practice reviewing Windows event logs to identify suspicious authentication and security activity.',
    skills:['Event Viewer','Security logs','Incident triage'],
    url:'https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners/blob/main/project-1-investigating-windows-event-logs-for-security-incidents.md',
  },
  {
    id:'wf-2',
    title:'Analyzing Windows Registry for Evidence of Malicious Activity',
    focus:'Registry',
    difficulty:'Beginner',
    estimatedTime:'50 min',
    summary:'Use registry artifacts to reason about persistence, execution evidence, and suspicious configuration changes.',
    skills:['Registry hives','Persistence keys','Artifact review'],
    url:'https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners/blob/main/project-2-Analyzing-Windows-registry-for-evidences.md',
  },
  {
    id:'wf-3',
    title:'Forensic Analysis of Windows File Systems and Artifacts',
    focus:'File System',
    difficulty:'Beginner',
    estimatedTime:'55 min',
    summary:'Inspect file-system evidence and common Windows artifacts to reconstruct user and system activity.',
    skills:['NTFS artifacts','Timeline clues','File metadata'],
    url:'https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners/blob/main/project-3-Forensic-analysis-of-Windows-file-system-and-artifacts.md',
  },
  {
    id:'wf-4',
    title:'Extracting and Interpreting Browser Artifacts on Windows',
    focus:'Browser Artifacts',
    difficulty:'Beginner',
    estimatedTime:'45 min',
    summary:'Review browser history and related artifacts to understand user activity during an investigation.',
    skills:['Browser history','Downloads','User activity'],
    url:'https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners/blob/main/project-4-extracting-and-interpreting-browser-artifacts-on-windows.md',
  },
  {
    id:'wf-5',
    title:'Recovering and Analyzing Deleted Files on Windows Systems',
    focus:'Deleted Files',
    difficulty:'Beginner',
    estimatedTime:'60 min',
    summary:'Practice recovering deleted files and interpreting their value in a Windows forensic case.',
    skills:['File recovery','Evidence handling','Deleted artifacts'],
    url:'https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners/blob/main/project-5-Recovering-and-Analyzing-Deleted-Files-on-Windows-Systems.md',
  },
];

// ─────────────────────────────────────────────────────────────
//  EXTERNAL PROJECT TRACKS
// ─────────────────────────────────────────────────────────────
const LOG_ANALYSIS_PROJECTS = [
  {
    id:'lap-1', title:'Basic Apache Web Server Log Analysis', focus:'Apache Logs', difficulty:'Beginner', estimatedTime:'45 min',
    summary:'Analyze web server access logs to identify traffic patterns, suspicious requests, and common web activity.',
    skills:['Apache access logs','HTTP status codes','Request triage'],
    url:'https://github.com/0xrajneesh/Log-Analysis-Projects-for-Beginners/blob/main/Project-1-Apache-Web-Server-Log-Analysis.md',
  },
  {
    id:'lap-2', title:'Introduction to Syslog Analysis on Linux Systems', focus:'Syslog', difficulty:'Beginner', estimatedTime:'45 min',
    summary:'Review Linux syslog messages to understand system activity and detect abnormal events.',
    skills:['Linux syslog','Authentication events','System triage'],
    url:'https://github.com/0xrajneesh/Log-Analysis-Projects-for-Beginners/blob/main/Project-2-Syslog-Analysis-on-Linux-Systems.md',
  },
  {
    id:'lap-3', title:'Analyzing Windows Event Logs for Security Incidents', focus:'Windows Event Logs', difficulty:'Beginner', estimatedTime:'50 min',
    summary:'Investigate Windows event logs for signs of security incidents and suspicious account activity.',
    skills:['Event Viewer','Security logs','Incident review'],
    url:'https://github.com/0xrajneesh/Log-Analysis-Projects-for-Beginners/blob/main/Project-3-Analyzing-Windows-Event-Logs.md',
  },
  {
    id:'lap-4', title:'Simple Log Analysis with ELK Stack', focus:'ELK', difficulty:'Beginner', estimatedTime:'60 min',
    summary:'Use Elasticsearch, Logstash, and Kibana concepts to ingest, search, and visualize security logs.',
    skills:['Elasticsearch','Kibana','Log search'],
    url:'https://github.com/0xrajneesh/Log-Analysis-Projects-for-Beginners/blob/main/Project-4-Simple-Log-Analysis-with-ELK-Stack.md',
  },
  {
    id:'lap-5', title:'Analyzing Windows Sysmon Events for Security Incidents', focus:'Windows Sysmon', difficulty:'Beginner', estimatedTime:'60 min',
    summary:'Use Sysmon Operational logs to investigate suspicious process creation, network connections, file creation, and image load activity.',
    skills:['Sysmon','Event Viewer','Process review','Network triage'],
    url:'https://github.com/0xrajneesh/Log-Analysis-Projects-for-Beginners/blob/main/Project-5-Analyzing%20Windows%20Sysmon%20Events%20for%20Security%20Incidents.md',
  },
];

const ACTIVE_DIRECTORY_PROJECTS = [
  { id:'ad-1', title:'Active Directory Monitoring with Grafana', focus:'Grafana', difficulty:'Beginner', estimatedTime:'50 min', summary:'Build basic Active Directory monitoring views using Grafana-oriented workflows.', skills:['Grafana','AD metrics','Dashboards'], url:'https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-1-active-directory-monitoring-with-grafana.md' },
  { id:'ad-3', title:'Real-time Active Directory Metrics with Datadog', focus:'Datadog', difficulty:'Beginner', estimatedTime:'50 min', summary:'Explore real-time Active Directory monitoring concepts using Datadog-oriented telemetry.', skills:['Datadog','Realtime metrics','Monitoring'], url:'https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-3-real-time-active-directory-monitoring-with-datadog.md' },
  { id:'ad-4', title:'Active Directory Health Checks using Nagios', focus:'Nagios', difficulty:'Beginner', estimatedTime:'50 min', summary:'Practice AD health-check monitoring and alerting concepts with Nagios.', skills:['Nagios','Health checks','Alerting'], url:'https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-4-active-directory-monitoring-using-nagios.md' },
  { id:'ad-5', title:'Active Directory Performance Monitoring with Checkmk', focus:'Checkmk', difficulty:'Beginner', estimatedTime:'50 min', summary:'Review AD performance monitoring workflows using Checkmk-style service checks.', skills:['Checkmk','Performance checks','Service monitoring'], url:'https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-5-active-directory-monitoring-with-checkmk.md' },
  { id:'ad-6', title:'Active Directory Monitoring and Alerting with Prometheus', focus:'Prometheus', difficulty:'Beginner', estimatedTime:'55 min', summary:'Learn AD monitoring and alerting concepts using Prometheus-oriented metrics.', skills:['Prometheus','Metrics','Alert rules'], url:'https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-6-active-directory-monitoring-with-prometheus.md' },
  { id:'ad-7', title:'Visualizing Active Directory Performance Metrics with Cacti', focus:'Cacti', difficulty:'Beginner', estimatedTime:'50 min', summary:'Create AD performance visibility using Cacti-style graphing workflows.', skills:['Cacti','Performance graphs','Monitoring'], url:'https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects/blob/main/project-7-active-directory-monitoring-with-cacti.md' },
];

const SECURITY_ASSESSMENT_PROJECTS = [
  { id:'sa-2', title:'File System Security Assessment', focus:'File System', difficulty:'Beginner', estimatedTime:'50 min', summary:'Review file-system permissions and evidence of unauthorized access or modification.', skills:['Permissions','Access review','File integrity'], url:'https://github.com/0xrajneesh/Security-Assessments-projects-for-Beginners/blob/main/project-2-File%20System%20Security%20Assessment:%20Detecting%20Unauthorized%20Access%20and%20Modifications.md' },
  { id:'sa-3', title:'Web Application Security Assessment', focus:'Web App', difficulty:'Beginner', estimatedTime:'60 min', summary:'Practice assessing common web application vulnerabilities at a beginner level.', skills:['Web testing','Common vulns','Assessment notes'], url:'https://github.com/0xrajneesh/Security-Assessments-projects-for-Beginners/blob/main/project-3-Web%20Application%20Security%20Assessment:%20Assessing%20Common%20Web%20Vulnerabilities.md' },
  { id:'sa-4', title:'System Log Assessment', focus:'System Logs', difficulty:'Beginner', estimatedTime:'45 min', summary:'Analyze system logs for potential security incidents and document suspicious findings.', skills:['Log review','Incident clues','Timeline notes'], url:'https://github.com/0xrajneesh/Security-Assessments-projects-for-Beginners/blob/main/project-4-System%20Log%20Assessment:%20Analyzing%20Logs%20for%20Potential%20Security%20Incidents.md' },
  { id:'sa-5', title:'User Account Security Assessment', focus:'User Accounts', difficulty:'Beginner', estimatedTime:'45 min', summary:'Evaluate user permissions and activity logs for account security risks.', skills:['Permissions','User activity','Account review'], url:'https://github.com/0xrajneesh/Security-Assessments-projects-for-Beginners/blob/main/project-5-User%20Account%20Security%20Assessment:%20Evaluating%20User%20Permissions%20and%20Activity%20Logs.md' },
];

const VULNERABILITY_MANAGEMENT_PROJECTS = [
  { id:'vm-1', title:'Network Vulnerability Scanning with OpenVAS', focus:'OpenVAS', difficulty:'Beginner', estimatedTime:'60 min', summary:'Practice a beginner vulnerability scan workflow using OpenVAS-style findings and remediation notes.', skills:['OpenVAS','Scan results','Remediation'], url:'https://github.com/0xrajneesh/Vulnerability-Management-Projects-for-Beginners/blob/main/Project-1-Network-Vulnerability-Scanning-with-OpenVAS.md' },
  { id:'vm-2', title:'Vulnerability Assessment using Nessus', focus:'Nessus', difficulty:'Beginner', estimatedTime:'60 min', summary:'Review Nessus-style vulnerability output, severity, affected hosts, and practical triage decisions.', skills:['Nessus','CVSS','Host triage'], url:'https://github.com/0xrajneesh/Vulnerability-Management-Projects-for-Beginners/blob/main/Project-2-Vulnerability-Assessment-using-Nessus.md' },
  { id:'vm-3', title:'Vulnerability Management using QualysGuard', focus:'Qualys', difficulty:'Beginner', estimatedTime:'60 min', summary:'Learn vulnerability management concepts using QualysGuard-oriented reporting and prioritization.', skills:['Qualys','Prioritization','Reporting'], url:'https://github.com/0xrajneesh/Vulnerability-Management-Projects-for-Beginners/blob/main/Project-3-Vulnerability-Management-using-QualysGuard.md' },
  { id:'vm-4', title:'Web Application Vulnerability Detection with OWASP ZAP', focus:'OWASP ZAP', difficulty:'Beginner', estimatedTime:'60 min', summary:'Practice web application vulnerability discovery using OWASP ZAP-style findings.', skills:['OWASP ZAP','Web scanning','Finding review'], url:'https://github.com/0xrajneesh/Vulnerability-Management-Projects-for-Beginners/blob/main/Project-4-Web-Application-Vulnerability-Detection-with-OWASP-ZAP.md' },
  { id:'vm-5', title:'Patch Management and Vulnerability Remediation using WSUS', focus:'WSUS', difficulty:'Beginner', estimatedTime:'55 min', summary:'Review patch management and vulnerability remediation workflows using WSUS-style data.', skills:['WSUS','Patch status','Remediation tracking'], url:'https://github.com/0xrajneesh/Vulnerability-Management-Projects-for-Beginners/blob/main/Project-5-Patch-Management-and-Vulnerability-Remediation-using-WSUS.md' },
];

const MALWARE_ANALYSIS_PROJECTS = [
  { id:'ma-1', title:'Static Analysis of a Simple Malware Sample', focus:'Static Analysis', difficulty:'Beginner', estimatedTime:'60 min', summary:'Use safe dummy outputs to inspect strings, PE metadata, imports, exports, and embedded-resource clues.', skills:['Strings','PE headers','Imports'], url:'https://github.com/0xrajneesh/Malware-Analysis-Projects-for-Beginners/blob/main/Project-1-Static-Analysis-of-a-Simple-Malware-Sample.md', simulation:true },
  { id:'ma-2', title:'Dynamic Analysis in a Controlled Environment', focus:'Dynamic Analysis', difficulty:'Beginner', estimatedTime:'70 min', summary:'Use simulated sandbox telemetry for process, registry, file-system, and network behavior.', skills:['Procmon','RegShot','Sandbox notes'], url:'https://github.com/0xrajneesh/Malware-Analysis-Projects-for-Beginners/blob/main/Project-2-Dynamic-Analysis-in-a-Controlled-Environment.md', simulation:true },
  { id:'ma-3', title:'Analyzing a Ransomware Sample', focus:'Ransomware', difficulty:'Beginner', estimatedTime:'75 min', summary:'Use dummy indicators to identify ransom-note behavior, file-encryption markers, and C2-like communication.', skills:['Encryption clues','Ransom notes','C2 indicators'], url:'https://github.com/0xrajneesh/Malware-Analysis-Projects-for-Beginners/blob/main/Project-3-Analyzing-a-Ransomware-Sample.md', simulation:true },
  { id:'ma-4', title:'Behavioral Analysis of a Keylogger', focus:'Keylogger', difficulty:'Beginner', estimatedTime:'70 min', summary:'Use simulated endpoint events to identify keystroke capture, persistence, storage, and evasion behavior.', skills:['Process behavior','Persistence','Artifact paths'], url:'https://github.com/0xrajneesh/Malware-Analysis-Projects-for-Beginners/blob/main/Project-4-Behavioral-Analysis-of-a-Keylogger.md', simulation:true },
  { id:'ma-5', title:'Network Traffic Analysis of a Trojan', focus:'Trojan Traffic', difficulty:'Beginner', estimatedTime:'70 min', summary:'Use safe packet-like dummy data to analyze beaconing, protocols, exfiltration hints, and C2 infrastructure.', skills:['Wireshark-style data','Beaconing','Network IOCs'], url:'https://github.com/0xrajneesh/Malware-Analysis-Projects-for-Beginners/blob/main/Project-5-Network-Traffic-Analysis-of-a-Trojan.md', simulation:true },
];

// ─────────────────────────────────────────────────────────────
//  LOCAL INTERACTIVE LABS FOR CATALOG PROJECTS
// ─────────────────────────────────────────────────────────────
const PROJECT_LAB_FIELDS = ['id','ts','asset','event_type','finding','severity','tool','status','owner'];

const PROJECT_LAB_PROFILES = {
  'wf-1': { tool:'Event Viewer', asset:'winhost', finding:'suspicious-windows-logon-sequence', event:'security_event', owner:'windows-ir' },
  'wf-2': { tool:'Registry Explorer', asset:'winhost', finding:'registry-run-key-persistence', event:'registry_artifact', owner:'windows-ir' },
  'wf-3': { tool:'Timeline Explorer', asset:'winhost', finding:'suspicious-file-system-artifact', event:'file_artifact', owner:'windows-ir' },
  'wf-4': { tool:'Browser History Viewer', asset:'winhost', finding:'risky-browser-download-trail', event:'browser_artifact', owner:'windows-ir' },
  'wf-5': { tool:'File Recovery', asset:'winhost', finding:'deleted-sensitive-file-recovered', event:'recovery_artifact', owner:'windows-ir' },
  'lap-1': { tool:'Apache', asset:'web', finding:'suspicious-http-enumeration', event:'access_log', owner:'web-team' },
  'lap-2': { tool:'rsyslog', asset:'linux', finding:'repeated-authentication-failure', event:'authpriv', owner:'linux-admin' },
  'lap-3': { tool:'Event Viewer', asset:'winhost', finding:'privileged-logon-anomaly', event:'security_event', owner:'windows-admin' },
  'lap-4': { tool:'Kibana', asset:'elk', finding:'indexed-security-error-spike', event:'index_pattern', owner:'soc-analyst' },
  'lap-5': { tool:'Sysinternals', asset:'endpoint', finding:'unsigned-process-persistence', event:'autoruns', owner:'ir-lead' },
  'ad-1': { tool:'Grafana', asset:'dc', finding:'domain-controller-cpu-spike', event:'metric_alert', owner:'ad-ops' },
  'ad-3': { tool:'Datadog', asset:'dc', finding:'replication-latency-alert', event:'realtime_metric', owner:'ad-ops' },
  'ad-4': { tool:'Nagios', asset:'dc', finding:'ldap-service-check-critical', event:'service_check', owner:'ad-ops' },
  'ad-5': { tool:'Checkmk', asset:'dc', finding:'directory-service-health-warning', event:'check_result', owner:'ad-ops' },
  'ad-6': { tool:'Prometheus', asset:'dc', finding:'password-spray-alert-rule', event:'alert_rule', owner:'ad-ops' },
  'ad-7': { tool:'Cacti', asset:'dc', finding:'authentication-traffic-surge', event:'graph_threshold', owner:'ad-ops' },
  'sa-2': { tool:'File Audit', asset:'filesrv', finding:'weak-permission-on-sensitive-share', event:'acl_review', owner:'platform' },
  'sa-3': { tool:'Web Test', asset:'app', finding:'reflected-input-validation-gap', event:'web_check', owner:'appsec' },
  'sa-4': { tool:'Log Review', asset:'server', finding:'suspicious-service-restart-chain', event:'system_log', owner:'soc-analyst' },
  'sa-5': { tool:'Account Audit', asset:'identity', finding:'excessive-admin-membership', event:'user_review', owner:'iam' },
  'vm-1': { tool:'OpenVAS', asset:'host', finding:'critical-remote-service-vulnerability', event:'scan_finding', owner:'vuln-mgmt' },
  'vm-2': { tool:'Nessus', asset:'host', finding:'high-risk-missing-patch', event:'scan_finding', owner:'vuln-mgmt' },
  'vm-3': { tool:'QualysGuard', asset:'host', finding:'internet-facing-critical-vulnerability', event:'scan_finding', owner:'vuln-mgmt' },
  'vm-4': { tool:'OWASP ZAP', asset:'app', finding:'high-confidence-web-vulnerability', event:'zap_alert', owner:'appsec' },
  'vm-5': { tool:'WSUS', asset:'workstation', finding:'overdue-critical-security-update', event:'patch_status', owner:'endpoint' },
  'ma-1': { tool:'Static Analyzer', asset:'sample', finding:'suspicious-import-and-string-cluster', event:'pe_static', owner:'malware-lab' },
  'ma-2': { tool:'Sandbox', asset:'sample', finding:'process-injection-behavior', event:'behavior_event', owner:'malware-lab' },
  'ma-3': { tool:'Sandbox', asset:'sample', finding:'ransom-note-and-encryption-marker', event:'ransomware_event', owner:'malware-lab' },
  'ma-4': { tool:'Procmon', asset:'sample', finding:'keystroke-log-persistence', event:'endpoint_event', owner:'malware-lab' },
  'ma-5': { tool:'Wireshark', asset:'sample', finding:'periodic-trojan-beacon', event:'network_flow', owner:'malware-lab' },
};

function buildProjectLabFixtures(project, index) {
  const profile = PROJECT_LAB_PROFILES[project.id] || {
    tool:project.focus, asset:'asset', finding:'project-specific-risk-indicator', event:'analysis_event', owner:'analyst',
  };
  const day = String(10 + (index % 18)).padStart(2, '0');
  const base = `2024-02-${day}`;
  const asset = n => `${profile.asset}-${String(n).padStart(2, '0')}`;
  return [
    { id:1,  ts:`${base} 09:00:01`, asset:asset(1), event_type:'baseline', finding:'normal-activity', severity:'Low', tool:profile.tool, status:'closed', owner:'ops' },
    { id:2,  ts:`${base} 09:04:18`, asset:asset(2), event_type:profile.event, finding:profile.finding, severity:'High', tool:profile.tool, status:'open', owner:profile.owner },
    { id:3,  ts:`${base} 09:08:43`, asset:asset(3), event_type:'inventory', finding:'configuration-drift', severity:'Medium', tool:profile.tool, status:'triaged', owner:'ops' },
    { id:4,  ts:`${base} 09:12:09`, asset:asset(2), event_type:profile.event, finding:profile.finding, severity:'High', tool:profile.tool, status:'open', owner:profile.owner },
    { id:5,  ts:`${base} 09:15:31`, asset:asset(4), event_type:'baseline', finding:'normal-activity', severity:'Low', tool:profile.tool, status:'closed', owner:'ops' },
    { id:6,  ts:`${base} 09:19:44`, asset:asset(5), event_type:'review', finding:`${project.focus.toLowerCase().replace(/\s+/g, '-')}-review-needed`, severity:'Medium', tool:profile.tool, status:'open', owner:'analyst' },
    { id:7,  ts:`${base} 09:23:02`, asset:asset(2), event_type:profile.event, finding:profile.finding, severity:'High', tool:profile.tool, status:'open', owner:profile.owner },
    { id:8,  ts:`${base} 09:28:16`, asset:asset(6), event_type:'control_check', finding:'control-passed', severity:'Low', tool:profile.tool, status:'closed', owner:'ops' },
    { id:9,  ts:`${base} 09:34:55`, asset:asset(7), event_type:'review', finding:'manual-validation-required', severity:'Medium', tool:profile.tool, status:'triaged', owner:'analyst' },
    { id:10, ts:`${base} 09:39:21`, asset:asset(8), event_type:profile.event, finding:`related-${profile.finding}`, severity:'High', tool:profile.tool, status:'open', owner:profile.owner },
    { id:11, ts:`${base} 09:44:06`, asset:asset(9), event_type:'baseline', finding:'normal-activity', severity:'Low', tool:profile.tool, status:'closed', owner:'ops' },
    { id:12, ts:`${base} 09:51:37`, asset:asset(10), event_type:'follow_up', finding:'evidence-collected', severity:'Medium', tool:profile.tool, status:'triaged', owner:'analyst' },
  ];
}

function buildProjectLab(project, trackLabel, index) {
  if (project.id === 'lap-3') {
    return buildWindowsEventLogProjectLab(project, trackLabel);
  }
  if (project.id === 'lap-5') {
    return buildSysmonProjectLab(project, trackLabel);
  }
  if (project.id === 'wf-2') {
    return buildRegistryProjectLab(project, trackLabel);
  }
  const profile = PROJECT_LAB_PROFILES[project.id] || {};
  return {
    id:`lab-${project.id}`,
    title:project.title,
    subtitle:`${trackLabel} Interactive Lab`,
    description:`Local ${project.focus} lab with fixtures, guided tasks, expected answers, and scored validation. Use the query editor to isolate evidence before submitting each answer.`,
    difficulty:project.difficulty,
    estimatedTime:project.estimatedTime,
    tags:project.skills,
    icon:project.simulation ? '🧪' : '▣',
    sourceUrl:project.url,
    logs:buildProjectLabFixtures(project, index),
    fields:PROJECT_LAB_FIELDS,
    tasks:[
      {
        id:'t1', title:'Find High-Severity Evidence', points:10,
        description:'Identify every high-severity record in the local fixture set and submit the number of matching rows.',
        hint:'Try: search severity=High',
        validation:{ type:'count', field:'severity', value:'High', expected:4 },
      },
      {
        id:'t2', title:'Identify the Primary Finding', points:20,
        description:'Group the records by finding and identify the finding that appears most often.',
        hint:'Try: count by finding',
        validation:{ type:'groupby', field:'finding', expected_top:profile.finding || 'project-specific-risk-indicator', expected_top_count:3 },
      },
      {
        id:'t3', title:'Scope Open Work', points:30,
        description:'Filter records that still need action and submit the number of open items.',
        hint:'Try: search status=open',
        validation:{ type:'count', field:'status', value:'open', expected:5 },
      },
    ],
  };
}

function buildSysmonProjectLab(project, trackLabel) {
  let nextId = 1;
  let nextRecordId = 41020;
  function makeEvent(overrides) {
    const date = '04/23/2026';
    const time = overrides.time || '09:00:00';
    const event = {
      id:nextId++,
      recordId:nextRecordId++,
      ts:`2026-04-23 ${time}`,
      date,
      time,
      logName:'Microsoft-Windows-Sysmon/Operational',
      level:'Information',
      source:'Microsoft-Windows-Sysmon',
      eventId:1,
      taskCategory:'Process Create (rule: ProcessCreate)',
      computer:'WKSTN-07.corp.missionnext.local',
      user:'CORP\\j.sanders',
      message:'Sysmon event record.',
      details:{},
      ...overrides,
    };
    event.details = { ...(overrides?.details || {}) };
    return event;
  }

  const logs = [
    makeEvent({
      time:'09:00:14',
      eventId:4,
      taskCategory:'Sysmon service state changed',
      user:'NT AUTHORITY\\SYSTEM',
      message:'Sysmon service state changed:\nSysmon started.',
      details:{
        RuleName:'-',
        UtcTime:'2026-04-23 07:00:14.115',
        State:'Started',
        Version:'15.15',
        SchemaVersion:'4.90',
      },
    }),
    makeEvent({
      time:'09:01:22',
      eventId:1,
      taskCategory:'Process Create (rule: ProcessCreate)',
      user:'CORP\\j.sanders',
      message:'Process Create:\nImage: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\nParentImage: C:\\Windows\\explorer.exe\nCommandLine: \"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\" https://intranet.corp.local',
      details:{
        RuleName:'ProcessCreate',
        UtcTime:'2026-04-23 07:01:22.904',
        ProcessGuid:'{A1B2C300-1001-6448-0000-0010F0910000}',
        ProcessId:'4216',
        Image:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        FileVersion:'135.0.0.0',
        Description:'Google Chrome',
        Product:'Google Chrome',
        CommandLine:'"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" https://intranet.corp.local',
        CurrentDirectory:'C:\\Users\\j.sanders\\',
        User:'CORP\\j.sanders',
        LogonGuid:'{A1B2C300-0000-0000-0000-000000000111}',
        LogonId:'0x58F21',
        TerminalSessionId:'1',
        IntegrityLevel:'Medium',
        Hashes:'SHA256=1c92af4d9d1095d35b2d2c6f9dcf0c11f2513d4c939774d99bcb634ec1dc0001',
        ParentProcessGuid:'{A1B2C300-1001-6448-0000-0010F0800000}',
        ParentProcessId:'4052',
        ParentImage:'C:\\Windows\\explorer.exe',
        ParentCommandLine:'C:\\Windows\\Explorer.EXE',
      },
    }),
    makeEvent({
      time:'09:03:48',
      eventId:1,
      taskCategory:'Process Create (rule: ProcessCreate)',
      user:'CORP\\j.sanders',
      message:'Process Create:\nImage: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\nParentImage: C:\\Windows\\explorer.exe\nCommandLine: powershell.exe -ExecutionPolicy Bypass -NoProfile -File C:\\Users\\Public\\Music\\inventory.ps1',
      details:{
        RuleName:'ProcessCreate',
        UtcTime:'2026-04-23 07:03:48.211',
        ProcessGuid:'{A1B2C300-1001-6448-0000-0010F0920000}',
        ProcessId:'4980',
        Image:'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        CommandLine:'powershell.exe -ExecutionPolicy Bypass -NoProfile -File C:\\Users\\Public\\Music\\inventory.ps1',
        CurrentDirectory:'C:\\Users\\j.sanders\\Downloads\\',
        User:'CORP\\j.sanders',
        IntegrityLevel:'Medium',
        Hashes:'SHA256=6d4a6f0e4e2a9cfe4b941b5ee8fd82ef0e96c1a4e0fdcecf9dbf8c1f7ef00092',
        ParentProcessGuid:'{A1B2C300-1001-6448-0000-0010F0800000}',
        ParentProcessId:'4052',
        ParentImage:'C:\\Windows\\explorer.exe',
        ParentCommandLine:'C:\\Windows\\Explorer.EXE',
      },
    }),
    makeEvent({
      time:'09:04:02',
      eventId:1,
      taskCategory:'Process Create (rule: ProcessCreate)',
      user:'CORP\\j.sanders',
      message:'Process Create:\nImage: C:\\Windows\\System32\\rundll32.exe\nParentImage: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\nCommandLine: rundll32.exe C:\\Users\\Public\\Music\\dbghelp.dll,Start',
      details:{
        RuleName:'ProcessCreate',
        UtcTime:'2026-04-23 07:04:02.511',
        ProcessGuid:'{A1B2C300-1001-6448-0000-0010F0930000}',
        ProcessId:'5068',
        Image:'C:\\Windows\\System32\\rundll32.exe',
        CommandLine:'rundll32.exe C:\\Users\\Public\\Music\\dbghelp.dll,Start',
        CurrentDirectory:'C:\\Users\\Public\\Music\\',
        User:'CORP\\j.sanders',
        IntegrityLevel:'Medium',
        Hashes:'SHA256=7110ab5cce88a34983f43c2a9170059cf2b48d46c3ed320565b658d94ed10012',
        ParentProcessGuid:'{A1B2C300-1001-6448-0000-0010F0920000}',
        ParentProcessId:'4980',
        ParentImage:'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        ParentCommandLine:'powershell.exe -ExecutionPolicy Bypass -NoProfile -File C:\\Users\\Public\\Music\\inventory.ps1',
      },
    }),
    makeEvent({
      time:'09:05:19',
      eventId:3,
      taskCategory:'Network connection detected (rule: NetworkConnect)',
      user:'CORP\\j.sanders',
      message:'Network connection detected:\nImage: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\nDestinationIp: 20.42.65.91\nDestinationPort: 443',
      details:{
        RuleName:'NetworkConnect',
        UtcTime:'2026-04-23 07:05:19.173',
        ProcessGuid:'{A1B2C300-1001-6448-0000-0010F0910000}',
        ProcessId:'4216',
        Image:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        User:'CORP\\j.sanders',
        Protocol:'tcp',
        Initiated:'true',
        SourceIp:'10.10.24.19',
        SourceHostname:'WKSTN-07',
        SourcePort:'51124',
        DestinationIp:'20.42.65.91',
        DestinationHostname:'login.microsoftonline.com',
        DestinationPort:'443',
      },
    }),
    makeEvent({
      time:'09:05:44',
      eventId:3,
      taskCategory:'Network connection detected (rule: NetworkConnect)',
      user:'CORP\\j.sanders',
      message:'Network connection detected:\nImage: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\nDestinationIp: 198.51.100.42\nDestinationPort: 8443',
      details:{
        RuleName:'NetworkConnect',
        UtcTime:'2026-04-23 07:05:44.882',
        ProcessGuid:'{A1B2C300-1001-6448-0000-0010F0920000}',
        ProcessId:'4980',
        Image:'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        User:'CORP\\j.sanders',
        Protocol:'tcp',
        Initiated:'true',
        SourceIp:'10.10.24.19',
        SourceHostname:'WKSTN-07',
        SourcePort:'51288',
        DestinationIp:'198.51.100.42',
        DestinationHostname:'cdn-sync-node.example',
        DestinationPort:'8443',
      },
    }),
    makeEvent({
      time:'09:06:15',
      eventId:11,
      taskCategory:'FileCreate (rule: FileCreate)',
      user:'CORP\\j.sanders',
      message:'File created:\nTargetFilename: C:\\Users\\Public\\Libraries\\stage-loader.dll\nImage: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      details:{
        RuleName:'FileCreate',
        UtcTime:'2026-04-23 07:06:15.314',
        ProcessGuid:'{A1B2C300-1001-6448-0000-0010F0920000}',
        ProcessId:'4980',
        Image:'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        TargetFilename:'C:\\Users\\Public\\Libraries\\stage-loader.dll',
        CreationUtcTime:'2026-04-23 07:06:15.301',
        User:'CORP\\j.sanders',
      },
    }),
    makeEvent({
      time:'09:06:41',
      eventId:11,
      taskCategory:'FileCreate (rule: FileCreate)',
      user:'CORP\\j.sanders',
      message:'File created:\nTargetFilename: C:\\Users\\j.sanders\\AppData\\Local\\Temp\\chrome-cache.bin\nImage: C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      details:{
        RuleName:'FileCreate',
        UtcTime:'2026-04-23 07:06:41.914',
        ProcessGuid:'{A1B2C300-1001-6448-0000-0010F0910000}',
        ProcessId:'4216',
        Image:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        TargetFilename:'C:\\Users\\j.sanders\\AppData\\Local\\Temp\\chrome-cache.bin',
        CreationUtcTime:'2026-04-23 07:06:41.901',
        User:'CORP\\j.sanders',
      },
    }),
    makeEvent({
      time:'09:07:03',
      eventId:7,
      taskCategory:'Image loaded (rule: ImageLoad)',
      user:'CORP\\j.sanders',
      message:'Image loaded:\nImageLoaded: C:\\Users\\Public\\Music\\dbghelp.dll\nImage: C:\\Windows\\System32\\rundll32.exe',
      details:{
        RuleName:'ImageLoad',
        UtcTime:'2026-04-23 07:07:03.119',
        ProcessGuid:'{A1B2C300-1001-6448-0000-0010F0930000}',
        ProcessId:'5068',
        Image:'C:\\Windows\\System32\\rundll32.exe',
        ImageLoaded:'C:\\Users\\Public\\Music\\dbghelp.dll',
        FileVersion:'0.0.0.0',
        Description:'dbghelp',
        Product:'Unknown',
        Company:'Unknown',
        Signed:'false',
        SignatureStatus:'Unavailable',
        User:'CORP\\j.sanders',
        Hashes:'SHA256=0b114bd91cc7a6cf01d4f37c9a8406ea9926e6f6302315c698f06f4d11820072',
      },
    }),
    makeEvent({
      time:'09:07:18',
      eventId:7,
      taskCategory:'Image loaded (rule: ImageLoad)',
      user:'CORP\\j.sanders',
      message:'Image loaded:\nImageLoaded: C:\\Windows\\System32\\shell32.dll\nImage: C:\\Windows\\explorer.exe',
      details:{
        RuleName:'ImageLoad',
        UtcTime:'2026-04-23 07:07:18.401',
        ProcessGuid:'{A1B2C300-1001-6448-0000-0010F0800000}',
        ProcessId:'4052',
        Image:'C:\\Windows\\explorer.exe',
        ImageLoaded:'C:\\Windows\\System32\\shell32.dll',
        FileVersion:'10.0.19041.4474',
        Description:'Windows Shell Common Dll',
        Product:'Microsoft Windows',
        Company:'Microsoft Corporation',
        Signed:'true',
        SignatureStatus:'Valid',
        User:'CORP\\j.sanders',
      },
    }),
    makeEvent({
      time:'09:08:54',
      eventId:3,
      taskCategory:'Network connection detected (rule: NetworkConnect)',
      user:'CORP\\svc_backup',
      computer:'FILE-01.corp.missionnext.local',
      message:'Network connection detected:\nImage: C:\\Program Files\\Veeam\\Backup and Replication\\BackupSvc.exe\nDestinationIp: 10.10.24.12\nDestinationPort: 445',
      details:{
        RuleName:'NetworkConnect',
        UtcTime:'2026-04-23 07:08:54.987',
        ProcessGuid:'{A1B2C300-1001-6448-0000-0010F1200000}',
        ProcessId:'3408',
        Image:'C:\\Program Files\\Veeam\\Backup and Replication\\BackupSvc.exe',
        User:'CORP\\svc_backup',
        Protocol:'tcp',
        Initiated:'true',
        SourceIp:'10.10.24.30',
        SourceHostname:'FILE-01',
        SourcePort:'53318',
        DestinationIp:'10.10.24.12',
        DestinationHostname:'BACKUP-01',
        DestinationPort:'445',
      },
    }),
  ];

  const exercises = [
    {
      id:'sx-1',
      title:'Verify Sysmon Installation and Configuration',
      steps:[
        'Open Event Viewer and browse to Applications and Services Logs > Microsoft > Windows > Sysmon > Operational.',
        'Locate the Sysmon service state change event and confirm the service started successfully.',
        'Use the event list to verify that Sysmon is actively writing recent Operational events.',
      ],
      expected:'You should see Sysmon Operational events, including a service state change event confirming that Sysmon started and is logging activity.',
    },
    {
      id:'sx-2',
      title:'Analyze Process Creation Events',
      steps:[
        'Filter on Event ID 1 to review process creation activity.',
        'Inspect the suspicious PowerShell event and compare its parent image, process image, and command line.',
        'Identify the process launched with unusual command line arguments such as ExecutionPolicy Bypass.',
      ],
      expected:'You should identify an unusual PowerShell process creation event and determine which parent process launched it.',
    },
    {
      id:'sx-3',
      title:'Monitor Network Connections',
      steps:[
        'Filter on Event ID 3 to review network connections.',
        'Compare expected internal or SaaS destinations with the unusual external connection.',
        'Focus on destination IP, destination port, and the process responsible for the connection.',
      ],
      expected:'You should isolate the suspicious outbound connection and identify the process responsible for it.',
    },
    {
      id:'sx-4',
      title:'Investigate File Creation Events',
      steps:[
        'Filter on Event ID 11 to review file creation activity.',
        'Check file paths carefully and look for files created in public or otherwise sensitive directories.',
        'Note which process created the suspicious file.',
      ],
      expected:'You should identify the suspicious created file and the process that dropped it.',
    },
    {
      id:'sx-5',
      title:'Detect Image Load Events',
      steps:[
        'Filter on Event ID 7 to review DLL and image load activity.',
        'Look for unsigned or unexpected images loaded from user-writable directories.',
        'Confirm which process loaded the suspicious image.',
      ],
      expected:'You should uncover an unauthorized DLL image load that suggests malicious execution or injection behavior.',
    },
  ];

  return {
    id:`lab-${project.id}`,
    title:project.title,
    subtitle:`${trackLabel} Interactive Lab`,
    description:'Realistic Event Viewer-style Sysmon lab focused on process creation, network connections, file creation, and image loads in the Sysmon Operational log.',
    difficulty:project.difficulty,
    estimatedTime:project.estimatedTime,
    tags:['Sysmon','Event Viewer','Operational log','Process create','Network connect','File create','Image load'],
    icon:'▣',
    sourceUrl:project.url,
    logs,
    fields:['recordId','date','time','source','eventId','taskCategory','computer','user','message'],
    sysmon:{
      computer:'WKSTN-07.corp.missionnext.local',
      channel:'Applications and Services Logs > Microsoft > Windows > Sysmon > Operational',
      provider:'Microsoft-Windows-Sysmon',
      logName:'Microsoft-Windows-Sysmon/Operational',
      serviceVersion:'15.15',
      configName:'SwiftOnSecurity sysmonconfig-export.xml',
      quickFilters:[
        { label:'Service State', query:'search eventId=4' },
        { label:'Process Create', query:'search eventId=1' },
        { label:'Network Connect', query:'search eventId=3' },
        { label:'File Create', query:'search eventId=11' },
        { label:'Image Load', query:'search eventId=7' },
      ],
      exercises,
    },
    tasks:[
      {
        id:'t1',
        title:'Verify Sysmon Installation',
        points:10,
        description:'Confirm that Sysmon is installed and logging by locating the Sysmon service state change event. Submit the number of matching Event ID 4 records.',
        hint:'Try: search eventId=4',
        validation:{ type:'count', field:'eventId', value:4, expected:1 },
      },
      {
        id:'t2',
        title:'Find the Suspicious PowerShell Parent',
        points:20,
        description:'Review process creation events and isolate the PowerShell process started with `-ExecutionPolicy Bypass`. Submit the full parent process image that launched it.',
        hint:'Try: search eventId=1 | search -ExecutionPolicy Bypass',
        validation:{ type:'equals', expected:'C:\\Windows\\explorer.exe' },
      },
      {
        id:'t3',
        title:'Identify the Suspicious Network Process',
        points:20,
        description:'Filter network connection events and locate the outbound connection to `198.51.100.42`. Submit the full process image responsible for that connection.',
        hint:'Try: search eventId=3 | search 198.51.100.42',
        validation:{ type:'equals', expected:'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe' },
      },
      {
        id:'t4',
        title:'Locate the Dropped File',
        points:25,
        description:'Review file creation events and find the DLL dropped into a public directory. Submit the full file path that was created.',
        hint:'Try: search eventId=11 | search stage-loader.dll',
        validation:{ type:'equals', expected:'C:\\Users\\Public\\Libraries\\stage-loader.dll' },
      },
      {
        id:'t5',
        title:'Detect the Suspicious Image Load',
        points:25,
        description:'Review image load events and identify the unexpected DLL loaded from a public directory. Submit the full image path that was loaded.',
        hint:'Try: search eventId=7 | search dbghelp.dll',
        validation:{ type:'equals', expected:'C:\\Users\\Public\\Music\\dbghelp.dll' },
      },
    ],
  };
}

function buildRegistryProjectLab(project, trackLabel) {
  const userSid = 'S-1-5-21-3623811015-3361044348-30300820-1001';
  return {
    id:`lab-${project.id}`,
    title:project.title,
    subtitle:`${trackLabel} Interactive Lab`,
    description:'Regedit-style registry analysis lab focused on hive review, autorun persistence, SAM account discovery, and UserAssist execution artifacts.',
    difficulty:project.difficulty,
    estimatedTime:project.estimatedTime,
    tags:['Registry','Regedit','Persistence','UserAssist','SAM'],
    icon:'▣',
    sourceUrl:project.url,
    logs:[
      { id:1, hive:'SAM', keyPath:'Computer\\HKEY_LOCAL_MACHINE\\SAM\\SAM\\Domains\\Account\\Users\\Names', artifact:'user_accounts', finding:'5 local accounts visible in SAM', severity:'Medium', status:'triaged' },
      { id:2, hive:'SOFTWARE', keyPath:'Computer\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', artifact:'autorun', finding:'Windows Update Monitor launches from Public profile', severity:'High', status:'open' },
      { id:3, hive:'NTUSER.DAT', keyPath:`Computer\\HKEY_USERS\\${userSid}\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist\\{CEBFF5CD-ACE2-4F4F-9178-9926F41749EA}\\Count`, artifact:'userassist', finding:'invoice_viewer.exe executed recently', severity:'High', status:'open' },
    ],
    fields:['hive','keyPath','artifact','finding','severity','status'],
    registry:{
      computer:'WIN-IR-WS02',
      image:'memdump-wf2.raw',
      profile:'Win10x64_19041',
      helperName:'Boot',
      quickLinks:[
        { label:'SAM Names', target:'sam-names' },
        { label:'Run Key', target:'run-key' },
        { label:'UserAssist', target:'userassist-count' },
      ],
      tree:[
        {
          id:'computer',
          name:'Computer',
          path:'Computer',
          children:[
            {
              id:'hklm',
              name:'HKEY_LOCAL_MACHINE',
              path:'Computer\\HKEY_LOCAL_MACHINE',
              children:[
                {
                  id:'sam-root',
                  name:'SAM',
                  path:'Computer\\HKEY_LOCAL_MACHINE\\SAM',
                  children:[
                    {
                      id:'sam-hive',
                      name:'SAM',
                      path:'Computer\\HKEY_LOCAL_MACHINE\\SAM\\SAM',
                      children:[
                        {
                          id:'sam-domains',
                          name:'Domains',
                          path:'Computer\\HKEY_LOCAL_MACHINE\\SAM\\SAM\\Domains',
                          children:[
                            {
                              id:'sam-account',
                              name:'Account',
                              path:'Computer\\HKEY_LOCAL_MACHINE\\SAM\\SAM\\Domains\\Account',
                              children:[
                                {
                                  id:'sam-users',
                                  name:'Users',
                                  path:'Computer\\HKEY_LOCAL_MACHINE\\SAM\\SAM\\Domains\\Account\\Users',
                                  children:[
                                    {
                                      id:'sam-names',
                                      name:'Names',
                                      path:'Computer\\HKEY_LOCAL_MACHINE\\SAM\\SAM\\Domains\\Account\\Users\\Names',
                                      lastWrite:'2026-04-23 09:06:12',
                                      summary:'Local account names recovered from the SAM hive.',
                                      values:[
                                        { name:'Administrator', type:'REG_KEY', data:'RID 0x1F4' },
                                        { name:'Guest', type:'REG_KEY', data:'RID 0x1F5' },
                                        { name:'DefaultAccount', type:'REG_KEY', data:'RID 0x1F7' },
                                        { name:'j.sanders', type:'REG_KEY', data:'RID 0x3E9' },
                                        { name:'svc_backup', type:'REG_KEY', data:'RID 0x44F' },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  id:'software-root',
                  name:'SOFTWARE',
                  path:'Computer\\HKEY_LOCAL_MACHINE\\SOFTWARE',
                  children:[
                    {
                      id:'software-microsoft',
                      name:'Microsoft',
                      path:'Computer\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft',
                      children:[
                        {
                          id:'software-windows',
                          name:'Windows',
                          path:'Computer\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows',
                          children:[
                            {
                              id:'software-currentversion',
                              name:'CurrentVersion',
                              path:'Computer\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion',
                              children:[
                                {
                                  id:'run-key',
                                  name:'Run',
                                  path:'Computer\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
                                  lastWrite:'2026-04-23 09:14:27',
                                  summary:'Autorun entries evaluated for persistence.',
                                  values:[
                                    { name:'SecurityHealth', type:'REG_EXPAND_SZ', data:'%windir%\\system32\\SecurityHealthSystray.exe' },
                                    { name:'OneDrive', type:'REG_SZ', data:'"C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe" /background' },
                                    { name:'IntelGraphicsCommandCenter', type:'REG_SZ', data:'"C:\\Program Files\\WindowsApps\\AppUp.IntelGraphicsExperience_1.100.5445.0_x64__8j3eq9eme6ctt\\Gfxv4_0.exe"' },
                                    { name:'Windows Update Monitor', type:'REG_SZ', data:'C:\\Users\\Public\\svhost.exe --check-updates' },
                                  ],
                                },
                                {
                                  id:'runonce-key',
                                  name:'RunOnce',
                                  path:'Computer\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce',
                                  lastWrite:'2026-04-20 13:42:10',
                                  summary:'One-time startup entries.',
                                  values:[
                                    { name:'CleanupTemp', type:'REG_SZ', data:'cmd.exe /c del /q C:\\Temp\\*.tmp' },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  id:'system-root',
                  name:'SYSTEM',
                  path:'Computer\\HKEY_LOCAL_MACHINE\\SYSTEM',
                  children:[
                    {
                      id:'controlset001',
                      name:'ControlSet001',
                      path:'Computer\\HKEY_LOCAL_MACHINE\\SYSTEM\\ControlSet001',
                      children:[
                        {
                          id:'control-root',
                          name:'Control',
                          path:'Computer\\HKEY_LOCAL_MACHINE\\SYSTEM\\ControlSet001\\Control',
                          children:[
                            {
                              id:'session-manager',
                              name:'Session Manager',
                              path:'Computer\\HKEY_LOCAL_MACHINE\\SYSTEM\\ControlSet001\\Control\\Session Manager',
                              lastWrite:'2026-04-23 08:58:06',
                              summary:'System hive used to support SAM decryption and environment review.',
                              values:[
                                { name:'BootExecute', type:'REG_MULTI_SZ', data:'autocheck autochk *' },
                                { name:'PendingFileRenameOperations', type:'REG_MULTI_SZ', data:'(value not set)' },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id:'hku',
              name:'HKEY_USERS',
              path:'Computer\\HKEY_USERS',
              children:[
                {
                  id:'user-sid',
                  name:userSid,
                  path:`Computer\\HKEY_USERS\\${userSid}`,
                  children:[
                    {
                      id:'user-software',
                      name:'Software',
                      path:`Computer\\HKEY_USERS\\${userSid}\\Software`,
                      children:[
                        {
                          id:'user-microsoft',
                          name:'Microsoft',
                          path:`Computer\\HKEY_USERS\\${userSid}\\Software\\Microsoft`,
                          children:[
                            {
                              id:'user-windows',
                              name:'Windows',
                              path:`Computer\\HKEY_USERS\\${userSid}\\Software\\Microsoft\\Windows`,
                              children:[
                                {
                                  id:'user-currentversion',
                                  name:'CurrentVersion',
                                  path:`Computer\\HKEY_USERS\\${userSid}\\Software\\Microsoft\\Windows\\CurrentVersion`,
                                  children:[
                                    {
                                      id:'user-explorer',
                                      name:'Explorer',
                                      path:`Computer\\HKEY_USERS\\${userSid}\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer`,
                                      children:[
                                        {
                                          id:'userassist-root',
                                          name:'UserAssist',
                                          path:`Computer\\HKEY_USERS\\${userSid}\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist`,
                                          children:[
                                            {
                                              id:'userassist-guid',
                                              name:'{CEBFF5CD-ACE2-4F4F-9178-9926F41749EA}',
                                              path:`Computer\\HKEY_USERS\\${userSid}\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist\\{CEBFF5CD-ACE2-4F4F-9178-9926F41749EA}`,
                                              children:[
                                                {
                                                  id:'userassist-count',
                                                  name:'Count',
                                                  path:`Computer\\HKEY_USERS\\${userSid}\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\UserAssist\\{CEBFF5CD-ACE2-4F4F-9178-9926F41749EA}\\Count`,
                                                  lastWrite:'2026-04-23 09:17:03',
                                                  summary:'Decoded UserAssist execution artifacts for j.sanders.',
                                                  values:[
                                                    { name:'UEME_RUNPIDL:%csidl2%\\Microsoft Edge.lnk', type:'REG_BINARY', data:'Run count: 12 | Last run: 2026-04-23 08:59:11' },
                                                    { name:'UEME_RUNPIDL:%csidl2%\\7-Zip File Manager.lnk', type:'REG_BINARY', data:'Run count: 3 | Last run: 2026-04-23 09:02:48' },
                                                    { name:'UEME_RUNPATH:C:\\Users\\j.sanders\\Desktop\\invoice_viewer.exe', type:'REG_BINARY', data:'Run count: 18 | Last run: 2026-04-23 09:16:41' },
                                                    { name:'UEME_RUNPATH:C:\\Windows\\System32\\cmd.exe', type:'REG_BINARY', data:'Run count: 2 | Last run: 2026-04-23 09:16:55' },
                                                  ],
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    tasks:[
      {
        id:'t1',
        title:'Review SAM User Names',
        points:10,
        description:'Open the SAM Names key and count the local accounts visible in the hive. Submit the total number of account names listed.',
        hint:'Expand HKEY_LOCAL_MACHINE > SAM > SAM > Domains > Account > Users > Names, then count each listed subkey.',
        validation:{ type:'count', field:'account_names', expected:5 },
      },
      {
        id:'t2',
        title:'Identify the Suspicious Autorun Value',
        points:20,
        description:'Navigate to the Run key and identify the suspicious persistence value name responsible for launching from C:\\Users\\Public. Submit the value name exactly.',
        hint:'Look in HKEY_LOCAL_MACHINE > SOFTWARE > Microsoft > Windows > CurrentVersion > Run. The suspicious entry launches svhost.exe from the Public profile.',
        validation:{ type:'equals', expected:'Windows Update Monitor' },
      },
      {
        id:'t3',
        title:'Find the Suspicious UserAssist Program',
        points:30,
        description:'Inspect the UserAssist Count key for j.sanders and determine which executable appears to have been launched repeatedly from the Desktop. Submit the full executable path.',
        hint:'Open HKEY_USERS > user SID > Software > Microsoft > Windows > CurrentVersion > Explorer > UserAssist > {GUID} > Count and look for the Desktop executable with the highest run count.',
        validation:{ type:'equals', expected:'C:\\Users\\j.sanders\\Desktop\\invoice_viewer.exe' },
      },
    ],
  };
}

function buildWindowsEventLogProjectLab(project, trackLabel) {
  let nextId = 1;
  let nextRecordId = 90120;
  function makeEvent(overrides) {
    const event = {
      id:nextId++,
      recordId:nextRecordId++,
      logName:'Security',
      level:'Information',
      keywords:'Audit Success',
      source:'Microsoft-Windows-Security-Auditing',
      eventId:4624,
      taskCategory:'Logon',
      date:'04/23/2026',
      time:'09:00:00',
      computer:'WKSTN-07',
      user:'SYSTEM',
      sourceIp:'-',
      logonType:'-',
      status:'0x0',
      processId:'-',
      message:'Windows event log entry.',
      details:{},
      ...overrides,
    };
    event.details = { ...(overrides?.details || {}) };
    return event;
  }

  const systemEvents = [
    makeEvent({ logName:'System', source:'EventLog', eventId:6005, taskCategory:'None', time:'08:58:02', user:'SYSTEM', message:'The Event log service was started.', details:{ ProviderName:'EventLog', Channel:'System', Computer:'WKSTN-07' } }),
    makeEvent({ logName:'System', source:'Microsoft-Windows-Kernel-General', eventId:12, taskCategory:'(1)', time:'08:58:07', user:'SYSTEM', message:'The operating system started at system time 2026-04-23T06:58:07.500000000Z.', details:{ BootType:'0x0', SystemTime:'2026-04-23T06:58:07.500000000Z' } }),
    makeEvent({ logName:'System', source:'Service Control Manager', eventId:7036, taskCategory:'None', time:'08:58:19', user:'SYSTEM', message:'The Windows Event Log service entered the running state.', details:{ ServiceName:'Windows Event Log', State:'running' } }),
    makeEvent({ logName:'System', source:'Service Control Manager', eventId:7036, taskCategory:'None', time:'08:58:27', user:'SYSTEM', message:'The DHCP Client service entered the running state.', details:{ ServiceName:'DHCP Client', State:'running' } }),
    makeEvent({ logName:'System', source:'Microsoft-Windows-Time-Service', eventId:35, taskCategory:'None', time:'08:59:11', user:'SYSTEM', message:'The time service is now synchronizing the system time with the time source time.windows.com.', details:{ TimeSource:'time.windows.com' } }),
    makeEvent({ logName:'System', source:'Kernel-Power', eventId:41, level:'Error', taskCategory:'(63)', time:'09:06:12', user:'SYSTEM', message:'The system has rebooted without cleanly shutting down first.', details:{ BugcheckCode:'0', SleepInProgress:'0' } }),
    makeEvent({ logName:'System', source:'Service Control Manager', eventId:7040, level:'Warning', taskCategory:'None', time:'09:18:12', user:'SYSTEM', message:'The start type of the Windows Remote Management service was changed from demand start to auto start.', details:{ ServiceName:'Windows Remote Management (WS-Management)', OldStartType:'demand start', NewStartType:'auto start' } }),
    makeEvent({ logName:'System', source:'Microsoft-Windows-WindowsUpdateClient', eventId:19, taskCategory:'Windows Update Agent', time:'09:21:44', user:'SYSTEM', message:'Installation Successful: Windows successfully installed the following update: Security Intelligence Update for Microsoft Defender Antivirus.', details:{ UpdateTitle:'Security Intelligence Update for Microsoft Defender Antivirus' } }),
    makeEvent({ logName:'System', source:'Service Control Manager', eventId:7036, taskCategory:'None', time:'09:27:08', user:'SYSTEM', message:'The WinRM service entered the running state.', details:{ ServiceName:'WinRM', State:'running' } }),
    makeEvent({ logName:'System', source:'Microsoft-Windows-GroupPolicy', eventId:1502, taskCategory:'None', time:'09:29:33', user:'SYSTEM', message:'The Group Policy settings for the computer were processed successfully.', details:{ ElapsedTimeInMilliseconds:'122' } }),
  ];

  const applicationEvents = [
    makeEvent({ logName:'Application', source:'Microsoft-Windows-Windows Defender', eventId:5007, taskCategory:'None', time:'09:04:14', user:'SYSTEM', message:'Windows Defender Antivirus configuration has changed.', details:{ OldValue:'EnableNetworkProtection = 0x1', NewValue:'EnableNetworkProtection = 0x1' } }),
    makeEvent({ logName:'Application', source:'MsiInstaller', eventId:1033, taskCategory:'None', time:'09:08:04', user:'SYSTEM', message:'Windows Installer installed the product. Product Name: 7-Zip 24.08 (x64 edition).', details:{ ProductName:'7-Zip 24.08 (x64 edition)' } }),
    makeEvent({ logName:'Application', source:'Application Error', eventId:1000, level:'Error', taskCategory:'(100)', time:'09:17:25', user:'SYSTEM', message:'Faulting application name: outlook.exe, version: 16.0.0.0.', details:{ FaultingApplicationName:'outlook.exe', ExceptionCode:'0xc0000005' } }),
    makeEvent({ logName:'Application', source:'Microsoft Office 16 Alerts', eventId:300, taskCategory:'None', time:'09:18:52', user:'j.sanders', message:'Microsoft Outlook restarted after an unexpected shutdown.', details:{ User:'j.sanders' } }),
    makeEvent({ logName:'Application', source:'Windows Error Reporting', eventId:1001, taskCategory:'None', time:'09:19:00', user:'SYSTEM', message:'Fault bucket 157483062135, type 5.', details:{ ReportId:'9dd72f5a-6d91-49bb-b9ce-f8dca4936a3f' } }),
  ];

  const securityEvents = [
    makeEvent({ time:'09:00:44', user:'svc_backup', sourceIp:'10.10.24.12', eventId:4624, logonType:'3', message:'An account was successfully logged on.', details:{ TargetUserName:'svc_backup', IpAddress:'10.10.24.12', LogonType:'3' } }),
    makeEvent({ time:'09:01:02', user:'svc_backup', sourceIp:'10.10.24.12', eventId:4634, taskCategory:'Logoff', message:'An account was logged off.', details:{ TargetUserName:'svc_backup', LogonType:'3' } }),
    makeEvent({ time:'09:03:16', user:'m.chen', sourceIp:'10.10.24.33', eventId:4624, computer:'WKSTN-11', logonType:'10', message:'An account was successfully logged on.', details:{ TargetUserName:'m.chen', WorkstationName:'WKSTN-11', IpAddress:'10.10.24.33', LogonType:'10' } }),
    makeEvent({ time:'09:03:49', user:'m.chen', sourceIp:'10.10.24.33', eventId:4634, taskCategory:'Logoff', computer:'WKSTN-11', message:'An account was logged off.', details:{ TargetUserName:'m.chen', LogonType:'10' } }),
    makeEvent({ time:'09:05:25', user:'helpdesk-admin', sourceIp:'10.10.24.5', eventId:4624, computer:'DC-01', logonType:'3', message:'An account was successfully logged on.', details:{ TargetUserName:'helpdesk-admin', IpAddress:'10.10.24.5', LogonType:'3' } }),
    makeEvent({ time:'09:07:18', user:'j.sanders', sourceIp:'10.10.24.19', eventId:4625, keywords:'Audit Failure', status:'0xC000006A', message:'An account failed to log on.', details:{ SubjectUserName:'-', TargetUserName:'j.sanders', WorkstationName:'WKSTN-07', IpAddress:'10.10.24.19', Status:'0xC000006A', FailureReason:'Unknown user name or bad password' } }),
    makeEvent({ time:'09:08:03', user:'j.sanders', sourceIp:'10.10.24.19', eventId:4625, keywords:'Audit Failure', status:'0xC000006A', message:'An account failed to log on.', details:{ SubjectUserName:'-', TargetUserName:'j.sanders', WorkstationName:'WKSTN-07', IpAddress:'10.10.24.19', Status:'0xC000006A', FailureReason:'Unknown user name or bad password' } }),
    makeEvent({ time:'09:09:27', user:'j.sanders', sourceIp:'10.10.24.19', eventId:4625, keywords:'Audit Failure', status:'0xC000006A', message:'An account failed to log on.', details:{ SubjectUserName:'-', TargetUserName:'j.sanders', WorkstationName:'WKSTN-07', IpAddress:'10.10.24.19', Status:'0xC000006A', FailureReason:'Unknown user name or bad password' } }),
    makeEvent({ time:'09:10:42', user:'j.sanders', sourceIp:'10.10.24.19', eventId:4625, keywords:'Audit Failure', status:'0xC000006A', message:'An account failed to log on.', details:{ SubjectUserName:'-', TargetUserName:'j.sanders', WorkstationName:'WKSTN-07', IpAddress:'10.10.24.19', Status:'0xC000006A', FailureReason:'Unknown user name or bad password' } }),
    makeEvent({ time:'09:11:58', user:'j.sanders', sourceIp:'10.10.24.19', eventId:4625, keywords:'Audit Failure', status:'0xC000006A', message:'An account failed to log on.', details:{ SubjectUserName:'-', TargetUserName:'j.sanders', WorkstationName:'WKSTN-07', IpAddress:'10.10.24.19', Status:'0xC000006A', FailureReason:'Unknown user name or bad password' } }),
    makeEvent({ time:'09:13:22', user:'j.sanders', sourceIp:'10.10.24.19', eventId:4624, logonType:'3', message:'An account was successfully logged on.', details:{ SubjectUserName:'SYSTEM', TargetUserName:'j.sanders', WorkstationName:'WKSTN-07', IpAddress:'10.10.24.19', LogonType:'3', ElevatedToken:'No' } }),
    makeEvent({ time:'09:13:40', user:'j.sanders', sourceIp:'10.10.24.19', eventId:4688, taskCategory:'Process Creation', processId:'0x1f40', message:'A new process has been created.', details:{ SubjectUserName:'j.sanders', NewProcessName:'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', ProcessId:'0x1f40', ParentProcessName:'C:\\Windows\\explorer.exe', CommandLine:'powershell.exe -ExecutionPolicy Bypass -NoProfile' } }),
    makeEvent({ time:'09:13:58', user:'j.sanders', sourceIp:'10.10.24.19', eventId:4688, taskCategory:'Process Creation', processId:'0x2014', message:'A new process has been created.', details:{ SubjectUserName:'j.sanders', NewProcessName:'C:\\Windows\\System32\\cmd.exe', ProcessId:'0x2014', ParentProcessName:'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', CommandLine:'cmd.exe /c whoami /all' } }),
    makeEvent({ time:'09:14:10', user:'helpdesk-admin', sourceIp:'10.10.24.5', eventId:4720, computer:'DC-01', taskCategory:'User Account Management', message:'A user account was created.', details:{ SubjectUserName:'helpdesk-admin', TargetUserName:'temp.contractor', SamAccountName:'temp.contractor', DisplayName:'Temporary Contractor' } }),
    makeEvent({ time:'09:14:38', user:'helpdesk-admin', sourceIp:'10.10.24.5', eventId:4732, computer:'DC-01', taskCategory:'Security Group Management', message:'A member was added to a security-enabled local group.', details:{ SubjectUserName:'helpdesk-admin', MemberName:'temp.contractor', GroupName:'Remote Desktop Users', GroupDomain:'CORP' } }),
    makeEvent({ time:'09:15:12', user:'administrator', sourceIp:'10.10.24.5', eventId:4672, computer:'DC-01', taskCategory:'Special Logon', logonType:'2', message:'Special privileges assigned to new logon.', details:{ SubjectUserName:'administrator', Privileges:'SeDebugPrivilege; SeBackupPrivilege; SeRestorePrivilege', WorkstationName:'DC-01', IpAddress:'10.10.24.5' } }),
    makeEvent({ time:'09:15:44', user:'administrator', sourceIp:'10.10.24.5', eventId:4719, computer:'DC-01', level:'Warning', taskCategory:'System Audit Policy Change', message:'System audit policy was changed.', details:{ SubjectUserName:'administrator', Category:'Logon/Logoff', Subcategory:'Logon', Change:'Success removed, Failure added' } }),
    makeEvent({ time:'09:16:25', user:'temp.contractor', sourceIp:'10.10.24.88', eventId:4624, computer:'WKSTN-15', logonType:'10', message:'An account was successfully logged on.', details:{ TargetUserName:'temp.contractor', WorkstationName:'WKSTN-15', IpAddress:'10.10.24.88', LogonType:'10' } }),
    makeEvent({ time:'09:18:01', user:'temp.contractor', sourceIp:'10.10.24.88', eventId:4634, computer:'WKSTN-15', taskCategory:'Logoff', message:'An account was logged off.', details:{ TargetUserName:'temp.contractor', LogonType:'10' } }),
    makeEvent({ time:'09:20:14', user:'svc_sql', sourceIp:'10.10.24.52', eventId:4624, computer:'APP-DB-02', logonType:'3', message:'An account was successfully logged on.', details:{ TargetUserName:'svc_sql', IpAddress:'10.10.24.52', LogonType:'3' } }),
    makeEvent({ time:'09:22:43', user:'svc_sql', sourceIp:'10.10.24.52', eventId:4634, computer:'APP-DB-02', taskCategory:'Logoff', message:'An account was logged off.', details:{ TargetUserName:'svc_sql', LogonType:'3' } }),
    makeEvent({ time:'09:25:17', user:'j.sanders', sourceIp:'10.10.24.19', eventId:4689, taskCategory:'Process Termination', processId:'0x1f40', message:'A process has exited.', details:{ SubjectUserName:'j.sanders', ProcessName:'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', ProcessId:'0x1f40', ExitStatus:'0x0' } }),
    makeEvent({ time:'09:27:26', user:'administrator', sourceIp:'10.10.24.5', eventId:4726, computer:'DC-01', taskCategory:'User Account Management', message:'A user account was deleted.', details:{ SubjectUserName:'administrator', TargetUserName:'temp.contractor' } }),
    makeEvent({ time:'09:29:58', user:'j.sanders', sourceIp:'10.10.24.19', eventId:4634, taskCategory:'Logoff', message:'An account was logged off.', details:{ TargetUserName:'j.sanders', LogonType:'3' } }),
  ];

  const events = [...systemEvents, ...applicationEvents, ...securityEvents].sort((a, b) => {
    const left = `${a.date} ${a.time}`;
    const right = `${b.date} ${b.time}`;
    return left.localeCompare(right);
  });

  return {
    id:`lab-${project.id}`,
    title:project.title,
    subtitle:`${trackLabel} Interactive Lab`,
    description:'Windows Event Viewer lab with realistic System, Security, and Application logs, dense timestamps, filtering, correlation, PID review, and Log Parser Studio exercises.',
    difficulty:project.difficulty,
    estimatedTime:project.estimatedTime,
    tags:['Event Viewer','Security logs','Filtering','Correlation','PIDs','Log Parser Studio'],
    icon:'▣',
    sourceUrl:project.url,
    logs:events,
    fields:['logName','level','date','time','source','eventId','taskCategory','user','computer','sourceIp','message','status'],
    viewer:{
      computer:'Event Viewer (Local)',
      channels:['Application', 'Security', 'Setup', 'System', 'Forwarded Events'].map(id => ({ id, count:events.filter(event => event.logName === id).length })),
      exercises:[
        {
          id:'ex-1',
          title:'Accessing Windows Event Logs',
          steps:[
            'Open Event Viewer and expand Windows Logs.',
            'Select System and review the service, startup, and power events.',
            'Note the kinds of operating system telemetry stored in the System log.',
          ],
          expected:'Access to the System log with a clear understanding of the types of operating system events recorded there.',
        },
        {
          id:'ex-2',
          title:'Understanding Security Event Logs',
          steps:[
            'Switch to Security and review logon, account-management, and policy-change events.',
            'Identify common security IDs including 4624 and 4625.',
            'Compare successful and failed authentication records.',
          ],
          expected:'Understanding of Security log events related to logons, account management, and policy changes.',
        },
        {
          id:'ex-3',
          title:'Filtering and Searching Event Logs',
          steps:[
            'Use Filter Current Log to display only Event ID 4625.',
            'Use Find to search for a specific user or computer.',
            'Confirm the event list narrows to the failed logon records you care about.',
          ],
          expected:'A filtered view showing specific security events and a focused search for a user or computer.',
        },
        {
          id:'ex-4',
          title:'Analyzing Event Details',
          steps:[
            'Open a failed logon event and review date, time, account, source IP, status code, and any related process details.',
            'Correlate multiple failed logons with the later successful logon and the follow-on PowerShell process creation.',
            'Document the sequence of activity visible in the Security log.',
          ],
          expected:'Detailed analysis of specific events, including key fields and correlations across related records.',
        },
        {
          id:'ex-5',
          title:'Advanced Log Analysis with Log Parser Studio',
          steps:[
            'Open the Log Parser Studio panel and import the sample Security log set.',
            'Run the built-in failed logon query and review the aggregate results.',
            'Customize the query to extract additional event details as needed.',
          ],
          expected:'Use of Log Parser Studio queries to summarize failed logons and extract targeted details from the event log data.',
        },
      ],
      lpsQueries:[
        {
          id:'failed-logons',
          name:'Top failed logons',
          query:"SELECT TOP 10 EventID, COUNT(*) AS EventCount FROM '[LOGFILEPATH]' WHERE EventID = 4625 GROUP BY EventID ORDER BY EventCount DESC",
        },
        {
          id:'failed-by-source',
          name:'Failed logons by source IP',
          query:"SELECT TOP 10 EXTRACT_TOKEN(Strings, 19, ' ') AS SourceIP, COUNT(*) AS EventCount FROM '[LOGFILEPATH]' WHERE EventID = 4625 GROUP BY SourceIP ORDER BY EventCount DESC",
        },
        {
          id:'account-management',
          name:'Account management events',
          query:"SELECT EventID, COUNT(*) AS EventCount FROM '[LOGFILEPATH]' WHERE EventID IN (4720;4732;4719) GROUP BY EventID ORDER BY EventCount DESC",
        },
        {
          id:'process-creation',
          name:'PowerShell process creation',
          query:"SELECT TimeGenerated, EventID, EXTRACT_TOKEN(Strings, 5, ' ') AS ProcessID FROM '[LOGFILEPATH]' WHERE EventID = 4688 ORDER BY TimeGenerated ASC",
        },
      ],
    },
    tasks:[
      {
        id:'t1',
        title:'Review System Events',
        points:10,
        description:'Open the System log and review the operating system events recorded there.',
        hint:'Select System in the Windows Logs tree.',
        validation:{ type:'count', field:'logName', value:'System', expected:4 },
      },
      {
        id:'t2',
        title:'Identify Security Event IDs',
        points:20,
        description:'Review Security events related to authentication and account management.',
        hint:'Look for Event IDs 4624, 4625, 4720, 4732, and 4719.',
        validation:{ type:'groupby', field:'eventId', expected_top:'4625', expected_top_count:3 },
      },
      {
        id:'t3',
        title:'Filter Failed Logons',
        points:30,
        description:'Filter the Security log to failed logon events and locate the repeated source.',
        hint:'Use Event ID 4625 and search for j.sanders or 10.10.24.19.',
        validation:{ type:'count', field:'eventId', value:4625, expected:3 },
      },
    ],
  };
}

function attachProjectLabs(projects, trackLabel) {
  return projects.map((project, index) => ({
    ...project,
    lab:buildProjectLab(project, trackLabel, index),
  }));
}

const LOG_ANALYSIS_LABS = attachProjectLabs(LOG_ANALYSIS_PROJECTS, 'Log Analysis');
const WINDOWS_FORENSICS_LABS = attachProjectLabs(WINDOWS_FORENSICS_PROJECTS, 'Windows Forensics');
const ACTIVE_DIRECTORY_LABS = attachProjectLabs(ACTIVE_DIRECTORY_PROJECTS, 'Active Directory');
const SECURITY_ASSESSMENT_LABS = attachProjectLabs(SECURITY_ASSESSMENT_PROJECTS, 'Security Assessment');
const VULNERABILITY_MANAGEMENT_LABS = attachProjectLabs(VULNERABILITY_MANAGEMENT_PROJECTS, 'Vulnerability Management');
const MALWARE_ANALYSIS_LABS = attachProjectLabs(MALWARE_ANALYSIS_PROJECTS, 'Malware Analysis');
const ALL_PROJECT_LABS = [
  ...WINDOWS_FORENSICS_LABS,
  ...LOG_ANALYSIS_LABS,
  ...ACTIVE_DIRECTORY_LABS,
  ...SECURITY_ASSESSMENT_LABS,
  ...VULNERABILITY_MANAGEMENT_LABS,
  ...MALWARE_ANALYSIS_LABS,
].map(project => project.lab);

const TRAINING_CATALOG = [
  {
    id:'splunk',
    label:'Splunk SIEM',
    title:'SOC Analyst Track',
    description:'Interactive SIEM-style log analysis modules with guided tasks, typed answers, scoring, and instructor progress review.',
    source:'local',
    count:MODULES.length,
    badge:'Query lab',
    action:'OPEN SPLUNK TRACK',
  },
  {
    id:'log-analysis',
    label:'Log Analysis',
    title:'Beginner Log Analysis Projects',
    description:'Apache, Linux syslog, Windows event logs, ELK, and Sysinternals-oriented beginner log analysis projects.',
    source:'https://github.com/0xrajneesh/Log-Analysis-Projects-for-Beginners',
    count:LOG_ANALYSIS_PROJECTS.length,
    badge:'External labs',
    projects:LOG_ANALYSIS_LABS,
    action:'OPEN LOG ANALYSIS',
  },
  {
    id:'windows-forensics',
    label:'Windows Forensics',
    title:'Windows Forensics Projects',
    description:'Windows event logs, registry evidence, file artifacts, browser artifacts, and deleted-file recovery in a workstation-style UI.',
    source:'https://github.com/0xrajneesh/Windows-Forensics-Projects-for-Beginners',
    count:WINDOWS_FORENSICS_PROJECTS.length,
    badge:'Workstation UI',
    projects:WINDOWS_FORENSICS_LABS,
    action:'OPEN FORENSICS TRACK',
  },
  {
    id:'active-directory',
    label:'Active Directory',
    title:'Active Directory Monitoring Projects',
    description:'Beginner AD monitoring projects across Grafana, Splunk, Datadog, Nagios, Checkmk, Prometheus, and Cacti.',
    source:'https://github.com/0xrajneesh/Active-Directory-Monitoring-Projects',
    count:ACTIVE_DIRECTORY_PROJECTS.length,
    badge:'Monitoring',
    projects:ACTIVE_DIRECTORY_LABS,
    action:'OPEN AD MONITORING',
  },
  {
    id:'security-assessments',
    label:'Assessments',
    title:'Security Assessment Projects',
    description:'Network, file-system, web application, system-log, and user-account security assessment projects.',
    source:'https://github.com/0xrajneesh/Security-Assessments-projects-for-Beginners',
    count:SECURITY_ASSESSMENT_PROJECTS.length,
    badge:'Assessment',
    projects:SECURITY_ASSESSMENT_LABS,
    action:'OPEN ASSESSMENTS',
  },
  {
    id:'vulnerability-management',
    label:'Vuln Mgmt',
    title:'Vulnerability Management Projects',
    description:'OpenVAS, Nessus, QualysGuard, OWASP ZAP, and WSUS beginner vulnerability management projects.',
    source:'https://github.com/0xrajneesh/Vulnerability-Management-Projects-for-Beginners',
    count:VULNERABILITY_MANAGEMENT_PROJECTS.length,
    badge:'Vuln workflow',
    projects:VULNERABILITY_MANAGEMENT_LABS,
    action:'OPEN VULN MGMT',
  },
  {
    id:'malware-analysis',
    label:'Malware Analysis',
    title:'Malware Analysis Simulations',
    description:'Safe dummy-data labs for static analysis, dynamic sandbox behavior, ransomware, keylogger, and Trojan traffic analysis.',
    source:'https://github.com/0xrajneesh/Malware-Analysis-Projects-for-Beginners',
    count:MALWARE_ANALYSIS_PROJECTS.length,
    badge:'Dummy data',
    projects:MALWARE_ANALYSIS_LABS,
    action:'OPEN MALWARE SIMS',
  },
];

// ─────────────────────────────────────────────────────────────
//  Progress Helpers
// ─────────────────────────────────────────────────────────────
function getProgress() {
  try { return JSON.parse(localStorage.getItem('mission_next_progress') || '{}'); } catch { return {}; }
}
function saveProgress(p) { localStorage.setItem('mission_next_progress', JSON.stringify(p)); }

function initUserProgress(username) {
  const p = getProgress();
  if (!p[username]) {
    p[username] = {};
    [...MODULES, ...ALL_PROJECT_LABS].forEach(m => {
      p[username][m.id] = { started:false, completedTasks:[], score:0, lastAccessed:null };
    });
    saveProgress(p);
  }
  return p[username];
}

function markTaskComplete(username, moduleId, taskId, points) {
  const p = getProgress();
  if (!p[username]) initUserProgress(username);
  if (!p[username][moduleId]) p[username][moduleId] = { started:false, completedTasks:[], score:0, lastAccessed:null };
  const mp = p[username][moduleId];
  if (!mp.completedTasks.includes(taskId)) { mp.completedTasks.push(taskId); mp.score += points; }
  mp.started = true;
  mp.lastAccessed = new Date().toISOString();
  saveProgress(p);
}

function resetUserProgress(username) {
  const p = getProgress();
  p[username] = {};
  [...MODULES, ...ALL_PROJECT_LABS].forEach(m => {
    p[username][m.id] = { started:false, completedTasks:[], score:0, lastAccessed:null };
  });
  saveProgress(p);
  return p[username];
}

function resetAllStudentProgress() {
  const p = getProgress();
  USERS.filter(u => u.role === 'student').forEach(user => {
    p[user.username] = {};
    [...MODULES, ...ALL_PROJECT_LABS].forEach(m => {
      p[user.username][m.id] = { started:false, completedTasks:[], score:0, lastAccessed:null };
    });
  });
  saveProgress(p);
  return p;
}

Object.assign(window, {
  USERS, MODULES, WINDOWS_FORENSICS_PROJECTS, LOG_ANALYSIS_PROJECTS,
  ACTIVE_DIRECTORY_PROJECTS, SECURITY_ASSESSMENT_PROJECTS,
  VULNERABILITY_MANAGEMENT_PROJECTS, MALWARE_ANALYSIS_PROJECTS,
  WINDOWS_FORENSICS_LABS, LOG_ANALYSIS_LABS, ACTIVE_DIRECTORY_LABS, SECURITY_ASSESSMENT_LABS,
  VULNERABILITY_MANAGEMENT_LABS, MALWARE_ANALYSIS_LABS, ALL_PROJECT_LABS,
  TRAINING_CATALOG,
  getProgress, saveProgress, initUserProgress, markTaskComplete,
  resetUserProgress, resetAllStudentProgress,
});
