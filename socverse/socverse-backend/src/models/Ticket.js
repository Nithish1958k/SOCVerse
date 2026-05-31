import mongoose from 'mongoose';
import { SEVERITIES, CATEGORIES, TICKET_STATUSES } from '../utils/constants.js';

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true, index: true }, // INC-0042
    alert: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert', required: true },
    title: { type: String, required: true },
    priority: { type: String, enum: ['P1', 'P2', 'P3', 'P4'], default: 'P3' },
    assignedTier: { type: String, enum: ['L1', 'L2', 'L3'], default: 'L2' },
    severity: { type: String, enum: SEVERITIES },
    category: { type: String, enum: CATEGORIES },
    host: String,
    notes: String,
    status: { type: String, enum: TICKET_STATUSES, default: 'Open', index: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Ticket = mongoose.model('Ticket', ticketSchema);
