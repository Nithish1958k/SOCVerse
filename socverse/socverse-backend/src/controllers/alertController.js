import { Alert } from '../models/Alert.js';
import { createAlert, runScenario } from '../services/alertEngine.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

// GET /api/alerts  — filterable, paginated
export async function listAlerts(req, res) {
  const { severity, status, source, category, q, limit = 50, skip = 0 } = req.query;
  const filter = {};
  if (severity) filter.severity = severity;
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (category) filter.category = category;
  if (q) {
    const rx = new RegExp(String(q).trim(), 'i');
    filter.$or = [{ title: rx }, { host: rx }, { user: rx }, { srcIp: rx }, { alertId: rx }];
  }

  const [items, total] = await Promise.all([
    Alert.find(filter).sort({ createdAt: -1 }).skip(Number(skip)).limit(Math.min(Number(limit), 200)).lean(),
    Alert.countDocuments(filter),
  ]);
  res.json({ total, count: items.length, items });
}

// GET /api/alerts/:id  (accepts Mongo _id or ALR-xxxxx)
async function findByAnyId(id) {
  if (/^[a-f0-9]{24}$/i.test(id)) return Alert.findById(id);
  return Alert.findOne({ alertId: id });
}

export async function getAlert(req, res) {
  const alert = await findByAnyId(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json(alert);
}

// PATCH /api/alerts/:id/status  { status, note }
export async function updateStatus(req, res) {
  const { status, note } = req.body || {};
  const alert = await findByAnyId(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  if (status) alert.status = status;
  // advance lifecycle stage sensibly
  const stageMap = { Acknowledged: 1, InProgress: 2, Escalated: 5, Contained: 6, Closed: 9 };
  if (stageMap[status] !== undefined) alert.stage = Math.max(alert.stage, stageMap[status]);
  if (status === 'Acknowledged' || status === 'InProgress') alert.assignee = req.user._id;

  alert.timeline.push({
    at: new Date(),
    text: note || `Status set to ${status} by ${req.user.name}`,
    actor: req.user.name,
  });
  await alert.save();

  req.io?.emit(SOCKET_EVENTS.ALERT_UPDATED, alert);
  res.json(alert);
}

// POST /api/alerts/:id/false-positive
export async function markFalsePositive(req, res) {
  const alert = await findByAnyId(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.status = 'FalsePositive';
  alert.timeline.push({ at: new Date(), text: `Marked false positive by ${req.user.name}`, actor: req.user.name });
  await alert.save();
  req.io?.emit(SOCKET_EVENTS.ALERT_UPDATED, alert);
  res.json(alert);
}

// POST /api/alerts/generate  — manually generate one ambient alert (L1+)
export async function generateOne(req, res) {
  const alert = await createAlert(req.io, req.body || {});
  res.status(201).json(alert);
}

// POST /api/alerts/scenario/:key  — inject a correlated attack chain
export async function launchScenario(req, res) {
  const chain = await runScenario(req.io, req.params.key);
  res.status(201).json({ scenario: req.params.key, count: chain.length, alerts: chain });
}
