import { Router } from 'express';
import {
  getReportById,
  createReport,
  getReportsByPatientId,
  getPrintableReport,
} from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('DOCTOR'), createReport);
router.get('/patient/:id', getReportsByPatientId);
router.get('/print/:id', getPrintableReport);
router.get('/:id', getReportById);

export default router;
