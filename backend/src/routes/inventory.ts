// backend/src/routes/inventory.ts
import { Router } from 'express';
import {
  getInventoryByCamp,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockAlerts,
  getInventoryBatches,
  getInventoryDemandForecast,
  getInventoryTransfers,
  createInventoryTransfer,
  approveInventoryTransfer,
  rejectInventoryTransfer,
  getInventoryMovements,
} from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Specific routes MUST be declared before :campId parameter
router.get('/alerts', getLowStockAlerts);
router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/batches', getInventoryBatches);
router.get('/movements', getInventoryMovements);
router.get('/transfers', getInventoryTransfers);
router.post('/transfers', authorize('ADMIN', 'DOCTOR'), createInventoryTransfer);
router.patch('/transfers/:id/approve', authorize('ADMIN', 'DOCTOR'), approveInventoryTransfer);
router.patch('/transfers/:id/reject', authorize('ADMIN', 'DOCTOR'), rejectInventoryTransfer);
router.get('/forecast/:campId', getInventoryDemandForecast);

// Parameterized Camp Inventory routes
router.get('/', getInventoryByCamp);
router.get('/:campId', getInventoryByCamp);
router.post('/:campId', authorize('ADMIN', 'DOCTOR'), addInventoryItem);
router.put('/:campId/:itemId', authorize('ADMIN', 'DOCTOR'), updateInventoryItem);
router.delete('/:campId/:itemId', authorize('ADMIN'), deleteInventoryItem);

export default router;
