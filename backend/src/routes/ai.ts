import { Router } from 'express';
import { chatWithAssistant } from '../controllers/aiAssistantController';
import { aiLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/chat', aiLimiter, chatWithAssistant);

export default router;

