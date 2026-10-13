import { Router } from 'express';
import {
  getCamps,
  getCampById,
  createCamp,
  updateCamp,
  deleteCamp,
  getCampAppointments,
} from '../controllers/campController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getCamps);
router.get('/:id', getCampById);
router.post('/', authenticate, authorize('ADMIN'), createCamp);
router.put('/:id', authenticate, authorize('ADMIN'), updateCamp);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCamp);
router.get('/:id/appointments', authenticate, authorize('ADMIN', 'DOCTOR', 'VOLUNTEER'), getCampAppointments);

export default router;
