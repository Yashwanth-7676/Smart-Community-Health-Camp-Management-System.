// backend/src/routes/aiPlanner.ts
import { Router } from 'express';
import {
  getCampProposals,
  approveCampProposal,
  rejectCampProposal,
} from '../controllers/aiCampPlannerController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All AI planning endpoints require Administrator role
router.use(authenticate, authorize('ADMIN'));

router.get('/proposals', getCampProposals);
router.post('/approve', approveCampProposal);
router.post('/reject', rejectCampProposal);

export default router;
