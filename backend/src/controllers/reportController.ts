import { Request, Response, NextFunction } from 'express';
import { AuditAction, PrismaClient, ReportStatus, Role } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { isDbConnectionError } from '../utils/mockStore';
import { logAudit } from '../middleware/auditLog';

const prisma = new PrismaClient();

const DEMO_REPORTS: any[] = [
  {
    id: 'rep-001',
    patientId: 'user-patient-1',
    doctorId: 'user-doctor-1',
    campId: 'camp-1',
    diagnosis: 'Mild seasonal rhinitis, healthy vitals',
    prescription: 'Cetirizine 10mg once daily for 3 days',
    observations: 'BP: 120/80, SpO2: 99%, Pulse: 72',
    isConfidential: true,
    status: ReportStatus.DRAFT,
    createdAt: new Date(),
    patient: { id: 'user-patient-1', firstName: 'Kavitha', lastName: 'Reddy', email: 'patient1@healthcamp.com' },
    doctor: { id: 'user-doctor-1', firstName: 'Priya', lastName: 'Sharma' },
    camp: { id: 'camp-1', name: 'Koramangala Community Health Camp', location: 'Koramangala, Bangalore' },
  },
];

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

    let report: any;
    try {
      report = await prisma.medicalReport.findUnique({
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
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        report = DEMO_REPORTS.find((r) => r.id === id);
      } else {
        throw dbErr;
      }
    }

    if (!report) {
      throw new AppError('Medical report not found', 404);
    }

    // Role checking
    const isOwner = report.patientId === user.userId;
    const isTreatingDoctor = report.doctorId === user.userId;
    const isAdmin = user.role?.toUpperCase() === 'ADMIN';

    if (user.role === Role.PATIENT && (report.isConfidential || report.status !== ReportStatus.PUBLISHED)) {
      throw new AppError('Medical report not found', 404, 'NOT_FOUND');
    }

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

    let report: any;
    try {
      report = await prisma.medicalReport.create({
        data: {
          patientId,
          doctorId: doctorUserId,
          campId,
          diagnosis,
          prescription: prescription || null,
          observations: observations || null,
          referral: referral || null,
          isConfidential: isConfidential || false,
          status: ReportStatus.DRAFT,
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
      await logAudit(
        doctorUserId,
        AuditAction.CREATE,
        'MEDICAL_REPORT',
        report.id,
        { status: ReportStatus.DRAFT, isConfidential: report.isConfidential },
        req.ip,
        req.get('user-agent'),
      );
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        report = {
          id: `rep-${Date.now()}`,
          patientId,
          doctorId: doctorUserId,
          campId,
          diagnosis,
          prescription: prescription || null,
          observations: observations || null,
          referral: referral || null,
          isConfidential: isConfidential || false,
          status: 'AUTHORIZED',
          patient: { firstName: 'Kavitha', lastName: 'Reddy' },
          doctor: { firstName: 'Priya', lastName: 'Sharma' },
          camp: { name: 'Koramangala Community Health Camp', location: 'Koramangala, Bangalore' },
          createdAt: new Date(),
        };
        DEMO_REPORTS.unshift(report);
      } else {
        throw dbErr;
      }
    }

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
 * PATCH /api/v1/reports/:id/publish
 * Finalize a doctor's draft so it can be shared with its patient.
 */
export const publishReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctorId = req.user?.userId;
    if (!doctorId) {
      throw new AppError('Unauthorized', 401);
    }

    const published = await prisma.$transaction(async (transaction) => {
      const report = await transaction.medicalReport.findUnique({
        where: { id: req.params.id },
        select: { id: true, doctorId: true, status: true, isConfidential: true },
      });

      if (!report) {
        throw new AppError('Medical report not found', 404, 'NOT_FOUND');
      }
      if (report.doctorId !== doctorId) {
        throw new AppError('You can only finalize reports you authored', 403, 'FORBIDDEN');
      }
      if (report.status !== ReportStatus.DRAFT) {
        throw new AppError('Only draft reports can be finalized', 409, 'REPORT_NOT_DRAFT');
      }

      const result = await transaction.medicalReport.updateMany({
        where: { id: report.id, doctorId, status: ReportStatus.DRAFT },
        data: { status: ReportStatus.PUBLISHED },
      });
      if (result.count !== 1) {
        throw new AppError('This report has already been finalized', 409, 'REPORT_NOT_DRAFT');
      }

      const updatedReport = await transaction.medicalReport.findUniqueOrThrow({
        where: { id: report.id },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
          camp: { select: { id: true, name: true } },
        },
      });

      if (!updatedReport.isConfidential) {
        await transaction.notification.create({
          data: {
            userId: updatedReport.patientId,
            title: 'New medical report',
            message: `A medical report from ${updatedReport.camp.name} is available in your health timeline.`,
            type: 'INFO',
          },
        });
      }

      return updatedReport;
    });

    await logAudit(
      doctorId,
      AuditAction.UPDATE,
      'MEDICAL_REPORT',
      published.id,
      { status: ReportStatus.PUBLISHED, isConfidential: published.isConfidential },
      req.ip,
      req.get('user-agent'),
    );

    res.json({
      success: true,
      message: published.isConfidential
        ? 'Confidential medical report finalized'
        : 'Medical report finalized and shared with the patient',
      data: published,
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

    let reports: any[] = [];
    try {
      const where: Record<string, unknown> = { patientId: id };
      // A doctor may access only reports they authored. Broader patient access
      // must happen through an explicit, auditable share-pass workflow.
      if (user.role === Role.DOCTOR) {
        where.doctorId = user.userId;
      } else if (user.role === Role.PATIENT) {
        where.isConfidential = false;
        where.status = ReportStatus.PUBLISHED;
      }

      reports = await prisma.medicalReport.findMany({
        where,
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
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        reports = DEMO_REPORTS.filter((r) => r.patientId === id && (user.role !== Role.DOCTOR || r.doctorId === user.userId));
      } else {
        throw dbErr;
      }
    }

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
 * GET /api/v1/reports
 * Scoped medical reports listing:
 * - PATIENT: only their own reports
 * - DOCTOR: authored reports
 * - ADMIN: all clinical reports
 */
export const getAllReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    let reports: any[] = [];
    try {
      const where: Record<string, any> = {};
      if (user.role === Role.PATIENT) {
        where.patientId = user.userId;
        where.isConfidential = false;
        where.status = ReportStatus.PUBLISHED;
      } else if (user.role === Role.DOCTOR) {
        where.doctorId = user.userId;
      }

      reports = await prisma.medicalReport.findMany({
        where,
        include: {
          doctor: { select: { id: true, firstName: true, lastName: true } },
          patient: { select: { id: true, firstName: true, lastName: true } },
          camp: { select: { id: true, name: true, location: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        reports = DEMO_REPORTS.filter((r) => {
          if (user.role === 'PATIENT') return r.patientId === user.userId;
          if (user.role === 'DOCTOR') return r.doctorId === user.userId;
          return true;
        });
      } else {
        throw dbErr;
      }
    }

    res.json({
      success: true,
      message: 'Medical reports retrieved successfully',
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

    let report: any;
    try {
      report = await prisma.medicalReport.findUnique({
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
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        report = DEMO_REPORTS.find((r) => r.id === id);
      } else {
        throw dbErr;
      }
    }

    if (!report) {
      throw new AppError('Medical report not found', 404);
    }

    const isOwner = report.patientId === user?.userId;
    const isTreatingDoctor = report.doctorId === user?.userId;
    const isAdmin = user?.role === Role.ADMIN;

    if (user?.role === Role.PATIENT && (report.isConfidential || report.status !== ReportStatus.PUBLISHED)) {
      throw new AppError('Medical report not found', 404, 'NOT_FOUND');
    }

    if (!isOwner && !isTreatingDoctor && !isAdmin) {
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
