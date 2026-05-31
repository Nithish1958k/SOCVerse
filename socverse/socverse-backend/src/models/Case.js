import mongoose from 'mongoose';
import { SEVERITIES, CASE_STATUSES } from '../utils/constants.js';

const findingSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    text: { type: String, required: true },
    author: { type: String, default: 'analyst' },
  },
  { _id: false }
);

const caseSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true }, // CASE-0007
    title: { type: String, required: true },
    anchorAlert: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert', required: true },
    relatedAlerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }],
    severity: { type: String, enum: SEVERITIES },
    status: { type: String, enum: CASE_STATUSES, default: 'Open', index: true },
    stage: { type: Number, default: 5, min: 0, max: 9 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mitre: [{ type: String }],
    findings: { type: [findingSchema], default: [] },
    responseActions: { type: [String], default: [] }, // e.g. "Host X isolated"
  },
  { timestamps: true }
);

export const Case = mongoose.model('Case', caseSchema);
