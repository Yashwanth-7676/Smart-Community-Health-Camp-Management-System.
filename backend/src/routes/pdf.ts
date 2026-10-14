import { Router } from 'express';
import { generateMedicalReportPDF, generateInventoryReportPDF } from '../controllers/pdfController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/report/:reportId', authenticate, generateMedicalReportPDF);
router.get('/inventory/:campId', authenticate, authorize(['ADMIN', 'ORGANIZER']), generateInventoryReportPDF);

export default router;

