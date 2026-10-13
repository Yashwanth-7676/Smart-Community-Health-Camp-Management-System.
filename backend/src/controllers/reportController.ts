import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

/**
 * GET /api/v1/reports/:id
 * Retrieve a medical report with role-based access control
 */
export const getReportById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    const report = await prisma.medicalReport.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            patientProfile: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            doctorProfile: true,
          },
        },
        camp: true,
      },
    });

    if (!report) {
      throw new AppError('Medical report not found', 404);
    }

    // Role checking
    const isOwner = report.patientId === user.userId;
    const isTreatingDoctor = report.doctorId === user.userId;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwner && !isTreatingDoctor && !isAdmin) {
      throw new AppError('You do not have permission to view this medical report', 403);
    }

    res.json({
      success: true,
      message: 'Report retrieved successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/reports
 * Create a new medical report (Doctor only)
 */
export const createReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctorUserId = req.user?.userId;
    const { patientId, campId, diagnosis, prescription, observations, referral, isConfidential } = req.body;

    if (!doctorUserId) {
      throw new AppError('Unauthorized', 401);
    }

    if (!patientId || !campId || !diagnosis) {
      throw new AppError('Patient ID, Camp ID, and diagnosis are required', 400);
    }

    const report = await prisma.medicalReport.create({
      data: {
        patientId,
        doctorId: doctorUserId,
        campId,
        diagnosis,
        prescription: prescription || null,
        observations: observations || null,
        referral: referral || null,
        isConfidential: isConfidential || false,
      },
      include: {
        patient: {
          select: { firstName: true, lastName: true },
        },
        doctor: {
          select: { firstName: true, lastName: true },
        },
        camp: {
          select: { name: true, location: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Medical report created successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports/patient/:id
 * Retrieve all medical reports for a patient
 */
export const getReportsByPatientId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    // Patients can only view their own reports
    if (user.role === Role.PATIENT && user.userId !== id) {
      throw new AppError('Access denied', 403);
    }

    const reports = await prisma.medicalReport.findMany({
      where: { patientId: id },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            doctorProfile: true,
          },
        },
        camp: {
          select: { id: true, name: true, location: true, startDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      message: 'Patient reports retrieved',
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports/print/:id
 * Printable report details format
 */
export const getPrintableReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    const report = await prisma.medicalReport.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            patientProfile: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            doctorProfile: true,
          },
        },
        camp: true,
      },
    });

    if (!report) {
      throw new AppError('Medical report not found', 404);
    }

    if (user?.role === Role.PATIENT && user.userId !== report.patientId) {
      throw new AppError('Unauthorized', 403);
    }

    res.json({
      success: true,
      message: 'Printable report format retrieved',
      data: {
        ...report,
        printedAt: new Date().toISOString(),
        institution: 'Smart Community Health Camp Network',
      },
    });
  } catch (error) {
    next(error);
  }
};
