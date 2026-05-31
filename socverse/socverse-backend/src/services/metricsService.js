import { Alert } from '../models/Alert.js';
import { Case } from '../models/Case.js';
import { Ticket } from '../models/Ticket.js';
import { SEVERITIES, SOURCES } from '../utils/constants.js';

// Compute SOC operational metrics from current persisted state.
export async function computeMetrics() {
  const [alerts, openCases, tickets] = await Promise.all([
    Alert.find({}, 'severity source status category detectMin stage createdAt updatedAt').lean(),
    Case.countDocuments({ status: { $ne: 'Closed' } }),
    Ticket.countDocuments({}),
  ]);

  const total = alerts.length;
  const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, 0]));
  const bySource = Object.fromEntries(SOURCES.map((s) => [s, 0]));
  const byStatus = {};
  const byCategory = {};

  let mttdSum = 0;
  let mttdN = 0;
  let mttrSum = 0;
  let mttrN = 0;
  let fp = 0;
  let escalated = 0;
  let contained = 0;
  let closed = 0;

  for (const a of alerts) {
    if (bySeverity[a.severity] !== undefined) bySeverity[a.severity] += 1;
    if (bySource[a.source] !== undefined) bySource[a.source] += 1;
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;

    if (typeof a.detectMin === 'number') { mttdSum += a.detectMin; mttdN += 1; }
    if (a.status === 'FalsePositive') fp += 1;
    if (a.status === 'Escalated') escalated += 1;
    if (a.status === 'Contained' || a.status === 'Closed') {
      contained += 1;
      // approximate response time from detect→resolution timestamps
      const mins = Math.max(1, (new Date(a.updatedAt) - new Date(a.createdAt)) / 60000);
      mttrSum += mins; mttrN += 1;
    }
    if (a.status === 'Closed') closed += 1;
  }

  const mttd = mttdN ? mttdSum / mttdN : 0;
  const mttr = mttrN ? mttrSum / mttrN : 0;
  const fpRate = total ? (fp / total) * 100 : 0;
  const slaCompliance = Math.max(
    0,
    Math.min(100, 100 - fpRate * 0.4 - (mttr > 20 ? (mttr - 20) * 1.5 : 0))
  );

  return {
    totals: { alerts: total, openCases, tickets, closed, contained, escalated, falsePositives: fp },
    timing: {
      mttdMinutes: +mttd.toFixed(2),
      mttrMinutes: +mttr.toFixed(2),
      slaCompliancePct: +slaCompliance.toFixed(1),
      falsePositiveRatePct: +fpRate.toFixed(1),
    },
    distributions: { bySeverity, bySource, byStatus, byCategory },
  };
}
