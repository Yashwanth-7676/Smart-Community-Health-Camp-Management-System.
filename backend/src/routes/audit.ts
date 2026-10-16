// backend/src/routes/audit.ts
import { Router } from 'express';
import {
  getAuditLogs,
  getSecurityAlerts,
  resolveSecurityAlert,
  getSecurityStats,
} from '../controllers/auditController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Immutable Audit Log & Security Intelligence (Strictly ADMIN only)
// Note: Intentionally NO PUT, PATCH, or DELETE routes to enforce append-only audit immutability
router.use(authenticate, authorize(['ADMIN']));

router.get('/security-alerts', getSecurityAlerts);
router.post('/security-alerts/:id/resolve', resolveSecurityAlert);
router.get('/stats', getSecurityStats);
router.get('/', getAuditLogs);

export default router;
