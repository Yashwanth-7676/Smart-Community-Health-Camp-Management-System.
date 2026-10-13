import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildPaginationMeta, sanitizeUser } from '../utils/helpers';
import { UpdatePatientProfileDto, ListQueryParams } from '../types';

const prisma = new PrismaClient();

/**
 * GET /api/v1/patients
 * Get all patients (Admin/Doctor only)
 */
export const getPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '10', search } = req.query as ListQueryParams;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const where: Record<string, unknown> = { role: 'PATIENT', isActive: true };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          patientProfile: true,
          _count: { select: { appointmentsAsPatient: true, medicalReportsAsPatient: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Patients retrieved successfully',
      data: patients,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/patients/:id
 * Get a single patient by ID
 */
export const getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Patients can only view their own profile
    if (req.user!.role === 'PATIENT' && id !== req.user!.userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const patient = await prisma.user.findUnique({
      where: { id, role: 'PATIENT' },
      include: {
        patientProfile: true,
        _count: {
          select: {
            appointmentsAsPatient: true,
            medicalReportsAsPatient: true,
            followUpsAsPatient: true,
          },
        },
      },
    });

    if (!patient) {
      throw new AppError('Patient not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Patient retrieved successfully',
      data: sanitizeUser(patient),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/patients/:id
 * Update patient profile
 */
export const updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Patients can only update their own profile
    if (req.user!.role === 'PATIENT' && id !== req.user!.userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const patient = await prisma.user.findUnique({ where: { id, role: 'PATIENT' } });
    if (!patient) {
      throw new AppError('Patient not found', 404, 'NOT_FOUND');
    }

    const { firstName, lastName, phone, avatar } = updates;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
      },
      include: { patientProfile: true },
    });

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: sanitizeUser(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/patients/profile
 * Create or update patient medical profile
 */
export const upsertPatientProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      medicalHistory,
      allergies,
      emergencyContact,
    } = req.body as UpdatePatientProfileDto;

    const profile = await prisma.patientProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(gender && { gender }),
        ...(bloodGroup && { bloodGroup }),
        ...(address && { address }),
        ...(medicalHistory && { medicalHistory }),
        ...(allergies && { allergies }),
        ...(emergencyContact && { emergencyContact: emergencyContact as any }),
      },
      update: {
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(gender && { gender }),
        ...(bloodGroup && { bloodGroup }),
        ...(address !== undefined && { address }),
        ...(medicalHistory !== undefined && { medicalHistory }),
        ...(allergies && { allergies }),
        ...(emergencyContact && { emergencyContact: emergencyContact as any }),
      },
    });

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/patients/:id/appointments
 * Get all appointments for a patient
 */
export const getPatientAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query as ListQueryParams;

    if (req.user!.role === 'PATIENT' && id !== req.user!.userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId: id },
        include: {
          camp: { select: { id: true, name: true, location: true, address: true, status: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
          queueTokenRef: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.appointment.count({ where: { patientId: id } }),
    ]);

    res.json({
      success: true,
      message: 'Patient appointments retrieved',
      data: appointments,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/patients/:id/reports
 * Get medical reports for a patient
 */
export const getPatientReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query as ListQueryParams;

    // Patients can only view their own non-confidential reports
    if (req.user!.role === 'PATIENT' && id !== req.user!.userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const where: Record<string, unknown> = { patientId: id };

    // Patients cannot see confidential reports
    if (req.user!.role === 'PATIENT') {
      where.isConfidential = false;
    }

    const [reports, total] = await Promise.all([
      prisma.medicalReport.findMany({
        where,
        include: {
          doctor: { select: { id: true, firstName: true, lastName: true } },
          camp: { select: { id: true, name: true, location: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.medicalReport.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Patient medical reports retrieved',
      data: reports,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};
