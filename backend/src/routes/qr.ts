import { Router } from 'express';
import { generateQRCode, verifyQRCode } from '../controllers/qrController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/:appointmentId', authenticate, generateQRCode);
router.post('/verify', authenticate, authorize(['ADMIN', 'DOCTOR', 'VOLUNTEER', 'ORGANIZER']), verifyQRCode);
router.post('/verify-checkin', authenticate, authorize(['ADMIN', 'DOCTOR', 'VOLUNTEER', 'ORGANIZER']), verifyQRCode);

export default router;

