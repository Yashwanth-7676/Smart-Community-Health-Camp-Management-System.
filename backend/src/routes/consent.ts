import { Router } from 'express';
import { getMyConsents, grantConsent, revokeConsent, getAllConsents } from '../controllers/consentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getMyConsents);
router.post('/grant', authenticate, grantConsent);
router.post('/revoke', authenticate, revokeConsent);
router.get('/all', authenticate, authorize(['ADMIN', 'ORGANIZER']), getAllConsents);

export default router;

