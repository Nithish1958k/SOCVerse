// Domain constants shared across models, RBAC, and the alert engine.
// Mirrors the taxonomy used by the SOCVerse front-end simulator.

export const ROLES = ['L1', 'L2', 'L3', 'Manager'];

// Privilege ranking for hierarchical checks (higher number = more access).
export const ROLE_RANK = { L1: 1, L2: 2, L3: 3, Manager: 4 };

export const SOURCES = [
  'Firewall', 'IDS/IPS', 'EDR', 'Win Event Log',
  'Linux Log', 'DNS Log', 'Proxy Log', 'Cloud Log',
];

export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

export const CATEGORIES = [
  'Brute Force', 'Phishing', 'Malware', 'Ransomware', 'Privilege Escalation',
  'Data Exfiltration', 'Insider Threat', 'C2 Traffic', 'Reconnaissance',
  'Lateral Movement', 'Suspicious Login', 'Policy Violation',
];

export const ALERT_STATUSES = [
  'New', 'Acknowledged', 'InProgress', 'Escalated',
  'Contained', 'Closed', 'FalsePositive',
];

export const TICKET_STATUSES = ['Open', 'InProgress', 'Resolved', 'Closed'];
export const CASE_STATUSES = ['Open', 'Escalated', 'Contained', 'Closed'];

// 10-stage incident lifecycle (index = stage number).
export const LIFECYCLE = [
  'Alert', 'L1 Triage', 'Ticket', 'L2 Investigation', 'Threat Validation',
  'L3 Hunting', 'Containment', 'Eradication', 'Recovery', 'Lessons Learned',
];

// Correlated attack scenario templates used by the engine.
export const SCENARIOS = {
  brute:   { name: 'Brute Force Attack',        cat: 'Brute Force',          sev: 'High',     mitre: ['T1110', 'T1078'],                 steps: ['Firewall', 'IDS/IPS', 'Win Event Log', 'EDR'] },
  phish:   { name: 'Phishing Attack',           cat: 'Phishing',             sev: 'High',     mitre: ['T1566', 'T1204', 'T1059'],        steps: ['Proxy Log', 'DNS Log', 'EDR', 'Win Event Log'] },
  malware: { name: 'Malware Infection',         cat: 'Malware',              sev: 'Critical', mitre: ['T1204', 'T1059', 'T1055', 'T1071'], steps: ['EDR', 'Proxy Log', 'DNS Log', 'IDS/IPS'] },
  ransom:  { name: 'Ransomware Attack',         cat: 'Ransomware',           sev: 'Critical', mitre: ['T1486', 'T1490', 'T1059', 'T1021'], steps: ['EDR', 'Win Event Log', 'Firewall', 'Cloud Log'] },
  privesc: { name: 'Privilege Escalation',      cat: 'Privilege Escalation', sev: 'High',     mitre: ['T1068', 'T1134', 'T1055'],        steps: ['Win Event Log', 'Linux Log', 'EDR'] },
  exfil:   { name: 'Data Exfiltration',         cat: 'Data Exfiltration',    sev: 'Critical', mitre: ['T1041', 'T1048', 'T1567'],        steps: ['Proxy Log', 'Firewall', 'Cloud Log', 'DNS Log'] },
  insider: { name: 'Insider Threat',            cat: 'Insider Threat',       sev: 'Medium',   mitre: ['T1078', 'T1005', 'T1114'],        steps: ['Cloud Log', 'Win Event Log', 'Proxy Log'] },
  c2:      { name: 'Command & Control Traffic', cat: 'C2 Traffic',           sev: 'High',     mitre: ['T1071', 'T1572', 'T1105'],        steps: ['DNS Log', 'Proxy Log', 'Firewall', 'IDS/IPS'] },
};

// Socket.IO event names (single source of truth for client + server).
export const SOCKET_EVENTS = {
  ALERT_NEW: 'alert:new',
  ALERT_UPDATED: 'alert:updated',
  TICKET_NEW: 'ticket:new',
  CASE_NEW: 'case:new',
  CASE_UPDATED: 'case:updated',
  METRICS: 'metrics:update',
};
