import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AppointmentStatus, CampStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildPaginationMeta, generateQueueToken, generateTimeSlots } from '../utils/helpers';
import { CreateAppointmentDto, UpdateAppointmentDto, ListQueryParams } from '../types';
import { DEMO_APPOINTMENTS, isDbConnectionError } from '../utils/mockStore';

const prisma = new PrismaClient();

/**
 * GET /api/v1/appointments
 * Get all appointments (admin) or user's own appointments
 */
export const getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '10', status, campId } = req.query as ListQueryParams;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const where: Record<string, unknown> = {};

    // Non-admin users only see their own appointments
    if (req.user!.role === 'PATIENT') {
      where.patientId = req.user!.userId;
    } else if (req.user!.role === 'DOCTOR') {
      where.doctorId = req.user!.userId;
    }

    if (status) where.status = status;
    if (campId) where.campId = campId;

    let appointments: any[];
    let total: number;

    try {
      [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          include: {
            patient: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            },
            doctor: {
              select: { id: true, firstName: true, lastName: true },
            },
            camp: {
              select: { id: true, name: true, location: true, address: true, status: true },
            },
            queueTokenRef: true,
          },
          orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
          skip,
          take,
        }),
        prisma.appointment.count({ where }),
      ]);
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        let filtered = [...DEMO_APPOINTMENTS];
        if (req.user!.role === 'PATIENT') {
          filtered = filtered.filter((a) => a.patientId === req.user!.userId || a.patient.email === req.user!.email);
        } else if (req.user!.role === 'DOCTOR') {
          filtered = filtered.filter((a) => a.doctorId === req.user!.userId);
        }
        if (campId) filtered = filtered.filter((a) => a.campId === campId);
        total = filtered.length;
        appointments = filtered.slice(skip, skip + take);
      } else {
        throw dbErr;
      }
    }

    res.json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: appointments,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/appointments
 * Book a new appointment with capacity check and queue token generation
 * Uses Prisma transaction to prevent double-booking
 */
export const createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId, campId, doctorId, date, timeSlot, notes } = req.body as CreateAppointmentDto;

    const appointmentDate = new Date(date);

    let fullAppointment: any;

    try {
      // Run booking logic in a transaction to prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        // 1. Verify camp exists and is available
        const camp = await tx.camp.findUnique({ where: { id: campId } });
        if (!camp) {
          throw new AppError('Camp not found', 404, 'NOT_FOUND');
        }

        if (camp.status === CampStatus.COMPLETED || camp.status === CampStatus.CANCELLED) {
          throw new AppError('This camp is no longer accepting appointments', 400, 'CAMP_UNAVAILABLE');
        }

        // 2. Check capacity
        if (camp.registered >= camp.capacity) {
          throw new AppError('Camp is at full capacity. No more registrations accepted.', 409, 'CAMP_FULL');
        }

        // 3. Verify patient exists
        const patient = await tx.user.findUnique({ where: { id: patientId } });
        if (!patient) {
          throw new AppError('Patient not found', 404, 'NOT_FOUND');
        }

        // 4. Check for double-booking (same patient, same camp, same date)
        const existingAppointment = await tx.appointment.findUnique({
          where: { patientId_campId_date: { patientId, campId, date: appointmentDate } },
        });

        if (existingAppointment) {
          throw new AppError('Patient already has an appointment at this camp on this date', 409, 'DOUBLE_BOOKING');
        }

        // 5. If doctorId provided, verify doctor exists
        if (doctorId) {
          const doctor = await tx.user.findUnique({ where: { id: doctorId } });
          if (!doctor || doctor.role !== 'DOCTOR') {
            throw new AppError('Invalid doctor ID', 400, 'INVALID_DOCTOR');
          }
        }

        // 6. Generate queue token number based on current appointments for this camp/date
        const existingAppointmentsCount = await tx.appointment.count({
          where: {
            campId,
            date: appointmentDate,
            status: { notIn: [AppointmentStatus.CANCELLED] },
          },
        });

        const tokenNumber = existingAppointmentsCount + 1;
        const queueToken = generateQueueToken(camp.location, tokenNumber);

        // 7. Create appointment
        const appointment = await tx.appointment.create({
          data: {
            patientId,
            campId,
            doctorId: doctorId || null,
            date: appointmentDate,
            timeSlot,
            status: AppointmentStatus.CONFIRMED,
            queueToken,
            notes,
          },
        });

        // 8. Create queue token record
        await tx.queueToken.create({
          data: {
            appointmentId: appointment.id,
            tokenNumber,
            status: 'WAITING',
          },
        });

        // 9. Increment camp registered count
        await tx.camp.update({
          where: { id: campId },
          data: { registered: { increment: 1 } },
        });

        // 10. Create notification for patient
        await tx.notification.create({
          data: {
            userId: patientId,
            title: 'Appointment Confirmed',
            message: `Your appointment at ${camp.name} on ${appointmentDate.toDateString()} at ${timeSlot} is confirmed. Queue Token: ${queueToken}`,
            type: 'SUCCESS',
          },
        });

        return appointment;
      });

      // Fetch full appointment details
      fullAppointment = await prisma.appointment.findUnique({
        where: { id: result.id },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
          camp: { select: { id: true, name: true, location: true, address: true } },
          queueTokenRef: true,
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        // Fallback for demonstration when Postgres is not running
        const tokenNum = DEMO_APPOINTMENTS.length + 1;
        const qToken = `DEMO-${String(tokenNum).padStart(3, '0')}`;
        fullAppointment = {
          id: `appt-${Date.now()}`,
          patientId: patientId || 'user-patient-1',
          campId: campId || 'camp-1',
          doctorId: doctorId || 'user-doctor-1',
          date: appointmentDate,
          timeSlot: timeSlot || '09:00 AM - 10:00 AM',
          status: 'CONFIRMED',
          queueToken: qToken,
          notes: notes || '',
          patient: { id: patientId, firstName: 'Kavitha', lastName: 'Reddy', email: 'patient1@healthcamp.com', phone: '+91-9876543217' },
          doctor: { id: 'user-doctor-1', firstName: 'Priya', lastName: 'Sharma' },
          camp: { id: campId, name: 'Koramangala Community Health Camp', location: 'Koramangala, Bangalore', address: '80 Feet Road' },
          queueTokenRef: { id: `token-${Date.now()}`, tokenNumber: tokenNum, status: 'WAITING' },
        };
        DEMO_APPOINTMENTS.unshift(fullAppointment);
      } else {
        throw dbErr;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: fullAppointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/appointments/:id
 * Get a single appointment by ID
 */
export const getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
        camp: true,
        queueTokenRef: true,
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    // Access control: patients can only view their own appointments
    if (req.user!.role === 'PATIENT' && appointment.patientId !== req.user!.userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    res.json({
      success: true,
      message: 'Appointment retrieved successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/appointments/:id
 * Update appointment status (cancel/confirm)
 */
export const updateAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateAppointmentDto;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { camp: true },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    // Patients can only cancel their own appointments
    if (req.user!.role === 'PATIENT') {
      if (appointment.patientId !== req.user!.userId) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
      }
      if (updates.status && updates.status !== AppointmentStatus.CANCELLED) {
        throw new AppError('Patients can only cancel appointments', 403, 'FORBIDDEN');
      }
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new AppError('Cannot update a completed appointment', 400, 'INVALID_OPERATION');
    }

    const updateData: Record<string, unknown> = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.doctorId) updateData.doctorId = updates.doctorId;
    if (updates.date) updateData.date = new Date(updates.date);
    if (updates.timeSlot) updateData.timeSlot = updates.timeSlot;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    // If cancelling, decrement camp registered count
    await prisma.$transaction(async (tx) => {
      if (updates.status === AppointmentStatus.CANCELLED && appointment.status !== AppointmentStatus.CANCELLED) {
        await tx.camp.update({
          where: { id: appointment.campId },
          data: { registered: { decrement: 1 } },
        });

        // Update queue token status
        if (appointment.queueToken) {
          await tx.queueToken.updateMany({
            where: { appointmentId: id },
            data: { status: 'SKIPPED' },
          });
        }
      }

      await tx.appointment.update({ where: { id }, data: updateData });
    });

    const updatedAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
        camp: { select: { id: true, name: true, location: true } },
        queueTokenRef: true,
      },
    });

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/appointments/patient/:patientId
 * Get all appointments for a specific patient
 */
export const getPatientAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId } = req.params;
    const { page = '1', limit = '10', status } = req.query as ListQueryParams;

    // Access control
    if (req.user!.role === 'PATIENT' && patientId !== req.user!.userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const where: Record<string, unknown> = { patientId };
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: { select: { id: true, firstName: true, lastName: true } },
          camp: { select: { id: true, name: true, location: true, address: true, startDate: true, endDate: true } },
          queueTokenRef: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.appointment.count({ where }),
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
 * GET /api/v1/appointments/camp/:campId/slots
 * Get available time slots for a camp on a specific date
 */
export const getCampSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campId } = req.params;
    const { date } = req.query as { date?: string };

    const camp = await prisma.camp.findUnique({ where: { id: campId } });
    if (!camp) {
      throw new AppError('Camp not found', 404, 'NOT_FOUND');
    }

    const queryDate = date ? new Date(date) : new Date();

    // Get all booked slots for the given date
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        campId,
        date: {
          gte: new Date(queryDate.setHours(0, 0, 0, 0)),
          lt: new Date(queryDate.setHours(23, 59, 59, 999)),
        },
        status: { notIn: [AppointmentStatus.CANCELLED] },
      },
      select: { timeSlot: true },
    });

    const bookedSlots = bookedAppointments.map((a) => a.timeSlot);
    const allSlots = generateTimeSlots(9, 17, 30);

    const slotsWithAvailability = allSlots.map((slot) => ({
      slot,
      isAvailable: !bookedSlots.includes(slot),
      bookedCount: bookedSlots.filter((s) => s === slot).length,
    }));

    res.json({
      success: true,
      message: 'Time slots retrieved',
      data: {
        campId,
        date: date || new Date().toISOString().split('T')[0],
        slots: slotsWithAvailability,
        totalCapacity: camp.capacity,
        totalRegistered: camp.registered,
      },
    });
  } catch (error) {
    next(error);
  }
};
