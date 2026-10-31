import { Router } from 'express';
import {
  createEducationResource,
  educationProgressSchema,
  educationResourceSchema,
  getMyEducationProgress,
  listEducationAdminResources,
  listEducationResources,
  listEducationLanguages,
  reviewEducationResource,
  submitEducationResourceForReview,
  updateMyEducationProgress,
  updateEducationResource,
  educationReviewSchema,
} from '../controllers/educationController';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validateZod } from '../middleware/zodValidate';

const router = Router();

router.get('/resources', optionalAuth, listEducationResources);
router.get('/languages', listEducationLanguages);
router.get('/progress', authenticate, getMyEducationProgress);
router.put('/progress/:translationId', authenticate, validateZod(educationProgressSchema), updateMyEducationProgress);

router.get(
  '/admin/resources',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'ORGANIZER'),
  listEducationAdminResources,
);
router.post(
  '/admin/resources',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'ORGANIZER'),
  validateZod(educationResourceSchema),
  createEducationResource,
);
router.put(
  '/admin/resources/:id',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'ORGANIZER'),
  validateZod(educationResourceSchema),
  updateEducationResource,
);
router.post(
  '/admin/resources/:id/submit',
  authenticate,
  authorize('ADMIN', 'DOCTOR', 'ORGANIZER'),
  submitEducationResourceForReview,
);
router.post(
  '/admin/resources/:id/review',
  authenticate,
  authorize('ADMIN', 'DOCTOR'),
  validateZod(educationReviewSchema),
  reviewEducationResource,
);

export default router;
