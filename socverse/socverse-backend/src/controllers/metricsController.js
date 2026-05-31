import { computeMetrics } from '../services/metricsService.js';

// GET /api/metrics
export async function getMetrics(req, res) {
  const metrics = await computeMetrics();
  res.json(metrics);
}
