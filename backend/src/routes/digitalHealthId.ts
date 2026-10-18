// backend/src/routes/digitalHealthId.ts
import { Router } from 'express';
import {
  getMyDigitalHealthId,
  createSharePass,
  accessSharedHealthPassport,
  revokeSharePass,
  getMyAccessHistory,
} from '../controllers/digitalHealthIdController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Current patient's secure digital health card
router.get('/my-card', authenticate, getMyDigitalHealthId);

// Create short-lived revocable share pass
router.post('/share-pass', authenticate, createSharePass);

// Access shared records via ephemeral pass (checks expiry & revocation)
router.get('/shared/:shareToken', accessSharedHealthPassport);

// Revoke an active pass immediately
router.post('/revoke-pass/:passId', authenticate, revokeSharePass);

// Patient checks who viewed their records
router.get('/access-history', authenticate, getMyAccessHistory);

export default router;

