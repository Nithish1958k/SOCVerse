import { Router } from 'express';
import {
  listAlerts, getAlert, updateStatus, markFalsePositive, generateOne, launchScenario,
} from '../controllers/alertController.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();
router.use(authenticate);

// All authenticated analysts can read the queue
router.get('/', asyncHandler(listAlerts));
router.get('/:id', asyncHandler(getAlert));

// L1+ triage actions
router.patch('/:id/status', requireMinRole('L1'), asyncHandler(updateStatus));
router.post('/:id/false-positive', requireMinRole('L1'), asyncHandler(markFalsePositive));

// Demo / range tooling — generate ambient alert or full scenario (L1+)
router.post('/generate', requireMinRole('L1'), asyncHandler(generateOne));
router.post('/scenario/:key', requireMinRole('L1'), asyncHandler(launchScenario));

export default router;
