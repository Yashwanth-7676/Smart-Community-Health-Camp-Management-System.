// backend/src/routes/commandCenter.ts
import { Router } from 'express';
import {
  getCommandCenterSnapshot,
  streamCommandCenter,
  callNextToken,
} from '../controllers/commandCenterController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Real-time operations snapshot for staff and administrators
router.get('/:campId', authenticate, authorize(['ADMIN', 'DOCTOR', 'VOLUNTEER', 'ORGANIZER']), getCommandCenterSnapshot);

// Server-Sent Events (SSE) live updates stream
router.get('/:campId/stream', authenticate, authorize(['ADMIN', 'DOCTOR', 'VOLUNTEER', 'ORGANIZER']), streamCommandCenter);

// Call next token in live queue
router.post('/:campId/call-next', authenticate, authorize(['ADMIN', 'DOCTOR', 'VOLUNTEER', 'ORGANIZER']), callNextToken);

export default router;

