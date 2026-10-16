// backend/src/routes/followUps.ts
import { Router } from 'express';
import {
  getFollowUps,
  createFollowUp,
  updateFollowUpStatus,
  dispatchFollowUpNotification,
  retryFollowUpNotification,
  getFollowUpHistory,
} from '../controllers/followUpController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getFollowUps);
router.post('/', authorize('DOCTOR', 'ADMIN', 'VOLUNTEER'), createFollowUp);
router.patch('/:id/status', authorize('DOCTOR', 'ADMIN', 'VOLUNTEER'), updateFollowUpStatus);
router.post('/:id/notify', authorize('DOCTOR', 'ADMIN'), dispatchFollowUpNotification);
router.post('/:id/retry', authorize('DOCTOR', 'ADMIN'), retryFollowUpNotification);
router.get('/:id/history', authorize('DOCTOR', 'ADMIN'), getFollowUpHistory);

export default router;
