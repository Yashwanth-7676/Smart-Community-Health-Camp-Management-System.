import { Request, Response, NextFunction } from 'express';
import { PrismaClient, CampStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildPaginationMeta } from '../utils/helpers';
import { CreateCampDto, UpdateCampDto, ListQueryParams } from '../types';
import { DEMO_CAMPS, isDbConnectionError } from '../utils/mockStore';

const prisma = new PrismaClient();

/**
 * GET /api/v1/camps
 * List all camps with search, filter, and pagination
 */
export const getCamps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as ListQueryParams;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as CampStatus;
    }

    const validSortFields = ['createdAt', 'name', 'startDate', 'endDate', 'capacity', 'registered'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    let camps: any[];
    let total: number;

    try {
      [camps, total] = await Promise.all([
        prisma.camp.findMany({
          where,
          include: {
            createdBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            _count: {
              select: { appointments: true, inventory: true },
            },
          },
          orderBy: { [orderField]: sortOrder },
          skip,
          take,
        }),
        prisma.camp.count({ where }),
      ]);
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        let filtered = [...DEMO_CAMPS];
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.name.toLowerCase().includes(s) ||
              c.location.toLowerCase().includes(s) ||
              c.description.toLowerCase().includes(s)
          );
        }
        if (status) {
          filtered = filtered.filter((c) => c.status === status);
        }
        total = filtered.length;
        camps = filtered.slice(skip, skip + take);
      } else {
        throw dbErr;
      }
    }

    res.json({
      success: true,
      message: 'Camps retrieved successfully',
      data: camps,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/camps/:id
 * Get a single camp by ID
 */
export const getCampById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    let camp: any;
    try {
      camp = await prisma.camp.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          doctorProfiles: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
          volunteerProfiles: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
          _count: {
            select: { appointments: true, inventory: true, medicalReports: true },
          },
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        camp = DEMO_CAMPS.find((c) => c.id === id);
      } else {
        throw dbErr;
      }
    }

    if (!camp) {
      throw new AppError('Camp not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Camp retrieved successfully',
      data: camp,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/camps
 * Create a new health camp (Admin only)
 */
export const createCamp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      location,
      address,
      latitude,
      longitude,
      startDate,
      endDate,
      capacity,
      services,
      description,
    } = req.body as CreateCampDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new AppError('Start date must be before end date', 400, 'INVALID_DATE_RANGE');
    }

    let camp: any;
    try {
      camp = await prisma.camp.create({
        data: {
          name,
          location,
          address,
          latitude,
          longitude,
          startDate: start,
          endDate: end,
          capacity,
          services: services || [],
          description,
          createdById: req.user!.userId,
        },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        camp = {
          id: `camp-${Date.now()}`,
          name,
          location,
          address: address || `${location}, Karnataka`,
          latitude: latitude || 12.9716,
          longitude: longitude || 77.5946,
          startDate: start,
          endDate: end,
          capacity: capacity || 100,
          registered: 0,
          status: 'UPCOMING',
          services: services || [],
          description: description || '',
          createdBy: { id: req.user?.userId || 'admin', firstName: req.user?.firstName || 'Admin', lastName: req.user?.lastName || 'Superintendent', email: req.user?.email || 'admin@healthcamp.com' },
          _count: { appointments: 0, inventory: 0 },
        };
        DEMO_CAMPS.unshift(camp);
      } else {
        throw dbErr;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Camp created successfully',
      data: camp,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/camps/:id
 * Update an existing camp (Admin only)
 */
export const updateCamp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateCampDto;

    const existingCamp = await prisma.camp.findUnique({ where: { id } });
    if (!existingCamp) {
      throw new AppError('Camp not found', 404, 'NOT_FOUND');
    }

    if (existingCamp.status === CampStatus.COMPLETED || existingCamp.status === CampStatus.CANCELLED) {
      throw new AppError('Cannot update a completed or cancelled camp', 400, 'INVALID_OPERATION');
    }

    const updateData: Record<string, unknown> = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.location) updateData.location = updates.location;
    if (updates.address) updateData.address = updates.address;
    if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
    if (updates.startDate) updateData.startDate = new Date(updates.startDate);
    if (updates.endDate) updateData.endDate = new Date(updates.endDate);
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
    if (updates.services) updateData.services = updates.services;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status) updateData.status = updates.status;

    const camp = await prisma.camp.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    res.json({
      success: true,
      message: 'Camp updated successfully',
      data: camp,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/camps/:id
 * Delete (cancel) a camp (Admin only)
 */
export const deleteCamp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const camp = await prisma.camp.findUnique({ where: { id } });
    if (!camp) {
      throw new AppError('Camp not found', 404, 'NOT_FOUND');
    }

    if (camp.status === CampStatus.ONGOING) {
      throw new AppError('Cannot delete an ongoing camp', 400, 'INVALID_OPERATION');
    }

    // Soft delete by setting status to CANCELLED
    await prisma.camp.update({
      where: { id },
      data: { status: CampStatus.CANCELLED },
    });

    res.json({
      success: true,
      message: 'Camp cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/camps/:id/appointments
 * Get all appointments for a specific camp
 */
export const getCampAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20', status } = req.query as ListQueryParams;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const camp = await prisma.camp.findUnique({ where: { id } });
    if (!camp) {
      throw new AppError('Camp not found', 404, 'NOT_FOUND');
    }

    const where: Record<string, unknown> = { campId: id };
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
          doctor: {
            select: { id: true, firstName: true, lastName: true },
          },
          queueTokenRef: true,
        },
        orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
        skip,
        take,
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Camp appointments retrieved successfully',
      data: appointments,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};
