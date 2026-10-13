import { Router } from 'express';
import {
  getVolunteerDashboard,
  registerPatientByVolunteer,
  getCampQueue,
  updateQueueTokenStatus,
  markAttendance,
} from '../controllers/volunteerController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorize('VOLUNTEER', 'ADMIN'), getVolunteerDashboard);
router.post('/register-patient', authorize('VOLUNTEER', 'ADMIN'), registerPatientByVolunteer);
router.get('/queue/:campId', authorize('VOLUNTEER', 'DOCTOR', 'ADMIN'), getCampQueue);
router.put('/queue/:tokenId', authorize('VOLUNTEER', 'DOCTOR', 'ADMIN'), updateQueueTokenStatus);
router.post('/attendance', authorize('VOLUNTEER', 'ADMIN'), markAttendance);

export default router;
