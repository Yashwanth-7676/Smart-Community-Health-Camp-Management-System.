import { Router } from 'express';
import {
  getReportById,
  createReport,
  getReportsByPatientId,
  getPrintableReport,
  getAllReports,
} from '../controllers/reportController';
import {
  reportReaderUpload,
  processMedicalReportUpload,
  confirmAndLinkExtractedReport,
} from '../controllers/reportReaderController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Medical Report Reader Endpoints
router.post(
  '/reader/upload',
  authorize('PATIENT', 'DOCTOR', 'ADMIN'),
  reportReaderUpload.single('file'),
  processMedicalReportUpload
);
router.post(
  '/reader/confirm-link',
  authorize('DOCTOR', 'ADMIN'),
  confirmAndLinkExtractedReport
);

router.get('/', authorize('PATIENT', 'DOCTOR', 'ADMIN'), getAllReports);
router.post('/', authorize('DOCTOR'), createReport);
router.get('/patient/:id', authorize('PATIENT', 'DOCTOR', 'ADMIN'), getReportsByPatientId);
router.get('/print/:id', getPrintableReport);
router.get('/:id', getReportById);

export default router;

