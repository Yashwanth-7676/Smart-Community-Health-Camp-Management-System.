import { Router } from 'express';
import {
  getCamps,
  getMapCamps,
  getCampById,
  createCamp,
  updateCamp,
  updateCampLocation,
  deleteCamp,
  getCampAppointments,
} from '../controllers/campController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Full map discovery endpoint - must be before /:id
router.get('/map', getMapCamps);

router.get('/', getCamps);
router.get('/:id', getCampById);
router.post('/', authenticate, authorize('ADMIN'), createCamp);
router.put('/:id', authenticate, authorize('ADMIN'), updateCamp);
router.patch('/:id/location', authenticate, authorize('ADMIN'), updateCampLocation);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCamp);
router.get('/:id/appointments', authenticate, authorize('ADMIN', 'DOCTOR', 'VOLUNTEER'), getCampAppointments);

export default router;
