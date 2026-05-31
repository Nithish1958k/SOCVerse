import mongoose from 'mongoose';
import {
  SOURCES, SEVERITIES, CATEGORIES, ALERT_STATUSES,
} from '../utils/constants.js';

const timelineEntrySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    text: { type: String, required: true },
    actor: { type: String, default: 'system' },
  },
  { _id: false }
);

const iocSchema = new mongoose.Schema(
  {
    ip: [{ type: String }],
    domain: [{ type: String }],
    url: [{ type: String }],
    hash: [{ type: String }],
  },
  { _id: false }
);

const alertSchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true, unique: true, index: true }, // e.g. ALR-00231
    source: { type: String, enum: SOURCES, required: true, index: true },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    severity: { type: String, enum: SEVERITIES, required: true, index: true },
    title: { type: String, required: true },
    raw: { type: String },

    srcIp: String,
    destIp: String,
    host: String,
    user: String,
    domain: String,
    url: String,
    hash: String,

    status: { type: String, enum: ALERT_STATUSES, default: 'New', index: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    scenario: { type: String, default: null }, // correlated-attack label
    mitre: [{ type: String }], // technique IDs e.g. T1566
    stage: { type: Number, default: 0, min: 0, max: 9 },
    detectMin: { type: Number, default: 0 }, // simulated minutes-to-detect (for MTTD)

    iocs: { type: iocSchema, default: () => ({}) },
    timeline: { type: [timelineEntrySchema], default: [] },
  },
  { timestamps: true }
);

alertSchema.index({ createdAt: -1 });

export const Alert = mongoose.model('Alert', alertSchema);
