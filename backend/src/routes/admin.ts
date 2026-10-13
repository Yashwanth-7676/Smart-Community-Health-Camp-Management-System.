import { Router } from 'express';
import {
  getAdminStats,
  getAdminCamps,
  createCampAdmin,
  getAdminUsers,
  updateUserAdmin,
  assignStaffToCamp,
  getCampAnalytics,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/camps', getAdminCamps);
router.post('/camps', createCampAdmin);
router.get('/users', getAdminUsers);
router.put('/user/:id', updateUserAdmin);
router.post('/staff-assign', assignStaffToCamp);
router.get('/analytics', getCampAnalytics);

export default router;
