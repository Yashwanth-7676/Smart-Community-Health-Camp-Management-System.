import { Router } from 'express';
import {
  getInventoryByCamp,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockAlerts,
} from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/:campId', getInventoryByCamp);
router.post('/:campId', authorize('ADMIN', 'DOCTOR'), addInventoryItem);
router.put('/:campId/:itemId', authorize('ADMIN', 'DOCTOR'), updateInventoryItem);
router.delete('/:campId/:itemId', authorize('ADMIN'), deleteInventoryItem);

export default router;
