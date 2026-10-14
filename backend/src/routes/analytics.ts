import { Router } from 'express';
import { getCampAnalytics, getResourceForecast, getInventoryAnalytics } from '../controllers/analyticsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/camps', authenticate, authorize(['ADMIN', 'ORGANIZER']), getCampAnalytics);
router.get('/forecast', authenticate, authorize(['ADMIN', 'ORGANIZER']), getResourceForecast);
router.get('/inventory', authenticate, authorize(['ADMIN', 'ORGANIZER']), getInventoryAnalytics);

export default router;

