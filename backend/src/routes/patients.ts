import { Router } from 'express';
import {
  getPatients,
  getPatientById,
  updatePatient,
  upsertPatientProfile,
  getPatientAppointments,
  getPatientReports,
} from '../controllers/patientController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'DOCTOR', 'VOLUNTEER'), getPatients);
router.post('/profile', authenticate, upsertPatientProfile);
router.get('/:id', authenticate, getPatientById);
router.put('/:id', authenticate, updatePatient);
router.get('/:id/appointments', authenticate, getPatientAppointments);
router.get('/:id/reports', authenticate, getPatientReports);

export default router;
