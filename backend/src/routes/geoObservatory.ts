// backend/src/routes/geoObservatory.ts
/**
 * MEGA UPGRADE 5.0 — GEOAI PUBLIC HEALTH OBSERVATORY ROUTES
 */

import { Router } from 'express';
import {
  getPublicHealthIndicators,
  getGeoAIAnomalies,
  investigateAnomaly,
  getEnvironmentalLayers,
  getHealthTrendTimeline,
  getDistrictIntelligenceScores,
  getObservatoryAlerts,
  updateAlertStatus,
  createDeploymentPlan,
  getDeploymentPlans,
  queryHealthcareMap,
  getDataSourcesRegistry,
} from '../controllers/geoObservatoryController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Module 1 & 11: Public Health Intelligence Map & Privacy Safeguards
router.get('/indicators', getPublicHealthIndicators);

// Module 2: GeoAI Anomaly Detection
router.get('/anomalies', getGeoAIAnomalies);
router.post('/anomalies/:id/investigate', authenticate, authorize('ADMIN', 'DOCTOR'), investigateAnomaly);

// Module 3: Environmental Intelligence
router.get('/environmental', getEnvironmentalLayers);

// Module 4: Health Trend Time Machine
router.get('/timeline', getHealthTrendTimeline);

// Module 5: Explainable District Intelligence Scores
router.get('/district-scores', getDistrictIntelligenceScores);

// Module 6: Intelligent Alert Centre
router.get('/alerts', getObservatoryAlerts);
router.patch('/alerts/:id', authenticate, authorize('ADMIN'), updateAlertStatus);

// Module 7: Rapid Healthcare Deployment Planner
router.post('/deployment/plan', authenticate, authorize('ADMIN'), createDeploymentPlan);
router.get('/deployment/plans', authenticate, authorize('ADMIN'), getDeploymentPlans);

// Module 9: Natural Language Ask Your Healthcare Map
router.post('/ask-map', queryHealthcareMap);

// Module 12: Data Sources & Data Quality Registry
router.get('/data-sources', getDataSourcesRegistry);

export default router;

