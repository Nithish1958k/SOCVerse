import { Case } from '../models/Case.js';
import { Alert } from '../models/Alert.js';
import { nextId } from '../utils/sequence.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

async function findAlert(id) {
  return /^[a-f0-9]{24}$/i.test(id) ? Alert.findById(id) : Alert.findOne({ alertId: id });
}

// POST /api/cases/escalate  { alertId }  — L2+ creates a formal case (escalate to L3)
export async function escalate(req, res) {
  const { alertId } = req.body || {};
  if (!alertId) return res.status(400).json({ error: 'alertId is required' });
  const alert = await findAlert(alertId);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  // correlate alerts sharing IOCs (ip/domain)
  const sharedIps = alert.iocs?.ip || [];
  const sharedDomains = alert.iocs?.domain || [];
  const related = await Alert.find({
    _id: { $ne: alert._id },
    $or: [
      { 'iocs.ip': { $in: sharedIps } },
      { 'iocs.domain': { $in: sharedDomains } },
    ],
  }).limit(25).select('_id');

  const caseId = await nextId('CASE', 4);
  const kase = await Case.create({
    caseId,
    title: `${alert.category} — ${alert.host}`,
    anchorAlert: alert._id,
    relatedAlerts: related.map((r) => r._id),
    severity: alert.severity,
    status: 'Escalated',
    stage: 5,
    owner: req.user._id,
    mitre: alert.mitre || [],
  });

  alert.status = 'Escalated';
  alert.stage = Math.max(alert.stage, 5);
  alert.timeline.push({ at: new Date(), text: `Escalated to L3 — case ${caseId} opened`, actor: req.user.name });
  await alert.save();

  req.io?.emit(SOCKET_EVENTS.CASE_NEW, kase);
  req.io?.emit(SOCKET_EVENTS.ALERT_UPDATED, alert);
  res.status(201).json(kase);
}

// GET /api/cases
export async function listCases(req, res) {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const items = await Case.find(filter)
    .sort({ createdAt: -1 })
    .populate('anchorAlert', 'alertId severity host srcIp')
    .populate('owner', 'name role')
    .lean();
  res.json({ count: items.length, items });
}

async function findCase(id) {
  return /^[a-f0-9]{24}$/i.test(id) ? Case.findById(id) : Case.findOne({ caseId: id });
}

// POST /api/cases/:id/findings  { text }
export async function addFinding(req, res) {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });
  const kase = await findCase(req.params.id);
  if (!kase) return res.status(404).json({ error: 'Case not found' });
  kase.findings.push({ at: new Date(), text, author: req.user.name });
  await kase.save();
  req.io?.emit(SOCKET_EVENTS.CASE_UPDATED, kase);
  res.json(kase);
}

// POST /api/cases/:id/contain  { action: 'isolate'|'block-ip'|'disable-user' }  — L3+
export async function contain(req, res) {
  const { action } = req.body || {};
  const kase = await findCase(req.params.id);
  if (!kase) return res.status(404).json({ error: 'Case not found' });
  const alert = await Alert.findById(kase.anchorAlert);

  const labels = {
    isolate: `Host ${alert?.host} isolated from network (EDR quarantine)`,
    'block-ip': `IP ${alert?.srcIp} blocked at perimeter`,
    'disable-user': `Account ${alert?.user} disabled in directory`,
  };
  const label = labels[action] || `Containment action: ${action}`;

  kase.responseActions.push(label);
  kase.status = 'Contained';
  kase.stage = Math.max(kase.stage, 6);
  await kase.save();

  if (alert) {
    alert.status = 'Contained';
    alert.stage = Math.max(alert.stage, 6);
    alert.timeline.push({ at: new Date(), text: label, actor: req.user.name });
    await alert.save();
    req.io?.emit(SOCKET_EVENTS.ALERT_UPDATED, alert);
  }
  req.io?.emit(SOCKET_EVENTS.CASE_UPDATED, kase);
  res.json({ action, label, case: kase });
}

// POST /api/cases/:id/close  — files RCA and closes (L3+)
export async function closeCase(req, res) {
  const kase = await findCase(req.params.id);
  if (!kase) return res.status(404).json({ error: 'Case not found' });
  kase.status = 'Closed';
  kase.stage = 9;
  await kase.save();
  await Alert.updateMany(
    { _id: { $in: [kase.anchorAlert, ...kase.relatedAlerts] } },
    { $set: { status: 'Closed', stage: 9 } }
  );
  req.io?.emit(SOCKET_EVENTS.CASE_UPDATED, kase);
  res.json(kase);
}
