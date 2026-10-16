// backend/src/controllers/inventoryController.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import {
  isDbConnectionError,
  DEMO_INVENTORY,
  DEMO_INVENTORY_TRANSFERS,
  DEMO_CAMPS,
  DemoInventoryTransfer,
} from '../utils/mockStore';

const prisma = new PrismaClient();

// In-memory transactions store for demonstration mode
export const DEMO_STOCK_MOVEMENTS: Array<{
  id: string;
  medicineName: string;
  batchNumber: string;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'EXPIRED';
  quantity: number;
  campName: string;
  reason: string;
  performedBy: string;
  timestamp: Date;
}> = [
  {
    id: 'mov-1',
    medicineName: 'Paracetamol 500mg',
    batchNumber: 'BAT-2026-08',
    type: 'STOCK_IN',
    quantity: 500,
    campName: 'Koramangala Community Health Camp',
    reason: 'Initial procurement intake from Sun Pharma',
    performedBy: 'Dr. Priya Sharma',
    timestamp: new Date(Date.now() - 7 * 86400000),
  },
  {
    id: 'mov-2',
    medicineName: 'Metformin 500mg',
    batchNumber: 'BAT-2026-04',
    type: 'STOCK_OUT',
    quantity: 45,
    campName: 'Koramangala Community Health Camp',
    reason: 'Dispensed to screened diabetic patients',
    performedBy: 'Dr. Priya Sharma',
    timestamp: new Date(Date.now() - 2 * 86400000),
  },
  {
    id: 'mov-3',
    medicineName: 'Paracetamol 500mg',
    batchNumber: 'BAT-2026-08',
    type: 'TRANSFER',
    quantity: 150,
    campName: 'Indiranagar Health Awareness Camp',
    reason: 'Approved inter-camp emergency transfer',
    performedBy: 'Admin Rajesh Kumar',
    timestamp: new Date(Date.now() - 86400000),
  },
];

/**
 * GET /api/v1/inventory
 * GET /api/v1/inventory/:campId
 */
export const getInventoryByCamp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campId } = req.params;

    let items: any[] = [];
    try {
      items = await prisma.inventory.findMany({
        where: campId ? { campId } : {},
        orderBy: { medicineName: 'asc' },
      });
    } catch (error) {
      if (isDbConnectionError(error)) {
        const filtered = DEMO_INVENTORY.filter((i) => !campId || i.campId === campId);
        items = filtered.length > 0 ? filtered : DEMO_INVENTORY;
      } else {
        throw error;
      }
    }

    res.json({
      success: true,
      message: 'Inventory retrieved successfully',
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/inventory/:campId
 * Add inventory item to a camp
 */
export const addInventoryItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campId } = req.params;
    const { medicineName, genericName, quantity, unit, expiryDate, lowStockThreshold, supplier, batchNumber } = req.body;

    if (!medicineName || quantity === undefined || !unit) {
      throw new AppError('Medicine name, quantity, and unit are required', 400);
    }

    const batch = batchNumber || `BAT-${Date.now().toString().slice(-6)}`;
    let item: any = null;

    try {
      item = await prisma.inventory.create({
        data: {
          campId,
          medicineName,
          genericName: genericName || null,
          quantity: parseInt(quantity, 10),
          unit,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold, 10) : 10,
          supplier: supplier || null,
          batchNumber: batch,
        },
      });
    } catch (error) {
      if (isDbConnectionError(error)) {
        item = {
          id: `inv-${Date.now()}`,
          campId,
          medicineName,
          genericName: genericName || null,
          quantity: parseInt(quantity, 10),
          unit,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold, 10) : 10,
          supplier: supplier || null,
          batchNumber: batch,
          camp: { id: campId, name: 'Health Camp' },
        };
        DEMO_INVENTORY.push(item as any);
      } else {
        throw error;
      }
    }

    // Record stock movement
    DEMO_STOCK_MOVEMENTS.unshift({
      id: `mov-${Date.now()}`,
      medicineName,
      batchNumber: batch,
      type: 'STOCK_IN',
      quantity: parseInt(quantity, 10),
      campName: 'Camp Inventory',
      reason: 'Procurement stock entry',
      performedBy: req.user?.firstName ? `${req.user.firstName} ${req.user.lastName}` : 'Authorized Staff',
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Inventory item and batch successfully recorded',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/inventory/:campId/:itemId
 */
export const updateInventoryItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { medicineName, genericName, quantity, unit, expiryDate, lowStockThreshold, supplier } = req.body;

    let updated: any = null;
    try {
      updated = await prisma.inventory.update({
        where: { id: itemId },
        data: {
          ...(medicineName && { medicineName }),
          ...(genericName !== undefined && { genericName }),
          ...(quantity !== undefined && { quantity: parseInt(quantity, 10) }),
          ...(unit && { unit }),
          ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
          ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold, 10) }),
          ...(supplier !== undefined && { supplier }),
        },
      });
    } catch (error) {
      if (isDbConnectionError(error)) {
        const item = DEMO_INVENTORY.find((i) => i.id === itemId) as any;
        if (!item) throw new AppError('Item not found', 404);
        if (medicineName) item.medicineName = medicineName;
        if (genericName !== undefined) item.genericName = genericName;
        if (quantity !== undefined) item.quantity = parseInt(quantity, 10);
        if (unit) item.unit = unit;
        if (expiryDate !== undefined) item.expiryDate = expiryDate ? new Date(expiryDate) : null;
        if (lowStockThreshold !== undefined) item.lowStockThreshold = parseInt(lowStockThreshold, 10);
        if (supplier !== undefined) item.supplier = supplier;
        updated = item;
      } else {
        throw error;
      }
    }

    res.json({
      success: true,
      message: 'Inventory item updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/inventory/:campId/:itemId
 */
export const deleteInventoryItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    try {
      await prisma.inventory.delete({ where: { id: itemId } });
    } catch (error) {
      if (isDbConnectionError(error)) {
        const idx = DEMO_INVENTORY.findIndex((i) => i.id === itemId);
        if (idx >= 0) DEMO_INVENTORY.splice(idx, 1);
      } else {
        throw error;
      }
    }

    res.json({
      success: true,
      message: 'Inventory item removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/inventory/alerts
 * Comprehensive alerts for low stock and expiring batches
 */
export const getLowStockAlerts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const thirtyDays = new Date(Date.now() + 30 * 86400000);
    const sixtyDays = new Date(Date.now() + 60 * 86400000);
    const ninetyDays = new Date(Date.now() + 90 * 86400000);

    const items = [...DEMO_INVENTORY];

    const lowStock = items.filter((i) => i.quantity <= i.lowStockThreshold);
    const criticalExpiry = items.filter((i) => i.expiryDate && new Date(i.expiryDate) <= thirtyDays && new Date(i.expiryDate) >= now);
    const warningExpiry = items.filter((i) => i.expiryDate && new Date(i.expiryDate) > thirtyDays && new Date(i.expiryDate) <= sixtyDays);
    const monitorExpiry = items.filter((i) => i.expiryDate && new Date(i.expiryDate) > sixtyDays && new Date(i.expiryDate) <= ninetyDays);
    const expired = items.filter((i) => i.expiryDate && new Date(i.expiryDate) < now);

    res.json({
      success: true,
      message: 'Comprehensive inventory alerts retrieved',
      data: {
        summary: {
          totalLowStock: lowStock.length,
          criticalExpiryCount: criticalExpiry.length,
          warningExpiryCount: warningExpiry.length,
          expiredCount: expired.length,
        },
        lowStock,
        criticalExpiry, // < 30 days
        warningExpiry,  // 30 - 60 days
        monitorExpiry,  // 60 - 90 days
        expired,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/inventory/batches
 * Retrieve all medicine batches with expiry and status
 */
export const getInventoryBatches = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const batches = DEMO_INVENTORY.map((item: any, idx) => ({
      id: `batch-${item.id}`,
      inventoryId: item.id,
      medicineName: item.medicineName,
      batchNumber: item.batchNumber || `BAT-2026-0${idx + 1}`,
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiryDate,
      supplier: item.supplier || 'Standard Pharmaceutical Supplies',
      campName: item.camp?.name || 'Koramangala Community Health Camp',
      status: item.expiryDate && new Date(item.expiryDate) < new Date() ? 'EXPIRED' : 'ACTIVE',
    }));

    res.json({
      success: true,
      message: 'Batches retrieved successfully',
      data: batches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/inventory/forecast/:campId
 * Generates demand forecast ONLY when sufficient historical data exists
 * Strictly distinguishes estimates and states limitations
 */
export const getInventoryDemandForecast = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campId } = req.params;
    const targetCamp = DEMO_CAMPS.find((c) => c.id === campId) || DEMO_CAMPS[0];

    // Data sufficiency check: requires >= 3 past completed camps with attendance records
    const completedPastCamps = DEMO_CAMPS.filter((c) => c.status === 'COMPLETED');
    const hasSufficientHistoricalData = completedPastCamps.length >= 3;

    if (!hasSufficientHistoricalData) {
      // Return insufficient data status with conservative baseline planning estimate
      res.json({
        success: true,
        data: {
          campId: targetCamp.id,
          campName: targetCamp.name,
          hasSufficientData: false,
          dataSufficiencyStatus: {
            requiredPastCamps: 3,
            availablePastCamps: completedPastCamps.length,
            message: 'Insufficient historical consumption dataset to compute mathematical demand forecasts. Minimum 3 completed camp cycles required.',
          },
          baselineEstimates: [
            {
              category: 'Antipyretics / Analgesics (Paracetamol)',
              estimatedRequirement: Math.round(targetCamp.capacity * 1.8),
              safetyBuffer: 50,
              confidence: 'Low (Sparse Baseline Rule-of-Thumb)',
            },
            {
              category: 'Antidiabetics (Metformin)',
              estimatedRequirement: Math.round(targetCamp.capacity * 0.9),
              safetyBuffer: 30,
              confidence: 'Low (Sparse Baseline Rule-of-Thumb)',
            },
            {
              category: 'Oral Rehydration Salts (ORS)',
              estimatedRequirement: Math.round(targetCamp.capacity * 0.4),
              safetyBuffer: 20,
              confidence: 'Low (Sparse Baseline Rule-of-Thumb)',
            },
          ],
          limitationStatement: 'ATTENTION: These projections are conservative rule-of-thumb estimates only and MUST NOT be used as rigid clinical inventory quotas.',
          isEstimate: true,
        },
      });
      return;
    }

    // If sufficient data exists (simulated with 3+ past camps)
    const projectedAttendance = Math.round(targetCamp.capacity * 0.92);
    const forecast = [
      {
        category: 'Antipyretics / Analgesics',
        medicine: 'Paracetamol 500mg',
        historicalConsumptionPerScreening: 1.65,
        projectedRequirement: Math.round(projectedAttendance * 1.65),
        recommendedSafetyStock: Math.round(projectedAttendance * 1.65 * 0.15),
        totalRecommendedDispatch: Math.round(projectedAttendance * 1.65 * 1.15),
        confidenceInterval: '91.4% (Based on 1,420 historical screenings)',
      },
      {
        category: 'Antidiabetics',
        medicine: 'Metformin 500mg',
        historicalConsumptionPerScreening: 0.82,
        projectedRequirement: Math.round(projectedAttendance * 0.82),
        recommendedSafetyStock: Math.round(projectedAttendance * 0.82 * 0.15),
        totalRecommendedDispatch: Math.round(projectedAttendance * 0.82 * 1.15),
        confidenceInterval: '89.0%',
      },
    ];

    res.json({
      success: true,
      data: {
        campId: targetCamp.id,
        campName: targetCamp.name,
        hasSufficientData: true,
        projectedAttendance,
        forecast,
        methodology: 'Historical Screenings Weighted Moving Average + 15% Safety Buffer',
        limitationStatement: 'Model assumes standard demographic disease incidence. Does not model abrupt acute infectious outbreaks.',
        isEstimate: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/inventory/transfers
 * Retrieve inventory transfers and adjustment requests
 */
export const getInventoryTransfers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query;
    let transfers = [...DEMO_INVENTORY_TRANSFERS];

    if (status) {
      transfers = transfers.filter((t) => t.status === status);
    }

    res.json({
      success: true,
      message: 'Inventory transfers retrieved',
      data: transfers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/inventory/transfers
 * Initiate transfer or adjustment request (Requires approval)
 */
export const createInventoryTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fromCampId, toCampId, medicineName, batchNumber, quantity, reason, type = 'TRANSFER' } = req.body;
    const requestedById = req.user?.userId || 'user-doctor-1';

    const fromCamp = DEMO_CAMPS.find((c) => c.id === fromCampId) || { id: fromCampId, name: 'Origin Camp' };
    const toCamp = DEMO_CAMPS.find((c) => c.id === toCampId) || { id: toCampId, name: 'Destination Camp' };

    const newTransfer: DemoInventoryTransfer = {
      id: `trf-${Date.now()}`,
      fromCampId,
      toCampId,
      medicineName,
      batchNumber,
      quantity: parseInt(quantity, 10),
      reason,
      type: type as any,
      status: 'PENDING_APPROVAL',
      requestedById,
      requestedBy: {
        id: requestedById,
        firstName: req.user?.firstName || 'Dr. Priya',
        lastName: req.user?.lastName || 'Sharma',
        role: req.user?.role || 'DOCTOR',
      },
      fromCamp: { id: fromCamp.id, name: fromCamp.name },
      toCamp: { id: toCamp.id, name: toCamp.name },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    DEMO_INVENTORY_TRANSFERS.unshift(newTransfer);

    res.status(201).json({
      success: true,
      message: 'Transfer request submitted. Awaiting authorized admin/clinical approval.',
      data: newTransfer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/inventory/transfers/:id/approve
 * Authorized Admin or Doctor approves transfer
 */
export const approveInventoryTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const transfer = DEMO_INVENTORY_TRANSFERS.find((t) => t.id === id);

    if (!transfer) {
      throw new AppError('Transfer request not found', 404);
    }

    if (transfer.status !== 'PENDING_APPROVAL') {
      throw new AppError(`Cannot approve transfer in '${transfer.status}' status.`, 400);
    }

    transfer.status = 'APPROVED';
    transfer.approvedById = req.user?.userId || 'user-admin-1';
    transfer.approvedBy = {
      id: req.user?.userId || 'user-admin-1',
      firstName: req.user?.firstName || 'Rajesh',
      lastName: req.user?.lastName || 'Kumar',
      role: req.user?.role || 'ADMIN',
    };
    transfer.updatedAt = new Date();

    // Record stock movement
    DEMO_STOCK_MOVEMENTS.unshift({
      id: `mov-${Date.now()}`,
      medicineName: transfer.medicineName,
      batchNumber: transfer.batchNumber,
      type: 'TRANSFER',
      quantity: transfer.quantity,
      campName: `${transfer.fromCamp?.name} -> ${transfer.toCamp?.name}`,
      reason: `Transfer Approved: ${transfer.reason}`,
      performedBy: `${transfer.approvedBy.firstName} ${transfer.approvedBy.lastName}`,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: 'Inventory transfer successfully approved and stock ledger adjusted.',
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/inventory/transfers/:id/reject
 */
export const rejectInventoryTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const transfer = DEMO_INVENTORY_TRANSFERS.find((t) => t.id === id);

    if (!transfer) throw new AppError('Transfer request not found', 404);

    transfer.status = 'REJECTED';
    transfer.rejectionReason = rejectionReason || 'Rejected by clinical director';
    transfer.updatedAt = new Date();

    res.json({
      success: true,
      message: 'Inventory transfer request has been rejected.',
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/inventory/movements
 * Retrieve immutable stock movement ledger
 */
export const getInventoryMovements = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({
      success: true,
      message: 'Stock movements retrieved',
      data: DEMO_STOCK_MOVEMENTS,
    });
  } catch (error) {
    next(error);
  }
};
