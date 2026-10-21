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

router.get('/', authenticate, authorize('ADMIN', 'DOCTOR'), getPatients);
router.post('/profile', authenticate, authorize('PATIENT'), upsertPatientProfile);
router.get('/:id', authenticate, authorize('PATIENT', 'DOCTOR', 'ADMIN'), getPatientById);
router.put('/:id', authenticate, authorize('PATIENT', 'ADMIN'), updatePatient);
router.get('/:id/appointments', authenticate, authorize('PATIENT', 'DOCTOR', 'ADMIN'), getPatientAppointments);
router.get('/:id/reports', authenticate, authorize('PATIENT', 'DOCTOR', 'ADMIN'), getPatientReports);

export default router;
