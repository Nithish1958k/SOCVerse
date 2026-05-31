import { Router } from 'express';
import { createTicket, listTickets, updateTicketStatus } from '../controllers/ticketController.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(listTickets));
router.post('/', requireMinRole('L1'), asyncHandler(createTicket));
router.patch('/:id/status', requireMinRole('L1'), asyncHandler(updateTicketStatus));

export default router;
