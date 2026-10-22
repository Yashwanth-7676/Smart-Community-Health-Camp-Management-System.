import { Router } from 'express';
import {
  getDoctorDashboard,
  getDoctorPatients,
  createMedicalReport,
  getDoctorReports,
  getDoctorAppointments,
  updateAppointmentByDoctor,
  getDoctorWorkflowStats,
} from '../controllers/doctorController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('DOCTOR', 'ADMIN'));

router.get('/dashboard', getDoctorDashboard);
router.get('/workflow-stats', getDoctorWorkflowStats);
router.get('/patients', getDoctorPatients);
router.post('/report', createMedicalReport);
router.get('/reports', getDoctorReports);
router.get('/appointments', getDoctorAppointments);
router.put('/appointment/:id', updateAppointmentByDoctor);

export default router;
