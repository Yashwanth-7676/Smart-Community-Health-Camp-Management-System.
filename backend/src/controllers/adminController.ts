import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role, CampStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { isDbConnectionError, DEMO_CAMPS, DEMO_USERS, DEMO_APPOINTMENTS, DEMO_INVENTORY } from '../utils/mockStore';

const prisma = new PrismaClient();

/**
 * GET /api/v1/admin/stats
 * Comprehensive admin overview statistics
 */
export const getAdminStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalCamps,
      activeCamps,
      totalPatients,
      totalDoctors,
      totalVolunteers,
      totalAppointments,
      completedAppointments,
      lowStockItems,
    ] = await Promise.all([
      prisma.camp.count(),
      prisma.camp.count({ where: { status: { in: [CampStatus.UPCOMING, CampStatus.ONGOING] } } }),
      prisma.user.count({ where: { role: Role.PATIENT } }),
      prisma.user.count({ where: { role: Role.DOCTOR } }),
      prisma.user.count({ where: { role: Role.VOLUNTEER } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.inventory.count({
        where: {
          quantity: { lte: 10 },
        },
      }),
    ]);

    res.json({
      success: true,
      message: 'Admin stats retrieved successfully',
      data: {
        totalCamps,
        activeCamps,
        totalPatients,
        totalDoctors,
        totalVolunteers,
        totalAppointments,
        completedAppointments,
        lowStockItems,
      },
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      res.json({
        success: true,
        message: 'Admin stats retrieved successfully (demonstration mode)',
        data: {
          totalCamps: DEMO_CAMPS.length,
          activeCamps: DEMO_CAMPS.filter((c) => c.status === 'UPCOMING' || c.status === 'ONGOING').length,
          totalPatients: DEMO_USERS.filter((u) => u.role === 'PATIENT').length,
          totalDoctors: DEMO_USERS.filter((u) => u.role === 'DOCTOR').length,
          totalVolunteers: DEMO_USERS.filter((u) => u.role === 'VOLUNTEER').length,
          totalAppointments: DEMO_APPOINTMENTS.length,
          completedAppointments: DEMO_APPOINTMENTS.filter((a) => a.status === 'COMPLETED').length,
          lowStockItems: DEMO_INVENTORY.filter((i) => i.quantity <= i.lowStockThreshold).length,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * GET /api/v1/admin/camps
 * List all camps for admin with detailed statistics
 */
export const getAdminCamps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, status } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status as CampStatus;
    }

    const [camps, total] = await Promise.all([
      prisma.camp.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          _count: {
            select: {
              appointments: true,
              medicalReports: true,
              doctorProfiles: true,
              volunteerProfiles: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
      }),
      prisma.camp.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Camps retrieved',
      data: camps,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      res.json({
        success: true,
        message: 'Camps retrieved (demonstration mode)',
        data: DEMO_CAMPS,
        meta: {
          total: DEMO_CAMPS.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * POST /api/v1/admin/camps
 * Create camp as admin
 */
export const createCampAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, location, address, latitude, longitude, startDate, endDate, capacity, services, description } = req.body;

    if (!name || !location || !address || !startDate || !endDate || !capacity) {
      throw new AppError('Missing required camp fields', 400);
    }

    const camp = await prisma.camp.create({
      data: {
        name,
        location,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        capacity: parseInt(capacity, 10),
        services: services || [],
        description: description || null,
        createdById: userId || 'admin',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Camp created successfully',
      data: camp,
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      const mockCamp = {
        id: `camp-admin-${Date.now()}`,
        name: req.body.name,
        location: req.body.location,
        address: req.body.address,
        latitude: req.body.latitude ? parseFloat(req.body.latitude) : 12.9716,
        longitude: req.body.longitude ? parseFloat(req.body.longitude) : 77.5946,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        capacity: parseInt(req.body.capacity, 10),
        registered: 0,
        status: 'UPCOMING',
        services: req.body.services || [],
        description: req.body.description || null,
        createdById: req.user?.userId || 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { appointments: 0, inventory: 0 },
      };
      DEMO_CAMPS.unshift(mockCamp as any);
      res.status(201).json({
        success: true,
        message: 'Camp created successfully (demonstration mode)',
        data: mockCamp,
      });
      return;
    }
    next(error);
  }
};

/**
 * GET /api/v1/admin/users
 * Manage registered users
 */
export const getAdminUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, search, page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) {
      where.role = role as Role;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          patientProfile: true,
          doctorProfile: true,
          volunteerProfile: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Users retrieved',
      data: users,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      const sanitized = DEMO_USERS.map(({ passwordHash, ...rest }) => rest);
      res.json({
        success: true,
        message: 'Users retrieved (demonstration mode)',
        data: sanitized,
        meta: {
          total: sanitized.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * PUT /api/v1/admin/user/:id
 * Update user status or role
 */
export const updateUserAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive, role, firstName, lastName, phone } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(role && { role }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/staff-assign
 * Assign doctors and volunteers to camps
 */
export const assignStaffToCamp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campId, doctorIds = [], volunteerIds = [] } = req.body;

    if (!campId) {
      throw new AppError('Camp ID is required', 400);
    }

    // Connect doctors to camp
    if (doctorIds.length > 0) {
      for (const docUserId of doctorIds) {
        await prisma.doctorProfile.upsert({
          where: { userId: docUserId },
          create: {
            userId: docUserId,
            specialization: 'General Medicine',
            licenseNumber: `LIC-${Date.now()}`,
            assignedCamps: { connect: { id: campId } },
          },
          update: {
            assignedCamps: { connect: { id: campId } },
          },
        });
      }
    }

    // Assign volunteers
    if (volunteerIds.length > 0) {
      for (const volUserId of volunteerIds) {
        await prisma.volunteerProfile.upsert({
          where: { userId: volUserId },
          create: {
            userId: volUserId,
            assignedCampId: campId,
          },
          update: {
            assignedCampId: campId,
          },
        });
      }
    }

    res.json({
      success: true,
      message: 'Staff successfully assigned to camp',
      data: { campId, doctorCount: doctorIds.length, volunteerCount: volunteerIds.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/analytics
 * Aggregated analytics without revealing individual PII
 */
export const getCampAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const camps = await prisma.camp.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        capacity: true,
        registered: true,
        status: true,
        services: true,
        _count: {
          select: {
            appointments: true,
            medicalReports: true,
          },
        },
      },
    });

    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    // Service utilization aggregation
    const serviceDistribution: Record<string, number> = {};
    camps.forEach((c) => {
      c.services.forEach((s) => {
        serviceDistribution[s] = (serviceDistribution[s] || 0) + c.registered;
      });
    });

    res.json({
      success: true,
      message: 'Aggregated analytics generated',
      data: {
        campPerformance: camps.map((c) => ({
          name: c.name,
          location: c.location,
          capacity: c.capacity,
          registered: c.registered,
          utilizationRate: c.capacity > 0 ? Math.round((c.registered / c.capacity) * 100) : 0,
        })),
        appointmentsByStatus,
        serviceDistribution: Object.entries(serviceDistribution).map(([service, count]) => ({
          service,
          count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
