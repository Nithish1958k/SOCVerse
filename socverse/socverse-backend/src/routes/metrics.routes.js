import { Router } from 'express';
import { getMetrics } from '../controllers/metricsController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

// Metrics & SLA dashboard is restricted to L3 and Manager (matches front-end)
router.get('/', authenticate, requireRole('L3', 'Manager'), asyncHandler(getMetrics));

export default router;
