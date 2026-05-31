import { Ticket } from '../models/Ticket.js';
import { Alert } from '../models/Alert.js';
import { nextId } from '../utils/sequence.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

// POST /api/tickets  { alertId, title, priority, assignedTier, notes }
export async function createTicket(req, res) {
  const { alertId, title, priority, assignedTier, notes } = req.body || {};
  if (!alertId) return res.status(400).json({ error: 'alertId is required' });

  const alert = /^[a-f0-9]{24}$/i.test(alertId)
    ? await Alert.findById(alertId)
    : await Alert.findOne({ alertId });
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  const ticketId = await nextId('INC', 4);
  const ticket = await Ticket.create({
    ticketId,
    alert: alert._id,
    title: title || `${alert.category} — ${alert.host}`,
    priority: priority || 'P3',
    assignedTier: assignedTier || 'L2',
    severity: alert.severity,
    category: alert.category,
    host: alert.host,
    notes,
    status: 'Open',
    creator: req.user._id,
  });

  alert.status = 'InProgress';
  alert.stage = Math.max(alert.stage, 2);
  alert.timeline.push({ at: new Date(), text: `Ticket ${ticketId} created → ${ticket.assignedTier}`, actor: req.user.name });
  await alert.save();

  req.io?.emit(SOCKET_EVENTS.TICKET_NEW, ticket);
  req.io?.emit(SOCKET_EVENTS.ALERT_UPDATED, alert);
  res.status(201).json(ticket);
}

// GET /api/tickets
export async function listTickets(req, res) {
  const { status, tier } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (tier) filter.assignedTier = tier;
  const items = await Ticket.find(filter).sort({ createdAt: -1 }).populate('alert', 'alertId severity host').lean();
  res.json({ count: items.length, items });
}

// PATCH /api/tickets/:id/status  { status }
export async function updateTicketStatus(req, res) {
  const { status } = req.body || {};
  const ticket = await Ticket.findOne(
    /^[a-f0-9]{24}$/i.test(req.params.id) ? { _id: req.params.id } : { ticketId: req.params.id }
  );
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (status) ticket.status = status;
  await ticket.save();
  res.json(ticket);
}
