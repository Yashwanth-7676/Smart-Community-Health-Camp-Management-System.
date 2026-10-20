import { Router } from 'express';
import { getCampAnalytics, getResourceForecast, getInventoryAnalytics } from '../controllers/analyticsController';
import { getPredictiveOperations } from '../controllers/predictiveOperationsController';
import { getCommunityImpactReport, exportCommunityImpactCsv } from '../controllers/impactAnalyticsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/camps', authenticate, authorize(['ADMIN', 'ORGANIZER']), getCampAnalytics);
router.get('/forecast', authenticate, authorize(['ADMIN', 'ORGANIZER']), getResourceForecast);
router.get('/inventory', authenticate, authorize(['ADMIN', 'ORGANIZER']), getInventoryAnalytics);
router.get('/community-impact', authenticate, authorize(['ADMIN', 'ORGANIZER']), getCommunityImpactReport);
router.get('/community-impact/export-csv', authenticate, authorize(['ADMIN', 'ORGANIZER']), exportCommunityImpactCsv);
router.get('/predictive-operations/:campId', authenticate, authorize(['ADMIN', 'ORGANIZER', 'DOCTOR']), getPredictiveOperations);
router.get('/predictive-operations', authenticate, authorize(['ADMIN', 'ORGANIZER', 'DOCTOR']), (req, res, next) => {
  req.params.campId = (req.query.campId as string) || 'camp-1';
  return getPredictiveOperations(req, res, next);
});

export default router;

