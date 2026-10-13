import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

/**
 * GET /api/v1/inventory/:campId
 * Get inventory items for a camp
 */
export const getInventoryByCamp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campId } = req.params;

    const items = await prisma.inventory.findMany({
      where: { campId },
      orderBy: { medicineName: 'asc' },
    });

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
    const { medicineName, genericName, quantity, unit, expiryDate, lowStockThreshold, supplier } = req.body;

    if (!medicineName || quantity === undefined || !unit) {
      throw new AppError('Medicine name, quantity, and unit are required', 400);
    }

    const item = await prisma.inventory.create({
      data: {
        campId,
        medicineName,
        genericName: genericName || null,
        quantity: parseInt(quantity, 10),
        unit,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold, 10) : 10,
        supplier: supplier || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Inventory item added',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/inventory/:campId/:itemId
 * Update inventory item quantity/details
 */
export const updateInventoryItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { medicineName, genericName, quantity, unit, expiryDate, lowStockThreshold, supplier } = req.body;

    const updated = await prisma.inventory.update({
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
 * Delete an inventory item
 */
export const deleteInventoryItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;

    await prisma.inventory.delete({
      where: { id: itemId },
    });

    res.json({
      success: true,
      message: 'Inventory item removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/inventory/alerts/low-stock
 * Retrieve all items with low stock or approaching expiry
 */
export const getLowStockAlerts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allItems = await prisma.inventory.findMany({
      include: {
        camp: {
          select: { id: true, name: true, location: true },
        },
      },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const lowStock = allItems.filter((i) => i.quantity <= i.lowStockThreshold);
    const expiringSoon = allItems.filter((i) => i.expiryDate && i.expiryDate <= thirtyDaysFromNow && i.expiryDate >= now);
    const expired = allItems.filter((i) => i.expiryDate && i.expiryDate < now);

    res.json({
      success: true,
      message: 'Inventory alerts retrieved',
      data: {
        lowStock,
        expiringSoon,
        expired,
      },
    });
  } catch (error) {
    next(error);
  }
};
