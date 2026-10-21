import { Router } from 'express';
import {
  getAppointments,
  createAppointment,
  getAppointmentById,
  updateAppointment,
  getPatientAppointments,
  getCampSlots,
} from '../controllers/appointmentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('PATIENT', 'DOCTOR', 'ADMIN'), getAppointments);
router.post('/', authenticate, authorize('PATIENT', 'ADMIN'), createAppointment);
router.get('/camp/:campId/slots', getCampSlots);
router.get('/patient/:patientId', authenticate, authorize('PATIENT', 'DOCTOR', 'ADMIN'), getPatientAppointments);
router.get('/:id', authenticate, authorize('PATIENT', 'DOCTOR', 'ADMIN'), getAppointmentById);
router.put('/:id', authenticate, authorize('PATIENT', 'DOCTOR', 'ADMIN'), updateAppointment);

export default router;
