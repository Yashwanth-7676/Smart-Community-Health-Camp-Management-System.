import { Router } from 'express';
import { requestPasswordReset, resetPassword } from '../controllers/passwordResetController';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/request', authLimiter, requestPasswordReset);
router.post('/reset', authLimiter, resetPassword);

export default router;

