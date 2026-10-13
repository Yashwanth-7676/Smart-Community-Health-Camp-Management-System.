import { Request, Response, NextFunction } from 'express';
import { PrismaClient, QueueStatus, AppointmentStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler';
import { generateQueueToken } from '../utils/helpers';

const prisma = new PrismaClient();

/**
 * GET /api/v1/volunteers/dashboard
 * Volunteer dashboard summary
 */
export const getVolunteerDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { userId },
      include: {
        assignedCamp: {
          include: {
            appointments: {
              where: {
                date: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lte: new Date(new Date().setHours(23, 59, 59, 999)),
                },
              },
              include: {
                queueTokenRef: true,
                patient: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const activeCamp = volunteerProfile?.assignedCamp;
    const todayAppointments = activeCamp?.appointments || [];
    const waitingCount = todayAppointments.filter(
      (a) => a.queueTokenRef?.status === QueueStatus.WAITING
    ).length;
    const calledCount = todayAppointments.filter(
      (a) => a.queueTokenRef?.status === QueueStatus.CALLED
    ).length;
    const completedCount = todayAppointments.filter(
      (a) => a.queueTokenRef?.status === QueueStatus.COMPLETED || a.status === AppointmentStatus.COMPLETED
    ).length;

    res.json({
      success: true,
      message: 'Volunteer dashboard fetched successfully',
      data: {
        volunteer: volunteerProfile,
        assignedCamp: activeCamp,
        queueSummary: {
          totalToday: todayAppointments.length,
          waiting: waitingCount,
          called: calledCount,
          completed: completedCount,
        },
        recentQueue: todayAppointments.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/volunteers/register-patient
 * On-site patient registration and appointment creation
 */
export const registerPatientByVolunteer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, phone, email, dateOfBirth, gender, campId, timeSlot, medicalHistory } = req.body;

    if (!firstName || !lastName || !campId) {
      throw new AppError('First name, last name, and camp ID are required', 400);
    }

    const camp = await prisma.camp.findUnique({ where: { id: campId } });
    if (!camp) {
      throw new AppError('Camp not found', 404);
    }

    const userEmail = email || `patient_${Date.now()}_${Math.floor(Math.random() * 1000)}@healthcamp.local`;
    const defaultPassword = await bcrypt.hash('Patient@123', 10);

    const result = await prisma.$transaction(async (tx) => {
      // Find or create patient user
      let user = await tx.user.findFirst({
        where: {
          OR: [
            { email: userEmail },
            phone ? { phone } : { email: userEmail },
          ],
        },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: userEmail,
            password: defaultPassword,
            firstName,
            lastName,
            phone: phone || null,
            role: Role.PATIENT,
            patientProfile: {
              create: {
                gender: gender || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                medicalHistory: medicalHistory || null,
              },
            },
          },
        });
      }

      // Check slot & capacity
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingAppointment = await tx.appointment.findFirst({
        where: {
          patientId: user.id,
          campId,
          date: { gte: today },
        },
      });

      if (existingAppointment) {
        throw new AppError('Patient already has an active appointment for this camp today', 400);
      }

      const totalBooked = await tx.appointment.count({
        where: { campId, date: { gte: today } },
      });

      const tokenNumber = totalBooked + 1;
      const queueTokenStr = generateQueueToken(camp.location, tokenNumber);

      const appointment = await tx.appointment.create({
        data: {
          patientId: user.id,
          campId,
          date: new Date(),
          timeSlot: timeSlot || '09:00 - 10:00',
          status: AppointmentStatus.CONFIRMED,
          queueToken: queueTokenStr,
          queueTokenRef: {
            create: {
              tokenNumber,
              status: QueueStatus.WAITING,
            },
          },
        },
        include: {
          queueTokenRef: true,
          patient: true,
          camp: true,
        },
      });

      await tx.camp.update({
        where: { id: campId },
        data: { registered: { increment: 1 } },
      });

      return { user, appointment };
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered and queued successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/volunteers/queue/:campId
 * Get current camp queue list
 */
export const getCampQueue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        campId,
        date: { gte: today },
      },
      include: {
        queueTokenRef: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            patientProfile: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({
      success: true,
      message: 'Queue retrieved successfully',
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/volunteers/queue/:tokenId
 * Update queue token status (WAITING, CALLED, COMPLETED, SKIPPED)
 */
export const updateQueueTokenStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tokenId } = req.params;
    const { status } = req.body;

    if (!Object.values(QueueStatus).includes(status)) {
      throw new AppError('Invalid queue status', 400);
    }

    const updated = await prisma.queueToken.update({
      where: { id: tokenId },
      data: { status },
      include: {
        appointment: {
          include: {
            patient: true,
            camp: true,
          },
        },
      },
    });

    if (status === QueueStatus.COMPLETED) {
      await prisma.appointment.update({
        where: { id: updated.appointmentId },
        data: { status: AppointmentStatus.COMPLETED },
      });
    }

    res.json({
      success: true,
      message: 'Queue token status updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/volunteers/attendance
 * Mark volunteer attendance
 */
export const markAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { campId, date, status } = req.body;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const profile = await prisma.volunteerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError('Volunteer profile not found', 404);
    }

    const record = {
      campId: campId || profile.assignedCampId,
      date: date || new Date().toISOString(),
      status: status || 'PRESENT',
      markedAt: new Date().toISOString(),
    };

    const updated = await prisma.volunteerProfile.update({
      where: { userId },
      data: {
        attendance: {
          push: record,
        },
      },
    });

    res.json({
      success: true,
      message: 'Attendance recorded successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
