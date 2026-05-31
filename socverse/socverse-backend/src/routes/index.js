import { Router } from 'express';
import authRoutes from './auth.routes.js';
import alertRoutes from './alert.routes.js';
import ticketRoutes from './ticket.routes.js';
import caseRoutes from './case.routes.js';
import metricsRoutes from './metrics.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/alerts', alertRoutes);
router.use('/tickets', ticketRoutes);
router.use('/cases', caseRoutes);
router.use('/metrics', metricsRoutes);

export default router;
