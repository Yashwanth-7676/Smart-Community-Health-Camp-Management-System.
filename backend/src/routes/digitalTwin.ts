// backend/src/routes/digitalTwin.ts
import { Router } from 'express';
import {
  getDigitalTwinAreas,
  getDigitalTwinAreaDetail,
  simulateDigitalTwinResources,
  getRuralVillages,
  getSimulationPlans,
  evaluateCoverageCandidate,
  createSimulationPlan,
  getMMUFleet,
  updateMMUStatus,
  runScenarioSimulation,
} from '../controllers/digitalTwinController';

const router = Router();

// Module 1: Healthcare Coverage Simulation
router.get('/simulation/plans', getSimulationPlans);
router.post('/simulation/evaluate', evaluateCoverageCandidate);
router.post('/simulation/plans', createSimulationPlan);

// Module 2: Village & Rural Accessibility
router.get('/villages', getRuralVillages);

// Module 4: Mobile Medical Unit Digital Tracking
router.get('/mmu/fleet', getMMUFleet);
router.patch('/mmu/fleet/:unitId/status', updateMMUStatus);

// Module 6: AI Scenario Lab
router.post('/scenarios/run', runScenarioSimulation);

// Core Digital Twin Regional Aggregates
router.get('/areas', getDigitalTwinAreas);
router.get('/areas/:areaId', getDigitalTwinAreaDetail);
router.post('/simulate', simulateDigitalTwinResources);

export default router;
