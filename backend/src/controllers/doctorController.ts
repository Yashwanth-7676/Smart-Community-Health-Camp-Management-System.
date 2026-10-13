import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AppointmentStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildPaginationMeta } from '../utils/helpers';
import { CreateReportDto, ListQueryParams } from '../types';

const prisma = new PrismaClient();

/**
 * GET /api/v1/doctors/dashboard
 * Get doctor dashboard statistics
 */
export const getDoctorDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctorId = req.user!.userId;

    const [
      todayAppointments,
      pendingAppointments,
      completedToday,
      totalPatients,
      assignedCamps,
      recentReports,
    ] = await Promise.all([
      prisma.appointment.count({
        where: {
          doctorId,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: { notIn: [AppointmentStatus.CANCELLED] },
        },
      }),
      prisma.appointment.count({
        where: { doctorId, status: AppointmentStatus.PENDING },
      }),
      prisma.appointment.count({
        where: {
          doctorId,
          status: AppointmentStatus.COMPLETED,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.appointment.groupBy({
        by: ['patientId'],
        where: { doctorId },
      }).then((groups) => groups.length),
      prisma.doctorProfile.findUnique({
        where: { userId: doctorId },
        include: {
          assignedCamps: {
            select: { id: true, name: true, location: true, status: true, startDate: true, endDate: true, registered: true, capacity: true },
          },
        },
      }),
      prisma.medicalReport.findMany({
        where: { doctorId },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          camp: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    res.json({
      success: true,
      message: 'Doctor dashboard data retrieved',
      data: {
        stats: {
          todayAppointments,
          pendingAppointments,
          completedToday,
          totalPatients,
        },
        assignedCamps: assignedCamps?.assignedCamps || [],
        recentReports,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/doctors/patients
 * Get all patients seen by this doctor
 */
export const getDoctorPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctorId = req.user!.userId;
    const { page = '1', limit = '10', search } = req.query as ListQueryParams;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    // Get unique patient IDs from appointments
    const patientIds = await prisma.appointment.findMany({
      where: { doctorId },
      select: { patientId: true },
      distinct: ['patientId'],
    });

    const ids = patientIds.map((a) => a.patientId);

    const where: Record<string, unknown> = {
      id: { in: ids },
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          patientProfile: true,
          _count: { select: { appointmentsAsPatient: true, medicalReportsAsPatient: true } },
        },
        orderBy: { firstName: 'asc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Doctor patients retrieved',
      data: patients,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/doctors/report
 * Create a new medical report for a patient
 */
export const createMedicalReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctorId = req.user!.userId;
    const { patientId, campId, diagnosis, prescription, observations, referral, isConfidential } = req.body as CreateReportDto;

    // Verify patient exists
    const patient = await prisma.user.findUnique({ where: { id: patientId, role: 'PATIENT' } });
    if (!patient) {
      throw new AppError('Patient not found', 404, 'NOT_FOUND');
    }

    // Verify camp exists
    const camp = await prisma.camp.findUnique({ where: { id: campId } });
    if (!camp) {
      throw new AppError('Camp not found', 404, 'NOT_FOUND');
    }

    const report = await prisma.medicalReport.create({
      data: {
        patientId,
        doctorId,
        campId,
        diagnosis,
        prescription,
        observations,
        referral,
        isConfidential: isConfidential || false,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true } },
        camp: { select: { id: true, name: true, location: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Notify patient about new report (unless confidential)
    if (!isConfidential) {
      await prisma.notification.create({
        data: {
          userId: patientId,
          title: 'New Medical Report',
          message: `Your medical report from ${camp.name} has been added by Dr. ${req.user!.firstName} ${req.user!.lastName}`,
          type: 'INFO',
        },
      });
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
 * GET /api/v1/doctors/reports
 * Get all reports created by this doctor
 */
export const getDoctorReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctorId = req.user!.userId;
    const { page = '1', limit = '10' } = req.query as ListQueryParams;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const [reports, total] = await Promise.all([
      prisma.medicalReport.findMany({
        where: { doctorId },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, email: true } },
          camp: { select: { id: true, name: true, location: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.medicalReport.count({ where: { doctorId } }),
    ]);

    res.json({
      success: true,
      message: 'Doctor reports retrieved',
      data: reports,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/doctors/appointments
 * Get appointments assigned to this doctor
 */
export const getDoctorAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctorId = req.user!.userId;
    const { page = '1', limit = '10', status } = req.query as ListQueryParams;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const where: Record<string, unknown> = { doctorId };
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, patientProfile: true } },
          camp: { select: { id: true, name: true, location: true } },
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
      message: 'Doctor appointments retrieved',
      data: appointments,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/doctors/appointment/:id
 * Update appointment status by doctor (complete/confirm)
 */
export const updateAppointmentByDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const doctorId = req.user!.userId;

    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    if (appointment.doctorId !== doctorId) {
      throw new AppError('This appointment is not assigned to you', 403, 'FORBIDDEN');
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: status || appointment.status,
        notes: notes !== undefined ? notes : appointment.notes,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        camp: { select: { id: true, name: true } },
        queueTokenRef: true,
      },
    });

    // Update queue token if appointment is completed
    if (status === AppointmentStatus.COMPLETED) {
      await prisma.queueToken.updateMany({
        where: { appointmentId: id },
        data: { status: 'COMPLETED' },
      });
    }

    res.json({
      success: true,
      message: 'Appointment updated by doctor',
      data: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};
