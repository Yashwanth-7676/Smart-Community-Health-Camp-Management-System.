// backend/src/routes/digitalTwin.ts
import { Router } from 'express';
import {
  getDigitalTwinAreas,
  getDigitalTwinAreaDetail,
  simulateDigitalTwinResources,
} from '../controllers/digitalTwinController';

const router = Router();

// Public / Authenticated read routes for Community Health Digital Twin
router.get('/areas', getDigitalTwinAreas);
router.get('/areas/:areaId', getDigitalTwinAreaDetail);
router.post('/simulate', simulateDigitalTwinResources);

export default router;
