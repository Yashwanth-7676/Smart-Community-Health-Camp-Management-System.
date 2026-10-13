import { Router } from 'express';
import {
  getAppointments,
  createAppointment,
  getAppointmentById,
  updateAppointment,
  getPatientAppointments,
  getCampSlots,
} from '../controllers/appointmentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAppointments);
router.post('/', authenticate, createAppointment);
router.get('/camp/:campId/slots', getCampSlots);
router.get('/patient/:patientId', authenticate, getPatientAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.put('/:id', authenticate, updateAppointment);

export default router;
