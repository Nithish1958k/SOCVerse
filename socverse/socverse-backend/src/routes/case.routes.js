import { Router } from 'express';
import {
  escalate, listCases, addFinding, contain, closeCase,
} from '../controllers/caseController.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(listCases));

// Escalation creates a case — L2 and above
router.post('/escalate', requireMinRole('L2'), asyncHandler(escalate));
router.post('/:id/findings', requireMinRole('L2'), asyncHandler(addFinding));

// Containment & closure are L3 (and Manager) responsibilities
router.post('/:id/contain', requireMinRole('L3'), asyncHandler(contain));
router.post('/:id/close', requireMinRole('L3'), asyncHandler(closeCase));

export default router;
